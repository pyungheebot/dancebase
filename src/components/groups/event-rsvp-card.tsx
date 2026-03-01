"use client";

import { useState } from "react";
import {
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Timer,
  AlarmClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEventRsvp } from "@/hooks/use-event-rsvp";
import type { EventRsvpItem, EventRsvpResponse } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ─── 상수 ────────────────────────────────────────────────────

const RESPONSE_LABEL: Record<EventRsvpResponse, string> = {
  attending: "참석",
  maybe: "미정",
  not_attending: "불참",
  pending: "미응답",
};

const RESPONSE_COLOR: Record<EventRsvpResponse, string> = {
  attending: "bg-green-500",
  maybe: "bg-yellow-400",
  not_attending: "bg-red-400",
  pending: "bg-gray-300",
};

const RESPONSE_BADGE_CLASS: Record<EventRsvpResponse, string> = {
  attending: "bg-green-100 text-green-700 hover:bg-green-100",
  maybe: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  not_attending: "bg-red-100 text-red-600 hover:bg-red-100",
  pending: "bg-gray-100 text-gray-500 hover:bg-gray-100",
};

const RESPONSE_ICON: Record<EventRsvpResponse, React.ReactNode> = {
  attending: <CheckCircle2 className="h-3 w-3" />,
  maybe: <HelpCircle className="h-3 w-3" />,
  not_attending: <XCircle className="h-3 w-3" />,
  pending: <Timer className="h-3 w-3" />,
};

// ─── 헬퍼 ────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcDDay(dateStr: string): string {
  const today = new Date(todayStr());
  const target = new Date(dateStr);
  const diff = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "종료";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}

// ─── 이벤트 추가 다이얼로그 ──────────────────────────────────

interface AddEventDialogProps {
  onAdd: (data: {
    title: string;
    date: string;
    time?: string;
    location?: string;
    description?: string;
    deadline?: string;
    createdBy: string;
    memberNames?: string[];
  }) => boolean;
  memberNames?: string[];
  currentMemberName?: string;
}

function AddEventDialog({ onAdd, memberNames, currentMemberName }: AddEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = onAdd({
      title,
      date,
      time: time || undefined,
      location: location || undefined,
      description: description || undefined,
      deadline: deadline || undefined,
      createdBy: currentMemberName ?? "관리자",
      memberNames,
    });
    if (ok) {
      setOpen(false);
      setTitle("");
      setDate("");
      setTime("");
      setLocation("");
      setDescription("");
      setDeadline("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          이벤트 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">새 이벤트 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="이벤트 제목"
              className="h-8 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">날짜 *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">시간</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">장소</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="이벤트 장소"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이벤트 설명 (선택)"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">응답 마감일</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              추가
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── 응답 현황 바 ────────────────────────────────────────────

function RsvpBar({ stats }: { stats: Record<EventRsvpResponse, number> }) {
  const total = stats.attending + stats.maybe + stats.not_attending + stats.pending;
  if (total === 0) return null;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-1">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
        {stats.attending > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${pct(stats.attending)}%` }}
          />
        )}
        {stats.maybe > 0 && (
          <div
            className="bg-yellow-400 transition-all"
            style={{ width: `${pct(stats.maybe)}%` }}
          />
        )}
        {stats.not_attending > 0 && (
          <div
            className="bg-red-400 transition-all"
            style={{ width: `${pct(stats.not_attending)}%` }}
          />
        )}
        {stats.pending > 0 && (
          <div
            className="bg-gray-300 transition-all"
            style={{ width: `${pct(stats.pending)}%` }}
          />
        )}
      </div>
      <div className="flex gap-3">
        {(["attending", "maybe", "not_attending", "pending"] as EventRsvpResponse[]).map(
          (key) => (
            <span key={key} className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className={`inline-block h-2 w-2 rounded-full ${RESPONSE_COLOR[key]}`} />
              {RESPONSE_LABEL[key]} {stats[key]}
            </span>
          )
        )}
      </div>
    </div>
  );
}

// ─── 이벤트 행 ───────────────────────────────────────────────

interface EventRowProps {
  event: EventRsvpItem;
  currentMemberName?: string;
  onRespond: (
    eventId: string,
    memberName: string,
    response: EventRsvpResponse,
    note?: string
  ) => boolean;
  onDelete: (eventId: string) => boolean;
  getStats: (eventId: string) => Record<EventRsvpResponse, number>;
}

function EventRow({
  event,
  currentMemberName,
  onRespond,
  onDelete,
  getStats,
}: EventRowProps) {
  const [expanded, setExpanded] = useState(false);
  const stats = getStats(event.id);
  const dDay = calcDDay(event.date);
  const isPast = dDay === "종료";
  const myResponse = currentMemberName
    ? event.responses.find(
        (r) => r.memberName.toLowerCase() === currentMemberName.toLowerCase()
      )?.response ?? null
    : null;

  function handleQuickRespond(response: EventRsvpResponse) {
    if (!currentMemberName) return;
    onRespond(event.id, currentMemberName, response);
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 이벤트 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-800 truncate">{event.title}</span>
            <Badge
              className={`text-[10px] px-1.5 py-0 ${
                isPast
                  ? "bg-gray-100 text-gray-400 hover:bg-gray-100"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-100"
              }`}
            >
              {dDay}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
              <CalendarCheck className="h-3 w-3" />
              {formatYearMonthDay(event.date)}
            </span>
            {event.time && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <Clock className="h-3 w-3" />
                {event.time}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <MapPin className="h-3 w-3" />
                {event.location}
              </span>
            )}
            {event.deadline && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                <AlarmClock className="h-3 w-3" />
                마감 {formatYearMonthDay(event.deadline)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={() => onDelete(event.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* 응답 현황 바 */}
      <RsvpBar stats={stats} />

      {/* 빠른 응답 버튼 */}
      {currentMemberName && !isPast && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 shrink-0">내 응답:</span>
          {(["attending", "maybe", "not_attending"] as EventRsvpResponse[]).map((resp) => (
            <button
              key={resp}
              onClick={() => handleQuickRespond(resp)}
              className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-all border ${
                myResponse === resp
                  ? `${RESPONSE_BADGE_CLASS[resp]} border-transparent ring-1 ring-offset-0 ${
                      resp === "attending"
                        ? "ring-green-400"
                        : resp === "maybe"
                        ? "ring-yellow-400"
                        : "ring-red-400"
                    }`
                  : "bg-background text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {RESPONSE_ICON[resp]}
              {RESPONSE_LABEL[resp]}
            </button>
          ))}
        </div>
      )}

      {/* 확장 - 응답자 목록 */}
      {expanded && (
        <div className="pt-1 space-y-1.5">
          <Separator />
          {event.description && (
            <p className="text-[11px] text-gray-600 leading-relaxed">{event.description}</p>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-600">응답자 목록</span>
          </div>
          {event.responses.length === 0 ? (
            <p className="text-[10px] text-gray-400">아직 응답자가 없습니다.</p>
          ) : (
            <div className="space-y-1">
              {event.responses.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded bg-gray-50 px-2 py-1"
                >
                  <span className="text-[11px] text-gray-700 font-medium">
                    {r.memberName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {r.note && (
                      <span className="text-[10px] text-gray-400 italic max-w-[100px] truncate">
                        {r.note}
                      </span>
                    )}
                    <Badge
                      className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${RESPONSE_BADGE_CLASS[r.response]}`}
                    >
                      {RESPONSE_ICON[r.response]}
                      {RESPONSE_LABEL[r.response]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 카드 ───────────────────────────────────────────────

interface EventRsvpCardProps {
  groupId: string;
  memberNames?: string[];
  currentMemberName?: string;
}

export function EventRsvpCard({
  groupId,
  memberNames,
  currentMemberName,
}: EventRsvpCardProps) {
  const [open, setOpen] = useState(true);
  const { events, addEvent, deleteEvent, respond, getEventStats, stats } =
    useEventRsvp(groupId);

  const today = todayStr();
  const upcomingEvents = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents = events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
              <CalendarCheck className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">
                이벤트 RSVP
              </span>
              <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-600 hover:bg-indigo-100">
                {stats.upcomingEvents}건 예정
              </Badge>
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>
          </CollapsibleTrigger>
          <AddEventDialog
            onAdd={addEvent}
            memberNames={memberNames}
            currentMemberName={currentMemberName}
          />
        </div>

        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* 통계 요약 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-indigo-50 px-3 py-2 text-center">
                <p className="text-base font-bold text-indigo-600">
                  {stats.totalEvents}
                </p>
                <p className="text-[10px] text-indigo-400">전체 이벤트</p>
              </div>
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                <p className="text-base font-bold text-blue-600">
                  {stats.upcomingEvents}
                </p>
                <p className="text-[10px] text-blue-400">예정</p>
              </div>
              <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
                <p className="text-base font-bold text-green-600">
                  {stats.responseRate}%
                </p>
                <p className="text-[10px] text-green-400">응답률</p>
              </div>
            </div>

            {/* 이벤트 없음 */}
            {events.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <CalendarCheck className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">등록된 이벤트가 없습니다.</p>
                <p className="text-[10px] mt-0.5">위 버튼으로 이벤트를 추가해보세요.</p>
              </div>
            )}

            {/* 예정 이벤트 */}
            {upcomingEvents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                    예정된 이벤트
                  </span>
                  <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-600 hover:bg-blue-100">
                    {upcomingEvents.length}
                  </Badge>
                </div>
                {upcomingEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    currentMemberName={currentMemberName}
                    onRespond={respond}
                    onDelete={deleteEvent}
                    getStats={getEventStats}
                  />
                ))}
              </div>
            )}

            {/* 지난 이벤트 */}
            {pastEvents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    지난 이벤트
                  </span>
                  <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-400 hover:bg-gray-100">
                    {pastEvents.length}
                  </Badge>
                </div>
                {pastEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    currentMemberName={currentMemberName}
                    onRespond={respond}
                    onDelete={deleteEvent}
                    getStats={getEventStats}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
