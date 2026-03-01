"use client";

// ============================================================
// 무대 메모 카드 — 폼 다이얼로그
//  - CreateBoardDialog: 보드 생성
//  - AddNoteDialog: 메모 추가
// ============================================================

import { useState } from "react";
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
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { StageMemoZone, StageMemoPriority } from "@/types";
import {
  ZONE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_DOT_COLORS,
} from "./stage-memo-types";

// ============================================================
// 보드 생성 다이얼로그
// ============================================================

export interface CreateBoardDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

export function CreateBoardDialog({
  open,
  onClose,
  onSubmit,
}: CreateBoardDialogProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error(TOAST.STAGE_MEMO.BOARD_TITLE_REQUIRED);
      return;
    }
    onSubmit(trimmed);
    setTitle("");
    onClose();
  }

  function handleClose() {
    setTitle("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-500" aria-hidden="true" />
            새 무대 메모 보드
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          <div className="space-y-1">
            <Label htmlFor="board-title" className="text-xs">
              보드 제목 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id="board-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2026 봄 정기공연 무대"
              className="h-7 text-xs"
              autoFocus
              required
              aria-required="true"
              maxLength={100}
            />
          </div>
          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              만들기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메모 추가 다이얼로그
// ============================================================

export interface AddNoteDialogProps {
  open: boolean;
  onClose: () => void;
  defaultZone?: StageMemoZone;
  onSubmit: (
    zone: StageMemoZone,
    priority: StageMemoPriority,
    content: string,
    author: string,
    tags: string[]
  ) => void;
}

export function AddNoteDialog({
  open,
  onClose,
  defaultZone,
  onSubmit,
}: AddNoteDialogProps) {
  const [zone, setZone] = useState<StageMemoZone>(defaultZone ?? "center");
  const [priority, setPriority] = useState<StageMemoPriority>("medium");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  function handleOpen(isOpen: boolean) {
    if (isOpen && defaultZone) {
      setZone(defaultZone);
    }
    if (!isOpen) handleClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error(TOAST.STAGE_MEMO.MEMO_CONTENT_REQUIRED);
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit(zone, priority, trimmedContent, author.trim(), tags);
    resetForm();
    onClose();
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function resetForm() {
    setContent("");
    setAuthor("");
    setTagsInput("");
    setPriority("medium");
    if (defaultZone) setZone(defaultZone);
  }

  const previewTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4 text-rose-500" aria-hidden="true" />
            메모 추가
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          {/* 구역 선택 */}
          <div className="space-y-1">
            <Label htmlFor="note-zone" className="text-xs">구역</Label>
            <Select
              value={zone}
              onValueChange={(v) => setZone(v as StageMemoZone)}
            >
              <SelectTrigger id="note-zone" className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ZONE_LABELS) as StageMemoZone[]).map((z) => (
                  <SelectItem key={z} value={z} className="text-xs">
                    {ZONE_LABELS[z]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 우선순위 */}
          <div className="space-y-1">
            <Label htmlFor="note-priority" className="text-xs">우선순위</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as StageMemoPriority)}
            >
              <SelectTrigger id="note-priority" className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_LABELS) as StageMemoPriority[]).map(
                  (p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${PRIORITY_DOT_COLORS[p]}`}
                          aria-hidden="true"
                        />
                        {PRIORITY_LABELS[p]}
                      </span>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label htmlFor="note-content" className="text-xs">
              내용 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="메모 내용을 입력하세요..."
              className="text-xs resize-none min-h-[64px]"
              rows={3}
              autoFocus
              required
              aria-required="true"
              maxLength={500}
            />
          </div>

          {/* 작성자 */}
          <div className="space-y-1">
            <Label htmlFor="note-author" className="text-xs">작성자</Label>
            <Input
              id="note-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="예: 김철수"
              className="h-7 text-xs"
              maxLength={50}
            />
          </div>

          {/* 태그 */}
          <div className="space-y-1">
            <Label htmlFor="note-tags" className="text-xs">
              태그{" "}
              <span className="text-muted-foreground">(쉼표로 구분)</span>
            </Label>
            <Input
              id="note-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="예: 동선, 주의, 조명"
              className="h-7 text-xs"
              aria-describedby={previewTags.length > 0 ? "tag-preview" : undefined}
            />
            {previewTags.length > 0 && (
              <div
                id="tag-preview"
                className="flex flex-wrap gap-1 pt-0.5"
                aria-label="태그 미리보기"
              >
                {previewTags.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
