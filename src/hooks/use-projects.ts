"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { staticConfig } from "@/lib/swr/cache-config";
import { useGroupContext } from "@/hooks/use-group-context";
import type { Project, ProjectMemberWithProfile, ProjectSharedGroup } from "@/types";
import { invalidateSharedGroups } from "@/lib/swr/invalidate";

interface ProjectsData {
  projects: (Project & { member_count: number; is_shared: boolean })[];
  canManage: boolean;
}

export function useProjects(groupId: string) {
  // 역할 + 권한을 한 번의 RPC로 조회 (group_members + entity_permissions 통합)
  const { isLeader, hasPermission, loading: contextLoading } = useGroupContext(groupId);

  const fetcher = async (): Promise<ProjectsData> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { projects: [], canManage: false };
    }

    // 프로젝트 목록만 조회 (역할/권한은 useGroupContext에서 이미 확보)
    const projectsRes = await supabase.rpc("get_group_projects", {
      p_group_id: groupId,
      p_user_id: user.id,
    });

    if (projectsRes.error) {
      return { projects: [], canManage: false };
    }

    const projects = (projectsRes.data ?? []) as (Project & { member_count: number; is_shared: boolean })[];

    const canManage = isLeader || hasPermission("project_manage");

    return { projects, canManage };
  };

  const { data, isLoading, mutate } = useSWR(
    // context 로드 완료 후 실행
    !contextLoading ? swrKeys.projects(groupId) : null,
    fetcher,
    staticConfig,
  );

  return {
    projects: data?.projects ?? [],
    canManage: data?.canManage ?? false,
    loading: isLoading,
    refetch: () => mutate(),
  };
}

interface ProjectDetailData {
  project: Project | null;
  members: ProjectMemberWithProfile[];
  myProjectRole: "leader" | "member" | null;
}

export function useProjectDetail(projectId: string) {
  const fetcher = async (): Promise<ProjectDetailData> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { project: null, members: [], myProjectRole: null };
    }

    const [projectRes, membersRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("project_members").select("*, profiles(id, name, avatar_url)").eq("project_id", projectId).order("joined_at"),
    ]);

    const project = (projectRes.data as Project) ?? null;
    const members = (membersRes.data ?? []) as ProjectMemberWithProfile[];
    const me = members.find((m) => m.user_id === user.id);
    const myProjectRole = (me?.role as "leader" | "member") ?? null;

    return { project, members, myProjectRole };
  };

  const { data, isLoading, mutate } = useSWR(
    swrKeys.projectDetail(projectId),
    fetcher,
    staticConfig,
  );

  return {
    project: data?.project ?? null,
    members: data?.members ?? [],
    myProjectRole: data?.myProjectRole ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}

type SharedGroupWithName = ProjectSharedGroup & { groups: { name: string } };

export function useSharedGroups(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    projectId ? swrKeys.sharedGroups(projectId) : null,
    async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("project_shared_groups")
        .select("*, groups(name)")
        .eq("project_id", projectId)
        .order("shared_at");
      return (data ?? []) as SharedGroupWithName[];
    },
    staticConfig,
  );

  const addSharedGroup = async (groupId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("project_shared_groups").insert({
      project_id: projectId,
      group_id: groupId,
      shared_by: user?.id,
    });
    if (!error) {
      invalidateSharedGroups(projectId);
    }
    return { error };
  };

  const removeSharedGroup = async (groupId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("project_shared_groups")
      .delete()
      .eq("project_id", projectId)
      .eq("group_id", groupId);
    if (!error) {
      invalidateSharedGroups(projectId);
    }
    return { error };
  };

  return {
    sharedGroups: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
    addSharedGroup,
    removeSharedGroup,
  };
}
