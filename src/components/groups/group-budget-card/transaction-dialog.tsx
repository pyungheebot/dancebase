"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { GroupBudgetTransaction, GroupBudgetCategory } from "@/types";
import {
  EMPTY_FORM,
  buildFormFromTransaction,
  validateTransactionForm,
  parseFormAmount,
  type TransactionFormData,
} from "./types";

// ============================================================
// Props
// ============================================================

export type TransactionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<GroupBudgetTransaction, "id" | "createdAt">
  ) => Promise<void>;
  categories: GroupBudgetCategory[];
  initial?: GroupBudgetTransaction | null;
};

// ============================================================
// 컴포넌트
// ============================================================

export function TransactionDialog({
  open,
  onClose,
  onSubmit,
  categories,
  initial,
}: TransactionDialogProps) {
  const [form, setForm] = useState<TransactionFormData>(
    initial ? buildFormFromTransaction(initial) : EMPTY_FORM
  );
  const { pending: saving, execute } = useAsyncAction();

  const isEdit = !!initial;
  const dialogId = isEdit ? "edit-transaction-dialog" : "add-transaction-dialog";
  const titleId = `${dialogId}-title`;

  function update<K extends keyof TransactionFormData>(
    key: K,
    value: TransactionFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const error = validateTransactionForm(form);
    if (error) {
      toast.error(error);
      return;
    }

    await execute(async () => {
      try {
        await onSubmit({
          type: form.type,
          category: form.category,
          description: form.description.trim(),
          amount: parseFormAmount(form.amount),
          date: form.date,
          paidBy: form.paidBy.trim() || null,
          receiptNote: form.receiptNote.trim() || null,
        });
        toast.success(isEdit ? "거래가 수정되었습니다" : "거래가 추가되었습니다");
        onClose();
      } catch {
        toast.error(TOAST.SAVE_ERROR);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId} className="text-sm">
            {isEdit ? "거래 수정" : "거래 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3" role="form" aria-label={isEdit ? "거래 수정 폼" : "거래 추가 폼"}>
          {/* 유형 선택 */}
          <fieldset>
            <legend className="mb-1.5 text-xs font-medium">거래 유형</legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={form.type === "income"}
                onClick={() => setForm((f) => ({ ...f, type: "income", category: "" }))}
                className={cn(
                  "rounded-md border py-2 text-xs font-medium transition-colors",
                  form.type === "income"
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : "border-muted text-muted-foreground hover:border-green-400"
                )}
              >
                <TrendingUp className="mx-auto mb-0.5 h-3.5 w-3.5" aria-hidden="true" />
                수입
              </button>
              <button
                type="button"
                aria-pressed={form.type === "expense"}
                onClick={() => setForm((f) => ({ ...f, type: "expense", category: "" }))}
                className={cn(
                  "rounded-md border py-2 text-xs font-medium transition-colors",
                  form.type === "expense"
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "border-muted text-muted-foreground hover:border-red-400"
                )}
              >
                <TrendingDown className="mx-auto mb-0.5 h-3.5 w-3.5" aria-hidden="true" />
                지출
              </button>
            </div>
          </fieldset>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-category`} className="text-xs">
              카테고리
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => update("category", v)}
            >
              <SelectTrigger
                id={`${dialogId}-category`}
                className="h-8 text-xs"
                aria-required="true"
              >
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name} className="text-xs">
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-description`} className="text-xs">
              내용
            </Label>
            <Input
              id={`${dialogId}-description`}
              className="h-8 text-xs"
              placeholder="거래 내용을 입력하세요"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 금액 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-amount`} className="text-xs">
              금액 (원)
            </Label>
            <Input
              id={`${dialogId}-amount`}
              className="h-8 text-xs"
              type="number"
              placeholder="0"
              min={0}
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-date`} className="text-xs">
              날짜
            </Label>
            <Input
              id={`${dialogId}-date`}
              className="h-8 text-xs"
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 납부자 (선택) */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-paidBy`} className="text-xs">
              납부자 / 결제자 (선택)
            </Label>
            <Input
              id={`${dialogId}-paidBy`}
              className="h-8 text-xs"
              placeholder="이름 입력"
              value={form.paidBy}
              onChange={(e) => update("paidBy", e.target.value)}
            />
          </div>

          {/* 메모 (선택) */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-receiptNote`} className="text-xs">
              영수증 메모 (선택)
            </Label>
            <Textarea
              id={`${dialogId}-receiptNote`}
              className="min-h-[56px] resize-none text-xs"
              placeholder="영수증 내용이나 메모"
              value={form.receiptNote}
              onChange={(e) => update("receiptNote", e.target.value)}
            />
          </div>
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
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
