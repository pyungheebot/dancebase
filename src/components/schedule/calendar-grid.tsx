"use client";

import { memo } from "react";
import { isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, format } from "date-fns";
import { formatShortDateTime } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Pencil, RefreshCw, AlertTriangle } from "lucide-react";
import { AttendancePredictionBadge } from "./attendance-prediction-card";
import { ScheduleBadge } from "./schedule-badge";
import type { Schedule } from "@/types";

const MAX_VISIBLE_EVENTS = 2;

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

type CalendarGridProps = {
  // 현재 표시 중인 월
  currentMonth: Date;
  // 전체 일정 목록
  schedules: Schedule[];
  // 충돌하는 일정 ID 집합
  conflictingIds: Set<string>;
  // 그룹 ID (출석 예측 뱃지 표시용)
  groupId?: string;
  // 편집 권한 여부
  canEdit?: boolean;
  // 스와이프 핸들러 (터치 이벤트)
  swipeHandlers: Record<string, (e: React.TouchEvent) => void>;
  // 일정 클릭 → 상세 열기
  onOpenDetail: (schedule: Schedule) => void;
  // "+N개" 더보기 클릭 → 오버플로우 다이얼로그 열기
  onOpenOverflow: (day: Date) => void;
  // 수정 버튼 클릭
  onEditClick: (schedule: Schedule) => void;
  // 다가오는 일정 항목 클릭
  onSelectSchedule?: (schedule: Schedule) => void;
};

// 월간 캘린더 그리드 컴포넌트
export const CalendarGrid = memo(function CalendarGrid({
  currentMonth,
  schedules,
  conflictingIds,
  groupId,
  canEdit,
  swipeHandlers,
  onOpenDetail,
  onOpenOverflow,
  onEditClick,
  onSelectSchedule,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSchedulesForDay = (day: Date) =>
    schedules.filter((s) => isSameDay(new Date(s.starts_at), day));

  // 다가오는 일정 (현재 시각 이후, 최대 5개)
  const upcomingSchedules = schedules
    .filter((s) => new Date(s.starts_at) >= new Date())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 5);

  return (
    <>
      {/* 월간 캘린더 그리드 */}
      <div
        className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden"
        {...swipeHandlers}
      >
        {/* 요일 헤더 */}
        {WEEK_DAYS.map((day) => (
          <div key={day} className="bg-muted px-1 py-0.5 text-center text-[10px] font-medium">
            {day}
          </div>
        ))}

        {/* 날짜 셀 */}
        {days.map((day) => {
          const daySchedules = getSchedulesForDay(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(day, new Date());
          const visibleSchedules = daySchedules.slice(0, MAX_VISIBLE_EVENTS);
          const hiddenCount = daySchedules.length - MAX_VISIBLE_EVENTS;

          return (
            <div
              key={day.toISOString()}
              className={`bg-background px-0.5 md:px-1 py-0.5 min-h-12 md:min-h-16 ${!isCurrentMonth ? "opacity-40" : ""}`}
            >
              <span
                className={`text-[10px] md:text-[11px] leading-tight ${isToday ? "bg-primary text-primary-foreground rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-[9px] md:text-[10px]" : ""}`}
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-px">
                {visibleSchedules.map((schedule) => (
                  <ScheduleBadge
                    key={schedule.id}
                    schedule={schedule}
                    onClick={() => onOpenDetail(schedule)}
                  />
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => onOpenOverflow(day)}
                    className="w-full text-left"
                  >
                    <span className="text-[8px] md:text-[9px] text-muted-foreground hover:text-foreground px-0.5 md:px-1">
                      +{hiddenCount}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 다가오는 일정 리스트 */}
      <div>
        <h4 className="text-xs font-medium mb-1.5">다가오는 일정</h4>
        {upcomingSchedules.map((schedule) => (
          <div key={schedule.id} className="flex items-center gap-1 mb-1">
            <button
              className="flex-1 text-left rounded border px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
              onClick={() => onSelectSchedule?.(schedule)}
            >
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium">{schedule.title}</p>
                {schedule.recurrence_id && (
                  <RefreshCw className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                )}
                {conflictingIds.has(schedule.id) && (
                  <AlertTriangle
                    className="h-3 w-3 text-yellow-500 shrink-0"
                    aria-label="다른 일정과 시간이 겹칩니다"
                  />
                )}
                {groupId && (
                  <AttendancePredictionBadge
                    groupId={groupId}
                    scheduleId={schedule.id}
                  />
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatShortDateTime(new Date(schedule.starts_at))}
                </span>
                {schedule.location && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {schedule.location}
                  </span>
                )}
              </div>
            </button>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onEditClick(schedule)}
                aria-label={`${schedule.title} 일정 수정`}
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        {upcomingSchedules.length === 0 && (
          <p className="text-[11px] text-muted-foreground">예정된 일정이 없습니다</p>
        )}
      </div>
    </>
  );
});
