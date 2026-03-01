"use client";

import { memo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DanceProfileGenreEntry, DanceProfileSkillStar } from "@/types";
import { STAR_COLORS, GENRE_BAR_COLORS } from "./dance-style-profile-types";

interface GenreBarChartProps {
  genres: DanceProfileGenreEntry[];
}

export const GenreBarChart = memo(function GenreBarChart({ genres }: GenreBarChartProps) {
  if (genres.length === 0) return null;

  return (
    <div
      className="space-y-1.5"
      role="list"
      aria-label="장르별 숙련도 차트"
    >
      {genres.map((entry, idx) => {
        const pct = (entry.stars / 5) * 100;
        const barColor = GENRE_BAR_COLORS[idx % GENRE_BAR_COLORS.length];
        return (
          <div
            key={entry.genre}
            className="flex items-center gap-2"
            role="listitem"
            aria-label={`${entry.genre}: 숙련도 ${entry.stars}점 (${pct}%)`}
          >
            <span className="text-[11px] text-muted-foreground w-16 shrink-0 truncate">
              {entry.genre}
            </span>
            <div
              className="flex-1 h-2.5 rounded-full bg-muted/50 overflow-hidden"
              role="progressbar"
              aria-valuenow={entry.stars}
              aria-valuemin={1}
              aria-valuemax={5}
              aria-label={`${entry.genre} 숙련도`}
            >
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div
              className="flex items-center gap-0.5 shrink-0"
              aria-hidden="true"
            >
              {([1, 2, 3, 4, 5] as DanceProfileSkillStar[]).map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "h-2.5 w-2.5",
                    n <= entry.stars
                      ? `fill-current ${STAR_COLORS[entry.stars]}`
                      : "text-muted-foreground/20"
                  )}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
