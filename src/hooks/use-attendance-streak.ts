"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { startOfMonth, endOfMonth, parseISO, isValid } from "date-fns";

type AttendanceStreakResult = {
  currentStreak: number;
  longestStreak: number;
  monthlyRate: number;
  totalPresent: number;
};

export function useAttendanceStreak(groupId: string, userId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId ? swrKeys.attendanceStreak(groupId, userId) : null,
    async (): Promise<AttendanceStreakResult> => {
      const supabase = createClient();

      // 해당 그룹의 출석 체크 대상 일정 전체 조회 (attendance_method != none)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .order("starts_at", { ascending: true });

      if (schedErr) throw schedErr;

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      if (scheduleIds.length === 0) {
        return { currentStreak: 0, longestStreak: 0, monthlyRate: 0, totalPresent: 0 };
      }

      // 해당 유저의 출석 기록 조회
      const { data: attRows, error: attErr } = await supabase
        .from("attendance")
        .select("schedule_id, status")
        .eq("user_id", userId)
        .in("schedule_id", scheduleIds);

      if (attErr) throw attErr;

      // schedule_id → status 맵
      const statusMap = new Map<string, string>();
      for (const row of attRows ?? []) {
        statusMap.set(row.schedule_id, row.status);
      }

      // 일정 날짜 순으로 present/absent 배열 구성
      const orderedStatuses = (scheduleRows ?? []).map((s: { id: string; starts_at: string }) =>
        statusMap.get(s.id) === "present"
      );

      const totalPresent = orderedStatuses.filter(Boolean).length;

      // 현재 스트릭: 가장 최근부터 역순으로 연속 present 횟수
      let currentStreak = 0;
      for (let i = orderedStatuses.length - 1; i >= 0; i--) {
        if (orderedStatuses[i]) {
          currentStreak++;
        } else {
          break;
        }
      }

      // 최장 스트릭 계산
      let longestStreak = 0;
      let tempStreak = 0;
      for (const isPresent of orderedStatuses) {
        if (isPresent) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      // 이번 달 출석률 계산
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const thisMonthSchedules = (scheduleRows ?? []).filter((s: { id: string; starts_at: string }) => {
        const d = parseISO(s.starts_at);
        return isValid(d) && d >= new Date(monthStart) && d <= new Date(monthEnd);
      });

      const thisMonthTotal = thisMonthSchedules.length;
      const thisMonthPresent = thisMonthSchedules.filter((s: { id: string; starts_at: string }) =>
        statusMap.get(s.id) === "present"
      ).length;

      const monthlyRate =
        thisMonthTotal > 0 ? Math.round((thisMonthPresent / thisMonthTotal) * 100) : 0;

      return { currentStreak, longestStreak, monthlyRate, totalPresent };
    }
  );

  return {
    currentStreak: data?.currentStreak ?? 0,
    longestStreak: data?.longestStreak ?? 0,
    monthlyRate: data?.monthlyRate ?? 0,
    totalPresent: data?.totalPresent ?? 0,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
