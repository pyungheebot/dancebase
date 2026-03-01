"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { StarRating } from "./star-rating";
import type { AddSessionDialogProps } from "./types";
import { today } from "./types";

export function AddSessionDialog({ open, onClose, onSave }: AddSessionDialogProps) {
  const [date, setDate] = useState(today());
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);

  function reset() {
    setDate(today());
    setTopic("");
    setDuration("60");
    setNotes("");
    setRating(0);
  }

  function handleSave() {
    if (!topic.trim()) {
      toast.error(TOAST.MENTORING_MATCH.TOPIC_REQUIRED);
      return;
    }
    const dur = parseInt(duration, 10);
    if (!dur || dur < 1) {
      toast.error(TOAST.MENTORING_MATCH.TIME_INVALID);
      return;
    }
    onSave({
      date,
      topic: topic.trim(),
      durationMinutes: dur,
      notes: notes.trim() || undefined,
      menteeRating: rating > 0 ? rating : undefined,
    });
    reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm" aria-describedby="add-session-desc">
        <DialogHeader>
          <DialogTitle className="text-sm">세션 기록 추가</DialogTitle>
        </DialogHeader>
        <p id="add-session-desc" className="sr-only">
          멘토링 세션 날짜, 주제, 시간, 메모, 만족도를 입력합니다.
        </p>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="session-date" className="text-xs">
              날짜
            </Label>
            <Input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="session-topic" className="text-xs">
              주제 *
            </Label>
            <Input
              id="session-topic"
              placeholder="예: 기본 스텝 교정"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="session-duration" className="text-xs">
              진행 시간 (분) *
            </Label>
            <Input
              id="session-duration"
              type="number"
              min={1}
              max={480}
              placeholder="60"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="session-notes" className="text-xs">
              메모
            </Label>
            <Textarea
              id="session-notes"
              placeholder="세션 내용 메모..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium">멘티 만족도</legend>
            <StarRating value={rating} onChange={setRating} />
          </fieldset>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
