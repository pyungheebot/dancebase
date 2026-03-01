"use client";

import { memo } from "react";
import { Trash2, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GROUP_EVENT_CATEGORY_COLORS,
  RSVP_STATUS_COLORS,
  calcDday,
  formatDday,
} from "@/hooks/use-group-event-calendar";
import { RSVP_OPTIONS } from "./event-calendar-types";
import type { GroupCalendarEvent, GroupEventRsvpStatus } from "@/types";

// ============================================================
// 이벤트 도트
// ============================================================

export const EventDots = memo(function EventDots({
  events,
}: {
  events: GroupCalendarEvent[];
}) {
  const unique = Array.from(new Set(events.map((e) => e.category))).slice(0, 3);
  return (
    <div
      className="flex items-center justify-center gap-0.5 mt-0.5"
      aria-hidden="true"
    >
      {unique.map((cat) => (
        <span
          key={cat}
          className={cn(
            "inline-block rounded-full w-1 h-1",
            GROUP_EVENT_CATEGORY_COLORS[cat].dot
          )}
        />
      ))}
    </div>
  );
});

// ============================================================
// 이벤트 아이템
// ============================================================

export type EventItemProps = {
  event: GroupCalendarEvent;
  myRsvp: GroupEventRsvpStatus | null;
  onDelete: (id: string) => void;
  onRsvp: (id: string, status: GroupEventRsvpStatus) => void;
};

export const EventItem = memo(function EventItem({
  event,
  myRsvp,
  onDelete,
  onRsvp,
}: EventItemProps) {
  const colors = GROUP_EVENT_CATEGORY_COLORS[event.category];
  const dday = calcDday(event.date);
  const isPast = dday < 0;

  const attendCount = event.rsvps.filter((r) => r.status === "참석").length;
  const notAttendCount = event.rsvps.filter(
    (r) => r.status === "미참석"
  ).length;

  const rsvpSummaryId = `rsvp-summary-${event.id}`;
  const titleId = `event-title-${event.id}`;

  return (
    <article
      className={cn(
        "rounded px-2 py-2 flex flex-col gap-1.5 group",
        colors.bg,
        isPast && "opacity-60"
      )}
      aria-labelledby={titleId}
      aria-describedby={rsvpSummaryId}
    >
      {/* 상단: 배지 + 제목 + D-day + 삭제 */}
      <div className="flex items-start gap-1.5">
        <span
          className={cn(
            "text-[10px] px-1.5 py-0 rounded font-medium shrink-0 mt-0.5",
            colors.badge
          )}
          aria-label={`카테고리: ${event.category}`}
        >
          {event.category}
        </span>
        <p
          id={titleId}
          className="text-xs font-medium text-foreground flex-1 truncate"
        >
          {event.title}
        </p>
        {!isPast && (
          <span
            className="text-[10px] font-semibold text-muted-foreground shrink-0"
            aria-label={`D-day: ${formatDday(dday)}`}
          >
            {formatDday(dday)}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onDelete(event.id)}
          aria-label={`"${event.title}" 이벤트 삭제`}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        </Button>
      </div>

      {/* 시간/장소 */}
      <div className="flex items-center gap-2 flex-wrap">
        {(event.time || event.endTime) && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" aria-hidden="true" />
            <span>
              {event.time}
              {event.endTime && ` ~ ${event.endTime}`}
            </span>
          </span>
        )}
        {event.location && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" aria-hidden="true" />
            <span className="truncate max-w-[100px]">{event.location}</span>
          </span>
        )}
      </div>

      {/* 설명 */}
      {event.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-1">
          {event.description}
        </p>
      )}

      {/* RSVP */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        {/* RSVP 집계 */}
        <div
          id={rsvpSummaryId}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
          aria-label={`참석 ${attendCount}명, 미참석 ${notAttendCount}명`}
        >
          <Users className="h-2.5 w-2.5" aria-hidden="true" />
          <span className="text-green-600 font-medium" aria-hidden="true">
            {attendCount}명
          </span>
          <span aria-hidden="true">/</span>
          <span className="text-red-500 font-medium" aria-hidden="true">
            {notAttendCount}명
          </span>
        </div>

        {/* 내 RSVP 버튼 */}
        {!isPast && (
          <div
            className="flex items-center gap-0.5"
            role="group"
            aria-label="참석 여부 선택"
          >
            {RSVP_OPTIONS.map(({ status, label, icon }) => {
              const isSelected = myRsvp === status;
              const c = RSVP_STATUS_COLORS[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onRsvp(event.id, status)}
                  aria-pressed={isSelected}
                  aria-label={`${label}으로 응답`}
                  className={cn(
                    "flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                    isSelected
                      ? cn(c.bg, c.text, c.border)
                      : "bg-background border-border/50 text-muted-foreground hover:border-border"
                  )}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
});
