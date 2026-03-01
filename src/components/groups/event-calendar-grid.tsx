"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { todayYMD } from "@/hooks/use-group-event-calendar";
import { EventDots } from "./event-calendar-event-item";
import { WEEK_DAYS, toYMD, getDaysInMonth, getFirstDayOfWeek } from "./event-calendar-types";
import type { GroupCalendarEvent } from "@/types";

// ============================================================
// 타입
// ============================================================

export type CalendarGridProps = {
  year: number;
  month: number;
  eventsByDate: Map<string, GroupCalendarEvent[]>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

// ============================================================
// 컴포넌트
// ============================================================

export const CalendarGrid = memo(function CalendarGrid({
  year,
  month,
  eventsByDate,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const today = todayYMD();
  const totalDays = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const totalCells = Math.ceil((firstDow + totalDays) / 7) * 7;

  const cells: (number | null)[] = Array.from(
    { length: totalCells },
    (_, i) => {
      const day = i - firstDow + 1;
      return day >= 1 && day <= totalDays ? day : null;
    }
  );

  return (
    <div
      className="w-full"
      role="grid"
      aria-label={`${year}년 ${month}월 캘린더`}
    >
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1" role="row">
        {WEEK_DAYS.map((wd, i) => (
          <div
            key={wd}
            role="columnheader"
            aria-label={
              i === 0
                ? "일요일"
                : i === 1
                  ? "월요일"
                  : i === 2
                    ? "화요일"
                    : i === 3
                      ? "수요일"
                      : i === 4
                        ? "목요일"
                        : i === 5
                          ? "금요일"
                          : "토요일"
            }
            className={cn(
              "text-center text-[10px] font-medium py-1",
              i === 0
                ? "text-red-500"
                : i === 6
                  ? "text-blue-500"
                  : "text-muted-foreground"
            )}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div
        className="grid grid-cols-7 gap-px bg-border/30 rounded overflow-hidden"
        role="rowgroup"
      >
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                role="gridcell"
                aria-label="비어있음"
                className="bg-background min-h-[36px]"
              />
            );
          }

          const ymd = toYMD(year, month, day);
          const dayEvents = eventsByDate.get(ymd) ?? [];
          const isToday = ymd === today;
          const isSelected = ymd === selectedDate;
          const isWeekend = i % 7 === 0 || i % 7 === 6;
          const isSun = i % 7 === 0;

          const eventLabel =
            dayEvents.length > 0
              ? `, 이벤트 ${dayEvents.length}개`
              : "";
          const dateLabel = `${month}월 ${day}일${isToday ? " (오늘)" : ""}${eventLabel}`;

          return (
            <div key={ymd} role="gridcell">
              <button
                type="button"
                onClick={() => onSelectDate(ymd)}
                aria-label={dateLabel}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                className={cn(
                  "w-full bg-background min-h-[36px] flex flex-col items-center pt-1 pb-0.5 px-0.5 transition-colors",
                  "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isSelected && "bg-accent",
                  dayEvents.length > 0 && !isSelected && "hover:bg-accent/70"
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-medium leading-none w-5 h-5 flex items-center justify-center rounded-full",
                    isToday && "bg-foreground text-background font-bold",
                    !isToday && isSun && "text-red-500",
                    !isToday && !isSun && isWeekend && "text-blue-500",
                    !isToday && !isWeekend && "text-foreground"
                  )}
                  aria-hidden="true"
                >
                  {day}
                </span>
                {dayEvents.length > 0 && <EventDots events={dayEvents} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
