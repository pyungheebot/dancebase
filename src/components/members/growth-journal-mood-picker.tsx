"use client";

// ============================================
// 무드 선택 컴포넌트
// ============================================

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { GrowthJournalMood } from "@/types";
import { MOOD_EMOJI, MOOD_LABEL, MOOD_ORDER } from "./growth-journal-types";

interface MoodPickerProps {
  value: GrowthJournalMood;
  onChange: (v: GrowthJournalMood) => void;
}

export const MoodPicker = memo(function MoodPicker({
  value,
  onChange,
}: MoodPickerProps) {
  return (
    <div
      className="flex gap-1 flex-wrap"
      role="radiogroup"
      aria-label="오늘의 무드 선택"
    >
      {MOOD_ORDER.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          onClick={() => onChange(m)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all text-center",
            value === m
              ? "bg-primary/10 ring-2 ring-primary scale-110"
              : "hover:bg-muted"
          )}
          title={MOOD_LABEL[m]}
        >
          <span className="text-xl leading-none">{MOOD_EMOJI[m]}</span>
          <span
            className={cn(
              "text-[10px]",
              value === m
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            )}
          >
            {MOOD_LABEL[m]}
          </span>
        </button>
      ))}
    </div>
  );
});
