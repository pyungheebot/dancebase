"use client";

import { useCallback, useState, useEffect } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceGoal,
  DanceGoalCategory,
  DanceGoalMilestone,
  DanceGoalPriority,
  DanceGoalStatus,
  DanceGoalTrackerData,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.danceGoalTracker(memberId);
}

function loadData(memberId: string): DanceGoalTrackerData {
  if (typeof window === "undefined") {
    return { memberId, goals: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    if (!raw) {
      return { memberId, goals: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as DanceGoalTrackerData;
  } catch {
    return { memberId, goals: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(memberId: string, data: DanceGoalTrackerData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(memberId), JSON.stringify(data));
  } catch {
    // 저장 실패 시 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useDanceGoal(memberId: string) {
  const [goals, setGoals] = useState<DanceGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    const data = loadData(memberId);
    setGoals(data.goals);
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 내부 persist 헬퍼
  const persist = useCallback(
    (nextGoals: DanceGoal[]) => {
      const now = new Date().toISOString();
      saveData(memberId, { memberId, goals: nextGoals, updatedAt: now });
      setGoals(nextGoals);
    },
    [memberId]
  );

  // ────────────────────────────────────────────
  // 목표 CRUD
  // ────────────────────────────────────────────

  /** 목표 생성 */
  const createGoal = useCallback(
    (params: {
      title: string;
      description?: string;
      category: DanceGoalCategory;
      priority: DanceGoalPriority;
      targetDate?: string | null;
    }): DanceGoal => {
      const now = new Date().toISOString();
      const newGoal: DanceGoal = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        description: params.description?.trim() ?? "",
        category: params.category,
        priority: params.priority,
        milestones: [],
        targetDate: params.targetDate ?? null,
        progress: 0,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      persist([...goals, newGoal]);
      return newGoal;
    },
    [goals, persist]
  );

  /** 목표 수정 */
  const updateGoal = useCallback(
    (
      goalId: string,
      patch: Partial<
        Pick<
          DanceGoal,
          | "title"
          | "description"
          | "category"
          | "priority"
          | "targetDate"
          | "progress"
          | "status"
        >
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

  /** 목표 삭제 */
  const deleteGoal = useCallback(
    (goalId: string): void => {
      persist(goals.filter((g) => g.id !== goalId));
    },
    [goals, persist]
  );

  // ────────────────────────────────────────────
  // 마일스톤 관리
  // ────────────────────────────────────────────

  /** 마일스톤 추가 */
  const addMilestone = useCallback(
    (goalId: string, title: string): void => {
      const now = new Date().toISOString();
      const newMilestone: DanceGoalMilestone = {
        id: crypto.randomUUID(),
        title: title.trim(),
        isCompleted: false,
        completedAt: null,
      };
      const next = goals.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = [...g.milestones, newMilestone];
        return {
          ...g,
          milestones: updatedMilestones,
          progress: calcProgressFromMilestones(updatedMilestones, g.progress),
          updatedAt: now,
        };
      });
      persist(next);
    },
    [goals, persist]
  );

  /** 마일스톤 완료 토글 */
  const toggleMilestone = useCallback(
    (goalId: string, milestoneId: string): void => {
      const now = new Date().toISOString();
      const next = goals.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                isCompleted: !m.isCompleted,
                completedAt: !m.isCompleted ? now : null,
              }
            : m
        );
        return {
          ...g,
          milestones: updatedMilestones,
          progress: calcProgressFromMilestones(updatedMilestones, g.progress),
          updatedAt: now,
        };
      });
      persist(next);
    },
    [goals, persist]
  );

  /** 마일스톤 제거 */
  const removeMilestone = useCallback(
    (goalId: string, milestoneId: string): void => {
      const now = new Date().toISOString();
      const next = goals.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.filter(
          (m) => m.id !== milestoneId
        );
        return {
          ...g,
          milestones: updatedMilestones,
          progress: calcProgressFromMilestones(updatedMilestones, g.progress),
          updatedAt: now,
        };
      });
      persist(next);
    },
    [goals, persist]
  );

  // ────────────────────────────────────────────
  // 진행률 / 상태
  // ────────────────────────────────────────────

  /** 진행률 직접 수정 (마일스톤 없는 목표용) */
  const updateProgress = useCallback(
    (goalId: string, progress: number): void => {
      const clamped = Math.min(100, Math.max(0, Math.round(progress)));
      const now = new Date().toISOString();
      const next = goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              progress: clamped,
              status:
                clamped >= 100 ? ("completed" as DanceGoalStatus) : g.status,
              updatedAt: now,
            }
          : g
      );
      persist(next);
    },
    [goals, persist]
  );

  /** 상태 변경 */
  const changeStatus = useCallback(
    (goalId: string, status: DanceGoalStatus): void => {
      updateGoal(goalId, { status });
    },
    [updateGoal]
  );

  // ────────────────────────────────────────────
  // 통계
  // ────────────────────────────────────────────

  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => g.status === "active").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const pausedGoals = goals.filter((g) => g.status === "paused").length;

  const averageProgress =
    totalGoals === 0
      ? 0
      : Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals);

  /** 카테고리별 분포 */
  const categoryDistribution: {
    category: DanceGoalCategory;
    label: string;
    count: number;
    percent: number;
  }[] = (() => {
    const categoryLabels: Record<DanceGoalCategory, string> = {
      technique: "기술",
      flexibility: "유연성",
      strength: "체력",
      performance: "퍼포먼스",
      choreography: "안무",
      other: "기타",
    };
    const catMap = new Map<DanceGoalCategory, number>();
    goals.forEach((g) => {
      catMap.set(g.category, (catMap.get(g.category) ?? 0) + 1);
    });
    const total = goals.length || 1;
    return (Object.keys(categoryLabels) as DanceGoalCategory[])
      .filter((c) => catMap.has(c))
      .map((c) => ({
        category: c,
        label: categoryLabels[c],
        count: catMap.get(c) ?? 0,
        percent: Math.round(((catMap.get(c) ?? 0) / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  })();

  return {
    goals,
    loading,
    // 목표 CRUD
    createGoal,
    updateGoal,
    deleteGoal,
    // 마일스톤
    addMilestone,
    toggleMilestone,
    removeMilestone,
    // 진행률 / 상태
    updateProgress,
    changeStatus,
    // 통계
    totalGoals,
    activeGoals,
    completedGoals,
    pausedGoals,
    averageProgress,
    categoryDistribution,
    refetch: reload,
  };
}

// ────────────────────────────────────────────
// 내부 헬퍼
// ────────────────────────────────────────────

/** 마일스톤 완료 비율로 진행률 계산 */
function calcProgressFromMilestones(
  milestones: DanceGoalMilestone[],
  fallback: number
): number {
  if (milestones.length === 0) return fallback;
  const done = milestones.filter((m) => m.isCompleted).length;
  return Math.round((done / milestones.length) * 100);
}
