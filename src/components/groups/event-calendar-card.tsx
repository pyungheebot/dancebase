"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  MapPin,
  Clock,
  X,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useGroupEventCalendar,
  GROUP_EVENT_CATEGORIES,
  GROUP_EVENT_CATEGORY_COLORS,
  RSVP_STATUS_COLORS,
  calcDday,
  formatDday,
  todayYMD,
} from "@/hooks/use-group-event-calendar";
import type {
  GroupCalendarEvent,
  GroupEventCategory,
  GroupEventRsvpStatus,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const RSVP_OPTIONS: {
  status: GroupEventRsvpStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    status: "참석",
    label: "참석",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  {
    status: "미참석",
    label: "미참석",
    icon: <XCircle className="h-3 w-3" />,
  },
  {
    status: "미정",
    label: "미정",
    icon: <HelpCircle className="h-3 w-3" />,
  },
];

// ============================================================
// 날짜 헬퍼
// ============================================================

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDateKo(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

// ============================================================
// 이벤트 도트
// ============================================================

function EventDots({ events }: { events: GroupCalendarEvent[] }) {
  const unique = Array.from(
    new Set(events.map((e) => e.category))
  ).slice(0, 3);
  return (
    <div className="flex items-center justify-center gap-0.5 mt-0.5">
      {unique.map((cat) => (
        <span
          key={cat}
          className={cn(
            "inline-block rounded-full w-1 h-1",
            GROUP_EVENT_CATEGORY_COLORS[cat].dot
          )}
        />
      ))}
    </div>
  );
}

// ============================================================
// 이벤트 아이템
// ============================================================

function EventItem({
  event,
  myRsvp,
  onDelete,
  onRsvp,
}: {
  event: GroupCalendarEvent;
  myRsvp: GroupEventRsvpStatus | null;
  onDelete: (id: string) => void;
  onRsvp: (id: string, status: GroupEventRsvpStatus) => void;
}) {
  const colors = GROUP_EVENT_CATEGORY_COLORS[event.category];
  const dday = calcDday(event.date);
  const isPast = dday < 0;

  // RSVP 집계
  const attendCount = event.rsvps.filter((r) => r.status === "참석").length;
  const notAttendCount = event.rsvps.filter(
    (r) => r.status === "미참석"
  ).length;

  return (
    <div
      className={cn(
        "rounded px-2 py-2 flex flex-col gap-1.5 group",
        colors.bg,
        isPast && "opacity-60"
      )}
    >
      {/* 상단: 배지 + 제목 + D-day + 삭제 */}
      <div className="flex items-start gap-1.5">
        <span
          className={cn(
            "text-[10px] px-1.5 py-0 rounded font-medium shrink-0 mt-0.5",
            colors.badge
          )}
        >
          {event.category}
        </span>
        <p className="text-xs font-medium text-foreground flex-1 truncate">
          {event.title}
        </p>
        {!isPast && (
          <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
            {formatDday(dday)}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onDelete(event.id)}
          aria-label="이벤트 삭제"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </Button>
      </div>

      {/* 시간/장소 */}
      <div className="flex items-center gap-2 flex-wrap">
        {(event.time || event.endTime) && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {event.time}
            {event.endTime && ` ~ ${event.endTime}`}
          </span>
        )}
        {event.location && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            <span className="truncate max-w-[100px]">{event.location}</span>
          </span>
        )}
      </div>

      {/* 설명 */}
      {event.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-1">
          {event.description}
        </p>
      )}

      {/* RSVP */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        {/* RSVP 집계 */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Users className="h-2.5 w-2.5" />
          <span className="text-green-600 font-medium">{attendCount}명</span>
          <span>/</span>
          <span className="text-red-500 font-medium">{notAttendCount}명</span>
        </div>

        {/* 내 RSVP 버튼 */}
        {!isPast && (
          <div className="flex items-center gap-0.5">
            {RSVP_OPTIONS.map(({ status, label, icon }) => {
              const isSelected = myRsvp === status;
              const c = RSVP_STATUS_COLORS[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onRsvp(event.id, status)}
                  className={cn(
                    "flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                    isSelected
                      ? cn(c.bg, c.text, c.border)
                      : "bg-background border-border/50 text-muted-foreground hover:border-border"
                  )}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 이벤트 추가 다이얼로그
// ============================================================

type AddEventDialogProps = {
  open: boolean;
  initialDate: string;
  onClose: () => void;
  onAdd: (input: Omit<GroupCalendarEvent, "id" | "rsvps" | "createdAt">) => void;
};

function AddEventDialog({
  open,
  initialDate,
  onClose,
  onAdd,
}: AddEventDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [category, setCategory] = useState<GroupEventCategory>("연습");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  // open 상태 변경 시 date 동기화
  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setDate(initialDate);
    } else {
      handleClose();
    }
  }

  function reset() {
    setTitle("");
    setDate(initialDate);
    setTime("10:00");
    setEndTime("12:00");
    setCategory("연습");
    setLocation("");
    setDescription("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("이벤트 제목을 입력해주세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    await execute(async () => {
      onAdd({
        title: title.trim(),
        date,
        time,
        endTime,
        category,
        location,
        description,
      });
      toast.success("이벤트가 추가되었습니다.");
      handleClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            이벤트 추가
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="이벤트 제목"
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as GroupEventCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-block w-2 h-2 rounded-full",
                          GROUP_EVENT_CATEGORY_COLORS[cat].dot
                        )}
                      />
                      {cat}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜 *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">시작 시간</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">종료 시간</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <Label className="text-xs">장소</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="장소 (선택)"
              className="h-8 text-xs"
              maxLength={60}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명 (선택)"
              className="text-xs resize-none"
              rows={2}
              maxLength={200}
            />
          </div>

          <DialogFooter className="gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={submitting}
            >
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 캘린더 그리드
// ============================================================

type CalendarGridProps = {
  year: number;
  month: number;
  eventsByDate: Map<string, GroupCalendarEvent[]>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

function CalendarGrid({
  year,
  month,
  eventsByDate,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const today = todayYMD();
  const totalDays = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const totalCells = Math.ceil((firstDow + totalDays) / 7) * 7;

  const cells: (number | null)[] = Array.from(
    { length: totalCells },
    (_, i) => {
      const day = i - firstDow + 1;
      return day >= 1 && day <= totalDays ? day : null;
    }
  );

  return (
    <div className="w-full">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((wd, i) => (
          <div
            key={wd}
            className={cn(
              "text-center text-[10px] font-medium py-1",
              i === 0
                ? "text-red-500"
                : i === 6
                  ? "text-blue-500"
                  : "text-muted-foreground"
            )}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div className="grid grid-cols-7 gap-px bg-border/30 rounded overflow-hidden">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div key={`empty-${i}`} className="bg-background min-h-[36px]" />
            );
          }

          const ymd = toYMD(year, month, day);
          const dayEvents = eventsByDate.get(ymd) ?? [];
          const isToday = ymd === today;
          const isSelected = ymd === selectedDate;
          const isWeekend = i % 7 === 0 || i % 7 === 6;
          const isSun = i % 7 === 0;

          return (
            <button
              key={ymd}
              type="button"
              onClick={() => onSelectDate(ymd)}
              className={cn(
                "bg-background min-h-[36px] flex flex-col items-center pt-1 pb-0.5 px-0.5 transition-colors",
                "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isSelected && "bg-accent",
                dayEvents.length > 0 && !isSelected && "hover:bg-accent/70"
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-medium leading-none w-5 h-5 flex items-center justify-center rounded-full",
                  isToday && "bg-foreground text-background font-bold",
                  !isToday && isSun && "text-red-500",
                  !isToday && !isSun && isWeekend && "text-blue-500",
                  !isToday && !isWeekend && "text-foreground"
                )}
              >
                {day}
              </span>
              {dayEvents.length > 0 && <EventDots events={dayEvents} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 다가오는 이벤트 목록
// ============================================================

function UpcomingEventList({
  events,
  myRsvpMap,
  onRsvp,
  onDelete,
}: {
  events: GroupCalendarEvent[];
  myRsvpMap: Map<string, GroupEventRsvpStatus | null>;
  onRsvp: (id: string, status: GroupEventRsvpStatus) => void;
  onDelete: (id: string) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4 gap-1 text-muted-foreground">
        <ListChecks className="h-5 w-5" />
        <p className="text-xs">다가오는 이벤트가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {events.map((ev) => (
        <EventItem
          key={ev.id}
          event={ev}
          myRsvp={myRsvpMap.get(ev.id) ?? null}
          onDelete={onDelete}
          onRsvp={onRsvp}
        />
      ))}
    </div>
  );
}

// ============================================================
// 통계 바 (이번 달 / D-day)
// ============================================================

function StatsBar({
  thisMonthCount,
  nextEventDday,
  nextEventTitle,
}: {
  thisMonthCount: number;
  nextEventDday: number | null;
  nextEventTitle: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {/* 이번 달 이벤트 수 */}
      <div className="rounded-md bg-blue-50 px-3 py-2 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-blue-500 shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground">이번 달</p>
          <p className="text-sm font-bold text-blue-700">{thisMonthCount}개</p>
        </div>
      </div>

      {/* 다음 이벤트 D-day */}
      <div className="rounded-md bg-orange-50 px-3 py-2 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-orange-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground truncate">
            {nextEventTitle ? nextEventTitle : "다음 이벤트"}
          </p>
          <p className="text-sm font-bold text-orange-700">
            {nextEventDday !== null ? formatDday(nextEventDday) : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

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

  // upcoming RSVP 맵
  const upcomingRsvpMap = new Map<string, GroupEventRsvpStatus | null>(
    upcomingEvents.map((ev) => [ev.id, getMyRsvp(ev.id)])
  );

  // 선택된 날짜 RSVP 맵
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
    if (ok) toast.success("이벤트가 삭제되었습니다.");
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
      toast.error("RSVP 처리에 실패했습니다.");
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
            >
              <CalendarDays className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="text-xs font-medium flex-1">이벤트 캘린더</span>

              {stats.thisMonthCount > 0 && (
                <span className="text-[10px] px-1.5 py-0 rounded bg-blue-100 text-blue-700 font-semibold shrink-0">
                  이번달 {stats.thisMonthCount}개
                </span>
              )}

              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
              <div className="flex items-center gap-1 border-b border-border/40 pb-0">
                <button
                  type="button"
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
                    <span className="text-[10px] px-1 py-0 rounded bg-blue-100 text-blue-600 font-semibold">
                      {upcomingEvents.length}
                    </span>
                  )}
                </button>

                <div className="flex-1" />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 px-2 mb-1"
                  onClick={() => openAddDialog()}
                >
                  <Plus className="h-3 w-3" />
                  추가
                </Button>
              </div>

              {/* 캘린더 탭 */}
              {activeTab === "calendar" && (
                <div className="space-y-3">
                  {/* 월 네비게이션 */}
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={prevMonth}
                      aria-label="이전 달"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>

                    <span className="text-xs font-semibold">
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
                      aria-label="다음 달"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
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
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-foreground">
                          {formatDateKo(selectedDate)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] gap-1 px-1.5"
                            onClick={() => openAddDialog(selectedDate)}
                          >
                            <Plus className="h-2.5 w-2.5" />
                            이벤트 추가
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setSelectedDate(null)}
                            aria-label="패널 닫기"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>

                      {selectedEvents.length > 0 ? (
                        <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                          {selectedEvents.map((ev) => (
                            <EventItem
                              key={ev.id}
                              event={ev}
                              myRsvp={selectedRsvpMap.get(ev.id) ?? null}
                              onDelete={handleDelete}
                              onRsvp={handleRsvp}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 gap-1 text-muted-foreground">
                          <CalendarDays className="h-5 w-5" />
                          <p className="text-xs">이날 이벤트가 없습니다</p>
                          <button
                            type="button"
                            className="text-[10px] text-blue-500 hover:underline"
                            onClick={() => openAddDialog(selectedDate)}
                          >
                            이벤트 추가하기
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 카테고리 범례 */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-border/40">
                    {GROUP_EVENT_CATEGORIES.map((cat) => (
                      <span
                        key={cat}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground"
                      >
                        <span
                          className={cn(
                            "inline-block w-1.5 h-1.5 rounded-full",
                            GROUP_EVENT_CATEGORY_COLORS[cat].dot
                          )}
                        />
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 다가오는 이벤트 탭 */}
              {activeTab === "upcoming" && (
                <UpcomingEventList
                  events={upcomingEvents}
                  myRsvpMap={upcomingRsvpMap}
                  onRsvp={handleRsvp}
                  onDelete={handleDelete}
                />
              )}
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
