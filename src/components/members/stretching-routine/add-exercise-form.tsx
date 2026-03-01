"use client";

import { useState } from "react";
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
import type { StretchingBodyPart } from "@/types";
import { BODY_PARTS, BODY_PART_LABELS } from "./types";
import type { AddExerciseFormProps } from "./types";

export function AddExerciseForm({
  routineId,
  onAdd,
  onClose,
}: AddExerciseFormProps) {
  const [form, setForm] = useState({
    name: "",
    bodyPart: "full_body" as StretchingBodyPart,
    durationSeconds: 30,
    sets: 3,
    description: "",
  });

  function handleSubmit() {
    const ok = onAdd(routineId, {
      name: form.name,
      bodyPart: form.bodyPart,
      durationSeconds: Number(form.durationSeconds),
      sets: Number(form.sets),
      description: form.description || undefined,
    });
    if (ok) onClose();
  }

  return (
    <div
      className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2 mt-2"
      role="form"
      aria-label="운동 추가 폼"
    >
      <p className="text-xs font-semibold text-emerald-700">운동 추가</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="exercise-name-input" className="text-xs">
            운동 이름
          </Label>
          <Input
            id="exercise-name-input"
            className="h-7 text-xs"
            placeholder="예: 목 좌우 돌리기"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="exercise-body-part-select" className="text-xs">
            신체 부위
          </Label>
          <Select
            value={form.bodyPart}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, bodyPart: v as StretchingBodyPart }))
            }
          >
            <SelectTrigger
              id="exercise-body-part-select"
              className="h-7 text-xs"
              aria-label="신체 부위 선택"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BODY_PARTS.map((bp) => (
                <SelectItem key={bp} value={bp} className="text-xs">
                  {BODY_PART_LABELS[bp]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="exercise-duration-input" className="text-xs">
            유지 시간 (초)
          </Label>
          <Input
            id="exercise-duration-input"
            type="number"
            className="h-7 text-xs"
            min={5}
            max={300}
            value={form.durationSeconds}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                durationSeconds: parseInt(e.target.value, 10) || 0,
              }))
            }
            aria-describedby="duration-hint"
          />
          <span id="duration-hint" className="sr-only">
            5초에서 300초 사이로 입력하세요
          </span>
        </div>
        <div className="space-y-1">
          <Label htmlFor="exercise-sets-input" className="text-xs">
            세트 수
          </Label>
          <Input
            id="exercise-sets-input"
            type="number"
            className="h-7 text-xs"
            min={1}
            max={20}
            value={form.sets}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sets: parseInt(e.target.value, 10) || 0,
              }))
            }
            aria-describedby="sets-hint"
          />
          <span id="sets-hint" className="sr-only">
            1세트에서 20세트 사이로 입력하세요
          </span>
        </div>
        <div className="space-y-1">
          <Label htmlFor="exercise-description-input" className="text-xs">
            설명 (선택)
          </Label>
          <Input
            id="exercise-description-input"
            className="h-7 text-xs"
            placeholder="자세 설명..."
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
          aria-label="운동 추가 취소"
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleSubmit}
          aria-label="운동 추가 확인"
        >
          추가
        </Button>
      </div>
    </div>
  );
}
