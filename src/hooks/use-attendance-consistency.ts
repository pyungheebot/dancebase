"use client";

import useSWR from "swr";
import { subDays, format, startOfWeek, parseISO, isValid } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AttendanceConsistencyResult,
  AttendanceHeatmapCell,
  AttendanceIntensity,
  WeeklyAttendanceData,
} from "@/types";

/**
 * 출석률을 강도 레벨로 변환
 * 0: 일정 없음
 * 1: 낮음 (1~50%)
 * 2: 중간 (50~80%)
 * 3: 높음 (80%+)
 */
function rateToIntensity(hasSchedule: boolean, isPresent: boolean): AttendanceIntensity {
  if (!hasSchedule) return 0;
  if (!isPresent) return 1;
  return 3;
}

/**
 * 주별 출석률 배열의 표준편차 계산
 * 일정이 있는 주만 포함
 */
function calcStdDev(rates: number[]): number {
  if (rates.length === 0) return 0;
  const mean = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  const variance = rates.reduce((sum, r) => sum + (r - mean) ** 2, 0) / rates.length;
  return Math.sqrt(variance);
}

/**
 * 표준편차를 0~100 일관성 점수로 변환
 * 표준편차 0 → 100점, 표준편차 50 → 0점 (선형 보간)
 */
function stdDevToConsistencyScore(stdDev: number, hasData: boolean): number {
  if (!hasData) return 0;
  const MAX_STD_DEV = 50;
  return Math.max(0, Math.round(100 - (stdDev / MAX_STD_DEV) * 100));
}

export function useAttendanceConsistency(
  groupId: string,
  userId: string
): AttendanceConsistencyResult {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId ? swrKeys.attendanceConsistency(groupId, userId) : null,
    async () => {
      const supabase = createClient();

      // 최근 84일 범위 계산 (12주)
      const now = new Date();
      const rangeEnd = now;
      const rangeStart = subDays(now, 83); // 오늘 포함 84일

      const rangeStartISO = rangeStart.toISOString();
      const rangeEndISO = rangeEnd.toISOString();

      // 해당 기간의 그룹 일정 조회 (attendance_method != none)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", rangeStartISO)
        .lte("starts_at", rangeEndISO)
        .order("starts_at", { ascending: true });

      if (schedErr) throw schedErr;

      const schedules = scheduleRows ?? [];
      const scheduleIds = schedules.map((s: { id: string }) => s.id);

      // schedule_id → 날짜(YYYY-MM-DD) 맵
      const scheduleDateMap = new Map<string, string>();
      for (const s of schedules) {
        const d = parseISO(s.starts_at);
        if (isValid(d)) {
          scheduleDateMap.set(s.id, format(d, "yyyy-MM-dd"));
        }
      }

      // 날짜 → schedule_id 셋 맵 (같은 날 여러 일정 가능)
      const dateScheduleMap = new Map<string, string[]>();
      for (const [id, date] of scheduleDateMap.entries()) {
        const existing = dateScheduleMap.get(date) ?? [];
        existing.push(id);
        dateScheduleMap.set(date, existing);
      }

      // 출석 기록 조회
      const attendanceMap = new Map<string, string>();
      if (scheduleIds.length > 0) {
        const { data: attRows, error: attErr } = await supabase
          .from("attendance")
          .select("schedule_id, status")
          .eq("user_id", userId)
          .in("schedule_id", scheduleIds);

        if (attErr) throw attErr;

        for (const row of attRows ?? []) {
          attendanceMap.set(row.schedule_id, row.status);
        }
      }

      // 84일치 날짜 배열 생성 (가장 오래된 날 → 오늘)
      const allDates: string[] = [];
      for (let i = 83; i >= 0; i--) {
        allDates.push(format(subDays(now, i), "yyyy-MM-dd"));
      }

      // 12주 x 7일 그리드 생성
      // 첫 번째 날(rangeStart)의 요일에 맞춰 주 시작 정렬
      // 월요일 기준(locale ko)
      const firstDayOfGrid = startOfWeek(rangeStart, { weekStartsOn: 1 });
      const gridStartDate = format(firstDayOfGrid, "yyyy-MM-dd");

      // 그리드 날짜 배열: 첫 주 시작(월요일)부터 84칸
      const gridDates: string[] = [];
      const gridStart = parseISO(gridStartDate);
      for (let i = 0; i < 84; i++) {
        gridDates.push(format(subDays(new Date(gridStart.getTime() - 0), -i), "yyyy-MM-dd"));
      }

      // 히트맵 셀 생성
      const cells: AttendanceHeatmapCell[] = gridDates.map((date) => {
        const schedIds = dateScheduleMap.get(date) ?? [];
        if (schedIds.length === 0) {
          return { date, hasSchedule: false, isPresent: false, intensity: 0 };
        }
        // 해당 날짜의 일정 중 하나라도 present면 출석으로 처리
        const isPresent = schedIds.some(
          (id) => attendanceMap.get(id) === "present"
        );
        const intensity = rateToIntensity(true, isPresent);
        return { date, hasSchedule: true, isPresent, intensity };
      });

      // 12주 x 7일 2차원 배열로 변환
      const weeks: AttendanceHeatmapCell[][] = [];
      for (let w = 0; w < 12; w++) {
        weeks.push(cells.slice(w * 7, w * 7 + 7));
      }

      // 주별 출석 집계
      const weeklyData: WeeklyAttendanceData[] = weeks.map((week, wi) => {
        const scheduleDays = week.filter((c) => c.hasSchedule);
        const scheduleCount = scheduleDays.length;
        const presentCount = scheduleDays.filter((c) => c.isPresent).length;
        const attendanceRate =
          scheduleCount > 0 ? Math.round((presentCount / scheduleCount) * 100) : 0;
        return { weekIndex: wi, scheduleCount, presentCount, attendanceRate };
      });

      // 전체 출석률 계산
      const totalScheduleDays = weeklyData.reduce((sum, w) => sum + w.scheduleCount, 0);
      const totalPresentDays = weeklyData.reduce((sum, w) => sum + w.presentCount, 0);
      const overallRate =
        totalScheduleDays > 0
          ? Math.round((totalPresentDays / totalScheduleDays) * 100)
          : 0;

      // 일관성 점수: 일정이 있는 주들의 출석률 표준편차 기반
      const weeksWithSchedules = weeklyData
        .filter((w) => w.scheduleCount > 0)
        .map((w) => w.attendanceRate);
      const stdDev = calcStdDev(weeksWithSchedules);
      const consistencyScore = stdDevToConsistencyScore(stdDev, weeksWithSchedules.length > 0);

      // 연속 출석 계산: 최근 일정부터 역순으로 연속 present 일수
      // 일정이 있는 날 기준으로 계산
      const scheduledDays = cells.filter((c) => c.hasSchedule);
      let currentStreak = 0;
      for (let i = scheduledDays.length - 1; i >= 0; i--) {
        if (scheduledDays[i].isPresent) {
          currentStreak++;
        } else {
          break;
        }
      }

      return { weeks, weeklyData, currentStreak, overallRate, consistencyScore };
    }
  );

  return {
    weeks: data?.weeks ?? Array.from({ length: 12 }, () =>
      Array.from({ length: 7 }, (_, di) => ({
        date: format(subDays(new Date(), 83 - di), "yyyy-MM-dd"),
        hasSchedule: false,
        isPresent: false,
        intensity: 0 as AttendanceIntensity,
      }))
    ),
    weeklyData: data?.weeklyData ?? [],
    currentStreak: data?.currentStreak ?? 0,
    overallRate: data?.overallRate ?? 0,
    consistencyScore: data?.consistencyScore ?? 0,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
