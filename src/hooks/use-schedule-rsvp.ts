"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { optimisticMutate } from "@/lib/swr/optimistic";
import type { ScheduleRsvpSummary, ScheduleRsvpResponse } from "@/types";

export function useScheduleRsvp(scheduleId: string | null) {
  const { data, isLoading, mutate } = useSWR<ScheduleRsvpSummary | null>(
    scheduleId ? swrKeys.scheduleRsvp(scheduleId) : null,
    async () => {
      if (!scheduleId) return null;
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: rows, error } = await supabase
        .from("schedule_rsvp")
        .select("response, user_id")
        .eq("schedule_id", scheduleId);

      if (error) throw error;

      type RsvpRow = { response: string; user_id: string };
      const typedRows = (rows ?? []) as RsvpRow[];

      const going = typedRows.filter((r) => r.response === "going").length;
      const not_going = typedRows.filter((r) => r.response === "not_going").length;
      const maybe = typedRows.filter((r) => r.response === "maybe").length;
      const myRow = typedRows.find((r) => r.user_id === user?.id);

      return {
        going,
        not_going,
        maybe,
        my_response: (myRow?.response as ScheduleRsvpResponse) ?? null,
      } satisfies ScheduleRsvpSummary;
    }
  );

  // 낙관적 업데이트 헬퍼: 카운트를 새 응답 기준으로 재계산
  const buildOptimisticData = (
    current: ScheduleRsvpSummary | null | undefined,
    newResponse: ScheduleRsvpResponse | null
  ): ScheduleRsvpSummary | null => {
    const prev = current ?? { going: 0, not_going: 0, maybe: 0, my_response: null };
    const prevResponse = prev.my_response;

    // 이전 응답 카운트 차감
    const decremented = {
      going: prevResponse === "going" ? Math.max(0, prev.going - 1) : prev.going,
      not_going: prevResponse === "not_going" ? Math.max(0, prev.not_going - 1) : prev.not_going,
      maybe: prevResponse === "maybe" ? Math.max(0, prev.maybe - 1) : prev.maybe,
    };

    // 새 응답 카운트 증가
    return {
      going: newResponse === "going" ? decremented.going + 1 : decremented.going,
      not_going: newResponse === "not_going" ? decremented.not_going + 1 : decremented.not_going,
      maybe: newResponse === "maybe" ? decremented.maybe + 1 : decremented.maybe,
      my_response: newResponse,
    };
  };

  // RSVP 제출 (낙관적 업데이트 + 서버 요청 + 실패 시 자동 롤백)
  const submitRsvp = async (userId: string, response: ScheduleRsvpResponse) => {
    if (!scheduleId) return;

    const key = swrKeys.scheduleRsvp(scheduleId);
    const ok = await optimisticMutate<ScheduleRsvpSummary | null>(
      key,
      (current) => buildOptimisticData(current, response),
      async () => {
        const supabase = createClient();
        const { error } = await supabase.from("schedule_rsvp").upsert(
          {
            schedule_id: scheduleId,
            user_id: userId,
            response,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "schedule_id,user_id" }
        );
        if (error) throw error;
      },
      {
        revalidate: true,  // 성공 후 서버 최신값으로 재검증
        rollbackOnError: true,
      }
    );

    if (!ok) {
      throw new Error("RSVP 제출에 실패했습니다.");
    }
  };

  // RSVP 취소 (낙관적 업데이트 + 서버 요청 + 실패 시 자동 롤백)
  const cancelRsvp = async (userId: string) => {
    if (!scheduleId) return;

    const key = swrKeys.scheduleRsvp(scheduleId);
    const ok = await optimisticMutate<ScheduleRsvpSummary | null>(
      key,
      (current) => buildOptimisticData(current, null),
      async () => {
        const supabase = createClient();
        const { error } = await supabase
          .from("schedule_rsvp")
          .delete()
          .eq("schedule_id", scheduleId)
          .eq("user_id", userId);
        if (error) throw error;
      },
      {
        revalidate: true,
        rollbackOnError: true,
      }
    );

    if (!ok) {
      throw new Error("RSVP 취소에 실패했습니다.");
    }
  };

  return {
    rsvp: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
    submitRsvp,
    cancelRsvp,
  };
}
