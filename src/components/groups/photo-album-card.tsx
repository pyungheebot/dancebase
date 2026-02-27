"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  Image as ImageIcon,
  FolderOpen,
  Plus,
  Trash2,
  ArrowLeft,
  Tag,
  ChevronDown,
  ChevronUp,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { usePhotoAlbum } from "@/hooks/use-photo-album";
import type { PhotoAlbum, PhotoAlbumItem } from "@/types";

// ─── 앨범 추가 다이얼로그 ──────────────────────────────────────

interface AddAlbumDialogProps {
  onAdd: ReturnType<typeof usePhotoAlbum>["addAlbum"];
}

function AddAlbumDialog({ onAdd }: AddAlbumDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("앨범 이름을 입력해주세요.");
      return;
    }
    const ok = onAdd({ name, coverUrl });
    if (ok) {
      setName("");
      setCoverUrl("");
      setOpen(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setCoverUrl("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          앨범 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 앨범 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              앨범 이름 <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="예: 2024년 정기공연"
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              커버 이미지 URL
            </label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... (선택 사항)"
              className="h-8 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={!name.trim()}
            >
              <Plus className="mr-1 h-3 w-3" />
              만들기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 사진 추가 다이얼로그 ──────────────────────────────────────

interface AddPhotoDialogProps {
  albumId: string;
  albumName: string;
  userId: string;
  onAdd: ReturnType<typeof usePhotoAlbum>["addPhoto"];
}

function AddPhotoDialog({ albumId, albumName, userId, onAdd }: AddPhotoDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [takenAt, setTakenAt] = useState("");

  function handleAddTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("사진 제목을 입력해주세요.");
      return;
    }
    const ok = onAdd(albumId, {
      title,
      imageUrl,
      description,
      tags,
      takenAt,
      uploadedBy: userId,
    });
    if (ok) {
      setTitle("");
      setImageUrl("");
      setDescription("");
      setTags([]);
      setTagInput("");
      setTakenAt("");
      setOpen(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTitle("");
      setImageUrl("");
      setDescription("");
      setTags([]);
      setTagInput("");
      setTakenAt("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          사진 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            사진 추가 — <span className="text-violet-600">{albumName}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              제목 <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="사진 제목"
              className="h-8 text-xs"
            />
          </div>

          {/* 이미지 URL */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              이미지 URL
            </label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (없으면 플레이스홀더 표시)"
              className="h-8 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">설명</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="사진 설명 (선택 사항)"
              className="min-h-[60px] resize-none text-xs"
            />
          </div>

          {/* 촬영일 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">촬영일</label>
            <input
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              title="촬영 날짜"
            />
          </div>

          {/* 태그 (콤마 또는 Enter로 구분) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">태그</label>
            <div className="flex gap-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value.slice(0, 20))}
                onKeyDown={handleTagKeyDown}
                placeholder="태그 입력 후 Enter"
                className="h-8 flex-1 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 10}
                title="태그 추가"
              >
                <Tag className="h-3 w-3" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer gap-0.5 px-1.5 py-0 text-[10px]"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="h-2.5 w-2.5" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              <Plus className="mr-1 h-3 w-3" />
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 이미지 플레이스홀더 ──────────────────────────────────────

function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gray-100 ${className ?? ""}`}
    >
      <Camera className="h-6 w-6 text-gray-300" />
    </div>
  );
}

// ─── 사진 상세 뷰 ─────────────────────────────────────────────

interface PhotoDetailViewProps {
  album: PhotoAlbum;
  userId: string;
  allTags: string[];
  onBack: () => void;
  onAddPhoto: ReturnType<typeof usePhotoAlbum>["addPhoto"];
  onDeletePhoto: (albumId: string, photoId: string) => void;
  onDeleteAlbum: ReturnType<typeof usePhotoAlbum>["deleteAlbum"];
}

function PhotoDetailView({
  album,
  userId,
  allTags,
  onBack,
  onAddPhoto,
  onDeletePhoto,
  onDeleteAlbum,
}: PhotoDetailViewProps) {
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteAlbumConfirm, setDeleteAlbumConfirm] = useState(false);
  const [deletePhotoConfirm, setDeletePhotoConfirm] = useState<string | null>(null);

  // 앨범 내 태그 목록
  const albumTags = Array.from(
    new Set(album.photos.flatMap((p) => p.tags))
  ).sort();

  // 필터링된 사진 목록
  const filteredPhotos: PhotoAlbumItem[] = album.photos.filter((photo) => {
    const matchesTag =
      tagFilter === "all" || photo.tags.includes(tagFilter);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      photo.title.toLowerCase().includes(q) ||
      photo.description.toLowerCase().includes(q) ||
      photo.tags.some((t) => t.toLowerCase().includes(q));
    return matchesTag && matchesSearch;
  });

  function handleDeleteAlbum() {
    if (!deleteAlbumConfirm) {
      setDeleteAlbumConfirm(true);
      return;
    }
    const ok = onDeleteAlbum(album.id);
    if (ok) {
      onBack();
    }
  }

  return (
    <div className="space-y-3">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          앨범 목록으로
        </button>
        <div className="flex items-center gap-1">
          <AddPhotoDialog
            albumId={album.id}
            albumName={album.name}
            userId={userId}
            onAdd={onAddPhoto}
          />
          <Button
            size="sm"
            variant="ghost"
            className={`h-7 w-7 p-0 ${
              deleteAlbumConfirm
                ? "text-red-500 hover:text-red-600"
                : "text-gray-300 hover:text-red-400"
            }`}
            onClick={handleDeleteAlbum}
            onBlur={() => setDeleteAlbumConfirm(false)}
            title={deleteAlbumConfirm ? "한 번 더 클릭하면 앨범이 삭제됩니다" : "앨범 삭제"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 앨범 정보 */}
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {album.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={album.coverUrl}
              alt={album.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <ImagePlaceholder className="h-full w-full" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{album.name}</p>
          <p className="text-[10px] text-gray-400">{album.photos.length}장의 사진</p>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="제목, 설명, 태그로 검색"
          className="h-8 pl-7 text-xs"
        />
        {searchQuery && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 태그 필터 칩 */}
      {albumTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={tagFilter === "all" ? "default" : "outline"}
            className="cursor-pointer px-1.5 py-0 text-[10px]"
            onClick={() => setTagFilter("all")}
          >
            전체
          </Badge>
          {albumTags.map((tag) => (
            <Badge
              key={tag}
              variant={tagFilter === tag ? "default" : "outline"}
              className="cursor-pointer px-1.5 py-0 text-[10px]"
              onClick={() => setTagFilter(tagFilter === tag ? "all" : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* 사진 목록 */}
      {filteredPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
          <Camera className="h-8 w-8 opacity-30" />
          <p className="text-xs">
            {album.photos.length === 0
              ? "아직 사진이 없습니다. 사진을 추가해보세요."
              : "검색 결과가 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white"
            >
              {/* 이미지 */}
              <div className="h-28 w-full overflow-hidden bg-gray-100">
                {photo.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.style.display = "none";
                      const placeholder = el.nextElementSibling as HTMLElement | null;
                      if (placeholder) placeholder.style.display = "flex";
                    }}
                  />
                ) : null}
                {/* 플레이스홀더 */}
                <div
                  className="h-full w-full items-center justify-center bg-gray-100"
                  style={{ display: photo.imageUrl ? "none" : "flex" }}
                >
                  <Camera className="h-8 w-8 text-gray-300" />
                </div>
              </div>

              {/* 삭제 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                className={`absolute right-1 top-1 h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                  deletePhotoConfirm === photo.id
                    ? "bg-red-100 text-red-600 opacity-100"
                    : "bg-white/80 text-gray-500"
                }`}
                onClick={() => {
                  if (deletePhotoConfirm === photo.id) {
                    onDeletePhoto(album.id, photo.id);
                    setDeletePhotoConfirm(null);
                  } else {
                    setDeletePhotoConfirm(photo.id);
                  }
                }}
                onBlur={() => setDeletePhotoConfirm(null)}
                title={
                  deletePhotoConfirm === photo.id
                    ? "한 번 더 클릭하면 삭제됩니다"
                    : "사진 삭제"
                }
              >
                <Trash2 className="h-3 w-3" />
              </Button>

              {/* 메타 정보 */}
              <div className="p-2 space-y-0.5">
                <p className="truncate text-[11px] font-medium text-gray-800">
                  {photo.title}
                </p>
                {photo.takenAt && (
                  <p className="text-[10px] text-gray-400">{photo.takenAt}</p>
                )}
                {photo.description && (
                  <p className="line-clamp-2 text-[10px] text-gray-500">
                    {photo.description}
                  </p>
                )}
                {photo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 pt-0.5">
                    {photo.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-violet-200 bg-violet-50 px-1 py-0 text-[9px] text-violet-600"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {photo.tags.length > 3 && (
                      <span className="text-[9px] text-gray-400">
                        +{photo.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 앨범 그리드 (목록 뷰) ────────────────────────────────────

interface AlbumGridProps {
  albums: PhotoAlbum[];
  onSelectAlbum: (album: PhotoAlbum) => void;
  onDeleteAlbum: ReturnType<typeof usePhotoAlbum>["deleteAlbum"];
}

function AlbumGrid({ albums, onSelectAlbum, onDeleteAlbum }: AlbumGridProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
        <FolderOpen className="h-8 w-8 opacity-30" />
        <p className="text-xs">앨범이 없습니다. 앨범을 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {albums.map((album) => (
        <div
          key={album.id}
          className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-100 bg-white transition-shadow hover:shadow-sm"
          onClick={() => onSelectAlbum(album)}
        >
          {/* 커버 이미지 */}
          <div className="h-24 w-full overflow-hidden bg-gray-100">
            {album.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={album.coverUrl}
                alt={album.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                  const placeholder = el.nextElementSibling as HTMLElement | null;
                  if (placeholder) placeholder.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="h-full w-full items-center justify-center bg-gray-100"
              style={{ display: album.coverUrl ? "none" : "flex" }}
            >
              <FolderOpen className="h-8 w-8 text-gray-300" />
            </div>
          </div>

          {/* 삭제 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            className={`absolute right-1 top-1 h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100 ${
              deleteConfirm === album.id
                ? "bg-red-100 text-red-600 opacity-100"
                : "bg-white/80 text-gray-500"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (deleteConfirm === album.id) {
                onDeleteAlbum(album.id);
                setDeleteConfirm(null);
              } else {
                setDeleteConfirm(album.id);
              }
            }}
            onBlur={() => setDeleteConfirm(null)}
            title={
              deleteConfirm === album.id
                ? "한 번 더 클릭하면 삭제됩니다"
                : "앨범 삭제"
            }
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          {/* 앨범 정보 */}
          <div className="p-2">
            <p className="truncate text-xs font-medium text-gray-800">
              {album.name}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                <ImageIcon className="h-2.5 w-2.5" />
                {album.photos.length}장
              </span>
              <span className="text-[10px] text-gray-300">
                {new Date(album.createdAt).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface PhotoAlbumCardProps {
  groupId: string;
  userId: string;
}

export function PhotoAlbumCard({ groupId, userId }: PhotoAlbumCardProps) {
  const [open, setOpen] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);

  const {
    albums,
    totalAlbums,
    totalPhotos,
    allTags,
    addAlbum,
    deleteAlbum,
    addPhoto,
    deletePhoto,
  } = usePhotoAlbum(groupId);

  function handleDeletePhoto(albumId: string, photoId: string) {
    deletePhoto(albumId, photoId);
  }

  // 앨범 삭제 시 상세 뷰에서 목록 뷰로 전환
  function handleDeleteAlbum(albumId: string): boolean {
    const ok = deleteAlbum(albumId);
    if (ok && selectedAlbum?.id === albumId) {
      setSelectedAlbum(null);
    }
    return ok;
  }

  // 선택된 앨범이 변경될 수 있으므로 최신 데이터 반영
  const currentAlbum = selectedAlbum
    ? albums.find((a) => a.id === selectedAlbum.id) ?? null
    : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-800">포토 앨범</span>
          {totalAlbums > 0 && (
            <Badge className="bg-violet-100 px-1.5 py-0 text-[10px] text-violet-600 hover:bg-violet-100">
              앨범 {totalAlbums}
            </Badge>
          )}
          {totalPhotos > 0 && (
            <Badge className="bg-blue-100 px-1.5 py-0 text-[10px] text-blue-600 hover:bg-blue-100">
              사진 {totalPhotos}
            </Badge>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            {open ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* 본문 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-white p-4 space-y-4">

          {/* 통계 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-violet-50 px-3 py-2 text-center">
              <div className="text-sm font-bold text-violet-700">{totalAlbums}</div>
              <div className="mt-0.5 text-[10px] text-gray-500">앨범</div>
            </div>
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
              <div className="text-sm font-bold text-blue-700">{totalPhotos}</div>
              <div className="mt-0.5 text-[10px] text-gray-500">총 사진</div>
            </div>
          </div>

          {/* 앨범 상세 뷰 또는 목록 뷰 */}
          {currentAlbum ? (
            <PhotoDetailView
              album={currentAlbum}
              userId={userId}
              allTags={allTags}
              onBack={() => setSelectedAlbum(null)}
              onAddPhoto={addPhoto}
              onDeletePhoto={handleDeletePhoto}
              onDeleteAlbum={handleDeleteAlbum}
            />
          ) : (
            <>
              {/* 앨범 추가 버튼 */}
              <AddAlbumDialog onAdd={addAlbum} />

              {/* 앨범 그리드 */}
              <AlbumGrid
                albums={albums}
                onSelectAlbum={setSelectedAlbum}
                onDeleteAlbum={handleDeleteAlbum}
              />
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
