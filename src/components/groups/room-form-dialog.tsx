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
  type RoomFormValues,
  EMPTY_ROOM_FORM,
  validateRoomForm,
} from "./practice-room-types";

// ─── 연습실 등록/수정 다이얼로그 ──────────────────────────────

interface RoomFormDialogProps {
  /** 저장 시 호출되는 콜백 */
  onSave: (values: RoomFormValues) => void;
  /** 수정 시 기존 값 */
  initial?: RoomFormValues;
  /** 다이얼로그를 여는 트리거 엘리먼트 */
  trigger: React.ReactNode;
  /** 다이얼로그 제목 */
  title: string;
}

const descriptionId = "room-form-dialog-desc";

export const RoomFormDialog = memo(function RoomFormDialog({
  onSave,
  initial,
  trigger,
  title,
}: RoomFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RoomFormValues>(initial ?? EMPTY_ROOM_FORM);

  /** 다이얼로그 열림/닫힘 처리 - 열릴 때 폼 초기화 */
  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v) setForm(initial ?? EMPTY_ROOM_FORM);
  }

  /** 개별 필드 변경 핸들러 */
  function handleChange(field: keyof RoomFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  /** 저장 버튼 클릭 핸들러 - 유효성 검사 후 저장 */
  function handleSubmit() {
    const err = validateRoomForm(form);
    if (err) {
      toast.error(err);
      return;
    }
    onSave(form);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-md"
        aria-describedby={descriptionId}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
          <DialogDescription id={descriptionId} className="sr-only">
            연습실 정보를 입력하고 저장하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 연습실 이름 */}
          <div className="space-y-1">
            <Label htmlFor="room-name" className="text-xs">
              연습실 이름 <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="room-name"
              className="h-8 text-xs"
              placeholder="예: 홍대 댄스스튜디오 A홀"
              maxLength={50}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 주소 */}
          <div className="space-y-1">
            <Label htmlFor="room-address" className="text-xs">
              주소 <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="room-address"
              className="h-8 text-xs"
              placeholder="예: 서울시 마포구 홍익로 123"
              maxLength={200}
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 수용 인원 / 시간당 비용 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="room-capacity" className="text-xs">
                수용 인원 <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="room-capacity"
                className="h-8 text-xs"
                type="number"
                min={1}
                max={1000}
                placeholder="20"
                value={form.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
                aria-required="true"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="room-cost" className="text-xs">
                시간당 비용 (원) <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="room-cost"
                className="h-8 text-xs"
                type="number"
                min={0}
                max={9999999}
                placeholder="30000"
                value={form.costPerHour}
                onChange={(e) => handleChange("costPerHour", e.target.value)}
                aria-required="true"
              />
            </div>
          </div>

          {/* 연락처 */}
          <div className="space-y-1">
            <Label htmlFor="room-contact" className="text-xs">
              연락처
            </Label>
            <Input
              id="room-contact"
              className="h-8 text-xs"
              placeholder="010-0000-0000"
              value={form.contact}
              onChange={(e) => handleChange("contact", e.target.value)}
              aria-label="연락처 (선택 입력)"
            />
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
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
