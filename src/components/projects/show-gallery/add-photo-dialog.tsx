"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Camera } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { ShowGalleryAlbum, ShowGalleryCategory } from "@/types";
import { CATEGORY_LABELS } from "./types";

export interface AddPhotoDialogProps {
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

export function AddPhotoDialog({
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

  const parsedTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm" aria-describedby="add-photo-desc">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4 text-pink-500" aria-hidden="true" />
            사진 추가
          </DialogTitle>
          <p id="add-photo-desc" className="sr-only">
            앨범을 선택하고 사진 정보를 입력하여 사진을 추가하세요.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          {/* 앨범 선택 */}
          {albums.length > 1 && (
            <div className="space-y-1">
              <Label htmlFor="photo-album-select" className="text-xs">앨범</Label>
              <Select value={albumId} onValueChange={setAlbumId}>
                <SelectTrigger
                  id="photo-album-select"
                  className="h-7 text-xs"
                  aria-label="앨범 선택"
                >
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
              제목 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id="photo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 하이라이트 장면"
              className="h-7 text-xs"
              autoFocus
              required
              aria-required="true"
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
            <Label htmlFor="photo-category-select" className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ShowGalleryCategory)}
            >
              <SelectTrigger
                id="photo-category-select"
                className="h-7 text-xs"
                aria-label="카테고리 선택"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as ShowGalleryCategory[]).map(
                  (cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  )
                )}
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
              aria-describedby={parsedTags.length > 0 ? "photo-tags-preview" : undefined}
            />
            {parsedTags.length > 0 && (
              <div
                id="photo-tags-preview"
                className="flex flex-wrap gap-1 pt-0.5"
                aria-live="polite"
                aria-label="입력된 태그 미리보기"
              >
                {parsedTags.map((t, i) => (
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
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
