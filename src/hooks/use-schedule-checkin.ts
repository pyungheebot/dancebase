"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateScheduleCheckinCode, invalidateAttendance } from "@/lib/swr/invalidate";
import type { ScheduleCheckinCode } from "@/types";

/** 6자리 영숫자 대문자 랜덤 코드 생성 */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동 문자(O,0,I,1) 제외
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function useScheduleCheckin(scheduleId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.scheduleCheckinCode(scheduleId),
    async () => {
      const supabase = createClient();
      const now = new Date().toISOString();

      // 현재 유효한(만료되지 않은) 코드 조회
      const { data, error } = await supabase
        .from("schedule_checkin_codes")
        .select("*")
        .eq("schedule_id", scheduleId)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ScheduleCheckinCode | null;
    },
    { refreshInterval: 10000 } // 10초마다 만료 여부 자동 갱신
  );

  /** 리더용: 새 체크인 코드 생성 (유효시간 15분) */
  const generateCheckinCode = async (): Promise<ScheduleCheckinCode | null> => {
    const supabase = createClient();

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("인증이 필요합니다");

    const { data, error } = await supabase
      .from("schedule_checkin_codes")
      .insert({
        schedule_id: scheduleId,
        code,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    invalidateScheduleCheckinCode(scheduleId);
    return data as ScheduleCheckinCode;
  };

  /**
   * 멤버용: 코드 입력 후 출석 체크
   * @returns "success" | "already" | "invalid" | "expired"
   */
  const submitCheckin = async (
    inputCode: string
  ): Promise<"success" | "already" | "invalid" | "expired"> => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("인증이 필요합니다");

    const now = new Date().toISOString();

    // 코드 조회 (대소문자 무시)
    const { data: codeRow, error: codeError } = await supabase
      .from("schedule_checkin_codes")
      .select("*")
      .eq("schedule_id", scheduleId)
      .eq("code", inputCode.toUpperCase().trim())
      .maybeSingle();

    if (codeError) throw codeError;
    if (!codeRow) return "invalid";
    if (codeRow.expires_at < now) return "expired";

    // 이미 체크인 여부 확인
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("schedule_id", scheduleId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) return "already";

    // 출석 체크 (upsert)
    const { error: upsertError } = await supabase.from("attendance").upsert(
      {
        schedule_id: scheduleId,
        user_id: user.id,
        status: "present",
        checked_at: now,
      },
      { onConflict: "schedule_id,user_id" }
    );

    if (upsertError) throw upsertError;

    invalidateAttendance(scheduleId);
    return "success";
  };

  return {
    activeCode: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
    generateCheckinCode,
    submitCheckin,
  };
}
