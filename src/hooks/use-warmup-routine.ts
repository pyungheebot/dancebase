"use client";

import { useState, useCallback } from "react";
import type { WarmupRoutine, WarmupExercise } from "@/types";

const MAX_ROUTINES = 5;
const MAX_EXERCISES = 15;

function getStorageKey(groupId: string): string {
  return `dancebase:warmup:${groupId}`;
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
  return exercises.reduce((sum, ex) => sum + ex.durationSeconds, 0);
}

export function useWarmupRoutine(groupId: string) {
  const [routines, setRoutines] = useState<WarmupRoutine[]>(() =>
    loadRoutines(groupId)
  );

  const persist = useCallback(
    (next: WarmupRoutine[]) => {
      setRoutines(next);
      saveRoutines(groupId, next);
    },
    [groupId]
  );

  // 루틴 추가 (최대 5개)
  const addRoutine = useCallback(
    (title: string): boolean => {
      if (routines.length >= MAX_ROUTINES) return false;
      const newRoutine: WarmupRoutine = {
        id: crypto.randomUUID(),
        title: title.trim(),
        exercises: [],
        totalDuration: 0,
        createdAt: new Date().toISOString(),
      };
      persist([...routines, newRoutine]);
      return true;
    },
    [routines, persist]
  );

  // 루틴 삭제
  const deleteRoutine = useCallback(
    (routineId: string): void => {
      persist(routines.filter((r) => r.id !== routineId));
    },
    [routines, persist]
  );

  // 동작 추가 (루틴당 최대 15개)
  const addExercise = useCallback(
    (
      routineId: string,
      exercise: Omit<WarmupExercise, "id">
    ): boolean => {
      const routine = routines.find((r) => r.id === routineId);
      if (!routine) return false;
      if (routine.exercises.length >= MAX_EXERCISES) return false;

      const newExercise: WarmupExercise = {
        id: crypto.randomUUID(),
        ...exercise,
      };
      const updatedExercises = [...routine.exercises, newExercise];
      const updated = routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              exercises: updatedExercises,
              totalDuration: calcTotalDuration(updatedExercises),
            }
          : r
      );
      persist(updated);
      return true;
    },
    [routines, persist]
  );

  // 동작 삭제
  const removeExercise = useCallback(
    (routineId: string, exerciseId: string): void => {
      const updated = routines.map((r) => {
        if (r.id !== routineId) return r;
        const exercises = r.exercises.filter((ex) => ex.id !== exerciseId);
        return { ...r, exercises, totalDuration: calcTotalDuration(exercises) };
      });
      persist(updated);
    },
    [routines, persist]
  );

  // 동작 순서 변경 (위/아래 이동)
  const reorderExercises = useCallback(
    (routineId: string, fromIndex: number, toIndex: number): void => {
      const routine = routines.find((r) => r.id === routineId);
      if (!routine) return;
      const exercises = [...routine.exercises];
      if (
        fromIndex < 0 ||
        fromIndex >= exercises.length ||
        toIndex < 0 ||
        toIndex >= exercises.length
      )
        return;
      const [moved] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, moved);
      const updated = routines.map((r) =>
        r.id === routineId
          ? { ...r, exercises, totalDuration: calcTotalDuration(exercises) }
          : r
      );
      persist(updated);
    },
    [routines, persist]
  );

  return {
    routines,
    maxRoutines: MAX_ROUTINES,
    maxExercises: MAX_EXERCISES,
    addRoutine,
    deleteRoutine,
    addExercise,
    removeExercise,
    reorderExercises,
  };
}
