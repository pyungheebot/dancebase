"use client";

import { memo } from "react";
import { Clock, MapPin, Users, Trash2 } from "lucide-react";
import { UNIFIED_EVENT_TYPE_COLORS } from "@/hooks/use-unified-calendar";
import type { UnifiedCalendarEvent } from "@/types";
import { TypeBadge } from "./type-badge";

export interface EventRowProps {
  event: UnifiedCalendarEvent;
  onDelete: () => void;
}

export const EventRow = memo(function EventRow({
  event,
  onDelete,
}: EventRowProps) {
  const c = UNIFIED_EVENT_TYPE_COLORS[event.type];
  return (
    <div
      role="listitem"
      className={`rounded border p-2 group hover:bg-muted/20 transition-colors ${c.bg} ${c.border}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <TypeBadge type={event.type} />
            <span className="text-xs font-medium truncate">{event.title}</span>
          </div>

          <dl className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
            {!event.isAllDay ? (
              <div className="flex items-center gap-0.5">
                <dt className="sr-only">시간</dt>
                <dd className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                  <time>
                    {event.startTime} ~ {event.endTime}
                  </time>
                </dd>
              </div>
            ) : (
              <div>
                <dt className="sr-only">시간</dt>
                <dd className="text-[10px] text-muted-foreground">종일</dd>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-0.5">
                <dt className="sr-only">장소</dt>
                <dd className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" aria-hidden="true" />
                  {event.location}
                </dd>
              </div>
            )}

            {event.participants.length > 0 && (
              <div className="flex items-center gap-0.5">
                <dt className="sr-only">참여자 수</dt>
                <dd className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Users className="h-2.5 w-2.5" aria-hidden="true" />
                  {event.participants.length}명
                </dd>
              </div>
            )}
          </dl>

          {event.description && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onDelete();
            }
          }}
          aria-label={`${event.title} 일정 삭제`}
          className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
