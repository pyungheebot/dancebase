import { createClient } from "@/lib/supabase/client";
import type { AttendanceMethod } from "@/types";

// ============================================
// 일정 서비스
// ============================================

// 컴포넌트에서 buildUpdatePayload()로 생성하는 공통 페이로드 타입
export type ScheduleUpdatePayload = {
  title: string;
  description: string | null;
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  attendanceMethod: AttendanceMethod;
  startsAt: string;
  endsAt: string;
  lateThreshold: string | null;
  attendanceDeadline: string | null;
  requireCheckout: boolean;
  maxAttendees: number | null;
};

// createRecurringSchedules에 전달되는 행 타입
export type RecurringScheduleRow = ScheduleUpdatePayload & {
  groupId: string;
  projectId: string | null;
  createdBy: string;
  recurrenceId: string;
};

// createSchedule에 전달되는 단일 생성 페이로드 타입
export type CreateSchedulePayload = ScheduleUpdatePayload & {
  groupId: string;
  projectId: string | null;
  createdBy: string;
};

// ============================================
// 단일 일정 생성
// ============================================

export async function createSchedule(
  payload: CreateSchedulePayload,
  recurrenceId: string | null
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("schedules").insert({
    group_id: payload.groupId,
    project_id: payload.projectId,
    title: payload.title,
    description: payload.description,
    location: payload.location,
    address: payload.address,
    latitude: payload.latitude,
    longitude: payload.longitude,
    attendance_method: payload.attendanceMethod,
    starts_at: payload.startsAt,
    ends_at: payload.endsAt,
    late_threshold: payload.lateThreshold,
    attendance_deadline: payload.attendanceDeadline,
    require_checkout: payload.requireCheckout,
    max_attendees: payload.maxAttendees,
    created_by: payload.createdBy,
    recurrence_id: recurrenceId,
  });
  if (error) throw error;
}

// ============================================
// 반복 일정 일괄 생성
// ============================================

export async function createRecurringSchedules(
  rows: RecurringScheduleRow[]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("schedules").insert(
    rows.map((r) => ({
      group_id: r.groupId,
      project_id: r.projectId,
      title: r.title,
      description: r.description,
      location: r.location,
      address: r.address,
      latitude: r.latitude,
      longitude: r.longitude,
      attendance_method: r.attendanceMethod,
      starts_at: r.startsAt,
      ends_at: r.endsAt,
      late_threshold: r.lateThreshold,
      attendance_deadline: r.attendanceDeadline,
      require_checkout: r.requireCheckout,
      max_attendees: r.maxAttendees,
      created_by: r.createdBy,
      recurrence_id: r.recurrenceId,
    }))
  );
  if (error) throw error;
}

// ============================================
// 단일 일정 수정 (이 일정만)
// ============================================

export async function updateSchedule(
  scheduleId: string,
  payload: ScheduleUpdatePayload
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("schedules")
    .update({
      title: payload.title,
      description: payload.description,
      location: payload.location,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
      attendance_method: payload.attendanceMethod,
      starts_at: payload.startsAt,
      ends_at: payload.endsAt,
      late_threshold: payload.lateThreshold,
      attendance_deadline: payload.attendanceDeadline,
      require_checkout: payload.requireCheckout,
      max_attendees: payload.maxAttendees,
    })
    .eq("id", scheduleId);
  if (error) throw error;
}

// ============================================
// 반복 일정 - 이 일정 이후 모두 수정
// ============================================

export async function updateScheduleThisAndFuture(
  targets: Array<{ id: string; date: string }>,
  basePayload: ScheduleUpdatePayload,
  buildStartsAt: (date: string) => string,
  buildEndsAt: (date: string) => string,
  buildLateThreshold: (date: string) => string | null,
  buildAttendanceDeadline: (date: string) => string | null
): Promise<void> {
  const supabase = createClient();
  for (const target of targets) {
    const { error } = await supabase
      .from("schedules")
      .update({
        title: basePayload.title,
        description: basePayload.description,
        location: basePayload.location,
        address: basePayload.address,
        latitude: basePayload.latitude,
        longitude: basePayload.longitude,
        attendance_method: basePayload.attendanceMethod,
        starts_at: buildStartsAt(target.date),
        ends_at: buildEndsAt(target.date),
        late_threshold: buildLateThreshold(target.date),
        attendance_deadline: buildAttendanceDeadline(target.date),
        require_checkout: basePayload.requireCheckout,
        max_attendees: basePayload.maxAttendees,
      })
      .eq("id", target.id);
    if (error) throw error;
  }
}

// ============================================
// 반복 일정 - 전체 시리즈 수정
// ============================================

export async function updateScheduleSeries(
  targets: Array<{ id: string; date: string }>,
  basePayload: ScheduleUpdatePayload,
  buildStartsAt: (date: string) => string,
  buildEndsAt: (date: string) => string,
  buildLateThreshold: (date: string) => string | null,
  buildAttendanceDeadline: (date: string) => string | null
): Promise<void> {
  const supabase = createClient();
  for (const target of targets) {
    const { error } = await supabase
      .from("schedules")
      .update({
        title: basePayload.title,
        description: basePayload.description,
        location: basePayload.location,
        address: basePayload.address,
        latitude: basePayload.latitude,
        longitude: basePayload.longitude,
        attendance_method: basePayload.attendanceMethod,
        starts_at: buildStartsAt(target.date),
        ends_at: buildEndsAt(target.date),
        late_threshold: buildLateThreshold(target.date),
        attendance_deadline: buildAttendanceDeadline(target.date),
        require_checkout: basePayload.requireCheckout,
        max_attendees: basePayload.maxAttendees,
      })
      .eq("id", target.id);
    if (error) throw error;
  }
}

// ============================================
// 반복 일정 대상 조회
// ============================================

/**
 * 이 일정 이후 모두 수정을 위한 대상 행 조회
 */
export async function fetchSchedulesFromRecurrence(
  recurrenceId: string,
  fromStartsAt: string
): Promise<
  Array<{
    id: string;
    starts_at: string;
    ends_at: string;
    late_threshold: string | null;
    attendance_deadline: string | null;
  }>
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("id, starts_at, ends_at, late_threshold, attendance_deadline")
    .eq("recurrence_id", recurrenceId)
    .gte("starts_at", fromStartsAt);
  if (error) throw error;
  return data ?? [];
}

/**
 * 전체 시리즈 수정을 위한 대상 행 조회
 */
export async function fetchAllSchedulesInSeries(
  recurrenceId: string
): Promise<Array<{ id: string; starts_at: string }>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("id, starts_at")
    .eq("recurrence_id", recurrenceId);
  if (error) throw error;
  return data ?? [];
}

// ============================================
// 일정 삭제 (출석 기록 포함)
// ============================================

export async function deleteScheduleWithAttendance(
  scheduleId: string
): Promise<void> {
  const supabase = createClient();
  const { error: attendanceError } = await supabase
    .from("attendance")
    .delete()
    .eq("schedule_id", scheduleId);
  if (attendanceError) throw attendanceError;

  const { error: scheduleError } = await supabase
    .from("schedules")
    .delete()
    .eq("id", scheduleId);
  if (scheduleError) throw scheduleError;
}
