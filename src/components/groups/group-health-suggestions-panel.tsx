"use client";

import { useState } from "react";
import {
  Activity,
  TrendingUp,
  Users,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupHealthSuggestions } from "@/hooks/use-group-health-suggestions";
import type { HealthSuggestion, HealthSuggestionType } from "@/types";

interface GroupHealthSuggestionsPanelProps {
  groupId: string;
}

// -----------------------------------------------
// SVG 원형 차트 (0-100점)
// -----------------------------------------------
interface CircleGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor: string;
}

function CircleGauge({
  score,
  size = 80,
  strokeWidth = 7,
  color,
  trackColor,
}: CircleGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {/* 배경 트랙 */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* 진행 원 — 12시 방향에서 시작하도록 -90deg 회전 */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        fill="none"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// -----------------------------------------------
// 점수 기반 색상 설정
// -----------------------------------------------
function getScoreConfig(score: number | null) {
  if (score === null) {
    return {
      color: "#94a3b8",
      trackColor: "#e2e8f0",
      textColor: "text-slate-500",
      label: "-",
      labelClass: "bg-slate-100 text-slate-600",
    };
  }
  if (score >= 80) {
    return {
      color: "#22c55e",
      trackColor: "#dcfce7",
      textColor: "text-green-600",
      label: "좋음",
      labelClass: "bg-green-100 text-green-700",
    };
  }
  if (score >= 60) {
    return {
      color: "#eab308",
      trackColor: "#fef9c3",
      textColor: "text-yellow-600",
      label: "보통",
      labelClass: "bg-yellow-100 text-yellow-700",
    };
  }
  return {
    color: "#ef4444",
    trackColor: "#fee2e2",
    textColor: "text-red-600",
    label: "주의",
    labelClass: "bg-red-100 text-red-700",
  };
}

// -----------------------------------------------
// 제안 항목 아이콘/색상 설정
// -----------------------------------------------
const SUGGESTION_CONFIG: Record<
  HealthSuggestionType,
  {
    icon: React.ElementType;
    iconClass: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
  }
> = {
  warning: {
    icon: AlertTriangle,
    iconClass: "text-orange-500",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200",
    textClass: "text-orange-800",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    textClass: "text-blue-800",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-green-500",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
    textClass: "text-green-800",
  },
};

// -----------------------------------------------
// 개선 제안 항목 렌더링
// -----------------------------------------------
function SuggestionItem({ suggestion }: { suggestion: HealthSuggestion }) {
  const config = SUGGESTION_CONFIG[suggestion.type];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-2.5 py-2 ${config.bgClass} ${config.borderClass}`}
    >
      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.iconClass}`} />
      <p className={`text-[11px] leading-relaxed flex-1 ${config.textClass}`}>
        {suggestion.message}
      </p>
    </div>
  );
}

// -----------------------------------------------
// 지표 행 (라벨 + 값)
// -----------------------------------------------
function MetricRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className={`text-[10px] font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

// -----------------------------------------------
// 메인 패널 컴포넌트
// -----------------------------------------------
export function GroupHealthSuggestionsPanel({
  groupId,
}: GroupHealthSuggestionsPanelProps) {
  const { data, loading } = useGroupHealthSuggestions(groupId);
  const [collapsed, setCollapsed] = useState(false);

  const scoreConfig = getScoreConfig(data.score);

  // 출석률 표시값
  const attendanceLabel =
    data.attendanceRate !== null
      ? `${Math.round(data.attendanceRate * 100)}%`
      : "-";

  // 주간 활동 표시값
  const activityLabel =
    data.activityWeeklyCount !== null
      ? `주 ${data.activityWeeklyCount.toFixed(1)}회`
      : "-";

  // 비활성 멤버 표시값
  const inactiveLabel =
    data.inactiveMemberRatio !== null
      ? `${Math.round(data.inactiveMemberRatio * 100)}%`
      : "-";

  // 출석률 텍스트 색상
  const attendanceColor =
    data.attendanceRate === null
      ? "text-muted-foreground"
      : data.attendanceRate >= 0.7
      ? "text-green-600"
      : "text-red-600";

  // 주간 활동 텍스트 색상
  const activityColor =
    data.activityWeeklyCount === null
      ? "text-muted-foreground"
      : data.activityWeeklyCount >= 2
      ? "text-green-600"
      : "text-orange-500";

  // 비활성 비율 텍스트 색상
  const inactiveColor =
    data.inactiveMemberRatio === null
      ? "text-muted-foreground"
      : data.inactiveMemberRatio > 0.3
      ? "text-red-600"
      : "text-green-600";

  return (
    <Card className="mb-3">
      <CardHeader className="px-3 py-2.5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">건강도 & 개선 제안</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "펼치기" : "접기"}
          >
            <ChevronDown
              className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200"
              style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
            />
          </Button>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-3 pb-3 pt-2">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data.hasEnoughData ? (
            <div className="flex flex-col items-center justify-center py-4 gap-1.5">
              <TrendingUp className="h-6 w-6 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground text-center">
                아직 데이터가 부족합니다.
              </span>
              <span className="text-[10px] text-muted-foreground/70 text-center">
                일정, 출석, 게시판 활동이 쌓이면 건강도가 측정됩니다.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 원형 차트 + 점수 */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <CircleGauge
                    score={data.score ?? 0}
                    color={scoreConfig.color}
                    trackColor={scoreConfig.trackColor}
                    size={80}
                    strokeWidth={7}
                  />
                  {/* 중앙 점수 텍스트 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className={`text-lg font-bold tabular-nums leading-none ${scoreConfig.textColor}`}
                    >
                      {data.score ?? "-"}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
                      / 100
                    </span>
                  </div>
                </div>

                {/* 지표 요약 */}
                <div className="flex-1 space-y-1.5">
                  {/* 점수 레이블 배지 */}
                  <span
                    className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${scoreConfig.labelClass}`}
                  >
                    {scoreConfig.label}
                  </span>

                  <MetricRow
                    icon={Activity}
                    label="출석률"
                    value={attendanceLabel}
                    color={attendanceColor}
                  />
                  <MetricRow
                    icon={TrendingUp}
                    label="주간 활동"
                    value={activityLabel}
                    color={activityColor}
                  />
                  <MetricRow
                    icon={Users}
                    label="비활성 멤버"
                    value={inactiveLabel}
                    color={inactiveColor}
                  />
                </div>
              </div>

              {/* 구분선 */}
              {data.suggestions.length > 0 && (
                <div className="border-t pt-2.5 space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-medium mb-1.5">
                    개선 제안
                  </p>
                  {data.suggestions.map((suggestion, idx) => (
                    <SuggestionItem key={idx} suggestion={suggestion} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
