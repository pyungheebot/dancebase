"use client";

import { memo } from "react";
import { BarChart2, TrendingUp, TrendingDown, Star } from "lucide-react";
import {
  ALL_TRAITS,
  TRAIT_LABELS,
  type StyleAnalysisStats,
} from "@/hooks/use-dance-style-analysis";
import { RadarChart } from "./radar-chart";
import { TraitBar } from "./trait-controls";

// ============================================================
// 통계 요약 (최신 스냅샷 기준)
// ============================================================

type StatsSummaryProps = {
  stats: StyleAnalysisStats;
};

export const StatsSummary = memo(function StatsSummary({
  stats,
}: StatsSummaryProps) {
  if (stats.totalSnapshots === 0) {
    return (
      <div
        className="text-center py-6 text-xs text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        아직 분석 기록이 없습니다. 첫 분석을 시작해보세요.
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-label="댄스 스타일 통계 요약">
      {/* 요약 배지 행 */}
      <div
        className="flex flex-wrap gap-2"
        role="list"
        aria-label="주요 통계"
      >
        <div
          className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-2 py-1"
          role="listitem"
        >
          <BarChart2 className="h-3 w-3" aria-hidden="true" />
          <span>전체 평균 {stats.overallAverage}</span>
        </div>

        {stats.topTrait && (
          <div
            className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1"
            role="listitem"
          >
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            <span>
              최고: {TRAIT_LABELS[stats.topTrait]} (
              {stats.traitScores[stats.topTrait]})
            </span>
          </div>
        )}

        {stats.bottomTrait && (
          <div
            className="flex items-center gap-1.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-1"
            role="listitem"
          >
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
            <span>
              약점: {TRAIT_LABELS[stats.bottomTrait]} (
              {stats.traitScores[stats.bottomTrait]})
            </span>
          </div>
        )}

        <div
          className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground border rounded px-2 py-1"
          role="listitem"
        >
          <Star className="h-3 w-3" aria-hidden="true" />
          <span>총 {stats.totalSnapshots}회 분석</span>
        </div>
      </div>

      {/* 레이더 + 바 */}
      <div className="flex gap-4 items-center">
        <RadarChart scores={stats.traitScores} size={160} />
        <div
          className="flex-1 space-y-1.5 min-w-0"
          role="list"
          aria-label="특성별 평균 점수"
        >
          {ALL_TRAITS.map((trait) => (
            <div key={trait} role="listitem">
              <TraitBar trait={trait} value={stats.traitScores[trait]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
