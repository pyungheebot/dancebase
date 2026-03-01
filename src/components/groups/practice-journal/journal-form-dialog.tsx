"use client";

import { useState } from "react";
import { BookOpen, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { formatYearMonthDay } from "@/lib/date-utils";
import {
  type JournalFormState,
  DEFAULT_FORM,
  dateToYMD,
  formatDuration,
} from "./types";

// ============================================
// 일지 작성/수정 다이얼로그
// ============================================

type JournalFormDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialValues?: Partial<JournalFormState>;
  memberNames: string[];
  onSubmit: (form: JournalFormState) => void;
  mode: "create" | "edit";
};

export function JournalFormDialog({
  open,
  onOpenChange,
  initialValues,
  memberNames,
  onSubmit,
  mode,
}: JournalFormDialogProps) {
  const [form, setForm] = useState<JournalFormState>({
    ...DEFAULT_FORM,
    ...initialValues,
  });
  const [calOpen, setCalOpen] = useState(false);

  const titleId = "journal-form-title";
  const memberDatalistId = "journal-member-names";

  const setField = <K extends keyof JournalFormState>(
    key: K,
    value: JournalFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setForm({ ...DEFAULT_FORM, ...initialValues });
    setCalOpen(false);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) {
      toast.error(TOAST.PRACTICE_JOURNAL.DATE_REQUIRED);
      return;
    }
    if (form.durationMinutes <= 0) {
      toast.error(TOAST.PRACTICE_JOURNAL.TIME_REQUIRED);
      return;
    }
    if (!form.authorName.trim()) {
      toast.error(TOAST.PRACTICE_JOURNAL.AUTHOR_REQUIRED);
      return;
    }
    onSubmit(form);
    handleClose();
  };

  const selectedDate = form.date ? new Date(form.date + "T00:00:00") : undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-sm max-h-[90vh] overflow-y-auto"
        aria-labelledby={titleId}
      >
        <DialogHeader>
          <DialogTitle
            id={titleId}
            className="text-sm flex items-center gap-1.5"
          >
            <BookOpen className="h-4 w-4 text-orange-500" aria-hidden="true" />
            {mode === "create" ? "연습 일지 작성" : "연습 일지 수정"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1" noValidate>
          {/* 날짜 */}
          <div className="space-y-1">
            <label htmlFor="journal-date" className="text-xs font-medium text-foreground">
              연습 날짜
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="journal-date"
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start text-xs font-normal",
                    !form.date && "text-muted-foreground"
                  )}
                  aria-haspopup="dialog"
                  aria-expanded={calOpen}
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" aria-hidden="true" />
                  {form.date ? formatYearMonthDay(form.date) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) setField("date", dateToYMD(d));
                    setCalOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 연습 시간 */}
          <div className="space-y-1">
            <label
              htmlFor="journal-duration"
              className="text-xs font-medium text-foreground"
            >
              연습 시간 (분)
            </label>
            <Input
              id="journal-duration"
              type="number"
              min={1}
              max={600}
              value={form.durationMinutes}
              onChange={(e) =>
                setField("durationMinutes", Number(e.target.value))
              }
              className="h-8 text-xs"
              placeholder="120"
              aria-describedby="journal-duration-hint"
            />
            {form.durationMinutes > 0 && (
              <p id="journal-duration-hint" className="text-[10px] text-muted-foreground">
                = {formatDuration(form.durationMinutes)}
              </p>
            )}
          </div>

          {/* 참여 멤버 */}
          <div className="space-y-1">
            <label
              htmlFor="journal-participants"
              className="text-xs font-medium text-foreground"
            >
              참여 멤버{" "}
              <span className="text-muted-foreground font-normal">
                (줄바꿈으로 구분)
              </span>
            </label>
            <Textarea
              id="journal-participants"
              placeholder={
                memberNames.length > 0
                  ? memberNames.slice(0, 3).join("\n") + "\n..."
                  : "김철수\n이영희\n박민준"
              }
              value={form.participants}
              onChange={(e) => setField("participants", e.target.value)}
              className="text-xs resize-none min-h-[64px]"
              maxLength={500}
            />
          </div>

          {/* 연습 내용 요약 */}
          <div className="space-y-1">
            <label
              htmlFor="journal-content"
              className="text-xs font-medium text-foreground"
            >
              연습 내용 요약
            </label>
            <Textarea
              id="journal-content"
              placeholder="오늘 연습에서 진행한 내용을 요약해주세요."
              value={form.contentSummary}
              onChange={(e) => setField("contentSummary", e.target.value)}
              className="text-xs resize-none min-h-[72px]"
              maxLength={500}
            />
          </div>

          {/* 진행 곡/안무 */}
          <div className="space-y-1">
            <label
              htmlFor="journal-songs"
              className="text-xs font-medium text-foreground"
            >
              진행 곡/안무{" "}
              <span className="text-muted-foreground font-normal">
                (줄바꿈으로 구분, 선택)
              </span>
            </label>
            <Textarea
              id="journal-songs"
              placeholder={"Dynamite - BTS\n춤 파트 1절 전체\n..."}
              value={form.songs}
              onChange={(e) => setField("songs", e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={300}
            />
          </div>

          {/* 달성 목표 */}
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium text-foreground">
              달성 목표{" "}
              <span className="text-muted-foreground font-normal">
                (줄바꿈으로 구분, 선택)
              </span>
            </legend>
            <Textarea
              id="journal-achieved"
              placeholder={"1절 칼군무 완성\n포메이션 전환 연습"}
              value={form.achievedGoals}
              onChange={(e) => setField("achievedGoals", e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={300}
              aria-label="달성 목표 입력"
            />
          </fieldset>

          {/* 미달성 사항 */}
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium text-foreground">
              미달성 사항{" "}
              <span className="text-muted-foreground font-normal">
                (줄바꿈으로 구분, 선택)
              </span>
            </legend>
            <Textarea
              id="journal-unachieved"
              placeholder={"2절 마무리 동작\n엔딩 포즈 통일"}
              value={form.unachievedItems}
              onChange={(e) => setField("unachievedItems", e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={300}
              aria-label="미달성 사항 입력"
            />
          </fieldset>

          {/* 다음 연습 계획 */}
          <div className="space-y-1">
            <label
              htmlFor="journal-next-plan"
              className="text-xs font-medium text-foreground"
            >
              다음 연습 계획{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              id="journal-next-plan"
              placeholder="다음 연습에서 집중할 내용을 적어주세요."
              value={form.nextPlanNote}
              onChange={(e) => setField("nextPlanNote", e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={300}
            />
          </div>

          {/* 작성자 */}
          <div className="space-y-1">
            <label
              htmlFor="journal-author"
              className="text-xs font-medium text-foreground"
            >
              작성자
            </label>
            <Input
              id="journal-author"
              placeholder="이름을 입력하세요"
              value={form.authorName}
              onChange={(e) => setField("authorName", e.target.value)}
              className="h-8 text-xs"
              maxLength={30}
              list={memberDatalistId}
              autoComplete="off"
            />
            <datalist id={memberDatalistId}>
              {memberNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
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
              {mode === "create" ? "작성" : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
