"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { ScheduleTemplate } from "@/types";

export function useScheduleTemplates(
  entityType: "group" | "project",
  entityId: string
) {
  const { data, isLoading, mutate } = useSWR(
    entityId ? swrKeys.scheduleTemplates(entityType, entityId) : null,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("schedule_templates")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ScheduleTemplate[];
    }
  );

  return {
    templates: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
