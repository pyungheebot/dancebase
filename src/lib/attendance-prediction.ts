import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * RSVP 'yes(going)' 응답 수와 과거 show rate를 기반으로 예상 출석 인원을 계산합니다.
 * @param rsvpYesCount - RSVP 'going' 응답 수
 * @param historicalShowRate - 과거 show rate (0 ~ 1 사이 소수)
 * @returns 예상 출석 인원 (정수)
 */
export function predictAttendance(rsvpYesCount: number, historicalShowRate: number): number {
  if (rsvpYesCount <= 0) return 0;
  return Math.round(rsvpYesCount * historicalShowRate);
}

/**
 * 그룹의 과거 3개월 RSVP 응답 vs 실제 출석 비율(show rate)을 계산합니다.
 * - RSVP 'going'인 사람 중 실제 출석(present/late)한 비율
 * - 데이터가 없으면 기본값 0.85(85%)를 반환합니다.
 */
export async function calculateShowRate(
  groupId: string,
  supabase: SupabaseClient
): Promise<number> {
  const DEFAULT_SHOW_RATE = 0.85;

  try {
    // 과거 3개월 기준 날짜
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString();
    const nowStr = new Date().toISOString();

    // 1. 과거 3개월 내 종료된 일정 조회 (그룹 소속)
    const { data: pastSchedules, error: scheduleError } = await supabase
      .from("schedules")
      .select("id")
      .eq("group_id", groupId)
      .gte("starts_at", threeMonthsAgoStr)
      .lt("starts_at", nowStr);

    if (scheduleError || !pastSchedules || pastSchedules.length === 0) {
      return DEFAULT_SHOW_RATE;
    }

    const scheduleIds = pastSchedules.map((s: { id: string }) => s.id);

    // 2. 해당 일정들의 RSVP 'going' 응답 조회
    const { data: rsvpRows, error: rsvpError } = await supabase
      .from("schedule_rsvp")
      .select("schedule_id, user_id")
      .in("schedule_id", scheduleIds)
      .eq("response", "going");

    if (rsvpError || !rsvpRows || rsvpRows.length === 0) {
      return DEFAULT_SHOW_RATE;
    }

    // 3. 실제 출석(present/late) 데이터 조회
    const { data: attendanceRows, error: attendanceError } = await supabase
      .from("attendance")
      .select("schedule_id, user_id, status")
      .in("schedule_id", scheduleIds)
      .in("status", ["present", "late"]);

    if (attendanceError) {
      return DEFAULT_SHOW_RATE;
    }

    const attendedSet = new Set(
      (attendanceRows ?? []).map(
        (a: { schedule_id: string; user_id: string }) => `${a.schedule_id}:${a.user_id}`
      )
    );

    // 4. RSVP going 중 실제 출석한 비율 계산
    const totalRsvpGoing = rsvpRows.length;
    const actuallyAttended = rsvpRows.filter(
      (r: { schedule_id: string; user_id: string }) =>
        attendedSet.has(`${r.schedule_id}:${r.user_id}`)
    ).length;

    if (totalRsvpGoing === 0) return DEFAULT_SHOW_RATE;

    const showRate = actuallyAttended / totalRsvpGoing;

    // show rate가 너무 낮거나 높으면 기본값으로 보정하지 않고 그대로 반환
    return showRate;
  } catch {
    return DEFAULT_SHOW_RATE;
  }
}
