"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { Project } from "@/types";

type MyProject = Pick<Project, "id" | "name" | "group_id"> & { is_shared?: boolean };
type ProjectsByGroup = Record<string, MyProject[]>;

export function useMyProjects() {
  const { data, isLoading } = useSWR(
    swrKeys.myProjects(),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return {} as ProjectsByGroup;

      // 프로젝트 멤버로 참여 중인 프로젝트
      const { data: memberships } = await supabase
        .from("project_members")
        .select("project_id, projects(id, name, group_id, status)")
        .eq("user_id", user.id);

      const grouped: ProjectsByGroup = {};
      const seen = new Set<string>();

      if (memberships) {
        for (const m of memberships) {
          const project = m.projects as unknown as Pick<Project, "id" | "name" | "group_id" | "status"> | null;
          if (!project || project.status === "종료") continue;
          seen.add(project.id);
          if (!grouped[project.group_id]) grouped[project.group_id] = [];
          grouped[project.group_id].push(project);
        }
      }

      // 사용자가 속한 그룹에 공유된 프로젝트
      const { data: myGroups } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (myGroups && myGroups.length > 0) {
        const groupIds = myGroups.map((g: { group_id: string }) => g.group_id);
        const { data: sharedRows } = await supabase
          .from("project_shared_groups")
          .select("group_id, projects(id, name, group_id, status)")
          .in("group_id", groupIds);

        if (sharedRows) {
          for (const row of sharedRows) {
            const project = row.projects as unknown as Pick<Project, "id" | "name" | "group_id" | "status"> | null;
            if (!project || project.status === "종료" || seen.has(project.id)) continue;
            seen.add(project.id);
            // 공유 프로젝트는 공유받은 그룹 아래에 표시
            const targetGroupId = row.group_id;
            if (!grouped[targetGroupId]) grouped[targetGroupId] = [];
            grouped[targetGroupId].push({ ...project, is_shared: true });
          }
        }
      }

      return grouped;
    },
  );

  return {
    projectsByGroup: data ?? {},
    loading: isLoading,
  };
}
