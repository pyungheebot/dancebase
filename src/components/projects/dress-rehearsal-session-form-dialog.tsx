"use client";

// ============================================================
// 회차 추가/수정 폼 다이얼로그
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { DressRehearsalSession } from "@/types";

export interface SessionFormValues {
  date: string;
  time: string;
  venue: string;
}

interface SessionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: SessionFormValues) => void;
  /** 수정 모드일 때 기존 세션 */
  editSession?: DressRehearsalSession | null;
}

export function SessionFormDialog({
  open,
  onClose,
  onSubmit,
  editSession,
}: SessionFormDialogProps) {
  const [date, setDate] = useState(editSession?.date ?? "");
  const [time, setTime] = useState(editSession?.time ?? "");
  const [venue, setVenue] = useState(editSession?.venue ?? "");
  const { pending: saving, execute } = useAsyncAction();

  // 다이얼로그가 열릴 때 폼 값 초기화
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setDate(editSession?.date ?? "");
      setTime(editSession?.time ?? "");
      setVenue(editSession?.venue ?? "");
    }
    if (!isOpen) onClose();
  };

  const handleSubmit = async () => {
    if (!date.trim()) {
      toast.error(TOAST.DRESS_REHEARSAL.DATE_REQUIRED);
      return;
    }
    if (!venue.trim()) {
      toast.error(TOAST.DRESS_REHEARSAL.VENUE_REQUIRED);
      return;
    }
    await execute(async () => {
      onSubmit({ date, time, venue });
      onClose();
    });
  };

  const dialogDescId = editSession
    ? "session-edit-dialog-desc"
    : "session-add-dialog-desc";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={dialogDescId}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editSession ? "회차 수정" : "회차 추가"}
          </DialogTitle>
        </DialogHeader>
        {/* 접근성: 다이얼로그 설명 */}
        <p id={dialogDescId} className="sr-only">
          {editSession
            ? "리허설 회차 정보를 수정합니다."
            : "새 리허설 회차를 추가합니다."}
        </p>
        <div className="space-y-3 py-2">
          {/* 날짜 */}
          <div className="space-y-1">
            <Label htmlFor="session-date" className="text-xs">
              날짜 <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
              required
              aria-required="true"
            />
          </div>

          {/* 시간 */}
          <div className="space-y-1">
            <Label htmlFor="session-time" className="text-xs">시간</Label>
            <Input
              id="session-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <Label htmlFor="session-venue" className="text-xs">
              장소 <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              id="session-venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="리허설 장소를 입력하세요"
              className="h-8 text-xs"
              required
              aria-required="true"
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
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {editSession ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
