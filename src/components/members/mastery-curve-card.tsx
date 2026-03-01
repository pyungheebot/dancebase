"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  TrendingUp,
  Target,
  CalendarDays,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";
import {
  useMasteryCurve,
  getTodayStr,
  estimateCompletionDate,
} from "@/hooks/use-mastery-curve";
import type { MasteryCurveEntry, MasteryCheckpoint } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 날짜 포맷 유틸
// ============================================

function dateDiffDays(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// ============================================
// SVG 꺾은선 차트
// ============================================

interface MasteryChartProps {
  checkpoints: MasteryCheckpoint[];
  targetDate: string;
}

function MasteryChart({ checkpoints, targetDate }: MasteryChartProps) {
  const W = 280;
  const H = 120;
  const PAD = { top: 12, right: 16, bottom: 28, left: 32 };

  const sorted = [...checkpoints].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] text-xs text-muted-foreground">
        체크포인트를 추가하면 곡선이 표시됩니다.
      </div>
    );
  }

  const today = getTodayStr();
  const allDates = [...sorted.map((cp) => cp.date), today];
  if (targetDate > today) allDates.push(targetDate);

  const minDate = allDates.reduce((a, b) => (a < b ? a : b));
  const maxDate = allDates.reduce((a, b) => (a > b ? a : b));

  const minTs = new Date(minDate).getTime();
  const maxTs = new Date(maxDate).getTime();
  const tsRange = maxTs - minTs || 1;

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  function xPos(dateStr: string): number {
    const ts = new Date(dateStr).getTime();
    return PAD.left + ((ts - minTs) / tsRange) * chartW;
  }

  function yPos(progress: number): number {
    return PAD.top + chartH - (progress / 100) * chartH;
  }

  // 꺾은선 path
  const pathPoints = sorted.map(
    (cp) => `${xPos(cp.date)},${yPos(cp.progress)}`
  );
  const pathD = pathPoints.length > 0
    ? `M ${pathPoints.join(" L ")}`
    : "";

  // 목표선 x 좌표 (targetDate이 범위 내에 있을 때만)
  const targetX =
    targetDate >= minDate && targetDate <= maxDate
      ? xPos(targetDate)
      : null;

  // 오늘선 x 좌표
  const todayX =
    today >= minDate && today <= maxDate ? xPos(today) : null;

  // y축 눈금 (0, 25, 50, 75, 100)
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      className="overflow-visible"
      aria-label="안무 습득 곡선 차트"
    >
      {/* 배경 격자 */}
      {yTicks.map((val) => (
        <g key={val}>
          <line
            x1={PAD.left}
            y1={yPos(val)}
            x2={W - PAD.right}
            y2={yPos(val)}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
          <text
            x={PAD.left - 4}
            y={yPos(val)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={8}
            fill="currentColor"
            fillOpacity={0.5}
          >
            {val}
          </text>
        </g>
      ))}

      {/* 오늘 수직선 */}
      {todayX !== null && (
        <line
          x1={todayX}
          y1={PAD.top}
          x2={todayX}
          y2={H - PAD.bottom}
          stroke="#6366f1"
          strokeOpacity={0.4}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      )}

      {/* 목표일 수직선 */}
      {targetX !== null && (
        <line
          x1={targetX}
          y1={PAD.top}
          x2={targetX}
          y2={H - PAD.bottom}
          stroke="#f59e0b"
          strokeOpacity={0.5}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      )}

      {/* 100% 기준선 */}
      <line
        x1={PAD.left}
        y1={yPos(100)}
        x2={W - PAD.right}
        y2={yPos(100)}
        stroke="#22c55e"
        strokeOpacity={0.3}
        strokeWidth={1}
      />

      {/* 꺾은선 */}
      {pathD && (
        <>
          {/* 그라디언트 영역 */}
          <defs>
            <linearGradient id="masteryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <path
            d={`${pathD} L ${xPos(sorted[sorted.length - 1].date)},${H - PAD.bottom} L ${xPos(sorted[0].date)},${H - PAD.bottom} Z`}
            fill="url(#masteryGrad)"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#6366f1"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {/* 데이터 포인트 */}
      {sorted.map((cp) => (
        <g key={cp.date}>
          <circle
            cx={xPos(cp.date)}
            cy={yPos(cp.progress)}
            r={3.5}
            fill="#6366f1"
            stroke="white"
            strokeWidth={1.5}
          />
          <title>{`${cp.date}: ${cp.progress}%${cp.note ? ` (${cp.note})` : ""}`}</title>
        </g>
      ))}

      {/* 최신 진도 레이블 */}
      {sorted.length > 0 && (() => {
        const last = sorted[sorted.length - 1];
        const lx = xPos(last.date);
        const ly = yPos(last.progress);
        const labelX = lx + 6;
        return (
          <text
            x={labelX > W - PAD.right - 20 ? lx - 6 : labelX}
            y={ly - 6}
            textAnchor={labelX > W - PAD.right - 20 ? "end" : "start"}
            fontSize={8}
            fontWeight="bold"
            fill="#6366f1"
          >
            {last.progress}%
          </text>
        );
      })()}

      {/* x축 레이블 (첫 날짜, 마지막 날짜) */}
      {sorted.length >= 1 && (
        <>
          <text
            x={xPos(sorted[0].date)}
            y={H - 4}
            textAnchor="middle"
            fontSize={7}
            fill="currentColor"
            fillOpacity={0.5}
          >
            {sorted[0].date.slice(5)}
          </text>
          {sorted.length > 1 && (
            <text
              x={xPos(sorted[sorted.length - 1].date)}
              y={H - 4}
              textAnchor="middle"
              fontSize={7}
              fill="currentColor"
              fillOpacity={0.5}
            >
              {sorted[sorted.length - 1].date.slice(5)}
            </text>
          )}
        </>
      )}
    </svg>
  );
}

// ============================================
// 체크포인트 추가 폼
// ============================================

interface CheckpointFormProps {
  entryId: string;
  onAdd: (entryId: string, checkpoint: MasteryCheckpoint) => void;
  onCancel: () => void;
}

function CheckpointForm({ entryId, onAdd, onCancel }: CheckpointFormProps) {
  const [date, setDate] = useState(getTodayStr());
  const [progress, setProgress] = useState("");
  const [note, setNote] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prog = parseInt(progress, 10);
    if (!date) {
      toast.error(TOAST.MEMBERS.MASTERY_DATE_REQUIRED);
      return;
    }
    if (isNaN(prog) || prog < 0 || prog > 100) {
      toast.error(TOAST.MEMBERS.MASTERY_PROGRESS_RANGE);
      return;
    }
    void execute(async () => {
      onAdd(entryId, { date, progress: prog, note: note.trim() });
      toast.success(TOAST.MEMBERS.MASTERY_CHECKPOINT_ADDED);
      onCancel();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border bg-muted/30 p-3 space-y-2">
      <p className="text-[10px] font-medium text-muted-foreground">체크포인트 추가</p>
      <div className="flex gap-2">
        <div className="flex-shrink-0">
          <label className="text-[10px] text-muted-foreground block mb-1">날짜</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-7 text-xs w-36"
            max={getTodayStr()}
          />
        </div>
        <div className="flex-shrink-0 w-24">
          <label className="text-[10px] text-muted-foreground block mb-1">진도 (%)</label>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="0~100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground block mb-1">메모 (선택)</label>
          <Input
            placeholder="간단한 메모..."
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 50))}
            className="h-7 text-xs"
            maxLength={50}
          />
        </div>
      </div>
      <div className="flex gap-1.5 pt-0.5">
        <Button type="submit" size="sm" className="h-6 text-xs px-3" disabled={submitting}>
          {submitting ? "추가 중..." : "추가"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-xs px-3"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

// ============================================
// 안무 추가 폼
// ============================================

interface AddEntryFormProps {
  onAdd: (input: {
    choreographyName: string;
    targetDate: string;
    initialProgress?: number;
  }) => void;
  onCancel: () => void;
}

function AddEntryForm({ onAdd, onCancel }: AddEntryFormProps) {
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [initialProgress, setInitialProgress] = useState("0");
  const { pending: submitting, execute: executeAdd } = useAsyncAction();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(TOAST.MEMBERS.MASTERY_CHOREO_NAME_REQUIRED);
      return;
    }
    if (!targetDate) {
      toast.error(TOAST.MEMBERS.MASTERY_TARGET_DATE_REQUIRED);
      return;
    }
    const prog = parseInt(initialProgress, 10);
    if (isNaN(prog) || prog < 0 || prog > 100) {
      toast.error(TOAST.MEMBERS.MASTERY_INIT_PROGRESS_RANGE);
      return;
    }
    void executeAdd(async () => {
      onAdd({
        choreographyName: name.trim(),
        targetDate,
        initialProgress: prog,
      });
      toast.success(TOAST.MEMBERS.MASTERY_CHOREO_ADDED);
      onCancel();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border bg-muted/30 p-3 space-y-2">
      <p className="text-xs font-medium flex items-center gap-1.5">
        <Plus className="h-3 w-3" />
        새 안무 추가
      </p>
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1">안무 이름</label>
        <Input
          placeholder="예: 커버곡 - BTS Dynamite"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 50))}
          className="h-7 text-xs"
          maxLength={50}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground block mb-1">목표 완성일</label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="h-7 text-xs"
            min={getTodayStr()}
          />
        </div>
        <div className="w-32">
          <label className="text-[10px] text-muted-foreground block mb-1">현재 진도 (%)</label>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="0~100"
            value={initialProgress}
            onChange={(e) => setInitialProgress(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>
      <div className="flex gap-1.5 pt-0.5">
        <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={submitting}>
          {submitting ? "추가 중..." : "안무 추가"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

// ============================================
// 단일 안무 카드
// ============================================

interface EntryPanelProps {
  entry: MasteryCurveEntry;
  onDelete: (id: string) => void;
  onAddCheckpoint: (entryId: string, checkpoint: MasteryCheckpoint) => void;
  onRemoveCheckpoint: (entryId: string, date: string) => void;
}

function EntryPanel({
  entry,
  onDelete,
  onAddCheckpoint,
  onRemoveCheckpoint,
}: EntryPanelProps) {
  const [open, setOpen] = useState(false);
  const [showCheckpointForm, setShowCheckpointForm] = useState(false);

  const today = getTodayStr();
  const daysLeft = dateDiffDays(today, entry.targetDate);
  const estimatedDate = estimateCompletionDate(entry.checkpoints);
  const isOverdue = entry.targetDate < today && entry.currentProgress < 100;
  const isCompleted = entry.currentProgress >= 100;

  const progressColor =
    entry.currentProgress >= 80
      ? "bg-green-500"
      : entry.currentProgress >= 50
        ? "bg-blue-500"
        : entry.currentProgress >= 25
          ? "bg-yellow-500"
          : "bg-muted-foreground";

  return (
    <div
      className={cn(
        "rounded-md border bg-card",
        isCompleted && "border-green-200 bg-green-50/30 dark:bg-green-950/10"
      )}
    >
      {/* 안무 헤더 */}
      <div className="px-3 py-2.5 space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium truncate">
                {entry.choreographyName}
              </span>
              {isCompleted && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-500 hover:bg-green-500">
                  완성
                </Badge>
              )}
              {isOverdue && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-red-300 text-red-500"
                >
                  기한 초과
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Flag className="h-2.5 w-2.5" />
                목표: {formatYearMonthDay(entry.targetDate)}
              </span>
              {!isCompleted && daysLeft > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {daysLeft}일 남음
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-sm font-bold tabular-nums">
              {entry.currentProgress}%
            </span>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
              title={open ? "접기" : "상세 보기"}
            >
              {open ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              className="p-1 rounded hover:bg-muted text-red-400 hover:text-red-600 transition-colors"
              title="삭제"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="space-y-1">
          <Progress value={entry.currentProgress} className="h-1.5" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span className={cn("font-medium", progressColor.replace("bg-", "text-"))}>
              {entry.currentProgress}% 달성
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* 상세 영역 (펼치기) */}
      {open && (
        <div className="border-t px-3 py-3 space-y-3">
          {/* 습득 곡선 차트 */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              습득 곡선
            </p>
            <MasteryChart
              checkpoints={entry.checkpoints}
              targetDate={entry.targetDate}
            />
            {/* 범례 */}
            <div className="flex gap-3 mt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 bg-indigo-500 rounded" />
                진도 곡선
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 bg-indigo-400 opacity-50" style={{ borderTop: "1px dashed" }} />
                오늘
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 bg-amber-400 opacity-50" style={{ borderTop: "1px dashed" }} />
                목표일
              </span>
            </div>
          </div>

          {/* 예상 완성일 & 목표 달성률 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-muted/30 border px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Target className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">목표 달성률</p>
              </div>
              <p className="text-base font-bold text-indigo-600">
                {entry.currentProgress}%
              </p>
            </div>
            <div className="rounded-md bg-muted/30 border px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <CalendarDays className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">예상 완성일</p>
              </div>
              {estimatedDate ? (
                <p className="text-[11px] font-semibold">
                  {estimatedDate.slice(5).replace("-", "/")}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {entry.checkpoints.length < 2 ? "데이터 부족" : "계산 불가"}
                </p>
              )}
            </div>
          </div>

          {/* 체크포인트 목록 */}
          {entry.checkpoints.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">체크포인트 기록</p>
              <div className="space-y-1">
                {[...entry.checkpoints]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((cp) => (
                    <div
                      key={cp.date}
                      className="flex items-center gap-2 text-xs rounded px-2 py-1 bg-muted/30 group"
                    >
                      <span className="text-[10px] text-muted-foreground w-16 flex-shrink-0 tabular-nums">
                        {cp.date.slice(5).replace("-", "/")}
                      </span>
                      <span className="font-semibold w-10 text-right tabular-nums">
                        {cp.progress}%
                      </span>
                      {cp.note && (
                        <span className="flex-1 text-[10px] text-muted-foreground truncate">
                          {cp.note}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveCheckpoint(entry.id, cp.date)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-red-400 transition-opacity"
                        title="체크포인트 삭제"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 체크포인트 추가 폼 */}
          {showCheckpointForm ? (
            <CheckpointForm
              entryId={entry.id}
              onAdd={onAddCheckpoint}
              onCancel={() => setShowCheckpointForm(false)}
            />
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs"
              onClick={() => setShowCheckpointForm(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              체크포인트 추가
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface MasteryCurveCardProps {
  groupId: string;
  userId: string;
}

export function MasteryCurveCard({ groupId, userId }: MasteryCurveCardProps) {
  const [cardOpen, setCardOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    entries,
    loading,
    canAdd,
    addEntry,
    deleteEntry,
    addCheckpoint,
    removeCheckpoint,
  } = useMasteryCurve(groupId, userId);

  function handleAdd(input: {
    choreographyName: string;
    targetDate: string;
    initialProgress?: number;
  }) {
    const result = addEntry(input);
    if (!result) {
      toast.error(`안무는 최대 10개까지 등록할 수 있습니다.`);
    }
    setShowAddForm(false);
  }

  function handleDelete(id: string) {
    deleteEntry(id);
    toast.success(TOAST.MEMBERS.MASTERY_DELETED);
  }

  function handleCardOpenChange(next: boolean) {
    setCardOpen(next);
    if (!next) setShowAddForm(false);
  }

  // 전체 평균 진도
  const avgProgress =
    entries.length > 0
      ? Math.round(
          entries.reduce((s, e) => s + e.currentProgress, 0) / entries.length
        )
      : 0;

  return (
    <Collapsible open={cardOpen} onOpenChange={handleCardOpenChange}>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">안무 습득 곡선</span>
              {entries.length > 0 && (
                <>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {entries.length}개
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 text-indigo-600 border-indigo-200"
                  >
                    평균 {avgProgress}%
                  </Badge>
                </>
              )}
            </div>
            {cardOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t pt-3 space-y-3">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                불러오는 중...
              </p>
            ) : (
              <>
                {/* 안무 추가 폼 또는 버튼 */}
                {showAddForm ? (
                  <AddEntryForm
                    onAdd={handleAdd}
                    onCancel={() => setShowAddForm(false)}
                  />
                ) : (
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => setShowAddForm(true)}
                    disabled={!canAdd}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {canAdd
                      ? "안무 추가"
                      : "최대 10개 (슬롯 없음)"}
                  </Button>
                )}

                {/* 안무 목록 */}
                {entries.length === 0 ? (
                  <div className="text-center py-6">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      아직 등록된 안무가 없습니다.
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      안무를 추가하고 학습 진도를 기록해보세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <EntryPanel
                        key={entry.id}
                        entry={entry}
                        onDelete={handleDelete}
                        onAddCheckpoint={addCheckpoint}
                        onRemoveCheckpoint={removeCheckpoint}
                      />
                    ))}
                  </div>
                )}

                {/* 슬롯 안내 */}
                {entries.length > 0 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    {entries.length}/10 슬롯 사용 중
                  </p>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
