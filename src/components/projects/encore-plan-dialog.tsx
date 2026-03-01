"use client";

import { memo } from "react";
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
import { Repeat, Radio, Lightbulb } from "lucide-react";
import type { EncoreTriggerCondition } from "@/types";
import {
  TRIGGER_LABELS,
  TRIGGER_OPTIONS,
  type PlanFormData,
} from "./encore-plan-types";

// ============================================================
// 앵콜 플랜 추가/편집 다이얼로그
// React.memo로 불필요한 리렌더링 방지
// ============================================================

type PlanDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: PlanFormData;
  setForm: (f: PlanFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
};

export const PlanDialog = memo(function PlanDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: PlanDialogProps) {
  // 폼 필드 단일 업데이트 헬퍼
  function set<K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  const descriptionId = "plan-dialog-description";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm max-h-[90vh] overflow-y-auto"
        aria-describedby={descriptionId}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Repeat className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            {isEdit ? "플랜 수정" : "앵콜 플랜 추가"}
          </DialogTitle>
          {/* aria-describedby 대상 - 스크린리더용 설명 */}
          <p id={descriptionId} className="sr-only">
            {isEdit
              ? "앵콜 플랜 정보를 수정합니다."
              : "새 앵콜 플랜을 추가합니다."}
          </p>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 플랜 이름 */}
          <div className="space-y-1">
            <Label htmlFor="plan-name" className="text-xs">
              플랜 이름 <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="plan-name"
              className="h-8 text-xs"
              placeholder="예: 메인 앵콜, 더블 앵콜"
              value={form.planName}
              onChange={(e) => set("planName", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 트리거 조건 */}
          <div className="space-y-1">
            <Label htmlFor="plan-trigger" className="text-xs">
              트리거 조건 <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Select
              value={form.triggerCondition}
              onValueChange={(v) =>
                set("triggerCondition", v as EncoreTriggerCondition)
              }
            >
              <SelectTrigger id="plan-trigger" className="h-8 text-xs" aria-required="true">
                <SelectValue placeholder="트리거 조건 선택" />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TRIGGER_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 최대 앵콜 횟수 */}
          <div className="space-y-1">
            <Label htmlFor="plan-max-encores" className="text-xs">
              최대 앵콜 횟수 <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="plan-max-encores"
              className="h-8 text-xs"
              type="number"
              min="1"
              placeholder="예: 1"
              value={form.maxEncores}
              onChange={(e) => set("maxEncores", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 시그널 큐 */}
          <div className="space-y-1">
            <Label htmlFor="plan-signal-cue" className="text-xs">시그널 큐</Label>
            <div className="relative">
              <Radio
                className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="plan-signal-cue"
                className="h-8 text-xs pl-6"
                placeholder="예: 무대감독 손 신호"
                value={form.signalCue}
                onChange={(e) => set("signalCue", e.target.value)}
              />
            </div>
          </div>

          {/* 조명 노트 */}
          <div className="space-y-1">
            <Label htmlFor="plan-lighting-notes" className="text-xs">조명 노트</Label>
            <div className="relative">
              <Lightbulb
                className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="plan-lighting-notes"
                className="h-8 text-xs pl-6"
                placeholder="예: 스포트라이트 → 전체 조명"
                value={form.lightingNotes}
                onChange={(e) => set("lightingNotes", e.target.value)}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label htmlFor="plan-notes" className="text-xs">메모</Label>
            <Textarea
              id="plan-notes"
              className="text-xs min-h-[56px] resize-none"
              placeholder="플랜에 대한 추가 메모"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
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
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
