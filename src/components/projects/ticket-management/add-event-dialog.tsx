"use client";

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

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (eventName: string, eventDate: string) => void;
}

export function AddEventDialog({
  open,
  onOpenChange,
  onAdd,
}: AddEventDialogProps) {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");

  const nameId = "add-event-name";
  const dateId = "add-event-date";

  function reset() {
    setEventName("");
    setEventDate("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = eventName.trim();
    if (!name) {
      toast.error(TOAST.CHECKIN_EVENT.NAME_REQUIRED);
      return;
    }
    onAdd(name, eventDate);
    toast.success(TOAST.SHOW_TIMELINE.EVENT_ADDED);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm">이벤트 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor={nameId} className="text-xs">
              이벤트 이름 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={nameId}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="예: 2026 정기공연"
              className="h-8 text-xs"
              autoFocus
              maxLength={100}
              aria-required="true"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={dateId} className="text-xs">
              공연 날짜
            </Label>
            <Input
              id={dateId}
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
