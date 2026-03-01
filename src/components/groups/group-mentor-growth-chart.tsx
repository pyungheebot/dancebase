"use client";

// 멘티 성장 트래커 - CSS/SVG 기반 라인 차트

import { TrendingUp } from "lucide-react";
import type { GroupMentorSession } from "@/types";

type GrowthLineChartProps = {
  /** 세션 목록 (날짜순 정렬 전) */
  sessions: GroupMentorSession[];
};

/**
 * 세션 평가 점수 추이를 SVG 라인 차트로 표시
 * - 최근 10개 세션만 표시
 * - 2개 미만이면 안내 메시지 표시
 */
export function GrowthLineChart({ sessions }: GrowthLineChartProps) {
  // 날짜 오름차순 정렬 후 최근 10개 슬라이스
  const sorted = sessions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10);

  if (sorted.length < 2) {
    return (
      <div
        className="flex items-center justify-center h-16 text-[10px] text-muted-foreground"
        aria-label="세션이 2개 이상 필요합니다"
      >
        세션이 2개 이상 필요합니다.
      </div>
    );
  }

  const chartH = 48;
  const chartW = 100;
  const minRating = 1;
  const maxRating = 5;
  const range = maxRating - minRating;

  // 각 점의 x, y 좌표 (퍼센트 기반)
  const points = sorted.map((s, i) => ({
    x: (i / (sorted.length - 1)) * chartW,
    y: chartH - ((s.rating - minRating) / range) * chartH,
    rating: s.rating,
    date: s.date,
  }));

  // SVG polyline 포인트 문자열
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="space-y-1" aria-label="세션 평가 추이 차트">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        <span>최근 세션 평가 추이</span>
      </div>
      <div className="relative w-full" style={{ height: chartH + 8 }}>
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: chartH }}
          aria-hidden="true"
        >
          {/* 배경 기준선 (1~5점) */}
          {[1, 2, 3, 4, 5].map((v) => {
            const y = chartH - ((v - minRating) / range) * chartH;
            return (
              <line
                key={v}
                x1="0"
                y1={y}
                x2={chartW}
                y2={y}
                stroke="#f0f0f0"
                strokeWidth="0.5"
              />
            );
          })}
          {/* 영역 채우기 */}
          <polygon
            points={[
              ...points.map((p) => `${p.x},${p.y}`),
              `${points[points.length - 1].x},${chartH}`,
              `${points[0].x},${chartH}`,
            ].join(" ")}
            fill="rgba(99,102,241,0.08)"
          />
          {/* 라인 */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* 데이터 포인트 */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2"
              fill="#6366f1"
            />
          ))}
        </svg>
        {/* x축: 첫/마지막 날짜 레이블 */}
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>{sorted[0].date.slice(5)}</span>
          <span>{sorted[sorted.length - 1].date.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}
