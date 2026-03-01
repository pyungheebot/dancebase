"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { GroupMemberWithProfile } from "@/types";

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

export function useParentGroupMembers(parentGroupId: string | null) {
  const { data, isLoading } = useSWR(
    parentGroupId ? swrKeys.parentGroupMembers(parentGroupId) : null,
    async () => {
      if (!parentGroupId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("group_members")
        .select("*, profiles(id, name, avatar_url)")
        .eq("group_id", parentGroupId)
        .order("joined_at");
      if (error) return [];
      return (data as GroupMemberWithProfile[]) || [];
    },
  );

  return {
    members: data ?? [],
    loading: isLoading,
  };
}
