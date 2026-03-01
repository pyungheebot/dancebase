"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Lightbulb,
  Heart,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  X,
  Music,
  Palette,
  Clapperboard,
  Shirt,
  MonitorPlay,
  MoreHorizontal,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInspirationBoard } from "@/hooks/use-inspiration-board";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { InspirationCategory, InspirationBoardItem } from "@/types";
import { cn } from "@/lib/utils";

// ============================================================
// 카테고리 메타데이터
// ============================================================

type CategoryMeta = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeClass: string;
};

const CATEGORY_META: Record<InspirationCategory, CategoryMeta> = {
  choreography: {
    label: "안무 영상",
    icon: Clapperboard,
    color: "text-purple-500",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
  },
  music: {
    label: "음악",
    icon: Music,
    color: "text-pink-500",
    badgeClass: "bg-pink-100 text-pink-700 border-pink-200",
  },
  fashion: {
    label: "패션/스타일",
    icon: Shirt,
    color: "text-orange-500",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
  stage_design: {
    label: "무대 디자인",
    icon: MonitorPlay,
    color: "text-cyan-500",
    badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  artwork: {
    label: "아트워크",
    icon: Palette,
    color: "text-indigo-500",
    badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  other: {
    label: "기타",
    icon: MoreHorizontal,
    color: "text-gray-500",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const ALL_CATEGORIES: Array<{ value: "all" | "favorites" | InspirationCategory; label: string }> = [
  { value: "all", label: "전체" },
  { value: "choreography", label: "안무 영상" },
  { value: "music", label: "음악" },
  { value: "fashion", label: "패션/스타일" },
  { value: "stage_design", label: "무대 디자인" },
  { value: "artwork", label: "아트워크" },
  { value: "other", label: "기타" },
  { value: "favorites", label: "즐겨찾기" },
];

// ============================================================
// 태그 클라우드 폰트 크기
// ============================================================

function tagFontSize(count: number, max: number): string {
  if (max === 0) return "text-xs";
  const ratio = count / max;
  if (ratio >= 0.8) return "text-base font-semibold";
  if (ratio >= 0.6) return "text-sm font-medium";
  if (ratio >= 0.4) return "text-xs font-medium";
  return "text-[10px]";
}

// ============================================================
// 통계 패널
// ============================================================

function StatsPanel({
  stats,
}: {
  stats: {
    totalItems: number;
    favoriteCount: number;
    categoryDistribution: Record<InspirationCategory, number>;
  };
}) {
  const categories = Object.entries(CATEGORY_META) as Array<
    [InspirationCategory, CategoryMeta]
  >;

  return (
    <div className="border rounded-md p-3 bg-muted/30 space-y-2">
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">카테고리별 분포</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {categories.map(([key, meta]) => {
          const count = stats.categoryDistribution[key] ?? 0;
          const Icon = meta.icon;
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-1.5 text-[11px]"
            >
              <span className={cn("flex items-center gap-1", meta.color)}>
                <Icon className="h-3 w-3" />
                {meta.label}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {count}
              </Badge>
            </div>
          );
        })}
      </div>
      <div className="border-t pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>전체 {stats.totalItems}개</span>
        <span className="flex items-center gap-0.5">
          <Heart className="h-2.5 w-2.5 text-rose-400" />
          즐겨찾기 {stats.favoriteCount}개
        </span>
      </div>
    </div>
  );
}

// ============================================================
// 아이템 추가 다이얼로그
// ============================================================

function AddItemDialog({
  onAdd,
}: {
  onAdd: (
    payload: Omit<InspirationBoardItem, "id" | "createdAt" | "isFavorite">
  ) => Promise<InspirationBoardItem>;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<InspirationCategory>("choreography");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const { pending: loading, execute } = useAsyncAction();

  function reset() {
    setCategory("choreography");
    setTitle("");
    setUrl("");
    setMemo("");
    setTagInput("");
    setTags([]);
  }

  function addTag() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      toast.error("이미 추가된 태그입니다.");
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("제목을 입력해 주세요.");
      return;
    }
    await execute(async () => {
      await onAdd({
        category,
        mediaType: "idea",
        title: title.trim(),
        url: url.trim() || undefined,
        content: memo.trim(),
        tags,
      });
      toast.success("영감 아이템이 추가되었습니다.");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">영감 아이템 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as InspirationCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(CATEGORY_META) as Array<
                    [InspirationCategory, CategoryMeta]
                  >
                ).map(([key, meta]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <meta.icon className={cn("h-3 w-3", meta.color)} />
                      {meta.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="영감의 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* URL 링크 */}
          <div className="space-y-1">
            <Label className="text-xs">URL 링크 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모 (선택)</Label>
            <Textarea
              className="text-xs resize-none"
              rows={3}
              placeholder="영감을 준 내용이나 느낌을 메모해보세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {/* 태그 */}
          <div className="space-y-1">
            <Label className="text-xs">태그 (선택)</Label>
            <div className="flex gap-1">
              <Input
                className="h-8 text-xs flex-1"
                placeholder="태그 입력 후 Enter 또는 추가 클릭"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={addTag}
              >
                <Tag className="h-3 w-3" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 gap-0.5 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="h-2.5 w-2.5" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={loading}
            >
              {loading ? "추가 중..." : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 단일 아이템 카드
// ============================================================

function InspirationItemCard({
  item,
  onToggleFavorite,
  onDelete,
}: {
  item: InspirationBoardItem;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = CATEGORY_META[item.category ?? "other"];
  const Icon = meta.icon;

  return (
    <div className="border rounded-lg p-3 bg-card hover:bg-accent/30 transition-colors space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className={cn("h-3.5 w-3.5 shrink-0", meta.color)} />
          <span className="text-xs font-medium truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleFavorite(item.id)}
            className={cn(
              "p-0.5 rounded transition-colors",
              item.isFavorite
                ? "text-rose-500 hover:text-rose-400"
                : "text-muted-foreground hover:text-rose-400"
            )}
            aria-label={item.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5",
                item.isFavorite && "fill-current"
              )}
            />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
            aria-label="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 카테고리 배지 */}
      <Badge
        variant="outline"
        className={cn("text-[10px] px-1.5 py-0", meta.badgeClass)}
      >
        {meta.label}
      </Badge>

      {/* 메모 미리보기 */}
      {item.content && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {item.content}
        </p>
      )}

      {/* URL 링크 */}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 w-fit"
        >
          링크 열기
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}

      {/* 태그 */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* 날짜 */}
      <p className="text-[10px] text-muted-foreground">
        {formatYearMonthDay(item.createdAt)}
      </p>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function InspirationBoardCard({ memberId }: { memberId: string }) {
  const { items, addItem, deleteItem, toggleFavorite, stats } =
    useInspirationBoard(memberId);

  const [isOpen, setIsOpen] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "favorites" | InspirationCategory
  >("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // 필터 적용
  const filteredItems = (() => {
    let result = items;
    if (activeFilter === "favorites") {
      result = result.filter((i) => i.isFavorite);
    } else if (activeFilter !== "all") {
      result = result.filter((i) => i.category === activeFilter);
    }
    if (activeTag) {
      result = result.filter((i) => i.tags.includes(activeTag));
    }
    return result;
  })();

  const maxTagCount = Math.max(...Object.values(stats.tagCloud), 0);

  async function handleDelete(id: string) {
    try {
      await deleteItem(id);
      toast.success("아이템이 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2 px-4 pt-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">
                  댄스 인스피레이션 보드
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {stats.totalItems}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1">
              {stats.totalItems > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1"
                  onClick={() => setShowStats((p) => !p)}
                >
                  <BarChart2 className="h-3 w-3" />
                  통계
                </Button>
              )}
              <AddItemDialog onAdd={addItem} />
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* 통계 패널 */}
            {showStats && stats.totalItems > 0 && (
              <StatsPanel stats={stats} />
            )}

            {/* 카테고리 필터 버튼 */}
            <div className="flex flex-wrap gap-1">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setActiveFilter(
                      cat.value as "all" | "favorites" | InspirationCategory
                    );
                    setActiveTag(null);
                  }}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    activeFilter === cat.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {cat.value === "favorites" ? (
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-2.5 w-2.5" />
                      {cat.label}
                    </span>
                  ) : (
                    cat.label
                  )}
                </button>
              ))}
            </div>

            {/* 태그 클라우드 */}
            {Object.keys(stats.tagCloud).length > 0 && (
              <div className="border rounded-md p-2 bg-muted/30">
                <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  태그 필터
                  {activeTag && (
                    <button
                      onClick={() => setActiveTag(null)}
                      className="ml-auto text-[10px] text-primary hover:underline"
                    >
                      해제
                    </button>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {Object.entries(stats.tagCloud)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() =>
                          setActiveTag((prev) => (prev === tag ? null : tag))
                        }
                        className={cn(
                          "transition-colors hover:text-primary",
                          tagFontSize(count, maxTagCount),
                          activeTag === tag
                            ? "text-primary underline"
                            : "text-muted-foreground"
                        )}
                      >
                        #{tag}
                        <sup className="text-[8px] ml-0.5">{count}</sup>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* 아이템 목록 */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>
                  {items.length === 0
                    ? "아직 영감 아이템이 없습니다."
                    : "해당 조건에 맞는 아이템이 없습니다."}
                </p>
                {items.length === 0 && (
                  <p className="mt-1 opacity-70">
                    안무 영상, 음악, 패션 등 영감을 주는 것들을 기록해보세요.
                  </p>
                )}
              </div>
            ) : (
              <ScrollArea className="max-h-[480px] pr-1">
                <div className="grid grid-cols-1 gap-2">
                  {filteredItems.map((item) => (
                    <InspirationItemCard
                      key={item.id}
                      item={item}
                      onToggleFavorite={toggleFavorite}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
