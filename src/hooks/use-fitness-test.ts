"use client";

import { useState, useEffect, useCallback } from "react";
import type { FitnessTestItem, FitnessTestResult, FitnessTestCategory } from "@/types";

// ============================================================
// 상수
// ============================================================

export const FITNESS_CATEGORY_LABELS: Record<FitnessTestCategory, string> = {
  flexibility: "유연성",
  endurance: "지구력",
  strength: "근력",
  balance: "균형",
  agility: "민첩성",
  rhythm: "리듬감",
};

export const FITNESS_CATEGORY_COLORS: Record<
  FitnessTestCategory,
  { badge: string; text: string; bar: string; bg: string }
> = {
  flexibility: {
    badge: "bg-pink-100 text-pink-700 border-pink-300",
    text: "text-pink-600",
    bar: "bg-pink-500",
    bg: "bg-pink-50",
  },
  endurance: {
    badge: "bg-red-100 text-red-700 border-red-300",
    text: "text-red-600",
    bar: "bg-red-500",
    bg: "bg-red-50",
  },
  strength: {
    badge: "bg-orange-100 text-orange-700 border-orange-300",
    text: "text-orange-600",
    bar: "bg-orange-500",
    bg: "bg-orange-50",
  },
  balance: {
    badge: "bg-blue-100 text-blue-700 border-blue-300",
    text: "text-blue-600",
    bar: "bg-blue-500",
    bg: "bg-blue-50",
  },
  agility: {
    badge: "bg-green-100 text-green-700 border-green-300",
    text: "text-green-600",
    bar: "bg-green-500",
    bg: "bg-green-50",
  },
  rhythm: {
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    text: "text-purple-600",
    bar: "bg-purple-500",
    bg: "bg-purple-50",
  },
};

export const FITNESS_CATEGORY_ORDER: FitnessTestCategory[] = [
  "flexibility",
  "endurance",
  "strength",
  "balance",
  "agility",
  "rhythm",
];

// ============================================================
// localStorage 헬퍼
// ============================================================

type StorageData = {
  testItems: FitnessTestItem[];
  results: FitnessTestResult[];
};

function storageKey(groupId: string): string {
  return `dancebase:fitness-test:${groupId}`;
}

function loadData(groupId: string): StorageData {
  if (typeof window === "undefined") return { testItems: [], results: [] };
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return { testItems: [], results: [] };
    return JSON.parse(raw) as StorageData;
  } catch {
    return { testItems: [], results: [] };
  }
}

function saveData(groupId: string, data: StorageData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type FitnessTestStats = {
  totalResults: number;
  averageByCategory: Record<FitnessTestCategory, number | null>;
  topPerformer: Record<FitnessTestCategory, { memberName: string; value: number } | null>;
};

// ============================================================
// 훅
// ============================================================

export function useFitnessTest(groupId: string) {
  const [testItems, setTestItems] = useState<FitnessTestItem[]>([]);
  const [results, setResults] = useState<FitnessTestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setTestItems(data.testItems);
    setResults(data.results);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 내부 저장 헬퍼
  const persist = useCallback(
    (nextItems: FitnessTestItem[], nextResults: FitnessTestResult[]) => {
      saveData(groupId, { testItems: nextItems, results: nextResults });
      setTestItems(nextItems);
      setResults(nextResults);
    },
    [groupId]
  );

  // 테스트 항목 추가
  const addTestItem = useCallback(
    (
      name: string,
      category: FitnessTestCategory,
      unit: string,
      higherIsBetter: boolean
    ): void => {
      if (testItems.some((item) => item.name === name)) return;
      const newItem: FitnessTestItem = { name, category, unit, higherIsBetter };
      persist([...testItems, newItem], results);
    },
    [testItems, results, persist]
  );

  // 항목 삭제 (관련 결과 항목도 정리)
  const deleteTestItem = useCallback(
    (name: string): void => {
      const nextItems = testItems.filter((item) => item.name !== name);
      const nextResults = results.map((r) => ({
        ...r,
        testItems: r.testItems.filter((ti) => ti.itemName !== name),
      }));
      persist(nextItems, nextResults);
    },
    [testItems, results, persist]
  );

  // 결과 기록
  const addResult = useCallback(
    (
      memberName: string,
      date: string,
      items: { itemName: string; value: number; category: FitnessTestCategory }[],
      notes?: string
    ): FitnessTestResult => {
      const newResult: FitnessTestResult = {
        id: crypto.randomUUID(),
        memberName,
        date,
        testItems: items,
        notes,
        createdAt: new Date().toISOString(),
      };
      persist(testItems, [...results, newResult]);
      return newResult;
    },
    [testItems, results, persist]
  );

  // 결과 삭제
  const deleteResult = useCallback(
    (id: string): void => {
      const nextResults = results.filter((r) => r.id !== id);
      persist(testItems, nextResults);
    },
    [testItems, results, persist]
  );

  // 멤버 결과 이력 (날짜 내림차순)
  const getMemberHistory = useCallback(
    (memberName: string): FitnessTestResult[] => {
      return results
        .filter((r) => r.memberName === memberName)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    [results]
  );

  // 두 날짜 비교 - 각 항목별 변화량 반환
  const compareResults = useCallback(
    (
      memberName: string,
      date1: string,
      date2: string
    ): {
      itemName: string;
      category: FitnessTestCategory;
      value1: number | null;
      value2: number | null;
      diff: number | null;
      improved: boolean | null;
    }[] => {
      const result1 = results.find(
        (r) => r.memberName === memberName && r.date === date1
      );
      const result2 = results.find(
        (r) => r.memberName === memberName && r.date === date2
      );

      const allItemNames = new Set([
        ...(result1?.testItems.map((ti) => ti.itemName) ?? []),
        ...(result2?.testItems.map((ti) => ti.itemName) ?? []),
      ]);

      return Array.from(allItemNames).map((itemName) => {
        const ti1 = result1?.testItems.find((ti) => ti.itemName === itemName);
        const ti2 = result2?.testItems.find((ti) => ti.itemName === itemName);
        const category = ti1?.category ?? ti2?.category ?? "flexibility";
        const value1 = ti1?.value ?? null;
        const value2 = ti2?.value ?? null;
        const diff =
          value1 !== null && value2 !== null ? value2 - value1 : null;
        const itemDef = testItems.find((item) => item.name === itemName);
        const higherIsBetter = itemDef?.higherIsBetter ?? true;
        const improved =
          diff === null ? null : higherIsBetter ? diff > 0 : diff < 0;

        return { itemName, category, value1, value2, diff, improved };
      });
    },
    [results, testItems]
  );

  // 통계
  const stats: FitnessTestStats = (() => {
    const totalResults = results.length;

    const averageByCategory: Record<FitnessTestCategory, number | null> = {
      flexibility: null,
      endurance: null,
      strength: null,
      balance: null,
      agility: null,
      rhythm: null,
    };

    const topPerformer: Record<
      FitnessTestCategory,
      { memberName: string; value: number } | null
    > = {
      flexibility: null,
      endurance: null,
      strength: null,
      balance: null,
      agility: null,
      rhythm: null,
    };

    const categoryValues: Record<FitnessTestCategory, number[]> = {
      flexibility: [],
      endurance: [],
      strength: [],
      balance: [],
      agility: [],
      rhythm: [],
    };

    // 카테고리별 최고 성과자 추적 (higherIsBetter 고려)
    const categoryBest: Record<
      FitnessTestCategory,
      { memberName: string; value: number } | null
    > = {
      flexibility: null,
      endurance: null,
      strength: null,
      balance: null,
      agility: null,
      rhythm: null,
    };

    for (const result of results) {
      for (const ti of result.testItems) {
        const cat = ti.category;
        categoryValues[cat].push(ti.value);
        const itemDef = testItems.find((item) => item.name === ti.itemName);
        const higherIsBetter = itemDef?.higherIsBetter ?? true;
        const current = categoryBest[cat];
        if (
          !current ||
          (higherIsBetter && ti.value > current.value) ||
          (!higherIsBetter && ti.value < current.value)
        ) {
          categoryBest[cat] = { memberName: result.memberName, value: ti.value };
        }
      }
    }

    for (const cat of FITNESS_CATEGORY_ORDER) {
      const vals = categoryValues[cat];
      if (vals.length > 0) {
        averageByCategory[cat] =
          Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      }
      topPerformer[cat] = categoryBest[cat];
    }

    return { totalResults, averageByCategory, topPerformer };
  })();

  return {
    testItems,
    results,
    loading,
    addTestItem,
    deleteTestItem,
    addResult,
    deleteResult,
    getMemberHistory,
    compareResults,
    stats,
    refetch: reload,
  };
}
