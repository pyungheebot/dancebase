"use client";

import { memo } from "react";
import { UNIFIED_EVENT_TYPE_COLORS } from "@/hooks/use-unified-calendar";
import type { UnifiedCalendarEvent } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";
import { TypeBadge } from "./type-badge";

export interface UpcomingRowProps {
  event: UnifiedCalendarEvent;
}

export const UpcomingRow = memo(function UpcomingRow({
  event,
}: UpcomingRowProps) {
  const c = UNIFIED_EVENT_TYPE_COLORS[event.type];
  return (
    <div
      role="listitem"
      className="flex items-center gap-2 py-1.5 border-b last:border-0"
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{event.title}</p>
        <p className="text-[10px] text-muted-foreground">
          <time dateTime={event.date}>{formatMonthDay(event.date)}</time>
          {!event.isAllDay && ` · ${event.startTime}`}
          {event.location && ` · ${event.location}`}
        </p>
      </div>
      <TypeBadge type={event.type} />
    </div>
  );
});
