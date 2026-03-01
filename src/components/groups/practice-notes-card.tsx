"use client";

import { useState } from "react";
import {
  NotebookPen,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pin,
  MessageCircle,
  Send,
  ChevronRight,
  CalendarDays,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePracticeNotes } from "@/hooks/use-practice-notes";
import type { PracticeNoteTag, PracticeNoteEntry } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";

// ─── 태그 메타 ───────────────────────────────────────────────

const TAG_META: Record<
  PracticeNoteTag,
  { label: string; bg: string; text: string; border: string }
> = {
  improvement: {
    label: "개선",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  issue: {
    label: "이슈",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  achievement: {
    label: "성과",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  reminder: {
    label: "리마인더",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  technique: {
    label: "기술",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  general: {
    label: "일반",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

const ALL_TAGS = Object.keys(TAG_META) as PracticeNoteTag[];

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────

// ─── 노트 추가 다이얼로그 ─────────────────────────────────────

interface AddNoteDialogProps {
  hook: ReturnType<typeof usePracticeNotes>;
  currentMemberName?: string;
}

function AddNoteDialog({ hook, currentMemberName }: AddNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState(currentMemberName ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<PracticeNoteTag[]>([]);

  const toggleTag = (tag: PracticeNoteTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (!author.trim()) {
      toast.error("작성자 이름을 입력해주세요.");
      return;
    }
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    const ok = hook.addNote({ author, date, title, content, tags: selectedTags });
    if (ok) {
      toast.success("연습 노트가 등록되었습니다.");
      setAuthor(currentMemberName ?? "");
      setDate(new Date().toISOString().slice(0, 10));
      setTitle("");
      setContent("");
      setSelectedTags([]);
      setOpen(false);
    } else {
      toast.error("노트 등록에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs bg-indigo-500 hover:bg-indigo-600">
          <Plus className="mr-1 h-3 w-3" />
          노트 추가
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <NotebookPen className="h-4 w-4 text-indigo-500" />
            연습 노트 작성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 작성자 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">작성자</label>
            <div className="relative">
              <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value.slice(0, 20))}
                placeholder="본인 이름"
                className="h-7 text-xs pl-6"
              />
            </div>
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">날짜</label>
            <div className="relative">
              <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-7 text-xs pl-6"
              />
            </div>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">제목</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="노트 제목을 입력하세요"
              className="h-7 text-xs"
            />
          </div>

          {/* 태그 다중선택 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              태그 <span className="text-gray-400">(복수 선택 가능)</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {ALL_TAGS.map((tag) => {
                const meta = TAG_META[tag];
                const selected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      selected
                        ? `${meta.bg} ${meta.text} ${meta.border} font-semibold`
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">내용</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 1000))}
              placeholder="연습 내용, 개선점, 성과 등을 자유롭게 기록하세요."
              className="text-xs resize-none min-h-[80px]"
            />
            <p className="text-[10px] text-gray-400 text-right">{content.length}/1000</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs bg-indigo-500 hover:bg-indigo-600"
            onClick={handleSubmit}
          >
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 코멘트 스레드 ───────────────────────────────────────────

interface CommentThreadProps {
  note: PracticeNoteEntry;
  currentMemberName?: string;
  onAddComment: (noteId: string, author: string, content: string) => boolean;
  onDeleteComment: (noteId: string, commentId: string) => void;
}

function CommentThread({
  note,
  currentMemberName,
  onAddComment,
  onDeleteComment,
}: CommentThreadProps) {
  const [commentAuthor, setCommentAuthor] = useState(currentMemberName ?? "");
  const [commentContent, setCommentContent] = useState("");

  const handleAddComment = () => {
    if (!commentAuthor.trim()) {
      toast.error("코멘트 작성자 이름을 입력해주세요.");
      return;
    }
    if (!commentContent.trim()) {
      toast.error("코멘트 내용을 입력해주세요.");
      return;
    }
    const ok = onAddComment(note.id, commentAuthor, commentContent);
    if (ok !== false) {
      setCommentContent("");
      toast.success("코멘트가 등록되었습니다.");
    } else {
      toast.error("코멘트 등록에 실패했습니다.");
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {/* 기존 코멘트 목록 */}
      {note.comments.length > 0 && (
        <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
          {note.comments.map((comment) => (
            <div key={comment.id} className="group flex items-start gap-1.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-gray-700">
                    {comment.author}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatMonthDay(comment.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {comment.content}
                </p>
              </div>
              <button
                onClick={() => onDeleteComment(note.id, comment.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0 mt-0.5"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 코멘트 입력 */}
      <div className="flex gap-1">
        {!currentMemberName && (
          <Input
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value.slice(0, 20))}
            placeholder="이름"
            className="h-6 text-[10px] w-20 shrink-0"
          />
        )}
        <Input
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value.slice(0, 200))}
          placeholder="코멘트를 입력하세요..."
          className="h-6 text-[10px] flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 shrink-0"
          onClick={handleAddComment}
        >
          <Send className="h-3 w-3 text-indigo-500" />
        </Button>
      </div>
    </div>
  );
}

// ─── 노트 아이템 ──────────────────────────────────────────────

interface NoteItemProps {
  note: PracticeNoteEntry;
  currentMemberName?: string;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onAddComment: (noteId: string, author: string, content: string) => boolean;
  onDeleteComment: (noteId: string, commentId: string) => void;
}

function NoteItem({
  note,
  currentMemberName,
  onDelete,
  onTogglePin,
  onAddComment,
  onDeleteComment,
}: NoteItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-colors ${
        note.isPinned
          ? "bg-amber-50 border-amber-200"
          : "bg-white border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* 헤더: 핀 + 제목 + 날짜 + 액션 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          {note.isPinned && (
            <Pin className="h-3 w-3 text-amber-500 shrink-0 fill-amber-500 mt-0.5" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-gray-800 truncate">
                {note.title}
              </span>
              <span className="text-[10px] text-gray-400 shrink-0">{note.date}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <User className="h-2.5 w-2.5 text-gray-400" />
              <span className="text-[10px] text-gray-500">{note.author}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onTogglePin(note.id)}
            className={`p-0.5 rounded transition-colors ${
              note.isPinned
                ? "text-amber-500 hover:text-amber-600"
                : "text-gray-300 hover:text-amber-400"
            }`}
            title={note.isPinned ? "고정 해제" : "상단 고정"}
          >
            <Pin className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 태그 배지 */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag) => {
            const meta = TAG_META[tag];
            return (
              <span
                key={tag}
                className={`text-[10px] px-1.5 py-0 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}
              >
                {meta.label}
              </span>
            );
          })}
        </div>
      )}

      {/* 내용 + 상세 토글 */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <button
            className="flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
            {expanded ? "접기" : `내용 보기 · 코멘트 ${note.comments.length}개`}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2">
            {/* 본문 */}
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded p-2">
              {note.content}
            </p>

            {/* 코멘트 스레드 */}
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <MessageCircle className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-500">
                  코멘트 {note.comments.length}개
                </span>
              </div>
              <CommentThread
                note={note}
                currentMemberName={currentMemberName}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 등록 시각 */}
      <p className="text-[10px] text-gray-400">{formatMonthDay(note.createdAt)}</p>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

export function PracticeNotesCard({
  groupId,
  currentMemberName,
}: {
  groupId: string;
  currentMemberName?: string;
}) {
  const [open, setOpen] = useState(true);
  const [activeTag, setActiveTag] = useState<PracticeNoteTag | "all">("all");

  const hook = usePracticeNotes(groupId);

  // 표시할 노트 (태그 필터 + 고정 상단)
  const displayNotes = (() => {
    let result = hook.notes;
    if (activeTag !== "all") {
      result = hook.getByTag(activeTag);
    }
    return [
      ...result.filter((n) => n.isPinned),
      ...result.filter((n) => !n.isPinned),
    ];
  })();

  const handleDelete = (id: string) => {
    const ok = hook.deleteNote(id);
    if (ok) toast.success("노트가 삭제되었습니다.");
    else toast.error(TOAST.DELETE_ERROR);
  };

  const handleTogglePin = (id: string) => {
    hook.togglePin(id);
  };

  const handleAddComment = (noteId: string, author: string, content: string) => {
    return hook.addComment(noteId, author, content);
  };

  const handleDeleteComment = (noteId: string, commentId: string) => {
    const ok = hook.deleteComment(noteId, commentId);
    if (ok) toast.success("코멘트가 삭제되었습니다.");
    else toast.error(TOAST.DELETE_ERROR);
  };

  const { totalNotes, pinnedNotes, totalComments } = hook.stats;

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-semibold text-gray-800">
                  그룹 연습 노트
                </span>
                {/* 전체 노트 수 */}
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-0">
                  {totalNotes}개
                </Badge>
                {/* 고정 노트 수 */}
                {pinnedNotes > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-0">
                    <Pin className="h-2.5 w-2.5 mr-0.5 inline" />
                    {pinnedNotes}
                  </Badge>
                )}
                {/* 코멘트 수 */}
                {totalComments > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-0">
                    <MessageCircle className="h-2.5 w-2.5 mr-0.5 inline" />
                    {totalComments}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AddNoteDialog hook={hook} currentMemberName={currentMemberName} />
                {open ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* 태그 필터 */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveTag("all")}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  activeTag === "all"
                    ? "bg-indigo-100 text-indigo-700 border-indigo-200 font-semibold"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                전체
              </button>
              {ALL_TAGS.map((tag) => {
                const meta = TAG_META[tag];
                const isActive = activeTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(isActive ? "all" : tag)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      isActive
                        ? `${meta.bg} ${meta.text} ${meta.border} font-semibold`
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <Separator />

            {/* 노트 목록 */}
            {displayNotes.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <NotebookPen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">
                  {totalNotes === 0
                    ? "아직 연습 노트가 없습니다."
                    : "조건에 맞는 노트가 없습니다."}
                </p>
                {totalNotes === 0 && (
                  <p className="text-[10px] mt-1">
                    연습 후 배운 점이나 개선사항을 기록해보세요!
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {displayNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    currentMemberName={currentMemberName}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
