"use client";

import { useState } from "react";
import {
  Video,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ExternalLink,
  Film,
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
import { useVideoLibrary } from "@/hooks/use-video-library";
import type { VideoCategory, VideoLibraryItem } from "@/types";

// ============================================
// 카테고리 메타데이터
// ============================================

const CATEGORY_LABELS: Record<VideoCategory, string> = {
  reference: "참고",
  tutorial: "튜토리얼",
  practice: "연습",
  performance: "공연",
  other: "기타",
};

const CATEGORY_BADGE_CLASS: Record<VideoCategory, string> = {
  reference: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  tutorial: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  practice: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  performance: "bg-pink-100 text-pink-700 hover:bg-pink-100",
  other: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

type FilterTab = "all" | VideoCategory;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "reference", label: "참고" },
  { value: "tutorial", label: "튜토리얼" },
  { value: "practice", label: "연습" },
  { value: "performance", label: "공연" },
  { value: "other", label: "기타" },
];

// ============================================
// 서브 컴포넌트: 영상 추가 다이얼로그
// ============================================

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (video: Omit<VideoLibraryItem, "id" | "createdAt">) => void;
  itemCount: number;
  maxVideos: number;
}

function AddVideoDialog({
  open,
  onOpenChange,
  onAdd,
  itemCount,
  maxVideos,
}: AddVideoDialogProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<VideoCategory>("reference");
  const [note, setNote] = useState("");
  const [addedBy, setAddedBy] = useState("");

  function reset() {
    setTitle("");
    setUrl("");
    setCategory("reference");
    setNote("");
    setAddedBy("");
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
      toast.error(TOAST.VIDEO_LIBRARY.TITLE_REQUIRED);
      return;
    }
    if (!trimUrl) {
      toast.error(TOAST.VIDEO_LIBRARY.URL_REQUIRED);
      return;
    }
    if (!trimUrl.startsWith("https://")) {
      toast.error(TOAST.VIDEO_LIBRARY.URL_HTTPS);
      return;
    }
    if (itemCount >= maxVideos) {
      toast.error(`영상은 최대 ${maxVideos}개까지 추가할 수 있습니다.`);
      return;
    }

    onAdd({
      title: trimTitle,
      url: trimUrl,
      category,
      note: note.trim(),
      addedBy: addedBy.trim(),
    });

    reset();
    onOpenChange(false);
    toast.success(TOAST.VIDEO_LIBRARY.ADDED);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">영상 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 제목 */}
          <div className="space-y-1.5">
            <Label className="text-xs">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="영상 제목을 입력하세요"
              className="h-8 text-xs"
              autoFocus
              maxLength={100}
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label className="text-xs">URL *</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
              maxLength={500}
              type="url"
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1.5">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as VideoCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as VideoCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="간단한 메모를 남겨보세요"
              className="text-xs resize-none min-h-[60px]"
              maxLength={200}
            />
          </div>

          {/* 작성자 */}
          <div className="space-y-1.5">
            <Label className="text-xs">작성자</Label>
            <Input
              value={addedBy}
              onChange={(e) => setAddedBy(e.target.value)}
              placeholder="이름 또는 닉네임"
              className="h-8 text-xs"
              maxLength={50}
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
// 서브 컴포넌트: 영상 아이템
// ============================================

interface VideoItemProps {
  item: VideoLibraryItem;
  onDelete: () => void;
}

function VideoItem({ item, onDelete }: VideoItemProps) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b last:border-0 group">
      {/* 아이콘 */}
      <Film className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        {/* 제목 + 외부 링크 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-0.5 truncate max-w-[180px]"
            title={item.url}
          >
            {item.title}
            <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
          </a>
          <Badge
            className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${CATEGORY_BADGE_CLASS[item.category]}`}
          >
            {CATEGORY_LABELS[item.category]}
          </Badge>
        </div>

        {/* 메모 */}
        {item.note && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
            {item.note}
          </p>
        )}

        {/* 작성자 + 날짜 */}
        <div className="flex items-center gap-2 mt-0.5">
          {item.addedBy && (
            <span className="text-[10px] text-muted-foreground">{item.addedBy}</span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {new Date(item.createdAt).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* 삭제 버튼 */}
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive flex-shrink-0"
        onClick={onDelete}
        title="영상 삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface VideoLibraryCardProps {
  groupId: string;
  projectId: string;
}

export function VideoLibraryCard({ groupId, projectId }: VideoLibraryCardProps) {
  const { items, itemCount, maxVideos, addVideo, deleteVideo, getVideosByCategory } =
    useVideoLibrary(groupId, projectId);

  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filteredItems = getVideosByCategory(activeTab);

  function handleDelete(videoId: string, title: string) {
    deleteVideo(videoId);
    toast.success(`"${title}" 영상이 삭제되었습니다.`);
  }

  function handleAdd(videoData: Omit<VideoLibraryItem, "id" | "createdAt">) {
    const success = addVideo(videoData);
    if (!success) {
      toast.error(TOAST.VIDEO_LIBRARY.INVALID_URL);
    }
  }

  return (
    <div className="border rounded-lg bg-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-cyan-500 flex-shrink-0" />
            <span className="text-sm font-medium">영상 라이브러리</span>
            {itemCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-cyan-100 text-cyan-700 hover:bg-cyan-100">
                {itemCount}개
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
                setDialogOpen(true);
              }}
              disabled={itemCount >= maxVideos}
              title={itemCount >= maxVideos ? `최대 ${maxVideos}개까지 추가 가능` : "영상 추가"}
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
            {itemCount === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <Video className="h-7 w-7 opacity-30" />
                <p className="text-xs">아직 영상이 없습니다.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 영상 추가하기
                </Button>
              </div>
            ) : (
              <>
                {/* 카테고리 필터 탭 */}
                <div className="flex items-center gap-1 mt-2 mb-2 flex-wrap">
                  {FILTER_TABS.map((tab) => {
                    const count =
                      tab.value === "all"
                        ? itemCount
                        : items.filter((v) => v.category === tab.value).length;
                    if (tab.value !== "all" && count === 0) return null;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          activeTab === tab.value
                            ? "bg-foreground text-background border-foreground"
                            : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                        {count > 0 && (
                          <span className="ml-1 opacity-70">{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 영상 목록 */}
                {filteredItems.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    <p className="text-xs">해당 카테고리에 영상이 없습니다.</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-72">
                    <div>
                      {filteredItems.map((item) => (
                        <VideoItem
                          key={item.id}
                          item={item}
                          onDelete={() => handleDelete(item.id, item.title)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* 하단 요약 */}
                <div className="flex items-center justify-end pt-2 mt-1 border-t">
                  <span className="text-[10px] text-muted-foreground">
                    총 {itemCount} / {maxVideos}개
                  </span>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 영상 추가 다이얼로그 */}
      <AddVideoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAdd}
        itemCount={itemCount}
        maxVideos={maxVideos}
      />
    </div>
  );
}
