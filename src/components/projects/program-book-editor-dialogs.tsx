"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  ProgramBookItem,
  ProgramBookItemType,
  ProgramBookCast,
} from "@/types";

// ============================================================
// 유형 헬퍼 (공유)
// ============================================================

export const ALL_ITEM_TYPES: ProgramBookItemType[] = [
  "opening",
  "performance",
  "intermission",
  "special",
  "closing",
];

export function itemTypeLabel(type: ProgramBookItemType): string {
  switch (type) {
    case "performance":
      return "공연";
    case "intermission":
      return "인터미션";
    case "opening":
      return "오프닝";
    case "closing":
      return "클로징";
    case "special":
      return "특별";
  }
}

export function itemTypeBadgeClass(type: ProgramBookItemType): string {
  switch (type) {
    case "performance":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
    case "intermission":
      return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700";
    case "opening":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "closing":
      return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
    case "special":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800";
  }
}

// ============================================================
// 공연 정보 설정 다이얼로그
// ============================================================

export interface ShowInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialShowTitle?: string;
  initialShowDate?: string | null;
  initialVenue?: string | null;
  initialNotes?: string;
  onSubmit: (info: {
    showTitle: string;
    showDate: string | null;
    venue: string | null;
    notes: string;
  }) => void;
}

export function ShowInfoDialog({
  open,
  onOpenChange,
  initialShowTitle = "",
  initialShowDate = "",
  initialVenue = "",
  initialNotes = "",
  onSubmit,
}: ShowInfoDialogProps) {
  const [showTitle, setShowTitle] = useState(initialShowTitle);
  const [showDate, setShowDate] = useState(initialShowDate ?? "");
  const [venue, setVenue] = useState(initialVenue ?? "");
  const [notes, setNotes] = useState(initialNotes);

  const reset = () => {
    setShowTitle(initialShowTitle);
    setShowDate(initialShowDate ?? "");
    setVenue(initialVenue ?? "");
    setNotes(initialNotes);
  };

  const handleSubmit = () => {
    if (!showTitle.trim()) {
      toast.error(TOAST.PROGRAM_BOOK_EDITOR.SHOW_NAME_REQUIRED);
      return;
    }
    onSubmit({
      showTitle: showTitle.trim(),
      showDate: showDate || null,
      venue: venue.trim() || null,
      notes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            공연 정보 설정
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">공연명 *</Label>
            <Input
              value={showTitle}
              onChange={(e) => setShowTitle(e.target.value)}
              placeholder="예: 2025 봄 정기공연"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">공연 날짜</Label>
            <Input
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">장소</Label>
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="예: 대학로 예술극장 대극장"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">비고</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="관객 안내사항, 유의사항 등"
              className="text-xs min-h-[64px] resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 프로그램 아이템 다이얼로그
// ============================================================

export type ItemFormState = {
  type: ProgramBookItemType;
  title: string;
  performers: string;
  duration: string;
  description: string;
  musicTitle: string;
};

const DEFAULT_ITEM_FORM: ItemFormState = {
  type: "performance",
  title: "",
  performers: "",
  duration: "",
  description: "",
  musicTitle: "",
};

export interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: ProgramBookItem;
  onSubmit: (item: Omit<ProgramBookItem, "id" | "order">) => void;
}

export function ItemDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: ItemDialogProps) {
  const [form, setForm] = useState<ItemFormState>(() =>
    initial
      ? {
          type: initial.type,
          title: initial.title,
          performers: initial.performers.join(", "),
          duration: initial.duration ?? "",
          description: initial.description,
          musicTitle: initial.musicTitle ?? "",
        }
      : DEFAULT_ITEM_FORM
  );

  const reset = () => {
    setForm(
      initial
        ? {
            type: initial.type,
            title: initial.title,
            performers: initial.performers.join(", "),
            duration: initial.duration ?? "",
            description: initial.description,
            musicTitle: initial.musicTitle ?? "",
          }
        : DEFAULT_ITEM_FORM
    );
  };

  const update = (key: keyof ItemFormState, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error(TOAST.PROGRAM_BOOK_EDITOR.PROGRAM_TITLE_REQUIRED);
      return;
    }
    const performers = form.performers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit({
      type: form.type,
      title: form.title.trim(),
      performers,
      duration: form.duration.trim() || null,
      description: form.description,
      musicTitle: form.musicTitle.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "프로그램 추가" : "프로그램 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 유형 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">유형 *</Label>
            <Select
              value={form.type}
              onValueChange={(v) => update("type", v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ITEM_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {itemTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">프로그램 제목 *</Label>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="예: Love Shot (커버)"
              className="h-7 text-xs"
            />
          </div>

          {/* 출연진 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              출연진 (쉼표로 구분)
            </Label>
            <Input
              value={form.performers}
              onChange={(e) => update("performers", e.target.value)}
              placeholder="예: 김민준, 이지수, 박서연"
              className="h-7 text-xs"
            />
          </div>

          {/* 음악 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">음악 제목</Label>
            <Input
              value={form.musicTitle}
              onChange={(e) => update("musicTitle", e.target.value)}
              placeholder="예: Love Shot - EXO"
              className="h-7 text-xs"
            />
          </div>

          {/* 소요 시간 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">소요 시간</Label>
            <Input
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="예: 3분 30초, 3:30"
              className="h-7 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">설명/안내</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="프로그램에 대한 간단한 설명"
              className="text-xs min-h-[64px] resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              {mode === "add" ? "추가" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 출연진 다이얼로그
// ============================================================

export type CastFormState = {
  name: string;
  role: string;
  bio: string;
};

const DEFAULT_CAST_FORM: CastFormState = { name: "", role: "", bio: "" };

export interface CastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: ProgramBookCast;
  onSubmit: (cast: Omit<ProgramBookCast, "id">) => void;
}

export function CastDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: CastDialogProps) {
  const [form, setForm] = useState<CastFormState>(() =>
    initial
      ? { name: initial.name, role: initial.role, bio: initial.bio ?? "" }
      : DEFAULT_CAST_FORM
  );

  const reset = () => {
    setForm(
      initial
        ? { name: initial.name, role: initial.role, bio: initial.bio ?? "" }
        : DEFAULT_CAST_FORM
    );
  };

  const update = (key: keyof CastFormState, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error(TOAST.PROGRAM_BOOK_EDITOR.CAST_NAME_REQUIRED);
      return;
    }
    if (!form.role.trim()) {
      toast.error(TOAST.PROGRAM_BOOK_EDITOR.ROLE_REQUIRED);
      return;
    }
    onSubmit({
      name: form.name.trim(),
      role: form.role.trim(),
      bio: form.bio.trim() || null,
      photoUrl: initial?.photoUrl ?? null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "출연진 추가" : "출연진 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">이름 *</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="예: 김민준"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">역할 *</Label>
            <Input
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              placeholder="예: 메인 댄서, 안무 감독, 팀장"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">약력</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="간단한 소개 또는 약력"
              className="text-xs min-h-[80px] resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              {mode === "add" ? "추가" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
