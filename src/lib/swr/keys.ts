// SWR 캐시 키 팩토리 — 중앙 관리
export const swrKeys = {
  // 그룹
  groups: () => "/groups" as const,
  groupDetail: (groupId: string) => `/groups/${groupId}` as const,

  // 하위그룹
  subgroups: (groupId: string) => `/groups/${groupId}/subgroups` as const,
  groupAncestors: (groupId: string) => `/groups/${groupId}/ancestors` as const,

  // 프로젝트
  myProjects: () => "/my-projects" as const,
  projects: (groupId: string) => `/groups/${groupId}/projects` as const,
  projectDetail: (projectId: string) => `/projects/${projectId}` as const,
  sharedGroups: (projectId: string) => `/projects/${projectId}/shared-groups` as const,
  publicProjects: () => "/public-projects" as const,

  // 일정
  schedules: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/schedules${projectId ? `?project=${projectId}` : ""}` as const,
  attendance: (scheduleId: string) => `/schedules/${scheduleId}/attendance` as const,

  // 게시판
  board: (groupId: string, projectId: string | null | undefined, category: string) =>
    `/groups/${groupId}/board?project=${projectId ?? ""}&category=${category}` as const,
  boardPost: (postId: string) => `/board-posts/${postId}` as const,

  // 회비
  finance: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/finance${projectId ? `?project=${projectId}` : ""}` as const,

  // 메시지
  conversations: () => "/conversations" as const,
  conversation: (partnerId: string) => `/conversations/${partnerId}` as const,
  unreadCount: () => "/unread-count" as const,

  // 프로필
  userProfile: (userId: string) => `/profiles/${userId}` as const,

  // 팔로우
  followStatus: (targetUserId: string) => `/follow-status/${targetUserId}` as const,
  followList: (userId: string, type: "followers" | "following") =>
    `/follow-list/${userId}/${type}` as const,

  // 대시보드 설정
  dashboardSettings: (entityId: string, memberTable: string) =>
    `/dashboard-settings/${memberTable}/${entityId}` as const,
};
