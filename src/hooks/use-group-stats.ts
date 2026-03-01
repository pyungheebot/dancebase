"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { staticConfig } from "@/lib/swr/cache-config";

export type GroupStats = {
  memberCount: number;
  thisMonthScheduleCount: number;
  thisMonthPostCount: number;
  projectCount: number;
};

export function useGroupStats(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupStats(groupId) : null,
    async (): Promise<GroupStats> => {
      const supabase = createClient();

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const nextMonthDate = new Date(year, month, 1);
      const monthEnd = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-01`;

      const [membersRes, schedulesRes, postsRes, projectsRes] = await Promise.all([
        // 총 멤버 수
        supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId),

        // 이번 달 일정 수 (그룹 레벨: project_id가 null인 것 + 그룹 하위 프로젝트 포함)
        supabase
          .from("schedules")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .gte("starts_at", monthStart)
          .lt("starts_at", monthEnd),

        // 이번 달 게시글 수
        supabase
          .from("board_posts")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .gte("created_at", monthStart)
          .lt("created_at", monthEnd),

        // 프로젝트 수
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId),
      ]);

      return {
        memberCount: membersRes.count ?? 0,
        thisMonthScheduleCount: schedulesRes.count ?? 0,
        thisMonthPostCount: postsRes.count ?? 0,
        projectCount: projectsRes.count ?? 0,
      };
    },
    staticConfig,
  );

  return {
    stats: data ?? {
      memberCount: 0,
      thisMonthScheduleCount: 0,
      thisMonthPostCount: 0,
      projectCount: 0,
    },
    loading: isLoading,
    refetch: () => mutate(),
  };
}
