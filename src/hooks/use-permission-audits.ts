"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { PermissionAudit, PermissionAuditWithProfiles } from "@/types";

const LIMIT = 100;

export function usePermissionAudits(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.permissionAudits(groupId) : null,
    async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("permission_audits")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(LIMIT);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // actor, target 프로필 일괄 조회
      const actorIds = [...new Set(data.map((d: { actor_id: string }) => d.actor_id))];
      const targetIds = [...new Set(data.map((d: { target_user_id: string }) => d.target_user_id))];
      const allIds = [...new Set([...actorIds, ...targetIds])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", allIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: { id: string; name: string; avatar_url: string | null }) => [p.id, p])
      );

      return data.map((audit: PermissionAudit) => ({
        ...audit,
        actor: profileMap.get(audit.actor_id) ?? null,
        target: profileMap.get(audit.target_user_id) ?? null,
      })) as PermissionAuditWithProfiles[];
    }
  );

  return {
    audits: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
