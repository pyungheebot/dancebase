"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  StageEffectType,
  StageEffectIntensity,
  StageEffectTrigger,
  StageEffectSafetyLevel,
} from "@/types";

// ============================================================
// 상수 & 레이블 (공유)
// ============================================================

export const EFFECT_TYPE_LABELS: Record<StageEffectType, string> = {
  smoke: "연기",
  flame: "불꽃",
  laser: "레이저",
  confetti: "컨페티",
  bubble: "버블",
  foam: "폼",
  snow: "스노우",
  strobe: "스트로브",
  pyro: "파이로",
  co2: "CO2 제트",
  uv: "UV/블랙라이트",
  other: "기타",
};

export const EFFECT_TYPE_COLORS: Record<StageEffectType, string> = {
  smoke: "bg-gray-100 text-gray-700 border-gray-200",
  flame: "bg-red-100 text-red-700 border-red-200",
  laser: "bg-green-100 text-green-700 border-green-200",
  confetti: "bg-pink-100 text-pink-700 border-pink-200",
  bubble: "bg-cyan-100 text-cyan-700 border-cyan-200",
  foam: "bg-blue-100 text-blue-700 border-blue-200",
  snow: "bg-sky-100 text-sky-700 border-sky-200",
  strobe: "bg-yellow-100 text-yellow-700 border-yellow-200",
  pyro: "bg-orange-100 text-orange-700 border-orange-200",
  co2: "bg-indigo-100 text-indigo-700 border-indigo-200",
  uv: "bg-purple-100 text-purple-700 border-purple-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};

/** 타임라인 바에 사용할 배경색 */
export const EFFECT_TYPE_BAR_COLORS: Record<StageEffectType, string> = {
  smoke: "bg-gray-400",
  flame: "bg-red-500",
  laser: "bg-green-500",
  confetti: "bg-pink-400",
  bubble: "bg-cyan-400",
  foam: "bg-blue-400",
  snow: "bg-sky-300",
  strobe: "bg-yellow-400",
  pyro: "bg-orange-500",
  co2: "bg-indigo-500",
  uv: "bg-purple-500",
  other: "bg-slate-400",
};

/** 통계 차트 바 색상 */
export const EFFECT_TYPE_CHART_COLORS: Record<StageEffectType, string> = {
  smoke: "bg-gray-400",
  flame: "bg-red-500",
  laser: "bg-green-500",
  confetti: "bg-pink-400",
  bubble: "bg-cyan-400",
  foam: "bg-blue-400",
  snow: "bg-sky-300",
  strobe: "bg-yellow-400",
  pyro: "bg-orange-500",
  co2: "bg-indigo-500",
  uv: "bg-purple-500",
  other: "bg-slate-400",
};

export const INTENSITY_LABELS: Record<StageEffectIntensity, string> = {
  low: "약",
  medium: "중",
  high: "강",
  custom: "커스텀",
};

export const INTENSITY_COLORS: Record<StageEffectIntensity, string> = {
  low: "bg-green-50 text-green-600 border-green-200",
  medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
  high: "bg-red-50 text-red-600 border-red-200",
  custom: "bg-purple-50 text-purple-600 border-purple-200",
};

export const TRIGGER_LABELS: Record<StageEffectTrigger, string> = {
  manual: "수동",
  timecode: "타임코드",
  dmx: "DMX",
  midi: "MIDI",
};

export const SAFETY_LABELS: Record<StageEffectSafetyLevel, string> = {
  safe: "안전",
  caution: "주의",
  danger: "위험",
};

export const SAFETY_COLORS: Record<StageEffectSafetyLevel, string> = {
  safe: "bg-green-100 text-green-700 border-green-200",
  caution: "bg-yellow-100 text-yellow-700 border-yellow-200",
  danger: "bg-red-100 text-red-700 border-red-200",
};

export const EFFECT_TYPES: StageEffectType[] = [
  "smoke", "flame", "laser", "confetti", "bubble",
  "foam", "snow", "strobe", "pyro", "co2", "uv", "other",
];

// ============================================================
// 폼 타입 (공유)
// ============================================================

export type EntryFormData = {
  cueNumber: string;
  effectType: StageEffectType;
  triggerTime: string;
  durationSec: string;
  intensity: StageEffectIntensity;
  intensityCustom: string;
  trigger: StageEffectTrigger;
  position: string;
  safetyLevel: StageEffectSafetyLevel;
  safetyNotes: string;
  operator: string;
  notes: string;
};

export const EMPTY_FORM: EntryFormData = {
  cueNumber: "",
  effectType: "smoke",
  triggerTime: "",
  durationSec: "",
  intensity: "medium",
  intensityCustom: "",
  trigger: "manual",
  position: "",
  safetyLevel: "safe",
  safetyNotes: "",
  operator: "",
  notes: "",
};

// ============================================================
// 큐 추가/수정 다이얼로그
// ============================================================

export function EntryDialog({
  open,
  onClose,
  onSubmit,
  initial,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EntryFormData) => void;
  initial?: EntryFormData;
  title: string;
}) {
  const [form, setForm] = useState<EntryFormData>(initial ?? EMPTY_FORM);

  if (!open) return null;

  function set<K extends keyof EntryFormData>(key: K, value: EntryFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.cueNumber.trim()) {
      toast.error(TOAST.STAGE_EFFECT.CUE_NUMBER_REQUIRED);
      return;
    }
    if (!form.triggerTime.trim()) {
      toast.error(TOAST.STAGE_EFFECT.TRIGGER_REQUIRED);
      return;
    }
    const timeRegex = /^\d{1,2}:\d{2}$/;
    if (!timeRegex.test(form.triggerTime.trim())) {
      toast.error(TOAST.STAGE_EFFECT.TRIGGER_FORMAT);
      return;
    }
    const dur = parseInt(form.durationSec, 10);
    if (isNaN(dur) || dur < 0) {
      toast.error(TOAST.STAGE_EFFECT.DURATION_REQUIRED);
      return;
    }
    if (!form.position.trim()) {
      toast.error(TOAST.STAGE_EFFECT.POSITION_REQUIRED);
      return;
    }
    if (form.intensity === "custom" && !form.intensityCustom.trim()) {
      toast.error(TOAST.STAGE_EFFECT.INTENSITY_REQUIRED);
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 큐 번호 + 효과 유형 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">큐 번호 *</Label>
              <Input
                value={form.cueNumber}
                onChange={(e) => set("cueNumber", e.target.value)}
                placeholder="예: 1, 2A, 3.5"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">효과 유형 *</Label>
              <Select
                value={form.effectType}
                onValueChange={(v) => set("effectType", v as StageEffectType)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EFFECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {EFFECT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 트리거 시점 + 지속 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">시작 시간 (MM:SS) *</Label>
              <Input
                value={form.triggerTime}
                onChange={(e) => set("triggerTime", e.target.value)}
                placeholder="예: 01:30"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">지속 시간 (초) *</Label>
              <Input
                type="number"
                min="0"
                value={form.durationSec}
                onChange={(e) => set("durationSec", e.target.value)}
                placeholder="예: 5"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 강도 + 트리거 방식 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">강도 *</Label>
              <Select
                value={form.intensity}
                onValueChange={(v) => set("intensity", v as StageEffectIntensity)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["low", "medium", "high", "custom"] as StageEffectIntensity[]).map((i) => (
                    <SelectItem key={i} value={i} className="text-xs">
                      {INTENSITY_LABELS[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">트리거 방식 *</Label>
              <Select
                value={form.trigger}
                onValueChange={(v) => set("trigger", v as StageEffectTrigger)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["manual", "timecode", "dmx", "midi"] as StageEffectTrigger[]).map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {TRIGGER_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 커스텀 강도 값 (조건부) */}
          {form.intensity === "custom" && (
            <div className="space-y-1">
              <Label className="text-xs">커스텀 강도 값 *</Label>
              <Input
                value={form.intensityCustom}
                onChange={(e) => set("intensityCustom", e.target.value)}
                placeholder="예: 70%, 레벨 8"
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* 무대 위치 */}
          <div className="space-y-1">
            <Label className="text-xs">위치 메모 *</Label>
            <Input
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              placeholder="예: 무대 좌측, 중앙, 전체"
              className="h-8 text-xs"
            />
          </div>

          {/* 안전 등급 */}
          <div className="space-y-1">
            <Label className="text-xs">안전 확인 등급 *</Label>
            <Select
              value={form.safetyLevel}
              onValueChange={(v) => set("safetyLevel", v as StageEffectSafetyLevel)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["safe", "caution", "danger"] as StageEffectSafetyLevel[]).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {SAFETY_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 안전 주의사항 */}
          <div className="space-y-1">
            <Label className="text-xs">안전 주의사항</Label>
            <Textarea
              value={form.safetyNotes}
              onChange={(e) => set("safetyNotes", e.target.value)}
              placeholder="안전 관련 주의사항을 입력하세요."
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          {/* 담당 운영자 */}
          <div className="space-y-1">
            <Label className="text-xs">담당 운영자</Label>
            <Input
              value={form.operator}
              onChange={(e) => set("operator", e.target.value)}
              placeholder="담당자 이름"
              className="h-8 text-xs"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="추가 메모사항"
              className="text-xs min-h-[50px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
