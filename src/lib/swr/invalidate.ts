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
