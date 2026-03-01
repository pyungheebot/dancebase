"use client";

import { useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StretchingBodyPart } from "@/types";
import { BODY_PART_COLORS, BODY_PART_LABELS } from "./types";
import type { RoutineDetailProps } from "./types";
import { AddExerciseForm } from "./add-exercise-form";

export function RoutineDetail({
  routine,
  onAddExercise,
  onDeleteExercise,
  onDeleteRoutine,
}: RoutineDetailProps) {
  const [showExForm, setShowExForm] = useState(false);

  // 부위별 그룹핑
  const byBodyPart: Partial<
    Record<StretchingBodyPart, typeof routine.exercises>
  > = {};
  routine.exercises.forEach((ex) => {
    if (!byBodyPart[ex.bodyPart]) byBodyPart[ex.bodyPart] = [];
    byBodyPart[ex.bodyPart]!.push(ex);
  });

  return (
    <div className="space-y-2">
      {routine.exercises.length === 0 ? (
        <p
          className="text-xs text-muted-foreground text-center py-2"
          role="status"
          aria-live="polite"
        >
          아직 운동이 없습니다.
        </p>
      ) : (
        <div
          className="space-y-1.5"
          role="list"
          aria-label={`${routine.routineName} 운동 목록`}
        >
          {(
            Object.entries(byBodyPart) as [
              StretchingBodyPart,
              typeof routine.exercises,
            ][]
          ).map(([bp, exercises]) => (
            <div key={bp} role="listitem">
              <p
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-medium mb-1 ${BODY_PART_COLORS[bp]}`}
              >
                {BODY_PART_LABELS[bp]}
              </p>
              <div className="space-y-0.5 pl-1" role="list" aria-label={`${BODY_PART_LABELS[bp]} 운동 목록`}>
                {exercises.map((ex) => (
                  <div
                    key={ex.id}
                    role="listitem"
                    className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium truncate">
                        {ex.name}
                      </span>
                      <span
                        className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-0.5"
                        aria-label={`${ex.durationSeconds}초 ${ex.sets}세트`}
                      >
                        <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                        {ex.durationSeconds}초 x {ex.sets}세트
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {ex.description && (
                        <span
                          className="text-[10px] text-muted-foreground max-w-[80px] truncate"
                          title={ex.description}
                          aria-label={`설명: ${ex.description}`}
                        >
                          {ex.description}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
                        onClick={() => onDeleteExercise(routine.id, ex.id)}
                        aria-label={`${ex.name} 운동 삭제`}
                      >
                        <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
                        <span className="sr-only">{ex.name} 삭제</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showExForm ? (
        <AddExerciseForm
          routineId={routine.id}
          onAdd={onAddExercise}
          onClose={() => setShowExForm(false)}
        />
      ) : (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] flex-1 border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            onClick={() => setShowExForm(true)}
            aria-label="운동 추가 폼 열기"
          >
            <Plus className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
            운동 추가
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDeleteRoutine(routine.id)}
            aria-label={`${routine.routineName} 루틴 삭제`}
          >
            <Trash2 className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
            루틴 삭제
          </Button>
        </div>
      )}
    </div>
  );
}
