"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { ScheduleRsvpSummary, ScheduleRsvpResponse } from "@/types";

export function useScheduleRsvp(scheduleId: string | null) {
  const { data, isLoading, mutate } = useSWR(
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

  return {
    rsvp: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
