"use client";

import { memo } from "react";
import { CalendarDays, TrendingUp } from "lucide-react";
import { formatDday } from "@/hooks/use-group-event-calendar";

// ============================================================
// 타입
// ============================================================

export type StatsBarProps = {
  thisMonthCount: number;
  nextEventDday: number | null;
  nextEventTitle: string | null;
};

// ============================================================
// 컴포넌트
// ============================================================

export const StatsBar = memo(function StatsBar({
  thisMonthCount,
  nextEventDday,
  nextEventTitle,
}: StatsBarProps) {
  const ddayText =
    nextEventDday !== null ? formatDday(nextEventDday) : "-";

  return (
    <div
      className="grid grid-cols-2 gap-2"
      role="region"
      aria-label="이벤트 통계"
    >
      {/* 이번 달 이벤트 수 */}
      <div
        className="rounded-md bg-blue-50 px-3 py-2 flex items-center gap-2"
        aria-label={`이번 달 이벤트 ${thisMonthCount}개`}
      >
        <CalendarDays
          className="h-4 w-4 text-blue-500 shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="text-[10px] text-muted-foreground">이번 달</p>
          <p className="text-sm font-bold text-blue-700" aria-live="polite">
            {thisMonthCount}개
          </p>
        </div>
      </div>

      {/* 다음 이벤트 D-day */}
      <div
        className="rounded-md bg-orange-50 px-3 py-2 flex items-center gap-2"
        aria-label={
          nextEventTitle
            ? `다음 이벤트: ${nextEventTitle}, ${ddayText}`
            : `다음 이벤트 없음`
        }
      >
        <TrendingUp
          className="h-4 w-4 text-orange-500 shrink-0"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground truncate">
            {nextEventTitle ? nextEventTitle : "다음 이벤트"}
          </p>
          <p className="text-sm font-bold text-orange-700" aria-live="polite">
            {ddayText}
          </p>
        </div>
      </div>
    </div>
  );
});
