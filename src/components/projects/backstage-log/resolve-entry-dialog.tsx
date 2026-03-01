"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

// ============================================================
// 해결 처리 다이얼로그
// ============================================================

export function ResolveEntryDialog({
  open,
  resolvedBy,
  onResolvedByChange,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  resolvedBy: string;
  onResolvedByChange: (v: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const handleConfirm = () => {
    if (!resolvedBy.trim()) {
      toast.error(TOAST.BACKSTAGE_LOG.HANDLER_REQUIRED);
      return;
    }
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs" aria-describedby="resolve-entry-desc">
        <DialogHeader>
          <DialogTitle className="text-sm">해결 처리</DialogTitle>
          <DialogDescription id="resolve-entry-desc" className="text-xs">
            처리한 담당자 이름을 입력하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="resolve-handler-name" className="text-xs">
            처리자 이름
          </Label>
          <Input
            id="resolve-handler-name"
            placeholder="이름 입력"
            value={resolvedBy}
            onChange={(e) => onResolvedByChange(e.target.value)}
            className="h-8 text-xs"
            aria-required="true"
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleConfirm}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
            해결 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
