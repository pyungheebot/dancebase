"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Video, Plus, Trash2, ExternalLink, Film, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePracticeVideos } from "@/hooks/use-practice-videos";
import { VideoTimestampSection } from "@/components/projects/video-timestamp-section";
import type { ProjectSong } from "@/types";

// URL에서 플랫폼 자동 감지
function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("tiktok.com")) return "tiktok";
  return "other";
}

// 플랫폼 표시 라벨
const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  other: "기타",
};

// 플랫폼별 배지 색상
function getPlatformBadgeClass(platform: string): string {
  switch (platform) {
    case "youtube":
      return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
    case "instagram":
      return "bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-100";
    case "tiktok":
      return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";
  }
}

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (payload: {
    url: string;
    title: string;
    platform: string;
    tags: string[];
    songId?: string | null;
  }) => Promise<boolean>;
  songs: ProjectSong[];
}

function AddVideoDialog({ open, onOpenChange, onAdd, songs }: AddVideoDialogProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [songId, setSongId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // URL 변경 시 플랫폼 자동 감지
  function handleUrlChange(value: string) {
    setUrl(value);
    if (value.trim()) {
      setPlatform(detectPlatform(value));
    }
  }

  // 태그 추가 (Enter 또는 쉼표)
  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,/g, "");
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSubmit() {
    if (!url.trim() || !title.trim()) return;
    setSubmitting(true);
    const ok = await onAdd({
      url,
      title,
      platform,
      tags,
      songId: songId || null,
    });
    setSubmitting(false);
    if (ok) {
      setUrl("");
      setTitle("");
      setPlatform("youtube");
      setTagInput("");
      setTags([]);
      setSongId(null);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Film className="h-4 w-4" />
            영상 추가
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* URL */}
          <div className="space-y-1">
            <Label className="text-xs">URL</Label>
            <Input
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://youtube.com/..."
              className="h-7 text-xs"
            />
            {url && (
              <p className="text-[10px] text-muted-foreground">
                플랫폼 자동 감지: {PLATFORM_LABELS[platform] ?? platform}
              </p>
            )}
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="영상 제목"
              className="h-7 text-xs"
            />
          </div>

          {/* 플랫폼 */}
          <div className="space-y-1">
            <Label className="text-xs">플랫폼</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube" className="text-xs">YouTube</SelectItem>
                <SelectItem value="instagram" className="text-xs">Instagram</SelectItem>
                <SelectItem value="tiktok" className="text-xs">TikTok</SelectItem>
                <SelectItem value="other" className="text-xs">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 곡 연결 (songs가 있을 때만) */}
          {songs.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">연결 곡 (선택)</Label>
              <Select
                value={songId ?? "none"}
                onValueChange={(v) => setSongId(v === "none" ? null : v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="없음" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">없음</SelectItem>
                  {songs.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.title}{s.artist ? ` - ${s.artist}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 태그 */}
          <div className="space-y-1">
            <Label className="text-xs">태그 (Enter로 추가)</Label>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="태그 입력 후 Enter"
              className="h-7 text-xs"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} x
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting || !url.trim() || !title.trim()}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 영상 카드 컴포넌트 (개별 타임스탬프 토글 상태 관리)
interface VideoCardProps {
  video: ReturnType<typeof usePracticeVideos>["videos"][number];
  groupId: string;
  canEdit: boolean;
  linkedSong?: ProjectSong;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
}

function VideoCard({
  video,
  groupId,
  canEdit,
  linkedSong,
  onDelete,
  onTagClick,
}: VideoCardProps) {
  const [showTimestamps, setShowTimestamps] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-1.5">
      {/* 상단: 플랫폼 배지 + 제목 + 링크 */}
      <div className="flex items-start gap-2">
        <Badge
          className={`text-[10px] px-1.5 py-0 shrink-0 mt-0.5 ${getPlatformBadgeClass(video.platform)}`}
        >
          {PLATFORM_LABELS[video.platform] ?? video.platform}
        </Badge>
        <p className="text-xs font-medium flex-1 leading-tight break-all">
          {video.title}
        </p>
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
          title="새 탭에서 열기"
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </a>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(video.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* 연결 곡 */}
      {linkedSong && (
        <p className="text-[10px] text-muted-foreground">
          곡: {linkedSong.title}
          {linkedSong.artist ? ` - ${linkedSong.artist}` : ""}
        </p>
      )}

      {/* 태그 */}
      {video.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {video.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[10px] px-1.5 py-0 cursor-pointer"
              onClick={() => onTagClick(tag)}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* 하단: 업로더 + 날짜 + 타임스탬프 토글 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {video.profiles?.name ?? "알 수 없음"}
        </p>
        <div className="flex items-center gap-1">
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(video.created_at), "M/d HH:mm", {
              locale: ko,
            })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className={`h-5 px-1.5 gap-0.5 text-[10px] ${showTimestamps ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => setShowTimestamps((v) => !v)}
            title="타임스탬프 메모"
          >
            <MessageSquare className="h-3 w-3" />
            메모
          </Button>
        </div>
      </div>

      {/* 타임스탬프 섹션 (토글) */}
      {showTimestamps && (
        <div className="border-t pt-2 mt-1">
          <VideoTimestampSection
            videoId={video.id}
            videoUrl={video.url}
            groupId={groupId}
            canEdit={canEdit}
          />
        </div>
      )}
    </div>
  );
}

interface PracticeVideoGalleryProps {
  groupId: string;
  projectId?: string | null;
  songs?: ProjectSong[];
  canEdit?: boolean;
  /** Sheet trigger로 사용할 children */
  children?: React.ReactNode;
}

export function PracticeVideoGallery({
  groupId,
  projectId,
  songs = [],
  canEdit = false,
  children,
}: PracticeVideoGalleryProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [songFilter, setSongFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const { videos, loading, allTags, addVideo, deleteVideo } =
    usePracticeVideos(groupId);

  // 필터링
  const filteredVideos = videos.filter((v) => {
    const songMatch = songFilter === "all" || v.song_id === songFilter;
    const tagMatch = tagFilter === "all" || v.tags.includes(tagFilter);
    // projectId가 있으면 해당 프로젝트 영상만 표시
    const projectMatch = projectId ? v.project_id === projectId : true;
    return songMatch && tagMatch && projectMatch;
  });

  async function handleAdd(payload: {
    url: string;
    title: string;
    platform: string;
    tags: string[];
    songId?: string | null;
  }) {
    return addVideo({
      ...payload,
      projectId: projectId ?? null,
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {children ?? (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Video className="h-3 w-3" />
              영상 아카이브
            </Button>
          )}
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm flex items-center gap-1.5">
                <Video className="h-4 w-4" />
                연습 영상 아카이브
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {filteredVideos.length}
                </Badge>
              </SheetTitle>
              {canEdit && (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  추가
                </Button>
              )}
            </div>

            {/* 필터 영역 */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {/* 곡 필터 */}
              {songs.length > 0 && (
                <Select value={songFilter} onValueChange={setSongFilter}>
                  <SelectTrigger className="h-6 text-[10px] w-auto min-w-[80px] px-2">
                    <SelectValue placeholder="곡 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">전체 곡</SelectItem>
                    {songs.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* 태그 필터 */}
              {allTags.length > 0 && (
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="h-6 text-[10px] w-auto min-w-[80px] px-2">
                    <SelectValue placeholder="태그 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">전체 태그</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag} className="text-xs">
                        #{tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="px-4 py-3 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Film className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {videos.length === 0
                    ? "등록된 영상이 없습니다"
                    : "조건에 맞는 영상이 없습니다"}
                </p>
                {canEdit && videos.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs mt-3 gap-1"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="h-3 w-3" />
                    첫 영상 추가
                  </Button>
                )}
              </div>
            ) : (
              <div className="px-4 py-3 space-y-2">
                {filteredVideos.map((video) => {
                  const linkedSong = songs.find((s) => s.id === video.song_id);
                  return (
                    <VideoCard
                      key={video.id}
                      video={video}
                      groupId={groupId}
                      canEdit={canEdit}
                      linkedSong={linkedSong}
                      onDelete={deleteVideo}
                      onTagClick={setTagFilter}
                    />
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AddVideoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAdd}
        songs={songs}
      />
    </>
  );
}
