"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { immutableConfig } from "@/lib/swr/cache-config";

export type IndependentEntityRow = {
  entity_id: string;
  feature: string;
};

/**
 * get_all_independent_project_ids RPC 결과를 SWR로 캐싱하는 훅.
 * 같은 groupId에 대해 30초 내에 여러 컴포넌트/훅이 호출해도
 * SWR dedupingInterval 덕분에 실제 RPC는 한 번만 실행됩니다.
 *
 * feature별 entity_id 목록은 반환값을 filter하여 사용하세요.
 * 예: data?.filter(e => e.feature === "schedule").map(e => e.entity_id)
 */
export function useIndependentEntityIds(groupId: string | undefined) {
  const supabase = createClient();

  return useSWR(
    groupId ? swrKeys.independentEntities(groupId) : null,
    async () => {
      const { data, error } = await supabase.rpc(
        "get_all_independent_project_ids",
        { p_group_id: groupId },
      );
      if (error) throw error;
      return (data ?? []) as IndependentEntityRow[];
    },
    // immutableConfig: 세션 중 독립 엔티티 목록은 거의 변하지 않음 (dedupingInterval 60초)
    immutableConfig,
  );
}

