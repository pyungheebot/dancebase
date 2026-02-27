"use client";

import { useState } from "react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, Clock, Pencil } from "lucide-react";
import { ScheduleForm } from "./schedule-form";
import type { Schedule } from "@/types";

type CalendarViewProps = {
  schedules: Schedule[];
  onSelectSchedule?: (schedule: Schedule) => void;
  canEdit?: boolean;
  onScheduleUpdated?: () => void;
};

export function CalendarView({ schedules, onSelectSchedule, canEdit, onScheduleUpdated }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSchedulesForDay = (day: Date) =>
    schedules.filter((s) => isSameDay(new Date(s.starts_at), day));

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">
          {format(currentMonth, "yyyy년 M월", { locale: ko })}
        </h3>
        <div className="flex gap-0.5">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={() => setCurrentMonth(new Date())}
          >
            오늘
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
        {weekDays.map((day) => (
          <div key={day} className="bg-muted px-1 py-0.5 text-center text-[10px] font-medium">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const daySchedules = getSchedulesForDay(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`bg-background px-1 py-0.5 min-h-16 ${!isCurrentMonth ? "opacity-40" : ""}`}
            >
              <span
                className={`text-[11px] ${isToday ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px]" : ""}`}
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-px">
                {daySchedules.map((schedule) => (
                  <button
                    key={schedule.id}
                    onClick={() => onSelectSchedule?.(schedule)}
                    className="w-full text-left"
                  >
                    <Badge
                      variant="secondary"
                      className="w-full justify-start text-[9px] px-1 py-0 truncate cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {schedule.title}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 다가오는 일정 리스트 */}
      <div>
        <h4 className="text-xs font-medium mb-1.5">다가오는 일정</h4>
        {schedules
          .filter((s) => new Date(s.starts_at) >= new Date())
          .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
          .slice(0, 5)
          .map((schedule) => (
            <div key={schedule.id} className="flex items-center gap-1 mb-1">
              <button
                className="flex-1 text-left rounded border px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
                onClick={() => onSelectSchedule?.(schedule)}
              >
                <p className="text-xs font-medium">{schedule.title}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {format(new Date(schedule.starts_at), "M/d (EEE) HH:mm", { locale: ko })}
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
                  onClick={() => setEditSchedule(schedule)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        {schedules.filter((s) => new Date(s.starts_at) >= new Date()).length === 0 && (
          <p className="text-[11px] text-muted-foreground">예정된 일정이 없습니다</p>
        )}
      </div>

      {editSchedule && canEdit && (
        <ScheduleForm
          mode="edit"
          groupId={editSchedule.group_id}
          schedule={editSchedule}
          open={!!editSchedule}
          onOpenChange={(open) => { if (!open) setEditSchedule(null); }}
          onCreated={() => {
            setEditSchedule(null);
            onScheduleUpdated?.();
          }}
        />
      )}
    </div>
  );
}
