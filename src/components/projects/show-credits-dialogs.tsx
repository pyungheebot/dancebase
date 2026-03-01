"use client";

import { useState, useEffect, startTransition } from "react";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { CREDIT_SECTION_DEFAULT_TITLES } from "@/hooks/use-show-credits";
import type { CreditSectionType } from "@/types";
import { SECTION_TYPE_OPTIONS } from "./show-credits-types";

// ============================================================
// 섹션 추가 Dialog
// ============================================================

interface AddSectionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: CreditSectionType, customTitle?: string) => void;
}

export function AddSectionDialog({ open, onClose, onAdd }: AddSectionDialogProps) {
  const [type, setType] = useState<CreditSectionType>("cast");
  const [customTitle, setCustomTitle] = useState("");

  const typeSelectId = "add-section-type";
  const titleInputId = "add-section-title";

  function handleSubmit() {
    onAdd(type, customTitle || undefined);
    setType("cast");
    setCustomTitle("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            크레딧 섹션 추가
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={typeSelectId} className="text-xs">
              섹션 유형
            </Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as CreditSectionType)}
            >
              <SelectTrigger id={typeSelectId} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={titleInputId} className="text-xs">
              섹션 제목{" "}
              <span className="text-muted-foreground">
                (비워두면 기본값 사용)
              </span>
            </Label>
            <Input
              id={titleInputId}
              className="h-8 text-xs"
              placeholder={CREDIT_SECTION_DEFAULT_TITLES[type]}
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 인원 추가/수정 Dialog
// ============================================================

interface PersonDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, role: string) => void;
  initial?: { name: string; role: string };
  mode: "add" | "edit";
}

export function PersonDialog({
  open,
  onClose,
  onSave,
  initial,
  mode,
}: PersonDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");

  const nameInputId = `person-name-${mode}`;
  const roleInputId = `person-role-${mode}`;

  useEffect(() => {
    if (open) {
      const n = initial?.name ?? "";
      const r = initial?.role ?? "";
      startTransition(() => {
        setName(n);
        setRole(r);
      });
    }
  }, [open, initial]);

  function handleSubmit() {
    if (!name.trim()) {
      toast.error(TOAST.SHOW_CREDITS.NAME_REQUIRED);
      return;
    }
    onSave(name, role);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "인원 추가" : "인원 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={nameInputId} className="text-xs">
              이름 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={nameInputId}
              className="h-8 text-xs"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              aria-required="true"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={roleInputId} className="text-xs">
              역할/직함
            </Label>
            <Input
              id={roleInputId}
              className="h-8 text-xs"
              placeholder="메인 댄서"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
