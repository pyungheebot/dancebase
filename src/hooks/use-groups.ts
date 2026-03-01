"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { Group, GroupMemberWithProfile, MemberCategory } from "@/types";

export function useGroups() {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groups(),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase.rpc("get_user_groups", {
        p_user_id: user.id,
      });

      return (data as (Group & { member_count: number; my_role: string })[]) || [];
    },
  );

  return {
    groups: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

export function useGroupDetail(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupDetail(groupId),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return {
          group: null as Group | null,
          members: [] as GroupMemberWithProfile[],
          myRole: null as "leader" | "sub_leader" | "member" | null,
          nicknameMap: {} as Record<string, string>,
          categories: [] as MemberCategory[],
          categoryMap: {} as Record<string, string>,
          categoryColorMap: {} as Record<string, string>,
        };
      }

      const [groupRes, membersRes, categoriesRes] = await Promise.all([
        supabase.from("groups").select("id, name, description, invite_code, invite_code_enabled, invite_code_expires_at, created_by, created_at, group_type, visibility, join_policy, dance_genre, avatar_url, max_members, parent_group_id").eq("id", groupId).single(),
        supabase.from("group_members").select("id, group_id, user_id, role, joined_at, nickname, category_id, dashboard_settings, profiles(*)").eq("group_id", groupId).order("joined_at"),
        supabase.from("member_categories").select("id, group_id, name, sort_order, color, created_at").eq("group_id", groupId).order("sort_order"),
      ]);

      const group = groupRes.data as Group | null;
      const categoriesData = (categoriesRes.data as MemberCategory[] | null) ?? [];
      const membersData = (membersRes.data as GroupMemberWithProfile[] | null) ?? [];

      const me = membersData.find((m) => m.user_id === user.id);
      const myRole = (me?.role as "leader" | "sub_leader" | "member" | null) ?? null;

      const catLookup = Object.fromEntries(categoriesData.map((c) => [c.id, c.name]));
      const catColorLookup = Object.fromEntries(categoriesData.map((c) => [c.id, c.color || "gray"]));

      const nicknameMap: Record<string, string> = {};
      const categoryMap: Record<string, string> = {};
      const categoryColorMap: Record<string, string> = {};

      for (const m of membersData) {
        nicknameMap[m.user_id] = m.nickname || m.profiles.name;
        if (m.category_id && catLookup[m.category_id]) {
          categoryMap[m.user_id] = catLookup[m.category_id];
          categoryColorMap[m.user_id] = catColorLookup[m.category_id];
        }
      }

      return {
        group,
        members: membersData,
        myRole,
        nicknameMap,
        categories: categoriesData,
        categoryMap,
        categoryColorMap,
      };
    },
  );

  return {
    group: data?.group ?? null,
    members: data?.members ?? [],
    myRole: data?.myRole ?? null,
    nicknameMap: data?.nicknameMap ?? {},
    categories: data?.categories ?? [],
    categoryMap: data?.categoryMap ?? {},
    categoryColorMap: data?.categoryColorMap ?? {},
    loading: isLoading,
    refetch: () => mutate(),
  };
}
