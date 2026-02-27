"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateScheduleWaitlist } from "@/lib/swr/invalidate";
import type { ScheduleWaitlistWithProfile } from "@/types";

export function useScheduleWaitlist(scheduleId: string | null) {
  const { data, isLoading, mutate } = useSWR(
    scheduleId ? swrKeys.scheduleWaitlist(scheduleId) : null,
    async () => {
      if (!scheduleId) return [];
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from("schedule_waitlist")
        .select("*, profiles(id, name, avatar_url)")
        .eq("schedule_id", scheduleId)
        .order("position", { ascending: true });

      if (error) throw error;
      return (rows ?? []) as ScheduleWaitlistWithProfile[];
    }
  );

  const getCurrentUserId = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  const joinWaitlist = async () => {
    if (!scheduleId) return;
    const supabase = createClient();
    const userId = await getCurrentUserId();
    if (!userId) return;

    // 현재 최대 position 조회
    const { data: maxRow, error: maxError } = await supabase
      .from("schedule_waitlist")
      .select("position")
      .eq("schedule_id", scheduleId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxError) throw maxError;

    const nextPosition = (maxRow?.position ?? 0) + 1;

    const { error } = await supabase.from("schedule_waitlist").insert({
      schedule_id: scheduleId,
      user_id: userId,
      position: nextPosition,
    });

    if (error) throw error;
    invalidateScheduleWaitlist(scheduleId);
    mutate();
  };

  const leaveWaitlist = async () => {
    if (!scheduleId) return;
    const supabase = createClient();
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { error } = await supabase
      .from("schedule_waitlist")
      .delete()
      .eq("schedule_id", scheduleId)
      .eq("user_id", userId);

    if (error) throw error;
    invalidateScheduleWaitlist(scheduleId);
    mutate();
  };

  return {
    waitlist: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
    joinWaitlist,
    leaveWaitlist,
  };
}
