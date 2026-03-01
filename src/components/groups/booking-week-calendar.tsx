"use client";

import React, { memo, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { PracticeRoom, PracticeRoomBooking } from "@/types";
import {
  BOOKING_STATUS_COLORS,
  getWeekDates,
  todayYMD,
} from "@/hooks/use-practice-room-booking";
import { formatShortDate } from "@/lib/date-utils";
import {
  WEEK_DAY_LABELS,
  formatWeekLabel,
  addWeeks,
} from "./practice-room-types";

// ─── 주간 캘린더 ──────────────────────────────────────────────

interface BookingWeekCalendarProps {
  bookings: PracticeRoomBooking[];
  rooms: PracticeRoom[];
  getRoomById: (roomId: string) => PracticeRoom | undefined;
}

export const BookingWeekCalendar = memo(function BookingWeekCalendar({
  bookings,
  rooms,
  getRoomById,
}: BookingWeekCalendarProps) {
  const [weekBase, setWeekBase] = useState<string>(todayYMD());
  const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase]);
  const today = todayYMD();

  // 이번 주 예약만 필터 (취소됨 제외)
  const weekBookings = useMemo(() => {
    const start = weekDates[0]!;
    const end = weekDates[6]!;
    return bookings.filter(
      (b) => b.date >= start && b.date <= end && b.status !== "취소됨"
    );
  }, [bookings, weekDates]);

  // 날짜별 예약 그룹핑 및 정렬
  const byDate = useMemo(() => {
    const map: Record<string, PracticeRoomBooking[]> = {};
    for (const date of weekDates) {
      map[date] = [];
    }
    for (const b of weekBookings) {
      if (map[b.date]) {
        map[b.date]!.push(b);
      }
    }
    // 각 날짜 내부를 시작 시간 순으로 정렬
    for (const date of weekDates) {
      map[date]!.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [weekBookings, weekDates]);

  // 주간 상세 목록 정렬 (날짜 → 시작 시간 순)
  const sortedWeekBookings = useMemo(
    () =>
      weekBookings.slice().sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      }),
    [weekBookings]
  );

  const weekLabel = formatWeekLabel(weekDates);

  return (
    <div className="space-y-3">
      {/* 주간 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setWeekBase((prev) => addWeeks(prev, -1))}
          aria-label="이전 주"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span className="text-xs font-medium" aria-live="polite">
          {weekLabel}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setWeekBase((prev) => addWeeks(prev, 1))}
          aria-label="다음 주"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* 요일별 그리드 */}
      <div
        className="grid grid-cols-7 gap-1"
        role="grid"
        aria-label={`${weekLabel} 주간 예약 현황`}
      >
        {weekDates.map((date, idx) => {
          const dayLabel = WEEK_DAY_LABELS[idx]!;
          const isToday = date === today;
          const dayBookings = byDate[date] ?? [];

          return (
            <div
              key={date}
              className="min-h-[80px]"
              role="gridcell"
              aria-label={`${dayLabel}요일 ${formatShortDate(date)}${isToday ? " (오늘)" : ""}, 예약 ${dayBookings.length}건`}
            >
              {/* 요일 헤더 */}
              <div
                className={`text-center rounded-t py-1 mb-1 ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
                aria-current={isToday ? "date" : undefined}
              >
                <p className="text-[10px] font-medium">{dayLabel}</p>
                <p className="text-[9px] opacity-75">
                  {formatShortDate(date)}
                </p>
              </div>

              {/* 예약 블록 */}
              <div className="space-y-0.5">
                {dayBookings.length === 0 ? (
                  <div className="h-4" aria-hidden="true" />
                ) : (
                  dayBookings.map((b) => {
                    const room = getRoomById(b.roomId);
                    const colors = BOOKING_STATUS_COLORS[b.status];
                    const tooltipText = `${room?.name ?? ""} · ${b.startTime}~${b.endTime} · ${b.bookedBy}`;
                    return (
                      <div
                        key={b.id}
                        className={`rounded px-1 py-0.5 ${colors.bg}`}
                        title={tooltipText}
                        aria-label={tooltipText}
                      >
                        <p className={`text-[9px] font-medium truncate ${colors.text}`}>
                          {b.startTime}
                        </p>
                        <p className={`text-[8px] truncate ${colors.text} opacity-80`}>
                          {room?.name ?? "?"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 이번 주 예약 상세 목록 */}
      {weekBookings.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <Separator />
          <p className="text-[10px] text-muted-foreground font-medium">
            이번 주 예약 목록 ({weekBookings.length}건)
          </p>
          <ul className="space-y-1" aria-label="이번 주 예약 상세 목록">
            {sortedWeekBookings.map((b) => {
              const room = getRoomById(b.roomId);
              const colors = BOOKING_STATUS_COLORS[b.status];
              return (
                <li
                  key={b.id}
                  className="flex items-center gap-2 text-[10px] text-muted-foreground"
                >
                  <Badge
                    className={`text-[9px] px-1 py-0 shrink-0 ${colors.badge}`}
                  >
                    {b.status}
                  </Badge>
                  <span className="shrink-0">{b.date.slice(5)}</span>
                  <span className="shrink-0">
                    {b.startTime}~{b.endTime}
                  </span>
                  <span className="truncate font-medium text-foreground">
                    {room?.name ?? "?"}
                  </span>
                  <span className="truncate">{b.bookedBy}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 연습실이 없을 때 안내 */}
      {rooms.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4" role="status">
          먼저 연습실을 등록해주세요.
        </p>
      )}
    </div>
  );
});
