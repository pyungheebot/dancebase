import { mutate } from "swr";
import { swrKeys } from "./keys";

// 특정 키 무효화
export function invalidateGroup(groupId: string) {
  mutate(swrKeys.groups());
  mutate(swrKeys.groupDetail(groupId));
  mutate(swrKeys.projects(groupId));
}

export function invalidateSubgroups(groupId: string) {
  mutate(swrKeys.subgroups(groupId));
  mutate(swrKeys.groups());
}

export function invalidateProject(projectId: string, groupId?: string) {
  mutate(swrKeys.projectDetail(projectId));
  mutate(swrKeys.myProjects());
  if (groupId) {
    mutate(swrKeys.projects(groupId));
  }
}

export function invalidateSharedGroups(projectId: string) {
  mutate(swrKeys.sharedGroups(projectId));
}

export function invalidatePublicProjects() {
  mutate(swrKeys.publicProjects());
}

export function invalidateFinance(groupId: string, projectId?: string | null) {
  mutate(swrKeys.finance(groupId, projectId));
  // 그룹 전체 회비도 무효화
  if (projectId) {
    mutate(swrKeys.finance(groupId));
  }
}

export function invalidateUnpaidMembers(groupId: string, projectId?: string | null) {
  mutate(swrKeys.unpaidMembers(groupId, projectId));
  if (projectId) {
    mutate(swrKeys.unpaidMembers(groupId));
  }
}

export function invalidateFinanceBudget(entityType: string, entityId: string, yearMonth: string) {
  mutate(swrKeys.financeBudget(entityType, entityId, yearMonth));
}

export function invalidateFinanceSplits(groupId: string, projectId?: string | null) {
  mutate(swrKeys.financeSplits(groupId, projectId));
  if (projectId) {
    mutate(swrKeys.financeSplits(groupId));
  }
}

export function invalidateFinanceSplitMembers(splitId: string) {
  mutate(swrKeys.financeSplitMembers(splitId));
}

export function invalidateBoard(groupId: string) {
  // board 키는 category를 포함하므로 prefix 매칭으로 무효화
  mutate(
    (key: string) => typeof key === "string" && key.startsWith(`/groups/${groupId}/board`),
    undefined,
    { revalidate: true }
  );
}

export function invalidateBoardTrash(groupId: string) {
  mutate(swrKeys.boardTrash(groupId));
}

export function invalidateBoardPost(postId: string) {
  mutate(swrKeys.boardPost(postId));
}

export function invalidateBoardPostAttachments(postId: string) {
  mutate(swrKeys.boardPostAttachments(postId));
}

export function invalidateBoardPostLikes(postId: string) {
  mutate(swrKeys.boardPostLikes(postId));
}

export function invalidatePostBookmarks(postId?: string, groupId?: string | null) {
  mutate(swrKeys.postBookmarks(groupId));
  mutate(swrKeys.postBookmarks());
  if (postId) {
    mutate(swrKeys.postBookmark(postId));
  }
}

export function invalidateBoardCategories(groupId: string) {
  mutate(swrKeys.boardCategories(groupId));
}

export function invalidateSchedules(groupId: string, projectId?: string | null) {
  mutate(swrKeys.schedules(groupId, projectId));
  // 그룹 전체 일정도 무효화
  if (projectId) {
    mutate(swrKeys.schedules(groupId));
  }
}

export function invalidateAttendance(scheduleId: string) {
  mutate(swrKeys.attendance(scheduleId));
}

export function invalidateScheduleRsvp(scheduleId: string) {
  mutate(swrKeys.scheduleRsvp(scheduleId));
}

export function invalidateScheduleWaitlist(scheduleId: string) {
  mutate(swrKeys.scheduleWaitlist(scheduleId));
}

export function invalidateConversations() {
  mutate(swrKeys.conversations());
  mutate(swrKeys.unreadCount());
}

export function invalidateConversation(partnerId: string) {
  mutate(swrKeys.conversation(partnerId));
  invalidateConversations();
}

export function invalidateProfile(userId: string) {
  mutate(swrKeys.userProfile(userId));
}

export function invalidateFollow(targetUserId: string) {
  mutate(swrKeys.followStatus(targetUserId));
}

export function invalidateFollowList(userId: string) {
  mutate(swrKeys.followList(userId, "followers"));
  mutate(swrKeys.followList(userId, "following"));
}

export function invalidateDashboardSettings(entityId: string, memberTable: string) {
  mutate(swrKeys.dashboardSettings(entityId, memberTable));
}

export function invalidateNotifications() {
  mutate(swrKeys.notifications());
  mutate(swrKeys.unreadNotificationCount());
}

export function invalidatePendingJoinRequestCount(groupId: string) {
  mutate(swrKeys.pendingJoinRequestCount(groupId));
}

export function invalidateJoinRequests(groupId: string) {
  mutate(
    (key: string) => typeof key === "string" && key.startsWith(`/groups/${groupId}/join-requests`),
    undefined,
    { revalidate: true }
  );
}

export function invalidateActivityLogs(entityType: string, entityId: string) {
  mutate(swrKeys.activityLogs(entityType, entityId));
}

export function invalidateEntitySettings(entityType: string, entityId: string, key: string) {
  mutate(swrKeys.entitySettings(entityType, entityId, key));
}

export function invalidateScheduleTemplates(entityType: string, entityId: string) {
  mutate(swrKeys.scheduleTemplates(entityType, entityId));
}

export function invalidateAttendancePrediction(groupId: string, scheduleId: string) {
  mutate(swrKeys.attendancePrediction(groupId, scheduleId));
}

export function invalidateGroupShowRate(groupId: string) {
  mutate(swrKeys.groupShowRate(groupId));
}

export function invalidateUpcomingSchedules(groupId: string, projectId?: string | null) {
  mutate(swrKeys.upcomingSchedules(groupId, projectId));
  if (projectId) {
    mutate(swrKeys.upcomingSchedules(groupId));
  }
}

export function invalidateContentReports(groupId: string) {
  mutate(swrKeys.contentReports(groupId));
  mutate(swrKeys.contentReportsPendingCount(groupId));
}

export function invalidateBulkRsvp(groupId: string, scheduleIds: string[]) {
  scheduleIds.forEach((id) => mutate(swrKeys.scheduleRsvp(id)));
  invalidateGroupShowRate(groupId);
}

export function invalidateMemberSkills(groupId: string) {
  mutate(swrKeys.memberSkills(groupId));
}

export function invalidateMeetingMinutes(groupId: string, projectId?: string | null) {
  mutate(swrKeys.meetingMinutes(groupId, projectId));
  if (projectId) {
    mutate(swrKeys.meetingMinutes(groupId));
  }
}

export function invalidateContactVerification(groupId: string) {
  mutate(swrKeys.contactVerification(groupId));
}

export function invalidatePermissionAudits(groupId: string) {
  mutate(swrKeys.permissionAudits(groupId));
}

export function invalidateRolePromotionCandidates(groupId: string) {
  mutate(swrKeys.rolePromotionCandidates(groupId));
}

export function invalidateAttendanceGoal(groupId: string) {
  mutate(swrKeys.attendanceGoal(groupId));
}

export function invalidateAttendanceComparison(groupId: string) {
  mutate(
    (key: string) =>
      typeof key === "string" && key.startsWith(`/attendance-comparison/${groupId}`),
    undefined,
    { revalidate: true }
  );
}

export function invalidateAttendanceComparisonDetail(groupId: string) {
  mutate(
    (key: string) =>
      typeof key === "string" &&
      key.startsWith(`/attendance-comparison-detail/${groupId}`),
    undefined,
    { revalidate: true }
  );
}

export function invalidatePollStatistics(postId: string) {
  mutate(swrKeys.pollStatistics(postId));
}

export function invalidateMemberNote(groupId: string, targetUserId: string) {
  mutate(swrKeys.memberNote(groupId, targetUserId));
}

export function invalidateRecentActivityFeed() {
  mutate(
    (key: string) => typeof key === "string" && key.startsWith("/recent-activity-feed"),
    undefined,
    { revalidate: true }
  );
}

export function invalidateLocationHistory(groupId: string) {
  mutate(swrKeys.locationSuggestions(groupId));
}

export function invalidatePostRevisions(postId: string) {
  mutate(swrKeys.postRevisions(postId));
}

export function invalidateProjectTasks(projectId: string) {
  mutate(swrKeys.projectTasks(projectId));
}

export function invalidateScheduleCheckinCode(scheduleId: string) {
  mutate(swrKeys.scheduleCheckinCode(scheduleId));
}

export function invalidateScheduleRoles(scheduleId: string) {
  mutate(swrKeys.scheduleRoles(scheduleId));
}

export function invalidateMemberRisk(groupId: string) {
  mutate(swrKeys.memberRisk(groupId));
}

export function invalidateAttendanceExcuses(scheduleId: string) {
  mutate(swrKeys.attendanceExcuses(scheduleId));
  mutate(swrKeys.attendance(scheduleId));
}

export function invalidateAttendanceAchievements(groupId: string, userId: string) {
  mutate(swrKeys.attendanceAchievements(groupId, userId));
}

export function invalidateScheduleFeedback(scheduleId: string) {
  mutate(swrKeys.scheduleFeedback(scheduleId));
}

export function invalidateProjectSongs(projectId: string) {
  mutate(swrKeys.projectSongs(projectId));
}

export function invalidateBirthdayCalendar(groupId: string) {
  mutate(swrKeys.birthdayCalendar(groupId));
}

export function invalidateReceiptShareTokens(transactionId: string) {
  mutate(swrKeys.receiptShareTokens(transactionId));
}

export function invalidateProjectProgress(projectId: string) {
  mutate(swrKeys.projectProgress(projectId));
}

export function invalidateSongNotes(songId: string) {
  mutate(swrKeys.songNotes(songId));
}

export function invalidateSongParts(songId: string) {
  mutate(swrKeys.songParts(songId));
}

export function invalidateScheduleChecklist(scheduleId: string) {
  mutate(swrKeys.scheduleChecklist(scheduleId));
}

export function invalidatePostReadStatus(postId: string) {
  mutate(swrKeys.postReadStatus(postId));
}

export function invalidateYearlySchedules(groupId: string, year: number) {
  mutate(swrKeys.yearlySchedules(groupId, year));
}

export function invalidatePracticeVideos(groupId: string) {
  mutate(swrKeys.practiceVideos(groupId));
}

export function invalidateMonthlyReport(groupId: string, year: number, month: number) {
  mutate(swrKeys.monthlyReport(groupId, year, month));
}

export function invalidateGroupActivity(groupId: string) {
  mutate(swrKeys.groupActivity(groupId));
}

export function invalidateFilteredActivityTimeline(groupId: string) {
  mutate(
    (key: string) =>
      typeof key === "string" &&
      key.startsWith(`/groups/${groupId}/filtered-activity-timeline`),
    undefined,
    { revalidate: true }
  );
}

export function invalidatePerformanceRecords(groupId: string) {
  mutate(swrKeys.performanceRecords(groupId));
}

export function invalidateGroupPortfolio(groupId: string) {
  mutate(swrKeys.groupPortfolio(groupId));
}

export function invalidateAttendanceStreak(groupId: string, userId: string) {
  mutate(swrKeys.attendanceStreak(groupId, userId));
}

export function invalidateGroupChallenges(groupId: string) {
  mutate(swrKeys.groupChallenges(groupId));
}

export function invalidateScheduleCarpool(scheduleId: string) {
  mutate(swrKeys.scheduleCarpool(scheduleId));
}

export function invalidateGroupRules(groupId: string) {
  mutate(swrKeys.groupRules(groupId));
}

export function invalidatePracticeStats(groupId: string) {
  mutate(swrKeys.practiceStats(groupId));
}

export function invalidateMemberDashboardActivity(userId: string) {
  mutate(swrKeys.memberDashboardActivity(userId));
}

export function invalidateGroupHealthSuggestions(groupId: string) {
  mutate(swrKeys.groupHealthSuggestions(groupId));
}

export function invalidateGoalProgressTracker(groupId: string, userId: string) {
  mutate(swrKeys.goalProgressTracker(groupId, userId));
}

export function invalidateWinbackCandidates(groupId: string) {
  mutate(swrKeys.winbackCandidates(groupId));
}

export function invalidateGroupPerformanceSnapshot(groupId: string) {
  mutate(swrKeys.groupPerformanceSnapshot(groupId, "week"));
  mutate(swrKeys.groupPerformanceSnapshot(groupId, "month"));
}

export function invalidateMemberBatchInvite(groupId: string) {
  mutate(swrKeys.memberBatchInvite(groupId));
}

export function invalidateMemberComparison(groupId: string) {
  mutate(
    (key: string) =>
      typeof key === "string" && key.startsWith(`/member-comparison/${groupId}`),
    undefined,
    { revalidate: true }
  );
}

export function invalidateOnboardingProgressTracker(groupId: string) {
  mutate(swrKeys.onboardingProgressTracker(groupId));
}

export function invalidateGroupActivityTrends(groupId: string) {
  mutate(swrKeys.groupActivityTrends(groupId));
}

export function invalidateMemberActivityDistribution(groupId: string) {
  mutate(swrKeys.memberActivityDistribution(groupId));
}

export function invalidateAttendanceStreakLeaderboard(groupId: string) {
  mutate(swrKeys.attendanceStreakLeaderboard(groupId));
}

export function invalidateAvailabilityForecast(groupId: string) {
  mutate(swrKeys.availabilityForecast(groupId));
}

export function invalidateScheduleAttendancePredictor(groupId: string, scheduleId: string) {
  mutate(swrKeys.scheduleAttendancePredictor(groupId, scheduleId));
}

export function invalidateMemberHealthScore(groupId: string) {
  mutate(swrKeys.memberHealthScore(groupId));
}

export function invalidateAttendanceTeamBalance(groupId: string) {
  mutate(swrKeys.attendanceTeamBalance(groupId));
}

export function invalidateGenreRoleRecommendation(groupId: string) {
  mutate(swrKeys.genreRoleRecommendation(groupId));
}

export function invalidateMemberPreview(userId: string, groupId?: string | null) {
  mutate(swrKeys.memberPreview(userId, groupId));
  // groupId 없는 버전도 함께 무효화
  if (groupId) {
    mutate(swrKeys.memberPreview(userId));
  }
}

export function invalidateAttendanceConsistency(groupId: string, userId: string) {
  mutate(swrKeys.attendanceConsistency(groupId, userId));
}

export function invalidateGroupHealthTrends(groupId: string) {
  mutate(swrKeys.groupHealthTrends(groupId));
}

export function invalidateWeeklyChallengeBoard(groupId: string) {
  mutate(swrKeys.weeklyChallengeBoard(groupId));
}

export function invalidateActivityTimeHeatmap(groupId: string) {
  mutate(swrKeys.activityTimeHeatmap(groupId));
}

export function invalidateGroupActivityReport(groupId: string) {
  mutate(swrKeys.groupActivityReport(groupId, "week"));
  mutate(swrKeys.groupActivityReport(groupId, "month"));
}

export function invalidateMemberBenchmarking(groupId: string, userId: string) {
  mutate(swrKeys.memberBenchmarking(groupId, userId));
}

export function invalidateSkillSelfEvaluation(groupId: string, userId: string) {
  mutate(swrKeys.skillSelfEvaluation(groupId, userId));
}

export function invalidateAttendanceCertificate(groupId: string, userId: string) {
  mutate(swrKeys.attendanceCertificate(groupId, userId));
}

export function invalidateGroupPolls(groupId: string) {
  mutate(swrKeys.groupPolls(groupId));
}

export function invalidateWeeklyAttendanceCheckin(groupId: string, userId: string) {
  mutate(swrKeys.weeklyAttendanceCheckin(groupId, userId));
}

export function invalidateActivityArchive(groupId: string) {
  mutate(swrKeys.activityArchive(groupId));
}

export function invalidatePreExcuse(groupId: string, scheduleId?: string) {
  mutate(swrKeys.preExcuse(groupId));
  if (scheduleId) {
    mutate(swrKeys.preExcuseBySchedule(groupId, scheduleId));
  }
}

export function invalidateMemberScoreLeaderboard(groupId: string) {
  mutate(swrKeys.memberScoreLeaderboard(groupId));
}

export function invalidateChurnRiskDetection(groupId: string) {
  mutate(swrKeys.churnRiskDetection(groupId));
}

export function invalidateBoardTrendAnalytics(groupId: string) {
  mutate(swrKeys.boardTrendAnalytics(groupId));
}

export function invalidateScheduleCountdown(groupId: string) {
  mutate(swrKeys.scheduleCountdown(groupId));
}

export function invalidateAttendancePredictionCalendar(
  groupId: string,
  userId: string
) {
  mutate(
    (key: string) =>
      typeof key === "string" &&
      key.startsWith(
        `/groups/${groupId}/attendance-prediction-calendar/${userId}/`
      ),
    undefined,
    { revalidate: true }
  );
}

export function invalidateGroupMilestonesAchievements(groupId: string) {
  mutate(swrKeys.groupMilestonesAchievements(groupId));
}

export function invalidateCustomReport(groupId: string, reportId: string) {
  mutate(swrKeys.customReport(groupId, reportId));
}

export function invalidateScheduleConflictDetector(groupId: string) {
  mutate(swrKeys.scheduleConflictDetector(groupId));
}

export function invalidateBudgetSpendingTracker(groupId: string) {
  mutate(swrKeys.budgetSpendingTracker(groupId));
}

export function invalidateMemberAttendanceStats(groupId: string, userId: string) {
  mutate(swrKeys.memberAttendanceStats(groupId, userId));
}

export function invalidateAttendanceTimeAnalysis(groupId: string) {
  mutate(swrKeys.attendanceTimeAnalysis(groupId, "last30days"));
  mutate(swrKeys.attendanceTimeAnalysis(groupId, "all"));
}

export function invalidateFinanceForecast(groupId: string) {
  mutate(swrKeys.financeForecast(groupId));
}

export function invalidateScheduleAttendanceSummary(scheduleId: string) {
  mutate(swrKeys.scheduleAttendanceSummary(scheduleId));
}

export function invalidateMemberInteractionScore(groupId: string) {
  mutate(swrKeys.memberInteractionScore(groupId));
}

export function invalidateGroupPerformanceReport(groupId: string) {
  mutate(swrKeys.groupPerformanceReport(groupId));
}

export function invalidatePersonalAttendanceGoal(groupId: string, userId: string) {
  mutate(swrKeys.personalAttendanceGoal(groupId, userId));
}

export function invalidateScheduleEngagement(scheduleId: string) {
  mutate(swrKeys.scheduleEngagement(scheduleId));
}

export function invalidateCommunicationPreferences(groupId: string, userId: string) {
  mutate(swrKeys.communicationPreferences(groupId, userId));
}

export function invalidateLeadershipCandidates(groupId: string) {
  mutate(swrKeys.leadershipCandidates(groupId));
}

export function invalidateActivityRetrospective(groupId: string) {
  mutate(swrKeys.activityRetrospective(groupId));
}

export function invalidateMemberAvailability(groupId: string, userId: string) {
  mutate(swrKeys.memberAvailability(groupId, userId));
}

export function invalidateProjectMilestones(groupId: string, projectId: string) {
  mutate(swrKeys.projectMilestones(groupId, projectId));
}

export function invalidateMemberEngagementForecast(groupId: string) {
  mutate(swrKeys.memberEngagementForecast(groupId));
}

export function invalidateFinanceOverviewMetrics(groupId: string) {
  mutate(swrKeys.financeOverviewMetrics(groupId));
}

export function invalidateMemberPairingSuggestion(groupId: string) {
  mutate(swrKeys.memberPairingSuggestion(groupId));
}

export function invalidatePersonalGrowthTimeline(groupId: string, userId: string) {
  mutate(swrKeys.personalGrowthTimeline(groupId, userId));
}

export function invalidateSessionAutoFeedback(groupId: string) {
  mutate(swrKeys.sessionAutoFeedback(groupId));
}

export function invalidateGroupActivityHeatmap(groupId: string) {
  mutate(swrKeys.groupActivityHeatmap(groupId));
}

export function invalidateAnomalyDetection(groupId: string) {
  mutate(swrKeys.anomalyDetection(groupId));
}

export function invalidateDanceCertification(groupId: string) {
  mutate(swrKeys.danceCertification(groupId));
}

export function invalidateCostumeManagement(groupId: string, projectId: string) {
  mutate(swrKeys.costumeManagement(groupId, projectId));
}

export function invalidateThankYouLetters(groupId: string) {
  mutate(swrKeys.thankYouLetters(groupId));
}

export function invalidatePerformanceRevenue(groupId: string) {
  mutate(swrKeys.performanceRevenue(groupId));
}

export function invalidateGroupEnergyTracker(groupId: string) {
  mutate(swrKeys.groupEnergyTracker(groupId));
}
