"use client";

import { useState } from "react";
import {
  Lock,
  LockOpen,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  PackageOpen,
  CalendarIcon,
  MessageSquare,
  Target,
  Music2,
  ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useTimeCapsule,
  usePracticeTimeCapsule,
  calcDaysLeft,
} from "@/hooks/use-time-capsule";
import type { TimeCapsule, TimeCapsuleEntry } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 날짜 포맷 헬퍼
// ============================================

function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ============================================
// D-Day 배지
// ============================================

function DDayBadge({ openDate }: { openDate: string }) {
  const days = calcDaysLeft(openDate);
  const label =
    days > 0 ? `D-${days}` : days === 0 ? "D-Day" : `D+${Math.abs(days)}`;
  const color =
    days > 0
      ? "bg-blue-100 text-blue-700"
      : days === 0
        ? "bg-amber-100 text-amber-700"
        : "bg-green-100 text-green-700";
  return (
    <span
      className={`text-[10px] font-mono font-semibold px-1.5 py-0 rounded shrink-0 ${color}`}
    >
      {label}
    </span>
  );
}

// ============================================
// 캡슐 생성 다이얼로그 (기본)
// ============================================

function CreateCapsuleDialog({
  open,
  onOpenChange,
  onCreate,
  totalCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (title: string, openDate: string) => boolean;
  totalCount: number;
}) {
  const [title, setTitle] = useState("");
  const [openDate, setOpenDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);

  const reset = () => {
    setTitle("");
    setOpenDate(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(TOAST.TIME_CAPSULE_CARD.TITLE_REQUIRED);
      return;
    }
    if (!openDate) {
      toast.error(TOAST.TIME_CAPSULE.OPEN_DATE_PAST);
      return;
    }
    const success = onCreate(title.trim(), dateToYMD(openDate));
    if (!success) {
      toast.error(TOAST.TIME_CAPSULE.MAX_EXCEEDED);
      return;
    }
    toast.success(TOAST.TIME_CAPSULE.CREATED);
    reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-500" />
            타임캡슐 만들기
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">제목</label>
            <Input
              placeholder="캡슐 제목 입력"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              개봉일
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start text-xs font-normal",
                    !openDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" />
                  {openDate ? dateToYMD(openDate) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={openDate}
                  onSelect={(d) => {
                    setOpenDate(d);
                    setCalOpen(false);
                  }}
                  disabled={(d) => {
                    const day = new Date(d);
                    day.setHours(0, 0, 0, 0);
                    return day <= today;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {totalCount >= 30 && (
            <p className="text-[10px] text-destructive">
              최대 30개까지 생성할 수 있습니다.
            </p>
          )}

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={totalCount >= 30}
            >
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 스냅샷 캡슐 생성 다이얼로그 (확장)
// ============================================

function CreateEntryDialog({
  open,
  onOpenChange,
  onCreate,
  totalCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (params: {
    title: string;
    openDate: string;
    currentGoal?: string;
    currentRepertoire?: string[];
    photoUrl?: string;
  }) => boolean;
  totalCount: number;
}) {
  const [title, setTitle] = useState("");
  const [openDate, setOpenDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState("");
  const [repertoireInput, setRepertoireInput] = useState("");
  const [repertoire, setRepertoire] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");

  const reset = () => {
    setTitle("");
    setOpenDate(undefined);
    setCurrentGoal("");
    setRepertoireInput("");
    setRepertoire([]);
    setPhotoUrl("");
  };

  const handleAddRepertoire = () => {
    const trimmed = repertoireInput.trim();
    if (!trimmed) return;
    if (repertoire.includes(trimmed)) {
      toast.error(TOAST.TIME_CAPSULE_CARD.ALREADY_ADDED);
      return;
    }
    setRepertoire((prev) => [...prev, trimmed]);
    setRepertoireInput("");
  };

  const handleRemoveRepertoire = (item: string) => {
    setRepertoire((prev) => prev.filter((r) => r !== item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(TOAST.TIME_CAPSULE_CARD.TITLE_REQUIRED);
      return;
    }
    if (!openDate) {
      toast.error(TOAST.TIME_CAPSULE.OPEN_DATE_REQUIRED);
      return;
    }
    const success = onCreate({
      title: title.trim(),
      openDate: dateToYMD(openDate),
      currentGoal: currentGoal.trim() || undefined,
      currentRepertoire: repertoire,
      photoUrl: photoUrl.trim() || undefined,
    });
    if (!success) {
      toast.error(TOAST.TIME_CAPSULE_CARD.MAX_LIMIT);
      return;
    }
    toast.success(TOAST.TIME_CAPSULE_CARD.CREATED);
    reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <PackageOpen className="h-4 w-4 text-indigo-500" />
            스냅샷 타임캡슐 만들기
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              캡슐 제목 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="예: 2026년 봄 시즌 스냅샷"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>

          {/* 개봉 예정일 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              개봉 예정일 <span className="text-destructive">*</span>
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start text-xs font-normal",
                    !openDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" />
                  {openDate ? dateToYMD(openDate) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={openDate}
                  onSelect={(d) => {
                    setOpenDate(d);
                    setCalOpen(false);
                  }}
                  disabled={(d) => {
                    const day = new Date(d);
                    day.setHours(0, 0, 0, 0);
                    return day <= today;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 현재 목표 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              <Target className="h-3 w-3 text-orange-500" />
              현재 그룹 목표
            </label>
            <Textarea
              placeholder="이 시점의 그룹 목표를 기록해 두세요."
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={200}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {currentGoal.length}/200
            </p>
          </div>

          {/* 현재 레퍼토리 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              <Music2 className="h-3 w-3 text-purple-500" />
              현재 레퍼토리
            </label>
            <div className="flex gap-1">
              <Input
                placeholder="곡명 입력 후 추가"
                value={repertoireInput}
                onChange={(e) => setRepertoireInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRepertoire();
                  }
                }}
                className="h-7 text-xs flex-1"
                maxLength={50}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleAddRepertoire}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {repertoire.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {repertoire.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveRepertoire(item)}
                      className="hover:text-destructive"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 그룹 사진 URL */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              <ImageIcon className="h-3 w-3 text-cyan-500" />
              그룹 사진 URL
            </label>
            <Input
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="h-8 text-xs"
              maxLength={500}
              type="url"
            />
            {photoUrl && (
              <p className="text-[10px] text-muted-foreground truncate">
                미리보기: {photoUrl}
              </p>
            )}
          </div>

          {totalCount >= 30 && (
            <p className="text-[10px] text-destructive">
              최대 30개까지 생성할 수 있습니다.
            </p>
          )}

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={totalCount >= 30}
            >
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메시지 추가 폼 (인라인)
// ============================================

function AddMessageForm({
  capsuleId,
  onAdd,
}: {
  capsuleId: string;
  onAdd: (capsuleId: string, authorName: string, content: string) => boolean;
}) {
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) {
      toast.error(TOAST.TIME_CAPSULE_CARD.NAME_REQUIRED);
      return;
    }
    if (!content.trim()) {
      toast.error(TOAST.TIME_CAPSULE_CARD.MESSAGE_REQUIRED);
      return;
    }
    const success = onAdd(capsuleId, authorName.trim(), content.trim());
    if (!success) {
      toast.error(TOAST.TIME_CAPSULE_CARD.MESSAGE_ADD_ERROR);
      return;
    }
    toast.success(TOAST.TIME_CAPSULE_CARD.MESSAGE_ADDED);
    setAuthorName("");
    setContent("");
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1.5 px-2 rounded hover:bg-muted/40 transition-colors"
      >
        <MessageSquare className="h-3 w-3 shrink-0" />
        메시지 남기기
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5 pt-1">
      <Input
        placeholder="이름"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        className="h-7 text-xs"
        maxLength={30}
      />
      <Textarea
        placeholder="미래의 멤버들에게 전할 메시지를 작성해주세요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="text-xs resize-none min-h-[72px]"
        maxLength={300}
      />
      <p className="text-[10px] text-muted-foreground text-right">
        {content.length}/300
      </p>
      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={() => {
            setExpanded(false);
            setAuthorName("");
            setContent("");
          }}
        >
          취소
        </Button>
        <Button type="submit" size="sm" className="h-7 text-xs flex-1">
          등록
        </Button>
      </div>
    </form>
  );
}

// ============================================
// 개별 캡슐 아이템 (기본)
// ============================================

function CapsuleItem({
  capsule,
  onDelete,
  onSeal,
  onOpen,
  onAddMessage,
}: {
  capsule: TimeCapsule;
  onDelete: (id: string) => void;
  onSeal: (id: string) => boolean;
  onOpen: (id: string) => boolean;
  onAddMessage: (
    capsuleId: string,
    authorName: string,
    content: string
  ) => boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const daysLeft = calcDaysLeft(capsule.openDate);
  const canOpen = daysLeft <= 0 && !capsule.isOpened;

  if (capsule.isOpened) {
    return (
      <div className="rounded-md border border-green-200/70 bg-green-50/50 p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <LockOpen className="h-3 w-3 text-green-600 shrink-0" />
          <span className="text-xs font-medium text-green-800 flex-1 truncate">
            {capsule.title}
          </span>
          <span className="text-[10px] text-green-600 shrink-0">
            {formatYearMonthDay(capsule.openDate)} 개봉
          </span>
          <button
            type="button"
            onClick={() => onDelete(capsule.id)}
            className="shrink-0"
            aria-label="캡슐 삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
        {capsule.messages.length > 0 ? (
          <div className="space-y-1.5">
            {capsule.messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-card/70 rounded px-2 py-1.5 space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-green-700">
                    {msg.authorName}
                  </span>
                  <span className="text-[10px] text-green-500">
                    {formatYearMonthDay(msg.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-green-600 text-center py-1">
            메시지가 없습니다.
          </p>
        )}
      </div>
    );
  }

  if (canOpen) {
    return (
      <div className="rounded-md border border-amber-200/70 bg-amber-50/50 p-2.5 space-y-2">
        <style>{`
          @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(-4deg); }
            40% { transform: rotate(4deg); }
            60% { transform: rotate(-3deg); }
            80% { transform: rotate(3deg); }
          }
          .shake-anim { animation: shake 0.6s ease-in-out infinite; }
        `}</style>
        <div className="flex items-center gap-1.5">
          <PackageOpen className="h-3 w-3 text-amber-600 shrink-0 shake-anim" />
          <span className="text-xs font-medium text-amber-800 flex-1 truncate">
            {capsule.title}
          </span>
          <span className="text-[10px] text-amber-600 shrink-0">
            {formatYearMonthDay(capsule.openDate)} 개봉 가능
          </span>
          <button
            type="button"
            onClick={() => onDelete(capsule.id)}
            className="shrink-0"
            aria-label="캡슐 삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs w-full bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => {
            const ok = onOpen(capsule.id);
            if (ok) toast.success(TOAST.TIME_CAPSULE.OPENED);
            else toast.error(TOAST.TIME_CAPSULE.OPEN_ERROR);
          }}
        >
          <LockOpen className="h-3 w-3 mr-1" />
          지금 개봉하기
        </Button>
      </div>
    );
  }

  if (capsule.isSealed) {
    return (
      <div className="rounded-md border border-border/60 bg-muted/30 p-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-foreground flex-1 truncate">
            {capsule.title}
          </span>
          <DDayBadge openDate={capsule.openDate} />
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatYearMonthDay(capsule.openDate)} 개봉
          </span>
          <button
            type="button"
            onClick={() => onDelete(capsule.id)}
            className="shrink-0"
            aria-label="캡슐 삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="h-2.5 w-2.5 shrink-0" />
          <span>
            봉인됨 · 메시지 {capsule.messages.length}개 · 개봉일까지
            잠겨있습니다
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border/60 bg-card p-2.5 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="flex items-center gap-1.5 flex-1 min-w-0"
          onClick={() => setExpanded((p) => !p)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <span className="text-xs font-medium text-foreground flex-1 truncate text-left">
            {capsule.title}
          </span>
        </button>
        <DDayBadge openDate={capsule.openDate} />
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatYearMonthDay(capsule.openDate)}
        </span>
        <button
          type="button"
          onClick={() => onDelete(capsule.id)}
          className="shrink-0"
          aria-label="캡슐 삭제"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground pl-5">
        메시지 {capsule.messages.length}개 작성됨
      </p>

      {expanded && (
        <div className="pl-5 space-y-2">
          {capsule.messages.length > 0 && (
            <div className="space-y-1">
              {capsule.messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-muted/40 rounded px-2 py-1.5 space-y-0.5"
                >
                  <span className="text-[10px] font-semibold text-foreground">
                    {msg.authorName}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <AddMessageForm capsuleId={capsule.id} onAdd={onAddMessage} />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full border-dashed text-muted-foreground hover:text-foreground hover:border-solid"
            onClick={() => {
              const ok = onSeal(capsule.id);
              if (ok) toast.success(TOAST.TIME_CAPSULE.SEALED);
              else toast.error(TOAST.TIME_CAPSULE_CARD.SEAL_ERROR);
            }}
          >
            <Lock className="h-3 w-3 mr-1" />
            봉인하기 (봉인 후 메시지 추가 불가)
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 스냅샷 엔트리 아이템 (확장)
// ============================================

function EntryItem({
  entry,
  onDelete,
  onSeal,
  onOpen,
  onAddMessage,
}: {
  entry: TimeCapsuleEntry;
  onDelete: (id: string) => boolean;
  onSeal: (id: string) => boolean;
  onOpen: (id: string) => boolean;
  onAddMessage: (entryId: string, authorName: string, content: string) => boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const daysLeft = calcDaysLeft(entry.openDate);
  const canOpen = daysLeft <= 0 && !entry.isOpened;

  // 개봉 완료
  if (entry.isOpened) {
    return (
      <div className="rounded-md border border-green-200/70 bg-green-50/50 p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <LockOpen className="h-3 w-3 text-green-600 shrink-0" />
          <span className="text-xs font-medium text-green-800 flex-1 truncate">
            {entry.title}
          </span>
          <span className="text-[10px] text-green-600 shrink-0">
            {formatYearMonthDay(entry.openDate)} 개봉
          </span>
          <button
            type="button"
            onClick={() => {
              const ok = onDelete(entry.id);
              if (ok) toast.success(TOAST.DELETE_SUCCESS);
            }}
            className="shrink-0"
            aria-label="삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>

        {/* 스냅샷 정보 */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-green-600">
            작성일: {formatYearMonthDay(entry.writtenAt)}
          </p>
          {entry.currentGoal && (
            <div className="bg-card/60 rounded px-2 py-1.5 space-y-0.5">
              <div className="flex items-center gap-1">
                <Target className="h-2.5 w-2.5 text-orange-500" />
                <span className="text-[10px] font-semibold text-orange-700">
                  목표
                </span>
              </div>
              <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">
                {entry.currentGoal}
              </p>
            </div>
          )}
          {entry.currentRepertoire.length > 0 && (
            <div className="bg-card/60 rounded px-2 py-1.5 space-y-1">
              <div className="flex items-center gap-1">
                <Music2 className="h-2.5 w-2.5 text-purple-500" />
                <span className="text-[10px] font-semibold text-purple-700">
                  레퍼토리
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {entry.currentRepertoire.map((r) => (
                  <Badge
                    key={r}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100"
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {entry.photoUrl && (
            <div className="bg-card/60 rounded px-2 py-1.5 space-y-1">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-2.5 w-2.5 text-cyan-500" />
                <span className="text-[10px] font-semibold text-cyan-700">
                  그룹 사진
                </span>
              </div>
              <a
                href={entry.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-600 underline truncate block"
              >
                {entry.photoUrl}
              </a>
            </div>
          )}
        </div>

        {/* 멤버 메시지 */}
        {entry.messages.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-green-700">
              멤버 메시지 ({entry.messages.length})
            </p>
            {entry.messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-card/70 rounded px-2 py-1.5 space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-green-700">
                    {msg.authorName}
                  </span>
                  <span className="text-[10px] text-green-500">
                    {formatYearMonthDay(msg.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 개봉 가능 (D-Day 도달)
  if (canOpen) {
    return (
      <div className="rounded-md border border-amber-200/70 bg-amber-50/50 p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <PackageOpen className="h-3 w-3 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-800 flex-1 truncate">
            {entry.title}
          </span>
          <span className="text-[10px] text-amber-600 shrink-0">
            개봉 가능
          </span>
          <button
            type="button"
            onClick={() => {
              const ok = onDelete(entry.id);
              if (ok) toast.success(TOAST.DELETE_SUCCESS);
            }}
            className="shrink-0"
            aria-label="삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs w-full bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => {
            const ok = onOpen(entry.id);
            if (ok) toast.success(TOAST.TIME_CAPSULE_CARD.OPENED);
            else toast.error(TOAST.TIME_CAPSULE_CARD.OPEN_ERROR);
          }}
        >
          <LockOpen className="h-3 w-3 mr-1" />
          지금 개봉하기
        </Button>
      </div>
    );
  }

  // 봉인 상태
  if (entry.isSealed) {
    return (
      <div className="rounded-md border border-indigo-200/60 bg-indigo-50/30 p-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-indigo-400 shrink-0" />
          <span className="text-xs font-medium text-foreground flex-1 truncate">
            {entry.title}
          </span>
          <DDayBadge openDate={entry.openDate} />
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatYearMonthDay(entry.openDate)}
          </span>
          <button
            type="button"
            onClick={() => {
              const ok = onDelete(entry.id);
              if (ok) toast.success(TOAST.DELETE_SUCCESS);
            }}
            className="shrink-0"
            aria-label="삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-indigo-500">
          <Lock className="h-2.5 w-2.5 shrink-0" />
          <span>
            봉인됨 · 메시지 {entry.messages.length}개
            {entry.currentRepertoire.length > 0 &&
              ` · 레퍼토리 ${entry.currentRepertoire.length}곡`}
          </span>
        </div>
      </div>
    );
  }

  // 미봉인 (편집 가능)
  return (
    <div className="rounded-md border border-border/60 bg-card p-2.5 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="flex items-center gap-1.5 flex-1 min-w-0"
          onClick={() => setExpanded((p) => !p)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <span className="text-xs font-medium text-foreground flex-1 truncate text-left">
            {entry.title}
          </span>
        </button>
        <DDayBadge openDate={entry.openDate} />
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatYearMonthDay(entry.openDate)}
        </span>
        <button
          type="button"
          onClick={() => {
            const ok = onDelete(entry.id);
            if (ok) toast.success(TOAST.DELETE_SUCCESS);
          }}
          className="shrink-0"
          aria-label="삭제"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
        </button>
      </div>

      {/* 요약 정보 */}
      <div className="pl-5 flex flex-wrap gap-1.5">
        <span className="text-[10px] text-muted-foreground">
          메시지 {entry.messages.length}개
        </span>
        {entry.currentRepertoire.length > 0 && (
          <span className="text-[10px] text-purple-500">
            레퍼토리 {entry.currentRepertoire.length}곡
          </span>
        )}
        {entry.currentGoal && (
          <span className="text-[10px] text-orange-500">목표 있음</span>
        )}
        {entry.photoUrl && (
          <span className="text-[10px] text-cyan-500">사진 있음</span>
        )}
      </div>

      {expanded && (
        <div className="pl-5 space-y-2">
          {/* 스냅샷 상세 */}
          {entry.currentGoal && (
            <div className="bg-muted/30 rounded px-2 py-1.5 space-y-0.5">
              <div className="flex items-center gap-1">
                <Target className="h-2.5 w-2.5 text-orange-500" />
                <span className="text-[10px] font-semibold text-orange-600">
                  목표
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {entry.currentGoal}
              </p>
            </div>
          )}
          {entry.currentRepertoire.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Music2 className="h-2.5 w-2.5 text-purple-500" />
                <span className="text-[10px] font-semibold text-purple-600">
                  레퍼토리
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {entry.currentRepertoire.map((r) => (
                  <Badge
                    key={r}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100"
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {entry.photoUrl && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-2.5 w-2.5 text-cyan-500" />
                <span className="text-[10px] font-semibold text-cyan-600">
                  그룹 사진
                </span>
              </div>
              <a
                href={entry.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-600 underline truncate block"
              >
                {entry.photoUrl}
              </a>
            </div>
          )}

          {/* 기존 메시지 미리보기 */}
          {entry.messages.length > 0 && (
            <div className="space-y-1">
              {entry.messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-muted/40 rounded px-2 py-1.5 space-y-0.5"
                >
                  <span className="text-[10px] font-semibold text-foreground">
                    {msg.authorName}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 메시지 추가 폼 */}
          <AddMessageForm capsuleId={entry.id} onAdd={onAddMessage} />

          {/* 봉인 버튼 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full border-dashed text-muted-foreground hover:text-foreground hover:border-solid"
            onClick={() => {
              const ok = onSeal(entry.id);
              if (ok) toast.success(TOAST.TIME_CAPSULE_CARD.SEALED);
              else toast.error(TOAST.TIME_CAPSULE_CARD.SEAL_ERROR);
            }}
          >
            <Lock className="h-3 w-3 mr-1" />
            봉인하기 (봉인 후 수정 불가)
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type TimeCapsuleCardProps = {
  groupId: string;
};

export function TimeCapsuleCard({ groupId }: TimeCapsuleCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createEntryDialogOpen, setCreateEntryDialogOpen] = useState(false);

  // 기본 타임캡슐 훅
  const {
    capsules,
    createCapsule,
    deleteCapsule,
    addMessage,
    sealCapsule,
    openCapsule,
    totalCapsules,
    sealedCount,
    nextOpenDate,
  } = useTimeCapsule(groupId);

  // 스냅샷 타임캡슐 훅
  const {
    entries,
    createEntry,
    deleteEntry,
    addEntryMessage,
    sealEntry,
    openEntry,
    totalEntries,
    sealedCount: entrySealedCount,
    nextOpenDate: entryNextOpenDate,
  } = usePracticeTimeCapsule(groupId);

  const handleDelete = (id: string) => {
    deleteCapsule(id);
    toast.success(TOAST.TIME_CAPSULE.DELETED);
  };

  const sortedCapsules = [...capsules].sort((a, b) => {
    const score = (c: TimeCapsule) => {
      if (c.isOpened) return 3;
      if (calcDaysLeft(c.openDate) <= 0) return 0;
      if (!c.isSealed) return 1;
      return 2;
    };
    return score(a) - score(b);
  });

  const sortedEntries = [...entries].sort((a, b) => {
    const score = (e: TimeCapsuleEntry) => {
      if (e.isOpened) return 3;
      if (calcDaysLeft(e.openDate) <= 0) return 0;
      if (!e.isSealed) return 1;
      return 2;
    };
    return score(a) - score(b);
  });

  const totalSealedAll = sealedCount + entrySealedCount;

  return (
    <>
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* 헤더 */}
        <button
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
        >
          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="text-xs font-medium flex-1">그룹 타임캡슐</span>
          {totalSealedAll > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-indigo-100 text-indigo-700 font-semibold shrink-0">
              봉인 {totalSealedAll}
            </span>
          )}
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {!collapsed && (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="h-7 w-full">
              <TabsTrigger value="basic" className="flex-1 text-xs h-6">
                메시지 캡슐
                {totalCapsules > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {totalCapsules}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="snapshot" className="flex-1 text-xs h-6">
                스냅샷 캡슐
                {totalEntries > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {totalEntries}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* 메시지 캡슐 탭 */}
            <TabsContent value="basic" className="mt-2 space-y-2">
              {nextOpenDate && (
                <p className="text-[10px] text-muted-foreground px-0.5">
                  다음 개봉일: {formatYearMonthDay(nextOpenDate)} (D-
                  {Math.max(0, calcDaysLeft(nextOpenDate))})
                </p>
              )}
              {sortedCapsules.length > 0 ? (
                <div className="space-y-1.5">
                  {sortedCapsules.map((capsule) => (
                    <CapsuleItem
                      key={capsule.id}
                      capsule={capsule}
                      onDelete={handleDelete}
                      onSeal={sealCapsule}
                      onOpen={openCapsule}
                      onAddMessage={addMessage}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <p className="text-xs">아직 타임캡슐이 없습니다</p>
                  <p className="text-[10px]">
                    미래의 멤버들에게 메시지를 남겨보세요
                  </p>
                </div>
              )}
              {capsules.length > 0 && (
                <div className="border-t border-border/40" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setCreateDialogOpen(true)}
                disabled={totalCapsules >= 30}
              >
                <Plus className="h-3 w-3" />
                타임캡슐 만들기
                {totalCapsules >= 30 && (
                  <span className="ml-auto text-[10px] text-destructive">
                    최대 도달
                  </span>
                )}
              </Button>
            </TabsContent>

            {/* 스냅샷 캡슐 탭 */}
            <TabsContent value="snapshot" className="mt-2 space-y-2">
              <p className="text-[10px] text-muted-foreground px-0.5">
                그룹 목표, 레퍼토리, 사진을 포함한 현재 상태 스냅샷을
                기록합니다.
              </p>
              {entryNextOpenDate && (
                <p className="text-[10px] text-muted-foreground px-0.5">
                  다음 개봉일: {formatYearMonthDay(entryNextOpenDate)} (D-
                  {Math.max(0, calcDaysLeft(entryNextOpenDate))})
                </p>
              )}
              {sortedEntries.length > 0 ? (
                <div className="space-y-1.5">
                  {sortedEntries.map((entry) => (
                    <EntryItem
                      key={entry.id}
                      entry={entry}
                      onDelete={deleteEntry}
                      onSeal={sealEntry}
                      onOpen={openEntry}
                      onAddMessage={addEntryMessage}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                  <PackageOpen className="h-5 w-5" />
                  <p className="text-xs">아직 스냅샷 타임캡슐이 없습니다</p>
                  <p className="text-[10px]">
                    지금 이 순간의 그룹 상태를 기록해 두세요
                  </p>
                </div>
              )}
              {entries.length > 0 && (
                <div className="border-t border-border/40" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setCreateEntryDialogOpen(true)}
                disabled={totalEntries >= 30}
              >
                <Plus className="h-3 w-3" />
                스냅샷 캡슐 만들기
                {totalEntries >= 30 && (
                  <span className="ml-auto text-[10px] text-destructive">
                    최대 도달
                  </span>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* 기본 캡슐 생성 다이얼로그 */}
      <CreateCapsuleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createCapsule}
        totalCount={totalCapsules}
      />

      {/* 스냅샷 캡슐 생성 다이얼로그 */}
      <CreateEntryDialog
        open={createEntryDialogOpen}
        onOpenChange={setCreateEntryDialogOpen}
        onCreate={createEntry}
        totalCount={totalEntries}
      />
    </>
  );
}
