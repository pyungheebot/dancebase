"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StickyNote,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useScheduleNotes } from "@/hooks/use-schedule-notes";
import type { ScheduleNoteCategory, ScheduleNoteItem } from "@/types";

// ─── 카테고리 메타데이터 ───────────────────────────────────────────────────

const CATEGORY_META: Record<
  ScheduleNoteCategory,
  { label: string; badgeClass: string }
> = {
  준비사항: {
    label: "준비사항",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  변경사항: {
    label: "변경사항",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  메모: {
    label: "메모",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
  },
  중요: {
    label: "중요",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
};

const CATEGORIES: ScheduleNoteCategory[] = ["준비사항", "변경사항", "메모", "중요"];

// ─── 날짜 포맷 헬퍼 ───────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ─── 인라인 편집 행 ───────────────────────────────────────────────────────

type NoteRowProps = {
  note: ScheduleNoteItem;
  onUpdate: (id: string, content: string, category: ScheduleNoteCategory) => boolean;
  onRemove: (id: string) => void;
};

function NoteRow({ note, onUpdate, onRemove }: NoteRowProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editCategory, setEditCategory] = useState<ScheduleNoteCategory>(note.category);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const meta = CATEGORY_META[note.category];

  const handleStartEdit = useCallback(() => {
    setEditContent(note.content);
    setEditCategory(note.category);
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [note.content, note.category]);

  const handleSave = useCallback(() => {
    if (!editContent.trim()) {
      toast.error("내용을 입력해주세요");
      return;
    }
    const ok = onUpdate(note.id, editContent, editCategory);
    if (ok) {
      toast.success("메모를 수정했습니다");
      setEditing(false);
    }
  }, [note.id, editContent, editCategory, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEditContent(note.content);
    setEditCategory(note.category);
  }, [note.content, note.category]);

  const handleRemove = useCallback(() => {
    onRemove(note.id);
    toast.success("메모를 삭제했습니다");
  }, [note.id, onRemove]);

  if (editing) {
    return (
      <div className="rounded border p-2 space-y-2 bg-muted/30">
        <Select
          value={editCategory}
          onValueChange={(v) => setEditCategory(v as ScheduleNoteCategory)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {CATEGORY_META[cat].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCancel();
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
          }}
          className="text-xs resize-none min-h-[60px]"
          placeholder="메모 내용을 입력하세요"
        />
        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={handleSave}
            disabled={!editContent.trim()}
          >
            <Check className="h-3 w-3 mr-1" />
            저장
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleCancel}
          >
            <X className="h-3 w-3 mr-1" />
            취소
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border px-2 py-1.5 group space-y-1">
      <div className="flex items-center justify-between gap-1">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 shrink-0 ${meta.badgeClass}`}
        >
          {meta.label}
        </Badge>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {note.updatedAt !== note.createdAt
            ? `수정 ${formatDate(note.updatedAt)}`
            : formatDate(note.createdAt)}
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleStartEdit}
            aria-label="메모 편집"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            className="text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleRemove}
            aria-label="메모 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p
        className="text-xs text-foreground whitespace-pre-wrap break-words cursor-pointer hover:text-muted-foreground transition-colors"
        onClick={handleStartEdit}
        title="클릭하여 편집"
      >
        {note.content}
      </p>
    </div>
  );
}

// ─── 메인 섹션 컴포넌트 ───────────────────────────────────────────────────

type ScheduleNotesSectionProps = {
  groupId: string;
  scheduleId: string;
};

export function ScheduleNotesSection({
  groupId,
  scheduleId,
}: ScheduleNotesSectionProps) {
  const { notes, loading, isMaxReached, maxCount, addNote, updateNote, removeNote } =
    useScheduleNotes(groupId, scheduleId);

  const [addOpen, setAddOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<ScheduleNoteCategory>("메모");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleOpenAdd = () => {
    setAddOpen(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleAdd = useCallback(() => {
    if (!newContent.trim()) {
      toast.error("메모 내용을 입력해주세요");
      return;
    }
    const ok = addNote(newContent, newCategory);
    if (ok) {
      toast.success("메모를 추가했습니다");
      setNewContent("");
      setNewCategory("메모");
      setAddOpen(false);
    } else {
      toast.error(`메모는 일정당 최대 ${maxCount}개까지 등록할 수 있습니다`);
    }
  }, [newContent, newCategory, addNote, maxCount]);

  const handleCancelAdd = () => {
    setAddOpen(false);
    setNewContent("");
    setNewCategory("메모");
  };

  const handleUpdate = useCallback(
    (id: string, content: string, category: ScheduleNoteCategory): boolean => {
      return updateNote(id, content, category);
    },
    [updateNote]
  );

  if (loading) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <StickyNote className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">일정 메모</span>
        </div>
        <div className="h-8 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <StickyNote className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">일정 메모</span>
          {notes.length > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 ml-0.5 bg-muted text-muted-foreground"
            >
              {notes.length}/{maxCount}
            </Badge>
          )}
        </div>
        {!isMaxReached && !addOpen && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2 gap-0.5"
            onClick={handleOpenAdd}
          >
            <Plus className="h-3 w-3" />
            메모 추가
          </Button>
        )}
      </div>

      {/* 메모 추가 폼 */}
      {addOpen && (
        <div className="rounded border p-2 space-y-2 bg-muted/30">
          <Select
            value={newCategory}
            onValueChange={(v) => setNewCategory(v as ScheduleNoteCategory)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        cat === "준비사항"
                          ? "bg-blue-500"
                          : cat === "변경사항"
                          ? "bg-orange-500"
                          : cat === "중요"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {CATEGORY_META[cat].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            ref={textareaRef}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleCancelAdd();
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAdd();
            }}
            placeholder="메모 내용을 입력하세요 (Ctrl+Enter로 저장)"
            className="text-xs resize-none min-h-[60px]"
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={handleAdd}
              disabled={!newContent.trim()}
            >
              <Check className="h-3 w-3 mr-1" />
              저장
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleCancelAdd}
            >
              <X className="h-3 w-3 mr-1" />
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 메모 목록 */}
      {notes.length > 0 && (
        <div className="space-y-1.5">
          {notes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              onUpdate={handleUpdate}
              onRemove={removeNote}
            />
          ))}
        </div>
      )}

      {/* 최대 개수 도달 안내 */}
      {isMaxReached && (
        <p className="text-[11px] text-muted-foreground">
          메모는 일정당 최대 {maxCount}개까지 등록할 수 있습니다
        </p>
      )}

      {/* 빈 상태 */}
      {notes.length === 0 && !addOpen && (
        <p className="text-[11px] text-muted-foreground">
          등록된 메모가 없습니다 — 메모 추가 버튼을 눌러 시작하세요
        </p>
      )}
    </div>
  );
}
