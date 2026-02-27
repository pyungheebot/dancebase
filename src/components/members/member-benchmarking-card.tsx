"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, TrendingUp, Users, BarChart3 } from "lucide-react";
import { useMemberBenchmarking } from "@/hooks/use-member-benchmarking";
import type { BenchmarkMetric } from "@/types";

// ============================================================
// 유틸리티
// ============================================================

function getPercentileBadgeClass(percentile: number): string {
  if (percentile <= 20) return "bg-green-100 text-green-700";
  if (percentile <= 50) return "bg-blue-100 text-blue-700";
  if (percentile <= 80) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

function getPercentileLabel(percentile: number): string {
  return `상위 ${percentile}%`;
}

function getDiffLabel(diff: number): string {
  if (diff > 0) return `+${diff}%p`;
  if (diff < 0) return `${diff}%p`;
  return "평균과 동일";
}

function getDiffClass(diff: number): string {
  if (diff > 0) return "text-green-600";
  if (diff < 0) return "text-red-500";
  return "text-muted-foreground";
}

// ============================================================
// 비교 바 (내 위치와 평균 위치 마커)
// ============================================================

function CompareBar({
  myValue,
  avgValue,
}: {
  myValue: number;
  avgValue: number;
}) {
  // 0~100 범위로 클램프
  const myPos = Math.min(100, Math.max(0, myValue));
  const avgPos = Math.min(100, Math.max(0, avgValue));

  return (
    <div className="relative h-2 rounded-full bg-muted mt-2">
      {/* 배경 바 채우기 (내 값까지) */}
      <div
        className="absolute left-0 top-0 h-2 rounded-full bg-blue-200"
        style={{ width: `${myPos}%` }}
        aria-hidden="true"
      />
      {/* 평균 마커 */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-0.5 rounded-full bg-gray-500 z-10"
        style={{ left: `${avgPos}%` }}
        aria-label={`평균 ${avgValue}%`}
      />
      {/* 내 값 마커 */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-1 rounded-full bg-blue-600 z-20"
        style={{ left: `${myPos}%` }}
        aria-label={`내 값 ${myValue}%`}
      />
    </div>
  );
}

// ============================================================
// 단일 지표 아이템
// ============================================================

function MetricSection({
  icon,
  label,
  metric,
  valueLabel,
}: {
  icon: React.ReactNode;
  label: string;
  metric: BenchmarkMetric;
  valueLabel?: string;
}) {
  const badgeClass = getPercentileBadgeClass(metric.percentile);
  const diffClass = getDiffClass(metric.diffFromAverage);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
      {/* 헤더: 아이콘 + 라벨 + 백분위 배지 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[11px] font-medium">{label}</span>
        </div>
        <span
          className={`text-[10px] px-1.5 py-0 rounded-full font-semibold ${badgeClass}`}
        >
          {getPercentileLabel(metric.percentile)}
        </span>
      </div>

      {/* 값 표시: 내 값 (크게) + 평균 (작게) */}
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold tabular-nums">
          {metric.myValue}
          {valueLabel ?? "%"}
        </span>
        <span className="text-[10px] text-muted-foreground">
          평균 {metric.groupAverage}%
        </span>
        <span className={`text-[10px] font-medium ${diffClass} ml-auto`}>
          {getDiffLabel(metric.diffFromAverage)}
        </span>
      </div>

      {/* 비교 바 */}
      <CompareBar myValue={metric.myValue} avgValue={metric.groupAverage} />

      {/* 범례 */}
      <div className="flex items-center gap-3 mt-0.5">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-blue-600" />
          <span className="text-[9px] text-muted-foreground">나</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-0.5 bg-gray-500" />
          <span className="text-[9px] text-muted-foreground">평균</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 스켈레톤
// ============================================================

function MetricSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex items-baseline gap-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full mt-1" />
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function MemberBenchmarkingCard({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {
  const { data, loading } = useMemberBenchmarking(groupId, userId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Award className="h-4 w-4" aria-hidden="true" />
            내 성과 벤치마킹
          </span>
          {!loading && data.hasData && (
            <span className="flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
              <Users className="h-3 w-3" />
              {data.totalMemberCount}명 대비
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent aria-live="polite" aria-atomic="false">
        {loading ? (
          <div className="flex flex-col gap-2">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        ) : !data.hasData ? (
          <p className="text-xs text-muted-foreground py-2">
            벤치마킹 데이터가 없습니다
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 출석률 */}
            <MetricSection
              icon={<BarChart3 className="h-3 w-3" />}
              label="출석률 (최근 30일)"
              metric={data.attendance}
            />

            {/* 활동량 */}
            <MetricSection
              icon={<TrendingUp className="h-3 w-3" />}
              label="활동량 (게시글+댓글)"
              metric={data.activity}
            />

            {/* RSVP 응답률 */}
            <MetricSection
              icon={<Users className="h-3 w-3" />}
              label="RSVP 응답률"
              metric={data.rsvp}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
