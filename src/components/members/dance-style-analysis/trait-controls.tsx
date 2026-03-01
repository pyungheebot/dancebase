"use client";

import { memo } from "react";
import {
  TRAIT_LABELS,
  TRAIT_COLORS,
  TRAIT_TEXT_COLORS,
  getScoreBarColor,
  getScoreTextStyle,
} from "@/hooks/use-dance-style-analysis";
import type { DanceStyleTrait } from "@/types";
import { cn } from "@/lib/utils";

// ============================================================
// 점수 슬라이더 (1-10) - 편집용
// ============================================================

export const TraitSlider = memo(function TraitSlider({
  trait,
  value,
  onChange,
}: {
  trait: DanceStyleTrait;
  value: number;
  onChange: (v: number) => void;
}) {
  const sliderId = `trait-slider-${trait}`;

  return (
    <div className="space-y-1" role="group" aria-labelledby={sliderId}>
      <div className="flex items-center justify-between">
        <span
          id={sliderId}
          className={cn("text-xs font-medium", TRAIT_TEXT_COLORS[trait])}
        >
          {TRAIT_LABELS[trait]}
        </span>
        <span
          className={cn("text-xs", getScoreTextStyle(value))}
          aria-live="polite"
          aria-atomic="true"
        >
          {value} / 10
        </span>
      </div>
      {/* 세그먼트 버튼 (1~10) */}
      <div
        className="flex items-center gap-0.5"
        role="radiogroup"
        aria-label={`${TRAIT_LABELS[trait]} 점수 선택`}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n}점`}
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 h-4 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              n <= value ? TRAIT_COLORS[trait] : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
});

// ============================================================
// 점수 바 (표시용) - 읽기 전용
// ============================================================

export const TraitBar = memo(function TraitBar({
  trait,
  value,
}: {
  trait: DanceStyleTrait;
  value: number;
}) {
  const barId = `trait-bar-${trait}-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground" id={barId}>
          {TRAIT_LABELS[trait]}
        </span>
        <span className={cn("text-[11px]", getScoreTextStyle(value))}>
          {value}
        </span>
      </div>
      <div
        className="h-1.5 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-labelledby={barId}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            getScoreBarColor(value)
          )}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
});
