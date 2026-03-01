"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Target,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  useDanceFlexibility,
  FLEX_PART_META,

  calcFlexProgress,
  calcOverallProgress,
} from "@/hooks/use-dance-flexibility";
import type { FlexTrackPart, FlexTrackPartConfig } from "@/types";

// ============================================================
// 유틸 - 진행률 색상
// ============================================================

function progressColor(pct: number): string {
  if (pct >= 100) return "bg-green-500";
  if (pct >= 70) return "bg-blue-500";
  if (pct >= 40) return "bg-yellow-500";
  return "bg-red-400";
}

// ============================================================
// 진행률 바
// ============================================================

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${progressColor(clamped)}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ============================================================
// 가로 바 차트 (최근 10회)
// ============================================================

function HorizontalBarChart({
  records,
  goal,
  unit,
}: {
  records: { date: string; value: number }[];
  goal: number;
  unit: string;
}) {
  const recent = records.slice(0, 10).reverse(); // 오래된 순 → 최근 순
  if (recent.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground text-center py-3">
        측정 기록이 없습니다.
      </p>
    );
  }
  const maxVal = Math.max(...recent.map((r) => r.value), goal);

  return (
    <div className="space-y-1.5">
      {recent.map((r, i) => {
        const pct = maxVal > 0 ? (r.value / maxVal) * 100 : 0;
        const goalPct = maxVal > 0 ? (goal / maxVal) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-[68px] text-[10px] text-muted-foreground shrink-0 text-right">
              {r.date.slice(5)} {/* MM-DD */}
            </span>
            <div className="relative flex-1 h-4 bg-muted rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all ${progressColor(
                  goal > 0 ? Math.round((r.value / goal) * 100) : 0
                )}`}
                style={{ width: `${pct}%` }}
              />
              {/* 목표 기준선 */}
              <div
                className="absolute top-0 bottom-0 w-px bg-foreground/40"
                style={{ left: `${goalPct}%` }}
              />
            </div>
            <span className="w-[42px] text-[10px] font-medium text-right shrink-0">
              {r.value}
              {unit}
            </span>
          </div>
        );
      })}
      <p className="text-[10px] text-muted-foreground text-right">
        목표: {goal}
        {unit}
      </p>
    </div>
  );
}

// ============================================================
// 기록 추가 다이얼로그
// ============================================================

interface AddRecordDialogProps {
  open: boolean;
  part: FlexTrackPart;
  onClose: () => void;
  onAdd: (date: string, value: number, note: string) => void;
}

function AddRecordDialog({ open, part, onClose, onAdd }: AddRecordDialogProps) {
  const meta = FLEX_PART_META[part];
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit() {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      toast.error("올바른 측정값을 입력하세요.");
      return;
    }
    onAdd(date, num, note.trim());
    setValue("");
    setNote("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {meta.label} 측정 기록 추가
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">측정일</label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              측정값 ({meta.unit === "cm" ? "cm" : "°"})
            </label>
            <Input
              type="number"
              className="h-8 text-xs"
              placeholder={`예) ${meta.defaultGoal}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">메모 (선택)</label>
            <Input
              className="h-8 text-xs"
              placeholder="특이사항 입력"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 목표 설정 다이얼로그
// ============================================================

interface GoalDialogProps {
  open: boolean;
  part: FlexTrackPart;
  currentGoal: number;
  onClose: () => void;
  onSave: (goal: number) => void;
}

function GoalDialog({ open, part, currentGoal, onClose, onSave }: GoalDialogProps) {
  const meta = FLEX_PART_META[part];
  const [goal, setGoal] = useState(String(currentGoal));

  function handleSave() {
    const num = parseFloat(goal);
    if (isNaN(num) || num <= 0) {
      toast.error("올바른 목표값을 입력하세요.");
      return;
    }
    onSave(num);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {meta.label} 목표 설정
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 py-1">
          <label className="text-xs text-muted-foreground">
            목표값 ({meta.unit === "cm" ? "cm" : "°"})
          </label>
          <Input
            type="number"
            className="h-8 text-xs"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 단일 부위 행
// ============================================================

interface PartRowProps {
  config: FlexTrackPartConfig;
  onAddRecord: (part: FlexTrackPart) => void;
  onSetGoal: (part: FlexTrackPart) => void;
  onRemoveRecord: (part: FlexTrackPart, recordId: string) => void;
}

function PartRow({ config, onAddRecord, onSetGoal, onRemoveRecord }: PartRowProps) {
  const [open, setOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  const meta = FLEX_PART_META[config.part];
  const progress = calcFlexProgress(config);
  const latest = config.records[0] ?? null;
  const unitLabel = meta.unit === "cm" ? "cm" : "°";

  // 추이 아이콘 (최근 2개 비교)
  let TrendIcon = Minus;
  let trendColor = "text-muted-foreground";
  if (config.records.length >= 2) {
    const diff = config.records[0].value - config.records[1].value;
    if (diff > 0) { TrendIcon = TrendingUp; trendColor = "text-green-500"; }
    else if (diff < 0) { TrendIcon = TrendingDown; trendColor = "text-red-400"; }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        {/* 헤더 행 */}
        <div className="flex items-center gap-2 px-3 py-2">
          <CollapsibleTrigger asChild>
            <button className="flex-1 flex items-center gap-2 text-left">
              <span className="text-xs font-medium w-[72px] shrink-0">{meta.label}</span>
              <div className="flex-1 min-w-0">
                <ProgressBar value={progress} />
              </div>
              <Badge
                className={`text-[10px] px-1.5 py-0 shrink-0 ${
                  progress >= 100
                    ? "bg-green-100 text-green-700 border-green-200"
                    : progress >= 70
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : progress >= 40
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-red-100 text-red-600 border-red-200"
                }`}
                variant="outline"
              >
                {progress}%
              </Badge>
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1 shrink-0">
            {latest && (
              <span className="text-[10px] text-muted-foreground">
                {latest.value}{unitLabel}
              </span>
            )}
            <TrendIcon className={`h-3 w-3 ${trendColor}`} />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onSetGoal(config.part)}
              title="목표 설정"
            >
              <Target className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onAddRecord(config.part)}
              title="측정 추가"
            >
              <Plus className="h-3 w-3 text-muted-foreground" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {open ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 펼침 영역 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t pt-2">
            {/* 목표 정보 */}
            <p className="text-[10px] text-muted-foreground">
              {meta.description} &middot; 목표: {config.goal}{unitLabel}
            </p>

            {/* 차트 토글 */}
            <Collapsible open={chartOpen} onOpenChange={setChartOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] gap-1"
                >
                  <BarChart2 className="h-3 w-3" />
                  변화 추이 {chartOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2">
                  <HorizontalBarChart
                    records={config.records}
                    goal={config.goal}
                    unit={unitLabel}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 기록 목록 */}
            {config.records.length > 0 ? (
              <div className="space-y-1">
                {config.records.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between text-[11px] bg-muted/40 rounded px-2 py-1"
                  >
                    <span className="text-muted-foreground w-20 shrink-0">
                      {rec.date}
                    </span>
                    <span className="font-medium">
                      {rec.value}{unitLabel}
                    </span>
                    <span className="flex-1 text-muted-foreground text-right truncate mx-2">
                      {rec.note}
                    </span>
                    <button
                      onClick={() => onRemoveRecord(config.part, rec.id)}
                      className="ml-1 text-muted-foreground hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {config.records.length > 5 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    외 {config.records.length - 5}건 더 있음
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                아직 측정 기록이 없습니다.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// DanceFlexibilityCard (메인)
// ============================================================

export function DanceFlexibilityCard({ memberId }: { memberId: string }) {
  const { data, addRecord, removeRecord, updateGoal } =
    useDanceFlexibility(memberId);

  // 다이얼로그 상태
  const [addTarget, setAddTarget] = useState<FlexTrackPart | null>(null);
  const [goalTarget, setGoalTarget] = useState<FlexTrackPart | null>(null);

  const overall = calcOverallProgress(data);

  function handleAddRecord(
    part: FlexTrackPart,
    date: string,
    value: number,
    note: string
  ) {
    addRecord(part, { date, value, note });
    toast.success(`${FLEX_PART_META[part].label} 측정 기록이 추가되었습니다.`);
  }

  function handleRemoveRecord(part: FlexTrackPart, recordId: string) {
    removeRecord(part, recordId);
    toast.success("기록이 삭제되었습니다.");
  }

  function handleUpdateGoal(part: FlexTrackPart, goal: number) {
    updateGoal(part, goal);
    toast.success(`${FLEX_PART_META[part].label} 목표가 업데이트되었습니다.`);
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Settings2 className="h-4 w-4 text-purple-500" />
              유연성 트래커
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">전체 평균</span>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  overall >= 100
                    ? "bg-green-100 text-green-700 border-green-200"
                    : overall >= 70
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : overall >= 40
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-red-100 text-red-600 border-red-200"
                }`}
              >
                {overall}%
              </Badge>
            </div>
          </div>
          {/* 전체 달성률 바 */}
          <div className="mt-2">
            <ProgressBar value={overall} />
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pt-0">
          {data.parts.map((config) => (
            <PartRow
              key={config.part}
              config={config}
              onAddRecord={(part) => setAddTarget(part)}
              onSetGoal={(part) => setGoalTarget(part)}
              onRemoveRecord={handleRemoveRecord}
            />
          ))}
        </CardContent>
      </Card>

      {/* 기록 추가 다이얼로그 */}
      {addTarget && (
        <AddRecordDialog
          open={!!addTarget}
          part={addTarget}
          onClose={() => setAddTarget(null)}
          onAdd={(date, value, note) =>
            handleAddRecord(addTarget, date, value, note)
          }
        />
      )}

      {/* 목표 설정 다이얼로그 */}
      {goalTarget && (
        <GoalDialog
          open={!!goalTarget}
          part={goalTarget}
          currentGoal={
            data.parts.find((p) => p.part === goalTarget)?.goal ??
            FLEX_PART_META[goalTarget].defaultGoal
          }
          onClose={() => setGoalTarget(null)}
          onSave={(goal) => handleUpdateGoal(goalTarget, goal)}
        />
      )}
    </>
  );
}
