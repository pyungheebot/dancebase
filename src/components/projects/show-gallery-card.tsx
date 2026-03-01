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
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ImageIcon,
  Heart,
  Star,
  ArrowLeft,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useShowGallery } from "@/hooks/use-show-gallery";
import type { ShowGalleryAlbum, ShowGalleryPhoto, ShowGalleryCategory } from "@/types";

// ============================================================
// 상수
// ============================================================

const CATEGORY_LABELS: Record<ShowGalleryCategory, string> = {
  rehearsal: "리허설",
  backstage: "백스테이지",
  performance: "공연",
  group_photo: "단체 사진",
  poster: "포스터",
  other: "기타",
};

const CATEGORY_COLORS: Record<ShowGalleryCategory, string> = {
  rehearsal: "bg-blue-100 text-blue-700",
  backstage: "bg-purple-100 text-purple-700",
  performance: "bg-red-100 text-red-700",
  group_photo: "bg-green-100 text-green-700",
  poster: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-600",
};

// 앨범 커버용 플레이스홀더 색상 (앨범 id 기반)
const COVER_COLORS = [
  "bg-rose-200",
  "bg-sky-200",
  "bg-violet-200",
  "bg-amber-200",
  "bg-emerald-200",
  "bg-pink-200",
  "bg-indigo-200",
  "bg-teal-200",
];

function getCoverColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  }
  return COVER_COLORS[hash % COVER_COLORS.length];
}

const PHOTO_PLACEHOLDER_COLORS = [
  "bg-slate-200",
  "bg-zinc-200",
  "bg-stone-200",
  "bg-red-100",
  "bg-orange-100",
  "bg-yellow-100",
  "bg-lime-100",
  "bg-cyan-100",
];

function getPhotoPlaceholderColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  }
  return PHOTO_PLACEHOLDER_COLORS[hash % PHOTO_PLACEHOLDER_COLORS.length];
}

// ============================================================
// 카테고리 배지
// ============================================================

function CategoryBadge({ category }: { category: ShowGalleryCategory }) {
  return (
    <Badge className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[category]}`}>
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}

// ============================================================
// 앨범 생성 다이얼로그
// ============================================================

interface CreateAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => void;
}

function CreateAlbumDialog({ open, onClose, onSubmit }: CreateAlbumDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(TOAST.GALLERY.ALBUM_NAME_REQUIRED);
      return;
    }
    onSubmit(trimmedName, description.trim() || undefined);
    setName("");
    setDescription("");
    onClose();
  }

  function handleClose() {
    setName("");
    setDescription("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-indigo-500" />
            새 앨범 만들기
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          <div className="space-y-1">
            <Label htmlFor="album-name" className="text-xs">
              앨범 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="album-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 2026 봄 공연"
              className="h-7 text-xs"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="album-desc" className="text-xs">설명</Label>
            <Textarea
              id="album-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="앨범 설명을 입력하세요..."
              className="text-xs resize-none min-h-[56px]"
              rows={3}
            />
          </div>
          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              만들기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 사진 추가 다이얼로그
// ============================================================

interface AddPhotoDialogProps {
  open: boolean;
  onClose: () => void;
  albums: ShowGalleryAlbum[];
  defaultAlbumId?: string;
  onSubmit: (
    albumId: string,
    title: string,
    description: string | undefined,
    category: ShowGalleryCategory,
    photographer: string | undefined,
    tags: string[]
  ) => void;
}

function AddPhotoDialog({
  open,
  onClose,
  albums,
  defaultAlbumId,
  onSubmit,
}: AddPhotoDialogProps) {
  const [albumId, setAlbumId] = useState(defaultAlbumId ?? albums[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ShowGalleryCategory>("performance");
  const [photographer, setPhotographer] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error(TOAST.GALLERY.PHOTO_TITLE_REQUIRED);
      return;
    }
    if (!albumId) {
      toast.error(TOAST.GALLERY.ALBUM_SELECT_REQUIRED);
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit(
      albumId,
      trimmedTitle,
      description.trim() || undefined,
      category,
      photographer.trim() || undefined,
      tags
    );
    setTitle("");
    setDescription("");
    setCategory("performance");
    setPhotographer("");
    setTagsInput("");
    onClose();
  }

  function handleClose() {
    setTitle("");
    setDescription("");
    setCategory("performance");
    setPhotographer("");
    setTagsInput("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4 text-pink-500" />
            사진 추가
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          {/* 앨범 선택 */}
          {albums.length > 1 && (
            <div className="space-y-1">
              <Label className="text-xs">앨범</Label>
              <Select value={albumId} onValueChange={setAlbumId}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="앨범 선택" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor="photo-title" className="text-xs">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="photo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 하이라이트 장면"
              className="h-7 text-xs"
              autoFocus
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label htmlFor="photo-desc" className="text-xs">설명</Label>
            <Textarea
              id="photo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="사진 설명..."
              className="text-xs resize-none min-h-[48px]"
              rows={2}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ShowGalleryCategory)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(CATEGORY_LABELS) as ShowGalleryCategory[]
                ).map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 촬영자 */}
          <div className="space-y-1">
            <Label htmlFor="photo-photographer" className="text-xs">
              촬영자
            </Label>
            <Input
              id="photo-photographer"
              value={photographer}
              onChange={(e) => setPhotographer(e.target.value)}
              placeholder="예: 김철수"
              className="h-7 text-xs"
            />
          </div>

          {/* 태그 */}
          <div className="space-y-1">
            <Label htmlFor="photo-tags" className="text-xs">
              태그{" "}
              <span className="text-muted-foreground">(쉼표로 구분)</span>
            </Label>
            <Input
              id="photo-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="예: 메인무대, 솔로, 클라이맥스"
              className="h-7 text-xs"
            />
            {tagsInput.trim() && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {tagsInput
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 사진 그리드 아이템
// ============================================================

interface PhotoGridItemProps {
  photo: ShowGalleryPhoto;
  onToggleLike: (photoId: string) => void;
  onToggleFavorite: (photoId: string) => void;
  onDelete: (photoId: string) => void;
}

function PhotoGridItem({
  photo,
  onToggleLike,
  onToggleFavorite,
  onDelete,
}: PhotoGridItemProps) {
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-background group">
      {/* 플레이스홀더 이미지 */}
      <div
        className={`relative w-full h-20 flex items-center justify-center ${getPhotoPlaceholderColor(photo.id)}`}
      >
        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
        {/* 즐겨찾기 별 */}
        <button
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onToggleFavorite(photo.id)}
          title={photo.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
        >
          <Star
            className={`h-3.5 w-3.5 transition-colors ${
              photo.isFavorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-white drop-shadow"
            }`}
          />
        </button>
        {/* 삭제 버튼 */}
        <button
          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(photo.id)}
          title="삭제"
        >
          <Trash2 className="h-3 w-3 text-white drop-shadow" />
        </button>
      </div>

      {/* 정보 */}
      <div className="p-1.5 space-y-1">
        <p className="text-[10px] font-medium truncate leading-tight">
          {photo.title}
        </p>
        <div className="flex items-center justify-between">
          <CategoryBadge category={photo.category} />
          {/* 좋아요 */}
          <button
            className={`flex items-center gap-0.5 text-[10px] transition-colors ${
              photo.likes.length > 0
                ? "text-red-500"
                : "text-muted-foreground hover:text-red-400"
            }`}
            onClick={() => onToggleLike(photo.id)}
            title="좋아요"
          >
            <Heart
              className={`h-3 w-3 ${photo.likes.length > 0 ? "fill-red-500" : ""}`}
            />
            {photo.likes.length > 0 && photo.likes.length}
          </button>
        </div>
        {photo.photographer && (
          <p className="text-[10px] text-muted-foreground truncate">
            <Camera className="h-2.5 w-2.5 inline mr-0.5" />
            {photo.photographer}
          </p>
        )}
        {photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {photo.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="text-[9px] px-1 py-0 rounded bg-muted/50 text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
            {photo.tags.length > 2 && (
              <span className="text-[9px] text-muted-foreground">
                +{photo.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 앨범 상세 뷰
// ============================================================

interface AlbumDetailViewProps {
  album: ShowGalleryAlbum;
  categoryFilter: ShowGalleryCategory | "all";
  onCategoryFilterChange: (c: ShowGalleryCategory | "all") => void;
  onToggleLike: (albumId: string, photoId: string) => void;
  onToggleFavorite: (albumId: string, photoId: string) => void;
  onDeletePhoto: (albumId: string, photoId: string) => void;
  onAddPhotoClick: () => void;
  onBack: () => void;
}

function AlbumDetailView({
  album,
  categoryFilter,
  onCategoryFilterChange,
  onToggleLike,
  onToggleFavorite,
  onDeletePhoto,
  onAddPhotoClick,
  onBack,
}: AlbumDetailViewProps) {
  // 이 앨범에 있는 카테고리만 필터 옵션에 표시
  const availableCategories = Array.from(
    new Set(album.photos.map((p) => p.category))
  ) as ShowGalleryCategory[];

  const filteredPhotos =
    categoryFilter === "all"
      ? album.photos
      : album.photos.filter((p) => p.category === categoryFilter);

  return (
    <div className="space-y-3">
      {/* 앨범 헤더 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2 gap-1"
          onClick={onBack}
        >
          <ArrowLeft className="h-3 w-3" />
          앨범 목록
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{album.name}</p>
          {album.description && (
            <p className="text-[10px] text-muted-foreground truncate">
              {album.description}
            </p>
          )}
        </div>
        <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 shrink-0">
          {album.photos.length}장
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2 shrink-0"
          onClick={onAddPhotoClick}
        >
          <Plus className="h-3 w-3 mr-1" />
          사진
        </Button>
      </div>

      {/* 카테고리 필터 칩 */}
      {availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onCategoryFilterChange("all")}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              categoryFilter === "all"
                ? "bg-indigo-500 text-white border-indigo-500"
                : "border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            전체 ({album.photos.length})
          </button>
          {availableCategories.map((cat) => {
            const count = album.photos.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => onCategoryFilterChange(cat)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  categoryFilter === cat
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* 사진 그리드 */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-xs text-muted-foreground">
            {categoryFilter === "all"
              ? "아직 사진이 없습니다."
              : `"${CATEGORY_LABELS[categoryFilter]}" 카테고리 사진이 없습니다.`}
          </p>
          {categoryFilter === "all" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onAddPhotoClick}
            >
              <Plus className="h-3 w-3 mr-1" />
              첫 번째 사진 추가
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filteredPhotos.map((photo) => (
            <PhotoGridItem
              key={photo.id}
              photo={photo}
              onToggleLike={(photoId) => onToggleLike(album.id, photoId)}
              onToggleFavorite={(photoId) =>
                onToggleFavorite(album.id, photoId)
              }
              onDelete={(photoId) => {
                onDeletePhoto(album.id, photoId);
                toast.success(TOAST.GALLERY.PHOTO_DELETED);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 앨범 목록 그리드 아이템
// ============================================================

interface AlbumGridItemProps {
  album: ShowGalleryAlbum;
  onOpen: () => void;
  onDelete: () => void;
}

function AlbumGridItem({ album, onOpen, onDelete }: AlbumGridItemProps) {
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-background group cursor-pointer hover:border-indigo-300 transition-colors">
      {/* 커버 플레이스홀더 */}
      <div
        className={`relative w-full h-24 flex items-center justify-center ${getCoverColor(album.id)}`}
        onClick={onOpen}
      >
        <ImageIcon className="h-7 w-7 text-muted-foreground/60" />
        {/* 삭제 버튼 */}
        <button
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="앨범 삭제"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive bg-background/80 rounded p-0.5 box-content" />
        </button>
        {album.photos.length > 0 && (
          <Badge className="absolute bottom-1 right-1 text-[9px] px-1 py-0 bg-black/40 text-white border-0">
            {album.photos.length}장
          </Badge>
        )}
      </div>

      {/* 앨범 정보 */}
      <div className="p-2" onClick={onOpen}>
        <p className="text-xs font-medium truncate">{album.name}</p>
        {album.description && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {album.description}
          </p>
        )}
        {album.photos.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-1">
            {Array.from(new Set(album.photos.map((p) => p.category)))
              .slice(0, 2)
              .map((cat) => (
                <CategoryBadge key={cat} category={cat as ShowGalleryCategory} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 메인 카드
// ============================================================

interface ShowGalleryCardProps {
  groupId: string;
  projectId: string;
}

export function ShowGalleryCard({ groupId, projectId }: ShowGalleryCardProps) {
  const [cardOpen, setCardOpen] = useState(true);
  const [showCreateAlbumDialog, setShowCreateAlbumDialog] = useState(false);
  const [showAddPhotoDialog, setShowAddPhotoDialog] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<
    ShowGalleryCategory | "all"
  >("all");

  const {
    albums,
    loading,
    createAlbum,
    deleteAlbum,
    addPhoto,
    deletePhoto,
    toggleLike,
    toggleFavorite,
    stats,
  } = useShowGallery(groupId, projectId);

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId) ?? null;

  function handleOpenAlbum(albumId: string) {
    setSelectedAlbumId(albumId);
    setCategoryFilter("all");
  }

  function handleBackToList() {
    setSelectedAlbumId(null);
    setCategoryFilter("all");
  }

  function handleDeleteAlbum(albumId: string) {
    deleteAlbum(albumId);
    if (selectedAlbumId === albumId) {
      setSelectedAlbumId(null);
    }
    toast.success(TOAST.GALLERY.ALBUM_DELETED);
  }

  function handleAddPhotoClick(albumId?: string) {
    if (albumId) setSelectedAlbumId(albumId);
    setShowAddPhotoDialog(true);
  }

  return (
    <>
      <Card className="shadow-sm">
        <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
          <CardHeader className="py-2 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-indigo-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 사진 갤러리
                  </CardTitle>
                  {stats.totalAlbums > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700">
                      앨범 {stats.totalAlbums}
                    </Badge>
                  )}
                  {stats.totalPhotos > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-700">
                      {stats.totalPhotos}장
                    </Badge>
                  )}
                  {stats.favoriteCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700">
                      <Star className="h-2.5 w-2.5 inline mr-0.5 fill-yellow-500 text-yellow-500" />
                      {stats.favoriteCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreateAlbumDialog(true);
                      if (!cardOpen) setCardOpen(true);
                    }}
                    title="앨범 만들기"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  {cardOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">불러오는 중...</p>
                </div>
              ) : selectedAlbum ? (
                // 앨범 상세 뷰
                <AlbumDetailView
                  album={selectedAlbum}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  onToggleLike={(albumId, photoId) => {
                    toggleLike(albumId, photoId, "나");
                  }}
                  onToggleFavorite={(albumId, photoId) => {
                    toggleFavorite(albumId, photoId);
                  }}
                  onDeletePhoto={deletePhoto}
                  onAddPhotoClick={() => handleAddPhotoClick(selectedAlbum.id)}
                  onBack={handleBackToList}
                />
              ) : albums.length === 0 ? (
                // 빈 상태
                <div className="text-center py-6 space-y-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    아직 앨범이 없습니다.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowCreateAlbumDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    첫 번째 앨범 만들기
                  </Button>
                </div>
              ) : (
                // 앨범 목록 그리드
                <div className="grid grid-cols-2 gap-2">
                  {albums.map((album) => (
                    <AlbumGridItem
                      key={album.id}
                      album={album}
                      onOpen={() => handleOpenAlbum(album.id)}
                      onDelete={() => handleDeleteAlbum(album.id)}
                    />
                  ))}
                  {/* 앨범 추가 버튼 */}
                  <button
                    className="border border-dashed border-border/50 rounded-lg h-[calc(24px+2.5rem+2rem)] flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-indigo-500 hover:border-indigo-300 transition-colors"
                    onClick={() => setShowCreateAlbumDialog(true)}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-[10px]">새 앨범</span>
                  </button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 앨범 생성 다이얼로그 */}
      <CreateAlbumDialog
        open={showCreateAlbumDialog}
        onClose={() => setShowCreateAlbumDialog(false)}
        onSubmit={(name, description) => {
          const album = createAlbum(name, description);
          toast.success(TOAST.GALLERY.ALBUM_CREATED);
          setSelectedAlbumId(album.id);
        }}
      />

      {/* 사진 추가 다이얼로그 */}
      <AddPhotoDialog
        open={showAddPhotoDialog}
        onClose={() => setShowAddPhotoDialog(false)}
        albums={albums}
        defaultAlbumId={selectedAlbumId ?? albums[0]?.id}
        onSubmit={(albumId, title, description, category, photographer, tags) => {
          addPhoto(albumId, title, description, category, photographer, tags);
          toast.success(TOAST.GALLERY.PHOTO_ADDED);
        }}
      />
    </>
  );
}
