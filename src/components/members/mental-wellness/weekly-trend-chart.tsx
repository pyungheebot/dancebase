"use client";

import { cn } from "@/lib/utils";
import { formatYearMonthDay, formatMonthDay } from "@/lib/date-utils";
import type { MentalWellnessEntry } from "@/types";
import { SLIDER_CONFIG } from "./types";

type WeeklyChartProps = {
  entries: MentalWellnessEntry[];
};

export function WeeklyTrendChart({ entries }: WeeklyChartProps) {
  // 최근 7개 기록을 날짜 오름차순 정렬
  const recent = [...entries].slice(0, 7).reverse();

  if (recent.length < 2) {
    return (
      <p
        className="text-xs text-muted-foreground text-center py-3"
        role="status"
        aria-live="polite"
      >
        추이 차트를 보려면 기록이 2개 이상 필요합니다.
      </p>
    );
  }

  return (
    <div className="space-y-3" role="img" aria-label="주간 심리 추이 차트">
      {SLIDER_CONFIG.map((cfg) => {
        const lastVal = recent[recent.length - 1][cfg.key];
        return (
          <div key={cfg.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span
                className={cn("text-[10px] font-medium", cfg.textColor)}
                id={`chart-label-${cfg.key}`}
              >
                {cfg.label}
              </span>
              <span
                className={cn("text-[10px]", cfg.textColor)}
                aria-label={`최근 ${cfg.label} 수치: ${lastVal}`}
              >
                최근: {lastVal}
              </span>
            </div>
            <div
              className="flex items-end gap-0.5 h-8"
              role="meter"
              aria-labelledby={`chart-label-${cfg.key}`}
              aria-valuenow={lastVal}
              aria-valuemin={1}
              aria-valuemax={10}
            >
              {recent.map((e, i) => {
                const val = e[cfg.key]; // 1-10
                const heightPct = (val / 10) * 100;
                return (
                  <div
                    key={e.id}
                    className="flex-1 flex flex-col justify-end group relative"
                    title={`${formatYearMonthDay(e.date)}: ${val}`}
                  >
                    <div
                      className={cn(
                        "rounded-sm transition-all",
                        i === recent.length - 1
                          ? cfg.color
                          : `${cfg.color} opacity-40`
                      )}
                      style={{ height: `${heightPct}%` }}
                      aria-hidden="true"
                    />
                    {/* 날짜 레이블 (첫/마지막만) */}
                    {(i === 0 || i === recent.length - 1) && (
                      <span
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground whitespace-nowrap"
                        aria-hidden="true"
                      >
                        {formatMonthDay(e.date)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
