"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useEventCountdown,
  getRemainingTime,
  isPastEvent,
} from "@/hooks/use-event-countdown";
import type { CountdownEvent } from "@/types";

// ============================================
// 이모지 프리셋
// ============================================

const EMOJI_PRESETS = ["🎭", "🏆", "🎤", "💃", "🎉", "🎊", "🎵", "🌟"];

// ============================================
// 카운트다운 표시 헬퍼
// ============================================

function formatDDay(event: CountdownEvent): string {
  if (isPastEvent(event)) return "완료";
  const { days } = getRemainingTime(event);
  if (days === 0) return "D-Day";
  return `D-${days}`;
}

function formatRemainingDetail(event: CountdownEvent): string {
  if (isPastEvent(event)) return "이미 지난 이벤트입니다";
  const { days, hours, minutes } = getRemainingTime(event);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}일`);
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0) parts.push(`${minutes}분`);
  if (parts.length === 0) return "곧 시작!";
  return parts.join(" ") + " 남음";
}

// ============================================
// 이벤트 추가 Dialog
// ============================================

type AddEventDialogProps = {
  onAdd: (params: {
    title: string;
    eventDate: string;
    eventTime?: string;
    emoji: string;
  }) => boolean;
  disabled?: boolean;
};

function AddEventDialog({ onAdd, disabled }: AddEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_PRESETS[0]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      toast.error("이벤트 제목을 입력해주세요");
      return;
    }
    if (!eventDate) {
      toast.error("이벤트 날짜를 선택해주세요");
      return;
    }

    setSaving(true);
    const added = onAdd({
      title: title.trim(),
      eventDate,
      eventTime: eventTime || undefined,
      emoji,
    });

    if (added) {
      toast.success("이벤트가 추가되었습니다");
      setTitle("");
      setEventDate("");
      setEventTime("");
      setEmoji(EMOJI_PRESETS[0]);
      setOpen(false);
    } else {
      toast.error("이벤트는 최대 10개까지 추가할 수 있습니다");
    }
    setSaving(false);
  }, [title, eventDate, eventTime, emoji, onAdd]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          disabled={disabled}
          title="이벤트 추가"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">이벤트 카운트다운 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 이모지 선택 */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">이모지</Label>
            <div className="flex gap-1.5 flex-wrap">
              {EMOJI_PRESETS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-lg w-9 h-9 rounded flex items-center justify-center border transition-colors ${
                    emoji === e
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <Label htmlFor="countdown-title" className="text-xs text-muted-foreground mb-1.5 block">
              이벤트 제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="countdown-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 정기공연, 전국대회"
              className="h-8 text-sm"
              maxLength={30}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          {/* 날짜 */}
          <div>
            <Label htmlFor="countdown-date" className="text-xs text-muted-foreground mb-1.5 block">
              날짜 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="countdown-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 시간 (선택) */}
          <div>
            <Label htmlFor="countdown-time" className="text-xs text-muted-foreground mb-1.5 block">
              시간 <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <Input
              id="countdown-time"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 개별 이벤트 카드 (일반)
// ============================================

type EventItemProps = {
  event: CountdownEvent;
  onDelete: (id: string) => void;
};

function EventItem({ event, onDelete }: EventItemProps) {
  const past = isPastEvent(event);
  const dDay = formatDDay(event);
  const detail = formatRemainingDetail(event);

  return (
    <div
      className={`flex items-center gap-2 rounded px-2 py-1.5 group ${
        past ? "opacity-60" : "hover:bg-muted/50"
      }`}
    >
      {/* 이모지 */}
      <span className="text-base shrink-0">{event.emoji}</span>

      {/* 제목 + 상세 */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-medium truncate leading-tight ${
            past ? "line-through text-muted-foreground" : ""
          }`}
        >
          {event.title}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {detail}
        </p>
      </div>

      {/* D-Day 배지 */}
      <div className="shrink-0 flex items-center gap-1">
        {past ? (
          <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-200">
            완료!
          </Badge>
        ) : (
          <span className="text-sm font-bold tabular-nums text-primary">
            {dDay}
          </span>
        )}

        {/* 삭제 버튼 */}
        <button
          onClick={() => onDelete(event.id)}
          className="h-5 w-5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// 가장 가까운 이벤트 강조 카드
// ============================================

type FeaturedEventCardProps = {
  event: CountdownEvent;
  onDelete: (id: string) => void;
};

function FeaturedEventCard({ event, onDelete }: FeaturedEventCardProps) {
  const past = isPastEvent(event);
  const { days, hours, minutes } = getRemainingTime(event);
  const dDay = formatDDay(event);

  return (
    <div className="relative rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-3 mb-2">
      {/* 삭제 버튼 */}
      <button
        onClick={() => onDelete(event.id)}
        className="absolute top-2 right-2 h-5 w-5 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
        title="삭제"
        style={{ opacity: undefined }}
      >
        <Trash2 className="h-3 w-3" />
      </button>

      <div className="flex items-start gap-2">
        {/* 이모지 */}
        <span className="text-2xl shrink-0 leading-none mt-0.5">{event.emoji}</span>

        <div className="flex-1 min-w-0">
          {/* 제목 */}
          <p
            className={`text-sm font-semibold leading-tight ${
              past ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {event.title}
          </p>

          {/* D-Day 큰 숫자 */}
          <div className="mt-1 flex items-baseline gap-1">
            {past ? (
              <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 border-gray-200">
                완료!
              </Badge>
            ) : (
              <>
                <span className="text-2xl font-black tabular-nums text-primary leading-none">
                  {dDay}
                </span>
              </>
            )}
          </div>

          {/* 남은 시간 상세 */}
          {!past && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {days > 0 && <span>{days}일 </span>}
              {hours > 0 && <span>{hours}시간 </span>}
              <span>{minutes}분 남음</span>
            </p>
          )}

          {/* 날짜 표시 */}
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {event.eventDate}
            {event.eventTime && ` ${event.eventTime}`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

type EventCountdownCardProps = {
  groupId: string;
};

export function EventCountdownCard({ groupId }: EventCountdownCardProps) {
  const { events, addEvent, deleteEvent, getActiveEvents } =
    useEventCountdown(groupId);
  const [open, setOpen] = useState(true);
  // 1분마다 강제 리렌더링으로 카운트다운 갱신
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const sortedEvents = getActiveEvents();
  const featuredEvent =
    sortedEvents.find((e) => !isPastEvent(e)) ?? sortedEvents[0] ?? null;
  const restEvents = sortedEvents.filter((e) => e.id !== featuredEvent?.id);

  const handleDelete = useCallback(
    (id: string) => {
      deleteEvent(id);
      toast.success("이벤트가 삭제되었습니다");
    },
    [deleteEvent]
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded border">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-muted/30">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Timer className="h-3 w-3" />
              이벤트 카운트다운
              {events.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1 py-0 ml-0.5 h-3.5"
                >
                  {events.length}
                </Badge>
              )}
              {open ? (
                <ChevronUp className="h-3 w-3 ml-0.5" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-0.5" />
              )}
            </button>
          </CollapsibleTrigger>
          <AddEventDialog onAdd={addEvent} disabled={events.length >= 10} />
        </div>

        {/* 컨텐츠 */}
        <CollapsibleContent>
          <div className="px-2.5 py-2">
            {sortedEvents.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-1 text-center">
                등록된 이벤트가 없습니다
              </p>
            ) : (
              <>
                {/* 가장 가까운 이벤트 강조 카드 */}
                {featuredEvent && (
                  <FeaturedEventCard
                    event={featuredEvent}
                    onDelete={handleDelete}
                  />
                )}

                {/* 나머지 이벤트 목록 */}
                {restEvents.length > 0 && (
                  <div className="space-y-px">
                    {restEvents.map((event) => (
                      <EventItem
                        key={event.id}
                        event={event}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
