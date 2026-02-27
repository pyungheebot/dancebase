"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { ActivityLogWithProfile } from "@/types";

const LIMIT = 50;

export function useActivityLog(entityType: "group" | "project", entityId: string) {
  const { data, isLoading, mutate } = useSWR(
    entityId ? swrKeys.activityLogs(entityType, entityId) : null,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*, profiles(id, name, avatar_url)")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false })
        .limit(LIMIT);

      if (error) throw error;
      return (data ?? []) as ActivityLogWithProfile[];
    }
  );

  return {
    logs: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
