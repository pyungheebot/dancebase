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
  Minus,
} from "lucide-react";
import { useFinanceForecast } from "@/hooks/use-finance-forecast";
import type { FinanceHealthLevel, FinanceMonthlyData } from "@/types";

// ---- 건강도 레벨 설정 ----

type HealthConfig = {
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
};

const HEALTH_CONFIG: Record<FinanceHealthLevel, HealthConfig> = {
  안정: {
    label: "안정",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    icon: <TrendingUp className="h-3 w-3" />,
  },
  주의: {
    label: "주의",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
    icon: <Minus className="h-3 w-3" />,
  },
  위험: {
    label: "위험",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    icon: <TrendingDown className="h-3 w-3" />,
  },
};

// ---- 금액 포맷 ----

function formatAmount(value: number): string {
  if (Math.abs(value) >= 10_000) {
    return `${(value / 10_000).toFixed(1)}만`;
  }
  return value.toLocaleString("ko-KR");
}

// ---- 막대 차트 컴포넌트 ----

function BarChart({ monthly }: { monthly: FinanceMonthlyData[] }) {
  const maxValue = Math.max(
    ...monthly.map((m) => Math.max(m.income, m.expense)),
    1
  );

  return (
    <div className="flex items-end gap-1 h-28 w-full">
      {monthly.map((m) => {
        const incomeHeight = Math.max((m.income / maxValue) * 100, m.income > 0 ? 4 : 0);
        const expenseHeight = Math.max((m.expense / maxValue) * 100, m.expense > 0 ? 4 : 0);
        const isPositive = m.netProfit >= 0;

        return (
          <div
            key={m.month}
            className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
          >
            {/* 이중 막대 */}
            <div className="flex items-end gap-0.5 w-full h-20">
              {/* 수입 막대 */}
              <div
                className={`flex-1 rounded-t transition-all ${
                  m.isForecast
                    ? "border border-dashed border-blue-400 bg-blue-100"
                    : "bg-blue-400"
                }`}
                style={{ height: `${incomeHeight}%`, minHeight: m.income > 0 ? "2px" : "0" }}
                title={`수입: ${m.income.toLocaleString("ko-KR")}원`}
              />
              {/* 지출 막대 */}
              <div
                className={`flex-1 rounded-t transition-all ${
                  m.isForecast
                    ? "border border-dashed border-red-400 bg-red-100"
                    : "bg-red-400"
                }`}
                style={{ height: `${expenseHeight}%`, minHeight: m.expense > 0 ? "2px" : "0" }}
                title={`지출: ${m.expense.toLocaleString("ko-KR")}원`}
              />
            </div>

            {/* 순이익 라인 표시 */}
            <div
              className={`text-[9px] font-medium leading-none ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {m.netProfit === 0 ? "-" : `${isPositive ? "+" : ""}${formatAmount(m.netProfit)}`}
            </div>

            {/* 월 레이블 */}
            <div
              className={`text-[9px] leading-none truncate w-full text-center ${
                m.isForecast ? "text-muted-foreground/60" : "text-muted-foreground"
              }`}
            >
              {m.isForecast ? `*${m.label}` : m.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- 범례 ----

function Legend({ hasForecast }: { hasForecast: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground mt-1">
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-2 rounded-sm bg-blue-400" />
        수입
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-2 rounded-sm bg-red-400" />
        지출
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-1 bg-green-500" />
        순이익+
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-1 bg-red-500" />
        순이익-
      </span>
      {hasForecast && (
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm border border-dashed border-blue-400 bg-blue-100" />
          *예측
        </span>
      )}
    </div>
  );
}

// ---- 메인 컴포넌트 ----

interface FinanceForecastCardProps {
  groupId: string;
}

export function FinanceForecastCard({ groupId }: FinanceForecastCardProps) {
  const [open, setOpen] = useState(false);
  const { monthly, healthLevel, healthMessage, forecastAvgNetProfit, hasData, loading } =
    useFinanceForecast(groupId);

  const config = HEALTH_CONFIG[healthLevel];
  const hasForecast = monthly.some((m) => m.isForecast);
  const isPositiveForecast = forecastAvgNetProfit >= 0;

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-12 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="mt-3 h-28 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="w-full">
        <CardContent className="p-3">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between gap-2 text-left group">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-foreground shrink-0">
                  재정 건강도 예측
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 shrink-0 ${config.badgeClass}`}
                >
                  {config.icon}
                  {config.label}
                </Badge>
                {hasData && (
                  <span
                    className={`text-[10px] truncate ${
                      isPositiveForecast ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    예측 평균 순이익:{" "}
                    {isPositiveForecast ? "+" : ""}
                    {formatAmount(forecastAvgNetProfit)}원
                  </span>
                )}
              </div>
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
            <div className="mt-3 space-y-3">
              {/* 건강도 메시지 */}
              {hasData && (
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {healthMessage}
                </p>
              )}

              {!hasData ? (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                  아직 거래 데이터가 없습니다.
                </div>
              ) : (
                <>
                  {/* 막대 차트 */}
                  <BarChart monthly={monthly} />

                  {/* 범례 */}
                  <Legend hasForecast={hasForecast} />

                  {/* 예측 안내 */}
                  {hasForecast && (
                    <p className="text-[10px] text-muted-foreground/70">
                      * 단순 선형 회귀 기반 3개월 예측 (점선 테두리)
                    </p>
                  )}
                </>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
