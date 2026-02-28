"use client";

import { useState } from "react";
import {
  Lightbulb,
  Video,
  Image,
  FileText,
  Quote,
  Sparkles,
  Heart,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  X,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInspirationBoard } from "@/hooks/use-inspiration-board";
import type { InspirationMediaType, InspirationBoardItem } from "@/types";
import { cn } from "@/lib/utils";

// 미디어 유형 메타데이터
const MEDIA_TYPE_META: Record<
  InspirationMediaType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  video: { label: "영상", icon: Video, color: "text-purple-500" },
  image: { label: "이미지", icon: Image, color: "text-pink-500" },
  article: { label: "아티클", icon: FileText, color: "text-blue-500" },
  quote: { label: "명언", icon: Quote, color: "text-amber-500" },
  idea: { label: "아이디어", icon: Sparkles, color: "text-green-500" },
};

const ALL_TYPES: Array<{ value: "all" | InspirationMediaType; label: string }> = [
  { value: "all", label: "전체" },
  { value: "video", label: "영상" },
  { value: "image", label: "이미지" },
  { value: "article", label: "아티클" },
  { value: "quote", label: "명언" },
  { value: "idea", label: "아이디어" },
];

// 태그 클라우드 크기 계산
function tagFontSize(count: number, max: number): string {
  if (max === 0) return "text-xs";
  const ratio = count / max;
  if (ratio >= 0.8) return "text-base font-semibold";
  if (ratio >= 0.6) return "text-sm font-medium";
  if (ratio >= 0.4) return "text-xs font-medium";
  return "text-[10px]";
}

// 아이템 추가 다이얼로그
function AddItemDialog({
  onAdd,
}: {
  onAdd: (payload: Omit<InspirationBoardItem, "id" | "createdAt" | "isFavorite">) => Promise<InspirationBoardItem>;
}) {
  const [open, setOpen] = useState(false);
  const [mediaType, setMediaType] = useState<InspirationMediaType>("idea");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function reset() {
    setMediaType("idea");
    setTitle("");
    setUrl("");
    setContent("");
    setSource("");
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
    if (!content.trim()) {
      toast.error("내용을 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      await onAdd({
        mediaType,
        title: title.trim(),
        url: url.trim() || undefined,
        content: content.trim(),
        tags,
        source: source.trim() || undefined,
      });
      toast.success("영감 아이템이 추가되었습니다.");
      reset();
      setOpen(false);
    } catch {
      toast.error("추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
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
          {/* 유형 */}
          <div className="space-y-1">
            <Label className="text-xs">유형</Label>
            <Select
              value={mediaType}
              onValueChange={(v) => setMediaType(v as InspirationMediaType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(MEDIA_TYPE_META) as Array<[InspirationMediaType, typeof MEDIA_TYPE_META[InspirationMediaType]]>).map(
                  ([key, meta]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {meta.label}
                    </SelectItem>
                  )
                )}
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

          {/* URL */}
          <div className="space-y-1">
            <Label className="text-xs">URL (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label className="text-xs">내용 *</Label>
            <Textarea
              className="text-xs resize-none"
              rows={3}
              placeholder="영감을 준 내용이나 메모를 남겨보세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* 출처 */}
          <div className="space-y-1">
            <Label className="text-xs">출처 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="아티스트명, 영상 채널, 책 제목 등"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          {/* 태그 */}
          <div className="space-y-1">
            <Label className="text-xs">태그</Label>
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
            <Button type="submit" size="sm" className="h-7 text-xs" disabled={loading}>
              {loading ? "추가 중..." : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 단일 아이템 카드
function InspirationItemCard({
  item,
  onToggleFavorite,
  onDelete,
}: {
  item: InspirationBoardItem;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = MEDIA_TYPE_META[item.mediaType];
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
              className={cn("h-3.5 w-3.5", item.isFavorite && "fill-current")}
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

      {/* 내용 미리보기 */}
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {item.content}
      </p>

      {/* 출처 + URL */}
      {(item.source || item.url) && (
        <div className="flex items-center gap-2">
          {item.source && (
            <span className="text-[10px] text-muted-foreground">출처: {item.source}</span>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
            >
              링크
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
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
        {new Date(item.createdAt).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}

// 메인 컴포넌트
export function InspirationBoardCard({ memberId }: { memberId: string }) {
  const {
    items,
    addItem,
    deleteItem,
    toggleFavorite,
    stats,
  } = useInspirationBoard(memberId);

  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | InspirationMediaType | "favorites">(
    "all"
  );
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // 필터 적용
  const filteredItems = (() => {
    let result = items;
    if (activeTab === "favorites") {
      result = result.filter((i) => i.isFavorite);
    } else if (activeTab !== "all") {
      result = result.filter((i) => i.mediaType === activeTab);
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
                <CardTitle className="text-sm font-semibold">댄스 영감 보드</CardTitle>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {stats.totalItems}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <AddItemDialog onAdd={addItem} />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* 통계 요약 */}
            {stats.totalItems > 0 && (
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>전체 {stats.totalItems}개</span>
                <span>즐겨찾기 {stats.favoriteCount}개</span>
              </div>
            )}

            {/* 미디어 유형 탭 */}
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "all" | InspirationMediaType | "favorites")
              }
            >
              <TabsList className="h-7 text-xs gap-0.5 flex-wrap">
                {ALL_TYPES.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="h-6 text-[10px] px-2"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
                <TabsTrigger value="favorites" className="h-6 text-[10px] px-2">
                  <Heart className="h-2.5 w-2.5 mr-0.5" />
                  즐겨찾기
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 태그 클라우드 */}
            {Object.keys(stats.tagCloud).length > 0 && (
              <div className="border rounded-md p-2 bg-muted/30">
                <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  태그 클라우드
                  {activeTag && (
                    <button
                      onClick={() => setActiveTag(null)}
                      className="ml-auto text-[10px] text-primary hover:underline"
                    >
                      필터 해제
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
                    영상, 이미지, 명언 등 영감을 주는 것들을 기록해보세요.
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
