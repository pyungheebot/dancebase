"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useEventCalendar,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
} from "@/hooks/use-event-calendar";
import type { CalendarEvent, CalendarEventType } from "@/types";

// ============================================
// 상수
// ============================================

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const ALL_TYPES: CalendarEventType[] = [
  "practice",
  "performance",
  "meeting",
  "workshop",
  "social",
  "other",
];

// ============================================
// 날짜 헬퍼
// ============================================

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayYMD(): string {
  const d = new Date();
  return toYMD(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay(); // 0=일
}

function formatDateKo(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function formatTime(time: string): string {
  return time;
}

// ============================================
// 이벤트 도트
// ============================================

function EventDots({ events }: { events: CalendarEvent[] }) {
  // 타입별 최대 3개 도트 표시
  const unique = Array.from(new Set(events.map((e) => e.type))).slice(0, 3);
  return (
    <div className="flex items-center justify-center gap-0.5 mt-0.5">
      {unique.map((type) => (
        <span
          key={type}
          className={cn(
            "inline-block rounded-full w-1 h-1",
            EVENT_TYPE_COLORS[type].dot
          )}
        />
      ))}
    </div>
  );
}

// ============================================
// 이벤트 아이템 (날짜 패널)
// ============================================

function EventItem({
  event,
  onDelete,
}: {
  event: CalendarEvent;
  onDelete: (id: string) => void;
}) {
  const colors = EVENT_TYPE_COLORS[event.type];

  return (
    <div
      className={cn(
        "rounded px-2 py-1.5 flex items-start gap-2 group",
        colors.bg
      )}
    >
      {/* 타입 배지 */}
      <span
        className={cn(
          "text-[10px] px-1.5 py-0 rounded font-medium shrink-0 mt-0.5",
          colors.badge
        )}
      >
        {EVENT_TYPE_LABELS[event.type]}
      </span>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {event.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
              <span className="truncate max-w-[80px]">{event.location}</span>
            </span>
          )}
        </div>
        {event.description && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>

      {/* 삭제 버튼 */}
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
  );
}

// ============================================
// 이벤트 추가 다이얼로그
// ============================================

type AddEventDialogProps = {
  open: boolean;
  initialDate: string;
  onClose: () => void;
  onAdd: (input: Omit<CalendarEvent, "id" | "createdAt">) => void;
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
  const [type, setType] = useState<CalendarEventType>("practice");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // initialDate가 바뀌면 date도 동기화
  function handleOpen() {
    setDate(initialDate);
  }

  function reset() {
    setTitle("");
    setDate(initialDate);
    setTime("10:00");
    setEndTime("12:00");
    setType("practice");
    setLocation("");
    setDescription("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("이벤트 제목을 입력해주세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      onAdd({ title: title.trim(), date, time, endTime, type, location, description });
      toast.success("이벤트가 추가되었습니다.");
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else handleOpen(); }}>
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

          {/* 타입 */}
          <div className="space-y-1">
            <Label className="text-xs">유형</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as CalendarEventType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-block w-2 h-2 rounded-full",
                          EVENT_TYPE_COLORS[t].dot
                        )}
                      />
                      {EVENT_TYPE_LABELS[t]}
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
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명 (선택)"
              className="h-8 text-xs"
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

// ============================================
// 캘린더 그리드
// ============================================

type CalendarGridProps = {
  year: number;
  month: number; // 1~12
  eventsByDate: Map<string, CalendarEvent[]>;
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
  const firstDow = getFirstDayOfWeek(year, month); // 0=일
  const totalCells = Math.ceil((firstDow + totalDays) / 7) * 7;

  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDow + 1;
    return day >= 1 && day <= totalDays ? day : null;
  });

  return (
    <div className="w-full">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((wd, i) => (
          <div
            key={wd}
            className={cn(
              "text-center text-[10px] font-medium py-1",
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
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
              <div
                key={`empty-${i}`}
                className="bg-background min-h-[36px]"
              />
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
              {/* 날짜 숫자 */}
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

              {/* 이벤트 도트 */}
              {dayEvents.length > 0 && <EventDots events={dayEvents} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type EventCalendarCardProps = {
  groupId: string;
};

export function EventCalendarCard({ groupId }: EventCalendarCardProps) {
  const [open, setOpen] = useState(true);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1); // 1~12

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogDate, setAddDialogDate] = useState(todayYMD());

  const {
    getEventsByMonth,
    getEventsByDate,
    addEvent,
    deleteEvent,
    thisMonthCount,
  } = useEventCalendar(groupId);

  const monthEvents = getEventsByMonth(viewYear, viewMonth);

  // 날짜 → 이벤트 맵
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of monthEvents) {
    const arr = eventsByDate.get(ev.date) ?? [];
    arr.push(ev);
    eventsByDate.set(ev.date, arr);
  }

  const selectedEvents = selectedDate ? getEventsByDate(selectedDate) : [];

  // ── 월 네비게이션 ────────────────────────────────────────

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

  // ── 이벤트 추가 버튼 ─────────────────────────────────────

  function openAddDialog(date?: string) {
    setAddDialogDate(date ?? todayYMD());
    setAddDialogOpen(true);
  }

  // ── 이벤트 삭제 ──────────────────────────────────────────

  function handleDelete(id: string) {
    deleteEvent(id);
    toast.success("이벤트가 삭제되었습니다.");
  }

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="rounded-lg border bg-card">
          {/* ── 헤더 ── */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center gap-1.5 px-3 py-2.5 text-left"
              aria-expanded={open}
            >
              <CalendarDays className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="text-xs font-medium flex-1">이벤트 캘린더</span>

              {/* 이번 달 이벤트 수 배지 */}
              {thisMonthCount > 0 && (
                <span className="text-[10px] px-1.5 py-0 rounded bg-blue-100 text-blue-700 font-semibold shrink-0">
                  이번달 {thisMonthCount}개
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
              {/* ── 월 네비게이션 ── */}
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

                <div className="flex items-center gap-0.5">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 px-2"
                    onClick={() => openAddDialog()}
                  >
                    <Plus className="h-3 w-3" />
                    추가
                  </Button>
                </div>
              </div>

              {/* ── 캘린더 그리드 ── */}
              <CalendarGrid
                year={viewYear}
                month={viewMonth}
                eventsByDate={eventsByDate}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />

              {/* ── 선택된 날짜 이벤트 패널 ── */}
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
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                      {selectedEvents.map((ev) => (
                        <EventItem
                          key={ev.id}
                          event={ev}
                          onDelete={handleDelete}
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

              {/* ── 타입 범례 ── */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-border/40">
                {ALL_TYPES.map((type) => (
                  <span
                    key={type}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground"
                  >
                    <span
                      className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full",
                        EVENT_TYPE_COLORS[type].dot
                      )}
                    />
                    {EVENT_TYPE_LABELS[type]}
                  </span>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── 이벤트 추가 다이얼로그 ── */}
      <AddEventDialog
        open={addDialogOpen}
        initialDate={addDialogDate}
        onClose={() => setAddDialogOpen(false)}
        onAdd={(input) => addEvent(input)}
      />
    </>
  );
}
