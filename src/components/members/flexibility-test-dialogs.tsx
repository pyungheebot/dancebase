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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  calcProgress,
  FLEXIBILITY_UNIT_LABELS,
  DEFAULT_FLEXIBILITY_ITEMS,
} from "@/hooks/use-flexibility-test";
import type { FlexibilityTestUnit, FlexibilityTestEntry } from "@/types";
import { ProgressBar } from "./flexibility-test-rows";

// ============================================================
// AddRecordDialog
// ============================================================

export interface AddRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Array<{
    id: string;
    name: string;
    unit: string;
    higherIsBetter: boolean;
    targetValue?: number;
  }>;
  memberName?: string;
  onSubmit: (
    date: string,
    entries: FlexibilityTestEntry[],
    notes?: string
  ) => void;
}

export function AddRecordDialog({
  open,
  onOpenChange,
  items,
  memberName,
  onSubmit,
}: AddRecordDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  function resetForm() {
    setDate(new Date().toISOString().slice(0, 10));
    setValues({});
    setNotes("");
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function handleSubmit() {
    if (!date) {
      toast.error(TOAST.MEMBERS.FLEX_DATE_REQUIRED);
      return;
    }
    const entries: FlexibilityTestEntry[] = items
      .map((item) => ({
        itemId: item.id,
        value: parseFloat(values[item.id] ?? ""),
      }))
      .filter((e) => !isNaN(e.value));

    onSubmit(date, entries, notes.trim() || undefined);
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-500" />
            유연성 테스트 기록 추가
            {memberName && (
              <span className="text-muted-foreground font-normal">
                — {memberName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 날짜 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              측정일 <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 항목별 값 입력 */}
          {items.length === 0 ? (
            <div className="rounded-md border bg-muted/20 px-3 py-4 text-center text-muted-foreground">
              <p className="text-xs">등록된 테스트 항목이 없습니다.</p>
              <p className="text-[11px] mt-0.5">
                항목 관리 탭에서 먼저 항목을 추가하세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">
                측정값 입력
              </label>
              {items.map((item) => {
                const val = parseFloat(values[item.id] ?? "");
                const progress =
                  item.targetValue !== undefined && !isNaN(val)
                    ? calcProgress(val, item.targetValue, item.higherIsBetter)
                    : null;

                return (
                  <div
                    key={item.id}
                    className="rounded-md border bg-background px-3 py-2 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate">
                          {item.name}
                        </p>
                        {item.targetValue !== undefined && (
                          <p className="text-[10px] text-muted-foreground">
                            목표: {item.targetValue}
                            {item.unit}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Input
                          type="number"
                          placeholder="0"
                          value={values[item.id] ?? ""}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="h-7 text-xs w-20 text-right"
                        />
                        <span className="text-[11px] text-muted-foreground w-6 shrink-0">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                    {progress !== null && (
                      <div className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            목표 달성률
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              progress >= 80
                                ? "text-green-600"
                                : progress >= 50
                                ? "text-blue-600"
                                : "text-rose-500"
                            }`}
                          >
                            {progress}%
                          </span>
                        </div>
                        <ProgressBar value={progress} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              메모 (선택)
            </label>
            <Textarea
              placeholder="컨디션, 특이사항 등을 기록하세요"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[56px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            <Zap className="h-3 w-3 mr-1" />
            기록 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// AddItemDialog
// ============================================================

export interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: string[];
  onSubmit: (
    name: string,
    unit: FlexibilityTestUnit,
    higherIsBetter: boolean,
    targetValue?: number,
    description?: string
  ) => void;
}

export function AddItemDialog({
  open,
  onOpenChange,
  existingNames,
  onSubmit,
}: AddItemDialogProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<FlexibilityTestUnit>("cm");
  const [higherIsBetter, setHigherIsBetter] = useState(true);
  const [targetValue, setTargetValue] = useState("");
  const [description, setDescription] = useState("");
  const [usePreset, setUsePreset] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("");

  function resetForm() {
    setName("");
    setUnit("cm");
    setHigherIsBetter(true);
    setTargetValue("");
    setDescription("");
    setUsePreset(false);
    setSelectedPreset("");
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function handlePresetSelect(presetName: string) {
    setSelectedPreset(presetName);
    const preset = DEFAULT_FLEXIBILITY_ITEMS.find((p) => p.name === presetName);
    if (preset) {
      setName(preset.name);
      setUnit(preset.unit as FlexibilityTestUnit);
      setHigherIsBetter(preset.higherIsBetter);
      setDescription(preset.description ?? "");
    }
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error(TOAST.MEMBERS.FLEX_ITEM_NAME_REQUIRED);
      return;
    }
    if (existingNames.includes(name.trim())) {
      toast.error(TOAST.MEMBERS.FLEX_ITEM_DUPLICATE);
      return;
    }
    const tv = targetValue ? parseFloat(targetValue) : undefined;
    if (targetValue && (isNaN(tv!) || tv! <= 0)) {
      toast.error(TOAST.MEMBERS.FLEX_GOAL_INVALID);
      return;
    }
    onSubmit(
      name.trim(),
      unit,
      higherIsBetter,
      tv,
      description.trim() || undefined
    );
    resetForm();
  }

  const availablePresets = DEFAULT_FLEXIBILITY_ITEMS.filter(
    (p) => !existingNames.includes(p.name)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" />
            테스트 항목 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 프리셋 / 직접 입력 선택 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUsePreset(false)}
              className={`flex-1 text-[11px] py-1.5 rounded-md border font-medium transition-colors ${
                !usePreset
                  ? "bg-violet-100 text-violet-700 border-violet-300"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              직접 입력
            </button>
            <button
              type="button"
              onClick={() => setUsePreset(true)}
              className={`flex-1 text-[11px] py-1.5 rounded-md border font-medium transition-colors ${
                usePreset
                  ? "bg-violet-100 text-violet-700 border-violet-300"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
              disabled={availablePresets.length === 0}
            >
              기본 항목에서 선택
              {availablePresets.length === 0 && " (모두 추가됨)"}
            </button>
          </div>

          {usePreset && availablePresets.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                기본 항목 선택
              </label>
              <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="항목 선택..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePresets.map((p) => (
                    <SelectItem key={p.name} value={p.name} className="text-xs">
                      {p.name} ({p.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 항목명 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              항목명 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="예: 앞으로 굽히기"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 단위 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              단위 <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FLEXIBILITY_UNIT_LABELS) as FlexibilityTestUnit[]).map(
                (u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                      unit === u
                        ? "bg-violet-100 text-violet-700 border-violet-300"
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {FLEXIBILITY_UNIT_LABELS[u]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 방향 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              측정 방향
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHigherIsBetter(true)}
                className={`flex-1 text-[11px] py-1.5 rounded-md border font-medium transition-colors ${
                  higherIsBetter
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                <TrendingUp className="h-3 w-3 inline mr-1" />
                높을수록 좋음
              </button>
              <button
                type="button"
                onClick={() => setHigherIsBetter(false)}
                className={`flex-1 text-[11px] py-1.5 rounded-md border font-medium transition-colors ${
                  !higherIsBetter
                    ? "bg-orange-100 text-orange-700 border-orange-300"
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                <TrendingDown className="h-3 w-3 inline mr-1" />
                낮을수록 좋음
              </button>
            </div>
          </div>

          {/* 목표값 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              목표값 (선택)
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                placeholder="목표값"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="h-8 text-xs flex-1"
              />
              <span className="text-xs text-muted-foreground shrink-0">
                {unit}
              </span>
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              설명 (선택)
            </label>
            <Textarea
              placeholder="측정 방법이나 참고 사항"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[48px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            <Plus className="h-3 w-3 mr-1" />
            항목 추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
