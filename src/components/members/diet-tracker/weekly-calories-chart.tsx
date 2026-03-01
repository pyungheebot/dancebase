"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { formatMonthDay } from "@/lib/date-utils";
import { getTodayStr } from "./types";

interface WeeklyCaloriesChartProps {
  data: Array<{ date: string; calories: number }>;
}

export const WeeklyCaloriesChart = memo(function WeeklyCaloriesChart({
  data,
}: WeeklyCaloriesChartProps) {
  const maxCalories = Math.max(...data.map((d) => d.calories), 1);
  const hasAnyData = data.some((d) => d.calories > 0);

  if (!hasAnyData) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2" role="status">
        최근 7일 칼로리 데이터가 없습니다.
      </p>
    );
  }

  const todayStr = getTodayStr();

  return (
    <figure aria-label="주간 칼로리 막대 차트">
      <div
        className="flex items-end gap-1 h-16"
        role="img"
        aria-label={`최근 7일 칼로리 현황. 최고 ${maxCalories}kcal`}
      >
        {data.map(({ date, calories }) => {
          const heightPct =
            maxCalories > 0 ? (calories / maxCalories) * 100 : 0;
          const isToday = date === todayStr;
          return (
            <div
              key={date}
              className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
            >
              <div className="w-full flex items-end justify-center h-12">
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    isToday ? "bg-orange-400" : "bg-orange-200"
                  )}
                  style={{
                    height: `${Math.max(heightPct, calories > 0 ? 8 : 0)}%`,
                  }}
                  title={calories > 0 ? `${calories}kcal` : "기록 없음"}
                  aria-label={`${formatMonthDay(date)}: ${calories > 0 ? `${calories}kcal` : "기록 없음"}${isToday ? " (오늘)" : ""}`}
                />
              </div>
              <time
                dateTime={date}
                className={cn(
                  "text-[9px] truncate w-full text-center",
                  isToday
                    ? "text-orange-600 font-medium"
                    : "text-muted-foreground"
                )}
                aria-current={isToday ? "date" : undefined}
              >
                {formatMonthDay(date)}
              </time>
            </div>
          );
        })}
      </div>
    </figure>
  );
});
