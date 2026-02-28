"use client";

import { useState, useCallback } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  Flame,
  Clock,
  Music,
  Tag,
  X,
  BarChart2,
  CalendarDays,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDanceDiary } from "@/hooks/use-dance-diary";
import type {
  DanceDiaryMood,
  DanceDiaryCondition,
  DanceDiaryEntry,
} from "@/types";

// ============================================================
// 상수 매핑
// ============================================================

const MOOD_EMOJI: Record<DanceDiaryMood, string> = {
  great: "😄",
  good: "😊",
  neutral: "😐",
  tired: "😴",
  frustrated: "😤",
};

const MOOD_LABEL: Record<DanceDiaryMood, string> = {
  great: "최고",
  good: "좋음",
  neutral: "보통",
  tired: "피곤",
  frustrated: "힘듦",
};

const MOOD_COLOR: Record<DanceDiaryMood, string> = {
  great: "bg-green-500",
  good: "bg-emerald-400",
  neutral: "bg-yellow-400",
  tired: "bg-orange-400",
  frustrated: "bg-red-500",
};

const MOOD_RING: Record<DanceDiaryMood, string> = {
  great: "ring-green-400",
  good: "ring-emerald-400",
  neutral: "ring-yellow-400",
  tired: "ring-orange-400",
  frustrated: "ring-red-400",
};

const MOOD_ORDER: DanceDiaryMood[] = [
  "great",
  "good",
  "neutral",
  "tired",
  "frustrated",
];

const CONDITION_EMOJI: Record<DanceDiaryCondition, string> = {
  excellent: "💪",
  good: "✅",
  normal: "🙂",
  sore: "😣",
  injured: "🤕",
};

const CONDITION_LABEL: Record<DanceDiaryCondition, string> = {
  excellent: "최상",
  good: "좋음",
  normal: "보통",
  sore: "근육통",
  injured: "부상",
};

const CONDITION_ORDER: DanceDiaryCondition[] = [
  "excellent",
  "good",
  "normal",
  "sore",
  "injured",
];

// ============================================================
// 날짜 유틸
// ============================================================

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateKor(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayIdx = new Date(`${dateStr}T00:00:00`).getDay();
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일 (${days[dayIdx]})`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

// ============================================================
// 서브 컴포넌트: 기분 선택
// ============================================================

function MoodPicker({
  value,
  onChange,
}: {
  value: DanceDiaryMood;
  onChange: (v: DanceDiaryMood) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {MOOD_ORDER.map((mood) => (
        <button
          key={mood}
          type="button"
          onClick={() => onChange(mood)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 border text-center transition-all",
            "hover:scale-105",
            value === mood
              ? `ring-2 ${MOOD_RING[mood]} border-transparent bg-muted`
              : "border-border bg-background"
          )}
        >
          <span className="text-lg leading-none">{MOOD_EMOJI[mood]}</span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
            {MOOD_LABEL[mood]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 컨디션 선택
// ============================================================

function ConditionPicker({
  value,
  onChange,
}: {
  value: DanceDiaryCondition;
  onChange: (v: DanceDiaryCondition) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {CONDITION_ORDER.map((cond) => (
        <button
          key={cond}
          type="button"
          onClick={() => onChange(cond)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 border text-center transition-all",
            "hover:scale-105",
            value === cond
              ? "ring-2 ring-blue-400 border-transparent bg-muted"
              : "border-border bg-background"
          )}
        >
          <span className="text-base leading-none">{CONDITION_EMOJI[cond]}</span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
            {CONDITION_LABEL[cond]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 별점
// ============================================================

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "h-5 w-5",
              (hovered || value) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 태그 입력 (성과 / 어려움 / 곡)
// ============================================================

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  colorClass,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  colorClass: string;
}) {
  const [input, setInput] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setInput("");
      return;
    }
    onAdd(trimmed);
    setInput("");
  }, [input, tags, onAdd]);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="h-7 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={handleAdd}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              className={cn("text-[10px] px-1.5 py-0 gap-0.5", colorClass)}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="ml-0.5 hover:opacity-70"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 미니 달력
// ============================================================

function MiniCalendar({
  year,
  month,
  entries,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  entries: DanceDiaryEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);

  const entryMap = new Map<string, DanceDiaryMood>();
  for (const e of entries) {
    entryMap.set(e.date, e.mood);
  }

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const DAYS_KOR = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 mb-1">
        {DAYS_KOR.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] text-muted-foreground py-0.5"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (day === null)
            return <div key={`empty-${idx}`} className="aspect-square" />;

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const mood = entryMap.get(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === getTodayStr();

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "aspect-square rounded flex items-center justify-center text-[10px] relative transition-all",
                "hover:bg-muted",
                isSelected && "ring-2 ring-primary",
                isToday && !isSelected && "font-bold text-primary"
              )}
            >
              {mood && (
                <span
                  className={cn(
                    "absolute inset-0.5 rounded opacity-30",
                    MOOD_COLOR[mood]
                  )}
                />
              )}
              <span className="relative z-10">{day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 기분 분포 차트 (div 기반)
// ============================================================

function MoodDistributionChart({
  distribution,
  total,
}: {
  distribution: Record<DanceDiaryMood, number>;
  total: number;
}) {
  if (total === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        아직 기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {MOOD_ORDER.map((mood) => {
        const count = distribution[mood];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={mood} className="flex items-center gap-2">
            <span className="text-sm w-5">{MOOD_EMOJI[mood]}</span>
            <span className="text-[10px] text-muted-foreground w-8">
              {MOOD_LABEL[mood]}
            </span>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", MOOD_COLOR[mood])}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-8 text-right">
              {count}회
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 다이어리 항목 카드
// ============================================================

function DiaryEntryItem({
  entry,
  onDelete,
  onEdit,
}: {
  entry: DanceDiaryEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: DanceDiaryEntry) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base">{MOOD_EMOJI[entry.mood]}</span>
          <span className="text-xs font-medium truncate">
            {formatDateKor(entry.date)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* 별점 */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "h-3 w-3",
                  s <= entry.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-muted-foreground"
                )}
              />
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 컨디션 + 연습시간 */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
          <span>{CONDITION_EMOJI[entry.condition]}</span>
          {CONDITION_LABEL[entry.condition]}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          {entry.practiceHours}시간
        </Badge>
      </div>

      {/* 곡 목록 */}
      {entry.songsPracticed.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.songsPracticed.map((song) => (
            <Badge
              key={song}
              className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200"
            >
              <Music className="h-2.5 w-2.5 mr-0.5" />
              {song}
            </Badge>
          ))}
        </div>
      )}

      {/* 성과 */}
      {entry.achievements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.achievements.map((a) => (
            <Badge
              key={a}
              className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200"
            >
              {a}
            </Badge>
          ))}
        </div>
      )}

      {/* 어려움 */}
      {entry.struggles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.struggles.map((s) => (
            <Badge
              key={s}
              className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200"
            >
              {s}
            </Badge>
          ))}
        </div>
      )}

      {/* 메모 */}
      {entry.notes && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {entry.notes}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 폼 초기값
// ============================================================

function getDefaultForm(date: string) {
  return {
    date,
    mood: "good" as DanceDiaryMood,
    condition: "normal" as DanceDiaryCondition,
    practiceHours: 1,
    achievements: [] as string[],
    struggles: [] as string[],
    notes: "",
    songsPracticed: [] as string[],
    rating: 3,
  };
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceDiaryCard({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(false);
  const today = getTodayStr();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(getDefaultForm(today));

  const { entries, loading, addEntry, updateEntry, deleteEntry, getEntriesByMonth, stats } =
    useDanceDiary(memberId);

  const monthEntries = getEntriesByMonth(calYear, calMonth);

  // 폼 열기 (신규)
  const openNewForm = useCallback(() => {
    setForm(getDefaultForm(selectedDate));
    setEditingId(null);
    setFormVisible(true);
  }, [selectedDate]);

  // 폼 열기 (수정)
  const openEditForm = useCallback((entry: DanceDiaryEntry) => {
    setForm({
      date: entry.date,
      mood: entry.mood,
      condition: entry.condition,
      practiceHours: entry.practiceHours,
      achievements: [...entry.achievements],
      struggles: [...entry.struggles],
      notes: entry.notes,
      songsPracticed: [...entry.songsPracticed],
      rating: entry.rating,
    });
    setEditingId(entry.id);
    setFormVisible(true);
  }, []);

  // 폼 닫기
  const closeForm = useCallback(() => {
    setFormVisible(false);
    setEditingId(null);
  }, []);

  // 저장
  const handleSave = useCallback(() => {
    if (form.practiceHours <= 0) {
      toast.error("연습 시간을 입력하세요.");
      return;
    }
    if (editingId) {
      const ok = updateEntry(editingId, form);
      if (ok) {
        toast.success("다이어리가 수정되었습니다.");
        closeForm();
      } else {
        toast.error("수정에 실패했습니다.");
      }
    } else {
      addEntry(form);
      toast.success("다이어리가 저장되었습니다.");
      closeForm();
    }
  }, [form, editingId, addEntry, updateEntry, closeForm]);

  // 삭제
  const handleDelete = useCallback(
    (id: string) => {
      const ok = deleteEntry(id);
      if (ok) {
        toast.success("다이어리가 삭제되었습니다.");
      } else {
        toast.error("삭제에 실패했습니다.");
      }
    },
    [deleteEntry]
  );

  // 달력 이전/다음 달
  const prevMonth = useCallback(() => {
    if (calMonth === 1) {
      setCalYear((y) => y - 1);
      setCalMonth(12);
    } else {
      setCalMonth((m) => m - 1);
    }
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    if (calMonth === 12) {
      setCalYear((y) => y + 1);
      setCalMonth(1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }, [calMonth]);

  // 선택된 날의 기존 기록
  const selectedEntry = entries.find((e) => e.date === selectedDate);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                댄스 다이어리
              </CardTitle>
              <div className="flex items-center gap-2">
                {stats.totalEntries > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span>{stats.streakDays}일 연속</span>
                    <span className="text-muted-foreground/40">|</span>
                    <span>총 {stats.totalEntries}건</span>
                  </div>
                )}
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                불러오는 중...
              </p>
            ) : (
              <>
                {/* ── 통계 요약 ── */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-lg font-bold text-orange-500">
                      {stats.streakDays}
                    </p>
                    <p className="text-[10px] text-muted-foreground">연속 기록일</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-lg font-bold text-yellow-500">
                      {stats.averageRating.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">평균 별점</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-lg font-bold text-blue-500">
                      {stats.totalPracticeHours}h
                    </p>
                    <p className="text-[10px] text-muted-foreground">총 연습시간</p>
                  </div>
                </div>

                {/* ── 달력 미니뷰 ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      {calYear}년 {calMonth}월
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={prevMonth}
                      >
                        <ChevronDown className="h-3 w-3 rotate-90" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={nextMonth}
                      >
                        <ChevronDown className="h-3 w-3 -rotate-90" />
                      </Button>
                    </div>
                  </div>
                  <MiniCalendar
                    year={calYear}
                    month={calMonth}
                    entries={monthEntries}
                    selectedDate={selectedDate}
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      // 달력에서 날짜 선택 시 폼 자동 열기 해제
                      setFormVisible(false);
                      setEditingId(null);
                    }}
                  />
                </div>

                {/* ── 선택된 날짜 표시 + 신규 버튼 ── */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDateKor(selectedDate)}
                  </p>
                  {!formVisible && !selectedEntry && (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={openNewForm}
                    >
                      <Plus className="h-3 w-3" />
                      기록 추가
                    </Button>
                  )}
                  {!formVisible && selectedEntry && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => openEditForm(selectedEntry)}
                    >
                      <Pencil className="h-3 w-3" />
                      수정
                    </Button>
                  )}
                </div>

                {/* ── 작성 폼 ── */}
                {formVisible && (
                  <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium">
                        {editingId ? "다이어리 수정" : "새 다이어리"}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={closeForm}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* 날짜 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        날짜
                      </label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, date: e.target.value }))
                        }
                        className="h-7 text-xs"
                      />
                    </div>

                    {/* 기분 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        오늘 기분
                      </label>
                      <MoodPicker
                        value={form.mood}
                        onChange={(v) => setForm((f) => ({ ...f, mood: v }))}
                      />
                    </div>

                    {/* 컨디션 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        몸 컨디션
                      </label>
                      <ConditionPicker
                        value={form.condition}
                        onChange={(v) =>
                          setForm((f) => ({ ...f, condition: v }))
                        }
                      />
                    </div>

                    {/* 연습 시간 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        연습 시간 (시간)
                      </label>
                      <Input
                        type="number"
                        min={0.5}
                        max={24}
                        step={0.5}
                        value={form.practiceHours}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            practiceHours: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="h-7 text-xs"
                      />
                    </div>

                    {/* 연습한 곡 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        연습한 곡
                      </label>
                      <TagInput
                        tags={form.songsPracticed}
                        onAdd={(tag) =>
                          setForm((f) => ({
                            ...f,
                            songsPracticed: [...f.songsPracticed, tag],
                          }))
                        }
                        onRemove={(tag) =>
                          setForm((f) => ({
                            ...f,
                            songsPracticed: f.songsPracticed.filter(
                              (t) => t !== tag
                            ),
                          }))
                        }
                        placeholder="곡 이름 입력 후 Enter"
                        colorClass="bg-purple-100 text-purple-700 border-purple-200"
                      />
                    </div>

                    {/* 성과 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                        <Tag className="h-3 w-3 text-green-500" />
                        오늘의 성과
                      </label>
                      <TagInput
                        tags={form.achievements}
                        onAdd={(tag) =>
                          setForm((f) => ({
                            ...f,
                            achievements: [...f.achievements, tag],
                          }))
                        }
                        onRemove={(tag) =>
                          setForm((f) => ({
                            ...f,
                            achievements: f.achievements.filter(
                              (t) => t !== tag
                            ),
                          }))
                        }
                        placeholder="성과 입력 후 Enter"
                        colorClass="bg-green-100 text-green-700 border-green-200"
                      />
                    </div>

                    {/* 어려움 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                        <Tag className="h-3 w-3 text-red-500" />
                        어려웠던 점
                      </label>
                      <TagInput
                        tags={form.struggles}
                        onAdd={(tag) =>
                          setForm((f) => ({
                            ...f,
                            struggles: [...f.struggles, tag],
                          }))
                        }
                        onRemove={(tag) =>
                          setForm((f) => ({
                            ...f,
                            struggles: f.struggles.filter((t) => t !== tag),
                          }))
                        }
                        placeholder="어려웠던 점 입력 후 Enter"
                        colorClass="bg-red-100 text-red-700 border-red-200"
                      />
                    </div>

                    {/* 자유 메모 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        자유 메모
                      </label>
                      <Textarea
                        value={form.notes}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, notes: e.target.value }))
                        }
                        placeholder="오늘의 연습을 자유롭게 기록해보세요..."
                        className="text-xs resize-none min-h-[72px]"
                      />
                    </div>

                    {/* 별점 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        오늘 연습 평점
                      </label>
                      <StarRating
                        value={form.rating}
                        onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
                      />
                    </div>

                    <Button
                      className="w-full h-8 text-xs"
                      onClick={handleSave}
                    >
                      {editingId ? "수정 완료" : "저장"}
                    </Button>
                  </div>
                )}

                {/* ── 기분 분포 차트 ── */}
                {stats.totalEntries > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
                      기분 분포
                    </p>
                    <MoodDistributionChart
                      distribution={stats.moodDistribution}
                      total={stats.totalEntries}
                    />
                  </div>
                )}

                {/* ── 최근 기록 목록 ── */}
                {entries.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">최근 기록</p>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {entries.map((entry) => (
                        <DiaryEntryItem
                          key={entry.id}
                          entry={entry}
                          onDelete={handleDelete}
                          onEdit={openEditForm}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {entries.length === 0 && !formVisible && (
                  <div className="text-center py-6 space-y-2">
                    <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      아직 다이어리 기록이 없습니다.
                    </p>
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={openNewForm}
                    >
                      <Plus className="h-3 w-3" />
                      첫 기록 시작하기
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
