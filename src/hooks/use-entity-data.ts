"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { useGroupDetail } from "@/hooks/use-groups";
import { useGroupAncestors } from "@/hooks/use-subgroups";
import { useProjectDetail } from "@/hooks/use-projects";
import { buildEntityContext } from "@/lib/entity-utils";
import type { EntityContext } from "@/types/entity-context";
import type { FinanceRole } from "@/types";

function useEntityMeta(entityType: "group" | "project", entityId: string, groupId: string, myRole: "leader" | "member" | null) {
  const { data, isLoading } = useSWR(
    entityId ? `entity-meta/${entityType}/${entityId}` : null,
    async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { features: [], permissions: [] };

      const [featuresRes, permsRes] = await Promise.all([
        supabase
          .from("entity_features")
          .select("feature, enabled, independent")
          .eq("entity_type", entityType)
          .eq("entity_id", entityId),
        supabase
          .from("entity_permissions")
          .select("permission")
          .eq("entity_type", "group")
          .eq("entity_id", groupId)
          .eq("user_id", user.id),
      ]);

      return {
        features: (featuresRes.data ?? []) as { feature: string; enabled: boolean; independent: boolean }[],
        permissions: (permsRes.data ?? []) as { permission: string }[],
      };
    },
  );

  const financeRole: FinanceRole = useMemo(() => {
    if (myRole === "leader") return "manager";
    const perms = data?.permissions ?? [];
    if (perms.some((p) => p.permission === "finance_manage")) return "manager";
    if (perms.some((p) => p.permission === "finance_view")) return "viewer";
    return null;
  }, [myRole, data?.permissions]);

  return {
    entityFeatures: data?.features ?? [],
    userPermissions: data?.permissions ?? [],
    financeRole,
    loading: isLoading,
  };
}

export function useGroupEntity(groupId: string) {
  const {
    group,
    members,
    myRole,
    nicknameMap,
    categories,
    categoryMap,
    categoryColorMap,
    loading: groupLoading,
    refetch,
  } = useGroupDetail(groupId);
  const { ancestors } = useGroupAncestors(groupId);
  const { entityFeatures, userPermissions, financeRole, loading: metaLoading } = useEntityMeta("group", groupId, groupId, myRole);

  const ctx = useMemo((): EntityContext | null => {
    if (groupLoading || metaLoading || !group) return null;
    return buildEntityContext({
      type: "group",
      groupId,
      group,
      groupMembers: members,
      myRole,
      nicknameMap,
      ancestors,
      categories,
      categoryMap,
      categoryColorMap,
      financeRole,
      entityFeatures,
      userPermissions,
    });
  }, [group, members, myRole, nicknameMap, ancestors, categories, categoryMap, categoryColorMap, groupId, groupLoading, metaLoading, financeRole, entityFeatures, userPermissions]);

  return {
    ctx,
    loading: groupLoading || metaLoading,
    refetch,
  };
}

export function useProjectEntity(groupId: string, projectId: string) {
  const {
    project,
    members: projectMembers,
    myProjectRole,
    loading: projectLoading,
    refetch,
  } = useProjectDetail(projectId);
  const {
    members: groupMembers,
    myRole: myGroupRole,
    nicknameMap,
    categories,
    categoryMap,
    categoryColorMap,
    loading: groupLoading,
  } = useGroupDetail(groupId);
  const { entityFeatures, userPermissions, financeRole, loading: metaLoading } = useEntityMeta("project", projectId, groupId, myGroupRole);

  const ctx = useMemo((): EntityContext | null => {
    if (projectLoading || groupLoading || metaLoading || !project) return null;
    return buildEntityContext({
      type: "project",
      groupId,
      projectId,
      project,
      projectMembers,
      myProjectRole,
      myRole: myGroupRole,
      nicknameMap,
      groupMembers,
      categories,
      categoryMap,
      categoryColorMap,
      financeRole,
      entityFeatures,
      userPermissions,
    });
  }, [project, projectMembers, myProjectRole, myGroupRole, nicknameMap, groupMembers, groupId, projectId, projectLoading, groupLoading, metaLoading, financeRole, entityFeatures, userPermissions, categories, categoryMap, categoryColorMap]);

  return {
    ctx,
    loading: projectLoading || groupLoading || metaLoading,
    refetch,
  };
}
