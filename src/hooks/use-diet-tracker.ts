"use client";

import { useState, useCallback } from "react";
import type { DietTrackerMeal, DietTrackerWater, DietTrackerDayLog, DietMealType } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

type DietTrackerStorage = {
  meals: DietTrackerMeal[];
  waterLogs: DietTrackerWater[];
};

function storageKey(memberId: string): string {
  return `dancebase:diet-tracker:${memberId}`;
}

function loadData(memberId: string): DietTrackerStorage {
  if (typeof window === "undefined") return { meals: [], waterLogs: [] };
  try {
    const raw = localStorage.getItem(storageKey(memberId));
    if (!raw) return { meals: [], waterLogs: [] };
    return JSON.parse(raw) as DietTrackerStorage;
  } catch {
    return { meals: [], waterLogs: [] };
  }
}

function saveData(memberId: string, data: DietTrackerStorage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(memberId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type DietTrackerStats = {
  totalMeals: number;
  averageCalories: number;
  averageWaterCups: number;
  weeklyMealCount: number; // 최근 7일 식사 수
};

// ============================================================
// 통계 계산
// ============================================================

function calcStats(
  meals: DietTrackerMeal[],
  waterLogs: DietTrackerWater[]
): DietTrackerStats {
  const totalMeals = meals.length;

  const mealsWithCalories = meals.filter(
    (m) => typeof m.calories === "number" && m.calories > 0
  );
  const averageCalories =
    mealsWithCalories.length > 0
      ? Math.round(
          mealsWithCalories.reduce((s, m) => s + (m.calories ?? 0), 0) /
            mealsWithCalories.length
        )
      : 0;

  const averageWaterCups =
    waterLogs.length > 0
      ? Math.round(
          (waterLogs.reduce((s, w) => s + w.cups, 0) / waterLogs.length) * 10
        ) / 10
      : 0;

  // 최근 7일 (오늘 포함)
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);
  const weeklyMealCount = meals.filter((m) => m.date >= sevenDaysAgoStr).length;

  return { totalMeals, averageCalories, averageWaterCups, weeklyMealCount };
}

// ============================================================
// 훅
// ============================================================

export function useDietTracker(memberId: string) {
  const [meals, setMeals] = useState<DietTrackerMeal[]>(() => loadData(memberId).meals);
  const [waterLogs, setWaterLogs] = useState<DietTrackerWater[]>([]);

  const reload = useCallback(() => {
    if (!memberId) return;
    const data = loadData(memberId);
    setMeals(data.meals);
    setWaterLogs(data.waterLogs);
  }, [memberId]);

  const persist = useCallback(
    (nextMeals: DietTrackerMeal[], nextWaterLogs: DietTrackerWater[]) => {
      saveData(memberId, { meals: nextMeals, waterLogs: nextWaterLogs });
      setMeals(nextMeals);
      setWaterLogs(nextWaterLogs);
    },
    [memberId]
  );

  // 식사 추가
  const addMeal = useCallback(
    (input: Omit<DietTrackerMeal, "id">): DietTrackerMeal => {
      const meal: DietTrackerMeal = {
        ...input,
        id: crypto.randomUUID(),
      };
      const next = [...meals, meal];
      persist(next, waterLogs);
      return meal;
    },
    [meals, waterLogs, persist]
  );

  // 식사 수정
  const updateMeal = useCallback(
    (
      id: string,
      patch: Partial<Omit<DietTrackerMeal, "id">>
    ): boolean => {
      const idx = meals.findIndex((m) => m.id === id);
      if (idx === -1) return false;
      const next = meals.map((m) => (m.id === id ? { ...m, ...patch } : m));
      persist(next, waterLogs);
      return true;
    },
    [meals, waterLogs, persist]
  );

  // 식사 삭제
  const deleteMeal = useCallback(
    (id: string): boolean => {
      const next = meals.filter((m) => m.id !== id);
      if (next.length === meals.length) return false;
      persist(next, waterLogs);
      return true;
    },
    [meals, waterLogs, persist]
  );

  // 수분 섭취 설정 (해당 날짜의 잔 수 업데이트)
  const setWater = useCallback(
    (date: string, cups: number): void => {
      const existing = waterLogs.find((w) => w.date === date);
      let next: DietTrackerWater[];
      if (existing) {
        next = waterLogs.map((w) =>
          w.date === date ? { ...w, cups } : w
        );
      } else {
        next = [...waterLogs, { date, cups }];
      }
      persist(meals, next);
    },
    [meals, waterLogs, persist]
  );

  // 특정 날짜의 하루 기록 반환
  const getDayLog = useCallback(
    (date: string, memberName: string = ""): DietTrackerDayLog => {
      const dayMeals = meals.filter((m) => m.date === date);
      const water = waterLogs.find((w) => w.date === date) ?? {
        date,
        cups: 0,
      };
      return { date, meals: dayMeals, water, memberName };
    },
    [meals, waterLogs]
  );

  // 최근 7일 날짜별 칼로리 합산 (주간 요약용)
  const getWeeklyCalories = useCallback((): Array<{
    date: string;
    calories: number;
  }> => {
    const result: Array<{ date: string; calories: number }> = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayMeals = meals.filter((m) => m.date === dateStr);
      const calories = dayMeals.reduce((s, m) => s + (m.calories ?? 0), 0);
      result.push({ date: dateStr, calories });
    }
    return result;
  }, [meals]);

  const stats = calcStats(meals, waterLogs);

  return {
    meals,
    waterLogs,
    loading: false,
    addMeal,
    updateMeal,
    deleteMeal,
    setWater,
    getDayLog,
    getWeeklyCalories,
    stats,
    refetch: reload,
  };
}
