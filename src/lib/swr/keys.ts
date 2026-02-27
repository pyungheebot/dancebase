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
  scheduleWaitlist: (scheduleId: string) => `schedule-waitlist-${scheduleId}` as const,

  // 게시판
  board: (groupId: string, projectId: string | null | undefined, category: string, search: string, page: number) =>
    `/groups/${groupId}/board?project=${projectId ?? ""}&category=${category}&search=${search}&page=${page}` as const,
  boardPost: (postId: string) => `/board-posts/${postId}` as const,
  boardPostAttachments: (postId: string) => `/board-posts/${postId}/attachments` as const,
  boardPostLikes: (postId: string) => `/board-posts/${postId}/likes` as const,
  boardCategories: (groupId: string) => `/groups/${groupId}/board-categories` as const,
  boardNotices: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/board-notices${projectId ? `?project=${projectId}` : ""}` as const,
  boardTrash: (groupId: string) => `/groups/${groupId}/board-trash` as const,
  postBookmarks: (groupId?: string | null) =>
    `/post-bookmarks${groupId ? `?group=${groupId}` : ""}` as const,
  postBookmark: (postId: string) => `/post-bookmarks/${postId}` as const,

  // 회비
  finance: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/finance${projectId ? `?project=${projectId}` : ""}` as const,

  // 미납 멤버 (독촉 알림용)
  unpaidMembers: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/unpaid-members${projectId ? `?project=${projectId}` : ""}` as const,

  // 프로젝트 비용 분석
  projectCostAnalytics: (groupId: string, projectId: string) =>
    `/groups/${groupId}/projects/${projectId}/cost-analytics` as const,

  // 재정 예산
  financeBudget: (entityType: string, entityId: string, yearMonth: string) =>
    `/finance-budget/${entityType}/${entityId}/${yearMonth}` as const,

  // 분할 정산
  financeSplits: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/finance-splits${projectId ? `?project=${projectId}` : ""}` as const,
  financeSplitMembers: (splitId: string) =>
    `/finance-splits/${splitId}/members` as const,

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

  // 온보딩 상태
  onboardingStatus: (userId: string) =>
    `/onboarding-status/${userId}` as const,

  // 최적 일정 시간대 추천
  optimalScheduleTime: (groupId: string, projectId?: string | null) =>
    `/optimal-schedule-time/${groupId}${projectId ? `?project=${projectId}` : ""}` as const,

  // 멤버 활동 리포트
  memberActivityReport: (groupId: string, period: string) =>
    `/member-activity-report/${groupId}?period=${period}` as const,

  // 출석 예측
  attendancePrediction: (groupId: string, scheduleId: string) =>
    `/attendance-prediction/${groupId}/${scheduleId}` as const,

  // 그룹 show rate (과거 출석 비율)
  groupShowRate: (groupId: string) =>
    `/group-show-rate/${groupId}` as const,

  // 앞으로의 일정 목록 (다중 RSVP용)
  upcomingSchedules: (groupId: string, projectId?: string | null) =>
    `/upcoming-schedules/${groupId}${projectId ? `?project=${projectId}` : ""}` as const,

  // 콘텐츠 신고
  contentReports: (groupId: string) =>
    `/groups/${groupId}/content-reports` as const,
  contentReportsPendingCount: (groupId: string) =>
    `/groups/${groupId}/content-reports/pending-count` as const,

  // 멤버 역량 맵
  memberSkills: (groupId: string) =>
    `/groups/${groupId}/member-skills` as const,

  // 회의록
  meetingMinutes: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/meeting-minutes${projectId ? `?project=${projectId}` : ""}` as const,

  // 출석 리포트
  attendanceReport: (groupId: string, projectId: string | null | undefined, period: string) =>
    `/attendance-report/${groupId}${projectId ? `?project=${projectId}` : ""}&period=${period}` as const,

  // 연락처 재확인
  contactVerification: (groupId: string) =>
    `/groups/${groupId}/contact-verification` as const,

  // 권한 감사 로그
  permissionAudits: (groupId: string) =>
    `/groups/${groupId}/permission-audits` as const,

  // 멤버 활동 추세 (주별)
  memberActivityTrend: (groupId: string, userId: string, weeks: number) =>
    `/member-activity-trend/${groupId}/${userId}?weeks=${weeks}` as const,

  // 역할 승격 후보
  rolePromotionCandidates: (groupId: string) =>
    `/groups/${groupId}/role-promotion-candidates` as const,

  // 출석 목표
  attendanceGoal: (groupId: string) =>
    `/groups/${groupId}/attendance-goal` as const,

  // 멤버 출석률 비교
  attendanceComparison: (groupId: string, userIds: string[], projectId?: string | null) =>
    `/attendance-comparison/${groupId}?users=${userIds.sort().join(",")}&project=${projectId ?? ""}` as const,

  // 투표 통계
  pollStatistics: (postId: string) => `/poll-statistics/${postId}` as const,

  // 멤버 메모
  memberNote: (groupId: string, targetUserId: string) =>
    `/groups/${groupId}/member-notes/${targetUserId}` as const,

  // 대시보드 핵심 수치 (Quick Stats)
  dashboardQuickStats: (groupId: string) =>
    `/groups/${groupId}/dashboard-quick-stats` as const,

  // 주간 출석 스냅샷
  weeklyAttendanceStats: (groupId: string, projectId?: string | null) =>
    `/weekly-attendance-stats/${groupId}${projectId ? `?project=${projectId}` : ""}` as const,

  // 최근 활동 피드 (대시보드용)
  recentActivityFeed: (groupIds: string[], limit: number) =>
    `/recent-activity-feed?groups=${groupIds.slice().sort().join(",")}&limit=${limit}` as const,

  // 프로젝트 할 일 (체크리스트)
  projectTasks: (projectId: string) => `project-tasks-${projectId}` as const,

  // 게시글 편집 이력
  postRevisions: (postId: string) => `post-revisions-${postId}` as const,

  // 프로젝트 타임라인
  projectTimeline: (groupId: string) => `/groups/${groupId}/project-timeline` as const,

  // 일정 체크인 코드
  scheduleCheckinCode: (scheduleId: string) =>
    `/schedules/${scheduleId}/checkin-code` as const,

  // 위험 멤버 (출석률 + 미납 연동 경고)
  memberRisk: (groupId: string) => `/groups/${groupId}/member-risk` as const,

  // 일정 역할 배정
  scheduleRoles: (scheduleId: string) => `/schedules/${scheduleId}/roles` as const,

  // 일정 날씨 예보
  scheduleWeather: (scheduleId: string) => `schedule-weather-${scheduleId}` as const,

  // 출석 면제 목록
  attendanceExcuses: (scheduleId: string) =>
    `/schedules/${scheduleId}/attendance-excuses` as const,

  // 출석 달성 배지
  attendanceAchievements: (groupId: string, userId: string) =>
    `/attendance-achievements/${groupId}/${userId}` as const,

  // 일정 만족도 피드백
  scheduleFeedback: (scheduleId: string) =>
    `/schedules/${scheduleId}/feedback` as const,

  // 연습 곡/안무 트래커
  projectSongs: (projectId: string) => `project-songs-${projectId}` as const,

  // 연습 메모
  songNotes: (songId: string) => `song-notes-${songId}` as const,

  // 안무 파트 배정
  songParts: (songId: string) => `song-parts-${songId}` as const,

  // 생일 달력
  birthdayCalendar: (groupId: string) =>
    `/groups/${groupId}/birthday-calendar` as const,

  // 프로젝트 진행률 대시보드
  projectProgress: (projectId: string) => `project-progress-${projectId}` as const,

  // 영수증 공유 토큰
  receiptShareTokens: (transactionId: string) =>
    `/receipt-share-tokens/${transactionId}` as const,

  // 일정 준비물 체크리스트
  scheduleChecklist: (scheduleId: string) =>
    `/schedules/${scheduleId}/checklist` as const,

  // 게시글 읽음 현황
  postReadStatus: (postId: string) => `post-read-status-${postId}` as const,

  // 연간 일정 히트맵
  yearlySchedules: (groupId: string, year: number) =>
    `/groups/${groupId}/yearly-schedules?year=${year}` as const,

  // 연습 영상 아카이브
  practiceVideos: (groupId: string) =>
    `practice-videos-${groupId}` as const,

  // 그룹 운영 월별 리포트
  monthlyReport: (groupId: string, year: number, month: number) =>
    `monthly-report-${groupId}-${year}-${month}` as const,

  // 그룹 활동 타임라인
  groupActivity: (groupId: string) =>
    `group-activity-${groupId}` as const,

  // 공연/대회 성과 기록
  performanceRecords: (groupId: string) =>
    `performance-records-${groupId}` as const,

  // 그룹 공개 포트폴리오
  groupPortfolio: (groupId: string) =>
    `group-portfolio-${groupId}` as const,

  // 개인 출석 스트릭
  attendanceStreak: (groupId: string, userId: string) =>
    `attendance-streak-${groupId}-${userId}` as const,

  // 그룹 챌린지
  groupChallenges: (groupId: string) =>
    `group-challenges-${groupId}` as const,
};
