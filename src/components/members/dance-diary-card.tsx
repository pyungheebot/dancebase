"use client";

import { useState, useCallback } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Flame,
  Tag,
  X,
  BarChart2,
  CalendarDays,
  Pencil,
  TrendingUp,
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
import type { DiaryCardEntry, DiaryCardEmotion, DiaryCardEmotionMeta } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const EMOTION_LIST: DiaryCardEmotionMeta[] = [
  { value: "happy", label: "행복", emoji: "😊", color: "bg-green-400" },
  { value: "neutral", label: "보통", emoji: "😐", color: "bg-yellow-400" },
  { value: "sad", label: "슬픔", emoji: "😢", color: "bg-blue-400" },
  { value: "passionate", label: "열정", emoji: "🔥", color: "bg-orange-400" },
  { value: "frustrated", label: "답답", emoji: "😤", color: "bg-red-400" },
];

const EMOTION_MAP = Object.fromEntries(
  EMOTION_LIST.map((e) => [e.value, e])
) as Record<DiaryCardEmotion, DiaryCardEmotionMeta>;

const CONDITION_LABELS = ["", "매우나쁨", "나쁨", "보통", "좋음", "최상"];
const CONDITION_COLORS = [
  "",
  "bg-red-400",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-400",
  "bg-emerald-500",
];

// ─── 날짜 유틸 ────────────────────────────────────────────────────────────────

function getTodayStr(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

// ─── 서브 컴포넌트: 감정 선택 ─────────────────────────────────────────────────

function EmotionPicker({
  value,
  onChange,
}: {
  value: DiaryCardEmotion;
  onChange: (v: DiaryCardEmotion) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {EMOTION_LIST.map((em) => (
        <button
          key={em.value}
          type="button"
          onClick={() => onChange(em.value)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 border text-center transition-all hover:scale-105",
            value === em.value
              ? "ring-2 ring-offset-1 border-transparent bg-muted ring-primary/60"
              : "border-border bg-background"
          )}
        >
          <span className="text-lg leading-none">{em.emoji}</span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
            {em.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── 서브 컴포넌트: 컨디션 슬라이더 ─────────────────────────────────────────

function ConditionSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 border text-center transition-all hover:scale-105 flex-1 mx-0.5",
              value === v
                ? "ring-2 ring-primary/60 border-transparent bg-muted"
                : "border-border bg-background"
            )}
          >
            <span className="text-xs font-bold leading-none">{v}</span>
            <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
              {CONDITION_LABELS[v]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: 태그 입력 ─────────────────────────────────────────────────

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setInput("");
      return;
    }
    onAdd(trimmed);
    setInput("");
  };

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
              variant="secondary"
              className="text-[10px] px-1.5 py-0 gap-0.5"
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

// ─── 서브 컴포넌트: 캘린더 히트맵 ───────────────────────────────────────────

function CalendarHeatmap({
  year,
  month,
  heatmap,
  entries,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  heatmap: Record<string, boolean>;
  entries: DiaryCardEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const today = getTodayStr();

  // 날짜별 감정 맵
  const emotionMap = new Map<string, DiaryCardEmotion>();
  for (const e of entries) {
    if (e.date.startsWith(`${year}-${String(month).padStart(2, "0")}`)) {
      emotionMap.set(e.date, e.emotion);
    }
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
          const hasEntry = heatmap[dateStr];
          const emotion = emotionMap.get(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "aspect-square rounded flex items-center justify-center text-[10px] relative transition-all hover:bg-muted",
                isSelected && "ring-2 ring-primary",
                isToday && !isSelected && "font-bold text-primary"
              )}
            >
              {hasEntry && emotion && (
                <span
                  className={cn(
                    "absolute inset-0.5 rounded opacity-25",
                    EMOTION_MAP[emotion].color
                  )}
                />
              )}
              {hasEntry && !emotion && (
                <span className="absolute inset-0.5 rounded opacity-20 bg-indigo-400" />
              )}
              <span className="relative z-10">{day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: 감정 통계 바 차트 ───────────────────────────────────────

function EmotionBarChart({
  stats,
  total,
}: {
  stats: Record<DiaryCardEmotion, number>;
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
      {EMOTION_LIST.map((em) => {
        const count = stats[em.value];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={em.value} className="flex items-center gap-2">
            <span className="text-sm w-5">{em.emoji}</span>
            <span className="text-[10px] text-muted-foreground w-8">
              {em.label}
            </span>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", em.color)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-12 text-right">
              {count}회 ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 서브 컴포넌트: 평균 컨디션 추이 라인 차트 ─────────────────────────────

function ConditionTrendChart({
  trend,
}: {
  trend: { date: string; avg: number }[];
}) {
  const hasData = trend.some((t) => t.avg > 0);
  if (!hasData) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        최근 30일 컨디션 데이터가 없습니다.
      </p>
    );
  }

  const maxVal = 5;
  const chartHeight = 60;

  // 실제 데이터가 있는 포인트만 연결선 표시
  const points = trend.map((t, i) => ({
    x: (i / (trend.length - 1)) * 100,
    y: t.avg > 0 ? ((maxVal - t.avg) / maxVal) * chartHeight : null,
    avg: t.avg,
    date: t.date,
  }));

  // SVG 폴리라인 포인트 계산 (데이터 있는 것만)
  const linePoints = points
    .filter((p) => p.y !== null)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <div className="relative" style={{ height: chartHeight + 20 }}>
      {/* Y축 레이블 */}
      <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between">
        {[5, 3, 1].map((v) => (
          <span key={v} className="text-[9px] text-muted-foreground">
            {v}
          </span>
        ))}
      </div>
      {/* 차트 영역 */}
      <div className="ml-5 mr-1">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* 가이드라인 */}
          {[1, 2, 3, 4, 5].map((v) => {
            const y = ((maxVal - v) / maxVal) * chartHeight;
            return (
              <line
                key={v}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth="0.5"
                className="text-foreground"
              />
            );
          })}
          {/* 추이 선 */}
          {linePoints && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {/* 데이터 포인트 */}
          {points
            .filter((p) => p.y !== null)
            .map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y!}
                r="1.5"
                fill="hsl(var(--primary))"
                vectorEffect="non-scaling-stroke"
              />
            ))}
        </svg>
        {/* X축: 시작/끝 날짜 */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">
            {trend[0]?.date.slice(5)}
          </span>
          <span className="text-[9px] text-muted-foreground">
            {trend[trend.length - 1]?.date.slice(5)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: 일기 항목 카드 ─────────────────────────────────────────

function DiaryEntryItem({
  entry,
  onDelete,
  onEdit,
}: {
  entry: DiaryCardEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: DiaryCardEntry) => void;
}) {
  const em = EMOTION_MAP[entry.emotion];
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base shrink-0">{em.emoji}</span>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">
              {entry.title || formatYearMonthDay(entry.date)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatYearMonthDay(entry.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* 컨디션 배지 */}
          <div
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] text-white font-medium",
              CONDITION_COLORS[entry.condition]
            )}
          >
            {CONDITION_LABELS[entry.condition]}
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

      {/* 내용 */}
      {entry.content && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {entry.content}
        </p>
      )}

      {/* 오늘의 발견 */}
      {entry.discovery && (
        <div className="flex items-start gap-1.5 text-xs rounded bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1.5">
          <span className="text-indigo-500 shrink-0 mt-0.5">💡</span>
          <span className="text-indigo-700 dark:text-indigo-300 text-[11px] leading-relaxed">
            {entry.discovery}
          </span>
        </div>
      )}

      {/* 태그 */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 폼 초기값 ────────────────────────────────────────────────────────────────

type DiaryForm = {
  date: string;
  title: string;
  content: string;
  emotion: DiaryCardEmotion;
  condition: number;
  discovery: string;
  tags: string[];
};

function getDefaultForm(date: string): DiaryForm {
  return {
    date,
    title: "",
    content: "",
    emotion: "happy",
    condition: 3,
    discovery: "",
    tags: [],
  };
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function DanceDiaryCard({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(false);
  const today = getTodayStr();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DiaryForm>(getDefaultForm(today));
  const [activeTab, setActiveTab] = useState<"list" | "stats">("list");

  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getMonthHeatmap,
    getEmotionStats,
    getConditionTrend,
    getStreak,
  } = useDanceDiary(memberId);

  const heatmap = getMonthHeatmap(calYear, calMonth);
  const emotionStats = getEmotionStats();
  const conditionTrend = getConditionTrend();
  const streak = getStreak();

  const monthEntries = entries.filter((e) =>
    e.date.startsWith(
      `${calYear}-${String(calMonth).padStart(2, "0")}`
    )
  );

  // 폼 열기 (신규)
  const openNewForm = useCallback(() => {
    setForm(getDefaultForm(selectedDate));
    setEditingId(null);
    setFormVisible(true);
  }, [selectedDate]);

  // 폼 열기 (수정)
  const openEditForm = useCallback((entry: DiaryCardEntry) => {
    setForm({
      date: entry.date,
      title: entry.title,
      content: entry.content,
      emotion: entry.emotion,
      condition: entry.condition,
      discovery: entry.discovery,
      tags: [...entry.tags],
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
    if (!form.date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    if (!form.title.trim() && !form.content.trim()) {
      toast.error("제목 또는 내용을 입력해주세요.");
      return;
    }
    if (editingId) {
      updateEntry(editingId, form);
      toast.success("일기가 수정되었습니다.");
    } else {
      addEntry(form);
      toast.success("일기가 저장되었습니다.");
    }
    closeForm();
  }, [form, editingId, addEntry, updateEntry, closeForm]);

  // 삭제
  const handleDelete = useCallback(
    (id: string) => {
      deleteEntry(id);
      toast.success("일기가 삭제되었습니다.");
    },
    [deleteEntry]
  );

  // 이전/다음 달
  function prevMonth() {
    if (calMonth === 1) {
      setCalYear((y) => y - 1);
      setCalMonth(12);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 12) {
      setCalYear((y) => y + 1);
      setCalMonth(1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  const selectedEntry = entries.find((e) => e.date === selectedDate);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                댄스 일기
              </CardTitle>
              <div className="flex items-center gap-2">
                {entries.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span>{streak}일 연속</span>
                    <span className="text-muted-foreground/40">|</span>
                    <span>총 {entries.length}건</span>
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
                {/* ── 통계 요약 배지 ── */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-lg font-bold text-orange-500">{streak}</p>
                    <p className="text-[10px] text-muted-foreground">연속 작성</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-lg font-bold text-indigo-500">
                      {entries.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">총 일기</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-lg font-bold text-green-500">
                      {entries.length > 0
                        ? (
                            entries.reduce((s, e) => s + e.condition, 0) /
                            entries.length
                          ).toFixed(1)
                        : "-"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">평균 컨디션</p>
                  </div>
                </div>

                {/* ── 캘린더 히트맵 ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      {calYear}년 {calMonth}월
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({monthEntries.length}건)
                      </span>
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
                  <CalendarHeatmap
                    year={calYear}
                    month={calMonth}
                    heatmap={heatmap}
                    entries={monthEntries}
                    selectedDate={selectedDate}
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      setFormVisible(false);
                      setEditingId(null);
                    }}
                  />
                </div>

                {/* ── 선택 날짜 + 버튼 ── */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatYearMonthDay(selectedDate)}
                  </p>
                  {!formVisible && !selectedEntry && (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={openNewForm}
                    >
                      <Plus className="h-3 w-3" />
                      일기 쓰기
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

                {/* ── 작성/수정 폼 ── */}
                {formVisible && (
                  <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">
                        {editingId ? "일기 수정" : "새 일기"}
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

                    {/* 제목 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        제목
                      </label>
                      <Input
                        value={form.title}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, title: e.target.value }))
                        }
                        placeholder="오늘의 연습 한 줄 요약"
                        className="h-7 text-xs"
                      />
                    </div>

                    {/* 내용 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        내용
                      </label>
                      <Textarea
                        value={form.content}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, content: e.target.value }))
                        }
                        placeholder="오늘의 연습을 자유롭게 기록해보세요..."
                        className="text-xs resize-none min-h-[72px]"
                      />
                    </div>

                    {/* 감정 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        오늘 감정
                      </label>
                      <EmotionPicker
                        value={form.emotion}
                        onChange={(v) => setForm((f) => ({ ...f, emotion: v }))}
                      />
                    </div>

                    {/* 컨디션 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        컨디션
                      </label>
                      <ConditionSlider
                        value={form.condition}
                        onChange={(v) =>
                          setForm((f) => ({ ...f, condition: v }))
                        }
                      />
                    </div>

                    {/* 오늘의 발견 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                        <span>💡</span>
                        오늘의 발견
                      </label>
                      <Input
                        value={form.discovery}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, discovery: e.target.value }))
                        }
                        placeholder="새롭게 깨달은 점이나 발견을 짧게..."
                        className="h-7 text-xs"
                      />
                    </div>

                    {/* 태그 */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        태그
                      </label>
                      <TagInput
                        tags={form.tags}
                        onAdd={(tag) =>
                          setForm((f) => ({ ...f, tags: [...f.tags, tag] }))
                        }
                        onRemove={(tag) =>
                          setForm((f) => ({
                            ...f,
                            tags: f.tags.filter((t) => t !== tag),
                          }))
                        }
                        placeholder="태그 입력 후 Enter (예: 웨이킹, 턴, 커버댄스)"
                      />
                    </div>

                    <Button className="w-full h-8 text-xs" onClick={handleSave}>
                      {editingId ? "수정 완료" : "저장"}
                    </Button>
                  </div>
                )}

                {/* ── 탭 전환: 목록 / 통계 ── */}
                {entries.length > 0 && (
                  <>
                    <div className="flex gap-1 border-b">
                      <button
                        type="button"
                        onClick={() => setActiveTab("list")}
                        className={cn(
                          "text-xs pb-1.5 px-1 border-b-2 transition-colors",
                          activeTab === "list"
                            ? "border-primary text-primary font-medium"
                            : "border-transparent text-muted-foreground"
                        )}
                      >
                        최근 기록
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("stats")}
                        className={cn(
                          "text-xs pb-1.5 px-1 border-b-2 transition-colors",
                          activeTab === "stats"
                            ? "border-primary text-primary font-medium"
                            : "border-transparent text-muted-foreground"
                        )}
                      >
                        감정/컨디션 통계
                      </button>
                    </div>

                    {/* 목록 탭 */}
                    {activeTab === "list" && (
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
                    )}

                    {/* 통계 탭 */}
                    {activeTab === "stats" && (
                      <div className="space-y-4">
                        {/* 감정 분포 */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium flex items-center gap-1.5">
                            <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
                            감정별 비율
                          </p>
                          <EmotionBarChart
                            stats={emotionStats}
                            total={entries.length}
                          />
                        </div>

                        {/* 컨디션 추이 */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                            최근 30일 평균 컨디션
                          </p>
                          <ConditionTrendChart trend={conditionTrend} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── 빈 상태 ── */}
                {entries.length === 0 && !formVisible && (
                  <div className="text-center py-6 space-y-2">
                    <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      아직 작성된 댄스 일기가 없습니다.
                    </p>
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={openNewForm}
                    >
                      <Plus className="h-3 w-3" />
                      첫 일기 쓰기
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
