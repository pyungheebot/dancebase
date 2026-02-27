"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Timer, MapPin, ChevronDown, ChevronRight, CalendarClock } from "lucide-react";
import { useScheduleCountdown } from "@/hooks/use-schedule-countdown";
import type { CountdownSchedule } from "@/types";

type Props = {
  groupId: string;
};

// 날짜/시간 포맷 헬퍼
function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const dow = weekdays[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day}(${dow}) ${hh}:${mm}`;
}

// D-day 배지 텍스트
function getDdayLabel(schedule: CountdownSchedule): string {
  if (schedule.daysLeft === 0) {
    if (schedule.hoursLeft === 0 && schedule.minutesLeft === 0) return "D-Day";
    return `D-Day`;
  }
  return `D-${schedule.daysLeft}`;
}

// 미리보기 아이템 배지 색상
function getDdayBadgeClass(schedule: CountdownSchedule): string {
  if (schedule.isUrgent) return "bg-red-100 text-red-700";
  if (schedule.daysLeft <= 7) return "bg-orange-100 text-orange-700";
  return "bg-blue-100 text-blue-700";
}

// 숫자 2자리 패딩
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

type CountdownDisplayProps = {
  schedule: CountdownSchedule;
};

function CountdownDisplay({ schedule }: CountdownDisplayProps) {
  const isUrgent = schedule.isUrgent;

  return (
    <div
      className={`rounded-lg p-3 space-y-2 ${
        isUrgent
          ? "bg-red-50 border border-red-200"
          : "bg-muted/50 border border-border"
      }`}
    >
      {/* 카운트다운 숫자 */}
      <div className="text-center">
        {schedule.daysLeft > 0 ? (
          <div
            className={`font-mono tabular-nums font-bold tracking-tight leading-none ${
              isUrgent ? "text-red-600" : "text-foreground"
            }`}
          >
            <span className="text-4xl">{schedule.daysLeft}</span>
            <span className="text-lg ml-0.5 mr-2 font-semibold">일</span>
            <span className="text-2xl">{pad(schedule.hoursLeft)}</span>
            <span className="text-base mx-0.5 font-semibold">:</span>
            <span className="text-2xl">{pad(schedule.minutesLeft)}</span>
            <span className="text-base mx-0.5 font-semibold">:</span>
            <span className="text-2xl">{pad(schedule.secondsLeft)}</span>
          </div>
        ) : (
          <div
            className={`font-mono tabular-nums font-bold tracking-tight leading-none ${
              isUrgent ? "text-red-600" : "text-foreground"
            }`}
          >
            <span className="text-4xl">{pad(schedule.hoursLeft)}</span>
            <span className="text-base mx-0.5 font-semibold">:</span>
            <span className="text-4xl">{pad(schedule.minutesLeft)}</span>
            <span className="text-base mx-0.5 font-semibold">:</span>
            <span className="text-4xl">{pad(schedule.secondsLeft)}</span>
          </div>
        )}
        {isUrgent && (
          <p className="text-[10px] text-red-500 font-medium mt-0.5">
            24시간 이내 긴급 일정
          </p>
        )}
      </div>

      {/* 일정 정보 */}
      <div className="space-y-0.5">
        <p
          className={`text-sm font-semibold truncate ${
            isUrgent ? "text-red-700" : "text-foreground"
          }`}
        >
          {schedule.title}
        </p>
        <p
          className={`text-[11px] ${
            isUrgent ? "text-red-500" : "text-muted-foreground"
          }`}
        >
          {formatDateTime(schedule.startsAt)}
        </p>
        {schedule.location && (
          <div
            className={`flex items-center gap-0.5 text-[11px] ${
              isUrgent ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{schedule.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

type PreviewItemProps = {
  schedule: CountdownSchedule;
  index: number;
};

function PreviewItem({ schedule, index }: PreviewItemProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b last:border-0">
      <span className="text-[10px] text-muted-foreground w-3 shrink-0">
        {index + 2}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{schedule.title}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatDateTime(schedule.startsAt)}
        </p>
      </div>
      <span
        className={`text-[10px] px-1.5 py-0 rounded-full font-medium shrink-0 ${getDdayBadgeClass(schedule)}`}
      >
        {getDdayLabel(schedule)}
      </span>
    </div>
  );
}

export function ScheduleCountdownWidget({ groupId }: Props) {
  const [open, setOpen] = useState(true);
  const { nextSchedule, previewList, loading } = useScheduleCountdown(groupId);

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-1.5">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">다음 일정</span>
                {!loading && nextSchedule?.isUrgent && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 hover:bg-red-100">
                    긴급
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground">
                {open ? (
                  <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 transition-transform" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            {/* 로딩 스켈레톤 */}
            {loading && (
              <div className="space-y-2">
                <div className="h-24 bg-muted animate-pulse rounded-lg" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
            )}

            {/* 일정 없음 */}
            {!loading && !nextSchedule && (
              <div className="flex flex-col items-center gap-1.5 py-4 text-center">
                <CalendarClock className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  예정된 일정이 없습니다
                </p>
              </div>
            )}

            {/* 메인 카운트다운 */}
            {!loading && nextSchedule && (
              <>
                <CountdownDisplay schedule={nextSchedule} />

                {/* 다음 일정 미리보기 */}
                {previewList.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-wide">
                      다음 예정
                    </p>
                    <div>
                      {previewList.map((s, i) => (
                        <PreviewItem key={s.id} schedule={s} index={i} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
