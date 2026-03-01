"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddRoutineFormProps } from "./types";

export function AddRoutineForm({ onAdd, onClose }: AddRoutineFormProps) {
  const [name, setName] = useState("");

  function handleSubmit() {
    const ok = onAdd({ routineName: name });
    if (ok) {
      setName("");
      onClose();
    }
  }

  return (
    <div
      className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 space-y-2"
      role="form"
      aria-label="새 루틴 추가 폼"
    >
      <p className="text-xs font-semibold text-teal-700">새 루틴 추가</p>
      <div className="space-y-1">
        <Label htmlFor="routine-name-input" className="text-xs">
          루틴 이름
        </Label>
        <Input
          id="routine-name-input"
          className="h-7 text-xs"
          placeholder="예: 연습 전 기본 스트레칭"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          aria-describedby="routine-name-hint"
        />
        <span id="routine-name-hint" className="sr-only">
          루틴 이름을 입력하고 Enter 또는 추가 버튼을 누르세요
        </span>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
          aria-label="루틴 추가 취소"
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white"
          onClick={handleSubmit}
          aria-label="루틴 추가 확인"
        >
          추가
        </Button>
      </div>
    </div>
  );
}
