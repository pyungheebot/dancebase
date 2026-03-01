"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Megaphone,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pin,
  PinOff,
  AlertTriangle,
  Info,
  Bell,
  Search,
  Pencil,
  Paperclip,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useGroupAnnouncement } from "@/hooks/use-group-announcement";
import type { GroupAnnouncementItem, GroupAnnouncementPriority } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";

// ─── 우선순위 메타 ─────────────────────────────────────────────
const PRIORITY_META: Record<
  GroupAnnouncementPriority,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
  }
> = {
  urgent: {
    label: "긴급",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-300",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  normal: {
    label: "일반",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: <Info className="h-3 w-3" />,
  },
  low: {
    label: "낮음",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Bell className="h-3 w-3" />,
  },
};

// ─── 날짜 포맷 ─────────────────────────────────────────────────
function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

// ─── 공지 작성/수정 다이얼로그 ──────────────────────────────────
function AnnouncementFormDialog({
  trigger,
  initial,
  onSubmit,
}: {
  trigger: React.ReactNode;
  initial?: Partial<GroupAnnouncementItem>;
  onSubmit: (data: {
    title: string;
    content: string;
    authorName: string;
    priority: GroupAnnouncementPriority;
    expiresAt: string | null;
    attachmentUrl: string | null;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [authorName, setAuthorName] = useState(initial?.authorName ?? "");
  const [priority, setPriority] = useState<GroupAnnouncementPriority>(
    initial?.priority ?? "normal"
  );
  const [expiresAt, setExpiresAt] = useState(
    initial?.expiresAt
      ? initial.expiresAt.slice(0, 10)
      : ""
  );
  const [attachmentUrl, setAttachmentUrl] = useState(
    initial?.attachmentUrl ?? ""
  );

  const resetForm = () => {
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
    setAuthorName(initial?.authorName ?? "");
    setPriority(initial?.priority ?? "normal");
    setExpiresAt(initial?.expiresAt ? initial.expiresAt.slice(0, 10) : "");
    setAttachmentUrl(initial?.attachmentUrl ?? "");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      authorName: authorName.trim(),
      priority,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      attachmentUrl: attachmentUrl.trim() || null,
    });
    resetForm();
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const isEdit = !!initial?.id;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEdit ? "공지 수정" : "공지 작성"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="공지 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 내용 */}
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

          {/* 작성자 / 우선순위 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">작성자</Label>
              <Input
                className="h-8 text-xs"
                placeholder="이름 (선택)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">우선순위</Label>
              <Select
                value={priority}
                onValueChange={(v) =>
                  setPriority(v as GroupAnnouncementPriority)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent" className="text-xs">
                    <span className="text-red-600 font-medium">긴급</span>
                  </SelectItem>
                  <SelectItem value="normal" className="text-xs">
                    일반
                  </SelectItem>
                  <SelectItem value="low" className="text-xs">
                    <span className="text-blue-600">낮음</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 만료일 */}
          <div className="space-y-1">
            <Label className="text-xs">만료일 (선택)</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {/* 첨부 URL */}
          <div className="space-y-1">
            <Label className="text-xs">첨부 URL (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="https://..."
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
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
              {isEdit ? "수정" : "등록"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 공지 단일 아이템 ─────────────────────────────────────────
function AnnouncementRow({
  item,
  onTogglePin,
  onDelete,
  onUpdate,
}: {
  item: GroupAnnouncementItem;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (
    id: string,
    patch: Partial<Omit<GroupAnnouncementItem, "id" | "createdAt">>
  ) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = PRIORITY_META[item.priority];
  const isUrgent = item.priority === "urgent";

  const isLong = item.content.length > 120 || item.content.includes("\n");
  const previewContent =
    isLong && !expanded
      ? item.content.slice(0, 120).trimEnd() + "…"
      : item.content;

  const handlePin = () => {
    onTogglePin(item.id);
    toast.success(item.isPinned ? "고정을 해제했습니다." : "공지를 고정했습니다.");
  };

  const handleDelete = () => {
    onDelete(item.id);
    toast.success("공지를 삭제했습니다.");
  };

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-colors ${
        isUrgent
          ? "border-red-300 bg-red-50"
          : item.isPinned
          ? "border-amber-200 bg-amber-50"
          : `${meta.bg} ${meta.border}`
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {item.isPinned && (
            <Pin className="h-3 w-3 text-amber-500 shrink-0" />
          )}
          {isUrgent && (
            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
          )}
          <span
            className={`text-xs font-semibold truncate ${meta.color}`}
          >
            {item.title}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            className={`text-[10px] px-1.5 py-0 gap-0.5 ${meta.bg} ${meta.color} border ${meta.border}`}
          >
            {meta.icon}
            {meta.label}
          </Badge>
          {/* 고정 토글 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={handlePin}
            title={item.isPinned ? "고정 해제" : "고정"}
          >
            {item.isPinned ? (
              <PinOff className="h-3 w-3 text-amber-500" />
            ) : (
              <Pin className="h-3 w-3 text-gray-400" />
            )}
          </Button>
          {/* 수정 */}
          <AnnouncementFormDialog
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
            initial={item}
            onSubmit={(data) => {
              onUpdate(item.id, data);
              toast.success("공지를 수정했습니다.");
            }}
          />
          {/* 삭제 */}
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

      {/* 첨부 URL */}
      {item.attachmentUrl && (
        <a
          href={item.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline"
        >
          <Paperclip className="h-2.5 w-2.5" />
          첨부 파일 보기
        </a>
      )}

      {/* 하단 메타 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="font-medium">{item.authorName}</span>
          <span>·</span>
          <span>{formatRelativeTime(item.createdAt)}</span>
        </div>
        {item.expiresAt && (
          <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <Clock className="h-2.5 w-2.5" />
            {formatMonthDay(item.expiresAt)} 만료
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 통계 칩 ──────────────────────────────────────────────────
function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg ${color}`}>
      <span className="text-sm font-bold leading-none">{value}</span>
      <span className="text-[10px] text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}

// ─── 메인 카드 컴포넌트 ───────────────────────────────────────
export function GroupAnnouncementCard({
  groupId,
}: {
  groupId: string;
}) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [showExpired, setShowExpired] = useState(false);

  const {
    announcements,
    expiredAnnouncements,
    loading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
    totalAnnouncements,
    pinnedCount,
    urgentCount,
    expiredCount,
  } = useGroupAnnouncement(groupId);

  // 검색 필터 적용
  const filteredActive = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...announcements].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    if (!q) return list;
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q)
    );
  }, [announcements, search]);

  const filteredExpired = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expiredAnnouncements;
    return expiredAnnouncements.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q)
    );
  }, [expiredAnnouncements, search]);

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <Megaphone className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm">그룹 공지 보드</CardTitle>
                {open ? (
                  <ChevronUp className="h-3 w-3 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                )}
              </button>
            </CollapsibleTrigger>
            <AnnouncementFormDialog
              trigger={
                <Button size="sm" className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" />
                  공지 작성
                </Button>
              }
              onSubmit={(data) => {
                createAnnouncement(data);
                toast.success("공지가 등록되었습니다.");
              }}
            />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* 통계 행 */}
            <div className="flex gap-2 flex-wrap">
              <StatChip label="전체" value={totalAnnouncements} color="bg-blue-50" />
              <StatChip label="고정" value={pinnedCount} color="bg-amber-50" />
              <StatChip label="긴급" value={urgentCount} color="bg-red-50" />
              <StatChip label="만료" value={expiredCount} color="bg-gray-100" />
            </div>

            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                className="h-7 text-xs pl-6"
                placeholder="공지 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* 활성 공지 목록 */}
            {loading ? (
              <div className="text-center py-6 text-xs text-gray-400">
                불러오는 중...
              </div>
            ) : filteredActive.length === 0 && !search ? (
              <div className="text-center py-6 text-xs text-gray-400">
                <Megaphone className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                등록된 공지가 없습니다.
              </div>
            ) : filteredActive.length === 0 && search ? (
              <div className="text-center py-4 text-xs text-gray-400">
                검색 결과가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {/* 고정 공지 섹션 구분선 */}
                {pinnedCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                    <Pin className="h-2.5 w-2.5" />
                    고정 공지
                  </div>
                )}
                {filteredActive.filter((a) => a.isPinned).map((item) => (
                  <AnnouncementRow
                    key={item.id}
                    item={item}
                    onTogglePin={togglePin}
                    onDelete={deleteAnnouncement}
                    onUpdate={updateAnnouncement}
                  />
                ))}
                {pinnedCount > 0 &&
                  filteredActive.some((a) => !a.isPinned) && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold pt-1">
                      <Bell className="h-2.5 w-2.5" />
                      일반 공지
                    </div>
                  )}
                {filteredActive.filter((a) => !a.isPinned).map((item) => (
                  <AnnouncementRow
                    key={item.id}
                    item={item}
                    onTogglePin={togglePin}
                    onDelete={deleteAnnouncement}
                    onUpdate={updateAnnouncement}
                  />
                ))}
              </div>
            )}

            {/* 만료된 공지 접기/펼치기 */}
            {expiredCount > 0 && (
              <div className="border-t pt-2">
                <button
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowExpired(!showExpired)}
                >
                  <ChevronRight
                    className={`h-3 w-3 transition-transform ${showExpired ? "rotate-90" : ""}`}
                  />
                  만료된 공지 {expiredCount}개
                </button>
                {showExpired && (
                  <div className="space-y-2 mt-2 opacity-60">
                    {filteredExpired.map((item) => (
                      <AnnouncementRow
                        key={item.id}
                        item={item}
                        onTogglePin={togglePin}
                        onDelete={deleteAnnouncement}
                        onUpdate={updateAnnouncement}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
