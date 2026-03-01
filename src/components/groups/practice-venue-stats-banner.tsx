"use client";

import { memo } from "react";
import type { usePracticeVenue } from "@/hooks/use-practice-venue";

interface StatsBannerProps {
  stats: ReturnType<typeof usePracticeVenue>["stats"];
}

export const StatsBanner = memo(function StatsBanner({ stats }: StatsBannerProps) {
  if (stats.totalVenues === 0) return null;

  return (
    <div
      className="flex items-center gap-3 flex-wrap text-[10px]"
      role="status"
      aria-label="연습 장소 통계"
      aria-live="polite"
    >
      <span className="text-gray-500">
        총{" "}
        <span className="font-semibold text-gray-700">{stats.totalVenues}</span>
        개
      </span>
      {stats.availableCount > 0 && (
        <span className="text-green-700">
          예약 가능{" "}
          <span className="font-semibold">{stats.availableCount}</span>개
        </span>
      )}
      {stats.favoriteCount > 0 && (
        <span className="text-red-500">
          즐겨찾기{" "}
          <span className="font-semibold">{stats.favoriteCount}</span>개
        </span>
      )}
      {stats.averageRating != null && (
        <span className="text-yellow-600">
          평균 별점{" "}
          <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
        </span>
      )}
      {stats.averageCost != null && (
        <span className="text-indigo-600">
          평균 비용{" "}
          <span className="font-semibold">
            {stats.averageCost.toLocaleString()}
          </span>
          원/h
        </span>
      )}
      {stats.topRated && (
        <span className="text-orange-600">
          최고 평점:{" "}
          <span className="font-semibold">{stats.topRated.name}</span>
        </span>
      )}
    </div>
  );
});
