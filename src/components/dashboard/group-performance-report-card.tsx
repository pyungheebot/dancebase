"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useGroupPerformanceReport } from "@/hooks/use-group-performance-report";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, BarChart3, Users, Calendar, MessageSquare, DollarSign } from "lucide-react";
import type { ReportMetricItem } from "@/types";

function ChangeIndicator({ metric }: { metric: ReportMetricItem }) {
  const rate = metric.changeRate ?? 0;
  if (rate === 0) return <span className="flex items-center text-xs text-muted-foreground"><Minus className="h-3 w-3 mr-0.5" />±0%</span>;
  if (rate > 0) return <span className="flex items-center text-xs text-green-600"><TrendingUp className="h-3 w-3 mr-0.5" />+{rate}%</span>;
  return <span className="flex items-center text-xs text-red-600"><TrendingDown className="h-3 w-3 mr-0.5" />{rate}%</span>;
}

function MetricBox({ label, value, unit, metric, icon: Icon, color }: {
  label: string;
  value: string | number;
  unit?: string;
  metric: ReportMetricItem;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className={`border rounded-lg p-3 space-y-1 ${color}`}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />{label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <ChangeIndicator metric={metric} />
    </div>
  );
}

export function GroupPerformanceReportCard({ groupId }: { groupId: string }) {
  const { report, loading } = useGroupPerformanceReport(groupId);
  const [open, setOpen] = useState(true);

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">그룹 성과 요약</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-4">데이터를 불러올 수 없습니다.</p></CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold">그룹 성과 요약</CardTitle>
              <Badge variant="secondary" className="text-xs">{report.period}</Badge>
            </div>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MetricBox label="출석률" value={report.attendanceRate.current} unit="%" metric={report.attendanceRate} icon={BarChart3} color="" />
              <MetricBox label="출석 기록" value={report.attendanceCount.current} unit="건" metric={report.attendanceCount} icon={BarChart3} color="" />
              <MetricBox label="게시글" value={report.postCount.current} unit="건" metric={report.postCount} icon={MessageSquare} color="" />
              <MetricBox label="댓글" value={report.commentCount.current} unit="건" metric={report.commentCount} icon={MessageSquare} color="" />
              <MetricBox label="총 멤버" value={report.memberCount.current} unit="명" metric={report.memberCount} icon={Users} color="" />
              <MetricBox label="신규 가입" value={report.newMemberCount.current} unit="명" metric={report.newMemberCount} icon={Users} color="" />
              <MetricBox label="일정" value={report.scheduleCount.current} unit="건" metric={report.scheduleCount} icon={Calendar} color="" />
              <MetricBox label="수입" value={report.totalIncome.current.toLocaleString()} unit="원" metric={report.totalIncome} icon={DollarSign} color="" />
              <MetricBox label="지출" value={report.totalExpense.current.toLocaleString()} unit="원" metric={report.totalExpense} icon={DollarSign} color="" />
            </div>
            {/* 순이익 배너 */}
            <div className={`mt-3 p-3 rounded-lg text-center ${report.netIncome.current >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <span className="text-xs text-muted-foreground">순이익</span>
              <div className={`text-lg font-bold ${report.netIncome.current >= 0 ? "text-green-700" : "text-red-700"}`}>
                {report.netIncome.current >= 0 ? "+" : ""}{report.netIncome.current.toLocaleString()}원
              </div>
              <ChangeIndicator metric={report.netIncome} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
