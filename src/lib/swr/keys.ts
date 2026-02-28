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

  // 개인 출석 목표 (localStorage 기반)
  personalAttendanceGoal: (groupId: string, userId: string) =>
    `personal-attendance-goal-${groupId}-${userId}` as const,

  // 멤버 출석률 비교
  attendanceComparison: (groupId: string, userIds: string[], projectId?: string | null) =>
    `/attendance-comparison/${groupId}?users=${userIds.sort().join(",")}&project=${projectId ?? ""}` as const,

  // 멤버 출석 비교 카드 (상세 통계: 출석/결석/지각 횟수)
  attendanceComparisonDetail: (groupId: string, userIds: string[], projectId?: string | null) =>
    `/attendance-comparison-detail/${groupId}?users=${userIds.slice().sort().join(",")}&project=${projectId ?? ""}` as const,

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

  // 필터링 가능한 활동 타임라인
  filteredActivityTimeline: (groupId: string, daysBack: number) =>
    `/groups/${groupId}/filtered-activity-timeline?days=${daysBack}` as const,

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

  // 일정 카풀
  scheduleCarpool: (scheduleId: string) =>
    `schedule-carpool-${scheduleId}` as const,

  // 그룹 규칙/공지 배너
  groupRules: (groupId: string) =>
    `group-rules-${groupId}` as const,

  // 일정 브로드캐스트 (RSVP 상태 + 멤버 목록)
  scheduleBroadcast: (scheduleId: string, groupId: string) =>
    `/schedules/${scheduleId}/broadcast?group=${groupId}` as const,

  // 내 월간 활동 요약 (대시보드용)
  myMonthlySummary: (yearMonth: string) =>
    `/my-monthly-summary/${yearMonth}` as const,

  // 연습 통계 (월별 연습 횟수·시간·참석 인원)
  practiceStats: (groupId: string) =>
    `practice-stats-${groupId}` as const,

  // 스마트 리마인더 (멤버별 출석 이탈 위험도)
  smartReminder: (scheduleId: string, groupId: string) =>
    `/schedules/${scheduleId}/smart-reminder?group=${groupId}` as const,

  // 멤버별 활동 대시보드 (최근 7일)
  memberDashboardActivity: (userId: string) =>
    `/member-dashboard-activity/${userId}` as const,

  // 그룹 건강도 개선 제안
  groupHealthSuggestions: (groupId: string) =>
    `/groups/${groupId}/health-suggestions` as const,

  // 출석 목표 진행 추적
  goalProgressTracker: (groupId: string, userId: string) =>
    `goal-progress-tracker-${groupId}-${userId}` as const,

  // 윈백 캠페인 (30일 이상 비활성 멤버)
  winbackCandidates: (groupId: string) =>
    `/groups/${groupId}/winback-candidates` as const,

  // 그룹 성과 스냅샷 (주간/월간)
  groupPerformanceSnapshot: (groupId: string, period: "week" | "month") =>
    `/groups/${groupId}/performance-snapshot?period=${period}` as const,

  // 멤버 일괄 초대 후보 목록
  memberBatchInvite: (groupId: string) =>
    `/groups/${groupId}/member-batch-invite` as const,

  // 멤버 활동 비교 대시보드
  memberComparison: (groupId: string, memberIds: string[]) =>
    `/member-comparison/${groupId}?members=${memberIds.slice().sort().join(",")}` as const,

  // 그룹 멤버 목록 (알림 발송용)
  groupMembersForNotification: (groupId: string) =>
    `/groups/${groupId}/members-for-notification` as const,

  // 그룹 통계 내보내기 (출석)
  analyticsExportAttendance: (groupId: string, startDate: string, endDate: string) =>
    `analytics-export-attendance-${groupId}-${startDate}-${endDate}` as const,

  // 그룹 통계 내보내기 (게시판)
  analyticsExportBoard: (groupId: string, startDate: string, endDate: string) =>
    `analytics-export-board-${groupId}-${startDate}-${endDate}` as const,

  // 그룹 통계 내보내기 (재무)
  analyticsExportFinance: (groupId: string, startDate: string, endDate: string) =>
    `analytics-export-finance-${groupId}-${startDate}-${endDate}` as const,

  // 멤버 온보딩 완료도 추적
  onboardingProgressTracker: (groupId: string) =>
    `/groups/${groupId}/onboarding-progress-tracker` as const,

  // 스마트 멤버 페어링 (호환성 점수 계산용 원시 데이터)
  memberPairing: (groupId: string) =>
    `/groups/${groupId}/member-pairing` as const,

  // 그룹 활동 트렌드 (최근 6개월)
  groupActivityTrends: (groupId: string) =>
    `group-activity-trends-${groupId}` as const,

  // 멤버 활동 분포도 (최근 30일 활동 점수 기반)
  memberActivityDistribution: (groupId: string) =>
    `/groups/${groupId}/member-activity-distribution` as const,

  // 출석 스트릭 리더보드
  attendanceStreakLeaderboard: (groupId: string) =>
    `attendance-streak-leaderboard-${groupId}` as const,

  // 스케줄 가용성 예측 (요일+시간대별 출석 확률)
  availabilityForecast: (groupId: string) =>
    `availability-forecast-${groupId}` as const,

  // 일정 출석 예측 (특정 일정 기반 멤버별 확률)
  scheduleAttendancePredictor: (groupId: string, scheduleId: string) =>
    `schedule-attendance-predictor-${groupId}-${scheduleId}` as const,

  // 멤버 건강도 점수 대시보드
  memberHealthScore: (groupId: string) =>
    `/groups/${groupId}/member-health-score` as const,

  // 출석 팀 밸런서 (출석 패턴 기반 팀 자동 구성)
  attendanceTeamBalance: (groupId: string) =>
    `attendance-team-balance-${groupId}` as const,

  // 장르 역할 추천 (알고리즘 원시 데이터)
  genreRoleRecommendation: (groupId: string) =>
    `/groups/${groupId}/genre-role-recommendation` as const,

  // 멤버 프로필 미리보기
  memberPreview: (userId: string, groupId?: string | null) =>
    `/member-preview/${userId}${groupId ? `?group=${groupId}` : ""}` as const,

  // 출석 일관성 히트맵
  attendanceConsistency: (groupId: string, userId: string) =>
    `attendance-consistency-${groupId}-${userId}` as const,

  // 그룹 건강도 트렌드 (최근 8주)
  groupHealthTrends: (groupId: string) =>
    `group-health-trends-${groupId}` as const,

  // 주간 챌린지 보드
  weeklyChallengeBoard: (groupId: string) =>
    `weekly-challenge-board-${groupId}` as const,

  // 멤버 활동 시간대 히트맵
  activityTimeHeatmap: (groupId: string) =>
    `activity-time-heatmap-${groupId}` as const,

  // 그룹 활동 보고서 (주간/월간)
  groupActivityReport: (groupId: string, period: "week" | "month") =>
    `/groups/${groupId}/activity-report?period=${period}` as const,

  // 멤버 벤치마킹 (개인 성과 카드)
  memberBenchmarking: (groupId: string, userId: string) =>
    `/member-benchmarking/${groupId}/${userId}` as const,

  // 스킬 자가 평가 (localStorage 기반)
  skillSelfEvaluation: (groupId: string, userId: string) =>
    `/groups/${groupId}/skill-self-evaluation/${userId}` as const,

  // 출석 인증서
  attendanceCertificate: (groupId: string, userId: string) =>
    `/groups/${groupId}/attendance-certificate/${userId}` as const,

  // 그룹 투표/설문
  groupPolls: (groupId: string) => `/groups/${groupId}/polls` as const,

  // 주간 출석 체크인
  weeklyAttendanceCheckin: (groupId: string, userId: string) =>
    `/groups/${groupId}/weekly-checkin/${userId}` as const,

  // 그룹 활동 아카이브 (월별 요약)
  activityArchive: (groupId: string) =>
    `/groups/${groupId}/activity-archive` as const,

  // 사전 결석 신고 (localStorage 기반)
  preExcuse: (groupId: string) => `pre-excuse-${groupId}` as const,
  preExcuseBySchedule: (groupId: string, scheduleId: string) =>
    `pre-excuse-${groupId}-${scheduleId}` as const,

  // 멤버 종합 점수 리더보드
  memberScoreLeaderboard: (groupId: string) =>
    `/groups/${groupId}/member-score-leaderboard` as const,

  // 멤버 이탈 위험 감지
  churnRiskDetection: (groupId: string) =>
    `/groups/${groupId}/churn-risk-detection` as const,

  // 게시판 트렌드 분석
  boardTrendAnalytics: (groupId: string) =>
    `/groups/${groupId}/board-trend-analytics` as const,

  // 일정 카운트다운 위젯
  scheduleCountdown: (groupId: string) =>
    `/groups/${groupId}/schedule-countdown` as const,

  // 멤버 출석 예측 달력
  attendancePredictionCalendar: (groupId: string, userId: string, month: string) =>
    `/groups/${groupId}/attendance-prediction-calendar/${userId}/${month}` as const,

  // 그룹 마일스톤 달성 기록
  groupMilestonesAchievements: (groupId: string) =>
    `/groups/${groupId}/milestones-achievements` as const,

  // 커스텀 리포트 빌더
  customReport: (groupId: string, reportId: string) =>
    `/groups/${groupId}/custom-report/${reportId}` as const,

  // 일정 충돌 감지
  scheduleConflictDetector: (groupId: string) =>
    `/groups/${groupId}/schedule-conflict-detector` as const,

  // 예산 지출 추적
  budgetSpendingTracker: (groupId: string) =>
    `/groups/${groupId}/budget-spending-tracker` as const,

  // 멤버 출석 통계
  memberAttendanceStats: (groupId: string, userId: string) =>
    `/groups/${groupId}/member-attendance-stats/${userId}` as const,

  // 출석 시간대 분석
  attendanceTimeAnalysis: (groupId: string, period: "last30days" | "all") =>
    `/groups/${groupId}/attendance-time-analysis?period=${period}` as const,

  // 재정 건강도 예측
  financeForecast: (groupId: string) =>
    `/groups/${groupId}/finance-forecast` as const,

  // 그룹 멤버 목록 (역할 배지 할당용)
  groupMembersForRoleBadge: (groupId: string) =>
    `/groups/${groupId}/members-for-role-badge` as const,

  // 일정별 참석 요약
  scheduleAttendanceSummary: (scheduleId: string) =>
    `/schedules/${scheduleId}/attendance-summary` as const,

  // 짝꿍 매칭용 멤버 목록
  partnerMatchingMembers: (groupId: string) =>
    `/groups/${groupId}/partner-matching-members` as const,

  // 멤버 상호작용 분석 (최근 30일)
  memberInteractionScore: (groupId: string) =>
    `/groups/${groupId}/member-interaction-score` as const,

  // 그룹 성과 요약 리포트
  groupPerformanceReport: (groupId: string) =>
    `/groups/${groupId}/performance-report` as const,

  // 일정 참여도 통계 (RSVP + 출석 종합)
  scheduleEngagement: (scheduleId: string) =>
    `/schedules/${scheduleId}/engagement` as const,

  // 그룹 건강도 추이 스냅샷 (localStorage 기반)
  groupHealthSnapshot: (groupId: string) =>
    `group-health-snapshot-${groupId}` as const,

  // 멤버 연락 선호도 (localStorage 기반)
  communicationPreferences: (groupId: string, userId: string) =>
    `/groups/${groupId}/members/${userId}/comm-prefs` as const,

  // 리더십 후보
  leadershipCandidates: (groupId: string) =>
    `/groups/${groupId}/leadership-candidates` as const,

  // 활동 회고 리포트 (localStorage 캐시)
  activityRetrospective: (groupId: string) =>
    `/groups/${groupId}/retrospective` as const,

  // 멤버 가용 시간 (localStorage 기반)
  memberAvailability: (groupId: string, userId: string) =>
    `/groups/${groupId}/members/${userId}/availability` as const,

  // 프로젝트 마일스톤 트래커 (localStorage 기반)
  projectMilestones: (groupId: string, projectId: string) =>
    `/groups/${groupId}/projects/${projectId}/milestones` as const,

  // 멤버 관여도 예측
  memberEngagementForecast: (groupId: string) =>
    `/groups/${groupId}/engagement-forecast` as const,

  // 재정 개요 대시보드 (최근 6개월 집계)
  financeOverviewMetrics: (groupId: string) =>
    `/groups/${groupId}/finance-overview` as const,

  // 멤버 짝 추천 (데이터 기반 호환성 매칭)
  memberPairingSuggestion: (groupId: string) =>
    `/groups/${groupId}/pairing-suggestions` as const,

  // 개인 성장 포트폴리오 타임라인
  personalGrowthTimeline: (groupId: string, userId: string) =>
    `/groups/${groupId}/members/${userId}/growth-timeline` as const,

  // 세션 피드백 생성기 (localStorage 기반)
  sessionAutoFeedback: (groupId: string) =>
    `/groups/${groupId}/session-feedback` as const,

  // 그룹 활동 히트맵 (요일/시간대별 출석률)
  groupActivityHeatmap: (groupId: string) =>
    `/groups/${groupId}/activity-heatmap` as const,

  // 안무 난도 평가
  choreographyDifficulty: (groupId: string, projectId: string) =>
    `choreo-difficulty-${groupId}-${projectId}` as const,

  // 동료 협력도 평가
  collaborationEffectiveness: (groupId: string) =>
    `collab-effectiveness-${groupId}` as const,

  // 연습 강도 추적
  practiceIntensity: (groupId: string, userId: string) =>
    `practice-intensity-${groupId}-${userId}` as const,

  // 팀 활동 이상 탐지
  anomalyDetection: (groupId: string) =>
    `/groups/${groupId}/anomaly-detection` as const,

  // 댄스 스타일 호환성
  danceStyleCompatibility: (groupId: string) =>
    `dance-style-compatibility-${groupId}` as const,

  // 댄스 레벨 인증
  danceCertification: (groupId: string) =>
    `dance-certification-${groupId}` as const,

  // 연습 일지
  practiceJournal: (groupId: string, userId: string) =>
    `practice-journal-${groupId}-${userId}` as const,

  // 코스튬/의상 관리
  costumeManagement: (groupId: string, projectId: string) =>
    `costume-management-${groupId}-${projectId}` as const,

  // 감사 편지
  thankYouLetters: (groupId: string) =>
    `thank-you-letters-${groupId}` as const,

  // 음악 템포 매칭
  musicTempo: (groupId: string, projectId: string) =>
    `music-tempo-${groupId}-${projectId}` as const,

  // 공연 수익 분배
  performanceRevenue: (groupId: string) =>
    `performance-revenue-${groupId}` as const,

  // 장비 인벤토리
  equipmentInventory: (groupId: string) =>
    `equipment-inventory-${groupId}` as const,

  // 안무 버전 관리
  choreographyVersion: (groupId: string, projectId: string) =>
    `choreo-version-${groupId}-${projectId}` as const,

  // 디지털 동의서 관리
  waiverManagement: (groupId: string) =>
    `waiver-management-${groupId}` as const,

  // 연습 장소 리뷰
  venueReview: (groupId: string) =>
    `venue-review-${groupId}` as const,

  // 안무 습득 곡선
  masteryCurve: (groupId: string, userId: string) =>
    `mastery-curve-${groupId}-${userId}` as const,

  // 공연 준비도 체크리스트
  performanceReadiness: (groupId: string, projectId: string) =>
    `performance-readiness-${groupId}-${projectId}` as const,

  // 주간 시간표
  weeklyTimetable: (groupId: string) =>
    `weekly-timetable-${groupId}` as const,

  // 예산 시나리오 플래너
  budgetScenario: (groupId: string) =>
    `budget-scenario-${groupId}` as const,

  // 세트리스트 관리
  setlistManagement: (groupId: string, projectId: string) =>
    `setlist-management-${groupId}-${projectId}` as const,

  // 댄스 용어 사전
  danceGlossary: (groupId: string) =>
    `dance-glossary-${groupId}` as const,

  // 그룹 에너지 트래커
  groupEnergyTracker: (groupId: string) =>
    `group-energy-tracker-${groupId}` as const,

  // 연습 목표 보드
  practiceGoalBoard: (groupId: string) =>
    `practice-goal-board-${groupId}` as const,

  // 보상 포인트
  rewardPoints: (groupId: string) =>
    `reward-points-${groupId}` as const,

  // 멘토링 매칭 시스템 (localStorage 기반)
  mentoringSystem: (groupId: string) =>
    `mentoring-system-${groupId}` as const,

  // 안무 스타일 투표 (localStorage 기반)
  styleVote: (groupId: string) =>
    `style-vote-${groupId}` as const,

  // 개인 맞춤 학습 경로 (localStorage 기반)
  learningPath: (groupId: string, userId: string) =>
    `learning-path-${groupId}-${userId}` as const,

  // Q&A 보드 (localStorage 기반)
  qnaBoard: (groupId: string) =>
    `qna-board-${groupId}` as const,

  // 멤버 스킬 트리 (localStorage 기반)
  skillTree: (groupId: string, userId: string) =>
    `skill-tree-${groupId}-${userId}` as const,

  // 연습 루틴 빌더 (localStorage 기반)
  routineBuilder: (groupId: string) =>
    `routine-builder-${groupId}` as const,

  // 멤버 건강 추적 (localStorage 기반)
  healthTracking: (groupId: string, userId: string) =>
    `health-tracking-${groupId}-${userId}` as const,

  // 댄스 배틀 스코어보드 (localStorage 기반)
  battleScoreboard: (groupId: string) =>
    `battle-scoreboard-${groupId}` as const,

  // 리허설 진행 기록 (localStorage 기반)
  rehearsalLog: (groupId: string, projectId: string) =>
    `rehearsal-log-${groupId}-${projectId}` as const,

  // 이벤트 스폰서 관리 (localStorage 기반)
  eventSponsorship: (groupId: string) =>
    `event-sponsorship-${groupId}` as const,

  // 그룹 포토 앨범 (localStorage 기반)
  photoAlbum: (groupId: string) =>
    `photo-album-${groupId}` as const,

  // 기금 모금 추적 (localStorage 기반)
  fundraisingGoal: (groupId: string) =>
    `fundraising-goal-${groupId}` as const,

  // 그룹 활동 리포트 (localStorage 기반)
  activityReport: (groupId: string) =>
    `activity-report-${groupId}` as const,

  // 댄스 챌린지 (localStorage 기반)
  danceChallenge: (groupId: string) =>
    `dance-challenge-${groupId}` as const,

  // 공연 회고 (localStorage 기반)
  performanceRetro: (groupId: string, projectId: string) =>
    `performance-retro-${groupId}-${projectId}` as const,

  // 출석 예측 (localStorage 기반)
  attendanceForecast: (groupId: string) =>
    `attendance-forecast-${groupId}` as const,

  // 피어 점수 (localStorage 기반)
  peerScoring: (groupId: string) =>
    `peer-scoring-${groupId}` as const,

  // 성장 궤적 (localStorage 기반)
  growthTrajectory: (groupId: string) =>
    `growth-trajectory-${groupId}` as const,

  // 문화 맞춤도 (localStorage 기반)
  cultureAlignment: (groupId: string) =>
    `culture-alignment-${groupId}` as const,

  // 음악 큐시트 (localStorage 기반)
  musicCuesheet: (groupId: string, projectId: string) =>
    `music-cuesheet-${groupId}-${projectId}` as const,

  // 역할 로테이션 (localStorage 기반)
  roleRotation: (groupId: string) =>
    `role-rotation-${groupId}` as const,

  // 공연 티켓 관리 (localStorage 기반)
  ticketManagement: (groupId: string, projectId: string) =>
    `ticket-management-${groupId}-${projectId}` as const,

  // 영상 피드백 (localStorage 기반)
  videoFeedback: (groupId: string, projectId: string) =>
    `video-feedback-${groupId}-${projectId}` as const,

  // 소감 벽 (localStorage 기반)
  impressionWall: (groupId: string) =>
    `impression-wall-${groupId}` as const,

  // 타임캡슐 (localStorage 기반)
  timeCapsule: (groupId: string) =>
    `time-capsule-${groupId}` as const,

  // 그룹 출결 스트릭 (localStorage 기반)
  attendanceStreakGroup: (groupId: string) =>
    `attendance-streak-group-${groupId}` as const,

  // 공연 체크인 (localStorage 기반)
  performanceCheckin: (groupId: string, projectId: string) =>
    `performance-checkin-${groupId}-${projectId}` as const,

  // 그룹 위시리스트 (localStorage 기반)
  groupWishlist: (groupId: string) =>
    `group-wishlist-${groupId}` as const,

  // 기여도 보드 (localStorage 기반)
  contributionBoard: (groupId: string) =>
    `contribution-board-${groupId}` as const,

  // 연습 노트 공유 (localStorage 기반)
  practiceNotes: (groupId: string) =>
    `practice-notes-${groupId}` as const,

  // 세션 레이팅 (localStorage 기반)
  sessionRating: (groupId: string) =>
    `session-rating-${groupId}` as const,

  // 연습 플레이리스트 큐 (localStorage 기반)
  practiceQueue: (groupId: string, projectId: string) =>
    `practice-queue-${groupId}-${projectId}` as const,

  // 소셜 그래프 (localStorage 기반)
  socialGraph: (groupId: string) =>
    `social-graph-${groupId}` as const,

  // 출석 히트맵 (localStorage 기반)
  attendanceHeatmap: (groupId: string) =>
    `attendance-heatmap-${groupId}` as const,

  // 의사결정 투표 (localStorage 기반)
  decisionPoll: (groupId: string) =>
    `decision-poll-${groupId}` as const,

  // 집중 모드 타이머 (localStorage 기반)
  focusTimer: (groupId: string) =>
    `focus-timer-${groupId}` as const,

  // 이벤트 캘린더 (localStorage 기반)
  eventCalendar: (groupId: string) =>
    `event-calendar-${groupId}` as const,

  // 좌석 배치도 (localStorage 기반)
  seatingChart: (groupId: string, projectId: string) =>
    `seating-chart-${groupId}-${projectId}` as const,

  // 스킬 매트릭스 (localStorage 기반)
  skillMatrix: (groupId: string) =>
    `skill-matrix-${groupId}` as const,

  // 공연 타임라인 (localStorage 기반)
  showTimeline: (groupId: string, projectId: string) =>
    `show-timeline-${groupId}-${projectId}` as const,

  // 멤버 퀴즈 (localStorage 기반)
  memberQuiz: (groupId: string) =>
    `member-quiz-${groupId}` as const,

  // 의상 대여 관리 (localStorage 기반)
  costumeRental: (groupId: string, projectId: string) =>
    `costume-rental-${groupId}-${projectId}` as const,

  // 멤버 호환도 매칭 (localStorage 기반)
  compatibilityMatching: (groupId: string) =>
    `compatibility-matching-${groupId}` as const,

  // 멤버 휴가 관리 (localStorage 기반)
  leaveManagement: (groupId: string) =>
    `leave-management-${groupId}` as const,

  // 장르 탐색기 (localStorage 기반)
  genreExplorer: (groupId: string) =>
    `genre-explorer-${groupId}` as const,

  // 복귀 온보딩 (localStorage 기반)
  returnOnboarding: (groupId: string) =>
    `return-onboarding-${groupId}` as const,

  // 무대 조명 큐시트 (localStorage 기반)
  lightingCue: (groupId: string, projectId: string) =>
    `lighting-cue-${groupId}-${projectId}` as const,

  // 그룹 공지 보드 (localStorage 기반)
  groupAnnouncement: (groupId: string) =>
    `group-announcement-${groupId}` as const,

  // 멤버 목표 설정 (localStorage 기반)
  memberGoal: (groupId: string) =>
    `member-goal-${groupId}` as const,

  // 연습 출결 예외 (localStorage 기반)
  attendanceException: (groupId: string) =>
    `attendance-exception-${groupId}` as const,

  // 공연 리뷰 수집 (localStorage 기반)
  showReview: (groupId: string, projectId: string) =>
    `show-review-${groupId}-${projectId}` as const,

  // 동선 노트 (localStorage 기반)
  formationNote: (groupId: string, projectId: string) =>
    `formation-note-${groupId}-${projectId}` as const,

  // 멤버 뱃지 시스템 (localStorage 기반)
  memberBadge: (groupId: string) =>
    `member-badge-${groupId}` as const,

  // 비용 영수증 관리 (localStorage 기반)
  receiptManagement: (groupId: string) =>
    `receipt-management-${groupId}` as const,

  // 그룹 투표 (localStorage 기반)
  groupVote: (groupId: string) =>
    `group-vote-${groupId}` as const,

  // 연습곡 플레이리스트 카드 (localStorage 기반)
  practicePlaylist: (groupId: string) =>
    `practice-playlist-${groupId}` as const,

  // 워밍업 루틴 (localStorage 기반)
  warmupRoutine: (groupId: string) =>
    `warmup-routine-${groupId}` as const,

  // 멤버 출석 보상 (localStorage 기반)
  attendanceReward: (groupId: string) =>
    `attendance-reward-${groupId}` as const,

  // 안무 구간 분석 (localStorage 기반)
  choreoSection: (groupId: string, projectId: string) =>
    `choreo-section-${groupId}-${projectId}` as const,

  // 그룹 일정 충돌 감지 (localStorage 기반)
  scheduleConflict: (groupId: string) =>
    `schedule-conflict-${groupId}` as const,

  // 공연 백스테이지 체크 (localStorage 기반)
  backstageCheck: (groupId: string, projectId: string) =>
    `backstage-check-${groupId}-${projectId}` as const,

  // 멤버 긴급 연락처 (localStorage 기반)
  emergencyContact: (groupId: string) =>
    `emergency-contact-${groupId}` as const,

  // 공연 물품 목록 (localStorage 기반)
  showInventory: (groupId: string, projectId: string) =>
    `show-inventory-${groupId}-${projectId}` as const,

  // 연습 피드백 (localStorage 기반)
  practiceFeedback: (groupId: string) =>
    `practice-feedback-${groupId}` as const,

  // 멤버 스케줄 선호도 (localStorage 기반)
  schedulePreference: (groupId: string) =>
    `schedule-preference-${groupId}` as const,

  // 멤버 성장 일지 (localStorage 기반)
  growthJournal: (groupId: string) =>
    `growth-journal-${groupId}` as const,

  // 댄스 용어 사전 v2 (localStorage + SWR 기반)
  danceGlossaryEntries: (groupId: string) =>
    `dance-glossary-${groupId}` as const,

  // 공연 세트리스트 (localStorage 기반)
  setList: (groupId: string, projectId: string) =>
    `set-list-${groupId}-${projectId}` as const,

  // 그룹 회의록 메모 (localStorage 기반)
  meetingMinutesMemo: (groupId: string) =>
    `meeting-minutes-${groupId}` as const,

  // 멤버 역할 히스토리 (localStorage 기반)
  roleHistory: (groupId: string) => `role-history-${groupId}` as const,

  // 감사 메시지 보드 (localStorage 기반)
  thankYouBoard: (groupId: string) =>
    `thank-you-board-${groupId}` as const,

  // 공연 리허설 스케줄 (localStorage 기반)
  rehearsalSchedule: (projectId: string) =>
    `rehearsal-schedule-${projectId}` as const,

  // 연습 체크인 (localStorage 기반)
  practiceCheckin: (groupId: string) =>
    `practice-checkin-${groupId}` as const,

  // 멤버 기술 인증 (localStorage 기반)
  skillCertification: (groupId: string) =>
    `skill-certification-${groupId}` as const,

  // 댄스 배틀 토너먼트 (localStorage 기반)
  battleTournament: (groupId: string) =>
    `battle-tournament-${groupId}` as const,

  // 멤버 체력 테스트 (localStorage 기반)
  fitnessTest: (groupId: string) => `fitness-test-${groupId}` as const,

  // 공연 프로그램 북 (localStorage 기반)
  programBook: (groupId: string, projectId: string) =>
    `program-book-${groupId}-${projectId}` as const,

  // 그룹 통합 캘린더 (localStorage 기반)
  unifiedCalendar: (groupId: string) =>
    `unified-calendar-${groupId}` as const,

  // 의상 디자인 보드 (localStorage 기반)
  costumeDesign: (groupId: string, projectId: string) =>
    `costume-design-${groupId}-${projectId}` as const,

  // 교통 카풀 관리 (localStorage 기반)
  carpoolManagement: (groupId: string) =>
    `carpool-management-${groupId}` as const,

  // 멤버 부상 추적 (localStorage 기반)
  injuryTracker: (groupId: string) => `injury-tracker-${groupId}` as const,

  // 그룹 미션 보드 (localStorage 기반)
  missionBoard: (groupId: string) => `mission-board-${groupId}` as const,

  // 공연 사진 갤러리 (localStorage 기반)
  showGallery: (groupId: string, projectId: string) =>
    `show-gallery-${groupId}-${projectId}` as const,

  // 연습 타이머 기록 (localStorage 기반)
  practiceTimerLog: (groupId: string) =>
    `practice-timer-log-${groupId}` as const,

  // 그룹 예산 플래너 (localStorage 기반)
  budgetPlanner: (groupId: string) => `budget-planner-${groupId}` as const,

  // 멤버 댄스 다이어리 (localStorage 기반)
  danceDiary: (memberId: string) => `dance-diary-${memberId}` as const,

  // 그룹 멘토링 매칭 (localStorage 기반)
  mentoringMatch: (groupId: string) => `mentoring-match-${groupId}` as const,

  // 공연 무대 메모 (localStorage 기반)
  stageMemo: (groupId: string, projectId: string) =>
    `stage-memo-${groupId}-${projectId}` as const,

  // 멤버 식단 관리 (localStorage 기반)
  dietTracker: (memberId: string) => `diet-tracker-${memberId}` as const,

  // 공연 스폰서 후원 추적 (localStorage 기반)
  sponsorTracking: (groupId: string, projectId: string) =>
    `sponsor-tracking-${groupId}-${projectId}` as const,

  // 그룹 음악 저작권 관리 (localStorage 기반)
  musicLicense: (groupId: string) => `music-license-${groupId}` as const,

  // 그룹 소셜 미디어 캘린더 (localStorage 기반)
  socialCalendar: (groupId: string) => `social-calendar-${groupId}` as const,

  // 공연 드레스 코드 (localStorage 기반)
  dressCode: (groupId: string, projectId: string) =>
    `dress-code-${groupId}-${projectId}` as const,

  // 멤버 수면 추적 (localStorage 기반)
  sleepTracker: (memberId: string) => `sleep-tracker-${memberId}` as const,

  // 그룹 장비 대여 관리 (localStorage 기반)
  equipmentRental: (groupId: string) => `equipment-rental-${groupId}` as const,

  // 공연 메이크업 시트 (localStorage 기반)
  makeupSheet: (groupId: string, projectId: string) =>
    `makeup-sheet-${groupId}-${projectId}` as const,

  // 그룹 연습 도전 과제 (localStorage 기반)
  practiceChallenge: (groupId: string) => `practice-challenge-${groupId}` as const,

  // 멤버 스트레칭 루틴 (localStorage 기반)
  stretchingRoutine: (memberId: string) => `stretching-routine-${memberId}` as const,

  // 그룹 이벤트 RSVP (localStorage 기반)
  eventRsvp: (groupId: string) => `event-rsvp-${groupId}` as const,

  // 그룹 연습 평가표 (localStorage 기반)
  practiceEvaluation: (groupId: string) => `practice-evaluation-${groupId}` as const,

  // 공연 음향 큐시트 (localStorage 기반)
  soundCue: (groupId: string, projectId: string) =>
    `sound-cue-${groupId}-${projectId}` as const,

  // 공연 포스터 관리 (localStorage 기반)
  posterManagement: (groupId: string, projectId: string) =>
    `poster-management-${groupId}-${projectId}` as const,

  // 멤버 댄스 영감 보드 (localStorage 기반)
  inspirationBoard: (memberId: string) => `inspiration-board-${memberId}` as const,

  // 공연 무대 위험 평가 (localStorage 기반)
  stageRisk: (groupId: string, projectId: string) =>
    `stage-risk-${groupId}-${projectId}` as const,

  // 공연 VIP 게스트 관리 (localStorage 기반)
  vipGuest: (groupId: string, projectId: string) =>
    `vip-guest-${groupId}-${projectId}` as const,

  // 그룹 출석 통계 대시보드 (localStorage 기반)
  attendanceDashboard: (groupId: string) =>
    `attendance-dashboard-${groupId}` as const,

  // 그룹 연습 음악 큐 (localStorage 기반)
  musicQueue: (groupId: string) => `music-queue-${groupId}` as const,

  // 그룹 공유 자료실 (localStorage 기반)
  sharedLibrary: (groupId: string) => `shared-library-${groupId}` as const,

  // 멤버 댄스 스타일 프로필 (localStorage 기반)
  danceStyleProfile: (memberId: string) => `dance-style-profile-${memberId}` as const,

  // 공연 무대 전환 계획 (localStorage 기반)
  stageTransition: (groupId: string, projectId: string) =>
    `stage-transition-${groupId}-${projectId}` as const,

  // 공연 협찬품 관리 (localStorage 기반)
  sponsoredGoods: (groupId: string, projectId: string) =>
    `sponsored-goods-${groupId}-${projectId}` as const,

  // 멤버 댄스 포트폴리오 (localStorage 기반)
  dancePortfolio: (memberId: string) => `dance-portfolio-${memberId}` as const,

  // 공연 관객 좌석 예약 (localStorage 기반)
  seatReservation: (groupId: string, projectId: string) =>
    `seat-reservation-${groupId}-${projectId}` as const,

  // 그룹 연습 날씨 알림 (localStorage 기반)
  weatherAlert: (groupId: string) => `weather-alert-${groupId}` as const,

  // 그룹 팀빌딩 활동 (localStorage 기반)
  teamBuilding: (groupId: string) => `team-building-${groupId}` as const,

  // 공연 기술 요구사항 (localStorage 기반)
  techRequirements: (groupId: string, projectId: string) =>
    `tech-requirements-${groupId}-${projectId}` as const,

  // 그룹 공연 히스토리 (localStorage 기반)
  performanceHistory: (groupId: string) =>
    `performance-history-${groupId}` as const,

  // 멤버 체중/체형 추적 (localStorage 기반)
  bodyTracker: (memberId: string) => `body-tracker-${memberId}` as const,

  // 공연 무대 평면도 (localStorage 기반)
  stageLayout: (groupId: string, projectId: string) =>
    `stage-layout-${groupId}-${projectId}` as const,

  // 공연 커튼콜 계획 (localStorage 기반)
  curtainCall: (groupId: string, projectId: string) =>
    `curtain-call-${groupId}-${projectId}` as const,

  // 멤버 심리 상태 추적 (localStorage 기반)
  mentalWellness: (memberId: string) =>
    `mental-wellness-${memberId}` as const,

  // 그룹 대회 준비 체크 (localStorage 기반)
  competitionPrep: (groupId: string) =>
    `competition-prep-${groupId}` as const,

  // 공연 사운드체크 시트 (localStorage 기반)
  soundcheckSheet: (groupId: string, projectId: string) =>
    `soundcheck-sheet-${groupId}-${projectId}` as const,

  // 공연 앵콜 계획 (localStorage 기반)
  encorePlan: (groupId: string, projectId: string) =>
    `encore-plan-${groupId}-${projectId}` as const,

  // 그룹 연습 비디오 리뷰 (localStorage 기반)
  videoReview: (groupId: string) => `video-review-${groupId}` as const,

  // 멤버 목표 달성 배지 (localStorage 기반)
  achievementBadge: (memberId: string) => `achievement-badge-${memberId}` as const,

  // 그룹 연습 장소 관리 (localStorage 기반)
  practiceVenue: (groupId: string) => `practice-venue-${groupId}` as const,

  // 공연 프로그램 편집 (localStorage 기반)
  showProgram: (groupId: string, projectId: string) =>
    `show-program-${groupId}-${projectId}` as const,

  // 멤버 유연성 테스트 기록 (localStorage 기반)
  flexibilityTest: (memberId: string) => `flexibility-test-${memberId}` as const,

  // 공연 백스테이지 커뮤니케이션 (localStorage 기반)
  backstageComm: (groupId: string, projectId: string) =>
    `backstage-comm-${groupId}-${projectId}` as const,

  // 그룹 멤버 생일 캘린더 (localStorage 기반)
  birthdayCalendarLocal: (groupId: string) =>
    `birthday-calendar-${groupId}` as const,

  // 그룹 연습 룰/규칙 (localStorage 기반)
  practiceRule: (groupId: string) => `practice-rule-${groupId}` as const,

  // 멤버 댄스 목표 마일스톤 (localStorage 기반)
  danceMilestone: (memberId: string) => `dance-milestone-${memberId}` as const,

  // 공연 의상 변경 시트 (localStorage 기반)
  costumeChange: (groupId: string, projectId: string) =>
    `costume-change-${groupId}-${projectId}` as const,

  // 공연 무대 소품 관리 (localStorage 기반)
  stageProp: (groupId: string, projectId: string) =>
    `stage-prop-${groupId}-${projectId}` as const,

  // 그룹 공지사항 템플릿 (localStorage 기반)
  announcementTemplate: (groupId: string) =>
    `announcement-template-${groupId}` as const,

  // 공연 포토 콜 시트 (localStorage 기반)
  photoCall: (groupId: string, projectId: string) =>
    `photo-call-${groupId}-${projectId}` as const,

  // 멤버 댄스 워크숍 이력 (localStorage 기반)
  danceWorkshop: (memberId: string) => `dance-workshop-${memberId}` as const,

  // 그룹 연습 파트너 매칭 (localStorage 기반)
  practicePartner: (groupId: string) => `practice-partner-${groupId}` as const,

  // 그룹 역할 분담표 (localStorage 기반)
  roleAssignment: (groupId: string) => `role-assignment-${groupId}` as const,

  // 멤버 댄스 컨디션 일지 (localStorage 기반)
  danceCondition: (memberId: string) => `dance-condition-${memberId}` as const,

  // 그룹 연습 출결 사유서 (localStorage 기반)
  attendanceExcuse: (groupId: string) => `attendance-excuse-${groupId}` as const,

  // 공연 관객 안내 매뉴얼 (localStorage 기반)
  audienceGuide: (groupId: string, projectId: string) =>
    `audience-guide-${groupId}-${projectId}` as const,

  // 공연 스태프 콜시트 (localStorage 기반)
  staffCall: (groupId: string, projectId: string) =>
    `staff-call-${groupId}-${projectId}` as const,

  // 그룹 연습 기여도 포인트 (localStorage 기반)
  contributionPoint: (groupId: string) => `contribution-point-${groupId}` as const,

  // 공연 무대 동선 노트 (localStorage 기반)
  stageBlocking: (groupId: string, projectId: string) =>
    `stage-blocking-${groupId}-${projectId}` as const,

  // 멤버 댄스 오디션 기록 (localStorage 기반)
  danceAudition: (memberId: string) => `dance-audition-${memberId}` as const,

  // 그룹 외부 강사 관리 (localStorage 기반)
  guestInstructor: (groupId: string) => `guest-instructor-${groupId}` as const,

  // 공연 관객 카운트 (localStorage 기반)
  audienceCount: (groupId: string, projectId: string) =>
    `audience-count-${groupId}-${projectId}` as const,

  // 멤버 댄스 수업 수강 기록 (localStorage 기반)
  danceClassLog: (memberId: string) => `dance-class-log-${memberId}` as const,

  // 공연 입장 게이트 관리 (localStorage 기반)
  entranceGate: (groupId: string, projectId: string) =>
    `entrance-gate-${groupId}-${projectId}` as const,

  // 공연 미디어 보도 자료 (localStorage 기반)
  mediaPressKit: (groupId: string, projectId: string) =>
    `media-press-kit-${groupId}-${projectId}` as const,

  // 그룹 연습 장비 체크리스트 (localStorage 기반)
  equipmentChecklist: (groupId: string) =>
    `equipment-checklist-${groupId}` as const,

  // 그룹 연습 피드백 수집 (localStorage 기반)
  practiceFeedbackSession: (groupId: string) =>
    `practice-feedback-session-${groupId}` as const,

  // 그룹 연습 일지 요약 (localStorage 기반)
  groupPracticeJournal: (groupId: string) =>
    `group-practice-journal-${groupId}` as const,

  // 멤버 댄스 인증서/자격증 관리 (localStorage 기반)
  danceCertificationManager: (memberId: string) =>
    `dance-certification-manager-${memberId}` as const,

  // 공연 후원 감사편지 (localStorage 기반)
  thankYouLetter: (groupId: string, projectId: string) =>
    `thank-you-letter-${groupId}-${projectId}` as const,

  // 공연 출연료 정산 (localStorage 기반)
  performanceFee: (groupId: string, projectId: string) =>
    `performance-fee-${groupId}-${projectId}` as const,

  // 그룹 멤버 기술 매트릭스 (localStorage 기반)
  skillMatrixData: (groupId: string) =>
    `skill-matrix-data-${groupId}` as const,

  // 멤버 댄스 챌린지 참여 기록 (localStorage 기반)
  memberDanceChallenge: (memberId: string) =>
    `member-dance-challenge-${memberId}` as const,

  // 그룹 멤버 가용 시간표 (localStorage 기반)
  memberAvailabilitySchedule: (groupId: string) =>
    `member-availability-${groupId}` as const,

  // 공연 케이터링 관리 (localStorage 기반)
  catering: (groupId: string, projectId: string) =>
    `catering-${groupId}-${projectId}` as const,

  // 공연 무대 효과 큐시트 (localStorage 기반)
  stageEffect: (groupId: string, projectId: string) =>
    `stage-effect-${groupId}-${projectId}` as const,

  // 멤버 댄스 영상 포트폴리오 (localStorage 기반)
  videoPortfolio: (memberId: string) =>
    `video-portfolio-${memberId}` as const,

  // 그룹 공지 읽음 확인 (localStorage 기반)
  readReceipt: (groupId: string) =>
    `read-receipt-${groupId}` as const,

  // 그룹 연습 하이라이트 (localStorage 기반)
  practiceHighlight: (groupId: string) =>
    `practice-highlight-${groupId}` as const,

  // 공연 안전 체크리스트 (localStorage 기반)
  safetyChecklist: (groupId: string, projectId: string) =>
    `safety-checklist-${groupId}-${projectId}` as const,

  // 공연 관객 설문조사 (localStorage 기반)
  audienceSurvey: (groupId: string, projectId: string) =>
    `audience-survey-${groupId}-${projectId}` as const,

  // 댄스 네트워킹 연락처 (localStorage 기반)
  danceNetworking: (memberId: string) =>
    `dance-networking-${memberId}` as const,

  // 공연 실시간 피드 (localStorage 기반)
  liveShowFeed: (groupId: string, projectId: string) =>
    `live-show-feed-${groupId}-${projectId}` as const,

  // 멤버 감사 카드 (localStorage 기반)
  appreciationCard: (groupId: string) =>
    `appreciation-card-${groupId}` as const,

  // 공연 사후 분석 보고서 (localStorage 기반)
  postShowReport: (groupId: string, projectId: string) =>
    `post-show-report-${groupId}-${projectId}` as const,

  // 그룹 멤버 출석 통계 대시보드 (localStorage 기반)
  memberAttendanceStatsDashboard: (groupId: string) =>
    `member-attendance-stats-dashboard-${groupId}` as const,

  // 소셜 미디어 포스트 플래너 (localStorage 기반)
  socialPostPlanner: (groupId: string, projectId: string) =>
    `social-post-planner-${groupId}-${projectId}` as const,

  // 댄스 부상 기록 (localStorage 기반)
  danceInjuryLog: (memberId: string) =>
    `dance-injury-log-${memberId}` as const,

  // 그룹 월간 하이라이트 (localStorage 기반)
  monthlyHighlights: (groupId: string) =>
    `monthly-highlights-${groupId}` as const,

  // 공연 엔딩 크레딧 (localStorage 기반)
  showCredits: (groupId: string, projectId: string) =>
    `show-credits-${groupId}-${projectId}` as const,

  // 댄스 스타일 분석 (localStorage 기반)
  danceStyleAnalysis: (memberId: string) =>
    `dance-style-analysis-${memberId}` as const,

  // 공연 무대 세팅 체크리스트 (localStorage 기반)
  stageSetupChecklist: (groupId: string, projectId: string) =>
    `stage-setup-checklist-${groupId}-${projectId}` as const,

  // 그룹 멘탈 코칭 노트 (localStorage 기반)
  mentalCoaching: (groupId: string) =>
    `mental-coaching-${groupId}` as const,

  // 댄스 루틴 빌더 (localStorage 기반)
  danceRoutineBuilder: (memberId: string) =>
    `dance-routine-builder-${memberId}` as const,

  // 공연 드레스 리허설 노트 (localStorage 기반)
  dressRehearsal: (projectId: string) =>
    `dress-rehearsal-${projectId}` as const,

  // 공연 무대 리스크 평가 (localStorage 기반)
  stageRiskAssessment: (projectId: string) =>
    `stage-risk-assessment-${projectId}` as const,

  // 그룹 이벤트 캘린더 (localStorage 기반)
  groupEventCalendar: (groupId: string) =>
    `group-event-calendar-${groupId}` as const,

  // 연습실 예약 (localStorage 기반)
  practiceRoomBooking: (groupId: string) =>
    `practice-room-booking-${groupId}` as const,

  // 공연 무대 전환 계획 (localStorage 기반)
  stageTransitionPlan: (projectId: string) =>
    `stage-transition-plan-${projectId}` as const,

  // 그룹 출결 QR 체크인 (localStorage 기반)
  qrCheckIn: (groupId: string) =>
    `qr-check-in-${groupId}` as const,

  // 그룹 예산 트래커 (localStorage 기반)
  groupBudgetTracker: (groupId: string) =>
    `group-budget-tracker-${groupId}` as const,

  // 공연 티켓 관리 (localStorage 기반)
  performanceTicket: (projectId: string) =>
    `performance-ticket-${projectId}` as const,

  // 공연 무대 포메이션 디자이너 (localStorage 기반)
  stageFormation: (projectId: string) =>
    `stage-formation-${projectId}` as const,

  // 멤버 댄스 뮤직 플레이리스트 (localStorage 기반)
  danceMusicPlaylist: (memberId: string) =>
    `dance-music-playlist-${memberId}` as const,

  // 백스테이지 커뮤니케이션 로그 (localStorage 기반)
  backstageLog: (projectId: string) =>
    `backstage-log-${projectId}` as const,

  // 멤버 댄스 목표 트래커 (localStorage 기반)
  danceGoalTracker: (memberId: string) =>
    `dance-goal-tracker-${memberId}` as const,

  // 그룹 출석부 (localStorage 기반)
  attendanceBook: (groupId: string) =>
    `attendance-book-${groupId}` as const,

  // 공연 후원/스폰서 관리 (localStorage 기반)
  performanceSponsor: (projectId: string) =>
    `performance-sponsor-${projectId}` as const,

  // 그룹 공지사항 보드 (localStorage 기반)
  groupAnnouncementBoard: (groupId: string) =>
    `group-announcement-board-${groupId}` as const,

  // 그룹 장비 관리 (localStorage 기반)
  groupEquipment: (groupId: string) =>
    `group-equipment-${groupId}` as const,

  // 멤버 댄스 컨디션 일지 (localStorage 기반)
  danceConditionLog: (memberId: string) =>
    `dance-condition-log-${memberId}` as const,

  // 그룹 회의 안건 투표 (localStorage 기반)
  meetingAgendaVote: (groupId: string) =>
    `meeting-agenda-vote-${groupId}` as const,

  // 공연 프로그램 북 편집기 (localStorage 기반)
  programBookEditor: (projectId: string) =>
    `program-book-editor-${projectId}` as const,

  // 공연 마케팅 캠페인 (localStorage 기반)
  marketingCampaign: (projectId: string) =>
    `marketing-campaign-${projectId}` as const,

  // 그룹 공유 파일함 (localStorage 기반)
  groupSharedFiles: (groupId: string) =>
    `group-shared-files-${groupId}` as const,

  // 멤버 댄스 영상 포트폴리오 (localStorage 기반)
  danceVideoPortfolio: (memberId: string) =>
    `dance-video-portfolio-${memberId}` as const,

  // 그룹 멤버 생일 캘린더 (localStorage 기반)
  memberBirthdayCalendar: (groupId: string) =>
    `member-birthday-calendar-${groupId}` as const,

  // 공연 관객 피드백 수집 (localStorage 기반)
  audienceFeedback: (projectId: string) =>
    `audience-feedback-${projectId}` as const,

  // 공연 무대 안전 점검 (localStorage 기반)
  stageSafetyCheck: (projectId: string) =>
    `stage-safety-check-${projectId}` as const,

  // 공연 의상 핏팅 기록 (localStorage 기반)
  costumeFitting: (projectId: string) =>
    `costume-fitting-${projectId}` as const,

  // 댄스 수업 평가 노트 (localStorage 기반)
  danceClassReview: (memberId: string) =>
    `dance-class-review-${memberId}` as const,

  // 그룹 미디어 갤러리 (localStorage 기반)
  groupMediaGallery: (groupId: string) =>
    `group-media-gallery-${groupId}` as const,

  // 그룹 기념일 (localStorage 기반)
  groupAnniversary: (groupId: string) =>
    `group-anniversary-${groupId}` as const,

  // 그룹 회비 관리 (localStorage 기반)
  membershipFee: (groupId: string) =>
    `membership-fee-${groupId}` as const,

  // 공연 세트리스트 (localStorage 기반)
  performanceSetlist: (projectId: string) =>
    `performance-setlist-${projectId}` as const,

  // 공연 무대 소품 관리 v2 (localStorage 기반)
  stagePropManagement: (projectId: string) =>
    `stage-prop-management-${projectId}` as const,

  // 멤버 댄스 대회 참가 기록 (localStorage 기반)
  danceCompetition: (memberId: string) =>
    `dance-competition-${memberId}` as const,

  // 그룹 규정집 (localStorage 기반)
  groupRulebook: (groupId: string) =>
    `group-rulebook-${groupId}` as const,

  // 그룹 음악 라이브러리 (localStorage 기반)
  groupMusicLibrary: (groupId: string) =>
    `group-music-library-${groupId}` as const,

  // 공연 출연 동의서 관리 (localStorage 기반)
  consentForm: (projectId: string) => `consent-form-${projectId}` as const,

  // 그룹 연습 피드백 v2 (localStorage 기반)
  groupPracticeFeedback: (groupId: string) =>
    `practice-feedback-${groupId}` as const,

  // 공연 사진 촬영 계획 (localStorage 기반)
  photoShootPlan: (projectId: string) => `photo-shoot-plan-${projectId}` as const,

  // 그룹 멘토 매칭 (localStorage 기반)
  groupMentorMatches: (groupId: string) =>
    `group-mentor-matches-${groupId}` as const,

  // 댄스 스타일 프로필 v2 (localStorage 기반)
  danceStyleProfileV2: (memberId: string) => `dance-style-profile-v2-${memberId}` as const,

  // 댄스 그룹 챌린지 카드 (localStorage 기반)
  groupChallengeCard: (groupId: string) =>
    `group-challenge-card-${groupId}` as const,

  // 공연장 관리 (localStorage 기반)
  venueManagement: (projectId: string) => `venue-management-${projectId}` as const,

  // 분장/헤어 관리 (localStorage 기반)
  makeupHair: (projectId: string) => `makeup-hair-${projectId}` as const,

  // 그룹 스트릭 카드 (localStorage 기반)
  groupStreak: (groupId: string) => `group-streak-${groupId}` as const,

  // 그룹 위시리스트 v2 (localStorage 기반)
  groupWishlistV2: (groupId: string) => `group-wishlist-v2-${groupId}` as const,

  // 공연 비상 연락망 (localStorage 기반)
  showEmergencyContact: (projectId: string) => `show-emergency-contact-${projectId}` as const,

  // 그룹 FAQ (localStorage 기반)
  groupFaq: (groupId: string) => `group-faq-${groupId}` as const,

  // 그룹 회비 납부 추적기 (localStorage 기반)
  groupDuesTracker: (groupId: string) => `group-dues-tracker-${groupId}` as const,

  // 공연 큐시트 (localStorage 기반)
  showCueSheet: (projectId: string) => `show-cue-sheet-${projectId}` as const,

  // 의상 추적기 (localStorage 기반)
  wardrobeTracker: (projectId: string) => `wardrobe-tracker-${projectId}` as const,

  // 개인 댄스 플레이리스트 (localStorage 기반)
  dancePlaylist: (memberId: string) => `dance-playlist-${memberId}` as const,

  // 그룹 게시판 (localStorage 기반)
  groupNoticeboard: (groupId: string) => `group-noticeboard-${groupId}` as const,

  // 그룹 투표 (localStorage 기반)
  groupVoting: (groupId: string) => `group-voting-${groupId}` as const,

  // 인터컴/통신 체계 (localStorage 기반)
  showIntercom: (projectId: string) => `show-intercom-${projectId}` as const,

  // 야외 공연 날씨 관리 (localStorage 기반)
  stageWeather: (projectId: string) => `stage-weather-${projectId}` as const,

  // 유연성 트래커 (localStorage 기반)
  danceFlexibility: (memberId: string) => `dance-flexibility-${memberId}` as const,

  // 리허설 런다운 (localStorage 기반)
  showRundown: (projectId: string) => `show-rundown-${projectId}` as const,

  // 아티스트 라이더 (localStorage 기반)
  artistRider: (projectId: string) => `artist-rider-${projectId}` as const,

  // 익명 피드백 박스 (localStorage 기반)
  groupFeedbackBox: (groupId: string) => `group-feedback-box-${groupId}` as const,

  // 카풀 매칭 (localStorage 기반)
  groupCarPool: (groupId: string) => `group-carpool-${groupId}` as const,

  // 스킬 공유 (localStorage 기반)
  groupSkillShare: (groupId: string) => `group-skill-share-${groupId}` as const,

  // 댄스 무드보드 (localStorage 기반)
  danceMoodBoard: (memberId: string) => `dance-mood-board-${memberId}` as const,

  // 티켓 판매 현황 (localStorage 기반)
  ticketSales: (projectId: string) => `ticket-sales-${projectId}` as const,

  // 무대 출입 관리 (localStorage 기반)
  stageAccess: (projectId: string) => `stage-access-${projectId}` as const,

  // 벌칙/페널티 관리 (localStorage 기반)
  groupPenalty: (groupId: string) => `group-penalty-${groupId}` as const,

  // 댄서 영양 관리 (localStorage 기반)
  danceNutrition: (memberId: string) => `dance-nutrition-${memberId}` as const,

  // 세트 전환 기록 (localStorage 기반)
  setChangeLog: (projectId: string) => `set-change-log-${projectId}` as const,

  // 그룹 타임라인/연혁 (localStorage 기반)
  groupTimeline: (groupId: string) => `group-timeline-${groupId}` as const,

  // 분실물 관리 (localStorage 기반)
  groupLostFound: (groupId: string) => `group-lost-found-${groupId}` as const,

  // 공연 당일 체크리스트 (localStorage 기반)
  showDayChecklist: (projectId: string) => `show-day-checklist-${projectId}` as const,
};
