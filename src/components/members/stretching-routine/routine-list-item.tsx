"use client";

import { memo } from "react";
import { Activity, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StretchingRoutine } from "@/types";
import type { RoutineDetailProps } from "./types";
import { RoutineDetail } from "./routine-detail";

interface RoutineListItemProps {
  routine: StretchingRoutine;
  isExpanded: boolean;
  onToggle: (routineId: string) => void;
  onAddExercise: RoutineDetailProps["onAddExercise"];
  onDeleteExercise: RoutineDetailProps["onDeleteExercise"];
  onDeleteRoutine: RoutineDetailProps["onDeleteRoutine"];
}

export const RoutineListItem = memo(function RoutineListItem({
  routine,
  isExpanded,
  onToggle,
  onAddExercise,
  onDeleteExercise,
  onDeleteRoutine,
}: RoutineListItemProps) {
  return (
    <div
      className="rounded-lg border border-gray-200 overflow-hidden"
      role="listitem"
    >
      <button
        className="flex w-full items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors"
        onClick={() => onToggle(routine.id)}
        aria-expanded={isExpanded}
        aria-controls={`routine-detail-${routine.id}`}
        aria-label={`${routine.routineName} 루틴 ${isExpanded ? "접기" : "펼치기"}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium truncate">
            {routine.routineName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <span
            className="text-[10px] text-muted-foreground flex items-center gap-0.5"
            aria-label={`총 ${routine.totalMinutes}분`}
          >
            <Clock className="h-2.5 w-2.5" aria-hidden="true" />
            {routine.totalMinutes}분
          </span>
          <Badge
            className="text-[10px] px-1 py-0 bg-gray-100 text-gray-600 border-0"
            aria-label={`운동 ${routine.exercises.length}개`}
          >
            {routine.exercises.length}개
          </Badge>
          <ChevronRight
            className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </div>
      </button>

      {isExpanded && (
        <div
          id={`routine-detail-${routine.id}`}
          className="border-t border-gray-100 px-3 py-2 bg-gray-50/50"
        >
          <RoutineDetail
            routine={routine}
            onAddExercise={onAddExercise}
            onDeleteExercise={onDeleteExercise}
            onDeleteRoutine={onDeleteRoutine}
          />
        </div>
      )}
    </div>
  );
});
