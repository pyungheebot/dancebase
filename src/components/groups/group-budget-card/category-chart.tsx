"use client";

import { cn } from "@/lib/utils";
import { CHART_COLORS, formatAmount } from "./types";
import type { GroupBudgetCategoryBreakdown } from "@/hooks/use-group-budget";

// ============================================================
// Props
// ============================================================

export type CategoryChartProps = {
  breakdown: GroupBudgetCategoryBreakdown[];
};

// ============================================================
// 컴포넌트
// ============================================================

export function CategoryChart({ breakdown }: CategoryChartProps) {
  if (breakdown.length === 0) {
    return (
      <p className="py-2 text-center text-xs text-muted-foreground" role="status">
        지출 내역이 없습니다
      </p>
    );
  }

  const totalLabel = breakdown
    .map((item) => `${item.category} ${item.ratio}%`)
    .join(", ");

  return (
    <div className="space-y-2">
      {/* 가로 스택 바 */}
      <div
        className="flex h-4 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`카테고리별 지출 분포: ${totalLabel}`}
      >
        {breakdown.map((item, idx) => (
          <div
            key={item.category}
            className={cn("h-full transition-all", CHART_COLORS[idx % CHART_COLORS.length])}
            style={{ width: `${item.ratio}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* 범례 */}
      <ul className="space-y-1" role="list" aria-label="카테고리별 지출 상세">
        {breakdown.map((item, idx) => (
          <li
            key={item.category}
            role="listitem"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  CHART_COLORS[idx % CHART_COLORS.length]
                )}
                aria-hidden="true"
              />
              <span className="text-xs">
                {item.icon} {item.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground" aria-label={`비율 ${item.ratio}퍼센트`}>
                {item.ratio}%
              </span>
              <span className="text-xs font-medium">{formatAmount(item.amount)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
