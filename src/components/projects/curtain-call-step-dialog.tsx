"use client";

import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  BOW_TYPE_LABELS,
  BOW_TYPE_OPTIONS,
  formatDuration,
} from "./curtain-call-types";
import type { StepFormData } from "./curtain-call-types";
import type { CurtainCallStep } from "@/types";

// ============================================================
// 스텝 추가/편집 다이얼로그
// ============================================================

interface StepDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: StepFormData;
  setForm: (f: StepFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
  memberNames: string[];
  onTogglePerformer: (name: string) => void;
}

export function CurtainCallStepDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
  memberNames,
  onTogglePerformer,
}: StepDialogProps) {
  function set<K extends keyof StepFormData>(key: K, value: StepFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  const descriptionId = "curtain-call-step-description";
  const performersInputId = "curtain-call-step-performers";
  const bowTypeId = "curtain-call-step-bow-type";
  const positionId = "curtain-call-step-position";
  const durationId = "curtain-call-step-duration";
  const parsedDuration =
    form.durationSeconds && !isNaN(parseInt(form.durationSeconds))
      ? parseInt(form.durationSeconds)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-pink-500" aria-hidden="true" />
            {isEdit ? "스텝 수정" : "스텝 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 설명 */}
          <div className="space-y-1">
            <Label htmlFor={descriptionId} className="text-xs">
              설명 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={descriptionId}
              className="h-8 text-xs"
              placeholder="예: 솔리스트 단독 인사, 전체 출연진 인사"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 출연자 선택 (멤버가 있을 때) */}
          {memberNames.length > 0 && (
            <div className="space-y-1">
              <p
                id="curtain-call-performers-label"
                className="text-xs font-medium leading-none"
              >
                출연자 (다중 선택)
              </p>
              <div
                role="group"
                aria-labelledby="curtain-call-performers-label"
                className="flex flex-wrap gap-1 p-2 rounded-md border bg-muted/30 min-h-[40px]"
              >
                {memberNames.map((name) => {
                  const selected = form.performers.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onTogglePerformer(name)}
                      aria-pressed={selected}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        selected
                          ? "bg-pink-100 border-pink-400 text-pink-800 font-semibold"
                          : "bg-background border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              {form.performers.length > 0 && (
                <p
                  className="text-[10px] text-muted-foreground"
                  aria-live="polite"
                >
                  선택됨: {form.performers.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* 멤버 목록이 없을 때 직접 입력 */}
          {memberNames.length === 0 && (
            <div className="space-y-1">
              <Label htmlFor={performersInputId} className="text-xs">출연자</Label>
              <Input
                id={performersInputId}
                className="h-8 text-xs"
                placeholder="예: 홍길동, 김철수 (쉼표로 구분)"
                value={form.performers.join(", ")}
                onChange={(e) =>
                  set(
                    "performers",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>
          )}

          {/* 인사 유형 + 위치 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={bowTypeId} className="text-xs">인사 유형</Label>
              <Select
                value={form.bowType}
                onValueChange={(v) =>
                  set(
                    "bowType",
                    v as NonNullable<CurtainCallStep["bowType"]> | ""
                  )
                }
              >
                <SelectTrigger id={bowTypeId} className="h-8 text-xs">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">
                    없음
                  </SelectItem>
                  {BOW_TYPE_OPTIONS.map((bt) => (
                    <SelectItem key={bt} value={bt} className="text-xs">
                      {BOW_TYPE_LABELS[bt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={positionId} className="text-xs">위치</Label>
              <Input
                id={positionId}
                className="h-8 text-xs"
                placeholder="예: 무대 중앙"
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
              />
            </div>
          </div>

          {/* 소요시간 */}
          <div className="space-y-1">
            <Label htmlFor={durationId} className="text-xs">소요시간 (초)</Label>
            <div className="relative">
              <Clock
                className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id={durationId}
                className="h-8 text-xs pl-6"
                type="number"
                min="1"
                placeholder="예: 30"
                value={form.durationSeconds}
                onChange={(e) => set("durationSeconds", e.target.value)}
              />
            </div>
            {parsedDuration !== null && (
              <p className="text-[10px] text-muted-foreground" aria-live="polite">
                = {formatDuration(parsedDuration)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
