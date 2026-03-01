"use client";

import { useState, useCallback } from "react";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";
import { useMentalWellness } from "@/hooks/use-mental-wellness";
import type { MentalWellnessEntry } from "@/types";
import { formatYearMonthDay, formatMonthDay } from "@/lib/date-utils";

// ============================================================
// 상수
// ============================================================

const MOOD_CONFIG: Record<
  MentalWellnessEntry["overallMood"],
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  great: {
    label: "아주 좋음",
    emoji: "😄",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  good: {
    label: "좋음",
    emoji: "😊",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  okay: {
    label: "보통",
    emoji: "😐",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  low: {
    label: "낮음",
    emoji: "😔",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  struggling: {
    label: "힘듦",
    emoji: "😢",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

const MOOD_KEYS = Object.keys(MOOD_CONFIG) as MentalWellnessEntry["overallMood"][];

const SLIDER_CONFIG = [
  {
    key: "confidence" as const,
    label: "자신감",
    color: "bg-blue-500",
    trackColor: "bg-blue-100",
    textColor: "text-blue-600",
  },
  {
    key: "stress" as const,
    label: "스트레스",
    color: "bg-red-500",
    trackColor: "bg-red-100",
    textColor: "text-red-600",
  },
  {
    key: "motivation" as const,
    label: "동기",
    color: "bg-green-500",
    trackColor: "bg-green-100",
    textColor: "text-green-600",
  },
  {
    key: "anxiety" as const,
    label: "불안",
    color: "bg-purple-500",
    trackColor: "bg-purple-100",
    textColor: "text-purple-600",
  },
];

const PRESET_STRATEGIES = [
  "심호흡",
  "명상",
  "스트레칭",
  "음악 감상",
  "친구와 대화",
  "산책",
  "수면 충분히",
  "운동",
  "독서",
  "휴식",
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

// ============================================================
// 주간 추이 바 차트 (div 기반)
// ============================================================

type WeeklyChartProps = {
  entries: MentalWellnessEntry[];
};

function WeeklyTrendChart({ entries }: WeeklyChartProps) {
  // 최근 7개 기록을 날짜 오름차순 정렬
  const recent = [...entries].slice(0, 7).reverse();

  if (recent.length < 2) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        추이 차트를 보려면 기록이 2개 이상 필요합니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {SLIDER_CONFIG.map((cfg) => {
        return (
          <div key={cfg.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={cn("text-[10px] font-medium", cfg.textColor)}>
                {cfg.label}
              </span>
              <span className={cn("text-[10px]", cfg.textColor)}>
                최근: {recent[recent.length - 1][cfg.key]}
              </span>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {recent.map((e, i) => {
                const val = e[cfg.key]; // 1-10
                const heightPct = (val / 10) * 100;
                return (
                  <div
                    key={e.id}
                    className="flex-1 flex flex-col justify-end group relative"
                    title={`${formatYearMonthDay(e.date)}: ${val}`}
                  >
                    <div
                      className={cn(
                        "rounded-sm transition-all",
                        i === recent.length - 1
                          ? cfg.color
                          : `${cfg.color} opacity-40`
                      )}
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* 날짜 레이블 (첫/마지막만) */}
                    {(i === 0 || i === recent.length - 1) && (
                      <span
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground whitespace-nowrap"
                      >
                        {formatMonthDay(e.date)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 기분 분포 뱃지
// ============================================================

type MoodDistributionProps = {
  distribution: Record<MentalWellnessEntry["overallMood"], number>;
  total: number;
};

function MoodDistributionBar({ distribution, total }: MoodDistributionProps) {
  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">기분 분포</p>
      {/* 비례 바 */}
      <div className="flex rounded-full overflow-hidden h-2">
        {MOOD_KEYS.map((mood) => {
          const count = distribution[mood];
          if (count === 0) return null;
          const cfg = MOOD_CONFIG[mood];
          const pct = (count / total) * 100;
          return (
            <div
              key={mood}
              className={cn(cfg.color.replace("text-", "bg-"), "opacity-70")}
              style={{ width: `${pct}%` }}
              title={`${cfg.label}: ${count}회`}
            />
          );
        })}
      </div>
      {/* 레전드 */}
      <div className="flex flex-wrap gap-1">
        {MOOD_KEYS.map((mood) => {
          const count = distribution[mood];
          if (count === 0) return null;
          const cfg = MOOD_CONFIG[mood];
          return (
            <Badge
              key={mood}
              className={cn(
                "text-[10px] px-1.5 py-0 gap-0.5 border",
                cfg.bg,
                cfg.color,
                cfg.border
              )}
            >
              {cfg.emoji} {cfg.label} {count}회
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 슬라이더 컴포넌트
// ============================================================

type SliderFieldProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  trackColor: string;
  textColor: string;
};

function SliderField({
  label,
  value,
  onChange,
  color,
  trackColor,
  textColor,
}: SliderFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </Label>
        <span className={cn("text-xs font-bold tabular-nums", textColor)}>
          {value} / 10
        </span>
      </div>
      <div className={cn("relative h-2 rounded-full", trackColor)}>
        <div
          className={cn("absolute left-0 top-0 h-2 rounded-full", color)}
          style={{ width: `${(value / 10) * 100}%` }}
        />
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/60">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

// ============================================================
// 대처 전략 태그 선택
// ============================================================

type StrategyPickerProps = {
  selected: string[];
  onChange: (strategies: string[]) => void;
};

function StrategyPicker({ selected, onChange }: StrategyPickerProps) {
  const [custom, setCustom] = useState("");

  const toggle = useCallback(
    (s: string) => {
      if (selected.includes(s)) {
        onChange(selected.filter((x) => x !== s));
      } else {
        onChange([...selected, s]);
      }
    },
    [selected, onChange]
  );

  const addCustom = useCallback(() => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustom("");
  }, [custom, selected, onChange]);

  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
        대처 전략 (선택)
      </Label>
      <div className="flex flex-wrap gap-1">
        {PRESET_STRATEGIES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
              selected.includes(s)
                ? "bg-violet-100 text-violet-700 border-violet-300"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
            )}
          >
            {s}
          </button>
        ))}
      </div>
      {/* 직접 입력 */}
      <div className="flex gap-1">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="직접 입력..."
          className="h-6 text-xs flex-1"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-6 text-[10px] px-2"
          onClick={addCustom}
        >
          추가
        </Button>
      </div>
      {/* 선택된 항목 */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((s) => (
            <Badge
              key={s}
              className="text-[10px] px-1.5 py-0 gap-0.5 bg-violet-100 text-violet-700 border-violet-200"
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                className="ml-0.5 hover:text-violet-900"
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
// 기록 아이템
// ============================================================

type EntryItemProps = {
  entry: MentalWellnessEntry;
  onEdit: (entry: MentalWellnessEntry) => void;
  onDelete: (id: string) => void;
};

function EntryItem({ entry, onEdit, onDelete }: EntryItemProps) {
  const moodCfg = MOOD_CONFIG[entry.overallMood];

  return (
    <div className="rounded-lg border p-2.5 bg-white space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-800">
            {formatYearMonthDay(entry.date)}
          </span>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 border",
              moodCfg.bg,
              moodCfg.color,
              moodCfg.border
            )}
          >
            {moodCfg.emoji} {moodCfg.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {/* 수치 배지 */}
      <div className="flex flex-wrap gap-1">
        {SLIDER_CONFIG.map((cfg) => (
          <Badge
            key={cfg.key}
            className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 border-slate-200"
          >
            {cfg.label} {entry[cfg.key]}
          </Badge>
        ))}
      </div>

      {/* 대처 전략 */}
      {entry.copingStrategies && entry.copingStrategies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.copingStrategies.map((s) => (
            <Badge
              key={s}
              className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-600 border-violet-100"
            >
              {s}
            </Badge>
          ))}
        </div>
      )}

      {/* 일기 메모 */}
      {entry.journalNote && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {entry.journalNote}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 기록 추가/수정 폼 타입
// ============================================================

type EntryForm = {
  date: string;
  confidence: number;
  stress: number;
  motivation: number;
  anxiety: number;
  overallMood: MentalWellnessEntry["overallMood"];
  journalNote: string;
  copingStrategies: string[];
};

function getDefaultForm(): EntryForm {
  return {
    date: getTodayStr(),
    confidence: 5,
    stress: 5,
    motivation: 5,
    anxiety: 5,
    overallMood: "okay",
    journalNote: "",
    copingStrategies: [],
  };
}

function entryToForm(entry: MentalWellnessEntry): EntryForm {
  return {
    date: entry.date,
    confidence: entry.confidence,
    stress: entry.stress,
    motivation: entry.motivation,
    anxiety: entry.anxiety,
    overallMood: entry.overallMood,
    journalNote: entry.journalNote ?? "",
    copingStrategies: entry.copingStrategies ?? [],
  };
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type MentalWellnessCardProps = {
  memberId: string;
};

export function MentalWellnessCard({ memberId }: MentalWellnessCardProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(getDefaultForm());

  const { entries, loading, stats, addEntry, updateEntry, deleteEntry } =
    useMentalWellness(memberId);

  // 다이얼로그 열기 (신규)
  const openAddDialog = useCallback(() => {
    setForm(getDefaultForm());
    setEditingId(null);
    setDialogOpen(true);
  }, []);

  // 다이얼로그 열기 (수정)
  const openEditDialog = useCallback((entry: MentalWellnessEntry) => {
    setForm(entryToForm(entry));
    setEditingId(entry.id);
    setDialogOpen(true);
  }, []);

  // 다이얼로그 닫기
  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
  }, []);

  // 저장
  const handleSave = useCallback(() => {
    if (!form.date) {
      toast.error("날짜를 입력해주세요.");
      return;
    }

    const entryData: Omit<MentalWellnessEntry, "id" | "createdAt"> = {
      date: form.date,
      confidence: form.confidence,
      stress: form.stress,
      motivation: form.motivation,
      anxiety: form.anxiety,
      overallMood: form.overallMood,
      journalNote: form.journalNote.trim() || undefined,
      copingStrategies:
        form.copingStrategies.length > 0 ? form.copingStrategies : undefined,
    };

    if (editingId) {
      const ok = updateEntry(editingId, entryData);
      if (ok) {
        toast.success("심리 상태 기록이 수정되었습니다.");
        closeDialog();
      } else {
        toast.error(TOAST.UPDATE_ERROR);
      }
    } else {
      addEntry(entryData);
      toast.success("오늘의 심리 상태가 저장되었습니다.");
      closeDialog();
    }
  }, [form, editingId, addEntry, updateEntry, closeDialog]);

  // 삭제
  const handleDelete = useCallback(
    (id: string) => {
      const ok = deleteEntry(id);
      if (ok) {
        toast.success("기록이 삭제되었습니다.");
      } else {
        toast.error(TOAST.DELETE_ERROR);
      }
    },
    [deleteEntry]
  );

  // 최근 기록 5개
  const recentEntries = entries.slice(0, 5);

  // 대표 기분 (가장 많은 기분)
  const topMood = (() => {
    if (stats.totalEntries === 0) return null;
    const dist = stats.moodDistribution;
    const max = Math.max(...MOOD_KEYS.map((k) => dist[k]));
    return MOOD_KEYS.find((k) => dist[k] === max) ?? null;
  })();

  return (
    <>
      <Card>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-500" />
                  심리 상태 추적
                </CardTitle>
                <div className="flex items-center gap-2">
                  {stats.totalEntries > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>총 {stats.totalEntries}회</span>
                      {topMood && (
                        <>
                          <span className="text-muted-foreground/40">|</span>
                          <span>
                            {MOOD_CONFIG[topMood].emoji}{" "}
                            {MOOD_CONFIG[topMood].label}
                          </span>
                        </>
                      )}
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
                  {/* 평균 통계 요약 */}
                  {stats.totalEntries > 0 && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {SLIDER_CONFIG.map((cfg) => {
                        const avg =
                          cfg.key === "confidence"
                            ? stats.averageConfidence
                            : cfg.key === "stress"
                              ? stats.averageStress
                              : cfg.key === "motivation"
                                ? stats.averageMotivation
                                : stats.averageAnxiety;
                        return (
                          <div
                            key={cfg.key}
                            className={cn(
                              "rounded-lg p-2 text-center",
                              cfg.trackColor
                            )}
                          >
                            <p
                              className={cn(
                                "text-base font-bold",
                                cfg.textColor
                              )}
                            >
                              {avg ?? "-"}
                            </p>
                            <p
                              className={cn("text-[9px]", cfg.textColor)}
                            >
                              {cfg.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 체크인 추가 버튼 */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      오늘의 심리 상태를 기록하세요
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddDialog();
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      체크인
                    </Button>
                  </div>

                  {/* 주간 추이 차트 */}
                  {entries.length >= 2 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        주간 추이 (최근 7회)
                      </p>
                      <WeeklyTrendChart entries={entries} />
                    </div>
                  )}

                  {/* 기분 분포 */}
                  {stats.totalEntries > 0 && (
                    <MoodDistributionBar
                      distribution={stats.moodDistribution}
                      total={stats.totalEntries}
                    />
                  )}

                  {/* 최근 기록 목록 */}
                  {recentEntries.length === 0 ? (
                    <div className="text-center py-6 space-y-1">
                      <Brain className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        기록된 심리 상태 데이터가 없습니다.
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        상단 &apos;체크인&apos; 버튼으로 첫 기록을 등록하세요.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        최근 기록
                      </p>
                      {recentEntries.map((entry) => (
                        <EntryItem
                          key={entry.id}
                          entry={entry}
                          onEdit={openEditDialog}
                          onDelete={handleDelete}
                        />
                      ))}
                      {entries.length > 5 && (
                        <p className="text-[10px] text-muted-foreground text-center">
                          총 {entries.length}개 기록 중 최근 5개 표시
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 기록 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-500" />
              {editingId ? "심리 상태 수정" : "오늘의 심리 상태 체크인"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 날짜 */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                날짜
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="h-7 text-xs"
              />
            </div>

            {/* 4가지 슬라이더 */}
            {SLIDER_CONFIG.map((cfg) => (
              <SliderField
                key={cfg.key}
                label={cfg.label}
                value={form[cfg.key]}
                onChange={(v) => setForm((f) => ({ ...f, [cfg.key]: v }))}
                color={cfg.color}
                trackColor={cfg.trackColor}
                textColor={cfg.textColor}
              />
            ))}

            {/* 전반적 기분 선택 */}
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                전반적인 기분
              </Label>
              <div className="grid grid-cols-5 gap-1">
                {MOOD_KEYS.map((mood) => {
                  const cfg = MOOD_CONFIG[mood];
                  const selected = form.overallMood === mood;
                  return (
                    <button
                      key={mood}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, overallMood: mood }))
                      }
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg border p-1.5 transition-colors text-center",
                        selected
                          ? cn(cfg.bg, cfg.border, cfg.color)
                          : "border-gray-100 hover:bg-gray-50"
                      )}
                    >
                      <span className="text-base">{cfg.emoji}</span>
                      <span className="text-[8px] leading-tight">
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 대처 전략 */}
            <StrategyPicker
              selected={form.copingStrategies}
              onChange={(strategies) =>
                setForm((f) => ({ ...f, copingStrategies: strategies }))
              }
            />

            {/* 일기 메모 */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                일기 메모 (선택)
              </Label>
              <Textarea
                value={form.journalNote}
                onChange={(e) =>
                  setForm((f) => ({ ...f, journalNote: e.target.value }))
                }
                placeholder="오늘 느낀 점, 연습 후기, 감사한 것들을 자유롭게 적어보세요..."
                className="text-xs resize-none min-h-[72px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={closeDialog}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
            >
              {editingId ? "수정 완료" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
