"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { FinanceSplit, FinanceSplitMember } from "@/types";

export type FinanceSplitWithMembers = FinanceSplit & {
  paid_by_profile: { id: string; name: string; avatar_url: string | null } | null;
  finance_split_members: (FinanceSplitMember & {
    profiles: { id: string; name: string; avatar_url: string | null } | null;
  })[];
};

export function useFinanceSplits(groupId: string, projectId?: string | null) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.financeSplits(groupId, projectId),
    async (): Promise<FinanceSplitWithMembers[]> => {
      const supabase = createClient();

      let query = supabase
        .from("finance_splits")
        .select(
          `*,
          paid_by_profile:profiles!finance_splits_paid_by_fkey(id, name, avatar_url),
          finance_split_members(
            id, split_id, user_id, amount, is_settled, settled_at,
            profiles(id, name, avatar_url)
          )`
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        query = query.is("project_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as FinanceSplitWithMembers[];
    }
  );

  return {
    splits: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
