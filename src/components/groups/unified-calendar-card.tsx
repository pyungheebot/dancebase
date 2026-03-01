"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Users,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useUnifiedCalendar,
  UNIFIED_EVENT_TYPE_LABELS,
  UNIFIED_EVENT_TYPE_COLORS,
} from "@/hooks/use-unified-calendar";
import type { UnifiedCalendarEvent, UnifiedEventType } from "@/types";

// ============================================================
// 상수
// ============================================================

const ALL_TYPES: UnifiedEventType[] = [
  "practice",
  "performance",
  "meeting",
  "social",
  "competition",
  "workshop",
  "other",
];

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// ============================================================
// 유틸리티
// ============================================================

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS_OF_WEEK[d.getDay()]})`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// 유형 배지
// ============================================================

function TypeBadge({ type }: { type: UnifiedEventType }) {
  const c = UNIFIED_EVENT_TYPE_COLORS[type];
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${c.badge}`}
    >
      {UNIFIED_EVENT_TYPE_LABELS[type]}
    </span>
  );
}

// ============================================================
// 이벤트 추가 다이얼로그
// ============================================================

const DEFAULT_FORM = {
  title: "",
  type: "practice" as UnifiedEventType,
  date: todayStr(),
  startTime: "10:00",
  endTime: "12:00",
  location: "",
  description: "",
  participants: [] as string[],
  isAllDay: false,
  reminder: false,
  createdBy: "",
};

interface AddEventDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (params: Omit<UnifiedCalendarEvent, "id" | "createdAt">) => void;
  memberNames: string[];
  defaultDate?: string;
}

function AddEventDialog({
  open,
  onClose,
  onAdd,
  memberNames,
  defaultDate,
}: AddEventDialogProps) {
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    date: defaultDate ?? todayStr(),
  });

  const set = <K extends keyof typeof DEFAULT_FORM>(
    key: K,
    value: (typeof DEFAULT_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleParticipant = (name: string) => {
    setForm((prev) => ({
      ...prev,
      participants: prev.participants.includes(name)
        ? prev.participants.filter((p) => p !== name)
        : [...prev.participants, name],
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!form.date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    if (!form.isAllDay && form.startTime >= form.endTime) {
      toast.error("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }
    onAdd({
      title: form.title.trim(),
      type: form.type,
      date: form.date,
      startTime: form.isAllDay ? "00:00" : form.startTime,
      endTime: form.isAllDay ? "23:59" : form.endTime,
      location: form.location.trim() || undefined,
      description: form.description.trim() || undefined,
      participants: form.participants,
      isAllDay: form.isAllDay,
      reminder: form.reminder,
      createdBy: form.createdBy.trim() || "나",
    });
    setForm({ ...DEFAULT_FORM, date: defaultDate ?? todayStr() });
    onClose();
    toast.success("일정이 추가되었습니다.");
  };

  const handleClose = () => {
    setForm({ ...DEFAULT_FORM, date: defaultDate ?? todayStr() });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">새 일정 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="일정 제목을 입력하세요"
              className="h-7 text-xs"
              autoFocus
            />
          </div>

          {/* 유형 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              유형 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => set("type", v as UnifiedEventType)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${UNIFIED_EVENT_TYPE_COLORS[t].dot}`}
                      />
                      {UNIFIED_EVENT_TYPE_LABELS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              날짜 <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          {/* 종일 체크 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isAllDay"
              checked={form.isAllDay}
              onCheckedChange={(v) => set("isAllDay", Boolean(v))}
            />
            <Label
              htmlFor="isAllDay"
              className="text-xs cursor-pointer"
            >
              종일 일정
            </Label>
          </div>

          {/* 시간 */}
          {!form.isAllDay && (
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-[10px] text-muted-foreground mb-1 block">
                  시작 시간
                </Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex-1">
                <Label className="text-[10px] text-muted-foreground mb-1 block">
                  종료 시간
                </Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          )}

          {/* 장소 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              장소
            </Label>
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="예: 연습실 A, 문화회관 대강당"
              className="h-7 text-xs"
            />
          </div>

          {/* 설명 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              설명
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="일정 상세 내용을 입력하세요"
              className="min-h-[56px] resize-none text-xs"
            />
          </div>

          {/* 참여자 */}
          {memberNames.length > 0 && (
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                참여자
              </Label>
              <div className="max-h-32 overflow-y-auto rounded border bg-muted/20 p-2 space-y-1">
                {memberNames.map((name) => (
                  <div key={name} className="flex items-center gap-2">
                    <Checkbox
                      id={`participant-${name}`}
                      checked={form.participants.includes(name)}
                      onCheckedChange={() => toggleParticipant(name)}
                    />
                    <Label
                      htmlFor={`participant-${name}`}
                      className="text-xs cursor-pointer"
                    >
                      {name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 리마인더 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="reminder"
              checked={form.reminder ?? false}
              onCheckedChange={(v) => set("reminder", Boolean(v))}
            />
            <Label htmlFor="reminder" className="text-xs cursor-pointer">
              리마인더 설정
            </Label>
          </div>

          {/* 작성자 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              작성자
            </Label>
            <Input
              value={form.createdBy}
              onChange={(e) => set("createdBy", e.target.value)}
              placeholder="이름 (미입력 시 '나')"
              className="h-7 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!form.title.trim() || !form.date}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 월간 캘린더 그리드
// ============================================================

interface MonthGridProps {
  year: number;
  month: number; // 1~12
  events: UnifiedCalendarEvent[];
  selectedDate: string | null;
  filterType: UnifiedEventType | "all";
  onSelectDate: (date: string) => void;
}

function MonthGrid({
  year,
  month,
  events,
  selectedDate,
  filterType,
  onSelectDate,
}: MonthGridProps) {
  const today = todayStr();

  // 이 달의 이벤트를 날짜별로 그룹핑
  const eventsByDate = useMemo(() => {
    const map = new Map<string, UnifiedCalendarEvent[]>();
    for (const e of events) {
      if (filterType !== "all" && e.type !== filterType) continue;
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events, filterType]);

  // 달력 날짜 배열 생성
  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=일
    const daysInMonth = new Date(year, month, 0).getDate();
    const result: Array<{ date: string | null; day: number | null }> = [];

    // 앞 빈칸
    for (let i = 0; i < firstDay; i++) {
      result.push({ date: null, day: null });
    }
    // 날짜
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      result.push({ date: dateStr, day: d });
    }
    return result;
  }, [year, month]);

  return (
    <div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[10px] font-medium py-1 ${
              i === 0
                ? "text-red-500"
                : i === 6
                ? "text-blue-500"
                : "text-muted-foreground"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
        {cells.map((cell, idx) => {
          if (!cell.date || cell.day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="bg-muted/30 min-h-[44px]"
              />
            );
          }

          const dateEvents = eventsByDate.get(cell.date) ?? [];
          const isToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          const dayOfWeek = new Date(cell.date + "T00:00:00").getDay();

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date!)}
              className={`bg-background min-h-[44px] p-1 flex flex-col items-center gap-0.5 hover:bg-muted/50 transition-colors ${
                isSelected ? "ring-2 ring-inset ring-primary" : ""
              }`}
            >
              {/* 날짜 숫자 */}
              <span
                className={`text-[11px] w-5 h-5 flex items-center justify-center rounded-full font-medium ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : dayOfWeek === 0
                    ? "text-red-500"
                    : dayOfWeek === 6
                    ? "text-blue-500"
                    : "text-foreground"
                }`}
              >
                {cell.day}
              </span>

              {/* 이벤트 점 (최대 3개) */}
              {dateEvents.length > 0 && (
                <div className="flex flex-wrap justify-center gap-px max-w-full">
                  {dateEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`w-1.5 h-1.5 rounded-full ${UNIFIED_EVENT_TYPE_COLORS[e.type].dot}`}
                      title={e.title}
                    />
                  ))}
                  {dateEvents.length > 3 && (
                    <span className="text-[8px] text-muted-foreground leading-none">
                      +{dateEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 이벤트 상세 행
// ============================================================

interface EventRowProps {
  event: UnifiedCalendarEvent;
  onDelete: () => void;
}

function EventRow({ event, onDelete }: EventRowProps) {
  const c = UNIFIED_EVENT_TYPE_COLORS[event.type];
  return (
    <div
      className={`rounded border p-2 group hover:bg-muted/20 transition-colors ${c.bg} ${c.border}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <TypeBadge type={event.type} />
            <span className="text-xs font-medium truncate">{event.title}</span>
          </div>

          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
            {!event.isAllDay ? (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {event.startTime} ~ {event.endTime}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">종일</span>
            )}

            {event.location && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {event.location}
              </span>
            )}

            {event.participants.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Users className="h-2.5 w-2.5" />
                {event.participants.length}명
              </span>
            )}
          </div>

          {event.description && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 다가오는 일정 행
// ============================================================

interface UpcomingRowProps {
  event: UnifiedCalendarEvent;
}

function UpcomingRow({ event }: UpcomingRowProps) {
  const c = UNIFIED_EVENT_TYPE_COLORS[event.type];
  return (
    <div className="flex items-center gap-2 py-1.5 border-b last:border-0">
      <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{event.title}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatDate(event.date)}
          {!event.isAllDay && ` · ${event.startTime}`}
          {event.location && ` · ${event.location}`}
        </p>
      </div>
      <TypeBadge type={event.type} />
    </div>
  );
}

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
    toast.success("일정이 삭제되었습니다.");
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-800">
              그룹 캘린더
            </span>
            {stats.totalEvents > 0 && (
              <Badge className="bg-blue-100 text-[10px] px-1.5 py-0 text-blue-600 hover:bg-blue-100">
                총 {stats.totalEvents}개
              </Badge>
            )}
            {stats.upcomingCount > 0 && (
              <Badge className="bg-orange-100 text-[10px] px-1.5 py-0 text-orange-600 hover:bg-orange-100">
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
              >
                <Plus className="h-3 w-3" />
                일정 추가
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 본문 */}
        <CollapsibleContent>
          <div className="rounded-b-lg border border-gray-200 bg-white p-4 space-y-4">
            {/* 유형 필터 칩 */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  filterType === "all"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                }`}
              >
                전체
                {stats.totalEvents > 0 && (
                  <span className="ml-1 opacity-70">({stats.totalEvents})</span>
                )}
              </button>
              {ALL_TYPES.map((t) => {
                const count = stats.typeDistribution[t];
                const c = UNIFIED_EVENT_TYPE_COLORS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      filterType === t
                        ? `${c.bg} ${c.text} ${c.border} font-medium`
                        : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                    }`}
                  >
                    {UNIFIED_EVENT_TYPE_LABELS[t]}
                    {count > 0 && (
                      <span className="ml-1 opacity-70">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">
                {viewYear}년 {viewMonth}월
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-700">
                    {formatDate(selectedDate)} 일정
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 gap-0.5"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-2.5 w-2.5" />
                    추가
                  </Button>
                </div>

                {selectedDateEvents.length === 0 ? (
                  <div className="py-4 flex flex-col items-center gap-1.5 text-muted-foreground">
                    <CalendarCheck className="h-6 w-6 opacity-30" />
                    <p className="text-xs">이 날 등록된 일정이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDateEvents.map((e) => (
                      <EventRow
                        key={e.id}
                        event={e}
                        onDelete={() => handleDeleteEvent(e.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 다가오는 일정 */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">
                다가오는 7일 일정
              </p>
              {upcomingEvents.length === 0 ? (
                <div className="py-4 flex flex-col items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-6 w-6 opacity-30" />
                  <p className="text-xs">다가오는 일정이 없습니다.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    일정 추가
                  </Button>
                </div>
              ) : (
                <div className="rounded border bg-muted/10 px-2">
                  {upcomingEvents.map((e) => (
                    <UpcomingRow key={e.id} event={e} />
                  ))}
                </div>
              )}
            </div>

            {/* 하단 통계 요약 */}
            {stats.totalEvents > 0 && (
              <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                <span>
                  전체{" "}
                  <strong className="text-foreground">
                    {stats.totalEvents}
                  </strong>
                  개
                </span>
                <span>
                  이번 달{" "}
                  <strong className="text-foreground">
                    {stats.thisMonthCount}
                  </strong>
                  개
                </span>
                {Object.entries(stats.typeDistribution)
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => (
                    <span key={type}>
                      {UNIFIED_EVENT_TYPE_LABELS[type as UnifiedEventType]}{" "}
                      <strong className="text-foreground">{count}</strong>개
                    </span>
                  ))}
              </div>
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
