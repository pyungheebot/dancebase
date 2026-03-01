"use client";

import { memo } from "react";
import type { MemberGoalCategory } from "@/types";
import {
  CATEGORY_LABELS,
  CATEGORY_BAR_COLORS,
  ALL_CATEGORIES,
} from "./member-goal-types";

// ============================================
// 타입
// ============================================

type GoalStatsSummaryProps = {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  averageProgress: number;
};

type GoalCategoryChartProps = {
  categoryDistribution: Record<MemberGoalCategory, number>;
};

// ============================================
// 통계 요약 카드
// ============================================

export const GoalStatsSummary = memo(function GoalStatsSummary({
  totalGoals,
  activeGoals,
  completedGoals,
  averageProgress,
}: GoalStatsSummaryProps) {
  const progressColor =
    averageProgress >= 71
      ? "text-green-600"
      : averageProgress >= 31
      ? "text-yellow-600"
      : "text-red-500";

  const stats = [
    { label: "전체", value: totalGoals, color: "text-foreground" },
    { label: "진행중", value: activeGoals, color: "text-blue-600" },
    { label: "완료", value: completedGoals, color: "text-green-600" },
    {
      label: "평균진행률",
      value: `${averageProgress}%`,
      color: progressColor,
    },
  ] as const;

  return (
    <dl className="grid grid-cols-4 gap-2" aria-label="목표 통계 요약">
      {stats.map(({ label, value, color }) => (
        <div
          key={label}
          className="rounded-lg border bg-muted/30 px-2 py-1.5 text-center"
        >
          <dt className="text-[10px] text-muted-foreground order-last">{label}</dt>
          <dd className={`text-sm font-bold ${color}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
});

// ============================================
// 카테고리 분포 차트
// ============================================

export const GoalCategoryChart = memo(function GoalCategoryChart({
  categoryDistribution,
}: GoalCategoryChartProps) {
  const presentCategories = ALL_CATEGORIES.filter(
    (cat) => categoryDistribution[cat] > 0
  );

  if (presentCategories.length === 0) return null;

  const maxCount = Math.max(1, ...presentCategories.map((cat) => categoryDistribution[cat]));

  return (
    <section
      className="rounded-lg border bg-muted/20 px-3 py-2.5 space-y-1.5"
      aria-label="카테고리별 목표 분포"
    >
      <p className="text-[11px] font-medium text-muted-foreground" aria-hidden="true">
        카테고리 분포
      </p>
      <ul role="list" className="space-y-1">
        {presentCategories.map((cat) => {
          const count = categoryDistribution[cat];
          const pct = Math.round((count / maxCount) * 100);
          const barColor = CATEGORY_BAR_COLORS[cat];
          return (
            <li
              key={cat}
              role="listitem"
              className="flex items-center gap-2"
              aria-label={`${CATEGORY_LABELS[cat]}: ${count}개`}
            >
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                {CATEGORY_LABELS[cat]}
              </span>
              <div
                role="progressbar"
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={maxCount}
                aria-label={`${CATEGORY_LABELS[cat]} ${count}개`}
                className="flex-1 h-2 rounded-full bg-muted overflow-hidden"
              >
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className="text-[10px] text-muted-foreground w-4 text-right"
                aria-hidden="true"
              >
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
});
