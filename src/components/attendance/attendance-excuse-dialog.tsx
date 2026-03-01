"use client";

import { useState, useEffect, startTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, X, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  submitExcuse,
  getMyExcuse,
  type AttendanceExcuse,
} from "@/hooks/use-attendance-excuses";
import { useAsyncAction } from "@/hooks/use-async-action";

type AttendanceExcuseDialogProps = {
  scheduleId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
};

const excuseStatusConfig = {
  pending: {
    label: "면제 대기중",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "면제 승인됨",
    icon: ShieldCheck,
    className: "bg-green-100 text-green-700 border-green-200",
  },
  rejected: {
    label: "면제 거절됨",
    icon: X,
    className: "bg-red-100 text-red-700 border-red-200",
  },
} as const;

export function AttendanceExcuseDialog({
  scheduleId,
  userId,
  open,
  onOpenChange,
  onSubmitted,
}: AttendanceExcuseDialogProps) {
  const [reason, setReason] = useState("");
  const { pending: submitting, execute } = useAsyncAction();
  const [existing, setExisting] = useState<AttendanceExcuse | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Dialog 열릴 때 기존 신청 내역 조회
  useEffect(() => {
    if (!open) return;
    startTransition(() => {
      setLoadingExisting(true);
      getMyExcuse(scheduleId, userId)
        .then((data) => {
          setExisting(data);
          if (data?.excuse_reason) {
            setReason(data.excuse_reason);
          }
        })
        .finally(() => setLoadingExisting(false));
    });
  }, [open, scheduleId, userId]);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("결석 사유를 입력해주세요");
      return;
    }
    if (trimmed.length < 5) {
      toast.error("사유를 5자 이상 입력해주세요");
      return;
    }

    await execute(async () => {
      const { error } = await submitExcuse(scheduleId, userId, trimmed);

      if (error) {
        toast.error("면제 신청에 실패했습니다");
        return;
      }

      toast.success("면제 신청이 제출되었습니다. 리더의 승인을 기다려주세요.");
      onOpenChange(false);
      onSubmitted?.();
    });
  };

  const hasExistingExcuse =
    existing?.excuse_reason && existing.excuse_status;
  const excuseStatus = existing?.excuse_status;
  const statusConfig =
    excuseStatus ? excuseStatusConfig[excuseStatus] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            결석 사유 제출
          </DialogTitle>
        </DialogHeader>

        {loadingExisting ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            불러오는 중...
          </div>
        ) : (
          <div className="space-y-3">
            {/* 기존 신청 상태 표시 */}
            {hasExistingExcuse && statusConfig && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <statusConfig.icon className="h-3.5 w-3.5" />
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  제출한 사유: {existing.excuse_reason}
                </p>
                {excuseStatus === "rejected" && (
                  <p className="text-xs text-red-600">
                    면제가 거절되었습니다. 사유를 수정하여 다시 제출할 수 있습니다.
                  </p>
                )}
                {excuseStatus === "approved" && (
                  <p className="text-xs text-green-700">
                    면제가 승인되어 출석률 계산에서 제외됩니다.
                  </p>
                )}
              </div>
            )}

            {/* 사유 입력 (승인된 경우는 수정 불가) */}
            {excuseStatus !== "approved" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  결석 사유
                </label>
                <Textarea
                  placeholder="결석 사유를 상세히 입력해주세요 (예: 업무 출장, 가족 행사 등)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-sm min-h-[100px] resize-none"
                  maxLength={500}
                />
                <p className="text-[11px] text-muted-foreground text-right">
                  {reason.length}/500
                </p>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              * 리더가 승인하면 해당 일정은 출석률 계산에서 제외됩니다.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
          {excuseStatus !== "approved" && !loadingExisting && (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? "제출 중..." : hasExistingExcuse ? "재제출" : "제출"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
