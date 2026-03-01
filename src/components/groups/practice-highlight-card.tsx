"use client";

import { useState, useMemo } from "react";
import {
  Star,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Heart,
  CalendarIcon,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePracticeHighlight } from "@/hooks/use-practice-highlight";
import type {
  PracticeHighlightCategory,
  PracticeHighlightEntry,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 상수
// ============================================

const CATEGORY_META: Record<
  PracticeHighlightCategory,
  { label: string; emoji: string; color: string; badge: string }
> = {
  awesome_move: {
    label: "멋진 동작",
    emoji: "✨",
    color: "bg-purple-100 text-purple-700",
    badge: "border-purple-200",
  },
  growth_moment: {
    label: "성장 순간",
    emoji: "🌱",
    color: "bg-green-100 text-green-700",
    badge: "border-green-200",
  },
  teamwork: {
    label: "팀워크",
    emoji: "🤝",
    color: "bg-blue-100 text-blue-700",
    badge: "border-blue-200",
  },
  funny_episode: {
    label: "재미있는 에피소드",
    emoji: "😂",
    color: "bg-yellow-100 text-yellow-700",
    badge: "border-yellow-200",
  },
  other: {
    label: "기타",
    emoji: "📌",
    color: "bg-gray-100 text-gray-600",
    badge: "border-gray-200",
  },
};

const CATEGORY_ORDER: PracticeHighlightCategory[] = [
  "awesome_move",
  "growth_moment",
  "teamwork",
  "funny_episode",
  "other",
];

// ============================================
// 날짜 헬퍼
// ============================================

function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

// ============================================
// 하이라이트 항목
// ============================================

function HighlightItem({
  entry,
  onDelete,
  onLike,
}: {
  entry: PracticeHighlightEntry;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
}) {
  const meta = CATEGORY_META[entry.category];

  return (
    <div
      className={cn(
        "bg-muted/30 rounded-md px-2.5 py-2 space-y-1.5 border",
        meta.badge
      )}
    >
      {/* 헤더 */}
      <div className="flex items-start gap-1.5">
        <span className="text-[13px] leading-none mt-0.5 shrink-0">
          {meta.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-snug truncate">
            {entry.title}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {entry.memberName} · {formatYearMonthDay(entry.date)}
          </p>
        </div>
        <span
          className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
            meta.color
          )}
        >
          {meta.label}
        </span>
      </div>

      {/* 설명 */}
      {entry.description && (
        <p className="text-[10px] text-muted-foreground leading-relaxed pl-5">
          {entry.description}
        </p>
      )}

      {/* 액션 */}
      <div className="flex items-center gap-1 pl-5">
        <button
          type="button"
          onClick={() => onLike(entry.id)}
          aria-label="좋아요"
          className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-rose-500 transition-colors"
        >
          <Heart className="h-3 w-3" />
          <span>{entry.likes}</span>
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          aria-label="하이라이트 삭제"
          className="shrink-0"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500 transition-colors" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// 하이라이트 추가 다이얼로그
// ============================================

function AddHighlightDialog({
  open,
  onOpenChange,
  memberNames,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memberNames: string[];
  onAdd: (params: {
    date: string;
    title: string;
    memberName: string;
    category: PracticeHighlightCategory;
    description?: string;
  }) => PracticeHighlightEntry;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [memberName, setMemberName] = useState("");
  const [category, setCategory] =
    useState<PracticeHighlightCategory | "">("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setDate(new Date());
    setTitle("");
    setMemberName("");
    setCategory("");
    setDescription("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(TOAST.PRACTICE_HIGHLIGHT.TITLE_REQUIRED);
      return;
    }
    if (!memberName) {
      toast.error(TOAST.PRACTICE_HIGHLIGHT_CARD.MEMBER_REQUIRED);
      return;
    }
    if (!category) {
      toast.error(TOAST.PRACTICE_HIGHLIGHT_CARD.CATEGORY_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.PRACTICE_HIGHLIGHT_CARD.DATE_REQUIRED);
      return;
    }

    onAdd({
      date: dateToYMD(date),
      title: title.trim(),
      memberName,
      category: category as PracticeHighlightCategory,
      description: description.trim() || undefined,
    });

    toast.success(TOAST.PRACTICE_HIGHLIGHT.REGISTERED);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500" />
            연습 하이라이트 추가
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 날짜 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              연습 날짜
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start text-xs font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" />
                  {date ? dateToYMD(date) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              하이라이트 제목
            </label>
            <Input
              placeholder="예) 김민지 뒷공중제비 성공!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              maxLength={80}
            />
          </div>

          {/* 멤버 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">멤버</label>
            <Select value={memberName} onValueChange={setMemberName}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="멤버 선택" />
              </SelectTrigger>
              <SelectContent>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리 선택 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              카테고리
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORY_ORDER.map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-left transition-all",
                      category === cat
                        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
                        : "border-border bg-transparent hover:bg-muted/40"
                    )}
                  >
                    <span className="text-[13px] leading-none shrink-0">
                      {meta.emoji}
                    </span>
                    <span className="text-[10px] font-medium leading-tight">
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              설명{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              placeholder="이 순간에 대해 더 자세히 설명해주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs resize-none min-h-[60px]"
              maxLength={300}
            />
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 카테고리 통계 바
// ============================================

function CategoryStatsBar({
  categoryCounts,
  total,
}: {
  categoryCounts: Record<PracticeHighlightCategory, number>;
  total: number;
}) {
  if (total === 0) return null;

  return (
    <div className="space-y-1">
      {CATEGORY_ORDER.map((cat) => {
        const count = categoryCounts[cat] ?? 0;
        if (count === 0) return null;
        const pct = Math.round((count / total) * 100);
        const meta = CATEGORY_META[cat];
        return (
          <div key={cat} className="flex items-center gap-2">
            <span className="text-[11px] w-4 shrink-0">{meta.emoji}</span>
            <span className="text-[10px] text-muted-foreground w-20 shrink-0 truncate">
              {meta.label}
            </span>
            <div className="flex-1 bg-muted/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground w-10 text-right shrink-0">
              {count}개 ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

type PracticeHighlightCardProps = {
  groupId: string;
  memberNames: string[];
};

export function PracticeHighlightCard({
  groupId,
  memberNames,
}: PracticeHighlightCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<
    PracticeHighlightCategory | "all"
  >("all");

  const {
    entries,
    addEntry,
    likeEntry,
    deleteEntry,
    totalEntries,
    totalLikes,
    categoryCounts,
  } = usePracticeHighlight(groupId);

  // 필터된 목록
  const filteredEntries = useMemo(() => {
    if (filterCategory === "all") return entries;
    return entries.filter((e) => e.category === filterCategory);
  }, [filterCategory, entries]);

  // 사용된 카테고리 목록
  const usedCategories = useMemo(
    () =>
      CATEGORY_ORDER.filter(
        (cat) => (categoryCounts[cat] ?? 0) > 0
      ),
    [categoryCounts]
  );

  return (
    <>
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* 헤더 */}
        <button
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
        >
          <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
          <span className="text-xs font-medium flex-1">연습 하이라이트</span>

          {totalEntries > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-yellow-100 text-yellow-700 font-semibold shrink-0">
              {totalEntries}개
            </span>
          )}

          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-2.5">
            {/* 통계 요약 */}
            {totalEntries > 0 && (
              <div className="bg-muted/20 rounded-md px-2.5 py-2.5 space-y-2.5">
                {/* 요약 수치 */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-[10px] text-muted-foreground">
                      하이라이트
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {totalEntries}개
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-rose-500" />
                    <span className="text-[10px] text-muted-foreground">
                      좋아요
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {totalLikes}개
                    </span>
                  </div>
                </div>

                {/* 카테고리 분포 */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium mb-1.5">
                    카테고리 분포
                  </p>
                  <CategoryStatsBar
                    categoryCounts={categoryCounts}
                    total={totalEntries}
                  />
                </div>
              </div>
            )}

            {/* 카테고리 필터 */}
            {usedCategories.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterCategory("all")}
                  className={cn(
                    "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    filterCategory === "all"
                      ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  <Filter className="h-2.5 w-2.5" />
                  전체
                </button>
                {usedCategories.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterCategory(cat)}
                      className={cn(
                        "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                        filterCategory === cat
                          ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold"
                          : "border-border text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <span>{meta.emoji}</span>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 하이라이트 목록 */}
            {filteredEntries.length > 0 ? (
              <div className="space-y-1.5">
                {filteredEntries.map((entry) => (
                  <HighlightItem
                    key={entry.id}
                    entry={entry}
                    onLike={(id) => {
                      likeEntry(id);
                    }}
                    onDelete={(id) => {
                      deleteEntry(id);
                      toast.success(TOAST.PRACTICE_HIGHLIGHT.DELETED);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                <Star className="h-5 w-5" />
                <p className="text-xs">아직 하이라이트가 없습니다</p>
                <p className="text-[10px]">
                  연습의 특별한 순간을 기록해보세요
                </p>
              </div>
            )}

            {/* 구분선 */}
            {filteredEntries.length > 0 && (
              <div className="border-t border-border/40" />
            )}

            {/* 추가 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              하이라이트 추가
            </Button>
          </div>
        )}
      </div>

      {/* 추가 다이얼로그 */}
      <AddHighlightDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memberNames={memberNames}
        onAdd={addEntry}
      />
    </>
  );
}
