"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  UNIFIED_EVENT_TYPE_COLORS,
  UNIFIED_EVENT_TYPE_LABELS,
} from "@/hooks/use-unified-calendar";
import type { UnifiedCalendarEvent, UnifiedEventType } from "@/types";
import { ALL_TYPES, DEFAULT_FORM, todayStr } from "./types";

export interface AddEventDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (params: Omit<UnifiedCalendarEvent, "id" | "createdAt">) => void;
  memberNames: string[];
  defaultDate?: string;
}

export function AddEventDialog({
  open,
  onClose,
  onAdd,
  memberNames,
  defaultDate,
}: AddEventDialogProps) {
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    date: defaultDate ?? todayStr(),
  });

  const set = <K extends keyof typeof DEFAULT_FORM>(
    key: K,
    value: (typeof DEFAULT_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleParticipant = (name: string) => {
    setForm((prev) => ({
      ...prev,
      participants: prev.participants.includes(name)
        ? prev.participants.filter((p) => p !== name)
        : [...prev.participants, name],
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error(TOAST.UNIFIED_CALENDAR.TITLE_REQUIRED);
      return;
    }
    if (!form.date) {
      toast.error(TOAST.UNIFIED_CALENDAR.DATE_REQUIRED);
      return;
    }
    if (!form.isAllDay && form.startTime >= form.endTime) {
      toast.error(TOAST.UNIFIED_CALENDAR.END_AFTER_START);
      return;
    }
    onAdd({
      title: form.title.trim(),
      type: form.type,
      date: form.date,
      startTime: form.isAllDay ? "00:00" : form.startTime,
      endTime: form.isAllDay ? "23:59" : form.endTime,
      location: form.location.trim() || undefined,
      description: form.description.trim() || undefined,
      participants: form.participants,
      isAllDay: form.isAllDay,
      reminder: form.reminder,
      createdBy: form.createdBy.trim() || "나",
    });
    setForm({ ...DEFAULT_FORM, date: defaultDate ?? todayStr() });
    onClose();
    toast.success(TOAST.UNIFIED_CALENDAR.ADDED);
  };

  const handleClose = () => {
    setForm({ ...DEFAULT_FORM, date: defaultDate ?? todayStr() });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-w-sm max-h-[90vh] overflow-y-auto"
        aria-describedby="add-event-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm">새 일정 추가</DialogTitle>
        </DialogHeader>
        <p id="add-event-dialog-desc" className="sr-only">
          새 그룹 일정을 추가하는 폼입니다. 제목, 유형, 날짜를 필수로 입력하세요.
        </p>
        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div>
            <Label
              htmlFor="event-title"
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              제목 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="일정 제목을 입력하세요"
              className="h-7 text-xs"
              autoFocus
              aria-required="true"
            />
          </div>

          {/* 유형 */}
          <div>
            <Label
              htmlFor="event-type"
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              유형 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => set("type", v as UnifiedEventType)}
            >
              <SelectTrigger id="event-type" className="h-7 text-xs" aria-required="true">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${UNIFIED_EVENT_TYPE_COLORS[t].dot}`}
                        aria-hidden="true"
                      />
                      {UNIFIED_EVENT_TYPE_LABELS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 */}
          <div>
            <Label
              htmlFor="event-date"
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              날짜 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id="event-date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="h-7 text-xs"
              aria-required="true"
            />
          </div>

          {/* 종일 체크 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isAllDay"
              checked={form.isAllDay}
              onCheckedChange={(v) => set("isAllDay", Boolean(v))}
            />
            <Label
              htmlFor="isAllDay"
              className="text-xs cursor-pointer"
            >
              종일 일정
            </Label>
          </div>

          {/* 시간 */}
          {!form.isAllDay && (
            <fieldset>
              <legend className="sr-only">시간 범위</legend>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label
                    htmlFor="event-start-time"
                    className="text-[10px] text-muted-foreground mb-1 block"
                  >
                    시작 시간
                  </Label>
                  <Input
                    id="event-start-time"
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex-1">
                  <Label
                    htmlFor="event-end-time"
                    className="text-[10px] text-muted-foreground mb-1 block"
                  >
                    종료 시간
                  </Label>
                  <Input
                    id="event-end-time"
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set("endTime", e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* 장소 */}
          <div>
            <Label
              htmlFor="event-location"
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              장소
            </Label>
            <Input
              id="event-location"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="예: 연습실 A, 문화회관 대강당"
              className="h-7 text-xs"
            />
          </div>

          {/* 설명 */}
          <div>
            <Label
              htmlFor="event-description"
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              설명
            </Label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="일정 상세 내용을 입력하세요"
              className="min-h-[56px] resize-none text-xs"
            />
          </div>

          {/* 참여자 */}
          {memberNames.length > 0 && (
            <fieldset>
              <legend className="text-[10px] text-muted-foreground mb-1 block">
                참여자
              </legend>
              <div
                role="group"
                aria-label="참여자 선택"
                className="max-h-32 overflow-y-auto rounded border bg-muted/20 p-2 space-y-1"
              >
                {memberNames.map((name) => (
                  <div key={name} className="flex items-center gap-2">
                    <Checkbox
                      id={`participant-${name}`}
                      checked={form.participants.includes(name)}
                      onCheckedChange={() => toggleParticipant(name)}
                    />
                    <Label
                      htmlFor={`participant-${name}`}
                      className="text-xs cursor-pointer"
                    >
                      {name}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          {/* 리마인더 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="reminder"
              checked={form.reminder ?? false}
              onCheckedChange={(v) => set("reminder", Boolean(v))}
            />
            <Label htmlFor="reminder" className="text-xs cursor-pointer">
              리마인더 설정
            </Label>
          </div>

          {/* 작성자 */}
          <div>
            <Label
              htmlFor="event-created-by"
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              작성자
            </Label>
            <Input
              id="event-created-by"
              value={form.createdBy}
              onChange={(e) => set("createdBy", e.target.value)}
              placeholder="이름 (미입력 시 '나')"
              className="h-7 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!form.title.trim() || !form.date}
            aria-disabled={!form.title.trim() || !form.date}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
