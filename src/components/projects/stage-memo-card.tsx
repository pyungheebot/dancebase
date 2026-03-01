"use client";

import { useState } from "react";
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
  MapPin,
  CheckCircle2,
  Circle,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useStageMemo } from "@/hooks/use-stage-memo";
import type {
  StageMemoBoard,
  StageMemoNote,
  StageMemoZone,
  StageMemoPriority,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const ZONE_LABELS: Record<StageMemoZone, string> = {
  "upstage-left": "상수 좌",
  "upstage-center": "상수 중",
  "upstage-right": "상수 우",
  "center-left": "중앙 좌",
  center: "중앙",
  "center-right": "중앙 우",
  "downstage-left": "하수 좌",
  "downstage-center": "하수 중",
  "downstage-right": "하수 우",
};

// 3x3 그리드 순서 (행, 열)
const ZONE_GRID: StageMemoZone[][] = [
  ["upstage-left", "upstage-center", "upstage-right"],
  ["center-left", "center", "center-right"],
  ["downstage-left", "downstage-center", "downstage-right"],
];

const PRIORITY_LABELS: Record<StageMemoPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const PRIORITY_COLORS: Record<StageMemoPriority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
};

const PRIORITY_DOT_COLORS: Record<StageMemoPriority, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

type NoteFilter = "all" | "unresolved" | "high";

const FILTER_LABELS: Record<NoteFilter, string> = {
  all: "전체",
  unresolved: "미해결",
  high: "고우선",
};

// ============================================================
// 보드 생성 다이얼로그
// ============================================================

interface CreateBoardDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

function CreateBoardDialog({ open, onClose, onSubmit }: CreateBoardDialogProps) {
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
            <MapPin className="h-4 w-4 text-rose-500" />
            새 무대 메모 보드
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          <div className="space-y-1">
            <Label htmlFor="board-title" className="text-xs">
              보드 제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="board-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2026 봄 정기공연 무대"
              className="h-7 text-xs"
              autoFocus
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
              <Plus className="h-3 w-3 mr-1" />
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

interface AddNoteDialogProps {
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

function AddNoteDialog({
  open,
  onClose,
  defaultZone,
  onSubmit,
}: AddNoteDialogProps) {
  const [zone, setZone] = useState<StageMemoZone>(
    defaultZone ?? "center"
  );
  const [priority, setPriority] = useState<StageMemoPriority>("medium");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // defaultZone 변경 시 zone 동기화
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
    setContent("");
    setAuthor("");
    setTagsInput("");
    setPriority("medium");
    onClose();
  }

  function handleClose() {
    setContent("");
    setAuthor("");
    setTagsInput("");
    setPriority("medium");
    if (defaultZone) setZone(defaultZone);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4 text-rose-500" />
            메모 추가
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          {/* 구역 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">구역</Label>
            <Select
              value={zone}
              onValueChange={(v) => setZone(v as StageMemoZone)}
            >
              <SelectTrigger className="h-7 text-xs">
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
            <Label className="text-xs">우선순위</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as StageMemoPriority)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_LABELS) as StageMemoPriority[]).map(
                  (p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${PRIORITY_DOT_COLORS[p]}`}
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
              내용 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="메모 내용을 입력하세요..."
              className="text-xs resize-none min-h-[64px]"
              rows={3}
              autoFocus
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
            />
            {tagsInput.trim() && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {tagsInput
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t, i) => (
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
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 무대 그리드 셀
// ============================================================

interface StageZoneCellProps {
  zone: StageMemoZone;
  notes: StageMemoNote[];
  isSelected: boolean;
  onClick: () => void;
}

function StageZoneCell({ zone, notes, isSelected, onClick }: StageZoneCellProps) {
  const unresolvedCount = notes.filter((n) => !n.isResolved).length;
  const hasHighPriority = notes.some(
    (n) => n.priority === "high" && !n.isResolved
  );

  return (
    <button
      onClick={onClick}
      className={[
        "relative flex flex-col items-center justify-center rounded-md transition-all cursor-pointer select-none",
        "border text-[10px] font-medium py-2 px-1 min-h-[44px]",
        isSelected
          ? "bg-rose-50 border-rose-400 text-rose-700"
          : hasHighPriority
          ? "bg-red-50 border-red-400 text-red-700 hover:bg-red-100"
          : unresolvedCount > 0
          ? "bg-muted/40 border-muted-foreground/30 text-foreground hover:bg-muted/60"
          : "bg-background border-border/40 text-muted-foreground hover:bg-muted/20",
      ].join(" ")}
    >
      <span className="leading-tight text-center">{ZONE_LABELS[zone]}</span>
      {notes.length > 0 && (
        <span
          className={[
            "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center",
            hasHighPriority
              ? "bg-red-500 text-white"
              : "bg-rose-400 text-white",
          ].join(" ")}
        >
          {notes.length}
        </span>
      )}
    </button>
  );
}

// ============================================================
// 무대 그리드 (3x3)
// ============================================================

interface StageGridProps {
  notesByZone: Record<StageMemoZone, StageMemoNote[]>;
  selectedZone: StageMemoZone | null;
  onZoneClick: (zone: StageMemoZone) => void;
}

function StageGrid({ notesByZone, selectedZone, onZoneClick }: StageGridProps) {
  return (
    <div className="space-y-1.5">
      {/* 상수석 레이블 */}
      <div className="flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          상수석 (무대 뒤쪽)
        </span>
      </div>

      {/* 3x3 그리드 */}
      <div className="grid grid-cols-3 gap-1.5">
        {ZONE_GRID.flat().map((zone) => (
          <StageZoneCell
            key={zone}
            zone={zone}
            notes={notesByZone[zone] ?? []}
            isSelected={selectedZone === zone}
            onClick={() => onZoneClick(zone)}
          />
        ))}
      </div>

      {/* 하수석 레이블 */}
      <div className="flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          하수석 (관객 방향)
        </span>
      </div>
    </div>
  );
}

// ============================================================
// 메모 아이템
// ============================================================

interface NoteItemProps {
  note: StageMemoNote;
  onToggleResolved: () => void;
  onDelete: () => void;
}

function NoteItem({ note, onToggleResolved, onDelete }: NoteItemProps) {
  return (
    <div
      className={[
        "rounded-lg border px-3 py-2 space-y-1.5 transition-colors",
        note.isResolved
          ? "bg-muted/30 border-border/30 opacity-60"
          : note.priority === "high"
          ? "bg-red-50 border-red-200"
          : note.priority === "medium"
          ? "bg-yellow-50 border-yellow-200"
          : "bg-blue-50 border-blue-200",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        {/* 해결 토글 버튼 */}
        <button
          onClick={onToggleResolved}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title={note.isResolved ? "미해결로 변경" : "해결됨으로 표시"}
        >
          {note.isResolved ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
        </button>

        {/* 내용 */}
        <p
          className={[
            "text-xs flex-1 leading-relaxed",
            note.isResolved ? "line-through text-muted-foreground" : "",
          ].join(" ")}
        >
          {note.content}
        </p>

        {/* 삭제 버튼 */}
        <button
          onClick={onDelete}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
          title="메모 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* 메타 정보 */}
      <div className="flex flex-wrap items-center gap-1 pl-5">
        <Badge
          className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[note.priority]}`}
        >
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_DOT_COLORS[note.priority]}`}
          />
          {PRIORITY_LABELS[note.priority]}
        </Badge>

        {note.author && (
          <span className="text-[10px] text-muted-foreground">
            {note.author}
          </span>
        )}

        {note.tags.map((tag, i) => (
          <span
            key={i}
            className="text-[9px] px-1 py-0 rounded bg-muted/50 text-muted-foreground"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 보드 상세 뷰
// ============================================================

interface BoardDetailViewProps {
  board: StageMemoBoard;
  notesByZone: Record<StageMemoZone, StageMemoNote[]>;
  onBack: () => void;
  onAddNote: (zone?: StageMemoZone) => void;
  onToggleResolved: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

function BoardDetailView({
  board,
  notesByZone,
  onBack,
  onAddNote,
  onToggleResolved,
  onDeleteNote,
}: BoardDetailViewProps) {
  const [selectedZone, setSelectedZone] = useState<StageMemoZone | null>(null);
  const [noteFilter, setNoteFilter] = useState<NoteFilter>("all");

  // 선택 구역의 메모 (필터 적용)
  const zonalNotes = selectedZone ? (notesByZone[selectedZone] ?? []) : [];
  const filteredNotes = zonalNotes
    .filter((n) => {
      if (noteFilter === "unresolved") return !n.isResolved;
      if (noteFilter === "high") return n.priority === "high";
      return true;
    })
    .sort((a, b) => {
      // 우선순위 정렬: high → medium → low, 그 후 미해결 우선
      const priorityOrder: Record<StageMemoPriority, number> = {
        high: 0,
        medium: 1,
        low: 2,
      };
      if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  // 전체 통계
  const allNotes = board.notes;
  const unresolvedCount = allNotes.filter((n) => !n.isResolved).length;
  const highCount = allNotes.filter(
    (n) => n.priority === "high" && !n.isResolved
  ).length;

  function handleZoneClick(zone: StageMemoZone) {
    setSelectedZone((prev) => (prev === zone ? null : zone));
  }

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2 gap-1"
          onClick={onBack}
        >
          <ArrowLeft className="h-3 w-3" />
          목록
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{board.title}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {highCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
              {highCount}
            </Badge>
          )}
          {unresolvedCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700">
              미해결 {unresolvedCount}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => onAddNote(selectedZone ?? undefined)}
          >
            <Plus className="h-3 w-3 mr-1" />
            메모
          </Button>
        </div>
      </div>

      {/* 무대 그리드 */}
      <StageGrid
        notesByZone={notesByZone}
        selectedZone={selectedZone}
        onZoneClick={handleZoneClick}
      />

      {/* 선택된 구역 메모 목록 */}
      {selectedZone && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3 text-rose-500" />
              {ZONE_LABELS[selectedZone]} 메모
              <span className="text-muted-foreground font-normal ml-1">
                ({zonalNotes.length}개)
              </span>
            </p>
            {/* 필터 */}
            <div className="flex gap-1">
              {(Object.keys(FILTER_LABELS) as NoteFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setNoteFilter(f)}
                  className={[
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    noteFilter === f
                      ? "bg-rose-500 text-white border-rose-500"
                      : "border-border/50 text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <MapPin className="h-6 w-6 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                {noteFilter === "all"
                  ? "이 구역에 메모가 없습니다."
                  : `${FILTER_LABELS[noteFilter]} 메모가 없습니다.`}
              </p>
              {noteFilter === "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onAddNote(selectedZone)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  첫 번째 메모 추가
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onToggleResolved={() => onToggleResolved(note.id)}
                  onDelete={() => onDeleteNote(note.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 구역 미선택 안내 */}
      {!selectedZone && (
        <p className="text-xs text-muted-foreground text-center py-2">
          구역을 클릭하여 메모를 확인하거나 추가하세요.
        </p>
      )}
    </div>
  );
}

// ============================================================
// 보드 목록 아이템
// ============================================================

interface BoardListItemProps {
  board: StageMemoBoard;
  onOpen: () => void;
  onDelete: () => void;
}

function BoardListItem({ board, onOpen, onDelete }: BoardListItemProps) {
  const unresolvedCount = board.notes.filter((n) => !n.isResolved).length;
  const highCount = board.notes.filter(
    (n) => n.priority === "high" && !n.isResolved
  ).length;

  return (
    <div className="border border-border/50 rounded-lg p-3 bg-background hover:border-rose-300 transition-colors group cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0" onClick={onOpen}>
          <p className="text-xs font-medium truncate">{board.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            메모 {board.notes.length}개
            {unresolvedCount > 0 && ` · 미해결 ${unresolvedCount}개`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {highCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
              {highCount}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="보드 삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 메인 카드
// ============================================================

interface StageMemoCardProps {
  groupId: string;
  projectId: string;
}

export function StageMemoCard({ groupId, projectId }: StageMemoCardProps) {
  const [cardOpen, setCardOpen] = useState(true);
  const [showCreateBoardDialog, setShowCreateBoardDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [addNoteDefaultZone, setAddNoteDefaultZone] = useState<
    StageMemoZone | undefined
  >(undefined);

  const {
    boards,
    loading,
    addBoard,
    deleteBoard,
    addNote,
    deleteNote,
    toggleResolved,
    getNotesByZone,
    stats,
  } = useStageMemo(groupId, projectId);

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? null;
  const notesByZone = selectedBoardId
    ? getNotesByZone(selectedBoardId)
    : ({} as Record<StageMemoZone, StageMemoNote[]>);

  function handleDeleteBoard(boardId: string) {
    deleteBoard(boardId);
    if (selectedBoardId === boardId) setSelectedBoardId(null);
    toast.success(TOAST.STAGE_MEMO.BOARD_DELETED);
  }

  function handleAddNoteClick(zone?: StageMemoZone) {
    setAddNoteDefaultZone(zone);
    setShowAddNoteDialog(true);
  }

  return (
    <>
      <Card className="shadow-sm">
        <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
          <CardHeader className="py-2 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 무대 메모
                  </CardTitle>
                  {stats.totalNotes > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700">
                      {stats.totalNotes}개
                    </Badge>
                  )}
                  {stats.unresolvedNotes > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700">
                      미해결 {stats.unresolvedNotes}
                    </Badge>
                  )}
                  {stats.highPriorityNotes > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {stats.highPriorityNotes}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreateBoardDialog(true);
                      if (!cardOpen) setCardOpen(true);
                    }}
                    title="보드 만들기"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  {cardOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">불러오는 중...</p>
                </div>
              ) : selectedBoard ? (
                // 보드 상세 뷰
                <BoardDetailView
                  board={selectedBoard}
                  notesByZone={notesByZone}
                  onBack={() => setSelectedBoardId(null)}
                  onAddNote={handleAddNoteClick}
                  onToggleResolved={(noteId) => {
                    toggleResolved(selectedBoard.id, noteId);
                  }}
                  onDeleteNote={(noteId) => {
                    deleteNote(selectedBoard.id, noteId);
                    toast.success(TOAST.STAGE_MEMO.MEMO_DELETED);
                  }}
                />
              ) : boards.length === 0 ? (
                // 빈 상태
                <div className="text-center py-6 space-y-2">
                  <MapPin className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    아직 무대 메모 보드가 없습니다.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowCreateBoardDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    첫 번째 보드 만들기
                  </Button>
                </div>
              ) : (
                // 보드 목록
                <div className="space-y-2">
                  {boards.map((board) => (
                    <BoardListItem
                      key={board.id}
                      board={board}
                      onOpen={() => setSelectedBoardId(board.id)}
                      onDelete={() => handleDeleteBoard(board.id)}
                    />
                  ))}
                  <button
                    className="w-full border border-dashed border-border/50 rounded-lg py-3 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-rose-500 hover:border-rose-300 transition-colors"
                    onClick={() => setShowCreateBoardDialog(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs">새 보드 추가</span>
                  </button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 보드 생성 다이얼로그 */}
      <CreateBoardDialog
        open={showCreateBoardDialog}
        onClose={() => setShowCreateBoardDialog(false)}
        onSubmit={(title) => {
          const board = addBoard(title);
          toast.success(TOAST.STAGE_MEMO.BOARD_CREATED);
          setSelectedBoardId(board.id);
        }}
      />

      {/* 메모 추가 다이얼로그 */}
      <AddNoteDialog
        open={showAddNoteDialog}
        onClose={() => setShowAddNoteDialog(false)}
        defaultZone={addNoteDefaultZone}
        onSubmit={(zone, priority, content, author, tags) => {
          if (!selectedBoardId) return;
          addNote(selectedBoardId, { zone, priority, content, author, tags });
          toast.success(TOAST.STAGE_MEMO.MEMO_ADDED);
        }}
      />
    </>
  );
}
