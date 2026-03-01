"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useSkillSelfEvaluation,
  defaultScores,
} from "@/hooks/use-skill-self-evaluation";
import {
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABELS,
} from "@/types";
import type { SkillCategory, SkillEvaluation } from "@/types";

// ============================================
// Props
// ============================================

type SkillSelfEvaluationCardProps = {
  groupId: string;
  userId: string;
};

// ============================================
// SVG 레이더 차트
// ============================================

type RadarChartProps = {
  /** 최신 평가 점수 (1~5) */
  latestScores: Record<SkillCategory, number> | null;
  /** 이전 평가 점수 (1~5, 없으면 null) */
  previousScores: Record<SkillCategory, number> | null;
};

function RadarChart({ latestScores, previousScores }: RadarChartProps) {
  const SIZE = 160;
  const CENTER = SIZE / 2;
  const MAX_RADIUS = 60;
  const N = SKILL_CATEGORIES.length; // 6개

  /**
   * 각도 계산: 위(top, -90도)에서 시작하여 시계방향
   * index 0 = 위, 1 = 위-오른쪽, ... 5 = 위-왼쪽
   */
  function getAngle(i: number): number {
    return (i / N) * 2 * Math.PI - Math.PI / 2;
  }

  /** 점수(1~5) → 반지름 비율 (0.2 ~ 1.0) */
  function scoreToRadius(score: number): number {
    return ((score - 1) / 4) * MAX_RADIUS + MAX_RADIUS * 0.2;
  }

  /** (score, index) → SVG 좌표 */
  function getPoint(score: number, i: number): { x: number; y: number } {
    const r = scoreToRadius(score);
    const angle = getAngle(i);
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle),
    };
  }

  /** 점수 배열 → polygon points 문자열 */
  function buildPolygonPoints(
    scores: Record<SkillCategory, number>
  ): string {
    return SKILL_CATEGORIES.map((cat, i) =>
      getPoint(scores[cat] ?? 1, i)
    )
      .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");
  }

  // 배경 격자 (레벨 1~5)
  const gridLevels = [1, 2, 3, 4, 5];

  // 축 선 끝점 (최대 반지름 기준)
  const axisEndPoints = SKILL_CATEGORIES.map((_, i) => {
    const angle = getAngle(i);
    return {
      x: CENTER + MAX_RADIUS * Math.cos(angle),
      y: CENTER + MAX_RADIUS * Math.sin(angle),
    };
  });

  // 레이블 위치 (축보다 약간 바깥)
  const labelOffset = MAX_RADIUS + 14;
  const labelPoints = SKILL_CATEGORIES.map((cat, i) => {
    const angle = getAngle(i);
    return {
      cat,
      x: CENTER + labelOffset * Math.cos(angle),
      y: CENTER + labelOffset * Math.sin(angle),
    };
  });

  return (
    <svg
      width={SIZE + 60}
      height={SIZE + 40}
      viewBox={`-30 -20 ${SIZE + 60} ${SIZE + 40}`}
      aria-label="스킬 레이더 차트"
    >
      {/* 배경 격자 (정육각형 5단계) */}
      {gridLevels.map((level) => {
        const pts = SKILL_CATEGORIES.map((_, i) => {
          const r = scoreToRadius(level);
          const angle = getAngle(i);
          return `${(CENTER + r * Math.cos(angle)).toFixed(2)},${(CENTER + r * Math.sin(angle)).toFixed(2)}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      {/* 축 선 */}
      {axisEndPoints.map((ep, i) => (
        <line
          key={i}
          x1={CENTER}
          y1={CENTER}
          x2={ep.x.toFixed(2)}
          y2={ep.y.toFixed(2)}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      {/* 이전 평가 다각형 (회색 점선) */}
      {previousScores && (
        <polygon
          points={buildPolygonPoints(previousScores)}
          fill="rgba(148,163,184,0.15)"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      )}

      {/* 최신 평가 다각형 (파란색) */}
      {latestScores && (
        <polygon
          points={buildPolygonPoints(latestScores)}
          fill="rgba(59,130,246,0.15)"
          stroke="#3b82f6"
          strokeWidth="2"
        />
      )}

      {/* 최신 평가 점 */}
      {latestScores &&
        SKILL_CATEGORIES.map((cat, i) => {
          const p = getPoint(latestScores[cat] ?? 1, i);
          return (
            <circle
              key={cat}
              cx={p.x.toFixed(2)}
              cy={p.y.toFixed(2)}
              r="3"
              fill="#3b82f6"
            />
          );
        })}

      {/* 축 레이블 */}
      {labelPoints.map(({ cat, x, y }) => (
        <text
          key={cat}
          x={x.toFixed(2)}
          y={y.toFixed(2)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fill="#64748b"
          fontFamily="inherit"
        >
          {SKILL_CATEGORY_LABELS[cat]}
        </text>
      ))}
    </svg>
  );
}

// ============================================
// 변화량 표시 배지
// ============================================

function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return null;

  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
        <TrendingUp className="h-3 w-3" />+{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500 font-medium">
        <TrendingDown className="h-3 w-3" />
        {change}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <Minus className="h-3 w-3" />0
    </span>
  );
}

// ============================================
// 평가 이력 목록 (최근 5개)
// ============================================

function EvaluationHistoryList({
  evaluations,
}: {
  evaluations: SkillEvaluation[];
}) {
  const recent = evaluations.slice(0, 5);

  if (recent.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">
        평가 이력이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {recent.map((ev, idx) => {
        const date = new Date(ev.evaluatedAt);
        const label =
          idx === 0
            ? `${date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} (최신)`
            : date.toLocaleDateString("ko-KR", {
                month: "short",
                day: "numeric",
              });
        return (
          <li
            key={ev.id}
            className="flex items-center justify-between text-[11px] py-1 border-b border-border last:border-0"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">
              {ev.totalScore}
              <span className="text-muted-foreground font-normal">/30</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function SkillSelfEvaluationCard({
  groupId,
  userId,
}: SkillSelfEvaluationCardProps) {
  const [open, setOpen] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [draftScores, setDraftScores] = useState<Record<SkillCategory, number>>(
    defaultScores()
  );
  const { pending: saving, execute: executeSave } = useAsyncAction();

  const { history, latest, previous, scoreChanges, loading, saveEvaluation } =
    useSkillSelfEvaluation(groupId, userId);

  // 평가 시작 시 최신 점수로 초기화
  const handleStartEvaluation = () => {
    setDraftScores(
      latest ? { ...latest.scores } : defaultScores()
    );
    setEvaluating(true);
  };

  const handleCancelEvaluation = () => {
    setEvaluating(false);
  };

  const handleSave = () => {
    void executeSave(async () => {
      saveEvaluation(draftScores);
      toast.success(TOAST.MEMBERS.SKILL_EVAL_SAVED);
      setEvaluating(false);
    });
  };

  const handleScoreChange = (cat: SkillCategory, value: number[]) => {
    setDraftScores((prev) => ({ ...prev, [cat]: value[0] }));
  };

  const draftTotal = SKILL_CATEGORIES.reduce(
    (sum, cat) => sum + (draftScores[cat] ?? 1),
    0
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border border-border rounded-lg bg-card">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">스킬 자가 평가</span>
              {latest && (
                <span className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 rounded-full">
                  총 {latest.totalScore}/30
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
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
            {loading ? (
              <p className="text-xs text-muted-foreground">불러오는 중...</p>
            ) : evaluating ? (
              /* ── 평가 입력 UI ── */
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  각 항목을 1~5점으로 평가해주세요.
                </p>

                {SKILL_CATEGORIES.map((cat) => (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">
                        {SKILL_CATEGORY_LABELS[cat]}
                      </label>
                      <span className="text-xs font-semibold tabular-nums text-blue-600">
                        {draftScores[cat]}점
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[draftScores[cat]]}
                      onValueChange={(val) => handleScoreChange(cat, val)}
                      className="w-full"
                    />
                    {/* 눈금 표시 */}
                    <div className="flex justify-between px-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={`text-[9px] tabular-nums ${
                            draftScores[cat] === n
                              ? "text-blue-600 font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 합계 미리보기 */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-xs text-muted-foreground">총점</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {draftTotal}
                    <span className="text-xs font-normal text-muted-foreground">
                      /30
                    </span>
                  </span>
                </div>

                {/* 저장/취소 버튼 */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={handleCancelEvaluation}
                    disabled={saving}
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              /* ── 결과 보기 UI ── */
              <div className="space-y-4">
                {/* 레이더 차트 */}
                <div className="flex justify-center">
                  <RadarChart
                    latestScores={latest?.scores ?? null}
                    previousScores={previous?.scores ?? null}
                  />
                </div>

                {/* 범례 */}
                {previous && (
                  <div className="flex items-center gap-3 justify-center text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-4 h-0.5 bg-blue-500 rounded" />
                      최신 평가
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block w-4 h-0.5 rounded"
                        style={{
                          borderTop: "1.5px dashed #94a3b8",
                        }}
                      />
                      이전 평가
                    </span>
                  </div>
                )}

                {/* 카테고리별 점수 + 변화량 */}
                {latest ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {SKILL_CATEGORIES.map((cat) => (
                      <div
                        key={cat}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[11px] text-muted-foreground truncate">
                          {SKILL_CATEGORY_LABELS[cat]}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-semibold tabular-nums text-blue-600">
                            {latest.scores[cat]}
                          </span>
                          <ChangeBadge change={scoreChanges[cat]} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    아직 평가 기록이 없습니다. 지금 첫 평가를 시작해보세요.
                  </p>
                )}

                {/* 평가하기 버튼 */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs w-full"
                  onClick={handleStartEvaluation}
                >
                  <Star className="h-3 w-3 mr-1" />
                  평가하기
                </Button>

                {/* 평가 이력 */}
                {history.evaluations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      최근 평가 이력
                    </p>
                    <EvaluationHistoryList
                      evaluations={history.evaluations}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
