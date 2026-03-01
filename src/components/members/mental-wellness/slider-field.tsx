"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SliderFieldProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  trackColor: string;
  textColor: string;
};

export function SliderField({
  label,
  value,
  onChange,
  color,
  trackColor,
  textColor,
}: SliderFieldProps) {
  const id = useId();
  const trackId = `track-${id}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={trackId}
          className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
        >
          {label}
        </Label>
        <span
          className={cn("text-xs font-bold tabular-nums", textColor)}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${label} 수치: ${value}/10`}
        >
          {value} / 10
        </span>
      </div>
      <div
        className={cn("relative h-2 rounded-full", trackColor)}
        aria-hidden="true"
      >
        <div
          className={cn("absolute left-0 top-0 h-2 rounded-full", color)}
          style={{ width: `${(value / 10) * 100}%` }}
        />
        <input
          id={trackId}
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={`${label} (1에서 10)`}
          aria-valuenow={value}
          aria-valuemin={1}
          aria-valuemax={10}
        />
      </div>
      <div
        className="flex justify-between text-[9px] text-muted-foreground/60"
        aria-hidden="true"
      >
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}
