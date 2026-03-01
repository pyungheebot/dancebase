"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { mmssToSeconds } from "@/hooks/use-practice-playlist-card";
import type { PracticePlaylistPurpose } from "./types";
import { DEFAULT_TRACK_FORM } from "./types";

export interface AddTrackDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    title: string,
    artist: string,
    duration: number,
    purpose: PracticePlaylistPurpose,
    bpm?: number,
    genre?: string,
    notes?: string,
    addedBy?: string
  ) => void;
}

export function AddTrackDialog({ open, onClose, onAdd }: AddTrackDialogProps) {
  const [form, setForm] = useState(DEFAULT_TRACK_FORM);
  const [durationError, setDurationError] = useState("");

  const set = <K extends keyof typeof DEFAULT_TRACK_FORM>(
    key: K,
    value: (typeof DEFAULT_TRACK_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateDuration = (val: string) => {
    if (!val.trim()) {
      setDurationError("재생시간을 입력해주세요.");
      return false;
    }
    if (!/^\d{1,3}:\d{2}$/.test(val.trim())) {
      setDurationError("MM:SS 형식으로 입력해주세요. (예: 03:45)");
      return false;
    }
    const secs = mmssToSeconds(val.trim());
    if (secs <= 0) {
      setDurationError("올바른 재생시간을 입력해주세요.");
      return false;
    }
    setDurationError("");
    return true;
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error(TOAST.PRACTICE_PLAYLIST_CARD.TITLE_REQUIRED);
      return;
    }
    if (!validateDuration(form.durationStr)) return;
    const duration = mmssToSeconds(form.durationStr.trim());
    const bpm = form.bpmStr.trim() ? parseInt(form.bpmStr, 10) : undefined;
    onAdd(
      form.title,
      form.artist,
      duration,
      form.purpose,
      bpm && !isNaN(bpm) ? bpm : undefined,
      form.genre || undefined,
      form.notes || undefined,
      form.addedBy || undefined
    );
    setForm(DEFAULT_TRACK_FORM);
    setDurationError("");
    onClose();
    toast.success(TOAST.PLAYLIST.SONG_ADDED);
  };

  const handleClose = () => {
    setForm(DEFAULT_TRACK_FORM);
    setDurationError("");
    onClose();
  };

  const titleId = "add-track-title";
  const artistId = "add-track-artist";
  const purposeId = "add-track-purpose";
  const durationId = "add-track-duration";
  const durationErrorId = "add-track-duration-error";
  const bpmId = "add-track-bpm";
  const genreId = "add-track-genre";
  const notesId = "add-track-notes";
  const addedById = "add-track-added-by";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm">곡 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div>
            <Label
              htmlFor={titleId}
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              제목 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={titleId}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="곡 제목"
              className="h-7 text-xs"
              autoFocus
              aria-required="true"
            />
          </div>

          {/* 아티스트 */}
          <div>
            <Label
              htmlFor={artistId}
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              아티스트
            </Label>
            <Input
              id={artistId}
              value={form.artist}
              onChange={(e) => set("artist", e.target.value)}
              placeholder="아티스트 이름"
              className="h-7 text-xs"
            />
          </div>

          {/* 용도 */}
          <div>
            <Label
              htmlFor={purposeId}
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              용도 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Select
              value={form.purpose}
              onValueChange={(v) =>
                set("purpose", v as PracticePlaylistPurpose)
              }
            >
              <SelectTrigger id={purposeId} className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warmup" className="text-xs">
                  웜업
                </SelectItem>
                <SelectItem value="main" className="text-xs">
                  본연습
                </SelectItem>
                <SelectItem value="cooldown" className="text-xs">
                  쿨다운
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 재생시간 + BPM */}
          <fieldset className="flex gap-2">
            <legend className="sr-only">재생시간 및 BPM</legend>
            <div className="flex-1">
              <Label
                htmlFor={durationId}
                className="text-[10px] text-muted-foreground mb-1 block"
              >
                재생시간 <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </Label>
              <Input
                id={durationId}
                value={form.durationStr}
                onChange={(e) => {
                  set("durationStr", e.target.value);
                  if (durationError) validateDuration(e.target.value);
                }}
                onBlur={(e) => validateDuration(e.target.value)}
                placeholder="03:45"
                className="h-7 text-xs"
                aria-required="true"
                aria-describedby={durationError ? durationErrorId : undefined}
                aria-invalid={!!durationError}
              />
              {durationError && (
                <p
                  id={durationErrorId}
                  className="text-[10px] text-destructive mt-0.5"
                  role="alert"
                >
                  {durationError}
                </p>
              )}
            </div>
            <div className="w-24">
              <Label
                htmlFor={bpmId}
                className="text-[10px] text-muted-foreground mb-1 block"
              >
                BPM
              </Label>
              <Input
                id={bpmId}
                value={form.bpmStr}
                onChange={(e) =>
                  set("bpmStr", e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="120"
                className="h-7 text-xs"
                type="number"
                min={1}
                max={300}
              />
            </div>
          </fieldset>

          {/* 장르 */}
          <div>
            <Label
              htmlFor={genreId}
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              장르
            </Label>
            <Input
              id={genreId}
              value={form.genre}
              onChange={(e) => set("genre", e.target.value)}
              placeholder="힙합, 팝핑, 락킹..."
              className="h-7 text-xs"
            />
          </div>

          {/* 메모 */}
          <div>
            <Label
              htmlFor={notesId}
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              메모
            </Label>
            <Textarea
              id={notesId}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="연습 포인트, 참고사항 등"
              className="min-h-[56px] resize-none text-xs"
            />
          </div>

          {/* 추가자 */}
          <div>
            <Label
              htmlFor={addedById}
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              추가자
            </Label>
            <Input
              id={addedById}
              value={form.addedBy}
              onChange={(e) => set("addedBy", e.target.value)}
              placeholder="이름 (미입력 시 '나')"
              className="h-7 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!form.title.trim()}
            aria-disabled={!form.title.trim()}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
