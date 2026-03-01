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
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Music,
  Clock,
  ArrowUp,
  ArrowDown,
  Star,
  Users,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import {
  usePerformanceSetlist,
  type ShowSetlistItemInput,
} from "@/hooks/use-performance-setlist";
import type { ShowSetlistItem } from "@/types";

// ============================================================
// 곡 추가/수정 다이얼로그
// ============================================================

interface SetlistItemDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Partial<ShowSetlistItemInput>;
  onClose: () => void;
  onSubmit: (data: ShowSetlistItemInput) => void;
}

function SetlistItemDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: SetlistItemDialogProps) {
  const [songTitle, setSongTitle] = useState(initial?.songTitle ?? "");
  const [artist, setArtist] = useState(initial?.artist ?? "");
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [transitionNote, setTransitionNote] = useState(
    initial?.transitionNote ?? ""
  );
  const [performers, setPerformers] = useState(
    (initial?.performers ?? []).join(", ")
  );
  const [isEncore, setIsEncore] = useState(initial?.isEncore ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = () => {
    if (!songTitle.trim()) {
      toast.error("곡 제목을 입력해주세요.");
      return;
    }
    const performerList = performers
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);

    onSubmit({
      songTitle: songTitle.trim(),
      artist: artist.trim() || null,
      genre: genre.trim() || null,
      duration: duration.trim() || null,
      transitionNote: transitionNote.trim() || null,
      performers: performerList,
      isEncore,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "곡 추가" : "곡 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 곡 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              곡 제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: Permission to Dance"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
            />
          </div>

          {/* 아티스트 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              아티스트 (선택)
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: BTS"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>

          {/* 장르 + 재생시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                장르 (선택)
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: K-POP"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                재생 시간 (선택)
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 3:45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {/* 담당 퍼포머 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              담당 퍼포머 (선택, 쉼표로 구분)
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 김민준, 이서연, 박지호"
              value={performers}
              onChange={(e) => setPerformers(e.target.value)}
            />
          </div>

          {/* 전환 메모 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              다음 곡 전환 메모 (선택)
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 암전 10초 후 입장, 의상 교체 2분"
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
            />
          </div>

          {/* 앙코르 여부 */}
          <div className="flex items-center gap-2">
            <input
              id="isEncore"
              type="checkbox"
              checked={isEncore}
              onChange={(e) => setIsEncore(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border"
            />
            <Label
              htmlFor="isEncore"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              앙코르 곡
            </Label>
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">비고 (선택)</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="특이사항, 주의사항 등 메모"
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
// 전환 메모 표시 행
// ============================================================

function TransitionRow({ note }: { note: string }) {
  return (
    <div className="flex items-center gap-2 py-1 px-3">
      <div className="h-px flex-1 bg-border" />
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 border border-border rounded-full px-2 py-0.5">
        <ArrowRight className="h-2.5 w-2.5 flex-shrink-0" />
        <span>{note}</span>
      </div>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ============================================================
// 개별 곡 행
// ============================================================

interface SongRowProps {
  item: ShowSetlistItem;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SongRow({
  item,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: SongRowProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-md border p-3 ${
        item.isEncore
          ? "bg-amber-50 border-amber-200"
          : "bg-white border-border"
      }`}
    >
      {/* 순서 번호 + 이동 버튼 */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        <span
          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
            item.isEncore
              ? "bg-amber-200 text-amber-800"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {item.order}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          disabled={isFirst}
          onClick={onMoveUp}
          aria-label="위로 이동"
        >
          <ArrowUp className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          disabled={isLast}
          onClick={onMoveDown}
          aria-label="아래로 이동"
        >
          <ArrowDown className="h-2.5 w-2.5" />
        </Button>
      </div>

      {/* 곡 정보 */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* 제목 + 앙코르 배지 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.isEncore && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-300 flex items-center gap-0.5"
            >
              <Star className="h-2.5 w-2.5" />
              앙코르
            </Badge>
          )}
          <span className="text-xs font-semibold truncate">
            {item.songTitle}
          </span>
        </div>

        {/* 아티스트 / 장르 / 시간 */}
        <div className="flex items-center gap-2 flex-wrap">
          {item.artist && (
            <span className="text-[10px] text-muted-foreground">
              {item.artist}
            </span>
          )}
          {item.genre && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-600 border-purple-200"
            >
              {item.genre}
            </Badge>
          )}
          {item.duration && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {item.duration}
            </span>
          )}
        </div>

        {/* 퍼포머 */}
        {item.performers.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
            <span className="text-[10px] text-muted-foreground">
              {item.performers.join(", ")}
            </span>
          </div>
        )}

        {/* 비고 */}
        {item.notes && (
          <div className="flex items-start gap-1">
            <MessageSquare className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground">{item.notes}</p>
          </div>
        )}
      </div>

      {/* 수정 / 삭제 */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onEdit}
          aria-label="곡 수정"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="곡 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface PerformanceSetlistCardProps {
  projectId: string;
}

export function PerformanceSetlistCard({
  projectId,
}: PerformanceSetlistCardProps) {
  const {
    setlistData,
    items,
    loading,
    totalItems,
    encoreCount,
    calculatedTotalDuration,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    setShowTitle,
  } = usePerformanceSetlist(projectId);

  const [isOpen, setIsOpen] = useState(false);

  // 공연 제목 인라인 편집
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  // 곡 다이얼로그
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingItem, setEditingItem] = useState<ShowSetlistItem | null>(null);

  // ── 핸들러 ─────────────────────────────────────────────────

  const handleTitleEditStart = () => {
    setTitleDraft(setlistData.showTitle);
    setEditingTitle(true);
  };

  const handleTitleSave = () => {
    const trimmed = titleDraft.trim();
    setShowTitle(trimmed);
    setEditingTitle(false);
    if (trimmed) toast.success("공연 제목이 저장되었습니다.");
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") setEditingTitle(false);
  };

  const handleAddOpen = () => {
    setEditingItem(null);
    setDialogMode("add");
    setDialogOpen(true);
  };

  const handleEditOpen = (item: ShowSetlistItem) => {
    setEditingItem(item);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDialogSubmit = (data: ShowSetlistItemInput) => {
    if (dialogMode === "add") {
      addItem(data);
      toast.success("곡이 추가되었습니다.");
    } else if (editingItem) {
      updateItem(editingItem.id, data);
      toast.success("곡 정보가 수정되었습니다.");
    }
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    toast.success("곡이 삭제되었습니다.");
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 세트리스트
                  </CardTitle>
                  {totalItems > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-600 border-purple-200"
                    >
                      {totalItems}곡
                    </Badge>
                  )}
                  {encoreCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-0.5"
                    >
                      <Star className="h-2.5 w-2.5" />
                      앙코르 {encoreCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {calculatedTotalDuration && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {calculatedTotalDuration}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 공연 제목 */}
                  <div className="flex items-center gap-2">
                    {editingTitle ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          className="h-7 text-xs flex-1"
                          value={titleDraft}
                          placeholder="공연 제목 입력"
                          onChange={(e) => setTitleDraft(e.target.value)}
                          onKeyDown={handleTitleKeyDown}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleTitleSave}
                        >
                          저장
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setEditingTitle(false)}
                        >
                          취소
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-1">
                        <span
                          className={`text-xs ${
                            setlistData.showTitle
                              ? "font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {setlistData.showTitle || "공연 제목 없음"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={handleTitleEditStart}
                          aria-label="공연 제목 수정"
                        >
                          <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-shrink-0"
                      onClick={handleAddOpen}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      곡 추가
                    </Button>
                  </div>

                  {/* 통계 요약 */}
                  {totalItems > 0 && (
                    <div className="flex items-center gap-2 flex-wrap bg-muted/40 rounded-md px-3 py-2">
                      <span className="text-[10px] text-muted-foreground">
                        총{" "}
                        <span className="font-semibold text-foreground">
                          {totalItems}
                        </span>
                        곡
                      </span>
                      {encoreCount > 0 && (
                        <>
                          <span className="text-[10px] text-muted-foreground">
                            ·
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            앙코르{" "}
                            <span className="font-semibold text-amber-600">
                              {encoreCount}
                            </span>
                            곡
                          </span>
                        </>
                      )}
                      {calculatedTotalDuration && (
                        <>
                          <span className="text-[10px] text-muted-foreground">
                            ·
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            총{" "}
                            <span className="font-semibold text-foreground ml-0.5">
                              {calculatedTotalDuration}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* 곡 목록 */}
                  {items.length > 0 ? (
                    <div className="space-y-0">
                      {items.map((item, idx) => (
                        <div key={item.id}>
                          <SongRow
                            item={item}
                            isFirst={idx === 0}
                            isLast={idx === items.length - 1}
                            onMoveUp={() => reorderItems(item.id, "up")}
                            onMoveDown={() => reorderItems(item.id, "down")}
                            onEdit={() => handleEditOpen(item)}
                            onDelete={() => handleDelete(item.id)}
                          />
                          {/* 전환 메모: 마지막 곡 제외, 전환 메모가 있을 때만 표시 */}
                          {idx < items.length - 1 && item.transitionNote && (
                            <TransitionRow note={item.transitionNote} />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Music}
                      title="세트리스트가 비어 있습니다"
                      description="공연 순서에 따라 곡을 추가하고 전환 타이밍을 관리하세요."
                      action={{ label: "첫 곡 추가", onClick: handleAddOpen }}
                    />
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 곡 추가/수정 다이얼로그 */}
      <SetlistItemDialog
        open={dialogOpen}
        mode={dialogMode}
        initial={
          editingItem
            ? {
                songTitle: editingItem.songTitle,
                artist: editingItem.artist,
                genre: editingItem.genre,
                duration: editingItem.duration,
                transitionNote: editingItem.transitionNote,
                performers: editingItem.performers,
                isEncore: editingItem.isEncore,
                notes: editingItem.notes,
              }
            : undefined
        }
        onClose={() => setDialogOpen(false)}
        onSubmit={handleDialogSubmit}
      />
    </>
  );
}
