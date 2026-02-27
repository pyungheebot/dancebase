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

export function invalidateFinanceBudget(entityType: string, entityId: string, yearMonth: string) {
  mutate(swrKeys.financeBudget(entityType, entityId, yearMonth));
}

export function invalidateBoard(groupId: string) {
  // board 키는 category를 포함하므로 prefix 매칭으로 무효화
  mutate(
    (key: string) => typeof key === "string" && key.startsWith(`/groups/${groupId}/board`),
    undefined,
    { revalidate: true }
  );
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
