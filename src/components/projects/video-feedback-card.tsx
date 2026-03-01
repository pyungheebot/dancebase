"use client";

import { useState } from "react";
import {
  Video,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  ExternalLink,
  MessageSquare,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useVideoFeedback } from "@/hooks/use-video-feedback";
import type { VideoFeedbackItem, VideoFeedbackTimestamp } from "@/types";

// ============================================
// 상수: 카테고리 메타데이터
// ============================================

type TimestampCategory = VideoFeedbackTimestamp["category"];

const CATEGORY_META: Record<
  TimestampCategory,
  { label: string; badgeClass: string }
> = {
  praise: {
    label: "칭찬",
    badgeClass: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  correction: {
    label: "수정",
    badgeClass: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  question: {
    label: "질문",
    badgeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  idea: {
    label: "아이디어",
    badgeClass: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
};

// ============================================
// 유틸리티
// ============================================

function isValidTimestamp(value: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(value.trim());
}

// ============================================
// 서브 컴포넌트: 영상 추가 다이얼로그
// ============================================

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (title: string, url: string) => void;
}

function AddVideoDialog({ open, onOpenChange, onAdd }: AddVideoDialogProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  function reset() {
    setTitle("");
    setUrl("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimTitle = title.trim();
    const trimUrl = url.trim();
    if (!trimTitle) {
      toast.error(TOAST.VIDEO_FEEDBACK.TITLE_REQUIRED);
      return;
    }
    if (!trimUrl) {
      toast.error(TOAST.VIDEO_FEEDBACK.URL_REQUIRED);
      return;
    }
    onAdd(trimTitle, trimUrl);
    toast.success(TOAST.VIDEO_FEEDBACK.ADDED);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">영상 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">영상 제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 1차 합주 영상"
              className="h-8 text-xs"
              autoFocus
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">영상 URL *</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              className="h-8 text-xs"
              maxLength={500}
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
// 서브 컴포넌트: 코멘트 추가 폼
// ============================================

const DEFAULT_COMMENT_FORM = {
  time: "",
  authorName: "",
  category: "praise" as TimestampCategory,
  comment: "",
};

interface AddCommentFormProps {
  onAdd: (
    time: string,
    authorName: string,
    comment: string,
    category: TimestampCategory
  ) => void;
  onCancel: () => void;
}

function AddCommentForm({ onAdd, onCancel }: AddCommentFormProps) {
  const [form, setForm] = useState(DEFAULT_COMMENT_FORM);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimTime = form.time.trim();
    const trimAuthor = form.authorName.trim();
    const trimComment = form.comment.trim();

    if (!trimTime) {
      toast.error(TOAST.VIDEO_FEEDBACK.TIMESTAMP_REQUIRED);
      return;
    }
    if (!isValidTimestamp(trimTime)) {
      toast.error('타임스탬프는 "MM:SS" 형식으로 입력해주세요. (예: 01:30)');
      return;
    }
    if (!trimAuthor) {
      toast.error(TOAST.VIDEO_FEEDBACK.AUTHOR_REQUIRED);
      return;
    }
    if (!trimComment) {
      toast.error(TOAST.VIDEO_FEEDBACK.COMMENT_REQUIRED);
      return;
    }

    onAdd(trimTime, trimAuthor, trimComment, form.category);
    setForm(DEFAULT_COMMENT_FORM);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-dashed border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50"
    >
      <p className="text-xs font-medium text-gray-700">코멘트 추가</p>

      {/* 타임스탬프 + 작성자 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">타임스탬프 *</Label>
          <Input
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            placeholder="예: 01:30"
            className="h-7 text-xs"
            maxLength={7}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">작성자 *</Label>
          <Input
            value={form.authorName}
            onChange={(e) =>
              setForm((f) => ({ ...f, authorName: e.target.value }))
            }
            placeholder="이름 입력"
            className="h-7 text-xs"
            maxLength={50}
          />
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">카테고리</Label>
        <Select
          value={form.category}
          onValueChange={(val) =>
            setForm((f) => ({ ...f, category: val as TimestampCategory }))
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.entries(CATEGORY_META) as [
                TimestampCategory,
                { label: string; badgeClass: string },
              ][]
            ).map(([cat, meta]) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 코멘트 내용 */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">내용 *</Label>
        <Textarea
          value={form.comment}
          onChange={(e) =>
            setForm((f) => ({ ...f, comment: e.target.value }))
          }
          placeholder="코멘트를 입력하세요"
          className="text-xs resize-none min-h-[60px]"
          maxLength={500}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="h-7 text-xs flex-1">
          추가
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

// ============================================
// 서브 컴포넌트: 타임스탬프 행
// ============================================

interface TimestampRowProps {
  timestamp: VideoFeedbackTimestamp;
  onDelete: () => void;
}

function TimestampRow({ timestamp, onDelete }: TimestampRowProps) {
  const meta = CATEGORY_META[timestamp.category];

  return (
    <div className="flex items-start gap-2 py-2 px-2 rounded-lg border border-gray-100 bg-card hover:bg-muted/30 transition-colors group">
      {/* 시간 */}
      <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
        <span className="text-[10px] font-mono text-muted-foreground w-9">
          {timestamp.time}
        </span>
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate max-w-[80px]">
            {timestamp.authorName}
          </span>
          <Badge className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${meta.badgeClass}`}>
            {meta.label}
          </Badge>
        </div>
        <p className="text-xs text-gray-700 break-words leading-relaxed">
          {timestamp.comment}
        </p>
      </div>

      {/* 삭제 버튼 */}
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive flex-shrink-0"
        onClick={onDelete}
        title="코멘트 삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 영상 패널
// ============================================

interface VideoPanelProps {
  video: VideoFeedbackItem;
  onDelete: (videoId: string) => void;
  onAddTimestamp: (
    videoId: string,
    time: string,
    authorName: string,
    comment: string,
    category: TimestampCategory
  ) => void;
  onDeleteTimestamp: (videoId: string, timestampId: string) => void;
  filterByCategory: (
    videoId: string,
    category: TimestampCategory | null
  ) => VideoFeedbackTimestamp[];
}

function VideoPanel({
  video,
  onDelete,
  onAddTimestamp,
  onDeleteTimestamp,
  filterByCategory,
}: VideoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<TimestampCategory | null>(null);

  const sortedTimestamps = filterByCategory(video.id, selectedCategory);

  function handleAddTimestamp(
    time: string,
    authorName: string,
    comment: string,
    category: TimestampCategory
  ) {
    onAddTimestamp(video.id, time, authorName, comment, category);
    setShowAddForm(false);
    toast.success(TOAST.VIDEO_FEEDBACK.COMMENT_ADDED);
  }

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        {/* 영상 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
          <div className="flex items-center gap-2 min-w-0">
            <CollapsibleTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 flex-shrink-0"
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <span className="text-xs font-medium truncate">{video.title}</span>
            {video.timestamps.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100 flex-shrink-0">
                <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                {video.timestamps.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-6 w-6 rounded-sm hover:bg-gray-200 transition-colors"
              title="영상 열기"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(video.id);
                toast.success(`"${video.title}" 영상이 삭제되었습니다.`);
              }}
              title="영상 삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 영상 내용 (확장 시) */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 space-y-2">
            {/* 카테고리 필터 */}
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                size="sm"
                variant={selectedCategory === null ? "secondary" : "ghost"}
                className="h-6 text-[10px] px-2"
                onClick={() => setSelectedCategory(null)}
              >
                전체
              </Button>
              {(
                Object.entries(CATEGORY_META) as [
                  TimestampCategory,
                  { label: string; badgeClass: string },
                ][]
              ).map(([cat, meta]) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "secondary" : "ghost"}
                  className="h-6 text-[10px] px-2"
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                >
                  {meta.label}
                </Button>
              ))}
            </div>

            {/* 타임라인 코멘트 목록 */}
            {sortedTimestamps.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                {selectedCategory
                  ? `"${CATEGORY_META[selectedCategory].label}" 카테고리 코멘트가 없습니다.`
                  : "아직 코멘트가 없습니다."}
              </div>
            ) : (
              <ScrollArea className="max-h-56">
                <div className="space-y-1">
                  {sortedTimestamps.map((ts) => (
                    <TimestampRow
                      key={ts.id}
                      timestamp={ts}
                      onDelete={() => onDeleteTimestamp(video.id, ts.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* 코멘트 추가 폼 */}
            {showAddForm ? (
              <AddCommentForm
                onAdd={handleAddTimestamp}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full border-dashed"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                코멘트 추가
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface VideoFeedbackCardProps {
  groupId: string;
  projectId: string;
}

export function VideoFeedbackCard({
  groupId,
  projectId,
}: VideoFeedbackCardProps) {
  const {
    videos,
    totalVideos,
    totalComments,
    addVideo,
    deleteVideo,
    addTimestamp,
    deleteTimestamp,
    filterByCategory,
  } = useVideoFeedback(groupId, projectId);

  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="border rounded-lg bg-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-medium">영상 피드백</span>
            {totalVideos > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">
                {totalVideos}개
              </Badge>
            )}
            {totalComments > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 hover:bg-gray-100">
                <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                {totalComments}
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
                setAddDialogOpen(true);
              }}
              title="영상 추가"
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">영상 추가</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                {open ? (
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
            {totalVideos === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <Video className="h-7 w-7 opacity-30" />
                <p className="text-xs">아직 영상이 없습니다.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 영상 추가하기
                </Button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {videos.map((video) => (
                  <VideoPanel
                    key={video.id}
                    video={video}
                    onDelete={deleteVideo}
                    onAddTimestamp={addTimestamp}
                    onDeleteTimestamp={deleteTimestamp}
                    filterByCategory={filterByCategory}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 영상 추가 다이얼로그 */}
      <AddVideoDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={addVideo}
      />
    </div>
  );
}
