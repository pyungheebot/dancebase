"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { FinanceForecastResult, FinanceHealthLevel, FinanceMonthlyData } from "@/types";

// 단순 선형 회귀: y = a + b*x
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

function predict(regression: { slope: number; intercept: number }, x: number): number {
  return Math.max(0, regression.intercept + regression.slope * x);
}

function getMonthLabel(yearMonth: string): string {
  const [, mm] = yearMonth.split("-");
  return `${parseInt(mm, 10)}월`;
}

// YYYY-MM 형식의 월 목록 생성 (startDate 기준 monthsBack개월 전부터 monthsForward개월 후까지)
function buildMonthRange(monthsBack: number, monthsForward: number): string[] {
  const now = new Date();
  const result: string[] = [];
  for (let i = -monthsBack; i <= monthsForward; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    result.push(`${yyyy}-${mm}`);
  }
  return result;
}

export function useFinanceForecast(groupId: string): FinanceForecastResult {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.financeForecast(groupId),
    async () => {
      const supabase = createClient();

      // 최근 6개월 시작일 계산
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

      const { data: rows, error } = await supabase
        .from("finance_transactions")
        .select("type, amount, transaction_date")
        .eq("group_id", groupId)
        .gte("transaction_date", startDate)
        .order("transaction_date", { ascending: true });

      if (error) throw error;

      // 월별 집계
      const monthKeys = buildMonthRange(5, 0); // 최근 6개월 (현재 월 포함)
      const monthMap: Record<string, { income: number; expense: number }> = {};
      for (const mk of monthKeys) {
        monthMap[mk] = { income: 0, expense: 0 };
      }

      for (const row of rows ?? []) {
        const ym = (row.transaction_date as string).slice(0, 7);
        if (monthMap[ym]) {
          if (row.type === "income") monthMap[ym].income += row.amount;
          else if (row.type === "expense") monthMap[ym].expense += row.amount;
        }
      }

      // 실제 데이터 배열
      const actualMonths: FinanceMonthlyData[] = monthKeys.map((mk) => ({
        month: mk,
        label: getMonthLabel(mk),
        income: monthMap[mk].income,
        expense: monthMap[mk].expense,
        netProfit: monthMap[mk].income - monthMap[mk].expense,
        isForecast: false,
      }));

      // 선형 회귀로 예측
      const incomeValues = actualMonths.map((m) => m.income);
      const expenseValues = actualMonths.map((m) => m.expense);
      const incomeReg = linearRegression(incomeValues);
      const expenseReg = linearRegression(expenseValues);

      const forecastMonthKeys = buildMonthRange(-1, 3).slice(1); // 다음 3개월
      const forecastMonths: FinanceMonthlyData[] = forecastMonthKeys.map((mk, idx) => {
        const x = actualMonths.length + idx;
        const income = predict(incomeReg, x);
        const expense = predict(expenseReg, x);
        return {
          month: mk,
          label: getMonthLabel(mk),
          income: Math.round(income),
          expense: Math.round(expense),
          netProfit: Math.round(income - expense),
          isForecast: true,
        };
      });

      // 건강도 판정
      const recentNetProfits = actualMonths.slice(-3).map((m) => m.netProfit);
      const forecastNetProfits = forecastMonths.map((m) => m.netProfit);

      const hasAnyData = incomeValues.some((v) => v > 0) || expenseValues.some((v) => v > 0);

      let healthLevel: FinanceHealthLevel = "안정";
      let healthMessage = "순이익이 양수로 유지되고 있습니다.";

      if (hasAnyData) {
        const allForecastNegative = forecastNetProfits.every((np) => np < 0);
        const recentTrendDown =
          recentNetProfits.length >= 2 &&
          recentNetProfits[recentNetProfits.length - 1] < recentNetProfits[0];
        const anyRecentNegative = recentNetProfits.some((np) => np < 0);

        if (allForecastNegative || anyRecentNegative) {
          healthLevel = "위험";
          healthMessage = "순이익이 음수이거나 향후 3개월 모두 적자가 예상됩니다.";
        } else if (recentTrendDown) {
          healthLevel = "주의";
          healthMessage = "최근 순이익이 감소 추세입니다. 지출을 점검해주세요.";
        } else {
          healthLevel = "안정";
          healthMessage = "순이익이 양수로 유지되고 있습니다.";
        }
      }

      const forecastAvgNetProfit =
        forecastNetProfits.length > 0
          ? Math.round(forecastNetProfits.reduce((s, v) => s + v, 0) / forecastNetProfits.length)
          : 0;

      return {
        monthly: [...actualMonths, ...forecastMonths],
        healthLevel,
        healthMessage,
        forecastAvgNetProfit,
        hasData: hasAnyData,
      };
    }
  );

  return {
    monthly: data?.monthly ?? [],
    healthLevel: data?.healthLevel ?? "안정",
    healthMessage: data?.healthMessage ?? "",
    forecastAvgNetProfit: data?.forecastAvgNetProfit ?? 0,
    hasData: data?.hasData ?? false,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
