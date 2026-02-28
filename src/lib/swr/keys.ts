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
  rehearsalSchedule: (groupId: string, projectId: string) =>
    `rehearsal-schedule-${groupId}-${projectId}` as const,

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

  // 공연 관객 피드백 (localStorage 기반)
  audienceFeedback: (groupId: string, projectId: string) =>
    `audience-feedback-${groupId}-${projectId}` as const,

  // 멤버 댄스 다이어리 (localStorage 기반)
  danceDiary: (memberId: string) => `dance-diary-${memberId}` as const,

  // 그룹 멘토링 매칭 (localStorage 기반)
  mentoringMatch: (groupId: string) => `mentoring-match-${groupId}` as const,

  // 공연 무대 메모 (localStorage 기반)
  stageMemo: (groupId: string, projectId: string) =>
    `stage-memo-${groupId}-${projectId}` as const,
};
