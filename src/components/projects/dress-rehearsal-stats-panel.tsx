"use client";

// ============================================================
// 통계 패널 - 이슈 해결율, 심각도/카테고리 분포
// React.memo로 stats 변경 시에만 리렌더
// ============================================================

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS, SEVERITY_COLORS } from "./dress-rehearsal-types";
import type { DressRehearsalStats } from "@/hooks/use-dress-rehearsal";

interface StatsPanelProps {
  stats: DressRehearsalStats;
}

export const StatsPanel = memo(function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div
      className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100 space-y-2"
      aria-label="이슈 통계 패널"
    >
      <p className="text-[10px] font-medium text-gray-600">이슈 통계</p>

      {/* 전체 해결율 바 */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>전체 해결율</span>
          <span className="font-semibold text-violet-600">
            {stats.resolveRate}%
          </span>
        </div>
        <div
          className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden"
          role="progressbar"
          aria-valuenow={stats.resolveRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`해결율 ${stats.resolveRate}%`}
        >
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${stats.resolveRate}%` }}
          />
        </div>
      </div>

      {/* 심각도별 분포 */}
      {stats.severityDistribution.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 mb-1">심각도별</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {stats.severityDistribution.map((s) => (
              <Badge
                key={s.severity}
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${SEVERITY_COLORS[s.severity]}`}
              >
                {s.severity} {s.count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 카테고리별 분포 */}
      {stats.categoryDistribution.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 mb-1">카테고리별</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {stats.categoryDistribution.map((c) => (
              <Badge
                key={c.category}
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[c.category]}`}
              >
                {c.category} {c.count}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
