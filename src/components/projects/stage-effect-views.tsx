"use client";

import { memo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import type {
  StageEffectType,
  StageEffectSafetyLevel,
  StageEffectEntry,
} from "@/types";

import {
  EFFECT_TYPE_LABELS,
  EFFECT_TYPE_COLORS,
  EFFECT_TYPE_CHART_COLORS,
  EFFECT_TYPE_BAR_COLORS,
  INTENSITY_LABELS,
  INTENSITY_COLORS,
  TRIGGER_LABELS,
  SAFETY_LABELS,
  SAFETY_COLORS,
} from "./stage-effect-dialogs";

// ============================================================
// 유틸: MM:SS -> 초 변환
// ============================================================

function mmssToSec(mmss: string): number {
  const parts = mmss.split(":");
  if (parts.length !== 2) return 0;
  const m = parseInt(parts[0], 10);
  const s = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(s)) return 0;
  return m * 60 + s;
}

function secToMmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ============================================================
// 안전 등급 아이콘
// ============================================================

export const SafetyIcon = memo(function SafetyIcon({
  level,
}: {
  level: StageEffectSafetyLevel;
}) {
  if (level === "danger") return <ShieldAlert className="h-3 w-3 text-red-600" />;
  if (level === "caution") return <ShieldAlert className="h-3 w-3 text-yellow-600" />;
  return <ShieldCheck className="h-3 w-3 text-green-600" />;
});

// ============================================================
// 큐 항목 행
// ============================================================

export const EntryRow = memo(function EntryRow({
  entry,
  onEdit,
  onDelete,
  onToggleSafety,
}: {
  entry: StageEffectEntry;
  onEdit: (entry: StageEffectEntry) => void;
  onDelete: (entry: StageEffectEntry) => void;
  onToggleSafety: (entry: StageEffectEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const isSafe = entry.safetyLevel === "safe";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40 cursor-pointer rounded-md border border-border/50 group">
          {/* 안전 확인 체크박스 */}
          <div
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSafety(entry);
            }}
          >
            <Checkbox
              checked={isSafe}
              className="h-3.5 w-3.5"
              aria-label="안전 확인"
            />
          </div>

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
});

// ============================================================
// 효과 유형별 통계 가로 바 차트
// ============================================================

export const TypeBarChart = memo(function TypeBarChart({
  entries,
}: {
  entries: StageEffectEntry[];
}) {
  const breakdown = entries.reduce<Partial<Record<StageEffectType, number>>>(
    (acc, e) => {
      acc[e.effectType] = (acc[e.effectType] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const sorted = (Object.entries(breakdown) as [StageEffectType, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  const max = sorted[0]?.[1] ?? 1;

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {sorted.map(([type, count]) => (
        <div key={type} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-20 shrink-0 truncate">
            {EFFECT_TYPE_LABELS[type]}
          </span>
          <div className="flex-1 h-4 bg-muted/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${EFFECT_TYPE_CHART_COLORS[type]}`}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-foreground w-5 text-right shrink-0">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
});

// ============================================================
// 안전 확인 완료율 프로그레스 바
// ============================================================

export const SafetyProgressBar = memo(function SafetyProgressBar({
  entries,
}: {
  entries: StageEffectEntry[];
}) {
  const total = entries.length;
  if (total === 0) return null;

  const safeCount = entries.filter((e) => e.safetyLevel === "safe").length;
  const pct = Math.round((safeCount / total) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <span className="text-[10px] font-medium text-foreground">안전 확인 완료율</span>
        </div>
        <span className="text-[10px] font-semibold text-green-700">
          {safeCount}/{total} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});

// ============================================================
// 타임라인 뷰
// ============================================================

export const TimelineView = memo(function TimelineView({
  entries,
}: {
  entries: StageEffectEntry[];
}) {
  if (entries.length === 0) return null;

  const sorted = entries
    .slice()
    .sort((a, b) => mmssToSec(a.triggerTime) - mmssToSec(b.triggerTime));

  const maxEndSec = Math.max(
    ...sorted.map((e) => mmssToSec(e.triggerTime) + e.durationSec)
  );
  const totalSec = Math.max(maxEndSec, 10);

  // 눈금 간격: 전체 길이를 5~10개 구간으로 나눔
  const rawStep = Math.ceil(totalSec / 6);
  // 가독성 있는 스텝으로 올림 (10, 15, 30, 60, 120 등)
  const nicesteps = [5, 10, 15, 30, 60, 90, 120, 180, 240, 300];
  const tickStep = nicesteps.find((s) => s >= rawStep) ?? rawStep;
  const tickCount = Math.floor(totalSec / tickStep) + 1;

  return (
    <div className="space-y-1">
      {/* 시간 눈금 */}
      <div className="relative h-4 ml-20">
        {Array.from({ length: tickCount }).map((_, i) => {
          const sec = i * tickStep;
          const pct = (sec / totalSec) * 100;
          return (
            <span
              key={sec}
              className="absolute text-[9px] text-muted-foreground"
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
            >
              {secToMmss(sec)}
            </span>
          );
        })}
      </div>

      {/* 타임라인 행들 */}
      <div className="space-y-1">
        {sorted.map((entry) => {
          const startSec = mmssToSec(entry.triggerTime);
          const leftPct = (startSec / totalSec) * 100;
          const widthPct = Math.max((entry.durationSec / totalSec) * 100, 1);

          return (
            <div key={entry.id} className="flex items-center gap-2">
              {/* 레이블 */}
              <div className="w-20 shrink-0 flex items-center justify-end gap-1">
                <span className="font-mono text-[9px] text-muted-foreground">
                  #{entry.cueNumber}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1 py-0 hidden sm:inline-flex ${EFFECT_TYPE_COLORS[entry.effectType]}`}
                >
                  {EFFECT_TYPE_LABELS[entry.effectType]}
                </Badge>
              </div>

              {/* 타임라인 영역 */}
              <div className="flex-1 h-5 relative bg-muted/30 rounded">
                <div
                  className={`absolute top-0.5 bottom-0.5 rounded ${EFFECT_TYPE_BAR_COLORS[entry.effectType]} opacity-80`}
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    minWidth: "4px",
                  }}
                  title={`${entry.triggerTime} ~ +${entry.durationSec}초 | ${EFFECT_TYPE_LABELS[entry.effectType]}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 시간 축 */}
      <div className="relative h-px bg-border ml-20 mt-1" />
    </div>
  );
});
