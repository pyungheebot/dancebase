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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTimeCapsule, calcDaysLeft } from "@/hooks/use-time-capsule";
import type { TimeCapsule } from "@/types";

// ============================================
// 날짜 포맷 헬퍼
// ============================================

function formatDate(isoOrDate: string): string {
  const d = new Date(isoOrDate.length === 10 ? isoOrDate + "T00:00:00" : isoOrDate);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

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
// 캡슐 생성 다이얼로그
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
      toast.error("캡슐 제목을 입력해주세요.");
      return;
    }
    if (!openDate) {
      toast.error("개봉일을 선택해주세요.");
      return;
    }
    const success = onCreate(title.trim(), dateToYMD(openDate));
    if (!success) {
      toast.error("타임캡슐은 최대 30개까지 생성할 수 있습니다.");
      return;
    }
    toast.success("타임캡슐이 생성되었습니다.");
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
          {/* 제목 */}
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

          {/* 개봉일 DatePicker */}
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
      toast.error("이름을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("메시지 내용을 입력해주세요.");
      return;
    }
    const success = onAdd(capsuleId, authorName.trim(), content.trim());
    if (!success) {
      toast.error("메시지 추가에 실패했습니다.");
      return;
    }
    toast.success("메시지가 추가되었습니다.");
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
// 개별 캡슐 아이템
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

  // 개봉 후: 초록 테두리
  if (capsule.isOpened) {
    return (
      <div className="rounded-md border border-green-200/70 bg-green-50/50 p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <LockOpen className="h-3 w-3 text-green-600 shrink-0" />
          <span className="text-xs font-medium text-green-800 flex-1 truncate">
            {capsule.title}
          </span>
          <span className="text-[10px] text-green-600 shrink-0">
            {formatDate(capsule.openDate)} 개봉
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
        {/* 메시지 목록 */}
        {capsule.messages.length > 0 ? (
          <div className="space-y-1.5">
            {capsule.messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white/70 rounded px-2 py-1.5 space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-green-700">
                    {msg.authorName}
                  </span>
                  <span className="text-[10px] text-green-500">
                    {formatDate(msg.createdAt)}
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

  // 개봉 가능 (D-Day 이후, 아직 열지 않음): 흔들리는 애니메이션
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
            {formatDate(capsule.openDate)} 개봉 가능
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
            if (ok) toast.success("타임캡슐이 개봉되었습니다!");
            else toast.error("개봉에 실패했습니다.");
          }}
        >
          <LockOpen className="h-3 w-3 mr-1" />
          지금 개봉하기
        </Button>
      </div>
    );
  }

  // 봉인됨 (isSealed=true, 아직 개봉일 전)
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
            {formatDate(capsule.openDate)} 개봉
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
            봉인됨 · 메시지 {capsule.messages.length}개 · 개봉일까지 잠겨있습니다
          </span>
        </div>
      </div>
    );
  }

  // 미봉인 (메시지 추가 + 봉인 버튼)
  return (
    <div className="rounded-md border border-border/60 bg-card p-2.5 space-y-1.5">
      {/* 헤더 */}
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
          {formatDate(capsule.openDate)}
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

      {/* 메시지 수 요약 */}
      <p className="text-[10px] text-muted-foreground pl-5">
        메시지 {capsule.messages.length}개 작성됨
      </p>

      {expanded && (
        <div className="pl-5 space-y-2">
          {/* 기존 메시지 미리보기 */}
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

          {/* 메시지 추가 폼 */}
          <AddMessageForm capsuleId={capsule.id} onAdd={onAddMessage} />

          {/* 봉인 버튼 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full border-dashed text-muted-foreground hover:text-foreground hover:border-solid"
            onClick={() => {
              const ok = onSeal(capsule.id);
              if (ok) toast.success("타임캡슐이 봉인되었습니다.");
              else toast.error("봉인에 실패했습니다.");
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
// 메인 컴포넌트
// ============================================

type TimeCapsuleCardProps = {
  groupId: string;
};

export function TimeCapsuleCard({ groupId }: TimeCapsuleCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

  const handleDelete = (id: string) => {
    deleteCapsule(id);
    toast.success("타임캡슐이 삭제되었습니다.");
  };

  // 정렬: 개봉 가능 > 미봉인 > 봉인 > 개봉 완료
  const sortedCapsules = [...capsules].sort((a, b) => {
    const score = (c: TimeCapsule) => {
      if (c.isOpened) return 3;
      if (calcDaysLeft(c.openDate) <= 0) return 0;
      if (!c.isSealed) return 1;
      return 2;
    };
    return score(a) - score(b);
  });

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
          {/* 봉인된 캡슐 수 배지 */}
          {sealedCount > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-indigo-100 text-indigo-700 font-semibold shrink-0">
              봉인 {sealedCount}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground mr-1">
            {totalCapsules}/30
          </span>
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-2">
            {/* 다음 개봉일 안내 */}
            {nextOpenDate && (
              <p className="text-[10px] text-muted-foreground px-0.5">
                다음 개봉일: {formatDate(nextOpenDate)} (D-
                {Math.max(0, calcDaysLeft(nextOpenDate))})
              </p>
            )}

            {/* 캡슐 목록 */}
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

            {/* 구분선 */}
            {capsules.length > 0 && (
              <div className="border-t border-border/40" />
            )}

            {/* 캡슐 생성 버튼 */}
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
          </div>
        )}
      </div>

      {/* 캡슐 생성 다이얼로그 */}
      <CreateCapsuleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createCapsule}
        totalCount={totalCapsules}
      />
    </>
  );
}
