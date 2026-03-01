"use client";

import { useId } from "react";
import { Brain } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { SliderField } from "./slider-field";
import { StrategyPicker } from "./strategy-picker";
import { MOOD_CONFIG, MOOD_KEYS, SLIDER_CONFIG } from "./types";
import type { EntryForm } from "./types";

type EntryDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editingId: string | null;
  form: EntryForm;
  setForm: React.Dispatch<React.SetStateAction<EntryForm>>;
};

export function EntryDialog({
  open,
  onClose,
  onSave,
  editingId,
  form,
  setForm,
}: EntryDialogProps) {
  const dateId = useId();
  const moodGroupId = useId();
  const noteId = useId();
  const dialogTitleId = useId();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm max-h-[90vh] overflow-y-auto"
        aria-labelledby={dialogTitleId}
      >
        <DialogHeader>
          <DialogTitle
            id={dialogTitleId}
            className="text-sm flex items-center gap-2"
          >
            <Brain className="h-4 w-4 text-violet-500" aria-hidden="true" />
            {editingId ? "심리 상태 수정" : "오늘의 심리 상태 체크인"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 날짜 */}
          <div className="space-y-1">
            <Label
              htmlFor={dateId}
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
            >
              날짜
            </Label>
            <Input
              id={dateId}
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
              className="h-7 text-xs"
              required
              aria-required="true"
            />
          </div>

          {/* 4가지 슬라이더 */}
          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend className="sr-only">심리 지표 수치 입력</legend>
            {SLIDER_CONFIG.map((cfg) => (
              <SliderField
                key={cfg.key}
                label={cfg.label}
                value={form[cfg.key]}
                onChange={(v) => setForm((f) => ({ ...f, [cfg.key]: v }))}
                color={cfg.color}
                trackColor={cfg.trackColor}
                textColor={cfg.textColor}
              />
            ))}
          </fieldset>

          {/* 전반적 기분 선택 */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend
              id={moodGroupId}
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
            >
              전반적인 기분
            </legend>
            <div
              className="grid grid-cols-5 gap-1"
              role="radiogroup"
              aria-labelledby={moodGroupId}
            >
              {MOOD_KEYS.map((mood) => {
                const cfg = MOOD_CONFIG[mood];
                const isSelected = form.overallMood === mood;
                return (
                  <button
                    key={mood}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() =>
                      setForm((f) => ({ ...f, overallMood: mood }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setForm((f) => ({ ...f, overallMood: mood }));
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-lg border p-1.5 transition-colors text-center",
                      isSelected
                        ? cn(cfg.bg, cfg.border, cfg.color)
                        : "border-gray-100 hover:bg-gray-50"
                    )}
                    aria-label={cfg.label}
                  >
                    <span className="text-base" aria-hidden="true">
                      {cfg.emoji}
                    </span>
                    <span className="text-[8px] leading-tight">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* 대처 전략 */}
          <StrategyPicker
            selected={form.copingStrategies}
            onChange={(strategies) =>
              setForm((f) => ({ ...f, copingStrategies: strategies }))
            }
          />

          {/* 일기 메모 */}
          <div className="space-y-1">
            <Label
              htmlFor={noteId}
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
            >
              일기 메모 (선택)
            </Label>
            <Textarea
              id={noteId}
              value={form.journalNote}
              onChange={(e) =>
                setForm((f) => ({ ...f, journalNote: e.target.value }))
              }
              placeholder="오늘 느낀 점, 연습 후기, 감사한 것들을 자유롭게 적어보세요..."
              className="text-xs resize-none min-h-[72px]"
              aria-describedby={`${noteId}-hint`}
            />
            <p id={`${noteId}-hint`} className="sr-only">
              선택 입력 항목입니다. 자유롭게 오늘의 경험을 기록하세요.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={onSave}>
            {editingId ? "수정 완료" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
