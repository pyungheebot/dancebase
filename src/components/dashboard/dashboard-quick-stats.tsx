"use client";

import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardQuickStats } from "@/hooks/use-dashboard-quick-stats";

function QuickStatCard({
  href,
  icon,
  label,
  value,
  valueColor,
  subLabel,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  subLabel?: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="pt-3 pb-3 px-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-muted-foreground">{icon}</span>
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {label}
            </span>
          </div>
          <p className={`text-xl font-bold tabular-nums ${valueColor ?? ""}`}>
            {value}
          </p>
          {subLabel && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {subLabel}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickStatSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="pt-3 pb-3 px-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-7 w-12 mb-1" />
        <Skeleton className="h-2.5 w-10" />
      </CardContent>
    </Card>
  );
}

export function DashboardQuickStats({ groupId }: { groupId: string }) {
  const { stats, loading } = useDashboardQuickStats(groupId);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QuickStatSkeleton />
        <QuickStatSkeleton />
        <QuickStatSkeleton />
        <QuickStatSkeleton />
      </div>
    );
  }

  if (!stats) return null;

  // 출석률 색상 결정
  const attendanceColor =
    stats.avgAttendanceRate >= 80
      ? "text-green-600"
      : stats.avgAttendanceRate >= 50
      ? "text-yellow-600"
      : "text-red-600";

  const AttendanceIcon =
    stats.avgAttendanceRate >= 50 ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5" />
    );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {/* 평균 출석률 */}
      <QuickStatCard
        href={`/groups/${groupId}/attendance`}
        icon={AttendanceIcon}
        label="평균 출석률"
        value={`${stats.avgAttendanceRate}%`}
        valueColor={attendanceColor}
        subLabel="최근 30일"
      />

      {/* 일정 수 */}
      <QuickStatCard
        href={`/groups/${groupId}/schedule`}
        icon={<Calendar className="h-3.5 w-3.5" />}
        label="진행된 일정"
        value={`${stats.totalSchedules}건`}
        subLabel="최근 30일"
      />

      {/* 미납 인원 */}
      <QuickStatCard
        href={`/groups/${groupId}/finance`}
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        label="미납 인원"
        value={`${stats.unpaidMemberCount}명`}
        valueColor={
          stats.unpaidMemberCount === 0 ? "text-green-600" : "text-red-600"
        }
        subLabel="이번 달"
      />

      {/* 이번 달 수입 */}
      <QuickStatCard
        href={`/groups/${groupId}/finance`}
        icon={<Wallet className="h-3.5 w-3.5" />}
        label="이번 달 수입"
        value={`${stats.monthlyIncome.toLocaleString()}원`}
        subLabel="납부 완료"
      />
    </div>
  );
}
