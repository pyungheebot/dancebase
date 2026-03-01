"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { PosterProject } from "@/types";

// ============================================================
// 포스터 프로젝트 추가 폼
// ============================================================

interface AddProjectFormProps {
  onAdd: (partial: { posterName: string; deadline?: string }) => PosterProject;
  onClose: () => void;
}

export function AddProjectForm({ onAdd, onClose }: AddProjectFormProps) {
  const [posterName, setPosterName] = useState("");
  const [deadline, setDeadline] = useState("");

  const nameId = "add-poster-project-name";
  const deadlineId = "add-poster-project-deadline";

  function handleSubmit() {
    if (!posterName.trim()) {
      toast.error(TOAST.POSTER.NAME_REQUIRED);
      return;
    }
    onAdd({
      posterName: posterName.trim(),
      deadline: deadline || undefined,
    });
    toast.success(TOAST.POSTER.PROJECT_ADDED);
    onClose();
  }

  return (
    <div
      className="border rounded-lg p-3 bg-gray-50 space-y-2"
      role="region"
      aria-label="새 포스터 프로젝트 추가"
    >
      <p className="text-xs font-medium text-gray-700" aria-hidden="true">
        새 포스터 프로젝트
      </p>
      <div className="space-y-1">
        <Label htmlFor={nameId} className="text-xs">
          포스터 이름 <span aria-label="필수 항목">*</span>
        </Label>
        <Input
          id={nameId}
          className="h-8 text-xs"
          placeholder="예: 2024 공연 메인 포스터"
          value={posterName}
          onChange={(e) => setPosterName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          aria-required="true"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={deadlineId} className="text-xs">
          마감일
        </Label>
        <Input
          id={deadlineId}
          type="date"
          className="h-8 text-xs"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
        >
          추가
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </div>
  );
}
