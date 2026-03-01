"use client";

import React, { memo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PracticeRoom } from "@/types";
import {
  type BookingFormValues,
  makeEmptyBookingForm,
  validateBookingForm,
} from "./practice-room-types";

// ─── 헬퍼: 레이블 + 인풋 조합 ────────────────────────────────

function FormField({ label, required, children }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </Label>
      {children}
    </div>
  );
}

// ─── 예약 생성/수정 다이얼로그 ────────────────────────────────

interface BookingFormDialogProps {
  rooms: PracticeRoom[];
  onSave: (values: BookingFormValues) => void;
  initial?: BookingFormValues;
  trigger: React.ReactNode;
  title: string;
}

export const BookingFormDialog = memo(function BookingFormDialog({
  rooms,
  onSave,
  initial,
  trigger,
  title,
}: BookingFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BookingFormValues>(initial ?? makeEmptyBookingForm());

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v) setForm(initial ?? makeEmptyBookingForm());
  }

  function set(field: keyof BookingFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    const err = validateBookingForm(form);
    if (err) { toast.error(err); return; }
    onSave(form);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md" aria-describedby="booking-dialog-desc">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
          <DialogDescription id="booking-dialog-desc" className="sr-only">
            예약 정보를 입력하고 저장하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 연습실 선택 */}
          <FormField label="연습실" required>
            {rooms.length === 0 ? (
              <p className="text-xs text-muted-foreground" role="alert">
                먼저 연습실을 등록해주세요.
              </p>
            ) : (
              <Select value={form.roomId} onValueChange={(v) => set("roomId", v)}>
                <SelectTrigger className="h-8 text-xs" aria-required="true">
                  <SelectValue placeholder="연습실 선택" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-xs">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          {/* 날짜 */}
          <FormField label="날짜" required>
            <Input
              className="h-8 text-xs" type="date"
              value={form.date} onChange={(e) => set("date", e.target.value)}
              aria-required="true"
            />
          </FormField>

          {/* 시작/종료 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <FormField label="시작 시간" required>
              <Input
                className="h-8 text-xs" type="time"
                value={form.startTime} onChange={(e) => set("startTime", e.target.value)}
                aria-required="true"
              />
            </FormField>
            <FormField label="종료 시간" required>
              <Input
                className="h-8 text-xs" type="time"
                value={form.endTime} onChange={(e) => set("endTime", e.target.value)}
                aria-required="true"
              />
            </FormField>
          </div>

          {/* 예약자 */}
          <FormField label="예약자" required>
            <Input
              className="h-8 text-xs" placeholder="예: 홍길동"
              value={form.bookedBy} onChange={(e) => set("bookedBy", e.target.value)}
              aria-required="true"
            />
          </FormField>

          {/* 메모 */}
          <FormField label="메모">
            <Input
              className="h-8 text-xs" placeholder="추가 메모"
              value={form.memo} onChange={(e) => set("memo", e.target.value)}
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
