"use client";

/**
 * 그룹 연습 평가표 - 통계 컴포넌트
 *
 * - MemberTrendChart: 멤버 최근 5회 점수 추이 막대 차트
 * - TopPerformersPanel: 상위 성과자 섹션
 */

import React from "react";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type MemberTrendPoint, scoreBarColor, MEDAL_COLORS } from "./practice-evaluation-types";

// ─── 멤버 성장 추이 차트 ─────────────────────────────────────

interface MemberTrendChartProps {
  trend: MemberTrendPoint[];
  maxPossible: number;
}

export const MemberTrendChart = React.memo(function MemberTrendChart({
  trend,
  maxPossible,
}: MemberTrendChartProps) {
  if (trend.length === 0) {
    return (
      <p className="text-[10px] text-gray-400 text-center py-2" role="status">
        데이터 없음
      </p>
    );
  }

  const maxVal = Math.max(maxPossible, ...trend.map((t) => t.totalScore), 1);
  const barWidth = Math.floor(100 / trend.length);

  return (
    <figure
      aria-label="최근 5회 점수 추이 막대 차트"
      className="flex items-end gap-1 h-16 w-full"
    >
      {trend.map((t, idx) => {
        const ratio = t.totalScore / maxVal;
        const heightPct = Math.max(4, Math.round(ratio * 100));
        return (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center gap-0.5"
            style={{ maxWidth: `${barWidth}%` }}
            title={`${t.title}: ${t.totalScore}점`}
            aria-label={`${t.title} (${t.date.slice(5)}): ${t.totalScore}점`}
          >
            <span className="text-[8px] text-gray-500 leading-none" aria-hidden="true">
              {t.totalScore}
            </span>
            <div
              className={`w-full rounded-t ${scoreBarColor(ratio)} transition-all`}
              style={{ height: `${heightPct}%` }}
              role="img"
              aria-hidden="true"
            />
            <span className="text-[8px] text-gray-400 leading-none truncate w-full text-center" aria-hidden="true">
              {t.date.slice(5)}
            </span>
          </div>
        );
      })}
    </figure>
  );
});

// ─── 상위 성과자 패널 ─────────────────────────────────────────

interface TopPerformer {
  memberName: string;
  averageScore: number;
  sessionCount: number;
}

interface TopPerformersPanelProps {
  performers: TopPerformer[];
}

export const TopPerformersPanel = React.memo(function TopPerformersPanel({
  performers,
}: TopPerformersPanelProps) {
  if (performers.length === 0) return null;

  return (
    <section
      aria-label="상위 성과자"
      className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center gap-1.5">
        <Trophy className="h-3.5 w-3.5 text-yellow-500" aria-hidden="true" />
        <span className="text-xs font-medium text-gray-700">상위 성과자</span>
      </div>
      <ul
        role="list"
        className="flex flex-wrap gap-2"
        aria-label="성과자 순위 목록"
      >
        {performers.map((performer, idx) => (
          <li
            key={performer.memberName}
            role="listitem"
            className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-2 py-1 border border-yellow-100"
          >
            <span
              className={`text-xs ${MEDAL_COLORS[idx] ?? "text-gray-500"}`}
              aria-label={`${idx + 1}위`}
            >
              {idx + 1}위
            </span>
            <span className="text-xs font-medium text-gray-700">
              {performer.memberName}
            </span>
            <Badge className="text-[10px] px-1 py-0 bg-yellow-50 text-yellow-600 hover:bg-yellow-50">
              평균 {performer.averageScore}점
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
});
