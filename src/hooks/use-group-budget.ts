"use client";

import useSWR from "swr";
import { useCallback, useMemo } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  GroupBudgetData,
  GroupBudgetTransaction,
  GroupBudgetCategory,
} from "@/types";

// ============================================================
// 기본 카테고리
// ============================================================

const DEFAULT_CATEGORIES: GroupBudgetCategory[] = [
  { name: "회비", icon: "💰" },
  { name: "연습비", icon: "🏃" },
  { name: "의상비", icon: "👗" },
  { name: "장소대여", icon: "🏢" },
  { name: "식비", icon: "🍱" },
  { name: "교통비", icon: "🚌" },
  { name: "장비구매", icon: "🎵" },
  { name: "공연준비", icon: "🎭" },
  { name: "기타수입", icon: "📥" },
  { name: "기타지출", icon: "📤" },
];

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:group-budget-tracker:${groupId}`;
}

// ============================================================
// 통계 타입
// ============================================================

export type GroupBudgetCategoryBreakdown = {
  category: string;
  icon: string;
  amount: number;
  ratio: number; // 전체 지출 대비 비율 (0~100)
};

export type GroupBudgetStats = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlySpending: number; // 이번 달 지출 합계
  categoryBreakdown: GroupBudgetCategoryBreakdown[];
  recentTransactions: GroupBudgetTransaction[];
};

// ============================================================
// 훅
// ============================================================

export function useGroupBudget(groupId: string) {
  const swrKey = swrKeys.groupBudgetTracker(groupId);

  const { data, mutate, isLoading } = useSWR(
    groupId ? swrKey : null,
    () => loadFromStorage<GroupBudgetData>(storageKey(groupId), {} as GroupBudgetData),
    { revalidateOnFocus: false }
  );

  const budgetData: GroupBudgetData = useMemo(() => data ?? {
    groupId,
    transactions: [],
    categories: DEFAULT_CATEGORIES,
    monthlyBudgetLimit: null,
    updatedAt: new Date().toISOString(),
  }, [data, groupId]);

  // ── 내부 저장 헬퍼 ──────────────────────────────────────

  const persist = useCallback(
    async (next: GroupBudgetData) => {
      saveToStorage(storageKey(groupId), next);
      await mutate(next, { revalidate: false });
    },
    [groupId, mutate]
  );

  // ── 거래 CRUD ────────────────────────────────────────────

  const addTransaction = useCallback(
    async (
      payload: Omit<GroupBudgetTransaction, "id" | "createdAt">
    ): Promise<void> => {
      const newTx: GroupBudgetTransaction = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const next: GroupBudgetData = {
        ...budgetData,
        transactions: [newTx, ...budgetData.transactions],
        updatedAt: new Date().toISOString(),
      };
      await persist(next);
    },
    [budgetData, persist]
  );

  const updateTransaction = useCallback(
    async (
      txId: string,
      partial: Partial<Omit<GroupBudgetTransaction, "id" | "createdAt">>
    ): Promise<boolean> => {
      const idx = budgetData.transactions.findIndex((t) => t.id === txId);
      if (idx === -1) return false;
      const updated = { ...budgetData.transactions[idx], ...partial };
      const txs = [...budgetData.transactions];
      txs[idx] = updated;
      const next: GroupBudgetData = {
        ...budgetData,
        transactions: txs,
        updatedAt: new Date().toISOString(),
      };
      await persist(next);
      return true;
    },
    [budgetData, persist]
  );

  const deleteTransaction = useCallback(
    async (txId: string): Promise<boolean> => {
      const filtered = budgetData.transactions.filter((t) => t.id !== txId);
      if (filtered.length === budgetData.transactions.length) return false;
      const next: GroupBudgetData = {
        ...budgetData,
        transactions: filtered,
        updatedAt: new Date().toISOString(),
      };
      await persist(next);
      return true;
    },
    [budgetData, persist]
  );

  // ── 카테고리 관리 ─────────────────────────────────────────

  const addCategory = useCallback(
    async (category: GroupBudgetCategory): Promise<void> => {
      const exists = budgetData.categories.some(
        (c) => c.name === category.name
      );
      if (exists) return;
      const next: GroupBudgetData = {
        ...budgetData,
        categories: [...budgetData.categories, category],
        updatedAt: new Date().toISOString(),
      };
      await persist(next);
    },
    [budgetData, persist]
  );

  const removeCategory = useCallback(
    async (categoryName: string): Promise<void> => {
      const filtered = budgetData.categories.filter(
        (c) => c.name !== categoryName
      );
      const next: GroupBudgetData = {
        ...budgetData,
        categories: filtered,
        updatedAt: new Date().toISOString(),
      };
      await persist(next);
    },
    [budgetData, persist]
  );

  // ── 월별 예산 한도 ────────────────────────────────────────

  const setMonthlyLimit = useCallback(
    async (limit: number | null): Promise<void> => {
      const next: GroupBudgetData = {
        ...budgetData,
        monthlyBudgetLimit: limit,
        updatedAt: new Date().toISOString(),
      };
      await persist(next);
    },
    [budgetData, persist]
  );

  // ── 통계 계산 ─────────────────────────────────────────────

  const stats = useMemo((): GroupBudgetStats => {
    const transactions = budgetData.transactions;

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // 이번 달 지출
    const now = new Date();
    const thisYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthlySpending = transactions
      .filter(
        (t) => t.type === "expense" && t.date.startsWith(thisYearMonth)
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // 카테고리별 지출 분포
    const expenseTransactions = transactions.filter((t) => t.type === "expense");
    const categoryMap = new Map<string, { amount: number; icon: string }>();

    for (const tx of expenseTransactions) {
      const existing = categoryMap.get(tx.category);
      const catDef = budgetData.categories.find((c) => c.name === tx.category);
      const icon = catDef?.icon ?? "💸";
      if (existing) {
        existing.amount += tx.amount;
      } else {
        categoryMap.set(tx.category, { amount: tx.amount, icon });
      }
    }

    const categoryBreakdown: GroupBudgetCategoryBreakdown[] = Array.from(
      categoryMap.entries()
    )
      .map(([category, { amount, icon }]) => ({
        category,
        icon,
        amount,
        ratio: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 최근 거래 5건
    const recentTransactions = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return {
      totalIncome,
      totalExpense,
      balance,
      monthlySpending,
      categoryBreakdown,
      recentTransactions,
    };
  }, [budgetData]);

  return {
    data: budgetData,
    loading: isLoading,
    stats,
    // 거래 CRUD
    addTransaction,
    updateTransaction,
    deleteTransaction,
    // 카테고리
    addCategory,
    removeCategory,
    // 예산 한도
    setMonthlyLimit,
    // 리페치
    refetch: () => mutate(),
  };
}
