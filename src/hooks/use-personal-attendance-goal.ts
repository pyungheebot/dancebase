"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { format, startOfMonth, endOfMonth, differenceInCalendarDays, endOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { PersonalAttendanceGoal, PersonalAttendanceGoalData } from "@/types";

const STORAGE_PREFIX = "dancebase:personal-att-goal";

function getStorageKey(groupId: string, userId: string): string {
  return `${STORAGE_PREFIX}:${groupId}:${userId}`;
}

function loadGoal(groupId: string, userId: string): PersonalAttendanceGoal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersonalAttendanceGoal;
    // 이번 달 목표인지 확인 (다른 달이면 무효화)
    const currentMonth = format(new Date(), "yyyy-MM");
    if (parsed.month !== currentMonth) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveGoal(groupId: string, userId: string, targetCount: number): void {
  if (typeof window === "undefined") return;
  const goal: PersonalAttendanceGoal = {
    targetCount,
    month: format(new Date(), "yyyy-MM"),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(getStorageKey(groupId, userId), JSON.stringify(goal));
}

function clearGoalStorage(groupId: string, userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKey(groupId, userId));
}

export function usePersonalAttendanceGoal(groupId: string, userId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId ? swrKeys.personalAttendanceGoal(groupId, userId) : null,
    async (): Promise<PersonalAttendanceGoalData> => {
      const supabase = createClient();

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      // 이번 달 출석 체크 대상 일정 조회
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", monthStart)
        .lte("starts_at", monthEnd)
        .order("starts_at", { ascending: true });

      if (schedErr) throw schedErr;

      const allSchedules = scheduleRows ?? [];
      const totalSchedules = allSchedules.length;

      // 지난 일정 vs 남은 일정 구분
      const passedSchedulesList = allSchedules.filter(
        (s: { id: string; starts_at: string }) => new Date(s.starts_at) <= now
      );
      const passedSchedules = passedSchedulesList.length;
      const remainingSchedules = totalSchedules - passedSchedules;

      // 실제 출석 횟수 조회 (present + late)
      let actualCount = 0;
      if (passedSchedulesList.length > 0) {
        const scheduleIds = passedSchedulesList.map((s: { id: string }) => s.id);
        const { data: attRows, error: attErr } = await supabase
          .from("attendance")
          .select("status")
          .eq("user_id", userId)
          .in("schedule_id", scheduleIds)
          .in("status", ["present", "late"]);

        if (attErr) throw attErr;
        actualCount = (attRows ?? []).length;
      }

      // 이번 달 남은 일수 계산
      const monthEndDate = endOfMonth(now);
      const remainingDays = differenceInCalendarDays(endOfDay(monthEndDate), endOfDay(now)) + 1;

      // localStorage에서 목표 로드
      const goal = loadGoal(groupId, userId);

      if (!goal) {
        return {
          goal: null,
          actualCount,
          totalSchedules,
          passedSchedules,
          remainingSchedules,
          achievementRate: 0,
          isAchieved: false,
          remainingCount: 0,
          remainingDays,
          dailyPaceNeeded: null,
        };
      }

      const { targetCount } = goal;

      // 달성률 계산 (목표 기준)
      const achievementRate =
        targetCount > 0
          ? Math.min(100, Math.round((actualCount / targetCount) * 100))
          : 100;

      const isAchieved = actualCount >= targetCount;
      const remainingCount = isAchieved ? 0 : targetCount - actualCount;

      // 하루 필요 페이스 계산 (남은 일수가 있을 때만)
      const dailyPaceNeeded =
        !isAchieved && remainingDays > 0
          ? Math.round((remainingCount / remainingDays) * 10) / 10
          : null;

      return {
        goal,
        actualCount,
        totalSchedules,
        passedSchedules,
        remainingSchedules,
        achievementRate,
        isAchieved,
        remainingCount,
        remainingDays,
        dailyPaceNeeded,
      };
    }
  );

  const setGoal = useCallback(
    (targetCount: number) => {
      saveGoal(groupId, userId, targetCount);
      mutate();
    },
    [groupId, userId, mutate]
  );

  const clearGoal = useCallback(() => {
    clearGoalStorage(groupId, userId);
    mutate();
  }, [groupId, userId, mutate]);

  return {
    data: data ?? null,
    loading: isLoading,
    setGoal,
    clearGoal,
    refetch: () => mutate(),
  };
}
