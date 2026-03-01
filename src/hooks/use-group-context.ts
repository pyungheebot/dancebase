"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { immutableConfig } from "@/lib/swr/cache-config";

interface GroupContext {
  role: "leader" | "sub_leader" | "member";
  permissions: string[];
}

/**
 * 그룹 멤버 역할 + entity_permissions를 한 번의 RPC로 조회.
 *
 * use-finance, use-projects 등에서 각각 수행하던
 * group_members + entity_permissions 이중 쿼리를 대체한다.
 *
 * 반환값:
 *   - role: "leader" | "sub_leader" | "member"
 *   - permissions: string[]  (e.g. ["finance_manage", "finance_view"])
 *   - isLeader / isSubLeader / isMember: 편의 플래그
 *   - hasPermission(perm): 특정 권한 보유 여부
 */
export function useGroupContext(groupId: string | undefined | null) {
  const { data, isLoading, mutate } = useSWR<GroupContext | null>(
    groupId ? `group-context-${groupId}` : null,
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc("get_user_group_context", {
        p_group_id: groupId!,
      });
      if (error) throw error;

      // 비멤버 또는 미인증이면 null
      if (!data) return null;

      return data as GroupContext;
    },
    immutableConfig,
  );

  const role = data?.role ?? null;
  const permissions = data?.permissions ?? [];

  return {
    /** 멤버 역할 ("leader" | "sub_leader" | "member" | null) */
    role,
    /** 보유 권한 목록 */
    permissions,
    /** 리더 여부 (조상 상속은 DB 함수가 처리) */
    isLeader: role === "leader",
    isSubLeader: role === "sub_leader",
    isMember: role === "member",
    /** 특정 권한 보유 여부 */
    hasPermission: (perm: string) => permissions.includes(perm),
    loading: isLoading,
    refetch: () => mutate(),
  };
}
