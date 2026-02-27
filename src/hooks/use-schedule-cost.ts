"use client";

import { useState, useCallback, useMemo } from "react";
import type { ScheduleExpense } from "@/types";

export const CATEGORY_LABELS: Record<string, string> = {
  venue: "장소비",
  drink: "음료",
  transport: "교통비",
  food: "식비",
  other: "기타",
};

function getStorageKey(scheduleId: string): string {
  return `schedule-cost-${scheduleId}`;
}

function loadExpenses(scheduleId: string): ScheduleExpense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(scheduleId));
    return raw ? (JSON.parse(raw) as ScheduleExpense[]) : [];
  } catch {
    return [];
  }
}

function persistExpenses(scheduleId: string, expenses: ScheduleExpense[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(scheduleId), JSON.stringify(expenses));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

export function useScheduleCost(scheduleId: string) {
  const [expenses, setExpenses] = useState<ScheduleExpense[]>(() =>
    loadExpenses(scheduleId)
  );

  /** 지출 추가 */
  const addExpense = useCallback(
    (title: string, amount: number, paidBy: string, category: string) => {
      const newExpense: ScheduleExpense = {
        id: `${scheduleId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        scheduleId,
        title,
        amount,
        paidBy,
        category,
        createdAt: new Date().toISOString(),
      };
      setExpenses((prev) => {
        const next = [...prev, newExpense];
        persistExpenses(scheduleId, next);
        return next;
      });
    },
    [scheduleId]
  );

  /** 지출 삭제 */
  const deleteExpense = useCallback(
    (id: string) => {
      setExpenses((prev) => {
        const next = prev.filter((e) => e.id !== id);
        persistExpenses(scheduleId, next);
        return next;
      });
    },
    [scheduleId]
  );

  /** 총 지출 */
  const totalAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  /** 1인당 분담액 */
  const perPerson = useCallback(
    (attendeeCount: number): number => {
      if (attendeeCount <= 0) return 0;
      return Math.ceil(totalAmount / attendeeCount);
    },
    [totalAmount]
  );

  /** 카테고리별 합계 */
  const byCategory = useMemo<Record<string, number>>(() => {
    return expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {});
  }, [expenses]);

  return {
    expenses,
    addExpense,
    deleteExpense,
    totalAmount,
    perPerson,
    byCategory,
    CATEGORY_LABELS,
  };
}
