"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type LocationHistoryItem = {
  location: string;
  count: number;
};

/**
 * 그룹의 기존 일정 데이터에서 사용된 장소 히스토리를 조회합니다.
 * - schedules.location 컬럼에서 추출 (별도 DB 테이블 불필요)
 * - 중복 제거 후 사용 빈도 내림차순 정렬
 * - query로 텍스트 필터링 지원
 */
export function useLocationHistory(groupId: string, query?: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.locationSuggestions(groupId) : null,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("schedules")
        .select("location")
        .eq("group_id", groupId)
        .not("location", "is", null)
        .neq("location", "");

      if (error) return [] as LocationHistoryItem[];

      // 빈도 집계
      const countMap = new Map<string, number>();
      for (const row of data ?? []) {
        const loc = (row.location as string).trim();
        if (!loc) continue;
        countMap.set(loc, (countMap.get(loc) ?? 0) + 1);
      }

      // 빈도 내림차순 정렬
      return Array.from(countMap.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count);
    }
  );

  const allItems = data ?? [];

  // 검색어로 필터링
  const filtered =
    query && query.trim()
      ? allItems.filter((item) =>
          item.location.toLowerCase().includes(query.trim().toLowerCase())
        )
      : allItems;

  return {
    history: filtered,
    allHistory: allItems,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
