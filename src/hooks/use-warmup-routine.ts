"use client";

import { useState, useCallback, useEffect } from "react";
import type { WarmupRoutine, WarmupExercise, WarmupExerciseType } from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:warmup-routine:";

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadRoutines(groupId: string): WarmupRoutine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as WarmupRoutine[];
  } catch {
    return [];
  }
}

function saveRoutines(groupId: string, routines: WarmupRoutine[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(routines));
  } catch {
    // 저장 실패 시 무시
  }
}

function calcTotalDuration(exercises: WarmupExercise[]): number {
  return exercises.reduce((sum, ex) => sum + ex.duration, 0);
}

// ============================================
// 훅
// ============================================

export function useWarmupRoutine(groupId: string) {
  const [routines, setRoutines] = useState<WarmupRoutine[]>([]);

  // 초기 로드
  useEffect(() => {
    setRoutines(loadRoutines(groupId));
  }, [groupId]);

  // 상태 업데이트 + localStorage 동기화
  const updateRoutines = useCallback(
    (updater: (prev: WarmupRoutine[]) => WarmupRoutine[]) => {
      setRoutines((prev) => {
        const next = updater(prev);
        saveRoutines(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  // 루틴 생성
  const createRoutine = useCallback(
    (name: string, createdBy: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const newRoutine: WarmupRoutine = {
        id: crypto.randomUUID(),
        name: trimmed,
        exercises: [],
        totalDuration: 0,
        createdBy: createdBy.trim() || "나",
        createdAt: new Date().toISOString(),
      };
      updateRoutines((prev) => [...prev, newRoutine]);
    },
    [updateRoutines]
  );

  // 루틴 삭제
  const deleteRoutine = useCallback(
    (routineId: string) => {
      updateRoutines((prev) => prev.filter((r) => r.id !== routineId));
    },
    [updateRoutines]
  );

  // 운동 추가
  const addExercise = useCallback(
    (
      routineId: string,
      name: string,
      type: WarmupExerciseType,
      duration: number,
      repetitions?: number,
      description?: string,
      bodyPart?: string
    ) => {
      updateRoutines((prev) =>
        prev.map((r) => {
          if (r.id !== routineId) return r;
          const maxOrder =
            r.exercises.length > 0
              ? Math.max(...r.exercises.map((e) => e.order))
              : 0;
          const newExercise: WarmupExercise = {
            id: crypto.randomUUID(),
            name: name.trim(),
            type,
            duration,
            repetitions,
            description: description?.trim() || undefined,
            bodyPart: bodyPart?.trim() || "전신",
            order: maxOrder + 1,
          };
          const updatedExercises = [...r.exercises, newExercise];
          return {
            ...r,
            exercises: updatedExercises,
            totalDuration: calcTotalDuration(updatedExercises),
          };
        })
      );
    },
    [updateRoutines]
  );

  // 운동 제거
  const removeExercise = useCallback(
    (routineId: string, exerciseId: string) => {
      updateRoutines((prev) =>
        prev.map((r) => {
          if (r.id !== routineId) return r;
          const filtered = r.exercises.filter((e) => e.id !== exerciseId);
          const reordered = [...filtered]
            .sort((a, b) => a.order - b.order)
            .map((e, idx) => ({ ...e, order: idx + 1 }));
          return {
            ...r,
            exercises: reordered,
            totalDuration: calcTotalDuration(reordered),
          };
        })
      );
    },
    [updateRoutines]
  );

  // 순서 변경
  const moveExercise = useCallback(
    (routineId: string, exerciseId: string, direction: "up" | "down") => {
      updateRoutines((prev) =>
        prev.map((r) => {
          if (r.id !== routineId) return r;
          const sorted = [...r.exercises].sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((e) => e.id === exerciseId);
          if (idx === -1) return r;
          if (direction === "up" && idx === 0) return r;
          if (direction === "down" && idx === sorted.length - 1) return r;

          const swapIdx = direction === "up" ? idx - 1 : idx + 1;
          const newSorted = [...sorted];
          const tempOrder = newSorted[idx].order;
          newSorted[idx] = { ...newSorted[idx], order: newSorted[swapIdx].order };
          newSorted[swapIdx] = { ...newSorted[swapIdx], order: tempOrder };

          return { ...r, exercises: newSorted };
        })
      );
    },
    [updateRoutines]
  );

  // 통계
  const totalRoutines = routines.length;
  const totalExercises = routines.reduce(
    (sum, r) => sum + r.exercises.length,
    0
  );

  return {
    routines,
    totalRoutines,
    totalExercises,
    createRoutine,
    deleteRoutine,
    addExercise,
    removeExercise,
    moveExercise,
  };
}
