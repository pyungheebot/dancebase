"use client";

import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Grid3X3, Flame, Target, BarChart3 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAttendanceConsistency } from "@/hooks/use-attendance-consistency";
import type { AttendanceHeatmapCell } from "@/types";

// ============================================
// 색상 헬퍼
// ============================================

function getCellColorClass(cell: AttendanceHeatmapCell): string {
  if (!cell.hasSchedule) return "bg-gray-50 dark:bg-gray-900";
  switch (cell.intensity) {
    case 1:
      return "bg-green-200 dark:bg-green-900";
    case 2:
      return "bg-green-400 dark:bg-green-700";
    case 3:
      return "bg-green-600 dark:bg-green-500";
    default:
      // hasSchedule이지만 intensity 0은 미출석(absent)
      return "bg-green-200 dark:bg-green-900";
  }
}

function getIntensityLabel(cell: AttendanceHeatmapCell): string {
  if (!cell.hasSchedule) return "일정 없음";
  return cell.isPresent ? "출석" : "결석";
}

// ============================================
// 히트맵 셀 컴포넌트
// ============================================

function HeatmapCell({ cell }: { cell: AttendanceHeatmapCell }) {
  const colorClass = getCellColorClass(cell);
  const label = getIntensityLabel(cell);

  let dateLabel = cell.date;
  try {
    const d = parseISO(cell.date);
    dateLabel = format(d, "M월 d일 (EEE)", { locale: ko });
  } catch {
    // 파싱 실패 시 원본 날짜 문자열 사용
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`w-[8px] h-[8px] rounded-[2px] transition-colors ${colorClass}`}
          role="gridcell"
          aria-label={`${cell.date}: ${label}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        <p className="text-xs font-medium">{dateLabel}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================
// 요일 라벨 (월, 수, 금만 표시)
// ============================================

const DOW_LABELS: { index: number; label: string }[] = [
  { index: 0, label: "월" },
  { index: 2, label: "수" },
  { index: 4, label: "금" },
];

// ============================================
// 통계 항목 컴포넌트
// ============================================

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold ml-auto">{value}</span>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

type AttendanceConsistencyCardProps = {
  groupId: string;
  userId: string;
};

export function AttendanceConsistencyCard({
  groupId,
  userId,
}: AttendanceConsistencyCardProps) {
  const { weeks, currentStreak, overallRate, consistencyScore, loading } =
    useAttendanceConsistency(groupId, userId);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-center gap-1.5">
          <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-medium">출석 일관성</h3>
          <span className="text-[10px] text-muted-foreground">최근 12주</span>
        </div>

        {/* 히트맵 그리드 */}
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="최근 12주 출석 히트맵"
        >
          <div className="min-w-max">
            {loading ? (
              /* 로딩 스켈레톤 */
              <div className="flex gap-[3px]">
                {Array.from({ length: 12 }).map((_, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, di) => (
                      <div
                        key={di}
                        className="w-[8px] h-[8px] rounded-[2px] bg-muted animate-pulse"
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-[3px]">
                {/* 좌측 요일 라벨 */}
                <div className="flex flex-col gap-[3px] mr-1">
                  {Array.from({ length: 7 }).map((_, dow) => {
                    const found = DOW_LABELS.find((d) => d.index === dow);
                    return (
                      <div
                        key={dow}
                        className="w-[14px] h-[8px] flex items-center justify-end"
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
                <div
                  className="flex gap-[3px]"
                  role="grid"
                  aria-label="출석 히트맵 그리드"
                >
                  {weeks.map((week, wi) => (
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
            )}
          </div>
        </div>

        {/* 통계 수치 */}
        {!loading && (
          <div className="space-y-1.5">
            <StatItem
              icon={Flame}
              label="연속 출석"
              value={`${currentStreak}일`}
            />
            <StatItem
              icon={Target}
              label="출석률"
              value={`${overallRate}%`}
            />
            <StatItem
              icon={BarChart3}
              label="일관성 점수"
              value={`${consistencyScore}/100`}
            />
          </div>
        )}

        {/* 범례 */}
        <div className="flex items-center gap-1.5 justify-end">
          <span className="text-[9px] text-muted-foreground">적음</span>
          <div className="w-[8px] h-[8px] rounded-[2px] bg-gray-100 dark:bg-gray-800" />
          <div className="w-[8px] h-[8px] rounded-[2px] bg-green-200 dark:bg-green-900" />
          <div className="w-[8px] h-[8px] rounded-[2px] bg-green-400 dark:bg-green-700" />
          <div className="w-[8px] h-[8px] rounded-[2px] bg-green-600 dark:bg-green-500" />
          <span className="text-[9px] text-muted-foreground">많음</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
