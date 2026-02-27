"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  BarChart2,
} from "lucide-react";
import { useFinanceOverviewMetrics } from "@/hooks/use-finance-overview-metrics";
import type { MonthlyFinanceSummary, CategoryExpense } from "@/types";

// ---- 카테고리 색상 팔레트 ----

const CATEGORY_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-amber-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-lime-500",
];

// ---- 금액 포맷 ----

function formatAmount(value: number): string {
  if (Math.abs(value) >= 10_000_000) {
    return `${(value / 10_000_000).toFixed(1)}천만`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 10_000).toFixed(1)}만`;
  }
  return value.toLocaleString("ko-KR");
}

function formatAmountFull(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

// ---- 요약 수치 3칸 ----

interface SummaryStatsProps {
  totalIncome: number;
  totalExpense: number;
}

function SummaryStats({ totalIncome, totalExpense }: SummaryStatsProps) {
  const net = totalIncome - totalExpense;
  const isPositive = net >= 0;

  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {/* 총 수입 */}
      <div className="rounded-lg bg-green-50 border border-green-100 px-2.5 py-2 text-center">
        <p className="text-[10px] text-green-700 font-medium mb-0.5">총 수입</p>
        <p className="text-sm font-bold text-green-700 leading-tight truncate">
          {formatAmount(totalIncome)}
        </p>
        <p className="text-[9px] text-green-600/70 truncate">원</p>
      </div>

      {/* 총 지출 */}
      <div className="rounded-lg bg-red-50 border border-red-100 px-2.5 py-2 text-center">
        <p className="text-[10px] text-red-700 font-medium mb-0.5">총 지출</p>
        <p className="text-sm font-bold text-red-700 leading-tight truncate">
          {formatAmount(totalExpense)}
        </p>
        <p className="text-[9px] text-red-600/70 truncate">원</p>
      </div>

      {/* 순이익 */}
      <div
        className={`rounded-lg px-2.5 py-2 text-center border ${
          isPositive
            ? "bg-blue-50 border-blue-100"
            : "bg-orange-50 border-orange-100"
        }`}
      >
        <p
          className={`text-[10px] font-medium mb-0.5 ${
            isPositive ? "text-blue-700" : "text-orange-700"
          }`}
        >
          순이익
        </p>
        <p
          className={`text-sm font-bold leading-tight truncate ${
            isPositive ? "text-blue-700" : "text-orange-700"
          }`}
        >
          {isPositive ? "+" : ""}
          {formatAmount(net)}
        </p>
        <p
          className={`text-[9px] truncate ${
            isPositive ? "text-blue-600/70" : "text-orange-600/70"
          }`}
        >
          원
        </p>
      </div>
    </div>
  );
}

// ---- 월별 바 차트 ----

interface MonthlyBarChartProps {
  summaries: MonthlyFinanceSummary[];
}

function MonthlyBarChart({ summaries }: MonthlyBarChartProps) {
  const maxValue = Math.max(
    ...summaries.map((m) => Math.max(m.income, m.expense)),
    1
  );

  // YYYY-MM -> M월 레이블
  function monthLabel(month: string): string {
    const parts = month.split("-");
    return `${Number(parts[1])}월`;
  }

  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-2 font-medium">
        월별 수입 / 지출 추이
      </p>
      <div className="flex items-end gap-1.5 h-28 w-full">
        {summaries.map((m) => {
          const incomeH = Math.max(
            (m.income / maxValue) * 100,
            m.income > 0 ? 4 : 0
          );
          const expenseH = Math.max(
            (m.expense / maxValue) * 100,
            m.expense > 0 ? 4 : 0
          );
          const isPositiveNet = m.net >= 0;

          return (
            <div
              key={m.month}
              className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
            >
              {/* 수입·지출 이중 막대 */}
              <div className="flex items-end gap-0.5 w-full h-20">
                {/* 수입 (초록) */}
                <div
                  className="flex-1 rounded-t bg-green-400 transition-all"
                  style={{
                    height: `${incomeH}%`,
                    minHeight: m.income > 0 ? "2px" : "0",
                  }}
                  title={`수입: ${formatAmountFull(m.income)}`}
                />
                {/* 지출 (빨강) */}
                <div
                  className="flex-1 rounded-t bg-red-400 transition-all"
                  style={{
                    height: `${expenseH}%`,
                    minHeight: m.expense > 0 ? "2px" : "0",
                  }}
                  title={`지출: ${formatAmountFull(m.expense)}`}
                />
              </div>

              {/* 순이익 표시 */}
              <div
                className={`text-[9px] font-medium leading-none ${
                  isPositiveNet ? "text-green-600" : "text-red-600"
                }`}
              >
                {m.net === 0
                  ? "-"
                  : `${isPositiveNet ? "+" : ""}${formatAmount(m.net)}`}
              </div>

              {/* 월 레이블 */}
              <div className="text-[9px] text-muted-foreground leading-none truncate w-full text-center">
                {monthLabel(m.month)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1.5">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm bg-green-400" />
          수입
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm bg-red-400" />
          지출
        </span>
      </div>
    </div>
  );
}

// ---- 카테고리별 지출 비중 수평 바 ----

interface CategoryBreakdownProps {
  breakdown: CategoryExpense[];
}

function CategoryBreakdown({ breakdown }: CategoryBreakdownProps) {
  if (breakdown.length === 0) {
    return (
      <div className="flex items-center justify-center h-10 text-xs text-muted-foreground">
        지출 카테고리 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-2 font-medium">
        카테고리별 지출 비중
      </p>
      <div className="space-y-1.5">
        {breakdown.map((item, idx) => {
          const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          return (
            <div key={item.category} className="flex items-center gap-2">
              {/* 카테고리명 */}
              <span className="text-[10px] text-foreground w-14 shrink-0 truncate">
                {item.category}
              </span>

              {/* 수평 바 */}
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${colorClass}`}
                  style={{ width: `${Math.max(item.percentage, 1)}%` }}
                  title={`${item.percentage}% (${formatAmountFull(item.amount)})`}
                />
              </div>

              {/* 퍼센트 */}
              <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">
                {item.percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- 로딩 스켈레톤 ----

function OverviewSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="mt-3 h-28 bg-muted animate-pulse rounded" />
        <div className="mt-3 space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- 메인 컴포넌트 ----

interface FinanceOverviewDashboardProps {
  groupId: string;
}

export function FinanceOverviewDashboard({
  groupId,
}: FinanceOverviewDashboardProps) {
  const [open, setOpen] = useState(false);
  const { data, loading } = useFinanceOverviewMetrics(groupId);

  if (loading) {
    return <OverviewSkeleton />;
  }

  const hasData =
    data.totalIncome > 0 ||
    data.totalExpense > 0;

  const net = data.totalIncome - data.totalExpense;
  const isPositiveNet = net >= 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="w-full">
        <CardContent className="p-3">
          {/* 헤더 (Collapsible 트리거) */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between gap-2 text-left group">
              <div className="flex items-center gap-2 min-w-0">
                <BarChart2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-semibold text-foreground shrink-0">
                  재정 개요 대시보드
                </span>

                {/* 기간 배지 */}
                {data.period && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 text-muted-foreground shrink-0 hidden sm:inline-flex"
                  >
                    {data.period}
                  </Badge>
                )}

                {/* 순이익 미리보기 */}
                {hasData && (
                  <span
                    className={`text-[10px] truncate ${
                      isPositiveNet ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    순이익{" "}
                    {isPositiveNet ? "+" : ""}
                    {formatAmount(net)}원
                  </span>
                )}
              </div>

              {/* 열기/닫기 아이콘 */}
              <span className="text-muted-foreground shrink-0">
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            </button>
          </CollapsibleTrigger>

          {/* 펼쳐진 내용 */}
          <CollapsibleContent>
            {!hasData ? (
              <div className="flex flex-col items-center justify-center h-20 gap-1 mt-3">
                <TrendingDown className="h-5 w-5 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  최근 6개월 거래 데이터가 없습니다.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-4">
                {/* 상단: 총 수입/총 지출/순이익 3칸 요약 */}
                <SummaryStats
                  totalIncome={data.totalIncome}
                  totalExpense={data.totalExpense}
                />

                {/* 중단: 월별 바 차트 */}
                <MonthlyBarChart summaries={data.monthlySummaries} />

                {/* 하단: 카테고리별 지출 비중 */}
                <CategoryBreakdown breakdown={data.categoryBreakdown} />

                {/* 기간 안내 (모바일에서 배지 대신) */}
                {data.period && (
                  <p className="text-[10px] text-muted-foreground/60 sm:hidden">
                    기간: {data.period}
                  </p>
                )}

                {/* 순이익 안내 아이콘 */}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                  {isPositiveNet ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span>
                    6개월 누적 순이익:{" "}
                    <span
                      className={`font-medium ${
                        isPositiveNet ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositiveNet ? "+" : ""}
                      {formatAmountFull(net)}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
