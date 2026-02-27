"use client";

import { Activity, Users, MessageSquare, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupHealthTrends } from "@/hooks/use-group-health-trends";
import type { HealthMetric } from "@/types/index";

// -----------------------------------------------
// 유틸: 추세 방향 계산
// -----------------------------------------------

type TrendDirection = "up" | "down" | "stable";

function getTrendDirection(trend: number[]): TrendDirection {
  if (trend.length < 2) return "stable";
  const first = trend.slice(0, Math.floor(trend.length / 2));
  const last = trend.slice(Math.floor(trend.length / 2));
  const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
  const lastAvg = last.reduce((a, b) => a + b, 0) / last.length;
  const diff = lastAvg - firstAvg;
  if (diff > 1) return "up";
  if (diff < -1) return "down";
  return "stable";
}

// -----------------------------------------------
// 서브 컴포넌트: 미니 라인 차트 (SVG polyline)
// -----------------------------------------------

interface MiniLineChartProps {
  data: number[];
  width?: number;
  height?: number;
  direction: TrendDirection;
}

function MiniLineChart({
  data,
  width = 80,
  height = 24,
  direction,
}: MiniLineChartProps) {
  if (data.length === 0) return null;

  const paddingX = 2;
  const paddingY = 2;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  // 모든 값이 동일하면 가운데 수평선
  const points = data
    .map((val, i) => {
      const x = paddingX + (i / Math.max(data.length - 1, 1)) * innerWidth;
      const y =
        range === 0
          ? paddingY + innerHeight / 2
          : paddingY + innerHeight - ((val - min) / range) * innerHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const colorMap: Record<TrendDirection, string> = {
    up: "#16a34a",    // green-600
    down: "#ef4444",  // red-500
    stable: "#2563eb", // blue-600
  };

  const strokeColor = colorMap[direction];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 미니 바 차트 (SVG rect)
// -----------------------------------------------

interface MiniBarChartProps {
  data: number[];
  width?: number;
  height?: number;
  direction: TrendDirection;
}

function MiniBarChart({
  data,
  width = 80,
  height = 24,
  direction,
}: MiniBarChartProps) {
  if (data.length === 0) return null;

  const paddingX = 1;
  const paddingY = 2;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY;

  const max = Math.max(...data, 1);
  const barCount = data.length;
  const barGap = 1.5;
  const barWidth = (innerWidth - barGap * (barCount - 1)) / barCount;

  const colorMap: Record<TrendDirection, string> = {
    up: "#16a34a",
    down: "#ef4444",
    stable: "#2563eb",
  };
  const fillColor = colorMap[direction];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="shrink-0"
    >
      {data.map((val, i) => {
        const barH = Math.max(1, (val / max) * innerHeight);
        const x = paddingX + i * (barWidth + barGap);
        const y = height - barH;
        return (
          <rect
            key={i}
            x={x.toFixed(1)}
            y={y.toFixed(1)}
            width={Math.max(barWidth, 1).toFixed(1)}
            height={barH.toFixed(1)}
            fill={fillColor}
            rx="1"
          />
        );
      })}
    </svg>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 변화율 화살표
// -----------------------------------------------

function ChangeArrow({ rate }: { rate: number | null }) {
  if (rate === null) return null;

  if (rate === 0) {
    return (
      <span className="text-[10px] text-muted-foreground tabular-nums">
        ±0%
      </span>
    );
  }

  const isPositive = rate > 0;
  return (
    <span
      className={[
        "text-[10px] font-semibold tabular-nums",
        isPositive ? "text-green-600" : "text-red-500",
      ].join(" ")}
    >
      {isPositive ? "↑" : "↓"} {isPositive ? "+" : ""}
      {rate}%
    </span>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 지표 아이템 (큰 숫자 + 미니 차트)
// -----------------------------------------------

type ChartType = "line" | "bar";

interface HealthMetricItemProps {
  icon: React.ReactNode;
  label: string;
  metric: HealthMetric;
  unit?: string;
  chartType?: ChartType;
}

function HealthMetricItem({
  icon,
  label,
  metric,
  unit = "",
  chartType = "line",
}: HealthMetricItemProps) {
  const direction = getTrendDirection(metric.trend);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
      {/* 레이블 */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium truncate">{label}</span>
      </div>

      {/* 큰 숫자 + 변화율 */}
      <div className="flex items-end justify-between gap-1">
        <span className="text-xl font-bold tabular-nums leading-none">
          {metric.current}
          {unit && (
            <span className="text-sm font-medium text-muted-foreground ml-0.5">
              {unit}
            </span>
          )}
        </span>
        <ChangeArrow rate={metric.changeRate} />
      </div>

      {/* 미니 차트 */}
      <div className="mt-0.5">
        {chartType === "line" ? (
          <MiniLineChart data={metric.trend} direction={direction} />
        ) : (
          <MiniBarChart data={metric.trend} direction={direction} />
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 스켈레톤
// -----------------------------------------------

function HealthTrendSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5"
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------
// 메인 컴포넌트
// -----------------------------------------------

interface GroupHealthTrendCardProps {
  groupId: string;
}

export function GroupHealthTrendCard({ groupId }: GroupHealthTrendCardProps) {
  const { attendanceRate, activityCount, newMemberCount, rsvpRate, loading } =
    useGroupHealthTrends(groupId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Activity className="h-4 w-4" aria-hidden="true" />
          그룹 건강도 트렌드
        </CardTitle>
      </CardHeader>

      <CardContent aria-live="polite" aria-atomic="false">
        {loading ? (
          <HealthTrendSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* 출석률 */}
            <HealthMetricItem
              icon={<Users className="h-3 w-3" />}
              label="출석률"
              metric={attendanceRate}
              unit="%"
              chartType="line"
            />

            {/* 활동도 */}
            <HealthMetricItem
              icon={<MessageSquare className="h-3 w-3" />}
              label="게시판 활동"
              metric={activityCount}
              unit="건"
              chartType="bar"
            />

            {/* 신규 멤버 수 */}
            <HealthMetricItem
              icon={<Users className="h-3 w-3" />}
              label="신규 멤버"
              metric={newMemberCount}
              unit="명"
              chartType="line"
            />

            {/* RSVP 응답률 */}
            <HealthMetricItem
              icon={<CalendarCheck className="h-3 w-3" />}
              label="RSVP 응답률"
              metric={rsvpRate}
              unit="%"
              chartType="line"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
