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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  ImageIcon,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useShowGallery } from "@/hooks/use-show-gallery";
import type { ShowGalleryCategory } from "@/types";

import { CreateAlbumDialog } from "./show-gallery/create-album-dialog";
import { AddPhotoDialog } from "./show-gallery/add-photo-dialog";
import { AlbumDetailView } from "./show-gallery/album-detail-view";
import { AlbumGridItem } from "./show-gallery/album-grid-item";

// ============================================================
// Props
// ============================================================

interface ShowGalleryCardProps {
  groupId: string;
  projectId: string;
}

// ============================================================
// 메인 카드
// ============================================================

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

  // ---- 핸들러 ----

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

  function handleCreateAlbumSubmit(name: string, description?: string) {
    const album = createAlbum(name, description);
    toast.success(TOAST.GALLERY.ALBUM_CREATED);
    setSelectedAlbumId(album.id);
  }

  function handleAddPhotoSubmit(
    albumId: string,
    title: string,
    description: string | undefined,
    category: ShowGalleryCategory,
    photographer: string | undefined,
    tags: string[]
  ) {
    addPhoto(albumId, title, description, category, photographer, tags);
    toast.success(TOAST.GALLERY.PHOTO_ADDED);
  }

  // ---- 렌더 ----

  return (
    <>
      <Card className="shadow-sm">
        <Collapsible
          open={cardOpen}
          onOpenChange={setCardOpen}
        >
          <CardHeader className="py-2 px-4">
            <CollapsibleTrigger asChild>
              <div
                className="flex items-center justify-between cursor-pointer"
                role="button"
                aria-expanded={cardOpen}
                aria-controls="show-gallery-content"
                aria-label={`공연 사진 갤러리 섹션 ${cardOpen ? "접기" : "펼치기"}`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon
                    className="h-4 w-4 text-indigo-500"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-sm font-semibold">
                    공연 사진 갤러리
                  </CardTitle>
                  {stats.totalAlbums > 0 && (
                    <Badge
                      className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700"
                      aria-label={`앨범 ${stats.totalAlbums}개`}
                    >
                      앨범 {stats.totalAlbums}
                    </Badge>
                  )}
                  {stats.totalPhotos > 0 && (
                    <Badge
                      className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-700"
                      aria-label={`사진 ${stats.totalPhotos}장`}
                    >
                      {stats.totalPhotos}장
                    </Badge>
                  )}
                  {stats.favoriteCount > 0 && (
                    <Badge
                      className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700"
                      aria-label={`즐겨찾기 ${stats.favoriteCount}개`}
                    >
                      <Star
                        className="h-2.5 w-2.5 inline mr-0.5 fill-yellow-500 text-yellow-500"
                        aria-hidden="true"
                      />
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
                    aria-label="새 앨범 만들기"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  {cardOpen ? (
                    <ChevronUp
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDown
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent id="show-gallery-content">
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <div
                  className="text-center py-4"
                  role="status"
                  aria-live="polite"
                  aria-label="갤러리 불러오는 중"
                >
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
                <div
                  className="text-center py-6 space-y-2"
                  role="status"
                  aria-live="polite"
                >
                  <ImageIcon
                    className="h-8 w-8 text-muted-foreground/40 mx-auto"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-muted-foreground">
                    아직 앨범이 없습니다.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowCreateAlbumDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                    첫 번째 앨범 만들기
                  </Button>
                </div>
              ) : (
                // 앨범 목록 그리드
                <div
                  className="grid grid-cols-2 gap-2"
                  role="list"
                  aria-label={`앨범 목록, 총 ${albums.length}개`}
                >
                  {albums.map((album) => (
                    <div key={album.id} role="listitem">
                      <AlbumGridItem
                        album={album}
                        onOpen={() => handleOpenAlbum(album.id)}
                        onDelete={() => handleDeleteAlbum(album.id)}
                      />
                    </div>
                  ))}
                  {/* 앨범 추가 버튼 */}
                  <button
                    className="border border-dashed border-border/50 rounded-lg h-[calc(24px+2.5rem+2rem)] flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-indigo-500 hover:border-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none transition-colors"
                    onClick={() => setShowCreateAlbumDialog(true)}
                    aria-label="새 앨범 만들기"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
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
        onSubmit={handleCreateAlbumSubmit}
      />

      {/* 사진 추가 다이얼로그 */}
      <AddPhotoDialog
        open={showAddPhotoDialog}
        onClose={() => setShowAddPhotoDialog(false)}
        albums={albums}
        defaultAlbumId={selectedAlbumId ?? albums[0]?.id}
        onSubmit={handleAddPhotoSubmit}
      />
    </>
  );
}
