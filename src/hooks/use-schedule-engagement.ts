"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { ScheduleEngagementResult } from "@/types";

export function useScheduleEngagement(scheduleId: string | null) {
  const { data, isLoading, mutate } = useSWR(
    scheduleId ? swrKeys.scheduleEngagement(scheduleId) : null,
    async (): Promise<ScheduleEngagementResult> => {
      if (!scheduleId) throw new Error("scheduleId가 필요합니다.");
      const supabase = createClient();

      // 1) RSVP 목록 조회
      const { data: rsvpRows, error: rsvpError } = await supabase
        .from("schedule_rsvp")
        .select("user_id, response")
        .eq("schedule_id", scheduleId);

      if (rsvpError) throw rsvpError;

      type RsvpRow = { user_id: string; response: string };
      const rsvps = (rsvpRows ?? []) as RsvpRow[];

      const going = rsvps.filter((r) => r.response === "going").length;
      const maybe = rsvps.filter((r) => r.response === "maybe").length;
      const not_going = rsvps.filter((r) => r.response === "not_going").length;
      const responded = rsvps.length;

      // 2) 출석 목록 조회 (그룹 멤버 전체 기준 총원 계산용으로 schedule 정보도 가져옴)
      const { data: attendanceRows, error: attError } = await supabase
        .from("attendance")
        .select("user_id, status")
        .eq("schedule_id", scheduleId);

      if (attError) throw attError;

      type AttRow = { user_id: string; status: string };
      const attendances = (attendanceRows ?? []) as AttRow[];

      const actual_attended = attendances.filter(
        (a) => a.status === "present"
      ).length;

      // 3) 전체 대상 인원: RSVP 응답자 + 출석 기록자 중 중복 제거
      const allUserIds = new Set<string>([
        ...rsvps.map((r) => r.user_id),
        ...attendances.map((a) => a.user_id),
      ]);
      const total = allUserIds.size;

      const no_response = Math.max(0, total - responded);

      // 4) RSVP 정확도: going 응답자 중 실제 출석 비율
      let rsvp_accuracy: number | null = null;
      if (going > 0) {
        const goingUserIds = new Set(
          rsvps.filter((r) => r.response === "going").map((r) => r.user_id)
        );
        const goingAndAttended = attendances.filter(
          (a) => a.status === "present" && goingUserIds.has(a.user_id)
        ).length;
        rsvp_accuracy = Math.round((goingAndAttended / going) * 100);
      }

      // 5) 전체 출석률
      const attendance_rate =
        total > 0 ? Math.round((actual_attended / total) * 100) : null;

      return {
        rsvp: { going, maybe, not_going, no_response, total },
        actual_attended,
        rsvp_accuracy,
        attendance_rate,
      };
    }
  );

  return {
    engagement: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
