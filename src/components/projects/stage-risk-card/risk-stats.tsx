"use client";

import type { StageRiskItem } from "@/types";
import type { StageRiskStats } from "@/hooks/use-stage-risk";
import {
  ALL_LEVELS,
  LEVEL_COLORS,
  LEVEL_DOT_COLORS,
  LEVEL_LABELS,
} from "./types";

interface RiskStatsProps {
  items: StageRiskItem[];
  stats: StageRiskStats;
}

export function RiskStats({ items, stats }: RiskStatsProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3" aria-label="리스크 통계 요약">
      {/* 대응 상태 요약 */}
      <div
        className="grid grid-cols-4 gap-2"
        role="list"
        aria-label="대응 상태별 건수"
      >
        <div
          className="p-2 rounded-md bg-muted/40 border text-center"
          role="listitem"
        >
          <p className="text-[10px] text-muted-foreground">전체</p>
          <p
            className="text-sm font-bold tabular-nums"
            aria-label={`전체 ${stats.total}건`}
          >
            {stats.total}
          </p>
        </div>
        <div
          className="p-2 rounded-md bg-gray-50 border text-center"
          role="listitem"
        >
          <p className="text-[10px] text-gray-500">미대응</p>
          <p
            className="text-sm font-bold tabular-nums text-gray-700"
            aria-label={`미대응 ${stats.pendingCount}건`}
          >
            {stats.pendingCount}
          </p>
        </div>
        <div
          className="p-2 rounded-md bg-blue-50 border border-blue-200 text-center"
          role="listitem"
        >
          <p className="text-[10px] text-blue-600">대응중</p>
          <p
            className="text-sm font-bold tabular-nums text-blue-700"
            aria-label={`대응중 ${stats.inProgressCount}건`}
          >
            {stats.inProgressCount}
          </p>
        </div>
        <div
          className="p-2 rounded-md bg-green-50 border border-green-200 text-center"
          role="listitem"
        >
          <p className="text-[10px] text-green-600">완료</p>
          <p
            className="text-sm font-bold tabular-nums text-green-700"
            aria-label={`완료 ${stats.doneCount}건`}
          >
            {stats.doneCount}
          </p>
        </div>
      </div>

      {/* 레벨별 분포 */}
      <div
        className="flex items-center gap-1.5 flex-wrap"
        role="list"
        aria-label="등급별 리스크 분포"
      >
        {ALL_LEVELS.map((level) => {
          const count = items.filter((i) => i.level === level).length;
          if (count === 0) return null;
          return (
            <span
              key={level}
              role="listitem"
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${LEVEL_COLORS[level]}`}
              aria-label={`${LEVEL_LABELS[level]} ${count}건`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT_COLORS[level]}`}
                aria-hidden="true"
              />
              {LEVEL_LABELS[level]} {count}
            </span>
          );
        })}
        {stats.avgScore > 0 && (
          <span
            className="text-[10px] text-muted-foreground ml-auto"
            aria-label={`평균 리스크 점수 ${stats.avgScore}`}
          >
            평균 점수: {stats.avgScore}
          </span>
        )}
      </div>
    </div>
  );
}
