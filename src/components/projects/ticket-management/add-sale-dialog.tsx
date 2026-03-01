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
import type { TicketMgmtType, TicketMgmtEvent, TicketMgmtSale } from "@/types";
import type { TicketMgmtEventStats } from "@/hooks/use-ticket-management";
import { TYPE_META, formatPrice } from "./types";

interface AddSaleDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: TicketMgmtEvent;
  eventStats: TicketMgmtEventStats | null;
  onAdd: (sale: Omit<TicketMgmtSale, "id" | "soldAt">) => void;
}

export function AddSaleDialog({
  open,
  onOpenChange,
  event,
  eventStats,
  onAdd,
}: AddSaleDialogProps) {
  const [buyerName, setBuyerName] = useState("");
  const [ticketType, setTicketType] = useState<TicketMgmtType>(
    event.tiers[0]?.type ?? "general"
  );
  const [quantity, setQuantity] = useState("1");
  const [seatInfo, setSeatInfo] = useState("");
  const [notes, setNotes] = useState("");

  const buyerNameId = "add-sale-buyer";
  const ticketTypeId = "add-sale-type";
  const quantityId = "add-sale-qty";
  const seatInfoId = "add-sale-seat";
  const notesId = "add-sale-notes";
  const totalSummaryId = "add-sale-total-summary";

  function reset() {
    setBuyerName("");
    setTicketType(event.tiers[0]?.type ?? "general");
    setQuantity("1");
    setSeatInfo("");
    setNotes("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  const selectedTier = event.tiers.find((t) => t.type === ticketType);
  const selectedTierStats = eventStats?.tierStats.find(
    (ts) => ts.type === ticketType
  );
  const qty = parseInt(quantity, 10) || 0;
  const unitPrice = selectedTier?.price ?? 0;
  const totalPrice = unitPrice * qty;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (event.tiers.length === 0) {
      toast.error(TOAST.TICKET.TIER_ADD_REQUIRED);
      return;
    }
    if (qty <= 0) {
      toast.error(TOAST.TICKET.QUANTITY_REQUIRED);
      return;
    }
    if (selectedTierStats && qty > selectedTierStats.remainingSeats) {
      toast.error(
        `잔여석이 부족합니다. (잔여: ${selectedTierStats.remainingSeats}석)`
      );
      return;
    }
    onAdd({
      buyerName: buyerName.trim() || undefined,
      ticketType,
      quantity: qty,
      totalPrice,
      seatInfo: seatInfo.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    toast.success(TOAST.TICKET.SALES_ADDED);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm">판매 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor={buyerNameId} className="text-xs">
              구매자 이름
            </Label>
            <Input
              id={buyerNameId}
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="예: 홍길동 (선택)"
              className="h-8 text-xs"
              autoFocus
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={ticketTypeId} className="text-xs">
              티켓 유형 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Select
              value={ticketType}
              onValueChange={(v) => setTicketType(v as TicketMgmtType)}
            >
              <SelectTrigger id={ticketTypeId} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {event.tiers.map((tier) => {
                  const ts = eventStats?.tierStats.find(
                    (s) => s.type === tier.type
                  );
                  return (
                    <SelectItem
                      key={tier.type}
                      value={tier.type}
                      className="text-xs"
                    >
                      {TYPE_META[tier.type].label} — {formatPrice(tier.price)}
                      {ts ? ` (잔여 ${ts.remainingSeats}석)` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={quantityId} className="text-xs">
              수량 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={quantityId}
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>
          {unitPrice > 0 && qty > 0 && (
            <div
              id={totalSummaryId}
              role="status"
              aria-live="polite"
              className="rounded-md bg-gray-50 px-3 py-2 flex items-center justify-between"
            >
              <span className="text-xs text-muted-foreground">합계</span>
              <span className="text-xs font-semibold text-gray-800">
                {formatPrice(totalPrice)}
              </span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor={seatInfoId} className="text-xs">
              좌석 정보
            </Label>
            <Input
              id={seatInfoId}
              value={seatInfo}
              onChange={(e) => setSeatInfo(e.target.value)}
              placeholder="예: A구역 3열 5번 (선택)"
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={notesId} className="text-xs">
              메모
            </Label>
            <Textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="특이사항 메모 (선택)"
              className="text-xs resize-none"
              rows={2}
              maxLength={200}
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
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
