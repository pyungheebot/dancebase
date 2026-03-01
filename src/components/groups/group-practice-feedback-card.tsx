"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Star,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  TrendingUp,
  Target,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupPracticeFeedback } from "@/hooks/use-group-practice-feedback";
import type { GroupPracticeFeedbackEntry } from "@/types";

// ============================================
// 날짜 헬퍼
// ============================================

function formatDate(ymd: string): string {
  const d = new Date(ymd + "T00:00:00");
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// ============================================
// 별점 컴포넌트
// ============================================

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "xs";
}) {
  const iconClass =
    size === "xs" ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          aria-label={`${star}점`}
          className={cn(
            "shrink-0 transition-colors",
            readonly && "cursor-default"
          )}
        >
          <Star
            className={cn(
              iconClass,
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================
// 평균 별점 트렌드 차트 (CSS div 기반)
// ============================================

function RatingTrendChart({
  trend,
}: {
  trend: { date: string; avgRating: number }[];
}) {
  if (trend.length < 2) return null;

  const maxRating = 5;
  // 최근 8개만 표시
  const display = trend.slice(-8);

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground font-medium">
        날짜별 평균 별점 트렌드
      </p>
      <div className="flex items-end gap-1 h-12">
        {display.map((item) => {
          const heightPct = Math.round((item.avgRating / maxRating) * 100);
          return (
            <div
              key={item.date}
              className="flex-1 flex flex-col items-center justify-end gap-0.5"
            >
              <span className="text-[8px] text-muted-foreground font-mono leading-none">
                {item.avgRating}
              </span>
              <div
                className="w-full rounded-t bg-yellow-400/80 transition-all"
                style={{ height: `${Math.max(heightPct, 8)}%` }}
                title={`${formatDate(item.date)}: ${item.avgRating}점`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">
        {display.map((item) => (
          <div
            key={item.date}
            className="flex-1 text-center text-[7px] text-muted-foreground leading-none truncate"
            title={formatDate(item.date)}
          >
            {item.date.slice(5)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 피드백 항목
// ============================================

function FeedbackItem({
  entry,
  onDelete,
}: {
  entry: GroupPracticeFeedbackEntry;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-muted/30 rounded-md px-2.5 py-2 space-y-1.5">
      {/* 헤더 */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="flex-1 flex items-center gap-1.5 text-left min-w-0"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <span className="text-xs font-semibold truncate">
            {entry.authorName}
          </span>
          <StarRating value={entry.rating} readonly size="xs" />
        </button>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatDate(entry.practiceDate)}
        </span>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          aria-label="피드백 삭제"
          className="shrink-0"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500 transition-colors" />
        </button>
      </div>

      {/* 연습 제목 */}
      {entry.practiceTitle && (
        <p className="text-[10px] text-muted-foreground px-4">
          {entry.practiceTitle}
        </p>
      )}

      {/* 잘한점 요약 (항상 표시) */}
      <div className="px-4">
        <p className="text-[10px] text-foreground/80 leading-relaxed line-clamp-2">
          <span className="inline-flex items-center gap-0.5 text-green-600 font-medium mr-1">
            <ThumbsUp className="h-2.5 w-2.5" />
            잘한점
          </span>
          {entry.positives}
        </p>
      </div>

      {/* 펼쳤을 때 추가 내용 */}
      {expanded && (
        <div className="px-4 space-y-1.5">
          {/* 개선점 */}
          <p className="text-[10px] text-foreground/80 leading-relaxed">
            <span className="inline-flex items-center gap-0.5 text-orange-600 font-medium mr-1">
              <TrendingUp className="h-2.5 w-2.5" />
              개선점
            </span>
            {entry.improvements}
          </p>

          {/* 다음 목표 */}
          {entry.goals && (
            <p className="text-[10px] text-foreground/80 leading-relaxed">
              <span className="inline-flex items-center gap-0.5 text-blue-600 font-medium mr-1">
                <Target className="h-2.5 w-2.5" />
                다음 목표
              </span>
              {entry.goals}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 날짜별 그룹 섹션
// ============================================

function DateGroup({
  date,
  entries,
  onDelete,
}: {
  date: string;
  entries: GroupPracticeFeedbackEntry[];
  onDelete: (id: string) => void;
}) {
  // 해당 날짜의 평균 별점
  const avgRating =
    entries.reduce((sum, e) => sum + e.rating, 0) / entries.length;

  return (
    <div className="space-y-1">
      {/* 날짜 헤더 */}
      <div className="flex items-center gap-1.5">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-[10px] text-muted-foreground font-medium px-1">
          {formatDate(date)}
        </span>
        <StarRating value={Math.round(avgRating)} readonly size="xs" />
        <span className="text-[10px] text-muted-foreground">
          {avgRating.toFixed(1)}
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* 해당 날짜 항목들 */}
      <div className="space-y-1.5">
        {entries.map((entry) => (
          <FeedbackItem key={entry.id} entry={entry} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 피드백 작성 다이얼로그
// ============================================

type FeedbackFormState = {
  authorName: string;
  practiceDate: string;
  practiceTitle: string;
  rating: number;
  positives: string;
  improvements: string;
  goals: string;
};

function AddFeedbackDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (params: Omit<GroupPracticeFeedbackEntry, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState<FeedbackFormState>({
    authorName: "",
    practiceDate: todayYMD(),
    practiceTitle: "",
    rating: 3,
    positives: "",
    improvements: "",
    goals: "",
  });

  const setField = <K extends keyof FeedbackFormState>(
    key: K,
    value: FeedbackFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm({
      authorName: "",
      practiceDate: todayYMD(),
      practiceTitle: "",
      rating: 3,
      positives: "",
      improvements: "",
      goals: "",
    });
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.authorName.trim()) {
      toast.error(TOAST.GROUP_PRACTICE_FEEDBACK.AUTHOR_REQUIRED);
      return;
    }
    if (!form.practiceDate) {
      toast.error(TOAST.GROUP_PRACTICE_FEEDBACK.DATE_REQUIRED);
      return;
    }
    if (!form.positives.trim()) {
      toast.error(TOAST.GROUP_PRACTICE_FEEDBACK.GOOD_REQUIRED);
      return;
    }
    if (!form.improvements.trim()) {
      toast.error(TOAST.GROUP_PRACTICE_FEEDBACK.IMPROVE_REQUIRED);
      return;
    }

    onAdd({
      authorName: form.authorName.trim(),
      practiceDate: form.practiceDate,
      practiceTitle: form.practiceTitle.trim() || null,
      rating: form.rating,
      positives: form.positives.trim(),
      improvements: form.improvements.trim(),
      goals: form.goals.trim() || null,
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-indigo-500" />
            연습 피드백 작성
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 작성자 이름 */}
          <div className="space-y-1">
            <label className="text-xs font-medium">작성자 이름</label>
            <Input
              value={form.authorName}
              onChange={(e) => setField("authorName", e.target.value)}
              placeholder="이름을 입력하세요"
              className="h-8 text-xs"
              maxLength={20}
            />
          </div>

          {/* 연습 날짜 */}
          <div className="space-y-1">
            <label className="text-xs font-medium">연습 날짜</label>
            <Input
              type="date"
              value={form.practiceDate}
              onChange={(e) => setField("practiceDate", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 연습 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium">
              연습 제목{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Input
              value={form.practiceTitle}
              onChange={(e) => setField("practiceTitle", e.target.value)}
              placeholder="예: 루틴 A 집중 연습"
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>

          {/* 별점 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">별점</label>
              <span className="text-[10px] text-yellow-600 font-semibold">
                {form.rating}점 / 5점
              </span>
            </div>
            <div className="flex items-center gap-1">
              <StarRating
                value={form.rating}
                onChange={(v) => setField("rating", v)}
                size="sm"
              />
            </div>
          </div>

          {/* 잘한 점 */}
          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <ThumbsUp className="h-3 w-3 text-green-600" />
              잘한 점
            </label>
            <Textarea
              value={form.positives}
              onChange={(e) => setField("positives", e.target.value)}
              placeholder="오늘 연습에서 잘했다고 느낀 부분을 적어주세요."
              className="text-xs resize-none min-h-[64px]"
              maxLength={300}
            />
          </div>

          {/* 개선할 점 */}
          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-orange-600" />
              개선할 점
            </label>
            <Textarea
              value={form.improvements}
              onChange={(e) => setField("improvements", e.target.value)}
              placeholder="더 연습이 필요한 부분이나 보완할 점을 적어주세요."
              className="text-xs resize-none min-h-[64px]"
              maxLength={300}
            />
          </div>

          {/* 다음 목표 */}
          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <Target className="h-3 w-3 text-blue-600" />
              다음 목표{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              value={form.goals}
              onChange={(e) => setField("goals", e.target.value)}
              placeholder="다음 연습까지 달성하고 싶은 목표를 적어주세요."
              className="text-xs resize-none min-h-[52px]"
              maxLength={200}
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
// 메인 카드 컴포넌트
// ============================================

type GroupPracticeFeedbackCardProps = {
  groupId: string;
};

export function GroupPracticeFeedbackCard({
  groupId,
}: GroupPracticeFeedbackCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("all");

  const {
    entries,
    addEntry,
    deleteEntry,
    uniqueDates,
    totalEntries,
    averageRating,
    ratingTrend,
  } = useGroupPracticeFeedback(groupId);

  // 필터된 항목
  const filteredEntries = useMemo(() => {
    if (filterDate === "all") return entries;
    return entries.filter((e) => e.practiceDate === filterDate);
  }, [entries, filterDate]);

  // 날짜별 그룹핑
  const groupedByDate = useMemo(() => {
    const map: Record<string, GroupPracticeFeedbackEntry[]> = {};
    for (const entry of filteredEntries) {
      if (!map[entry.practiceDate]) map[entry.practiceDate] = [];
      map[entry.practiceDate].push(entry);
    }
    // 날짜 내림차순
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredEntries]);

  const handleAdd = (
    params: Omit<GroupPracticeFeedbackEntry, "id" | "createdAt">
  ) => {
    addEntry(params);
    toast.success(TOAST.PRACTICE_FEEDBACK.REGISTERED);
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    toast.success(TOAST.PRACTICE_FEEDBACK.DELETED);
  };

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
          <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="text-xs font-medium flex-1">그룹 연습 피드백</span>

          {totalEntries > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-indigo-100 text-indigo-700 font-semibold shrink-0">
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
                {/* 평균 별점 */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted-foreground font-medium">
                      평균 별점
                    </p>
                    <div className="flex items-center gap-1.5">
                      <StarRating
                        value={Math.round(averageRating)}
                        readonly
                        size="sm"
                      />
                      <span className="text-sm font-bold text-yellow-600">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        / 5.0 ({totalEntries}개)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 트렌드 차트 */}
                {ratingTrend.length >= 2 && (
                  <RatingTrendChart trend={ratingTrend} />
                )}
              </div>
            )}

            {/* 날짜 필터 */}
            {uniqueDates.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterDate("all")}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    filterDate === "all"
                      ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  전체
                </button>
                {uniqueDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFilterDate(d)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                      filterDate === d
                        ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {formatDate(d)}
                  </button>
                ))}
              </div>
            )}

            {/* 피드백 목록 (날짜별 그룹핑) */}
            {groupedByDate.length > 0 ? (
              <div className="space-y-3">
                {groupedByDate.map(([date, dateEntries]) => (
                  <DateGroup
                    key={date}
                    date={date}
                    entries={dateEntries}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                <Pencil className="h-5 w-5" />
                <p className="text-xs">아직 피드백이 없습니다</p>
                <p className="text-[10px]">
                  연습 후 서로의 피드백을 공유해보세요
                </p>
              </div>
            )}

            {/* 구분선 */}
            {groupedByDate.length > 0 && (
              <div className="border-t border-border/40" />
            )}

            {/* 피드백 추가 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              피드백 추가
            </Button>
          </div>
        )}
      </div>

      {/* 피드백 작성 다이얼로그 */}
      <AddFeedbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAdd}
      />
    </>
  );
}
