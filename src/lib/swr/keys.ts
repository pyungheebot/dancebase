// SWR 캐시 키 팩토리 — 중앙 관리
export const swrKeys = {
  // 그룹
  groups: () => "/groups" as const,
  groupDetail: (groupId: string) => `/groups/${groupId}` as const,

  // 하위그룹
  subgroups: (groupId: string) => `/groups/${groupId}/subgroups` as const,
  groupAncestors: (groupId: string) => `/groups/${groupId}/ancestors` as const,
  parentGroupMembers: (parentGroupId: string) => `/groups/${parentGroupId}/members` as const,
  subgroupPerformance: (groupId: string) => `/groups/${groupId}/subgroup-performance` as const,

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
  scheduleRsvp: (scheduleId: string) => `/schedules/${scheduleId}/rsvp` as const,

  // 게시판
  board: (groupId: string, projectId: string | null | undefined, category: string, search: string, page: number) =>
    `/groups/${groupId}/board?project=${projectId ?? ""}&category=${category}&search=${search}&page=${page}` as const,
  boardPost: (postId: string) => `/board-posts/${postId}` as const,
  boardPostAttachments: (postId: string) => `/board-posts/${postId}/attachments` as const,
  boardPostLikes: (postId: string) => `/board-posts/${postId}/likes` as const,
  boardCategories: (groupId: string) => `/groups/${groupId}/board-categories` as const,
  boardNotices: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/board-notices${projectId ? `?project=${projectId}` : ""}` as const,

  // 회비
  finance: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/finance${projectId ? `?project=${projectId}` : ""}` as const,

  // 재정 예산
  financeBudget: (entityType: string, entityId: string, yearMonth: string) =>
    `/finance-budget/${entityType}/${entityId}/${yearMonth}` as const,

  // 알림
  notifications: () => "/notifications" as const,
  unreadNotificationCount: () => "/notifications/unread-count" as const,

  // 오늘의 일정 (대시보드용)
  todaySchedules: () => "/today-schedules" as const,

  // 마감 임박 프로젝트 (대시보드용)
  deadlineProjects: () => "/deadline-projects" as const,

  // 예정 결제 (대시보드용)
  upcomingPayments: () => "/upcoming-payments" as const,

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

  // 가입 신청
  pendingJoinRequestCount: (groupId: string) =>
    `/groups/${groupId}/join-requests/pending-count` as const,
  joinRequests: (groupId: string, status?: string) =>
    `/groups/${groupId}/join-requests${status ? `?status=${status}` : ""}` as const,

  // 활동 감사 로그
  activityLogs: (entityType: string, entityId: string) =>
    `/activity-logs/${entityType}/${entityId}` as const,

  // 엔티티 설정
  entitySettings: (entityType: string, entityId: string, key: string) =>
    `/entity-settings/${entityType}/${entityId}/${key}` as const,

  // 일정 템플릿
  scheduleTemplates: (entityType: string, entityId: string) =>
    `/schedule-templates/${entityType}/${entityId}` as const,

  // 멤버 뱃지 통계
  memberBadgeStats: (groupId: string, userId: string) =>
    `/member-badge-stats/${groupId}/${userId}` as const,

  // 그룹 통계 요약
  groupStats: (groupId: string) => `/groups/${groupId}/stats` as const,

  // 그룹 건강도 지수
  groupHealth: (groupId: string) => `/groups/${groupId}/health` as const,

  // 비활성 멤버 참여도
  memberEngagement: (groupId: string) =>
    `/member-engagement/${groupId}` as const,

  // 장소 자동완성 (기존 일정에서 추출)
  locationSuggestions: (groupId: string) =>
    `/groups/${groupId}/location-suggestions` as const,

  // 사용자 활동 통계
  userActivityStats: (userId: string) =>
    `/user-activity-stats/${userId}` as const,

  // 멤버 활동 타임라인
  memberActivityTimeline: (userId: string) =>
    `/member-activity-timeline/${userId}` as const,
};
