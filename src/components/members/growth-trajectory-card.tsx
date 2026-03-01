"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";
import { useGrowthTrajectory } from "@/hooks/use-growth-trajectory";
import type { GrowthTrajectory, GrowthDimension, GrowthDataPoint } from "@/types";

// ─── 상수 ──────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<GrowthDimension, string> = {
  skill: "기술력",
  attendance: "참여도",
  leadership: "리더십",
  creativity: "창의성",
  collaboration: "협동심",
};

const DIMENSION_COLORS: Record<GrowthDimension, string> = {
  skill: "#3b82f6",        // blue
  attendance: "#22c55e",   // green
  leadership: "#a855f7",   // purple
  creativity: "#f97316",   // orange
  collaboration: "#ec4899", // pink
};

const DIMENSIONS: GrowthDimension[] = [
  "skill",
  "attendance",
  "leadership",
  "creativity",
  "collaboration",
];

// ─── 추세 아이콘 ───────────────────────────────────────────────

function TrendIcon({ trend }: { trend: GrowthTrajectory["trend"] }) {
  if (trend === "rising") {
    return <TrendingUp className="h-3 w-3 text-green-500" />;
  }
  if (trend === "declining") {
    return <TrendingDown className="h-3 w-3 text-red-400" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function trendLabel(trend: GrowthTrajectory["trend"]): string {
  if (trend === "rising") return "상승";
  if (trend === "declining") return "하락";
  return "유지";
}

function trendBadgeClass(trend: GrowthTrajectory["trend"]): string {
  if (trend === "rising") return "border-green-200 text-green-600";
  if (trend === "declining") return "border-red-200 text-red-500";
  return "border-muted text-muted-foreground";
}

// ─── 현재 달 문자열 ────────────────────────────────────────────

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ─── SVG 꺾은선 차트 ───────────────────────────────────────────

interface TrajectoryChartProps {
  dataPoints: GrowthDataPoint[];
}

function TrajectoryChart({ dataPoints }: TrajectoryChartProps) {
  const W = 300;
  const H = 130;
  const PAD = { top: 12, right: 16, bottom: 28, left: 32 };

  const sorted = [...dataPoints].sort((a, b) => a.month.localeCompare(b.month));

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-[130px] text-xs text-muted-foreground">
        데이터포인트를 추가하면 차트가 표시됩니다.
      </div>
    );
  }

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  function xPos(idx: number): number {
    if (sorted.length === 1) return PAD.left + chartW / 2;
    return PAD.left + (idx / (sorted.length - 1)) * chartW;
  }

  function yPos(score: number): number {
    return PAD.top + chartH - (score / 100) * chartH;
  }

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      className="overflow-visible"
      aria-label="성장 궤적 차트"
    >
      {/* y축 격자선 */}
      {yTicks.map((val) => (
        <g key={val}>
          <line
            x1={PAD.left}
            y1={yPos(val)}
            x2={W - PAD.right}
            y2={yPos(val)}
            stroke="currentColor"
            strokeOpacity={0.07}
            strokeWidth={1}
          />
          <text
            x={PAD.left - 4}
            y={yPos(val)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={7}
            fill="currentColor"
            fillOpacity={0.45}
          >
            {val}
          </text>
        </g>
      ))}

      {/* x축 레이블 (월) */}
      {sorted.map((p, idx) => (
        <text
          key={p.month}
          x={xPos(idx)}
          y={H - 4}
          textAnchor="middle"
          fontSize={7}
          fill="currentColor"
          fillOpacity={0.5}
        >
          {p.month.slice(5)}월
        </text>
      ))}

      {/* 차원별 꺾은선 */}
      {DIMENSIONS.map((dim) => {
        const color = DIMENSION_COLORS[dim];
        const points = sorted.map((p, idx) => ({
          x: xPos(idx),
          y: yPos(p.scores[dim]),
          score: p.scores[dim],
        }));

        const pathD =
          points.length === 1
            ? `M ${points[0].x},${points[0].y}`
            : `M ${points.map((pt) => `${pt.x},${pt.y}`).join(" L ")}`;

        return (
          <g key={dim}>
            {points.length > 1 && (
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={0.85}
              />
            )}
            {points.map((pt, idx) => (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={3}
                  fill={color}
                  stroke="white"
                  strokeWidth={1}
                  fillOpacity={0.9}
                />
                <title>{`${DIMENSION_LABELS[dim]}: ${pt.score}`}</title>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── 월별 데이터 입력 폼 ────────────────────────────────────────

interface DataPointFormProps {
  trajectoryId: string;
  onAdd: (
    id: string,
    month: string,
    scores: Record<GrowthDimension, number>
  ) => void;
  onCancel: () => void;
}

function DataPointForm({ trajectoryId, onAdd, onCancel }: DataPointFormProps) {
  const [month, setMonth] = useState(currentMonth());
  const [scores, setScores] = useState<Record<GrowthDimension, string>>({
    skill: "",
    attendance: "",
    leadership: "",
    creativity: "",
    collaboration: "",
  });
  const { pending: submitting, execute } = useAsyncAction();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!month) {
      toast.error(TOAST.MEMBERS.GROWTH_MONTH_REQUIRED);
      return;
    }

    const parsed: Record<GrowthDimension, number> = {} as Record<
      GrowthDimension,
      number
    >;

    for (const dim of DIMENSIONS) {
      const val = parseInt(scores[dim], 10);
      if (isNaN(val) || val < 0 || val > 100) {
        toast.error(`${DIMENSION_LABELS[dim]} 점수는 0~100 사이로 입력해주세요.`);
        return;
      }
      parsed[dim] = val;
    }

    void execute(async () => {
      onAdd(trajectoryId, month, parsed);
      toast.success(TOAST.MEMBERS.GROWTH_DATA_ADDED);
      onCancel();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border bg-muted/30 p-3 space-y-2.5"
    >
      <p className="text-[10px] font-medium text-muted-foreground">
        월별 성장 데이터 입력
      </p>
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1">
          월 선택
        </label>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-7 text-xs w-36"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DIMENSIONS.map((dim) => (
          <div key={dim}>
            <label
              className="text-[10px] block mb-1"
              style={{ color: DIMENSION_COLORS[dim] }}
            >
              {DIMENSION_LABELS[dim]} (0-100)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="0~100"
              value={scores[dim]}
              onChange={(e) =>
                setScores((prev) => ({ ...prev, [dim]: e.target.value }))
              }
              className="h-7 text-xs"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 pt-0.5">
        <Button
          type="submit"
          size="sm"
          className="h-7 text-xs flex-1"
          disabled={submitting}
        >
          {submitting ? "추가 중..." : "데이터 추가"}
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

// ─── 멤버 추가 다이얼로그 ──────────────────────────────────────

interface AddMemberDialogProps {
  onAdd: (name: string, goal: number) => void;
}

function AddMemberDialog({ onAdd }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("80");
  const { pending: submitting, execute: executeMember } = useAsyncAction();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(TOAST.MEMBERS.GROWTH_MEMBER_REQUIRED);
      return;
    }

    const goalNum = parseInt(goal, 10);
    if (isNaN(goalNum) || goalNum < 1 || goalNum > 100) {
      toast.error(TOAST.MEMBERS.GROWTH_SCORE_RANGE);
      return;
    }

    void executeMember(async () => {
      onAdd(name.trim(), goalNum);
      setName("");
      setGoal("80");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          멤버 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">성장 궤적 멤버 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              멤버 이름
            </label>
            <Input
              placeholder="예: 김지수"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              className="h-8 text-sm"
              maxLength={30}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              목표 종합 점수 (1~100)
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              placeholder="80"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="h-8 text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              5개 차원(기술력, 참여도, 리더십, 창의성, 협동심) 평균의 목표치
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              className="flex-1 h-8 text-sm"
              disabled={submitting}
            >
              {submitting ? "추가 중..." : "추가"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 text-sm"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── 단일 멤버 패널 ────────────────────────────────────────────

interface MemberPanelProps {
  trajectory: GrowthTrajectory;
  latestScore: number;
  goalAchievement: number;
  onDelete: (id: string) => void;
  onAddDataPoint: (
    id: string,
    month: string,
    scores: Record<GrowthDimension, number>
  ) => void;
}

function MemberPanel({
  trajectory,
  latestScore,
  goalAchievement,
  onDelete,
  onAddDataPoint,
}: MemberPanelProps) {
  const [open, setOpen] = useState(false);
  const [showDataForm, setShowDataForm] = useState(false);

  return (
    <div className="rounded-md border bg-card">
      {/* 멤버 헤더 */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium">{trajectory.memberName}</span>
            <TrendIcon trend={trajectory.trend} />
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                trendBadgeClass(trajectory.trend)
              )}
            >
              {trendLabel(trajectory.trend)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground">
              종합{" "}
              <span className="font-semibold text-foreground">
                {latestScore}
              </span>
              점
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Target className="h-2.5 w-2.5" />
              목표 달성{" "}
              <span
                className={cn(
                  "font-semibold",
                  goalAchievement >= 100
                    ? "text-green-600"
                    : goalAchievement >= 70
                    ? "text-blue-600"
                    : "text-muted-foreground"
                )}
              >
                {goalAchievement}%
              </span>
            </span>
          </div>
        </div>

        {/* 목표 달성 Progress */}
        <div className="w-16 flex-shrink-0">
          <Progress value={Math.min(100, goalAchievement)} className="h-1.5" />
        </div>

        {/* 토글 / 삭제 버튼 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
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
            onClick={() => onDelete(trajectory.id)}
            className="p-1 rounded hover:bg-muted text-red-400 hover:text-red-600 transition-colors"
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 상세 영역 */}
      {open && (
        <div className="border-t px-3 py-3 space-y-3">
          {/* SVG 차트 */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              월별 성장 추이
            </p>
            <TrajectoryChart dataPoints={trajectory.dataPoints} />

            {/* 범례 */}
            <div className="flex flex-wrap gap-2.5 mt-1.5">
              {DIMENSIONS.map((dim) => (
                <span
                  key={dim}
                  className="text-[10px] text-muted-foreground flex items-center gap-1"
                >
                  <span
                    className="inline-block w-3 h-0.5 rounded"
                    style={{ backgroundColor: DIMENSION_COLORS[dim] }}
                  />
                  {DIMENSION_LABELS[dim]}
                </span>
              ))}
            </div>
          </div>

          {/* 최신 차원별 점수 */}
          {trajectory.dataPoints.length > 0 && (() => {
            const sorted = [...trajectory.dataPoints].sort((a, b) =>
              a.month.localeCompare(b.month)
            );
            const latest = sorted[sorted.length - 1];
            return (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">
                  최신 차원별 점수 ({latest.month})
                </p>
                <div className="space-y-1.5">
                  {DIMENSIONS.map((dim) => (
                    <div key={dim} className="flex items-center gap-2">
                      <span
                        className="text-[10px] w-14 flex-shrink-0"
                        style={{ color: DIMENSION_COLORS[dim] }}
                      >
                        {DIMENSION_LABELS[dim]}
                      </span>
                      <div className="flex-1">
                        <Progress
                          value={latest.scores[dim]}
                          className="h-1.5"
                        />
                      </div>
                      <span className="text-[10px] font-semibold w-7 text-right tabular-nums">
                        {latest.scores[dim]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 월별 데이터 입력 폼 */}
          {showDataForm ? (
            <DataPointForm
              trajectoryId={trajectory.id}
              onAdd={onAddDataPoint}
              onCancel={() => setShowDataForm(false)}
            />
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs"
              onClick={() => setShowDataForm(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              월별 데이터 추가
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────

interface GrowthTrajectoryCardProps {
  groupId: string;
}

export function GrowthTrajectoryCard({ groupId }: GrowthTrajectoryCardProps) {
  const [cardOpen, setCardOpen] = useState(false);

  const {
    trajectories,
    loading,
    totalMembers,
    avgGrowthRate,
    addTrajectory,
    addDataPoint,
    deleteTrajectory,
    getLatestComposite,
    getGoalAchievement,
  } = useGrowthTrajectory(groupId);

  function handleAddMember(name: string, goal: number) {
    const result = addTrajectory(name, goal);
    if (!result) {
      toast.error(TOAST.MEMBERS.GROWTH_DUPLICATE_MEMBER);
      return;
    }
    toast.success(`${name} 멤버가 추가되었습니다.`);
  }

  function handleDelete(id: string) {
    deleteTrajectory(id);
    toast.success(TOAST.MEMBERS.GROWTH_TRAJECTORY_DELETED);
  }

  function handleAddDataPoint(
    id: string,
    month: string,
    scores: Record<GrowthDimension, number>
  ) {
    const ok = addDataPoint(id, month, scores);
    if (!ok) {
      toast.error(TOAST.MEMBERS.GROWTH_DATA_ADD_ERROR);
    }
  }

  function handleCardOpenChange(next: boolean) {
    setCardOpen(next);
  }

  return (
    <Collapsible open={cardOpen} onOpenChange={handleCardOpenChange}>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {/* 헤더 */}
        <div className="flex items-center px-4 py-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex-1 flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
            >
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">멤버 성장 궤적</span>
              {totalMembers > 0 && (
                <>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    <Users className="h-2.5 w-2.5 mr-0.5 inline-block" />
                    {totalMembers}명
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      avgGrowthRate > 0
                        ? "border-green-200 text-green-600"
                        : avgGrowthRate < 0
                        ? "border-red-200 text-red-500"
                        : "border-muted text-muted-foreground"
                    )}
                  >
                    평균 성장{" "}
                    {avgGrowthRate > 0 ? "+" : ""}
                    {avgGrowthRate}
                  </Badge>
                </>
              )}
              <span className="ml-auto">
                {cardOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
            </button>
          </CollapsibleTrigger>
        </div>

        {/* 확장 콘텐츠 */}
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t pt-3 space-y-3">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                불러오는 중...
              </p>
            ) : (
              <>
                {/* 멤버 추가 버튼 */}
                <AddMemberDialog onAdd={handleAddMember} />

                {/* 멤버 없음 */}
                {trajectories.length === 0 ? (
                  <div className="text-center py-6">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      아직 추적 중인 멤버가 없습니다.
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      멤버를 추가하고 성장 궤적을 기록해보세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trajectories.map((t) => (
                      <MemberPanel
                        key={t.id}
                        trajectory={t}
                        latestScore={getLatestComposite(t)}
                        goalAchievement={getGoalAchievement(t)}
                        onDelete={handleDelete}
                        onAddDataPoint={handleAddDataPoint}
                      />
                    ))}
                  </div>
                )}

                {/* 차원 안내 */}
                {trajectories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t">
                    {DIMENSIONS.map((dim) => (
                      <span
                        key={dim}
                        className="text-[10px] flex items-center gap-1"
                        style={{ color: DIMENSION_COLORS[dim] }}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: DIMENSION_COLORS[dim] }}
                        />
                        {DIMENSION_LABELS[dim]}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
