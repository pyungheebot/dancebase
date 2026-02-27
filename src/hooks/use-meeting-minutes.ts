"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { MeetingMinute } from "@/types";

export function useMeetingMinutes(groupId: string, projectId?: string | null) {
  const fetcher = async (): Promise<MeetingMinute[]> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("meeting_minutes")
      .select("*")
      .eq("group_id", groupId)
      .order("meeting_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    } else {
      query = query.is("project_id", null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MeetingMinute[];
  };

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.meetingMinutes(groupId, projectId) : null,
    fetcher
  );

  return {
    minutes: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
