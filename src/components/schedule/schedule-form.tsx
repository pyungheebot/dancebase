"use client";

import { useReducer, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useFormRecovery } from "@/hooks/use-form-recovery";
import { FormRecoveryBanner } from "@/components/shared/form-recovery-banner";
import { Button } from "@/components/ui/button";
import {
  createSchedule,
  createRecurringSchedules,
  updateSchedule,
  updateScheduleThisAndFuture,
  updateScheduleSeries,
  fetchSchedulesFromRecurrence,
  fetchAllSchedulesInSeries,
  deleteScheduleWithAttendance,
} from "@/lib/services/schedule-service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScheduleFormFields, type ScheduleFieldValues } from "./schedule-form-fields";
import type { ScheduleFormFieldErrors } from "./schedule-form-fields";
import { RecurringScheduleForm, type RecurringScheduleValue } from "./recurring-schedule-form";
import type { Schedule } from "@/types";
import { generateRecurringDates } from "@/lib/recurring-schedule";
import {
  validateRequired,
  validateDateRange,
  validateTimeRange,
} from "@/lib/validation";
import { useScheduleConflictCheck } from "@/hooks/use-schedule-conflict-check";
import { ScheduleConflictWarning } from "./schedule-conflict-warning";

const DEFAULT_FIELDS: ScheduleFieldValues = {
  title: "",
  description: "",
  location: "",
  address: "",
  latitude: null,
  longitude: null,
  attendanceMethod: "admin",
  lateThresholdTime: "",
  attendanceDeadlineTime: "",
  requireCheckout: false,
  startTime: "",
  endTime: "",
  maxAttendees: "",
};

function toLocalDate(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd");
}

function toLocalTime(iso: string) {
  return format(new Date(iso), "HH:mm");
}

/**
 * 날짜 문자열(yyyy-MM-dd)과 시간 문자열(HH:mm)을 조합하여 ISO 8601 문자열로 변환합니다.
 * 브라우저 로컬 타임존 offset을 명시적으로 붙여 서버/클라이언트 타임존 불일치 문제를 방지합니다.
 * 예) "2026-02-27" + "14:30" + KST → "2026-02-27T14:30:00+09:00" → UTC 변환 시 "2026-02-27T05:30:00.000Z"
 */
function toISOWithLocalOffset(dateStr: string, timeStr: string): string {
  const offsetMs = new Date().getTimezoneOffset() * -1 * 60 * 1000;
  const absMin = Math.abs(new Date().getTimezoneOffset());
  const sign = offsetMs >= 0 ? "+" : "-";
  const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
  const mm = String(absMin % 60).padStart(2, "0");
  return new Date(`${dateStr}T${timeStr}:00${sign}${hh}:${mm}`).toISOString();
}

type RecurrenceScope = "this" | "this_and_future" | "all";

/** sessionStorage에 저장되는 복구 가능한 필드 (UI/에러 상태 제외) */
type ScheduleFormRecoveryState = {
  fields: ScheduleFieldValues;
  date: string;
  recurringValue: RecurringScheduleValue;
};

type ScheduleFormProps = {
  groupId: string;
  projectId?: string | null;
  onCreated: () => void;
  mode?: "create" | "edit";
  schedule?: Schedule;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // 반복 일정 수정 범위 (edit 모드에서만 사용)
  editScope?: RecurrenceScope;
  // 폼 내부 삭제 버튼 숨기기 (외부에서 삭제 처리할 때)
  hideDeleteButton?: boolean;
  // 템플릿에서 불러온 초기값
  prefill?: Partial<{
    title: string;
    description: string;
    location: string;
  }> | null;
  // 충돌 감지를 위한 기존 일정 목록
  existingSchedules?: Schedule[];
};

// ── State / Action 타입 ────────────────────────────────────────────────────

type FormState = {
  fields: ScheduleFieldValues;
  date: string;
  recurringValue: RecurringScheduleValue;
  error: string | null;
  titleError: string | null;
  timeError: string | null;
  dateRangeError: string | null;
  deleteConfirmOpen: boolean;
};

type FormAction =
  | { type: "SET_FIELDS"; partial: Partial<ScheduleFieldValues> }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_RECURRING"; value: RecurringScheduleValue }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_TITLE_ERROR"; error: string | null }
  | { type: "SET_TIME_ERROR"; error: string | null }
  | { type: "SET_DATE_RANGE_ERROR"; error: string | null }
  | { type: "SET_DELETE_CONFIRM_OPEN"; open: boolean }
  | { type: "RESET" }
  | { type: "SET_INITIAL"; state: Partial<FormState> };

const INITIAL_RECURRING: RecurringScheduleValue = {
  enabled: false,
  pattern: "weekly",
  endDate: "",
};

const INITIAL_STATE: FormState = {
  fields: DEFAULT_FIELDS,
  date: "",
  recurringValue: INITIAL_RECURRING,
  error: null,
  titleError: null,
  timeError: null,
  dateRangeError: null,
  deleteConfirmOpen: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELDS":
      return { ...state, fields: { ...state.fields, ...action.partial } };
    case "SET_DATE":
      return { ...state, date: action.date };
    case "SET_RECURRING":
      return { ...state, recurringValue: action.value };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_TITLE_ERROR":
      return { ...state, titleError: action.error };
    case "SET_TIME_ERROR":
      return { ...state, timeError: action.error };
    case "SET_DATE_RANGE_ERROR":
      return { ...state, dateRangeError: action.error };
    case "SET_DELETE_CONFIRM_OPEN":
      return { ...state, deleteConfirmOpen: action.open };
    case "RESET":
      return INITIAL_STATE;
    case "SET_INITIAL":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

export function ScheduleForm({
  groupId,
  projectId,
  onCreated,
  mode = "create",
  schedule,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  editScope = "this",
  hideDeleteButton = false,
  prefill,
  existingSchedules: _es = [],
}: ScheduleFormProps) {
  const isEdit = mode === "edit";

  const [internalOpen, dispatchOpen] = useReducer(
    (_: boolean, v: boolean) => v,
    false
  );
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || ((v: boolean) => dispatchOpen(v));

  const submitAction = useAsyncAction();
  const deleteAction = useAsyncAction();
  const [state, dispatch] = useReducer(formReducer, INITIAL_STATE);
  const { user } = useAuth();

  // 폼 복구 훅 (create 모드에서만 활성화)
  const recoveryKey = `schedule-form-${groupId}${projectId ? `-${projectId}` : ""}`;
  const recoveryState: ScheduleFormRecoveryState = {
    fields: state.fields,
    date: state.date,
    recurringValue: state.recurringValue,
  };
  const {
    saveOnError: saveScheduleOnError,
    clearSaved: clearScheduleSaved,
    hasSavedData: hasScheduleSavedData,
    restore: restoreSchedule,
    dismiss: dismissSchedule,
  } = useFormRecovery<ScheduleFormRecoveryState>(recoveryKey, recoveryState, {
    onRestore: (saved) => {
      dispatch({
        type: "SET_INITIAL",
        state: {
          fields: saved.fields,
          date: saved.date,
          recurringValue: saved.recurringValue,
        },
      });
    },
  });

  // Create mode: prefill from template
  useEffect(() => {
    if (open && !isEdit && prefill) {
      dispatch({
        type: "SET_FIELDS",
        partial: {
          title: prefill.title ?? state.fields.title,
          description: prefill.description ?? state.fields.description,
          location: prefill.location ?? state.fields.location,
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, prefill]);

  // Edit mode: initialize from schedule
  useEffect(() => {
    if (open && isEdit && schedule) {
      dispatch({
        type: "SET_INITIAL",
        state: {
          fields: {
            title: schedule.title,
            description: schedule.description || "",
            location: schedule.location || "",
            address: schedule.address || "",
            latitude: schedule.latitude,
            longitude: schedule.longitude,
            attendanceMethod: schedule.attendance_method,
            lateThresholdTime: schedule.late_threshold
              ? toLocalTime(schedule.late_threshold)
              : "",
            attendanceDeadlineTime: schedule.attendance_deadline
              ? toLocalTime(schedule.attendance_deadline)
              : "",
            requireCheckout: schedule.require_checkout,
            startTime: toLocalTime(schedule.starts_at),
            endTime: toLocalTime(schedule.ends_at),
            maxAttendees:
              schedule.max_attendees != null
                ? String(schedule.max_attendees)
                : "",
          },
          date: toLocalDate(schedule.starts_at),
          error: null,
        },
      });
    }
  }, [open, isEdit, schedule]);

  const recurringDateStrings = useMemo(() => {
    if (!state.recurringValue.enabled || !state.date || !state.recurringValue.endDate)
      return [];
    return generateRecurringDates(
      state.date,
      state.recurringValue.endDate,
      state.recurringValue.pattern
    );
  }, [
    state.recurringValue.enabled,
    state.recurringValue.pattern,
    state.date,
    state.recurringValue.endDate,
  ]);

  // 충돌 감지: 날짜/시간이 모두 입력된 경우에만 검사 (debounce 500ms)
  const conflictStartsAt =
    state.date && state.fields.startTime
      ? (() => {
          try {
            return toISOWithLocalOffset(state.date, state.fields.startTime);
          } catch {
            return null;
          }
        })()
      : null;
  const conflictEndsAt =
    state.date && state.fields.endTime
      ? (() => {
          try {
            return toISOWithLocalOffset(state.date, state.fields.endTime);
          } catch {
            return null;
          }
        })()
      : null;

  const { conflicts: conflictingSchedules } = useScheduleConflictCheck({
    startsAt: conflictStartsAt,
    endsAt: conflictEndsAt,
    groupId,
    excludeScheduleId: isEdit ? schedule?.id : undefined,
  });

  const resetForm = () => dispatch({ type: "RESET" });

  const validateScheduleForm = (): boolean => {
    const newTitleError = validateRequired(state.fields.title, "제목");
    const newTimeError = validateTimeRange(
      state.fields.startTime,
      state.fields.endTime
    );
    const newDateRangeError = state.recurringValue.enabled
      ? validateDateRange(state.date, state.recurringValue.endDate)
      : null;
    dispatch({ type: "SET_TITLE_ERROR", error: newTitleError });
    dispatch({ type: "SET_TIME_ERROR", error: newTimeError });
    dispatch({ type: "SET_DATE_RANGE_ERROR", error: newDateRangeError });
    return !newTitleError && !newTimeError && !newDateRangeError;
  };

  const isScheduleFormValid =
    !validateRequired(state.fields.title, "제목") &&
    !validateTimeRange(state.fields.startTime, state.fields.endTime) &&
    !(state.recurringValue.enabled
      ? validateDateRange(state.date, state.recurringValue.endDate)
      : null);

  // ScheduleFieldValues에서 공통 메타 필드(startsAt/endsAt 제외) 추출
  const buildCommonPayload = () => ({
    title: state.fields.title,
    description: state.fields.description || null,
    location: state.fields.location || null,
    address: state.fields.address || null,
    latitude: state.fields.latitude,
    longitude: state.fields.longitude,
    attendanceMethod: state.fields.attendanceMethod,
    requireCheckout:
      state.fields.attendanceMethod !== "none"
        ? state.fields.requireCheckout
        : false,
    maxAttendees: state.fields.maxAttendees
      ? parseInt(state.fields.maxAttendees, 10)
      : null,
    // startsAt / endsAt / lateThreshold / attendanceDeadline은 날짜별로 계산
    startsAt: "",
    endsAt: "",
    lateThreshold: null as string | null,
    attendanceDeadline: null as string | null,
  });

  const buildFullPayload = (dateStr: string) => ({
    ...buildCommonPayload(),
    startsAt: toISOWithLocalOffset(dateStr, state.fields.startTime),
    endsAt: toISOWithLocalOffset(dateStr, state.fields.endTime),
    lateThreshold: state.fields.lateThresholdTime
      ? toISOWithLocalOffset(dateStr, state.fields.lateThresholdTime)
      : null,
    attendanceDeadline: state.fields.attendanceDeadlineTime
      ? toISOWithLocalOffset(dateStr, state.fields.attendanceDeadlineTime)
      : null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateScheduleForm()) return;
    dispatch({ type: "SET_ERROR", error: null });

    await submitAction
      .execute(async () => {
        if (
          state.fields.attendanceMethod === "location" &&
          (state.fields.latitude == null || state.fields.longitude == null)
        ) {
          dispatch({
            type: "SET_ERROR",
            error: "위치 기반 출석을 사용하려면 주소를 검색해주세요.",
          });
          return;
        }

        if (isEdit && schedule) {
          if (editScope === "this" || !schedule.recurrence_id) {
            // 이 일정만 수정 (단일 update)
            await updateSchedule(schedule.id, buildFullPayload(state.date));
          } else if (editScope === "this_and_future") {
            // 이후 모든 일정 수정 (날짜 유지, 시간/장소 변경)
            const rawTargets = await fetchSchedulesFromRecurrence(
              schedule.recurrence_id,
              schedule.starts_at
            );
            const targets = rawTargets.map((t) => ({
              id: t.id,
              date: format(new Date(t.starts_at), "yyyy-MM-dd"),
            }));
            const common = buildCommonPayload();
            await updateScheduleThisAndFuture(
              targets,
              common,
              (d: string) => toISOWithLocalOffset(d, state.fields.startTime),
              (d: string) => toISOWithLocalOffset(d, state.fields.endTime),
              (d: string) =>
                state.fields.lateThresholdTime
                  ? toISOWithLocalOffset(d, state.fields.lateThresholdTime)
                  : null,
              (d: string) =>
                state.fields.attendanceDeadlineTime
                  ? toISOWithLocalOffset(d, state.fields.attendanceDeadlineTime)
                  : null
            );
          } else {
            // 전체 시리즈 수정 (날짜 유지, 시간/장소 변경)
            const rawTargets = await fetchAllSchedulesInSeries(
              schedule.recurrence_id
            );
            const targets = rawTargets.map((t) => ({
              id: t.id,
              date: format(new Date(t.starts_at), "yyyy-MM-dd"),
            }));
            const common = buildCommonPayload();
            await updateScheduleSeries(
              targets,
              common,
              (d: string) => toISOWithLocalOffset(d, state.fields.startTime),
              (d: string) => toISOWithLocalOffset(d, state.fields.endTime),
              (d: string) =>
                state.fields.lateThresholdTime
                  ? toISOWithLocalOffset(d, state.fields.lateThresholdTime)
                  : null,
              (d: string) =>
                state.fields.attendanceDeadlineTime
                  ? toISOWithLocalOffset(d, state.fields.attendanceDeadlineTime)
                  : null
            );
          }
        } else {
          if (!user) return;

          if (state.recurringValue.enabled) {
            if (recurringDateStrings.length === 0) {
              dispatch({
                type: "SET_ERROR",
                error: "생성할 일정이 없습니다. 반복 설정을 확인해주세요.",
              });
              return;
            }

            // 같은 시리즈 전체에 동일한 recurrence_id 부여
            const seriesId = crypto.randomUUID();
            const rows = recurringDateStrings.map((dateStr) => ({
              groupId,
              projectId: projectId || null,
              ...buildFullPayload(dateStr),
              createdBy: user.id,
              recurrenceId: seriesId,
            }));
            await createRecurringSchedules(rows);
            toast.success(
              `${recurringDateStrings.length}개의 일정이 생성되었습니다`
            );
          } else {
            await createSchedule(
              {
                groupId,
                projectId: projectId || null,
                createdBy: user.id,
                ...buildFullPayload(state.date),
              },
              null
            );
            toast.success("일정이 생성되었습니다");
          }
        }

        if (!isEdit) clearScheduleSaved();
        setOpen(false);
        if (!isEdit) resetForm();
        onCreated();
      })
      .catch(() => {
        if (!isEdit) saveScheduleOnError();
        dispatch({
          type: "SET_ERROR",
          error: isEdit
            ? "일정 수정에 실패했습니다"
            : "일정 생성에 실패했습니다",
        });
      });
  };

  const handleDelete = async () => {
    if (!schedule) return;
    await deleteAction
      .execute(async () => {
        await deleteScheduleWithAttendance(schedule.id);
        setOpen(false);
        onCreated();
      })
      .catch(() => {
        dispatch({ type: "SET_ERROR", error: "일정 삭제에 실패했습니다" });
      });
  };

  const dateSection = isEdit ? (
    <div className="space-y-1">
      <Label htmlFor="edit-date" className="text-xs">날짜</Label>
      <Input
        id="edit-date"
        type="date"
        value={state.date}
        onChange={(e) =>
          dispatch({ type: "SET_DATE", date: e.target.value })
        }
        required
      />
    </div>
  ) : (
    <>
      {/* 시작일 (단일/반복 공통) */}
      <div className="space-y-1">
        <Label htmlFor="date" className="text-xs">
          {state.recurringValue.enabled ? "시작일" : "날짜"}
        </Label>
        <Input
          id="date"
          type="date"
          value={state.date}
          onChange={(e) => {
            dispatch({ type: "SET_DATE", date: e.target.value });
            if (state.recurringValue.enabled) {
              dispatch({
                type: "SET_DATE_RANGE_ERROR",
                error: validateDateRange(
                  e.target.value,
                  state.recurringValue.endDate
                ),
              });
            }
          }}
          required
        />
      </div>

      {/* 반복 설정 서브컴포넌트 */}
      <RecurringScheduleForm
        value={state.recurringValue}
        onChange={(v) => {
          dispatch({ type: "SET_RECURRING", value: v });
          if (v.enabled) {
            dispatch({
              type: "SET_DATE_RANGE_ERROR",
              error: validateDateRange(state.date, v.endDate),
            });
          } else {
            dispatch({ type: "SET_DATE_RANGE_ERROR", error: null });
          }
        }}
        startDate={state.date}
      />
    </>
  );

  const editScopeLabel: Record<RecurrenceScope, string> = {
    this: "이 일정만",
    this_and_future: "이후 모든 일정",
    all: "전체 시리즈",
  };

  const dialogContent = (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "일정 수정" : "새 일정 등록"}
          {isEdit && schedule?.recurrence_id && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({editScopeLabel[editScope]})
            </span>
          )}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
        {!isEdit && hasScheduleSavedData && (
          <FormRecoveryBanner
            onRestore={restoreSchedule}
            onDismiss={dismissSchedule}
          />
        )}
        <ScheduleFormFields
          values={state.fields}
          onChange={(partial) => {
            dispatch({ type: "SET_FIELDS", partial });
            // 시간 변경 시 실시간 재검증
            if ("startTime" in partial || "endTime" in partial) {
              const newStart =
                "startTime" in partial
                  ? (partial.startTime ?? state.fields.startTime)
                  : state.fields.startTime;
              const newEnd =
                "endTime" in partial
                  ? (partial.endTime ?? state.fields.endTime)
                  : state.fields.endTime;
              dispatch({
                type: "SET_TIME_ERROR",
                error: validateTimeRange(newStart, newEnd),
              });
            }
            // 제목 변경 시 실시간 재검증
            if ("title" in partial) {
              dispatch({
                type: "SET_TITLE_ERROR",
                error: validateRequired(partial.title ?? "", "제목"),
              });
            }
          }}
          dateSection={dateSection}
          groupId={groupId}
          prefix={isEdit ? "edit" : ""}
          errors={
            {
              title: state.titleError ?? undefined,
              timeRange: state.timeError ?? undefined,
            } satisfies ScheduleFormFieldErrors
          }
          onBlurTitle={() =>
            dispatch({
              type: "SET_TITLE_ERROR",
              error: validateRequired(state.fields.title, "제목"),
            })
          }
          onBlurTime={() =>
            dispatch({
              type: "SET_TIME_ERROR",
              error: validateTimeRange(
                state.fields.startTime,
                state.fields.endTime
              ),
            })
          }
        />

        {state.dateRangeError && state.recurringValue.enabled && (
          <p className="text-xs text-destructive">{state.dateRangeError}</p>
        )}

        {/* 일정 충돌 경고 */}
        <ScheduleConflictWarning conflicts={conflictingSchedules} />

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        {isEdit ? (
          <div className="flex gap-2">
            {!hideDeleteButton && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 text-sm"
                  disabled={deleteAction.pending}
                  onClick={() =>
                    dispatch({ type: "SET_DELETE_CONFIRM_OPEN", open: true })
                  }
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  삭제
                </Button>
                <ConfirmDialog
                  open={state.deleteConfirmOpen}
                  onOpenChange={(open) =>
                    dispatch({ type: "SET_DELETE_CONFIRM_OPEN", open })
                  }
                  title="일정 삭제"
                  description="이 일정과 관련된 출석 기록이 모두 삭제됩니다. 정말 삭제하시겠습니까?"
                  onConfirm={handleDelete}
                  destructive
                />
              </>
            )}
            <Button
              type="submit"
              className="flex-1 h-8 text-sm"
              disabled={submitAction.pending || !isScheduleFormValid}
            >
              {submitAction.pending ? "저장 중..." : "저장"}
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            className="w-full h-8 text-sm"
            disabled={submitAction.pending || !isScheduleFormValid}
          >
            {submitAction.pending ? "생성 중..." : "등록"}
          </Button>
        )}
      </form>
    </DialogContent>
  );

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          일정 추가
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
