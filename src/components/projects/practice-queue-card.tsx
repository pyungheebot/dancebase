"use client";

import { useState } from "react";
import {
  ListMusic,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Circle,
  Play,
  CheckCircle2,
  SkipForward,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Clock,
  Repeat2,
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePracticeQueue } from "@/hooks/use-practice-queue";
import type { PracticeQueue, PracticeQueueItem, QueueItemStatus } from "@/types";

// ============================================
// 상수 & 유틸
// ============================================

const STATUS_ICON: Record<QueueItemStatus, React.ReactNode> = {
  pending: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  playing: <Play className="h-3.5 w-3.5 text-green-500 fill-green-500" />,
  done: <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />,
  skipped: <SkipForward className="h-3.5 w-3.5 text-yellow-500" />,
};

const STATUS_LABEL: Record<QueueItemStatus, string> = {
  pending: "대기",
  playing: "재생 중",
  done: "완료",
  skipped: "스킵",
};

const STATUS_ROW_CLASS: Record<QueueItemStatus, string> = {
  pending: "",
  playing: "bg-green-50 border-green-100 dark:bg-green-950/30",
  done: "bg-muted/40",
  skipped: "bg-yellow-50/50 dark:bg-yellow-950/20",
};

function isValidDuration(value: string): boolean {
  if (!value.trim()) return true;
  return /^\d{1,2}:\d{2}$/.test(value.trim());
}

// ============================================
// 큐 생성 다이얼로그
// ============================================

interface CreateQueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
}

function CreateQueueDialog({ open, onOpenChange, onConfirm }: CreateQueueDialogProps) {
  const [name, setName] = useState("");

  function handleClose() {
    setName("");
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(TOAST.PRACTICE_QUEUE.QUEUE_NAME_REQUIRED);
      return;
    }
    onConfirm(trimmed);
    setName("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 큐 만들기</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">큐 이름 *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 오늘 연습 셋리스트"
              className="h-8 text-xs"
              autoFocus
              maxLength={80}
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
              만들기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 곡 추가 다이얼로그
// ============================================

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (song: Omit<PracticeQueueItem, "id" | "order" | "status">) => void;
}

function AddItemDialog({ open, onOpenChange, onAdd }: AddItemDialogProps) {
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [duration, setDuration] = useState("");
  const [repeatCount, setRepeatCount] = useState("1");
  const [note, setNote] = useState("");

  function reset() {
    setSongTitle("");
    setArtist("");
    setDuration("");
    setRepeatCount("1");
    setNote("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimTitle = songTitle.trim();
    if (!trimTitle) {
      toast.error(TOAST.PRACTICE_QUEUE.SONG_NAME_REQUIRED);
      return;
    }

    if (duration.trim() && !isValidDuration(duration)) {
      toast.error("길이는 \"분:초\" 형식으로 입력해주세요. (예: 3:45)");
      return;
    }

    const repeat = parseInt(repeatCount, 10);
    if (isNaN(repeat) || repeat < 1 || repeat > 20) {
      toast.error(TOAST.PRACTICE_QUEUE.REPEAT_RANGE);
      return;
    }

    onAdd({
      songTitle: trimTitle,
      artist: artist.trim(),
      duration: duration.trim(),
      repeatCount: repeat,
      note: note.trim(),
    });

    reset();
    onOpenChange(false);
    toast.success(TOAST.PRACTICE_QUEUE.SONG_ADDED);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">곡 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 곡명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">곡명 *</Label>
            <Input
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="곡명을 입력하세요"
              className="h-8 text-xs"
              autoFocus
              maxLength={100}
            />
          </div>

          {/* 아티스트 */}
          <div className="space-y-1.5">
            <Label className="text-xs">아티스트</Label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="아티스트명"
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>

          {/* 길이 + 반복 횟수 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">길이</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="예: 3:45"
                className="h-8 text-xs"
                maxLength={7}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">반복 횟수</Label>
              <Input
                type="number"
                value={repeatCount}
                onChange={(e) => setRepeatCount(e.target.value)}
                placeholder="1"
                className="h-8 text-xs"
                min={1}
                max={20}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="연습 메모 (선택)"
              className="min-h-[60px] text-xs resize-none"
              maxLength={200}
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
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 큐 아이템 행
// ============================================

interface QueueItemRowProps {
  item: PracticeQueueItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function QueueItemRow({
  item,
  index,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
}: QueueItemRowProps) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-2 border-b last:border-0 group rounded-sm transition-colors ${STATUS_ROW_CLASS[item.status]}`}
    >
      {/* 상태 아이콘 */}
      <div className="flex-shrink-0 w-4 flex items-center justify-center" title={STATUS_LABEL[item.status]}>
        {STATUS_ICON[item.status]}
      </div>

      {/* 순번 */}
      <span className="text-[10px] text-muted-foreground w-4 text-center font-mono flex-shrink-0">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* 곡 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs font-medium truncate max-w-[110px] ${
              item.status === "done" ? "line-through text-muted-foreground" : ""
            } ${item.status === "playing" ? "text-green-700 dark:text-green-400" : ""}`}
          >
            {item.songTitle}
          </span>
          {item.artist && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
              {item.artist}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {item.duration && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {item.duration}
            </span>
          )}
          {item.repeatCount > 1 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 hover:bg-orange-100 gap-0.5">
              <Repeat2 className="h-2.5 w-2.5" />
              {item.repeatCount}회
            </Badge>
          )}
          {item.note && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]" title={item.note}>
              {item.note}
            </span>
          )}
        </div>
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
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onMoveDown}
          disabled={isLast}
          title="아래로 이동"
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
      </div>

      {/* 삭제 버튼 */}
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive flex-shrink-0"
        onClick={onRemove}
        title="곡 삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 단일 큐 패널
// ============================================

interface QueuePanelProps {
  queue: PracticeQueue;
  onDelete: () => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onNext: () => void;
  onSkip: () => void;
  onReset: () => void;
}

function QueuePanel({
  queue,
  onDelete,
  onAddItem,
  onRemoveItem,
  onMoveUp,
  onMoveDown,
  onNext,
  onSkip,
  onReset,
}: QueuePanelProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const items = queue.items;
  const playingItem = items.find((i) => i.status === "playing");
  const doneCount = items.filter((i) => i.status === "done").length;
  const isAllDone =
    items.length > 0 && items.every((i) => i.status === "done" || i.status === "skipped");
  const hasPlaying = !!playingItem;

  // 첫 재생 시작 (모두 pending인 경우)
  const isAllPending = items.length > 0 && items.every((i) => i.status === "pending");

  return (
    <div className="border rounded-md bg-background">
      <Collapsible open={panelOpen} onOpenChange={setPanelOpen}>
        {/* 큐 헤더 */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium truncate max-w-[130px]">{queue.name}</span>
            {items.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 hover:bg-slate-100 flex-shrink-0">
                {doneCount}/{items.length}곡
              </Badge>
            )}
            {isAllDone && (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 hover:bg-green-100 flex-shrink-0">
                완료
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* 재생 제어 버튼 */}
            {items.length > 0 && (
              <>
                {isAllPending && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 px-2 text-green-600 hover:text-green-700"
                    onClick={onReset}
                    title="처음부터 시작"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                {hasPlaying && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2 text-blue-600 hover:text-blue-700"
                      onClick={onNext}
                      title="다음 곡"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2 text-yellow-600 hover:text-yellow-700"
                      onClick={onSkip}
                      title="스킵"
                    >
                      <SkipForward className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {(isAllDone || (!hasPlaying && !isAllPending)) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    onClick={onReset}
                    title="다시 시작"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}

            {/* 곡 추가 */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={(e) => {
                e.stopPropagation();
                onAddItem();
              }}
              title="곡 추가"
            >
              <Plus className="h-3 w-3" />
            </Button>

            {/* 큐 삭제 */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="큐 삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>

            {/* 펼치기/접기 */}
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                {panelOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 재생 중인 곡 요약 (접혀 있을 때) */}
        {!panelOpen && playingItem && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-1.5 text-[10px] text-green-600 dark:text-green-400">
              <Play className="h-2.5 w-2.5 fill-green-500" />
              <span className="font-medium truncate">{playingItem.songTitle}</span>
              {playingItem.artist && (
                <span className="text-muted-foreground truncate">— {playingItem.artist}</span>
              )}
              {playingItem.duration && (
                <span className="text-muted-foreground ml-auto flex-shrink-0">{playingItem.duration}</span>
              )}
            </div>
          </div>
        )}

        {/* 곡 목록 */}
        <CollapsibleContent>
          <div className="px-2 pb-2 border-t">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground gap-1.5">
                <ListMusic className="h-6 w-6 opacity-25" />
                <p className="text-xs">아직 곡이 없습니다.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={onAddItem}
                >
                  <Plus className="h-3 w-3" />
                  첫 곡 추가하기
                </Button>
              </div>
            ) : (
              <ScrollArea className="max-h-60 mt-1.5">
                <div>
                  {items.map((item, idx) => (
                    <QueueItemRow
                      key={item.id}
                      item={item}
                      index={idx}
                      isFirst={idx === 0}
                      isLast={idx === items.length - 1}
                      onRemove={() => onRemoveItem(item.id)}
                      onMoveUp={() => onMoveUp(idx)}
                      onMoveDown={() => onMoveDown(idx)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// 메인 카드
// ============================================

interface PracticeQueueCardProps {
  groupId: string;
  projectId: string;
}

export function PracticeQueueCard({ groupId, projectId }: PracticeQueueCardProps) {
  const {
    queues,
    addQueue,
    deleteQueue,
    addItem,
    removeItem,
    reorderItem,
    nextSong,
    skipSong,
    resetQueue,
    totalQueues,
    totalSongs,
    completedSongs,
  } = usePracticeQueue(groupId, projectId);

  const [cardOpen, setCardOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addItemDialogTarget, setAddItemDialogTarget] = useState<string | null>(null);

  function handleCreateQueue(name: string) {
    const ok = addQueue(name);
    if (ok) {
      toast.success(`"${name}" 큐가 생성되었습니다.`);
      setCardOpen(true);
    } else {
      toast.error(TOAST.PRACTICE_QUEUE.QUEUE_CREATE_ERROR);
    }
  }

  function handleDeleteQueue(queue: PracticeQueue) {
    const ok = deleteQueue(queue.id);
    if (ok) {
      toast.success(`"${queue.name}" 큐가 삭제되었습니다.`);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  function handleAddItem(
    queueId: string,
    song: Omit<PracticeQueueItem, "id" | "order" | "status">
  ) {
    const ok = addItem(queueId, song);
    if (!ok) {
      toast.error(TOAST.PRACTICE_QUEUE.SONG_ADD_ERROR);
    }
  }

  function handleRemoveItem(queueId: string, itemId: string) {
    const ok = removeItem(queueId, itemId);
    if (ok) {
      toast.success(TOAST.PRACTICE_QUEUE.SONG_DELETED);
    } else {
      toast.error(TOAST.PRACTICE_QUEUE.SONG_DELETE_ERROR);
    }
  }

  function handleNext(queue: PracticeQueue) {
    const currentItem = queue.items[queue.currentIndex];
    const isLast = queue.currentIndex >= queue.items.length - 1;
    if (isLast && currentItem?.status === "playing") {
      // 마지막 곡 완료
      nextSong(queue.id);
      toast.success(TOAST.PRACTICE_QUEUE.ALL_COMPLETED);
    } else {
      nextSong(queue.id);
    }
  }

  function handleSkip(queue: PracticeQueue) {
    const isLast = queue.currentIndex >= queue.items.length - 1;
    skipSong(queue.id);
    if (isLast) {
      toast("마지막 곡을 스킵했습니다.");
    }
  }

  function handleReset(queue: PracticeQueue) {
    const ok = resetQueue(queue.id);
    if (ok) {
      toast.success(`"${queue.name}" 큐를 처음부터 시작합니다.`);
    } else {
      toast.error(TOAST.PRACTICE_QUEUE.QUEUE_RESET_ERROR);
    }
  }

  return (
    <div className="border rounded-lg bg-card">
      <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <ListMusic className="h-4 w-4 text-violet-500 flex-shrink-0" />
            <span className="text-sm font-medium">연습 큐</span>
            {totalQueues > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 hover:bg-violet-100">
                {totalQueues}개
              </Badge>
            )}
            {totalSongs > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 hover:bg-slate-100">
                {completedSongs}/{totalSongs}곡
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
              title="새 큐 만들기"
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">새 큐</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                {cardOpen ? (
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
            {queues.length === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <ListMusic className="h-7 w-7 opacity-30" />
                <p className="text-xs">아직 큐가 없습니다.</p>
                <p className="text-[10px] text-muted-foreground">
                  연습 시 재생할 곡 순서를 큐로 관리하세요.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 큐 만들기
                </Button>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {queues.map((queue) => (
                  <QueuePanel
                    key={queue.id}
                    queue={queue}
                    onDelete={() => handleDeleteQueue(queue)}
                    onAddItem={() => setAddItemDialogTarget(queue.id)}
                    onRemoveItem={(itemId) => handleRemoveItem(queue.id, itemId)}
                    onMoveUp={(idx) => reorderItem(queue.id, idx, "up")}
                    onMoveDown={(idx) => reorderItem(queue.id, idx, "down")}
                    onNext={() => handleNext(queue)}
                    onSkip={() => handleSkip(queue)}
                    onReset={() => handleReset(queue)}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 큐 생성 다이얼로그 */}
      <CreateQueueDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onConfirm={handleCreateQueue}
      />

      {/* 곡 추가 다이얼로그 */}
      <AddItemDialog
        open={addItemDialogTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAddItemDialogTarget(null);
        }}
        onAdd={(song) => {
          if (addItemDialogTarget) {
            handleAddItem(addItemDialogTarget, song);
          }
        }}
      />
    </div>
  );
}
