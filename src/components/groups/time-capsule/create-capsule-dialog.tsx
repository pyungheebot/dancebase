"use client";

import { useState } from "react";
import { Clock, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { dateToYMD } from "./time-capsule-utils";

// ============================================
// 캡슐 생성 다이얼로그 (기본)
// ============================================

export function CreateCapsuleDialog({
  open,
  onOpenChange,
  onCreate,
  totalCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (title: string, openDate: string) => boolean;
  totalCount: number;
}) {
  const [title, setTitle] = useState("");
  const [openDate, setOpenDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);

  const reset = () => {
    setTitle("");
    setOpenDate(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(TOAST.TIME_CAPSULE_CARD.TITLE_REQUIRED);
      return;
    }
    if (!openDate) {
      toast.error(TOAST.TIME_CAPSULE.OPEN_DATE_PAST);
      return;
    }
    const success = onCreate(title.trim(), dateToYMD(openDate));
    if (!success) {
      toast.error(TOAST.TIME_CAPSULE.MAX_EXCEEDED);
      return;
    }
    toast.success(TOAST.TIME_CAPSULE.CREATED);
    reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-500" />
            타임캡슐 만들기
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">제목</label>
            <Input
              placeholder="캡슐 제목 입력"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              개봉일
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start text-xs font-normal",
                    !openDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" />
                  {openDate ? dateToYMD(openDate) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={openDate}
                  onSelect={(d) => {
                    setOpenDate(d);
                    setCalOpen(false);
                  }}
                  disabled={(d) => {
                    const day = new Date(d);
                    day.setHours(0, 0, 0, 0);
                    return day <= today;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {totalCount >= 30 && (
            <p className="text-[10px] text-destructive">
              최대 30개까지 생성할 수 있습니다.
            </p>
          )}

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={totalCount >= 30}
            >
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
