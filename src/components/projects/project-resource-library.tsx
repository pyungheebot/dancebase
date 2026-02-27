"use client";

import { useState, useMemo } from "react";
import {
  Library,
  Music,
  Video,
  Image,
  FileText,
  Plus,
  ExternalLink,
  Tag,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectResources } from "@/hooks/use-project-resources";
import type { ProjectResource, ResourceType } from "@/types";
import { toast } from "sonner";

// ============================================
// 상수 / 유틸리티
// ============================================

const TYPE_LABELS: Record<ResourceType, string> = {
  music: "음악",
  video: "영상",
  image: "이미지",
  document: "문서",
};

const TYPE_COLORS: Record<ResourceType, string> = {
  music: "bg-purple-100 text-purple-700 border-purple-200",
  video: "bg-pink-100 text-pink-700 border-pink-200",
  image: "bg-orange-100 text-orange-700 border-orange-200",
  document: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

function TypeIcon({
  type,
  className = "h-4 w-4",
}: {
  type: ResourceType;
  className?: string;
}) {
  switch (type) {
    case "music":
      return <Music className={className} />;
    case "video":
      return <Video className={className} />;
    case "image":
      return <Image className={className} />;
    case "document":
      return <FileText className={className} />;
  }
}

// ============================================
// 타입 정의
// ============================================

type FilterType = "all" | ResourceType;

interface ProjectResourceLibraryProps {
  groupId: string;
  projectId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ResourceFormData {
  title: string;
  url: string;
  type: ResourceType;
  tagsRaw: string;
  description: string;
}

const DEFAULT_FORM: ResourceFormData = {
  title: "",
  url: "",
  type: "music",
  tagsRaw: "",
  description: "",
};

// ============================================
// 리소스 추가/수정 다이얼로그
// ============================================

interface ResourceDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ProjectResource, "id" | "createdAt">) => void;
  initial?: ProjectResource | null;
  projectId?: string;
}

function ResourceDialog({
  open,
  onClose,
  onSubmit,
  initial,
  projectId,
}: ResourceDialogProps) {
  const [form, setForm] = useState<ResourceFormData>(() =>
    initial
      ? {
          title: initial.title,
          url: initial.url,
          type: initial.type,
          tagsRaw: initial.tags.join(", "),
          description: initial.description ?? "",
        }
      : DEFAULT_FORM
  );

  // initial 변경 시 폼 초기화
  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setForm(
        initial
          ? {
              title: initial.title,
              url: initial.url,
              type: initial.type,
              tagsRaw: initial.tags.join(", "),
              description: initial.description ?? "",
            }
          : DEFAULT_FORM
      );
    } else {
      onClose();
    }
  };

  const set = <K extends keyof ResourceFormData>(
    key: K,
    value: ResourceFormData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const parseTags = (raw: string): string[] =>
    raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const isValid = form.title.trim().length > 0 && form.url.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      title: form.title.trim(),
      url: form.url.trim(),
      type: form.type,
      tags: parseTags(form.tagsRaw),
      description: form.description.trim() || undefined,
      projectId,
    });
    setForm(DEFAULT_FORM);
    onClose();
  };

  const handleClose = () => {
    setForm(DEFAULT_FORM);
    onClose();
  };

  const isEdit = !!initial;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEdit ? "리소스 수정" : "리소스 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="리소스 제목"
              className="h-7 text-xs"
              autoFocus
            />
          </div>

          {/* URL */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              URL <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://..."
              className="h-7 text-xs"
            />
          </div>

          {/* 유형 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              유형
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => set("type", v as ResourceType)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(TYPE_LABELS) as [ResourceType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value} className="text-xs">
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 태그 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              태그{" "}
              <span className="text-muted-foreground/60">(콤마로 구분)</span>
            </Label>
            <Input
              value={form.tagsRaw}
              onChange={(e) => set("tagsRaw", e.target.value)}
              placeholder="예: kpop, 안무, 참고영상"
              className="h-7 text-xs"
            />
          </div>

          {/* 설명 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              설명 <span className="text-muted-foreground/60">(선택)</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="리소스에 대한 설명..."
              className="text-xs resize-none min-h-[60px] max-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            {isEdit ? "저장" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 리소스 카드
// ============================================

interface ResourceCardProps {
  resource: ProjectResource;
  onEdit: () => void;
  onDelete: () => void;
  onTagClick: (tag: string) => void;
}

function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onTagClick,
}: ResourceCardProps) {
  const href = resource.url.startsWith("http")
    ? resource.url
    : `https://${resource.url}`;

  return (
    <div className="rounded border bg-background px-3 py-2.5 group hover:bg-muted/20 transition-colors">
      <div className="flex items-start gap-2">
        {/* 유형 아이콘 */}
        <div
          className={`mt-0.5 shrink-0 rounded p-1 ${TYPE_COLORS[resource.type]}`}
        >
          <TypeIcon type={resource.type} className="h-3 w-3" />
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium leading-tight truncate">
              {resource.title}
            </span>

            {/* 외부 링크 */}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              title="링크 열기"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* 설명 */}
          {resource.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
              {resource.description}
            </p>
          )}

          {/* 태그 배지 */}
          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {resource.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0 text-[10px] font-medium bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 수정/삭제 버튼 (호버 시) */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            title="수정"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

const FILTER_BUTTONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "music", label: "음악" },
  { value: "video", label: "영상" },
  { value: "image", label: "이미지" },
  { value: "document", label: "문서" },
];

export function ProjectResourceLibrary({
  groupId,
  projectId,
  open,
  onOpenChange,
}: ProjectResourceLibraryProps) {
  const {
    resources,
    addResource,
    updateResource,
    deleteResource,
    getAllTags,
  } = useProjectResources(groupId);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectResource | null>(null);

  const allTags = getAllTags();

  // 필터링된 리소스
  const filtered = useMemo(() => {
    let result = resources;

    // 프로젝트 필터 (projectId가 있으면 해당 프로젝트 + 미지정 리소스 표시)
    if (projectId) {
      result = result.filter(
        (r) => r.projectId === projectId || !r.projectId
      );
    }

    // 유형 필터
    if (filterType !== "all") {
      result = result.filter((r) => r.type === filterType);
    }

    // 태그 필터
    if (filterTag !== "all") {
      result = result.filter((r) => r.tags.includes(filterTag));
    }

    // 제목 검색
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }

    return result;
  }, [resources, projectId, filterType, filterTag, search]);

  const handleAdd = (data: Omit<ProjectResource, "id" | "createdAt">) => {
    addResource(data);
    toast.success("리소스가 추가되었습니다.");
  };

  const handleEdit = (data: Omit<ProjectResource, "id" | "createdAt">) => {
    if (!editTarget) return;
    updateResource(editTarget.id, data);
    setEditTarget(null);
    toast.success("리소스가 수정되었습니다.");
  };

  const handleDelete = (id: string) => {
    deleteResource(id);
    toast.success("리소스가 삭제되었습니다.");
  };

  const handleTagClick = (tag: string) => {
    setFilterTag((prev) => (prev === tag ? "all" : tag));
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearch("");
    setFilterType("all");
    setFilterTag("all");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
        <SheetContent
          side="right"
          className="w-[380px] sm:w-[440px] flex flex-col p-0"
        >
          {/* 헤더 */}
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Library className="h-4 w-4 text-muted-foreground" />
                <span>리소스 라이브러리</span>
                {resources.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                    {resources.length}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-3 w-3" />
                추가
              </Button>
            </SheetTitle>
          </SheetHeader>

          {/* 필터 영역 */}
          <div className="px-4 py-2.5 border-b shrink-0 space-y-2">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="리소스 검색..."
                className="h-7 text-xs pl-6"
              />
            </div>

            {/* 유형 필터 버튼 */}
            <div className="flex flex-wrap gap-1">
              {FILTER_BUTTONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterType(value)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterType === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 태그 필터 Select */}
            {allTags.length > 0 && (
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="h-7 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <SelectValue placeholder="태그로 필터" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    전체 태그
                  </SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag} className="text-xs">
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 리소스 목록 */}
          <ScrollArea className="flex-1">
            <div className="px-4 py-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Library className="h-8 w-8 mb-2 opacity-30" />
                  {resources.length === 0 ? (
                    <>
                      <p className="text-xs">등록된 리소스가 없습니다</p>
                      <p className="text-[10px] mt-0.5 text-muted-foreground/70">
                        음악, 영상 링크, 참고 자료를 추가해보세요
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs mt-3"
                        onClick={() => setShowAddDialog(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        첫 리소스 추가
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs">검색 결과가 없습니다</p>
                      <p className="text-[10px] mt-0.5 text-muted-foreground/70">
                        필터 조건을 변경해보세요
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onEdit={() => setEditTarget(resource)}
                      onDelete={() => handleDelete(resource.id)}
                      onTagClick={handleTagClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* 추가 다이얼로그 */}
      <ResourceDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAdd}
        projectId={projectId}
      />

      {/* 수정 다이얼로그 */}
      <ResourceDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        initial={editTarget}
        projectId={projectId}
      />
    </>
  );
}
