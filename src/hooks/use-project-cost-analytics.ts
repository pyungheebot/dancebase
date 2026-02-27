"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { FinanceTransactionWithDetails } from "@/types";

export interface CategoryAnalytics {
  categoryName: string;
  income: number;
  expense: number;
  net: number;
}

export interface MonthlyAnalytics {
  month: string; // "YYYY-MM"
  income: number;
  expense: number;
}

export interface ProjectCostAnalyticsData {
  categoryAnalytics: CategoryAnalytics[];
  monthlyAnalytics: MonthlyAnalytics[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function useProjectCostAnalytics(groupId: string, projectId: string) {
  const fetcher = async (): Promise<FinanceTransactionWithDetails[]> => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("finance_transactions")
      .select(
        "*, profiles!finance_transactions_created_by_fkey(id, name, avatar_url), paid_by_profile:profiles!finance_transactions_paid_by_fkey(id, name, avatar_url), finance_categories(id, name)"
      )
      .eq("group_id", groupId)
      .eq("project_id", projectId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as FinanceTransactionWithDetails[];
  };

  const { data: transactions, isLoading, mutate } = useSWR(
    swrKeys.projectCostAnalytics(groupId, projectId),
    fetcher
  );

  const analytics = useMemo((): ProjectCostAnalyticsData => {
    const txns = transactions ?? [];

    // 전체 합계
    const totalIncome = txns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = txns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // 카테고리별 집계
    const categoryMap = new Map<string, CategoryAnalytics>();

    for (const txn of txns) {
      const key = txn.finance_categories?.id ?? "__uncategorized__";
      const name = txn.finance_categories?.name ?? "미분류";

      if (!categoryMap.has(key)) {
        categoryMap.set(key, { categoryName: name, income: 0, expense: 0, net: 0 });
      }

      const entry = categoryMap.get(key)!;
      if (txn.type === "income") {
        entry.income += txn.amount;
      } else {
        entry.expense += txn.amount;
      }
      entry.net = entry.income - entry.expense;
    }

    const categoryAnalytics = Array.from(categoryMap.values()).sort((a, b) => {
      const totalA = a.income + a.expense;
      const totalB = b.income + b.expense;
      return totalB - totalA;
    });

    // 월별 집계 (최근 6개월)
    const monthMap = new Map<string, MonthlyAnalytics>();

    for (const txn of txns) {
      if (!txn.transaction_date) continue;
      const month = txn.transaction_date.slice(0, 7);

      if (!monthMap.has(month)) {
        monthMap.set(month, { month, income: 0, expense: 0 });
      }

      const entry = monthMap.get(month)!;
      if (txn.type === "income") {
        entry.income += txn.amount;
      } else {
        entry.expense += txn.amount;
      }
    }

    // 내림차순 정렬 후 최근 6개월만
    const monthlyAnalytics = Array.from(monthMap.values())
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6)
      .reverse();

    return {
      categoryAnalytics,
      monthlyAnalytics,
      totalIncome,
      totalExpense,
      balance,
    };
  }, [transactions]);

  return {
    analytics,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
