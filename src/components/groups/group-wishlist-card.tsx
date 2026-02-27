"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  ThumbsUp,
  Trash2,
  CheckCircle2,
  Circle,
  Music,
  Theater,
  CalendarDays,
  BookOpen,
  MoreHorizontal,
  Trophy,
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
import { toast } from "sonner";
import { useGroupWishlist } from "@/hooks/use-group-wishlist";
import type { WishCategory, WishPriority, WishlistItem } from "@/types";

// ─── 카테고리 메타 ────────────────────────────────────────────

type CategoryMeta = {
  label: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  badge: string;
};

const CATEGORY_META: Record<WishCategory, CategoryMeta> = {
  song: {
    label: "곡",
    icon: <Music className="h-3 w-3" />,
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
  performance: {
    label: "공연",
    icon: <Theater className="h-3 w-3" />,
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    badge: "bg-pink-100 text-pink-700 hover:bg-pink-100",
  },
  event: {
    label: "이벤트",
    icon: <CalendarDays className="h-3 w-3" />,
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  workshop: {
    label: "워크숍",
    icon: <BookOpen className="h-3 w-3" />,
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    badge: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
  },
  other: {
    label: "기타",
    icon: <MoreHorizontal className="h-3 w-3" />,
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    badge: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as WishCategory[];

// ─── 우선순위 메타 ────────────────────────────────────────────

type PriorityMeta = {
  label: string;
  badge: string;
};

const PRIORITY_META: Record<WishPriority, PriorityMeta> = {
  high: {
    label: "높음",
    badge: "bg-red-100 text-red-600 hover:bg-red-100",
  },
  medium: {
    label: "보통",
    badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
  low: {
    label: "낮음",
    badge: "bg-gray-100 text-gray-500 hover:bg-gray-100",
  },
};

const ALL_PRIORITIES = Object.keys(PRIORITY_META) as WishPriority[];

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day}`;
}

// ─── 위시 추가 다이얼로그 ─────────────────────────────────────

interface AddWishDialogProps {
  hook: ReturnType<typeof useGroupWishlist>;
}

function AddWishDialog({ hook }: AddWishDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<WishCategory>("song");
  const [priority, setPriority] = useState<WishPriority>("medium");
  const [proposedBy, setProposedBy] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!proposedBy.trim()) {
      toast.error("제안자 이름을 입력해주세요.");
      return;
    }
    const ok = hook.addWish(title, description, category, priority, proposedBy);
    if (ok) {
      toast.success("위시가 추가되었습니다.");
      setTitle("");
      setDescription("");
      setCategory("song");
      setPriority("medium");
      setProposedBy("");
      setOpen(false);
    } else {
      toast.error("위시 추가에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 bg-violet-500 text-xs hover:bg-violet-600"
        >
          <Plus className="mr-1 h-3 w-3" />
          위시 추가
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-violet-500" />
            새 위시 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              제목 <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="예: BTS 작은 것들을 위한 시"
              className="h-7 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              설명 (선택)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="위시에 대한 추가 설명을 입력하세요"
              className="min-h-[60px] resize-none text-xs"
            />
            <p className="text-right text-[10px] text-gray-400">
              {description.length}/200
            </p>
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              카테고리
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      selected
                        ? `${meta.bg} ${meta.border} ${meta.text} font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {meta.icon}
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 우선순위 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              우선순위
            </label>
            <div className="flex gap-1.5">
              {ALL_PRIORITIES.map((p) => {
                const meta = PRIORITY_META[p];
                const selected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      selected
                        ? `${meta.badge} border-transparent font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 제안자 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              제안자 <span className="text-red-400">*</span>
            </label>
            <Input
              value={proposedBy}
              onChange={(e) => setProposedBy(e.target.value.slice(0, 20))}
              placeholder="본인 이름을 입력하세요"
              className="h-7 text-xs"
            />
          </div>

          <Button
            className="h-8 w-full bg-violet-500 text-xs hover:bg-violet-600"
            onClick={handleSubmit}
            disabled={!title.trim() || !proposedBy.trim()}
          >
            추가하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 위시 아이템 카드 ─────────────────────────────────────────

interface WishItemCardProps {
  item: WishlistItem;
  onVote: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

function WishItemCard({ item, onVote, onComplete, onDelete }: WishItemCardProps) {
  const catMeta = CATEGORY_META[item.category];
  const priMeta = PRIORITY_META[item.priority];

  return (
    <div
      className={`flex gap-2.5 rounded-lg border p-3 transition-opacity ${
        item.isCompleted
          ? "border-gray-100 bg-gray-50 opacity-60"
          : `${catMeta.bg} ${catMeta.border}`
      }`}
    >
      {/* 완료 체크 버튼 */}
      <button
        type="button"
        onClick={() => onComplete(item.id)}
        className={`mt-0.5 shrink-0 transition-colors ${
          item.isCompleted
            ? "text-green-500 hover:text-green-600"
            : "text-gray-300 hover:text-green-400"
        }`}
        title={item.isCompleted ? "완료 취소" : "완료 표시"}
      >
        {item.isCompleted ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>

      {/* 콘텐츠 */}
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* 제목 + 배지들 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-xs font-semibold ${
              item.isCompleted ? "text-gray-400 line-through" : "text-gray-800"
            }`}
          >
            {item.title}
          </span>
          <Badge className={`text-[10px] px-1.5 py-0 ${catMeta.badge}`}>
            <span className="mr-0.5 inline-flex">{catMeta.icon}</span>
            {catMeta.label}
          </Badge>
          <Badge className={`text-[10px] px-1.5 py-0 ${priMeta.badge}`}>
            {priMeta.label}
          </Badge>
        </div>

        {/* 설명 */}
        {item.description && (
          <p className="text-[11px] leading-relaxed text-gray-500">
            {item.description}
          </p>
        )}

        {/* 제안자 + 날짜 */}
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>제안: {item.proposedBy}</span>
          <span>·</span>
          <span>{formatDate(item.createdAt)}</span>
          {item.isCompleted && item.completedAt && (
            <>
              <span>·</span>
              <span className="text-green-500">
                완료 {formatDate(item.completedAt)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 오른쪽: 투표 + 삭제 */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {/* 투표 버튼 */}
        {!item.isCompleted && (
          <button
            type="button"
            onClick={() => onVote(item.id)}
            className="flex flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-gray-400 transition-colors hover:bg-white/60 hover:text-violet-500"
            title="투표"
          >
            <ThumbsUp className="h-3 w-3" />
            <span className="text-[10px] font-semibold">{item.votes}</span>
          </button>
        )}
        {item.isCompleted && (
          <span className="text-[10px] font-semibold text-gray-400">
            {item.votes}
          </span>
        )}

        {/* 삭제 버튼 */}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="text-gray-200 transition-colors hover:text-red-400"
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── 완료된 위시 섹션 ─────────────────────────────────────────

interface CompletedSectionProps {
  items: WishlistItem[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

function CompletedSection({ items, onComplete, onDelete }: CompletedSectionProps) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full justify-between border-gray-200 text-xs text-gray-500 hover:bg-gray-50"
        >
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            완료된 위시
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-600 hover:bg-green-100">
              {items.length}
            </Badge>
          </span>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <WishItemCard
              key={item.id}
              item={item}
              onVote={() => {}}
              onComplete={onComplete}
              onDelete={onDelete}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface GroupWishlistCardProps {
  groupId: string;
}

export function GroupWishlistCard({ groupId }: GroupWishlistCardProps) {
  const [open, setOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<WishCategory | "all">("all");

  const hook = useGroupWishlist(groupId);

  const handleVote = (id: string) => {
    const ok = hook.voteWish(id);
    if (!ok) toast.error("투표 처리에 실패했습니다.");
    else toast.success("투표했습니다.");
  };

  const handleComplete = (id: string) => {
    const item = hook.items.find((i) => i.id === id);
    const ok = hook.completeWish(id);
    if (ok) {
      toast.success(item?.isCompleted ? "완료를 취소했습니다." : "완료로 표시했습니다.");
    } else {
      toast.error("처리에 실패했습니다.");
    }
  };

  const handleDelete = (id: string) => {
    const ok = hook.deleteWish(id);
    if (ok) {
      toast.success("위시가 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  };

  // 미완료 항목만 필터 + 정렬
  const activeItems = hook.items.filter((i) => !i.isCompleted);
  const filteredActive = hook
    .sortByVotes(hook.filterByCategory(activeCategory))
    .filter((i) => !i.isCompleted);

  const completedItems = hook.items.filter((i) => i.isCompleted);

  const topCatMeta = hook.topCategory ? CATEGORY_META[hook.topCategory] : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-800">
            그룹 위시리스트
          </span>

          {/* 미완료 위시 수 배지 */}
          {activeItems.length > 0 && (
            <Badge className="bg-violet-100 text-[10px] px-1.5 py-0 text-violet-600 hover:bg-violet-100">
              {activeItems.length}개
            </Badge>
          )}

          {/* 인기 카테고리 배지 */}
          {topCatMeta && (
            <Badge
              className={`text-[10px] px-1.5 py-0 ${topCatMeta.badge}`}
            >
              <span className="mr-0.5 inline-flex">{topCatMeta.icon}</span>
              {topCatMeta.label} 인기
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <AddWishDialog hook={hook} />
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
      </div>

      {/* ── 본문 ── */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-white p-4 space-y-4">

          {/* 통계 요약 */}
          {hook.totalWishes > 0 && (
            <div className="flex flex-wrap gap-3 rounded-md bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-violet-400" />
                <span className="text-[11px] text-gray-500">
                  총{" "}
                  <span className="font-semibold text-gray-700">
                    {hook.totalWishes}
                  </span>
                  개 위시
                </span>
              </div>
              {hook.completedCount > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-[11px] text-gray-500">
                    완료{" "}
                    <span className="font-semibold text-gray-700">
                      {hook.completedCount}
                    </span>
                    개
                  </span>
                </div>
              )}
              {hook.topCategory && topCatMeta && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  <span className="text-[11px] text-gray-500">
                    인기 카테고리:{" "}
                    <span className="font-semibold text-gray-700">
                      {topCatMeta.label}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 카테고리 필터 탭 */}
          {activeItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  activeCategory === "all"
                    ? "border-gray-400 bg-gray-800 text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                전체 {activeItems.length}
              </button>
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const count = activeItems.filter((i) => i.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      activeCategory === cat
                        ? `${meta.bg} ${meta.border} ${meta.text} font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {meta.icon}
                    <span>{meta.label}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 위시 목록 (미완료) */}
          {filteredActive.length === 0 && completedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
              <Sparkles className="h-10 w-10 opacity-20" />
              <p className="text-xs">아직 위시가 없습니다.</p>
              <p className="text-[10px]">
                그룹이 하고 싶은 곡, 공연, 이벤트를 추가해보세요!
              </p>
            </div>
          ) : filteredActive.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-4 text-gray-400">
              <p className="text-xs">해당 카테고리의 위시가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActive.map((item) => (
                <WishItemCard
                  key={item.id}
                  item={item}
                  onVote={handleVote}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* 완료된 위시 구분선 + 섹션 */}
          {completedItems.length > 0 && (
            <>
              <Separator />
              <CompletedSection
                items={completedItems}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
