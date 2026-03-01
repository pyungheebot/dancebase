"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemLabel?: string;
  loading?: boolean;
};

export function DeleteConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title = "삭제 확인",
  description,
  itemLabel,
  loading = false,
}: DeleteConfirmDialogProps) {
  const resolvedDescription =
    description ??
    (itemLabel
      ? `${itemLabel}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
      : "정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
