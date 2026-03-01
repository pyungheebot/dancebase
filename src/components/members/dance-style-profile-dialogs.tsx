"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAsyncAction } from "@/hooks/use-async-action";
import type {
  DanceProfileGenreEntry,
  DanceProfileInspirationEntry,
  DanceProfileSkillStar,
} from "@/types";
import { cn } from "@/lib/utils";
import { PRESET_GENRES } from "./dance-style-profile-types";
import { StarSelector } from "./dance-style-star-selector";

// ============================================================
// 장르 추가/편집 다이얼로그
// ============================================================

export interface GenreDialogProps {
  initial?: DanceProfileGenreEntry;
  existingGenres: string[];
  onSave: (entry: DanceProfileGenreEntry) => Promise<void>;
  trigger: React.ReactNode;
}

export function GenreDialog({ initial, existingGenres, onSave, trigger }: GenreDialogProps) {
  const [open, setOpen] = useState(false);
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [stars, setStars] = useState<DanceProfileSkillStar>(initial?.stars ?? 3);
  const { pending: saving, execute: executeSave } = useAsyncAction();

  const genreInputId = "genre-dialog-name";
  const starsId = "genre-dialog-stars";

  function handleOpen(value: boolean) {
    if (value) {
      setGenre(initial?.genre ?? "");
      setStars(initial?.stars ?? 3);
    }
    setOpen(value);
  }

  async function handleSave() {
    const trimmed = genre.trim();
    if (!trimmed) {
      toast.error(TOAST.MEMBERS.STYLE_PROFILE_GENRE_REQUIRED);
      return;
    }
    if (!initial && existingGenres.includes(trimmed)) {
      toast.error(TOAST.MEMBERS.STYLE_PROFILE_GENRE_DUPLICATE);
      return;
    }
    await executeSave(async () => {
      await onSave({ genre: trimmed, stars });
      toast.success(
        initial
          ? TOAST.MEMBERS.STYLE_PROFILE_GENRE_UPDATED
          : TOAST.MEMBERS.STYLE_PROFILE_GENRE_ADDED
      );
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initial ? "장르 수정" : "선호 장르 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* 장르 이름 */}
          <div className="space-y-1.5">
            <Label htmlFor={genreInputId} className="text-xs">
              장르 이름
            </Label>
            {initial ? (
              <p
                id={genreInputId}
                className="text-xs font-medium px-3 py-2 bg-muted/30 rounded-md"
              >
                {initial.genre}
              </p>
            ) : (
              <>
                <Input
                  id={genreInputId}
                  placeholder="직접 입력하거나 아래에서 선택"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="h-8 text-xs"
                  aria-describedby="genre-preset-hint"
                />
                <div
                  id="genre-preset-hint"
                  className="flex flex-wrap gap-1 pt-1"
                  role="group"
                  aria-label="장르 프리셋 선택"
                >
                  {PRESET_GENRES.filter((g) => !existingGenres.includes(g)).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenre(g)}
                      aria-pressed={genre === g}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        genre === g
                          ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                          : "bg-muted/30 text-muted-foreground border-border hover:border-indigo-300 hover:text-indigo-600"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 숙련도 */}
          <div className="space-y-2">
            <Label htmlFor={starsId} className="text-xs">
              숙련도
            </Label>
            <div id={starsId}>
              <StarSelector value={stars} onChange={setStars} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={saving}
              aria-busy={saving}
            >
              <Check className="h-3 w-3 mr-1" aria-hidden="true" />
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 영감 댄서 다이얼로그
// ============================================================

export interface InspirationDialogProps {
  initial?: DanceProfileInspirationEntry;
  existingNames: string[];
  onSave: (entry: DanceProfileInspirationEntry) => Promise<void>;
  trigger: React.ReactNode;
}

export function InspirationDialog({
  initial,
  existingNames,
  onSave,
  trigger,
}: InspirationDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const { pending: saving, execute: executeInsp } = useAsyncAction();

  const nameInputId = "inspiration-dialog-name";
  const memoInputId = "inspiration-dialog-memo";

  function handleOpen(value: boolean) {
    if (value) {
      setName(initial?.name ?? "");
      setMemo(initial?.memo ?? "");
    }
    setOpen(value);
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(TOAST.MEMBERS.STYLE_PROFILE_DANCER_REQUIRED);
      return;
    }
    if (!initial && existingNames.includes(trimmedName)) {
      toast.error(TOAST.MEMBERS.STYLE_PROFILE_DANCER_DUPLICATE);
      return;
    }
    await executeInsp(async () => {
      await onSave({ name: trimmedName, memo: memo.trim() || undefined });
      toast.success(
        initial
          ? TOAST.MEMBERS.STYLE_PROFILE_DANCER_UPDATED
          : TOAST.MEMBERS.STYLE_PROFILE_DANCER_ADDED
      );
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initial ? "댄서 정보 수정" : "영감 받은 댄서 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label htmlFor={nameInputId} className="text-xs">
              댄서 이름
            </Label>
            <Input
              id={nameInputId}
              placeholder="예: Michael Jackson, Salah..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!initial}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={memoInputId} className="text-xs">
              메모 (선택)
            </Label>
            <Textarea
              id={memoInputId}
              placeholder="어떤 점에서 영감을 받았나요?"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={saving}
              aria-busy={saving}
            >
              <Check className="h-3 w-3 mr-1" aria-hidden="true" />
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
