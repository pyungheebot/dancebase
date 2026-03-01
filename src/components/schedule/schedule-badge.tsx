"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { useScheduleRsvp } from "@/hooks/use-schedule-rsvp";
import { ScheduleCostSummary } from "./schedule-cost-summary";
import type { Schedule } from "@/types";

// 캘린더 셀의 일정 배지 (going 수 표시 포함)
export const ScheduleBadge = memo(function ScheduleBadge({
  schedule,
  onClick,
}: {
  schedule: Schedule;
  onClick: () => void;
}) {
  const { rsvp } = useScheduleRsvp(schedule.id);

  return (
    <button onClick={onClick} className="w-full text-left">
      <Badge
        variant="secondary"
        className="w-full justify-between text-[9px] px-1 py-0 truncate cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <span className="truncate">{schedule.title}</span>
        {rsvp && rsvp.going > 0 && (
          <span className="shrink-0 ml-1 text-[8px] opacity-70">{rsvp.going}</span>
        )}
      </Badge>
    </button>
  );
});

// RSVP going 수를 기본 참석 인원으로 전달하는 비용 정산 wrapper
export function ScheduleCostSummaryWithRsvp({
  scheduleId,
  canEdit,
}: {
  scheduleId: string;
  canEdit: boolean;
}) {
  const { rsvp } = useScheduleRsvp(scheduleId);
  return (
    <ScheduleCostSummary
      scheduleId={scheduleId}
      defaultAttendeeCount={rsvp?.going ?? 0}
      canEdit={canEdit}
    />
  );
}
