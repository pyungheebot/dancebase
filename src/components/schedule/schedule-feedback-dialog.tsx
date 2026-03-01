"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useScheduleFeedback } from "@/hooks/use-schedule-feedback";
import { useAsyncAction } from "@/hooks/use-async-action";

type Props = {
  scheduleId: string;
  scheduleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ScheduleFeedbackDialog({
  scheduleId,
  scheduleTitle,
  open,
  onOpenChange,
}: Props) {
  const { submitFeedback, getMyFeedback } = useScheduleFeedback(scheduleId);

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const { pending: submitting, execute } = useAsyncAction();
  const [loadingExisting, setLoadingExisting] = useState(false);

  // 다이얼로그가 열릴 때 기존 피드백 로드
  useEffect(() => {
    if (!open) return;

    const loadMyFeedback = async () => {
      setLoadingExisting(true);
      try {
        const existing = await getMyFeedback();
        if (existing) {
          setRating(existing.rating);
          setComment(existing.comment ?? "");
          setIsEditMode(true);
        } else {
          setRating(0);
          setComment("");
          setIsEditMode(false);
        }
      } catch {
        // 로드 실패 시 기본값 유지
      } finally {
        setLoadingExisting(false);
      }
    };

    loadMyFeedback();
  }, [open, scheduleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(TOAST.SCHEDULE.FEEDBACK_RATING_REQUIRED);
      return;
    }

    await execute(async () => {
      try {
        await submitFeedback(rating, comment || null);
        toast.success(isEditMode ? "평가가 수정되었습니다" : "평가가 등록되었습니다");
        onOpenChange(false);
      } catch {
        toast.error(isEditMode ? "평가 수정에 실패했습니다" : "평가 등록에 실패했습니다");
      }
    });
  };

  const displayRating = hoveredRating || rating;

  const ratingLabels: Record<number, string> = {
    1: "매우 불만족",
    2: "불만족",
    3: "보통",
    4: "만족",
    5: "매우 만족",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {isEditMode ? "평가 수정" : "일정 만족도 평가"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{scheduleTitle}</p>
        </DialogHeader>

        {loadingExisting ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* 별점 선택 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">만족도</p>
              <div className="flex items-center gap-1.5 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`${star}점`}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= displayRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-none text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center h-4">
                {displayRating > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {ratingLabels[displayRating]}
                  </span>
                )}
              </div>
            </div>

            {/* 코멘트 입력 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  코멘트 <span className="text-[10px] font-normal">(선택)</span>
                </p>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="이번 연습에 대한 의견을 자유롭게 적어주세요"
                className="text-xs resize-none h-20"
                maxLength={300}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {comment.length}/300
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <SubmitButton
            size="sm"
            className="h-8 text-xs"
            onClick={handleSubmit}
            loading={submitting}
            loadingText={isEditMode ? "수정 중..." : "등록 중..."}
            disabled={loadingExisting || rating === 0}
          >
            {isEditMode ? "수정 완료" : "평가 등록"}
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
