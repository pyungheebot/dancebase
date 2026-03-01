"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { frequentConfig } from "@/lib/swr/cache-config";
import type { JoinRequestWithProfile, JoinRequestStatus } from "@/types";

export function useJoinRequests(groupId: string, status?: JoinRequestStatus | "all") {
  const statusParam = status && status !== "all" ? status : undefined;
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.joinRequests(groupId, statusParam) : null,
    async () => {
      const supabase = createClient();
      let query = supabase
        .from("join_requests")
        .select("*, profiles(id, name, avatar_url)")
        .eq("group_id", groupId)
        .order("requested_at", { ascending: false });
      if (statusParam) {
        query = query.eq("status", statusParam);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as JoinRequestWithProfile[];
    },
    frequentConfig,
  );

  return {
    requests: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

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
    frequentConfig,
  );

  return {
    count: data ?? 0,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
