"use client";

import { useReducer, useCallback } from "react";
import { addMonths, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import type { RecurrenceScope } from "@/components/schedule/recurrence-dialog";
import type { Schedule } from "@/types";

// --- useReducer 상태/액션 타입 ---
export type CalendarState = {
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

type UseCalendarStateOptions = {
  onScheduleUpdated?: () => void;
};

// 캘린더 상태 관리 훅 (reducer + 핸들러 로직)
export function useCalendarState({ onScheduleUpdated }: UseCalendarStateOptions = {}) {
  const [state, dispatch] = useReducer(calendarReducer, initialCalendarState);
  const singleDeleteDialog = useConfirmDialog<Schedule>();

  // 수정 버튼 클릭: 반복 일정이면 범위 선택 다이얼로그, 단일이면 바로 수정 폼
  const handleEditClick = useCallback((schedule: Schedule) => {
    if (schedule.recurrence_id) {
      dispatch({ type: "OPEN_RECURRENCE_EDIT", schedule });
    } else {
      dispatch({ type: "OPEN_EDIT", schedule, scope: "this" });
    }
  }, []);

  // 반복 수정 범위 선택 후 수정 폼 열기
  const handleRecurrenceEditSelect = useCallback(
    (scope: RecurrenceScope) => {
      const schedule = state.pendingEditSchedule;
      dispatch({ type: "CLOSE_RECURRENCE_EDIT" });
      if (schedule) {
        dispatch({ type: "OPEN_EDIT", schedule, scope });
      }
    },
    [state.pendingEditSchedule]
  );

  // 삭제 버튼 클릭: 반복 일정이면 범위 선택 다이얼로그, 단일이면 확인 다이얼로그
  const handleDeleteClick = useCallback(
    (schedule: Schedule) => {
      if (schedule.recurrence_id) {
        dispatch({ type: "OPEN_RECURRENCE_DELETE", schedule });
      } else {
        singleDeleteDialog.requestConfirm(schedule, schedule.title);
      }
    },
    [singleDeleteDialog]
  );

  // 삭제 실행 (scope에 따라 단일/이후/전체 처리)
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

  // 단일 일정 삭제 확인 처리
  const handleSingleDeleteConfirm = useCallback(() => {
    const schedule = singleDeleteDialog.confirm();
    if (!schedule) return;
    handleDeleteConfirm(schedule, "this");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleDeleteDialog]);

  // 상세 다이얼로그에서 수정 클릭 (상세 닫고 수정 열기)
  const handleDetailEditClick = useCallback(
    (schedule: Schedule) => {
      dispatch({ type: "CLOSE_DETAIL" });
      handleEditClick(schedule);
    },
    [handleEditClick]
  );

  // 상세 다이얼로그에서 삭제 클릭 (상세 닫고 삭제 처리)
  const handleDetailDeleteClick = useCallback(
    (schedule: Schedule) => {
      dispatch({ type: "CLOSE_DETAIL" });
      handleDeleteClick(schedule);
    },
    [handleDeleteClick]
  );

  // 수정 폼 제출 완료 콜백
  const handleEditCreated = useCallback(() => {
    dispatch({ type: "CLOSE_EDIT" });
    onScheduleUpdated?.();
  }, [onScheduleUpdated]);

  return {
    state,
    dispatch,
    singleDeleteDialog,
    handleEditClick,
    handleRecurrenceEditSelect,
    handleDeleteClick,
    handleDeleteConfirm,
    handleSingleDeleteConfirm,
    handleDetailEditClick,
    handleDetailDeleteClick,
    handleEditCreated,
  };
}
