"use client";

import { BarChart3 } from "lucide-react";
import type { GroupWishCategory } from "@/types";
import { ALL_CATEGORIES } from "./types";
import { CATEGORY_META } from "./meta";

interface CategoryBarChartProps {
  categoryCount: Record<GroupWishCategory, number>;
  total: number;
}

export function CategoryBarChart({ categoryCount, total }: CategoryBarChartProps) {
  if (total === 0) return null;

  const entries = ALL_CATEGORIES.filter((cat) => categoryCount[cat] > 0).map((cat) => ({
    cat,
    count: categoryCount[cat],
    pct: Math.round((categoryCount[cat] / total) * 100),
    meta: CATEGORY_META[cat],
  }));

  if (entries.length === 0) return null;

  return (
    <div
      className="space-y-1.5 rounded-md bg-gray-50 px-3 py-2.5"
      role="img"
      aria-label="카테고리별 위시 현황 차트"
    >
      <div className="flex items-center gap-1 mb-1">
        <BarChart3 className="h-3 w-3 text-gray-400" aria-hidden="true" />
        <span className="text-[11px] font-medium text-gray-500">카테고리별 현황</span>
      </div>
      <dl>
        {entries.map(({ cat, count, pct, meta }) => (
          <div key={cat} className="flex items-center gap-2">
            <dt className={`flex w-14 shrink-0 items-center gap-1 ${meta.text}`}>
              <span aria-hidden="true">{meta.icon}</span>
              <span className="text-[10px] font-medium">{meta.label}</span>
            </dt>
            <dd className="flex flex-1 items-center gap-1.5">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${meta.label} ${pct}%`}
              >
                <div
                  className={`h-full rounded-full ${meta.barColor} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-[10px] text-gray-400">
                {count}개 ({pct}%)
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
