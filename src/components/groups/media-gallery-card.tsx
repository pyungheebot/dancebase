"use client";

import { useMemo, useState } from "react";
import NextImage from "next/image";
import {
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  Search,
  Tag,
  FolderOpen,
  FolderPlus,
  X,
  ChevronDown,
  Film,
  Grid3x3,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMediaGallery, type AddItemParams } from "@/hooks/use-media-gallery";
import type { MediaAlbum, MediaGalleryItem } from "@/types";

// ─── 미디어 카드 ────────────────────────────────────────────

interface MediaCardProps {
  item: MediaGalleryItem;
  onDelete: (id: string) => void;
}

function MediaCard({ item, onDelete }: MediaCardProps) {
  const thumb = item.thumbnailUrl ?? item.url;

  return (
    <div className="group relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
      {/* 썸네일 / 이미지 */}
      <NextImage
        src={thumb}
        alt={item.title}
        fill
        className="object-cover"
        unoptimized
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3C/svg%3E";
        }}
      />

      {/* 유형 아이콘 오버레이 */}
      <div className="absolute top-1.5 left-1.5">
        {item.type === "video" ? (
          <span className="flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-white">
            <Film className="h-3 w-3" />
            <span className="text-[10px]">영상</span>
          </span>
        ) : (
          <span className="flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-white">
            <ImageIcon className="h-3 w-3" />
            <span className="text-[10px]">사진</span>
          </span>
        )}
      </div>

      {/* 삭제 버튼 (hover 시 표시) */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      <button
        onClick={() => onDelete(item.id)}
        className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
        title="삭제"
      >
        <X className="h-3 w-3" />
      </button>

      {/* 하단 정보 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-[11px] font-medium truncate">{item.title}</p>
        {item.tags.length > 0 && (
          <p className="text-white/70 text-[10px] truncate">
            {item.tags.map((t) => `#${t}`).join(" ")}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── 미디어 추가 다이얼로그 ─────────────────────────────────

interface AddMediaDialogProps {
  open: boolean;
  onClose: () => void;
  albums: MediaAlbum[];
  onAdd: (params: AddItemParams) => void;
}

function AddMediaDialog({ open, onClose, albums, onAdd }: AddMediaDialogProps) {
  const [type, setType] = useState<"photo" | "video">("photo");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [albumId, setAlbumId] = useState<string>("none");

  function handleAddTag() {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput("");
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!url.trim()) {
      toast.error("미디어 URL을 입력해주세요.");
      return;
    }
    onAdd({
      type,
      title: title.trim(),
      url: url.trim(),
      thumbnailUrl: thumbnailUrl.trim() || null,
      description: description.trim() || null,
      uploadedBy: uploadedBy.trim() || "익명",
      tags,
      albumId: albumId === "none" ? null : albumId,
    });
    // 초기화
    setType("photo");
    setTitle("");
    setUrl("");
    setThumbnailUrl("");
    setDescription("");
    setUploadedBy("");
    setTagInput("");
    setTags([]);
    setAlbumId("none");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">미디어 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 유형 선택 */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">유형</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setType("photo")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-medium transition-colors ${
                  type === "photo"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                사진
              </button>
              <button
                onClick={() => setType("video")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-medium transition-colors ${
                  type === "video"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                영상
              </button>
            </div>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="미디어 제목"
              className="h-8 text-xs"
            />
          </div>

          {/* URL */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">
              미디어 URL <span className="text-red-500">*</span>
            </Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
            />
          </div>

          {/* 썸네일 URL */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">
              썸네일 URL{" "}
              <span className="text-gray-400">(선택, 미입력 시 URL 사용)</span>
            </Label>
            <Input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="미디어에 대한 설명을 입력하세요."
              className="min-h-[60px] text-xs resize-none"
            />
          </div>

          {/* 업로드한 사람 */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">업로드한 사람</Label>
            <Input
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              placeholder="이름 또는 닉네임"
              className="h-8 text-xs"
            />
          </div>

          {/* 태그 */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">태그</Label>
            <div className="flex gap-1.5">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="#태그 입력 후 Enter"
                className="h-8 text-xs flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddTag}
                className="h-8 text-xs px-2"
              >
                추가
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 앨범 선택 */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">앨범</Label>
            <select
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="none">미분류</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs"
          >
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            className="h-7 text-xs"
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 앨범 생성 다이얼로그 ───────────────────────────────────

interface CreateAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (params: { name: string; description: string | null; coverUrl: string | null }) => void;
}

function CreateAlbumDialog({ open, onClose, onCreate }: CreateAlbumDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("앨범 이름을 입력해주세요.");
      return;
    }
    onCreate({
      name: name.trim(),
      description: description.trim() || null,
      coverUrl: coverUrl.trim() || null,
    });
    setName("");
    setDescription("");
    setCoverUrl("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 앨범 만들기</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">
              앨범 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="앨범 이름"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="앨범 설명 (선택)"
              className="min-h-[60px] text-xs resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">커버 이미지 URL</Label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs"
          >
            취소
          </Button>
          <Button size="sm" onClick={handleSubmit} className="h-7 text-xs">
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────

interface MediaGalleryCardProps {
  groupId: string;
}

export function MediaGalleryCard({ groupId }: MediaGalleryCardProps) {
  const {
    galleryData,
    loading,
    addItem,
    deleteItem,
    createAlbum,
    deleteAlbum,
    totalItems,
    photoCount,
    videoCount,
    albumCount,
  } = useMediaGallery(groupId);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "photo" | "video">("all");
  const [filterAlbumId, setFilterAlbumId] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);

  // 모든 태그 수집
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    galleryData.items.forEach((item) => item.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [galleryData.items]);

  // 필터 적용
  const filteredItems = useMemo(() => {
    let result = galleryData.items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          item.uploadedBy.toLowerCase().includes(q)
      );
    }

    if (filterType !== "all") {
      result = result.filter((item) => item.type === filterType);
    }

    if (filterAlbumId !== "all") {
      if (filterAlbumId === "unclassified") {
        result = result.filter((item) => item.albumId === null);
      } else {
        result = result.filter((item) => item.albumId === filterAlbumId);
      }
    }

    if (filterTag !== "all") {
      result = result.filter((item) => item.tags.includes(filterTag));
    }

    return result;
  }, [galleryData.items, searchQuery, filterType, filterAlbumId, filterTag]);

  function handleAddItem(params: AddItemParams) {
    addItem(params);
    toast.success("미디어가 추가되었습니다.");
  }

  function handleDeleteItem(itemId: string) {
    deleteItem(itemId);
    toast.success("미디어가 삭제되었습니다.");
  }

  function handleCreateAlbum(params: {
    name: string;
    description: string | null;
    coverUrl: string | null;
  }) {
    createAlbum(params);
    toast.success(`앨범 "${params.name}"이 생성되었습니다.`);
  }

  function handleDeleteAlbum(albumId: string, albumName: string) {
    deleteAlbum(albumId);
    toast.success(`앨범 "${albumName}"이 삭제되었습니다. 항목은 미분류로 이동되었습니다.`);
    if (filterAlbumId === albumId) {
      setFilterAlbumId("all");
    }
  }

  const selectedAlbumName =
    filterAlbumId === "all"
      ? "전체"
      : filterAlbumId === "unclassified"
      ? "미분류"
      : galleryData.albums.find((a) => a.id === filterAlbumId)?.name ?? "전체";

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4 text-indigo-500" />
              <CardTitle className="text-sm font-semibold text-gray-800">
                미디어 갤러리
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateAlbum(true)}
                className="h-7 text-xs gap-1"
              >
                <FolderPlus className="h-3 w-3" />
                앨범
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddMedia(true)}
                className="h-7 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-3 w-3" />
                미디어 추가
              </Button>
            </div>
          </div>

          {/* 통계 배지 */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-0">
              전체 {totalItems}
            </Badge>
            <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0">
              <ImageIcon className="h-2.5 w-2.5 mr-0.5" />
              사진 {photoCount}
            </Badge>
            <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-0">
              <Film className="h-2.5 w-2.5 mr-0.5" />
              영상 {videoCount}
            </Badge>
            <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-0">
              <FolderOpen className="h-2.5 w-2.5 mr-0.5" />
              앨범 {albumCount}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 검색 및 필터 */}
          <div className="flex flex-wrap gap-2">
            {/* 검색창 */}
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목, 태그, 업로더 검색..."
                className="pl-7 h-8 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* 유형 필터 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 min-w-[80px]"
                >
                  <Filter className="h-3 w-3" />
                  {filterType === "all"
                    ? "전체"
                    : filterType === "photo"
                    ? "사진"
                    : "영상"}
                  <ChevronDown className="h-3 w-3 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[100px]">
                <DropdownMenuItem
                  onClick={() => setFilterType("all")}
                  className="text-xs"
                >
                  전체
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterType("photo")}
                  className="text-xs"
                >
                  <ImageIcon className="h-3 w-3 mr-1.5 text-blue-500" />
                  사진
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterType("video")}
                  className="text-xs"
                >
                  <Film className="h-3 w-3 mr-1.5 text-purple-500" />
                  영상
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 앨범 필터 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 max-w-[140px]"
                >
                  <FolderOpen className="h-3 w-3" />
                  <span className="truncate">{selectedAlbumName}</span>
                  <ChevronDown className="h-3 w-3 ml-auto flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[140px] max-w-[200px]">
                <DropdownMenuItem
                  onClick={() => setFilterAlbumId("all")}
                  className="text-xs"
                >
                  전체
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterAlbumId("unclassified")}
                  className="text-xs"
                >
                  미분류
                </DropdownMenuItem>
                {galleryData.albums.length > 0 && (
                  <DropdownMenuSeparator />
                )}
                {galleryData.albums.map((album) => (
                  <DropdownMenuItem
                    key={album.id}
                    className="text-xs flex items-center justify-between group/album"
                    onClick={() => setFilterAlbumId(album.id)}
                  >
                    <span className="truncate">{album.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAlbum(album.id, album.name);
                      }}
                      className="ml-2 hidden group-hover/album:flex items-center text-red-500 hover:text-red-700"
                      title="앨범 삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 태그 필터 */}
            {allTags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1 max-w-[120px]"
                  >
                    <Tag className="h-3 w-3" />
                    <span className="truncate">
                      {filterTag === "all" ? "태그" : `#${filterTag}`}
                    </span>
                    <ChevronDown className="h-3 w-3 ml-auto flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[120px]">
                  <DropdownMenuItem
                    onClick={() => setFilterTag("all")}
                    className="text-xs"
                  >
                    전체 태그
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {allTags.map((tag) => (
                    <DropdownMenuItem
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className="text-xs"
                    >
                      #{tag}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* 필터 초기화 */}
            {(filterType !== "all" ||
              filterAlbumId !== "all" ||
              filterTag !== "all" ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterType("all");
                  setFilterAlbumId("all");
                  setFilterTag("all");
                  setSearchQuery("");
                }}
                className="h-8 text-xs text-gray-500 hover:text-gray-700 gap-1"
              >
                <X className="h-3 w-3" />
                필터 초기화
              </Button>
            )}
          </div>

          {/* 갤러리 그리드 */}
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Grid3x3 className="h-5 w-5 text-gray-400" />
              </div>
              {totalItems === 0 ? (
                <>
                  <p className="text-sm font-medium text-gray-600">
                    아직 미디어가 없습니다
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    사진이나 영상을 추가해 갤러리를 채워보세요.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowAddMedia(true)}
                    className="mt-3 h-7 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    미디어 추가
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600">
                    검색 결과가 없습니다
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    다른 검색어나 필터를 사용해 보세요.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400">
                {filteredItems.length}개 항목
                {totalItems !== filteredItems.length &&
                  ` (전체 ${totalItems}개 중)`}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {filteredItems.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 미디어 추가 다이얼로그 */}
      <AddMediaDialog
        open={showAddMedia}
        onClose={() => setShowAddMedia(false)}
        albums={galleryData.albums}
        onAdd={handleAddItem}
      />

      {/* 앨범 생성 다이얼로그 */}
      <CreateAlbumDialog
        open={showCreateAlbum}
        onClose={() => setShowCreateAlbum(false)}
        onCreate={handleCreateAlbum}
      />
    </>
  );
}
