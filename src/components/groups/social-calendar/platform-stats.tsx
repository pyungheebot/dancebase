"use client";

import { cn } from "@/lib/utils";
import { PLATFORMS, PLATFORM_COLOR, PLATFORM_LABEL } from "./types";
import type { SocialPlatformType } from "@/types";

// ============================================================
// Props
// ============================================================

type PlatformStatsProps = {
  platformBreakdown: Record<SocialPlatformType, number>;
};

// ============================================================
// 컴포넌트
// ============================================================

export function PlatformStats({ platformBreakdown }: PlatformStatsProps) {
  const activePlatforms = PLATFORMS.filter(
    (pl) => platformBreakdown[pl] > 0
  );

  if (activePlatforms.length === 0) return null;

  return (
    <div
      className="border-t pt-3 grid grid-cols-3 gap-2"
      role="list"
      aria-label="플랫폼별 게시물 통계"
    >
      {activePlatforms.map((pl) => (
        <div
          key={pl}
          role="listitem"
          className="flex items-center gap-1.5 text-[10px] text-gray-600"
        >
          <span
            className={cn(
              "inline-block w-2 h-2 rounded-full shrink-0",
              PLATFORM_COLOR[pl]
            )}
            aria-hidden="true"
          />
          <span className="truncate">{PLATFORM_LABEL[pl]}</span>
          <span className="font-medium ml-auto" aria-label={`${platformBreakdown[pl]}건`}>
            {platformBreakdown[pl]}
          </span>
        </div>
      ))}
    </div>
  );
}
