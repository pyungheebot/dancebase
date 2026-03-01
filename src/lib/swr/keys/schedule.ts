// 일정, RSVP, 출석, 체크인 관련 키
export const scheduleKeys = {
  // 일정
  schedules: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/schedules${projectId ? `?project=${projectId}` : ""}` as const,
  scheduleTemplates: (entityType: string, entityId: string) =>
    `/schedule-templates/${entityType}/${entityId}` as const,
  upcomingSchedules: (groupId: string, projectId?: string | null) =>
    `/upcoming-schedules/${groupId}${projectId ? `?project=${projectId}` : ""}` as const,
  yearlySchedules: (groupId: string, year: number) =>
    `/groups/${groupId}/yearly-schedules?year=${year}` as const,
  scheduleCountdown: (groupId: string) =>
    `/groups/${groupId}/schedule-countdown` as const,
  scheduleConflictDetector: (groupId: string) =>
    `/groups/${groupId}/schedule-conflict-detector` as const,
  optimalScheduleTime: (groupId: string, projectId?: string | null) =>
    `/optimal-schedule-time/${groupId}${projectId ? `?project=${projectId}` : ""}` as const,

  // RSVP
  scheduleRsvp: (scheduleId: string) => `/schedules/${scheduleId}/rsvp` as const,
  scheduleWaitlist: (scheduleId: string) => `schedule-waitlist-${scheduleId}` as const,
  scheduleBroadcast: (scheduleId: string, groupId: string) =>
    `/schedules/${scheduleId}/broadcast?group=${groupId}` as const,
  smartReminder: (scheduleId: string, groupId: string) =>
    `/schedules/${scheduleId}/smart-reminder?group=${groupId}` as const,

  // 출석
  attendance: (scheduleId: string) => `/schedules/${scheduleId}/attendance` as const,
  attendanceReport: (groupId: string, projectId: string | null | undefined, period: string) =>
    `/attendance-report/${groupId}${projectId ? `?project=${projectId}` : ""}&period=${period}` as const,
  attendancePrediction: (groupId: string, scheduleId: string) =>
    `/attendance-prediction/${groupId}/${scheduleId}` as const,
  attendancePredictionCalendar: (groupId: string, userId: string, month: string) =>
    `/groups/${groupId}/attendance-prediction-calendar/${userId}/${month}` as const,
  attendanceComparison: (groupId: string, userIds: string[], projectId?: string | null) =>
    `/attendance-comparison/${groupId}?users=${userIds.sort().join(",")}&project=${projectId ?? ""}` as const,
  attendanceComparisonDetail: (groupId: string, userIds: string[], projectId?: string | null) =>
    `/attendance-comparison-detail/${groupId}?users=${userIds.slice().sort().join(",")}&project=${projectId ?? ""}` as const,
  attendanceGoal: (groupId: string) => `/groups/${groupId}/attendance-goal` as const,
  attendanceStreak: (groupId: string, userId: string) =>
    `attendance-streak-${groupId}-${userId}` as const,
  attendanceStreakLeaderboard: (groupId: string) =>
    `attendance-streak-leaderboard-${groupId}` as const,
  attendanceTeamBalance: (groupId: string) =>
    `attendance-team-balance-${groupId}` as const,
  attendanceTimeAnalysis: (groupId: string, period: "last30days" | "all") =>
    `/groups/${groupId}/attendance-time-analysis?period=${period}` as const,
  weeklyAttendanceStats: (groupId: string, projectId?: string | null) =>
    `/weekly-attendance-stats/${groupId}${projectId ? `?project=${projectId}` : ""}` as const,
  weeklyAttendanceCheckin: (groupId: string, userId: string) =>
    `/groups/${groupId}/weekly-checkin/${userId}` as const,
  attendanceCertificate: (groupId: string, userId: string) =>
    `/groups/${groupId}/attendance-certificate/${userId}` as const,
  attendanceConsistency: (groupId: string, userId: string) =>
    `attendance-consistency-${groupId}-${userId}` as const,
  groupShowRate: (groupId: string) => `/group-show-rate/${groupId}` as const,

  // 출석 면제
  attendanceExcuses: (scheduleId: string) =>
    `/schedules/${scheduleId}/attendance-excuses` as const,
  attendanceAchievements: (groupId: string, userId: string) =>
    `/attendance-achievements/${groupId}/${userId}` as const,
  memberAttendanceStats: (groupId: string, userId: string) =>
    `/groups/${groupId}/member-attendance-stats/${userId}` as const,
  memberAttendanceStatsDashboard: (groupId: string) =>
    `member-attendance-stats-dashboard-${groupId}` as const,
  memberActivityReport: (groupId: string, period: string) =>
    `/member-activity-report/${groupId}?period=${period}` as const,
  memberActivityTrend: (groupId: string, userId: string, weeks: number) =>
    `/member-activity-trend/${groupId}/${userId}?weeks=${weeks}` as const,
  scheduleAttendanceSummary: (scheduleId: string) =>
    `/schedules/${scheduleId}/attendance-summary` as const,
  scheduleAttendancePredictor: (groupId: string, scheduleId: string) =>
    `schedule-attendance-predictor-${groupId}-${scheduleId}` as const,
  availabilityForecast: (groupId: string) =>
    `availability-forecast-${groupId}` as const,

  // 체크인
  scheduleCheckinCode: (scheduleId: string) =>
    `/schedules/${scheduleId}/checkin-code` as const,
  scheduleChecklist: (scheduleId: string) =>
    `/schedules/${scheduleId}/checklist` as const,

  // 역할
  scheduleRoles: (scheduleId: string) => `/schedules/${scheduleId}/roles` as const,

  // 날씨
  scheduleWeather: (scheduleId: string) => `schedule-weather-${scheduleId}` as const,

  // 만족도
  scheduleFeedback: (scheduleId: string) =>
    `/schedules/${scheduleId}/feedback` as const,

  // 카풀
  scheduleCarpool: (scheduleId: string) => `schedule-carpool-${scheduleId}` as const,

  // 참여도
  scheduleEngagement: (scheduleId: string) =>
    `/schedules/${scheduleId}/engagement` as const,

  // 통계
  practiceStats: (groupId: string) => `practice-stats-${groupId}` as const,

  // 선호도/예외
  attendanceDashboard: (groupId: string) =>
    `attendance-dashboard-${groupId}` as const,
  attendanceHeatmap: (groupId: string) => `attendance-heatmap-${groupId}` as const,
  attendanceForecast: (groupId: string) => `attendance-forecast-${groupId}` as const,
  attendanceStreakGroup: (groupId: string) =>
    `attendance-streak-group-${groupId}` as const,
  attendanceException: (groupId: string) =>
    `attendance-exception-${groupId}` as const,
  attendanceExcuse: (groupId: string) => `attendance-excuse-${groupId}` as const,
  attendanceBook: (groupId: string) => `attendance-book-${groupId}` as const,
  goalProgressTracker: (groupId: string, userId: string) =>
    `goal-progress-tracker-${groupId}-${userId}` as const,
  personalAttendanceGoal: (groupId: string, userId: string) =>
    `personal-attendance-goal-${groupId}-${userId}` as const,
  preExcuse: (groupId: string) => `pre-excuse-${groupId}` as const,
  preExcuseBySchedule: (groupId: string, scheduleId: string) =>
    `pre-excuse-${groupId}-${scheduleId}` as const,
};
