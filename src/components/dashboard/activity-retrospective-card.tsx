"use client";

import { useState } from "react";
import {
  BarChart2,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useActivityRetrospective } from "@/hooks/use-activity-retrospective";
import type { ActivityRetrospective } from "@/types";

// -----------------------------------------------
// 최근 6개월 옵션 생성
// -----------------------------------------------

function getRecentMonths(count: number): { value: string; label: string }[] {
  const result: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const value = `${year}-${month}`;
    const label = `${year}년 ${d.getMonth() + 1}월`;
    result.push({ value, label });
  }
  return result;
}

// -----------------------------------------------
// 숫자 포매팅
// -----------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount);
}

// -----------------------------------------------
// 통계 셀
// -----------------------------------------------

type StatCellProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  highlight?: "positive" | "negative" | "neutral";
};

function StatCell({ icon, label, value, unit, highlight }: StatCellProps) {
  const valueColor =
    highlight === "positive"
      ? "text-green-600"
      : highlight === "negative"
        ? "text-red-500"
        : "text-foreground";

  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="h-3.5 w-3.5">{icon}</span>
        <span className="text-[11px]">{label}</span>
      </div>
      <div className={`flex items-baseline gap-0.5 font-semibold ${valueColor}`}>
        <span className="text-lg leading-tight">{value}</span>
        {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

// -----------------------------------------------
// 리포트 그리드
// -----------------------------------------------

function ReportGrid({ report }: { report: ActivityRetrospective }) {
  const netProfit = report.totalIncome - report.totalExpense;
  const memberHighlight =
    report.memberGrowth > 0
      ? "positive"
      : report.memberGrowth < 0
        ? "negative"
        : "neutral";
  const profitHighlight =
    netProfit > 0 ? "positive" : netProfit < 0 ? "negative" : "neutral";

  const MemberIcon =
    report.memberGrowth > 0
      ? TrendingUp
      : report.memberGrowth < 0
        ? TrendingDown
        : Minus;

  const memberValue =
    report.memberGrowth > 0
      ? `+${report.memberGrowth}`
      : String(report.memberGrowth);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <StatCell
        icon={<Calendar className="h-3.5 w-3.5" />}
        label="출석률"
        value={`${report.attendanceRate}`}
        unit="%"
        highlight={
          report.attendanceRate >= 70
            ? "positive"
            : report.attendanceRate >= 40
              ? "neutral"
              : "negative"
        }
      />
      <StatCell
        icon={<BarChart2 className="h-3.5 w-3.5" />}
        label="일정 수"
        value={report.totalSchedules}
        unit="건"
      />
      <StatCell
        icon={<FileText className="h-3.5 w-3.5" />}
        label="게시글"
        value={report.totalPosts}
        unit="개"
      />
      <StatCell
        icon={<MessageSquare className="h-3.5 w-3.5" />}
        label="댓글"
        value={report.totalComments}
        unit="개"
      />
      <StatCell
        icon={<MemberIcon className="h-3.5 w-3.5" />}
        label="멤버 증감"
        value={memberValue}
        unit="명"
        highlight={memberHighlight}
      />
      <StatCell
        icon={<Wallet className="h-3.5 w-3.5" />}
        label="순이익"
        value={formatCurrency(netProfit)}
        unit="원"
        highlight={profitHighlight}
      />
    </div>
  );
}

// -----------------------------------------------
// 메인 카드 컴포넌트
// -----------------------------------------------

type ActivityRetrospectiveCardProps = {
  groupId: string;
};

export function ActivityRetrospectiveCard({
  groupId,
}: ActivityRetrospectiveCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const recentMonths = getRecentMonths(6);
  const { reports, generateReport } = useActivityRetrospective(groupId);

  const currentReport = reports.find((r) => r.month === selectedMonth) ?? null;

  const selectedMonthLabel =
    recentMonths.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      await generateReport(selectedMonth);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                활동 회고 리포트
              </CardTitle>
              {currentReport && (
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-0">
                  캐시됨
                </Badge>
              )}
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-3">
            {/* 월 선택 + 생성 버튼 */}
            <div className="flex items-center gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="월 선택" />
                </SelectTrigger>
                <SelectContent>
                  {recentMonths.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {currentReport ? "재생성" : "생성"}
              </Button>
            </div>

            {/* 리포트 표시 */}
            {currentReport ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{selectedMonthLabel} 활동 요약</span>
                  <span className="ml-auto text-[10px]">
                    생성:{" "}
                    {new Date(currentReport.generatedAt).toLocaleDateString(
                      "ko-KR",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )}
                  </span>
                </div>
                <ReportGrid report={currentReport} />
                <div className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                  <span>수입 {formatCurrency(currentReport.totalIncome)}원</span>
                  <span className="text-border">|</span>
                  <span>지출 {formatCurrency(currentReport.totalExpense)}원</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
                <BarChart2 className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  {selectedMonthLabel}의 리포트가 없습니다.
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  생성 버튼을 눌러 데이터를 조회하세요.
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
