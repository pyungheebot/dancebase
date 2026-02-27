"use client";

import { useState } from "react";
import {
  Calendar,
  Users,
  FileText,
  MessageSquare,
  UserCheck,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupActivityReport } from "@/hooks/use-group-activity-report";
import type { ActivityReportPeriod, ActivityReportInsight } from "@/types";

// -----------------------------------------------
// 서브 컴포넌트: 기간 토글 버튼 그룹
// -----------------------------------------------

function PeriodToggle({
  value,
  onChange,
}: {
  value: ActivityReportPeriod;
  onChange: (period: ActivityReportPeriod) => void;
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
          {p === "week" ? "이번 주" : "이번 달"}
        </button>
      ))}
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 지표 아이템
// -----------------------------------------------

function MetricItem({
  icon,
  label,
  value,
  formatter,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  formatter?: (v: number) => string;
}) {
  const displayValue = formatter ? formatter(value) : String(value);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <span className="text-xl font-bold tabular-nums leading-none">
        {displayValue}
      </span>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 인사이트 아이템
// -----------------------------------------------

function InsightItem({ insight }: { insight: ActivityReportInsight }) {
  return (
    <li className="flex items-start gap-2">
      <Sparkles
        className={[
          "mt-0.5 h-3 w-3 shrink-0",
          insight.type === "positive" ? "text-yellow-500" : "text-muted-foreground",
        ].join(" ")}
        aria-hidden="true"
      />
      <span className="text-xs text-foreground/80">{insight.message}</span>
    </li>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 스켈레톤
// -----------------------------------------------

function ReportSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5"
          >
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-muted/20 px-3 py-2.5 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

// -----------------------------------------------
// 메인 컴포넌트
// -----------------------------------------------

interface GroupActivityReportCardProps {
  groupId: string;
}

export function GroupActivityReportCard({
  groupId,
}: GroupActivityReportCardProps) {
  const [period, setPeriod] = useState<ActivityReportPeriod>("week");
  const { report, loading } = useGroupActivityReport(groupId, period);

  const periodLabel = period === "week" ? "이번 주" : "이번 달";

  const hasData =
    report &&
    (report.scheduleCount.value > 0 ||
      report.postCount.value > 0 ||
      report.commentCount.value > 0 ||
      report.newMemberCount.value > 0 ||
      report.activeMemberCount.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            그룹 활동 보고서
          </span>
          <PeriodToggle value={period} onChange={setPeriod} />
        </CardTitle>
      </CardHeader>

      <CardContent aria-live="polite" aria-atomic="false">
        {loading ? (
          <ReportSkeleton />
        ) : !hasData ? (
          <p className="text-xs text-muted-foreground py-2">
            {periodLabel} 아직 기록된 활동이 없습니다
          </p>
        ) : (
          <div className="space-y-3">
            {/* 3x2 지표 그리드 */}
            <div className="grid grid-cols-3 gap-2">
              {/* 일정 수 */}
              <MetricItem
                icon={<Calendar className="h-3 w-3" />}
                label="일정"
                value={report.scheduleCount.value}
                formatter={(v) => `${v}회`}
              />

              {/* 출석률 */}
              <MetricItem
                icon={<Users className="h-3 w-3" />}
                label="출석률"
                value={report.attendanceRate.value}
                formatter={(v) => `${v}%`}
              />

              {/* 게시글 수 */}
              <MetricItem
                icon={<FileText className="h-3 w-3" />}
                label="게시글"
                value={report.postCount.value}
                formatter={(v) => `${v}건`}
              />

              {/* 댓글 수 */}
              <MetricItem
                icon={<MessageSquare className="h-3 w-3" />}
                label="댓글"
                value={report.commentCount.value}
                formatter={(v) => `${v}건`}
              />

              {/* 활동 멤버 */}
              <MetricItem
                icon={<UserCheck className="h-3 w-3" />}
                label="활동 멤버"
                value={report.activeMemberCount.value}
                formatter={(v) => `${v}명`}
              />

              {/* 신규 멤버 */}
              <MetricItem
                icon={<UserPlus className="h-3 w-3" />}
                label="신규 멤버"
                value={report.newMemberCount.value}
                formatter={(v) => `${v}명`}
              />
            </div>

            {/* 인사이트 섹션 */}
            {report.insights.length > 0 && (
              <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">
                  인사이트
                </p>
                <ul className="space-y-1.5">
                  {report.insights.map((insight, i) => (
                    <InsightItem key={i} insight={insight} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
