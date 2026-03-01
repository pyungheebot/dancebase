"use client";

import { ALL_TRAITS, TRAIT_LABELS } from "@/hooks/use-dance-style-analysis";
import type { DanceStyleTraitScores } from "@/types";

// ============================================================
// SVG 레이더 차트 (육각형)
// ============================================================

export function RadarChart({
  scores,
  size = 160,
}: {
  scores: DanceStyleTraitScores;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;

  // 6개 꼭짓점 각도 (위에서 시작, 시계방향)
  const angles = ALL_TRAITS.map(
    (_, i) => (Math.PI / 2) * -1 + (2 * Math.PI * i) / 6
  );

  function scoreToRadius(score: number): number {
    return (score / 10) * maxRadius;
  }

  function getPoint(angle: number, radius: number): { x: number; y: number } {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  const bgLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const scorePath =
    ALL_TRAITS.map((trait, i) => {
      const pt = getPoint(angles[i], scoreToRadius(scores[trait]));
      return `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }).join(" ") + " Z";

  function hexPath(fraction: number): string {
    return (
      angles
        .map((angle, i) => {
          const pt = getPoint(angle, maxRadius * fraction);
          return `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
        })
        .join(" ") + " Z"
    );
  }

  const labelOffset = maxRadius * 1.35;

  // 접근성: 각 특성 점수 텍스트 구성
  const ariaLabel = ALL_TRAITS.map(
    (t) => `${TRAIT_LABELS[t]} ${scores[t]}점`
  ).join(", ");

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        role="img"
        aria-label={`댄스 스타일 레이더 차트: ${ariaLabel}`}
      >
        <title>댄스 스타일 레이더 차트: {ariaLabel}</title>

        {/* 배경 육각형 */}
        {bgLevels.map((level, i) => (
          <path
            key={i}
            d={hexPath(level)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
            aria-hidden="true"
          />
        ))}

        {/* 축선 */}
        {angles.map((angle, i) => {
          const outer = getPoint(angle, maxRadius);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x.toFixed(2)}
              y2={outer.y.toFixed(2)}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
              aria-hidden="true"
            />
          );
        })}

        {/* 점수 영역 */}
        <path
          d={scorePath}
          fill="rgba(99, 102, 241, 0.25)"
          stroke="rgb(99, 102, 241)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          aria-hidden="true"
        />

        {/* 점수 꼭짓점 점 */}
        {ALL_TRAITS.map((trait, i) => {
          const pt = getPoint(angles[i], scoreToRadius(scores[trait]));
          return (
            <circle
              key={trait}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill="rgb(99, 102, 241)"
              aria-hidden="true"
            />
          );
        })}

        {/* 레이블 */}
        {ALL_TRAITS.map((trait, i) => {
          const pt = getPoint(angles[i], labelOffset);
          const isLeft = pt.x < cx - 2;
          const isRight = pt.x > cx + 2;
          const anchor = isLeft ? "end" : isRight ? "start" : "middle";
          return (
            <text
              key={trait}
              x={pt.x.toFixed(2)}
              y={(pt.y + 4).toFixed(2)}
              textAnchor={anchor}
              fontSize={9}
              fill="currentColor"
              opacity={0.65}
              fontWeight={500}
              aria-hidden="true"
            >
              {TRAIT_LABELS[trait]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
