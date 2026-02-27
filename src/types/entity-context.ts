import type { Profile, Group, Project, GroupMemberWithProfile, MemberCategory, FinanceRole } from "@/types";

// ============================================
// Breadcrumb (계층 경로)
// ============================================

export type BreadcrumbItem = {
  label: string;
  href: string;
};

// ============================================
// EntityMember (NormalizedMember 대체, joined_at 보존)
// ============================================

export type EntityMember = {
  id: string;
  entityId: string;
  userId: string;
  role: "leader" | "sub_leader" | "member";
  nickname: string | null;
  categoryId?: string | null;
  joinedAt: string;
  profile: Pick<Profile, "id" | "name" | "avatar_url"> & {
    dance_genre?: string[];
  };
  dashboardSettings?: unknown;
};

// ============================================
// FeatureFlags (기능 토글 통합)
// ============================================

export type FeatureFlags = {
  board: boolean;
  schedule: boolean;
  attendance: boolean;
  finance: boolean;
  members: boolean;
  projects: boolean;
  subgroups: boolean;
  settings: boolean;
  // 그룹/프로젝트별 고정 속성 (EntityCapabilities 대체)
  memberCategories: boolean;
  memberInvite: boolean;
  memberAddFromParent: boolean;
  joinRequests: boolean;
  visibility: boolean;
  danceGenre: boolean;
  memberCapacity: boolean;
  featureToggle: boolean;
  deletable: boolean;
  financePermissionManager: boolean;
};

// ============================================
// Permissions (통합 권한)
// ============================================

export type EntityPermissions = {
  canEdit: boolean;
  canManageMembers: boolean;
  canManageFinance: boolean;
  canViewFinance: boolean;
  canManageSettings: boolean;
  canManageProjects: boolean;
  financeRole: FinanceRole;
};

// ============================================
// Entity Context (공유 컨텍스트)
// ============================================

export type EntityContext = {
  entityType: "group" | "project";
  entityId: string;
  groupId: string;
  projectId: string | null;
  basePath: string;
  breadcrumbs: BreadcrumbItem[];

  // 헤더
  header: {
    name: string;
    description: string | null;
    badge: string | null;
  };

  // 멤버
  members: EntityMember[];
  nicknameMap: Record<string, string>;

  // 통합 권한
  permissions: EntityPermissions;

  // 통합 기능 토글
  features: FeatureFlags;

  // 그룹/프로젝트 전용 보조 데이터
  parentGroupId: string | null;
  inviteCode: string | null;
  independentFeatures: Record<string, boolean>;

  // 원본 데이터 접근
  raw: {
    group: Group | null;
    project: Project | null;
    groupMembers: GroupMemberWithProfile[];
    categories: MemberCategory[];
    categoryMap: Record<string, string>;
    categoryColorMap: Record<string, string>;
  };
};

// ============================================
// 기본 FeatureFlags
// ============================================

export const DEFAULT_GROUP_FEATURES: FeatureFlags = {
  board: true,
  schedule: true,
  attendance: true,
  finance: true,
  members: true,
  projects: true,
  subgroups: true,
  settings: true,
  memberCategories: true,
  memberInvite: true,
  memberAddFromParent: false,
  joinRequests: true,
  visibility: true,
  danceGenre: true,
  memberCapacity: true,
  featureToggle: false,
  deletable: false,
  financePermissionManager: true,
};

export const DEFAULT_PROJECT_FEATURES: FeatureFlags = {
  board: true,
  schedule: false,
  attendance: false,
  finance: false,
  members: true,
  projects: false,
  subgroups: false,
  settings: true,
  memberCategories: false,
  memberInvite: false,
  memberAddFromParent: true,
  joinRequests: false,
  visibility: false,
  danceGenre: false,
  memberCapacity: false,
  featureToggle: true,
  deletable: true,
  financePermissionManager: false,
};

