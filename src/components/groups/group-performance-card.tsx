"use client";

import { useState } from "react";
import {
  Calendar,
  Users,
  MessageSquare,
  UserPlus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useGroupPerformanceSnapshot } from "@/hooks/use-group-performance-snapshot";
import type { PerformancePeriod, PerformanceMetric, TopContributor } from "@/types";

// -----------------------------------------------
// 서브 컴포넌트: 기간 토글 버튼 그룹
// -----------------------------------------------

function PeriodToggle({
  value,
  onChange,
}: {
  value: PerformancePeriod;
  onChange: (period: PerformancePeriod) => void;
}) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      {(["week", "month"] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={[
            "px-2.5 py-0.5 text-[11px] font-medium transition-colors",
            value === p
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted",
          ].join(" ")}
        >
          {p === "week" ? "주간" : "월간"}
        </button>
      ))}
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 변화율 배지
// -----------------------------------------------

function ChangeRateBadge({ rate }: { rate: number | null }) {
  if (rate === null) return null;

  const isPositive = rate > 0;
  const isZero = rate === 0;

  if (isZero) {
    return (
      <span className="text-[10px] text-muted-foreground tabular-nums">±0%</span>
    );
  }

  return (
    <span
      className={[
        "flex items-center gap-0.5 text-[10px] font-medium tabular-nums",
        isPositive ? "text-green-600" : "text-red-500",
      ].join(" ")}
    >
      {isPositive ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      {isPositive ? "+" : ""}
      {rate}%
    </span>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 지표 카드 아이템
// -----------------------------------------------

function MetricItem({
  icon,
  label,
  metric,
  valueFormatter,
}: {
  icon: React.ReactNode;
  label: string;
  metric: PerformanceMetric;
  valueFormatter?: (v: number) => string;
}) {
  const formatted = valueFormatter
    ? valueFormatter(metric.value)
    : String(metric.value);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-1">
        <span className="text-lg font-bold tabular-nums leading-none">
          {formatted}
        </span>
        <ChangeRateBadge rate={metric.changeRate} />
      </div>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 최고 기여자 칩
// -----------------------------------------------

function TopContributorChip({
  contributor,
  period,
}: {
  contributor: TopContributor;
  period: PerformancePeriod;
}) {
  const initial = contributor.name.charAt(0).toUpperCase();
  const periodLabel = period === "week" ? "이번 주" : "이번 달";

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
      {/* 아바타 */}
      <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
        {contributor.avatarUrl ? (
          <Image
            src={contributor.avatarUrl}
            alt={contributor.name}
            width={28}
            height={28}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-[11px] font-bold text-primary">{initial}</span>
        )}
      </div>
      {/* 이름 + 설명 */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate">{contributor.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {periodLabel} 최고 기여자
        </p>
      </div>
      {/* 활동 수 */}
      <div className="shrink-0 flex items-center gap-1">
        <span className="text-xs font-bold tabular-nums text-primary">
          {contributor.activityCount}
        </span>
        <span className="text-[10px] text-muted-foreground">활동</span>
      </div>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 스켈레톤
// -----------------------------------------------

function SnapshotSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

// -----------------------------------------------
// 메인 컴포넌트
// -----------------------------------------------

interface GroupPerformanceCardProps {
  groupId: string;
}

export function GroupPerformanceCard({ groupId }: GroupPerformanceCardProps) {
  const [period, setPeriod] = useState<PerformancePeriod>("week");
  const { snapshot, loading } = useGroupPerformanceSnapshot(groupId, period);

  const hasData =
    snapshot &&
    (snapshot.scheduleCount.value > 0 ||
      snapshot.attendanceRate.value > 0 ||
      snapshot.contentCount.value > 0 ||
      snapshot.newMemberCount.value > 0);

  const periodLabel = period === "week" ? "이번 주" : "이번 달";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            그룹 성과 스냅샷
          </span>
          <PeriodToggle value={period} onChange={setPeriod} />
        </CardTitle>
      </CardHeader>

      <CardContent aria-live="polite" aria-atomic="false">
        {loading ? (
          <SnapshotSkeleton />
        ) : !hasData ? (
          <p className="text-xs text-muted-foreground py-2">
            {periodLabel} 아직 기록된 활동이 없습니다
          </p>
        ) : (
          <div>
            {/* 2x2 지표 그리드 */}
            <div className="grid grid-cols-2 gap-2">
              {/* 일정 수 */}
              <MetricItem
                icon={<Calendar className="h-3 w-3" />}
                label="일정 수"
                metric={snapshot.scheduleCount}
                valueFormatter={(v) => `${v}회`}
              />

              {/* 출석률 */}
              <MetricItem
                icon={<Users className="h-3 w-3" />}
                label="평균 출석률"
                metric={snapshot.attendanceRate}
                valueFormatter={(v) => `${v}%`}
              />

              {/* 게시글 + 댓글 */}
              <MetricItem
                icon={<MessageSquare className="h-3 w-3" />}
                label="게시글+댓글"
                metric={snapshot.contentCount}
                valueFormatter={(v) => `${v}건`}
              />

              {/* 새 멤버 */}
              <MetricItem
                icon={<UserPlus className="h-3 w-3" />}
                label="새 멤버"
                metric={snapshot.newMemberCount}
                valueFormatter={(v) => `${v}명`}
              />
            </div>

            {/* 최고 기여자 */}
            {snapshot.topContributor && (
              <TopContributorChip
                contributor={snapshot.topContributor}
                period={period}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
