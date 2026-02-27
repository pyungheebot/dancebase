"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { Schedule } from "@/types";

export type DayCell = {
  /** YYYY-MM-DD 형식 */
  date: string;
  /** 해당 날짜의 일정 수 (0이면 해당 연도 외부 패딩) */
  count: number;
  /** 해당 연도 범위 내 실제 날짜인지 여부 */
  inYear: boolean;
  /** 일정 목록 */
  schedules: Schedule[];
};

export type WeekColumn = DayCell[];

export type MonthLabel = {
  /** 월 이름 (1월 ~ 12월) */
  label: string;
  /** 해당 월이 시작하는 주(column) 인덱스 */
  weekIndex: number;
};

export type YearlyScheduleData = {
  /** 52~53주 x 7일 그리드 (열 = 주, 행 = 요일 일~토) */
  weeks: WeekColumn[];
  /** 상단 월 라벨 */
  monthLabels: MonthLabel[];
  /** 날짜별 일정 수 집계 */
  countByDate: Record<string, number>;
  /** 날짜별 일정 목록 */
  schedulesByDate: Record<string, Schedule[]>;
  /** 전체 일정 수 */
  totalCount: number;
};

/** 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 타임존 기준) */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** starts_at ISO 문자열에서 로컬 날짜 키 추출 */
function scheduleToDateKey(startsAt: string): string {
  return toDateKey(new Date(startsAt));
}

function buildGridData(
  year: number,
  schedules: Schedule[]
): YearlyScheduleData {
  // 날짜별 집계
  const countByDate: Record<string, number> = {};
  const schedulesByDate: Record<string, Schedule[]> = {};

  for (const schedule of schedules) {
    const key = scheduleToDateKey(schedule.starts_at);
    countByDate[key] = (countByDate[key] ?? 0) + 1;
    if (!schedulesByDate[key]) schedulesByDate[key] = [];
    schedulesByDate[key].push(schedule);
  }

  // 연도의 첫째 날 ~ 마지막 날
  const yearStart = new Date(year, 0, 1); // 1월 1일
  const yearEnd = new Date(year, 11, 31); // 12월 31일

  // 그리드 시작: yearStart의 일요일 (일=0)
  const gridStart = new Date(yearStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // 해당 주 일요일

  // 그리드 끝: yearEnd의 토요일
  const gridEnd = new Date(yearEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay())); // 해당 주 토요일

  // 전체 주 목록 구성
  const weeks: WeekColumn[] = [];
  const current = new Date(gridStart);

  while (current <= gridEnd) {
    const week: WeekColumn = [];
    for (let dow = 0; dow < 7; dow++) {
      const dateKey = toDateKey(current);
      const inYear =
        current.getFullYear() === year;
      week.push({
        date: dateKey,
        count: inYear ? (countByDate[dateKey] ?? 0) : 0,
        inYear,
        schedules: inYear ? (schedulesByDate[dateKey] ?? []) : [],
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  // 월 라벨 계산: 각 월의 첫 날이 속하는 주 인덱스
  const monthLabels: MonthLabel[] = [];
  const MONTH_NAMES = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];

  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const firstDayKey = toDateKey(firstDay);

    // 해당 날짜가 몇 번째 주에 있는지 찾기
    const weekIndex = weeks.findIndex((week) =>
      week.some((cell) => cell.date === firstDayKey)
    );

    if (weekIndex !== -1) {
      // 같은 weekIndex가 이미 있으면 추가하지 않음 (1월 1일이 전년도 주에 포함될 때)
      const alreadyExists = monthLabels.some((ml) => ml.weekIndex === weekIndex);
      if (!alreadyExists) {
        monthLabels.push({ label: MONTH_NAMES[m], weekIndex });
      }
    }
  }

  return {
    weeks,
    monthLabels,
    countByDate,
    schedulesByDate,
    totalCount: schedules.length,
  };
}

export function useYearlySchedules(groupId: string, year: number) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.yearlySchedules(groupId, year),
    async () => {
      const supabase = createClient();

      const yearStart = new Date(year, 0, 1).toISOString();
      const yearEnd = new Date(year + 1, 0, 1).toISOString();

      const { data: rows, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("group_id", groupId)
        .gte("starts_at", yearStart)
        .lt("starts_at", yearEnd)
        .order("starts_at", { ascending: true });

      if (error) throw error;

      const schedules = (rows ?? []) as Schedule[];
      return buildGridData(year, schedules);
    }
  );

  return {
    data: data ?? buildGridData(year, []),
    loading: isLoading,
    refetch: () => mutate(),
  };
}
