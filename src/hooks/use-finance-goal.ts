"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FinanceGoal } from "@/types";
import { loadFromStorage, saveToStorage, removeFromStorage } from "@/lib/local-storage";
import logger from "@/lib/logger";

const STORAGE_KEY_PREFIX = "finance-goal-";

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadGoal(groupId: string): FinanceGoal | null {
  return loadFromStorage<FinanceGoal | null>(getStorageKey(groupId), null);
}

function saveGoal(groupId: string, goal: FinanceGoal): void {
  saveToStorage(getStorageKey(groupId), goal);
}

function removeGoal(groupId: string): void {
  removeFromStorage(getStorageKey(groupId));
}

export function useFinanceGoal(groupId: string, projectId?: string | null) {
  const [goal, setGoal] = useState<FinanceGoal | null>(null);
  const [currentIncome, setCurrentIncome] = useState<number>(0);
  const [loadingIncome, setLoadingIncome] = useState<boolean>(false);

  // localStorage에서 목표 로드
  useEffect(() => {
    setGoal(loadGoal(groupId));
  }, [groupId]);

  // Supabase에서 현재 수입 합계 조회
  const fetchCurrentIncome = useCallback(async () => {
    setLoadingIncome(true);
    try {
      const supabase = createClient();

      let query = supabase
        .from("finance_transactions")
        .select("amount")
        .eq("group_id", groupId)
        .eq("type", "income");

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("수입 조회 실패", "useFinanceGoal", error);
        setCurrentIncome(0);
        return;
      }

      const total = (data ?? []).reduce(
        (sum: number, row: { amount: number }) => sum + row.amount,
        0
      );
      setCurrentIncome(total);
    } finally {
      setLoadingIncome(false);
    }
  }, [groupId, projectId]);

  // 목표가 있을 때 수입 조회
  useEffect(() => {
    if (goal) {
      void fetchCurrentIncome();
    }
  }, [goal, fetchCurrentIncome]);

  // 달성률 계산 (0 ~ 100 clamp)
  const achievementRate =
    goal && goal.targetAmount > 0
      ? Math.min(100, Math.round((currentIncome / goal.targetAmount) * 100))
      : 0;

  // 마감일까지 남은 일수
  const daysLeft =
    goal?.deadline
      ? Math.ceil(
          (new Date(goal.deadline).getTime() - new Date().setHours(0, 0, 0, 0)) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  // 일별 필요 수입: 남은 금액 / 남은 일수
  const dailyRequired =
    goal && daysLeft !== null && daysLeft > 0
      ? Math.ceil(
          Math.max(0, goal.targetAmount - currentIncome) / daysLeft
        )
      : null;

  // 목표 생성
  const createGoal = useCallback(
    (params: Omit<FinanceGoal, "id" | "isAchieved" | "createdAt">) => {
      const newGoal: FinanceGoal = {
        id: crypto.randomUUID(),
        ...params,
        isAchieved: false,
        createdAt: new Date().toISOString(),
      };
      saveGoal(groupId, newGoal);
      setGoal(newGoal);
      void fetchCurrentIncome();
    },
    [groupId, fetchCurrentIncome]
  );

  // 목표 달성 표시
  const markAchieved = useCallback(() => {
    if (!goal) return;
    const updated: FinanceGoal = { ...goal, isAchieved: true };
    saveGoal(groupId, updated);
    setGoal(updated);
  }, [goal, groupId]);

  // 목표 삭제
  const deleteGoal = useCallback(() => {
    removeGoal(groupId);
    setGoal(null);
    setCurrentIncome(0);
  }, [groupId]);

  // 달성 자동 감지 (달성률 100% 이상이고 아직 미달성 상태일 때)
  useEffect(() => {
    if (goal && !goal.isAchieved && achievementRate >= 100) {
      markAchieved();
    }
  }, [goal, achievementRate, markAchieved]);

  return {
    goal,
    currentIncome,
    achievementRate,
    daysLeft,
    dailyRequired,
    loadingIncome,
    createGoal,
    deleteGoal,
    refetchIncome: fetchCurrentIncome,
  };
}
