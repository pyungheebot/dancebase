"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { Project, ProjectMemberWithProfile, ProjectSharedGroup } from "@/types";
import { invalidateSharedGroups } from "@/lib/swr/invalidate";

interface ProjectsData {
  projects: (Project & { member_count: number; is_shared: boolean })[];
  canManage: boolean;
}

export function useProjects(groupId: string) {
  const fetcher = async (): Promise<ProjectsData> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { projects: [], canManage: false };
    }

    const [projectsRes, membershipRes, permissionsRes] = await Promise.all([
      supabase.rpc("get_group_projects", {
        p_group_id: groupId,
        p_user_id: user.id,
      }),
      supabase.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).single(),
      supabase.from("entity_permissions").select("permission").eq("entity_type", "group").eq("entity_id", groupId).eq("user_id", user.id).eq("permission", "project_manage"),
    ]);

    if (projectsRes.error) console.error("[useProjects] RPC error:", projectsRes.error);
    if (membershipRes.error) console.error("[useProjects] membership error:", membershipRes.error);

    const projects = (projectsRes.data ?? []) as (Project & { member_count: number; is_shared: boolean })[];

    const isLeader = membershipRes.data?.role === "leader";
    const isProjectManager = (permissionsRes.data ?? []).length > 0;
    const canManage = isLeader || isProjectManager;

    return { projects, canManage };
  };

  const { data, isLoading, mutate } = useSWR(
    swrKeys.projects(groupId),
    fetcher,
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
      supabase.from("project_members").select("*, profiles(*)").eq("project_id", projectId).order("joined_at"),
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
