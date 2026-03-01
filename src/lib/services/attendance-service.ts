import { createClient } from "@/lib/supabase/client";
import type { AttendanceStatus } from "@/types";
import type { AttendanceInsert, AttendanceRow } from "@/types/database-helpers";

// ============================================
// 출석 서비스
// ============================================

/**
 * 일괄 출석 상태 upsert (전체 출석/전체 결석 처리)
 */
export async function bulkUpsertAttendance(
  scheduleId: string,
  userIds: string[],
  status: "present" | "absent"
): Promise<void> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const upsertData: AttendanceInsert[] = userIds.map((userId) => ({
    schedule_id: scheduleId,
    user_id: userId,
    status,
    checked_at: now,
  }));
  const { error } = await supabase
    .from("attendance")
    .upsert(upsertData, { onConflict: "schedule_id,user_id" });
  if (error) throw error;
}

/**
 * 일괄 출석 기록 삭제 (전체 미정 처리)
 */
export async function bulkDeleteAttendance(
  scheduleId: string,
  userIds: string[]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("schedule_id", scheduleId)
    .in("user_id", userIds);
  if (error) throw error;
}

/**
 * 특정 일정의 출석 기록 전체 조회
 */
export async function getAttendanceBySchedule(
  scheduleId: string
): Promise<(AttendanceRow & { profiles: { id: string; name: string; avatar_url: string | null } | null })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("*, profiles(id, name, avatar_url)")
    .eq("schedule_id", scheduleId);
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any;
}

/**
 * 개별 출석 상태 업데이트 또는 삽입
 */
export async function upsertAttendance(
  scheduleId: string,
  userId: string,
  status: AttendanceStatus
): Promise<void> {
  const supabase = createClient();
  const record: AttendanceInsert = {
    schedule_id: scheduleId,
    user_id: userId,
    status,
    checked_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("attendance")
    .upsert(record, { onConflict: "schedule_id,user_id" });
  if (error) throw error;
}
