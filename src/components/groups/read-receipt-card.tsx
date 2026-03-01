"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Users,
  Eye,
  EyeOff,
  AlertTriangle,
  Bell,
  Info,
  BarChart2,
  UserCheck,
  UserX,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReadReceipt } from "@/hooks/use-read-receipt";
import type { ReadReceiptPriority, ReadReceiptAnnouncement } from "@/types";

// ─── 우선순위 메타 ─────────────────────────────────────────────
const PRIORITY_META: Record<
  ReadReceiptPriority,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  urgent: {
    label: "긴급",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  important: {
    label: "중요",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: <Bell className="h-3 w-3" />,
  },
  normal: {
    label: "일반",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: <Info className="h-3 w-3" />,
  },
};

// ─── 시간 포맷 ─────────────────────────────────────────────────
function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── 멤버 입력 컴포넌트 ───────────────────────────────────────
function MemberTagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (members: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  const addMember = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      toast.error(TOAST.READ_RECEIPT.MEMBER_EXISTS);
      return;
    }
    onChange([...value, trimmed]);
    setInputVal("");
  };

  const removeMember = (name: string) => {
    onChange(value.filter((m) => m !== name));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <Input
          className="h-8 text-xs flex-1"
          placeholder="멤버 이름 입력 후 추가"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addMember();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs px-2"
          onClick={addMember}
        >
          추가
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full"
            >
              {name}
              <button
                type="button"
                onClick={() => removeMember(name)}
                className="hover:text-blue-900 ml-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 공지 작성/수정 다이얼로그 ─────────────────────────────────
function AnnouncementFormDialog({
  mode,
  initial,
  onSubmit,
  trigger,
}: {
  mode: "add" | "edit";
  initial?: ReadReceiptAnnouncement;
  onSubmit: (params: {
    title: string;
    content: string;
    author: string;
    priority: ReadReceiptPriority;
    targetMembers: string[];
  }) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [priority, setPriority] = useState<ReadReceiptPriority>(
    initial?.priority ?? "normal"
  );
  const [targetMembers, setTargetMembers] = useState<string[]>(
    initial?.targetMembers ?? []
  );

  const handleOpen = (v: boolean) => {
    if (v) {
      setTitle(initial?.title ?? "");
      setContent(initial?.content ?? "");
      setAuthor(initial?.author ?? "");
      setPriority(initial?.priority ?? "normal");
      setTargetMembers(initial?.targetMembers ?? []);
    }
    setOpen(v);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.READ_RECEIPT.TITLE_REQUIRED);
      return;
    }
    if (!content.trim()) {
      toast.error(TOAST.READ_RECEIPT.CONTENT_REQUIRED);
      return;
    }
    if (targetMembers.length === 0) {
      toast.error(TOAST.READ_RECEIPT.TARGET_REQUIRED);
      return;
    }
    onSubmit({ title, content, author, priority, targetMembers });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "add" ? "공지 등록" : "공지 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="공지 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">내용 *</Label>
            <Textarea
              className="text-xs resize-none"
              placeholder="공지 내용을 입력하세요"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">작성자</Label>
              <Input
                className="h-8 text-xs"
                placeholder="이름 (선택)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">중요도</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as ReadReceiptPriority)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent" className="text-xs">
                    <span className="text-red-600 font-medium">긴급</span>
                  </SelectItem>
                  <SelectItem value="important" className="text-xs">
                    <span className="text-orange-600 font-medium">중요</span>
                  </SelectItem>
                  <SelectItem value="normal" className="text-xs">
                    일반
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">대상 멤버 *</Label>
            <MemberTagInput value={targetMembers} onChange={setTargetMembers} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              {mode === "add" ? "등록" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 읽음 현황 다이얼로그 ─────────────────────────────────────
function ReadStatusDialog({
  announcement,
  readMembers,
  unreadMembers,
  readRate,
}: {
  announcement: ReadReceiptAnnouncement;
  readMembers: { memberName: string; readAt: string }[];
  unreadMembers: string[];
  readRate: number;
}) {
  const [open, setOpen] = useState(false);
  const meta = PRIORITY_META[announcement.priority];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-5 text-[10px] px-2 gap-0.5 border-gray-300"
          title="읽음 현황 보기"
        >
          <BarChart2 className="h-2.5 w-2.5" />
          현황
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm truncate">{announcement.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* 읽음률 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium">읽음률</span>
              <span className={`font-bold ${readRate >= 80 ? "text-green-600" : readRate >= 50 ? "text-orange-500" : "text-red-500"}`}>
                {readRate}%
              </span>
            </div>
            <Progress value={readRate} className="h-2" />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>{readMembers.length}명 읽음</span>
              <span>{unreadMembers.length}명 미읽음</span>
            </div>
          </div>

          {/* 중요도 */}
          <div className="flex items-center gap-1.5">
            <Badge
              className={`text-[10px] px-1.5 py-0 gap-0.5 ${meta.bg} ${meta.color} border ${meta.border}`}
            >
              {meta.icon}
              {meta.label}
            </Badge>
            <span className="text-[10px] text-gray-500">{formatRelativeTime(announcement.createdAt)}</span>
            {announcement.author && (
              <span className="text-[10px] text-gray-500">· {announcement.author}</span>
            )}
          </div>

          {/* 읽음 멤버 */}
          {readMembers.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs font-semibold text-green-700">
                <UserCheck className="h-3 w-3" />
                읽은 멤버 ({readMembers.length})
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {readMembers.map((r) => (
                  <div
                    key={r.memberName}
                    className="flex items-center justify-between text-[10px] px-2 py-1 bg-green-50 rounded border border-green-100"
                  >
                    <span className="font-medium text-green-800">{r.memberName}</span>
                    <span className="text-green-600">{formatDateTime(r.readAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 미읽음 멤버 */}
          {unreadMembers.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs font-semibold text-red-700">
                <UserX className="h-3 w-3" />
                미읽은 멤버 ({unreadMembers.length})
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {unreadMembers.map((name) => (
                  <span
                    key={name}
                    className="text-[10px] px-1.5 py-0.5 bg-red-50 border border-red-100 text-red-700 rounded-full"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 공지 아이템 ──────────────────────────────────────────────
function AnnouncementItem({
  announcement,
  currentMemberName,
  readRate,
  readMembers,
  unreadMembers,
  isRead,
  onMarkAsRead,
  onUnmarkAsRead,
  onDelete,
  onEdit,
}: {
  announcement: ReadReceiptAnnouncement;
  currentMemberName?: string;
  readRate: number;
  readMembers: { memberName: string; readAt: string }[];
  unreadMembers: string[];
  isRead: boolean;
  onMarkAsRead: () => void;
  onUnmarkAsRead: () => void;
  onDelete: () => void;
  onEdit: (params: {
    title: string;
    content: string;
    author: string;
    priority: ReadReceiptPriority;
    targetMembers: string[];
  }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = PRIORITY_META[announcement.priority];
  const isLong =
    announcement.content.split("\n").length > 2 || announcement.content.length > 120;
  const previewContent =
    isLong && !expanded
      ? announcement.content.slice(0, 120).trimEnd() + "…"
      : announcement.content;

  const handleRead = () => {
    onMarkAsRead();
    toast.success(TOAST.READ_RECEIPT.READ_MARKED);
  };

  const handleUnread = () => {
    onUnmarkAsRead();
    toast.success(TOAST.READ_RECEIPT.READ_CANCELLED);
  };

  const handleDelete = () => {
    onDelete();
    toast.success(TOAST.READ_RECEIPT.NOTICE_DELETED);
  };

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-colors ${meta.bg} ${meta.border}`}
    >
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`text-xs font-semibold truncate ${meta.color}`}>
            {announcement.title}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Badge
            className={`text-[10px] px-1.5 py-0 gap-0.5 ${meta.bg} ${meta.color} border ${meta.border}`}
          >
            {meta.icon}
            {meta.label}
          </Badge>
          <AnnouncementFormDialog
            mode="edit"
            initial={announcement}
            onSubmit={onEdit}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600"
                title="수정"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-red-400 hover:text-red-600"
            onClick={handleDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 내용 */}
      <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
        {previewContent}
        {isLong && (
          <button
            className="ml-1 text-blue-500 hover:underline text-[10px]"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "접기" : "더보기"}
          </button>
        )}
      </div>

      {/* 읽음률 프로그레스 */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-0.5">
            <Users className="h-2.5 w-2.5" />
            대상 {announcement.targetMembers.length}명
          </span>
          <span
            className={`font-semibold ${
              readRate >= 80
                ? "text-green-600"
                : readRate >= 50
                ? "text-orange-500"
                : "text-red-500"
            }`}
          >
            {readRate}% 읽음
          </span>
        </div>
        <Progress value={readRate} className="h-1.5" />
      </div>

      {/* 하단: 작성자·시간·액션 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          {announcement.author && (
            <>
              <span className="font-medium">{announcement.author}</span>
              <span>·</span>
            </>
          )}
          <span>{formatRelativeTime(announcement.createdAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Eye className="h-2.5 w-2.5" />
            {readMembers.length}/{announcement.targetMembers.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ReadStatusDialog
            announcement={announcement}
            readMembers={readMembers}
            unreadMembers={unreadMembers}
            readRate={readRate}
          />
          {currentMemberName && !isRead && (
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[10px] px-2 gap-0.5 border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={handleRead}
            >
              <CheckCheck className="h-2.5 w-2.5" />
              읽음
            </Button>
          )}
          {currentMemberName && isRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] px-2 gap-0.5 text-green-600 hover:text-gray-500"
              onClick={handleUnread}
              title="읽음 취소"
            >
              <CheckCheck className="h-2.5 w-2.5" />
              읽음 완료
            </Button>
          )}
          {!currentMemberName && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <EyeOff className="h-2.5 w-2.5" />
              {unreadMembers.length}명 미읽음
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 통계 칩 ───────────────────────────────────────────────────
function StatChip({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  return (
    <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg ${color}`}>
      <span className="text-sm font-bold leading-none">
        {value}
        {suffix && <span className="text-xs font-normal ml-0.5">{suffix}</span>}
      </span>
      <span className="text-[10px] text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}

// ─── 메인 카드 컴포넌트 ───────────────────────────────────────
export function ReadReceiptCard({
  groupId,
  currentMemberName,
}: {
  groupId: string;
  currentMemberName?: string;
}) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "urgent" | "unread">("all");

  const {
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    markAsRead,
    unmarkAsRead,
    getReadRate,
    getUnreadMembers,
    getReadMembers,
    isReadByMember,
    stats,
  } = useReadReceipt(groupId);

  // 현재 멤버 기준 미읽음 공지 수
  const myUnreadCount = useMemo(() => {
    if (!currentMemberName) return 0;
    return announcements.filter(
      (a) => a.targetMembers.includes(currentMemberName) && !isReadByMember(a.id, currentMemberName)
    ).length;
  }, [announcements, currentMemberName, isReadByMember]);

  // 탭별 목록
  const displayList = useMemo((): ReadReceiptAnnouncement[] => {
    const sorted = [...announcements].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (activeTab === "urgent") return sorted.filter((a) => a.priority === "urgent");
    if (activeTab === "unread" && currentMemberName)
      return sorted.filter(
        (a) =>
          a.targetMembers.includes(currentMemberName) &&
          !isReadByMember(a.id, currentMemberName)
      );
    return sorted;
  }, [activeTab, announcements, currentMemberName, isReadByMember]);

  const TABS = [
    { key: "all" as const, label: "전체", count: stats.total },
    { key: "urgent" as const, label: "긴급", count: stats.urgentCount },
    ...(currentMemberName
      ? [{ key: "unread" as const, label: "내 미읽음", count: myUnreadCount }]
      : []),
  ];

  const handleAdd = (params: {
    title: string;
    content: string;
    author: string;
    priority: ReadReceiptPriority;
    targetMembers: string[];
  }) => {
    addAnnouncement(params);
    toast.success(TOAST.READ_RECEIPT.NOTICE_REGISTERED);
  };

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <CheckCheck className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm">공지 읽음 확인</CardTitle>
                {open ? (
                  <ChevronUp className="h-3 w-3 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                )}
                {myUnreadCount > 0 && !open && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-500 text-white border-0 ml-1">
                    {myUnreadCount}
                  </Badge>
                )}
              </button>
            </CollapsibleTrigger>
            <AnnouncementFormDialog
              mode="add"
              onSubmit={handleAdd}
              trigger={
                <Button size="sm" className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" />
                  공지 등록
                </Button>
              }
            />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* 통계 행 */}
            <div className="flex gap-2 flex-wrap">
              <StatChip label="전체" value={stats.total} color="bg-blue-50" />
              <StatChip label="긴급" value={stats.urgentCount} color="bg-red-50" />
              <StatChip label="중요" value={stats.importantCount} color="bg-orange-50" />
              <StatChip
                label="평균 읽음률"
                value={stats.avgReadRate}
                color="bg-green-50"
                suffix="%"
              />
            </div>

            {/* 탭 필터 */}
            <div className="flex gap-1 flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                    activeTab === tab.key
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-background text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`ml-1 font-semibold ${
                        activeTab === tab.key ? "text-white" : "text-blue-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 공지 목록 */}
            {displayList.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">
                <CheckCheck className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                {activeTab === "all"
                  ? "등록된 공지가 없습니다."
                  : activeTab === "urgent"
                  ? "긴급 공지가 없습니다."
                  : "미읽은 공지가 없습니다."}
              </div>
            ) : (
              <div className="space-y-2">
                {displayList.map((item) => (
                  <AnnouncementItem
                    key={item.id}
                    announcement={item}
                    currentMemberName={currentMemberName}
                    readRate={getReadRate(item.id)}
                    readMembers={getReadMembers(item.id)}
                    unreadMembers={getUnreadMembers(item.id)}
                    isRead={
                      currentMemberName
                        ? isReadByMember(item.id, currentMemberName)
                        : false
                    }
                    onMarkAsRead={() => {
                      if (currentMemberName) markAsRead(item.id, currentMemberName);
                    }}
                    onUnmarkAsRead={() => {
                      if (currentMemberName) unmarkAsRead(item.id, currentMemberName);
                    }}
                    onDelete={() => deleteAnnouncement(item.id)}
                    onEdit={(params) =>
                      updateAnnouncement(item.id, params)
                    }
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
