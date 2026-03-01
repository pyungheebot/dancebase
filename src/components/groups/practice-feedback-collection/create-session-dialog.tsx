"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { dateToYMD } from "./types";

type CreateSessionDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (params: { practiceDate: string; title?: string }) => void;
};

export function CreateSessionDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateSessionDialogProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [title, setTitle] = useState("");

  const dateInputId = "create-session-date";
  const titleInputId = "create-session-title";

  const reset = () => {
    setDate(new Date());
    setTitle("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error(TOAST.PRACTICE_FEEDBACK_COLLECTION.DATE_REQUIRED);
      return;
    }
    onCreate({
      practiceDate: dateToYMD(date),
      title: title.trim() || undefined,
    });
    toast.success(TOAST.PRACTICE_FEEDBACK.SESSION_CREATED);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            연습 세션 추가
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1" aria-label="연습 세션 생성 폼">
          {/* 날짜 선택 */}
          <div className="space-y-1">
            <label htmlFor={dateInputId} className="text-xs font-medium text-foreground">
              연습 날짜
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={dateInputId}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start text-xs font-normal",
                    !date && "text-muted-foreground"
                  )}
                  aria-label={date ? `선택된 날짜: ${dateToYMD(date)}` : "날짜 선택"}
                  aria-expanded={calOpen}
                  aria-haspopup="dialog"
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" aria-hidden="true" />
                  {date ? dateToYMD(date) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 세션 제목 (선택) */}
          <div className="space-y-1">
            <label htmlFor={titleInputId} className="text-xs font-medium text-foreground">
              세션 제목{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Input
              id={titleInputId}
              placeholder="예: 정기 연습 #12"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              maxLength={40}
              aria-describedby="create-session-title-hint"
            />
            <p id="create-session-title-hint" className="sr-only">
              최대 40자, 입력하지 않으면 날짜가 표시됩니다
            </p>
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
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
