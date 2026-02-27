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
import type { TimeCapsuleMessage } from "@/types";

// ============================================
// 날짜 포맷 헬퍼
// ============================================

function formatDate(isoOrDate: string): string {
  const d = new Date(isoOrDate);
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
  return (
    <span className="text-[10px] font-mono font-semibold px-1.5 py-0 rounded bg-blue-100 text-blue-700 shrink-0">
      {label}
    </span>
  );
}

// ============================================
// 서브 컴포넌트: 대기 중 캡슐 행
// ============================================

function PendingCapsuleRow({
  capsule,
  onDelete,
}: {
  capsule: TimeCapsuleMessage;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="py-2 px-2.5 rounded-md border border-border/60 bg-muted/30 group space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground flex-1 truncate">
          {capsule.author}
        </span>
        <DDayBadge openDate={capsule.openDate} />
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatDate(capsule.openDate)} 개봉
        </span>
        <button
          type="button"
          onClick={() => onDelete(capsule.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          aria-label="캡슐 삭제"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
        </button>
      </div>
      {/* 메시지 블러 처리 */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 blur-[3px] select-none pointer-events-none">
        {capsule.message}
      </p>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 개봉 가능 캡슐 행
// ============================================

function AvailableCapsuleRow({
  capsule,
  onOpen,
  onDelete,
}: {
  capsule: TimeCapsuleMessage;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (capsule.isOpened) {
    // 이미 열린 캡슐: 메시지 전문 표시
    return (
      <div className="py-2 px-2.5 rounded-md border border-green-200/70 bg-green-50/50 group space-y-1.5">
        <div className="flex items-center gap-1.5">
          <LockOpen className="h-3 w-3 text-green-600 shrink-0" />
          <span className="text-xs font-medium text-green-800 flex-1 truncate">
            {capsule.author}
          </span>
          <span className="text-[10px] text-green-600 shrink-0">
            {formatDate(capsule.openDate)} 개봉
          </span>
          <button
            type="button"
            onClick={() => onDelete(capsule.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            aria-label="캡슐 삭제"
          >
            <Trash2 className="h-3 w-3 text-green-600 hover:text-red-500" />
          </button>
        </div>
        <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">
          {capsule.message}
        </p>
        <p className="text-[10px] text-green-600">
          작성일: {formatDate(capsule.createdAt)}
        </p>
      </div>
    );
  }

  // 개봉 가능하지만 아직 열지 않은 캡슐
  return (
    <div className="py-2 px-2.5 rounded-md border border-amber-200/70 bg-amber-50/50 group space-y-1.5">
      <div className="flex items-center gap-1.5">
        <PackageOpen className="h-3 w-3 text-amber-600 shrink-0" />
        <span className="text-xs font-medium text-amber-800 flex-1 truncate">
          {capsule.author}
        </span>
        <span className="text-[10px] text-amber-600 shrink-0">
          {formatDate(capsule.openDate)} 개봉 가능
        </span>
        <button
          type="button"
          onClick={() => onDelete(capsule.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          aria-label="캡슐 삭제"
        >
          <Trash2 className="h-3 w-3 text-amber-600 hover:text-red-500" />
        </button>
      </div>
      {/* 개봉 전: 메시지 블러 */}
      <p className="text-xs text-amber-800 leading-relaxed line-clamp-2 blur-[3px] select-none pointer-events-none">
        {capsule.message}
      </p>
      <Button
        type="button"
        size="sm"
        className="h-7 text-xs w-full bg-amber-500 hover:bg-amber-600 text-white"
        onClick={() => onOpen(capsule.id)}
      >
        <LockOpen className="h-3 w-3 mr-1" />
        개봉하기
      </Button>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 추가 다이얼로그
// ============================================

function AddCapsuleDialog({
  open,
  onOpenChange,
  onAdd,
  totalCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (params: { author: string; message: string; openDate: string }) => boolean;
  totalCount: number;
}) {
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [openDate, setOpenDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);

  const reset = () => {
    setAuthor("");
    setMessage("");
    setOpenDate(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!author.trim()) {
      toast.error("작성자 이름을 입력해주세요.");
      return;
    }
    if (!message.trim()) {
      toast.error("메시지 내용을 입력해주세요.");
      return;
    }
    if (!openDate) {
      toast.error("개봉일을 선택해주세요.");
      return;
    }

    const openDateStr = dateToYMD(openDate);

    const success = onAdd({
      author: author.trim(),
      message: message.trim(),
      openDate: openDateStr,
    });

    if (!success) {
      toast.error("타임캡슐은 최대 20개까지 저장할 수 있습니다.");
      return;
    }

    toast.success("타임캡슐이 작성되었습니다.");
    reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // 오늘 이후 날짜만 선택 가능 (개봉일은 미래)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-500" />
            타임캡슐 작성
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 작성자 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              작성자
            </label>
            <Input
              placeholder="이름 입력"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="h-8 text-xs"
              maxLength={30}
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

          {/* 메시지 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              메시지
            </label>
            <Textarea
              placeholder="미래의 그룹 멤버들에게 전할 메시지를 작성해주세요."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs resize-none min-h-[100px]"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>

          {totalCount >= 20 && (
            <p className="text-[10px] text-destructive">
              최대 20개까지 저장할 수 있습니다.
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
              disabled={totalCount >= 20}
            >
              작성 완료
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    capsules,
    addCapsule,
    deleteCapsule,
    openCapsule,
    getAvailableCapsules,
    getPendingCapsules,
  } = useTimeCapsule(groupId);

  const available = getAvailableCapsules();
  const pending = getPendingCapsules();

  const handleOpen = (id: string) => {
    openCapsule(id);
    toast.success("타임캡슐이 개봉되었습니다!");
  };

  const handleDelete = (id: string) => {
    deleteCapsule(id);
    toast.success("타임캡슐이 삭제되었습니다.");
  };

  return (
    <>
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* 헤더 - Collapsible 토글 */}
        <button
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
        >
          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="text-xs font-medium flex-1">그룹 타임캡슐</span>
          <span className="text-[10px] text-muted-foreground mr-1">
            {capsules.length}/20
          </span>
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-2">
            {/* 개봉 가능 섹션 */}
            {available.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground px-0.5">
                  개봉 가능 ({available.length})
                </p>
                {available.map((c) => (
                  <AvailableCapsuleRow
                    key={c.id}
                    capsule={c}
                    onOpen={handleOpen}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* 대기 중 섹션 */}
            {pending.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground px-0.5">
                  대기 중 ({pending.length})
                </p>
                {pending.map((c) => (
                  <PendingCapsuleRow
                    key={c.id}
                    capsule={c}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* 캡슐이 없을 때 */}
            {capsules.length === 0 && (
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

            {/* 추가 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setDialogOpen(true)}
              disabled={capsules.length >= 20}
            >
              <Plus className="h-3 w-3" />
              타임캡슐 작성
              {capsules.length >= 20 && (
                <span className="ml-auto text-[10px] text-destructive">
                  최대 도달
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* 추가 다이얼로그 */}
      <AddCapsuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addCapsule}
        totalCount={capsules.length}
      />
    </>
  );
}
