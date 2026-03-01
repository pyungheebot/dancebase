"use client";

import { useState, useId } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useGroupEventCalendar,
  todayYMD,
} from "@/hooks/use-group-event-calendar";
import type { GroupCalendarEvent, GroupEventRsvpStatus } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

import { AddEventDialog } from "./event-calendar-add-dialog";
import { EventItem } from "./event-calendar-event-item";
import { CalendarGrid } from "./event-calendar-grid";
import { StatsBar } from "./event-calendar-stats-bar";
import { UpcomingEventList } from "./event-calendar-upcoming-list";
import { CategoryLegend } from "./event-calendar-legend";

// ============================================================
// 메인 컴포넌트
// ============================================================

type EventCalendarCardProps = {
  groupId: string;
};

export function EventCalendarCard({ groupId }: EventCalendarCardProps) {
  const [open, setOpen] = useState(true);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogDate, setAddDialogDate] = useState(todayYMD());
  const [activeTab, setActiveTab] = useState<"calendar" | "upcoming">(
    "calendar"
  );

  const headingId = useId();
  const liveRegionId = useId();

  const {
    getEventsByMonth,
    getEventsByDate,
    getUpcomingEvents,
    getMyRsvp,
    addEvent,
    deleteEvent,
    setRsvp,
    stats,
  } = useGroupEventCalendar(groupId);

  const monthEvents = getEventsByMonth(viewYear, viewMonth);
  const upcomingEvents = getUpcomingEvents(10);

  // 날짜 → 이벤트 맵
  const eventsByDate = new Map<string, GroupCalendarEvent[]>();
  for (const ev of monthEvents) {
    const arr = eventsByDate.get(ev.date) ?? [];
    arr.push(ev);
    eventsByDate.set(ev.date, arr);
  }

  const selectedEvents = selectedDate ? getEventsByDate(selectedDate) : [];

  // RSVP 맵
  const upcomingRsvpMap = new Map<string, GroupEventRsvpStatus | null>(
    upcomingEvents.map((ev) => [ev.id, getMyRsvp(ev.id)])
  );
  const selectedRsvpMap = new Map<string, GroupEventRsvpStatus | null>(
    selectedEvents.map((ev) => [ev.id, getMyRsvp(ev.id)])
  );

  // ── 월 네비게이션 ──────────────────────────────────────────

  function prevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  // ── 날짜 클릭 ────────────────────────────────────────────

  function handleSelectDate(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  // ── 이벤트 추가 ──────────────────────────────────────────

  function openAddDialog(date?: string) {
    setAddDialogDate(date ?? todayYMD());
    setAddDialogOpen(true);
  }

  // ── 이벤트 삭제 ──────────────────────────────────────────

  function handleDelete(id: string) {
    const ok = deleteEvent(id);
    if (ok) toast.success(TOAST.EVENT_CALENDAR.DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  }

  // ── RSVP ────────────────────────────────────────────────

  function handleRsvp(eventId: string, status: GroupEventRsvpStatus) {
    const ok = setRsvp(eventId, status);
    if (ok) {
      const label =
        status === "참석"
          ? "참석으로"
          : status === "미참석"
            ? "미참석으로"
            : "미정으로";
      toast.success(`${label} 응답했습니다.`);
    } else {
      toast.error(TOAST.EVENT_CALENDAR.RSVP_ERROR);
    }
  }

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="rounded-lg border bg-card">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center gap-1.5 px-3 py-2.5 text-left"
              aria-expanded={open}
              aria-controls={headingId}
            >
              <CalendarDays
                className="h-3.5 w-3.5 text-blue-500 shrink-0"
                aria-hidden="true"
              />
              <span
                id={headingId}
                className="text-xs font-medium flex-1"
              >
                이벤트 캘린더
              </span>

              {stats.thisMonthCount > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0 rounded bg-blue-100 text-blue-700 font-semibold shrink-0"
                  aria-label={`이번달 이벤트 ${stats.thisMonthCount}개`}
                >
                  이번달 {stats.thisMonthCount}개
                </span>
              )}

              {open ? (
                <ChevronDown
                  className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <ChevronRight
                  className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-3 pb-3 pt-0 space-y-3">
              {/* 통계 바 */}
              <StatsBar
                thisMonthCount={stats.thisMonthCount}
                nextEventDday={stats.nextEventDday}
                nextEventTitle={stats.nextEvent?.title ?? null}
              />

              {/* 탭 */}
              <div
                role="tablist"
                aria-label="이벤트 캘린더 탭"
                className="flex items-center gap-1 border-b border-border/40 pb-0"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-calendar"
                  aria-selected={activeTab === "calendar"}
                  aria-controls="tabpanel-calendar"
                  onClick={() => setActiveTab("calendar")}
                  className={cn(
                    "text-xs px-2 py-1.5 border-b-2 transition-colors -mb-px",
                    activeTab === "calendar"
                      ? "border-blue-500 text-blue-600 font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  월별 캘린더
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-upcoming"
                  aria-selected={activeTab === "upcoming"}
                  aria-controls="tabpanel-upcoming"
                  onClick={() => setActiveTab("upcoming")}
                  className={cn(
                    "text-xs px-2 py-1.5 border-b-2 transition-colors -mb-px flex items-center gap-1",
                    activeTab === "upcoming"
                      ? "border-blue-500 text-blue-600 font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  다가오는 이벤트
                  {upcomingEvents.length > 0 && (
                    <span
                      className="text-[10px] px-1 py-0 rounded bg-blue-100 text-blue-600 font-semibold"
                      aria-label={`${upcomingEvents.length}개`}
                    >
                      {upcomingEvents.length}
                    </span>
                  )}
                </button>

                <div className="flex-1" aria-hidden="true" />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 px-2 mb-1"
                  onClick={() => openAddDialog()}
                  aria-label="이벤트 추가"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  추가
                </Button>
              </div>

              {/* 동적 콘텐츠 알림 영역 */}
              <div
                id={liveRegionId}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
              />

              {/* 캘린더 탭 */}
              <div
                id="tabpanel-calendar"
                role="tabpanel"
                aria-labelledby="tab-calendar"
                hidden={activeTab !== "calendar"}
                className={activeTab === "calendar" ? "space-y-3" : undefined}
              >
                {/* 월 네비게이션 */}
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={prevMonth}
                    aria-label="이전 달로 이동"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>

                  <span
                    className="text-xs font-semibold"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {viewYear}년 {viewMonth}월
                    {monthEvents.length > 0 && (
                      <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                        ({monthEvents.length}개)
                      </span>
                    )}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={nextMonth}
                    aria-label="다음 달로 이동"
                  >
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>

                {/* 캘린더 그리드 */}
                <CalendarGrid
                  year={viewYear}
                  month={viewMonth}
                  eventsByDate={eventsByDate}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                />

                {/* 선택된 날짜 이벤트 패널 */}
                {selectedDate && (
                  <section
                    className="space-y-1.5"
                    aria-label={`${formatYearMonthDay(selectedDate)} 이벤트`}
                    aria-live="polite"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground">
                        {formatYearMonthDay(selectedDate)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] gap-1 px-1.5"
                          onClick={() => openAddDialog(selectedDate)}
                          aria-label={`${formatYearMonthDay(selectedDate)}에 이벤트 추가`}
                        >
                          <Plus className="h-2.5 w-2.5" aria-hidden="true" />
                          이벤트 추가
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setSelectedDate(null)}
                          aria-label="날짜 패널 닫기"
                        >
                          <X
                            className="h-3 w-3 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    </div>

                    {selectedEvents.length > 0 ? (
                      <ul
                        className="space-y-1 max-h-56 overflow-y-auto pr-0.5"
                        role="list"
                        aria-label="선택된 날짜의 이벤트 목록"
                      >
                        {selectedEvents.map((ev) => (
                          <li key={ev.id} role="listitem">
                            <EventItem
                              event={ev}
                              myRsvp={selectedRsvpMap.get(ev.id) ?? null}
                              onDelete={handleDelete}
                              onRsvp={handleRsvp}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center py-4 gap-1 text-muted-foreground"
                        role="status"
                      >
                        <CalendarDays className="h-5 w-5" aria-hidden="true" />
                        <p className="text-xs">이날 이벤트가 없습니다</p>
                        <button
                          type="button"
                          className="text-[10px] text-blue-500 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                          onClick={() => openAddDialog(selectedDate)}
                          aria-label={`${formatYearMonthDay(selectedDate)}에 이벤트 추가하기`}
                        >
                          이벤트 추가하기
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {/* 카테고리 범례 */}
                <CategoryLegend />
              </div>

              {/* 다가오는 이벤트 탭 */}
              <div
                id="tabpanel-upcoming"
                role="tabpanel"
                aria-labelledby="tab-upcoming"
                hidden={activeTab !== "upcoming"}
              >
                <UpcomingEventList
                  events={upcomingEvents}
                  myRsvpMap={upcomingRsvpMap}
                  onRsvp={handleRsvp}
                  onDelete={handleDelete}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 이벤트 추가 다이얼로그 */}
      <AddEventDialog
        open={addDialogOpen}
        initialDate={addDialogDate}
        onClose={() => setAddDialogOpen(false)}
        onAdd={(input) => addEvent(input)}
      />
    </>
  );
}
