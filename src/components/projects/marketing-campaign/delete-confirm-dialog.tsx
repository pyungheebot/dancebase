"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export type DeleteConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-xs"
        aria-labelledby="delete-confirm-dialog-title"
        aria-describedby="delete-confirm-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle id="delete-confirm-dialog-title" className="text-sm">
            태스크 삭제
          </DialogTitle>
        </DialogHeader>
        <p
          id="delete-confirm-dialog-desc"
          className="text-xs text-gray-600 py-1"
          role="alert"
        >
          이 태스크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-xs"
            onClick={onConfirm}
          >
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
