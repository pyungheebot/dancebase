"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CalendarDays,
  Star,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAttendanceTimeAnalysis } from "@/hooks/use-attendance-time-analysis";
import type { AttendanceTimeSlot } from "@/types";

// ---- 헬퍼 ----

const SLOT_COLOR: Record<AttendanceTimeSlot, string> = {
  morning: "bg-amber-100 text-amber-800 border-amber-200",
  afternoon: "bg-sky-100 text-sky-800 border-sky-200",
  evening: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const SLOT_BAR_COLOR: Record<AttendanceTimeSlot, string> = {
  morning: "bg-amber-400",
  afternoon: "bg-sky-400",
  evening: "bg-indigo-500",
};

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function rateToHeatColor(rate: number, hasData: boolean): string {
  if (!hasData) return "bg-muted/30";
  if (rate >= 85) return "bg-green-500";
  if (rate >= 70) return "bg-green-400";
  if (rate >= 55) return "bg-green-300";
  if (rate >= 40) return "bg-yellow-300";
  if (rate >= 20) return "bg-orange-300";
  return "bg-red-300";
}

type Props = {
  groupId: string;
};

export function AttendanceTimeAnalysisCard({ groupId }: Props) {
  const [open, setOpen] = useState(true);
  const [period, setPeriod] = useState<"last30days" | "all">("last30days");

  const { data, loading } = useAttendanceTimeAnalysis(groupId, period);

  // 베스트 조합 레이블
  const bestLabel = (() => {
    if (!data?.bestCombination) return null;
    const { slot, dayIndex } = data.bestCombination;
    const slotMeta = data.timeSlots.find((s) => s.slot === slot);
    return `${DAY_LABELS[dayIndex]}요일 ${slotMeta?.label ?? ""}`;
  })();

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">출석 시간대 분석</span>
          {bestLabel && (
            <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200">
              <Star className="h-3 w-3 mr-0.5" />
              추천: {bestLabel}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 기간 토글 */}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant={period === "last30days" ? "default" : "outline"}
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => setPeriod("last30days")}
            >
              최근 30일
            </Button>
            <Button
              variant={period === "all" ? "default" : "outline"}
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => setPeriod("all")}
            >
              전체
            </Button>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* 바디 */}
      {open && (
        <div className="px-4 pb-4 space-y-5 border-t pt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.totalSchedules === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {period === "last30days"
                  ? "최근 30일 내 일정 데이터가 없습니다."
                  : "분석할 일정 데이터가 없습니다."}
              </p>
            </div>
          ) : (
            <>
              {/* 요약 정보 */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                <span>
                  총 {data.totalSchedules}개 일정 분석
                  {period === "last30days" ? " (최근 30일)" : " (전체 기간)"}
                </span>
              </div>

              {/* 시간대별 3칸 그리드 */}
              <section>
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    시간대별 출석률
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {data.timeSlots.map((slot) => {
                    const isBest = data.bestSlot === slot.slot;
                    return (
                      <div
                        key={slot.slot}
                        className={cn(
                          "relative rounded-md border p-3 flex flex-col gap-1",
                          isBest ? "ring-2 ring-green-400 ring-offset-1" : ""
                        )}
                      >
                        {isBest && (
                          <Star className="absolute top-2 right-2 h-3 w-3 text-green-500" />
                        )}
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              SLOT_COLOR[slot.slot]
                            )}
                          >
                            {slot.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {slot.range}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-xl font-bold">
                            {slot.scheduleCount > 0 ? `${slot.rate}%` : "-"}
                          </span>
                        </div>
                        {/* 바 */}
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              SLOT_BAR_COLOR[slot.slot]
                            )}
                            style={{ width: `${slot.rate}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {slot.scheduleCount > 0
                            ? `일정 ${slot.scheduleCount}개`
                            : "데이터 없음"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 요일별 히트맵 */}
              <section>
                <div className="flex items-center gap-1.5 mb-2">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    요일별 출석률
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {data.daysOfWeek.map((day) => {
                    const isBest = data.bestDay === day.dayIndex;
                    const hasData = day.scheduleCount > 0;
                    return (
                      <div
                        key={day.dayIndex}
                        className="flex flex-col items-center gap-1"
                      >
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            isBest ? "text-green-600" : "text-muted-foreground"
                          )}
                        >
                          {day.dayLabel}
                        </span>
                        <div
                          className={cn(
                            "w-full aspect-square rounded-md flex items-center justify-center",
                            rateToHeatColor(day.rate, hasData),
                            isBest ? "ring-2 ring-green-400" : ""
                          )}
                          title={
                            hasData
                              ? `${day.dayLabel}요일: 출석률 ${day.rate}% (일정 ${day.scheduleCount}개)`
                              : `${day.dayLabel}요일: 데이터 없음`
                          }
                        >
                          <span
                            className={cn(
                              "text-[10px] font-semibold",
                              hasData ? "text-white drop-shadow-sm" : "text-muted-foreground/50"
                            )}
                          >
                            {hasData ? `${day.rate}` : "-"}
                          </span>
                        </div>
                        {hasData && (
                          <span className="text-[9px] text-muted-foreground">
                            {day.scheduleCount}건
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* 범례 */}
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <span className="text-[9px] text-muted-foreground">낮음</span>
                  {["bg-red-300", "bg-orange-300", "bg-yellow-300", "bg-green-300", "bg-green-400", "bg-green-500"].map(
                    (c, i) => (
                      <div key={i} className={cn("w-3 h-3 rounded-sm", c)} />
                    )
                  )}
                  <span className="text-[9px] text-muted-foreground">높음</span>
                </div>
              </section>

              {/* 추천 배지 영역 */}
              {(data.bestSlot || data.bestDay !== null || bestLabel) && (
                <section className="rounded-md bg-green-50 border border-green-100 px-3 py-2.5 flex flex-wrap gap-2 items-center">
                  <Star className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span className="text-xs font-medium text-green-800">
                    최적 시간대 추천
                  </span>
                  {data.bestSlot && (() => {
                    const meta = data.timeSlots.find((s) => s.slot === data.bestSlot);
                    return (
                      <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-200">
                        {meta?.label} ({meta?.range}) {meta?.rate}%
                      </Badge>
                    );
                  })()}
                  {data.bestDay !== null && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-sky-100 text-sky-800 border-sky-200">
                      {DAY_LABELS[data.bestDay]}요일{" "}
                      {data.daysOfWeek[data.bestDay]?.rate}%
                    </Badge>
                  )}
                  {bestLabel && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200">
                      추천 조합: {bestLabel}
                    </Badge>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
