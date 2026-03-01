// 멤버, 프로필, 스킬, 팔로우 관련 키
export const memberKeys = {
  // 프로필
  userProfile: (userId: string) => `/profiles/${userId}` as const,
  memberPreview: (userId: string, groupId?: string | null) =>
    `/member-preview/${userId}${groupId ? `?group=${groupId}` : ""}` as const,
  memberNote: (groupId: string, targetUserId: string) =>
    `/groups/${groupId}/member-notes/${targetUserId}` as const,
  memberBadgeStats: (groupId: string, userId: string) =>
    `/member-badge-stats/${groupId}/${userId}` as const,

  // 팔로우
  followStatus: (targetUserId: string) => `/follow-status/${targetUserId}` as const,
  followList: (userId: string, type: "followers" | "following") =>
    `/follow-list/${userId}/${type}` as const,
  suggestedFollows: () => "/suggested-follows" as const,

  // 사용자 활동
  userActivityStats: (userId: string) => `/user-activity-stats/${userId}` as const,
  memberActivityTimeline: (userId: string) =>
    `/member-activity-timeline/${userId}` as const,
  memberDashboardActivity: (userId: string) =>
    `/member-dashboard-activity/${userId}` as const,
  memberBenchmarking: (groupId: string, userId: string) =>
    `/member-benchmarking/${groupId}/${userId}` as const,
  personalGrowthTimeline: (groupId: string, userId: string) =>
    `/groups/${groupId}/members/${userId}/growth-timeline` as const,

  // 온보딩
  onboardingStatus: (userId: string) => `/onboarding-status/${userId}` as const,

  // 스킬
  skillSelfEvaluation: (groupId: string, userId: string) =>
    `/groups/${groupId}/skill-self-evaluation/${userId}` as const,

  // localStorage 기반 멤버 개인 키
  achievementBadge: (memberId: string) => `achievement-badge-${memberId}` as const,
  bodyTracker: (memberId: string) => `body-tracker-${memberId}` as const,
  danceAudition: (memberId: string) => `dance-audition-${memberId}` as const,
  danceCertificationManager: (memberId: string) =>
    `dance-certification-manager-${memberId}` as const,
  danceChallenge: (groupId: string) => `dance-challenge-${groupId}` as const,
  danceClassLog: (memberId: string) => `dance-class-log-${memberId}` as const,
  danceClassReview: (memberId: string) => `dance-class-review-${memberId}` as const,
  danceCompetition: (memberId: string) => `dance-competition-${memberId}` as const,
  danceCondition: (memberId: string) => `dance-condition-${memberId}` as const,
  danceConditionLog: (memberId: string) => `dance-condition-log-${memberId}` as const,
  danceDiary: (memberId: string) => `dance-diary-${memberId}` as const,
  danceFlexibility: (memberId: string) => `dance-flexibility-${memberId}` as const,
  danceGlossaryEntries: (groupId: string) => `dance-glossary-${groupId}` as const,
  danceGoalTracker: (memberId: string) => `dance-goal-tracker-${memberId}` as const,
  danceInjuryLog: (memberId: string) => `dance-injury-log-${memberId}` as const,
  danceMilestone: (memberId: string) => `dance-milestone-${memberId}` as const,
  danceMoodBoard: (memberId: string) => `dance-mood-board-${memberId}` as const,
  danceMusicPlaylist: (memberId: string) => `dance-music-playlist-${memberId}` as const,
  danceNetworking: (memberId: string) => `dance-networking-${memberId}` as const,
  danceNutrition: (memberId: string) => `dance-nutrition-${memberId}` as const,
  dancePlaylist: (memberId: string) => `dance-playlist-${memberId}` as const,
  dancePortfolio: (memberId: string) => `dance-portfolio-${memberId}` as const,
  danceRoutineBuilder: (memberId: string) => `dance-routine-builder-${memberId}` as const,
  danceStyleAnalysis: (memberId: string) => `dance-style-analysis-${memberId}` as const,
  danceStyleProfile: (memberId: string) => `dance-style-profile-${memberId}` as const,
  danceStyleProfileV2: (memberId: string) => `dance-style-profile-v2-${memberId}` as const,
  danceVideoPortfolio: (memberId: string) => `dance-video-portfolio-${memberId}` as const,
  danceWorkshop: (memberId: string) => `dance-workshop-${memberId}` as const,
  dietTracker: (memberId: string) => `diet-tracker-${memberId}` as const,
  fitnessTest: (groupId: string) => `fitness-test-${groupId}` as const,
  flexibilityTest: (memberId: string) => `flexibility-test-${memberId}` as const,
  growthJournal: (groupId: string) => `growth-journal-${groupId}` as const,
  growthTrajectory: (groupId: string) => `growth-trajectory-${groupId}` as const,
  healthTracking: (groupId: string, userId: string) =>
    `health-tracking-${groupId}-${userId}` as const,
  inspirationBoard: (memberId: string) => `inspiration-board-${memberId}` as const,
  learningPath: (groupId: string, userId: string) =>
    `learning-path-${groupId}-${userId}` as const,
  memberBadge: (groupId: string) => `member-badge-${groupId}` as const,
  memberDanceChallenge: (memberId: string) =>
    `member-dance-challenge-${memberId}` as const,
  memberQuiz: (groupId: string) => `member-quiz-${groupId}` as const,
  mentalWellness: (memberId: string) => `mental-wellness-${memberId}` as const,
  peerScoring: (groupId: string) => `peer-scoring-${groupId}` as const,
  rewardPoints: (groupId: string) => `reward-points-${groupId}` as const,
  skillCertification: (groupId: string) => `skill-certification-${groupId}` as const,
  skillTree: (groupId: string, userId: string) =>
    `skill-tree-${groupId}-${userId}` as const,
  sleepTracker: (memberId: string) => `sleep-tracker-${memberId}` as const,
  stretchingRoutine: (memberId: string) => `stretching-routine-${memberId}` as const,
  videoPortfolio: (memberId: string) => `video-portfolio-${memberId}` as const,
};
