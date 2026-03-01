import type { Profile, DayOfWeekKey } from "./common";

// ============================================
// Schedule
// ============================================

export type AttendanceMethod = "admin" | "location" | "none";

export type Schedule = {
  id: string;
  group_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  attendance_method: AttendanceMethod;
  starts_at: string;
  ends_at: string;
  created_by: string;
  late_threshold: string | null;
  attendance_deadline: string | null;
  require_checkout: boolean;
  recurrence_id: string | null;
  max_attendees: number | null;
};

// ============================================
// Attendance
// ============================================

export type AttendanceStatus = "present" | "absent" | "late" | "early_leave";

export type ExcuseStatus = "pending" | "approved" | "rejected";

export type Attendance = {
  id: string;
  schedule_id: string;
  user_id: string;
  status: AttendanceStatus;
  checked_at: string;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  checked_out_at: string | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  excuse_reason: string | null;
  excuse_status: ExcuseStatus | null;
};

export type AttendanceWithProfile = Attendance & {
  profiles: Profile;
};

// ============================================
// Schedule Waitlist (일정 대기자 명단)
// ============================================

export type ScheduleWaitlist = {
  id: string;
  schedule_id: string;
  user_id: string;
  position: number;
  joined_at: string;
};

export type ScheduleWaitlistWithProfile = ScheduleWaitlist & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
};

// ============================================
// Schedule RSVP (참석 예정)
// ============================================

export type ScheduleRsvpResponse = "going" | "not_going" | "maybe";

export type ScheduleRsvp = {
  id: string;
  schedule_id: string;
  user_id: string;
  response: ScheduleRsvpResponse;
  created_at: string;
  updated_at: string;
};

export type ScheduleRsvpWithProfile = ScheduleRsvp & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
};

export type ScheduleRsvpSummary = {
  going: number;
  not_going: number;
  maybe: number;
  my_response: ScheduleRsvpResponse | null;
};

// ============================================
// Schedule Template (일정 템플릿)
// ============================================

export type ScheduleTemplate = {
  id: string;
  entity_type: "group" | "project";
  entity_id: string;
  name: string;
  title: string;
  description: string | null;
  location: string | null;
  duration_minutes: number | null;
  created_by: string | null;
  created_at: string;
};

// ============================================
// Schedule Role (일정 역할 배정)
// ============================================

export type ScheduleRole = {
  id: string;
  schedule_id: string;
  user_id: string;
  role_name: string;
  created_by: string;
  created_at: string;
};

export type ScheduleRoleWithProfile = ScheduleRole & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
};

// ============================================
// Schedule Checkin Code (일정 QR 체크인 코드)
// ============================================

export type ScheduleCheckinCode = {
  id: string;
  schedule_id: string;
  code: string;
  expires_at: string;
  created_by: string;
  created_at: string;
};

// ============================================
// Schedule Feedback (일정 만족도 평가)
// ============================================

export type ScheduleFeedback = {
  id: string;
  schedule_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

// ============================================
// Attendance Achievement (출석 달성 배지)
// ============================================

export type AttendanceAchievementId =
  | "first_attendance"
  | "attendance_10"
  | "attendance_50"
  | "attendance_100"
  | "perfect_streak"
  | "attendance_king";

export type AttendanceAchievement = {
  id: AttendanceAchievementId;
  emoji: string;
  label: string;
  description: string;
  achieved: boolean;
  progress: string;
  current: number;
  required: number;
};

// ============================================
// Schedule Weather (일정 날씨 예보)
// ============================================

export type ScheduleWeather = {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  weatherCode: number;
  emoji: string;
  description: string;
};

// ============================================
// Attendance Goal (출석 목표)
// ============================================

export type AttendanceGoal = {
  id: string;
  group_id: string;
  target_rate: number;
  period: "monthly" | "quarterly";
  created_by: string;
  created_at: string;
};

// ============================================
// Schedule Checklist (일정 준비물 체크리스트 - DB)
// ============================================

export type ScheduleChecklistItem = {
  id: string;
  schedule_id: string;
  title: string;
  assignee_id: string | null;
  is_done: boolean;
  sort_order: number;
  created_by: string;
  created_at: string;
};

// ============================================
// Schedule Setlist (연습 세트리스트 플래너, localStorage 기반)
// ============================================

export type SetlistItem = {
  songId: string;
  songTitle: string;
  artist: string | null;
  orderIndex: number;
  plannedMinutes: number;
};

// ============================================
// Attendance Achievement Badge (출석 리더보드)
// ============================================

export type StreakBadgeTier = "FIRE" | "STAR" | "DIAMOND" | "CROWN";

export type AttendanceStreakEntry = {
  userId: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  badge: StreakBadgeTier | null;
  rank: number;
};

export type AttendanceStreakLeaderboardResult = {
  entries: AttendanceStreakEntry[];
  averageStreak: number;
  topEntry: AttendanceStreakEntry | null;
};

// ============================================
// Attendance Consistency (히트맵)
// ============================================

export type AttendanceIntensity = 0 | 1 | 2 | 3;

export type AttendanceHeatmapCell = {
  date: string;
  hasSchedule: boolean;
  isPresent: boolean;
  intensity: AttendanceIntensity;
};

export type WeeklyAttendanceData = {
  weekIndex: number;
  scheduleCount: number;
  presentCount: number;
  attendanceRate: number;
};

export type AttendanceConsistencyResult = {
  weeks: AttendanceHeatmapCell[][];
  weeklyData: WeeklyAttendanceData[];
  currentStreak: number;
  overallRate: number;
  consistencyScore: number;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Schedule Attendance Predictor (일정 출석 예측)
// ============================================

export type TimeSlot = "morning" | "afternoon" | "evening" | "night";

export type TimeSlotInfo = {
  key: TimeSlot;
  label: string;
  range: string;
  startHour: number;
  endHour: number;
};

export const TIME_SLOTS: TimeSlotInfo[] = [
  { key: "morning",   label: "오전", range: "06-12", startHour: 6,  endHour: 12 },
  { key: "afternoon", label: "오후", range: "12-18", startHour: 12, endHour: 18 },
  { key: "evening",   label: "저녁", range: "18-22", startHour: 18, endHour: 22 },
  { key: "night",     label: "야간", range: "22-06", startHour: 22, endHour: 6  },
];

export const DAY_OF_WEEK_LABELS: string[] = ["일", "월", "화", "수", "목", "금", "토"];

export type MemberForecast = {
  userId: string;
  name: string;
  probability: number;
  sampleCount: number;
};

export type AvailabilityForecastResult = {
  getForecast: (dayOfWeek: number, timeSlot: TimeSlot) => MemberForecast[];
  hasData: boolean;
  loading: boolean;
  refetch: () => void;
};

export type ScheduleAttendancePrediction = {
  userId: string;
  name: string;
  probability: number;
  overallRate: number;
  sameDayRate: number;
  sameSlotRate: number;
  sampleCount: number;
  label: "참석 예상" | "불확실" | "불참 가능";
};

export type ScheduleAttendancePredictorResult = {
  predictions: ScheduleAttendancePrediction[];
  expectedCount: number;
  totalCount: number;
  analysisSummary: string;
  dayOfWeek: number;
  timeSlot: TimeSlot;
  startsAt: string;
  hasData: boolean;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Attendance Team Balancer (출석 팀 밸런서)
// ============================================

export type TeamBalancerColor = {
  key: string;
  label: string;
  bg: string;
  text: string;
  border: string;
  badge: string;
};

export const TEAM_BALANCER_COLORS: TeamBalancerColor[] = [
  { key: "blue",   label: "파랑", bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700" },
  { key: "green",  label: "초록", bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  badge: "bg-green-100 text-green-700" },
  { key: "orange", label: "주황", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
  { key: "purple", label: "보라", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-100 text-purple-700" },
];

export type TeamBalancerMember = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  attendanceRate: number;
};

export type BalancedTeam = {
  index: number;
  name: string;
  colorKey: string;
  members: TeamBalancerMember[];
  avgAttendanceRate: number;
};

export type AttendanceTeamBalanceResult = {
  teams: BalancedTeam[];
  rateDeviation: number;
  hasData: boolean;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Attendance Member Stats
// ============================================

export type MemberAttendanceStatsResult = {
  overallRate: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalSchedules: number;
  weeklyRates: { week: string; rate: number }[];
  currentStreak: number;
  longestStreak: number;
  bestDayOfWeek: number | null;
  groupAverageRate: number;
};

// ============================================
// Attendance Time Analysis (출석 시간대 분석)
// ============================================

export type AttendanceTimeSlot = "morning" | "afternoon" | "evening";

export type AttendanceTimeSlotStat = {
  slot: AttendanceTimeSlot;
  label: string;
  range: string;
  scheduleCount: number;
  presentCount: number;
  totalCount: number;
  rate: number;
};

export type AttendanceDayOfWeekStat = {
  dayIndex: number;
  dayLabel: string;
  scheduleCount: number;
  presentCount: number;
  totalCount: number;
  rate: number;
};

export type AttendanceTimeSlotDayStat = {
  slot: AttendanceTimeSlot;
  dayIndex: number;
  rate: number;
  scheduleCount: number;
};

export type AttendanceTimeAnalysisResult = {
  timeSlots: AttendanceTimeSlotStat[];
  daysOfWeek: AttendanceDayOfWeekStat[];
  slotDayCombinations: AttendanceTimeSlotDayStat[];
  bestSlot: AttendanceTimeSlot | null;
  bestDay: number | null;
  bestCombination: { slot: AttendanceTimeSlot; dayIndex: number } | null;
  totalSchedules: number;
  analyzedPeriod: "last30days" | "all";
};

// ============================================
// Schedule Engagement (일정 참여도 통계)
// ============================================

export type ScheduleEngagementRsvpCounts = {
  going: number;
  maybe: number;
  not_going: number;
  no_response: number;
  total: number;
};

export type ScheduleEngagementResult = {
  rsvp: ScheduleEngagementRsvpCounts;
  actual_attended: number;
  rsvp_accuracy: number | null;
  attendance_rate: number | null;
};

// ============================================
// Schedule Attendance Summary (일정별 참석 요약)
// ============================================

export type AttendanceRecordStatus = "present" | "absent" | "late";

export type ScheduleAttendanceMember = {
  userId: string;
  name: string;
  status: AttendanceRecordStatus | "no_response";
};

export type ScheduleAttendanceSummaryResult = {
  scheduleId: string;
  scheduleTitle: string;
  startsAt: string;
  totalMembers: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  noResponseCount: number;
  attendanceRate: number;
  members: ScheduleAttendanceMember[];
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Schedule Conflict (일정 충돌 감지)
// ============================================

export type ConflictType = "time_overlap" | "same_day" | "same_location";

export type ScheduleConflict = {
  id: string;
  scheduleA: { id: string; title: string; startsAt: string; endsAt: string; location: string | null };
  scheduleB: { id: string; title: string; startsAt: string; endsAt: string; location: string | null };
  conflictTypes: ConflictType[];
};

// ============================================
// Schedule Carpool (일정 카풀 조율)
// ============================================

export type CarpoolOffer = {
  id: string;
  schedule_id: string;
  driver_id: string;
  total_seats: number;
  departure_location: string | null;
  departure_time: string | null;
  notes: string | null;
  created_at: string;
};

export type CarpoolRequestStatus = "pending" | "accepted" | "rejected";

export type CarpoolRequest = {
  id: string;
  offer_id: string;
  passenger_id: string;
  status: CarpoolRequestStatus;
  created_at: string;
};

// ============================================
// Schedule Retro (일정 회고록, localStorage 기반)
// ============================================

export type ScheduleRetro = {
  good: string;
  improve: string;
  nextGoal: string;
  createdAt: string;
  createdBy: string;
};

// ============================================
// Schedule Countdown (일정 카운트다운)
// ============================================

export type CountdownSchedule = {
  id: string;
  title: string;
  startsAt: string;
  location: string | null;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  isUrgent: boolean;
};

// ============================================
// Attendance Certificate (출석 인증서)
// ============================================

export type AttendanceCertificateData = {
  memberName: string;
  groupName: string;
  periodStart: string;
  periodEnd: string;
  totalSchedules: number;
  attendedCount: number;
  attendanceRate: number;
  longestStreak: number;
  issuedAt: string;
};

// ============================================
// Attendance Prediction Calendar (멤버 출석 예측 달력)
// ============================================

export type PredictionCalendarDay = {
  date: string;
  scheduleId: string | null;
  scheduleTitle: string | null;
  predictedRate: number | null;
  actualStatus: "present" | "absent" | "late" | null;
};

export type AttendancePredictionCalendarResult = {
  days: PredictionCalendarDay[];
  dayOfWeekRates: number[];
  overallRate: number;
  month: string;
};

// ============================================
// Schedule Template Item (일정 템플릿/복제, localStorage 기반)
// ============================================

export type ScheduleTemplateItem = {
  id: string;
  groupId: string;
  title: string;
  location: string;
  dayOfWeek: number | null;
  startTime: string;
  durationMinutes: number;
  attendanceMethod: string;
  memo: string;
  createdAt: string;
};

export type ScheduleTemplateFormData = {
  title: string;
  location: string;
  startTime: string;
  durationMinutes: number;
  attendanceMethod: string;
  memo: string;
};

// ============================================
// Personal Attendance Goal (개인 출석 목표, localStorage 기반)
// ============================================

export type PersonalAttendanceGoal = {
  targetCount: number;
  month: string;
  savedAt: string;
};

export type PersonalAttendanceGoalData = {
  goal: PersonalAttendanceGoal | null;
  actualCount: number;
  totalSchedules: number;
  passedSchedules: number;
  remainingSchedules: number;
  achievementRate: number;
  isAchieved: boolean;
  remainingCount: number;
  remainingDays: number;
  dailyPaceNeeded: number | null;
};

// ============================================
// Schedule Supply Item (일정 준비물 목록, localStorage 기반)
// ============================================

export type ScheduleSupplyItem = {
  id: string;
  scheduleId: string;
  name: string;
  checked: boolean;
  assignee?: string;
  createdAt: string;
};

export type ScheduleSupplyList = {
  groupId: string;
  items: ScheduleSupplyItem[];
  updatedAt: string;
};

// ============================================
// Schedule Checklist (일정 준비 체크리스트, localStorage 기반)
// ============================================

export type ScheduleCheckItem = {
  id: string;
  text: string;
  checked: boolean;
  order: number;
};

export type ScheduleChecklist = {
  scheduleId: string;
  items: ScheduleCheckItem[];
  updatedAt: string;
};

// ============================================
// D-Day Checklist (일정 D-Day 준비 체크리스트, localStorage 기반)
// ============================================

export type DdayChecklistItem = {
  id: string;
  scheduleId: string;
  daysBefore: number;
  title: string;
  isDone: boolean;
  createdAt: string;
};

// ============================================
// Schedule Notes (일정 메모)
// ============================================

export type ScheduleNoteCategory =
  | "준비사항"
  | "변경사항"
  | "메모"
  | "중요";

export type ScheduleNoteItem = {
  id: string;
  scheduleId: string;
  content: string;
  category: ScheduleNoteCategory;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Attendance Forecast (출석 예측)
// ============================================

export type AttendancePattern = {
  dayOfWeek: DayOfWeekKey;
  avgRate: number;
  totalSessions: number;
};

export type AttendanceMemberForecast = {
  memberId: string;
  memberName: string;
  overallRate: number;
  trend: "improving" | "stable" | "declining";
  patterns: AttendancePattern[];
  predictedNextRate: number;
};

export type AttendanceForecastData = {
  groupId: string;
  forecasts: AttendanceMemberForecast[];
  bestDay: DayOfWeekKey;
  worstDay: DayOfWeekKey;
  groupTrend: "improving" | "stable" | "declining";
  updatedAt: string;
};

// ============================================
// Pre-Excuse (사전 결석 신고, localStorage 기반)
// ============================================

export type PreExcuseReason = "personal" | "health" | "conflict" | "other";

export type PreExcuseEntry = {
  id: string;
  scheduleId: string;
  userId: string;
  userName: string;
  reason: PreExcuseReason;
  memo: string;
  createdAt: string;
};

// ============================================
// Weekly Challenge Board (주간 챌린지 보드)
// ============================================

export type WeeklyChallengeType = "attendance" | "board" | "rsvp";

export type WeeklyChallenge = {
  id: WeeklyChallengeType;
  title: string;
  goal: number;
};

export type MemberChallengeProgress = {
  challengeId: WeeklyChallengeType;
  current: number;
  goal: number;
  completed: boolean;
  progressRate: number;
};

export type WeeklyChallengeEntry = {
  userId: string;
  name: string;
  challenges: MemberChallengeProgress[];
  completedCount: number;
  score: number;
  rank: number;
};

export type WeeklyChallengeBoardResult = {
  entries: WeeklyChallengeEntry[];
  challenges: WeeklyChallenge[];
  weekStart: string;
  weekEnd: string;
  daysLeft: number;
  myEntry: WeeklyChallengeEntry | null;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Goal Progress Tracker (출석 목표 진행 추적)
// ============================================

export type GoalProgressSetting = {
  targetRate: number;
  month: string;
};

export type GoalProgressStatus = "achievable" | "warning" | "impossible" | "achieved";

export type GoalProgressTrackerData = {
  setting: GoalProgressSetting | null;
  totalSchedules: number;
  attendedSchedules: number;
  remainingSchedules: number;
  currentRate: number;
  progressRate: number;
  neededAttendances: number;
  status: GoalProgressStatus;
  isAchieved: boolean;
};

// ============================================
// Attendance Comparison Detail (멤버 출석 비교 카드)
// ============================================

export type AttendanceComparisonDetail = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalSchedules: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
};

export type AttendanceComparisonDetailResult = {
  members: AttendanceComparisonDetail[];
  hasData: boolean;
};

// ============================================
// Meeting Minutes (회의록)
// ============================================

export type MeetingMinute = {
  id: string;
  group_id: string;
  project_id: string | null;
  title: string;
  content: string | null;
  attendees: string[];
  decisions: string[];
  action_items: { title: string; owner: string | null; done: boolean }[];
  meeting_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};
