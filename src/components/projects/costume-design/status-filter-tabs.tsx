"use client";

import type { CostumeDesignEntry, CostumeDesignStatus } from "@/types";
import { STATUS_FILTER_OPTIONS } from "./types";

// ============================================================
// 상태 필터 탭
// ============================================================

interface StatusFilterTabsProps {
  designs: CostumeDesignEntry[];
  statusFilter: CostumeDesignStatus | "all";
  onFilterChange: (value: CostumeDesignStatus | "all") => void;
}

export function StatusFilterTabs({
  designs,
  statusFilter,
  onFilterChange,
}: StatusFilterTabsProps) {
  if (designs.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-1"
      role="tablist"
      aria-label="디자인 상태 필터"
    >
      {STATUS_FILTER_OPTIONS.map((opt) => {
        const count =
          opt.value === "all"
            ? designs.length
            : designs.filter((d) => d.status === opt.value).length;
        if (opt.value !== "all" && count === 0) return null;
        const isSelected = statusFilter === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onFilterChange(opt.value)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              isSelected
                ? "bg-pink-500 text-white border-pink-500"
                : "border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
            {count > 0 && (
              <span className="ml-1 opacity-70" aria-hidden="true">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
