"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  GROUP_EVENT_CATEGORIES,
  GROUP_EVENT_CATEGORY_COLORS,
  todayYMD,
} from "@/hooks/use-group-event-calendar";
import type { GroupCalendarEvent, GroupEventCategory } from "@/types";

// ============================================================
// 타입
// ============================================================

export type AddEventDialogProps = {
  open: boolean;
  initialDate: string;
  onClose: () => void;
  onAdd: (
    input: Omit<GroupCalendarEvent, "id" | "rsvps" | "createdAt">
  ) => void;
};

// ============================================================
// 컴포넌트
// ============================================================

export function AddEventDialog({
  open,
  initialDate,
  onClose,
  onAdd,
}: AddEventDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [category, setCategory] = useState<GroupEventCategory>("연습");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  const titleId = "add-event-title";
  const categoryId = "add-event-category";
  const dateId = "add-event-date";
  const startTimeId = "add-event-start-time";
  const endTimeId = "add-event-end-time";
  const locationId = "add-event-location";
  const descriptionId = "add-event-description";

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setDate(initialDate);
    } else {
      handleClose();
    }
  }

  function reset() {
    setTitle("");
    setDate(initialDate);
    setTime("10:00");
    setEndTime("12:00");
    setCategory("연습");
    setLocation("");
    setDescription("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(TOAST.EVENT_CALENDAR.TITLE_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.EVENT_CALENDAR.DATE_REQUIRED);
      return;
    }
    await execute(async () => {
      onAdd({
        title: title.trim(),
        date,
        time,
        endTime,
        category,
        location,
        description,
      });
      toast.success(TOAST.EVENT_CALENDAR.ADDED);
      handleClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-sm"
        aria-describedby="add-event-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            이벤트 추가
          </DialogTitle>
          <p id="add-event-dialog-desc" className="sr-only">
            그룹 이벤트를 추가하는 폼입니다. 제목과 날짜는 필수입니다.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor={titleId} className="text-xs">
              제목 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="이벤트 제목"
              className="h-8 text-xs"
              maxLength={50}
              required
              aria-required="true"
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label htmlFor={categoryId} className="text-xs">
              카테고리
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as GroupEventCategory)}
            >
              <SelectTrigger id={categoryId} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-block w-2 h-2 rounded-full",
                          GROUP_EVENT_CATEGORY_COLORS[cat].dot
                        )}
                        aria-hidden="true"
                      />
                      {cat}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 */}
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
              required
              aria-required="true"
            />
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={startTimeId} className="text-xs">
                시작 시간
              </Label>
              <Input
                id={startTimeId}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={endTimeId} className="text-xs">
                종료 시간
              </Label>
              <Input
                id={endTimeId}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <Label htmlFor={locationId} className="text-xs">
              장소
            </Label>
            <Input
              id={locationId}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="장소 (선택)"
              className="h-8 text-xs"
              maxLength={60}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label htmlFor={descriptionId} className="text-xs">
              설명
            </Label>
            <Textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명 (선택)"
              className="text-xs resize-none"
              rows={2}
              maxLength={200}
            />
          </div>

          <DialogFooter className="gap-1">
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
              disabled={submitting}
              aria-disabled={submitting}
            >
              {submitting ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
