"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  GROUP_EVENT_CATEGORIES,
  GROUP_EVENT_CATEGORY_COLORS,
} from "@/hooks/use-group-event-calendar";

// ============================================================
// 카테고리 범례 컴포넌트
// ============================================================

export const CategoryLegend = memo(function CategoryLegend() {
  return (
    <div
      className="flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-border/40"
      role="list"
      aria-label="카테고리 범례"
    >
      {GROUP_EVENT_CATEGORIES.map((cat) => (
        <span
          key={cat}
          role="listitem"
          className="flex items-center gap-1 text-[10px] text-muted-foreground"
        >
          <span
            className={cn(
              "inline-block w-1.5 h-1.5 rounded-full",
              GROUP_EVENT_CATEGORY_COLORS[cat].dot
            )}
            aria-hidden="true"
          />
          {cat}
        </span>
      ))}
    </div>
  );
});
