// 대시보드, 알림, 메시지 관련 키
export const dashboardKeys = {
  // 알림
  notifications: () => "/notifications" as const,
  unreadNotificationCount: () => "/notifications/unread-count" as const,

  // 대시보드
  todaySchedules: () => "/today-schedules" as const,
  deadlineProjects: () => "/deadline-projects" as const,
  dashboardSettings: (entityId: string, memberTable: string) =>
    `/dashboard-settings/${memberTable}/${entityId}` as const,
  dashboardQuickStats: (groupId: string) =>
    `/groups/${groupId}/dashboard-quick-stats` as const,
  myMonthlySummary: (yearMonth: string) =>
    `/my-monthly-summary/${yearMonth}` as const,
  recentActivityFeed: (groupIds: string[], limit: number) =>
    `/recent-activity-feed?groups=${groupIds.slice().sort().join(",")}&limit=${limit}` as const,

  // 메시지
  conversations: () => "/conversations" as const,
  conversation: (partnerId: string) => `/conversations/${partnerId}` as const,
  unreadCount: () => "/unread-count" as const,
};
