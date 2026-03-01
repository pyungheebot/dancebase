"use client";

import { BarChart2, TrendingUp, User } from "lucide-react";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  DIFFICULTY_COLORS,
} from "@/hooks/use-dance-class-review";
import type { DanceClassDifficulty } from "@/types";

// ============================================================
// 난이도 분포 차트
// ============================================================

interface DifficultyChartProps {
  difficultyDistribution: Record<DanceClassDifficulty, number>;
  maxDiffCount: number;
}

export function DifficultyChart({
  difficultyDistribution,
  maxDiffCount,
}: DifficultyChartProps) {
  return (
    <div className="space-y-1.5">
      <div
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide"
        aria-hidden="true"
      >
        <BarChart2 className="h-3 w-3" />
        난이도 분포
      </div>
      <dl
        className="space-y-1.5"
        aria-label="난이도별 수업 분포"
      >
        {DIFFICULTY_ORDER.map((d) => {
          const count = difficultyDistribution[d];
          const pct = Math.round((count / maxDiffCount) * 100);
          return (
            <div key={d} className="flex items-center gap-2">
              <dt className={`text-[10px] w-10 shrink-0 font-medium ${DIFFICULTY_COLORS[d].text}`}>
                {DIFFICULTY_LABELS[d]}
              </dt>
              <div
                className="flex-1 h-2 rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-label={`${DIFFICULTY_LABELS[d]} ${count}건`}
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={maxDiffCount}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${DIFFICULTY_COLORS[d].bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <dd className="text-[10px] w-4 text-right text-muted-foreground shrink-0">
                {count}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

// ============================================================
// 상위 강사 목록
// ============================================================

interface TopInstructor {
  name: string;
  count: number;
  avgRating: number;
}

interface TopInstructorsProps {
  topInstructors: TopInstructor[];
}

export function TopInstructors({ topInstructors }: TopInstructorsProps) {
  if (topInstructors.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide"
        aria-hidden="true"
      >
        <TrendingUp className="h-3 w-3" />
        자주 수강한 강사
      </div>
      <ul
        className="flex flex-wrap gap-1.5"
        role="list"
        aria-label="자주 수강한 강사 목록"
      >
        {topInstructors.map((ins) => (
          <li
            key={ins.name}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border text-[11px]"
            role="listitem"
          >
            <User className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">{ins.name}</span>
            <span className="text-muted-foreground">
              <span className="sr-only">수강 횟수</span>
              {ins.count}회
            </span>
            <span className="text-yellow-500" aria-label={`평균 별점 ${ins.avgRating}점`}>
              ★{ins.avgRating}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
