"use client";

import { Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOTAL_WATER_CUPS } from "./types";

interface WaterTrackerProps {
  cups: number;
  onToggle: (cupIndex: number) => void;
}

export function WaterTracker({ cups, onToggle }: WaterTrackerProps) {
  return (
    <div
      className="space-y-1.5"
      role="group"
      aria-label={`수분 섭취 트래커 — 현재 ${cups}잔 (${cups * 250}ml)`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Droplets className="h-3 w-3 text-blue-500" aria-hidden="true" />
          수분 섭취
        </span>
        <span
          className="text-xs font-medium text-blue-600"
          aria-live="polite"
          aria-atomic="true"
        >
          {cups} / {TOTAL_WATER_CUPS}잔
          <span className="text-[10px] text-muted-foreground ml-1">
            ({cups * 250}ml)
          </span>
        </span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: TOTAL_WATER_CUPS }, (_, i) => {
          const filled = i < cups;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(i)}
              className={cn(
                "h-7 w-7 rounded-md border transition-all hover:scale-110",
                filled
                  ? "bg-blue-100 border-blue-300 text-blue-600"
                  : "bg-muted border-border text-muted-foreground/40"
              )}
              aria-label={`${i + 1}잔 (${(i + 1) * 250}ml)`}
              aria-pressed={filled}
              title={`${i + 1}잔 (${(i + 1) * 250}ml)`}
            >
              <Droplets
                className={cn(
                  "h-3.5 w-3.5 mx-auto",
                  filled ? "fill-blue-400" : ""
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
