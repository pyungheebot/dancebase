"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  PracticeGoalBoardData,
  PracticeGoalEntry,
  PracticeGoalCategory,
  PracticeGoalStatus,
  PracticeGoalSubTask,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:practice-goal-board:${groupId}`;
}

// ============================================
// 추가 파라미터 타입 (export)
// ============================================

export type AddGoalParams = {
  title: string;
  description?: string;
  category: PracticeGoalCategory;
  dueDate?: string;
  progress?: number;
  assignees?: string[];
};

// ============================================
// 훅
// ============================================

export function usePracticeGoalBoard(groupId: string) {
  const fallback: PracticeGoalBoardData = {
    groupId,
    entries: [],
    updatedAt: new Date().toISOString(),
  };

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.practiceGoalBoard(groupId) : null,
    () => loadFromStorage<PracticeGoalBoardData>(storageKey(groupId), {} as PracticeGoalBoardData),
    { fallbackData: fallback, revalidateOnFocus: false }
  );

  const current: PracticeGoalBoardData = data ?? fallback;

  // ── 내부 저장 헬퍼 ──────────────────────────────────────

  const persist = useCallback(
    (next: PracticeGoalBoardData) => {
      const withTs: PracticeGoalBoardData = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), withTs);
      mutate(withTs, false);
    },
    [groupId, mutate]
  );

  // ── 목표 추가 ────────────────────────────────────────────

  const addGoal = useCallback(
    (params: AddGoalParams): boolean => {
      const title = params.title.trim();
      if (!title) return false;
      const now = new Date().toISOString();
      const newEntry: PracticeGoalEntry = {
        id: crypto.randomUUID(),
        title,
        description: params.description?.trim() || undefined,
        category: params.category,
        dueDate: params.dueDate || undefined,
        progress: params.progress ?? 0,
        status: "active",
        assignees: (params.assignees ?? []).filter(Boolean),
        subTasks: [],
        createdAt: now,
        updatedAt: now,
      };
      persist({
        ...current,
        entries: [...current.entries, newEntry],
      });
      return true;
    },
    [current, persist]
  );

  // ── 목표 수정 ────────────────────────────────────────────

  const updateGoal = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          PracticeGoalEntry,
          | "title"
          | "description"
          | "category"
          | "dueDate"
          | "progress"
          | "status"
          | "assignees"
        >
      >
    ): void => {
      persist({
        ...current,
        entries: current.entries.map((e) =>
          e.id === id
            ? { ...e, ...patch, updatedAt: new Date().toISOString() }
            : e
        ),
      });
    },
    [current, persist]
  );

  // ── 목표 삭제 ────────────────────────────────────────────

  const deleteGoal = useCallback(
    (id: string): void => {
      persist({
        ...current,
        entries: current.entries.filter((e) => e.id !== id),
      });
    },
    [current, persist]
  );

  // ── 진행률 변경 ──────────────────────────────────────────

  const setProgress = useCallback(
    (id: string, progress: number): void => {
      const clamped = Math.max(0, Math.min(100, progress));
      const statusPatch: Partial<PracticeGoalEntry> =
        clamped === 100 ? { status: "completed" as PracticeGoalStatus } : {};
      persist({
        ...current,
        entries: current.entries.map((e) =>
          e.id === id
            ? {
                ...e,
                progress: clamped,
                ...statusPatch,
                updatedAt: new Date().toISOString(),
              }
            : e
        ),
      });
    },
    [current, persist]
  );

  // ── 상태 변경 ────────────────────────────────────────────

  const setStatus = useCallback(
    (id: string, status: PracticeGoalStatus): void => {
      persist({
        ...current,
        entries: current.entries.map((e) =>
          e.id === id
            ? {
                ...e,
                status,
                progress: status === "completed" ? 100 : e.progress,
                updatedAt: new Date().toISOString(),
              }
            : e
        ),
      });
    },
    [current, persist]
  );

  // ── 하위 목표 추가 ───────────────────────────────────────

  const addSubTask = useCallback(
    (goalId: string, title: string): boolean => {
      const t = title.trim();
      if (!t) return false;
      const newSub: PracticeGoalSubTask = {
        id: crypto.randomUUID(),
        title: t,
        done: false,
      };
      persist({
        ...current,
        entries: current.entries.map((e) =>
          e.id === goalId
            ? {
                ...e,
                subTasks: [...e.subTasks, newSub],
                updatedAt: new Date().toISOString(),
              }
            : e
        ),
      });
      return true;
    },
    [current, persist]
  );

  // ── 하위 목표 토글 ───────────────────────────────────────

  const toggleSubTask = useCallback(
    (goalId: string, subTaskId: string): void => {
      persist({
        ...current,
        entries: current.entries.map((e) => {
          if (e.id !== goalId) return e;
          const updatedSubs = e.subTasks.map((s) =>
            s.id === subTaskId ? { ...s, done: !s.done } : s
          );
          // 하위 목표 기반 진행률 자동 계산
          const doneCount = updatedSubs.filter((s) => s.done).length;
          const autoProgress =
            updatedSubs.length === 0
              ? e.progress
              : Math.round((doneCount / updatedSubs.length) * 100);
          return {
            ...e,
            subTasks: updatedSubs,
            progress: autoProgress,
            status:
              autoProgress === 100
                ? ("completed" as PracticeGoalStatus)
                : e.status === "completed"
                ? ("active" as PracticeGoalStatus)
                : e.status,
            updatedAt: new Date().toISOString(),
          };
        }),
      });
    },
    [current, persist]
  );

  // ── 하위 목표 삭제 ───────────────────────────────────────

  const deleteSubTask = useCallback(
    (goalId: string, subTaskId: string): void => {
      persist({
        ...current,
        entries: current.entries.map((e) => {
          if (e.id !== goalId) return e;
          const updatedSubs = e.subTasks.filter((s) => s.id !== subTaskId);
          const doneCount = updatedSubs.filter((s) => s.done).length;
          const autoProgress =
            updatedSubs.length === 0
              ? e.progress
              : Math.round((doneCount / updatedSubs.length) * 100);
          return {
            ...e,
            subTasks: updatedSubs,
            progress: autoProgress,
            updatedAt: new Date().toISOString(),
          };
        }),
      });
    },
    [current, persist]
  );

  // ── 상태별 그룹핑 ────────────────────────────────────────

  const grouped = {
    active: current.entries.filter((e) => e.status === "active"),
    completed: current.entries.filter((e) => e.status === "completed"),
    paused: current.entries.filter((e) => e.status === "paused"),
  };

  // ── 통계 ─────────────────────────────────────────────────

  const total = current.entries.length;
  const completedCount = grouped.completed.length;
  const avgProgress =
    total === 0
      ? 0
      : Math.round(
          current.entries.reduce((sum, e) => sum + e.progress, 0) / total
        );

  const stats = {
    total,
    activeCount: grouped.active.length,
    completedCount,
    pausedCount: grouped.paused.length,
    avgProgress,
    completionRate: total === 0 ? 0 : Math.round((completedCount / total) * 100),
  };

  return {
    data: current,
    entries: current.entries,
    grouped,
    stats,
    loading: isLoading,
    refetch: () => mutate(),
    // CRUD
    addGoal,
    updateGoal,
    deleteGoal,
    // 진행률/상태
    setProgress,
    setStatus,
    // 하위 목표
    addSubTask,
    toggleSubTask,
    deleteSubTask,
  };
}
