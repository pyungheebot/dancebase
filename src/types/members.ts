import type { DayOfWeekKey } from "./common";
export type { DayOfWeekKey };

// ============================================
// Member Category (멤버 카테고리)
// ============================================

export type MemberCategory = {
  id: string;
  group_id: string;
  name: string;
  sort_order: number;
  color: string;
  created_at: string;
};

export type CategoryColor = {
  key: string;
  label: string;
  bg: string;
  text: string;
  border: string;
};

export const CATEGORY_COLORS: CategoryColor[] = [
  { key: "gray", label: "회색", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  { key: "blue", label: "파랑", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  { key: "green", label: "초록", bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  { key: "red", label: "빨강", bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  { key: "purple", label: "보라", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  { key: "yellow", label: "노랑", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  { key: "pink", label: "분홍", bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
  { key: "orange", label: "주황", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
];

export function getCategoryColorClasses(colorKey: string): { bg: string; text: string; border: string } {
  const color = CATEGORY_COLORS.find((c) => c.key === colorKey);
  return color
    ? { bg: color.bg, text: color.text, border: color.border }
    : { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" };
}

// ============================================
// Member Skill (멤버 역량 맵)
// ============================================

export type MemberSkill = {
  id: string;
  group_id: string;
  user_id: string;
  skill_name: string;
  skill_level: number;
  updated_at: string;
};

// ============================================
// Contact Verification (연락처 재확인)
// ============================================

export type ContactVerification = {
  id: string;
  group_id: string;
  user_id: string;
  verified_at: string | null;
  requested_at: string;
};

// ============================================
// Member Note (멤버 프로필 메모)
// ============================================

export type MemberNote = {
  id: string;
  group_id: string;
  target_user_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

// ============================================
// Member Personal Goal (멤버 개인 목표)
// ============================================

export type MemberGoalType = "attendance" | "posts" | "payment";

export type MemberGoal = {
  id: string;
  goalType: MemberGoalType;
  targetValue: number;
  yearMonth: string; // "YYYY-MM" 형식
  createdAt: string;
};

export const MEMBER_GOAL_TYPE_LABELS: Record<MemberGoalType, string> = {
  attendance: "출석 횟수",
  posts: "게시글 수",
  payment: "회비 납부",
};

// ============================================
// Member Filter Preset (멤버 필터 프리셋)
// ============================================

export type MemberFilterRole = "leader" | "sub_leader" | "member";
export type MemberActivityStatus = "active" | "inactive" | "all";

export type MemberFilterCondition = {
  role: MemberFilterRole[];
  joinedAfter: string | null;
  joinedBefore: string | null;
  minAttendanceRate: number | null;
  maxAttendanceRate: number | null;
  activityStatus: MemberActivityStatus;
};

export type MemberFilterPreset = {
  id: string;
  name: string;
  filters: MemberFilterCondition;
  isDefault?: boolean;
  createdAt: string;
};

// ============================================
// Member Preview (멤버 프로필 미리보기 팝오버)
// ============================================

export type GroupMemberRole = "leader" | "sub_leader" | "member";

export type MemberPreviewData = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  joinedAt: string | null;
  role: GroupMemberRole | null;
  attendanceRate: number | null;
  postCount: number;
  commentCount: number;
};

// ============================================
// Member Intro Card (멤버 자기소개 카드, localStorage 기반)
// ============================================

export type MemberIntroCard = {
  userId: string;
  userName: string;
  joinReason: string;
  mainPart: string;
  favoriteGenre: string;
  oneWord: string;
  updatedAt: string;
};

// ============================================
// Peer Feedback (멤버 간 익명 피드백)
// ============================================

export type PeerFeedbackType = "strength" | "improvement";

export type PeerFeedback = {
  id: string;
  senderId: string;
  receiverId: string;
  receiverName: string;
  type: PeerFeedbackType;
  content: string;
  createdAt: string;
};

// ============================================
// Birthday Calendar (생일 달력)
// ============================================

export type BirthdayMember = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  birthDate: string;
  monthDay: string;
  birthdayThisYear: Date;
  dDay: number;
  isToday: boolean;
};

// ============================================
// Mentor-Mentee Match (멘토-멘티 매칭, localStorage 기반)
// ============================================

export type MentorMenteeStatus = "active" | "completed";

export type MentorMenteeMatch = {
  id: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  skillTag: string;
  status: MentorMenteeStatus;
  createdAt: string;
};

// ============================================
// Member Batch Invite (멤버 일괄 초대)
// ============================================

export type InviteCandidate = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  isAlreadyMember: boolean;
};

// ============================================
// Winback Campaign (멤버 재참여 캠페인)
// ============================================

export type WinbackCandidate = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  lastActivityAt: string | null;
  inactiveDays: number;
};

export type WinbackCampaignData = {
  candidates: WinbackCandidate[];
  totalCount: number;
};

// ============================================
// Role Badge (멤버 역할 배지, localStorage 기반)
// ============================================

export type RoleBadgeColor =
  | "purple"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "pink";

export type RoleBadge = {
  id: string;
  name: string;
  color: RoleBadgeColor;
  icon: string;
  description: string;
  isDefault: boolean;
};

export type RoleBadgesData = {
  badges: RoleBadge[];
};

export type MemberBadgeAssignments = {
  assignments: Record<string, string[]>;
};

export const DEFAULT_ROLE_BADGES: RoleBadge[] = [
  {
    id: "default-choreographer",
    name: "안무가",
    color: "purple",
    icon: "💃",
    description: "안무를 창작하거나 주도하는 멤버",
    isDefault: true,
  },
  {
    id: "default-dj",
    name: "DJ",
    color: "blue",
    icon: "🎵",
    description: "음악 선곡 및 믹싱을 담당하는 멤버",
    isDefault: true,
  },
  {
    id: "default-treasurer",
    name: "총무",
    color: "green",
    icon: "💰",
    description: "회비 및 재정 관리를 담당하는 멤버",
    isDefault: true,
  },
  {
    id: "default-photographer",
    name: "사진/영상",
    color: "orange",
    icon: "📷",
    description: "활동 사진 및 영상 촬영을 담당하는 멤버",
    isDefault: true,
  },
];

export const ROLE_BADGE_COLOR_CLASSES: Record<
  RoleBadgeColor,
  { bg: string; text: string; border: string; dot: string }
> = {
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    dot: "bg-pink-500",
  },
};

// ============================================
// Onboarding Progress Tracker (멤버 온보딩 완료도 추적)
// ============================================

export type OnboardingItemId =
  | "avatar"
  | "bio"
  | "attendance"
  | "post_or_comment"
  | "rsvp";

export type OnboardingItemStatus = {
  id: OnboardingItemId;
  label: string;
  isDone: boolean;
};

export type MemberOnboardingProgress = {
  userId: string;
  memberId: string;
  name: string;
  joinedAt: string;
  items: OnboardingItemStatus[];
  completionRate: number;
  isAllDone: boolean;
};

export type OnboardingProgressResult = {
  members: MemberOnboardingProgress[];
  averageCompletionRate: number;
  totalCount: number;
  allDoneCount: number;
};

// ============================================
// Member Pairing (스마트 멤버 페어링, localStorage 기반)
// ============================================

export type PairingSimilarityTag = "출석률 유사" | "활동 유사" | "가입 시기 유사";

export type PairingRecommendation = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  similarityTags: PairingSimilarityTag[];
};

export type PairingState = {
  dismissed: string[];
  accepted: string[];
};

// ============================================
// Member Comparison Dashboard (멤버 활동 비교)
// ============================================

export type MemberComparisonData = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  attendanceRate: number;
  postCount: number;
  commentCount: number;
  rsvpRate: number;
};

// ============================================
// Member Activity Distribution (멤버 활동 분포도)
// ============================================

export type MemberActivityGrade =
  | "매우 활발"
  | "활발"
  | "보통"
  | "저조";

export type MemberActivityScore = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalScore: number;
  breakdown: {
    attendance: number;
    posts: number;
    comments: number;
    rsvp: number;
  };
  grade: MemberActivityGrade;
  rank: number;
};

export type MemberActivityGradeSummary = {
  grade: MemberActivityGrade;
  count: number;
  color: string;
};

export type MemberActivityDistribution = {
  gradeSummary: MemberActivityGradeSummary[];
  top5: MemberActivityScore[];
  totalMembers: number;
  avgScore: number;
};

// ============================================
// Member Health Score (멤버 건강도 대시보드)
// ============================================

export type MemberHealthGrade = "excellent" | "good" | "warning" | "danger";

export type MemberHealthRiskType =
  | "attendance_drop"
  | "inactive_14days"
  | "rsvp_no_response";

export type MemberHealthRisk = {
  type: MemberHealthRiskType;
  label: string;
};

export type MemberHealthMetrics = {
  attendance: number;
  rsvp: number;
  board: number;
  longevity: number;
  recentActivity: number;
};

export type MemberHealthScoreItem = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalScore: number;
  grade: MemberHealthGrade;
  metrics: MemberHealthMetrics;
  risks: MemberHealthRisk[];
};

export type MemberHealthScoreResult = {
  members: MemberHealthScoreItem[];
  averageScore: number;
  atRiskCount: number;
  hasData: boolean;
};

// ============================================
// Member Dashboard Activity (멤버별 활동 대시보드)
// ============================================

export type MemberActivityType = "attendance" | "post" | "comment" | "rsvp";

export type MemberActivityItem = {
  id: string;
  type: MemberActivityType;
  description: string;
  occurredAt: string;
};

export type MemberActivitySummary = {
  attendanceCount: number;
  postCount: number;
  commentCount: number;
  rsvpCount: number;
};

export type MemberDashboardActivityData = {
  summary: MemberActivitySummary;
  timeline: MemberActivityItem[];
};

// ============================================
// Member Benchmarking (멤버 벤치마킹)
// ============================================

export type BenchmarkMetric = {
  myValue: number;
  groupAverage: number;
  diffFromAverage: number;
  percentile: number;
};

export type MemberBenchmarkingResult = {
  attendance: BenchmarkMetric;
  activity: BenchmarkMetric;
  rsvp: BenchmarkMetric;
  hasData: boolean;
  totalMemberCount: number;
};

// ============================================
// Member Interaction Score (멤버 상호작용 분석)
// ============================================

export type MemberInteractionBreakdown = {
  postCount: number;
  commentCount: number;
  attendanceCount: number;
  rsvpCount: number;
  postScore: number;
  commentScore: number;
  attendanceScore: number;
  rsvpScore: number;
};

export type MemberInteractionScoreItem = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalScore: number;
  rank: number;
  breakdown: MemberInteractionBreakdown;
};

export type InteractionActivityLevel = "active" | "normal" | "low";

export type MemberInteractionScoreResult = {
  members: MemberInteractionScoreItem[];
  averageScore: number;
  activityLevel: InteractionActivityLevel;
  hasData: boolean;
};

// ============================================
// Churn Risk Detection (멤버 이탈 위험 감지)
// ============================================

export type ChurnRiskLevel = "safe" | "caution" | "risk" | "critical";

export type ChurnRiskFactor =
  | "low_attendance"
  | "inactive_days"
  | "no_board_activity"
  | "low_rsvp";

export type ChurnRiskEntry = {
  userId: string;
  name: string;
  riskScore: number;
  riskLevel: ChurnRiskLevel;
  factors: ChurnRiskFactor[];
  lastActiveAt: string | null;
  recentAttendanceRate: number;
};

export type ChurnRiskDetectionResult = {
  entries: ChurnRiskEntry[];
  byLevel: Record<ChurnRiskLevel, ChurnRiskEntry[]>;
  totalCount: number;
  criticalCount: number;
  riskCount: number;
  cautionCount: number;
  safeCount: number;
};

// ============================================
// Member Score Leaderboard (멤버 종합 점수 리더보드)
// ============================================

export type MemberScoreBreakdown = {
  attendance: number;
  posts: number;
  comments: number;
  rsvp: number;
};

export type MemberScoreEntry = {
  userId: string;
  name: string;
  totalScore: number;
  breakdown: MemberScoreBreakdown;
  rank: number;
};

export type MemberScoreLeaderboardResult = {
  entries: MemberScoreEntry[];
  totalMembers: number;
  myEntry: MemberScoreEntry | null;
};

// ============================================
// Member Engagement Forecast (멤버 관여도 예측)
// ============================================

export type MemberEngagementLevel = "high" | "medium" | "low" | "risk";

export type MemberEngagementForecast = {
  userId: string;
  displayName: string;
  recentAttendanceRate: number;
  previousAttendanceRate: number;
  postCount: number;
  commentCount: number;
  engagementScore: number;
  level: MemberEngagementLevel;
  trend: "improving" | "declining" | "stable";
};

export type MemberEngagementForecastResult = {
  forecasts: MemberEngagementForecast[];
  totalCount: number;
  riskCount: number;
  lowCount: number;
  mediumCount: number;
  highCount: number;
  generatedAt: string;
};

// ============================================
// Member Pairing Suggestion (멤버 짝 추천)
// ============================================

export type MemberPairingSuggestion = {
  member1: { userId: string; displayName: string; attendanceRate: number };
  member2: { userId: string; displayName: string; attendanceRate: number };
  compatibilityScore: number;
  reason: string;
};

// ============================================
// Leadership Candidate (리더십 후보)
// ============================================

export type LeadershipCandidate = {
  userId: string;
  displayName: string;
  attendanceScore: number;
  postScore: number;
  commentScore: number;
  totalScore: number;
};

// ============================================
// Member Availability Calendar (멤버 가용 시간 캘린더)
// ============================================

export type AvailabilitySlot = {
  day: DayOfWeekKey;
  startTime: string;
  endTime: string;
};

export type MemberAvailability = {
  userId: string;
  slots: AvailabilitySlot[];
  updatedAt: string;
};

// ============================================
// Communication Preference (연락 선호도)
// ============================================

export type CommPreferredTime = "morning" | "afternoon" | "evening" | "night";
export type CommChannel = "push" | "message" | "board";

export type CommunicationPreference = {
  userId: string;
  preferredTimes: CommPreferredTime[];
  preferredChannels: CommChannel[];
  quietHoursStart: string;
  quietHoursEnd: string;
  updatedAt: string;
};

// ============================================
// Member Intro Card v2 (자기소개 카드, localStorage 기반)
// ============================================

export type MemberIntroCardV2 = {
  userId: string;
  nickname: string;
  danceExperience: string;
  favoriteGenres: string[];
  motto: string;
  joinReason: string;
  updatedAt: string;
};

// ============================================
// Member Activity Export (멤버 활동 내보내기)
// ============================================

export type MemberActivityExportPeriod = "all" | "last30" | "last90";

export type MemberActivityExportItems = {
  attendance: boolean;
  posts: boolean;
  comments: boolean;
};

export type MemberAttendanceExportRow = {
  date: string;
  scheduleName: string;
  status: string;
};

export type MemberPostExportRow = {
  date: string;
  title: string;
};

export type MemberCommentExportRow = {
  date: string;
  postTitle: string;
};

export type MemberActivityExportData = {
  attendance: MemberAttendanceExportRow[];
  posts: MemberPostExportRow[];
  comments: MemberCommentExportRow[];
};
