import type { GroupMemberWithProfile, ProjectMemberWithProfile, Group, Project, MemberCategory, FinanceRole } from "@/types";
import type { EntityMember, EntityContext, BreadcrumbItem, FeatureFlags, EntityPermissions } from "@/types/entity-context";
import { DEFAULT_GROUP_FEATURES, DEFAULT_PROJECT_FEATURES } from "@/types/entity-context";

// ============================================
// 멤버 변환
// ============================================

/** GroupMemberWithProfile → EntityMember */
export function toEntityMember(member: GroupMemberWithProfile): EntityMember {
  return {
    id: member.id,
    entityId: member.group_id,
    userId: member.user_id,
    role: member.role,
    nickname: member.nickname ?? null,
    categoryId: member.category_id ?? null,
    joinedAt: member.joined_at,
    profile: {
      id: member.profiles.id,
      name: member.profiles.name,
      avatar_url: member.profiles.avatar_url,
      dance_genre: member.profiles.dance_genre,
    },
    dashboardSettings: member.dashboard_settings,
  };
}

/** ProjectMemberWithProfile → EntityMember (그룹 닉네임 적용) */
export function toEntityMemberFromProject(
  member: ProjectMemberWithProfile,
  nicknameMap: Record<string, string>
): EntityMember {
  return {
    id: member.id,
    entityId: member.project_id,
    userId: member.user_id,
    role: member.role,
    nickname: nicknameMap[member.user_id] || null,
    joinedAt: member.joined_at,
    profile: {
      id: member.profiles.id,
      name: member.profiles.name,
      avatar_url: member.profiles.avatar_url,
      dance_genre: member.profiles.dance_genre,
    },
    dashboardSettings: member.dashboard_settings,
  };
}

/** EntityMember의 표시 이름 */
export function getDisplayName(member: EntityMember): string {
  return member.nickname || member.profile.name;
}

/** EntityMember 배열에서 nicknameMap 생성 */
export function buildNicknameMap(members: EntityMember[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of members) {
    if (m.nickname) {
      map[m.userId] = m.nickname;
    }
  }
  return map;
}

// ============================================
// 통합 EntityContext 빌더
// ============================================

type EntityFeatureRecord = { feature: string; enabled: boolean; independent: boolean };

type BuildEntityContextParams = {
  // 공통
  type: "group" | "project";
  groupId: string;

  // 그룹 전용
  group?: Group | null;
  groupMembers?: GroupMemberWithProfile[];
  myRole?: "leader" | "member" | null;
  ancestors?: { id: string; name: string; depth: number }[];
  categories?: MemberCategory[];
  categoryMap?: Record<string, string>;
  categoryColorMap?: Record<string, string>;

  // 프로젝트 전용
  projectId?: string;
  project?: Project | null;
  projectMembers?: ProjectMemberWithProfile[];
  myProjectRole?: "leader" | "member" | null;

  // 공통 데이터
  nicknameMap: Record<string, string>;
  financeRole?: FinanceRole;
  entityFeatures?: EntityFeatureRecord[];
  userPermissions?: { permission: string }[];
};

export function buildEntityContext(params: BuildEntityContextParams): EntityContext {
  const {
    type,
    groupId,
    group = null,
    groupMembers = [],
    myRole = null,
    ancestors = [],
    categories = [],
    categoryMap = {},
    categoryColorMap = {},
    projectId,
    project = null,
    projectMembers = [],
    myProjectRole = null,
    nicknameMap,
    financeRole = null,
    entityFeatures = [],
    userPermissions = [],
  } = params;

  const isGroup = type === "group";
  const entityId = isGroup ? groupId : (projectId ?? "");
  const basePath = isGroup
    ? `/groups/${groupId}`
    : `/groups/${groupId}/projects/${projectId}`;

  // 브레드크럼
  const breadcrumbs: BreadcrumbItem[] = isGroup
    ? ancestors.map((a) => ({ label: a.name, href: `/groups/${a.id}` }))
    : [{ label: "프로젝트 목록", href: `/groups/${groupId}/projects` }];

  // 헤더
  const header = isGroup
    ? {
        name: group?.name ?? "",
        description: group?.description ?? null,
        badge: group?.group_type ?? null,
      }
    : {
        name: project?.name ?? "",
        description: project?.description ?? null,
        badge: project?.status ?? null,
      };

  // 멤버
  const members: EntityMember[] = isGroup
    ? groupMembers.map(toEntityMember)
    : projectMembers.map((m) => toEntityMemberFromProject(m, nicknameMap));

  // 권한
  const canEdit = isGroup
    ? myRole === "leader"
    : myProjectRole === "leader" || myRole === "leader";

  const hasPermission = (perm: string) =>
    userPermissions.some((p) => p.permission === perm);

  const permissions: EntityPermissions = {
    canEdit,
    canManageMembers: canEdit,
    canManageFinance: financeRole === "manager" || canEdit,
    canViewFinance: !!financeRole || canEdit,
    canManageSettings: canEdit,
    canManageProjects: isGroup
      ? (myRole === "leader" || hasPermission("project_manage"))
      : false,
    financeRole: canEdit ? "manager" : financeRole,
  };

  // 기능 플래그: DB entity_features + 기본값 병합
  const baseFeatures = isGroup ? { ...DEFAULT_GROUP_FEATURES } : { ...DEFAULT_PROJECT_FEATURES };
  const independentFeatures: Record<string, boolean> = {};
  for (const ef of entityFeatures) {
    if (ef.feature in baseFeatures) {
      (baseFeatures as Record<string, boolean>)[ef.feature] = ef.enabled;
    }
    independentFeatures[ef.feature] = ef.independent ?? false;
  }
  const features: FeatureFlags = baseFeatures;

  return {
    entityType: type,
    entityId,
    groupId,
    projectId: projectId ?? null,
    basePath,
    breadcrumbs,
    header,
    members,
    nicknameMap,
    permissions,
    features,
    parentGroupId: group?.parent_group_id ?? null,
    inviteCode: isGroup ? (group?.invite_code ?? null) : null,
    independentFeatures,
    raw: {
      group,
      project,
      groupMembers,
      categories,
      categoryMap,
      categoryColorMap,
    },
  };
}

