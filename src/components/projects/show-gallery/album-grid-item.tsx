"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Trash2 } from "lucide-react";
import type { ShowGalleryAlbum, ShowGalleryCategory } from "@/types";
import { CategoryBadge } from "./category-badge";
import { getCoverColor } from "./types";

interface AlbumGridItemProps {
  album: ShowGalleryAlbum;
  onOpen: () => void;
  onDelete: () => void;
}

export const AlbumGridItem = memo(function AlbumGridItem({
  album,
  onOpen,
  onDelete,
}: AlbumGridItemProps) {
  const uniqueCategories = Array.from(
    new Set(album.photos.map((p) => p.category))
  ) as ShowGalleryCategory[];

  return (
    <article
      className="border border-border/50 rounded-lg overflow-hidden bg-background group cursor-pointer hover:border-indigo-300 transition-colors"
      aria-label={`앨범: ${album.name}, 사진 ${album.photos.length}장`}
    >
      {/* 커버 플레이스홀더 */}
      <div
        className={`relative w-full h-24 flex items-center justify-center ${getCoverColor(album.id)}`}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        aria-label={`${album.name} 앨범 열기`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <ImageIcon className="h-7 w-7 text-muted-foreground/60" aria-hidden="true" />

        {/* 삭제 버튼 */}
        <button
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`${album.name} 앨범 삭제`}
        >
          <Trash2
            className="h-3.5 w-3.5 text-destructive bg-background/80 rounded p-0.5 box-content"
            aria-hidden="true"
          />
        </button>

        {album.photos.length > 0 && (
          <Badge
            className="absolute bottom-1 right-1 text-[9px] px-1 py-0 bg-black/40 text-white border-0"
            aria-hidden="true"
          >
            {album.photos.length}장
          </Badge>
        )}
      </div>

      {/* 앨범 정보 */}
      <div className="p-2" onClick={onOpen} role="button" tabIndex={-1} aria-hidden="true">
        <p className="text-xs font-medium truncate" title={album.name}>
          {album.name}
        </p>
        {album.description && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5" title={album.description}>
            {album.description}
          </p>
        )}
        {uniqueCategories.length > 0 && (
          <div
            className="flex flex-wrap gap-0.5 mt-1"
            role="list"
            aria-label="포함된 카테고리"
          >
            {uniqueCategories.slice(0, 2).map((cat) => (
              <span key={cat} role="listitem">
                <CategoryBadge category={cat} />
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
});
