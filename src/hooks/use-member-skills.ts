"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { MemberSkill } from "@/types";

/**
 * 그룹 전체 멤버의 스킬 목록을 조회하는 훅.
 *
 * @param groupId - 그룹 ID
 */
export function useMemberSkills(groupId: string): {
  skills: MemberSkill[];
  loading: boolean;
  refetch: () => void;
} {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.memberSkills(groupId) : null,
    async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("member_skills")
        .select("*")
        .eq("group_id", groupId)
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as MemberSkill[];
    }
  );

  return {
    skills: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
