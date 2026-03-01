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

// ============================================================
// Props
// ============================================================

export type BudgetLimitDialogProps = {
  open: boolean;
  onClose: () => void;
  currentLimit: number | null;
  onSave: (limit: number | null) => Promise<void>;
};

// ============================================================
// 컴포넌트
// ============================================================

export function BudgetLimitDialog({
  open,
  onClose,
  currentLimit,
  onSave,
}: BudgetLimitDialogProps) {
  const [value, setValue] = useState<string>(
    currentLimit !== null ? String(currentLimit) : ""
  );

  const titleId = "budget-limit-dialog-title";
  const descId = "budget-limit-dialog-desc";
  const inputId = "budget-limit-input";

  async function handleSave() {
    if (value === "") {
      await onSave(null);
      toast.success(TOAST.GROUP_BUDGET.BUDGET_LIMIT_RELEASED);
    } else {
      const parsed = parseInt(value, 10);
      if (!parsed || parsed <= 0) {
        toast.error(TOAST.GROUP_BUDGET.AMOUNT_INVALID);
        return;
      }
      await onSave(parsed);
      toast.success(TOAST.GROUP_BUDGET.MONTHLY_BUDGET_SET);
    }
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" aria-labelledby={titleId} aria-describedby={descId}>
        <DialogHeader>
          <DialogTitle id={titleId} className="text-sm">
            월별 예산 한도 설정
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p id={descId} className="text-xs text-muted-foreground">
            이번 달 지출 한도를 설정하면 진행률 바가 표시됩니다. 비워두면 한도
            없음으로 처리됩니다.
          </p>
          <Label htmlFor={inputId} className="sr-only">
            월별 예산 한도 (원)
          </Label>
          <Input
            id={inputId}
            className="h-8 text-xs"
            type="number"
            min={0}
            placeholder="예: 500000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-describedby={descId}
          />
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
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
