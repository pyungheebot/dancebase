"use client";

import { useState, useMemo } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Volume2,
  Music,
  Mic,
  Radio,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  Zap,
  Layers,
  Clock,
  FileText,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  BarChart3,
  Timer,
  User,
  ListMusic,
  Clapperboard,
} from "lucide-react";
import { toast } from "sonner";
import { useSoundCue } from "@/hooks/use-sound-cue";
import type {
  SoundCueEntry,
  SoundCueType,
  SoundCueAction,
  SoundCueSheet,
} from "@/types";

const TYPE_LABELS: Record<SoundCueType, string> = {
  bgm: "BGM",
  sfx: "효과음",
  narration: "나레이션",
  live: "라이브",
  silence: "무음",
};

const TYPE_ICONS: Record<SoundCueType, React.ReactNode> = {
  bgm: <Music className="h-3 w-3" />,
  sfx: <Zap className="h-3 w-3" />,
  narration: <Mic className="h-3 w-3" />,
  live: <Radio className="h-3 w-3" />,
  silence: <VolumeX className="h-3 w-3" />,
};

const TYPE_BADGE_COLORS: Record<SoundCueType, string> = {
  bgm: "bg-blue-100 text-blue-700 border-blue-200",
  sfx: "bg-orange-100 text-orange-700 border-orange-200",
  narration: "bg-purple-100 text-purple-700 border-purple-200",
  live: "bg-pink-100 text-pink-700 border-pink-200",
  silence: "bg-gray-100 text-gray-600 border-gray-200",
};

const TYPE_TIMELINE_COLORS: Record<SoundCueType, string> = {
  bgm: "bg-blue-400",
  sfx: "bg-orange-400",
  narration: "bg-purple-400",
  live: "bg-pink-400",
  silence: "bg-gray-300",
};

const ACTION_LABELS: Record<SoundCueAction, string> = {
  play: "재생",
  stop: "정지",
  fade_in: "페이드인",
  fade_out: "페이드아웃",
  crossfade: "크로스페이드",
  loop: "반복",
};

const ACTION_ICONS: Record<SoundCueAction, React.ReactNode> = {
  play: <Play className="h-3 w-3" />,
  stop: <Square className="h-3 w-3" />,
  fade_in: <Volume2 className="h-3 w-3" />,
  fade_out: <VolumeX className="h-3 w-3" />,
  crossfade: <Radio className="h-3 w-3" />,
  loop: <RotateCcw className="h-3 w-3" />,
};

const ACTION_BADGE_COLORS: Record<SoundCueAction, string> = {
  play: "bg-green-100 text-green-700 border-green-200",
  stop: "bg-red-100 text-red-700 border-red-200",
  fade_in: "bg-sky-100 text-sky-700 border-sky-200",
  fade_out: "bg-indigo-100 text-indigo-700 border-indigo-200",
  crossfade: "bg-violet-100 text-violet-700 border-violet-200",
  loop: "bg-amber-100 text-amber-700 border-amber-200",
};

const ALL_TYPES: SoundCueType[] = ["bgm", "sfx", "narration", "live", "silence"];
const ALL_ACTIONS: SoundCueAction[] = [
  "play",
  "stop",
  "fade_in",
  "fade_out",
  "crossfade",
  "loop",
];

type CueFormData = Omit<SoundCueEntry, "id" | "isActive" | "isChecked">;

interface CueDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Partial<CueFormData>;
  nextCueNumber: number;
  onClose: () => void;
  onSubmit: (data: CueFormData) => void;
}

function CueDialog({
  open,
  mode,
  initial,
  nextCueNumber,
  onClose,
  onSubmit,
}: CueDialogProps) {
  const [cueNumber, setCueNumber] = useState(
    String(initial?.cueNumber ?? nextCueNumber)
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [trackName, setTrackName] = useState(initial?.trackName ?? "");
  const [artist, setArtist] = useState(initial?.artist ?? "");
  const [type, setType] = useState<SoundCueType>(initial?.type ?? "bgm");
  const [action, setAction] = useState<SoundCueAction>(
    initial?.action ?? "play"
  );
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [volume, setVolume] = useState(initial?.volume ?? 80);
  const [fadeIn, setFadeIn] = useState(
    initial?.fadeIn !== undefined ? String(initial.fadeIn) : ""
  );
  const [fadeOut, setFadeOut] = useState(
    initial?.fadeOut !== undefined ? String(initial.fadeOut) : ""
  );
  const [scene, setScene] = useState(initial?.scene ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("큐 이름을 입력해주세요.");
      return;
    }
    const num = parseInt(cueNumber, 10);
    if (isNaN(num) || num < 1) {
      toast.error("올바른 큐 번호를 입력해주세요.");
      return;
    }

    const fadeInVal = fadeIn.trim() ? parseFloat(fadeIn) : undefined;
    const fadeOutVal = fadeOut.trim() ? parseFloat(fadeOut) : undefined;

    onSubmit({
      cueNumber: num,
      name: name.trim(),
      trackName: trackName.trim() || undefined,
      artist: artist.trim() || undefined,
      type,
      action,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
      volume,
      fadeIn:
        fadeInVal !== undefined && !isNaN(fadeInVal) ? fadeInVal : undefined,
      fadeOut:
        fadeOutVal !== undefined && !isNaN(fadeOutVal) ? fadeOutVal : undefined,
      scene: scene.trim() || undefined,
      source: source.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-indigo-500" />
            {mode === "add" ? "음향 큐 추가" : "음향 큐 편집"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">큐 번호</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={1}
                placeholder="1"
                value={cueNumber}
                onChange={(e) => setCueNumber(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-muted-foreground">
                큐 이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 오프닝 BGM"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                <ListMusic className="h-3 w-3 inline mr-0.5" />
                트랙명
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: Beautiful Day"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                <User className="h-3 w-3 inline mr-0.5" />
                아티스트
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: U2"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">유형</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as SoundCueType)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">액션</Label>
              <Select
                value={action}
                onValueChange={(v) => setAction(v as SoundCueAction)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a} className="text-xs">
                      {ACTION_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                시작 시간 (MM:SS)
              </Label>
              <Input
                className="h-8 text-xs font-mono"
                placeholder="예: 01:30"
                maxLength={5}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                종료 시간 (MM:SS)
              </Label>
              <Input
                className="h-8 text-xs font-mono"
                placeholder="예: 04:00"
                maxLength={5}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">볼륨</Label>
              <span className="text-xs font-medium tabular-nums">
                {volume}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[volume]}
              onValueChange={([v]) => setVolume(v)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                페이드 인 (초)
              </Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={0}
                step={0.5}
                placeholder="예: 2"
                value={fadeIn}
                onChange={(e) => setFadeIn(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                페이드 아웃 (초)
              </Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={0}
                step={0.5}
                placeholder="예: 3"
                value={fadeOut}
                onChange={(e) => setFadeOut(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              <Clapperboard className="h-3 w-3 inline mr-0.5" />
              장면/섹션 연결
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 1막 2장, 오프닝 씬"
              value={scene}
              onChange={(e) => setScene(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">소스/파일명</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: track01_opening.mp3"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">메모</Label>
            <Textarea
              className="text-xs min-h-[52px] resize-none"
              placeholder="특이사항 또는 운영자 메모"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SheetDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initialTitle?: string;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

function SheetDialog({
  open,
  mode,
  initialTitle,
  onClose,
  onSubmit,
}: SheetDialogProps) {
  const [title, setTitle] = useState(initialTitle ?? "");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("시트 제목을 입력해주세요.");
      return;
    }
    onSubmit(title.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "큐시트 추가" : "큐시트 편집"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">시트 제목</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 1부 공연, 앙코르 세트"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VolumeBar({ volume }: { volume: number }) {
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

function Timeline({ cues }: { cues: SoundCueEntry[] }) {
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

type StatsData = {
  totalCues: number;
  activeCues: number;
  checkedCues: number;
  typeDistribution: { type: SoundCueType; count: number }[];
  totalRuntimeLabel: string;
};

function StatsPanel({ stats }: { stats: StatsData }) {
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

interface CueRowProps {
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

function CueRow({
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
}

interface SoundCueCardProps {
  groupId: string;
  projectId: string;
}

export function SoundCueCard({ groupId, projectId }: SoundCueCardProps) {
  const {
    sheets,
    loading,
    addSheet,
    updateSheet,
    deleteSheet,
    addCue,
    updateCue,
    deleteCue,
    moveCueUp,
    moveCueDown,
    toggleActive,
    toggleChecked,
    stats,
  } = useSoundCue(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [sheetDialogMode, setSheetDialogMode] = useState<"add" | "edit">("add");
  const [editingSheet, setEditingSheet] = useState<SoundCueSheet | null>(null);

  const [cueDialogOpen, setCueDialogOpen] = useState(false);
  const [cueDialogMode, setCueDialogMode] = useState<"add" | "edit">("add");
  const [editingCue, setEditingCue] = useState<SoundCueEntry | null>(null);

  const selectedSheet = useMemo(() => {
    return sheets.find((s) => s.id === selectedSheetId) ?? sheets[0] ?? null;
  }, [sheets, selectedSheetId]);

  const sortedCues = useMemo(() => {
    if (!selectedSheet) return [];
    return [...selectedSheet.cues].sort((a, b) => a.cueNumber - b.cueNumber);
  }, [selectedSheet]);

  const nextCueNumber = useMemo(() => {
    if (!selectedSheet || selectedSheet.cues.length === 0) return 1;
    return Math.max(...selectedSheet.cues.map((c) => c.cueNumber)) + 1;
  }, [selectedSheet]);

  const handleAddSheetOpen = () => {
    setEditingSheet(null);
    setSheetDialogMode("add");
    setSheetDialogOpen(true);
  };

  const handleEditSheetOpen = (sheet: SoundCueSheet) => {
    setEditingSheet(sheet);
    setSheetDialogMode("edit");
    setSheetDialogOpen(true);
  };

  const handleSheetSubmit = (title: string) => {
    if (sheetDialogMode === "add") {
      const newSheet = addSheet(title);
      setSelectedSheetId(newSheet.id);
      toast.success("큐시트가 추가되었습니다.");
    } else if (editingSheet) {
      updateSheet(editingSheet.id, title);
      toast.success("큐시트가 수정되었습니다.");
    }
  };

  const handleDeleteSheet = (sheetId: string) => {
    deleteSheet(sheetId);
    if (selectedSheetId === sheetId) {
      setSelectedSheetId(null);
    }
    toast.success("큐시트가 삭제되었습니다.");
  };

  const handleAddCueOpen = () => {
    setEditingCue(null);
    setCueDialogMode("add");
    setCueDialogOpen(true);
  };

  const handleEditCueOpen = (cue: SoundCueEntry) => {
    setEditingCue(cue);
    setCueDialogMode("edit");
    setCueDialogOpen(true);
  };

  const handleCueSubmit = (data: CueFormData) => {
    if (!selectedSheet) return;
    if (cueDialogMode === "add") {
      addCue(selectedSheet.id, data);
      toast.success("큐가 추가되었습니다.");
    } else if (editingCue) {
      updateCue(selectedSheet.id, editingCue.id, data);
      toast.success("큐가 수정되었습니다.");
    }
  };

  const handleDeleteCue = (cueId: string) => {
    if (!selectedSheet) return;
    deleteCue(selectedSheet.id, cueId);
    toast.success("큐가 삭제되었습니다.");
  };

  const handleToggleActive = (cueId: string) => {
    if (!selectedSheet) return;
    toggleActive(selectedSheet.id, cueId);
  };

  const handleToggleChecked = (cueId: string) => {
    if (!selectedSheet) return;
    toggleChecked(selectedSheet.id, cueId);
  };

  const handleMoveUp = (cueId: string) => {
    if (!selectedSheet) return;
    moveCueUp(selectedSheet.id, cueId);
  };

  const handleMoveDown = (cueId: string) => {
    if (!selectedSheet) return;
    moveCueDown(selectedSheet.id, cueId);
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-indigo-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 음향 큐시트
                  </CardTitle>
                  {stats.totalSheets > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border-indigo-200"
                    >
                      {stats.totalSheets}개 시트
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {stats.totalCues > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      큐 {stats.checkedCues}/{stats.totalCues} 체크
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2">
                  불러오는 중...
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        onClick={() => setSelectedSheetId(sheet.id)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          selectedSheet?.id === sheet.id
                            ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-medium"
                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Layers className="h-3 w-3" />
                        {sheet.title}
                      </button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 rounded-full"
                      onClick={handleAddSheetOpen}
                    >
                      <Plus className="h-3 w-3 mr-0.5" />
                      시트 추가
                    </Button>
                  </div>

                  {selectedSheet ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-muted/40 border">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {selectedSheet.title}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 flex-shrink-0"
                          >
                            큐 {selectedSheet.cues.length}개
                          </Badge>
                          {selectedSheet.cues.some((c) => c.isChecked) && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 flex-shrink-0 bg-green-50 text-green-600 border-green-200 flex items-center gap-0.5"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {selectedSheet.cues.filter((c) => c.isChecked).length}
                              /{selectedSheet.cues.length} 완료
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 w-6 p-0 ${showStats ? "text-indigo-600" : "text-muted-foreground"}`}
                            onClick={() => setShowStats((v) => !v)}
                            title="통계 보기"
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditSheetOpen(selectedSheet)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSheet(selectedSheet.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {showStats && stats.totalCues > 0 && (
                        <StatsPanel stats={stats} />
                      )}

                      {sortedCues.length > 0 && (
                        <Timeline cues={sortedCues} />
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          큐 목록
                          <span className="ml-1 text-[10px] text-muted-foreground/70">
                            (호버 시 순서 변경 가능)
                          </span>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleAddCueOpen}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          큐 추가
                        </Button>
                      </div>

                      {sortedCues.length === 0 ? (
                        <div className="py-6 text-center space-y-1.5">
                          <Volume2 className="h-6 w-6 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            큐를 추가하여 음향 큐시트를 작성하세요.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {sortedCues.map((cue, idx) => (
                            <CueRow
                              key={cue.id}
                              cue={cue}
                              isFirst={idx === 0}
                              isLast={idx === sortedCues.length - 1}
                              onEdit={() => handleEditCueOpen(cue)}
                              onDelete={() => handleDeleteCue(cue.id)}
                              onToggleActive={() => handleToggleActive(cue.id)}
                              onToggleChecked={() => handleToggleChecked(cue.id)}
                              onMoveUp={() => handleMoveUp(cue.id)}
                              onMoveDown={() => handleMoveDown(cue.id)}
                            />
                          ))}
                        </div>
                      )}

                      {sortedCues.some((c) => c.notes) && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            운영자 메모
                          </span>
                          {sortedCues
                            .filter((c) => c.notes)
                            .map((cue) => (
                              <div
                                key={`note-${cue.id}`}
                                className="flex gap-2 p-2 rounded-md bg-amber-50 border border-amber-200"
                              >
                                <span className="text-[10px] font-mono font-bold text-amber-700 flex-shrink-0">
                                  Q{cue.cueNumber}
                                </span>
                                <p className="text-[10px] text-amber-800 leading-relaxed">
                                  {cue.notes}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-1.5">
                      <Volume2 className="h-6 w-6 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        시트를 추가하여 음향 큐시트를 관리하세요.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <SheetDialog
        open={sheetDialogOpen}
        mode={sheetDialogMode}
        initialTitle={editingSheet?.title}
        onClose={() => setSheetDialogOpen(false)}
        onSubmit={handleSheetSubmit}
      />

      <CueDialog
        open={cueDialogOpen}
        mode={cueDialogMode}
        initial={
          editingCue
            ? {
                cueNumber: editingCue.cueNumber,
                name: editingCue.name,
                trackName: editingCue.trackName,
                artist: editingCue.artist,
                type: editingCue.type,
                action: editingCue.action,
                startTime: editingCue.startTime,
                endTime: editingCue.endTime,
                volume: editingCue.volume,
                fadeIn: editingCue.fadeIn,
                fadeOut: editingCue.fadeOut,
                scene: editingCue.scene,
                source: editingCue.source,
                notes: editingCue.notes,
              }
            : undefined
        }
        nextCueNumber={nextCueNumber}
        onClose={() => setCueDialogOpen(false)}
        onSubmit={handleCueSubmit}
      />
    </>
  );
}
