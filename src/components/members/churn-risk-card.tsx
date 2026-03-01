"use client";

import { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingDown,
  MessageSquareOff,
  CalendarX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useChurnRiskDetection } from "@/hooks/use-churn-risk-detection";
import type { ChurnRiskEntry, ChurnRiskFactor, ChurnRiskLevel } from "@/types";

// ============================================
// Props
// ============================================

type ChurnRiskCardProps = {
  groupId: string;
};

// ============================================
// 상수: 위험 등급별 스타일
// ============================================

const LEVEL_CONFIG: Record<
  ChurnRiskLevel,
  {
    label: string;
    icon: React.ElementType;
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
  critical: {
    label: "긴급",
    icon: AlertCircle,
    sectionBg: "bg-red-50/60",
    sectionBorder: "border-red-200",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    badgeBorder: "border-red-300",
    barColor: "bg-red-500",
    dotColor: "bg-red-500",
    titleColor: "text-red-700",
  },
  risk: {
    label: "위험",
    icon: AlertTriangle,
    sectionBg: "bg-orange-50/60",
    sectionBorder: "border-orange-200",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    badgeBorder: "border-orange-300",
    barColor: "bg-orange-500",
    dotColor: "bg-orange-500",
    titleColor: "text-orange-700",
  },
  caution: {
    label: "주의",
    icon: ShieldAlert,
    sectionBg: "bg-yellow-50/60",
    sectionBorder: "border-yellow-200",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-700",
    badgeBorder: "border-yellow-300",
    barColor: "bg-yellow-400",
    dotColor: "bg-yellow-400",
    titleColor: "text-yellow-700",
  },
  safe: {
    label: "안전",
    icon: ShieldCheck,
    sectionBg: "bg-green-50/40",
    sectionBorder: "border-green-200",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    badgeBorder: "border-green-300",
    barColor: "bg-green-400",
    dotColor: "bg-green-400",
    titleColor: "text-green-700",
  },
};

// ============================================
// 위험 요인 라벨 매핑
// ============================================

const FACTOR_CONFIG: Record<
  ChurnRiskFactor,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  low_attendance: {
    label: "출석 저하",
    icon: TrendingDown,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  inactive_days: {
    label: "장기 미활동",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  no_board_activity: {
    label: "게시판 0건",
    icon: MessageSquareOff,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  low_rsvp: {
    label: "RSVP 미응답",
    icon: CalendarX,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
};

// ============================================
// 위험 점수 바 컴포넌트
// ============================================

function RiskScoreBar({
  score,
  level,
}: {
  score: number;
  level: ChurnRiskLevel;
}) {
  const config = LEVEL_CONFIG[level];
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className="flex items-center gap-2 mt-1">
      {/* 바 */}
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${config.barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* 점수 */}
      <span className={`text-[10px] font-bold tabular-nums shrink-0 ${config.titleColor}`}>
        {score}
      </span>
    </div>
  );
}

// ============================================
// 요인 태그 컴포넌트
// ============================================

function FactorTag({ factor }: { factor: ChurnRiskFactor }) {
  const cfg = FACTOR_CONFIG[factor];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      <Icon className={`h-2.5 w-2.5 ${cfg.color}`} />
      {cfg.label}
    </span>
  );
}

// ============================================
// 개별 멤버 행
// ============================================

function MemberRiskRow({ entry }: { entry: ChurnRiskEntry }) {
  const config = LEVEL_CONFIG[entry.riskLevel];

  return (
    <div className="px-3 py-2 flex flex-col gap-1">
      {/* 이름 + 등급 배지 */}
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`}
        />
        <span className="text-xs font-medium text-gray-800 flex-1 min-w-0 truncate">
          {entry.name}
        </span>
        <Badge
          className={`text-[9px] px-1.5 py-0 border shrink-0 ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
        >
          {entry.riskScore}점
        </Badge>
      </div>

      {/* 위험 점수 바 */}
      <RiskScoreBar score={entry.riskScore} level={entry.riskLevel} />

      {/* 요인 태그 */}
      {entry.factors.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {entry.factors.map((factor) => (
            <FactorTag key={factor} factor={factor} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 등급별 섹션 컴포넌트
// ============================================

function LevelSection({
  level,
  entries,
}: {
  level: ChurnRiskLevel;
  entries: ChurnRiskEntry[];
}) {
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;

  if (entries.length === 0) return null;

  return (
    <div className={`rounded-md border ${config.sectionBorder} overflow-hidden`}>
      {/* 섹션 헤더 */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 ${config.sectionBg}`}>
        <Icon className={`h-3.5 w-3.5 ${config.titleColor} shrink-0`} />
        <span className={`text-[11px] font-semibold ${config.titleColor}`}>
          {config.label}
        </span>
        <Badge
          className={`text-[9px] px-1.5 py-0 border ml-auto ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
        >
          {entries.length}명
        </Badge>
      </div>

      {/* 멤버 목록 */}
      <div className="divide-y divide-gray-100">
        {entries.map((entry) => (
          <MemberRiskRow key={entry.userId} entry={entry} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 안전 멤버 접힌 섹션 (숫자만 표시)
// ============================================

function SafeMembersCollapsed({ count }: { count: number }) {
  const config = LEVEL_CONFIG.safe;
  const Icon = config.icon;

  if (count === 0) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md border ${config.sectionBorder} ${config.sectionBg}`}
    >
      <Icon className={`h-3.5 w-3.5 ${config.titleColor} shrink-0`} />
      <span className={`text-[11px] font-medium ${config.titleColor}`}>
        안전 멤버
      </span>
      <Badge
        className={`text-[9px] px-1.5 py-0 border ml-1 ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
      >
        {count}명
      </Badge>
      <span className="text-[10px] text-gray-400 ml-auto">이탈 위험 없음</span>
    </div>
  );
}

// ============================================
// 상단 요약 배지 목록
// ============================================

function SummaryBadges({
  criticalCount,
  riskCount,
  cautionCount,
  safeCount,
}: {
  criticalCount: number;
  riskCount: number;
  cautionCount: number;
  safeCount: number;
}) {
  const items: { level: ChurnRiskLevel; count: number }[] = [
    { level: "critical", count: criticalCount },
    { level: "risk", count: riskCount },
    { level: "caution", count: cautionCount },
    { level: "safe", count: safeCount },
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

function ChurnRiskSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-1.5 px-2 py-2 rounded-md border border-gray-100">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-24 flex-1" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex gap-1">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function ChurnRiskCard({ groupId }: ChurnRiskCardProps) {
  const [open, setOpen] = useState(false);
  const { data, loading } = useChurnRiskDetection(groupId);

  const hasAtRisk =
    data.criticalCount > 0 || data.riskCount > 0 || data.cautionCount > 0;

  const headerBorderColor =
    data.criticalCount > 0
      ? "border-red-200"
      : data.riskCount > 0
        ? "border-orange-200"
        : "border-yellow-200";

  const headerBg =
    data.criticalCount > 0
      ? "bg-red-50/60"
      : data.riskCount > 0
        ? "bg-orange-50/60"
        : "bg-yellow-50/40";

  const titleColor =
    data.criticalCount > 0
      ? "text-red-800"
      : data.riskCount > 0
        ? "text-orange-800"
        : "text-yellow-800";

  const chevronColor =
    data.criticalCount > 0
      ? "text-red-500"
      : data.riskCount > 0
        ? "text-orange-500"
        : "text-yellow-500";

  const iconColor =
    data.criticalCount > 0
      ? "text-red-500"
      : data.riskCount > 0
        ? "text-orange-500"
        : "text-yellow-500";

  // 로딩 상태
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-card mt-4 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-28" />
          <div className="ml-auto flex gap-1">
            <Skeleton className="h-4 w-10 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
        </div>
        <ChurnRiskSkeleton />
      </div>
    );
  }

  // 멤버 없음
  if (data.totalCount === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={`rounded-lg border mt-4 overflow-hidden ${
          hasAtRisk ? headerBorderColor : "border-green-200"
        }`}
      >
        {/* 카드 헤더 (Collapsible 트리거) */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full flex items-center justify-between px-3 py-2.5 h-auto rounded-none hover:opacity-90 text-left ${
              hasAtRisk ? headerBg : "bg-green-50/40"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <AlertTriangle
                className={`h-4 w-4 shrink-0 ${
                  hasAtRisk ? iconColor : "text-green-500"
                }`}
              />
              <span
                className={`text-xs font-semibold ${
                  hasAtRisk ? titleColor : "text-green-800"
                }`}
              >
                이탈 위험 감지
              </span>
              <SummaryBadges
                criticalCount={data.criticalCount}
                riskCount={data.riskCount}
                cautionCount={data.cautionCount}
                safeCount={data.safeCount}
              />
            </div>

            {open ? (
              <ChevronUp
                className={`h-3.5 w-3.5 shrink-0 ${
                  hasAtRisk ? chevronColor : "text-green-500"
                }`}
              />
            ) : (
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 ${
                  hasAtRisk ? chevronColor : "text-green-500"
                }`}
              />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* 펼쳐진 내용 */}
        <CollapsibleContent>
          <div className="border-t border-gray-100 p-3 space-y-2">
            {/* 긴급 → 위험 → 주의 순서 */}
            {(["critical", "risk", "caution"] as ChurnRiskLevel[]).map((level) => (
              <LevelSection
                key={level}
                level={level}
                entries={data.byLevel[level]}
              />
            ))}

            {/* 안전 멤버 (접힌 상태, 숫자만) */}
            <SafeMembersCollapsed count={data.safeCount} />

            {/* 범례 */}
            <div className="pt-1 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <span className="font-semibold text-red-600">긴급</span> 80+ ·{" "}
                <span className="font-semibold text-orange-600">위험</span> 60~79 ·{" "}
                <span className="font-semibold text-yellow-600">주의</span> 30~59 ·{" "}
                <span className="font-semibold text-green-600">안전</span> 0~29
                &nbsp;(출석·활동·게시판·RSVP 기준)
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
