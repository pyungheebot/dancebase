"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MentalWellnessEntry } from "@/types";
import { MOOD_CONFIG, MOOD_KEYS } from "./types";

type MoodDistributionProps = {
  distribution: Record<MentalWellnessEntry["overallMood"], number>;
  total: number;
};

export function MoodDistributionBar({
  distribution,
  total,
}: MoodDistributionProps) {
  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground" id="mood-dist-label">
        기분 분포
      </p>
      {/* 비례 바 */}
      <div
        className="flex rounded-full overflow-hidden h-2"
        role="meter"
        aria-labelledby="mood-dist-label"
        aria-valuenow={total}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`총 ${total}회 기분 분포`}
      >
        {MOOD_KEYS.map((mood) => {
          const count = distribution[mood];
          if (count === 0) return null;
          const cfg = MOOD_CONFIG[mood];
          const pct = (count / total) * 100;
          return (
            <div
              key={mood}
              className={cn(cfg.color.replace("text-", "bg-"), "opacity-70")}
              style={{ width: `${pct}%` }}
              title={`${cfg.label}: ${count}회`}
              aria-hidden="true"
            />
          );
        })}
      </div>
      {/* 레전드 */}
      <dl className="flex flex-wrap gap-1">
        {MOOD_KEYS.map((mood) => {
          const count = distribution[mood];
          if (count === 0) return null;
          const cfg = MOOD_CONFIG[mood];
          return (
            <div key={mood}>
              <dt className="sr-only">{cfg.label}</dt>
              <dd>
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0 gap-0.5 border",
                    cfg.bg,
                    cfg.color,
                    cfg.border
                  )}
                >
                  <span aria-hidden="true">{cfg.emoji}</span>{" "}
                  {cfg.label}{" "}
                  <span aria-label={`${count}회`}>{count}회</span>
                </Badge>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
