"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Clock,
  Calendar,
  TrendingUp,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  usePracticeIntensity,
  getIntensityColor,
  getIntensityLabel,
} from "@/hooks/use-practice-intensity";
import { IntensityLevel, PracticeIntensityEntry, WeeklyIntensitySummary } from "@/types";

// ── 상수 ─────────────────────────────────────────────────────────────────────

const BODY_PART_OPTIONS = ["전신", "다리", "팔", "코어", "어깨", "허리", "목"];

const INTENSITY_LEVELS: IntensityLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ── 날짜 포맷 유틸 ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${parseInt(month)}/${parseInt(day)}`;
}

function formatWeekLabel(weekStart: string): string {
  const [, month, day] = weekStart.split("-");
  return `${parseInt(month)}/${parseInt(day)}주`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

// ── 서브 컴포넌트: 강도 선택 버튼 그리드 ─────────────────────────────────────

function IntensityGrid({
  selected,
  onSelect,
}: {
  selected: IntensityLevel | null;
  onSelect: (level: IntensityLevel) => void;
}) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {INTENSITY_LEVELS.map((level) => {
        const color = getIntensityColor(level);
        const isSelected = selected === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onSelect(level)}
            className={cn(
              "flex flex-col items-center justify-center rounded-md py-1.5 text-xs font-semibold transition-all border",
              isSelected
                ? cn(color.bg, color.text, "border-current scale-110 shadow-sm")
                : "border-border hover:bg-muted text-muted-foreground"
            )}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}

// ── 서브 컴포넌트: 강도 원형 배지 ────────────────────────────────────────────

function IntensityBadge({ intensity }: { intensity: IntensityLevel }) {
  const color = getIntensityColor(intensity);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0",
        color.bg,
        color.text
      )}
    >
      {intensity}
    </span>
  );
}

// ── 서브 컴포넌트: 최근 기록 리스트 ──────────────────────────────────────────

function RecentEntryList({
  entries,
  onRemove,
}: {
  entries: PracticeIntensityEntry[];
  onRemove: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        아직 기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/30"
        >
          <IntensityBadge intensity={entry.intensity} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium">
                {formatDate(entry.date)}
              </span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0 rounded-full",
                  getIntensityColor(entry.intensity).bg,
                  getIntensityColor(entry.intensity).text
                )}
              >
                {getIntensityLabel(entry.intensity)}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatMinutes(entry.durationMinutes)}
              </span>
              {entry.bodyParts.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {entry.bodyParts.join(" · ")}
                </span>
              )}
            </div>
            {entry.note && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {entry.note}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
            aria-label="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── 서브 컴포넌트: 주간 트렌드 바 차트 ───────────────────────────────────────

function WeeklyTrendChart({
  summaries,
}: {
  summaries: WeeklyIntensitySummary[];
}) {
  const maxIntensity = 10;

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1.5 h-20">
        {summaries.map((s) => {
          const heightPct = s.avgIntensity > 0 ? (s.avgIntensity / maxIntensity) * 100 : 0;
          const color =
            s.avgIntensity === 0
              ? "bg-muted"
              : s.avgIntensity <= 3
              ? "bg-green-400"
              : s.avgIntensity <= 6
              ? "bg-yellow-400"
              : s.avgIntensity <= 8
              ? "bg-orange-400"
              : "bg-red-400";

          return (
            <div
              key={s.weekStart}
              className="flex-1 flex flex-col items-center gap-0.5"
              title={
                s.sessionCount > 0
                  ? `평균 강도 ${s.avgIntensity} · ${s.sessionCount}회 · ${formatMinutes(s.totalMinutes)}`
                  : "기록 없음"
              }
            >
              <span className="text-[9px] text-muted-foreground">
                {s.avgIntensity > 0 ? s.avgIntensity : ""}
              </span>
              <div className="w-full flex items-end" style={{ height: "56px" }}>
                <div
                  className={cn("w-full rounded-t-sm transition-all", color)}
                  style={{ height: `${heightPct}%`, minHeight: s.sessionCount > 0 ? "4px" : "0px" }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {summaries.map((s) => (
          <div key={s.weekStart} className="flex-1 text-center">
            <span className="text-[9px] text-muted-foreground">
              {formatWeekLabel(s.weekStart)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

interface PracticeIntensityCardProps {
  groupId: string;
  userId: string;
}

export function PracticeIntensityCard({
  groupId,
  userId,
}: PracticeIntensityCardProps) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 폼 상태
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [intensity, setIntensity] = useState<IntensityLevel | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    getRecentEntries,
    getWeeklySummaries,
    getSummaryStats,
    addEntry,
    removeEntry,
  } = usePracticeIntensity(groupId, userId);

  const recent = getRecentEntries(30);
  const weeklySummaries = getWeeklySummaries(4);
  const stats = getSummaryStats();

  function resetForm() {
    setDate(new Date().toISOString().slice(0, 10));
    setIntensity(null);
    setDurationMinutes("");
    setSelectedBodyParts([]);
    setNote("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setShowForm(false);
      resetForm();
    }
  }

  function toggleBodyPart(part: string) {
    setSelectedBodyParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  }

  async function handleSave() {
    if (!intensity) {
      toast.error("강도를 선택해주세요.");
      return;
    }
    const duration = parseInt(durationMinutes, 10);
    if (!durationMinutes || isNaN(duration) || duration <= 0) {
      toast.error("연습 시간을 올바르게 입력해주세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }

    setSaving(true);
    try {
      addEntry({
        date,
        intensity,
        durationMinutes: duration,
        bodyParts: selectedBodyParts,
        note: note.trim(),
      });
      toast.success("연습 강도가 저장되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function handleRemove(id: string) {
    removeEntry(id);
    toast.success("기록이 삭제되었습니다.");
  }

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">연습 강도 추적</span>
              {stats.sessionCount > 0 && (
                <span className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 rounded-full">
                  최근 30일 {stats.sessionCount}회
                </span>
              )}
              {stats.sessionCount === 0 && (
                <span className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 rounded-full">
                  미기록
                </span>
              )}
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t pt-3">
            {/* 통계 요약 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-muted/40 px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="text-[10px] text-muted-foreground">평균 강도</span>
                </div>
                <span className="text-sm font-bold">
                  {stats.avgIntensity > 0 ? stats.avgIntensity : "-"}
                </span>
              </div>
              <div className="rounded-md bg-muted/40 px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span className="text-[10px] text-muted-foreground">총 시간</span>
                </div>
                <span className="text-sm font-bold">
                  {stats.totalMinutes > 0 ? formatMinutes(stats.totalMinutes) : "-"}
                </span>
              </div>
              <div className="rounded-md bg-muted/40 px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Calendar className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] text-muted-foreground">세션 수</span>
                </div>
                <span className="text-sm font-bold">{stats.sessionCount}</span>
              </div>
            </div>

            {/* 기록 추가 토글 버튼 */}
            {!showForm && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs gap-1"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-3 w-3" />
                연습 강도 기록하기
              </Button>
            )}

            {/* 입력 폼 */}
            {showForm && (
              <div className="space-y-3 rounded-md border p-3 bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground">
                  새 기록 추가
                </p>

                {/* 날짜 */}
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">날짜</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-7 text-xs"
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>

                {/* 강도 슬라이더 (버튼 그리드) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-muted-foreground">
                      RPE 강도 (1~10)
                    </label>
                    {intensity && (
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0 rounded-full font-medium",
                          getIntensityColor(intensity).bg,
                          getIntensityColor(intensity).text
                        )}
                      >
                        {intensity} · {getIntensityLabel(intensity)}
                      </span>
                    )}
                  </div>
                  <IntensityGrid selected={intensity} onSelect={setIntensity} />
                  <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
                    <span>가벼움</span>
                    <span>보통</span>
                    <span>강함</span>
                    <span>최고</span>
                  </div>
                </div>

                {/* 연습 시간 */}
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">
                    연습 시간 (분)
                  </label>
                  <Input
                    type="number"
                    placeholder="예) 90"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    min={1}
                    max={480}
                    className="h-7 text-xs"
                  />
                </div>

                {/* 부위 선택 */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground">
                    주요 부위 (선택)
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {BODY_PART_OPTIONS.map((part) => {
                      const isSelected = selectedBodyParts.includes(part);
                      return (
                        <button
                          key={part}
                          type="button"
                          onClick={() => toggleBodyPart(part)}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {part}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 메모 */}
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">
                    메모 (선택)
                  </label>
                  <Input
                    placeholder="오늘 연습 어땠나요?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={100}
                    className="h-7 text-xs"
                  />
                </div>

                {/* 저장/취소 버튼 */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={handleSave}
                    disabled={saving || !intensity}
                  >
                    {saving ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    disabled={saving}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}

            {/* 구분선 */}
            <div className="border-t pt-3 space-y-4">
              {/* 주간 트렌드 */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    주간 트렌드 (최근 4주)
                  </p>
                </div>
                <WeeklyTrendChart summaries={weeklySummaries} />
                {/* 범례 */}
                <div className="flex gap-3 justify-center flex-wrap">
                  {[
                    { label: "가벼움 (1-3)", color: "bg-green-400" },
                    { label: "보통 (4-6)", color: "bg-yellow-400" },
                    { label: "강함 (7-8)", color: "bg-orange-400" },
                    { label: "최고 (9-10)", color: "bg-red-400" },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1">
                      <span className={cn("w-2 h-2 rounded-sm", color)} />
                      <span className="text-[9px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 최근 기록 */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    최근 기록 (최근 30일)
                  </p>
                </div>
                <RecentEntryList entries={recent} onRemove={handleRemove} />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
