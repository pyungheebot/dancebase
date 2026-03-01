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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Volume2,
  ListMusic,
  User,
  Clapperboard,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { SoundCueType, SoundCueAction } from "@/types";

// ============================================================
// 공유 상수
// ============================================================

export const TYPE_LABELS: Record<SoundCueType, string> = {
  bgm: "BGM",
  sfx: "효과음",
  narration: "나레이션",
  live: "라이브",
  silence: "무음",
};

export const ACTION_LABELS: Record<SoundCueAction, string> = {
  play: "재생",
  stop: "정지",
  fade_in: "페이드인",
  fade_out: "페이드아웃",
  crossfade: "크로스페이드",
  loop: "반복",
};

export const ALL_TYPES: SoundCueType[] = ["bgm", "sfx", "narration", "live", "silence"];
export const ALL_ACTIONS: SoundCueAction[] = [
  "play",
  "stop",
  "fade_in",
  "fade_out",
  "crossfade",
  "loop",
];

// ============================================================
// CueFormData 타입
// ============================================================

import type { SoundCueEntry } from "@/types";
export type CueFormData = Omit<SoundCueEntry, "id" | "isActive" | "isChecked">;

// ============================================================
// CueDialog
// ============================================================

export interface CueDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Partial<CueFormData>;
  nextCueNumber: number;
  onClose: () => void;
  onSubmit: (data: CueFormData) => void;
}

export function CueDialog({
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
      toast.error(TOAST.SOUND_CUE.CUE_NAME_REQUIRED);
      return;
    }
    const num = parseInt(cueNumber, 10);
    if (isNaN(num) || num < 1) {
      toast.error(TOAST.SOUND_CUE.CUE_NUMBER_REQUIRED);
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

// ============================================================
// SheetDialog
// ============================================================

export interface SheetDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initialTitle?: string;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

export function SheetDialog({
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
      toast.error(TOAST.SOUND_CUE.SHEET_TITLE_REQUIRED);
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
