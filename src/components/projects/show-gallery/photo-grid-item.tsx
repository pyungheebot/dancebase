"use client";

import { memo } from "react";
import { ImageIcon, Heart, Star, Trash2, Camera } from "lucide-react";
import type { ShowGalleryPhoto } from "@/types";
import { CategoryBadge } from "./category-badge";
import { getPhotoPlaceholderColor } from "./types";

interface PhotoGridItemProps {
  photo: ShowGalleryPhoto;
  onToggleLike: (photoId: string) => void;
  onToggleFavorite: (photoId: string) => void;
  onDelete: (photoId: string) => void;
}

export const PhotoGridItem = memo(function PhotoGridItem({
  photo,
  onToggleLike,
  onToggleFavorite,
  onDelete,
}: PhotoGridItemProps) {
  const likeCount = photo.likes.length;

  return (
    <article
      className="border border-border/50 rounded-lg overflow-hidden bg-background group"
      aria-label={`사진: ${photo.title}`}
    >
      {/* 플레이스홀더 이미지 */}
      <div
        className={`relative w-full h-20 flex items-center justify-center ${getPhotoPlaceholderColor(photo.id)}`}
        role="img"
        aria-label={`${photo.title} 이미지 플레이스홀더`}
      >
        <ImageIcon className="h-6 w-6 text-muted-foreground/50" aria-hidden="true" />

        {/* 즐겨찾기 별 */}
        <button
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          onClick={() => onToggleFavorite(photo.id)}
          aria-label={photo.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          aria-pressed={photo.isFavorite}
        >
          <Star
            className={`h-3.5 w-3.5 transition-colors ${
              photo.isFavorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-white drop-shadow"
            }`}
            aria-hidden="true"
          />
        </button>

        {/* 삭제 버튼 */}
        <button
          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          onClick={() => onDelete(photo.id)}
          aria-label={`${photo.title} 사진 삭제`}
        >
          <Trash2 className="h-3 w-3 text-white drop-shadow" aria-hidden="true" />
        </button>
      </div>

      {/* 정보 */}
      <div className="p-1.5 space-y-1">
        <p className="text-[10px] font-medium truncate leading-tight" title={photo.title}>
          {photo.title}
        </p>
        <div className="flex items-center justify-between">
          <CategoryBadge category={photo.category} />
          {/* 좋아요 */}
          <button
            className={`flex items-center gap-0.5 text-[10px] transition-colors ${
              likeCount > 0
                ? "text-red-500"
                : "text-muted-foreground hover:text-red-400"
            }`}
            onClick={() => onToggleLike(photo.id)}
            aria-label={`좋아요 ${likeCount > 0 ? `(${likeCount}개)` : ""}`}
            aria-pressed={likeCount > 0}
          >
            <Heart
              className={`h-3 w-3 ${likeCount > 0 ? "fill-red-500" : ""}`}
              aria-hidden="true"
            />
            {likeCount > 0 && <span aria-hidden="true">{likeCount}</span>}
          </button>
        </div>
        {photo.photographer && (
          <p className="text-[10px] text-muted-foreground truncate">
            <Camera className="h-2.5 w-2.5 inline mr-0.5" aria-hidden="true" />
            <span>{photo.photographer}</span>
          </p>
        )}
        {photo.tags.length > 0 && (
          <div
            className="flex flex-wrap gap-0.5"
            role="list"
            aria-label="태그 목록"
          >
            {photo.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                role="listitem"
                className="text-[9px] px-1 py-0 rounded bg-muted/50 text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
            {photo.tags.length > 2 && (
              <span
                className="text-[9px] text-muted-foreground"
                aria-label={`외 ${photo.tags.length - 2}개 태그`}
              >
                +{photo.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
});
