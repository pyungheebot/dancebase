"use client";

import { useReducer, useCallback } from "react";
import { isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, format } from "date-fns";
import { formatYearMonth, formatShortDateTime, formatKo, formatTime } from "@/lib/date-utils";
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
import { ChevronLeft, ChevronRight, MapPin, Clock, Pencil, Calendar, Trash2, RefreshCw, CalendarPlus, Download, AlertTriangle } from "lucide-react";
import { ScheduleForm } from "./schedule-form";
import { AttendancePredictionBadge, AttendancePredictionCard } from "./attendance-prediction-card";
import { ScheduleWaitlistSection } from "./schedule-waitlist-section";
import { ScheduleRolesSection } from "./schedule-roles-section";
import { ScheduleWeatherBadge } from "./schedule-weather-badge";
import { ScheduleRetroSheet } from "./schedule-retro-sheet";
import { ScheduleLocationShare } from "./schedule-location-share";
import { ScheduleCarpoolSection } from "./schedule-carpool-section";
import { ScheduleBroadcastDialog } from "./schedule-broadcast-dialog";
import { SmartReminderDialog } from "./smart-reminder-dialog";
import { ScheduleDdayTimeline } from "./schedule-dday-timeline";
import { ScheduleCostSummary } from "./schedule-cost-summary";
import { useScheduleRsvp } from "@/hooks/use-schedule-rsvp";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useFormSubmission } from "@/hooks/use-form-submission";
import type { Schedule, ScheduleRsvpResponse } from "@/types";
import Link from "next/link";
import { scheduleToIcs, schedulesToIcs, downloadIcs, buildGoogleCalendarUrl } from "@/lib/ics";
import { ShareButton } from "@/components/shared/share-button";
import { MapEmbed } from "@/components/shared/map-embed";
import { MirrorModeDialog } from "@/components/shared/mirror-mode-dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { detectConflicts } from "@/lib/schedule-conflict";
import { useMemo } from "react";
import { useSwipe } from "@/hooks/use-swipe";

const MAX_VISIBLE_EVENTS = 2;

// 반복 일정 수정/삭제 범위 타입
type RecurrenceScope = "this" | "this_and_future" | "all";

// --- useReducer 상태/액션 타입 ---
type CalendarState = {
  currentMonth: Date;
  editSchedule: Schedule | null;
  editScope: RecurrenceScope | null;
  detailSchedule: Schedule | null;
  overflowDay: Date | null;
  recurrenceEditDialogOpen: boolean;
  recurrenceDeleteDialogOpen: boolean;
  deleteLoading: boolean;
  pendingEditSchedule: Schedule | null;
  pendingDeleteSchedule: Schedule | null;
};

type CalendarAction =
  | { type: "SET_MONTH"; month: Date }
  | { type: "PREV_MONTH" }
  | { type: "NEXT_MONTH" }
  | { type: "TODAY" }
  | { type: "OPEN_DETAIL"; schedule: Schedule }
  | { type: "CLOSE_DETAIL" }
  | { type: "OPEN_EDIT"; schedule: Schedule; scope: RecurrenceScope }
  | { type: "CLOSE_EDIT" }
  | { type: "OPEN_OVERFLOW"; day: Date }
  | { type: "CLOSE_OVERFLOW" }
  | { type: "OPEN_RECURRENCE_EDIT"; schedule: Schedule }
  | { type: "CLOSE_RECURRENCE_EDIT" }
  | { type: "OPEN_RECURRENCE_DELETE"; schedule: Schedule }
  | { type: "CLOSE_RECURRENCE_DELETE" }
  | { type: "SET_DELETE_LOADING"; loading: boolean }
  | { type: "SET_EDIT_SCOPE"; scope: RecurrenceScope }
  | { type: "DELETE_DONE" };

const initialCalendarState: CalendarState = {
  currentMonth: new Date(),
  editSchedule: null,
  editScope: null,
  detailSchedule: null,
  overflowDay: null,
  recurrenceEditDialogOpen: false,
  recurrenceDeleteDialogOpen: false,
  deleteLoading: false,
  pendingEditSchedule: null,
  pendingDeleteSchedule: null,
};

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case "SET_MONTH":
      return { ...state, currentMonth: action.month };
    case "PREV_MONTH":
      return { ...state, currentMonth: subMonths(state.currentMonth, 1) };
    case "NEXT_MONTH":
      return { ...state, currentMonth: addMonths(state.currentMonth, 1) };
    case "TODAY":
      return { ...state, currentMonth: new Date() };
    case "OPEN_DETAIL":
      return { ...state, detailSchedule: action.schedule };
    case "CLOSE_DETAIL":
      return { ...state, detailSchedule: null };
    case "OPEN_EDIT":
      return { ...state, editSchedule: action.schedule, editScope: action.scope };
    case "CLOSE_EDIT":
      return { ...state, editSchedule: null, editScope: null };
    case "OPEN_OVERFLOW":
      return { ...state, overflowDay: action.day };
    case "CLOSE_OVERFLOW":
      return { ...state, overflowDay: null };
    case "OPEN_RECURRENCE_EDIT":
      return { ...state, pendingEditSchedule: action.schedule, recurrenceEditDialogOpen: true };
    case "CLOSE_RECURRENCE_EDIT":
      return { ...state, recurrenceEditDialogOpen: false, pendingEditSchedule: null };
    case "OPEN_RECURRENCE_DELETE":
      return { ...state, pendingDeleteSchedule: action.schedule, recurrenceDeleteDialogOpen: true };
    case "CLOSE_RECURRENCE_DELETE":
      return { ...state, recurrenceDeleteDialogOpen: false, pendingDeleteSchedule: null };
    case "SET_DELETE_LOADING":
      return { ...state, deleteLoading: action.loading };
    case "SET_EDIT_SCOPE":
      return { ...state, editScope: action.scope };
    case "DELETE_DONE":
      return {
        ...state,
        detailSchedule: null,
        pendingDeleteSchedule: null,
        recurrenceDeleteDialogOpen: false,
        deleteLoading: false,
      };
    default:
      return state;
  }
}

type CalendarViewProps = {
  schedules: Schedule[];
  onSelectSchedule?: (schedule: Schedule) => void;
  canEdit?: boolean;
  onScheduleUpdated?: () => void;
  attendancePath?: string;
  /** 출석 예측 Badge 표시를 위한 그룹 ID */
  groupId?: string;
  /** 역할 배정 섹션 표시 여부 (그룹 ID 겸용) */
  canEditRoles?: boolean;
};

// RSVP + 대기 명단 통합 섹션
function RsvpSectionWithWaitlist({ schedule }: { schedule: Schedule }) {
  const { rsvp, loading, submitRsvp, cancelRsvp } = useScheduleRsvp(schedule.id);
  // useFormSubmission: pending 관리 + 에러 시 toast.error 자동 처리
  const { pending: submitting, submit } = useFormSubmission();
  const { user } = useAuth();

  const handleRsvp = async (response: ScheduleRsvpResponse) => {
    if (!user) {
      toast.error(TOAST.SCHEDULE.LOGIN_REQUIRED);
      return;
    }

    const labels: Record<ScheduleRsvpResponse, string> = {
      going: "참석",
      not_going: "불참",
      maybe: "미정",
    };

    if (rsvp?.my_response === response) {
      // 같은 응답 클릭 시 취소
      await submit(async () => {
        await cancelRsvp(user.id).catch(() => {
          throw new Error(TOAST.SCHEDULE.RSVP_CANCEL_ERROR);
        });
        toast.success(TOAST.SCHEDULE.RSVP_CANCELLED);
      });
      return;
    }

    // 새 응답 제출
    await submit(async () => {
      await submitRsvp(user.id, response).catch(() => {
        throw new Error(TOAST.SCHEDULE.RSVP_ERROR);
      });
      toast.success(`"${labels[response]}"으로 응답했습니다`);
    });
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
    <div className="space-y-3">
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

      {/* 대기 명단 섹션 */}
      <ScheduleWaitlistSection
        schedule={schedule}
        goingCount={rsvp?.going ?? 0}
      />
    </div>
  );
}

// RSVP going 수를 기본 참석 인원으로 전달하는 비용 정산 wrapper
function ScheduleCostSummaryWithRsvp({
  scheduleId,
  canEdit,
}: {
  scheduleId: string;
  canEdit: boolean;
}) {
  const { rsvp } = useScheduleRsvp(scheduleId);
  return (
    <ScheduleCostSummary
      scheduleId={scheduleId}
      defaultAttendeeCount={rsvp?.going ?? 0}
      canEdit={canEdit}
    />
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

export function CalendarView({ schedules, onSelectSchedule, canEdit, onScheduleUpdated, attendancePath, groupId, canEditRoles }: CalendarViewProps) {
  const [state, dispatch] = useReducer(calendarReducer, initialCalendarState);
  const singleDeleteDialog = useConfirmDialog<Schedule>();
  const {
    currentMonth,
    editSchedule,
    editScope,
    detailSchedule,
    overflowDay,
    recurrenceEditDialogOpen,
    recurrenceDeleteDialogOpen,
    deleteLoading,
    pendingDeleteSchedule,
    pendingEditSchedule,
  } = state;

  // 좌/우 스와이프로 월 변경
  const handleSwipe = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (direction === "left") dispatch({ type: "NEXT_MONTH" });
      if (direction === "right") dispatch({ type: "PREV_MONTH" });
    },
    []
  );
  const swipeHandlers = useSwipe({ onSwipe: handleSwipe, threshold: 50 });

  // 충돌하는 일정 ID 집합 계산 (양방향 충돌 감지)
  const conflictingIds = useMemo(() => {
    const ids = new Set<string>();
    schedules.forEach((s) => {
      const conflicts = detectConflicts(
        { starts_at: s.starts_at, ends_at: s.ends_at },
        schedules,
        s.id
      );
      if (conflicts.length > 0) {
        ids.add(s.id);
      }
    });
    return ids;
  }, [schedules]);
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
      dispatch({ type: "OPEN_RECURRENCE_EDIT", schedule });
    } else {
      // 단일 일정이면 바로 수정 폼 열기
      dispatch({ type: "OPEN_EDIT", schedule, scope: "this" });
    }
  };

  // 반복 수정 범위 선택 후
  const handleRecurrenceEditSelect = (scope: RecurrenceScope) => {
    if (!pendingEditSchedule) {
      dispatch({ type: "CLOSE_RECURRENCE_EDIT" });
      return;
    }
    const schedule = pendingEditSchedule;
    dispatch({ type: "CLOSE_RECURRENCE_EDIT" });
    dispatch({ type: "OPEN_EDIT", schedule, scope });
  };

  // 삭제 버튼 클릭
  const handleDeleteClick = (schedule: Schedule) => {
    if (schedule.recurrence_id) {
      // 반복 일정이면 범위 선택 다이얼로그 표시
      dispatch({ type: "OPEN_RECURRENCE_DELETE", schedule });
    } else {
      // 단일 일정이면 확인 다이얼로그 표시
      singleDeleteDialog.requestConfirm(schedule, schedule.title);
    }
  };

  // 단일 일정 삭제 확인
  const handleSingleDeleteConfirm = () => {
    const schedule = singleDeleteDialog.confirm();
    if (!schedule) return;
    handleDeleteConfirm(schedule, "this");
  };

  // 삭제 실행
  const handleDeleteConfirm = async (schedule: Schedule, scope: RecurrenceScope) => {
    dispatch({ type: "SET_DELETE_LOADING", loading: true });
    dispatch({ type: "CLOSE_RECURRENCE_DELETE" });
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

        toast.success(TOAST.SCHEDULE.DELETED);
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

      dispatch({ type: "DELETE_DONE" });
      onScheduleUpdated?.();
    } catch {
      toast.error(TOAST.SCHEDULE.DELETE_ERROR);
    } finally {
      dispatch({ type: "SET_DELETE_LOADING", loading: false });
    }
  };

  // ScheduleForm에서 시리즈 수정 완료 콜백
  const handleEditCreated = () => {
    dispatch({ type: "CLOSE_EDIT" });
    onScheduleUpdated?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">
          {formatYearMonth(currentMonth)}
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
                toast.success(TOAST.SCHEDULE.EXPORTED);
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
            onClick={() => dispatch({ type: "PREV_MONTH" })}
            aria-label="이전 달"
          >
            <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={() => dispatch({ type: "TODAY" })}
            aria-label="오늘로 이동"
          >
            오늘
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => dispatch({ type: "NEXT_MONTH" })}
            aria-label="다음 달"
          >
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden"
        {...swipeHandlers}
      >
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
                    onClick={() => dispatch({ type: "OPEN_DETAIL", schedule })}
                  />
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => dispatch({ type: "OPEN_OVERFLOW", day })}
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
                  {conflictingIds.has(schedule.id) && (
                    <AlertTriangle
                      className="h-3 w-3 text-yellow-500 shrink-0"
                      aria-label="다른 일정과 시간이 겹칩니다"
                    />
                  )}
                  {groupId && (
                    <AttendancePredictionBadge
                      groupId={groupId}
                      scheduleId={schedule.id}
                    />
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {formatShortDateTime(new Date(schedule.starts_at))}
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
                  aria-label={`${schedule.title} 일정 수정`}
                >
                  <Pencil className="h-3 w-3" aria-hidden="true" />
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
          onOpenChange={(open) => { if (!open) dispatch({ type: "CLOSE_EDIT" }); }}
          onCreated={handleEditCreated}
          existingSchedules={schedules}
        />
      )}

      {/* 반복 일정 수정 범위 선택 다이얼로그 */}
      <RecurrenceEditDialog
        open={recurrenceEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLOSE_RECURRENCE_EDIT" });
        }}
        onSelect={handleRecurrenceEditSelect}
      />

      {/* 단일 일정 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={singleDeleteDialog.open}
        onCancel={singleDeleteDialog.cancel}
        onConfirm={handleSingleDeleteConfirm}
        title="일정 삭제"
        itemLabel={singleDeleteDialog.targetLabel}
        loading={deleteLoading}
      />

      {/* 반복 일정 삭제 범위 선택 다이얼로그 */}
      <RecurrenceDeleteDialog
        open={recurrenceDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLOSE_RECURRENCE_DELETE" });
        }}
        onSelect={(scope) => {
          if (pendingDeleteSchedule) {
            handleDeleteConfirm(pendingDeleteSchedule, scope);
          }
        }}
        loading={deleteLoading}
      />

      {/* 일정 상세 모달 */}
      <Dialog open={!!detailSchedule} onOpenChange={(open) => { if (!open) dispatch({ type: "CLOSE_DETAIL" }); }}>
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
                    {formatKo(new Date(detailSchedule.starts_at), "yyyy년 M월 d일 (EEE) HH:mm")}
                    {" ~ "}
                    {formatTime(new Date(detailSchedule.ends_at))}
                  </span>
                </div>
                {detailSchedule.location && (
                  <>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{detailSchedule.location}</span>
                    </div>
                    <MapEmbed
                      location={detailSchedule.location}
                      address={detailSchedule.address}
                      latitude={detailSchedule.latitude}
                      longitude={detailSchedule.longitude}
                      height={160}
                      showExternalLinks={false}
                    />
                  </>
                )}
                {/* 날씨 예보 배지 */}
                <ScheduleWeatherBadge schedule={detailSchedule} />
                {detailSchedule.description && (
                  <p className="text-xs whitespace-pre-wrap pt-1">{detailSchedule.description}</p>
                )}
              </div>

              {/* RSVP + 대기 명단 섹션 */}
              <div className="border-t pt-3">
                <RsvpSectionWithWaitlist schedule={detailSchedule} />
              </div>

              {/* 출석 예측 섹션 */}
              {groupId && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">출석 예측</p>
                  <AttendancePredictionCard
                    groupId={groupId}
                    scheduleId={detailSchedule.id}
                  />
                </div>
              )}

              {/* 역할 배정 섹션 */}
              {groupId && (
                <div className="border-t pt-3">
                  <ScheduleRolesSection
                    scheduleId={detailSchedule.id}
                    groupId={groupId}
                    canEdit={canEditRoles ?? canEdit ?? false}
                  />
                </div>
              )}

              {/* 회고록 섹션 */}
              <div className="border-t pt-3">
                <ScheduleRetroSheet
                  scheduleId={detailSchedule.id}
                  canEdit={canEditRoles ?? canEdit ?? false}
                />
              </div>

              {/* 카풀 섹션 */}
              <div className="border-t pt-3">
                <ScheduleCarpoolSection scheduleId={detailSchedule.id} />
              </div>

              {/* D-Day 준비 타임라인 섹션 */}
              <div className="border-t pt-3">
                <ScheduleDdayTimeline
                  scheduleId={detailSchedule.id}
                  scheduleStartsAt={detailSchedule.starts_at}
                  canEdit={canEditRoles ?? canEdit ?? false}
                />
              </div>

              {/* 비용 정산 섹션 */}
              <div className="border-t pt-3">
                <ScheduleCostSummaryWithRsvp
                  scheduleId={detailSchedule.id}
                  canEdit={canEditRoles ?? canEdit ?? false}
                />
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
                        dispatch({ type: "CLOSE_DETAIL" });
                        handleEditClick(target);
                      }}
                      aria-label={`${detailSchedule?.title} 일정 수정`}
                    >
                      <Pencil className="h-3 w-3 mr-1" aria-hidden="true" />
                      수정
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={deleteLoading}
                      onClick={() => {
                        const target = detailSchedule;
                        dispatch({ type: "CLOSE_DETAIL" });
                        handleDeleteClick(target);
                      }}
                      aria-label={`${detailSchedule?.title} 일정 삭제`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" aria-hidden="true" />
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
                {detailSchedule.location && (
                  <ScheduleLocationShare
                    scheduleTitle={detailSchedule.title}
                    location={detailSchedule.location}
                    address={detailSchedule.address}
                    latitude={detailSchedule.latitude}
                    longitude={detailSchedule.longitude}
                  />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <CalendarPlus className="h-3 w-3 mr-1" />
                      캘린더에 추가
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <a
                        href={buildGoogleCalendarUrl(detailSchedule)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Google 캘린더에 추가 (새 탭에서 열림)"
                      >
                        <Calendar className="h-3.5 w-3.5 mr-2" />
                        Google 캘린더
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const icsContent = scheduleToIcs(detailSchedule);
                        downloadIcs(icsContent, `${detailSchedule.title}.ics`);
                        toast.success(TOAST.SCHEDULE.ICS_DOWNLOADED);
                      }}
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      ICS 파일 다운로드
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ShareButton
                  title={detailSchedule.title}
                  text={`${formatKo(new Date(detailSchedule.starts_at), "M월 d일 (EEE) HH:mm")}${detailSchedule.location ? ` | ${detailSchedule.location}` : ""}`}
                />
                {groupId && canEdit && (
                  <ScheduleBroadcastDialog
                    schedule={detailSchedule}
                    groupId={groupId}
                    canBroadcast={true}
                  />
                )}
                {groupId && canEdit && (
                  <SmartReminderDialog
                    schedule={detailSchedule}
                    groupId={groupId}
                  />
                )}
                <MirrorModeDialog />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 날짜별 일정 더보기 모달 */}
      <Dialog open={!!overflowDay} onOpenChange={(open) => { if (!open) dispatch({ type: "CLOSE_OVERFLOW" }); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {overflowDay && formatKo(overflowDay, "M월 d일 (EEE) 일정")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            {overflowDay &&
              getSchedulesForDay(overflowDay).map((schedule) => (
                <button
                  key={schedule.id}
                  className="w-full text-left rounded border px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    dispatch({ type: "CLOSE_OVERFLOW" });
                    dispatch({ type: "OPEN_DETAIL", schedule });
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
                      {formatTime(new Date(schedule.starts_at))}
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
