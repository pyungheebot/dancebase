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
import { FormField } from "@/components/ui/form-field";
import { ShieldCheck, Clock, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  submitExcuse,
  getMyExcuse,
  type AttendanceExcuse,
} from "@/hooks/use-attendance-excuses";
import { useAsyncAction } from "@/hooks/use-async-action";
import { validateField, VALIDATION } from "@/lib/validation-rules";

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
  const [reasonError, setReasonError] = useState<string | null>(null);
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

  // reason blur 시 검증
  const handleReasonBlur = () => {
    setReasonError(validateField(reason, VALIDATION.reason));
  };

  const handleSubmit = async () => {
    // 최종 검증
    const err = validateField(reason, VALIDATION.reason);
    setReasonError(err);
    if (err) {
      toast.error(TOAST.ATTENDANCE.EXCUSE_REASON_MIN);
      return;
    }

    await execute(async () => {
      const { error } = await submitExcuse(scheduleId, userId, reason.trim());

      if (error) {
        toast.error(TOAST.ATTENDANCE.EXCUSE_ERROR);
        return;
      }

      toast.success(TOAST.ATTENDANCE.EXCUSE_SUBMITTED);
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
            <FileText className="h-4 w-4" aria-hidden="true" />
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
              <div className="rounded-md border p-3 space-y-2" role="status" aria-label="기존 면제 신청 상태">
                <div className="flex items-center gap-1.5">
                  <statusConfig.icon className="h-3.5 w-3.5" aria-hidden="true" />
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
              <FormField
                label="결석 사유"
                htmlFor="excuse-reason"
                required
                error={reasonError}
                description="5자 이상 상세히 입력해주세요"
              >
                <Textarea
                  id="excuse-reason"
                  placeholder="결석 사유를 상세히 입력해주세요 (예: 업무 출장, 가족 행사 등)"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (reasonError) setReasonError(validateField(e.target.value, VALIDATION.reason));
                  }}
                  onBlur={handleReasonBlur}
                  className="text-sm min-h-[100px] resize-none"
                  maxLength={500}
                  showCharCount
                  aria-invalid={!!reasonError}
                  aria-required="true"
                />
              </FormField>
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
            aria-label="다이얼로그 닫기"
          >
            닫기
          </Button>
          {excuseStatus !== "approved" && !loadingExisting && (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={submitting || !reason.trim()}
              aria-label={hasExistingExcuse ? "결석 사유 재제출" : "결석 사유 제출"}
            >
              {submitting ? "제출 중..." : hasExistingExcuse ? "재제출" : "제출"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
