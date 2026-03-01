// 그룹, 하위그룹, 가입신청 관련 키
export const groupKeys = {
  // 독립 엔티티 ID (get_independent_entity_ids RPC 캐싱용)
  independentEntities: (groupId: string) =>
    `/groups/${groupId}/independent-entities` as const,

  // 그룹
  groups: () => "/groups" as const,
  groupDetail: (groupId: string) => `/groups/${groupId}` as const,

  // 하위그룹
  subgroups: (groupId: string) => `/groups/${groupId}/subgroups` as const,
  groupAncestors: (groupId: string) => `/groups/${groupId}/ancestors` as const,
  parentGroupMembers: (parentGroupId: string) => `/groups/${parentGroupId}/members` as const,
  subgroupPerformance: (groupId: string) => `/groups/${groupId}/subgroup-performance` as const,

  // 가입 신청
  pendingJoinRequestCount: (groupId: string) =>
    `/groups/${groupId}/join-requests/pending-count` as const,
  joinRequests: (groupId: string, status?: string) =>
    `/groups/${groupId}/join-requests${status ? `?status=${status}` : ""}` as const,

  // 그룹 통계
  groupStats: (groupId: string) => `/groups/${groupId}/stats` as const,
  groupHealth: (groupId: string) => `/groups/${groupId}/health` as const,
  groupHealthSuggestions: (groupId: string) =>
    `/groups/${groupId}/health-suggestions` as const,

  // 그룹 활동
  groupActivity: (groupId: string) => `group-activity-${groupId}` as const,
  groupActivityTrends: (groupId: string) => `group-activity-trends-${groupId}` as const,
  filteredActivityTimeline: (groupId: string, daysBack: number) =>
    `/groups/${groupId}/filtered-activity-timeline?days=${daysBack}` as const,
  groupActivityReport: (groupId: string, period: "week" | "month") =>
    `/groups/${groupId}/activity-report?period=${period}` as const,
  groupActivityHeatmap: (groupId: string) =>
    `/groups/${groupId}/activity-heatmap` as const,
  activityArchive: (groupId: string) =>
    `/groups/${groupId}/activity-archive` as const,
  activityLogs: (entityType: string, entityId: string) =>
    `/activity-logs/${entityType}/${entityId}` as const,
  activityRetrospective: (groupId: string) =>
    `/groups/${groupId}/retrospective` as const,
  activityTimeHeatmap: (groupId: string) =>
    `activity-time-heatmap-${groupId}` as const,
  activityReport: (groupId: string) => `activity-report-${groupId}` as const,

  // 그룹 성과
  groupPerformanceSnapshot: (groupId: string, period: "week" | "month") =>
    `/groups/${groupId}/performance-snapshot?period=${period}` as const,
  groupPerformanceReport: (groupId: string) =>
    `/groups/${groupId}/performance-report` as const,
  groupPortfolio: (groupId: string) => `group-portfolio-${groupId}` as const,
  performanceRecords: (groupId: string) => `performance-records-${groupId}` as const,

  // 그룹 건강도
  groupHealthSnapshot: (groupId: string) => `group-health-snapshot-${groupId}` as const,
  groupHealthTrends: (groupId: string) => `group-health-trends-${groupId}` as const,

  // 멤버 관련 (그룹 수준)
  groupMembersForNotification: (groupId: string) =>
    `/groups/${groupId}/members-for-notification` as const,
  groupMembersForRoleBadge: (groupId: string) =>
    `/groups/${groupId}/members-for-role-badge` as const,
  memberBatchInvite: (groupId: string) =>
    `/groups/${groupId}/member-batch-invite` as const,
  memberRisk: (groupId: string) => `/groups/${groupId}/member-risk` as const,
  memberEngagement: (groupId: string) => `/member-engagement/${groupId}` as const,
  memberEngagementForecast: (groupId: string) =>
    `/groups/${groupId}/engagement-forecast` as const,
  memberComparison: (groupId: string, memberIds: string[]) =>
    `/member-comparison/${groupId}?members=${memberIds.slice().sort().join(",")}` as const,
  memberSkills: (groupId: string) => `/groups/${groupId}/member-skills` as const,
  memberInteractionScore: (groupId: string) =>
    `/groups/${groupId}/member-interaction-score` as const,
  memberHealthScore: (groupId: string) =>
    `/groups/${groupId}/member-health-score` as const,
  memberScoreLeaderboard: (groupId: string) =>
    `/groups/${groupId}/member-score-leaderboard` as const,
  memberPairing: (groupId: string) => `/groups/${groupId}/member-pairing` as const,
  memberPairingSuggestion: (groupId: string) =>
    `/groups/${groupId}/pairing-suggestions` as const,
  partnerMatchingMembers: (groupId: string) =>
    `/groups/${groupId}/partner-matching-members` as const,
  memberActivityDistribution: (groupId: string) =>
    `/groups/${groupId}/member-activity-distribution` as const,
  memberBatchInviteList: (groupId: string) =>
    `/groups/${groupId}/member-batch-invite` as const,

  // 역할/리더십
  rolePromotionCandidates: (groupId: string) =>
    `/groups/${groupId}/role-promotion-candidates` as const,
  leadershipCandidates: (groupId: string) =>
    `/groups/${groupId}/leadership-candidates` as const,

  // 이탈 방지
  winbackCandidates: (groupId: string) =>
    `/groups/${groupId}/winback-candidates` as const,
  churnRiskDetection: (groupId: string) =>
    `/groups/${groupId}/churn-risk-detection` as const,

  // 콘텐츠 신고
  contentReports: (groupId: string) =>
    `/groups/${groupId}/content-reports` as const,
  contentReportsPendingCount: (groupId: string) =>
    `/groups/${groupId}/content-reports/pending-count` as const,

  // 기타 그룹 설정
  groupRules: (groupId: string) => `group-rules-${groupId}` as const,
  contactVerification: (groupId: string) =>
    `/groups/${groupId}/contact-verification` as const,
  permissionAudits: (groupId: string) =>
    `/groups/${groupId}/permission-audits` as const,
  entitySettings: (entityType: string, entityId: string, key: string) =>
    `/entity-settings/${entityType}/${entityId}/${key}` as const,

  // 온보딩
  onboardingProgressTracker: (groupId: string) =>
    `/groups/${groupId}/onboarding-progress-tracker` as const,
  memberAvailability: (groupId: string, userId: string) =>
    `/groups/${groupId}/members/${userId}/availability` as const,
  memberAvailabilitySchedule: (groupId: string) =>
    `member-availability-${groupId}` as const,

  // 위치/장소
  locationSuggestions: (groupId: string) =>
    `/groups/${groupId}/location-suggestions` as const,

  // 회의록
  meetingMinutes: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/meeting-minutes${projectId ? `?project=${projectId}` : ""}` as const,

  // 생일
  birthdayCalendar: (groupId: string) =>
    `/groups/${groupId}/birthday-calendar` as const,
  birthdayCalendarLocal: (groupId: string) =>
    `birthday-calendar-${groupId}` as const,

  // 폴/챌린지
  groupPolls: (groupId: string) => `/groups/${groupId}/polls` as const,
  groupChallenges: (groupId: string) => `group-challenges-${groupId}` as const,
  weeklyChallengeBoard: (groupId: string) =>
    `weekly-challenge-board-${groupId}` as const,

  // 장르
  genreRoleRecommendation: (groupId: string) =>
    `/groups/${groupId}/genre-role-recommendation` as const,

  // 이상 탐지
  anomalyDetection: (groupId: string) =>
    `/groups/${groupId}/anomaly-detection` as const,

  // 마일스톤
  groupMilestonesAchievements: (groupId: string) =>
    `/groups/${groupId}/milestones-achievements` as const,

  // 커스텀 리포트
  customReport: (groupId: string, reportId: string) =>
    `/groups/${groupId}/custom-report/${reportId}` as const,

  // 월간 리포트
  monthlyReport: (groupId: string, year: number, month: number) =>
    `monthly-report-${groupId}-${year}-${month}` as const,

  // localStorage 기반 그룹 키
  groupAnnouncementBoard: (groupId: string) =>
    `group-announcement-board-${groupId}` as const,
  groupAnniversary: (groupId: string) => `group-anniversary-${groupId}` as const,
  groupBudgetTracker: (groupId: string) => `group-budget-tracker-${groupId}` as const,
  groupCarPool: (groupId: string) => `group-carpool-${groupId}` as const,
  groupChallengeCard: (groupId: string) => `group-challenge-card-${groupId}` as const,
  groupDuesTracker: (groupId: string) => `group-dues-tracker-${groupId}` as const,
  groupEnergyTracker: (groupId: string) => `group-energy-tracker-${groupId}` as const,
  groupEquipment: (groupId: string) => `group-equipment-${groupId}` as const,
  groupEventCalendar: (groupId: string) => `group-event-calendar-${groupId}` as const,
  groupFaq: (groupId: string) => `group-faq-${groupId}` as const,
  groupFeedbackBox: (groupId: string) => `group-feedback-box-${groupId}` as const,
  groupLostFound: (groupId: string) => `group-lost-found-${groupId}` as const,
  groupMediaGallery: (groupId: string) => `group-media-gallery-${groupId}` as const,
  groupMentorMatches: (groupId: string) => `group-mentor-matches-${groupId}` as const,
  groupMusicLibrary: (groupId: string) => `group-music-library-${groupId}` as const,
  groupNoticeboard: (groupId: string) => `group-noticeboard-${groupId}` as const,
  groupPenalty: (groupId: string) => `group-penalty-${groupId}` as const,
  groupPracticeFeedback: (groupId: string) => `practice-feedback-${groupId}` as const,
  groupPracticeJournal: (groupId: string) => `group-practice-journal-${groupId}` as const,
  groupRulebook: (groupId: string) => `group-rulebook-${groupId}` as const,
  groupSharedFiles: (groupId: string) => `group-shared-files-${groupId}` as const,
  groupSkillShare: (groupId: string) => `group-skill-share-${groupId}` as const,
  groupStreak: (groupId: string) => `group-streak-${groupId}` as const,
  groupTimeline: (groupId: string) => `group-timeline-${groupId}` as const,
  groupVote: (groupId: string) => `group-vote-${groupId}` as const,
  groupVoting: (groupId: string) => `group-voting-${groupId}` as const,
  groupWishlist: (groupId: string) => `group-wishlist-${groupId}` as const,
  groupWishlistV2: (groupId: string) => `group-wishlist-v2-${groupId}` as const,
  mentoringSystem: (groupId: string) => `mentoring-system-${groupId}` as const,
  missionBoard: (groupId: string) => `mission-board-${groupId}` as const,
  practiceGoalBoard: (groupId: string) => `practice-goal-board-${groupId}` as const,
  practiceNotes: (groupId: string) => `practice-notes-${groupId}` as const,
  qnaBoard: (groupId: string) => `qna-board-${groupId}` as const,
  readReceipt: (groupId: string) => `read-receipt-${groupId}` as const,
  roleAssignment: (groupId: string) => `role-assignment-${groupId}` as const,
  roleRotation: (groupId: string) => `role-rotation-${groupId}` as const,
  routineBuilder: (groupId: string) => `routine-builder-${groupId}` as const,
  sessionAutoFeedback: (groupId: string) => `/groups/${groupId}/session-feedback` as const,
  sessionRating: (groupId: string) => `session-rating-${groupId}` as const,
  sharedLibrary: (groupId: string) => `shared-library-${groupId}` as const,
  skillMatrix: (groupId: string) => `skill-matrix-${groupId}` as const,
  skillMatrixData: (groupId: string) => `skill-matrix-data-${groupId}` as const,
  socialGraph: (groupId: string) => `social-graph-${groupId}` as const,
  teamBuilding: (groupId: string) => `team-building-${groupId}` as const,
  thankYouBoard: (groupId: string) => `thank-you-board-${groupId}` as const,
  thankYouLetters: (groupId: string) => `thank-you-letters-${groupId}` as const,
  timeCapsule: (groupId: string) => `time-capsule-${groupId}` as const,
  venueReview: (groupId: string) => `venue-review-${groupId}` as const,
  videoReview: (groupId: string) => `video-review-${groupId}` as const,
  weatherAlert: (groupId: string) => `weather-alert-${groupId}` as const,
  mentalCoaching: (groupId: string) => `mental-coaching-${groupId}` as const,
  meetingMinutesMemo: (groupId: string) => `meeting-minutes-${groupId}` as const,
  meetingAgendaVote: (groupId: string) => `meeting-agenda-vote-${groupId}` as const,
  announcementTemplate: (groupId: string) => `announcement-template-${groupId}` as const,
  appreciationCard: (groupId: string) => `appreciation-card-${groupId}` as const,
  communicationPreferences: (groupId: string, userId: string) =>
    `/groups/${groupId}/members/${userId}/comm-prefs` as const,
  cultureAlignment: (groupId: string) => `culture-alignment-${groupId}` as const,
  memberBirthdayCalendar: (groupId: string) => `member-birthday-calendar-${groupId}` as const,
  memberGoal: (groupId: string) => `member-goal-${groupId}` as const,
  monthlyHighlights: (groupId: string) => `monthly-highlights-${groupId}` as const,
  musicQueue: (groupId: string) => `music-queue-${groupId}` as const,
  qrCheckIn: (groupId: string) => `qr-check-in-${groupId}` as const,
  danceGlossary: (groupId: string) => `dance-glossary-${groupId}` as const,
  danceStyleCompatibility: (groupId: string) => `dance-style-compatibility-${groupId}` as const,
  danceCertification: (groupId: string) => `dance-certification-${groupId}` as const,
  collaborationEffectiveness: (groupId: string) => `collab-effectiveness-${groupId}` as const,
  equipmentInventory: (groupId: string) => `equipment-inventory-${groupId}` as const,
  equipmentRental: (groupId: string) => `equipment-rental-${groupId}` as const,
  equipmentChecklist: (groupId: string) => `equipment-checklist-${groupId}` as const,
  eventCalendar: (groupId: string) => `event-calendar-${groupId}` as const,
  eventRsvp: (groupId: string) => `event-rsvp-${groupId}` as const,
  eventSponsorship: (groupId: string) => `event-sponsorship-${groupId}` as const,
  guestInstructor: (groupId: string) => `guest-instructor-${groupId}` as const,
  photoAlbum: (groupId: string) => `photo-album-${groupId}` as const,
  practiceVenue: (groupId: string) => `practice-venue-${groupId}` as const,
  practiceChallenge: (groupId: string) => `practice-challenge-${groupId}` as const,
  practiceFeedback: (groupId: string) => `practice-feedback-${groupId}` as const,
  practiceFeedbackSession: (groupId: string) => `practice-feedback-session-${groupId}` as const,
  practiceHighlight: (groupId: string) => `practice-highlight-${groupId}` as const,
  practiceRoomBooking: (groupId: string) => `practice-room-booking-${groupId}` as const,
  practiceRule: (groupId: string) => `practice-rule-${groupId}` as const,
  socialCalendar: (groupId: string) => `social-calendar-${groupId}` as const,
  waiverManagement: (groupId: string) => `waiver-management-${groupId}` as const,
  competitionPrep: (groupId: string) => `competition-prep-${groupId}` as const,
  contributionBoard: (groupId: string) => `contribution-board-${groupId}` as const,
  contributionPoint: (groupId: string) => `contribution-point-${groupId}` as const,
  decisionPoll: (groupId: string) => `decision-poll-${groupId}` as const,
  focusTimer: (groupId: string) => `focus-timer-${groupId}` as const,
  fundraisingGoal: (groupId: string) => `fundraising-goal-${groupId}` as const,
  leaveManagement: (groupId: string) => `leave-management-${groupId}` as const,
  membershipFee: (groupId: string) => `membership-fee-${groupId}` as const,
  styleVote: (groupId: string) => `style-vote-${groupId}` as const,
  weeklyTimetable: (groupId: string) => `weekly-timetable-${groupId}` as const,
  emergencyContact: (groupId: string) => `emergency-contact-${groupId}` as const,
  impressionWall: (groupId: string) => `impression-wall-${groupId}` as const,
};
