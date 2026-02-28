"use client";

import { useState, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  FileText,
  Image,
  Video,
  Music,
  Table,
  File,
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Search,
  X,
  ChevronRight,
  Home,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSharedFiles } from "@/hooks/use-shared-files";
import type { SharedFileItem, SharedFileFolderItem, SharedFileCategory } from "@/types";

// ——————————————————————————————
// 카테고리 설정
// ——————————————————————————————

const CATEGORY_CONFIG: Record<
  SharedFileCategory,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    iconClass: string;
  }
> = {
  document:    { label: "문서",         icon: FileText, badgeClass: "bg-blue-100 text-blue-700",        iconClass: "text-blue-500" },
  image:       { label: "이미지",       icon: Image,    badgeClass: "bg-cyan-100 text-cyan-700",         iconClass: "text-cyan-500" },
  video:       { label: "영상",         icon: Video,    badgeClass: "bg-purple-100 text-purple-700",     iconClass: "text-purple-500" },
  audio:       { label: "오디오",       icon: Music,    badgeClass: "bg-pink-100 text-pink-700",         iconClass: "text-pink-500" },
  spreadsheet: { label: "스프레드시트", icon: Table,    badgeClass: "bg-green-100 text-green-700",       iconClass: "text-green-500" },
  other:       { label: "기타",         icon: File,     badgeClass: "bg-gray-100 text-gray-600",         iconClass: "text-gray-400" },
};

const CATEGORY_OPTIONS: SharedFileCategory[] = [
  "document",
  "image",
  "video",
  "audio",
  "spreadsheet",
  "other",
];

// ——————————————————————————————
// 카테고리 아이콘
// ——————————————————————————————

function CategoryIcon({
  category,
  className,
}: {
  category: SharedFileCategory;
  className?: string;
}) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;
  return <Icon className={className ?? `h-4 w-4 ${cfg.iconClass}`} />;
}

// ——————————————————————————————
// 파일 추가 다이얼로그
// ——————————————————————————————

type AddFileDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  folderId: string | null;
  onAdd: (params: {
    name: string;
    url: string;
    category: SharedFileCategory;
    description: string | null;
    uploadedBy: string;
    fileSize: string | null;
    tags: string[];
    folderId: string | null;
  }) => void;
};

function AddFileDialog({
  open,
  onOpenChange,
  folderId,
  onAdd,
}: AddFileDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<SharedFileCategory>("document");
  const [description, setDescription] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  function reset() {
    setName("");
    setUrl("");
    setCategory("document");
    setDescription("");
    setUploadedBy("");
    setFileSize("");
    setTagInput("");
    setTags([]);
  }

  function handleAddTag() {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  }

  function handleRemoveTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("파일 이름을 입력해주세요.");
      return;
    }
    if (!url.trim()) {
      toast.error("URL을 입력해주세요.");
      return;
    }
    onAdd({
      name: name.trim(),
      url: url.trim(),
      category,
      description: description.trim() || null,
      uploadedBy: uploadedBy.trim() || "알 수 없음",
      fileSize: fileSize.trim() || null,
      tags,
      folderId,
    });
    reset();
    onOpenChange(false);
    toast.success("파일이 추가되었습니다.");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">파일 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">파일 이름 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 공연 대본 v3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as SharedFileCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_CONFIG[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="파일에 대한 간단한 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">업로더</Label>
              <Input
                className="h-8 text-xs"
                placeholder="이름"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">파일 크기</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 2.4MB"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">태그</Label>
            <div className="flex gap-1">
              <Input
                className="h-8 text-xs flex-1"
                placeholder="태그 입력 후 Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={handleAddTag}
              >
                추가
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-700"
                  >
                    {tag}
                    <button
                      type="button"
                      className="hover:text-indigo-900"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => { reset(); onOpenChange(false); }}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——————————————————————————————
// 폴더 추가 다이얼로그
// ——————————————————————————————

type AddFolderDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  parentId: string | null;
  onAdd: (name: string, parentId: string | null) => void;
};

function AddFolderDialog({
  open,
  onOpenChange,
  parentId,
  onAdd,
}: AddFolderDialogProps) {
  const [name, setName] = useState("");

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("폴더 이름을 입력해주세요.");
      return;
    }
    onAdd(name.trim(), parentId);
    setName("");
    onOpenChange(false);
    toast.success("폴더가 생성되었습니다.");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setName(""); onOpenChange(v); }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">새 폴더</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Input
            className="h-8 text-xs"
            placeholder="폴더 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => { setName(""); onOpenChange(false); }}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——————————————————————————————
// 폴더 이름 변경 다이얼로그
// ——————————————————————————————

type RenameFolderDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  folder: SharedFileFolderItem | null;
  onRename: (folderId: string, newName: string) => void;
};

function RenameFolderDialog({
  open,
  onOpenChange,
  folder,
  onRename,
}: RenameFolderDialogProps) {
  const [name, setName] = useState(folder?.name ?? "");

  // folder가 바뀔 때 초기화
  if (folder && name !== folder.name && !open) {
    // 다이얼로그 닫힌 상태에서만 초기화
  }

  function handleSubmit() {
    if (!folder) return;
    if (!name.trim()) {
      toast.error("폴더 이름을 입력해주세요.");
      return;
    }
    onRename(folder.id, name.trim());
    onOpenChange(false);
    toast.success("폴더 이름이 변경되었습니다.");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v && folder) setName(folder.name);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">폴더 이름 변경</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Input
            className="h-8 text-xs"
            placeholder="새 폴더 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            변경
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——————————————————————————————
// 파일 행 컴포넌트
// ——————————————————————————————

type FileRowProps = {
  file: SharedFileItem;
  onDelete: (id: string) => void;
};

function FileRow({ file, onDelete }: FileRowProps) {
  const cfg = CATEGORY_CONFIG[file.category];

  return (
    <div className="flex items-start gap-2 px-2 py-2 rounded-md hover:bg-gray-50 group">
      <div className="mt-0.5 shrink-0">
        <CategoryIcon category={file.category} className={`h-4 w-4 ${cfg.iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-gray-800 hover:text-blue-600 hover:underline truncate max-w-[200px]"
          >
            {file.name}
          </a>
          <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
          <span
            className={`inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium ${cfg.badgeClass}`}
          >
            {cfg.label}
          </span>
        </div>
        {file.description && (
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">{file.description}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px] text-gray-400">{file.uploadedBy}</span>
          {file.fileSize && (
            <span className="text-[10px] text-gray-400">{file.fileSize}</span>
          )}
          {file.tags.length > 0 && (
            <div className="flex items-center gap-0.5 flex-wrap">
              <Tag className="h-2.5 w-2.5 text-gray-400" />
              {file.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full px-1.5 py-0 text-[10px] bg-indigo-50 text-indigo-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 p-0.5 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => {
          onDelete(file.id);
          toast.success("파일이 삭제되었습니다.");
        }}
        title="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ——————————————————————————————
// 폴더 행 컴포넌트
// ——————————————————————————————

type FolderRowProps = {
  folder: SharedFileFolderItem;
  fileCount: number;
  onOpen: (folder: SharedFileFolderItem) => void;
  onRename: (folder: SharedFileFolderItem) => void;
  onDelete: (folderId: string) => void;
};

function FolderRow({
  folder,
  fileCount,
  onOpen,
  onRename,
  onDelete,
}: FolderRowProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 group cursor-pointer">
      <button
        type="button"
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
        onClick={() => onOpen(folder)}
      >
        <FolderOpen className="h-4 w-4 text-yellow-500 shrink-0" />
        <span className="text-xs font-medium text-gray-800 truncate">{folder.name}</span>
        <span className="text-[10px] text-gray-400">({fileCount}개)</span>
      </button>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          className="p-0.5 rounded text-gray-400 hover:text-gray-700"
          onClick={(e) => { e.stopPropagation(); onRename(folder); }}
          title="이름 변경"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          className="p-0.5 rounded text-gray-300 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(folder.id);
            toast.success("폴더가 삭제되었습니다.");
          }}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ——————————————————————————————
// 메인 카드 컴포넌트
// ——————————————————————————————

type SharedFilesCardProps = {
  groupId: string;
};

export function SharedFilesCard({ groupId }: SharedFilesCardProps) {
  const {
    fileData,
    loading,
    addFile,
    updateFile: _updateFile,
    deleteFile,
    addFolder,
    renameFolder,
    deleteFolder,
    getFilesInFolder,
    totalFiles,
    totalFolders,
    categoryBreakdown,
  } = useSharedFiles(groupId);

  // ——— UI 상태 ———
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<SharedFileFolderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SharedFileCategory | "all">("all");
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState<SharedFileFolderItem | null>(null);
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);

  // ——— 현재 폴더의 하위 폴더 목록 ———
  const subFolders = useMemo(
    () => fileData.folders.filter((f) => f.parentId === currentFolderId),
    [fileData.folders, currentFolderId]
  );

  // ——— 현재 폴더의 파일 목록 (검색/카테고리 필터 적용) ———
  const currentFiles = useMemo(() => {
    let files = getFilesInFolder(currentFolderId);
    if (categoryFilter !== "all") {
      files = files.filter((f) => f.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      files = files.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.description ?? "").toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q)) ||
          f.uploadedBy.toLowerCase().includes(q)
      );
    }
    return files;
  }, [getFilesInFolder, currentFolderId, categoryFilter, searchQuery]);

  // ——— 폴더 이동 ———
  function handleOpenFolder(folder: SharedFileFolderItem) {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, folder]);
    setSearchQuery("");
    setCategoryFilter("all");
  }

  // ——— 브레드크럼 탐색 ———
  function handleBreadcrumb(index: number) {
    if (index < 0) {
      // 루트로 이동
      setCurrentFolderId(null);
      setFolderPath([]);
    } else {
      const target = folderPath[index];
      setCurrentFolderId(target.id);
      setFolderPath((prev) => prev.slice(0, index + 1));
    }
    setSearchQuery("");
    setCategoryFilter("all");
  }

  // ——— 폴더 이름 변경 ———
  function handleRenameFolder(folder: SharedFileFolderItem) {
    setRenameFolderTarget(folder);
    setRenameFolderOpen(true);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-xs text-gray-400">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  const hasContent = totalFiles > 0 || totalFolders > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-800">공유 파일함</span>
            {hasContent && (
              <span className="text-[10px] text-gray-400">
                파일 {totalFiles}개 · 폴더 {totalFolders}개
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setAddFolderOpen(true)}
            >
              <FolderPlus className="h-3 w-3" />
              폴더
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setAddFileOpen(true)}
            >
              <Plus className="h-3 w-3" />
              파일 추가
            </Button>
          </div>
        </div>

        {/* 브레드크럼 */}
        <div className="flex items-center gap-0.5 flex-wrap mt-1">
          <button
            type="button"
            className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-gray-800"
            onClick={() => handleBreadcrumb(-1)}
          >
            <Home className="h-3 w-3" />
            루트
          </button>
          {folderPath.map((folder, idx) => (
            <span key={folder.id} className="flex items-center gap-0.5">
              <ChevronRight className="h-3 w-3 text-gray-300" />
              <button
                type="button"
                className="text-[10px] text-gray-500 hover:text-gray-800"
                onClick={() => handleBreadcrumb(idx)}
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>

        {/* 검색 + 카테고리 필터 */}
        <div className="flex gap-1 mt-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              className="h-7 text-xs pl-6 pr-2"
              placeholder="파일 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as SharedFileCategory | "all")}
          >
            <SelectTrigger className="h-7 text-xs w-[110px]">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">전체</SelectItem>
              {CATEGORY_OPTIONS.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {CATEGORY_CONFIG[cat].label}
                  {categoryBreakdown[cat] > 0 && (
                    <span className="ml-1 text-gray-400">({categoryBreakdown[cat]})</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        {/* 빈 상태 */}
        {!hasContent && (
          <div className="py-10 text-center">
            <Folder className="h-10 w-10 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">아직 공유된 파일이 없습니다.</p>
            <p className="text-[10px] text-gray-300 mt-1">
              상단의 버튼을 눌러 파일 링크나 자료를 추가해보세요.
            </p>
          </div>
        )}

        {/* 하위 폴더 목록 */}
        {subFolders.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] text-gray-400 px-2 mb-1 font-medium">폴더</p>
            <div className="space-y-0.5">
              {subFolders.map((folder) => {
                // 해당 폴더(및 하위)의 파일 수 계산
                const count = fileData.files.filter((f) => f.folderId === folder.id).length;
                return (
                  <FolderRow
                    key={folder.id}
                    folder={folder}
                    fileCount={count}
                    onOpen={handleOpenFolder}
                    onRename={handleRenameFolder}
                    onDelete={deleteFolder}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 파일 목록 */}
        {currentFiles.length > 0 ? (
          <div>
            {subFolders.length > 0 && (
              <p className="text-[10px] text-gray-400 px-2 mb-1 font-medium">파일</p>
            )}
            <div className="space-y-0.5">
              {currentFiles.map((file) => (
                <FileRow key={file.id} file={file} onDelete={deleteFile} />
              ))}
            </div>
          </div>
        ) : (
          hasContent && (
            <div className="py-6 text-center">
              <p className="text-xs text-gray-400">
                {searchQuery || categoryFilter !== "all"
                  ? "검색 결과가 없습니다."
                  : "이 폴더에 파일이 없습니다."}
              </p>
            </div>
          )
        )}
      </CardContent>

      {/* 다이얼로그들 */}
      <AddFileDialog
        open={addFileOpen}
        onOpenChange={setAddFileOpen}
        folderId={currentFolderId}
        onAdd={addFile}
      />
      <AddFolderDialog
        open={addFolderOpen}
        onOpenChange={setAddFolderOpen}
        parentId={currentFolderId}
        onAdd={addFolder}
      />
      <RenameFolderDialog
        open={renameFolderOpen}
        onOpenChange={setRenameFolderOpen}
        folder={renameFolderTarget}
        onRename={renameFolder}
      />
    </Card>
  );
}
