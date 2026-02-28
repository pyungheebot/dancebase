"use client";

import { useState, useEffect, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceRoutine,
  DanceRoutineData,
  RoutineStep,
  RoutineStepCategory,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(memberId: string): string {
  return swrKeys.danceRoutineBuilder(memberId);
}

function loadData(memberId: string): DanceRoutineData {
  if (typeof window === "undefined") {
    return { memberId, routines: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(memberId));
    if (!raw)
      return { memberId, routines: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as DanceRoutineData;
  } catch {
    return { memberId, routines: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: DanceRoutineData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.memberId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type DanceRoutineStats = {
  /** 전체 루틴 수 */
  totalRoutines: number;
  /** 즐겨찾기 루틴 수 */
  favoritedCount: number;
  /** 평균 소요시간 (분) */
  avgMinutes: number;
  /** 카테고리별 스텝 분포 */
  categoryDistribution: { category: RoutineStepCategory; count: number }[];
};

// ============================================================
// 훅
// ============================================================

export function useDanceRoutineBuilder(memberId: string) {
  const [routines, setRoutines] = useState<DanceRoutine[]>([]);
  const [loading, setLoading] = useState(true);

  // localStorage에서 데이터 불러오기
  const reload = useCallback(() => {
    if (!memberId) return;
    const data = loadData(memberId);
    setRoutines(data.routines);
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 내부 저장 헬퍼
  const persist = useCallback(
    (updated: DanceRoutine[]) => {
      const data: DanceRoutineData = {
        memberId,
        routines: updated,
        updatedAt: new Date().toISOString(),
      };
      saveData(data);
      setRoutines(updated);
    },
    [memberId]
  );

  // ── 루틴 추가 ──────────────────────────────────────────────
  const addRoutine = useCallback(
    (params: {
      title: string;
      purpose?: string;
      estimatedMinutes: number;
    }): DanceRoutine => {
      const now = new Date().toISOString();
      const newRoutine: DanceRoutine = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        purpose: params.purpose?.trim() || undefined,
        estimatedMinutes: params.estimatedMinutes,
        favorited: false,
        steps: [],
        createdAt: now,
        updatedAt: now,
      };
      persist([...routines, newRoutine]);
      return newRoutine;
    },
    [routines, persist]
  );

  // ── 루틴 수정 ──────────────────────────────────────────────
  const updateRoutine = useCallback(
    (
      routineId: string,
      params: Partial<Omit<DanceRoutine, "id" | "steps" | "createdAt">>
    ): boolean => {
      const idx = routines.findIndex((r) => r.id === routineId);
      if (idx === -1) return false;
      const updated = routines.map((r) =>
        r.id === routineId
          ? { ...r, ...params, updatedAt: new Date().toISOString() }
          : r
      );
      persist(updated);
      return true;
    },
    [routines, persist]
  );

  // ── 루틴 삭제 ──────────────────────────────────────────────
  const deleteRoutine = useCallback(
    (routineId: string): boolean => {
      const exists = routines.some((r) => r.id === routineId);
      if (!exists) return false;
      persist(routines.filter((r) => r.id !== routineId));
      return true;
    },
    [routines, persist]
  );

  // ── 즐겨찾기 토글 ──────────────────────────────────────────
  const toggleFavorite = useCallback(
    (routineId: string): boolean => {
      const routine = routines.find((r) => r.id === routineId);
      if (!routine) return false;
      return updateRoutine(routineId, { favorited: !routine.favorited });
    },
    [routines, updateRoutine]
  );

  // ── 스텝 추가 ──────────────────────────────────────────────
  const addStep = useCallback(
    (
      routineId: string,
      params: {
        name: string;
        category: RoutineStepCategory;
        sets: number;
        reps: number;
        repUnit: "reps" | "seconds";
        memo?: string;
      }
    ): boolean => {
      const routine = routines.find((r) => r.id === routineId);
      if (!routine) return false;
      const newStep: RoutineStep = {
        id: crypto.randomUUID(),
        name: params.name.trim(),
        category: params.category,
        sets: params.sets,
        reps: params.reps,
        repUnit: params.repUnit,
        memo: params.memo?.trim() || undefined,
        order: routine.steps.length + 1,
      };
      const updated = routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              steps: [...r.steps, newStep],
              updatedAt: new Date().toISOString(),
            }
          : r
      );
      persist(updated);
      return true;
    },
    [routines, persist]
  );

  // ── 스텝 삭제 ──────────────────────────────────────────────
  const deleteStep = useCallback(
    (routineId: string, stepId: string): boolean => {
      const routine = routines.find((r) => r.id === routineId);
      if (!routine) return false;
      const filtered = routine.steps
        .filter((s) => s.id !== stepId)
        .map((s, i) => ({ ...s, order: i + 1 }));
      const updated = routines.map((r) =>
        r.id === routineId
          ? { ...r, steps: filtered, updatedAt: new Date().toISOString() }
          : r
      );
      persist(updated);
      return true;
    },
    [routines, persist]
  );

  // ── 스텝 순서 변경 (위/아래 이동) ─────────────────────────
  const moveStep = useCallback(
    (routineId: string, stepId: string, direction: "up" | "down"): boolean => {
      const routine = routines.find((r) => r.id === routineId);
      if (!routine) return false;
      const idx = routine.steps.findIndex((s) => s.id === stepId);
      if (idx === -1) return false;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= routine.steps.length) return false;

      const newSteps = [...routine.steps];
      [newSteps[idx], newSteps[targetIdx]] = [
        newSteps[targetIdx],
        newSteps[idx],
      ];
      const reordered = newSteps.map((s, i) => ({ ...s, order: i + 1 }));

      const updated = routines.map((r) =>
        r.id === routineId
          ? { ...r, steps: reordered, updatedAt: new Date().toISOString() }
          : r
      );
      persist(updated);
      return true;
    },
    [routines, persist]
  );

  // ── 통계 계산 ──────────────────────────────────────────────
  const stats: DanceRoutineStats = (() => {
    if (routines.length === 0) {
      return {
        totalRoutines: 0,
        favoritedCount: 0,
        avgMinutes: 0,
        categoryDistribution: [],
      };
    }

    const favoritedCount = routines.filter((r) => r.favorited).length;
    const avgMinutes =
      Math.round(
        (routines.reduce((acc, r) => acc + r.estimatedMinutes, 0) /
          routines.length) *
          10
      ) / 10;

    const categories: RoutineStepCategory[] = [
      "warmup",
      "stretching",
      "technique",
      "choreography",
      "cooldown",
    ];
    const allSteps = routines.flatMap((r) => r.steps);
    const categoryDistribution = categories
      .map((category) => ({
        category,
        count: allSteps.filter((s) => s.category === category).length,
      }))
      .filter((c) => c.count > 0);

    return {
      totalRoutines: routines.length,
      favoritedCount,
      avgMinutes,
      categoryDistribution,
    };
  })();

  return {
    routines,
    loading,
    stats,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    toggleFavorite,
    addStep,
    deleteStep,
    moveStep,
    refetch: reload,
  };
}
