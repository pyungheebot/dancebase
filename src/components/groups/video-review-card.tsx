"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Video,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  Clock,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  StickyNote,
  CalendarDays,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useVideoReview } from "@/hooks/use-video-review";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { VideoReviewEntry, VideoReviewTimestamp, VideoReviewTimestampType } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";
import { validateUrl, sanitizeUrl } from "@/lib/validation";

// ============================================================
// 상수 / 헬퍼
// ============================================================

const TIMESTAMP_TYPE_LABEL: Record<VideoReviewTimestampType, string> = {
  praise: "칭찬",
  correction: "수정",
  question: "질문",
  note: "메모",
};

const TIMESTAMP_TYPE_COLOR: Record<VideoReviewTimestampType, string> = {
  praise: "bg-green-100 text-green-700",
  correction: "bg-red-100 text-red-700",
  question: "bg-blue-100 text-blue-700",
  note: "bg-gray-100 text-gray-600",
};

const TIMESTAMP_TYPE_ICON: Record<VideoReviewTimestampType, React.ReactNode> = {
  praise: <ThumbsUp className="h-3 w-3" />,
  correction: <AlertCircle className="h-3 w-3" />,
  question: <HelpCircle className="h-3 w-3" />,
  note: <StickyNote className="h-3 w-3" />,
};

const ALL_TIMESTAMP_TYPES = Object.keys(
  TIMESTAMP_TYPE_LABEL
) as VideoReviewTimestampType[];

/** MM:SS 형식 유효성 검사 */
function isValidTime(time: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(time.trim());
}

/** MM:SS → 초 단위 변환 (정렬용) */
function timeToSeconds(time: string): number {
  const parts = time.split(":").map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return 0;
  return parts[0] * 60 + parts[1];
}

// ============================================================
// 별점 컴포넌트
// ============================================================

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={cn(
            "focus:outline-none",
            readonly ? "cursor-default" : "cursor-pointer"
          )}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              n <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 영상 추가 다이얼로그
// ============================================================

type AddEntryDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (
    input: Omit<VideoReviewEntry, "id" | "timestamps" | "createdAt">
  ) => Promise<void>;
};

function AddEntryDialog({ open, onClose, onSave }: AddEntryDialogProps) {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [reviewedBy, setReviewedBy] = useState("");
  const { pending: saving, execute } = useAsyncAction();

  function reset() {
    setTitle("");
    setVideoUrl("");
    setDate("");
    setDuration("");
    setDescription("");
    setOverallRating(0);
    setReviewedBy("");
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error(TOAST.VIDEO_REVIEW.TITLE_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.VIDEO_REVIEW.DATE_REQUIRED);
      return;
    }
    const urlError = validateUrl(videoUrl);
    if (urlError) {
      toast.error(urlError);
      return;
    }

    const reviewers = reviewedBy
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await execute(async () => {
      try {
        await onSave({
          title: title.trim(),
          videoUrl: videoUrl.trim() || undefined,
          date,
          duration: duration.trim() || undefined,
          description: description.trim() || undefined,
          overallRating: overallRating > 0 ? overallRating : undefined,
          reviewedBy: reviewers,
        });
        toast.success(TOAST.VIDEO_REVIEW.VIDEO_ADDED);
        reset();
        onClose();
      } catch {
        toast.error(TOAST.VIDEO_REVIEW.VIDEO_ADD_ERROR);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Video className="h-4 w-4 text-violet-500" />
            연습 영상 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 영상 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">영상 제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2026-02-28 연습 풀영상"
              className="h-8 text-xs"
            />
          </div>

          {/* 날짜 / 상영시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">촬영 날짜 *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">상영 시간</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="예: 12:30"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 영상 URL */}
          <div className="space-y-1">
            <Label className="text-xs">영상 링크</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이번 연습의 테마, 특이사항 등"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          {/* 별점 */}
          <div className="space-y-1">
            <Label className="text-xs">전체 평점</Label>
            <StarRating value={overallRating} onChange={setOverallRating} />
          </div>

          {/* 리뷰어 */}
          <div className="space-y-1">
            <Label className="text-xs">리뷰한 멤버 (쉼표로 구분)</Label>
            <Input
              value={reviewedBy}
              onChange={(e) => setReviewedBy(e.target.value)}
              placeholder="홍길동, 김철수"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "추가 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 타임스탬프 추가 폼
// ============================================================

type AddTimestampFormProps = {
  defaultAuthor: string;
  onAdd: (input: {
    time: string;
    comment: string;
    author: string;
    type: VideoReviewTimestampType;
  }) => Promise<void>;
};

function AddTimestampForm({ defaultAuthor, onAdd }: AddTimestampFormProps) {
  const [time, setTime] = useState("");
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState(defaultAuthor);
  const [type, setType] = useState<VideoReviewTimestampType>("note");
  const { pending: saving, execute: executeTimestamp } = useAsyncAction();

  async function handleSubmit() {
    if (!time.trim()) {
      toast.error(TOAST.VIDEO_REVIEW.TIME_REQUIRED);
      return;
    }
    if (!isValidTime(time)) {
      toast.error(TOAST.VIDEO_REVIEW.TIME_FORMAT_ERROR);
      return;
    }
    if (!comment.trim()) {
      toast.error(TOAST.VIDEO_REVIEW.COMMENT_REQUIRED);
      return;
    }

    await executeTimestamp(async () => {
      try {
        await onAdd({
          time: time.trim(),
          comment,
          author: author.trim() || "익명",
          type,
        });
        toast.success(TOAST.VIDEO_REVIEW.TIMESTAMP_ADDED);
        setTime("");
        setComment("");
      } catch {
        toast.error(TOAST.VIDEO_REVIEW.TIMESTAMP_ADD_ERROR);
      }
    });
  }

  return (
    <div className="rounded-md border bg-muted/20 p-2 space-y-2">
      <p className="text-[10px] font-medium text-muted-foreground">
        타임스탬프 추가
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">시간 (MM:SS)</Label>
          <Input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="01:23"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">유형</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as VideoReviewTimestampType)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_TIMESTAMP_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {TIMESTAMP_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px]">코멘트</Label>
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="이 구간에 대한 피드백"
          className="h-7 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px]">작성자</Label>
        <Input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="작성자 이름"
          className="h-7 text-xs"
        />
      </div>
      <Button
        size="sm"
        className="w-full h-7 text-xs"
        onClick={handleSubmit}
        disabled={saving}
      >
        {saving ? "추가 중..." : "타임스탬프 추가"}
      </Button>
    </div>
  );
}

// ============================================================
// 타임스탬프 아이템
// ============================================================

type TimestampItemProps = {
  timestamp: VideoReviewTimestamp;
  onDelete: (timestampId: string) => Promise<void>;
};

function TimestampItem({ timestamp, onDelete }: TimestampItemProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  async function handleDelete() {
    await onDelete(timestamp.id);
    toast.success(TOAST.VIDEO_REVIEW.TIMESTAMP_DELETED);
  }

  return (
    <div className="flex items-start gap-2 py-1.5">
      <Badge
        variant="secondary"
        className={cn(
          "flex items-center gap-0.5 text-[10px] px-1.5 py-0 shrink-0 font-mono mt-0.5",
          "bg-slate-100 text-slate-700"
        )}
      >
        <Clock className="h-2.5 w-2.5" />
        {timestamp.time}
      </Badge>
      <Badge
        variant="secondary"
        className={cn(
          "flex items-center gap-0.5 text-[10px] px-1.5 py-0 shrink-0 mt-0.5",
          TIMESTAMP_TYPE_COLOR[timestamp.type]
        )}
      >
        {TIMESTAMP_TYPE_ICON[timestamp.type]}
        {TIMESTAMP_TYPE_LABEL[timestamp.type]}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-tight">{timestamp.comment}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {timestamp.author}
        </p>
      </div>
      <button
        onClick={() => setDeleteConfirmOpen(true)}
        className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
        title="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </button>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}
        title="타임스탬프 삭제"
        description="이 타임스탬프를 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}

// ============================================================
// 단일 영상 엔트리 아이템
// ============================================================

type EntryItemProps = {
  entry: VideoReviewEntry;
  currentMemberName: string;
  onDelete: (entryId: string) => Promise<void>;
  onAddTimestamp: (
    entryId: string,
    input: {
      time: string;
      comment: string;
      author: string;
      type: VideoReviewTimestampType;
    }
  ) => Promise<void>;
  onDeleteTimestamp: (entryId: string, timestampId: string) => Promise<void>;
};

function EntryItem({
  entry,
  currentMemberName,
  onDelete,
  onAddTimestamp,
  onDeleteTimestamp,
}: EntryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddTimestamp, setShowAddTimestamp] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  async function handleDelete() {
    await onDelete(entry.id);
    toast.success(TOAST.VIDEO_REVIEW.VIDEO_DELETED);
  }

  // 타임스탬프 시간순 정렬
  const sortedTimestamps = [...entry.timestamps].sort(
    (a, b) => timeToSeconds(a.time) - timeToSeconds(b.time)
  );

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Video className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-medium leading-tight truncate">
              {entry.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CalendarDays className="h-2.5 w-2.5" />
                {formatYearMonthDay(entry.date)}
              </span>
              {entry.duration && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {entry.duration}
                </span>
              )}
              {entry.timestamps.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MessageSquare className="h-2.5 w-2.5" />
                  {entry.timestamps.length}개
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {entry.overallRating != null && (
            <StarRating value={entry.overallRating} readonly />
          )}
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-muted-foreground hover:text-red-500 transition-colors"
            title="삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 영상 링크 */}
      {entry.videoUrl && (
        <a
          href={sanitizeUrl(entry.videoUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
        >
          <Link2 className="h-2.5 w-2.5" />
          영상 링크 열기
        </a>
      )}

      {/* 설명 */}
      {entry.description && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {entry.description}
        </p>
      )}

      {/* 리뷰어 */}
      {entry.reviewedBy.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          리뷰어: {entry.reviewedBy.join(", ")}
        </p>
      )}

      {/* 상세 펼치기 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] px-2 w-full flex items-center gap-1 justify-center"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
            접기
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            타임스탬프 {sortedTimestamps.length > 0 ? `(${sortedTimestamps.length})` : ""} 보기
          </>
        )}
      </Button>

      {/* 타임스탬프 영역 */}
      {expanded && (
        <div className="space-y-2 pt-1">
          <Separator />

          {/* 타임스탬프 목록 */}
          {sortedTimestamps.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              아직 타임스탬프가 없습니다.
            </p>
          ) : (
            <div className="space-y-0.5">
              {sortedTimestamps.map((ts, i) => (
                <div key={ts.id}>
                  <TimestampItem
                    timestamp={ts}
                    onDelete={(tsId) => onDeleteTimestamp(entry.id, tsId)}
                  />
                  {i < sortedTimestamps.length - 1 && (
                    <div className="h-px bg-border/50 mx-1" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 타임스탬프 추가 토글 */}
          {!showAddTimestamp ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs flex items-center gap-1"
              onClick={() => setShowAddTimestamp(true)}
            >
              <Plus className="h-3 w-3" />
              타임스탬프 추가
            </Button>
          ) : (
            <div className="space-y-2">
              <AddTimestampForm
                defaultAuthor={currentMemberName}
                onAdd={(input) => onAddTimestamp(entry.id, input)}
              />
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-6 text-[10px]"
                onClick={() => setShowAddTimestamp(false)}
              >
                닫기
              </Button>
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}
        title="영상 리뷰 삭제"
        description="이 영상 리뷰를 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type VideoReviewCardProps = {
  groupId: string;
  currentMemberName?: string;
};

export function VideoReviewCard({
  groupId,
  currentMemberName = "",
}: VideoReviewCardProps) {
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const {
    entries,
    loading,
    addEntry,
    deleteEntry,
    addTimestamp,
    deleteTimestamp,
    stats,
  } = useVideoReview(groupId);

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium">연습 비디오 리뷰</span>
                {stats.totalVideos > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700"
                  >
                    {stats.totalVideos}개
                  </Badge>
                )}
                {stats.totalTimestamps > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600"
                  >
                    <MessageSquare className="h-2.5 w-2.5 mr-0.5 inline" />
                    {stats.totalTimestamps}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {stats.averageRating > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    {stats.averageRating.toFixed(1)}
                  </span>
                )}
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            <Separator />

            {/* 통계 요약 */}
            {stats.totalVideos > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-muted/40 p-2 text-center">
                  <p className="text-xs font-semibold text-violet-600">
                    {stats.totalVideos}
                  </p>
                  <p className="text-[10px] text-muted-foreground">총 영상</p>
                </div>
                <div className="rounded-md bg-muted/40 p-2 text-center">
                  <p className="text-xs font-semibold text-blue-600">
                    {stats.totalTimestamps}
                  </p>
                  <p className="text-[10px] text-muted-foreground">타임스탬프</p>
                </div>
                <div className="rounded-md bg-muted/40 p-2 text-center">
                  <p className="text-xs font-semibold text-yellow-600">
                    {stats.averageRating > 0
                      ? stats.averageRating.toFixed(1)
                      : "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">평균 평점</p>
                </div>
              </div>
            )}

            {/* 영상 추가 버튼 */}
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs flex items-center gap-1"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              연습 영상 추가
            </Button>

            {/* 영상 목록 */}
            {loading ? (
              <p className="text-[10px] text-muted-foreground text-center py-4">
                불러오는 중...
              </p>
            ) : entries.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-4">
                아직 연습 영상 리뷰가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <EntryItem
                    key={entry.id}
                    entry={entry}
                    currentMemberName={currentMemberName}
                    onDelete={deleteEntry}
                    onAddTimestamp={addTimestamp}
                    onDeleteTimestamp={deleteTimestamp}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 영상 추가 다이얼로그 */}
      <AddEntryDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={addEntry}
      />
    </Card>
  );
}
