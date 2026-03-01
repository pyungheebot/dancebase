"use client";

import { TrendingUp } from "lucide-react";
import { getDayLabel, today } from "./types";

interface WeeklyChartProps {
  weekDates: string[];
  weekLogMap: Record<string, number>;
  maxWeekLogs: number;
}

export function WeeklyChart({
  weekDates,
  weekLogMap,
  maxWeekLogs,
}: WeeklyChartProps) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1">
        <TrendingUp className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-medium text-muted-foreground" id="weekly-chart-label">
          이번 주 스트레칭 현황
        </span>
      </div>
      <div
        className="h-16"
        role="img"
        aria-labelledby="weekly-chart-label"
        aria-describedby="weekly-chart-desc"
      >
        <span id="weekly-chart-desc" className="sr-only">
          이번 주 요일별 스트레칭 기록 횟수 막대 차트
        </span>
        <div className="flex h-full items-end gap-1" role="list">
          {weekDates.map((date) => {
            const count = weekLogMap[date] ?? 0;
            const heightPct =
              count > 0 ? Math.min((count / maxWeekLogs) * 100, 100) : 0;
            const isToday = date === today;
            const dayLabel = getDayLabel(date);
            return (
              <div
                key={date}
                className="flex flex-1 flex-col items-center gap-0.5"
                role="listitem"
                aria-label={`${dayLabel}요일: ${count}회${isToday ? " (오늘)" : ""}`}
              >
                <div className="relative w-full flex-1">
                  {count > 0 ? (
                    <div
                      className={`absolute bottom-0 w-full rounded-t ${isToday ? "bg-teal-500" : "bg-teal-300"}`}
                      style={{ height: `${Math.max(heightPct, 15)}%` }}
                      role="meter"
                      aria-valuenow={count}
                      aria-valuemin={0}
                      aria-valuemax={maxWeekLogs}
                      aria-label={`${dayLabel}: ${count}회`}
                    />
                  ) : (
                    <div
                      className="absolute bottom-0 w-full rounded-t bg-gray-100 h-1"
                      role="meter"
                      aria-valuenow={0}
                      aria-valuemin={0}
                      aria-valuemax={maxWeekLogs}
                      aria-label={`${dayLabel}: 0회`}
                    />
                  )}
                </div>
                <span
                  className={`text-[9px] ${isToday ? "font-bold text-teal-600" : "text-muted-foreground"}`}
                  aria-hidden="true"
                >
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
