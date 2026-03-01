"use client";

import { useState, useMemo } from "react";
import {
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  FileText,
  Table,
  Presentation,
  Video,
  Music,
  Image,
  Link,
  File,
  Pin,
  PinOff,
  Download,
  Search,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSharedLibrary } from "@/hooks/use-shared-library";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { SharedLibFileType, SharedLibItem } from "@/types";

// ─── 파일 유형 설정 ───────────────────────────────────────────

const FILE_TYPE_CONFIG: Record<
  SharedLibFileType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  document:     { label: "문서",       icon: FileText,     color: "text-blue-500" },
  spreadsheet:  { label: "스프레드시트", icon: Table,        color: "text-green-500" },
  presentation: { label: "프레젠테이션", icon: Presentation, color: "text-orange-500" },
  video:        { label: "영상",       icon: Video,        color: "text-purple-500" },
  audio:        { label: "오디오",     icon: Music,        color: "text-pink-500" },
  image:        { label: "이미지",     icon: Image,        color: "text-cyan-500" },
  link:         { label: "링크",       icon: Link,         color: "text-indigo-500" },
  other:        { label: "기타",       icon: File,         color: "text-gray-500" },
};

const FILE_TYPE_OPTIONS: SharedLibFileType[] = [
  "document",
  "spreadsheet",
  "presentation",
  "video",
  "audio",
  "image",
  "link",
  "other",
];

// ─── 파일 유형 아이콘 컴포넌트 ────────────────────────────────

function FileTypeIcon({ fileType, className }: { fileType: SharedLibFileType; className?: string }) {
  const config = FILE_TYPE_CONFIG[fileType];
  const Icon = config.icon;
  return <Icon className={className ?? `h-4 w-4 ${config.color}`} />;
}

// ─── 파일 유형 배지 ───────────────────────────────────────────

function FileTypeBadge({ fileType }: { fileType: SharedLibFileType }) {
  const config = FILE_TYPE_CONFIG[fileType];
  return (
    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0 text-[10px] font-medium bg-gray-100 text-gray-600">
      <FileTypeIcon fileType={fileType} className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </span>
  );
}

// ─── 자료 추가 다이얼로그 ─────────────────────────────────────

interface ItemForm {
  title: string;
  fileType: SharedLibFileType;
  url: string;
  description: string;
  category: string;
  uploadedBy: string;
  tagsRaw: string;
}

function emptyForm(): ItemForm {
  return {
    title: "",
    fileType: "document",
    url: "",
    description: "",
    category: "",
    uploadedBy: "",
    tagsRaw: "",
  };
}

function AddItemDialog({
  categoryList,
  onAdd,
}: {
  categoryList: string[];
  onAdd: (payload: Omit<SharedLibItem, "id" | "downloadCount" | "isPinned" | "createdAt">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ItemForm>(emptyForm());

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("자료 제목을 입력해주세요.");
      return;
    }
    if (!form.uploadedBy.trim()) {
      toast.error("업로더 이름을 입력해주세요.");
      return;
    }

    const tags = form.tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onAdd({
      title: form.title.trim(),
      fileType: form.fileType,
      url: form.url.trim() || undefined,
      description: form.description.trim() || undefined,
      category: form.category.trim() || "일반",
      uploadedBy: form.uploadedBy.trim(),
      tags,
    });

    setOpen(false);
    setForm(emptyForm());
    toast.success("자료가 추가되었습니다.");
  }

  function set(field: keyof ItemForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          자료 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">자료 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              제목 <span className="text-red-400">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="예) 2024 정기공연 안무 악보"
              className="text-xs h-8"
            />
          </div>

          {/* 파일 유형 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">파일 유형</label>
            <Select
              value={form.fileType}
              onValueChange={(v) => set("fileType", v as SharedLibFileType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <FileTypeIcon fileType={type} className={`h-3.5 w-3.5 ${FILE_TYPE_CONFIG[type].color}`} />
                      {FILE_TYPE_CONFIG[type].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* URL */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">URL (선택)</label>
            <Input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://..."
              className="text-xs h-8"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">설명 (선택)</label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="자료에 대한 간단한 설명"
              className="text-xs min-h-[64px] resize-none"
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">카테고리</label>
            <Input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder={categoryList.length > 0 ? categoryList.join(", ") + " 등" : "예) 안무, 악보, 행정"}
              className="text-xs h-8"
              list="category-suggestions"
            />
            {categoryList.length > 0 && (
              <datalist id="category-suggestions">
                {categoryList.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            )}
          </div>

          {/* 업로더 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              업로더 <span className="text-red-400">*</span>
            </label>
            <Input
              value={form.uploadedBy}
              onChange={(e) => set("uploadedBy", e.target.value)}
              placeholder="이름 또는 닉네임"
              className="text-xs h-8"
            />
          </div>

          {/* 태그 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">태그 (쉼표로 구분)</label>
            <Input
              value={form.tagsRaw}
              onChange={(e) => set("tagsRaw", e.target.value)}
              placeholder="예) 공연, 2024, 중요"
              className="text-xs h-8"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => { setOpen(false); setForm(emptyForm()); }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 자료 행 컴포넌트 ─────────────────────────────────────────

function LibraryItemRow({
  item,
  onTogglePin,
  onDelete,
  onDownload,
}: {
  item: SharedLibItem;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <div className="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-gray-50 group transition-colors">
      {/* 파일 유형 아이콘 */}
      <div className="mt-0.5 shrink-0">
        <FileTypeIcon fileType={item.fileType} className={`h-4 w-4 ${FILE_TYPE_CONFIG[item.fileType].color}`} />
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.isPinned && (
            <Pin className="h-3 w-3 text-amber-500 shrink-0" />
          )}
          <span className="text-xs font-medium text-gray-800 truncate">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 hover:underline"
                onClick={() => onDownload(item.id)}
              >
                {item.title}
              </a>
            ) : (
              item.title
            )}
          </span>
          <FileTypeBadge fileType={item.fileType} />
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-indigo-200 text-indigo-600 bg-indigo-50"
          >
            {item.category}
          </Badge>
        </div>

        {item.description && (
          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
        )}

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] text-gray-400">by {item.uploadedBy}</span>
          {item.downloadCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
              <Download className="h-2.5 w-2.5" />
              {item.downloadCount}
            </span>
          )}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 text-[10px] text-gray-400"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onTogglePin(item.id)}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title={item.isPinned ? "고정 해제" : "고정"}
        >
          {item.isPinned ? (
            <PinOff className="h-3 w-3 text-amber-500" />
          ) : (
            <Pin className="h-3 w-3 text-gray-400" />
          )}
        </button>
        <button
          onClick={() => setDeleteConfirmOpen(true)}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title="삭제"
        >
          <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
        </button>
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}
        title="자료 삭제"
        description={`"${item.title}" 자료를 삭제하시겠습니까?`}
        onConfirm={() => {
          onDelete(item.id);
          toast.success("자료가 삭제되었습니다.");
          setDeleteConfirmOpen(false);
        }}
        destructive
      />
    </div>
  );
}

// ─── 메인 카드 컴포넌트 ───────────────────────────────────────

export function SharedLibraryCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    items,
    addItem,
    deleteItem,
    togglePin,
    incrementDownload,
    stats,
  } = useSharedLibrary(groupId);

  // ─── 필터링 ───────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.uploadedBy.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // 고정된 자료 상단 표시
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, selectedCategory, searchQuery]);

  const pinnedItems = filteredItems.filter((item) => item.isPinned);
  const unpinnedItems = filteredItems.filter((item) => !item.isPinned);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
              <FolderOpen className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">공유 자료실</span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-indigo-200 text-indigo-600 bg-indigo-50"
              >
                {stats.totalItems}개
              </Badge>
              {stats.pinnedCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-600 bg-amber-50"
                >
                  <Pin className="h-2.5 w-2.5 mr-0.5" />
                  {stats.pinnedCount}
                </Badge>
              )}
              {open ? (
                <ChevronUp className="h-3 w-3 text-gray-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              )}
            </button>
          </CollapsibleTrigger>

          <AddItemDialog
            categoryList={stats.categoryList}
            onAdd={addItem}
          />
        </div>

        <CollapsibleContent>
          <Separator />

          <div className="p-3 space-y-3">
            {/* 검색 + 카테고리 필터 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제목, 태그, 업로더 검색..."
                  className="pl-7 h-7 text-xs"
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

              {stats.categoryList.length > 0 && (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-7 text-xs w-32 shrink-0">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">전체 카테고리</SelectItem>
                    {stats.categoryList.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 자료 목록 */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                {items.length === 0
                  ? "아직 등록된 자료가 없습니다. 자료를 추가해보세요."
                  : "검색 조건에 맞는 자료가 없습니다."}
              </div>
            ) : (
              <div className="space-y-0.5">
                {/* 고정된 자료 */}
                {pinnedItems.length > 0 && (
                  <>
                    <div className="flex items-center gap-1 px-2 pt-1 pb-0.5">
                      <Pin className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">
                        고정된 자료
                      </span>
                    </div>
                    {pinnedItems.map((item) => (
                      <LibraryItemRow
                        key={item.id}
                        item={item}
                        onTogglePin={togglePin}
                        onDelete={deleteItem}
                        onDownload={incrementDownload}
                      />
                    ))}
                    {unpinnedItems.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <div className="px-2 pb-0.5">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            전체 자료
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* 일반 자료 */}
                {unpinnedItems.map((item) => (
                  <LibraryItemRow
                    key={item.id}
                    item={item}
                    onTogglePin={togglePin}
                    onDelete={deleteItem}
                    onDownload={incrementDownload}
                  />
                ))}
              </div>
            )}

            {/* 카테고리 요약 */}
            {stats.categoryList.length > 1 && selectedCategory === "all" && searchQuery === "" && (
              <>
                <Separator />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-400">카테고리:</span>
                  {stats.categoryList.map((cat) => {
                    const count = items.filter((item) => item.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        {cat}
                        <span className="text-gray-400 ml-0.5">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
