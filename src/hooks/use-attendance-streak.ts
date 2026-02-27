"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { subDays, format, parseISO, isValid } from "date-fns";
import type { AttendanceStreakData } from "@/types";

export function useAttendanceStreak(groupId: string, userId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId ? swrKeys.attendanceStreak(groupId, userId) : null,
    async (): Promise<AttendanceStreakData> => {
      const supabase = createClient();

      // 최근 90일 범위 계산
      const today = new Date();
      const ninetyDaysAgo = subDays(today, 89);
      const rangeStart = ninetyDaysAgo.toISOString();

      // 해당 그룹의 출석 체크 대상 일정 조회 (최근 90일, attendance_method != none)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", rangeStart)
        .lte("starts_at", today.toISOString())
        .order("starts_at", { ascending: true });

      if (schedErr) throw schedErr;

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      if (scheduleIds.length === 0) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          totalPresent: 0,
          streakDates: [],
          monthlyGrid: buildEmptyGrid(ninetyDaysAgo, today),
        };
      }

      // 해당 유저의 출석 기록 조회
      const { data: attRows, error: attErr } = await supabase
        .from("attendance")
        .select("schedule_id, status")
        .eq("user_id", userId)
        .in("schedule_id", scheduleIds);

      if (attErr) throw attErr;

      // schedule_id → status 맵 (present / late = 출석으로 처리)
      const statusMap = new Map<string, string>();
      for (const row of attRows ?? []) {
        statusMap.set(row.schedule_id, row.status);
      }

      // 일정을 날짜별로 집계 (한 날짜에 여러 일정이 있을 경우 하나라도 출석이면 출석)
      const dateStatusMap = new Map<string, boolean>();
      for (const s of scheduleRows ?? []) {
        const parsed = parseISO(s.starts_at);
        if (!isValid(parsed)) continue;
        const dateKey = format(parsed, "yyyy-MM-dd");
        const status = statusMap.get(s.id);
        const isPresent = status === "present" || status === "late";
        // 이미 출석 처리된 날짜면 유지, 아니면 현재 상태로 설정
        if (!dateStatusMap.has(dateKey) || isPresent) {
          dateStatusMap.set(dateKey, isPresent);
        }
      }

      // 일정이 있는 날짜만 정렬된 배열로 변환
      const sortedDates = Array.from(dateStatusMap.entries())
        .sort(([a], [b]) => a.localeCompare(b));

      const totalPresent = sortedDates.filter(([, present]) => present).length;

      // 현재 스트릭: 가장 최근부터 역순으로 연속 출석 날짜 수집
      const streakDates: string[] = [];
      let currentStreak = 0;
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        const [date, present] = sortedDates[i];
        if (present) {
          currentStreak++;
          streakDates.unshift(date);
        } else {
          break;
        }
      }

      // 최장 스트릭 계산
      let longestStreak = 0;
      let tempStreak = 0;
      for (const [, present] of sortedDates) {
        if (present) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      // 90일 그리드: 일정이 있는 날짜만 표시 (없으면 포함하지 않음)
      const monthlyGrid = sortedDates.map(([date, present]) => ({ date, present }));

      return { currentStreak, longestStreak, totalPresent, streakDates, monthlyGrid };
    }
  );

  return {
    currentStreak: data?.currentStreak ?? 0,
    longestStreak: data?.longestStreak ?? 0,
    totalPresent: data?.totalPresent ?? 0,
    streakDates: data?.streakDates ?? [],
    monthlyGrid: data?.monthlyGrid ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

// 일정이 없을 때 빈 그리드 생성 (일정 있는 날짜만 담으므로 빈 배열 반환)
function buildEmptyGrid(
  _from: Date,
  _to: Date
): { date: string; present: boolean }[] {
  return [];
}
