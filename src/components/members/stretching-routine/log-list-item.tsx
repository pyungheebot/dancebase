"use client";

import { memo } from "react";
import { Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StretchingLog, StretchingRoutine } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";
import { getDayLabel } from "./types";

interface LogListItemProps {
  log: StretchingLog;
  routine: StretchingRoutine | undefined;
  onDelete: (logId: string) => void;
}

export const LogListItem = memo(function LogListItem({
  log,
  routine,
  onDelete,
}: LogListItemProps) {
  const completionRate =
    routine && routine.exercises.length > 0
      ? Math.round(
          (log.completedExercises.length / routine.exercises.length) * 100
        )
      : 0;

  const dateLabel = `${formatMonthDay(log.date)}(${getDayLabel(log.date)})`;
  const routineName = routine?.routineName ?? "삭제된 루틴";

  return (
    <div
      className="flex items-start justify-between rounded-md bg-muted/40 px-2 py-1.5 gap-2"
      role="listitem"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <time
            dateTime={log.date}
            className="text-xs font-medium"
          >
            {dateLabel}
          </time>
          <span className="text-[10px] text-muted-foreground truncate">
            {routineName}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {routine && routine.exercises.length > 0 && (
            <span
              className="text-[10px] text-muted-foreground"
              aria-label={`${log.completedExercises.length}개 중 ${routine.exercises.length}개 완료, ${completionRate}%`}
            >
              {log.completedExercises.length}/{routine.exercises.length}개 ({completionRate}%)
            </span>
          )}
          {log.flexibilityRating !== undefined && (
            <span
              className="text-[10px] flex items-center gap-0.5 text-amber-600"
              aria-label={`유연성 점수 ${log.flexibilityRating}/5`}
            >
              <Star className="h-2.5 w-2.5" aria-hidden="true" />
              {log.flexibilityRating}/5
            </span>
          )}
          {log.notes && (
            <span
              className="text-[10px] text-muted-foreground truncate max-w-[100px]"
              title={log.notes}
              aria-label={`메모: ${log.notes}`}
            >
              {log.notes}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500 flex-shrink-0"
        onClick={() => onDelete(log.id)}
        aria-label={`${dateLabel} ${routineName} 기록 삭제`}
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" />
        <span className="sr-only">기록 삭제</span>
      </Button>
    </div>
  );
});
