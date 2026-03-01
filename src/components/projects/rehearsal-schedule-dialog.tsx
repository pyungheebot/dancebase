"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

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

import { type AddRehearsalParams } from "@/hooks/use-rehearsal-schedule";
import type {
  RehearsalScheduleItem,
  RehearsalScheduleType as RehearsalType,
} from "@/types";
import { TYPE_LABELS, ALL_TYPES } from "./rehearsal-schedule-types";

// ============================================================
// 타입
// ============================================================

export type RehearsalDialogMode = "add" | "edit";

export type RehearsalDialogProps = {
  open: boolean;
  mode: RehearsalDialogMode;
  initial?: Partial<RehearsalScheduleItem>;
  onClose: () => void;
  onSubmit: (params: AddRehearsalParams) => void;
};

// ============================================================
// 추가/수정 다이얼로그
// ============================================================

export function RehearsalDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: RehearsalDialogProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "14:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "17:00");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [type, setType] = useState<RehearsalType>(initial?.type ?? "full");
  const [participantsStr, setParticipantsStr] = useState(
    (initial?.participants ?? []).join(", ")
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // open 변경 시 초기값 재설정
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(initial?.title ?? "");
      setDate(initial?.date ?? "");
      setStartTime(initial?.startTime ?? "14:00");
      setEndTime(initial?.endTime ?? "17:00");
      setLocation(initial?.location ?? "");
      setType(initial?.type ?? "full");
      setParticipantsStr((initial?.participants ?? []).join(", "));
      setNotes(initial?.notes ?? "");
    }
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.REHEARSAL_SCHEDULE.TITLE_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.REHEARSAL_SCHEDULE.DATE_REQUIRED);
      return;
    }
    if (!startTime) {
      toast.error(TOAST.REHEARSAL_SCHEDULE.START_TIME_REQUIRED);
      return;
    }
    const participants = participantsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit({
      title: title.trim(),
      date,
      startTime,
      endTime: endTime.trim() || null,
      location: location.trim() || null,
      type,
      participants,
      notes: notes.trim(),
    });
    onClose();
  };

  const titleId = "rehearsal-dialog-title";
  const dateId = "rehearsal-dialog-date";
  const typeId = "rehearsal-dialog-type";
  const startTimeId = "rehearsal-dialog-start-time";
  const endTimeId = "rehearsal-dialog-end-time";
  const locationId = "rehearsal-dialog-location";
  const participantsId = "rehearsal-dialog-participants";
  const notesId = "rehearsal-dialog-notes";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        aria-labelledby="rehearsal-dialog-heading"
      >
        <DialogHeader>
          <DialogTitle id="rehearsal-dialog-heading" className="text-sm">
            {mode === "add" ? "리허설 추가" : "리허설 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor={titleId} className="text-xs">
              제목 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 1차 전체 런스루"
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>

          {/* 유형 */}
          <div className="space-y-1">
            <Label htmlFor={typeId} className="text-xs">
              유형 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as RehearsalType)}
            >
              <SelectTrigger id={typeId} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label htmlFor={dateId} className="text-xs">
              날짜 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={dateId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>

          {/* 시작/종료 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={startTimeId} className="text-xs">
                시작 시간 <span aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </Label>
              <Input
                id={startTimeId}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8 text-xs"
                aria-required="true"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={endTimeId} className="text-xs">
                종료 시간
              </Label>
              <Input
                id={endTimeId}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <Label htmlFor={locationId} className="text-xs">
              장소
            </Label>
            <Input
              id={locationId}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예) 연습실 A"
              className="h-8 text-xs"
            />
          </div>

          {/* 참여자 */}
          <div className="space-y-1">
            <Label htmlFor={participantsId} className="text-xs">
              참여자 (쉼표 구분)
            </Label>
            <Input
              id={participantsId}
              value={participantsStr}
              onChange={(e) => setParticipantsStr(e.target.value)}
              placeholder="예) 김지수, 이민준, 박소연"
              className="h-8 text-xs"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label htmlFor={notesId} className="text-xs">
              메모
            </Label>
            <Textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="준비사항, 특이사항 등"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            <X className="h-3 w-3 mr-1" aria-hidden="true" />
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
