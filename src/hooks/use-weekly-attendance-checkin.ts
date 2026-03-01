"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { WeeklyCheckinData, WeeklyCheckinRecord } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

const HISTORY_WEEKS = 8;

// 주어진 날짜 기준으로 해당 주의 월요일(ISO) 반환
function getWeekStart(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

// 연속 달성 주 수(streak) 계산: 최근 기록부터 역순으로 확인
function calcStreak(history: WeeklyCheckinRecord[], currentWeekStart: string): number {
  // 이번 주 포함 + 과거 기록 합산하여 날짜 내림차순 정렬
  const sorted = [...history].sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );

  let streak = 0;
  const now = new Date();
  let cursor = startOfWeek(now, { weekStartsOn: 1 });

  for (const record of sorted) {
    const cursorStr = format(cursor, "yyyy-MM-dd");

    // 현재 커서 주와 일치하는 기록인지 확인
    if (record.weekStart !== cursorStr) {
      // 이번 주가 아직 진행 중이면 건너뜀 (미달성이어도 기회가 있음)
      if (record.weekStart === currentWeekStart) {
        cursor = subWeeks(cursor, 1);
        continue;
      }
      break;
    }

    if (record.achieved) {
      streak++;
      cursor = subWeeks(cursor, 1);
    } else {
      // 이번 주는 아직 진행 중이므로 스트릭 끊기지 않음
      if (record.weekStart === currentWeekStart) {
        cursor = subWeeks(cursor, 1);
        continue;
      }
      break;
    }
  }

  return streak;
}

export type WeeklyCheckinResult = {
  // 이번 주 정보
  currentWeekStart: string;
  currentGoal: number | null;
  currentActual: number;
  isAchieved: boolean;
  remaining: number; // 목표까지 남은 횟수
  // 히스토리 (최근 8주, 이번 주 포함)
  history: WeeklyCheckinRecord[];
  // 연속 달성
  streak: number;
  // 액션
  setGoal: (goal: number) => Promise<void>;
  resetGoal: () => void;
  loading: boolean;
  refetch: () => void;
};

export function useWeeklyAttendanceCheckin(
  groupId: string,
  userId: string
): WeeklyCheckinResult {
  const supabase = createClient();
  const storageKey = `dancebase:weekly-checkin:${groupId}:${userId}`;

  const { data, isLoading, mutate } = useSWR(
    groupId && userId ? swrKeys.weeklyAttendanceCheckin(groupId, userId) : null,
    async (): Promise<{
      stored: WeeklyCheckinData;
      currentActual: number;
      currentWeekStart: string;
    }> => {
      const stored = loadFromStorage<WeeklyCheckinData>(storageKey, { currentGoal: null, history: [] });
      const now = new Date();
      const currentWeekStart = getWeekStart(now);

      // 이번 주 월요일 ~ 일요일 범위
      const weekFrom = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekTo = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

      // 이번 주 일정 ID 조회
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", weekFrom)
        .lte("starts_at", weekTo);

      if (schedErr) {
        return { stored, currentActual: 0, currentWeekStart };
      }

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      if (scheduleIds.length === 0) {
        return { stored, currentActual: 0, currentWeekStart };
      }

      // 이번 주 실제 출석 횟수 조회
      const { data: attRows, error: attErr } = await supabase
        .from("attendance")
        .select("status")
        .in("schedule_id", scheduleIds)
        .eq("user_id", userId);

      if (attErr) {
        return { stored, currentActual: 0, currentWeekStart };
      }

      const currentActual = (attRows ?? []).filter(
        (a: { status: string }) => a.status === "present" || a.status === "late"
      ).length;

      return { stored, currentActual, currentWeekStart };
    }
  );

  const stored = data?.stored ?? { currentGoal: null, history: [] };
  const currentActual = data?.currentActual ?? 0;
  const currentWeekStart = data?.currentWeekStart ?? getWeekStart(new Date());

  const currentGoal = stored.currentGoal;
  const isAchieved = currentGoal !== null && currentActual >= currentGoal;
  const remaining = currentGoal !== null ? Math.max(0, currentGoal - currentActual) : 0;

  // 히스토리에 이번 주 레코드 반영 (목표가 설정된 경우)
  let history = stored.history;
  if (currentGoal !== null) {
    const existingIdx = history.findIndex((r) => r.weekStart === currentWeekStart);
    const currentRecord: WeeklyCheckinRecord = {
      weekStart: currentWeekStart,
      goal: currentGoal,
      actual: currentActual,
      achieved: isAchieved,
    };
    if (existingIdx >= 0) {
      history = [
        ...history.slice(0, existingIdx),
        currentRecord,
        ...history.slice(existingIdx + 1),
      ];
    } else {
      history = [currentRecord, ...history];
    }
    // 최근 8주만 유지
    history = history
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
      .slice(0, HISTORY_WEEKS);
  }

  const streak = calcStreak(history, currentWeekStart);

  // 목표 설정 (localStorage에 저장 후 SWR 리페치)
  const setGoal = useCallback(
    async (goal: number) => {
      const now = new Date();
      const weekStart = getWeekStart(now);
      const current = loadFromStorage<WeeklyCheckinData>(storageKey, { currentGoal: null, history: [] });

      // 이번 주 레코드 업데이트 또는 추가
      let newHistory = current.history ?? [];
      const existingIdx = newHistory.findIndex((r) => r.weekStart === weekStart);
      const newRecord: WeeklyCheckinRecord = {
        weekStart,
        goal,
        actual: currentActual,
        achieved: currentActual >= goal,
      };

      if (existingIdx >= 0) {
        newHistory = [
          ...newHistory.slice(0, existingIdx),
          newRecord,
          ...newHistory.slice(existingIdx + 1),
        ];
      } else {
        newHistory = [newRecord, ...newHistory];
      }

      // 최근 8주만 보관
      newHistory = newHistory
        .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
        .slice(0, HISTORY_WEEKS);

      const next: WeeklyCheckinData = {
        currentGoal: goal,
        history: newHistory,
      };

      saveToStorage(storageKey, next);
      await mutate();
    },
    [storageKey, currentActual, mutate]
  );

  // 목표 초기화
  const resetGoal = useCallback(() => {
    const current = loadFromStorage<WeeklyCheckinData>(storageKey, { currentGoal: null, history: [] });
    const next: WeeklyCheckinData = {
      currentGoal: null,
      history: current.history,
    };
    saveToStorage(storageKey, next);
    mutate();
  }, [storageKey, mutate]);

  return {
    currentWeekStart,
    currentGoal,
    currentActual,
    isAchieved,
    remaining,
    history,
    streak,
    setGoal,
    resetGoal,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
