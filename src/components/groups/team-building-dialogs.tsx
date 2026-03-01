"use client";

import { useState } from "react";
import { PartyPopper, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import { StarRating } from "./team-building-star-rating";
import { CATEGORY_LABEL } from "./team-building-types";
import type { TeamBuildingCategory, TeamBuildingEvent } from "@/types";

// ============================================================
// 이벤트 추가 다이얼로그
// ============================================================

type AddEventDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (
    input: Omit<
      TeamBuildingEvent,
      "id" | "createdAt" | "participants" | "isCompleted"
    >
  ) => Promise<void>;
  memberNames: string[];
};

export function AddEventDialog({
  open,
  onClose,
  onAdd,
  memberNames,
}: AddEventDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TeamBuildingCategory>("ice_breaker");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState(memberNames[0] ?? "");
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const { pending: saving, execute: executeAdd } = useAsyncAction();

  const titleId = "add-event-title";
  const categoryId = "add-event-category";
  const dateId = "add-event-date";
  const timeId = "add-event-time";
  const locationId = "add-event-location";
  const organizerId = "add-event-organizer";
  const durationId = "add-event-duration";
  const budgetId = "add-event-budget";
  const maxParticipantsId = "add-event-max-participants";
  const descriptionId = "add-event-description";

  function reset() {
    setTitle("");
    setCategory("ice_breaker");
    setDate("");
    setTime("");
    setLocation("");
    setDescription("");
    setOrganizer(memberNames[0] ?? "");
    setDuration("");
    setBudget("");
    setMaxParticipants("");
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error(TOAST.TEAM_BUILDING.ACTIVITY_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.TEAM_BUILDING.DATE_REQUIRED);
      return;
    }
    if (!organizer.trim()) {
      toast.error(TOAST.TEAM_BUILDING.HOST_REQUIRED);
      return;
    }
    await executeAdd(async () => {
      await onAdd({
        title: title.trim(),
        category,
        date,
        time: time || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        organizer: organizer.trim(),
        duration: duration ? Number(duration) : undefined,
        budget: budget ? Number(budget) : undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      });
      toast.success(TOAST.TEAM_BUILDING.ACTIVITY_ADDED);
      reset();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        aria-labelledby="add-event-dialog-title"
      >
        <DialogHeader>
          <DialogTitle
            id="add-event-dialog-title"
            className="flex items-center gap-2 text-sm"
          >
            <PartyPopper className="h-4 w-4 text-purple-500" aria-hidden="true" />
            팀빌딩 활동 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor={titleId} className="text-xs">
              활동명 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: MT, 볼링 모임, 팀 저녁식사"
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={categoryId} className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TeamBuildingCategory)}
            >
              <SelectTrigger id={categoryId} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABEL) as TeamBuildingCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABEL[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={dateId} className="text-xs">
                날짜 <span aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </Label>
              <Input
                id={dateId}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
                aria-required="true"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={timeId} className="text-xs">시간</Label>
              <Input
                id={timeId}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor={locationId} className="text-xs">장소</Label>
            <Input
              id={locationId}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="장소를 입력하세요"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={organizerId} className="text-xs">
              주최자 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            {memberNames.length > 0 ? (
              <Select value={organizer} onValueChange={setOrganizer}>
                <SelectTrigger id={organizerId} className="h-8 text-xs">
                  <SelectValue placeholder="주최자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={organizerId}
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="주최자 이름"
                className="h-8 text-xs"
                aria-required="true"
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor={durationId} className="text-xs">소요시간 (분)</Label>
              <Input
                id={durationId}
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                className="h-8 text-xs"
                min={1}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={budgetId} className="text-xs">예산 (원)</Label>
              <Input
                id={budgetId}
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                className="h-8 text-xs"
                min={0}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={maxParticipantsId} className="text-xs">최대 인원</Label>
              <Input
                id={maxParticipantsId}
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="제한 없음"
                className="h-8 text-xs"
                min={1}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor={descriptionId} className="text-xs">설명</Label>
            <Textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="활동 내용이나 안내사항을 입력하세요"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
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
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "추가 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 피드백 다이얼로그
// ============================================================

type FeedbackDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback?: string) => Promise<void>;
  existingRating?: number;
  existingFeedback?: string;
};

export function FeedbackDialog({
  open,
  onClose,
  onSubmit,
  existingRating = 0,
  existingFeedback = "",
}: FeedbackDialogProps) {
  const [rating, setRating] = useState(existingRating);
  const [feedback, setFeedback] = useState(existingFeedback);
  const { pending: saving, execute: executeFeedback } = useAsyncAction();

  const feedbackId = "feedback-comment";

  async function handleSubmit() {
    if (rating === 0) {
      toast.error(TOAST.TEAM_BUILDING.RATING_REQUIRED);
      return;
    }
    await executeFeedback(async () => {
      await onSubmit(rating, feedback.trim() || undefined);
      toast.success(TOAST.TEAM_BUILDING.FEEDBACK_SAVED);
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" aria-labelledby="feedback-dialog-title">
        <DialogHeader>
          <DialogTitle
            id="feedback-dialog-title"
            className="flex items-center gap-2 text-sm"
          >
            <Star className="h-4 w-4 text-yellow-500" aria-hidden="true" />
            활동 후기 작성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">
              별점 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={feedbackId} className="text-xs">코멘트 (선택)</Label>
            <Textarea
              id={feedbackId}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="활동 소감을 자유롭게 남겨주세요"
              className="text-xs min-h-[70px] resize-none"
            />
          </div>
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
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
