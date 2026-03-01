"use client";

import { useState } from "react";
import NextImage from "next/image";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Video,
  Plus,
  Trash2,
  Pencil,
  Star,
  ExternalLink,
  Tag,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Filter,
  Clock,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useDanceVideoPortfolio,
  type TagCloudItem,
} from "@/hooks/use-dance-video-portfolio";
import type { DanceVideoItem } from "@/types";
import { cn } from "@/lib/utils";
import { validateUrl, sanitizeUrl } from "@/lib/validation";

// ============================================================
// 태그 클라우드 레벨별 스타일
// ============================================================

const TAG_LEVEL_CLASS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "text-[10px] px-1.5 py-0 bg-violet-50 text-violet-600 border-violet-200",
  2: "text-[11px] px-1.5 py-0 bg-violet-100 text-violet-700 border-violet-300",
  3: "text-xs px-2 py-0.5 bg-violet-100 text-violet-700 border-violet-300 font-medium",
  4: "text-xs px-2 py-0.5 bg-violet-200 text-violet-800 border-violet-400 font-semibold",
  5: "text-sm px-2.5 py-0.5 bg-violet-300 text-violet-900 border-violet-500 font-bold",
};

// ============================================================
// 영상 추가/수정 다이얼로그
// ============================================================

interface VideoDialogProps {
  initial?: DanceVideoItem;
  onSave: (payload: Omit<DanceVideoItem, "id" | "createdAt">) => void;
  trigger: React.ReactNode;
}

function VideoDialog({ initial, onSave, trigger }: VideoDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initial?.thumbnailUrl ?? ""
  );
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [recordedAt, setRecordedAt] = useState(initial?.recordedAt ?? "");
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const { pending: saving, execute: executeSave } = useAsyncAction();

  function resetForm() {
    setTitle(initial?.title ?? "");
    setUrl(initial?.url ?? "");
    setThumbnailUrl(initial?.thumbnailUrl ?? "");
    setGenre(initial?.genre ?? "");
    setDescription(initial?.description ?? "");
    setDuration(initial?.duration ?? "");
    setRecordedAt(initial?.recordedAt ?? "");
    setIsFeatured(initial?.isFeatured ?? false);
    setTags(initial?.tags ?? []);
    setTagInput("");
  }

  function handleOpen(value: boolean) {
    if (value) resetForm();
    setOpen(value);
  }

  function addTag() {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (!trimmed || tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  function handleSave() {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!url.trim()) {
      toast.error("영상 URL을 입력해주세요.");
      return;
    }
    const urlError = validateUrl(url);
    if (urlError) {
      toast.error(urlError);
      return;
    }
    const thumbnailUrlError = validateUrl(thumbnailUrl);
    if (thumbnailUrlError) {
      toast.error(`썸네일 URL: ${thumbnailUrlError}`);
      return;
    }
    void executeSave(async () => {
      onSave({
        title: title.trim(),
        url: url.trim(),
        thumbnailUrl: thumbnailUrl.trim() || null,
        genre: genre.trim() || null,
        description: description.trim(),
        duration: duration.trim() || null,
        recordedAt: recordedAt || null,
        isFeatured,
        tags,
      });
      toast.success(initial ? "영상 정보가 수정되었습니다." : "영상이 추가되었습니다.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initial ? "영상 정보 수정" : "댄스 영상 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              placeholder="영상 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* URL */}
          <div className="space-y-1">
            <Label className="text-xs">영상 URL *</Label>
            <Input
              placeholder="https://youtube.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 썸네일 URL */}
          <div className="space-y-1">
            <Label className="text-xs">썸네일 URL</Label>
            <Input
              placeholder="https://... (선택)"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 장르 */}
          <div className="space-y-1">
            <Label className="text-xs">장르</Label>
            <Input
              placeholder="예: 힙합, 팝핀, 브레이킹..."
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 영상 길이 / 촬영 날짜 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">영상 길이</Label>
              <Input
                placeholder="예: 3:45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">촬영 날짜</Label>
              <Input
                type="date"
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              placeholder="영상에 대한 설명..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          {/* 태그 */}
          <div className="space-y-1.5">
            <Label className="text-xs">태그</Label>
            <div className="flex gap-1.5">
              <Input
                placeholder="#태그 입력 후 Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 shrink-0"
                onClick={addTag}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 text-[10px] bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-1.5 py-0"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-red-500"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 대표 영상 */}
          <div className="flex items-center gap-2 rounded-md border bg-amber-50 px-3 py-2">
            <button
              type="button"
              onClick={() => setIsFeatured((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                isFeatured ? "text-amber-600 font-medium" : "text-muted-foreground"
              )}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  isFeatured ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                )}
              />
              대표 영상으로 설정
            </button>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              <Check className="h-3 w-3 mr-1" />
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 태그 클라우드 컴포넌트
// ============================================================

function TagCloud({
  tags,
  activeTag,
  onTagClick,
}: {
  tags: TagCloudItem[];
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 p-3 rounded-md border bg-muted/20">
      {tags.map(({ tag, level }) => (
        <button
          key={tag}
          type="button"
          onClick={() => onTagClick(tag)}
          className={cn(
            "inline-flex items-center rounded-full border transition-all cursor-pointer",
            TAG_LEVEL_CLASS[level],
            activeTag === tag
              ? "ring-2 ring-violet-400 ring-offset-1"
              : "hover:opacity-80"
          )}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 영상 카드 컴포넌트
// ============================================================

interface VideoCardProps {
  video: DanceVideoItem;
  onEdit: (payload: Omit<DanceVideoItem, "id" | "createdAt">) => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
}

function VideoCard({ video, onEdit, onDelete, onToggleFeatured }: VideoCardProps) {
  return (
    <div className="group relative rounded-md border bg-card hover:bg-muted/20 transition-colors overflow-hidden">
      {/* 썸네일 영역 */}
      <div className="relative aspect-video bg-muted/40 flex items-center justify-center">
        {video.thumbnailUrl ? (
          <NextImage
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <Video className="h-8 w-8 text-muted-foreground/40" />
        )}
        {/* 대표 영상 배지 */}
        {video.isFeatured && (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 text-[9px] bg-amber-500 text-white rounded-full px-1.5 py-0.5 font-medium">
            <Star className="h-2.5 w-2.5 fill-white" />
            대표
          </span>
        )}
        {/* 영상 길이 */}
        {video.duration && (
          <span className="absolute bottom-1.5 right-1.5 text-[10px] bg-black/70 text-white rounded px-1.5 py-0.5">
            {video.duration}
          </span>
        )}
        {/* 호버 액션 */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          <a
            href={sanitizeUrl(video.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            title="영상 열기"
          >
            <ExternalLink className="h-4 w-4 text-white" />
          </a>
          <button
            type="button"
            onClick={onToggleFeatured}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            title={video.isFeatured ? "대표 영상 해제" : "대표 영상 설정"}
          >
            <Star
              className={cn(
                "h-4 w-4",
                video.isFeatured
                  ? "fill-amber-400 text-amber-400"
                  : "text-white"
              )}
            />
          </button>
          <VideoDialog
            initial={video}
            onSave={onEdit}
            trigger={
              <button
                type="button"
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title="수정"
              >
                <Pencil className="h-4 w-4 text-white" />
              </button>
            }
          />
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 bg-white/20 hover:bg-red-500/60 rounded-full transition-colors"
            title="삭제"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="p-2.5 space-y-1.5">
        {/* 제목 */}
        <div className="flex items-start gap-1">
          <p className="text-xs font-medium leading-snug line-clamp-2 flex-1">
            {video.title}
          </p>
        </div>

        {/* 메타 정보 */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          {video.genre && (
            <span className="inline-flex items-center gap-0.5">
              <Tag className="h-2.5 w-2.5" />
              {video.genre}
            </span>
          )}
          {video.recordedAt && (
            <span className="inline-flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {video.recordedAt}
            </span>
          )}
          {video.duration && (
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {video.duration}
            </span>
          )}
        </div>

        {/* 설명 */}
        {video.description && (
          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
            {video.description}
          </p>
        )}

        {/* 태그 */}
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 bg-violet-50 text-violet-600 border border-violet-200 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceVideoPortfolioCard({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(true);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [showTagCloud, setShowTagCloud] = useState(false);

  const { videos, addVideo, updateVideo, deleteVideo, toggleFeatured, stats } =
    useDanceVideoPortfolio(memberId);

  // ── 필터 적용 ──────────────────────────────
  const filtered = videos.filter((v) => {
    if (onlyFeatured && !v.isFeatured) return false;
    if (activeGenre && v.genre !== activeGenre) return false;
    if (activeTag && !v.tags.includes(activeTag)) return false;
    return true;
  });

  // 활성 필터 수
  const activeFilterCount =
    (onlyFeatured ? 1 : 0) +
    (activeGenre ? 1 : 0) +
    (activeTag ? 1 : 0);

  function clearFilters() {
    setActiveGenre(null);
    setActiveTag(null);
    setOnlyFeatured(false);
  }

  function handleDelete(videoId: string) {
    deleteVideo(videoId);
    toast.success("영상이 삭제되었습니다.");
  }

  function handleTagClick(tag: string) {
    setActiveTag((prev) => (prev === tag ? null : tag));
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-violet-100">
                  <Video className="h-4 w-4 text-violet-600" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  댄스 영상 포트폴리오
                </CardTitle>
                {stats.totalVideos > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200"
                  >
                    {stats.totalVideos}개
                  </Badge>
                )}
                {stats.featuredCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                  >
                    <Star className="h-2.5 w-2.5 fill-amber-400 mr-0.5" />
                    대표 {stats.featuredCount}
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 통계 요약 */}
            {stats.totalVideos > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center rounded-md border bg-muted/20 py-1.5 px-1">
                  <p className="text-sm font-semibold text-violet-600">
                    {stats.totalVideos}
                  </p>
                  <p className="text-[10px] text-muted-foreground">전체 영상</p>
                </div>
                <div className="text-center rounded-md border bg-muted/20 py-1.5 px-1">
                  <p className="text-sm font-semibold text-amber-600">
                    {stats.featuredCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground">대표 영상</p>
                </div>
                <div className="text-center rounded-md border bg-muted/20 py-1.5 px-1">
                  <p className="text-sm font-semibold text-blue-600">
                    {stats.genreDistribution.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">장르 수</p>
                </div>
              </div>
            )}

            {/* 필터 툴바 */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 대표 영상 필터 */}
                <button
                  type="button"
                  onClick={() => setOnlyFeatured((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    onlyFeatured
                      ? "bg-amber-500 text-white border-amber-500"
                      : "border-muted-foreground/30 text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  <Star className={cn("h-2.5 w-2.5", onlyFeatured && "fill-white")} />
                  대표만
                </button>

                {/* 장르 필터 */}
                {stats.genreDistribution.map(({ genre }) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() =>
                      setActiveGenre((prev) => (prev === genre ? null : genre))
                    }
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                      activeGenre === genre
                        ? "bg-foreground text-background border-foreground"
                        : "border-muted-foreground/30 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {genre}
                  </button>
                ))}

                {/* 태그 클라우드 토글 */}
                {stats.tagCloud.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTagCloud((v) => !v)}
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                      showTagCloud
                        ? "bg-violet-100 text-violet-700 border-violet-300"
                        : "border-muted-foreground/30 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <Tag className="h-2.5 w-2.5" />
                    태그
                  </button>
                )}

                {/* 필터 초기화 */}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Filter className="h-2.5 w-2.5" />
                    초기화 ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* 태그 클라우드 */}
              {showTagCloud && stats.tagCloud.length > 0 && (
                <TagCloud
                  tags={stats.tagCloud}
                  activeTag={activeTag}
                  onTagClick={handleTagClick}
                />
              )}

              {/* 활성 태그 표시 */}
              {activeTag && (
                <div className="flex items-center gap-1.5 text-[10px] text-violet-700">
                  <Tag className="h-2.5 w-2.5" />
                  <span>태그 필터: #{activeTag}</span>
                  <button
                    type="button"
                    onClick={() => setActiveTag(null)}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* 영상 목록 헤더 */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {activeFilterCount > 0
                  ? `필터된 영상 (${filtered.length}/${stats.totalVideos})`
                  : "영상 목록"}
              </span>
              <VideoDialog
                onSave={addVideo}
                trigger={
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
                    <Plus className="h-3 w-3 mr-0.5" />
                    영상 추가
                  </Button>
                }
              />
            </div>

            {/* 영상 그리드 */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-md text-center space-y-2">
                <Video className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">
                  {stats.totalVideos === 0
                    ? "아직 등록된 댄스 영상이 없습니다."
                    : "조건에 맞는 영상이 없습니다."}
                </p>
                {stats.totalVideos === 0 && (
                  <VideoDialog
                    onSave={addVideo}
                    trigger={
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs mt-1"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        첫 영상 추가하기
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onEdit={(payload) => updateVideo(video.id, payload)}
                    onDelete={() => handleDelete(video.id)}
                    onToggleFeatured={() => toggleFeatured(video.id)}
                  />
                ))}
              </div>
            )}

            {/* 장르 분포 */}
            {stats.genreDistribution.length > 1 && (
              <section className="space-y-2 border-t pt-3">
                <span className="text-xs font-medium text-muted-foreground">
                  장르 분포
                </span>
                <div className="space-y-1.5">
                  {stats.genreDistribution.map(({ genre, count, percentage }) => (
                    <div key={genre} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{genre}</span>
                        <span className="text-muted-foreground">
                          {count}개 ({percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
