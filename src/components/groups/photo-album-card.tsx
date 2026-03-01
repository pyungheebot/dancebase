"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Image as ImageIcon,
  FolderOpen,
  Search,
  Tag,
  X,
  CalendarDays,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Image from "next/image";
import { usePhotoAlbum } from "@/hooks/use-photo-album";
import type { PhotoAlbum, PhotoAlbumItem } from "@/types";

// ─── 앨범 생성 폼 ─────────────────────────────────────────────

interface CreateAlbumFormProps {
  onAdd: (input: { name: string; coverUrl?: string }) => boolean;
  onClose: () => void;
}

function CreateAlbumForm({ onAdd, onClose }: CreateAlbumFormProps) {
  const [name, setName] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  function handleSubmit() {
    const ok = onAdd({ name, coverUrl });
    if (ok) {
      setName("");
      setCoverUrl("");
      onClose();
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-violet-300 bg-violet-50 p-3 space-y-2">
      <p className="text-xs font-medium text-violet-700">새 앨범 만들기</p>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 40))}
        placeholder="앨범 이름 (예: 2024년 정기공연)"
        className="h-8 text-xs"
      />
      <Input
        value={coverUrl}
        onChange={(e) => setCoverUrl(e.target.value)}
        placeholder="커버 이미지 URL (선택)"
        className="h-8 text-xs"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          <Plus className="mr-1 h-3 w-3" />
          만들기
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 사진 추가 폼 ─────────────────────────────────────────────

interface AddPhotoFormProps {
  albumId: string;
  onAdd: (albumId: string, input: Omit<PhotoAlbumItem, "id" | "createdAt">) => boolean;
  onClose: () => void;
}

function AddPhotoForm({ albumId, onAdd, onClose }: AddPhotoFormProps) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }

  function handleSubmit() {
    const ok = onAdd(albumId, {
      title,
      imageUrl,
      description,
      tags,
      takenAt,
      uploadedBy,
    });
    if (ok) {
      setTitle("");
      setImageUrl("");
      setDescription("");
      setTakenAt("");
      setUploadedBy("");
      setTags([]);
      setTagInput("");
      onClose();
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3 space-y-2">
      <p className="text-xs font-medium text-blue-700">사진 추가</p>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 60))}
        placeholder="사진 제목 *"
        className="h-8 text-xs"
      />

      <Input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="이미지 URL (없으면 플레이스홀더 표시)"
        className="h-8 text-xs"
      />

      <div className="flex gap-2">
        <div className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3 text-gray-400 shrink-0" />
          <input
            type="date"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
            title="촬영 날짜"
          />
        </div>
        <div className="flex flex-1 items-center gap-1">
          <User className="h-3 w-3 text-gray-400 shrink-0" />
          <Input
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value.slice(0, 20))}
            placeholder="업로더 이름 (선택)"
            className="h-8 flex-1 text-xs"
          />
        </div>
      </div>

      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, 200))}
        placeholder="설명 (선택)"
        className="h-8 text-xs"
      />

      <div className="space-y-1">
        <div className="flex gap-1">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value.slice(0, 20))}
            onKeyDown={handleKeyDown}
            placeholder="태그 입력 후 Enter"
            className="h-8 flex-1 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 text-xs"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || tags.length >= 10}
          >
            <Tag className="h-3 w-3" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 gap-0.5 cursor-pointer"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag}
                <X className="h-2.5 w-2.5" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={handleSubmit}
          disabled={!title.trim()}
        >
          <Plus className="mr-1 h-3 w-3" />
          추가
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 사진 그리드 ─────────────────────────────────────────────

interface PhotoGridProps {
  photos: PhotoAlbumItem[];
  onDelete: (photoId: string) => void;
}

function PhotoGrid({ photos, onDelete }: PhotoGridProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
        <ImageIcon className="h-8 w-8 opacity-30" />
        <p className="text-xs">사진이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative rounded-lg border border-gray-100 bg-white overflow-hidden"
        >
          {photo.imageUrl ? (
            <div className="relative w-full h-28">
              <Image
                src={photo.imageUrl}
                alt={photo.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-28 bg-gray-100 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
              deleteConfirm === photo.id
                ? "bg-red-100 text-red-600 opacity-100"
                : "bg-white/80 text-gray-500"
            }`}
            onClick={() => {
              if (deleteConfirm === photo.id) {
                onDelete(photo.id);
                setDeleteConfirm(null);
              } else {
                setDeleteConfirm(photo.id);
              }
            }}
            onBlur={() => setDeleteConfirm(null)}
            title={
              deleteConfirm === photo.id
                ? "한 번 더 클릭하면 삭제됩니다"
                : "삭제"
            }
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          <div className="p-2 space-y-1">
            <p className="text-[11px] font-medium text-gray-800 truncate">
              {photo.title}
            </p>
            {photo.takenAt && (
              <p className="text-[10px] text-gray-400">{photo.takenAt}</p>
            )}
            {photo.description && (
              <p className="text-[10px] text-gray-500 line-clamp-2">
                {photo.description}
              </p>
            )}
            {photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-0.5">
                {photo.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[9px] px-1 py-0 text-violet-600 border-violet-200 bg-violet-50"
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
  );
}

// ─── 앨범 행 ─────────────────────────────────────────────────

interface AlbumRowProps {
  album: PhotoAlbum;
  tagFilter: string;
  searchQuery: string;
  onDeleteAlbum: (id: string) => boolean;
  onAddPhoto: (albumId: string, input: Omit<PhotoAlbumItem, "id" | "createdAt">) => boolean;
  onDeletePhoto: (albumId: string, photoId: string) => boolean;
}

function AlbumRow({
  album,
  tagFilter,
  searchQuery,
  onDeleteAlbum,
  onAddPhoto,
  onDeletePhoto,
}: AlbumRowProps) {
  const [open, setOpen] = useState(false);
  const [showAddPhotoForm, setShowAddPhotoForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const filteredPhotos = useMemo(() => {
    return album.photos.filter((photo) => {
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
  }, [album.photos, tagFilter, searchQuery]);

  const dateRange = useMemo(() => {
    const dates = album.photos
      .map((p) => p.takenAt)
      .filter(Boolean)
      .sort();
    if (dates.length === 0) return "";
    if (dates.length === 1) return dates[0];
    return `${dates[0]} ~ ${dates[dates.length - 1]}`;
  }, [album.photos]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
            {album.coverUrl ? (
              <Image
                src={album.coverUrl}
                alt={album.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <FolderOpen className="h-5 w-5 text-gray-300" />
            )}
          </div>

          <CollapsibleTrigger asChild>
            <button className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-gray-800 truncate">
                {album.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-400">
                  {album.photos.length}장
                </span>
                {dateRange && (
                  <span className="text-[10px] text-gray-400">{dateRange}</span>
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
                setShowAddPhotoForm(true);
              }}
            >
              <Plus className="h-2.5 w-2.5 mr-0.5" />
              사진
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-6 w-6 p-0 ${
                deleteConfirm
                  ? "text-red-500"
                  : "text-gray-300 hover:text-red-400"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (deleteConfirm) {
                  onDeleteAlbum(album.id);
                } else {
                  setDeleteConfirm(true);
                }
              }}
              onBlur={() => setDeleteConfirm(false)}
              title={
                deleteConfirm
                  ? "한 번 더 클릭하면 삭제됩니다"
                  : "앨범 삭제"
              }
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-3">
            {showAddPhotoForm && (
              <AddPhotoForm
                albumId={album.id}
                onAdd={onAddPhoto}
                onClose={() => setShowAddPhotoForm(false)}
              />
            )}
            <PhotoGrid
              photos={filteredPhotos}
              onDelete={(photoId) => onDeletePhoto(album.id, photoId)}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface PhotoAlbumCardProps {
  groupId: string;
}

export function PhotoAlbumCard({ groupId }: PhotoAlbumCardProps) {
  const [open, setOpen] = useState(true);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [tagFilter, setTagFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-800">포토 앨범</span>
          {totalAlbums > 0 && (
            <Badge className="bg-violet-100 text-[10px] px-1.5 py-0 text-violet-600 hover:bg-violet-100">
              앨범 {totalAlbums}
            </Badge>
          )}
          {totalPhotos > 0 && (
            <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
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

      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-white p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-violet-50 px-3 py-2 text-center">
              <div className="text-sm font-bold text-violet-700">{totalAlbums}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">앨범</div>
            </div>
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
              <div className="text-sm font-bold text-blue-700">{totalPhotos}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">총 사진</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
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

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={tagFilter === "all" ? "default" : "outline"}
                  className="text-[10px] px-1.5 py-0 cursor-pointer"
                  onClick={() => setTagFilter("all")}
                >
                  전체
                </Badge>
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={tagFilter === tag ? "default" : "outline"}
                    className="text-[10px] px-1.5 py-0 cursor-pointer"
                    onClick={() =>
                      setTagFilter(tagFilter === tag ? "all" : tag)
                    }
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setShowCreateAlbum(!showCreateAlbum)}
          >
            <Plus className="mr-1 h-3 w-3" />
            앨범 만들기
          </Button>

          {showCreateAlbum && (
            <CreateAlbumForm
              onAdd={(input) => {
                const ok = addAlbum(input);
                if (ok) setShowCreateAlbum(false);
                return ok;
              }}
              onClose={() => setShowCreateAlbum(false)}
            />
          )}

          {albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
              <FolderOpen className="h-8 w-8 opacity-30" />
              <p className="text-xs">앨범이 없습니다. 앨범을 만들어보세요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {albums.map((album) => (
                <AlbumRow
                  key={album.id}
                  album={album}
                  tagFilter={tagFilter}
                  searchQuery={searchQuery}
                  onDeleteAlbum={deleteAlbum}
                  onAddPhoto={addPhoto}
                  onDeletePhoto={deletePhoto}
                />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
