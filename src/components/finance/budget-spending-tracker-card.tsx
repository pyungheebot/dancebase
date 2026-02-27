"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useBudgetSpendingTracker } from "@/hooks/use-budget-spending-tracker";
import type { BudgetAlertLevel } from "@/types";

// ---- 경고 수준 설정 ----

type AlertConfig = {
  label: string;
  badgeClass: string;
  strokeColor: string;
  textColor: string;
  icon: React.ReactNode;
};

function getAlertConfig(level: BudgetAlertLevel): AlertConfig {
  switch (level) {
    case "safe":
      return {
        label: "안전",
        badgeClass:
          "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/40",
        strokeColor: "#22c55e",
        textColor: "text-green-600 dark:text-green-400",
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    case "caution":
      return {
        label: "주의",
        badgeClass:
          "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/40",
        strokeColor: "#eab308",
        textColor: "text-yellow-600 dark:text-yellow-400",
        icon: <AlertTriangle className="h-3 w-3" />,
      };
    case "warning":
      return {
        label: "위험",
        badgeClass:
          "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/40",
        strokeColor: "#f97316",
        textColor: "text-orange-600 dark:text-orange-400",
        icon: <ShieldAlert className="h-3 w-3" />,
      };
    case "exceeded":
      return {
        label: "초과",
        badgeClass:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/40",
        strokeColor: "#ef4444",
        textColor: "text-red-600 dark:text-red-400",
        icon: <AlertTriangle className="h-3 w-3" />,
      };
  }
}

// ---- 원형 프로그레스 SVG ----

function CircularProgress({
  rate,
  alertLevel,
}: {
  rate: number;
  alertLevel: BudgetAlertLevel;
}) {
  const config = getAlertConfig(alertLevel);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const clampedRate = Math.min(rate, 100);
  const offset = circumference - (clampedRate / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* 배경 트랙 */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/20"
        />
        {/* 진행 호 */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={config.strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      {/* 중앙 텍스트 */}
      <span
        className={`absolute text-xs font-bold tabular-nums ${config.textColor}`}
      >
        {rate}%
      </span>
    </div>
  );
}

// ---- 월 레이블 포맷 ----

function formatMonthShort(ym: string): string {
  const parts = ym.split("-");
  if (parts.length !== 2) return ym;
  return `${parseInt(parts[1], 10)}월`;
}

// ---- 메인 컴포넌트 ----

type Props = {
  groupId: string;
};

export function BudgetSpendingTrackerCard({ groupId }: Props) {
  const { result, budgetTarget, loading, setBudget, clearBudget } =
    useBudgetSpendingTracker(groupId);

  const [open, setOpen] = useState(true);
  const [budgetInput, setBudgetInput] = useState("");

  const { currentMonth, recentMonths, hasBudget } = result;
  const alertConfig = getAlertConfig(currentMonth.alertLevel);

  // 예산 설정 제출
  const handleSetBudget = () => {
    const val = parseInt(budgetInput.replace(/,/g, ""), 10);
    if (isNaN(val) || val <= 0) {
      toast.error("올바른 예산 금액을 입력해주세요");
      return;
    }
    setBudget(val);
    setBudgetInput("");
    toast.success("월 예산이 설정되었습니다");
  };

  // 예산 삭제
  const handleClearBudget = () => {
    clearBudget();
    toast.success("예산 목표가 삭제되었습니다");
  };

  // 막대 차트 최대값 계산
  const maxSpent = Math.max(
    ...recentMonths.map((m) => m.spent),
    budgetTarget ?? 0,
    1
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors select-none">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">예산 추적</span>
              {hasBudget && (
                <Badge
                  className={`text-[10px] px-1.5 py-0 h-4 border ${alertConfig.badgeClass} flex items-center gap-0.5`}
                >
                  {alertConfig.icon}
                  {alertConfig.label}
                </Badge>
              )}
            </div>
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            {/* 초과 경고 배너 */}
            {hasBudget && currentMonth.alertLevel === "exceeded" && (
              <div className="flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800/40 px-2.5 py-1.5">
                <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                  이번 달 예산을 초과했습니다. ({currentMonth.spentRate}%)
                </span>
              </div>
            )}

            {/* 이번 달 현황 */}
            <div className="flex items-center gap-3">
              {/* 원형 프로그레스 */}
              <CircularProgress
                rate={hasBudget ? currentMonth.spentRate : 0}
                alertLevel={currentMonth.alertLevel}
              />

              {/* 수치 정보 */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-[11px] text-muted-foreground">이번 달 지출</p>
                <p className="text-sm font-bold tabular-nums truncate">
                  {loading
                    ? "..."
                    : currentMonth.spent.toLocaleString()}
                  <span className="text-[11px] font-normal text-muted-foreground ml-0.5">원</span>
                </p>
                {hasBudget ? (
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    예산{" "}
                    <span className="font-medium text-foreground">
                      {currentMonth.budget.toLocaleString()}원
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    예산 미설정
                  </p>
                )}
              </div>
            </div>

            {/* 최근 6개월 막대 차트 */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5">최근 6개월 지출 추이</p>
              <div className="flex items-end gap-1 h-14">
                {recentMonths
                  .slice()
                  .reverse()
                  .map((m) => {
                    const barHeightPct =
                      maxSpent > 0 ? (m.spent / maxSpent) * 100 : 0;
                    const budgetLinePct =
                      hasBudget && budgetTarget && maxSpent > 0
                        ? (budgetTarget / maxSpent) * 100
                        : null;
                    const barConfig = getAlertConfig(m.alertLevel);
                    const isCurrentMonth =
                      m.month === currentMonth.month;

                    return (
                      <div
                        key={m.month}
                        className="flex-1 flex flex-col items-center gap-0.5 h-full relative"
                        title={`${m.month}: ${m.spent.toLocaleString()}원${hasBudget ? ` / 예산 ${m.budget.toLocaleString()}원` : ""}`}
                      >
                        {/* 막대 영역 */}
                        <div className="flex-1 w-full flex items-end relative">
                          {/* 예산 라인 */}
                          {budgetLinePct !== null && (
                            <div
                              className="absolute w-full border-t border-dashed border-muted-foreground/40 pointer-events-none"
                              style={{ bottom: `${budgetLinePct}%` }}
                            />
                          )}
                          {/* 막대 */}
                          <div
                            className="w-full rounded-t-sm transition-all"
                            style={{
                              height: `${Math.max(barHeightPct, 2)}%`,
                              backgroundColor: barConfig.strokeColor,
                              opacity: isCurrentMonth ? 1 : 0.55,
                            }}
                          />
                        </div>
                        {/* 월 레이블 */}
                        <span
                          className={`text-[9px] tabular-nums ${
                            isCurrentMonth
                              ? "text-foreground font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatMonthShort(m.month)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 예산 설정 인풋 */}
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder={
                  hasBudget
                    ? `현재: ${(budgetTarget ?? 0).toLocaleString()}원`
                    : "월 예산 금액 (원)"
                }
                className="h-7 text-xs flex-1"
                min={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSetBudget();
                }}
              />
              <Button
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={handleSetBudget}
                disabled={!budgetInput.trim()}
              >
                설정
              </Button>
              {hasBudget && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={handleClearBudget}
                >
                  삭제
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
