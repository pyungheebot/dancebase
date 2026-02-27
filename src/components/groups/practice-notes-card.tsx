"use client";

import { useState } from "react";
import {
  StickyNote,
  ChevronDown,
  ChevronUp,
  Plus,
  Heart,
  Trash2,
  Pin,
  Search,
  Music2,
  User,
  CalendarDays,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { usePracticeNotes } from "@/hooks/use-practice-notes";
import type { PracticeNoteTag, SharedPracticeNote } from "@/types";

// ─── 태그 메타 ───────────────────────────────────────────────

const TAG_META: Record<
  PracticeNoteTag,
  { emoji: string; label: string; bg: string; text: string; border: string }
> = {
  tip: {
    emoji: "💡",
    label: "팁",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  correction: {
    emoji: "✏️",
    label: "수정",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  idea: {
    emoji: "💭",
    label: "아이디어",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  reminder: {
    emoji: "📌",
    label: "리마인더",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  question: {
    emoji: "❓",
    label: "질문",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
};

const ALL_TAGS = Object.keys(TAG_META) as PracticeNoteTag[];

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

// ─── 노트 추가 다이얼로그 ─────────────────────────────────────

interface AddNoteDialogProps {
  hook: ReturnType<typeof usePracticeNotes>;
}

function AddNoteDialog({ hook }: AddNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [songTitle, setSongTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<PracticeNoteTag[]>([]);
  const [content, setContent] = useState("");

  const toggleTag = (tag: PracticeNoteTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (!authorName.trim()) {
      toast.error("작성자 이름을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("노트 내용을 입력해주세요.");
      return;
    }
    if (!sessionDate) {
      toast.error("세션 날짜를 선택해주세요.");
      return;
    }
    const ok = hook.addNote(
      authorName,
      content,
      selectedTags,
      sessionDate,
      songTitle
    );
    if (ok) {
      toast.success("연습 노트가 등록되었습니다.");
      setAuthorName("");
      setSessionDate(new Date().toISOString().slice(0, 10));
      setSongTitle("");
      setSelectedTags([]);
      setContent("");
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
            <StickyNote className="h-4 w-4 text-indigo-500" />
            연습 노트 작성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 작성자 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              작성자
            </label>
            <div className="relative">
              <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value.slice(0, 20))}
                placeholder="본인 이름"
                className="h-7 text-xs pl-6"
              />
            </div>
          </div>

          {/* 세션 날짜 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              세션 날짜
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="h-7 text-xs pl-6"
              />
            </div>
          </div>

          {/* 곡명 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              곡명 <span className="text-gray-400">(선택)</span>
            </label>
            <div className="relative">
              <Music2 className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value.slice(0, 40))}
                placeholder="예: Dynamite, Permission to Dance"
                className="h-7 text-xs pl-6"
              />
            </div>
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
                    {meta.emoji} {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              노트 내용
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="연습 중 메모한 내용을 공유해보세요."
              className="text-xs resize-none min-h-[80px]"
            />
            <p className="text-[10px] text-gray-400 text-right">
              {content.length}/500
            </p>
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

// ─── 노트 아이템 ──────────────────────────────────────────────

interface NoteItemProps {
  note: SharedPracticeNote;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

function NoteItem({ note, onLike, onDelete, onTogglePin }: NoteItemProps) {
  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-colors ${
        note.pinned
          ? "bg-amber-50 border-amber-200"
          : "bg-white border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* 헤더: 작성자 + 날짜 + 액션 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {note.pinned && (
            <Pin className="h-3 w-3 text-amber-500 shrink-0 fill-amber-500" />
          )}
          <span className="text-xs font-semibold text-gray-800 truncate">
            {note.authorName}
          </span>
          <span className="text-[10px] text-gray-400 shrink-0">
            {note.sessionDate}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onTogglePin(note.id)}
            className={`p-0.5 rounded transition-colors ${
              note.pinned
                ? "text-amber-500 hover:text-amber-600"
                : "text-gray-300 hover:text-amber-400"
            }`}
            title={note.pinned ? "고정 해제" : "상단 고정"}
          >
            <Pin className="h-3 w-3" />
          </button>
          <button
            onClick={() => onLike(note.id)}
            className="flex items-center gap-0.5 text-gray-400 hover:text-rose-500 transition-colors"
          >
            <Heart className="h-3 w-3" />
            <span className="text-[10px]">{note.likes}</span>
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 곡명 */}
      {note.songTitle && (
        <div className="flex items-center gap-1">
          <Music2 className="h-3 w-3 text-indigo-400 shrink-0" />
          <span className="text-[10px] text-indigo-600 font-medium truncate">
            {note.songTitle}
          </span>
        </div>
      )}

      {/* 내용 */}
      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
        {note.content}
      </p>

      {/* 태그 */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag) => {
            const meta = TAG_META[tag];
            return (
              <span
                key={tag}
                className={`text-[10px] px-1.5 py-0 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}
              >
                {meta.emoji} {meta.label}
              </span>
            );
          })}
        </div>
      )}

      {/* 등록 시각 */}
      <p className="text-[10px] text-gray-400">{formatDate(note.createdAt)}</p>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

export function PracticeNotesCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);
  const [activeTag, setActiveTag] = useState<PracticeNoteTag | "all">("all");
  const [activeSong, setActiveSong] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const hook = usePracticeNotes(groupId);

  // 표시할 노트 계산 (태그 + 곡명 + 검색 순서로 적용)
  const displayNotes = (() => {
    let result = hook.notes;

    // 태그 필터
    if (activeTag !== "all") {
      result = result.filter((n) => n.tags.includes(activeTag));
    }

    // 곡명 필터
    if (activeSong !== "all") {
      result = result.filter((n) => n.songTitle === activeSong);
    }

    // 검색
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (n) =>
          n.content.toLowerCase().includes(q) ||
          n.authorName.toLowerCase().includes(q) ||
          n.songTitle.toLowerCase().includes(q)
      );
    }

    // 고정 노트 상단 표시
    return [
      ...result.filter((n) => n.pinned),
      ...result.filter((n) => !n.pinned),
    ];
  })();

  const handleLike = (id: string) => {
    hook.likeNote(id);
  };

  const handleDelete = (id: string) => {
    const ok = hook.deleteNote(id);
    if (ok) toast.success("노트가 삭제되었습니다.");
    else toast.error("삭제에 실패했습니다.");
  };

  const handleTogglePin = (id: string) => {
    hook.togglePin(id);
  };

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-semibold text-gray-800">
                  연습 노트 공유
                </span>
                {/* 전체 노트 수 배지 */}
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-0">
                  {hook.totalNotes}개
                </Badge>
                {/* 고정 노트 수 배지 */}
                {hook.pinnedCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-0">
                    <Pin className="h-2.5 w-2.5 mr-0.5 inline" />
                    {hook.pinnedCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AddNoteDialog hook={hook} />
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
            {/* 최다 기여자 */}
            {hook.topContributor && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 rounded px-2 py-1">
                <User className="h-3 w-3 text-indigo-400" />
                <span>
                  최다 기여:{" "}
                  <span className="font-semibold text-indigo-600">
                    {hook.topContributor}
                  </span>
                </span>
              </div>
            )}

            {/* 검색 입력란 */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="노트 검색 (내용, 작성자, 곡명)"
                className="h-7 text-xs pl-7"
              />
            </div>

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
                    {meta.emoji} {meta.label}
                  </button>
                );
              })}
            </div>

            {/* 곡명 필터 드롭다운 */}
            {hook.uniqueSongs.length > 0 && (
              <Select value={activeSong} onValueChange={setActiveSong}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="곡명으로 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    전체 곡
                  </SelectItem>
                  {hook.uniqueSongs.map((song) => (
                    <SelectItem key={song} value={song} className="text-xs">
                      <span className="flex items-center gap-1">
                        <Music2 className="h-3 w-3 text-indigo-400" />
                        {song}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Separator />

            {/* 노트 목록 */}
            {displayNotes.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">
                  {hook.totalNotes === 0
                    ? "아직 연습 노트가 없습니다."
                    : "조건에 맞는 노트가 없습니다."}
                </p>
                {hook.totalNotes === 0 && (
                  <p className="text-[10px] mt-1">
                    연습 중 떠오른 팁이나 아이디어를 공유해보세요!
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {displayNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
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
