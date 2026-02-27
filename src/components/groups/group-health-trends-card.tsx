"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useGroupHealthSnapshot } from "@/hooks/use-group-health-snapshot";
import type { GroupHealthSnapshot } from "@/types/index";

// ============================================================
// 색상 상수
// ============================================================
const COLORS = {
  attendance: "#3b82f6", // blue-500
  member: "#22c55e",     // green-500
  post: "#f97316",       // orange-500
  active: "#a855f7",     // purple-500
} as const;

type MetricKey = keyof typeof COLORS;

const LEGEND_ITEMS: { key: MetricKey; label: string; color: string }[] = [
  { key: "attendance", label: "출석률", color: COLORS.attendance },
  { key: "member", label: "멤버 수", color: COLORS.member },
  { key: "post", label: "게시글", color: COLORS.post },
  { key: "active", label: "활동률", color: COLORS.active },
];

// ============================================================
// 차트 헬퍼
// ============================================================

/** 데이터 배열에서 값 범위를 계산합니다 */
function calcRange(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 100 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  // min === max인 경우 방어 처리
  return { min: Math.max(0, min - 10), max: Math.min(100, max + 10) };
}

/** 값을 SVG y좌표로 변환합니다 (위쪽이 작은 값) */
function toY(value: number, min: number, max: number, height: number): number {
  if (max === min) return height / 2;
  return height - ((value - min) / (max - min)) * height;
}

interface LineChartProps {
  snapshots: GroupHealthSnapshot[];
  chartWidth?: number;
  chartHeight?: number;
}

/** CSS div 기반 꺾은선 차트 (SVG polyline 사용) */
function HealthLineChart({ snapshots, chartWidth = 300, chartHeight = 80 }: LineChartProps) {
  if (snapshots.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height: chartHeight }}
      >
        데이터가 2개월 이상 쌓이면 차트가 표시됩니다
      </div>
    );
  }

  const n = snapshots.length;
  // x 좌표 간격
  const xStep = chartWidth / (n - 1);

  // 각 지표별 값 배열
  const attValues = snapshots.map((s) => s.attendanceRate);
  const memberValues = snapshots.map((s) => s.memberCount);
  const postValues = snapshots.map((s) => s.postCount);
  const activeValues = snapshots.map((s) => s.activeRate);

  // 멤버/게시글 수는 0~max 기준으로 별도 스케일
  const memberMax = Math.max(...memberValues, 1);
  const postMax = Math.max(...postValues, 1);

  // 멤버·게시글은 0~100으로 정규화한 뒤 같은 Y축에 표시
  const memberNorm = memberValues.map((v) => Math.round((v / memberMax) * 100));
  const postNorm = postValues.map((v) => Math.round((v / postMax) * 100));

  // 전체 값 범위 (출석률, 활동률, 정규화된 멤버, 정규화된 게시글)
  const allValues = [...attValues, ...activeValues, ...memberNorm, ...postNorm];
  const { min, max } = calcRange(allValues);

  /** 데이터 배열을 SVG polyline points 문자열로 변환 */
  function toPoints(values: number[]): string {
    return values
      .map((v, i) => {
        const x = i * xStep;
        const y = toY(v, min, max, chartHeight);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ width: "100%", height: chartHeight }}
        preserveAspectRatio="none"
      >
        {/* 가이드 라인 (25%, 50%, 75%) */}
        {[25, 50, 75].map((pct) => {
          const y = toY(pct, min, max, chartHeight);
          return (
            <line
              key={pct}
              x1={0}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={0.5}
              strokeDasharray="3 3"
            />
          );
        })}

        {/* 출석률 선 */}
        <polyline
          points={toPoints(attValues)}
          fill="none"
          stroke={COLORS.attendance}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 멤버 수 선 (정규화) */}
        <polyline
          points={toPoints(memberNorm)}
          fill="none"
          stroke={COLORS.member}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 게시글 수 선 (정규화) */}
        <polyline
          points={toPoints(postNorm)}
          fill="none"
          stroke={COLORS.post}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 활동률 선 */}
        <polyline
          points={toPoints(activeValues)}
          fill="none"
          stroke={COLORS.active}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 데이터 포인트 (마지막 포인트만 표시) */}
        {[
          { values: attValues, color: COLORS.attendance },
          { values: memberNorm, color: COLORS.member },
          { values: postNorm, color: COLORS.post },
          { values: activeValues, color: COLORS.active },
        ].map(({ values, color }) => {
          const lastIdx = values.length - 1;
          const x = lastIdx * xStep;
          const y = toY(values[lastIdx], min, max, chartHeight);
          return (
            <circle
              key={color}
              cx={x}
              cy={y}
              r={2.5}
              fill={color}
            />
          );
        })}
      </svg>

      {/* X축 레이블 (월 표시) */}
      <div className="flex justify-between mt-0.5 px-px">
        {snapshots.map((s) => (
          <span key={s.month} className="text-[9px] text-muted-foreground tabular-nums">
            {s.month.slice(5)}월
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 전월 대비 변화 뱃지
// ============================================================

interface ChangeBadgeProps {
  current: number;
  previous: number | null;
  unit?: string;
  isRaw?: boolean; // true이면 raw 숫자 차이, false이면 %p 차이
}

function ChangeBadge({ current, previous, unit = "%", isRaw = false }: ChangeBadgeProps) {
  if (previous === null) {
    return <span className="text-[9px] text-muted-foreground">-</span>;
  }

  const diff = isRaw ? current - previous : current - previous;
  const diffDisplay = isRaw
    ? diff >= 0
      ? `+${diff}${unit}`
      : `${diff}${unit}`
    : diff >= 0
    ? `+${diff.toFixed(0)}${unit}`
    : `${diff.toFixed(0)}${unit}`;

  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-green-600">
        <TrendingUp className="h-2.5 w-2.5" />
        {diffDisplay}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-red-500">
        <TrendingDown className="h-2.5 w-2.5" />
        {diffDisplay}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
      <Minus className="h-2.5 w-2.5" />
      0{unit}
    </span>
  );
}

// ============================================================
// 현재 달 요약 그리드
// ============================================================

interface CurrentSummaryProps {
  current: GroupHealthSnapshot;
  previous: GroupHealthSnapshot | null;
}

function CurrentSummary({ current, previous }: CurrentSummaryProps) {
  const items = [
    {
      label: "출석률",
      value: `${current.attendanceRate}%`,
      color: COLORS.attendance,
      badge: (
        <ChangeBadge
          current={current.attendanceRate}
          previous={previous?.attendanceRate ?? null}
          unit="%p"
        />
      ),
    },
    {
      label: "멤버 수",
      value: `${current.memberCount}명`,
      color: COLORS.member,
      badge: (
        <ChangeBadge
          current={current.memberCount}
          previous={previous?.memberCount ?? null}
          unit="명"
          isRaw
        />
      ),
    },
    {
      label: "게시글",
      value: `${current.postCount}건`,
      color: COLORS.post,
      badge: (
        <ChangeBadge
          current={current.postCount}
          previous={previous?.postCount ?? null}
          unit="건"
          isRaw
        />
      ),
    },
    {
      label: "활동률",
      value: `${current.activeRate}%`,
      color: COLORS.active,
      badge: (
        <ChangeBadge
          current={current.activeRate}
          previous={previous?.activeRate ?? null}
          unit="%p"
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 mt-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded bg-muted/40 px-1 py-1.5 gap-0.5"
        >
          <span
            className="text-[9px] font-medium"
            style={{ color: item.color }}
          >
            {item.label}
          </span>
          <span className="text-xs font-semibold tabular-nums leading-tight">
            {item.value}
          </span>
          {item.badge}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface GroupHealthTrendsCardProps {
  groupId: string;
  defaultOpen?: boolean;
}

export function GroupHealthTrendsCard({
  groupId,
  defaultOpen = false,
}: GroupHealthTrendsCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { snapshots, current, previous, loading } = useGroupHealthSnapshot(groupId);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded border bg-card">
        {/* 헤더 */}
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                그룹 건강도 추이
              </span>
              {!loading && current && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  ({current.month})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!loading && current && (
                <span className="text-[10px] font-semibold text-blue-600 tabular-nums">
                  출석 {current.attendanceRate}%
                </span>
              )}
              {isOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* 펼쳐지는 본문 */}
        <CollapsibleContent>
          <div className="px-3 pb-3">
            {/* 로딩 */}
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <span className="text-xs text-muted-foreground">불러오는 중...</span>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="flex items-center justify-center h-20">
                <span className="text-xs text-muted-foreground">데이터 없음</span>
              </div>
            ) : (
              <>
                {/* 꺾은선 차트 */}
                <HealthLineChart snapshots={snapshots} chartWidth={300} chartHeight={80} />

                {/* 범례 */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {LEGEND_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-1"
                    >
                      <span
                        className="inline-block h-1.5 w-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 현재 달 요약 */}
                {current && (
                  <CurrentSummary current={current} previous={previous} />
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
