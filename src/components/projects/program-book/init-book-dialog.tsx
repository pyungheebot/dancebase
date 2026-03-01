"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

export interface InitBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle?: string;
  initialDate?: string;
  initialVenue?: string;
  onSubmit: (showTitle: string, showDate: string, venue: string) => void;
}

export function InitBookDialog({
  open,
  onOpenChange,
  initialTitle = "",
  initialDate = "",
  initialVenue = "",
  onSubmit,
}: InitBookDialogProps) {
  const [showTitle, setShowTitle] = useState(initialTitle);
  const [showDate, setShowDate] = useState(initialDate);
  const [venue, setVenue] = useState(initialVenue);

  const resetForm = () => {
    setShowTitle(initialTitle);
    setShowDate(initialDate);
    setVenue(initialVenue);
  };

  const handleSubmit = () => {
    if (!showTitle.trim()) {
      toast.error(TOAST.PROGRAM_BOOK.SHOW_NAME_REQUIRED);
      return;
    }
    onSubmit(showTitle.trim(), showDate, venue.trim());
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm" aria-describedby="init-book-desc">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            프로그램북 기본 정보
          </DialogTitle>
        </DialogHeader>
        <p id="init-book-desc" className="sr-only">
          공연 이름, 날짜, 장소를 입력하여 프로그램북을 초기화합니다.
        </p>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label htmlFor="show-title" className="text-xs text-muted-foreground">
              공연명 *
            </Label>
            <Input
              id="show-title"
              value={showTitle}
              onChange={(e) => setShowTitle(e.target.value)}
              placeholder="예: 2025 봄 정기공연"
              className="h-7 text-xs"
              aria-required="true"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="show-date" className="text-xs text-muted-foreground">
              공연 날짜
            </Label>
            <Input
              id="show-date"
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="show-venue" className="text-xs text-muted-foreground">
              장소
            </Label>
            <Input
              id="show-venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="예: 대학로 예술극장 대극장"
              className="h-7 text-xs"
            />
          </div>
          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
