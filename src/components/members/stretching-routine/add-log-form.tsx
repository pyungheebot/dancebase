"use client";

import { useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BODY_PART_COLORS, BODY_PART_LABELS, FLEXIBILITY_LABELS, today } from "./types";
import type { AddLogFormProps } from "./types";

export function AddLogForm({ routines, onAdd, onClose }: AddLogFormProps) {
  const [selectedRoutineId, setSelectedRoutineId] = useState(
    routines[0]?.id ?? ""
  );
  const [date, setDate] = useState(today);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [flexibilityRating, setFlexibilityRating] = useState<number | "">(3);
  const [notes, setNotes] = useState("");

  const selectedRoutine = routines.find((r) => r.id === selectedRoutineId);

  function toggleExercise(exerciseId: string) {
    setCompletedExercises((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  }

  function handleRoutineChange(routineId: string) {
    setSelectedRoutineId(routineId);
    setCompletedExercises([]);
  }

  function handleSubmit() {
    const ok = onAdd({
      routineId: selectedRoutineId,
      date,
      completedExercises,
      flexibilityRating:
        flexibilityRating !== "" ? Number(flexibilityRating) : undefined,
      notes: notes || undefined,
    });
    if (ok) onClose();
  }

  return (
    <div
      className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 space-y-3"
      role="form"
      aria-label="운동 기록 추가 폼"
    >
      <p className="text-xs font-semibold text-violet-700">운동 기록 추가</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="log-routine-select" className="text-xs">
            루틴 선택
          </Label>
          <Select value={selectedRoutineId} onValueChange={handleRoutineChange}>
            <SelectTrigger
              id="log-routine-select"
              className="h-7 text-xs"
              aria-label="기록할 루틴 선택"
            >
              <SelectValue placeholder="루틴 선택" />
            </SelectTrigger>
            <SelectContent>
              {routines.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-xs">
                  {r.routineName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="log-date-input" className="text-xs">
            날짜
          </Label>
          <Input
            id="log-date-input"
            type="date"
            className="h-7 text-xs"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {selectedRoutine && selectedRoutine.exercises.length > 0 && (
        <fieldset className="space-y-1">
          <legend className="text-xs font-medium">완료한 운동</legend>
          <div
            role="group"
            aria-label="완료한 운동 선택"
            className="space-y-1 rounded-md border border-violet-100 bg-card p-2"
          >
            {selectedRoutine.exercises.map((ex) => {
              const checked = completedExercises.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  role="checkbox"
                  aria-checked={checked}
                  className="flex w-full items-center gap-2 rounded px-1 py-0.5 hover:bg-violet-50 text-left"
                  onClick={() => toggleExercise(ex.id)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      toggleExercise(ex.id);
                    }
                  }}
                >
                  {checked ? (
                    <CheckSquare
                      className="h-3.5 w-3.5 text-violet-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Square
                      className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-xs">{ex.name}</span>
                  <span
                    className={`ml-auto text-[10px] rounded-full px-1.5 py-0 ${BODY_PART_COLORS[ex.bodyPart]}`}
                    aria-label={`신체 부위: ${BODY_PART_LABELS[ex.bodyPart]}`}
                  >
                    {BODY_PART_LABELS[ex.bodyPart]}
                  </span>
                </button>
              );
            })}
          </div>
          <p
            className="text-[10px] text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {completedExercises.length}/{selectedRoutine.exercises.length}개 완료
          </p>
        </fieldset>
      )}

      <fieldset className="space-y-1">
        <legend className="text-xs font-medium">유연성 평가 (1~5)</legend>
        <div
          role="radiogroup"
          aria-label="유연성 점수 선택"
          className="flex gap-1"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={flexibilityRating === n}
              aria-label={`${n}점 - ${FLEXIBILITY_LABELS[n]}`}
              className={`h-7 w-7 rounded text-xs font-medium border transition-colors ${
                flexibilityRating === n
                  ? "bg-violet-600 text-white border-violet-600"
                  : "border-gray-200 text-muted-foreground hover:border-violet-300"
              }`}
              onClick={() =>
                setFlexibilityRating(flexibilityRating === n ? "" : n)
              }
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setFlexibilityRating(flexibilityRating === n ? "" : n);
                }
              }}
            >
              {n}
            </button>
          ))}
          {flexibilityRating !== "" && (
            <span
              className="ml-1 self-center text-[10px] text-violet-600 font-medium"
              aria-live="polite"
            >
              {FLEXIBILITY_LABELS[flexibilityRating as number]}
            </span>
          )}
        </div>
      </fieldset>

      <div className="space-y-1">
        <Label htmlFor="log-notes-textarea" className="text-xs">
          메모 (선택)
        </Label>
        <Textarea
          id="log-notes-textarea"
          className="min-h-[40px] text-xs resize-none"
          placeholder="오늘 스트레칭 소감..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
          aria-label="운동 기록 취소"
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
          onClick={handleSubmit}
          aria-label="운동 기록 저장"
        >
          저장
        </Button>
      </div>
    </div>
  );
}
