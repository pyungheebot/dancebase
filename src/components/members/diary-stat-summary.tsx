"use client";

// ─── 댄스 일기 통계 서브컴포넌트 모음 ────────────────────────────────────────
// 상단 요약 배지, 감정 막대 차트, 컨디션 추이 차트 포함

import { memo } from "react";
import { BarChart2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiaryCardEmotion } from "@/types";
import { EMOTION_LIST } from "./dance-diary-types";

// ─── 상단 통계 요약 배지 3개 ─────────────────────────────────────────────────

interface DiaryStatSummaryProps {
  streak: number;
  totalCount: number;
  avgCondition: number | null;
}

/**
 * 연속 작성 / 총 일기 수 / 평균 컨디션 요약 카드 3개
 */
export const DiaryStatSummary = memo(function DiaryStatSummary({
  streak,
  totalCount,
  avgCondition,
}: DiaryStatSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-2" aria-label="일기 통계 요약">
      <div className="rounded-lg bg-muted/50 p-2 text-center" aria-label={`연속 작성 ${streak}일`}>
        <p className="text-lg font-bold text-orange-500" aria-hidden="true">
          {streak}
        </p>
        <p className="text-[10px] text-muted-foreground">연속 작성</p>
      </div>
      <div className="rounded-lg bg-muted/50 p-2 text-center" aria-label={`총 일기 ${totalCount}건`}>
        <p className="text-lg font-bold text-indigo-500" aria-hidden="true">
          {totalCount}
        </p>
        <p className="text-[10px] text-muted-foreground">총 일기</p>
      </div>
      <div
        className="rounded-lg bg-muted/50 p-2 text-center"
        aria-label={`평균 컨디션 ${avgCondition !== null ? avgCondition.toFixed(1) : "없음"}`}
      >
        <p className="text-lg font-bold text-green-500" aria-hidden="true">
          {avgCondition !== null ? avgCondition.toFixed(1) : "-"}
        </p>
        <p className="text-[10px] text-muted-foreground">평균 컨디션</p>
      </div>
    </div>
  );
});

// ─── 감정 막대 차트 ───────────────────────────────────────────────────────────

interface EmotionBarChartProps {
  stats: Record<DiaryCardEmotion, number>;
  total: number;
}

/**
 * 감정별 비율 막대 차트
 * - 각 감정의 비율을 가로 막대로 시각화
 */
export const EmotionBarChart = memo(function EmotionBarChart({
  stats,
  total,
}: EmotionBarChartProps) {
  if (total === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        아직 기록이 없습니다.
      </p>
    );
  }

  return (
    <div
      className="space-y-1.5"
      role="list"
      aria-label="감정별 통계"
    >
      {EMOTION_LIST.map((em) => {
        const count = stats[em.value];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div
            key={em.value}
            className="flex items-center gap-2"
            role="listitem"
            aria-label={`${em.label}: ${count}회 (${pct}%)`}
          >
            <span className="text-sm w-5" aria-hidden="true">
              {em.emoji}
            </span>
            <span className="text-[10px] text-muted-foreground w-8">
              {em.label}
            </span>
            <div
              className="flex-1 bg-muted rounded-full h-2 overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${em.label} 비율 ${pct}%`}
            >
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
});

// ─── 통계 탭 전체 ─────────────────────────────────────────────────────────────

interface DiaryStatsTabProps {
  stats: Record<DiaryCardEmotion, number>;
  total: number;
  trend: { date: string; avg: number }[];
}

/**
 * 감정 막대 차트 + 컨디션 추이 차트를 묶은 통계 탭 영역
 */
export const DiaryStatsTab = memo(function DiaryStatsTab({
  stats,
  total,
  trend,
}: DiaryStatsTabProps) {
  return (
    <div className="space-y-4">
      {/* 감정 분포 */}
      <div className="space-y-2">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          감정별 비율
        </p>
        <EmotionBarChart stats={stats} total={total} />
      </div>

      {/* 컨디션 추이 */}
      <div className="space-y-2">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          최근 30일 평균 컨디션
        </p>
        <ConditionTrendChart trend={trend} />
      </div>
    </div>
  );
});

// ─── 컨디션 추이 라인 차트 ────────────────────────────────────────────────────

interface ConditionTrendChartProps {
  trend: { date: string; avg: number }[];
}

/**
 * 최근 30일 평균 컨디션 SVG 라인 차트
 * - 데이터가 있는 포인트만 선으로 연결
 */
const ConditionTrendChart = memo(function ConditionTrendChart({
  trend,
}: ConditionTrendChartProps) {
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

  // 각 포인트의 SVG 좌표 계산
  const points = trend.map((t, i) => ({
    x: (i / (trend.length - 1)) * 100,
    y: t.avg > 0 ? ((maxVal - t.avg) / maxVal) * chartHeight : null,
    avg: t.avg,
    date: t.date,
  }));

  // 데이터가 있는 포인트만 연결하는 폴리라인 포인트 문자열
  const linePoints = points
    .filter((p) => p.y !== null)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <div
      className="relative"
      style={{ height: chartHeight + 20 }}
      role="img"
      aria-label={`최근 30일 평균 컨디션 추이: ${trend[0]?.date.slice(5)} ~ ${trend[trend.length - 1]?.date.slice(5)}`}
    >
      {/* Y축 레이블 */}
      <div
        className="absolute left-0 top-0 bottom-5 flex flex-col justify-between"
        aria-hidden="true"
      >
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
          aria-hidden="true"
        >
          {/* 수평 가이드라인 */}
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

          {/* 데이터 포인트 원 */}
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
        <div className="flex justify-between mt-1" aria-hidden="true">
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
});
