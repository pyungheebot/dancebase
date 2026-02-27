"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export function usePendingJoinRequestCount(groupId: string, enabled = true) {
  const { data, isLoading, mutate } = useSWR(
    enabled && groupId ? swrKeys.pendingJoinRequestCount(groupId) : null,
    async () => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from("join_requests")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("status", "pending");
      if (error) return 0;
      return count ?? 0;
    },
  );

  return {
    count: data ?? 0,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
