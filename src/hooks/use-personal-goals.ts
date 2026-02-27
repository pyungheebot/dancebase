"use client";

import { useState, useEffect, useCallback } from "react";
import type { PersonalGoalItem, PersonalGoalStatus } from "@/types";

// ============================================
// 상수
// ============================================

const MAX_GOALS = 10;

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string, userId: string): string {
  return `dancebase:personal-goals:${groupId}:${userId}`;
}

// ============================================
// 로컬 스토리지 유틸
// ============================================

function loadFromStorage(groupId: string, userId: string): PersonalGoalItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, userId));
    if (!raw) return [];
    return JSON.parse(raw) as PersonalGoalItem[];
  } catch {
    return [];
  }
}

function saveToStorage(
  groupId: string,
  userId: string,
  goals: PersonalGoalItem[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(groupId, userId),
      JSON.stringify(goals)
    );
  } catch {
    // 스토리지 용량 초과 등 무시
  }
}

// ============================================
// 훅
// ============================================

export function usePersonalGoals(groupId: string, userId: string) {
  const [goals, setGoals] = useState<PersonalGoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    if (!groupId || !userId) {
      setLoading(false);
      return;
    }
    const loaded = loadFromStorage(groupId, userId);
    setGoals(loaded);
    setLoading(false);
  }, [groupId, userId]);

  // 내부 상태 + 스토리지 동시 업데이트
  const persist = useCallback(
    (updated: PersonalGoalItem[]) => {
      setGoals(updated);
      saveToStorage(groupId, userId, updated);
    },
    [groupId, userId]
  );

  // 목표 추가
  const addGoal = useCallback(
    (params: {
      title: string;
      description: string;
      targetDate: string;
    }): { success: boolean; message?: string } => {
      if (goals.filter((g) => g.status !== "abandoned").length >= MAX_GOALS) {
        return { success: false, message: `목표는 최대 ${MAX_GOALS}개까지 등록할 수 있습니다` };
      }
      if (!params.title.trim()) {
        return { success: false, message: "목표 제목을 입력해주세요" };
      }
      if (!params.targetDate) {
        return { success: false, message: "목표 날짜를 선택해주세요" };
      }

      const newGoal: PersonalGoalItem = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        description: params.description.trim(),
        targetDate: params.targetDate,
        progress: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      persist([...goals, newGoal]);
      return { success: true };
    },
    [goals, persist]
  );

  // 진행률 업데이트 (100%가 되면 자동으로 completed)
  const updateProgress = useCallback(
    (goalId: string, progress: number) => {
      const clamped = Math.min(100, Math.max(0, Math.round(progress)));
      const updated = goals.map((g) => {
        if (g.id !== goalId) return g;
        const isCompleted = clamped === 100;
        return {
          ...g,
          progress: clamped,
          status: isCompleted ? ("completed" as PersonalGoalStatus) : g.status === "completed" ? ("active" as PersonalGoalStatus) : g.status,
          completedAt: isCompleted
            ? g.completedAt ?? new Date().toISOString()
            : undefined,
        };
      });
      persist(updated);
    },
    [goals, persist]
  );

  // 목표 포기
  const abandonGoal = useCallback(
    (goalId: string) => {
      const updated = goals.map((g) =>
        g.id === goalId ? { ...g, status: "abandoned" as PersonalGoalStatus } : g
      );
      persist(updated);
    },
    [goals, persist]
  );

  // 목표 삭제
  const deleteGoal = useCallback(
    (goalId: string) => {
      persist(goals.filter((g) => g.id !== goalId));
    },
    [goals, persist]
  );

  // 파생 값
  const activeCount = goals.filter((g) => g.status === "active").length;
  const completedCount = goals.filter((g) => g.status === "completed").length;
  const canAddMore =
    goals.filter((g) => g.status !== "abandoned").length < MAX_GOALS;

  return {
    goals,
    loading,
    activeCount,
    completedCount,
    canAddMore,
    maxGoals: MAX_GOALS,
    addGoal,
    updateProgress,
    abandonGoal,
    deleteGoal,
  };
}
