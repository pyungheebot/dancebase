"use client";

import { Crown } from "lucide-react";
import {
  FITNESS_CATEGORY_LABELS,
  FITNESS_CATEGORY_COLORS,
  FITNESS_CATEGORY_ORDER,
} from "@/hooks/use-fitness-test";
import type { FitnessTestStats } from "@/hooks/use-fitness-test";

interface CategoryStatsProps {
  stats: FitnessTestStats;
}

/**
 * 체력 테스트 카테고리별 통계 요약 (상위 퍼포머 표시)
 */
export function CategoryStats({ stats }: CategoryStatsProps) {
  if (stats.totalResults === 0) return null;

  return (
    <section aria-label="카테고리별 최고 기록">
      <dl className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {FITNESS_CATEGORY_ORDER.map((cat) => {
          const colors = FITNESS_CATEGORY_COLORS[cat];
          const top = stats.topPerformer[cat];
          return (
            <div
              key={cat}
              className={`rounded-md border px-2 py-1.5 text-center ${colors.bg}`}
            >
              <dt className={`text-[10px] font-semibold ${colors.text}`}>
                {FITNESS_CATEGORY_LABELS[cat]}
              </dt>
              {top ? (
                <dd>
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    <Crown
                      className={`h-2.5 w-2.5 ${colors.text}`}
                      aria-hidden="true"
                    />
                    <span className="text-[10px] font-bold truncate max-w-[56px]">
                      {top.memberName}
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">{top.value}</p>
                </dd>
              ) : (
                <dd className="text-[10px] text-muted-foreground mt-1">-</dd>
              )}
            </div>
          );
        })}
      </dl>
    </section>
  );
}
