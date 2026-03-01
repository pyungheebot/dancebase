"use client";

import { useState, useEffect, startTransition } from "react";
import { AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePreExcuse } from "@/hooks/use-pre-excuse";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { PreExcuseReason } from "@/types";

// ============================================================
// 사유 카테고리 옵션
// ============================================================

const REASON_OPTIONS: { value: PreExcuseReason; label: string; description: string }[] = [
  { value: "personal", label: "개인 사정", description: "가족 행사, 개인 용무 등" },
  { value: "health", label: "건강 문제", description: "질병, 부상, 피로 등" },
  { value: "conflict", label: "일정 충돌", description: "업무, 학업, 타 약속 등" },
  { value: "other", label: "기타", description: "위 항목에 해당하지 않는 경우" },
];

// ============================================================
// Props
// ============================================================

type Props = {
  groupId: string;
  scheduleId: string;
  scheduleTitle: string;
  scheduleStartAt?: string;
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ============================================================
// 컴포넌트
// ============================================================

export function PreExcuseDialog({
  groupId,
  scheduleId,
  scheduleTitle,
  scheduleStartAt,
  userId,
  userName,
  open,
  onOpenChange,
}: Props) {
  const { submitExcuse, getMyExcuse } = usePreExcuse(groupId);

  const [reason, setReason] = useState<PreExcuseReason>("personal");
  const [memo, setMemo] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const { pending: submitting, execute } = useAsyncAction();

  // 다이얼로그가 열릴 때 기존 신고 로드
  useEffect(() => {
    if (!open) return;
    const existing = getMyExcuse(scheduleId, userId);
    if (existing) {
      startTransition(() => {
        setReason(existing.reason);
        setMemo(existing.memo);
        setIsEditMode(true);
      });
    } else {
      startTransition(() => {
        setReason("personal");
        setMemo("");
        setIsEditMode(false);
      });
    }
  }, [open, scheduleId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 일정 시작 여부 확인
  const isScheduleStarted = scheduleStartAt
    ? new Date(scheduleStartAt) <= new Date()
    : false;

  const handleSubmit = () => {
    if (isScheduleStarted) {
      toast.error(TOAST.SCHEDULE.PRE_EXCUSE_STARTED);
      return;
    }
    execute(async () => {
      try {
        submitExcuse({ scheduleId, userId, userName, reason, memo });
        toast.success(isEditMode ? "사전 결석 신고가 수정되었습니다" : "사전 결석 신고가 등록되었습니다");
        onOpenChange(false);
      } catch {
        toast.error(isEditMode ? "수정에 실패했습니다" : "등록에 실패했습니다");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
            {isEditMode ? "사전 결석 신고 수정" : "사전 결석 신고"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {scheduleTitle}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 사유 카테고리 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">결석 사유</p>
            <RadioGroup
              value={reason}
              onValueChange={(v) => setReason(v as PreExcuseReason)}
              className="gap-2"
            >
              {REASON_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  className="flex items-start gap-2.5 rounded-md border p-2.5 cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  onClick={() => setReason(opt.value)}
                >
                  <RadioGroupItem
                    value={opt.value}
                    id={`reason-${opt.value}`}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`reason-${opt.value}`}
                    className="cursor-pointer flex flex-col gap-0.5"
                  >
                    <span className="text-xs font-medium">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {opt.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 상세 메모 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                상세 메모{" "}
                <span className="text-[10px] font-normal">(선택)</span>
              </p>
            </div>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="추가적인 내용이 있다면 입력해주세요"
              className="text-xs resize-none h-20"
              maxLength={200}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {memo.length}/200
            </p>
          </div>

          {/* 경고 메시지 */}
          {isScheduleStarted && (
            <p className="text-[11px] text-destructive bg-destructive/10 rounded-md px-3 py-2">
              이미 시작된 일정에는 사전 결석 신고를 할 수 없습니다.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting || isScheduleStarted}
          >
            {isEditMode ? "수정 완료" : "신고 등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
