"use client";

import { useMemo } from "react";
import { UNIFIED_EVENT_TYPE_COLORS } from "@/hooks/use-unified-calendar";
import type { UnifiedCalendarEvent, UnifiedEventType } from "@/types";
import { DAYS_OF_WEEK, todayStr } from "./types";

export interface MonthGridProps {
  year: number;
  month: number; // 1~12
  events: UnifiedCalendarEvent[];
  selectedDate: string | null;
  filterType: UnifiedEventType | "all";
  onSelectDate: (date: string) => void;
}

export function MonthGrid({
  year,
  month,
  events,
  selectedDate,
  filterType,
  onSelectDate,
}: MonthGridProps) {
  const today = todayStr();

  // 이 달의 이벤트를 날짜별로 그룹핑
  const eventsByDate = useMemo(() => {
    const map = new Map<string, UnifiedCalendarEvent[]>();
    for (const e of events) {
      if (filterType !== "all" && e.type !== filterType) continue;
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events, filterType]);

  // 달력 날짜 배열 생성
  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=일
    const daysInMonth = new Date(year, month, 0).getDate();
    const result: Array<{ date: string | null; day: number | null }> = [];

    // 앞 빈칸
    for (let i = 0; i < firstDay; i++) {
      result.push({ date: null, day: null });
    }
    // 날짜
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      result.push({ date: dateStr, day: d });
    }
    return result;
  }, [year, month]);

  return (
    <div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1" role="row" aria-label="요일">
        {DAYS_OF_WEEK.map((d, i) => (
          <div
            key={d}
            role="columnheader"
            aria-label={d + "요일"}
            className={`text-center text-[10px] font-medium py-1 ${
              i === 0
                ? "text-red-500"
                : i === 6
                ? "text-blue-500"
                : "text-muted-foreground"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div
        className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden"
        role="grid"
        aria-label={`${year}년 ${month}월 달력`}
      >
        {cells.map((cell, idx) => {
          if (!cell.date || cell.day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="bg-muted/30 min-h-[44px]"
                role="gridcell"
                aria-hidden="true"
              />
            );
          }

          const dateEvents = eventsByDate.get(cell.date) ?? [];
          const isToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          const dayOfWeek = new Date(cell.date + "T00:00:00").getDay();
          const eventCountLabel =
            dateEvents.length > 0
              ? `, 일정 ${dateEvents.length}개`
              : "";

          return (
            <button
              key={cell.date}
              type="button"
              role="gridcell"
              onClick={() => onSelectDate(cell.date!)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDate(cell.date!);
                }
              }}
              aria-label={`${cell.date}${isToday ? " (오늘)" : ""}${isSelected ? " (선택됨)" : ""}${eventCountLabel}`}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              className={`bg-background min-h-[44px] p-1 flex flex-col items-center gap-0.5 hover:bg-muted/50 transition-colors ${
                isSelected ? "ring-2 ring-inset ring-primary" : ""
              }`}
            >
              {/* 날짜 숫자 */}
              <span
                aria-hidden="true"
                className={`text-[11px] w-5 h-5 flex items-center justify-center rounded-full font-medium ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : dayOfWeek === 0
                    ? "text-red-500"
                    : dayOfWeek === 6
                    ? "text-blue-500"
                    : "text-foreground"
                }`}
              >
                {cell.day}
              </span>

              {/* 이벤트 점 (최대 3개) */}
              {dateEvents.length > 0 && (
                <div
                  className="flex flex-wrap justify-center gap-px max-w-full"
                  aria-hidden="true"
                >
                  {dateEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`w-1.5 h-1.5 rounded-full ${UNIFIED_EVENT_TYPE_COLORS[e.type].dot}`}
                      title={e.title}
                    />
                  ))}
                  {dateEvents.length > 3 && (
                    <span className="text-[8px] text-muted-foreground leading-none">
                      +{dateEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
