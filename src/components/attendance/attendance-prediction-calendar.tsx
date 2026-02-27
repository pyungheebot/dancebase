"use client";

import { useState } from "react";
import { format, parseISO, isValid, getDay } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAttendancePredictionCalendar } from "@/hooks/use-attendance-prediction-calendar";
import type { PredictionCalendarDay } from "@/types";

// ============================================
// 확률 색상 헬퍼
// ============================================

function getRateBadgeClass(rate: number): string {
  if (rate >= 80)
    return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
  if (rate >= 60)
    return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";
  if (rate >= 40)
    return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400";
}

function getBarColor(rate: number): string {
  if (rate >= 80) return "bg-green-500";
  if (rate >= 60) return "bg-yellow-500";
  if (rate >= 40) return "bg-orange-500";
  return "bg-red-500";
}

// ============================================
// 요일 이름
// ============================================

const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// ============================================
// 달력 셀 컴포넌트
// ============================================

function CalendarCell({ day }: { day: PredictionCalendarDay }) {
  const date = parseISO(day.date);
  const dayNum = isValid(date) ? date.getDate() : 0;
  const hasSchedule = day.scheduleId !== null;

  return (
    <div
      className={`min-h-[64px] p-1 rounded-md border text-center flex flex-col items-center gap-0.5 ${
        hasSchedule
          ? "border-border bg-background"
          : "border-transparent bg-muted/20"
      }`}
    >
      <span className="text-[11px] font-medium text-muted-foreground leading-none mt-0.5">
        {dayNum}
      </span>

      {hasSchedule && (
        <div className="w-full mt-0.5 flex flex-col items-center gap-0.5">
          {/* 일정 제목 */}
          <span
            className="text-[9px] leading-tight text-center line-clamp-2 w-full px-0.5 text-foreground/80"
            title={day.scheduleTitle ?? ""}
          >
            {day.scheduleTitle}
          </span>

          {/* 과거: 실제 출석 결과 */}
          {day.actualStatus !== null && (
            <div className="mt-0.5">
              {day.actualStatus === "present" && (
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
              )}
              {day.actualStatus === "late" && (
                <div className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                  <Check className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                </div>
              )}
              {day.actualStatus === "absent" && (
                <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                  <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>
          )}

          {/* 미래: 예측 확률 배지 */}
          {day.predictedRate !== null && (
            <span
              className={`text-[9px] px-1 py-0 rounded border font-semibold leading-4 ${getRateBadgeClass(
                day.predictedRate
              )}`}
            >
              {day.predictedRate}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 달력 스켈레톤
// ============================================

function CalendarSkeleton() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {DOW_LABELS.map((l) => (
          <div key={l} className="text-center text-[10px] text-muted-foreground py-1">
            {l}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type AttendancePredictionCalendarProps = {
  groupId: string;
  userId: string;
};

export function AttendancePredictionCalendar({
  groupId,
  userId,
}: AttendancePredictionCalendarProps) {
  const [open, setOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return format(now, "yyyy-MM");
  });

  const { data, loading } = useAttendancePredictionCalendar(
    groupId,
    userId,
    currentDate
  );

  // 이전/다음 달 이동
  function goPrevMonth() {
    const [y, m] = currentDate.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    setCurrentDate(format(prev, "yyyy-MM"));
  }

  function goNextMonth() {
    const [y, m] = currentDate.split("-").map(Number);
    const next = new Date(y, m, 1);
    setCurrentDate(format(next, "yyyy-MM"));
  }

  // 달력 첫 번째 날의 요일 계산 (0=일)
  const firstDayOfMonth = isValid(parseISO(`${currentDate}-01`))
    ? getFirstDayOfWeek(currentDate)
    : 0;

  // 달력 총 칸 수 (빈 칸 + 날짜)
  const totalCells = firstDayOfMonth + (data?.days.length ?? 0);
  // 6주 그리드 여부
  const gridRows = Math.ceil(totalCells / 7);

  const monthLabel = isValid(parseISO(`${currentDate}-01`))
    ? format(parseISO(`${currentDate}-01`), "yyyy년 M월", { locale: ko })
    : currentDate;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 pt-3 px-4">
        <button
          type="button"
          className="flex items-center justify-between w-full"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">출석 예측 달력</span>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {open && (
        <CardContent className="px-3 pb-3 space-y-3">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={goPrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium">{monthLabel}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={goNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 달력 본체 */}
          {loading ? (
            <CalendarSkeleton />
          ) : (
            <div className="space-y-1">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1">
                {DOW_LABELS.map((label, i) => (
                  <div
                    key={label}
                    className={`text-center text-[10px] font-medium py-1 ${
                      i === 0
                        ? "text-red-500"
                        : i === 6
                        ? "text-blue-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div
                className="grid grid-cols-7 gap-1"
                style={{ gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))` }}
              >
                {/* 빈 칸 (첫 번째 날 이전) */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[64px]" />
                ))}

                {/* 날짜 셀 */}
                {data?.days.map((day) => (
                  <CalendarCell key={day.date} day={day} />
                ))}
              </div>
            </div>
          )}

          {/* 범례 */}
          {!loading && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 border-t">
              <span className="text-[10px] text-muted-foreground font-medium">예측:</span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1 rounded border bg-green-100 text-green-700 border-green-200 font-semibold">80%+</span>
                <span className="text-[9px] text-muted-foreground">높음</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1 rounded border bg-yellow-100 text-yellow-700 border-yellow-200 font-semibold">60%</span>
                <span className="text-[9px] text-muted-foreground">보통</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1 rounded border bg-orange-100 text-orange-700 border-orange-200 font-semibold">40%</span>
                <span className="text-[9px] text-muted-foreground">낮음</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1 rounded border bg-red-100 text-red-700 border-red-200 font-semibold">&lt;40%</span>
                <span className="text-[9px] text-muted-foreground">매우 낮음</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium ml-2">실제:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-green-600" />
                </div>
                <span className="text-[9px] text-muted-foreground">출석</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-2.5 w-2.5 text-red-600" />
                </div>
                <span className="text-[9px] text-muted-foreground">결석</span>
              </div>
            </div>
          )}

          {/* 요일별 출석 확률 바 차트 */}
          {!loading && data && (
            <div className="space-y-1.5 pt-1 border-t">
              <p className="text-[10px] font-medium text-muted-foreground">
                요일별 출석 확률
              </p>
              <div className="flex items-end gap-1 h-14">
                {data.dayOfWeekRates.map((rate, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-0.5"
                  >
                    <span className="text-[9px] text-muted-foreground tabular-nums leading-none">
                      {rate}%
                    </span>
                    <div className="w-full rounded-sm overflow-hidden bg-muted" style={{ height: "32px" }}>
                      <div
                        className={`w-full rounded-sm transition-all ${getBarColor(rate)}`}
                        style={{
                          height: `${(rate / 100) * 32}px`,
                          marginTop: `${32 - (rate / 100) * 32}px`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-[9px] font-medium leading-none ${
                        i === 0
                          ? "text-red-500"
                          : i === 6
                          ? "text-blue-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {DOW_LABELS[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 전체 출석률 */}
          {!loading && data && (
            <div className="flex items-center justify-between text-xs border-t pt-2">
              <span className="text-muted-foreground">전체 출석률 (최근 12개월)</span>
              <span
                className={`font-semibold tabular-nums ${
                  data.overallRate >= 80
                    ? "text-green-600"
                    : data.overallRate >= 60
                    ? "text-yellow-600"
                    : data.overallRate >= 40
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              >
                {data.overallRate}%
              </span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ============================================
// 첫 번째 날의 요일(0=일) 계산 유틸
// ============================================

function getFirstDayOfWeek(yearMonth: string): number {
  const d = parseISO(`${yearMonth}-01`);
  if (!isValid(d)) return 0;
  return getDay(d);
}
