"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type LocationSuggestion = {
  location: string;
  count: number;
};

/**
 * 그룹의 기존 일정 데이터에서 사용된 장소 목록을 빈도순으로 조회합니다.
 * DB 마이그레이션 없이 schedules.location 컬럼에서 추출합니다.
 */
export function useLocationSuggestions(groupId: string) {
  const { data, isLoading } = useSWR(
    groupId ? swrKeys.locationSuggestions(groupId) : null,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("schedules")
        .select("location")
        .eq("group_id", groupId)
        .not("location", "is", null)
        .neq("location", "");

      if (error) return [] as LocationSuggestion[];

      // 빈도 집계: 같은 장소명이 몇 번 등장했는지 계산
      const countMap = new Map<string, number>();
      for (const row of data ?? []) {
        const loc = row.location as string;
        countMap.set(loc, (countMap.get(loc) ?? 0) + 1);
      }

      // 빈도 내림차순 정렬 후 반환
      return Array.from(countMap.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count);
    }
  );

  return {
    suggestions: data ?? [],
    loading: isLoading,
  };
}
