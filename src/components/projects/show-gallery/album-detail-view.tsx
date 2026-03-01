"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { ShowGalleryAlbum, ShowGalleryCategory } from "@/types";
import { CATEGORY_LABELS } from "./types";
import { PhotoGridItem } from "./photo-grid-item";

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

export function AlbumDetailView({
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

  const emptyMessage =
    categoryFilter === "all"
      ? "아직 사진이 없습니다."
      : `"${CATEGORY_LABELS[categoryFilter]}" 카테고리 사진이 없습니다.`;

  return (
    <section className="space-y-3" aria-label={`${album.name} 앨범 상세`}>
      {/* 앨범 헤더 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2 gap-1"
          onClick={onBack}
          aria-label="앨범 목록으로 돌아가기"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          앨범 목록
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" title={album.name}>
            {album.name}
          </p>
          {album.description && (
            <p className="text-[10px] text-muted-foreground truncate" title={album.description}>
              {album.description}
            </p>
          )}
        </div>
        <Badge
          className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 shrink-0"
          aria-label={`사진 ${album.photos.length}장`}
        >
          {album.photos.length}장
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2 shrink-0"
          onClick={onAddPhotoClick}
          aria-label="사진 추가"
        >
          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
          사진
        </Button>
      </div>

      {/* 카테고리 필터 칩 */}
      {availableCategories.length > 1 && (
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="카테고리 필터"
        >
          <button
            onClick={() => onCategoryFilterChange("all")}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              categoryFilter === "all"
                ? "bg-indigo-500 text-white border-indigo-500"
                : "border-border/50 text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={categoryFilter === "all"}
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
                aria-pressed={categoryFilter === cat}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* 사진 그리드 */}
      {filteredPhotos.length === 0 ? (
        <div
          className="text-center py-6 space-y-2"
          role="status"
          aria-live="polite"
        >
          <ImageIcon
            className="h-8 w-8 text-muted-foreground/40 mx-auto"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
          {categoryFilter === "all" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onAddPhotoClick}
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              첫 번째 사진 추가
            </Button>
          )}
        </div>
      ) : (
        <div
          className="grid grid-cols-3 gap-2"
          role="list"
          aria-label={`${album.name} 사진 목록, 총 ${filteredPhotos.length}장`}
          aria-live="polite"
        >
          {filteredPhotos.map((photo) => (
            <div key={photo.id} role="listitem">
              <PhotoGridItem
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
