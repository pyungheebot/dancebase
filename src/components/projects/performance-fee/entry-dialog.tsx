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
import type { PerformanceFeeRole } from "@/types";
import {
  type EntryFormData,
  EMPTY_ENTRY_FORM,
  ROLE_LABELS,
  ROLE_ORDER,
} from "./types";

// ============================================================
// 멤버 추가/수정 다이얼로그
// ============================================================

export function EntryDialog({
  open,
  onClose,
  onSubmit,
  initial,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EntryFormData) => void;
  initial?: EntryFormData;
  title: string;
}) {
  const [form, setForm] = useState<EntryFormData>(initial ?? EMPTY_ENTRY_FORM);

  if (!open) return null;

  function set<K extends keyof EntryFormData>(key: K, value: EntryFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.memberName.trim()) {
      toast.error(TOAST.PERFORMANCE_FEE.MEMBER_REQUIRED);
      return;
    }
    const fee = parseInt(form.baseFee.replace(/,/g, ""), 10);
    if (isNaN(fee) || fee < 0) {
      toast.error(TOAST.PERFORMANCE_FEE.BASE_FEE_REQUIRED);
      return;
    }
    onSubmit({ ...form, baseFee: String(fee) });
  }

  const memberNameId = "entry-dialog-member-name";
  const roleId = "entry-dialog-role";
  const baseFeeId = "entry-dialog-base-fee";
  const notesId = "entry-dialog-notes";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label htmlFor={memberNameId} className="text-xs">
              멤버 이름 *
            </Label>
            <Input
              id={memberNameId}
              className="h-8 text-xs"
              placeholder="이름 입력"
              value={form.memberName}
              onChange={(e) => set("memberName", e.target.value)}
              aria-required="true"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={roleId} className="text-xs">
                역할 *
              </Label>
              <Select
                value={form.role}
                onValueChange={(v) => set("role", v as PerformanceFeeRole)}
              >
                <SelectTrigger id={roleId} className="h-8 text-xs" aria-required="true">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_ORDER.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor={baseFeeId} className="text-xs">
                기본 출연료 (원) *
              </Label>
              <Input
                id={baseFeeId}
                className="h-8 text-xs"
                placeholder="예: 100000"
                value={form.baseFee}
                onChange={(e) =>
                  set("baseFee", e.target.value.replace(/[^0-9]/g, ""))
                }
                aria-required="true"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor={notesId} className="text-xs">
              메모
            </Label>
            <Textarea
              id={notesId}
              className="text-xs min-h-[60px] resize-none"
              placeholder="추가 메모"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

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
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
