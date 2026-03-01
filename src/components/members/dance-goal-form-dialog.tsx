"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { DanceGoalCategory, DanceGoalPriority } from "@/types";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  DEFAULT_FORM,
  type GoalFormData,
} from "./dance-goal-types";

// ============================================
// GoalFormDialog
// ============================================

export function GoalFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<GoalFormData>;
  onSubmit: (data: GoalFormData) => void;
  mode: "create" | "edit";
}) {
  const titleId = `goal-dialog-title-${mode}`;
  const [form, setForm] = useState<GoalFormData>({
    ...DEFAULT_FORM,
    ...initial,
  });

  const handleOpen = useCallback(() => {
    setForm({ ...DEFAULT_FORM, ...initial });
  }, [initial]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) handleOpen();
    else onClose();
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error(TOAST.MEMBERS.DANCE_GOAL_TITLE_REQUIRED);
      return;
    }
    onSubmit(form);
    onClose();
  };

  const categoryFieldId = `goal-form-category-${mode}`;
  const priorityFieldId = `goal-form-priority-${mode}`;
  const titleFieldId = `goal-form-title-${mode}`;
  const descFieldId = `goal-form-desc-${mode}`;
  const dateFieldId = `goal-form-date-${mode}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md"
        aria-labelledby={titleId}
      >
        <DialogHeader>
          <DialogTitle id={titleId} className="text-sm font-semibold">
            {mode === "create" ? "목표 추가" : "목표 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div className="space-y-1">
            <label
              htmlFor={titleFieldId}
              className="text-xs text-muted-foreground"
            >
              제목 *
            </label>
            <Input
              id={titleFieldId}
              className="h-8 text-xs"
              placeholder="예: 스플릿 완성하기"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              aria-required="true"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label
              htmlFor={descFieldId}
              className="text-xs text-muted-foreground"
            >
              설명
            </label>
            <Textarea
              id={descFieldId}
              className="text-xs resize-none"
              rows={2}
              placeholder="목표에 대한 간단한 설명"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          {/* 카테고리 / 우선순위 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor={categoryFieldId}
                className="text-xs text-muted-foreground"
              >
                카테고리
              </label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    category: v as DanceGoalCategory,
                  }))
                }
              >
                <SelectTrigger
                  id={categoryFieldId}
                  className="h-8 text-xs"
                  aria-label="카테고리 선택"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(CATEGORY_LABELS) as DanceGoalCategory[]
                  ).map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor={priorityFieldId}
                className="text-xs text-muted-foreground"
              >
                우선순위
              </label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    priority: v as DanceGoalPriority,
                  }))
                }
              >
                <SelectTrigger
                  id={priorityFieldId}
                  className="h-8 text-xs"
                  aria-label="우선순위 선택"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(PRIORITY_LABELS) as DanceGoalPriority[]
                  ).map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 목표 날짜 */}
          <div className="space-y-1">
            <label
              htmlFor={dateFieldId}
              className="text-xs text-muted-foreground"
            >
              목표 날짜
            </label>
            <Input
              id={dateFieldId}
              type="date"
              className="h-8 text-xs"
              value={form.targetDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, targetDate: e.target.value }))
              }
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onClose}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              {mode === "create" ? "추가" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
