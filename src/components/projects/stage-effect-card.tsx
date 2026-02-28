"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Zap,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useStageEffect } from "@/hooks/use-stage-effect";
import type {
  StageEffectType,
  StageEffectIntensity,
  StageEffectTrigger,
  StageEffectSafetyLevel,
  StageEffectEntry,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const EFFECT_TYPE_LABELS: Record<StageEffectType, string> = {
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

const EFFECT_TYPE_COLORS: Record<StageEffectType, string> = {
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

const INTENSITY_LABELS: Record<StageEffectIntensity, string> = {
  low: "약",
  medium: "중",
  high: "강",
  custom: "커스텀",
};

const INTENSITY_COLORS: Record<StageEffectIntensity, string> = {
  low: "bg-green-50 text-green-600 border-green-200",
  medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
  high: "bg-red-50 text-red-600 border-red-200",
  custom: "bg-purple-50 text-purple-600 border-purple-200",
};

const TRIGGER_LABELS: Record<StageEffectTrigger, string> = {
  manual: "수동",
  timecode: "타임코드",
  dmx: "DMX",
  midi: "MIDI",
};

const SAFETY_LABELS: Record<StageEffectSafetyLevel, string> = {
  safe: "안전",
  caution: "주의",
  danger: "위험",
};

const SAFETY_COLORS: Record<StageEffectSafetyLevel, string> = {
  safe: "bg-green-100 text-green-700 border-green-200",
  caution: "bg-yellow-100 text-yellow-700 border-yellow-200",
  danger: "bg-red-100 text-red-700 border-red-200",
};

const EFFECT_TYPES: StageEffectType[] = [
  "smoke", "flame", "laser", "confetti", "bubble",
  "foam", "snow", "strobe", "pyro", "co2", "uv", "other",
];

// ============================================================
// 폼 타입
// ============================================================

type EntryFormData = {
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

const EMPTY_FORM: EntryFormData = {
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

function entryToForm(entry: StageEffectEntry): EntryFormData {
  return {
    cueNumber: entry.cueNumber,
    effectType: entry.effectType,
    triggerTime: entry.triggerTime,
    durationSec: String(entry.durationSec),
    intensity: entry.intensity,
    intensityCustom: entry.intensityCustom ?? "",
    trigger: entry.trigger,
    position: entry.position,
    safetyLevel: entry.safetyLevel,
    safetyNotes: entry.safetyNotes ?? "",
    operator: entry.operator ?? "",
    notes: entry.notes ?? "",
  };
}

// ============================================================
// 큐 추가/수정 다이얼로그
// ============================================================

function EntryDialog({
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
      toast.error("큐 번호를 입력해주세요.");
      return;
    }
    if (!form.triggerTime.trim()) {
      toast.error("트리거 시점을 입력해주세요. (예: 01:30)");
      return;
    }
    const timeRegex = /^\d{1,2}:\d{2}$/;
    if (!timeRegex.test(form.triggerTime.trim())) {
      toast.error("트리거 시점 형식이 올바르지 않습니다. (예: 01:30)");
      return;
    }
    const dur = parseInt(form.durationSec, 10);
    if (isNaN(dur) || dur < 0) {
      toast.error("올바른 지속 시간(초)을 입력해주세요.");
      return;
    }
    if (!form.position.trim()) {
      toast.error("무대 위치를 입력해주세요.");
      return;
    }
    if (form.intensity === "custom" && !form.intensityCustom.trim()) {
      toast.error("커스텀 강도 값을 입력해주세요.");
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
              <Label className="text-xs">트리거 시점 (MM:SS) *</Label>
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
            <Label className="text-xs">무대 위치 *</Label>
            <Input
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              placeholder="예: 무대 좌측, 중앙, 전체"
              className="h-8 text-xs"
            />
          </div>

          {/* 안전 등급 */}
          <div className="space-y-1">
            <Label className="text-xs">안전 등급 *</Label>
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

// ============================================================
// 안전 등급 아이콘
// ============================================================

function SafetyIcon({ level }: { level: StageEffectSafetyLevel }) {
  if (level === "danger") return <ShieldAlert className="h-3 w-3 text-red-600" />;
  if (level === "caution") return <ShieldAlert className="h-3 w-3 text-yellow-600" />;
  return <ShieldCheck className="h-3 w-3 text-green-600" />;
}

// ============================================================
// 큐 항목 행
// ============================================================

function EntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: StageEffectEntry;
  onEdit: (entry: StageEffectEntry) => void;
  onDelete: (entry: StageEffectEntry) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40 cursor-pointer rounded-md border border-border/50 group">
          {/* 큐 번호 */}
          <span className="font-mono text-[11px] font-semibold text-muted-foreground w-10 shrink-0">
            #{entry.cueNumber}
          </span>

          {/* 효과 유형 */}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 shrink-0 ${EFFECT_TYPE_COLORS[entry.effectType]}`}
          >
            {EFFECT_TYPE_LABELS[entry.effectType]}
          </Badge>

          {/* 트리거 시점 */}
          <span className="font-mono text-xs text-foreground font-medium shrink-0">
            {entry.triggerTime}
          </span>

          {/* 지속 시간 */}
          <span className="text-[10px] text-muted-foreground shrink-0">
            {entry.durationSec}초
          </span>

          {/* 강도 */}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 shrink-0 ${INTENSITY_COLORS[entry.intensity]}`}
          >
            {entry.intensity === "custom"
              ? (entry.intensityCustom ?? "커스텀")
              : INTENSITY_LABELS[entry.intensity]}
          </Badge>

          {/* 위치 */}
          <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
            {entry.position}
          </span>

          {/* 안전 */}
          <div className="shrink-0 flex items-center gap-1">
            <SafetyIcon level={entry.safetyLevel} />
          </div>

          {/* 펼치기 아이콘 */}
          <div className="shrink-0 text-muted-foreground">
            {open ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-3 mt-1 mb-2 pl-3 border-l-2 border-border space-y-2 text-xs text-muted-foreground">
          {/* 트리거 방식 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-foreground w-20 shrink-0">트리거 방식</span>
            <span>{TRIGGER_LABELS[entry.trigger]}</span>
          </div>

          {/* 안전 등급 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-foreground w-20 shrink-0">안전 등급</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${SAFETY_COLORS[entry.safetyLevel]}`}
            >
              {SAFETY_LABELS[entry.safetyLevel]}
            </Badge>
          </div>

          {/* 안전 주의사항 */}
          {entry.safetyNotes && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-medium text-foreground w-20 shrink-0">주의사항</span>
              <span className="text-red-600 text-[10px] flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                {entry.safetyNotes}
              </span>
            </div>
          )}

          {/* 담당 운영자 */}
          {entry.operator && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-foreground w-20 shrink-0">담당 운영자</span>
              <span>{entry.operator}</span>
            </div>
          )}

          {/* 메모 */}
          {entry.notes && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-medium text-foreground w-20 shrink-0">메모</span>
              <span>{entry.notes}</span>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 gap-1"
              onClick={() => onEdit(entry)}
            >
              <Pencil className="h-3 w-3" />
              수정
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 gap-1 text-destructive hover:text-destructive"
              onClick={() => onDelete(entry)}
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================
// 메인 카드
// ============================================================

export function StageEffectCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const { entries, loading, addEntry, updateEntry, deleteEntry, stats } =
    useStageEffect(groupId, projectId);

  // 다이얼로그 상태
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StageEffectEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StageEffectEntry | null>(null);

  // 필터
  const [filterType, setFilterType] = useState<StageEffectType | "all">("all");
  const [filterSafety, setFilterSafety] = useState<StageEffectSafetyLevel | "all">("all");

  // 통계 패널
  const [statsOpen, setStatsOpen] = useState(false);

  // 필터링
  const filtered = entries.filter((e) => {
    if (filterType !== "all" && e.effectType !== filterType) return false;
    if (filterSafety !== "all" && e.safetyLevel !== filterSafety) return false;
    return true;
  });

  // 추가 핸들러
  function handleAdd(form: EntryFormData) {
    try {
      addEntry({
        cueNumber: form.cueNumber,
        effectType: form.effectType,
        triggerTime: form.triggerTime,
        durationSec: parseInt(form.durationSec, 10),
        intensity: form.intensity,
        intensityCustom: form.intensityCustom || undefined,
        trigger: form.trigger,
        position: form.position,
        safetyLevel: form.safetyLevel,
        safetyNotes: form.safetyNotes || undefined,
        operator: form.operator || undefined,
        notes: form.notes || undefined,
      });
      toast.success("큐가 추가되었습니다.");
      setAddOpen(false);
    } catch {
      toast.error("큐 추가에 실패했습니다.");
    }
  }

  // 수정 핸들러
  function handleEdit(form: EntryFormData) {
    if (!editTarget) return;
    const ok = updateEntry(editTarget.id, {
      cueNumber: form.cueNumber,
      effectType: form.effectType,
      triggerTime: form.triggerTime,
      durationSec: parseInt(form.durationSec, 10),
      intensity: form.intensity,
      intensityCustom: form.intensityCustom || undefined,
      trigger: form.trigger,
      position: form.position,
      safetyLevel: form.safetyLevel,
      safetyNotes: form.safetyNotes || undefined,
      operator: form.operator || undefined,
      notes: form.notes || undefined,
    });
    if (ok) {
      toast.success("큐가 수정되었습니다.");
    } else {
      toast.error("큐 수정에 실패했습니다.");
    }
    setEditTarget(null);
  }

  // 삭제 핸들러
  function handleDelete() {
    if (!deleteTarget) return;
    const ok = deleteEntry(deleteTarget.id);
    if (ok) {
      toast.success("큐가 삭제되었습니다.");
    } else {
      toast.error("큐 삭제에 실패했습니다.");
    }
    setDeleteTarget(null);
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-sm font-semibold">
                무대 효과 큐시트
              </CardTitle>
              {stats.totalCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {stats.totalCount}개
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {stats.totalCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setStatsOpen((v) => !v)}
                >
                  {statsOpen ? "통계 닫기" : "통계"}
                </Button>
              )}
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" />
                큐 추가
              </Button>
            </div>
          </div>

          {/* 통계 패널 */}
          {statsOpen && stats.totalCount > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-green-50 border border-green-100 py-2">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <ShieldCheck className="h-3 w-3 text-green-600" />
                  <span className="text-[10px] text-green-700 font-medium">안전</span>
                </div>
                <p className="text-lg font-bold text-green-700">{stats.safeCount}</p>
              </div>
              <div className="rounded-md bg-yellow-50 border border-yellow-100 py-2">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Shield className="h-3 w-3 text-yellow-600" />
                  <span className="text-[10px] text-yellow-700 font-medium">주의</span>
                </div>
                <p className="text-lg font-bold text-yellow-700">{stats.cautionCount}</p>
              </div>
              <div className="rounded-md bg-red-50 border border-red-100 py-2">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <ShieldAlert className="h-3 w-3 text-red-600" />
                  <span className="text-[10px] text-red-700 font-medium">위험</span>
                </div>
                <p className="text-lg font-bold text-red-700">{stats.dangerCount}</p>
              </div>
            </div>
          )}

          {/* 필터 */}
          {entries.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v as StageEffectType | "all")}
              >
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue placeholder="효과 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">전체 유형</SelectItem>
                  {EFFECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {EFFECT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterSafety}
                onValueChange={(v) => setFilterSafety(v as StageEffectSafetyLevel | "all")}
              >
                <SelectTrigger className="h-7 text-xs w-28">
                  <SelectValue placeholder="안전 등급" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">전체 등급</SelectItem>
                  {(["safe", "caution", "danger"] as StageEffectSafetyLevel[]).map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {SAFETY_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filterType !== "all" || filterSafety !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-muted-foreground"
                  onClick={() => {
                    setFilterType("all");
                    setFilterSafety("all");
                  }}
                >
                  초기화
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              불러오는 중...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground">
                등록된 무대 효과 큐가 없습니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 mt-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" />
                첫 큐 추가하기
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              조건에 맞는 큐가 없습니다.
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* 헤더 */}
              <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-muted-foreground font-medium border-b border-border/50 mb-1">
                <span className="w-10 shrink-0">큐</span>
                <span className="w-16 shrink-0">유형</span>
                <span className="w-14 shrink-0">시점</span>
                <span className="w-12 shrink-0">지속</span>
                <span className="w-12 shrink-0">강도</span>
                <span className="flex-1 min-w-0">위치</span>
                <span className="shrink-0">안전</span>
              </div>

              {filtered.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <EntryDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="새 효과 큐 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <EntryDialog
          open={true}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          initial={entryToForm(editTarget)}
          title="효과 큐 수정"
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">큐 삭제</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              <strong>큐 #{deleteTarget?.cueNumber}</strong> (
              {deleteTarget ? EFFECT_TYPE_LABELS[deleteTarget.effectType] : ""}
              )을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-7 text-xs">취소</AlertDialogCancel>
            <AlertDialogAction
              className="h-7 text-xs bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
