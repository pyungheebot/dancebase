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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Radio,
  AlertTriangle,
  Mic,
  Users,
  Cpu,
  MoreHorizontal,
  Zap,
  Star,
  Filter,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useLiveShowFeed } from "@/hooks/use-live-show-feed";
import type {
  LiveShowFeedEntry,
  LiveShowFeedType,
  LiveShowFeedPriority,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const TYPE_LABELS: Record<LiveShowFeedType, string> = {
  stage: "무대상황",
  backstage: "백스테이지",
  audience: "관객반응",
  technical: "기술이슈",
  other: "기타",
};

const TYPE_COLORS: Record<LiveShowFeedType, string> = {
  stage: "bg-purple-100 text-purple-700 border-purple-200",
  backstage: "bg-orange-100 text-orange-700 border-orange-200",
  audience: "bg-pink-100 text-pink-700 border-pink-200",
  technical: "bg-red-100 text-red-700 border-red-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

const TYPE_ICONS: Record<LiveShowFeedType, React.ReactNode> = {
  stage: <Mic className="h-3 w-3" />,
  backstage: <Radio className="h-3 w-3" />,
  audience: <Users className="h-3 w-3" />,
  technical: <Cpu className="h-3 w-3" />,
  other: <MoreHorizontal className="h-3 w-3" />,
};

const PRIORITY_LABELS: Record<LiveShowFeedPriority, string> = {
  normal: "일반",
  important: "중요",
  urgent: "긴급",
};

const PRIORITY_COLORS: Record<LiveShowFeedPriority, string> = {
  normal: "bg-gray-100 text-gray-600 border-gray-200",
  important: "bg-yellow-100 text-yellow-700 border-yellow-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
};

const PRIORITY_ICONS: Record<LiveShowFeedPriority, React.ReactNode> = {
  normal: null,
  important: <Star className="h-3 w-3" />,
  urgent: <Zap className="h-3 w-3" />,
};

const FEED_TYPES: LiveShowFeedType[] = [
  "stage",
  "backstage",
  "audience",
  "technical",
  "other",
];

const FEED_PRIORITIES: LiveShowFeedPriority[] = [
  "normal",
  "important",
  "urgent",
];

// ============================================================
// 유틸
// ============================================================

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return iso;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function nowDatetimeLocal(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}`
  );
}

function datetimeLocalToIso(value: string): string {
  try {
    return new Date(value).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function isoToDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  } catch {
    return nowDatetimeLocal();
  }
}

// ============================================================
// 하위 컴포넌트: 피드 엔트리 카드
// ============================================================

type EntryCardProps = {
  entry: LiveShowFeedEntry;
  onEdit: (entry: LiveShowFeedEntry) => void;
  onDelete: (id: string) => void;
};

function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const isUrgent = entry.priority === "urgent";
  const isImportant = entry.priority === "important";

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isUrgent
          ? "border-red-300 bg-red-50"
          : isImportant
          ? "border-yellow-300 bg-yellow-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 시각 */}
          <span className="text-xs font-mono font-semibold text-gray-700">
            {formatTimestamp(entry.timestamp)}
          </span>

          {/* 유형 뱃지 */}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${TYPE_COLORS[entry.type]}`}
          >
            {TYPE_ICONS[entry.type]}
            {TYPE_LABELS[entry.type]}
          </Badge>

          {/* 중요도 뱃지 (일반 제외) */}
          {entry.priority !== "normal" && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${PRIORITY_COLORS[entry.priority]}`}
            >
              {PRIORITY_ICONS[entry.priority]}
              {PRIORITY_LABELS[entry.priority]}
            </Badge>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 메시지 */}
      <p className="mt-1.5 text-sm text-gray-800 leading-snug">
        {entry.message}
      </p>

      {/* 이미지 */}
      {entry.imageUrl && (
        <a
          href={entry.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <ImageIcon className="h-3 w-3" />
          이미지 보기
        </a>
      )}

      {/* 작성자 */}
      <p className="mt-1 text-[10px] text-gray-400">작성자: {entry.author}</p>
    </div>
  );
}

// ============================================================
// 피드 등록/수정 다이얼로그
// ============================================================

type FeedDialogProps = {
  open: boolean;
  editTarget: LiveShowFeedEntry | null;
  onClose: () => void;
  onSave: (params: {
    timestamp: string;
    message: string;
    author: string;
    type: LiveShowFeedType;
    priority: LiveShowFeedPriority;
    imageUrl?: string;
  }) => void;
};

function FeedDialog({ open, editTarget, onClose, onSave }: FeedDialogProps) {
  const isEdit = editTarget !== null;

  const [timestamp, setTimestamp] = useState<string>(
    editTarget ? isoToDatetimeLocal(editTarget.timestamp) : nowDatetimeLocal()
  );
  const [message, setMessage] = useState(editTarget?.message ?? "");
  const [author, setAuthor] = useState(editTarget?.author ?? "");
  const [type, setType] = useState<LiveShowFeedType>(editTarget?.type ?? "stage");
  const [priority, setPriority] = useState<LiveShowFeedPriority>(
    editTarget?.priority ?? "normal"
  );
  const [imageUrl, setImageUrl] = useState(editTarget?.imageUrl ?? "");

  // 다이얼로그 열릴 때마다 초기화
  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
  };

  const handleSave = () => {
    if (!message.trim()) {
      toast.error("메시지를 입력해주세요.");
      return;
    }
    if (!author.trim()) {
      toast.error("작성자를 입력해주세요.");
      return;
    }
    onSave({
      timestamp: datetimeLocalToIso(timestamp),
      message,
      author,
      type,
      priority,
      imageUrl: imageUrl.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "피드 수정" : "피드 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 시각 */}
          <div className="space-y-1">
            <Label className="text-xs">시각</Label>
            <Input
              type="datetime-local"
              className="text-xs h-8"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>

          {/* 작성자 */}
          <div className="space-y-1">
            <Label className="text-xs">작성자</Label>
            <Input
              className="text-xs h-8"
              placeholder="이름 입력"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          {/* 유형 & 중요도 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">유형</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as LiveShowFeedType)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEED_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">중요도</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as LiveShowFeedPriority)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEED_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 메시지 */}
          <div className="space-y-1">
            <Label className="text-xs">메시지</Label>
            <Textarea
              className="text-xs min-h-[80px] resize-none"
              placeholder="실시간 업데이트 내용을 입력하세요"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* 이미지 URL */}
          <div className="space-y-1">
            <Label className="text-xs">이미지 URL (선택)</Label>
            <Input
              className="text-xs h-8"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            {isEdit ? "저장" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type LiveShowFeedCardProps = {
  groupId: string;
  projectId: string;
};

export function LiveShowFeedCard({ groupId, projectId }: LiveShowFeedCardProps) {
  const { entries, loading, addEntry, updateEntry, deleteEntry, stats } =
    useLiveShowFeed(groupId, projectId);

  const [isOpen, setIsOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LiveShowFeedEntry | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<LiveShowFeedType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<LiveShowFeedPriority | "all">("all");

  // 필터링된 엔트리
  const filteredEntries = entries.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterPriority !== "all" && e.priority !== filterPriority) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (entry: LiveShowFeedEntry) => {
    setEditTarget(entry);
    setDialogOpen(true);
  };

  const handleSave = (params: {
    timestamp: string;
    message: string;
    author: string;
    type: LiveShowFeedType;
    priority: LiveShowFeedPriority;
    imageUrl?: string;
  }) => {
    if (editTarget) {
      const ok = updateEntry(editTarget.id, params);
      if (ok) {
        toast.success("피드가 수정되었습니다.");
      } else {
        toast.error("수정에 실패했습니다.");
      }
    } else {
      addEntry(params);
      toast.success("피드가 추가되었습니다.");
    }
    setDialogOpen(false);
    setEditTarget(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    const ok = deleteEntry(deleteTargetId);
    if (ok) {
      toast.success("피드가 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
    setDeleteTargetId(null);
  };

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                  <Radio className="h-4 w-4 text-red-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 실시간 피드
                  </CardTitle>
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  )}
                </button>
              </CollapsibleTrigger>

              <div className="flex items-center gap-1.5">
                {/* 통계 뱃지 */}
                {stats.urgentCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200 flex items-center gap-0.5"
                  >
                    <Zap className="h-2.5 w-2.5" />
                    긴급 {stats.urgentCount}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-gray-500"
                >
                  총 {stats.total}건
                </Badge>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleOpenAdd}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* 필터 행 */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-3 w-3 text-gray-400 shrink-0" />
                <Select
                  value={filterType}
                  onValueChange={(v) =>
                    setFilterType(v as LiveShowFeedType | "all")
                  }
                >
                  <SelectTrigger className="h-7 text-xs w-28">
                    <SelectValue placeholder="유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      전체 유형
                    </SelectItem>
                    {FEED_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filterPriority}
                  onValueChange={(v) =>
                    setFilterPriority(v as LiveShowFeedPriority | "all")
                  }
                >
                  <SelectTrigger className="h-7 text-xs w-28">
                    <SelectValue placeholder="중요도" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      전체 중요도
                    </SelectItem>
                    {FEED_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(filterType !== "all" || filterPriority !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-gray-400"
                    onClick={() => {
                      setFilterType("all");
                      setFilterPriority("all");
                    }}
                  >
                    초기화
                  </Button>
                )}
              </div>

              {/* 요약 통계 */}
              {stats.total > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(stats.byType) as LiveShowFeedType[])
                    .filter((t) => stats.byType[t] > 0)
                    .map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 cursor-pointer ${TYPE_COLORS[t]}`}
                        onClick={() =>
                          setFilterType((prev) => (prev === t ? "all" : t))
                        }
                      >
                        {TYPE_ICONS[t]}
                        {TYPE_LABELS[t]} {stats.byType[t]}
                      </Badge>
                    ))}
                </div>
              )}

              {/* 피드 목록 */}
              {loading ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  불러오는 중...
                </p>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-6 space-y-1">
                  {entries.length === 0 ? (
                    <>
                      <AlertTriangle className="h-8 w-8 text-gray-300 mx-auto" />
                      <p className="text-xs text-gray-400">
                        등록된 피드가 없습니다.
                      </p>
                      <p className="text-[10px] text-gray-300">
                        공연 진행 중 실시간 업데이트를 기록하세요.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">
                      필터 조건에 맞는 피드가 없습니다.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={handleOpenEdit}
                      onDelete={(id) => setDeleteTargetId(id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 추가/수정 다이얼로그 */}
      {dialogOpen && (
        <FeedDialog
          open={dialogOpen}
          editTarget={editTarget}
          onClose={() => {
            setDialogOpen(false);
            setEditTarget(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(o) => { if (!o) setDeleteTargetId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>피드 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 피드 항목을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTargetId(null)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteConfirm}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
