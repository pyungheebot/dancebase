"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

type SubgroupItem = {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  visibility: string;
  member_count: number;
};

type AncestorItem = {
  id: string;
  name: string;
  depth: number;
};

export function useSubgroups(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.subgroups(groupId),
    async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_group_children", {
        p_group_id: groupId,
      });
      return (data as SubgroupItem[]) || [];
    },
  );

  return {
    subgroups: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

export function useGroupAncestors(groupId: string) {
  const { data, isLoading } = useSWR(
    swrKeys.groupAncestors(groupId),
    async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_group_ancestors", {
        gid: groupId,
      });
      return (data as AncestorItem[]) || [];
    },
  );

  return {
    ancestors: data ?? [],
    loading: isLoading,
  };
}
