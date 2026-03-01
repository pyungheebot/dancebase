"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { LookDialogProps } from "./types";

export function LookDialog({ open, mode, initial, onClose, onSubmit }: LookDialogProps) {
  const [lookName, setLookName] = useState(initial?.lookName ?? "");
  const [performanceName, setPerformanceName] = useState(
    initial?.performanceName ?? ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    String(initial?.estimatedMinutes ?? "")
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = () => {
    if (!lookName.trim()) {
      toast.error(TOAST.MAKEUP_SHEET.LOOK_NAME_REQUIRED);
      return;
    }
    if (!performanceName.trim()) {
      toast.error(TOAST.MAKEUP_SHEET.SHOW_NAME_REQUIRED);
      return;
    }
    onSubmit({
      lookName: lookName.trim(),
      performanceName: performanceName.trim(),
      notes: notes.trim() || undefined,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
    });
    onClose();
  };

  const dialogId = "look-dialog";
  const lookNameId = `${dialogId}-look-name`;
  const performanceNameId = `${dialogId}-performance-name`;
  const estimatedMinutesId = `${dialogId}-estimated-minutes`;
  const notesId = `${dialogId}-notes`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-sm"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "룩 추가" : "룩 편집"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 룩 이름 */}
          <div className="space-y-1">
            <Label htmlFor={lookNameId} className="text-xs text-muted-foreground">
              룩 이름
            </Label>
            <Input
              id={lookNameId}
              className="h-8 text-xs"
              placeholder="예: 무대 메인 룩, 커튼콜 룩"
              value={lookName}
              onChange={(e) => setLookName(e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 공연 이름 */}
          <div className="space-y-1">
            <Label htmlFor={performanceNameId} className="text-xs text-muted-foreground">
              공연 이름
            </Label>
            <Input
              id={performanceNameId}
              className="h-8 text-xs"
              placeholder="예: 2024 봄 정기공연"
              value={performanceName}
              onChange={(e) => setPerformanceName(e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 예상 소요시간 */}
          <div className="space-y-1">
            <Label htmlFor={estimatedMinutesId} className="text-xs text-muted-foreground">
              예상 소요시간 (분, 선택)
            </Label>
            <Input
              id={estimatedMinutesId}
              className="h-8 text-xs"
              type="number"
              min={1}
              placeholder="예: 30"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label htmlFor={notesId} className="text-xs text-muted-foreground">
              메모 (선택)
            </Label>
            <Textarea
              id={notesId}
              className="text-xs min-h-[56px] resize-none"
              placeholder="특이사항 또는 주의사항 입력"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
