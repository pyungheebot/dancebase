"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberEngagementForecast } from "@/hooks/use-member-engagement-forecast";
import type {
  MemberEngagementForecast,
  MemberEngagementLevel,
} from "@/types";

// ============================================
// Props
// ============================================

type MemberEngagementForecastCardProps = {
  groupId: string;
};

// ============================================
// 상수: 관여도 수준별 스타일
// ============================================

const LEVEL_CONFIG: Record<
  MemberEngagementLevel,
  {
    label: string;
    sectionBg: string;
    sectionBorder: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    barColor: string;
    dotColor: string;
    titleColor: string;
  }
> = {
  high: {
    label: "고관여",
    sectionBg: "bg-green-50/60",
    sectionBorder: "border-green-200",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    badgeBorder: "border-green-300",
    barColor: "bg-green-500",
    dotColor: "bg-green-500",
    titleColor: "text-green-700",
  },
  medium: {
    label: "중관여",
    sectionBg: "bg-blue-50/60",
    sectionBorder: "border-blue-200",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-300",
    barColor: "bg-blue-500",
    dotColor: "bg-blue-500",
    titleColor: "text-blue-700",
  },
  low: {
    label: "저관여",
    sectionBg: "bg-orange-50/60",
    sectionBorder: "border-orange-200",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    badgeBorder: "border-orange-300",
    barColor: "bg-orange-400",
    dotColor: "bg-orange-400",
    titleColor: "text-orange-700",
  },
  risk: {
    label: "이탈 위험",
    sectionBg: "bg-red-50/60",
    sectionBorder: "border-red-200",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    badgeBorder: "border-red-300",
    barColor: "bg-red-500",
    dotColor: "bg-red-500",
    titleColor: "text-red-700",
  },
};

// ============================================
// 관여도 바 컴포넌트
// ============================================

function EngagementBar({
  score,
  level,
}: {
  score: number;
  level: MemberEngagementLevel;
}) {
  const config = LEVEL_CONFIG[level];
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${config.barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold tabular-nums shrink-0 ${config.titleColor}`}>
        {score}
      </span>
    </div>
  );
}

// ============================================
// 추세 화살표 컴포넌트
// ============================================

function TrendIcon({
  trend,
}: {
  trend: "improving" | "declining" | "stable";
}) {
  if (trend === "improving") {
    return <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />;
  }
  if (trend === "declining") {
    return <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />;
  }
  return <Minus className="h-3 w-3 text-gray-400 shrink-0" />;
}

// ============================================
// 개별 멤버 행
// ============================================

function MemberForecastRow({ forecast }: { forecast: MemberEngagementForecast }) {
  const config = LEVEL_CONFIG[forecast.level];

  return (
    <div className="px-3 py-2 flex flex-col gap-1">
      {/* 이름 + level 배지 + trend 화살표 */}
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`}
        />
        <span className="text-xs font-medium text-gray-800 flex-1 min-w-0 truncate">
          {forecast.displayName}
        </span>
        <TrendIcon trend={forecast.trend} />
        <Badge
          className={`text-[9px] px-1.5 py-0 border shrink-0 ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
        >
          {config.label}
        </Badge>
      </div>

      {/* 관여도 바 */}
      <EngagementBar score={forecast.engagementScore} level={forecast.level} />

      {/* 보조 정보: 출석률 + 게시글/댓글 */}
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] text-gray-400">
          출석 <span className="font-medium text-gray-600">{forecast.recentAttendanceRate}%</span>
        </span>
        <span className="text-[10px] text-gray-300">·</span>
        <span className="text-[10px] text-gray-400">
          게시글 <span className="font-medium text-gray-600">{forecast.postCount}</span>
        </span>
        <span className="text-[10px] text-gray-300">·</span>
        <span className="text-[10px] text-gray-400">
          댓글 <span className="font-medium text-gray-600">{forecast.commentCount}</span>
        </span>
      </div>
    </div>
  );
}

// ============================================
// 등급별 섹션 컴포넌트
// ============================================

function LevelSection({
  level,
  forecasts,
}: {
  level: MemberEngagementLevel;
  forecasts: MemberEngagementForecast[];
}) {
  const config = LEVEL_CONFIG[level];

  if (forecasts.length === 0) return null;

  return (
    <div className={`rounded-md border ${config.sectionBorder} overflow-hidden`}>
      {/* 섹션 헤더 */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 ${config.sectionBg}`}>
        <span className={`text-[11px] font-semibold ${config.titleColor}`}>
          {config.label}
        </span>
        <Badge
          className={`text-[9px] px-1.5 py-0 border ml-auto ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
        >
          {forecasts.length}명
        </Badge>
      </div>

      {/* 멤버 목록 */}
      <div className="divide-y divide-gray-100">
        {forecasts.map((f) => (
          <MemberForecastRow key={f.userId} forecast={f} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 상단 요약 배지 목록
// ============================================

function SummaryBadges({
  riskCount,
  lowCount,
  mediumCount,
  highCount,
}: {
  riskCount: number;
  lowCount: number;
  mediumCount: number;
  highCount: number;
}) {
  const items: { level: MemberEngagementLevel; count: number }[] = [
    { level: "risk", count: riskCount },
    { level: "low", count: lowCount },
    { level: "medium", count: mediumCount },
    { level: "high", count: highCount },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {items.map(({ level, count }) => {
        const cfg = LEVEL_CONFIG[level];
        return (
          <Badge
            key={level}
            className={`text-[9px] px-1.5 py-0 border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
          >
            {cfg.label} {count}
          </Badge>
        );
      })}
    </div>
  );
}

// ============================================
// 스켈레톤
// ============================================

function ForecastSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5 px-2 py-2 rounded-md border border-gray-100">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-24 flex-1" />
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function MemberEngagementForecastCard({
  groupId,
}: MemberEngagementForecastCardProps) {
  const [open, setOpen] = useState(false);
  const { data, loading } = useMemberEngagementForecast(groupId);

  const hasRisk = data.riskCount > 0 || data.lowCount > 0;

  // 헤더 색상: 이탈 위험 멤버 있으면 빨간색, 저관여 있으면 주황색, 없으면 파란색
  const headerBorderColor = data.riskCount > 0
    ? "border-red-200"
    : data.lowCount > 0
      ? "border-orange-200"
      : "border-blue-200";

  const headerBg = data.riskCount > 0
    ? "bg-red-50/60"
    : data.lowCount > 0
      ? "bg-orange-50/40"
      : "bg-blue-50/40";

  const titleColor = data.riskCount > 0
    ? "text-red-800"
    : data.lowCount > 0
      ? "text-orange-800"
      : "text-blue-800";

  const iconColor = data.riskCount > 0
    ? "text-red-500"
    : data.lowCount > 0
      ? "text-orange-500"
      : "text-blue-500";

  const chevronColor = iconColor;

  // 등급별 멤버 그룹핑 (정렬은 훅에서 이미 완료)
  const byLevel: Record<MemberEngagementLevel, MemberEngagementForecast[]> = {
    risk: data.forecasts.filter((f) => f.level === "risk"),
    low: data.forecasts.filter((f) => f.level === "low"),
    medium: data.forecasts.filter((f) => f.level === "medium"),
    high: data.forecasts.filter((f) => f.level === "high"),
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-card mt-4 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-32" />
          <div className="ml-auto flex gap-1">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        </div>
        <ForecastSkeleton />
      </div>
    );
  }

  // 멤버 없음
  if (data.totalCount === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={`rounded-lg border mt-4 overflow-hidden ${
          hasRisk ? headerBorderColor : "border-blue-200"
        }`}
      >
        {/* 카드 헤더 (Collapsible 트리거) */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full flex items-center justify-between px-3 py-2.5 h-auto rounded-none hover:opacity-90 text-left ${
              hasRisk ? headerBg : "bg-blue-50/40"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <BarChart2
                className={`h-4 w-4 shrink-0 ${iconColor}`}
              />
              <span className={`text-xs font-semibold ${titleColor}`}>
                멤버 관여도 예측
              </span>
              <SummaryBadges
                riskCount={data.riskCount}
                lowCount={data.lowCount}
                mediumCount={data.mediumCount}
                highCount={data.highCount}
              />
            </div>

            {open ? (
              <ChevronUp className={`h-3.5 w-3.5 shrink-0 ${chevronColor}`} />
            ) : (
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 ${chevronColor}`} />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* 펼쳐진 내용 */}
        <CollapsibleContent>
          <div className="border-t border-gray-100 p-3 space-y-2">
            {/* 위험 우선: risk → low → medium → high */}
            {(["risk", "low", "medium", "high"] as MemberEngagementLevel[]).map(
              (level) => (
                <LevelSection
                  key={level}
                  level={level}
                  forecasts={byLevel[level]}
                />
              )
            )}

            {/* 전체 멤버 수 + 추세 범례 */}
            <div className="pt-1 border-t border-gray-100 space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <Users className="h-3 w-3" />
                <span>전체 {data.totalCount}명 분석 · 최근 90일 기준</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <span className="font-semibold text-green-600">고관여</span> 75+ ·{" "}
                <span className="font-semibold text-blue-600">중관여</span> 50~74 ·{" "}
                <span className="font-semibold text-orange-600">저관여</span> 25~49 ·{" "}
                <span className="font-semibold text-red-600">이탈 위험</span> 0~24
                &nbsp;(출석 50%·게시글 30%·댓글 20%)
              </p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  개선
                </span>
                <span className="flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  하락
                </span>
                <span className="flex items-center gap-0.5">
                  <Minus className="h-3 w-3 text-gray-400" />
                  안정
                </span>
                <span className="text-gray-300 ml-0.5">(30일 출석률 변화 기준)</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
