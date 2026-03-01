"use client";

import { useState } from "react";
import { subMonths, addMonths } from "date-fns";
import { formatYearMonth } from "@/lib/date-utils";
import {
  Calendar,
  Users,
  FileText,
  Target,
  Wallet,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthlyReport } from "@/hooks/use-monthly-report";

// ============================================
// SVG 링 차트 (출석률 표시용)
// ============================================

interface RingChartProps {
  rate: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

function RingChart({ rate, size = 48, strokeWidth = 4, color = "#22c55e" }: RingChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const progress = Math.min(100, Math.max(0, rate)) / 100;
  const offset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
      aria-hidden="true"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

// ============================================
// 재정 바 차트 (수입/지출 CSS div 기반)
// ============================================

interface FinanceBarProps {
  income: number;
  expense: number;
}

function FinanceBar({ income, expense }: FinanceBarProps) {
  const total = income + expense;
  const incomeWidth = total > 0 ? (income / total) * 100 : 50;
  const expenseWidth = total > 0 ? (expense / total) * 100 : 50;

  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex mt-1.5">
      {total === 0 ? (
        <div className="h-full w-full bg-muted-foreground/20 rounded-full" />
      ) : (
        <>
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${incomeWidth}%` }}
            title={`수입: ${income.toLocaleString("ko-KR")}원`}
          />
          <div
            className="h-full bg-red-400 transition-all duration-500"
            style={{ width: `${expenseWidth}%` }}
            title={`지출: ${expense.toLocaleString("ko-KR")}원`}
          />
        </>
      )}
    </div>
  );
}

// ============================================
// 수치 포맷 유틸
// ============================================

function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR");
}

function amountColor(value: number): string {
  if (value === 0) return "text-muted-foreground";
  if (value < 0) return "text-red-500";
  return "text-foreground";
}

// ============================================
// 카드 스켈레톤
// ============================================

function ReportCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface MonthlyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export function MonthlyReportDialog({
  open,
  onOpenChange,
  groupId,
}: MonthlyReportDialogProps) {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { report, loading } = useMonthlyReport(groupId, year, month);

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  function handlePrev() {
    setSelectedDate((d) => subMonths(d, 1));
  }

  function handleNext() {
    if (!isCurrentMonth) {
      setSelectedDate((d) => addMonths(d, 1));
    }
  }

  const monthLabel = formatYearMonth(selectedDate);

  const isEmpty =
    !loading &&
    report !== null &&
    report.totalSchedules === 0 &&
    report.totalPosts === 0 &&
    report.totalMembers === 0 &&
    report.totalIncome === 0 &&
    report.totalExpense === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            그룹 운영 월별 리포트
          </DialogTitle>
        </DialogHeader>

        {/* 연월 선택 */}
        <div className="flex items-center justify-between px-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold tabular-nums">{monthLabel}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleNext}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 콘텐츠 영역 */}
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <ReportCardSkeleton key={i} />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="py-10 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              해당 월 데이터가 없습니다
            </p>
          </div>
        ) : report ? (
          <div className="grid grid-cols-2 gap-2">
            {/* 일정 카드 */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1 mb-1.5">
                <Calendar className="h-3 w-3 text-blue-500" />
                <span className="text-[10px] text-muted-foreground font-medium">일정</span>
              </div>
              <p className="text-sm font-bold tabular-nums">
                {report.totalSchedules}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">회</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                완료{" "}
                <span className={report.completedSchedules > 0 ? "text-foreground font-medium" : ""}>
                  {report.completedSchedules}
                </span>
                회
              </p>
            </div>

            {/* 출석률 카드 */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1 mb-1.5">
                <Users className="h-3 w-3 text-green-500" />
                <span className="text-[10px] text-muted-foreground font-medium">출석률</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <RingChart rate={report.avgAttendanceRate} />
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-600"
                  >
                    {report.avgAttendanceRate}%
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    출석{" "}
                    <span className={report.totalPresent > 0 ? "text-green-600 font-medium" : ""}>
                      {report.totalPresent}
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    결석{" "}
                    <span className={report.totalAbsent > 0 ? "text-red-500 font-medium" : ""}>
                      {report.totalAbsent}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* 재정 카드 */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1 mb-1.5">
                <Wallet className="h-3 w-3 text-orange-500" />
                <span className="text-[10px] text-muted-foreground font-medium">재정</span>
              </div>
              <p className="text-[10px] text-green-600">
                +{formatAmount(report.totalIncome)}원
              </p>
              <p className="text-[10px] text-red-500">
                -{formatAmount(report.totalExpense)}원
              </p>
              <FinanceBar income={report.totalIncome} expense={report.totalExpense} />
              <p className={`text-[10px] mt-1 font-medium ${amountColor(report.balance)}`}>
                잔액{" "}
                {report.balance >= 0
                  ? `+${formatAmount(report.balance)}`
                  : `-${formatAmount(Math.abs(report.balance))}`}
                원
              </p>
            </div>

            {/* 게시판 카드 */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1 mb-1.5">
                <FileText className="h-3 w-3 text-purple-500" />
                <span className="text-[10px] text-muted-foreground font-medium">게시판</span>
              </div>
              <p className="text-sm font-bold tabular-nums">
                {report.totalPosts}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">개</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                댓글{" "}
                <span className={report.totalComments > 0 ? "text-foreground font-medium" : ""}>
                  {report.totalComments}
                </span>
                개
              </p>
            </div>

            {/* 멤버 카드 */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1 mb-1.5">
                <Users className="h-3 w-3 text-indigo-500" />
                <span className="text-[10px] text-muted-foreground font-medium">멤버</span>
              </div>
              <p className="text-sm font-bold tabular-nums">
                {report.totalMembers}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">명</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                신규{" "}
                <span
                  className={
                    report.newMembers > 0
                      ? "text-indigo-500 font-medium"
                      : ""
                  }
                >
                  {report.newMembers}
                </span>
                명
              </p>
            </div>

            {/* 프로젝트 카드 */}
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1 mb-1.5">
                <Target className="h-3 w-3 text-cyan-500" />
                <span className="text-[10px] text-muted-foreground font-medium">프로젝트</span>
              </div>
              <p className="text-sm font-bold tabular-nums">
                {report.activeProjects}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">진행</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                완료{" "}
                <span
                  className={
                    report.completedProjects > 0
                      ? "text-cyan-600 font-medium"
                      : ""
                  }
                >
                  {report.completedProjects}
                </span>
                개
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
