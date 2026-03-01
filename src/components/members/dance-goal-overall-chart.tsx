"use client";

import { memo } from "react";
import type { DanceGoalCategory } from "@/types";
import { CATEGORY_BAR_COLORS } from "./dance-goal-types";

// ============================================
// OverallProgressChart — 전체 달성률 요약 차트
// ============================================

type CategoryItem = {
  category: DanceGoalCategory;
  label: string;
  count: number;
  percent: number;
};

type Props = {
  averageProgress: number;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  pausedGoals: number;
  categoryDistribution: CategoryItem[];
};

export const OverallProgressChart = memo(function OverallProgressChart({
  averageProgress,
  totalGoals,
  activeGoals,
  completedGoals,
  pausedGoals,
  categoryDistribution,
}: Props) {
  const circumference = 2 * Math.PI * 26;
  const dashOffset = circumference * (1 - averageProgress / 100);
  const chartId = "goal-overall-chart";

  return (
    <div className="space-y-4" aria-label="목표 전체 달성률 요약">
      {/* 원형 진행률 */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            role="img"
            aria-label={`전체 평균 진행률 ${averageProgress}%`}
          >
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 32 32)"
              className="transition-all duration-500"
            />
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-xs font-bold">{averageProgress}%</span>
          </div>
        </div>

        <dl
          className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs"
          aria-label="목표 상태별 현황"
        >
          <dt className="text-muted-foreground">전체</dt>
          <dd className="font-medium">{totalGoals}개</dd>
          <dt className="text-green-600">진행 중</dt>
          <dd className="font-medium">{activeGoals}개</dd>
          <dt className="text-blue-600">완료</dt>
          <dd className="font-medium">{completedGoals}개</dd>
          <dt className="text-yellow-600">일시중지</dt>
          <dd className="font-medium">{pausedGoals}개</dd>
        </dl>
      </div>

      {/* 카테고리 분포 바 */}
      {categoryDistribution.length > 0 && (
        <div className="space-y-2" id={chartId}>
          <span className="text-xs font-medium text-muted-foreground">
            카테고리 분포
          </span>
          <ul
            className="space-y-1.5"
            role="list"
            aria-label="카테고리별 목표 분포"
          >
            {categoryDistribution.map((item) => (
              <li key={item.category} className="space-y-0.5" role="listitem">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.count}개 ({item.percent}%)
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={item.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.label} 카테고리 ${item.percent}%`}
                  className="h-1.5 bg-muted rounded-full overflow-hidden"
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: CATEGORY_BAR_COLORS[item.category],
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
