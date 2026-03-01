"use client";

import useSWR from "swr";
import { subMonths, getDay, getHours } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { AttendanceStatus } from "@/types";

// 최소 데이터 기준: 3개 미만이면 추천하지 않음
const MIN_DATA_COUNT = 3;

export type TimeSlot = "오전" | "오후" | "저녁";

export type DayOfWeek = "월" | "화" | "수" | "목" | "금" | "토" | "일";

export type DayAttendanceRate = {
  day: DayOfWeek;
  rate: number;
  count: number;
};

export type TimeSlotAttendanceRate = {
  slot: TimeSlot;
  rate: number;
  count: number;
};

export type OptimalScheduleTimeResult = {
  // 추천 요일 + 시간대 조합
  bestDay: DayOfWeek;
  bestSlot: TimeSlot;
  bestRate: number;
  // 요일별 통계 (월~일 순서)
  dayStats: DayAttendanceRate[];
  // 시간대별 통계
  slotStats: TimeSlotAttendanceRate[];
  // 분석에 사용된 일정 수
  analyzedCount: number;
};

/**
 * 시간(0~23)을 시간대로 분류합니다.
 * 오전: 06~11시, 오후: 12~17시, 저녁: 18~23시 (나머지는 저녁으로 분류)
 */
function classifyTimeSlot(hour: number): TimeSlot {
  if (hour >= 6 && hour < 12) return "오전";
  if (hour >= 12 && hour < 18) return "오후";
  return "저녁";
}

/**
 * JS getDay() 결과(0=일, 1=월~6=토)를 한글 요일로 변환합니다.
 */
function getDayLabel(jsDay: number): DayOfWeek {
  const map: Record<number, DayOfWeek> = {
    0: "일",
    1: "월",
    2: "화",
    3: "수",
    4: "목",
    5: "금",
    6: "토",
  };
  return map[jsDay];
}

const DAY_ORDER: DayOfWeek[] = ["월", "화", "수", "목", "금", "토", "일"];

export function useOptimalScheduleTime(
  groupId: string,
  projectId?: string | null
) {
  const { data, isLoading } = useSWR(
    swrKeys.optimalScheduleTime(groupId, projectId),
    async (): Promise<OptimalScheduleTimeResult | null> => {
      const supabase = createClient();

      // 최근 3개월 범위
      const now = new Date();
      const threeMonthsAgo = subMonths(now, 3).toISOString();

      // 1. 최근 3개월 일정 조회 (출석 방식이 none이 아닌 것)
      let schedulesQuery = supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", threeMonthsAgo)
        .lte("starts_at", now.toISOString());

      if (projectId) {
        schedulesQuery = schedulesQuery.eq("project_id", projectId);
      }

      const { data: scheduleRows, error: schedErr } = await schedulesQuery;
      if (schedErr || !scheduleRows || scheduleRows.length < MIN_DATA_COUNT) {
        return null;
      }

      const scheduleIds = scheduleRows.map(
        (s: { id: string; starts_at: string }) => s.id
      );

      // 2. 출석 기록 조회
      const { data: attendanceRows, error: attErr } = await supabase
        .from("attendance")
        .select("user_id, status, schedule_id")
        .in("schedule_id", scheduleIds);

      if (attErr || !attendanceRows) return null;

      // 3. 일정별 총 멤버 수 추산 (그룹 멤버 수)
      const { data: memberCountData, error: memberErr } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId);

      if (memberErr) return null;

      // 실제 멤버 수 (없으면 출석 기록 내 고유 멤버 수 또는 1로 fallback)
      const uniqueMemberCount = new Set(
        (attendanceRows as { user_id: string }[]).map((a) => a.user_id)
      ).size;
      const _totalMembers =
        (memberCountData as unknown as { count: number } | null)?.count ??
        Math.max(uniqueMemberCount, 1);

      // 4. schedule_id -> starts_at 매핑
      const _scheduleMap = new Map<string, string>(
        scheduleRows.map((s: { id: string; starts_at: string }) => [
          s.id,
          s.starts_at,
        ])
      );

      // 5. 요일별/시간대별 출석 집계
      // 구조: { dayIdx: { slot: { present, total } } }
      type SlotStats = { present: number; total: number };
      const daySlotMap = new Map<
        number,
        Map<TimeSlot, SlotStats>
      >();

      // 일정별로 요일+시간대 집계
      for (const sched of scheduleRows) {
        const startsAt = new Date(sched.starts_at);
        const dayIdx = getDay(startsAt); // 0=일 ~ 6=토
        const slot = classifyTimeSlot(getHours(startsAt));

        if (!daySlotMap.has(dayIdx)) {
          daySlotMap.set(dayIdx, new Map());
        }
        const slotMap = daySlotMap.get(dayIdx)!;
        if (!slotMap.has(slot)) {
          slotMap.set(slot, { present: 0, total: 0 });
        }

        const stat = slotMap.get(slot)!;
        // 해당 일정의 출석 기록
        const schedAtt = (attendanceRows as { user_id: string; status: AttendanceStatus; schedule_id: string }[]).filter(
          (a) => a.schedule_id === sched.id
        );
        const presentCount = schedAtt.filter(
          (a) => a.status === "present" || a.status === "late"
        ).length;

        stat.present += presentCount;
        // total은 멤버 수 기준 (실제 기록 수 또는 전체 멤버 수 중 큰 값)
        const expectedTotal = Math.max(schedAtt.length, 1);
        stat.total += expectedTotal;
      }

      // 6. 요일별 평균 출석률 계산
      const dayStats: DayAttendanceRate[] = DAY_ORDER.map((day) => {
        // DayOfWeek -> JS getDay() 번호로 변환
        const jsDayMap: Record<DayOfWeek, number> = {
          일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6,
        };
        const jsDay = jsDayMap[day];
        const slotMap = daySlotMap.get(jsDay);

        if (!slotMap) return { day, rate: 0, count: 0 };

        let totalPresent = 0;
        let totalCount = 0;
        let schedCount = 0;

        for (const [, stat] of slotMap.entries()) {
          totalPresent += stat.present;
          totalCount += stat.total;
          schedCount++;
        }

        const rate =
          totalCount > 0 ? Math.round((totalPresent / totalCount) * 100) : 0;

        return { day, rate, count: schedCount };
      });

      // 7. 시간대별 평균 출석률 계산
      const SLOTS: TimeSlot[] = ["오전", "오후", "저녁"];
      const slotAggMap = new Map<TimeSlot, { present: number; total: number; count: number }>();

      for (const [, slotMap] of daySlotMap.entries()) {
        for (const [slot, stat] of slotMap.entries()) {
          if (!slotAggMap.has(slot)) {
            slotAggMap.set(slot, { present: 0, total: 0, count: 0 });
          }
          const agg = slotAggMap.get(slot)!;
          agg.present += stat.present;
          agg.total += stat.total;
          agg.count++;
        }
      }

      const slotStats: TimeSlotAttendanceRate[] = SLOTS.map((slot) => {
        const agg = slotAggMap.get(slot);
        if (!agg || agg.total === 0) return { slot, rate: 0, count: 0 };
        return {
          slot,
          rate: Math.round((agg.present / agg.total) * 100),
          count: agg.count,
        };
      });

      // 8. 최적 조합 찾기 (요일+시간대)
      let bestDay: DayOfWeek = "토";
      let bestSlot: TimeSlot = "오후";
      let bestRate = 0;

      for (const [jsDayNum, slotMap] of daySlotMap.entries()) {
        const day = getDayLabel(jsDayNum);
        for (const [slot, stat] of slotMap.entries()) {
          if (stat.total === 0) continue;
          const rate = Math.round((stat.present / stat.total) * 100);
          if (rate > bestRate) {
            bestRate = rate;
            bestDay = day;
            bestSlot = slot;
          }
        }
      }

      // 데이터가 충분한지 확인 (일정 수 기준)
      if (scheduleRows.length < MIN_DATA_COUNT) return null;

      return {
        bestDay,
        bestSlot,
        bestRate,
        dayStats,
        slotStats,
        analyzedCount: scheduleRows.length,
      };
    }
  );

  return {
    result: data ?? null,
    loading: isLoading,
  };
}
