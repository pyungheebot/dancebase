"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

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
    { dedupingInterval: 30000 }, // 30초 dedup으로 중복 호출 방지
  );
}

