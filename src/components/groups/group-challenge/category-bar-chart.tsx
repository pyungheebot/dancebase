"use client";

import type { DanceGroupChallengeCategory } from "@/types";
import {
  CATEGORY_LABELS,
  CATEGORY_BAR_CLASS,
} from "./types";

const CATEGORIES: DanceGroupChallengeCategory[] = [
  "choreography",
  "freestyle",
  "cover",
  "fitness",
];

export function CategoryBarChart({
  categoryCounts,
}: {
  categoryCounts: Record<DanceGroupChallengeCategory, number>;
}) {
  const maxCount = Math.max(...Object.values(categoryCounts), 1);

  return (
    <dl
      className="space-y-2"
      role="list"
      aria-label="카테고리별 챌린지 수"
    >
      {CATEGORIES.map((cat) => {
        const count = categoryCounts[cat];
        const pct = Math.round((count / maxCount) * 100);
        const barId = `chart-bar-${cat}`;

        return (
          <div key={cat} className="flex items-center gap-2" role="listitem">
            <dt className="text-[10px] text-muted-foreground w-16 shrink-0">
              {CATEGORY_LABELS[cat]}
            </dt>
            <div
              id={barId}
              className="flex-1 h-4 bg-muted rounded-sm overflow-hidden"
              role="meter"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={maxCount}
              aria-label={`${CATEGORY_LABELS[cat]} ${count}개`}
            >
              <div
                className={`h-full rounded-sm transition-all ${CATEGORY_BAR_CLASS[cat]}`}
                style={{ width: count === 0 ? "0%" : `${pct}%` }}
              />
            </div>
            <dd className="text-[10px] text-muted-foreground w-6 text-right shrink-0">
              {count}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
