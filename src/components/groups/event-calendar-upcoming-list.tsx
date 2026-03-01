"use client";

import { ListChecks } from "lucide-react";
import { EventItem } from "./event-calendar-event-item";
import type { GroupCalendarEvent, GroupEventRsvpStatus } from "@/types";

// ============================================================
// 타입
// ============================================================

export type UpcomingEventListProps = {
  events: GroupCalendarEvent[];
  myRsvpMap: Map<string, GroupEventRsvpStatus | null>;
  onRsvp: (id: string, status: GroupEventRsvpStatus) => void;
  onDelete: (id: string) => void;
};

// ============================================================
// 컴포넌트
// ============================================================

export function UpcomingEventList({
  events,
  myRsvpMap,
  onRsvp,
  onDelete,
}: UpcomingEventListProps) {
  if (events.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-4 gap-1 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <ListChecks className="h-5 w-5" aria-hidden="true" />
        <p className="text-xs">다가오는 이벤트가 없습니다</p>
      </div>
    );
  }

  return (
    <ul
      className="space-y-1.5"
      role="list"
      aria-label="다가오는 이벤트 목록"
    >
      {events.map((ev) => (
        <li key={ev.id} role="listitem">
          <EventItem
            event={ev}
            myRsvp={myRsvpMap.get(ev.id) ?? null}
            onDelete={onDelete}
            onRsvp={onRsvp}
          />
        </li>
      ))}
    </ul>
  );
}
