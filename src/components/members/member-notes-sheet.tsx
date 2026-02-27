"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { StickyNote, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useMemberNotes } from "@/hooks/use-member-notes";
import type { MemberNoteCategory, MemberNoteV2 } from "@/types";

// ============================================
// 카테고리 메타
// ============================================

const CATEGORY_META: Record<
  MemberNoteCategory,
  { label: string; className: string }
> = {
  general: {
    label: "일반",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  attendance: {
    label: "출석",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  skill: {
    label: "실력",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  attitude: {
    label: "태도",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

const CATEGORY_OPTIONS: MemberNoteCategory[] = [
  "general",
  "attendance",
  "skill",
  "attitude",
];

// ============================================
// 날짜 포맷
// ============================================

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ============================================
// 메모 항목 컴포넌트
// ============================================

type NoteItemProps = {
  note: MemberNoteV2;
  onUpdate: (noteId: string, content: string, category: MemberNoteCategory) => void;
  onDelete: (noteId: string) => void;
};

function NoteItem({ note, onUpdate, onDelete }: NoteItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [draftCategory, setDraftCategory] = useState<MemberNoteCategory>(note.category);

  const meta = CATEGORY_META[note.category];

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("메모 내용을 입력해주세요");
      return;
    }
    onUpdate(note.id, trimmed, draftCategory);
    setEditing(false);
    toast.success("메모가 수정되었습니다");
  };

  const handleCancel = () => {
    setDraft(note.content);
    setDraftCategory(note.category);
    setEditing(false);
  };

  const handleDelete = () => {
    onDelete(note.id);
    toast.success("메모가 삭제되었습니다");
  };

  if (editing) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <Select
          value={draftCategory}
          onValueChange={(v) => setDraftCategory(v as MemberNoteCategory)}
        >
          <SelectTrigger className="h-7 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {CATEGORY_META[cat].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="text-xs resize-none min-h-[72px]"
          maxLength={500}
          autoFocus
        />
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={handleCancel}
          >
            <X className="h-3 w-3 mr-1" />
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs px-2"
            onClick={handleSave}
            disabled={!draft.trim()}
          >
            <Check className="h-3 w-3 mr-1" />
            저장
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-1.5 group">
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${meta.className}`}
        >
          {meta.label}
        </Badge>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setEditing(true)}
            aria-label="메모 수정"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleDelete}
            aria-label="메모 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-all">
        {note.content}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {formatDate(note.updatedAt)}
      </p>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type MemberNotesSheetProps = {
  groupId: string;
  writerId: string;
  targetUserId: string;
  targetName: string;
};

export function MemberNotesSheet({
  groupId,
  writerId,
  targetUserId,
  targetName,
}: MemberNotesSheetProps) {
  const { loading, addNote, updateNote, deleteNote, getNotesByCategory } =
    useMemberNotes(groupId, writerId);

  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<MemberNoteCategory | "all">("all");

  // 작성 폼 상태
  const [composing, setComposing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemberNoteCategory>("general");

  const filteredNotes = getNotesByCategory(targetUserId, categoryFilter);
  const allTargetNotes = getNotesByCategory(targetUserId, "all");
  const noteCount = allTargetNotes.length;

  const handleAdd = () => {
    const trimmed = newContent.trim();
    if (!trimmed) {
      toast.error("메모 내용을 입력해주세요");
      return;
    }
    addNote(targetUserId, trimmed, newCategory);
    setNewContent("");
    setNewCategory("general");
    setComposing(false);
    toast.success("메모가 추가되었습니다");
  };

  const handleCancelCompose = () => {
    setNewContent("");
    setNewCategory("general");
    setComposing(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2 gap-1"
        >
          <StickyNote className="h-3 w-3" />
          메모
          {noteCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1 py-0 min-w-[16px] h-4 flex items-center justify-center"
            >
              {noteCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col gap-0 p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle className="text-sm flex items-center gap-1.5">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            {targetName} 메모
          </SheetTitle>
          <p className="text-[11px] text-muted-foreground">
            이 메모는 본인에게만 보입니다.
          </p>
        </SheetHeader>

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b flex-wrap">
          {(["all", ...CATEGORY_OPTIONS] as const).map((cat) => {
            const isSelected = categoryFilter === cat;
            const count =
              cat === "all"
                ? allTargetNotes.length
                : allTargetNotes.filter((n) => n.category === cat).length;
            const label = cat === "all" ? "전체" : CATEGORY_META[cat].label;

            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  isSelected
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className="ml-1 opacity-70">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 메모 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              불러오는 중...
            </p>
          ) : filteredNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {categoryFilter === "all"
                ? "아직 작성한 메모가 없습니다."
                : `${CATEGORY_META[categoryFilter].label} 카테고리 메모가 없습니다.`}
            </p>
          ) : (
            filteredNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onUpdate={updateNote}
                onDelete={deleteNote}
              />
            ))
          )}
        </div>

        {/* 메모 작성 영역 */}
        <div className="border-t px-4 py-3 space-y-2">
          {composing ? (
            <>
              <div className="flex items-center gap-2">
                <Select
                  value={newCategory}
                  onValueChange={(v) => setNewCategory(v as MemberNoteCategory)}
                >
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {CATEGORY_META[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {newContent.length}/500
                </span>
              </div>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="메모 내용을 입력하세요..."
                className="text-xs resize-none min-h-[80px]"
                maxLength={500}
                autoFocus
              />
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={handleCancelCompose}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={handleAdd}
                  disabled={!newContent.trim()}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => setComposing(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              메모 추가
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
