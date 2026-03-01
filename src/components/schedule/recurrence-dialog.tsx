"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// 반복 일정 수정/삭제 범위 타입 (calendar-view와 공유)
export type RecurrenceScope = "this" | "this_and_future" | "all";

// 반복 일정 삭제 범위 선택 다이얼로그
export function RecurrenceDeleteDialog({
  open,
  onOpenChange,
  onSelect,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (scope: RecurrenceScope) => void;
  loading: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>반복 일정 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            삭제할 범위를 선택해주세요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Button
            variant="outline"
            className="justify-start h-auto py-2.5 px-3"
            disabled={loading}
            onClick={() => onSelect("this")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">이 일정만</p>
              <p className="text-xs text-muted-foreground mt-0.5">선택한 일정 1개만 삭제합니다</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-2.5 px-3"
            disabled={loading}
            onClick={() => onSelect("this_and_future")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">이후 모든 일정</p>
              <p className="text-xs text-muted-foreground mt-0.5">이 일정과 이후 날짜의 시리즈를 모두 삭제합니다</p>
            </div>
          </Button>
          <Button
            variant="destructive"
            className="justify-start h-auto py-2.5 px-3"
            disabled={loading}
            onClick={() => onSelect("all")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">전체 시리즈</p>
              <p className="text-xs text-destructive-foreground/80 mt-0.5">같은 반복 일정 전체를 삭제합니다</p>
            </div>
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// 반복 일정 수정 범위 선택 다이얼로그
export function RecurrenceEditDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (scope: RecurrenceScope) => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>반복 일정 수정</AlertDialogTitle>
          <AlertDialogDescription>
            수정할 범위를 선택해주세요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Button
            variant="outline"
            className="justify-start h-auto py-2.5 px-3"
            onClick={() => onSelect("this")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">이 일정만</p>
              <p className="text-xs text-muted-foreground mt-0.5">선택한 일정 1개만 수정합니다</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-2.5 px-3"
            onClick={() => onSelect("this_and_future")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">이후 모든 일정</p>
              <p className="text-xs text-muted-foreground mt-0.5">이 일정과 이후 날짜의 시리즈를 모두 수정합니다 (날짜 제외)</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-2.5 px-3"
            onClick={() => onSelect("all")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">전체 시리즈</p>
              <p className="text-xs text-muted-foreground mt-0.5">같은 반복 일정 전체를 수정합니다 (날짜 제외)</p>
            </div>
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
