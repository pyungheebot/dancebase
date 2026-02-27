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
  CheckCheck,
  Eye,
  AlertTriangle,
  Info,
  Bell,
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
import type { AnnouncementPriority, GroupAnnouncementEntry } from "@/types";

// ─── 우선순위 메타 ─────────────────────────────────────────────
const PRIORITY_META: Record<
  AnnouncementPriority,
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

// ─── 공지 작성 다이얼로그 ──────────────────────────────────────
function AddAnnouncementDialog({
  onAdd,
}: {
  onAdd: (
    title: string,
    content: string,
    author: string,
    priority: AnnouncementPriority,
    tags: string[]
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [tagsInput, setTagsInput] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onAdd(title.trim(), content.trim(), author.trim(), priority, tags);
    toast.success("공지가 등록되었습니다.");
    setTitle("");
    setContent("");
    setAuthor("");
    setPriority("normal");
    setTagsInput("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          공지 작성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">공지 작성</DialogTitle>
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
              <Label className="text-xs">우선순위</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as AnnouncementPriority)}
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
            <Label className="text-xs">태그 (쉼표로 구분)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 연습, 공연, 중요"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
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
              등록
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 공지 아이템 ──────────────────────────────────────────────
function AnnouncementItem({
  entry,
  currentMemberName,
  onTogglePin,
  onDelete,
  onMarkAsRead,
}: {
  entry: GroupAnnouncementEntry;
  currentMemberName?: string;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAsRead: (id: string, memberName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = PRIORITY_META[entry.priority];
  const isRead =
    currentMemberName ? entry.readBy.includes(currentMemberName) : false;

  const contentLines = entry.content.split("\n");
  const isLong = contentLines.length > 2 || entry.content.length > 100;
  const previewContent =
    isLong && !expanded
      ? entry.content.slice(0, 100).trimEnd() + "…"
      : entry.content;

  const handleRead = () => {
    if (!currentMemberName) return;
    onMarkAsRead(entry.id, currentMemberName);
    toast.success("읽음으로 표시했습니다.");
  };

  const handleDelete = () => {
    onDelete(entry.id);
    toast.success("공지를 삭제했습니다.");
  };

  const handlePin = () => {
    onTogglePin(entry.id);
    toast.success(entry.pinned ? "고정을 해제했습니다." : "공지를 고정했습니다.");
  };

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-colors ${
        entry.pinned ? "bg-amber-50 border-amber-200" : `${meta.bg} ${meta.border}`
      }`}
    >
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {entry.pinned && (
            <Pin className="h-3 w-3 text-amber-500 shrink-0" />
          )}
          <span className={`text-xs font-semibold truncate ${meta.color}`}>
            {entry.title}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* 우선순위 배지 */}
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
            title={entry.pinned ? "고정 해제" : "고정"}
          >
            {entry.pinned ? (
              <PinOff className="h-3 w-3 text-amber-500" />
            ) : (
              <Pin className="h-3 w-3 text-gray-400" />
            )}
          </Button>
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

      {/* 태그 */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0 bg-white border border-gray-200 rounded-full text-gray-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 하단: 작성자·시간·읽은 사람·읽음 버튼 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="font-medium">{entry.author}</span>
          <span>·</span>
          <span>{formatRelativeTime(entry.createdAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Eye className="h-2.5 w-2.5" />
            {entry.readBy.length}명 읽음
          </span>
        </div>
        {currentMemberName && !isRead && (
          <Button
            variant="outline"
            size="sm"
            className="h-5 text-[10px] px-2 gap-0.5 border-gray-300"
            onClick={handleRead}
          >
            <CheckCheck className="h-2.5 w-2.5" />
            읽음
          </Button>
        )}
        {currentMemberName && isRead && (
          <span className="text-[10px] text-green-600 flex items-center gap-0.5">
            <CheckCheck className="h-2.5 w-2.5" />
            읽음
          </span>
        )}
      </div>
    </div>
  );
}

// ─── 통계 배지 ─────────────────────────────────────────────────
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
  currentMemberName,
}: {
  groupId: string;
  currentMemberName?: string;
}) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pinned" | "urgent" | "unread">(
    "all"
  );

  const {
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    togglePin,
    markAsRead,
    getUnreadCount,
    getPinned,
    totalAnnouncements,
    pinnedCount,
    urgentCount,
  } = useGroupAnnouncement(groupId);

  const unreadCount = useMemo(
    () => getUnreadCount(currentMemberName ?? ""),
    [getUnreadCount, currentMemberName]
  );

  // 탭별 목록
  const displayList = useMemo((): GroupAnnouncementEntry[] => {
    if (activeTab === "pinned") return getPinned();
    if (activeTab === "urgent")
      return [...announcements]
        .filter((a) => a.priority === "urgent")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    if (activeTab === "unread" && currentMemberName)
      return [...announcements]
        .filter((a) => !a.readBy.includes(currentMemberName))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    // all: 고정 공지는 상단, 나머지는 최신순
    const pinned = [...announcements]
      .filter((a) => a.pinned)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    const normal = [...announcements]
      .filter((a) => !a.pinned)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return [...pinned, ...normal];
  }, [activeTab, announcements, getPinned, currentMemberName]);

  const TABS = [
    { key: "all" as const, label: "전체", count: totalAnnouncements },
    { key: "pinned" as const, label: "고정", count: pinnedCount },
    { key: "urgent" as const, label: "긴급", count: urgentCount },
    ...(currentMemberName
      ? [{ key: "unread" as const, label: "미읽음", count: unreadCount }]
      : []),
  ];

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
            <AddAnnouncementDialog onAdd={addAnnouncement} />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* 통계 행 */}
            <div className="flex gap-2">
              <StatChip label="전체" value={totalAnnouncements} color="bg-blue-50" />
              <StatChip label="고정" value={pinnedCount} color="bg-amber-50" />
              <StatChip label="긴급" value={urgentCount} color="bg-red-50" />
              {currentMemberName && (
                <StatChip label="미읽음" value={unreadCount} color="bg-gray-50" />
              )}
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
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
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
                <Megaphone className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                {activeTab === "all"
                  ? "등록된 공지가 없습니다."
                  : activeTab === "pinned"
                  ? "고정된 공지가 없습니다."
                  : activeTab === "urgent"
                  ? "긴급 공지가 없습니다."
                  : "미읽은 공지가 없습니다."}
              </div>
            ) : (
              <div className="space-y-2">
                {/* all 탭일 때 고정 섹션 표시 */}
                {activeTab === "all" && pinnedCount > 0 && (
                  <>
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                      <Pin className="h-2.5 w-2.5" />
                      고정 공지
                    </div>
                    {displayList
                      .filter((a) => a.pinned)
                      .map((entry) => (
                        <AnnouncementItem
                          key={entry.id}
                          entry={entry}
                          currentMemberName={currentMemberName}
                          onTogglePin={togglePin}
                          onDelete={deleteAnnouncement}
                          onMarkAsRead={markAsRead}
                        />
                      ))}
                    {displayList.some((a) => !a.pinned) && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold pt-1">
                        <Bell className="h-2.5 w-2.5" />
                        일반 공지
                      </div>
                    )}
                    {displayList
                      .filter((a) => !a.pinned)
                      .map((entry) => (
                        <AnnouncementItem
                          key={entry.id}
                          entry={entry}
                          currentMemberName={currentMemberName}
                          onTogglePin={togglePin}
                          onDelete={deleteAnnouncement}
                          onMarkAsRead={markAsRead}
                        />
                      ))}
                  </>
                )}

                {/* all 탭이지만 고정 없을 때, 또는 다른 탭 */}
                {(activeTab !== "all" ||
                  pinnedCount === 0) &&
                  displayList.map((entry) => (
                    <AnnouncementItem
                      key={entry.id}
                      entry={entry}
                      currentMemberName={currentMemberName}
                      onTogglePin={togglePin}
                      onDelete={deleteAnnouncement}
                      onMarkAsRead={markAsRead}
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
