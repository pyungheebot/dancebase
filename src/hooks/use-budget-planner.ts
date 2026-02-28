"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  BudgetPlannerCategory,
  BudgetPlannerItem,
  BudgetPlannerPlan,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:budget-planner:${groupId}`;
}

function loadData(groupId: string): BudgetPlannerPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as BudgetPlannerPlan[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: BudgetPlannerPlan[]): void {
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

export type BudgetPlannerCategoryBreakdown = {
  category: BudgetPlannerCategory;
  label: string;
  plannedAmount: number;
  actualAmount: number;
  ratio: number; // actualAmount / plannedAmount (0이면 0)
};

export type BudgetPlannerStats = {
  totalPlanned: number;
  totalActual: number;
  remainingBudget: number;
  overallRatio: number; // totalActual / totalPlanned
  categoryBreakdown: BudgetPlannerCategoryBreakdown[];
};

// ============================================================
// 훅
// ============================================================

export function useBudgetPlanner(groupId: string) {
  const [plans, setPlans] = useState<BudgetPlannerPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setPlans(data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: BudgetPlannerPlan[]) => {
      saveData(groupId, next);
      setPlans(next);
    },
    [groupId]
  );

  // ── 계획(Plan) CRUD ──────────────────────────────────────

  const addPlan = useCallback(
    (title: string, year: number): BudgetPlannerPlan => {
      const now = new Date().toISOString();
      const plan: BudgetPlannerPlan = {
        id: crypto.randomUUID(),
        title,
        year,
        items: [],
        createdAt: now,
        updatedAt: now,
      };
      persist([...plans, plan]);
      return plan;
    },
    [plans, persist]
  );

  const updatePlan = useCallback(
    (planId: string, partial: Partial<Pick<BudgetPlannerPlan, "title" | "year">>): boolean => {
      const idx = plans.findIndex((p) => p.id === planId);
      if (idx === -1) return false;
      const updated = {
        ...plans[idx],
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      const next = [...plans];
      next[idx] = updated;
      persist(next);
      return true;
    },
    [plans, persist]
  );

  const deletePlan = useCallback(
    (planId: string): boolean => {
      const next = plans.filter((p) => p.id !== planId);
      if (next.length === plans.length) return false;
      persist(next);
      return true;
    },
    [plans, persist]
  );

  // ── 아이템(Item) CRUD ────────────────────────────────────

  const addItem = useCallback(
    (
      planId: string,
      item: Omit<BudgetPlannerItem, "id">
    ): BudgetPlannerItem | null => {
      const idx = plans.findIndex((p) => p.id === planId);
      if (idx === -1) return null;
      const newItem: BudgetPlannerItem = {
        ...item,
        id: crypto.randomUUID(),
      };
      const next = [...plans];
      next[idx] = {
        ...next[idx],
        items: [...next[idx].items, newItem],
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      return newItem;
    },
    [plans, persist]
  );

  const updateItem = useCallback(
    (
      planId: string,
      itemId: string,
      partial: Partial<Omit<BudgetPlannerItem, "id">>
    ): boolean => {
      const planIdx = plans.findIndex((p) => p.id === planId);
      if (planIdx === -1) return false;
      const itemIdx = plans[planIdx].items.findIndex((i) => i.id === itemId);
      if (itemIdx === -1) return false;

      const updatedItems = [...plans[planIdx].items];
      updatedItems[itemIdx] = { ...updatedItems[itemIdx], ...partial };

      const next = [...plans];
      next[planIdx] = {
        ...next[planIdx],
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      return true;
    },
    [plans, persist]
  );

  const deleteItem = useCallback(
    (planId: string, itemId: string): boolean => {
      const planIdx = plans.findIndex((p) => p.id === planId);
      if (planIdx === -1) return false;
      const updatedItems = plans[planIdx].items.filter((i) => i.id !== itemId);
      if (updatedItems.length === plans[planIdx].items.length) return false;

      const next = [...plans];
      next[planIdx] = {
        ...next[planIdx],
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      return true;
    },
    [plans, persist]
  );

  // ── 통계 계산 ────────────────────────────────────────────

  const computeStats = useCallback(
    (planId: string): BudgetPlannerStats => {
      const plan = plans.find((p) => p.id === planId);
      const items = plan?.items ?? [];

      const totalPlanned = items.reduce((s, i) => s + i.plannedAmount, 0);
      const totalActual = items.reduce((s, i) => s + i.actualAmount, 0);
      const remainingBudget = totalPlanned - totalActual;
      const overallRatio = totalPlanned > 0 ? totalActual / totalPlanned : 0;

      const allCategories: BudgetPlannerCategory[] = [
        "costume",
        "venue",
        "equipment",
        "food",
        "transportation",
        "promotion",
        "education",
        "other",
      ];

      const CATEGORY_LABELS: Record<BudgetPlannerCategory, string> = {
        costume: "의상",
        venue: "장소",
        equipment: "장비",
        food: "식비",
        transportation: "교통",
        promotion: "홍보",
        education: "교육",
        other: "기타",
      };

      const categoryBreakdown: BudgetPlannerCategoryBreakdown[] = allCategories
        .map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          const planned = catItems.reduce((s, i) => s + i.plannedAmount, 0);
          const actual = catItems.reduce((s, i) => s + i.actualAmount, 0);
          return {
            category: cat,
            label: CATEGORY_LABELS[cat],
            plannedAmount: planned,
            actualAmount: actual,
            ratio: planned > 0 ? actual / planned : 0,
          };
        })
        .filter((b) => b.plannedAmount > 0 || b.actualAmount > 0);

      return {
        totalPlanned,
        totalActual,
        remainingBudget,
        overallRatio,
        categoryBreakdown,
      };
    },
    [plans]
  );

  return {
    plans,
    loading,
    addPlan,
    updatePlan,
    deletePlan,
    addItem,
    updateItem,
    deleteItem,
    computeStats,
    refetch: reload,
  };
}
