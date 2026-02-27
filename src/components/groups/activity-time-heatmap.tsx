"use client";

import { useState } from "react";
import { Grid3X3, Clock, Zap, Sun, ChevronDown, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActivityTimeHeatmap } from "@/hooks/use-activity-time-heatmap";
import { TIME_SLOTS, DAY_OF_WEEK_LABELS, type TimeSlot, type ActivityTimeCell } from "@/types";

// ============================================
// 색상 헬퍼
// ============================================

function getCellColorClass(intensity: ActivityTimeCell["intensity"]): string {
  switch (intensity) {
    case 1:
      return "bg-blue-200 dark:bg-blue-900";
    case 2:
      return "bg-blue-400 dark:bg-blue-700";
    case 3:
      return "bg-blue-600 dark:bg-blue-500";
    case 4:
      return "bg-blue-800 dark:bg-blue-300";
    default:
      return "bg-gray-100 dark:bg-gray-800";
  }
}

// ============================================
// 히트맵 셀 컴포넌트
// ============================================

function HeatmapCell({ cell }: { cell: ActivityTimeCell }) {
  const colorClass = getCellColorClass(cell.intensity);
  const dayLabel = DAY_OF_WEEK_LABELS[cell.dayOfWeek];
  const slotInfo = TIME_SLOTS.find((s) => s.key === cell.timeSlot);
  const slotLabel = slotInfo ? `${slotInfo.label}(${slotInfo.range})` : cell.timeSlot;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`w-8 h-8 rounded-md transition-colors cursor-default ${colorClass}`}
          role="gridcell"
          aria-label={`${dayLabel}요일 ${slotLabel}: 활동 ${cell.count}건`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        <p className="text-xs font-medium">
          {dayLabel}요일 {slotLabel}
        </p>
        <p className="text-[10px] text-muted-foreground">활동 {cell.count}건</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================
// 슬롯 라벨 포매터
// ============================================

function formatSlotLabel(dayOfWeek: number, timeSlot: TimeSlot): string {
  const day = DAY_OF_WEEK_LABELS[dayOfWeek];
  const slotInfo = TIME_SLOTS.find((s) => s.key === timeSlot);
  return `${day}요일 ${slotInfo?.label ?? timeSlot}`;
}

// ============================================
// 범례 컴포넌트
// ============================================

function HeatmapLegend() {
  const steps: Array<{ intensity: ActivityTimeCell["intensity"]; label: string }> = [
    { intensity: 0, label: "없음" },
    { intensity: 1, label: "적음" },
    { intensity: 2, label: "보통" },
    { intensity: 3, label: "많음" },
    { intensity: 4, label: "매우 많음" },
  ];

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-muted-foreground">활동</span>
      {steps.map(({ intensity, label }) => (
        <Tooltip key={intensity}>
          <TooltipTrigger asChild>
            <div
              className={`w-3.5 h-3.5 rounded-[3px] ${getCellColorClass(intensity)}`}
            />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={4}>
            <span className="text-[10px]">{label}</span>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// ============================================
// 로딩 스켈레톤
// ============================================

function HeatmapSkeleton() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 7 }).map((_, ri) => (
        <div key={ri} className="flex gap-1.5">
          <div className="w-5 h-8 rounded bg-muted animate-pulse" />
          {Array.from({ length: 4 }).map((_, ci) => (
            <div key={ci} className="w-8 h-8 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type ActivityTimeHeatmapProps = {
  groupId: string;
};

export function ActivityTimeHeatmap({ groupId }: ActivityTimeHeatmapProps) {
  const [open, setOpen] = useState(true);
  const { cells, busiestSlot, quietestSlot, hasData, loading } =
    useActivityTimeHeatmap(groupId);

  // 요일 순서를 월~일(1~6, 0) 순으로 재배열
  const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-lg border bg-card p-3 space-y-3">
        {/* 카드 헤더 — Collapsible */}
        <button
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium flex-1">멤버 활동 시간대</span>
          <span className="text-[10px] text-muted-foreground mr-1">최근 3개월</span>
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>

        {open && (
          <>
            {loading ? (
              <HeatmapSkeleton />
            ) : !hasData ? (
              /* 데이터 없음 */
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <p className="text-xs">아직 활동 데이터가 없습니다.</p>
              </div>
            ) : (
              <>
                {/* 히트맵 그리드 */}
                <div role="region" aria-label="멤버 활동 시간대 히트맵">
                  {/* 열 헤더 (시간대 라벨) */}
                  <div className="flex gap-1.5 mb-1 ml-6">
                    {TIME_SLOTS.map((slot) => (
                      <div
                        key={slot.key}
                        className="w-8 text-center text-[9px] text-muted-foreground leading-none"
                      >
                        <span className="block font-medium">{slot.label}</span>
                        <span className="block text-[8px]">{slot.range}</span>
                      </div>
                    ))}
                  </div>

                  {/* 행: 요일 라벨 + 셀 */}
                  <div className="space-y-1.5" role="grid">
                    {DOW_ORDER.map((dow) => {
                      const rowCells = TIME_SLOTS.map((slot) =>
                        cells.find(
                          (c) => c.dayOfWeek === dow && c.timeSlot === slot.key
                        ) ?? {
                          dayOfWeek: dow,
                          timeSlot: slot.key as TimeSlot,
                          count: 0,
                          intensity: 0 as const,
                        }
                      );

                      return (
                        <div key={dow} className="flex items-center gap-1.5" role="row">
                          {/* 요일 라벨 */}
                          <div className="w-5 flex items-center justify-end">
                            <span className="text-[10px] text-muted-foreground leading-none">
                              {DAY_OF_WEEK_LABELS[dow]}
                            </span>
                          </div>
                          {/* 시간대 셀 4개 */}
                          {rowCells.map((cell) => (
                            <HeatmapCell
                              key={`${dow}-${cell.timeSlot}`}
                              cell={cell}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 인사이트 */}
                <div className="space-y-1 pt-1 border-t">
                  {busiestSlot && (
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-blue-500 shrink-0" />
                      <span className="text-[10px] text-muted-foreground">가장 활발</span>
                      <span className="text-xs font-semibold ml-auto">
                        {formatSlotLabel(busiestSlot.dayOfWeek, busiestSlot.timeSlot)}
                      </span>
                    </div>
                  )}
                  {quietestSlot && (
                    <div className="flex items-center gap-1.5">
                      <Sun className="h-3 w-3 text-yellow-500 shrink-0" />
                      <span className="text-[10px] text-muted-foreground">추천 일정 시간</span>
                      <span className="text-xs font-semibold ml-auto">
                        {formatSlotLabel(quietestSlot.dayOfWeek, quietestSlot.timeSlot)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 범례 */}
                <div className="flex justify-end">
                  <HeatmapLegend />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
