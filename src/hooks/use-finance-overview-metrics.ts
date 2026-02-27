"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  FinanceOverviewData,
  MonthlyFinanceSummary,
  CategoryExpense,
} from "@/types";

// 최근 6개월의 YYYY-MM 배열 생성 (오래된 순)
function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${yyyy}-${mm}`);
  }
  return months;
}

// 기간 레이블 생성
function buildPeriodLabel(months: string[]): string {
  if (months.length === 0) return "";
  const first = months[0];
  const last = months[months.length - 1];
  const [fy, fm] = first.split("-");
  const [ly, lm] = last.split("-");
  return `${fy}년 ${Number(fm)}월 ~ ${ly}년 ${Number(lm)}월`;
}

async function fetchFinanceOverview(groupId: string): Promise<FinanceOverviewData> {
  const supabase = createClient();
  const months = getLast6Months();

  // 6개월 시작일 ~ 이번 달 말일 범위 계산
  const startDate = `${months[0]}-01`;
  const lastMonth = months[months.length - 1];
  const [ly, lm] = lastMonth.split("-").map(Number);
  const lastDay = new Date(ly, lm, 0).getDate();
  const endDate = `${lastMonth}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("finance_transactions")
    .select("type, amount, category, transaction_date")
    .eq("group_id", groupId)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .order("transaction_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];

  // 월별 집계 초기화
  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  for (const m of months) {
    monthlyMap[m] = { income: 0, expense: 0 };
  }

  // 카테고리별 지출 집계
  const categoryMap: Record<string, number> = {};

  for (const row of rows) {
    const d = row.transaction_date as string;
    const monthKey = d.slice(0, 7); // YYYY-MM
    const amount = Number(row.amount) || 0;

    if (monthlyMap[monthKey]) {
      if (row.type === "income") {
        monthlyMap[monthKey].income += amount;
      } else if (row.type === "expense") {
        monthlyMap[monthKey].expense += amount;
        const cat = (row.category as string) || "기타";
        categoryMap[cat] = (categoryMap[cat] ?? 0) + amount;
      }
    }
  }

  // MonthlyFinanceSummary 배열 생성
  const monthlySummaries: MonthlyFinanceSummary[] = months.map((month) => {
    const { income, expense } = monthlyMap[month];
    return { month, income, expense, net: income - expense };
  });

  // 총 수입/지출
  const totalIncome = monthlySummaries.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = monthlySummaries.reduce((sum, m) => sum + m.expense, 0);

  // CategoryExpense 배열 생성 (내림차순 정렬)
  const categoryEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const categoryBreakdown: CategoryExpense[] = categoryEntries.map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0,
  }));

  return {
    monthlySummaries,
    categoryBreakdown,
    totalIncome,
    totalExpense,
    period: buildPeriodLabel(months),
  };
}

export function useFinanceOverviewMetrics(groupId: string) {
  const { data, isLoading, mutate } = useSWR<FinanceOverviewData>(
    groupId ? swrKeys.financeOverviewMetrics(groupId) : null,
    () => fetchFinanceOverview(groupId)
  );

  const empty: FinanceOverviewData = {
    monthlySummaries: [],
    categoryBreakdown: [],
    totalIncome: 0,
    totalExpense: 0,
    period: "",
  };

  return {
    data: data ?? empty,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
