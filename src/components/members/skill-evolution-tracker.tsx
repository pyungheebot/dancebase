"use client";

import { useState, useCallback } from "react";
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
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useSkillEvolutionTracker } from "@/hooks/use-skill-evolution-tracker";
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS } from "@/types";
import type { SkillCategory } from "@/types";

// ============================================
// Props
// ============================================

type SkillEvolutionTrackerProps = {
  groupId: string;
  userId: string;
};

// ============================================
// 카테고리별 색상 (6개)
// ============================================

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  physical: "#10b981",   // green (기초 체력)
  rhythm: "#3b82f6",     // blue (리듬감)
  expression: "#f59e0b", // amber (표현력)
  technique: "#8b5cf6",  // violet (테크닉)
  memory: "#ec4899",     // pink (안무 기억력)
  teamwork: "#06b6d4",   // cyan (팀워크)
};

// ============================================
// 성장률 배지
// ============================================

function GrowthBadge({ growth }: { growth: number | null }) {
  if (growth === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full bg-gray-100 text-gray-500 font-medium">
        <Minus className="h-2.5 w-2.5" />
        -
      </span>
    );
  }
  if (growth > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full bg-green-100 text-green-700 font-medium">
        <TrendingUp className="h-2.5 w-2.5" />
        +{growth.toFixed(1)}
      </span>
    );
  }
  if (growth < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full bg-red-100 text-red-600 font-medium">
        <TrendingDown className="h-2.5 w-2.5" />
        {growth.toFixed(1)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full bg-gray-100 text-gray-500 font-medium">
      <Minus className="h-2.5 w-2.5" />
      ±0
    </span>
  );
}

// ============================================
// CSS div 꺾은선 차트
// ============================================

type LineChartProps = {
  /** [{month, avgScore}] - 오래된 것부터 (왼쪽=과거) */
  monthlyAvgTrend: { month: string; avgScore: number }[];
  /** 카테고리별 월별 점수: snapshots[monthIndex][category] */
  categoryTrend: { month: string; scores: Record<SkillCategory, number> }[];
};

function SkillLineChart({ monthlyAvgTrend, categoryTrend }: LineChartProps) {
  const CHART_H = 100; // px (Y축 높이)
  const _CHART_W = 100; // % 너비 기준
  const Y_MIN = 1;
  const Y_MAX = 5;

  // 점수를 Y 퍼센트로 변환 (0%=하단, 100%=상단)
  const scoreToY = useCallback(
    (score: number): number => {
      return 100 - ((score - Y_MIN) / (Y_MAX - Y_MIN)) * 100;
    },
    []
  );

  const n = categoryTrend.length;

  if (n === 0) {
    return (
      <div className="flex items-center justify-center h-[120px] text-[11px] text-muted-foreground">
        기록이 없습니다
      </div>
    );
  }

  // X 위치 계산 (n=1이면 중앙)
  const xPercent = (i: number): number => {
    if (n === 1) return 50;
    return (i / (n - 1)) * 100;
  };

  return (
    <div className="space-y-1">
      {/* 차트 영역 */}
      <div
        className="relative w-full bg-muted/30 rounded border border-border overflow-hidden"
        style={{ height: `${CHART_H + 4}px` }}
      >
        {/* Y축 격자선 (1~5) */}
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="absolute left-0 right-0 border-t border-border/40"
            style={{ top: `${scoreToY(level)}%` }}
          />
        ))}

        {/* 카테고리별 꺾은선 */}
        {SKILL_CATEGORIES.map((cat) => {
          const color = CATEGORY_COLORS[cat];
          return (
            <svg
              key={cat}
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* 선 세그먼트 */}
              {categoryTrend.slice(0, -1).map((item, i) => {
                const x1 = xPercent(i);
                const y1 = scoreToY(item.scores[cat] ?? 3);
                const x2 = xPercent(i + 1);
                const y2 = scoreToY(
                  categoryTrend[i + 1].scores[cat] ?? 3
                );
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth="1.5"
                    strokeOpacity="0.7"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {/* 데이터 점 */}
              {categoryTrend.map((item, i) => (
                <circle
                  key={i}
                  cx={xPercent(i)}
                  cy={scoreToY(item.scores[cat] ?? 3)}
                  r="2.5"
                  fill={color}
                  fillOpacity="0.9"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          );
        })}

        {/* 전체 평균 꺾은선 (흰색 굵은 선) */}
        {monthlyAvgTrend.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {monthlyAvgTrend.slice(0, -1).map((item, i) => {
              const x1 = xPercent(i);
              const y1 = scoreToY(item.avgScore);
              const x2 = xPercent(i + 1);
              const y2 = scoreToY(monthlyAvgTrend[i + 1].avgScore);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="white"
                  strokeWidth="2.5"
                  strokeOpacity="0.9"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
        )}

        {/* Y축 레이블 */}
        <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between pointer-events-none py-0.5">
          {[5, 4, 3, 2, 1].map((v) => (
            <span key={v} className="text-[8px] text-muted-foreground leading-none">
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* X축 월 레이블 */}
      <div className="relative w-full">
        <div className="flex justify-between px-0.5">
          {categoryTrend.map((item, i) => (
            <span
              key={i}
              className="text-[9px] text-muted-foreground"
              style={{
                flex: "0 0 auto",
                position: n > 4 ? "absolute" : "static",
                left: n > 4 ? `${xPercent(i)}%` : undefined,
                transform: n > 4 ? "translateX(-50%)" : undefined,
              }}
            >
              {item.month.slice(5)}월
            </span>
          ))}
        </div>
        {/* n > 4일 때 높이 확보 */}
        {n > 4 && <div style={{ height: "14px" }} />}
      </div>
    </div>
  );
}

// ============================================
// 범례
// ============================================

function ChartLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {SKILL_CATEGORIES.map((cat) => (
        <span key={cat} className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span
            className="inline-block w-3 h-0.5 rounded"
            style={{ backgroundColor: CATEGORY_COLORS[cat] }}
          />
          {SKILL_CATEGORY_LABELS[cat]}
        </span>
      ))}
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="inline-block w-3 h-0.5 rounded bg-white border border-border" />
        평균
      </span>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function SkillEvolutionTracker({
  groupId,
  userId,
}: SkillEvolutionTrackerProps) {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const { pending: saving, execute: executeSave } = useAsyncAction();
  const [draftScores, setDraftScores] = useState<Record<SkillCategory, number>>(
    () =>
      Object.fromEntries(
        SKILL_CATEGORIES.map((cat) => [cat, 3])
      ) as Record<SkillCategory, number>
  );

  const {
    latest,
    previous,
    monthlyAvgTrend,
    data,
    categoryGrowth,
    currentAvg,
    avgChange,
    loading,
    saveSnapshot,
  } = useSkillEvolutionTracker(groupId, userId);

  // 카테고리 추이 (차트용 - 오래된 것부터)
  const categoryTrend = [...data.snapshots]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((s) => ({ month: s.month, scores: s.scores }));

  const handleStartRecording = () => {
    // 최신 스냅샷 점수를 초기값으로
    if (latest) {
      setDraftScores({ ...latest.scores });
    } else {
      setDraftScores(
        Object.fromEntries(
          SKILL_CATEGORIES.map((cat) => [cat, 3])
        ) as Record<SkillCategory, number>
      );
    }
    setRecording(true);
  };

  const handleCancel = () => {
    setRecording(false);
  };

  const handleSave = () => {
    void executeSave(async () => {
      saveSnapshot(draftScores);
      toast.success(TOAST.MEMBERS.SKILL_EVOL_MONTHLY_SAVED);
      setRecording(false);
    });
  };

  const handleScoreChange = (cat: SkillCategory, value: number[]) => {
    setDraftScores((prev) => ({ ...prev, [cat]: value[0] }));
  };

  const draftAvg =
    Math.round(
      (SKILL_CATEGORIES.reduce((s, c) => s + (draftScores[c] ?? 1), 0) /
        SKILL_CATEGORIES.length) *
        100
    ) / 100;

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
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">스킬 성장 타임라인</span>
              {currentAvg !== null && (
                <span className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 rounded-full font-medium">
                  평균 {currentAvg.toFixed(1)}점
                </span>
              )}
              {avgChange !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${
                    avgChange > 0
                      ? "bg-green-100 text-green-700"
                      : avgChange < 0
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {avgChange > 0 ? "↑" : avgChange < 0 ? "↓" : "±"}
                  {Math.abs(avgChange).toFixed(1)}
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
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-4">
            {loading ? (
              <p className="text-xs text-muted-foreground">불러오는 중...</p>
            ) : recording ? (
              /* ── 스킬 기록 입력 폼 ── */
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  이번 달 스킬 수준을 1~5점으로 기록하세요.
                </p>

                {SKILL_CATEGORIES.map((cat) => (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">
                        {SKILL_CATEGORY_LABELS[cat]}
                      </label>
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: CATEGORY_COLORS[cat] }}
                      >
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
                    <div className="flex justify-between px-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className="text-[9px] tabular-nums"
                          style={{
                            color:
                              draftScores[cat] === n
                                ? CATEGORY_COLORS[cat]
                                : undefined,
                            fontWeight: draftScores[cat] === n ? 600 : undefined,
                          }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 평균 미리보기 */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-xs text-muted-foreground">평균 점수</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {draftAvg.toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground">
                      /5
                    </span>
                  </span>
                </div>

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
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              /* ── 타임라인 뷰 ── */
              <div className="space-y-4">
                {/* 종합 점수 요약 */}
                {currentAvg !== null && (
                  <div className="flex items-center justify-between bg-muted/40 rounded px-3 py-2">
                    <div>
                      <p className="text-[11px] text-muted-foreground">종합 평균</p>
                      <p className="text-xl font-bold tabular-nums text-blue-600">
                        {currentAvg.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground ml-0.5">
                          /5
                        </span>
                      </p>
                    </div>
                    {avgChange !== null && (
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">지난달 대비</p>
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            avgChange > 0
                              ? "text-green-600"
                              : avgChange < 0
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {avgChange > 0 ? "+" : ""}
                          {avgChange.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 꺾은선 차트 */}
                {categoryTrend.length > 0 ? (
                  <>
                    <SkillLineChart
                      monthlyAvgTrend={monthlyAvgTrend}
                      categoryTrend={categoryTrend}
                    />
                    <ChartLegend />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    아직 기록이 없습니다. 첫 번째 스킬을 기록해보세요.
                  </p>
                )}

                {/* 카테고리별 성장률 배지 */}
                {latest && (
                  <div className="space-y-1.5 pt-2 border-t border-border">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      카테고리별 현황
                      {previous && (
                        <span className="font-normal ml-1">
                          (지난달 대비)
                        </span>
                      )}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {SKILL_CATEGORIES.map((cat) => (
                        <div
                          key={cat}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                            />
                            <span className="text-[11px] text-muted-foreground truncate">
                              {SKILL_CATEGORY_LABELS[cat]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="text-xs font-semibold tabular-nums"
                              style={{ color: CATEGORY_COLORS[cat] }}
                            >
                              {latest.scores[cat]}
                            </span>
                            <GrowthBadge growth={categoryGrowth[cat]} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 현재 스킬 기록 버튼 */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs w-full"
                  onClick={handleStartRecording}
                >
                  <Activity className="h-3 w-3 mr-1" />
                  현재 스킬 기록
                </Button>

                {/* 기록 이력 요약 */}
                {data.snapshots.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-border">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      기록 이력 ({data.snapshots.length}개월)
                    </p>
                    <ul className="space-y-1">
                      {[...data.snapshots]
                        .sort((a, b) => b.month.localeCompare(a.month))
                        .slice(0, 5)
                        .map((snap, idx) => {
                          const [y, m] = snap.month.split("-");
                          return (
                            <li
                              key={snap.month}
                              className="flex items-center justify-between text-[11px] py-1 border-b border-border last:border-0"
                            >
                              <span className="text-muted-foreground">
                                {y}년 {parseInt(m, 10)}월
                                {idx === 0 && (
                                  <span className="ml-1 text-[10px] text-blue-600 font-medium">
                                    (최신)
                                  </span>
                                )}
                              </span>
                              <span className="font-medium tabular-nums">
                                {snap.avgScore.toFixed(2)}
                                <span className="text-muted-foreground font-normal">
                                  /5
                                </span>
                              </span>
                            </li>
                          );
                        })}
                    </ul>
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
