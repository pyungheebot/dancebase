"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { format, startOfMonth, endOfMonth, parseISO, isValid } from "date-fns";
import { loadFromStorage, saveToStorage, removeFromStorage } from "@/lib/local-storage";
import type {
  GoalProgressSetting,
  GoalProgressTrackerData,
  GoalProgressStatus,
} from "@/types";

const STORAGE_PREFIX = "dancebase:goal";

function getStorageKey(groupId: string, userId: string): string {
  return `${STORAGE_PREFIX}:${groupId}:${userId}`;
}

function loadSetting(groupId: string, userId: string): GoalProgressSetting | null {
  const parsed = loadFromStorage<GoalProgressSetting | null>(getStorageKey(groupId, userId), null);
  if (!parsed) return null;
  // 이번 달 목표인지 확인
  const currentMonth = format(new Date(), "yyyy-MM");
  if (parsed.month !== currentMonth) return null;
  return parsed;
}

function saveSetting(groupId: string, userId: string, targetRate: number): void {
  const setting: GoalProgressSetting = {
    targetRate,
    month: format(new Date(), "yyyy-MM"),
  };
  saveToStorage(getStorageKey(groupId, userId), setting);
}

function computeStatus(
  neededAttendances: number,
  remainingSchedules: number,
  isAchieved: boolean
): GoalProgressStatus {
  if (isAchieved) return "achieved";
  if (neededAttendances === 0) return "achievable";
  if (neededAttendances <= remainingSchedules) return "achievable";
  if (neededAttendances <= remainingSchedules + 1) return "warning";
  // 남은 일정을 모두 출석해도 목표 달성 불가
  return "impossible";
}

export function useGoalProgressTracker(groupId: string, userId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId ? swrKeys.goalProgressTracker(groupId, userId) : null,
    async (): Promise<GoalProgressTrackerData> => {
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

      const thisMonthSchedules = (scheduleRows ?? []).filter(
        (s: { id: string; starts_at: string }) => {
          const d = parseISO(s.starts_at);
          return isValid(d);
        }
      );

      const totalSchedules = thisMonthSchedules.length;

      // 이미 지난 일정과 남은 일정 분리
      const passedSchedules = thisMonthSchedules.filter(
        (s: { id: string; starts_at: string }) => parseISO(s.starts_at) <= now
      );
      const remainingSchedules = totalSchedules - passedSchedules.length;

      const scheduleIds = thisMonthSchedules.map((s: { id: string }) => s.id);

      let attendedSchedules = 0;
      if (scheduleIds.length > 0) {
        const { data: attRows, error: attErr } = await supabase
          .from("attendance")
          .select("schedule_id, status")
          .eq("user_id", userId)
          .in("schedule_id", scheduleIds)
          .eq("status", "present");

        if (attErr) throw attErr;
        attendedSchedules = (attRows ?? []).length;
      }

      // 현재 출석률 계산 (지난 일정 기준)
      const passedTotal = passedSchedules.length;
      const currentRate =
        passedTotal > 0 ? Math.round((attendedSchedules / passedTotal) * 100) : 0;

      // localStorage에서 목표 설정 로드
      const setting = loadSetting(groupId, userId);

      if (!setting) {
        return {
          setting: null,
          totalSchedules,
          attendedSchedules,
          remainingSchedules,
          currentRate,
          progressRate: 0,
          neededAttendances: 0,
          status: "achievable",
          isAchieved: false,
        };
      }

      const { targetRate } = setting;

      // 목표 출석 횟수 계산 (전체 일정 기준)
      const targetCount = Math.ceil((targetRate / 100) * totalSchedules);

      // 이미 달성 여부
      const isAchieved = attendedSchedules >= targetCount;

      // 추가로 필요한 출석 횟수
      const neededAttendances = isAchieved
        ? 0
        : Math.max(0, targetCount - attendedSchedules);

      // 진행률 (목표 대비 현재)
      const progressRate =
        targetCount > 0
          ? Math.min(100, Math.round((attendedSchedules / targetCount) * 100))
          : 100;

      const status = computeStatus(
        neededAttendances,
        remainingSchedules,
        isAchieved
      );

      return {
        setting,
        totalSchedules,
        attendedSchedules,
        remainingSchedules,
        currentRate,
        progressRate,
        neededAttendances,
        status,
        isAchieved,
      };
    }
  );

  const setGoal = useCallback(
    (targetRate: number) => {
      saveSetting(groupId, userId, targetRate);
      mutate();
    },
    [groupId, userId, mutate]
  );

  const clearGoal = useCallback(() => {
    if (typeof window !== "undefined") {
      removeFromStorage(getStorageKey(groupId, userId));
    }
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
