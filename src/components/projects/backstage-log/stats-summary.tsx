"use client";

import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import type { BackstageLogCategory } from "@/types";
import { CATEGORY_CONFIG, CATEGORY_BAR_COLOR } from "./types";

// ============================================================
// 통계 요약
// ============================================================

type CategoryBreakdownItem = {
  category: BackstageLogCategory;
  count: number;
  percent: number;
};

export function StatsSummary({
  totalSessions,
  totalEntries,
  unresolvedCount,
  categoryBreakdown,
}: {
  totalSessions: number;
  totalEntries: number;
  unresolvedCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
}) {
  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="region"
      aria-label="백스테이지 로그 통계"
    >
      <dl className="border rounded-md p-2 text-center">
        <dt className="text-[10px] text-gray-500">전체 세션</dt>
        <dd className="text-sm font-bold text-gray-800">{totalSessions}</dd>
      </dl>
      <dl className="border rounded-md p-2 text-center">
        <dt className="text-[10px] text-gray-500">전체 로그</dt>
        <dd className="text-sm font-bold text-gray-800">{totalEntries}</dd>
      </dl>
      <dl className="border rounded-md p-2 text-center">
        <dt className="text-[10px] text-gray-500">미해결</dt>
        <dd
          className={`text-sm font-bold ${
            unresolvedCount > 0 ? "text-orange-600" : "text-gray-800"
          }`}
          aria-label={`미해결 ${unresolvedCount}건`}
        >
          {unresolvedCount}
        </dd>
      </dl>
      {categoryBreakdown.length > 0 && (
        <div
          className="col-span-3 border rounded-md p-2"
          role="region"
          aria-label="카테고리 분포"
        >
          <p className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1">
            <BarChart3 className="h-3 w-3" aria-hidden="true" />
            카테고리 분포
          </p>
          <ul className="space-y-1" role="list" aria-label="카테고리별 로그 수">
            {categoryBreakdown.map(({ category, count, percent }) => {
              const cfg = CATEGORY_CONFIG[category];
              const barColor = CATEGORY_BAR_COLOR[category];
              return (
                <li key={category} className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 w-12 justify-center shrink-0 ${cfg.badgeClass}`}
                  >
                    {cfg.label}
                  </Badge>
                  <div
                    className="flex-1 bg-gray-100 rounded-full h-1.5"
                    role="meter"
                    aria-label={`${cfg.label} ${percent}%`}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 w-8 text-right shrink-0">
                    {count}건
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
