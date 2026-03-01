"use client";

import { useCallback, useState } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceMilestoneData,
  DanceMilestoneGoal,
  DanceMilestoneStep,
  DanceMilestoneCategory,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.danceMilestone(memberId);
}

function loadData(memberId: string): DanceMilestoneData {
  if (typeof window === "undefined") return { goals: [] };
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    if (!raw) return { goals: [] };
    return JSON.parse(raw) as DanceMilestoneData;
  } catch {
    return { goals: [] };
  }
}

function saveData(memberId: string, data: DanceMilestoneData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(memberId), JSON.stringify(data));
  } catch {
    // 저장 실패 시 무시
  }
}

// ============================================================
// 진행률 계산
// ============================================================

export function calcGoalProgress(goal: DanceMilestoneGoal): number {
  if (goal.steps.length === 0) return 0;
  const completed = goal.steps.filter((s) => s.isCompleted).length;
  return Math.round((completed / goal.steps.length) * 100);
}

// ============================================================
// 훅
// ============================================================

export function useDanceMilestone(memberId: string) {
  const [goals, setGoals] = useState<DanceMilestoneGoal[]>(() => loadData(memberId).goals);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    const data = loadData(memberId);
    setGoals(data.goals);
  }, [memberId]);

  // 내부 persist 헬퍼
  const persist = useCallback(
    (nextGoals: DanceMilestoneGoal[]) => {
      saveData(memberId, { goals: nextGoals });
      setGoals(nextGoals);
    },
    [memberId]
  );

  // ────────────────────────────────────────────
  // 목표 CRUD
  // ────────────────────────────────────────────

  /** 새 목표 추가 */
  const addGoal = useCallback(
    (params: {
      title: string;
      description?: string;
      category: DanceMilestoneCategory;
      targetDate?: string;
    }): DanceMilestoneGoal => {
      const now = new Date().toISOString();
      const newGoal: DanceMilestoneGoal = {
        id: crypto.randomUUID(),
        memberId,
        title: params.title.trim(),
        description: params.description?.trim() || undefined,
        category: params.category,
        steps: [],
        targetDate: params.targetDate || undefined,
        createdAt: now,
        updatedAt: now,
      };
      persist([...goals, newGoal]);
      return newGoal;
    },
    [memberId, goals, persist]
  );

  /** 목표 삭제 */
  const deleteGoal = useCallback(
    (goalId: string): void => {
      persist(goals.filter((g) => g.id !== goalId));
    },
    [goals, persist]
  );

  /** 목표 정보 수정 */
  const updateGoal = useCallback(
    (
      goalId: string,
      patch: Partial<
        Pick<DanceMilestoneGoal, "title" | "description" | "category" | "targetDate">
      >
    ): void => {
      const next = goals.map((g) =>
        g.id === goalId
          ? { ...g, ...patch, updatedAt: new Date().toISOString() }
          : g
      );
      persist(next);
    },
    [goals, persist]
  );

  // ────────────────────────────────────────────
  // 마일스톤 단계 CRUD
  // ────────────────────────────────────────────

  /** 목표에 마일스톤 단계 추가 */
  const addStep = useCallback(
    (
      goalId: string,
      params: { title: string; description?: string }
    ): DanceMilestoneStep | null => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return null;

      const newStep: DanceMilestoneStep = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        description: params.description?.trim() || undefined,
        isCompleted: false,
        order: goal.steps.length,
      };

      const updatedGoal: DanceMilestoneGoal = {
        ...goal,
        steps: [...goal.steps, newStep],
        updatedAt: new Date().toISOString(),
      };

      persist(goals.map((g) => (g.id === goalId ? updatedGoal : g)));
      return newStep;
    },
    [goals, persist]
  );

  /** 마일스톤 단계 완료 토글 */
  const toggleStep = useCallback(
    (goalId: string, stepId: string): void => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const now = new Date().toISOString();
      const updatedSteps = goal.steps.map((s) => {
        if (s.id !== stepId) return s;
        return s.isCompleted
          ? { ...s, isCompleted: false, completedAt: undefined }
          : { ...s, isCompleted: true, completedAt: now };
      });

      const updatedGoal: DanceMilestoneGoal = {
        ...goal,
        steps: updatedSteps,
        updatedAt: now,
      };

      persist(goals.map((g) => (g.id === goalId ? updatedGoal : g)));
    },
    [goals, persist]
  );

  /** 마일스톤 단계 삭제 */
  const deleteStep = useCallback(
    (goalId: string, stepId: string): void => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const updatedSteps = goal.steps
        .filter((s) => s.id !== stepId)
        .map((s, i) => ({ ...s, order: i }));

      const updatedGoal: DanceMilestoneGoal = {
        ...goal,
        steps: updatedSteps,
        updatedAt: new Date().toISOString(),
      };

      persist(goals.map((g) => (g.id === goalId ? updatedGoal : g)));
    },
    [goals, persist]
  );

  // ────────────────────────────────────────────
  // 통계 / 조회
  // ────────────────────────────────────────────

  /** 전체 진행 중인 목표 수 */
  const activeGoalsCount = goals.filter(
    (g) => calcGoalProgress(g) < 100
  ).length;

  /** 완료된 목표 수 */
  const completedGoalsCount = goals.filter(
    (g) => g.steps.length > 0 && calcGoalProgress(g) === 100
  ).length;

  /** 전체 평균 진행률 */
  const overallProgress = (() => {
    if (goals.length === 0) return 0;
    const total = goals.reduce((sum, g) => sum + calcGoalProgress(g), 0);
    return Math.round(total / goals.length);
  })();

  return {
    goals,
    loading,
    activeGoalsCount,
    completedGoalsCount,
    overallProgress,
    addGoal,
    deleteGoal,
    updateGoal,
    addStep,
    toggleStep,
    deleteStep,
    refetch: reload,
  };
}
