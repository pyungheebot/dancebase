"use client";

import { useState } from "react";
import {
  Music,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMusicCuesheet } from "@/hooks/use-music-cuesheet";
import type { CueAction, CueEntry, MusicCuesheet } from "@/types";

// ============================================
// 상수: 액션 메타데이터
// ============================================

const ACTION_META: Record<
  CueAction,
  { label: string; badgeClass: string }
> = {
  play: {
    label: "재생",
    badgeClass: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  fade_in: {
    label: "페이드인",
    badgeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  fade_out: {
    label: "페이드아웃",
    badgeClass: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  stop: {
    label: "정지",
    badgeClass: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  transition: {
    label: "전환",
    badgeClass: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
};

// ============================================
// 유틸리티
// ============================================

function isValidTime(value: string): boolean {
  if (!value.trim()) return true;
  return /^\d{1,2}:\d{2}$/.test(value.trim());
}

// ============================================
// 큐 항목 추가 폼 기본값
// ============================================

const DEFAULT_CUE_FORM = {
  songTitle: "",
  artist: "",
  startTime: "",
  duration: "",
  action: "play" as CueAction,
  volume: 80,
  note: "",
};

// ============================================
// 서브 컴포넌트: 큐시트 생성 다이얼로그
// ============================================

interface CreateCuesheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string) => void;
}

function CreateCuesheetDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateCuesheetDialogProps) {
  const [title, setTitle] = useState("");

  function reset() {
    setTitle("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimTitle = title.trim();
    if (!trimTitle) {
      toast.error(TOAST.MUSIC_CUESHEET.TITLE_REQUIRED);
      return;
    }
    onCreate(trimTitle);
    reset();
    onOpenChange(false);
    toast.success(TOAST.MUSIC_CUESHEET.CREATED);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">큐시트 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">큐시트 제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 정기공연 큐시트"
              className="h-8 text-xs"
              autoFocus
              maxLength={100}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 서브 컴포넌트: 볼륨 바
// ============================================

function VolumeBar({ volume }: { volume: number }) {
  const pct = Math.max(0, Math.min(100, volume));
  return (
    <div className="flex items-center gap-1">
      <Volume2 className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-400 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground w-7 text-right">
        {pct}%
      </span>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 큐 항목 행
// ============================================

interface CueEntryRowProps {
  entry: CueEntry;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function CueEntryRow({
  entry,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: CueEntryRowProps) {
  const actionMeta = ACTION_META[entry.action];

  return (
    <div className="flex items-start gap-2 py-2 px-2 rounded-lg border border-gray-100 bg-card hover:bg-muted/30 transition-colors group">
      {/* 순서 번호 */}
      <span className="w-5 text-center text-[10px] font-mono text-muted-foreground flex-shrink-0 mt-0.5">
        {String(entry.order).padStart(2, "0")}
      </span>

      {/* 곡 정보 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate max-w-[100px]">
            {entry.songTitle}
          </span>
          {entry.artist && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
              {entry.artist}
            </span>
          )}
          <Badge
            className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${actionMeta.badgeClass}`}
          >
            {actionMeta.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {entry.startTime && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {entry.startTime}
            </span>
          )}
          {entry.duration && (
            <span className="text-[10px] text-muted-foreground">
              {entry.duration}
            </span>
          )}
          <VolumeBar volume={entry.volume} />
        </div>

        {entry.note && (
          <p className="text-[10px] text-muted-foreground truncate">
            {entry.note}
          </p>
        )}
      </div>

      {/* 위/아래 이동 버튼 */}
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onMoveUp}
          disabled={isFirst}
          title="위로 이동"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onMoveDown}
          disabled={isLast}
          title="아래로 이동"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* 삭제 버튼 */}
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive flex-shrink-0"
        onClick={onRemove}
        title="큐 항목 삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 큐 항목 추가 폼
// ============================================

interface AddCueFormProps {
  onAdd: (entry: Omit<CueEntry, "id" | "order">) => void;
  onCancel: () => void;
}

function AddCueForm({ onAdd, onCancel }: AddCueFormProps) {
  const [form, setForm] = useState(DEFAULT_CUE_FORM);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimTitle = form.songTitle.trim();
    if (!trimTitle) {
      toast.error(TOAST.MUSIC_CUESHEET.SONG_NAME_REQUIRED);
      return;
    }
    if (form.startTime && !isValidTime(form.startTime)) {
      toast.error('시작 시간은 "분:초" 형식으로 입력해주세요. (예: 02:30)');
      return;
    }
    if (form.duration && !isValidTime(form.duration)) {
      toast.error('재생 시간은 "분:초" 형식으로 입력해주세요. (예: 03:45)');
      return;
    }
    const vol = Math.max(0, Math.min(100, Number(form.volume)));
    onAdd({
      songTitle: trimTitle,
      artist: form.artist.trim(),
      startTime: form.startTime.trim(),
      duration: form.duration.trim(),
      action: form.action,
      volume: isNaN(vol) ? 80 : vol,
      note: form.note.trim(),
    });
    setForm(DEFAULT_CUE_FORM);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-dashed border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50"
    >
      <p className="text-xs font-medium text-gray-700">큐 항목 추가</p>

      {/* 곡명 + 아티스트 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">곡명 *</Label>
          <Input
            value={form.songTitle}
            onChange={(e) =>
              setForm((f) => ({ ...f, songTitle: e.target.value }))
            }
            placeholder="곡명 입력"
            className="h-7 text-xs"
            maxLength={100}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">아티스트</Label>
          <Input
            value={form.artist}
            onChange={(e) =>
              setForm((f) => ({ ...f, artist: e.target.value }))
            }
            placeholder="아티스트명"
            className="h-7 text-xs"
            maxLength={100}
          />
        </div>
      </div>

      {/* 시작 시간 + 재생 시간 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">시작 시간</Label>
          <Input
            value={form.startTime}
            onChange={(e) =>
              setForm((f) => ({ ...f, startTime: e.target.value }))
            }
            placeholder="예: 02:30"
            className="h-7 text-xs"
            maxLength={7}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">재생 시간</Label>
          <Input
            value={form.duration}
            onChange={(e) =>
              setForm((f) => ({ ...f, duration: e.target.value }))
            }
            placeholder="예: 03:45"
            className="h-7 text-xs"
            maxLength={7}
          />
        </div>
      </div>

      {/* 액션 선택 */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">액션</Label>
        <Select
          value={form.action}
          onValueChange={(val) =>
            setForm((f) => ({ ...f, action: val as CueAction }))
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(ACTION_META) as [CueAction, { label: string; badgeClass: string }][]).map(
              ([action, meta]) => (
                <SelectItem key={action} value={action} className="text-xs">
                  {meta.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 볼륨 슬라이더 */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">
          볼륨{" "}
          <span className="text-indigo-600 font-medium">{form.volume}%</span>
        </Label>
        <input
          type="range"
          min={0}
          max={100}
          value={form.volume}
          onChange={(e) =>
            setForm((f) => ({ ...f, volume: Number(e.target.value) }))
          }
          className="w-full h-1.5 accent-indigo-500"
        />
      </div>

      {/* 메모 */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">메모</Label>
        <Input
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          placeholder="특이사항 메모"
          className="h-7 text-xs"
          maxLength={200}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="h-7 text-xs flex-1">
          추가
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

// ============================================
// 서브 컴포넌트: 단일 큐시트 패널
// ============================================

interface CuesheetPanelProps {
  cuesheet: MusicCuesheet;
  onDelete: (id: string) => void;
  onAddCue: (cuesheetId: string, entry: Omit<CueEntry, "id" | "order">) => void;
  onRemoveCue: (cuesheetId: string, cueId: string) => void;
  onReorderCue: (cuesheetId: string, cueId: string, newOrder: number) => void;
}

function CuesheetPanel({
  cuesheet,
  onDelete,
  onAddCue,
  onRemoveCue,
  onReorderCue,
}: CuesheetPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const sortedEntries = [...cuesheet.entries].sort((a, b) => a.order - b.order);

  function handleAddCue(entry: Omit<CueEntry, "id" | "order">) {
    onAddCue(cuesheet.id, entry);
    setShowAddForm(false);
    toast.success(TOAST.MUSIC_CUESHEET.ITEM_ADDED);
  }

  function handleRemoveCue(cueId: string, songTitle: string) {
    onRemoveCue(cuesheet.id, cueId);
    toast.success(`"${songTitle}" 항목이 삭제되었습니다.`);
  }

  function handleMoveUp(entry: CueEntry) {
    onReorderCue(cuesheet.id, entry.id, entry.order - 1);
  }

  function handleMoveDown(entry: CueEntry) {
    onReorderCue(cuesheet.id, entry.id, entry.order + 1);
  }

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        {/* 큐시트 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <CollapsibleTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 flex-shrink-0"
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <span className="text-xs font-medium truncate">
              {cuesheet.title}
            </span>
            {cuesheet.entries.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 flex-shrink-0">
                {cuesheet.entries.length}개
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {cuesheet.totalDuration && cuesheet.totalDuration !== "00:00" && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {cuesheet.totalDuration}
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(cuesheet.id);
                toast.success(`"${cuesheet.title}" 큐시트가 삭제되었습니다.`);
              }}
              title="큐시트 삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 큐시트 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 space-y-2">
            {sortedEntries.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                큐 항목이 없습니다.
              </div>
            ) : (
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  {sortedEntries.map((entry, idx) => (
                    <CueEntryRow
                      key={entry.id}
                      entry={entry}
                      isFirst={idx === 0}
                      isLast={idx === sortedEntries.length - 1}
                      onMoveUp={() => handleMoveUp(entry)}
                      onMoveDown={() => handleMoveDown(entry)}
                      onRemove={() =>
                        handleRemoveCue(entry.id, entry.songTitle)
                      }
                    />
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* 큐 항목 추가 폼 */}
            {showAddForm ? (
              <AddCueForm
                onAdd={handleAddCue}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full border-dashed"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                큐 항목 추가
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface MusicCuesheetCardProps {
  groupId: string;
  projectId: string;
}

export function MusicCuesheetCard({
  groupId,
  projectId,
}: MusicCuesheetCardProps) {
  const {
    cuesheets,
    totalCuesheets,
    addCuesheet,
    deleteCuesheet,
    addCue,
    removeCue,
    reorderCue,
  } = useMusicCuesheet(groupId, projectId);

  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="border rounded-lg bg-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm font-medium">음악 큐시트</span>
            {totalCuesheets > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                {totalCuesheets}개
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 px-2"
              onClick={(e) => {
                e.stopPropagation();
                setCreateDialogOpen(true);
              }}
              title="큐시트 생성"
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">큐시트 추가</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 펼쳐지는 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t">
            {totalCuesheets === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <Music className="h-7 w-7 opacity-30" />
                <p className="text-xs">아직 큐시트가 없습니다.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 큐시트 만들기
                </Button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {cuesheets.map((cs) => (
                  <CuesheetPanel
                    key={cs.id}
                    cuesheet={cs}
                    onDelete={deleteCuesheet}
                    onAddCue={addCue}
                    onRemoveCue={removeCue}
                    onReorderCue={reorderCue}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 큐시트 생성 다이얼로그 */}
      <CreateCuesheetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addCuesheet}
      />
    </div>
  );
}
