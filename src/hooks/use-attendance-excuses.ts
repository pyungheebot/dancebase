"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateAttendanceExcuses } from "@/lib/swr/invalidate";
import type { Attendance, ExcuseStatus } from "@/types";

export type AttendanceExcuse = Pick<
  Attendance,
  "id" | "schedule_id" | "user_id" | "status" | "excuse_reason" | "excuse_status"
>;

export function useAttendanceExcuses(scheduleId: string) {
  const { data, isLoading, mutate } = useSWR(
    scheduleId ? swrKeys.attendanceExcuses(scheduleId) : null,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("attendance")
        .select("id, schedule_id, user_id, status, excuse_reason, excuse_status")
        .eq("schedule_id", scheduleId)
        .not("excuse_reason", "is", null);

      if (error) throw error;
      return (data ?? []) as AttendanceExcuse[];
    }
  );

  return {
    excuses: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

/**
 * 면제 신청 (멤버 본인)
 * - 이미 attendance 행이 있으면 UPDATE, 없으면 INSERT(absent + excuse)
 */
export async function submitExcuse(
  scheduleId: string,
  userId: string,
  reason: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  // 기존 출석 행 확인
  const { data: existing, error: fetchErr } = await supabase
    .from("attendance")
    .select("id")
    .eq("schedule_id", scheduleId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };

  if (existing) {
    const { error } = await supabase
      .from("attendance")
      .update({
        excuse_reason: reason,
        excuse_status: "pending",
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("attendance").insert({
      schedule_id: scheduleId,
      user_id: userId,
      status: "absent",
      excuse_reason: reason,
      excuse_status: "pending",
    });
    if (error) return { error: error.message };
  }

  invalidateAttendanceExcuses(scheduleId);
  return { error: null };
}

/**
 * 면제 승인/거절 (리더 전용)
 */
export async function reviewExcuse(
  scheduleId: string,
  attendanceId: string,
  decision: "approved" | "rejected"
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("attendance")
    .update({ excuse_status: decision as ExcuseStatus })
    .eq("id", attendanceId);

  if (error) return { error: error.message };

  invalidateAttendanceExcuses(scheduleId);
  return { error: null };
}

/**
 * 특정 사용자의 면제 신청 상태 조회
 */
export async function getMyExcuse(
  scheduleId: string,
  userId: string
): Promise<AttendanceExcuse | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("attendance")
    .select("id, schedule_id, user_id, status, excuse_reason, excuse_status")
    .eq("schedule_id", scheduleId)
    .eq("user_id", userId)
    .maybeSingle();
  return data as AttendanceExcuse | null;
}
