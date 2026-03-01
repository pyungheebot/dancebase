"use client";

import { useState } from "react";
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

import type { PerfTicketTier, PerfTicketAllocation, PerfAllocationStatus } from "@/types";
import { TIER_COLORS } from "./performance-ticket-types";

// ============================================================
// 다이얼로그: 등급 추가/수정
// ============================================================

export function TierDialog({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<PerfTicketTier, "id">) => void;
  initial?: PerfTicketTier;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [totalQuantity, setTotalQuantity] = useState(
    String(initial?.totalQuantity ?? "")
  );
  const [color, setColor] = useState(initial?.color ?? TIER_COLORS[0].value);

  const dialogId = "tier-dialog";
  const nameId = `${dialogId}-name`;
  const priceId = `${dialogId}-price`;
  const qtyId = `${dialogId}-qty`;
  const colorId = `${dialogId}-color`;

  function handleSave() {
    if (!name.trim()) {
      toast.error(TOAST.TICKET.GRADE_NAME_REQUIRED);
      return;
    }
    const priceNum = Number(price);
    const qtyNum = Number(totalQuantity);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error(TOAST.TICKET.GRADE_PRICE_REQUIRED);
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error(TOAST.TICKET.QUANTITY_REQUIRED);
      return;
    }
    onSave({ name: name.trim(), price: priceNum, totalQuantity: qtyNum, color });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{initial ? "등급 수정" : "등급 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor={nameId} className="text-xs">
              등급 이름 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={nameId}
              className="h-8 text-sm"
              placeholder="예: VIP, 일반석, 학생"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-required="true"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={priceId} className="text-xs">
                가격 (원)
              </Label>
              <Input
                id={priceId}
                className="h-8 text-sm"
                type="number"
                min={0}
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={qtyId} className="text-xs">
                총 수량 <span aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </Label>
              <Input
                id={qtyId}
                className="h-8 text-sm"
                type="number"
                min={1}
                placeholder="100"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                aria-required="true"
              />
            </div>
          </div>
          <div className="space-y-1">
            <p id={colorId} className="text-xs font-medium leading-none">
              색상
            </p>
            <div
              className="flex flex-wrap gap-2 pt-1"
              role="radiogroup"
              aria-labelledby={colorId}
            >
              {TIER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={color === c.value}
                  aria-label={c.label}
                  className={`h-6 w-6 rounded-full border-2 transition-all ${
                    color === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 다이얼로그: 배분 추가/수정
// ============================================================

export function AllocationDialog({
  open,
  onClose,
  onSave,
  tiers,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<PerfTicketAllocation, "id" | "createdAt">) => void;
  tiers: PerfTicketTier[];
  initial?: PerfTicketAllocation;
}) {
  const [tierId, setTierId] = useState(initial?.tierId ?? tiers[0]?.id ?? "");
  const [recipientName, setRecipientName] = useState(
    initial?.recipientName ?? ""
  );
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? "1"));
  const [status, setStatus] = useState<PerfAllocationStatus>(
    initial?.status ?? "reserved"
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const dialogId = "allocation-dialog";
  const tierSelectId = `${dialogId}-tier`;
  const recipientId = `${dialogId}-recipient`;
  const quantityId = `${dialogId}-quantity`;
  const statusId = `${dialogId}-status`;
  const notesId = `${dialogId}-notes`;

  function handleSave() {
    if (!tierId) {
      toast.error(TOAST.TICKET.GRADE_SELECT_REQUIRED);
      return;
    }
    if (!recipientName.trim()) {
      toast.error(TOAST.TICKET.RECIPIENT_REQUIRED);
      return;
    }
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error(TOAST.TICKET.QUANTITY_REQUIRED);
      return;
    }
    onSave({
      tierId,
      recipientName: recipientName.trim(),
      quantity: qty,
      status,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{initial ? "배분 수정" : "배분 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor={tierSelectId} className="text-xs">
              등급 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Select value={tierId} onValueChange={setTierId}>
              <SelectTrigger id={tierSelectId} className="h-8 text-sm" aria-required="true">
                <SelectValue placeholder="등급 선택" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={recipientId} className="text-xs">
              수령인 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={recipientId}
              className="h-8 text-sm"
              placeholder="이름 또는 단체명"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              aria-required="true"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={quantityId} className="text-xs">
                수량 <span aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </Label>
              <Input
                id={quantityId}
                className="h-8 text-sm"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                aria-required="true"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={statusId} className="text-xs">
                상태
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PerfAllocationStatus)}
              >
                <SelectTrigger id={statusId} className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reserved">예약</SelectItem>
                  <SelectItem value="confirmed">확정</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={notesId} className="text-xs">
              메모
            </Label>
            <Textarea
              id={notesId}
              className="text-sm resize-none min-h-[60px]"
              placeholder="메모 (선택)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 다이얼로그: 판매 목표 설정
// ============================================================

export function GoalDialog({
  open,
  onClose,
  onSave,
  current,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (goal: number | null) => void;
  current: number | null;
}) {
  const [value, setValue] = useState(current != null ? String(current) : "");

  const goalInputId = "goal-dialog-qty";
  const goalHintId = "goal-dialog-hint";

  function handleSave() {
    if (value.trim() === "") {
      onSave(null);
      onClose();
      return;
    }
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      toast.error(TOAST.TICKET.TARGET_QUANTITY_REQUIRED);
      return;
    }
    onSave(num);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs" aria-describedby={goalHintId}>
        <DialogHeader>
          <DialogTitle>판매 목표 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor={goalInputId} className="text-xs">
              목표 수량
            </Label>
            <Input
              id={goalInputId}
              className="h-8 text-sm"
              type="number"
              min={1}
              placeholder="비워두면 총 좌석 기준"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-describedby={goalHintId}
            />
            <p id={goalHintId} className="text-[10px] text-muted-foreground">
              비워두면 전체 좌석 수를 목표로 사용합니다.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
