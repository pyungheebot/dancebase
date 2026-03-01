"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, FileText, Calendar, Target } from "lucide-react";
import { useMyMonthlySummary } from "@/hooks/use-my-monthly-summary";
import { formatYearMonth } from "@/lib/date-utils";

function MetricItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function AttendanceRateCircle({ rate }: { rate: number }) {
  const colorClass =
    rate >= 90
      ? "text-green-600"
      : rate >= 70
      ? "text-blue-600"
      : "text-red-500";

  return (
    <span className={`text-lg font-bold tabular-nums ${colorClass}`}>
      {rate}%
    </span>
  );
}

function MetricSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-12" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function MyMonthlySummaryCard() {
  const { summary, loading, yearMonth } = useMyMonthlySummary();

  const monthLabel = formatYearMonth(new Date(yearMonth + "-01"));

  const hasActivity =
    summary &&
    (summary.attendance.total > 0 ||
      summary.posts > 0 ||
      summary.comments > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            이번 달 내 활동
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {monthLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent aria-live="polite" aria-atomic="false">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        ) : !hasActivity ? (
          <p className="text-xs text-muted-foreground py-2">
            아직 이번 달 활동이 없습니다
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* 출석률 */}
            <MetricItem
              icon={<BarChart3 className="h-3 w-3" />}
              label="출석률"
            >
              <AttendanceRateCircle rate={summary.attendance.rate} />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                출석 {summary.attendance.present} / 전체{" "}
                {summary.attendance.total}
              </p>
            </MetricItem>

            {/* 게시판 */}
            <MetricItem
              icon={<FileText className="h-3 w-3" />}
              label="게시판"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tabular-nums">
                  {summary.posts}
                </span>
                <span className="text-[10px] text-muted-foreground">글</span>
                <span className="text-lg font-bold tabular-nums">
                  {summary.comments}
                </span>
                <span className="text-[10px] text-muted-foreground">댓글</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                이번 달 작성
              </p>
            </MetricItem>

            {/* RSVP */}
            <MetricItem
              icon={<Calendar className="h-3 w-3" />}
              label="RSVP"
            >
              <span className="text-lg font-bold tabular-nums">
                {summary.rsvp.rate}%
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                응답 {summary.rsvp.responded} / {summary.rsvp.total}
              </p>
            </MetricItem>

            {/* 참석 일정 */}
            <MetricItem
              icon={<Target className="h-3 w-3" />}
              label="참석 일정"
            >
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold tabular-nums">
                  {summary.schedulesAttended}
                </span>
                <span className="text-[10px] text-muted-foreground">회</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                이번 달 출석
              </p>
            </MetricItem>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
