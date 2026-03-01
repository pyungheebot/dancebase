"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAmount } from "./types";
import type { GroupBudgetStats } from "@/hooks/use-group-budget";

// ============================================================
// 요약 통계 Props
// ============================================================

type SummaryStatsProps = {
  stats: GroupBudgetStats;
};

// ============================================================
// 요약 통계 카드 3분할
// ============================================================

export function BudgetSummaryStats({ stats }: SummaryStatsProps) {
  const balancePositive = stats.balance >= 0;

  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="region"
      aria-label="예산 요약"
    >
      {/* 총 수입 */}
      <div
        className="rounded-lg border bg-green-50 p-2.5 dark:bg-green-950/40"
        aria-label={`총 수입 ${formatAmount(stats.totalIncome)}`}
      >
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
          <span className="text-[10px] font-medium">총 수입</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-green-700 dark:text-green-300">
          {formatAmount(stats.totalIncome)}
        </p>
      </div>

      {/* 총 지출 */}
      <div
        className="rounded-lg border bg-red-50 p-2.5 dark:bg-red-950/40"
        aria-label={`총 지출 ${formatAmount(stats.totalExpense)}`}
      >
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="h-3 w-3" aria-hidden="true" />
          <span className="text-[10px] font-medium">총 지출</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-red-700 dark:text-red-300">
          {formatAmount(stats.totalExpense)}
        </p>
      </div>

      {/* 잔액 */}
      <div
        className={cn(
          "rounded-lg border p-2.5",
          balancePositive
            ? "bg-blue-50 dark:bg-blue-950/40"
            : "bg-orange-50 dark:bg-orange-950/40"
        )}
        aria-label={`잔액 ${formatAmount(stats.balance)}`}
      >
        <div
          className={cn(
            "flex items-center gap-1",
            balancePositive
              ? "text-blue-600 dark:text-blue-400"
              : "text-orange-600 dark:text-orange-400"
          )}
        >
          <Wallet className="h-3 w-3" aria-hidden="true" />
          <span className="text-[10px] font-medium">잔액</span>
        </div>
        <p
          className={cn(
            "mt-1 text-sm font-semibold",
            balancePositive
              ? "text-blue-700 dark:text-blue-300"
              : "text-orange-700 dark:text-orange-300"
          )}
        >
          {formatAmount(stats.balance)}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 월별 예산 진행률 Props
// ============================================================

type BudgetProgressProps = {
  monthlySpending: number;
  monthlyBudgetLimit: number;
};

// ============================================================
// 월별 예산 진행률 바
// ============================================================

export function BudgetProgress({
  monthlySpending,
  monthlyBudgetLimit,
}: BudgetProgressProps) {
  const pct = Math.min(
    100,
    Math.round((monthlySpending / monthlyBudgetLimit) * 100)
  );
  const isOver = pct >= 100;
  const isWarning = pct >= 80;

  const progressColor = isOver
    ? "bg-red-500"
    : isWarning
    ? "bg-orange-500"
    : "bg-blue-500";

  const textColor = isOver
    ? "text-red-600"
    : isWarning
    ? "text-orange-600"
    : "text-muted-foreground";

  const progressId = "budget-progress-bar";
  const statusMsg = isOver
    ? "월 예산 한도를 초과했습니다"
    : isWarning
    ? `예산의 ${pct}%를 사용했습니다`
    : null;

  return (
    <div
      className="space-y-1.5"
      role="region"
      aria-label="이번 달 예산 사용률"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" id={`${progressId}-label`}>
          이번 달 예산 사용률
        </span>
        <span className={cn("text-xs font-medium", textColor)}>
          {formatAmount(monthlySpending)} / {formatAmount(monthlyBudgetLimit)}
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          className={cn("h-full rounded-full transition-all", progressColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 접근성용 progressbar */}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={`${progressId}-label`}
        aria-valuetext={`${formatAmount(monthlySpending)} 중 ${pct}% 사용`}
        className="sr-only"
      />

      <div
        className="flex justify-between text-[10px] text-muted-foreground"
        aria-hidden="true"
      >
        <span>0원</span>
        <span>{pct}% 사용</span>
        <span>{formatAmount(monthlyBudgetLimit)}</span>
      </div>

      {statusMsg && (
        <p
          className={cn("text-[10px] font-medium", textColor)}
          role="alert"
          aria-live="polite"
        >
          {statusMsg}
        </p>
      )}
    </div>
  );
}
