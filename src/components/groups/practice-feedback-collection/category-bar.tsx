"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_META } from "./types";
import type { PracticeFeedbackRating } from "@/types";

type CategoryBarProps = {
  categoryKey: keyof PracticeFeedbackRating;
  value: number;
};

export function CategoryBar({ categoryKey, value }: CategoryBarProps) {
  const meta = CATEGORY_META[categoryKey];
  const pct = Math.round((value / 5) * 100);
  const labelId = `category-bar-label-${categoryKey}`;
  return (
    <div className="flex items-center gap-2">
      <span
        id={labelId}
        className="text-[10px] text-muted-foreground w-8 shrink-0"
      >
        {meta.label}
      </span>
      <div
        className="flex-1 bg-muted/40 rounded-full h-1.5 overflow-hidden"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-labelledby={labelId}
      >
        <div
          className={cn("h-full rounded-full transition-all", meta.color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-6 text-right shrink-0" aria-hidden="true">
        {value > 0 ? value.toFixed(1) : "-"}
      </span>
    </div>
  );
}
