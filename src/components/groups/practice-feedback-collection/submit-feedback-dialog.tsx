"use client";

import { useState } from "react";
import { EyeOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
import { StarRating } from "./star-rating";
import { CATEGORY_KEYS, CATEGORY_META, DEFAULT_RATING } from "./types";
import type { PracticeFeedbackRating } from "@/types";

type SubmitFeedbackDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string;
  memberNames: string[];
  onSubmit: (
    sessionId: string,
    params: {
      authorName: string;
      isAnonymous: boolean;
      overallRating: number;
      categoryRatings: PracticeFeedbackRating;
      goodPoints?: string;
      improvements?: string;
    }
  ) => boolean;
};

export function SubmitFeedbackDialog({
  open,
  onOpenChange,
  sessionId,
  memberNames,
  onSubmit,
}: SubmitFeedbackDialogProps) {
  const [authorName, setAuthorName] = useState(memberNames[0] ?? "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [overallRating, setOverallRating] = useState(3);
  const [categoryRatings, setCategoryRatings] =
    useState<PracticeFeedbackRating>(DEFAULT_RATING);
  const [goodPoints, setGoodPoints] = useState("");
  const [improvements, setImprovements] = useState("");

  const anonymousSwitchId = "submit-feedback-anonymous";
  const authorNameId = "submit-feedback-author-name";
  const overallRatingId = "submit-feedback-overall-rating";
  const goodPointsId = "submit-feedback-good-points";
  const improvementsId = "submit-feedback-improvements";

  const setCategoryValue = (
    key: keyof PracticeFeedbackRating,
    value: number
  ) => {
    setCategoryRatings((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setAuthorName(memberNames[0] ?? "");
    setIsAnonymous(false);
    setOverallRating(3);
    setCategoryRatings(DEFAULT_RATING);
    setGoodPoints("");
    setImprovements("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAnonymous && !authorName.trim()) {
      toast.error(TOAST.PRACTICE_FEEDBACK_COLLECTION.NAME_REQUIRED);
      return;
    }

    const ok = onSubmit(sessionId, {
      authorName: authorName.trim(),
      isAnonymous,
      overallRating,
      categoryRatings,
      goodPoints: goodPoints.trim() || undefined,
      improvements: improvements.trim() || undefined,
    });

    if (!ok) {
      toast.error(TOAST.PRACTICE_FEEDBACK.SUBMIT_ERROR);
      return;
    }
    toast.success(TOAST.PRACTICE_FEEDBACK.SUBMITTED);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            피드백 제출
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 pt-1"
          aria-label="피드백 제출 폼"
        >
          {/* 익명 여부 */}
          <div className="flex items-center justify-between">
            <Label htmlFor={anonymousSwitchId} className="text-xs font-medium cursor-pointer">
              익명으로 제출
            </Label>
            <div className="flex items-center gap-1.5">
              {isAnonymous && (
                <EyeOff className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              )}
              <Switch
                id={anonymousSwitchId}
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                aria-describedby="anonymous-hint"
              />
            </div>
            <p id="anonymous-hint" className="sr-only">
              익명으로 제출하면 이름이 표시되지 않습니다
            </p>
          </div>

          {/* 작성자 이름 */}
          {!isAnonymous && (
            <div className="space-y-1">
              <label htmlFor={authorNameId} className="text-xs font-medium text-foreground">
                이름
              </label>
              <Input
                id={authorNameId}
                placeholder="이름을 입력하세요"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="h-8 text-xs"
                maxLength={30}
                list="member-names-list"
                aria-required="true"
                autoComplete="off"
              />
              <datalist id="member-names-list">
                {memberNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          )}

          {/* 전체 만족도 */}
          <fieldset className="space-y-1.5 border-0 p-0 m-0">
            <legend className="text-xs font-medium text-foreground w-full flex items-center justify-between">
              <span id={overallRatingId}>전체 만족도</span>
              <span className="text-[10px] text-yellow-600 font-semibold" aria-live="polite">
                {overallRating} / 5
              </span>
            </legend>
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
            />
          </fieldset>

          {/* 카테고리별 평가 */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="text-xs font-medium text-foreground">
              카테고리별 평가
            </legend>
            {CATEGORY_KEYS.map((key) => {
              const meta = CATEGORY_META[key];
              const sliderId = `category-slider-${key}`;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor={sliderId} className="text-[10px] text-muted-foreground">
                      {meta.label}
                    </label>
                    <span
                      className="text-[10px] font-semibold text-foreground/70"
                      aria-live="polite"
                      aria-label={`${meta.label} ${categoryRatings[key]}점`}
                    >
                      {categoryRatings[key]} / 5
                    </span>
                  </div>
                  <Slider
                    id={sliderId}
                    min={1}
                    max={5}
                    step={1}
                    value={[categoryRatings[key]]}
                    onValueChange={([v]) => setCategoryValue(key, v)}
                    className="w-full"
                    aria-label={`${meta.label} 평가`}
                    aria-valuemin={1}
                    aria-valuemax={5}
                    aria-valuenow={categoryRatings[key]}
                  />
                  <div
                    className="flex justify-between text-[9px] text-muted-foreground px-0.5"
                    aria-hidden="true"
                  >
                    <span>매우 낮음</span>
                    <span>매우 높음</span>
                  </div>
                </div>
              );
            })}
          </fieldset>

          {/* 좋았던 점 */}
          <div className="space-y-1">
            <label htmlFor={goodPointsId} className="text-xs font-medium text-foreground">
              좋았던 점{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              id={goodPointsId}
              placeholder="오늘 연습에서 좋았던 점을 적어주세요."
              value={goodPoints}
              onChange={(e) => setGoodPoints(e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={200}
            />
          </div>

          {/* 개선할 점 */}
          <div className="space-y-1">
            <label htmlFor={improvementsId} className="text-xs font-medium text-foreground">
              개선할 점{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              id={improvementsId}
              placeholder="더 나아질 수 있는 부분을 적어주세요."
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={200}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              제출
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
