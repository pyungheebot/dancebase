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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { TicketMgmtType } from "@/types";
import { TYPE_META, TYPE_OPTIONS } from "./types";

interface AddTierDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingTypes: TicketMgmtType[];
  onAdd: (
    type: TicketMgmtType,
    price: number,
    totalSeats: number,
    description: string
  ) => void;
}

export function AddTierDialog({
  open,
  onOpenChange,
  existingTypes,
  onAdd,
}: AddTierDialogProps) {
  const [type, setType] = useState<TicketMgmtType>("general");
  const [price, setPrice] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [description, setDescription] = useState("");

  const typeSelectId = "add-tier-type";
  const priceId = "add-tier-price";
  const seatsId = "add-tier-seats";
  const descId = "add-tier-desc";

  function reset() {
    setType("general");
    setPrice("");
    setTotalSeats("");
    setDescription("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (existingTypes.includes(type)) {
      toast.error(TOAST.TICKET.TIER_DUPLICATE);
      return;
    }
    const priceNum = Number(price);
    const seatsNum = Number(totalSeats);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error(TOAST.TICKET.TIER_PRICE_REQUIRED);
      return;
    }
    if (isNaN(seatsNum) || seatsNum <= 0) {
      toast.error(TOAST.TICKET.TIER_SEAT_REQUIRED);
      return;
    }
    onAdd(type, priceNum, seatsNum, description.trim());
    toast.success(TOAST.TICKET.TIER_ADDED);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm">티어 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor={typeSelectId} className="text-xs">
              티켓 유형 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as TicketMgmtType)}
            >
              <SelectTrigger id={typeSelectId} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TYPE_META[t].label}
                    {existingTypes.includes(t) ? " (이미 추가됨)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={priceId} className="text-xs">
              가격 (원) <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={priceId}
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={seatsId} className="text-xs">
              총 좌석 수 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={seatsId}
              type="number"
              min={1}
              value={totalSeats}
              onChange={(e) => setTotalSeats(e.target.value)}
              placeholder="100"
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={descId} className="text-xs">
              설명
            </Label>
            <Input
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="티어 설명 (선택)"
              className="h-8 text-xs"
              maxLength={100}
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
