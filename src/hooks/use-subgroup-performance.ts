"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type SubgroupPerformance = {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  member_count: number;
  monthly_post_count: number;
  last_activity_at: string | null;
};

export function useSubgroupPerformance(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.subgroupPerformance(groupId) : null,
    async () => {
      const supabase = createClient();

      // 서브그룹 목록 조회
      const { data: subgroups } = await supabase.rpc("get_group_children", {
        p_group_id: groupId,
      });

      if (!subgroups || subgroups.length === 0) return [];

      const subgroupIds = (subgroups as { id: string }[]).map((s) => s.id);

      // 이번 달 시작일 계산
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 각 서브그룹의 이번 달 게시글 수 집계
      const { data: postCounts } = await supabase
        .from("board_posts")
        .select("group_id")
        .in("group_id", subgroupIds)
        .gte("created_at", monthStart);

      // 각 서브그룹의 가장 최근 게시글 날짜
      const { data: lastPosts } = await supabase
        .from("board_posts")
        .select("group_id, created_at")
        .in("group_id", subgroupIds)
        .order("created_at", { ascending: false });

      // 각 서브그룹의 가장 최근 일정 날짜
      const { data: lastSchedules } = await supabase
        .from("schedules")
        .select("group_id, starts_at")
        .in("group_id", subgroupIds)
        .order("starts_at", { ascending: false });

      // 게시글 수 맵 생성
      const monthlyPostMap: Record<string, number> = {};
      for (const post of postCounts ?? []) {
        const gid = (post as { group_id: string }).group_id;
        monthlyPostMap[gid] = (monthlyPostMap[gid] ?? 0) + 1;
      }

      // 마지막 게시글 날짜 맵 생성
      const lastPostMap: Record<string, string> = {};
      for (const post of lastPosts ?? []) {
        const p = post as { group_id: string; created_at: string };
        if (!lastPostMap[p.group_id]) {
          lastPostMap[p.group_id] = p.created_at;
        }
      }

      // 마지막 일정 날짜 맵 생성
      const lastScheduleMap: Record<string, string> = {};
      for (const schedule of lastSchedules ?? []) {
        const s = schedule as { group_id: string; starts_at: string };
        if (!lastScheduleMap[s.group_id]) {
          lastScheduleMap[s.group_id] = s.starts_at;
        }
      }

      // 최근 활동일 계산 (게시글과 일정 중 더 최근 날짜)
      const getLastActivity = (gid: string): string | null => {
        const postDate = lastPostMap[gid] ?? null;
        const scheduleDate = lastScheduleMap[gid] ?? null;
        if (!postDate && !scheduleDate) return null;
        if (!postDate) return scheduleDate;
        if (!scheduleDate) return postDate;
        return postDate > scheduleDate ? postDate : scheduleDate;
      };

      return (subgroups as {
        id: string;
        name: string;
        description: string | null;
        group_type: string;
        member_count: number;
      }[]).map((sub) => ({
        id: sub.id,
        name: sub.name,
        description: sub.description,
        group_type: sub.group_type,
        member_count: sub.member_count,
        monthly_post_count: monthlyPostMap[sub.id] ?? 0,
        last_activity_at: getLastActivity(sub.id),
      })) as SubgroupPerformance[];
    }
  );

  return {
    performances: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
