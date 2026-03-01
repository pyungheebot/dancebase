"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Volume2,
  VolumeX,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Clapperboard,
  ListMusic,
  User,
  Play,
  Square,
  Radio,
  RotateCcw,
  Music,
  Zap,
  Mic,
  BarChart3,
  Timer,
} from "lucide-react";
import type { SoundCueEntry, SoundCueType, SoundCueAction } from "@/types";

// ============================================================
// 공유 상수 (rows 파일에서 독립적으로 선언)
// ============================================================

export const TYPE_LABELS: Record<SoundCueType, string> = {
  bgm: "BGM",
  sfx: "효과음",
  narration: "나레이션",
  live: "라이브",
  silence: "무음",
};

export const TYPE_ICONS: Record<SoundCueType, React.ReactNode> = {
  bgm: <Music className="h-3 w-3" />,
  sfx: <Zap className="h-3 w-3" />,
  narration: <Mic className="h-3 w-3" />,
  live: <Radio className="h-3 w-3" />,
  silence: <VolumeX className="h-3 w-3" />,
};

export const TYPE_BADGE_COLORS: Record<SoundCueType, string> = {
  bgm: "bg-blue-100 text-blue-700 border-blue-200",
  sfx: "bg-orange-100 text-orange-700 border-orange-200",
  narration: "bg-purple-100 text-purple-700 border-purple-200",
  live: "bg-pink-100 text-pink-700 border-pink-200",
  silence: "bg-gray-100 text-gray-600 border-gray-200",
};

export const TYPE_TIMELINE_COLORS: Record<SoundCueType, string> = {
  bgm: "bg-blue-400",
  sfx: "bg-orange-400",
  narration: "bg-purple-400",
  live: "bg-pink-400",
  silence: "bg-gray-300",
};

export const ACTION_LABELS: Record<SoundCueAction, string> = {
  play: "재생",
  stop: "정지",
  fade_in: "페이드인",
  fade_out: "페이드아웃",
  crossfade: "크로스페이드",
  loop: "반복",
};

export const ACTION_ICONS: Record<SoundCueAction, React.ReactNode> = {
  play: <Play className="h-3 w-3" />,
  stop: <Square className="h-3 w-3" />,
  fade_in: <Volume2 className="h-3 w-3" />,
  fade_out: <VolumeX className="h-3 w-3" />,
  crossfade: <Radio className="h-3 w-3" />,
  loop: <RotateCcw className="h-3 w-3" />,
};

export const ACTION_BADGE_COLORS: Record<SoundCueAction, string> = {
  play: "bg-green-100 text-green-700 border-green-200",
  stop: "bg-red-100 text-red-700 border-red-200",
  fade_in: "bg-sky-100 text-sky-700 border-sky-200",
  fade_out: "bg-indigo-100 text-indigo-700 border-indigo-200",
  crossfade: "bg-violet-100 text-violet-700 border-violet-200",
  loop: "bg-amber-100 text-amber-700 border-amber-200",
};

// ============================================================
// StatsData 타입
// ============================================================

export type StatsData = {
  totalCues: number;
  activeCues: number;
  checkedCues: number;
  typeDistribution: { type: SoundCueType; count: number }[];
  totalRuntimeLabel: string;
};

// ============================================================
// VolumeBar
// ============================================================

export function VolumeBar({ volume }: { volume: number }) {
  const pct = Math.max(0, Math.min(100, volume));
  const color =
    pct >= 80
      ? "bg-red-400"
      : pct >= 50
        ? "bg-amber-400"
        : pct >= 20
          ? "bg-green-400"
          : "bg-muted-foreground";

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">
        {pct}%
      </span>
    </div>
  );
}

// ============================================================
// Timeline
// ============================================================

export function Timeline({ cues }: { cues: SoundCueEntry[] }) {
  const activeCues = cues.filter((c) => c.isActive);
  if (activeCues.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground">
          타임라인 ({activeCues.length}개 활성)
        </span>
      </div>
      <div className="relative h-8 bg-muted/30 rounded-md border overflow-hidden">
        {activeCues.map((cue, idx) => {
          const segWidth = 100 / activeCues.length;
          const left = idx * segWidth;
          const heightPct = Math.max(20, cue.volume);
          return (
            <div
              key={cue.id}
              className={`absolute bottom-0 ${TYPE_TIMELINE_COLORS[cue.type]} opacity-70 rounded-sm`}
              style={{
                left: `calc(${left}% + 1px)`,
                width: `calc(${segWidth}% - 2px)`,
                height: `${heightPct}%`,
              }}
              title={`Q${cue.cueNumber} ${cue.name} (${TYPE_LABELS[cue.type]}, ${cue.volume}%)`}
            />
          );
        })}
        {activeCues.map((cue, idx) => {
          const segWidth = 100 / activeCues.length;
          const left = idx * segWidth;
          return (
            <span
              key={`label-${cue.id}`}
              className="absolute top-0.5 text-[9px] text-foreground/70 font-medium"
              style={{ left: `calc(${left}% + 3px)` }}
            >
              Q{cue.cueNumber}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// StatsPanel
// ============================================================

export function StatsPanel({ stats }: { stats: StatsData }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-2.5">
      <div className="flex items-center gap-1.5">
        <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
        <span className="text-xs font-medium">통계</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <p className="text-base font-bold text-indigo-600">{stats.totalCues}</p>
          <p className="text-[10px] text-muted-foreground">총 큐</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-green-600">{stats.activeCues}</p>
          <p className="text-[10px] text-muted-foreground">활성</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-blue-600">{stats.checkedCues}</p>
          <p className="text-[10px] text-muted-foreground">체크완료</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5">
            <Timer className="h-3 w-3 text-amber-500" />
            <p className="text-xs font-bold text-amber-600">
              {stats.totalRuntimeLabel}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">런타임</p>
        </div>
      </div>
      {stats.typeDistribution.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">유형별 분포</p>
          <div className="flex flex-wrap gap-1.5">
            {stats.typeDistribution.map(({ type, count }) => (
              <Badge
                key={type}
                variant="outline"
                className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${TYPE_BADGE_COLORS[type]}`}
              >
                {TYPE_ICONS[type]}
                {TYPE_LABELS[type]} {count}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CueRow
// ============================================================

export interface CueRowProps {
  cue: SoundCueEntry;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onToggleChecked: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const CueRow = React.memo(function CueRow({
  cue,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleChecked,
  onMoveUp,
  onMoveDown,
}: CueRowProps) {
  return (
    <div
      className={`flex items-start gap-2 px-2.5 py-2 rounded-md border group transition-colors ${
        cue.isChecked
          ? "bg-green-50/60 border-green-200"
          : cue.isActive
            ? "bg-card border-border"
            : "bg-muted/20 border-dashed border-border opacity-60"
      }`}
    >
      <Checkbox
        checked={cue.isChecked}
        onCheckedChange={onToggleChecked}
        className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
        title="체크 완료 표시"
      />
      <span className="text-[10px] font-mono font-bold text-muted-foreground w-6 flex-shrink-0 text-center mt-0.5">
        Q{cue.cueNumber}
      </span>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs font-medium ${cue.isChecked ? "line-through text-muted-foreground" : ""}`}
          >
            {cue.name}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 flex-shrink-0 ${TYPE_BADGE_COLORS[cue.type]}`}
          >
            {TYPE_ICONS[cue.type]}
            {TYPE_LABELS[cue.type]}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 flex-shrink-0 ${ACTION_BADGE_COLORS[cue.action]}`}
          >
            {ACTION_ICONS[cue.action]}
            {ACTION_LABELS[cue.action]}
          </Badge>
        </div>
        {(cue.trackName || cue.artist) && (
          <div className="flex items-center gap-2">
            {cue.trackName && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <ListMusic className="h-2.5 w-2.5" />
                {cue.trackName}
              </span>
            )}
            {cue.artist && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <User className="h-2.5 w-2.5" />
                {cue.artist}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {(cue.startTime || cue.endTime) && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 font-mono">
              <Clock className="h-2.5 w-2.5" />
              {cue.startTime ?? "--:--"} ~ {cue.endTime ?? "--:--"}
            </span>
          )}
          {(cue.fadeIn !== undefined || cue.fadeOut !== undefined) && (
            <span className="text-[10px] text-sky-600">
              {cue.fadeIn !== undefined && `F.in ${cue.fadeIn}s`}
              {cue.fadeIn !== undefined && cue.fadeOut !== undefined && " / "}
              {cue.fadeOut !== undefined && `F.out ${cue.fadeOut}s`}
            </span>
          )}
          {cue.scene && (
            <span className="text-[10px] text-violet-600 flex items-center gap-0.5">
              <Clapperboard className="h-2.5 w-2.5" />
              {cue.scene}
            </span>
          )}
        </div>
        <VolumeBar volume={cue.volume} />
      </div>
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            onClick={onMoveUp}
            disabled={isFirst}
            title="위로 이동"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            onClick={onMoveDown}
            disabled={isLast}
            title="아래로 이동"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className={`h-5 w-5 p-0 ${cue.isActive ? "text-muted-foreground" : "text-green-600"}`}
            onClick={onToggleActive}
            title={cue.isActive ? "비활성화" : "활성화"}
          >
            {cue.isActive ? (
              <VolumeX className="h-3 w-3" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={onEdit}
            title="편집"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});
