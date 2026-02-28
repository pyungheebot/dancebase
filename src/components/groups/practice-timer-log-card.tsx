"use client";

import { useState } from "react";
import {
  Timer,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  usePracticeTimerLog,
} from "@/hooks/use-practice-timer-log";
import type { PracticeTimerCategory, PracticeTimerLogEntry } from "@/types";

// ============================================================
// 상수 / 헬퍼
// ============================================================

const CATEGORIES: { value: PracticeTimerCategory; label: string }[] = [
  { value: "warmup", label: "워밍업" },
  { value: "technique", label: "테크닉" },
  { value: "choreography", label: "안무" },
  { value: "freestyle", label: "프리스타일" },
  { value: "cooldown", label: "쿨다운" },
  { value: "other", label: "기타" },
];

// 카테고리 색상 (CSS 클래스)
const CATEGORY_COLOR: Record<
  PracticeTimerCategory,
  { badge: string; bar: string; dot: string }
> = {
  warmup: {
    badge: "bg-orange-100 text-orange-700",
    bar: "bg-orange-400",
    dot: "bg-orange-400",
  },
  technique: {
    badge: "bg-blue-100 text-blue-700",
    bar: "bg-blue-400",
    dot: "bg-blue-400",
  },
  choreography: {
    badge: "bg-purple-100 text-purple-700",
    bar: "bg-purple-400",
    dot: "bg-purple-400",
  },
  freestyle: {
    badge: "bg-pink-100 text-pink-700",
    bar: "bg-pink-400",
    dot: "bg-pink-400",
  },
  cooldown: {
    badge: "bg-cyan-100 text-cyan-700",
    bar: "bg-cyan-400",
    dot: "bg-cyan-400",
  },
  other: {
    badge: "bg-gray-100 text-gray-600",
    bar: "bg-gray-400",
    dot: "bg-gray-400",
  },
};

function categoryLabel(cat: PracticeTimerCategory): string {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

function formatTotalTime(minutes: number): string {
  if (minutes <= 0) return "0분";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function formatDate(ymd: string): string {
  const d = new Date(ymd + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function toWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}주`;
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// 별점 컴포넌트
// ============================================================

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={cn(
            "p-0 leading-none",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"
          )}
          aria-label={readonly ? undefined : `강도 ${n}`}
        >
          <Star
            className={cn(
              "h-3 w-3",
              n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 카테고리 분포 바 차트
// ============================================================

function CategoryBarChart({
  breakdown,
  totalMinutes,
}: {
  breakdown: Record<PracticeTimerCategory, number>;
  totalMinutes: number;
}) {
  const categories: PracticeTimerCategory[] = [
    "warmup",
    "technique",
    "choreography",
    "freestyle",
    "cooldown",
    "other",
  ];
  const hasData = totalMinutes > 0;

  return (
    <div className="space-y-1.5">
      {categories.map((cat) => {
        const mins = breakdown[cat] ?? 0;
        const pct = hasData ? Math.round((mins / totalMinutes) * 100) : 0;
        if (mins === 0 && !hasData) return null;
        const colors = CATEGORY_COLOR[cat];
        return (
          <div key={cat} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-14 shrink-0 text-right">
              {categoryLabel(cat)}
            </span>
            <div className="flex-1 bg-muted/30 rounded-full h-1.5 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", colors.bar)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-16 shrink-0">
              {mins > 0 ? `${mins}분 (${pct}%)` : "-"}
            </span>
          </div>
        );
      })}
      {!hasData && (
        <p className="text-[10px] text-muted-foreground text-center py-1">
          기록 없음
        </p>
      )}
    </div>
  );
}

// ============================================================
// 주간 추이 바 차트
// ============================================================

function WeeklyTrendChart({
  weeklyTrend,
}: {
  weeklyTrend: { weekStart: string; totalMinutes: number }[];
}) {
  const maxMinutes = Math.max(...weeklyTrend.map((w) => w.totalMinutes), 1);

  return (
    <div className="flex items-end gap-2 h-14">
      {weeklyTrend.map((w) => {
        const pct = Math.round((w.totalMinutes / maxMinutes) * 100);
        return (
          <div
            key={w.weekStart}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <span className="text-[9px] text-muted-foreground">
              {w.totalMinutes > 0 ? `${w.totalMinutes}분` : ""}
            </span>
            <div className="w-full bg-muted/30 rounded-sm overflow-hidden h-8 flex items-end">
              <div
                className="w-full bg-violet-400 rounded-sm transition-all"
                style={{ height: `${Math.max(pct, w.totalMinutes > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">
              {toWeekLabel(w.weekStart)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 기록 아이템
// ============================================================

function LogItem({
  entry,
  onDelete,
}: {
  entry: PracticeTimerLogEntry;
  onDelete: (id: string) => void;
}) {
  const colors = CATEGORY_COLOR[entry.category];

  return (
    <div className="bg-muted/30 rounded px-2 py-1.5 flex items-start gap-2">
      {/* 날짜 */}
      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 w-8">
        {formatDate(entry.date)}
      </span>

      {/* 본문 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 카테고리 배지 */}
          <span
            className={cn(
              "text-[10px] px-1.5 py-0 rounded font-medium",
              colors.badge
            )}
          >
            {categoryLabel(entry.category)}
          </span>
          {/* 시간 */}
          <span className="text-[10px] font-semibold text-foreground">
            {entry.durationMinutes}분
          </span>
          {/* 강도 */}
          <StarRating value={entry.intensity} readonly />
          {/* 멤버 */}
          {entry.memberName && (
            <span className="text-[10px] text-muted-foreground">
              {entry.memberName}
            </span>
          )}
        </div>
        {/* 설명 */}
        {entry.description && (
          <p className="text-[10px] text-muted-foreground truncate">
            {entry.description}
          </p>
        )}
      </div>

      {/* 삭제 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onDelete(entry.id)}
        aria-label="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================================
// 기록 추가 다이얼로그
// ============================================================

type AddLogDialogProps = {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  onSubmit: (
    date: string,
    category: PracticeTimerCategory,
    durationMinutes: number,
    memberName: string | undefined,
    description: string | undefined,
    intensity: number
  ) => void;
};

function AddLogDialog({
  open,
  onClose,
  memberNames,
  onSubmit,
}: AddLogDialogProps) {
  const [date, setDate] = useState(todayYmd());
  const [category, setCategory] = useState<PracticeTimerCategory>("choreography");
  const [duration, setDuration] = useState("60");
  const [memberName, setMemberName] = useState<string>("");
  const [description, setDescription] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setDate(todayYmd());
    setCategory("choreography");
    setDuration("60");
    setMemberName("");
    setDescription("");
    setIntensity(3);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(duration, 10);
    if (!date) {
      toast.error("날짜를 입력해주세요.");
      return;
    }
    if (isNaN(mins) || mins <= 0) {
      toast.error("올바른 시간(분)을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      onSubmit(
        date,
        category,
        mins,
        memberName || undefined,
        description || undefined,
        intensity
      );
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">연습 기록 추가</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
              required
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as PracticeTimerCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-xs">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 시간 (분) */}
          <div className="space-y-1">
            <Label className="text-xs">시간 (분)</Label>
            <Input
              type="number"
              min={1}
              max={480}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-8 text-xs"
              placeholder="60"
              required
            />
          </div>

          {/* 멤버 */}
          {memberNames.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">멤버 (선택)</Label>
              <Select
                value={memberName}
                onValueChange={setMemberName}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="멤버 선택..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs text-muted-foreground">
                    선택 안 함
                  </SelectItem>
                  {memberNames.map((n) => (
                    <SelectItem key={n} value={n} className="text-xs">
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">설명 (선택)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
              placeholder="연습 내용을 간단히 적어주세요"
            />
          </div>

          {/* 강도 */}
          <div className="space-y-1">
            <Label className="text-xs">강도</Label>
            <div className="flex items-center gap-2">
              <StarRating value={intensity} onChange={setIntensity} />
              <span className="text-[10px] text-muted-foreground">
                {intensity === 1
                  ? "매우 낮음"
                  : intensity === 2
                  ? "낮음"
                  : intensity === 3
                  ? "보통"
                  : intensity === 4
                  ? "높음"
                  : "매우 높음"}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={submitting}
            >
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type PracticeTimerLogCardProps = {
  groupId: string;
  memberNames: string[];
};

export function PracticeTimerLogCard({
  groupId,
  memberNames,
}: PracticeTimerLogCardProps) {
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { logs, addLog, deleteLog, stats } = usePracticeTimerLog(groupId);

  // 기록 목록 내림차순
  const sortedLogs = [...logs].sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function handleAdd(
    date: string,
    category: PracticeTimerCategory,
    durationMinutes: number,
    memberName: string | undefined,
    description: string | undefined,
    intensity: number
  ) {
    addLog(date, category, durationMinutes, memberName, description, intensity);
    toast.success("연습 기록이 추가되었습니다.");
  }

  function handleDelete(id: string) {
    const ok = deleteLog(id);
    if (ok) {
      toast.success("기록이 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="rounded-lg border bg-card">
          {/* ── 헤더 ── */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center gap-1.5 px-3 py-2.5 text-left"
              aria-expanded={open}
            >
              <Timer className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <span className="text-xs font-medium flex-1">연습 타이머 기록</span>

              {/* 총 시간 배지 */}
              {stats.totalMinutes > 0 && (
                <span className="text-[10px] px-1.5 py-0 rounded bg-violet-100 text-violet-700 font-semibold shrink-0">
                  {formatTotalTime(stats.totalMinutes)}
                </span>
              )}

              {/* 기록 수 배지 */}
              {stats.totalLogs > 0 && (
                <span className="text-[10px] px-1.5 py-0 rounded bg-muted text-muted-foreground font-medium shrink-0">
                  {stats.totalLogs}건
                </span>
              )}

              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-3 pb-3 pt-0 space-y-3">
              {/* ── 상단 통계 3개 ── */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-0.5 bg-muted/20 rounded p-1.5">
                  <Timer className="h-3 w-3 text-violet-400" />
                  <span className="text-[10px] font-semibold text-foreground leading-tight text-center">
                    {formatTotalTime(stats.totalMinutes)}
                  </span>
                  <span className="text-[9px] text-muted-foreground">총 시간</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 bg-muted/20 rounded p-1.5">
                  <Star className="h-3 w-3 text-yellow-400" />
                  <span className="text-[10px] font-semibold text-foreground">
                    {stats.averageIntensity > 0 ? stats.averageIntensity : "-"}
                  </span>
                  <span className="text-[9px] text-muted-foreground">평균 강도</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 bg-muted/20 rounded p-1.5">
                  <ChevronDown className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] font-semibold text-foreground">
                    {stats.totalLogs > 0 ? `${stats.averageDuration}분` : "-"}
                  </span>
                  <span className="text-[9px] text-muted-foreground">평균 시간</span>
                </div>
              </div>

              {/* ── 구분선 ── */}
              <div className="border-t border-border/40" />

              {/* ── 카테고리 분포 ── */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted-foreground">
                  카테고리별 시간 분포
                </span>
                <CategoryBarChart
                  breakdown={stats.categoryBreakdown}
                  totalMinutes={stats.totalMinutes}
                />
              </div>

              {/* ── 구분선 ── */}
              <div className="border-t border-border/40" />

              {/* ── 주간 추이 ── */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted-foreground">
                  주간 추이 (최근 4주)
                </span>
                <WeeklyTrendChart weeklyTrend={stats.weeklyTrend} />
              </div>

              {/* ── 구분선 ── */}
              <div className="border-t border-border/40" />

              {/* ── 기록 목록 헤더 ── */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground flex-1">
                  기록 목록
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  기록 추가
                </Button>
              </div>

              {/* ── 기록 목록 ── */}
              {sortedLogs.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                  {sortedLogs.map((entry) => (
                    <LogItem
                      key={entry.id}
                      entry={entry}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 gap-1 text-muted-foreground">
                  <Timer className="h-5 w-5" />
                  <p className="text-xs">아직 연습 기록이 없습니다</p>
                  <p className="text-[10px]">
                    기록 추가 버튼을 눌러 첫 번째 기록을 남겨보세요
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── 기록 추가 다이얼로그 ── */}
      <AddLogDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        memberNames={memberNames}
        onSubmit={handleAdd}
      />
    </>
  );
}
