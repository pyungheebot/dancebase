"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { formatKo } from "@/lib/date-utils";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useYearlySchedules, type DayCell } from "@/hooks/use-yearly-schedules";
import type { Schedule } from "@/types";

// 일정 수에 따른 색상 클래스 반환
function getCellColor(count: number, inYear: boolean): string {
  if (!inYear) return "bg-transparent";
  if (count === 0) return "bg-muted hover:bg-muted/80";
  if (count === 1) return "bg-green-200 hover:bg-green-300 dark:bg-green-900 dark:hover:bg-green-800";
  if (count === 2) return "bg-green-400 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600";
  return "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400";
}

// 셀 클릭 시 일정 Popover
function DayCellPopover({
  cell,
  children,
}: {
  cell: DayCell;
  children: React.ReactNode;
}) {
  if (!cell.inYear || cell.schedules.length === 0) return <>{children}</>;

  const date = new Date(cell.date + "T00:00:00");

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        side="top"
        align="center"
        sideOffset={6}
      >
        <p className="text-xs font-medium mb-2">
          {formatKo(date, "M월 d일 (EEE)")}
          <span className="ml-1.5 text-muted-foreground">
            {cell.schedules.length}개 일정
          </span>
        </p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {cell.schedules.map((schedule: Schedule) => (
            <div
              key={schedule.id}
              className="flex flex-col rounded border px-2 py-1.5 bg-muted/50"
            >
              <p className="text-xs font-medium truncate">{schedule.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {format(new Date(schedule.starts_at), "HH:mm")}
                {" ~ "}
                {format(new Date(schedule.ends_at), "HH:mm")}
              </p>
              {schedule.location && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {schedule.location}
                </p>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// 개별 히트맵 셀
function HeatmapCell({ cell }: { cell: DayCell }) {
  const colorClass = getCellColor(cell.count, cell.inYear);

  const cellElement = (
    <div
      className={`w-[10px] h-[10px] rounded-[2px] transition-colors cursor-default ${colorClass} ${
        cell.inYear && cell.count > 0 ? "cursor-pointer" : ""
      }`}
      role={cell.inYear ? "gridcell" : "presentation"}
      aria-label={
        cell.inYear
          ? `${cell.date}: ${cell.count}개 일정`
          : undefined
      }
    />
  );

  if (!cell.inYear) return cellElement;

  // inYear이지만 일정이 없으면 Tooltip만
  if (cell.count === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`w-[10px] h-[10px] rounded-[2px] transition-colors ${colorClass}`}
            role="gridcell"
            aria-label={`${cell.date}: 일정 없음`}
          />
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={4}>
          <p className="text-xs">
            {formatKo(new Date(cell.date + "T00:00:00"), "M월 d일 (EEE)")}
          </p>
          <p className="text-[10px] text-muted-foreground">일정 없음</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // 일정이 있으면 Tooltip + Popover 조합
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DayCellPopover cell={cell}>
          <div
            className={`w-[10px] h-[10px] rounded-[2px] transition-colors cursor-pointer ${colorClass}`}
            role="gridcell"
            aria-label={`${cell.date}: ${cell.count}개 일정`}
          />
        </DayCellPopover>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        <p className="text-xs">
          {formatKo(new Date(cell.date + "T00:00:00"), "M월 d일 (EEE)")}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {cell.count}개 일정 · 클릭하여 보기
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

type ScheduleYearlyCalendarProps = {
  groupId: string;
};

// 요일 라벨 (월, 수, 금만 표시)
const DOW_LABELS: { index: number; label: string }[] = [
  { index: 1, label: "월" },
  { index: 3, label: "수" },
  { index: 5, label: "금" },
];

export function ScheduleYearlyCalendar({
  groupId,
}: ScheduleYearlyCalendarProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, loading } = useYearlySchedules(groupId, year);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-medium">{year}년 활동 현황</h3>
            {!loading && (
              <span className="text-[10px] text-muted-foreground">
                총 {data.totalCount}개 일정
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => setYear((y) => y - 1)}
              disabled={year <= currentYear - 5}
              aria-label="이전 연도"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2"
              onClick={() => setYear(currentYear)}
              disabled={year === currentYear}
              aria-label="올해로 이동"
            >
              올해
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= currentYear}
              aria-label="다음 연도"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 히트맵 그리드 */}
        <div
          ref={scrollRef}
          className="overflow-x-auto pb-1"
          aria-label={`${year}년 일정 히트맵`}
          role="region"
        >
          <div className="min-w-max">
            {loading ? (
              // 로딩 스켈레톤
              <div className="flex gap-[3px]">
                {Array.from({ length: 53 }).map((_, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, di) => (
                      <div
                        key={di}
                        className="w-[10px] h-[10px] rounded-[2px] bg-muted animate-pulse"
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-[3px]">
                {/* 좌측 요일 라벨 */}
                <div className="flex flex-col gap-[3px] mr-1">
                  {/* 월 라벨 공간 확보 (14px) */}
                  <div className="h-[14px]" />
                  {Array.from({ length: 7 }).map((_, dow) => {
                    const found = DOW_LABELS.find((d) => d.index === dow);
                    return (
                      <div
                        key={dow}
                        className="w-[16px] h-[10px] flex items-center justify-end"
                      >
                        {found ? (
                          <span className="text-[9px] text-muted-foreground leading-none">
                            {found.label}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* 주별 컬럼 */}
                <div className="flex flex-col">
                  {/* 월 라벨 행 */}
                  <div className="flex gap-[3px] mb-[3px] h-[14px]">
                    {data.weeks.map((_, wi) => {
                      const label = data.monthLabels.find(
                        (ml) => ml.weekIndex === wi
                      );
                      return (
                        <div
                          key={wi}
                          className="w-[10px] flex items-start overflow-visible"
                        >
                          {label ? (
                            <span
                              className="text-[9px] text-muted-foreground leading-none whitespace-nowrap"
                              style={{ width: 0 }}
                            >
                              {label.label}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {/* 그리드 본체 (주 x 요일) */}
                  <div
                    className="flex gap-[3px]"
                    role="grid"
                    aria-label={`${year}년 일정 그리드`}
                  >
                    {data.weeks.map((week, wi) => (
                      <div
                        key={wi}
                        className="flex flex-col gap-[3px]"
                        role="row"
                      >
                        {week.map((cell, di) => (
                          <HeatmapCell key={`${wi}-${di}`} cell={cell} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 범례 */}
        <div className="flex items-center gap-1.5 justify-end">
          <span className="text-[9px] text-muted-foreground">적음</span>
          <div className="w-[10px] h-[10px] rounded-[2px] bg-muted" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-green-200 dark:bg-green-900" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-green-400 dark:bg-green-700" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-green-600 dark:bg-green-500" />
          <span className="text-[9px] text-muted-foreground">많음</span>
        </div>

        {/* 월별 요약 Badge */}
        {!loading && data.totalCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 12 }, (_, m) => {
              const monthStr = String(m + 1).padStart(2, "0");
              const prefix = `${year}-${monthStr}-`;
              const count = Object.entries(data.countByDate).reduce(
                (acc, [key, val]) =>
                  key.startsWith(prefix) ? acc + val : acc,
                0
              );
              if (count === 0) return null;
              return (
                <Badge
                  key={m}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {m + 1}월 {count}개
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
