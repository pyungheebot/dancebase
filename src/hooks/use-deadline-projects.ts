"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type DeadlineProject = {
  id: string;
  name: string;
  group_id: string;
  group_name: string;
  end_date: string;
  diff_days: number; // 오늘 기준 종료일까지 남은 일수 (0 = D-day, 음수 = 지남)
};

const DEADLINE_THRESHOLD_DAYS = 7;

export function useDeadlineProjects() {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.deadlineProjects(),
    async (): Promise<DeadlineProject[]> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // project_members → projects → groups 조인으로 조회
      const { data: memberships, error } = await supabase
        .from("project_members")
        .select(
          "project_id, projects(id, name, group_id, end_date, status, groups(id, name))"
        )
        .eq("user_id", user.id);

      if (error || !memberships) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const results: DeadlineProject[] = [];

      for (const m of memberships) {
        const project = m.projects as unknown as {
          id: string;
          name: string;
          group_id: string;
          end_date: string | null;
          status: string;
          groups: { id: string; name: string } | null;
        } | null;

        if (!project) continue;
        if (!project.end_date) continue;
        if (project.status === "종료") continue;

        const end = new Date(project.end_date + "T00:00:00");
        end.setHours(0, 0, 0, 0);

        const diffMs = end.getTime() - today.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        // D-7 이내이고 아직 마감일이 지나지 않은 프로젝트만 (D-day 포함)
        if (diffDays >= 0 && diffDays <= DEADLINE_THRESHOLD_DAYS) {
          results.push({
            id: project.id,
            name: project.name,
            group_id: project.group_id,
            group_name: project.groups?.name ?? "",
            end_date: project.end_date,
            diff_days: diffDays,
          });
        }
      }

      // 마감 임박 순으로 정렬
      results.sort((a, b) => a.diff_days - b.diff_days);

      return results;
    }
  );

  return {
    projects: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
