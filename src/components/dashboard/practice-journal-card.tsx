"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { BookOpen, ChevronDown, ChevronUp, Plus, Trash2, Target } from "lucide-react";
import { usePracticeJournal } from "@/hooks/use-practice-journal";
import { formatShortDate } from "@/lib/date-utils";

// ============================================================
// 별점 컴포넌트
// ============================================================
function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "text-xs" : "text-base";
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value}점`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(s)}
          className={`${dim} leading-none transition-colors ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          } ${s <= value ? "text-yellow-400" : "text-muted-foreground/30"}`}
          aria-label={`${s}점`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

// ============================================================
// 프로그레스 바
// ============================================================
function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  const colorClass =
    clamped >= 100
      ? "bg-green-500"
      : clamped >= 60
      ? "bg-blue-500"
      : clamped >= 30
      ? "bg-orange-400"
      : "bg-muted-foreground/30";
  return (
    <div
      className={`h-2 rounded-full bg-muted overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ============================================================
// 월간 달력 미니뷰
// ============================================================
function MiniCalendar({ practicedDays }: { practicedDays: Set<string> }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 월요일 시작 기준 오프셋 계산
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = startOffset + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);

  const cells: (number | null)[] = Array(rows * 7).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells[startOffset + d - 1] = d;
  }

  const todayDate = today.getDate();
  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="mt-2">
      <div className="grid grid-cols-7 gap-px text-center mb-0.5">
        {weekDays.map((w) => (
          <div
            key={w}
            className="text-[9px] text-muted-foreground font-medium py-0.5"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={idx} className="aspect-square" />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPracticed = practicedDays.has(dateStr);
          const isToday = day === todayDate;
          return (
            <div
              key={idx}
              className={`aspect-square flex items-center justify-center rounded-full text-[9px] font-medium transition-colors ${
                isToday
                  ? "bg-primary text-primary-foreground"
                  : isPracticed
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "text-muted-foreground"
              }`}
              title={isPracticed ? "연습함" : undefined}
            >
              {isPracticed && !isToday && (
                <span className="relative">
                  {day}
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500 block" />
                </span>
              )}
              {(!isPracticed || isToday) && day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 목표 설정 인라인 폼
// ============================================================
function GoalSettingInline({
  currentGoal,
  onSave,
  onCancel,
}: {
  currentGoal: number;
  onSave: (minutes: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(String(currentGoal));

  function handleSave() {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      toast.error("1분 이상 입력해주세요.");
      return;
    }
    onSave(num);
  }

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-7 text-xs w-20"
        placeholder="분"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onCancel();
        }}
      />
      <span className="text-xs text-muted-foreground">분/주</span>
      <Button size="sm" className="h-7 text-xs px-2" onClick={handleSave}>
        저장
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs px-2"
        onClick={onCancel}
      >
        취소
      </Button>
    </div>
  );
}

// ============================================================
// 기록 추가 인라인 폼
// ============================================================
function AddEntryForm({ onAdd, onCancel }: {
  onAdd: (entry: {
    date: string;
    durationMinutes: number;
    content: string;
    selfRating: number;
    memo: string;
  }) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [content, setContent] = useState("");
  const [selfRating, setSelfRating] = useState(3);
  const [memo, setMemo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    const dur = parseInt(durationMinutes, 10);
    if (isNaN(dur) || dur < 1) {
      toast.error("연습 시간을 1분 이상 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("연습 내용을 입력해주세요.");
      return;
    }

    onAdd({
      date,
      durationMinutes: dur,
      content: content.trim(),
      selfRating,
      memo: memo.trim(),
    });
    toast.success("연습 기록이 추가되었습니다.");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        {/* 날짜 */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">날짜</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        {/* 연습 시간 */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">연습 시간 (분)</Label>
          <Input
            type="number"
            min={1}
            placeholder="예: 60"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* 연습 내용 */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">연습 내용</Label>
        <Input
          placeholder="무엇을 연습했나요?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      {/* 자기 평가 */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">자기 평가</Label>
        <StarRating value={selfRating} onChange={setSelfRating} />
      </div>

      {/* 메모 */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">메모 (선택)</Label>
        <Textarea
          placeholder="추가 메모..."
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="text-xs min-h-[56px] resize-none"
        />
      </div>

      <div className="flex gap-1.5 justify-end pt-0.5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
        <Button type="submit" size="sm" className="h-7 text-xs">
          저장
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// 기록 목록 아이템
// ============================================================
function EntryItem({
  entry,
  onDelete,
}: {
  entry: {
    id: string;
    date: string;
    durationMinutes: number;
    content: string;
    selfRating: number;
    memo: string;
  };
  onDelete: (id: string) => void;
}) {
  
  function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes}분`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  }

  return (
    <div className="flex items-start gap-2 py-1.5 px-2 -mx-2 rounded hover:bg-muted/40 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground shrink-0">
            {formatShortDate(entry.date)}
          </span>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium shrink-0">
            {formatDuration(entry.durationMinutes)}
          </span>
          <StarRating value={entry.selfRating} readonly size="sm" />
        </div>
        <p className="text-xs text-foreground truncate mt-0.5">{entry.content}</p>
        {entry.memo && (
          <p className="text-[10px] text-muted-foreground truncate">{entry.memo}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(entry.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 text-destructive shrink-0"
        aria-label="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ============================================================
// 통계 뱃지
// ============================================================
function StatBadge({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-muted/40 px-2.5 py-2">
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      <span className="text-base font-bold tabular-nums leading-tight">
        {value}
        {unit && (
          <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

// ============================================================
// 메인 카드
// ============================================================
export function PracticeJournalCard() {
  const {
    entries,
    weeklyGoalMinutes,
    loading,
    addEntry,
    deleteEntry,
    setWeeklyGoal,
    getWeeklyStats,
    getMonthlyStats,
    getMonthPracticedDays,
  } = usePracticeJournal();

  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);

  const weeklyStats = useMemo(() => getWeeklyStats(), [getWeeklyStats]);
  const monthlyStats = useMemo(() => getMonthlyStats(), [getMonthlyStats]);
  const practicedDays = useMemo(
    () => getMonthPracticedDays(),
    [getMonthPracticedDays]
  );

  const recentEntries = entries.slice(0, 5);

  function handleDelete(id: string) {
    deleteEntry(id);
    toast.success("기록이 삭제되었습니다.");
  }

  function handleGoalSave(minutes: number) {
    setWeeklyGoal(minutes);
    setEditingGoal(false);
    toast.success(`주간 목표가 ${minutes}분으로 설정되었습니다.`);
  }

  function formatMinutes(minutes: number) {
    if (minutes < 60) return `${minutes}분`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  }

  const now = new Date();
  const monthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between group"
              aria-expanded={open}
            >
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" aria-hidden />
                개인 연습 일지
              </CardTitle>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {loading ? (
              <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
                불러오는 중...
              </div>
            ) : (
              <>
                {/* 주간 목표 프로그레스 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Target className="h-3 w-3" />
                      <span>이번 주 연습 시간</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingGoal((v) => !v)}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      목표 설정
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold tabular-nums">
                      {formatMinutes(weeklyStats.totalMinutes)}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      / {formatMinutes(weeklyStats.goalMinutes)}
                    </span>
                  </div>
                  <ProgressBar value={weeklyStats.goalProgress} />
                  <div className="text-[10px] text-muted-foreground text-right tabular-nums">
                    {weeklyStats.goalProgress}% 달성 ({weeklyStats.practiceCount}회 연습)
                  </div>

                  {editingGoal && (
                    <GoalSettingInline
                      currentGoal={weeklyGoalMinutes}
                      onSave={handleGoalSave}
                      onCancel={() => setEditingGoal(false)}
                    />
                  )}
                </div>

                {/* 기록 추가 버튼 / 폼 */}
                {showForm ? (
                  <AddEntryForm
                    onAdd={(entry) => {
                      addEntry(entry);
                      setShowForm(false);
                    }}
                    onCancel={() => setShowForm(false)}
                  />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs w-full"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    기록 추가
                  </Button>
                )}

                {/* 최근 기록 목록 */}
                {recentEntries.length > 0 && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      최근 기록
                    </p>
                    {recentEntries.map((entry) => (
                      <EntryItem
                        key={entry.id}
                        entry={entry}
                        onDelete={handleDelete}
                      />
                    ))}
                    {entries.length > 5 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-0.5">
                        +{entries.length - 5}개 더 있음
                      </p>
                    )}
                  </div>
                )}

                {/* 월간 달력 미니뷰 */}
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {monthLabel} 캘린더
                  </p>
                  <MiniCalendar practicedDays={practicedDays} />
                </div>

                {/* 월간 통계 */}
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    {monthLabel} 통계
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <StatBadge
                      label="총 연습 시간"
                      value={formatMinutes(monthlyStats.totalMinutes)}
                    />
                    <StatBadge
                      label="연습 일수"
                      value={monthlyStats.practiceCount}
                      unit="회"
                    />
                    <StatBadge
                      label="평균 평가"
                      value={
                        monthlyStats.averageRating > 0
                          ? monthlyStats.averageRating.toFixed(1)
                          : "-"
                      }
                    />
                  </div>
                </div>

                {/* 기록 없을 때 빈 상태 */}
                {entries.length === 0 && !showForm && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    아직 연습 기록이 없습니다. 첫 기록을 추가해보세요!
                  </p>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
