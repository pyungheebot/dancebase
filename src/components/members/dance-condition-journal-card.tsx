"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Activity,
  Plus,
  Trash2,
  Pencil,
  Star,
  Moon,
  Clock,
  TrendingUp,
  CalendarDays,
  BarChart2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useDanceConditionLog,
  MOOD_LABELS,
  MOOD_EMOJI,
  MOOD_COLOR,
  MOOD_LIST,
  BODY_PART_OPTIONS,
} from "@/hooks/use-dance-condition-log";
import type {
  DanceConditionJournalEntry,
  DanceConditionMood,
} from "@/types";

// ============================================================
// 에너지 레벨 별 표시
// ============================================================

function EnergyStars({
  level,
  onChange,
  readonly = false,
}: {
  level: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={
            readonly
              ? "cursor-default"
              : "cursor-pointer hover:scale-110 transition-transform"
          }
          aria-label={`에너지 ${n}점`}
        >
          <Star
            className={`h-4 w-4 ${
              n <= level
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 기분 선택
// ============================================================

function MoodSelector({
  value,
  onChange,
}: {
  value: DanceConditionMood;
  onChange: (v: DanceConditionMood) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {MOOD_LIST.map((mood) => (
        <button
          key={mood}
          type="button"
          onClick={() => onChange(mood)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            value === mood
              ? MOOD_COLOR[mood] + " ring-2 ring-offset-1 ring-current"
              : "border-border text-muted-foreground hover:border-primary"
          }`}
        >
          <span className="text-lg leading-none">{MOOD_EMOJI[mood]}</span>
          <span>{MOOD_LABELS[mood]}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 통증 부위 태그 선택
// ============================================================

function BodyPartTags({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (parts: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {BODY_PART_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors ${
            selected.includes(opt.value)
              ? "bg-red-100 border-red-300 text-red-700"
              : "bg-muted border-border text-muted-foreground hover:border-primary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 주간 에너지 막대 차트 (CSS div 기반, 외부 라이브러리 없음)
// ============================================================

function WeeklyEnergyChart({
  data,
}: {
  data: { label: string; weekStart: string; avgEnergy: number; count: number }[];
}) {
  const MAX_ENERGY = 5;

  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-2 h-24">
        {data.map((item) => {
          const heightPct =
            item.avgEnergy > 0
              ? Math.max(8, (item.avgEnergy / MAX_ENERGY) * 100)
              : 0;
          const barColor =
            item.avgEnergy >= 4
              ? "bg-yellow-400"
              : item.avgEnergy >= 3
              ? "bg-green-400"
              : item.avgEnergy >= 2
              ? "bg-blue-400"
              : item.avgEnergy > 0
              ? "bg-orange-400"
              : "bg-muted";

          return (
            <div
              key={item.weekStart}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-[9px] text-muted-foreground font-medium h-4 flex items-center">
                {item.avgEnergy > 0 ? item.avgEnergy.toFixed(1) : "-"}
              </span>
              <div className="w-full flex items-end justify-center h-16">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t transition-all ${barColor}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {data.map((item) => (
          <div
            key={item.weekStart}
            className="flex-1 text-center text-[9px] text-muted-foreground leading-tight"
          >
            {item.label}
            {item.count > 0 && (
              <span className="opacity-60"> ({item.count})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 기분 분포 파이 차트 (CSS div 기반, 외부 라이브러리 없음)
// ============================================================

const MOOD_BAR_COLOR: Record<DanceConditionMood, string> = {
  great: "bg-yellow-400",
  good: "bg-green-400",
  neutral: "bg-blue-400",
  tired: "bg-purple-400",
  bad: "bg-red-400",
};

function MoodDistributionChart({
  distribution,
  total,
}: {
  distribution: Record<DanceConditionMood, number>;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="text-center text-xs text-muted-foreground py-4">
        기록 없음
      </div>
    );
  }

  const moods = MOOD_LIST.filter((m) => distribution[m] > 0);

  return (
    <div className="space-y-1.5">
      {moods.map((mood) => {
        const count = distribution[mood];
        const pct = Math.round((count / total) * 100);
        return (
          <div key={mood} className="flex items-center gap-2">
            <span className="text-sm w-5 text-center leading-none">
              {MOOD_EMOJI[mood]}
            </span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${MOOD_BAR_COLOR[mood]} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-8 text-right">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 기록 폼 (추가/수정 공용 다이얼로그)
// ============================================================

type EntryFormData = {
  date: string;
  energyLevel: number;
  mood: DanceConditionMood;
  bodyParts: string[];
  sleepHours: string;
  practiceMinutes: string;
  notes: string;
};

function makeDefaultForm(): EntryFormData {
  return {
    date: new Date().toISOString().slice(0, 10),
    energyLevel: 3,
    mood: "neutral",
    bodyParts: [],
    sleepHours: "",
    practiceMinutes: "",
    notes: "",
  };
}

function EntryFormDialog({
  trigger,
  initialData,
  onSubmit,
  title,
}: {
  trigger: React.ReactNode;
  initialData?: EntryFormData;
  onSubmit: (data: EntryFormData) => void;
  title: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EntryFormData>(makeDefaultForm);

  const handleOpenChange = (v: boolean) => {
    if (v) setForm(initialData ?? makeDefaultForm());
    setOpen(v);
  };

  const handleSubmit = () => {
    if (!form.date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    onSubmit(form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 날짜 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">날짜</Label>
            <Input
              type="date"
              value={form.date}
              max={today}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          {/* 에너지 레벨 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              에너지 레벨 ({form.energyLevel} / 5)
            </Label>
            <EnergyStars
              level={form.energyLevel}
              onChange={(v) => setForm({ ...form, energyLevel: v })}
            />
          </div>

          {/* 기분 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">오늘의 기분</Label>
            <MoodSelector
              value={form.mood}
              onChange={(v) => setForm({ ...form, mood: v })}
            />
          </div>

          {/* 통증 부위 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              통증 부위 (해당 없으면 선택 안 함)
            </Label>
            <BodyPartTags
              selected={form.bodyParts}
              onChange={(parts) => setForm({ ...form, bodyParts: parts })}
            />
          </div>

          {/* 수면 / 연습 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Moon className="h-3 w-3" />
                수면 시간 (시간)
              </Label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                placeholder="예: 7.5"
                value={form.sleepHours}
                onChange={(e) =>
                  setForm({ ...form, sleepHours: e.target.value })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                연습 시간 (분)
              </Label>
              <Input
                type="number"
                min="0"
                step="10"
                placeholder="예: 90"
                value={form.practiceMinutes}
                onChange={(e) =>
                  setForm({ ...form, practiceMinutes: e.target.value })
                }
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">메모</Label>
            <Textarea
              placeholder="오늘의 컨디션을 자유롭게 기록하세요..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-7 text-xs"
          >
            취소
          </Button>
          <Button size="sm" onClick={handleSubmit} className="h-7 text-xs">
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 기록 아이템
// ============================================================

function EntryItem({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: DanceConditionJournalEntry;
  onUpdate: (
    id: string,
    patch: Partial<Omit<DanceConditionJournalEntry, "id" | "createdAt">>
  ) => void;
  onDelete: (id: string) => void;
}) {
  const handleUpdate = (data: EntryFormData) => {
    onUpdate(entry.id, {
      date: data.date,
      energyLevel: data.energyLevel,
      mood: data.mood,
      bodyParts: data.bodyParts,
      sleepHours: data.sleepHours !== "" ? Number(data.sleepHours) : null,
      practiceMinutes:
        data.practiceMinutes !== "" ? Number(data.practiceMinutes) : null,
      notes: data.notes,
    });
    toast.success("기록이 수정되었습니다.");
  };

  const handleDelete = () => {
    onDelete(entry.id);
    toast.success("기록이 삭제되었습니다.");
  };

  return (
    <div className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      {/* 날짜 */}
      <div className="text-center min-w-[40px]">
        <div className="text-[10px] text-muted-foreground">
          {entry.date.slice(5, 7)}월
        </div>
        <div className="text-sm font-bold leading-none">
          {entry.date.slice(8, 10)}일
        </div>
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <EnergyStars level={entry.energyLevel} readonly />
          <span className="text-xs">
            {MOOD_EMOJI[entry.mood]}{" "}
            <span className="text-muted-foreground">
              {MOOD_LABELS[entry.mood]}
            </span>
          </span>
          {entry.sleepHours !== null && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Moon className="h-3 w-3" />
              {entry.sleepHours}h
            </span>
          )}
          {entry.practiceMinutes !== null && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {entry.practiceMinutes}분
            </span>
          )}
        </div>
        {entry.bodyParts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.bodyParts.map((part) => (
              <Badge
                key={part}
                variant="outline"
                className="text-[9px] px-1 py-0 border-red-200 text-red-600 bg-red-50"
              >
                {BODY_PART_OPTIONS.find((o) => o.value === part)?.label ?? part}
              </Badge>
            ))}
          </div>
        )}
        {entry.notes && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">
            {entry.notes}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-1 shrink-0">
        <EntryFormDialog
          title="기록 수정"
          initialData={{
            date: entry.date,
            energyLevel: entry.energyLevel,
            mood: entry.mood,
            bodyParts: entry.bodyParts,
            sleepHours:
              entry.sleepHours !== null ? String(entry.sleepHours) : "",
            practiceMinutes:
              entry.practiceMinutes !== null
                ? String(entry.practiceMinutes)
                : "",
            notes: entry.notes,
          }}
          onSubmit={handleUpdate}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              aria-label="일지 수정"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          aria-label="일지 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트: DanceConditionJournalCard
// ============================================================

export function DanceConditionJournalCard({ memberId }: { memberId: string }) {
  const {
    entries,
    todayEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    getStats,
  } = useDanceConditionLog(memberId);

  const stats = getStats();

  const handleAdd = (data: EntryFormData) => {
    addEntry({
      date: data.date,
      energyLevel: data.energyLevel,
      mood: data.mood,
      bodyParts: data.bodyParts,
      sleepHours: data.sleepHours !== "" ? Number(data.sleepHours) : null,
      practiceMinutes:
        data.practiceMinutes !== "" ? Number(data.practiceMinutes) : null,
      notes: data.notes,
    });
    toast.success("컨디션 기록이 추가되었습니다.");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-primary" />
            댄스 컨디션 일지
          </CardTitle>
          <EntryFormDialog
            title="컨디션 기록 추가"
            onSubmit={handleAdd}
            trigger={
              <Button size="sm" className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" />
                기록 추가
              </Button>
            }
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 오늘 컨디션 요약 */}
        {todayEntry ? (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <CalendarDays className="h-3.5 w-3.5" />
              오늘의 컨디션
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <EnergyStars level={todayEntry.energyLevel} readonly />
              <span className="text-sm">
                {MOOD_EMOJI[todayEntry.mood]}{" "}
                <span className="text-xs text-muted-foreground">
                  {MOOD_LABELS[todayEntry.mood]}
                </span>
              </span>
              {todayEntry.sleepHours !== null && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Moon className="h-3 w-3" />
                  {todayEntry.sleepHours}h 수면
                </span>
              )}
              {todayEntry.practiceMinutes !== null && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {todayEntry.practiceMinutes}분 연습
                </span>
              )}
            </div>
            {todayEntry.bodyParts.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                {todayEntry.bodyParts.map((part) => (
                  <Badge
                    key={part}
                    className="text-[9px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200"
                  >
                    {BODY_PART_OPTIONS.find((o) => o.value === part)?.label ??
                      part}
                  </Badge>
                ))}
              </div>
            )}
            {todayEntry.notes && (
              <p className="text-[11px] text-muted-foreground">
                {todayEntry.notes}
              </p>
            )}
          </div>
        ) : (
          /* 빈 상태 처리 */
          <div className="rounded-lg border border-dashed p-4 text-center space-y-2">
            <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                오늘의 컨디션을 아직 기록하지 않았습니다.
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                매일 기록하면 트렌드를 분석할 수 있습니다.
              </p>
            </div>
            <EntryFormDialog
              title="오늘 컨디션 기록"
              onSubmit={handleAdd}
              trigger={
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" />
                  지금 기록하기
                </Button>
              }
            />
          </div>
        )}

        {entries.length > 0 && (
          <>
            {/* 통계 요약 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/50 p-2.5 space-y-0.5">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  평균 에너지
                </div>
                <div className="text-sm font-bold">
                  {stats.averageEnergy.toFixed(1)}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    / 5
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5 space-y-0.5">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <BarChart2 className="h-3 w-3" />
                  총 기록 수
                </div>
                <div className="text-sm font-bold">
                  {stats.totalEntries}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    건
                  </span>
                </div>
              </div>
            </div>

            {/* 주간 에너지 트렌드 차트 */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                주간 에너지 트렌드
              </div>
              <WeeklyEnergyChart data={stats.weeklyTrend} />
            </div>

            {/* 기분 분포 파이 차트 */}
            <div className="space-y-2">
              <div className="text-xs font-medium">기분 분포</div>
              <MoodDistributionChart
                distribution={stats.moodDistribution}
                total={stats.totalEntries}
              />
            </div>

            {/* 통증 부위 빈도 */}
            {stats.bodyPartFrequency.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  자주 아픈 부위
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stats.bodyPartFrequency.slice(0, 6).map((item) => (
                    <Badge
                      key={item.part}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-red-200 text-red-600 bg-red-50"
                    >
                      {item.label}
                      <span className="ml-1 opacity-70">{item.count}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 최근 기록 리스트 */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              최근 기록
            </div>
            <div className="space-y-1.5">
              {entries.slice(0, 5).map((entry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  onUpdate={updateEntry}
                  onDelete={deleteEntry}
                />
              ))}
              {entries.length > 5 && (
                <p className="text-[10px] text-center text-muted-foreground pt-1">
                  외 {entries.length - 5}건의 기록이 있습니다.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 완전 빈 상태 (기록 없음) */}
        {entries.length === 0 && todayEntry === null && (
          <p className="text-center text-xs text-muted-foreground py-2">
            컨디션 기록을 추가하면 통계와 트렌드를 볼 수 있습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
