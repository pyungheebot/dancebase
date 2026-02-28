"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import {
  DanceNutritionData,
  DanceNutritionEntry,
  DanceNutritionGoal,
  DanceNutritionMealTime,
} from "@/types";

const DEFAULT_GOAL: DanceNutritionGoal = {
  targetCalories: 2000,
  targetWater: 2000,
};

function loadData(memberId: string): DanceNutritionData {
  if (typeof window === "undefined") {
    return {
      memberId,
      entries: [],
      goal: DEFAULT_GOAL,
      updatedAt: new Date().toISOString(),
    };
  }
  const raw = localStorage.getItem(`dance-nutrition-${memberId}`);
  if (!raw) {
    return {
      memberId,
      entries: [],
      goal: DEFAULT_GOAL,
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    return JSON.parse(raw) as DanceNutritionData;
  } catch {
    return {
      memberId,
      entries: [],
      goal: DEFAULT_GOAL,
      updatedAt: new Date().toISOString(),
    };
  }
}

function saveData(data: DanceNutritionData): void {
  localStorage.setItem(
    `dance-nutrition-${data.memberId}`,
    JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
  );
}

export function useDanceNutrition(memberId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.danceNutrition(memberId),
    () => loadData(memberId)
  );

  const current: DanceNutritionData = data ?? {
    memberId,
    entries: [],
    goal: DEFAULT_GOAL,
    updatedAt: new Date().toISOString(),
  };

  function addEntry(
    entry: Omit<DanceNutritionEntry, "id" | "createdAt">
  ): void {
    const next: DanceNutritionData = {
      ...current,
      entries: [
        ...current.entries,
        {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
      ],
    };
    saveData(next);
    mutate(next, false);
  }

  function updateEntry(
    id: string,
    patch: Partial<Omit<DanceNutritionEntry, "id" | "createdAt">>
  ): void {
    const next: DanceNutritionData = {
      ...current,
      entries: current.entries.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    };
    saveData(next);
    mutate(next, false);
  }

  function deleteEntry(id: string): void {
    const next: DanceNutritionData = {
      ...current,
      entries: current.entries.filter((e) => e.id !== id),
    };
    saveData(next);
    mutate(next, false);
  }

  function updateGoal(goal: DanceNutritionGoal): void {
    const next: DanceNutritionData = { ...current, goal };
    saveData(next);
    mutate(next, false);
  }

  /** 날짜(YYYY-MM-DD) 기준으로 기록 필터링 */
  function getEntriesByDate(date: string): DanceNutritionEntry[] {
    return current.entries.filter((e) => e.date === date);
  }

  /** 식사 시간별 칼로리 합계 (해당 날짜) */
  function getMealCaloriesByDate(
    date: string
  ): Record<DanceNutritionMealTime, number> {
    const entries = getEntriesByDate(date);
    return {
      breakfast: entries
        .filter((e) => e.mealTime === "breakfast")
        .reduce((s, e) => s + e.calories, 0),
      lunch: entries
        .filter((e) => e.mealTime === "lunch")
        .reduce((s, e) => s + e.calories, 0),
      dinner: entries
        .filter((e) => e.mealTime === "dinner")
        .reduce((s, e) => s + e.calories, 0),
      snack: entries
        .filter((e) => e.mealTime === "snack")
        .reduce((s, e) => s + e.calories, 0),
    };
  }

  /** 날짜 기준 총 칼로리 */
  function getTotalCaloriesByDate(date: string): number {
    return getEntriesByDate(date).reduce((s, e) => s + e.calories, 0);
  }

  /** 날짜 기준 총 수분 섭취 (ml) */
  function getTotalWaterByDate(date: string): number {
    return getEntriesByDate(date).reduce((s, e) => s + e.water, 0);
  }

  /** 최근 7일 날짜 배열 (오늘 포함, 오래된 날짜부터) */
  function getLast7Days(): string[] {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }

  /** 주간 평균 칼로리 */
  function getWeeklyAvgCalories(): number {
    const days = getLast7Days();
    const totals = days.map((d) => getTotalCaloriesByDate(d));
    const activeDays = totals.filter((t) => t > 0);
    if (activeDays.length === 0) return 0;
    return Math.round(activeDays.reduce((s, v) => s + v, 0) / activeDays.length);
  }

  /** 주간 평균 단백질 (g) */
  function getWeeklyAvgProtein(): number {
    const days = getLast7Days();
    const totals = days.map((d) =>
      getEntriesByDate(d).reduce((s, e) => s + e.protein, 0)
    );
    const activeDays = totals.filter((t) => t > 0);
    if (activeDays.length === 0) return 0;
    return Math.round(activeDays.reduce((s, v) => s + v, 0) / activeDays.length);
  }

  return {
    data: current,
    loading: isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    updateGoal,
    getEntriesByDate,
    getMealCaloriesByDate,
    getTotalCaloriesByDate,
    getTotalWaterByDate,
    getLast7Days,
    getWeeklyAvgCalories,
    getWeeklyAvgProtein,
    refetch: () => mutate(),
  };
}
