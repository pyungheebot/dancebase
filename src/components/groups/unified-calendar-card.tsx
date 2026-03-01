"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useUnifiedCalendar,
  UNIFIED_EVENT_TYPE_COLORS,
  UNIFIED_EVENT_TYPE_LABELS,
} from "@/hooks/use-unified-calendar";
import type { UnifiedEventType } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";

import { ALL_TYPES, todayStr } from "./unified-calendar/types";
import { AddEventDialog } from "./unified-calendar/add-event-dialog";
import { MonthGrid } from "./unified-calendar/month-grid";
import { EventRow } from "./unified-calendar/event-row";
import { UpcomingRow } from "./unified-calendar/upcoming-row";

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

interface UnifiedCalendarCardProps {
  groupId: string;
  memberNames: string[];
}

export function UnifiedCalendarCard({
  groupId,
  memberNames,
}: UnifiedCalendarCardProps) {
  const { addEvent, deleteEvent, getByDate, getByMonth, getUpcoming, stats } =
    useUnifiedCalendar(groupId);

  const [open, setOpen] = useState(true);

  // 현재 보기 중인 연/월
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  // 선택된 날짜
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 유형 필터
  const [filterType, setFilterType] = useState<UnifiedEventType | "all">("all");

  // 다이얼로그
  const [showAddDialog, setShowAddDialog] = useState(false);

  // 월간 이벤트
  const monthEvents = getByMonth(viewYear, viewMonth);

  // 선택된 날짜의 이벤트
  const selectedDateEvents = selectedDate ? getByDate(selectedDate) : [];

  // 다가오는 7일 이벤트
  const upcomingEvents = getUpcoming(7);

  // 이전/다음 월 네비게이션
  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    toast.success(TOAST.UNIFIED_CALENDAR.DELETED);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-card px-4 py-2.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-800">
              그룹 캘린더
            </span>
            {stats.totalEvents > 0 && (
              <Badge
                className="bg-blue-100 text-[10px] px-1.5 py-0 text-blue-600 hover:bg-blue-100"
                aria-label={`전체 일정 ${stats.totalEvents}개`}
              >
                총 {stats.totalEvents}개
              </Badge>
            )}
            {stats.upcomingCount > 0 && (
              <Badge
                className="bg-orange-100 text-[10px] px-1.5 py-0 text-orange-600 hover:bg-orange-100"
                aria-label={`7일 내 다가오는 일정 ${stats.upcomingCount}개`}
              >
                7일 내 {stats.upcomingCount}개
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {open && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-2 gap-0.5"
                onClick={() => setShowAddDialog(true)}
                aria-label="일정 추가"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                일정 추가
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-expanded={open}
                aria-controls="unified-calendar-content"
                aria-label={open ? "그룹 캘린더 접기" : "그룹 캘린더 펼치기"}
              >
                {open ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 본문 */}
        <CollapsibleContent id="unified-calendar-content">
          <div className="rounded-b-lg border border-gray-200 bg-card p-4 space-y-4">
            {/* 유형 필터 칩 */}
            <div
              role="radiogroup"
              aria-label="일정 유형 필터"
              className="flex flex-wrap gap-1"
            >
              <button
                type="button"
                role="radio"
                aria-checked={filterType === "all"}
                onClick={() => setFilterType("all")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFilterType("all");
                  }
                }}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  filterType === "all"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                }`}
              >
                전체
                {stats.totalEvents > 0 && (
                  <span className="ml-1 opacity-70" aria-hidden="true">
                    ({stats.totalEvents})
                  </span>
                )}
              </button>
              {ALL_TYPES.map((t) => {
                const count = stats.typeDistribution[t];
                const c = UNIFIED_EVENT_TYPE_COLORS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={filterType === t}
                    onClick={() => setFilterType(t)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setFilterType(t);
                      }
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      filterType === t
                        ? `${c.bg} ${c.text} ${c.border} font-medium`
                        : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                    }`}
                  >
                    {UNIFIED_EVENT_TYPE_LABELS[t]}
                    {count > 0 && (
                      <span className="ml-1 opacity-70" aria-hidden="true">
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between" role="navigation" aria-label="월 탐색">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={prevMonth}
                aria-label="이전 달"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span
                className="text-sm font-semibold"
                aria-live="polite"
                aria-atomic="true"
              >
                {viewYear}년 {viewMonth}월
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={nextMonth}
                aria-label="다음 달"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {/* 월간 캘린더 그리드 */}
            <MonthGrid
              year={viewYear}
              month={viewMonth}
              events={monthEvents}
              selectedDate={selectedDate}
              filterType={filterType}
              onSelectDate={handleSelectDate}
            />

            {/* 선택된 날짜의 이벤트 목록 */}
            {selectedDate && (
              <section aria-labelledby="selected-date-heading">
                <div className="flex items-center justify-between mb-2">
                  <h3
                    id="selected-date-heading"
                    className="text-xs font-semibold text-gray-700"
                  >
                    <time dateTime={selectedDate}>
                      {formatMonthDay(selectedDate)}
                    </time>{" "}
                    일정
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 gap-0.5"
                    onClick={() => setShowAddDialog(true)}
                    aria-label={`${formatMonthDay(selectedDate)} 일정 추가`}
                  >
                    <Plus className="h-2.5 w-2.5" aria-hidden="true" />
                    추가
                  </Button>
                </div>

                {selectedDateEvents.length === 0 ? (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="py-4 flex flex-col items-center gap-1.5 text-muted-foreground"
                  >
                    <CalendarCheck className="h-6 w-6 opacity-30" aria-hidden="true" />
                    <p className="text-xs">이 날 등록된 일정이 없습니다.</p>
                  </div>
                ) : (
                  <div role="list" className="space-y-1.5">
                    {selectedDateEvents.map((e) => (
                      <EventRow
                        key={e.id}
                        event={e}
                        onDelete={() => handleDeleteEvent(e.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 다가오는 일정 */}
            <section aria-labelledby="upcoming-heading">
              <h3
                id="upcoming-heading"
                className="text-xs font-semibold text-gray-700 mb-2"
              >
                다가오는 7일 일정
              </h3>
              {upcomingEvents.length === 0 ? (
                <div className="py-4 flex flex-col items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-6 w-6 opacity-30" aria-hidden="true" />
                  <p className="text-xs">다가오는 일정이 없습니다.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                    일정 추가
                  </Button>
                </div>
              ) : (
                <div
                  role="list"
                  className="rounded border bg-muted/10 px-2"
                  aria-label="다가오는 7일 일정 목록"
                >
                  {upcomingEvents.map((e) => (
                    <UpcomingRow key={e.id} event={e} />
                  ))}
                </div>
              )}
            </section>

            {/* 하단 통계 요약 */}
            {stats.totalEvents > 0 && (
              <dl
                className="pt-2 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground"
                aria-label="일정 통계"
              >
                <div className="flex gap-1">
                  <dt>전체</dt>
                  <dd>
                    <strong className="text-foreground">
                      {stats.totalEvents}
                    </strong>
                    개
                  </dd>
                </div>
                <div className="flex gap-1">
                  <dt>이번 달</dt>
                  <dd>
                    <strong className="text-foreground">
                      {stats.thisMonthCount}
                    </strong>
                    개
                  </dd>
                </div>
                {Object.entries(stats.typeDistribution)
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => (
                    <div key={type} className="flex gap-1">
                      <dt>{UNIFIED_EVENT_TYPE_LABELS[type as UnifiedEventType]}</dt>
                      <dd>
                        <strong className="text-foreground">{count}</strong>개
                      </dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 이벤트 추가 다이얼로그 */}
      <AddEventDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={addEvent}
        memberNames={memberNames}
        defaultDate={selectedDate ?? todayStr()}
      />
    </>
  );
}
