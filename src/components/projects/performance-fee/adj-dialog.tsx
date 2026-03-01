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
import type { PerformanceFeeAdjustmentType } from "@/types";
import {
  type AdjFormData,
  EMPTY_ADJ_FORM,
  ADJ_TYPE_LABELS,
  ADJ_TYPES_ALLOWANCE,
  ADJ_TYPES_DEDUCTION,
} from "./types";

// ============================================================
// 수당/공제 항목 추가 다이얼로그
// ============================================================

export function AdjDialog({
  open,
  onClose,
  onSubmit,
  memberName,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AdjFormData) => void;
  memberName: string;
}) {
  const [form, setForm] = useState<AdjFormData>(EMPTY_ADJ_FORM);

  if (!open) return null;

  function set<K extends keyof AdjFormData>(key: K, value: AdjFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // kind 변경 시 type 초기화
      if (key === "kind") {
        next.type =
          value === "allowance" ? "rehearsal" : "transport";
      }
      return next;
    });
  }

  function handleSubmit() {
    const amt = parseInt(form.amount.replace(/,/g, ""), 10);
    if (isNaN(amt) || amt <= 0) {
      toast.error(TOAST.PERFORMANCE_FEE.AMOUNT_REQUIRED);
      return;
    }
    const label = form.label.trim() || ADJ_TYPE_LABELS[form.type];
    onSubmit({ ...form, label, amount: String(amt) });
  }

  const typeOptions =
    form.kind === "allowance" ? ADJ_TYPES_ALLOWANCE : ADJ_TYPES_DEDUCTION;

  const kindId = "adj-dialog-kind";
  const typeId = "adj-dialog-type";
  const labelId = "adj-dialog-label";
  const amountId = "adj-dialog-amount";
  const dialogDescId = "adj-dialog-desc";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" aria-describedby={dialogDescId}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            항목 추가 — {memberName}
          </DialogTitle>
          <p id={dialogDescId} className="sr-only">
            {memberName} 멤버에게 수당 또는 공제 항목을 추가합니다.
          </p>
        </DialogHeader>

        <fieldset className="space-y-3 py-1 border-0 p-0 m-0">
          <legend className="sr-only">수당/공제 항목 정보</legend>

          <div className="space-y-1">
            <Label htmlFor={kindId} className="text-xs">
              구분 *
            </Label>
            <Select
              value={form.kind}
              onValueChange={(v) =>
                set("kind", v as "allowance" | "deduction")
              }
            >
              <SelectTrigger id={kindId} className="h-8 text-xs" aria-required="true">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allowance" className="text-xs">
                  추가 수당
                </SelectItem>
                <SelectItem value="deduction" className="text-xs">
                  공제 항목
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor={typeId} className="text-xs">
              항목 유형 *
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                set("type", v as PerformanceFeeAdjustmentType)
              }
            >
              <SelectTrigger id={typeId} className="h-8 text-xs" aria-required="true">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {ADJ_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor={labelId} className="text-xs">
              설명 (선택)
            </Label>
            <Input
              id={labelId}
              className="h-8 text-xs"
              placeholder="항목 설명 (비워두면 유형명 사용)"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={amountId} className="text-xs">
              금액 (원) *
            </Label>
            <Input
              id={amountId}
              className="h-8 text-xs"
              placeholder="예: 30000"
              value={form.amount}
              onChange={(e) =>
                set("amount", e.target.value.replace(/[^0-9]/g, ""))
              }
              aria-required="true"
              inputMode="numeric"
            />
          </div>
        </fieldset>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
