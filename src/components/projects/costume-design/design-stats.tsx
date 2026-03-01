"use client";

import { DollarSign, ThumbsUp } from "lucide-react";
import type { CostumeDesignStats } from "@/hooks/use-costume-design";

// ============================================================
// 통계 요약 섹션
// ============================================================

interface DesignStatsProps {
  stats: CostumeDesignStats;
}

export function DesignStats({ stats }: DesignStatsProps) {
  if (stats.totalDesigns === 0) return null;

  const hasCost = stats.totalEstimatedCost > 0;
  const hasTopVoted = stats.topVotedDesign !== null;

  if (!hasCost && !hasTopVoted) return null;

  return (
    <dl
      className="flex flex-wrap gap-3 text-[10px] text-muted-foreground px-0.5"
      aria-label="디자인 통계"
    >
      {hasCost && (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-green-500" aria-hidden="true" />
          <dt className="sr-only">총 예상 비용</dt>
          <dd>
            총 예상 비용:{" "}
            <span className="text-foreground font-medium">
              {stats.totalEstimatedCost.toLocaleString()}원
            </span>
          </dd>
        </div>
      )}
      {hasTopVoted && stats.topVotedDesign && (
        <div className="flex items-center gap-1">
          <ThumbsUp className="h-3 w-3 text-pink-500" aria-hidden="true" />
          <dt className="sr-only">최다 투표 디자인</dt>
          <dd>
            최다 투표:{" "}
            <span className="text-foreground font-medium">
              {stats.topVotedDesign.title}(
              {stats.topVotedDesign.votes.length}표)
            </span>
          </dd>
        </div>
      )}
    </dl>
  );
}
