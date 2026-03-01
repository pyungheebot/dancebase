"use client";

import { useState, useMemo } from "react";
import NextImage from "next/image";
import {
  Video,
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Tag,
  Calendar,
  Eye,
  EyeOff,
  Youtube,
  Instagram,
  Music2,
  Film,
  Globe,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useVideoPortfolio } from "@/hooks/use-video-portfolio";
import type {
  VideoPortfolioEntry,
  VideoPortfolioCategory,
  VideoPortfolioPlatform,
} from "@/types";
import { cn } from "@/lib/utils";

// ============================================================
// 상수
// ============================================================

const CATEGORY_LABELS: Record<VideoPortfolioCategory, string> = {
  solo: "솔로",
  group: "그룹",
  freestyle: "프리스타일",
  battle: "배틀",
  performance: "공연",
  practice: "연습",
};

const CATEGORY_COLORS: Record<VideoPortfolioCategory, string> = {
  solo: "bg-purple-50 text-purple-700 border-purple-200",
  group: "bg-blue-50 text-blue-700 border-blue-200",
  freestyle: "bg-orange-50 text-orange-700 border-orange-200",
  battle: "bg-red-50 text-red-700 border-red-200",
  performance: "bg-pink-50 text-pink-700 border-pink-200",
  practice: "bg-green-50 text-green-700 border-green-200",
};

const PLATFORM_LABELS: Record<VideoPortfolioPlatform, string> = {
  youtube: "유튜브",
  instagram: "인스타그램",
  tiktok: "틱톡",
  vimeo: "비메오",
  other: "기타",
};

const PLATFORM_COLORS: Record<VideoPortfolioPlatform, string> = {
  youtube: "bg-red-50 text-red-700 border-red-200",
  instagram: "bg-pink-50 text-pink-700 border-pink-200",
  tiktok: "bg-gray-900 text-white border-gray-700",
  vimeo: "bg-cyan-50 text-cyan-700 border-cyan-200",
  other: "bg-gray-50 text-gray-700 border-gray-200",
};

const PLATFORM_ICON: Record<VideoPortfolioPlatform, React.ReactNode> = {
  youtube: <Youtube className="h-3 w-3" />,
  instagram: <Instagram className="h-3 w-3" />,
  tiktok: <Music2 className="h-3 w-3" />,
  vimeo: <Film className="h-3 w-3" />,
  other: <Globe className="h-3 w-3" />,
};

// ============================================================
// 폼 기본값
// ============================================================

const EMPTY_FORM = {
  title: "",
  url: "",
  category: "solo" as VideoPortfolioCategory,
  date: "",
  tags: "",
  description: "",
  thumbnailUrl: "",
  isPublic: true,
};

// ============================================================
// 폼 컴포넌트
// ============================================================

interface EntryFormProps {
  initial?: typeof EMPTY_FORM;
  onSubmit: (values: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  submitLabel: string;
}

function EntryForm({ initial, onSubmit, onCancel, submitLabel }: EntryFormProps) {
  const [form, setForm] = useState<typeof EMPTY_FORM>(initial ?? EMPTY_FORM);

  const set = (key: keyof typeof EMPTY_FORM, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("영상 제목을 입력하세요.");
      return;
    }
    if (!form.url.trim()) {
      toast.error("영상 URL을 입력하세요.");
      return;
    }
    try {
      new URL(form.url.trim());
    } catch {
      toast.error("유효한 URL 형식이 아닙니다.");
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="space-y-3">
      {/* 제목 */}
      <div className="space-y-1">
        <Label className="text-xs">
          영상 제목 <span className="text-red-500">*</span>
        </Label>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="예) 2024 봄 정기공연 솔로 무대"
          className="h-8 text-xs"
        />
      </div>

      {/* URL */}
      <div className="space-y-1">
        <Label className="text-xs">
          영상 URL <span className="text-red-500">*</span>
        </Label>
        <Input
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://youtube.com/..."
          className="h-8 text-xs"
        />
      </div>

      {/* 카테고리 */}
      <div className="space-y-1">
        <Label className="text-xs">카테고리</Label>
        <Select
          value={form.category}
          onValueChange={(v) => set("category", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CATEGORY_LABELS) as VideoPortfolioCategory[]).map(
              (cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 날짜 */}
      <div className="space-y-1">
        <Label className="text-xs">날짜</Label>
        <Input
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 태그 */}
      <div className="space-y-1">
        <Label className="text-xs">태그 (쉼표로 구분)</Label>
        <Input
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="예) 힙합, 비보잉, 팝핀"
          className="h-8 text-xs"
        />
      </div>

      {/* 썸네일 URL */}
      <div className="space-y-1">
        <Label className="text-xs">썸네일 URL (선택)</Label>
        <Input
          value={form.thumbnailUrl}
          onChange={(e) => set("thumbnailUrl", e.target.value)}
          placeholder="https://..."
          className="h-8 text-xs"
        />
      </div>

      {/* 설명 */}
      <div className="space-y-1">
        <Label className="text-xs">설명 (선택)</Label>
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="영상에 대한 간단한 설명을 입력하세요."
          className="text-xs resize-none"
          rows={2}
        />
      </div>

      {/* 공개 여부 */}
      <div className="flex items-center gap-2">
        <Switch
          checked={form.isPublic}
          onCheckedChange={(v) => set("isPublic", v)}
          id="isPublic"
        />
        <Label htmlFor="isPublic" className="text-xs cursor-pointer">
          공개 영상
        </Label>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          <X className="h-3 w-3 mr-1" />
          취소
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
          <Check className="h-3 w-3 mr-1" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 영상 항목 카드
// ============================================================

interface EntryItemProps {
  entry: VideoPortfolioEntry;
  onEdit: (entry: VideoPortfolioEntry) => void;
  onDelete: (id: string) => void;
}

function EntryItem({ entry, onEdit, onDelete }: EntryItemProps) {
  return (
    <div className="border rounded-md p-3 space-y-2 bg-white hover:bg-gray-50 transition-colors">
      {/* 상단: 제목 + 배지 */}
      <div className="flex items-start gap-2">
        {/* 썸네일 */}
        {entry.thumbnailUrl ? (
          <NextImage
            src={entry.thumbnailUrl}
            alt={entry.title}
            width={56}
            height={40}
            className="w-14 h-10 object-cover rounded flex-shrink-0 border"
            unoptimized
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-14 h-10 flex-shrink-0 rounded border bg-gray-100 flex items-center justify-center">
            <Video className="h-4 w-4 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium truncate max-w-[160px]">
              {entry.title}
            </span>
            {!entry.isPublic && (
              <span title="비공개">
                <EyeOff className="h-3 w-3 text-gray-400" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                CATEGORY_COLORS[entry.category]
              )}
            >
              {CATEGORY_LABELS[entry.category]}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 flex items-center gap-0.5",
                PLATFORM_COLORS[entry.platform]
              )}
            >
              {PLATFORM_ICON[entry.platform]}
              {PLATFORM_LABELS[entry.platform]}
            </Badge>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => window.open(entry.url, "_blank", "noopener,noreferrer")}
            title="영상 열기"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onEdit(entry)}
            title="수정"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                title="삭제"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm">영상 삭제</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  &quot;{entry.title}&quot; 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-8 text-xs">취소</AlertDialogCancel>
                <AlertDialogAction
                  className="h-8 text-xs bg-red-500 hover:bg-red-600"
                  onClick={() => onDelete(entry.id)}
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* 날짜 + 태그 */}
      <div className="flex items-center gap-2 flex-wrap">
        {entry.date && (
          <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
            <Calendar className="h-3 w-3" />
            {entry.date}
          </span>
        )}
        {entry.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-gray-400" />
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1 py-0 bg-gray-100 rounded text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 설명 */}
      {entry.description && (
        <p className="text-[10px] text-gray-500 leading-relaxed">
          {entry.description}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface VideoPortfolioCardProps {
  memberId: string;
  className?: string;
}

export function VideoPortfolioCard({ memberId, className }: VideoPortfolioCardProps) {
  const { entries, loading, addEntry, updateEntry, deleteEntry, stats } =
    useVideoPortfolio(memberId);

  const [isOpen, setIsOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VideoPortfolioEntry | null>(null);
  const [filterCategory, setFilterCategory] = useState<VideoPortfolioCategory | "all">("all");
  const [filterPlatform, setFilterPlatform] = useState<VideoPortfolioPlatform | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 필터링된 항목
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      if (filterPlatform !== "all" && e.platform !== filterPlatform) return false;
      if (
        searchQuery &&
        !e.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false;
      }
      return true;
    });
  }, [entries, filterCategory, filterPlatform, searchQuery]);

  // 영상 추가 처리
  const handleAdd = (form: typeof EMPTY_FORM) => {
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    addEntry({
      title: form.title,
      url: form.url,
      category: form.category,
      date: form.date || undefined,
      tags,
      description: form.description || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
      isPublic: form.isPublic,
    });
    toast.success("영상 포트폴리오가 추가되었습니다.");
    setAddDialogOpen(false);
  };

  // 영상 수정 처리
  const handleEdit = (form: typeof EMPTY_FORM) => {
    if (!editTarget) return;
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const ok = updateEntry(editTarget.id, {
      title: form.title,
      url: form.url,
      category: form.category,
      date: form.date || undefined,
      tags,
      description: form.description || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
      isPublic: form.isPublic,
    });
    if (ok) {
      toast.success("영상 정보가 수정되었습니다.");
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
    setEditTarget(null);
  };

  // 영상 삭제 처리
  const handleDelete = (entryId: string) => {
    const ok = deleteEntry(entryId);
    if (ok) {
      toast.success("영상이 삭제되었습니다.");
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  // 수정 폼 초기값 생성
  const editInitial = editTarget
    ? {
        title: editTarget.title,
        url: editTarget.url,
        category: editTarget.category,
        date: editTarget.date ?? "",
        tags: editTarget.tags.join(", "),
        description: editTarget.description ?? "",
        thumbnailUrl: editTarget.thumbnailUrl ?? "",
        isPublic: editTarget.isPublic,
      }
    : undefined;

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <Video className="h-4 w-4 text-purple-600" />
                <CardTitle className="text-sm">댄스 영상 포트폴리오</CardTitle>
                {stats.totalCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {stats.totalCount}
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                )}
              </button>
            </CollapsibleTrigger>

            {/* 추가 버튼 */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-sm">영상 포트폴리오 추가</DialogTitle>
                </DialogHeader>
                <EntryForm
                  onSubmit={handleAdd}
                  onCancel={() => setAddDialogOpen(false)}
                  submitLabel="추가"
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* 통계 요약 */}
            {stats.totalCount > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-gray-50 border p-2 text-center">
                  <p className="text-base font-bold text-gray-900">
                    {stats.totalCount}
                  </p>
                  <p className="text-[10px] text-gray-500">전체</p>
                </div>
                <div className="rounded-md bg-green-50 border border-green-200 p-2 text-center">
                  <p className="text-base font-bold text-green-700">
                    {stats.publicCount}
                  </p>
                  <p className="text-[10px] text-green-600">공개</p>
                </div>
                <div className="rounded-md bg-gray-50 border p-2 text-center">
                  <p className="text-base font-bold text-gray-700">
                    {stats.uniqueTags.length}
                  </p>
                  <p className="text-[10px] text-gray-500">태그</p>
                </div>
              </div>
            )}

            {/* 필터 영역 */}
            {entries.length > 2 && (
              <div className="space-y-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제목 또는 태그 검색..."
                  className="h-7 text-xs"
                />
                <div className="flex gap-2">
                  <Select
                    value={filterCategory}
                    onValueChange={(v) =>
                      setFilterCategory(v as VideoPortfolioCategory | "all")
                    }
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        전체 카테고리
                      </SelectItem>
                      {(
                        Object.keys(CATEGORY_LABELS) as VideoPortfolioCategory[]
                      ).map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {CATEGORY_LABELS[cat]}
                          {stats.categoryBreakdown[cat]
                            ? ` (${stats.categoryBreakdown[cat]})`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterPlatform}
                    onValueChange={(v) =>
                      setFilterPlatform(v as VideoPortfolioPlatform | "all")
                    }
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue placeholder="플랫폼" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        전체 플랫폼
                      </SelectItem>
                      {(
                        Object.keys(PLATFORM_LABELS) as VideoPortfolioPlatform[]
                      ).map((plt) => (
                        <SelectItem key={plt} value={plt} className="text-xs">
                          {PLATFORM_LABELS[plt]}
                          {stats.platformBreakdown[plt]
                            ? ` (${stats.platformBreakdown[plt]})`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* 목록 */}
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-4">불러오는 중...</p>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-6 space-y-1">
                <Video className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400">
                  {entries.length === 0
                    ? "등록된 댄스 영상 포트폴리오가 없습니다."
                    : "필터 조건에 맞는 영상이 없습니다."}
                </p>
                {entries.length === 0 && (
                  <p className="text-[10px] text-gray-300">
                    유튜브, 인스타그램 등 영상 링크를 추가해보세요.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => (
                  <EntryItem
                    key={entry.id}
                    entry={entry}
                    onEdit={setEditTarget}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* 공개/비공개 안내 */}
            {entries.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-gray-400 pt-1">
                <Eye className="h-3 w-3" />
                <span>공개 {stats.publicCount}개</span>
                <EyeOff className="h-3 w-3 ml-1" />
                <span>비공개 {stats.totalCount - stats.publicCount}개</span>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 수정 다이얼로그 */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">영상 포트폴리오 수정</DialogTitle>
          </DialogHeader>
          {editInitial && (
            <EntryForm
              initial={editInitial}
              onSubmit={handleEdit}
              onCancel={() => setEditTarget(null)}
              submitLabel="저장"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
