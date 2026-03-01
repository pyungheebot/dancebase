"use client";

import { cn } from "@/lib/utils";
import { ENERGY_EMOJI, ENERGY_LABEL } from "./types";

// ============================================================
// 에너지 레벨 선택 컴포넌트
// ============================================================

type EnergyPickerProps = {
  value: number;
  onChange: (v: number) => void;
};

export function EnergyPicker({ value, onChange }: EnergyPickerProps) {
  return (
    <div
      className="flex gap-1.5"
      role="radiogroup"
      aria-label="기분/에너지 레벨 선택"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={ENERGY_LABEL[n]}
          onClick={() => onChange(n)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChange(n);
            }
          }}
          title={ENERGY_LABEL[n]}
          className={cn(
            "text-lg leading-none rounded-md p-1 border transition-colors",
            value === n
              ? "border-blue-400 bg-blue-50"
              : "border-transparent hover:bg-gray-100"
          )}
        >
          {ENERGY_EMOJI[n]}
        </button>
      ))}
    </div>
  );
}
