"use client";

import { useState, useCallback } from "react";
import {
  Megaphone,
  Pin,
  PinOff,
  Plus,
  Trash2,
  AlertCircle,
  CheckCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroupAnnouncements } from "@/hooks/use-group-announcements";
import type {
  GroupAnnouncementItem,
  GroupAnnouncementPriority,
  GroupAnnouncementInput,
} from "@/types";

// ============================================
// 우선순위 설정
// ============================================

const PRIORITY_LABELS: Record<GroupAnnouncementPriority, string> = {
  urgent: "긴급",
  normal: "일반",
  low: "낮음",
};

const PRIORITY_BADGE_CLASSES: Record<GroupAnnouncementPriority, string> = {
  urgent:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  normal:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

// ============================================
// 날짜 포맷
// ============================================

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ============================================
// 공지 작성 Dialog
// ============================================

const DEFAULT_INPUT: GroupAnnouncementInput = {
  title: "",
  content: "",
  priority: "normal",
  pinned: false,
};

function WriteAnnouncementDialog({
  onSubmit,
  disabled,
}: {
  onSubmit: (input: GroupAnnouncementInput) => boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState<GroupAnnouncementInput>(DEFAULT_INPUT);

  const handleSubmit = () => {
    const ok = onSubmit(input);
    if (ok) {
      setInput(DEFAULT_INPUT);
      setOpen(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setInput(DEFAULT_INPUT);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1" disabled={disabled}>
          <Plus className="h-3 w-3" />
          공지 작성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">공지사항 작성</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 제목 */}
          <div className="space-y-1.5">
            <Label className="text-xs">제목</Label>
            <Input
              value={input.title}
              onChange={(e) =>
                setInput((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="공지 제목을 입력하세요"
              className="text-sm h-8"
              maxLength={100}
            />
          </div>

          {/* 내용 */}
          <div className="space-y-1.5">
            <Label className="text-xs">내용</Label>
            <Textarea
              value={input.content}
              onChange={(e) =>
                setInput((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="공지 내용을 입력하세요"
              className="text-sm min-h-[120px] resize-none"
              maxLength={2000}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {input.content.length} / 2000
            </p>
          </div>

          {/* 우선순위 */}
          <div className="space-y-1.5">
            <Label className="text-xs">우선순위</Label>
            <RadioGroup
              value={input.priority}
              onValueChange={(v) =>
                setInput((prev) => ({
                  ...prev,
                  priority: v as GroupAnnouncementPriority,
                }))
              }
              className="flex gap-4"
            >
              {(
                ["urgent", "normal", "low"] as GroupAnnouncementPriority[]
              ).map((p) => (
                <div key={p} className="flex items-center gap-1.5">
                  <RadioGroupItem value={p} id={`priority-${p}`} />
                  <Label
                    htmlFor={`priority-${p}`}
                    className={`text-xs cursor-pointer px-1.5 py-0.5 rounded border ${PRIORITY_BADGE_CLASSES[p]}`}
                  >
                    {PRIORITY_LABELS[p]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 고정 여부 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="pinned-switch" className="text-xs cursor-pointer">
              상단 고정
            </Label>
            <Switch
              id="pinned-switch"
              size="sm"
              checked={input.pinned}
              onCheckedChange={(checked) =>
                setInput((prev) => ({ ...prev, pinned: checked }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!input.title.trim() || !input.content.trim()}
          >
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 공지 카드
// ============================================

function AnnouncementCard({
  item,
  isRead,
  onRead,
  onDelete,
  onTogglePin,
}: {
  item: GroupAnnouncementItem;
  isRead: boolean;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isUrgent = item.priority === "urgent";

  const handleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
    if (!isRead) onRead(item.id);
  }, [isRead, item.id, onRead]);

  const handleDeleteClick = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    onDelete(item.id);
  };

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-colors ${
        isUrgent
          ? "border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20"
          : "border-border bg-card"
      } ${!isRead ? "ring-1 ring-blue-400/30" : ""}`}
    >
      {/* 헤더 행 */}
      <div className="flex items-start gap-2">
        {/* 긴급 아이콘 */}
        {isUrgent && (
          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
        )}

        {/* 제목 + 배지 */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            {item.isPinned && (
              <Pin className="h-3 w-3 text-orange-500 shrink-0" />
            )}
            <span
              className={`text-xs font-medium truncate ${
                isUrgent ? "text-red-700 dark:text-red-300" : "text-foreground"
              } ${!isRead ? "font-semibold" : ""}`}
            >
              {item.title}
            </span>
            {!isRead && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              className={`text-[10px] px-1.5 py-0 border ${PRIORITY_BADGE_CLASSES[item.priority]}`}
            >
              {PRIORITY_LABELS[item.priority]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatDate(item.createdAt)}
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onTogglePin(item.id)}
            className="p-1 rounded hover:bg-muted transition-colors"
            title={item.isPinned ? "고정 해제" : "상단 고정"}
          >
            {item.isPinned ? (
              <PinOff className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Pin className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={handleDeleteClick}
            onBlur={() => setDeleteConfirm(false)}
            className={`p-1 rounded transition-colors ${
              deleteConfirm
                ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                : "hover:bg-muted text-muted-foreground"
            }`}
            title={deleteConfirm ? "한번 더 클릭하여 삭제" : "삭제"}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 내용 미리보기 / 전체 내용 */}
      <div
        className="cursor-pointer"
        onClick={handleExpand}
      >
        <p
          className={`text-xs text-muted-foreground whitespace-pre-wrap ${
            expanded ? "" : "line-clamp-2"
          }`}
        >
          {item.content}
        </p>
        {item.content.length > 80 && (
          <button className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground mt-1 transition-colors">
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                접기
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                더 보기
              </>
            )}
          </button>
        )}
      </div>

      {/* 삭제 확인 안내 */}
      {deleteConfirm && (
        <p className="text-[10px] text-red-500 dark:text-red-400">
          한번 더 클릭하면 삭제됩니다.
        </p>
      )}
    </div>
  );
}

// ============================================
// 메인 패널
// ============================================

export function GroupAnnouncementsPanel({ groupId }: { groupId: string }) {
  const {
    announcements,
    loading,
    unreadCount,
    readIds,
    addAnnouncement,
    deleteAnnouncement,
    togglePin,
    markAsRead,
    markAllAsRead,
    maxReached,
  } = useGroupAnnouncements(groupId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 relative"
        >
          <Megaphone className="h-3.5 w-3.5" />
          공지사항
          {unreadCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-red-500 text-white border-0 ml-0.5">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[380px] sm:w-[420px] p-0 flex flex-col">
        {/* 헤더 */}
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <SheetTitle className="text-sm">공지사항</SheetTitle>
              {announcements.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  ({announcements.length}개)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  title="모두 읽음 처리"
                >
                  <CheckCheck className="h-3 w-3" />
                  모두 읽음
                </button>
              )}
              <WriteAnnouncementDialog
                onSubmit={addAnnouncement}
                disabled={maxReached}
              />
            </div>
          </div>
          {maxReached && (
            <p className="text-[10px] text-muted-foreground">
              최대 50개까지 작성할 수 있습니다.
            </p>
          )}
        </SheetHeader>

        {/* 공지 목록 */}
        <ScrollArea className="flex-1 px-4 py-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg border bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Megaphone className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                등록된 공지사항이 없습니다.
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                공지 작성 버튼을 눌러 첫 공지를 등록해보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {announcements.map((item) => (
                <AnnouncementCard
                  key={item.id}
                  item={item}
                  isRead={readIds.has(item.id)}
                  onRead={markAsRead}
                  onDelete={deleteAnnouncement}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
