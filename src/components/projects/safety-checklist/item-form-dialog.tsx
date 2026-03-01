"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { SafetyChecklistItem } from "@/types";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  type ItemFormParams,
} from "./types";
import type {
  SafetyChecklistCategory,
  SafetyChecklistPriority,
} from "@/types";

// ============================================================
// Props
// ============================================================

export interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: ItemFormParams) => void;
  editItem?: SafetyChecklistItem | null;
}

// ============================================================
// 컴포넌트
// ============================================================

export function ItemFormDialog({
  open,
  onClose,
  onSubmit,
  editItem,
}: ItemFormDialogProps) {
  const [category, setCategory] = useState<SafetyChecklistCategory>(
    editItem?.category ?? "stage"
  );
  const [content, setContent] = useState(editItem?.content ?? "");
  const [assignee, setAssignee] = useState(editItem?.assignee ?? "");
  const [priority, setPriority] = useState<SafetyChecklistPriority>(
    editItem?.priority ?? "medium"
  );
  const [notes, setNotes] = useState(editItem?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const contentId = "item-form-content";
  const assigneeId = "item-form-assignee";
  const notesId = "item-form-notes";
  const contentErrorId = "item-form-content-error";

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setCategory(editItem?.category ?? "stage");
      setContent(editItem?.content ?? "");
      setAssignee(editItem?.assignee ?? "");
      setPriority(editItem?.priority ?? "medium");
      setNotes(editItem?.notes ?? "");
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error(TOAST.SAFETY_CHECKLIST.CONTENT_REQUIRED);
      return;
    }
    setSaving(true);
    try {
      onSubmit({
        category,
        content,
        assignee: assignee || undefined,
        priority,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit();
    }
  };

  const dialogTitle = editItem ? "항목 수정" : "항목 추가";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        handleOpen(v);
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <fieldset className="space-y-3 py-2 border-0 p-0 m-0">
          <legend className="sr-only">안전 체크리스트 {dialogTitle} 양식</legend>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label htmlFor="item-form-category" className="text-xs">
              카테고리
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as SafetyChecklistCategory)}
            >
              <SelectTrigger
                id="item-form-category"
                className="h-8 text-xs"
                aria-label="카테고리 선택"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 항목 내용 */}
          <div className="space-y-1">
            <Label htmlFor={contentId} className="text-xs">
              항목 내용{" "}
              <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={contentId}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="확인할 안전 항목을 입력하세요"
              className="h-8 text-xs"
              aria-required="true"
              aria-describedby={!content.trim() ? contentErrorId : undefined}
            />
            <span id={contentErrorId} className="sr-only">
              항목 내용은 필수 입력 항목입니다.
            </span>
          </div>

          {/* 담당자 */}
          <div className="space-y-1">
            <Label htmlFor={assigneeId} className="text-xs">
              담당자
            </Label>
            <Input
              id={assigneeId}
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="담당자 이름 (선택)"
              className="h-8 text-xs"
            />
          </div>

          {/* 우선순위 */}
          <div className="space-y-1">
            <Label htmlFor="item-form-priority" className="text-xs">
              우선순위
            </Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as SafetyChecklistPriority)}
            >
              <SelectTrigger
                id="item-form-priority"
                className="h-8 text-xs"
                aria-label="우선순위 선택"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <Label htmlFor={notesId} className="text-xs">
              비고
            </Label>
            <Textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 메모 (선택)"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
        </fieldset>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
            aria-busy={saving}
          >
            {editItem ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
