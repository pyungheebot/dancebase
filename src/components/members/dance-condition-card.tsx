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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Activity,
  Zap,
  Brain,
  Dumbbell,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useDanceCondition,
  PAIN_AREA_LABELS,
  INTENSITY_LABELS,
  INTENSITY_COLORS,
  PAIN_AREA_LIST,
  INTENSITY_LIST,
  getScoreColor,
  getScoreTextColor,
  getScoreLabel,
} from "@/hooks/use-dance-condition";
import type {
  DanceConditionLog,
  DanceConditionPainArea,
  DanceConditionIntensity,
} from "@/types";

// ============================================================
// 유틸
// ============================================================

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

function formatWeekLabel(weekStart: string): string {
  const [, m, d] = weekStart.split("-");
  return `${parseInt(m)}/${parseInt(d)}주`;
}

function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================================
// 점수 슬라이더 컴포넌트
// ============================================================

function ScoreSlider({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className={cn("text-xs font-semibold", getScoreTextColor(value))}>
          {value} / 10 ({getScoreLabel(value)})
        </span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 h-5 rounded-sm transition-all",
              n <= value ? getScoreColor(value) : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 점수 바 표시 컴포넌트
// ============================================================

function ScoreBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className={cn("text-[11px] font-semibold", getScoreTextColor(value))}>
          {value}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", getScoreColor(value))}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// 주간 트렌드 바 차트 (CSS div 기반)
// ============================================================

function WeeklyTrendChart({
  weeks,
}: {
  weeks: ReturnType<ReturnType<typeof useDanceCondition>["getWeeklyAverages"]>;
}) {
  const maxVal = 10;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-muted-foreground font-medium">주간 전체 컨디션 평균</p>
      <div className="flex items-end gap-1.5 h-16">
        {weeks.map((w) => {
          const heightPct = w.count === 0 ? 0 : (w.avgOverall / maxVal) * 100;
          return (
            <div
              key={w.weekStart}
              className="flex-1 flex flex-col items-center gap-0.5"
            >
              <span className={cn("text-[10px] font-semibold", getScoreTextColor(w.avgOverall))}>
                {w.count > 0 ? w.avgOverall : "-"}
              </span>
              <div className="w-full flex items-end" style={{ height: 40 }}>
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    w.count === 0
                      ? "bg-muted"
                      : getScoreColor(w.avgOverall)
                  )}
                  style={{ height: `${heightPct}%`, minHeight: w.count > 0 ? 4 : 0 }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">
                {formatWeekLabel(w.weekStart)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 기록 추가/수정 폼 다이얼로그
// ============================================================

type LogFormState = {
  date: string;
  overallScore: number;
  energyLevel: number;
  focusLevel: number;
  muscleCondition: number;
  painAreas: DanceConditionPainArea[];
  practiceIntensity: DanceConditionIntensity;
  hydrationMl: number;
  memo: string;
};

function makeDefaultForm(): LogFormState {
  return {
    date: todayString(),
    overallScore: 7,
    energyLevel: 7,
    focusLevel: 7,
    muscleCondition: 7,
    painAreas: ["none"],
    practiceIntensity: "moderate",
    hydrationMl: 1500,
    memo: "",
  };
}

function LogFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
  title,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<LogFormState>;
  onSubmit: (form: LogFormState) => void;
  title: string;
}) {
  const [form, setForm] = useState<LogFormState>(() => ({
    ...makeDefaultForm(),
    ...initial,
  }));

  const set = <K extends keyof LogFormState>(key: K, val: LogFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const togglePainArea = (area: DanceConditionPainArea) => {
    if (area === "none") {
      set("painAreas", ["none"]);
      return;
    }
    setForm((prev) => {
      const withoutNone = prev.painAreas.filter((a) => a !== "none");
      const has = withoutNone.includes(area);
      const next = has
        ? withoutNone.filter((a) => a !== area)
        : [...withoutNone, area];
      return { ...prev, painAreas: next.length === 0 ? ["none"] : next };
    });
  };

  const handleSubmit = () => {
    if (!form.date) {
      toast.error("날짜를 선택해 주세요.");
      return;
    }
    if (form.hydrationMl < 0 || form.hydrationMl > 10000) {
      toast.error("수분 섭취량은 0~10000ml 범위여야 합니다.");
      return;
    }
    onSubmit(form);
  };

  // 다이얼로그가 열릴 때마다 초기값 리셋
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
    else setForm({ ...makeDefaultForm(), ...initial });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 전체 컨디션 */}
          <ScoreSlider
            label="전체 컨디션"
            value={form.overallScore}
            onChange={(v) => set("overallScore", v)}
            icon={<Activity className="h-3 w-3" />}
          />

          {/* 에너지 레벨 */}
          <ScoreSlider
            label="에너지 레벨"
            value={form.energyLevel}
            onChange={(v) => set("energyLevel", v)}
            icon={<Zap className="h-3 w-3" />}
          />

          {/* 집중력 */}
          <ScoreSlider
            label="집중력"
            value={form.focusLevel}
            onChange={(v) => set("focusLevel", v)}
            icon={<Brain className="h-3 w-3" />}
          />

          {/* 근육 상태 */}
          <ScoreSlider
            label="근육 상태"
            value={form.muscleCondition}
            onChange={(v) => set("muscleCondition", v)}
            icon={<Dumbbell className="h-3 w-3" />}
          />

          {/* 연습 강도 */}
          <div className="space-y-1">
            <Label className="text-xs">연습 강도</Label>
            <Select
              value={form.practiceIntensity}
              onValueChange={(v) =>
                set("practiceIntensity", v as DanceConditionIntensity)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTENSITY_LIST.map((level) => (
                  <SelectItem key={level} value={level} className="text-xs">
                    {INTENSITY_LABELS[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 통증 부위 */}
          <div className="space-y-1.5">
            <Label className="text-xs">통증 부위</Label>
            <div className="flex flex-wrap gap-1">
              {PAIN_AREA_LIST.map((area) => {
                const selected = form.painAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => togglePainArea(area)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border transition-all",
                      selected
                        ? area === "none"
                          ? "bg-slate-200 border-slate-400 text-slate-700"
                          : "bg-red-100 border-red-400 text-red-700"
                        : "bg-muted border-border text-muted-foreground hover:border-foreground/30"
                    )}
                  >
                    {PAIN_AREA_LABELS[area]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 수분 섭취량 */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              수분 섭취량 (ml)
            </Label>
            <Input
              type="number"
              min={0}
              max={10000}
              step={100}
              value={form.hydrationMl}
              onChange={(e) => set("hydrationMl", Number(e.target.value))}
              className="h-8 text-xs"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">컨디션 메모</Label>
            <Textarea
              value={form.memo}
              onChange={(e) => set("memo", e.target.value)}
              placeholder="오늘 컨디션에 대한 메모를 입력하세요..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onClose}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 단건 기록 카드
// ============================================================

function LogItem({
  log,
  onEdit,
  onDelete,
}: {
  log: DanceConditionLog;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasPain =
    log.painAreas.length > 0 &&
    !(log.painAreas.length === 1 && log.painAreas[0] === "none");

  return (
    <div className="border rounded-md p-2.5 space-y-2 bg-card">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            {formatDate(log.date)}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0", INTENSITY_COLORS[log.practiceIntensity])}
          >
            {INTENSITY_LABELS[log.practiceIntensity]}
          </Badge>
          {hasPain && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-red-50 border-red-200 text-red-600"
            >
              <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
              통증
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 점수 바 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <ScoreBar
          label="전체 컨디션"
          value={log.overallScore}
          icon={<Activity className="h-2.5 w-2.5" />}
        />
        <ScoreBar
          label="에너지"
          value={log.energyLevel}
          icon={<Zap className="h-2.5 w-2.5" />}
        />
        <ScoreBar
          label="집중력"
          value={log.focusLevel}
          icon={<Brain className="h-2.5 w-2.5" />}
        />
        <ScoreBar
          label="근육 상태"
          value={log.muscleCondition}
          icon={<Dumbbell className="h-2.5 w-2.5" />}
        />
      </div>

      {/* 수분 / 통증 부위 */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Droplets className="h-2.5 w-2.5" />
          {log.hydrationMl.toLocaleString()}ml
        </span>
        {hasPain && (
          <span className="flex items-center gap-0.5 text-red-500">
            <AlertCircle className="h-2.5 w-2.5" />
            {log.painAreas
              .filter((a) => a !== "none")
              .map((a) => PAIN_AREA_LABELS[a])
              .join(", ")}
          </span>
        )}
      </div>

      {/* 메모 */}
      {log.memo && (
        <p className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1 leading-relaxed">
          {log.memo}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function DanceConditionCard({ memberId }: { memberId: string }) {
  const {
    logs,
    recentLogs,
    todayLog,
    addLog,
    updateLog,
    deleteLog,
    getWeeklyAverages,
    getOverallTrend,
    getTopPainAreas,
  } = useDanceCondition(memberId);

  const [open, setOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DanceConditionLog | null>(null);

  const weeklyAvgs = getWeeklyAverages(4);
  const trend = getOverallTrend();
  const topPains = getTopPainAreas(3);

  const handleAdd = (form: {
    date: string;
    overallScore: number;
    energyLevel: number;
    focusLevel: number;
    muscleCondition: number;
    painAreas: DanceConditionPainArea[];
    practiceIntensity: DanceConditionIntensity;
    hydrationMl: number;
    memo: string;
  }) => {
    // 동일 날짜 중복 체크
    const exists = logs.some((l) => l.date === form.date);
    if (exists) {
      toast.error("해당 날짜의 기록이 이미 있습니다. 수정 버튼을 이용해 주세요.");
      return;
    }
    addLog(form);
    setAddDialogOpen(false);
    toast.success("컨디션 기록이 저장되었습니다.");
  };

  const handleEdit = (form: {
    date: string;
    overallScore: number;
    energyLevel: number;
    focusLevel: number;
    muscleCondition: number;
    painAreas: DanceConditionPainArea[];
    practiceIntensity: DanceConditionIntensity;
    hydrationMl: number;
    memo: string;
  }) => {
    if (!editTarget) return;
    updateLog(editTarget.id, form);
    setEditTarget(null);
    toast.success("컨디션 기록이 수정되었습니다.");
  };

  const handleDelete = (logId: string) => {
    deleteLog(logId);
    toast.success("기록이 삭제되었습니다.");
  };

  const TrendIcon =
    trend === "up"
      ? TrendingUp
      : trend === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
      ? "text-red-600"
      : "text-muted-foreground";

  const trendLabel =
    trend === "up"
      ? "상승 중"
      : trend === "down"
      ? "하락 중"
      : trend === "stable"
      ? "유지 중"
      : "데이터 없음";

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-blue-500" />
                댄스 컨디션 일지
              </CardTitle>
              <div className="flex items-center gap-1">
                {/* 트렌드 배지 */}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 flex items-center gap-0.5",
                    trend === "up"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : trend === "down"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-muted border-border text-muted-foreground"
                  )}
                >
                  <TrendIcon className="h-2.5 w-2.5" />
                  {trendLabel}
                </Badge>
                {/* 기록 추가 버튼 */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 gap-0.5"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  기록
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {open ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-3 pb-3 space-y-3">
              {/* 오늘 컨디션 요약 */}
              {todayLog ? (
                <div className="bg-blue-50 border border-blue-100 rounded-md p-2.5 space-y-1.5">
                  <p className="text-[10px] font-medium text-blue-700">오늘의 컨디션</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        { label: "전체", value: todayLog.overallScore, icon: <Activity className="h-2.5 w-2.5" /> },
                        { label: "에너지", value: todayLog.energyLevel, icon: <Zap className="h-2.5 w-2.5" /> },
                        { label: "집중력", value: todayLog.focusLevel, icon: <Brain className="h-2.5 w-2.5" /> },
                        { label: "근육", value: todayLog.muscleCondition, icon: <Dumbbell className="h-2.5 w-2.5" /> },
                      ] as { label: string; value: number; icon: React.ReactNode }[]
                    ).map(({ label, value, icon }) => (
                      <div key={label} className="text-center">
                        <div className={cn("text-base font-bold", getScoreTextColor(value))}>
                          {value}
                        </div>
                        <div className="flex items-center justify-center gap-0.5 text-[9px] text-muted-foreground">
                          {icon}
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 border border-dashed rounded-md p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    오늘 기록이 없습니다.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-[10px]"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    지금 기록하기
                  </Button>
                </div>
              )}

              {/* 주간 트렌드 차트 */}
              {logs.length > 0 && (
                <WeeklyTrendChart weeks={weeklyAvgs} />
              )}

              {/* 자주 발생하는 통증 부위 */}
              {topPains.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    자주 발생하는 통증 부위
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {topPains.map(({ area, count }) => (
                      <Badge
                        key={area}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-red-50 border-red-200 text-red-600"
                      >
                        {PAIN_AREA_LABELS[area]} ({count}회)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 최근 기록 목록 */}
              {recentLogs.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground font-medium">
                    최근 기록 (최대 10건)
                  </p>
                  <div className="space-y-2">
                    {recentLogs.map((log) => (
                      <LogItem
                        key={log.id}
                        log={log}
                        onEdit={() => setEditTarget(log)}
                        onDelete={() => handleDelete(log.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[11px] text-muted-foreground">
                  아직 기록이 없습니다. 첫 번째 컨디션 일지를 작성해 보세요.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 기록 추가 다이얼로그 */}
      <LogFormDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
        title="컨디션 기록 추가"
      />

      {/* 기록 수정 다이얼로그 */}
      {editTarget && (
        <LogFormDialog
          open={true}
          onClose={() => setEditTarget(null)}
          initial={{
            date: editTarget.date,
            overallScore: editTarget.overallScore,
            energyLevel: editTarget.energyLevel,
            focusLevel: editTarget.focusLevel,
            muscleCondition: editTarget.muscleCondition,
            painAreas: editTarget.painAreas,
            practiceIntensity: editTarget.practiceIntensity,
            hydrationMl: editTarget.hydrationMl,
            memo: editTarget.memo,
          }}
          onSubmit={handleEdit}
          title="컨디션 기록 수정"
        />
      )}
    </>
  );
}
