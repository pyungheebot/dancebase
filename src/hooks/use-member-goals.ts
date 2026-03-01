"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { MemberGoal, MemberGoalType } from "@/types";

// ============================================
// 타입 정의
// ============================================

export type MemberGoalWithProgress = MemberGoal & {
  currentValue: number;
  achievementRate: number; // 0~100
  isAchieved: boolean;
};

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string, userId: string): string {
  return `member-goals-${groupId}-${userId}`;
}

// ============================================
// Supabase 실제 달성값 조회
// ============================================

async function fetchCurrentValue(
  goalType: MemberGoalType,
  groupId: string,
  userId: string,
  yearMonth: string
): Promise<number> {
  const supabase = createClient();

  // yearMonth: "YYYY-MM"
  const from = `${yearMonth}-01`;
  // 해당 월 마지막 날: 다음 달 1일에서 하루 전
  const [year, month] = yearMonth.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const to = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;

  if (goalType === "attendance") {
    // 해당 월 그룹 일정 ID 조회
    const { data: schedules, error: schedErr } = await supabase
      .from("schedules")
      .select("id")
      .eq("group_id", groupId)
      .gte("starts_at", `${from}T00:00:00`)
      .lt("starts_at", `${to}T00:00:00`);

    if (schedErr || !schedules || schedules.length === 0) return 0;

    const scheduleIds = schedules.map((s: { id: string }) => s.id);

    const { count, error: attErr } = await supabase
      .from("attendances")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("schedule_id", scheduleIds)
      .in("status", ["present", "late"]);

    if (attErr) return 0;
    return count ?? 0;
  }

  if (goalType === "posts") {
    const { count, error } = await supabase
      .from("board_posts")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("author_id", userId)
      .gte("created_at", `${from}T00:00:00`)
      .lt("created_at", `${to}T00:00:00`)
      .is("deleted_at", null);

    if (error) return 0;
    return count ?? 0;
  }

  if (goalType === "payment") {
    // finance_transactions에서 해당 월 income 건수 (paid_by = userId)
    const { count, error } = await supabase
      .from("finance_transactions")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("paid_by", userId)
      .eq("type", "income")
      .gte("transaction_date", from)
      .lt("transaction_date", to);

    if (error) return 0;
    return count ?? 0;
  }

  return 0;
}

// ============================================
// 훅
// ============================================

export function useMemberGoals(groupId: string, userId: string) {
  const [goals, setGoals] = useState<MemberGoal[]>([]);
  const [goalsWithProgress, setGoalsWithProgress] = useState<MemberGoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);

  // localStorage에서 목표 불러오기
  const loadGoals = useCallback((): MemberGoal[] => {
    return loadFromStorage<MemberGoal[]>(storageKey(groupId, userId), []);
  }, [groupId, userId]);

  // localStorage에 목표 저장
  const saveGoals = useCallback(
    (newGoals: MemberGoal[]) => {
      saveToStorage(storageKey(groupId, userId), newGoals);
    },
    [groupId, userId]
  );

  // 달성률 계산 (Supabase 조회)
  const computeProgress = useCallback(
    async (rawGoals: MemberGoal[]): Promise<MemberGoalWithProgress[]> => {
      if (rawGoals.length === 0) return [];

      const results = await Promise.all(
        rawGoals.map(async (goal) => {
          const currentValue = await fetchCurrentValue(
            goal.goalType,
            groupId,
            userId,
            goal.yearMonth
          );
          const achievementRate = goal.targetValue > 0
            ? Math.min(100, Math.round((currentValue / goal.targetValue) * 100))
            : 0;
          return {
            ...goal,
            currentValue,
            achievementRate,
            isAchieved: currentValue >= goal.targetValue,
          };
        })
      );
      return results;
    },
    [groupId, userId]
  );

  // 초기 로드
  useEffect(() => {
    if (!groupId || !userId) {
      setLoading(false);
      return;
    }

    const rawGoals = loadGoals();
    setGoals(rawGoals);
    setLoading(false);

    // 달성률 비동기 계산
    if (rawGoals.length > 0) {
      setProgressLoading(true);
      computeProgress(rawGoals)
        .then((result) => {
          setGoalsWithProgress(result);
        })
        .finally(() => {
          setProgressLoading(false);
        });
    } else {
      setGoalsWithProgress([]);
    }
  }, [groupId, userId, loadGoals, computeProgress]);

  // 목표 생성
  const createGoal = useCallback(
    async (goalType: MemberGoalType, targetValue: number, yearMonth: string) => {
      const newGoal: MemberGoal = {
        id: crypto.randomUUID(),
        goalType,
        targetValue,
        yearMonth,
        createdAt: new Date().toISOString(),
      };

      const updated = [...goals, newGoal];
      saveGoals(updated);
      setGoals(updated);

      // 달성률 즉시 계산
      setProgressLoading(true);
      try {
        const result = await computeProgress(updated);
        setGoalsWithProgress(result);
      } finally {
        setProgressLoading(false);
      }
    },
    [goals, saveGoals, computeProgress]
  );

  // 목표 삭제
  const deleteGoal = useCallback(
    (goalId: string) => {
      const updated = goals.filter((g) => g.id !== goalId);
      saveGoals(updated);
      setGoals(updated);
      setGoalsWithProgress((prev) => prev.filter((g) => g.id !== goalId));
    },
    [goals, saveGoals]
  );

  // 달성률 새로고침
  const refreshProgress = useCallback(async () => {
    const rawGoals = loadGoals();
    if (rawGoals.length === 0) {
      setGoalsWithProgress([]);
      return;
    }
    setProgressLoading(true);
    try {
      const result = await computeProgress(rawGoals);
      setGoalsWithProgress(result);
    } finally {
      setProgressLoading(false);
    }
  }, [loadGoals, computeProgress]);

  return {
    goals,
    goalsWithProgress,
    loading,
    progressLoading,
    createGoal,
    deleteGoal,
    refreshProgress,
  };
}
