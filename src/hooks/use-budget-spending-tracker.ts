"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { removeFromStorage } from "@/lib/local-storage";
import type {
  BudgetAlertLevel,
  MonthlyBudgetStatus,
  BudgetSpendingResult,
} from "@/types";

// localStorage 키
const STORAGE_KEY_PREFIX = "dancebase:budget-targets:";

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

// localStorage에서 예산 목표 로드
function loadBudgetTarget(groupId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return null;
    const val = parseInt(raw, 10);
    return isNaN(val) || val <= 0 ? null : val;
  } catch {
    return null;
  }
}

// localStorage에 예산 목표 저장
function saveBudgetTarget(groupId: string, amount: number): void {
  localStorage.setItem(getStorageKey(groupId), String(amount));
}

// localStorage에서 예산 목표 삭제
function removeBudgetTarget(groupId: string): void {
  removeFromStorage(getStorageKey(groupId));
}

// 지출률로 경고 수준 결정
function calcAlertLevel(spentRate: number): BudgetAlertLevel {
  if (spentRate >= 100) return "exceeded";
  if (spentRate >= 80) return "warning";
  if (spentRate >= 60) return "caution";
  return "safe";
}

// "YYYY-MM" 형태로 현재 월 반환
function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// 최근 N개월의 "YYYY-MM" 배열 반환 (최신 순)
function getRecentMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }
  return months;
}

// 월별 지출 합계 계산
function calcSpentByMonth(
  rows: { amount: number; transaction_date: string }[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const ym = row.transaction_date.slice(0, 7); // "YYYY-MM"
    map.set(ym, (map.get(ym) ?? 0) + row.amount);
  }
  return map;
}

export function useBudgetSpendingTracker(groupId: string) {
  const [budgetTarget, setBudgetTarget] = useState<number | null>(null);

  // 컴포넌트 마운트 시 localStorage에서 예산 목표 로드
  useEffect(() => {
    setBudgetTarget(loadBudgetTarget(groupId));
  }, [groupId]);

  // 최근 6개월 지출 데이터 조회
  const months = getRecentMonths(6);
  const oldestMonth = months[months.length - 1]; // 6개월 전 시작일

  const { data, isLoading, mutate } = useSWR(
    swrKeys.budgetSpendingTracker(groupId),
    async () => {
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from("finance_transactions")
        .select("amount, transaction_date")
        .eq("group_id", groupId)
        .eq("type", "expense")
        .gte("transaction_date", `${oldestMonth}-01`)
        .order("transaction_date", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return rows ?? [];
    }
  );

  // 예산 목표 설정
  const setBudget = useCallback(
    (amount: number) => {
      saveBudgetTarget(groupId, amount);
      setBudgetTarget(amount);
    },
    [groupId]
  );

  // 예산 목표 삭제
  const clearBudget = useCallback(() => {
    removeBudgetTarget(groupId);
    setBudgetTarget(null);
  }, [groupId]);

  // 결과 계산
  const result: BudgetSpendingResult = (() => {
    const rows = data ?? [];
    const spentMap = calcSpentByMonth(rows);
    const currentYM = getCurrentYearMonth();
    const budget = budgetTarget ?? 0;

    // 이번 달 상태
    const currentSpent = spentMap.get(currentYM) ?? 0;
    const currentRate =
      budget > 0 ? Math.round((currentSpent / budget) * 100) : 0;
    const currentMonth: MonthlyBudgetStatus = {
      month: currentYM,
      budget,
      spent: currentSpent,
      spentRate: currentRate,
      alertLevel: calcAlertLevel(currentRate),
    };

    // 최근 6개월 상태 (최신 순)
    const recentMonths: MonthlyBudgetStatus[] = months.map((ym) => {
      const spent = spentMap.get(ym) ?? 0;
      const rate = budget > 0 ? Math.round((spent / budget) * 100) : 0;
      return {
        month: ym,
        budget,
        spent,
        spentRate: rate,
        alertLevel: calcAlertLevel(rate),
      };
    });

    return {
      currentMonth,
      recentMonths,
      hasBudget: budgetTarget !== null && budgetTarget > 0,
    };
  })();

  return {
    result,
    budgetTarget,
    loading: isLoading,
    setBudget,
    clearBudget,
    refetch: () => mutate(),
  };
}
