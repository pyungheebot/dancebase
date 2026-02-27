"use client";

import { useState } from "react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, MapPin, Clock, Pencil, Calendar, Trash2, RefreshCw, CalendarPlus, Download } from "lucide-react";
import { ScheduleForm } from "./schedule-form";
import { useScheduleRsvp } from "@/hooks/use-schedule-rsvp";
import { createClient } from "@/lib/supabase/client";
import { invalidateScheduleRsvp } from "@/lib/swr/invalidate";
import { toast } from "sonner";
import type { Schedule, ScheduleRsvpResponse } from "@/types";
import Link from "next/link";
import { scheduleToIcs, schedulesToIcs, downloadIcs } from "@/lib/ics";

const MAX_VISIBLE_EVENTS = 2;

// 반복 일정 수정/삭제 범위 타입
type RecurrenceScope = "this" | "this_and_future" | "all";

type CalendarViewProps = {
  schedules: Schedule[];
  onSelectSchedule?: (schedule: Schedule) => void;
  canEdit?: boolean;
  onScheduleUpdated?: () => void;
  attendancePath?: string;
};

// RSVP 버튼 섹션 (내부 컴포넌트)
function RsvpSection({ scheduleId }: { scheduleId: string }) {
  const { rsvp, loading, refetch } = useScheduleRsvp(scheduleId);
  const [submitting, setSubmitting] = useState(false);

  const handleRsvp = async (response: ScheduleRsvpResponse) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    // 이미 같은 응답이면 취소(삭제)
    if (rsvp?.my_response === response) {
      setSubmitting(true);
      try {
        const { error } = await supabase
          .from("schedule_rsvp")
          .delete()
          .eq("schedule_id", scheduleId)
          .eq("user_id", user.id);

        if (error) throw error;
        invalidateScheduleRsvp(scheduleId);
        refetch();
        toast.success("RSVP를 취소했습니다");
      } catch {
        toast.error("RSVP 취소에 실패했습니다");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("schedule_rsvp").upsert(
        {
          schedule_id: scheduleId,
          user_id: user.id,
          response,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "schedule_id,user_id" }
      );

      if (error) throw error;
      invalidateScheduleRsvp(scheduleId);
      refetch();

      const labels: Record<ScheduleRsvpResponse, string> = {
        going: "참석",
        not_going: "불참",
        maybe: "미정",
      };
      toast.success(`"${labels[response]}"으로 응답했습니다`);
    } catch {
      toast.error("RSVP 응답에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">참석 여부</p>
        <div className="h-7 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">참석 여부</p>
        {rsvp && (
          <span className="text-[10px] text-muted-foreground">
            참석 {rsvp.going} · 불참 {rsvp.not_going} · 미정 {rsvp.maybe}
          </span>
        )}
      </div>
      <div className="flex gap-1.5">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          variant={rsvp?.my_response === "going" ? "default" : "outline"}
          disabled={submitting}
          onClick={() => handleRsvp("going")}
        >
          참석{rsvp && rsvp.going > 0 ? ` ${rsvp.going}` : ""}
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          variant={rsvp?.my_response === "not_going" ? "default" : "outline"}
          disabled={submitting}
          onClick={() => handleRsvp("not_going")}
        >
          불참{rsvp && rsvp.not_going > 0 ? ` ${rsvp.not_going}` : ""}
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          variant={rsvp?.my_response === "maybe" ? "default" : "outline"}
          disabled={submitting}
          onClick={() => handleRsvp("maybe")}
        >
          미정{rsvp && rsvp.maybe > 0 ? ` ${rsvp.maybe}` : ""}
        </Button>
      </div>
    </div>
  );
}

// 캘린더 셀의 일정 배지 (going 수 표시 포함)
function ScheduleBadge({ schedule, onClick }: { schedule: Schedule; onClick: () => void }) {
  const { rsvp } = useScheduleRsvp(schedule.id);

  return (
    <button onClick={onClick} className="w-full text-left">
      <Badge
        variant="secondary"
        className="w-full justify-between text-[9px] px-1 py-0 truncate cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <span className="truncate">{schedule.title}</span>
        {rsvp && rsvp.going > 0 && (
          <span className="shrink-0 ml-1 text-[8px] opacity-70">{rsvp.going}</span>
        )}
      </Badge>
    </button>
  );
}

// 반복 일정 삭제 다이얼로그
function RecurrenceDeleteDialog({
  open,
  onOpenChange,
  onSelect,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (scope: RecurrenceScope) => void;
  loading: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>반복 일정 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            삭제할 범위를 선택해주세요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Button
            variant="outline"
            className="justify-start h-auto py-2.5 px-3"
            disabled={loading}
            onClick={() => onSelect("this")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">이 일정만</p>
              <p className="text-xs text-muted-foreground mt-0.5">선택한 일정 1개만 삭제합니다</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-2.5 px-3"
            disabled={loading}
            onClick={() => onSelect("this_and_future")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">이후 모든 일정</p>
              <p className="text-xs text-muted-foreground mt-0.5">이 일정과 이후 날짜의 시리즈를 모두 삭제합니다</p>
            </div>
          </Button>
          <Button
            variant="destructive"
            className="justify-start h-auto py-2.5 px-3"
            disabled={loading}
            onClick={() => onSelect("all")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">전체 시리즈</p>
              <p className="text-xs text-destructive-foreground/80 mt-0.5">같은 반복 일정 전체를 삭제합니다</p>
            </div>
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// 반복 일정 수정 범위 선택 다이얼로그
function RecurrenceEditDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (scope: RecurrenceScope) => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>반복 일정 수정</AlertDialogTitle>
          <AlertDialogDescription>
            수정할 범위를 선택해주세요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Button
            variant="outline"
            className="justify-start h-auto py-2.5 px-3"
            onClick={() => onSelect("this")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">이 일정만</p>
              <p className="text-xs text-muted-foreground mt-0.5">선택한 일정 1개만 수정합니다</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-2.5 px-3"
            onClick={() => onSelect("this_and_future")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">이후 모든 일정</p>
              <p className="text-xs text-muted-foreground mt-0.5">이 일정과 이후 날짜의 시리즈를 모두 수정합니다 (날짜 제외)</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-2.5 px-3"
            onClick={() => onSelect("all")}
          >
            <div className="text-left">
              <p className="text-sm font-medium">전체 시리즈</p>
              <p className="text-xs text-muted-foreground mt-0.5">같은 반복 일정 전체를 수정합니다 (날짜 제외)</p>
            </div>
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CalendarView({ schedules, onSelectSchedule, canEdit, onScheduleUpdated, attendancePath }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  // 시리즈 수정 시 적용 범위 (null이면 단일 수정 모드)
  const [editScope, setEditScope] = useState<RecurrenceScope | null>(null);
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null);
  const [overflowDay, setOverflowDay] = useState<Date | null>(null);

  // 반복 일정 수정/삭제 다이얼로그 상태
  const [recurrenceEditDialogOpen, setRecurrenceEditDialogOpen] = useState(false);
  const [recurrenceDeleteDialogOpen, setRecurrenceDeleteDialogOpen] = useState(false);
  const [pendingEditSchedule, setPendingEditSchedule] = useState<Schedule | null>(null);
  const [pendingDeleteSchedule, setPendingDeleteSchedule] = useState<Schedule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSchedulesForDay = (day: Date) =>
    schedules.filter((s) => isSameDay(new Date(s.starts_at), day));

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  // 수정 버튼 클릭
  const handleEditClick = (schedule: Schedule) => {
    if (schedule.recurrence_id) {
      // 반복 일정이면 범위 선택 다이얼로그 표시
      setPendingEditSchedule(schedule);
      setRecurrenceEditDialogOpen(true);
    } else {
      // 단일 일정이면 바로 수정 폼 열기
      setEditScope("this");
      setEditSchedule(schedule);
    }
  };

  // 반복 수정 범위 선택 후
  const handleRecurrenceEditSelect = (scope: RecurrenceScope) => {
    setRecurrenceEditDialogOpen(false);
    if (!pendingEditSchedule) return;
    setEditScope(scope);
    setEditSchedule(pendingEditSchedule);
    setPendingEditSchedule(null);
  };

  // 삭제 버튼 클릭
  const handleDeleteClick = (schedule: Schedule) => {
    if (schedule.recurrence_id) {
      // 반복 일정이면 범위 선택 다이얼로그 표시
      setPendingDeleteSchedule(schedule);
      setRecurrenceDeleteDialogOpen(true);
    } else {
      // 단일 일정이면 바로 삭제
      handleDeleteConfirm(schedule, "this");
    }
  };

  // 삭제 실행
  const handleDeleteConfirm = async (schedule: Schedule, scope: RecurrenceScope) => {
    setDeleteLoading(true);
    setRecurrenceDeleteDialogOpen(false);
    const supabase = createClient();

    try {
      if (scope === "this") {
        // 이 일정만 삭제
        const { error: attendanceError } = await supabase
          .from("attendance")
          .delete()
          .eq("schedule_id", schedule.id);
        if (attendanceError) throw attendanceError;

        const { error } = await supabase
          .from("schedules")
          .delete()
          .eq("id", schedule.id);
        if (error) throw error;

        toast.success("일정을 삭제했습니다");
      } else if (scope === "this_and_future") {
        // 이후 모든 일정 삭제 (같은 recurrence_id + starts_at >= 현재 일정 날짜)
        if (!schedule.recurrence_id) throw new Error("recurrence_id 없음");

        // 영향받는 schedule id 목록 먼저 조회
        const { data: targetSchedules, error: fetchError } = await supabase
          .from("schedules")
          .select("id")
          .eq("recurrence_id", schedule.recurrence_id)
          .gte("starts_at", schedule.starts_at);
        if (fetchError) throw fetchError;

        const targetIds = (targetSchedules ?? []).map((s: { id: string }) => s.id);
        if (targetIds.length > 0) {
          const { error: attendanceError } = await supabase
            .from("attendance")
            .delete()
            .in("schedule_id", targetIds);
          if (attendanceError) throw attendanceError;

          const { error } = await supabase
            .from("schedules")
            .delete()
            .in("id", targetIds);
          if (error) throw error;
        }

        toast.success(`${targetIds.length}개의 일정을 삭제했습니다`);
      } else {
        // 전체 시리즈 삭제
        if (!schedule.recurrence_id) throw new Error("recurrence_id 없음");

        const { data: targetSchedules, error: fetchError } = await supabase
          .from("schedules")
          .select("id")
          .eq("recurrence_id", schedule.recurrence_id);
        if (fetchError) throw fetchError;

        const targetIds = (targetSchedules ?? []).map((s: { id: string }) => s.id);
        if (targetIds.length > 0) {
          const { error: attendanceError } = await supabase
            .from("attendance")
            .delete()
            .in("schedule_id", targetIds);
          if (attendanceError) throw attendanceError;

          const { error } = await supabase
            .from("schedules")
            .delete()
            .in("id", targetIds);
          if (error) throw error;
        }

        toast.success(`시리즈 전체 ${targetIds.length}개의 일정을 삭제했습니다`);
      }

      setDetailSchedule(null);
      setPendingDeleteSchedule(null);
      onScheduleUpdated?.();
    } catch {
      toast.error("일정 삭제에 실패했습니다");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ScheduleForm에서 시리즈 수정 완료 콜백
  const handleEditCreated = () => {
    setEditSchedule(null);
    setEditScope(null);
    onScheduleUpdated?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">
          {format(currentMonth, "yyyy년 M월", { locale: ko })}
        </h3>
        <div className="flex gap-0.5">
          {schedules.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2 gap-1"
              onClick={() => {
                const icsContent = schedulesToIcs(schedules);
                downloadIcs(icsContent, "DanceBase_일정.ics");
                toast.success("전체 일정을 내보냈습니다");
              }}
            >
              <Download className="h-3 w-3" />
              전체 내보내기
            </Button>
          )}
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
                    onClick={() => setDetailSchedule(schedule)}
                  />
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => setOverflowDay(day)}
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
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium">{schedule.title}</p>
                  {schedule.recurrence_id && (
                    <RefreshCw className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                  )}
                </div>
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
                  onClick={() => handleEditClick(schedule)}
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

      {/* 수정 폼 (단일 or 시리즈 - 범위는 editScope로 전달) */}
      {editSchedule && canEdit && (
        <ScheduleForm
          mode="edit"
          groupId={editSchedule.group_id}
          schedule={editSchedule}
          editScope={editScope ?? "this"}
          hideDeleteButton={!!editSchedule.recurrence_id}
          open={!!editSchedule}
          onOpenChange={(open) => { if (!open) { setEditSchedule(null); setEditScope(null); } }}
          onCreated={handleEditCreated}
        />
      )}

      {/* 반복 일정 수정 범위 선택 다이얼로그 */}
      <RecurrenceEditDialog
        open={recurrenceEditDialogOpen}
        onOpenChange={(open) => {
          setRecurrenceEditDialogOpen(open);
          if (!open) setPendingEditSchedule(null);
        }}
        onSelect={handleRecurrenceEditSelect}
      />

      {/* 반복 일정 삭제 범위 선택 다이얼로그 */}
      <RecurrenceDeleteDialog
        open={recurrenceDeleteDialogOpen}
        onOpenChange={(open) => {
          setRecurrenceDeleteDialogOpen(open);
          if (!open) setPendingDeleteSchedule(null);
        }}
        onSelect={(scope) => {
          if (pendingDeleteSchedule) {
            handleDeleteConfirm(pendingDeleteSchedule, scope);
          }
        }}
        loading={deleteLoading}
      />

      {/* 일정 상세 모달 */}
      <Dialog open={!!detailSchedule} onOpenChange={(open) => { if (!open) setDetailSchedule(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-1.5">
              {detailSchedule?.title}
              {detailSchedule?.recurrence_id && (
                <RefreshCw className="h-3 w-3 text-muted-foreground" />
              )}
            </DialogTitle>
          </DialogHeader>
          {detailSchedule && (
            <div className="space-y-3">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {format(new Date(detailSchedule.starts_at), "yyyy년 M월 d일 (EEE) HH:mm", { locale: ko })}
                    {" ~ "}
                    {format(new Date(detailSchedule.ends_at), "HH:mm")}
                  </span>
                </div>
                {detailSchedule.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{detailSchedule.location}</span>
                  </div>
                )}
                {detailSchedule.description && (
                  <p className="text-xs whitespace-pre-wrap pt-1">{detailSchedule.description}</p>
                )}
              </div>

              {/* RSVP 섹션 */}
              <div className="border-t pt-3">
                <RsvpSection scheduleId={detailSchedule.id} />
              </div>

              <div className="flex gap-2 flex-wrap">
                {canEdit && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={deleteLoading}
                      onClick={() => {
                        const target = detailSchedule;
                        setDetailSchedule(null);
                        handleEditClick(target);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      수정
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={deleteLoading}
                      onClick={() => {
                        const target = detailSchedule;
                        setDetailSchedule(null);
                        handleDeleteClick(target);
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      삭제
                    </Button>
                  </>
                )}
                {attendancePath && (
                  <Button asChild size="sm" className="h-7 text-xs">
                    <Link href={`${attendancePath}?schedule=${detailSchedule.id}`}>
                      출석 관리
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const icsContent = scheduleToIcs(detailSchedule);
                    downloadIcs(icsContent, `${detailSchedule.title}.ics`);
                    toast.success("캘린더 파일을 다운로드했습니다");
                  }}
                >
                  <CalendarPlus className="h-3 w-3 mr-1" />
                  캘린더에 추가
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 날짜별 일정 더보기 모달 */}
      <Dialog open={!!overflowDay} onOpenChange={(open) => { if (!open) setOverflowDay(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {overflowDay && format(overflowDay, "M월 d일 (EEE) 일정", { locale: ko })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            {overflowDay &&
              getSchedulesForDay(overflowDay).map((schedule) => (
                <button
                  key={schedule.id}
                  className="w-full text-left rounded border px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setOverflowDay(null);
                    setDetailSchedule(schedule);
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium">{schedule.title}</p>
                    {schedule.recurrence_id && (
                      <RefreshCw className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(schedule.starts_at), "HH:mm")}
                    </span>
                    {schedule.location && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {schedule.location}
                      </span>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
