"use client";

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
import type { AddSetDialogProps } from "./types";

export function AddSetDialog({
  open,
  value,
  onChange,
  onClose,
  onSubmit,
}: AddSetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent
        className="max-w-sm"
        aria-describedby="add-set-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            드레스 코드 세트 추가
          </DialogTitle>
        </DialogHeader>
        <p id="add-set-dialog-desc" className="sr-only">
          새 드레스 코드 세트에 사용할 공연명을 입력하세요.
        </p>
        <div className="space-y-2 py-2">
          <Label htmlFor="new-set-name" className="text-xs text-muted-foreground">
            공연명
          </Label>
          <Input
            id="new-set-name"
            className="h-8 text-xs"
            placeholder="예: 2026 봄 정기공연"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
            autoFocus
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
          <Button size="sm" className="h-7 text-xs" onClick={onSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
