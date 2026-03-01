// localStorage 기반 기능 타입 모음

// ============================================
// Practice Journal (개인 연습 일지)
// ============================================

export type PracticeEntry = {
  id: string;
  date: string;
  durationMinutes: number;
  content: string;
  selfRating: number;
  memo: string;
  createdAt: string;
};

export type PracticeJournalData = {
  entries: PracticeEntry[];
  weeklyGoalMinutes: number;
};

export type PracticeWeeklyStats = {
  totalMinutes: number;
  practiceCount: number;
  averageRating: number;
  goalMinutes: number;
  goalProgress: number;
};

// ============================================
// Weekly Attendance Checkin (주간 출석 체크인)
// ============================================

export type WeeklyCheckinRecord = {
  weekStart: string;
  goal: number;
  actual: number;
  achieved: boolean;
};

export type WeeklyCheckinData = {
  currentGoal: number | null;
  history: WeeklyCheckinRecord[];
};

// ============================================
// Practice Weekly Digest (연습 일지 주간 요약)
// ============================================

export type PracticeWeeklyDigestStat = {
  current: number;
  previous: number;
  changeRate: number | null;
};

export type PracticeWeeklyDigest = {
  weekStart: string;
  weekEnd: string;
  practiceCount: PracticeWeeklyDigestStat;
  totalMinutes: PracticeWeeklyDigestStat;
  averageRating: PracticeWeeklyDigestStat;
  streakDays: number;
  topCategory: string | null;
  summaryText: string;
  practicedDates: string[];
  hasData: boolean;
};

// ============================================
// Dance Diary (멤버 댄스 다이어리)
// ============================================

export type DanceDiaryMood =
  | "great"
  | "good"
  | "neutral"
  | "tired"
  | "frustrated";

export type DanceDiaryCondition =
  | "excellent"
  | "good"
  | "normal"
  | "sore"
  | "injured";

export type DanceDiaryEntry = {
  id: string;
  date: string;
  mood: DanceDiaryMood;
  condition: DanceDiaryCondition;
  practiceHours: number;
  achievements: string[];
  struggles: string[];
  notes: string;
  songsPracticed: string[];
  rating: number;
  createdAt: string;
};

// ============================================
// Wardrobe / Costume Management
// ============================================

export type CostumeStatus = "planned" | "ordered" | "arrived" | "distributed" | "returned";

export type CostumeItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  totalQuantity: number;
  availableQuantity: number;
  status: CostumeStatus;
  note: string;
  createdAt: string;
};

export type CostumeAssignment = {
  costumeId: string;
  memberId: string;
  memberName: string;
  size: string;
  returned: boolean;
};

export type CostumeStore = {
  items: CostumeItem[];
  assignments: CostumeAssignment[];
  updatedAt: string;
};

// ============================================
// Music Playlist (그룹 음악 플레이리스트)
// ============================================

export type MusicPlaylistTrack = {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  genre: string;
  memo: string;
  order: number;
};

export type MusicPlaylist = {
  id: string;
  groupId: string;
  name: string;
  description: string;
  tracks: MusicPlaylistTrack[];
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Practice Assignment (연습 과제 할당)
// ============================================

export type AssignmentPriority = "high" | "medium" | "low";
export type AssignmentProgress = "not_started" | "in_progress" | "completed";

export type AssignmentMemberStatus = {
  userId: string;
  userName: string;
  progress: AssignmentProgress;
  note: string;
  updatedAt: string;
};

export type PracticeAssignment = {
  id: string;
  groupId: string;
  title: string;
  description: string;
  memberStatuses: AssignmentMemberStatus[];
  priority: AssignmentPriority;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
};

// ============================================
// Session Auto Feedback (세션 피드백 생성기)
// ============================================

export type SessionAutoFeedback = {
  id: string;
  scheduleId: string;
  scheduleName: string;
  date: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
  autoSummary: string;
  customNote: string;
  createdAt: string;
};

// ============================================
// Rehearsal Planner (공연 리허설 플래너)
// ============================================

export type RehearsalCheckItem = {
  id: string;
  title: string;
  checked: boolean;
};

export type RehearsalWeek = {
  weekNumber: number;
  label: string;
  goal: string;
  checks: RehearsalCheckItem[];
};

export type RehearsalPlan = {
  id: string;
  performanceDate: string;
  title: string;
  weeks: RehearsalWeek[];
  createdAt: string;
};

// ============================================
// Mood Check-in (기분 체크인)
// ============================================

export type MoodType = "great" | "good" | "okay" | "bad" | "terrible";

export type MoodEntry = {
  date: string;
  mood: MoodType;
  note?: string;
  createdAt: string;
};

// ============================================
// Personal Goal (개인 목표 관리)
// ============================================

export type PersonalGoalStatus = "active" | "completed" | "abandoned";

export type PersonalGoalItem = {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: PersonalGoalStatus;
  createdAt: string;
  completedAt?: string;
};

// ============================================
// Member Notes v2 (멤버 메모/노트)
// ============================================

export type MemberNoteCategory = "general" | "attendance" | "skill" | "attitude";

export type MemberNoteV2 = {
  id: string;
  targetUserId: string;
  content: string;
  category: MemberNoteCategory;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Onboarding Tasks (온보딩 과제)
// ============================================

export type OnboardingTaskItem = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  order: number;
};

export type OnboardingTasksData = {
  tasks: OnboardingTaskItem[];
  dismissed: boolean;
  completedAt: string | null;
};

// ============================================
// Group Poll (그룹 설문)
// ============================================

export type GroupPollOption = {
  id: string;
  text: string;
  voterIds: string[];
};

// ============================================
// Practice Playlist Card
// ============================================

export type PracticeTrack = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm?: number;
  genre?: string;
  notes?: string;
  order: number;
  addedBy: string;
  createdAt: string;
};

export type PracticePlaylistData = {
  id: string;
  name: string;
  tracks: PracticeTrack[];
  createdAt: string;
};

// ============================================
// Warmup Routine (워밍업 루틴)
// ============================================

export type WarmupExerciseType =
  | "stretch"
  | "cardio"
  | "strength"
  | "balance"
  | "isolation"
  | "cooldown";

export type WarmupExercise = {
  id: string;
  name: string;
  type: WarmupExerciseType;
  duration: number;
  repetitions?: number;
  description?: string;
  bodyPart: string;
  order: number;
};

export type WarmupRoutine = {
  id: string;
  name: string;
  exercises: WarmupExercise[];
  totalDuration: number;
  createdBy: string;
  createdAt: string;
};

// ============================================
// Attendance Streak Data (출석 스트릭 트래커)
// ============================================

export type AttendanceStreakData = {
  currentStreak: number;
  longestStreak: number;
  totalPresent: number;
  streakDates: string[];
  monthlyGrid: { date: string; present: boolean }[];
};

// ============================================
// Session Timer (연습 세션 타이머)
// ============================================

export type SessionTimerSegment = {
  id: string;
  label: string;
  durationMinutes: number;
  color: string;
};

export type SessionTimerPreset = {
  id: string;
  title: string;
  segments: SessionTimerSegment[];
  totalMinutes: number;
  createdAt: string;
};

// ============================================
// Kudos Board (멤버 칭찬 보드)
// ============================================

export type KudosCategory = "teamwork" | "effort" | "creativity" | "leadership" | "improvement";

export type KudosMessage = {
  id: string;
  fromName: string;
  toName: string;
  category: KudosCategory;
  message: string;
  createdAt: string;
};

// ============================================
// Time Capsule (타임캡슐)
// ============================================

export type TimeCapsuleMessage = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export type TimeCapsule = {
  id: string;
  title: string;
  openDate: string;
  messages: TimeCapsuleMessage[];
  isSealed: boolean;
  isOpened: boolean;
  createdAt: string;
};

// ============================================
// Project Role Assignment Board (프로젝트 역할 배정 보드)
// ============================================

export type ProjectRoleAssignment = {
  id: string;
  roleName: string;
  assignees: string[];
  status: "open" | "filled" | "completed";
  color: string;
  note: string;
  createdAt: string;
};

// ============================================
// Countdown Event (이벤트 카운트다운)
// ============================================

export type CountdownEvent = {
  id: string;
  title: string;
  eventDate: string;
  eventTime?: string;
  emoji: string;
  createdAt: string;
};

// ============================================
// Shared Memo (그룹 공유 메모)
// ============================================

export type SharedMemoColor = "yellow" | "blue" | "green" | "pink" | "purple";

export type SharedMemo = {
  id: string;
  content: string;
  author: string;
  color: SharedMemoColor;
  pinned: boolean;
  expiresAt?: string;
  createdAt: string;
};

// ============================================
// Formation Editor (포메이션 에디터)
// ============================================

export type FormationPosition = {
  memberId: string;
  memberName: string;
  x: number;
  y: number;
  color: string;
};

export type FormationScene = {
  id: string;
  label: string;
  positions: FormationPosition[];
  createdAt: string;
};

export type FormationProject = {
  scenes: FormationScene[];
  updatedAt: string;
};

// ============================================
// Video Library (연습 영상 라이브러리)
// ============================================

export type VideoCategory = "reference" | "tutorial" | "practice" | "performance" | "other";

export type VideoLibraryItem = {
  id: string;
  title: string;
  url: string;
  category: VideoCategory;
  addedBy: string;
  note: string;
  createdAt: string;
};

export type VideoLibraryStore = {
  items: VideoLibraryItem[];
  updatedAt: string;
};

// ============================================
// Choreography Difficulty Rating (안무 난도 평가)
// ============================================

export type DifficultyCategory = "speed" | "complexity" | "stamina" | "expression" | "sync";

export type DifficultyRating = {
  category: DifficultyCategory;
  score: number;
};

export type ChoreographyDifficultyEntry = {
  id: string;
  projectId: string;
  songTitle: string;
  ratings: DifficultyRating[];
  averageScore: number;
  ratedBy: string;
  comment: string;
  createdAt: string;
};

// ============================================
// Collaboration Effectiveness (동료 협력도 평가)
// ============================================

export type CollabDimension = "communication" | "punctuality" | "contribution" | "attitude" | "skillSharing";

export type CollabEvaluation = {
  id: string;
  evaluatorId: string;
  targetId: string;
  targetName: string;
  scores: Record<CollabDimension, number>;
  comment: string;
  isAnonymous: boolean;
  createdAt: string;
};

export type CollabSummary = {
  targetId: string;
  targetName: string;
  averageScores: Record<CollabDimension, number>;
  overallScore: number;
  evaluationCount: number;
};

// ============================================
// Practice Intensity Tracker (연습 강도 추적)
// ============================================

export type IntensityLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type PracticeIntensityEntry = {
  id: string;
  date: string;
  intensity: IntensityLevel;
  durationMinutes: number;
  bodyParts: string[];
  note: string;
  createdAt: string;
};

export type WeeklyIntensitySummary = {
  weekStart: string;
  avgIntensity: number;
  totalMinutes: number;
  sessionCount: number;
};

// ============================================
// Team Activity Anomaly Detection (팀 활동 이상 탐지)
// ============================================

export type AnomalyLevel = "info" | "warning" | "critical";
export type AnomalyMetricType = "attendance" | "posts" | "members" | "finance";

export type ActivityAnomaly = {
  id: string;
  metricType: AnomalyMetricType;
  level: AnomalyLevel;
  title: string;
  description: string;
  currentValue: number;
  expectedValue: number;
  deviationPercent: number;
  detectedAt: string;
};

export type AnomalyDetectionResult = {
  anomalies: ActivityAnomaly[];
  lastCheckedAt: string;
  healthScore: number;
};

// ============================================
// Group Challenge Item (그룹 챌린지)
// ============================================

export type GroupChallengeType = "individual" | "team";
export type GroupChallengeStatus = "upcoming" | "active" | "completed";

export type GroupChallengeItem = {
  id: string;
  title: string;
  description: string;
  type: GroupChallengeType;
  duration: number;
  startDate: string;
  endDate: string;
  goal: string;
  participants: string[];
  status: GroupChallengeStatus;
  createdAt: string;
};

export type GroupChallengeData = {
  challenges: GroupChallengeItem[];
};

// ============================================
// Group Memory Album (그룹 추억 타임라인)
// ============================================

export type MemoryCategory = "공연" | "연습" | "모임" | "축하" | "대회" | "기타";

export type GroupMemoryItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: MemoryCategory;
  emoji: string;
  createdAt: string;
};

// ============================================
// Learning Path (멤버 학습 경로)
// ============================================

export type LearningLevel = "beginner" | "intermediate" | "advanced";

/** @deprecated LearningPath로 교체됨 */
export type LearningStep_Legacy = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
};

/** @deprecated LearningPath로 교체됨 */
export type LearningPathItem = {
  id: string;
  title: string;
  level: LearningLevel;
  steps: LearningStep_Legacy[];
  createdAt: string;
};

export type LearningStepStatus = "locked" | "in_progress" | "completed";

export type LearningStep = {
  id: string;
  order: number;
  title: string;
  description: string;
  skills: string[];
  status: LearningStepStatus;
  completedAt?: string;
};

export type LearningPath = {
  id: string;
  userId: string;
  currentLevel: string;
  targetLevel: string;
  genre: string;
  steps: LearningStep[];
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Decision Log (그룹 의사결정 로그)
// ============================================

export type DecisionImpact = "high" | "medium" | "low";

export type DecisionCategory =
  | "규칙 변경"
  | "멤버 관리"
  | "재무"
  | "일정"
  | "기타";

export const DECISION_CATEGORIES: DecisionCategory[] = [
  "규칙 변경",
  "멤버 관리",
  "재무",
  "일정",
  "기타",
];

export type DecisionLogItem = {
  id: string;
  groupId: string;
  title: string;
  category: DecisionCategory;
  description: string;
  decidedBy: string;
  decidedAt: string;
  impact: DecisionImpact;
};

// ============================================
// Dynamic Teams (동적 팀/소그룹 관리)
// ============================================

export type TeamColor = "red" | "blue" | "green" | "purple" | "orange" | "cyan";

export type DynamicTeam = {
  id: string;
  name: string;
  color: TeamColor;
  memberIds: string[];
  createdAt: string;
};

export type DynamicTeamsData = {
  teams: DynamicTeam[];
};

// ============================================
// Event Gallery (그룹 이벤트 갤러리)
// ============================================

export type EventTag = "performance" | "competition" | "workshop" | "other";

export type GroupEvent = {
  id: string;
  groupId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  tag: EventTag;
  participantCount: number;
  createdAt: string;
};

// ============================================
// Group Announcements (그룹 공지사항)
// ============================================

export type GroupAnnouncementPriority = "urgent" | "normal" | "low";

export type GroupAnnouncementItem = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  isPinned: boolean;
  priority: GroupAnnouncementPriority;
  expiresAt: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroupAnnouncementInput = {
  title: string;
  content: string;
  priority: GroupAnnouncementPriority;
  pinned: boolean;
};

export type GroupAnnouncementData = {
  groupId: string;
  announcements: GroupAnnouncementItem[];
  updatedAt: string;
};

// ============================================
// Schedule Feedback Item (일정 피드백/후기)
// ============================================

export type ScheduleFeedbackMood = "great" | "good" | "ok" | "bad";

export type ScheduleFeedbackItem = {
  id: string;
  scheduleId: string;
  rating: number;
  content: string;
  mood: ScheduleFeedbackMood;
  createdAt: string;
};

export const SCHEDULE_FEEDBACK_MOOD_LABELS: Record<ScheduleFeedbackMood, string> = {
  great: "최고",
  good: "좋음",
  ok: "보통",
  bad: "별로",
};

export const SCHEDULE_FEEDBACK_MOOD_EMOJI: Record<ScheduleFeedbackMood, string> = {
  great: "😄",
  good: "😊",
  ok: "😐",
  bad: "😞",
};

// ============================================
// Schedule Recurrence (일정 반복 설정)
// ============================================

export type RecurrenceType = "weekly" | "biweekly" | "monthly";
export type RecurrenceEndType = "never" | "by_date" | "by_count";

export type ScheduleRecurrenceRule = {
  id: string;
  groupId: string;
  type: RecurrenceType;
  daysOfWeek: number[];
  startTime: string;
  durationMinutes: number;
  title: string;
  location: string;
  endType: RecurrenceEndType;
  endDate: string | null;
  endCount: number | null;
  createdAt: string;
};

// ============================================
// Attendance Reward (멤버 출석 보상)
// ============================================

export type AttendanceRewardTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";

export type AttendanceRewardRule = {
  id: string;
  tier: AttendanceRewardTier;
  requiredAttendance: number;
  rewardName: string;
  rewardDescription: string;
  points: number;
  createdAt: string;
};

export type MemberRewardRecord = {
  id: string;
  memberName: string;
  tier: AttendanceRewardTier;
  earnedAt: string;
  attendanceRate: number;
  points: number;
};

// ============================================
// Engagement Campaign (참여도 목표 캠페인)
// ============================================

export type EngagementGoalType = "attendance" | "posts" | "comments";
export type EngagementCampaignStatus = "active" | "completed" | "expired";

export type EngagementCampaignMemo = {
  id: string;
  content: string;
  createdAt: string;
};

export type EngagementCampaign = {
  id: string;
  groupId: string;
  targetMemberName: string;
  goalType: EngagementGoalType;
  goalValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: EngagementCampaignStatus;
  memos: EngagementCampaignMemo[];
  createdAt: string;
};

export const ENGAGEMENT_GOAL_TYPE_LABELS: Record<EngagementGoalType, string> = {
  attendance: "출석 N회 이상",
  posts: "게시글 N개 작성",
  comments: "댓글 N개 작성",
};

export const ENGAGEMENT_GOAL_TYPE_UNITS: Record<EngagementGoalType, string> = {
  attendance: "회",
  posts: "개",
  comments: "개",
};

export const ENGAGEMENT_CAMPAIGN_STATUS_LABELS: Record<EngagementCampaignStatus, string> = {
  active: "진행 중",
  completed: "완료",
  expired: "만료",
};

export const ENGAGEMENT_CAMPAIGN_MAX = 10;

// ============================================
// Group Guideline (그룹 규칙/가이드)
// ============================================

export type GroupGuidelineCategory = "출석" | "매너" | "연습" | "재무" | "기타";

export const GROUP_GUIDELINE_CATEGORIES: GroupGuidelineCategory[] = [
  "출석",
  "매너",
  "연습",
  "재무",
  "기타",
];

export type GroupGuidelineItem = {
  id: string;
  title: string;
  description: string;
  category: GroupGuidelineCategory;
  order: number;
  createdAt: string;
};

export type GroupGuidelinesData = {
  items: GroupGuidelineItem[];
};

export const GROUP_GUIDELINE_MAX = 30;

// ============================================
// Partner Matching (랜덤 짝꿍 매칭)
// ============================================

export type PartnerPair = {
  memberIds: string[];
  memberNames: string[];
};

export type PartnerMatchingRecord = {
  id: string;
  pairs: PartnerPair[];
  matchedAt: string;
  label: string;
};

export type PartnerMatchingData = {
  records: PartnerMatchingRecord[];
};

// ============================================
// Role History (멤버 역할 히스토리)
// ============================================

export type MemberRoleType =
  | "leader"
  | "sub_leader"
  | "treasurer"
  | "secretary"
  | "choreographer"
  | "trainer"
  | "member"
  | "other";

export type RoleHistoryEntry = {
  id: string;
  memberName: string;
  role: MemberRoleType;
  customRoleTitle?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  assignedBy?: string;
  notes?: string;
  createdAt: string;
};

// ============================================
// Thank You Letter (감사 편지)
// ============================================

export type ThankYouCategory =
  | "help"
  | "motivation"
  | "teaching"
  | "teamwork"
  | "creativity"
  | "encouragement"
  | "effort"
  | "general";

export type ThankYouLetter = {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  message: string;
  category: ThankYouCategory;
  isPublic: boolean;
  emoji: string;
  createdAt: string;
};

export type ThankYouMessage = {
  id: string;
  fromMember: string;
  toMember: string;
  category: ThankYouCategory;
  message: string;
  emoji?: string;
  likes: string[];
  isPublic: boolean;
  createdAt: string;
};

// ============================================
// Practice Checkin (연습 체크인)
// ============================================

export type PracticeCheckinStatus = "checked_in" | "checked_out" | "absent";

export type PracticeCheckinSession = {
  id: string;
  date: string;
  title: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  createdAt: string;
};

export type PracticeCheckinRecord = {
  id: string;
  sessionId: string;
  memberName: string;
  status: PracticeCheckinStatus;
  checkinTime?: string;
  checkoutTime?: string;
  lateMinutes?: number;
  notes?: string;
  createdAt: string;
};

// ============================================
// Rehearsal Schedule (공연 리허설 스케줄)
// ============================================

export type RehearsalType =
  | "full_run"
  | "tech_rehearsal"
  | "dress_rehearsal"
  | "section"
  | "blocking"
  | "other"
  | "full"
  | "partial"
  | "tech"
  | "dress";

export type RehearsalScheduleEntry = {
  id: string;
  title: string;
  type: RehearsalType;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  focusAreas: string[];
  requiredMembers: string[];
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
};

// ============================================
// Battle Tournament (댄스 배틀 토너먼트)
// ============================================

export type TournamentFormat =
  | "single_elimination"
  | "double_elimination"
  | "round_robin";

export type TournamentStatus = "upcoming" | "in_progress" | "completed";

export type TournamentMatch = {
  id: string;
  round: number;
  player1: string;
  player2: string;
  winner?: string;
  score1?: number;
  score2?: number;
  notes?: string;
};

export type BattleTournamentEntry = {
  id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  participants: string[];
  matches: TournamentMatch[];
  champion?: string;
  createdBy: string;
  createdAt: string;
};

// ============================================
// Fitness Test (멤버 체력 테스트)
// ============================================

export type FitnessTestCategory =
  | "flexibility"
  | "endurance"
  | "strength"
  | "balance"
  | "agility"
  | "rhythm";

export type FitnessTestItem = {
  name: string;
  category: FitnessTestCategory;
  unit: string;
  higherIsBetter: boolean;
};

export type FitnessTestResult = {
  id: string;
  memberName: string;
  date: string;
  testItems: {
    itemName: string;
    value: number;
    category: FitnessTestCategory;
  }[];
  overallScore?: number;
  notes?: string;
  createdAt: string;
};

// ============================================
// Program Book (공연 프로그램 북)
// ============================================

export type ProgramSectionType =
  | "cover"
  | "greeting"
  | "program_list"
  | "performer_intro"
  | "sponsor"
  | "notes"
  | "credits";

export type ProgramBookSection = {
  id: string;
  type: ProgramSectionType;
  title: string;
  content: string;
  order: number;
  imageUrl?: string;
  createdAt: string;
};

export type ProgramBookData = {
  id: string;
  showTitle: string;
  showDate: string;
  venue: string;
  sections: ProgramBookSection[];
  createdAt: string;
};

// ============================================
// Unified Calendar (그룹 통합 캘린더)
// ============================================

export type UnifiedEventType =
  | "practice"
  | "performance"
  | "meeting"
  | "social"
  | "competition"
  | "workshop"
  | "other";

export type UnifiedCalendarEvent = {
  id: string;
  title: string;
  type: UnifiedEventType;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  participants: string[];
  isAllDay: boolean;
  color?: string;
  reminder?: boolean;
  createdBy: string;
  createdAt: string;
};

// ============================================
// Costume Design Board (의상 디자인 보드)
// ============================================

export type CostumeDesignStatus =
  | "idea"
  | "sketched"
  | "approved"
  | "in_production"
  | "completed";

export type CostumeDesignComment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type CostumeDesignEntry = {
  id: string;
  title: string;
  description: string;
  designedBy: string;
  category: string;
  colorScheme: string[];
  materialNotes?: string;
  estimatedCost?: number;
  status: CostumeDesignStatus;
  votes: string[];
  comments: CostumeDesignComment[];
  createdAt: string;
};

// ============================================
// Carpool Ride
// ============================================

export type CarpoolRideStatus =
  | "open"
  | "full"
  | "departed"
  | "completed"
  | "cancelled";

export type CarpoolRide = {
  id: string;
  driverName: string;
  date: string;
  departureTime: string;
  departureLocation: string;
  destination: string;
  totalSeats: number;
  passengers: string[];
  notes?: string;
  status: CarpoolRideStatus;
  createdAt: string;
};

// ============================================
// Injury Tracker (부상 추적)
// ============================================

export type InjuryTrackerSeverity = "minor" | "moderate" | "severe";

export type InjuryBodyPart =
  | "ankle"
  | "knee"
  | "hip"
  | "back"
  | "shoulder"
  | "wrist"
  | "neck"
  | "foot"
  | "other";

export type InjuryTrackerEntry = {
  id: string;
  memberName: string;
  bodyPart: InjuryBodyPart;
  description: string;
  severity: InjuryTrackerSeverity;
  injuryDate: string;
  expectedRecoveryDate?: string;
  recoveredDate?: string;
  status: "active" | "recovering" | "recovered";
  restrictions: string[];
  notes?: string;
  createdAt: string;
};

// ============================================
// Mission Board (그룹 미션 보드)
// ============================================

export type MissionDifficulty = "easy" | "medium" | "hard" | "extreme";

export type MissionCompletion = {
  memberName: string;
  completedAt: string;
};

export type MissionBoardEntry = {
  id: string;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  points: number;
  deadline?: string;
  completedBy: MissionCompletion[];
  maxCompletions?: number;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
};

// ============================================
// Show Gallery (공연 사진 갤러리)
// ============================================

export type ShowGalleryCategory =
  | "rehearsal"
  | "backstage"
  | "performance"
  | "group_photo"
  | "poster"
  | "other";

export type ShowGalleryPhoto = {
  id: string;
  title: string;
  description?: string;
  category: ShowGalleryCategory;
  photographer?: string;
  tags: string[];
  likes: string[];
  isFavorite: boolean;
  uploadedAt: string;
  createdAt: string;
};

export type ShowGalleryAlbum = {
  id: string;
  name: string;
  description?: string;
  photos: ShowGalleryPhoto[];
  coverPhotoId?: string;
  createdAt: string;
};

// ============================================
// Practice Timer Log (연습 타이머 기록)
// ============================================

export type PracticeTimerCategory =
  | "warmup"
  | "technique"
  | "choreography"
  | "freestyle"
  | "cooldown"
  | "other";

export type PracticeTimerLogEntry = {
  id: string;
  date: string;
  category: PracticeTimerCategory;
  durationMinutes: number;
  memberName?: string;
  description?: string;
  intensity: number;
  createdAt: string;
};

// ============================================
// Audience Feedback (공연 관객 피드백)
// ============================================

export type AudienceFeedbackRating = {
  choreography: number;
  music: number;
  costumes: number;
  stagePresence: number;
  overall: number;
};

export type AudienceFeedbackEntry = {
  id: string;
  name?: string;
  email?: string;
  ratings: AudienceFeedbackRating;
  favoritePerformance?: string;
  comment?: string;
  wouldRecommend: boolean;
  submittedAt: string;
};

export type AudienceFeedbackSurvey = {
  id: string;
  projectId: string;
  title: string;
  isActive: boolean;
  entries: AudienceFeedbackEntry[];
  createdAt: string;
};

// ============================================
// Mentoring Match (그룹 멘토링 매칭)
// ============================================

export type MentoringMatchStatus = "active" | "completed" | "paused";

export type MentoringSessionRecord = {
  id: string;
  date: string;
  topic: string;
  durationMinutes: number;
  notes?: string;
  menteeRating?: number;
};

export type MentoringMatchPair = {
  id: string;
  mentorName: string;
  menteeName: string;
  skillFocus: string[];
  status: MentoringMatchStatus;
  sessions: MentoringSessionRecord[];
  startDate: string;
  endDate?: string;
  goals: string[];
  createdAt: string;
};

// ============================================
// Stage Memo (공연 무대 메모)
// ============================================

export type StageMemoZone =
  | "upstage-left"
  | "upstage-center"
  | "upstage-right"
  | "center-left"
  | "center"
  | "center-right"
  | "downstage-left"
  | "downstage-center"
  | "downstage-right";

export type StageMemoPriority = "high" | "medium" | "low";

export type StageMemoNote = {
  id: string;
  zone: StageMemoZone;
  priority: StageMemoPriority;
  content: string;
  author: string;
  tags: string[];
  isResolved: boolean;
  createdAt: string;
};

export type StageMemoBoard = {
  id: string;
  projectId: string;
  title: string;
  notes: StageMemoNote[];
  createdAt: string;
};

// ============================================
// Diet Tracker (멤버 식단 관리)
// ============================================

export type DietMealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "supplement";

export type DietTrackerMeal = {
  id: string;
  date: string;
  mealType: DietMealType;
  foods: string[];
  calories?: number;
  protein?: number;
  notes?: string;
  time?: string;
};

export type DietTrackerWater = {
  date: string;
  cups: number;
};

export type DietTrackerDayLog = {
  date: string;
  meals: DietTrackerMeal[];
  water: DietTrackerWater;
  memberName: string;
};

// ============================================
// Music License (그룹 음악 저작권 관리)
// ============================================

export type MusicLicenseType =
  | "royalty_free"
  | "licensed"
  | "original"
  | "cover"
  | "public_domain";

export type MusicLicenseStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "pending";

export type MusicLicenseEntry = {
  id: string;
  songTitle: string;
  artist: string;
  licenseType: MusicLicenseType;
  status: MusicLicenseStatus;
  purchaseDate?: string;
  expiryDate?: string;
  cost?: number;
  licensee: string;
  usageScope: string;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
};

// ============================================
// Sponsor Tracking (공연 스폰서 후원 추적)
// ============================================

export type SponsorTier =
  | "platinum"
  | "gold"
  | "silver"
  | "bronze"
  | "individual";

export type SponsorBenefitItem = {
  id: string;
  description: string;
  isDelivered: boolean;
};

export type SponsorTrackingEntry = {
  id: string;
  sponsorName: string;
  tier: SponsorTier;
  amount: number;
  contactPerson?: string;
  contactEmail?: string;
  benefits: SponsorBenefitItem[];
  paymentReceived: boolean;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
};

// ============================================
// Social Calendar (그룹 소셜 미디어 캘린더)
// ============================================

export type SocialPlatformType =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "blog";

export type SocialPostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "cancelled";

export type SocialCalendarPost = {
  id: string;
  platform: SocialPlatformType;
  title: string;
  content: string;
  scheduledDate: string;
  scheduledTime?: string;
  status: SocialPostStatus;
  assignee?: string;
  hashtags: string[];
  mediaType?: "photo" | "video" | "reel" | "story" | "text";
  notes?: string;
  createdAt: string;
};

// ============================================
// Dress Code (공연 드레스 코드)
// ============================================

export type DressCodeCategory =
  | "outfit"
  | "hair"
  | "makeup"
  | "accessories"
  | "shoes";

export type DressCodeGuideItem = {
  id: string;
  category: DressCodeCategory;
  title: string;
  description: string;
  colorCode?: string;
  imageDescription?: string;
  isRequired: boolean;
};

export type DressCodeMemberStatus = {
  memberName: string;
  itemId: string;
  isReady: boolean;
  notes?: string;
};

export type DressCodeSet = {
  id: string;
  projectId: string;
  performanceName: string;
  guides: DressCodeGuideItem[];
  memberStatuses: DressCodeMemberStatus[];
  createdAt: string;
};

// ============================================
// Sleep Tracker
// ============================================

export type SleepTrackerQuality =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "terrible";

export type SleepTrackerEntry = {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationHours: number;
  quality: SleepTrackerQuality;
  notes?: string;
  hadNap: boolean;
  napMinutes?: number;
  createdAt: string;
};

// ============================================
// Equipment Rental (그룹 장비 대여 관리)
// ============================================

export type EquipmentRentalStatus =
  | "available"
  | "rented"
  | "overdue"
  | "maintenance";

export type EquipmentRentalRecord = {
  id: string;
  borrower: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  condition?: string;
};

export type EquipmentRentalItem = {
  id: string;
  name: string;
  category: string;
  status: EquipmentRentalStatus;
  totalQuantity: number;
  availableQuantity: number;
  rentals: EquipmentRentalRecord[];
  description?: string;
  createdAt: string;
};

// ============================================
// Ticket Management (공연 티켓 관리)
// ============================================

export type TicketMgmtType =
  | "vip"
  | "general"
  | "student"
  | "early_bird"
  | "free";

export type TicketMgmtSale = {
  id: string;
  buyerName?: string;
  ticketType: TicketMgmtType;
  quantity: number;
  totalPrice: number;
  soldAt: string;
  seatInfo?: string;
  notes?: string;
};

export type TicketMgmtTier = {
  id: string;
  type: TicketMgmtType;
  price: number;
  totalSeats: number;
  description?: string;
};

export type TicketMgmtEvent = {
  id: string;
  projectId: string;
  eventName: string;
  eventDate: string;
  tiers: TicketMgmtTier[];
  sales: TicketMgmtSale[];
  createdAt: string;
};

// ============================================
// Makeup Sheet (공연 메이크업 시트)
// ============================================

export type MakeupSheetArea =
  | "base"
  | "eyes"
  | "lips"
  | "cheeks"
  | "brows"
  | "special_effects";

export type MakeupSheetProduct = {
  id: string;
  area: MakeupSheetArea;
  productName: string;
  brand?: string;
  colorCode?: string;
  technique?: string;
  order: number;
};

export type MakeupSheetLook = {
  id: string;
  lookName: string;
  performanceName: string;
  products: MakeupSheetProduct[];
  assignedMembers: string[];
  notes?: string;
  estimatedMinutes?: number;
  createdAt: string;
};

// ============================================
// Practice Challenge (그룹 연습 도전 과제)
// ============================================

export type PracticeChallengeStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled";

export type PracticeChallengeParticipant = {
  memberName: string;
  progress: number;
  completedAt?: string;
};

export type PracticeChallengeEntry = {
  id: string;
  title: string;
  description: string;
  status: PracticeChallengeStatus;
  targetValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  participants: PracticeChallengeParticipant[];
  reward?: string;
  createdBy: string;
  createdAt: string;
};

// ============================================
// Stretching Routine (스트레칭 루틴)
// ============================================

export type StretchingBodyPart =
  | "neck"
  | "shoulders"
  | "back"
  | "hips"
  | "legs"
  | "ankles"
  | "wrists"
  | "full_body";

export type StretchingExercise = {
  id: string;
  name: string;
  bodyPart: StretchingBodyPart;
  durationSeconds: number;
  sets: number;
  description?: string;
};

export type StretchingRoutine = {
  id: string;
  routineName: string;
  exercises: StretchingExercise[];
  totalMinutes: number;
  createdAt: string;
};

export type StretchingLog = {
  id: string;
  routineId: string;
  date: string;
  completedExercises: string[];
  flexibilityRating?: number;
  notes?: string;
  createdAt: string;
};

// ============================================
// Practice Evaluation (그룹 연습 평가표)
// ============================================

export type PracticeEvalCriteria = {
  id: string;
  name: string;
  maxScore: number;
};

export type PracticeEvalScore = {
  criteriaId: string;
  score: number;
  comment?: string;
};

export type PracticeEvalMemberResult = {
  memberName: string;
  scores: PracticeEvalScore[];
  totalScore: number;
  feedback?: string;
};

export type PracticeEvalSession = {
  id: string;
  date: string;
  title: string;
  criteria: PracticeEvalCriteria[];
  results: PracticeEvalMemberResult[];
  evaluator: string;
  notes?: string;
  createdAt: string;
};

// ============================================
// Event RSVP (그룹 이벤트 RSVP)
// ============================================

export type EventRsvpResponse = "attending" | "maybe" | "not_attending" | "pending";

export type EventRsvpMember = {
  memberName: string;
  response: EventRsvpResponse;
  respondedAt?: string;
  note?: string;
};

export type EventRsvpItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  deadline?: string;
  responses: EventRsvpMember[];
  createdBy: string;
  createdAt: string;
};

// ============================================
// Poster Management (공연 포스터 관리)
// ============================================

export type PosterVersionStatus =
  | "draft"
  | "review"
  | "approved"
  | "rejected"
  | "final";

export type PosterVote = {
  memberName: string;
  rating: number;
  comment?: string;
};

export type PosterVersion = {
  id: string;
  versionNumber: number;
  title: string;
  designer: string;
  description: string;
  dimensions?: string;
  colorScheme?: string[];
  status: PosterVersionStatus;
  votes: PosterVote[];
  createdAt: string;
};

export type PosterProject = {
  id: string;
  projectId: string;
  posterName: string;
  versions: PosterVersion[];
  selectedVersionId?: string;
  deadline?: string;
  createdAt: string;
};

// ============================================
// Sound Cue Sheet (공연 음향 큐시트)
// ============================================

export type SoundCueType =
  | "bgm"
  | "sfx"
  | "narration"
  | "live"
  | "silence";

export type SoundCueAction =
  | "play"
  | "stop"
  | "fade_in"
  | "fade_out"
  | "crossfade"
  | "loop";

export type SoundCueEntry = {
  id: string;
  cueNumber: number;
  name: string;
  trackName?: string;
  artist?: string;
  type: SoundCueType;
  action: SoundCueAction;
  startTime?: string;
  endTime?: string;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  scene?: string;
  triggerTime?: string;
  duration?: string;
  source?: string;
  notes?: string;
  isActive: boolean;
  isChecked: boolean;
};

export type SoundCueSheet = {
  id: string;
  projectId: string;
  title: string;
  cues: SoundCueEntry[];
  createdAt: string;
};

// ============================================
// Stage Risk Assessment (공연 무대 리스크 평가)
// ============================================

export type StageRiskCategory =
  | "stage_structure"
  | "lighting_electric"
  | "sound"
  | "audience_safety"
  | "performer_safety"
  | "weather"
  | "other";

export type StageRiskLevel = "low" | "medium" | "high" | "critical";
export type StageRiskResponseStatus = "pending" | "in_progress" | "done";

export type StageRiskItem = {
  id: string;
  title: string;
  category: StageRiskCategory;
  likelihood: number;
  impact: number;
  score: number;
  level: StageRiskLevel;
  mitigation: string;
  responseStatus: StageRiskResponseStatus;
  createdAt: string;
  updatedAt: string;
};

export type StageRiskData = {
  projectId: string;
  items: StageRiskItem[];
  updatedAt: string;
};

// ============================================
// Health Tracking (멤버 건강 추적)
// ============================================

export type BodyPart = "neck" | "shoulder" | "back" | "waist" | "hip" | "knee" | "ankle" | "wrist" | "elbow" | "other";
export type InjurySeverity = "mild" | "moderate" | "severe";
export type InjuryStatus = "active" | "recovering" | "healed";

export type InjuryRecord = {
  id: string;
  bodyPart: BodyPart;
  severity: InjurySeverity;
  status: InjuryStatus;
  description: string;
  occurredAt: string;
  healedAt?: string;
  note: string;
  createdAt: string;
};

// ============================================
// Rehearsal Log (리허설 진행 기록)
// ============================================

export type RehearsalIssue = {
  id: string;
  description: string;
  resolved: boolean;
};

export type RehearsalLogEntry = {
  id: string;
  date: string;
  rehearsalNumber: number;
  songsRehearsed: string[];
  completionRate: number;
  issues: RehearsalIssue[];
  nextGoals: string[];
  attendeeCount: number;
  note: string;
  createdAt: string;
};

// ============================================
// Dance Battle Scoreboard (댄스 배틀)
// ============================================

export type BattleType = "solo" | "team";
export type BattleResult = "win" | "lose" | "draw";

export type BattleMatch = {
  id: string;
  date: string;
  type: BattleType;
  participant1: string;
  participant2: string;
  winner: string | null;
  score1?: number;
  score2?: number;
  style: string;
  note: string;
  createdAt: string;
};

export type BattleStats = {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
};

// ============================================
// Event Sponsorship (이벤트 스폰서 관리)
// ============================================

export type SponsorType = "financial" | "venue" | "equipment" | "media" | "other";
export type SponsorStatus = "prospect" | "negotiating" | "confirmed" | "completed";

export type SponsorEntry = {
  id: string;
  name: string;
  type: SponsorType;
  status: SponsorStatus;
  contactName: string;
  contactInfo: string;
  supportAmount: number;
  supportDescription: string;
  eventName: string;
  note: string;
  createdAt: string;
};

// ============================================
// Photo Album (포토 앨범)
// ============================================

export type PhotoAlbumItem = {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  tags: string[];
  takenAt: string;
  uploadedBy: string;
  createdAt: string;
};

export type PhotoAlbum = {
  id: string;
  name: string;
  coverUrl: string;
  photos: PhotoAlbumItem[];
  createdAt: string;
};

// ============================================
// Setlist Management (세트리스트 관리)
// ============================================

export type SetlistItemType = "performance" | "mc" | "break" | "costume_change";

export type PerformanceSetlistItem = {
  id: string;
  order: number;
  type: SetlistItemType;
  title: string;
  durationSeconds: number;
  costumeChange: boolean;
  performers: string[];
  note: string;
};

export type PerformanceSetlistData = {
  id: string;
  eventName: string;
  eventDate: string;
  items: PerformanceSetlistItem[];
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Dance Glossary (댄스 용어 사전)
// ============================================

export type GlossaryCategory =
  | "basic"
  | "hiphop"
  | "popping"
  | "locking"
  | "breaking"
  | "waacking"
  | "contemporary"
  | "general";

export type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  category: GlossaryCategory;
  difficulty: "beginner" | "intermediate" | "advanced";
  example: string;
  addedBy: string;
  createdAt: string;
};

// ============================================
// Group Energy Tracker (그룹 에너지 트래커)
// ============================================

export type EnergyDimension = "morale" | "motivation" | "fatigue";

export type EnergyRecord = {
  id: string;
  date: string;
  recordedBy: string;
  scores: Record<EnergyDimension, number>;
  note: string;
  createdAt: string;
};

// ============================================
// Goal Board (연습 목표 보드)
// ============================================

export type GoalBoardStatus = "todo" | "in_progress" | "done";
export type GoalBoardPriority = "low" | "medium" | "high";

export type GoalBoardItem = {
  id: string;
  title: string;
  description: string;
  status: GoalBoardStatus;
  priority: GoalBoardPriority;
  assignees: string[];
  dueDate?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
};

// ============================================
// Mentoring System (멘토링 매칭)
// ============================================

export type MentoringStatus = "active" | "completed" | "paused";

export type MentoringFeedback = {
  id: string;
  date: string;
  content: string;
  rating: number;
  writtenBy: "mentor" | "mentee";
};

export type MentoringPair = {
  id: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  goal: string;
  status: MentoringStatus;
  startDate: string;
  endDate?: string;
  feedbacks: MentoringFeedback[];
  createdAt: string;
};

// ============================================
// Style Vote Session (안무 스타일 투표)
// ============================================

export type StyleVoteStatus = "open" | "closed";

export type StyleVoteCandidate = {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  votes: string[];
};

export type StyleVoteSession = {
  id: string;
  topic: string;
  status: StyleVoteStatus;
  candidates: StyleVoteCandidate[];
  maxVotesPerPerson: number;
  createdAt: string;
  closedAt?: string;
};

// ============================================
// Skill Tree (스킬 트리)
// ============================================

export type SkillTreeNodeStatus = "locked" | "available" | "learned";

export type SkillTreeNode = {
  id: string;
  name: string;
  description: string;
  tier: number;
  prerequisiteIds: string[];
  status: SkillTreeNodeStatus;
  learnedAt?: string;
};

export type SkillTreeData = {
  userId: string;
  genre: string;
  nodes: SkillTreeNode[];
  totalLearned: number;
  updatedAt: string;
};

// ============================================
// Q&A Board (Q&A 보드)
// ============================================

export type QnaStatus = "open" | "answered" | "resolved";

export type QnaAnswer = {
  id: string;
  content: string;
  authorName: string;
  isAccepted: boolean;
  createdAt: string;
};

export type QnaQuestion = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  category: string;
  status: QnaStatus;
  answers: QnaAnswer[];
  createdAt: string;
};

// ============================================
// Practice Routine Builder (연습 루틴 빌더)
// ============================================

export type RoutineBlockType = "warmup" | "basics" | "technique" | "choreography" | "freestyle" | "cooldown" | "break";

export type RoutineBlock = {
  id: string;
  type: RoutineBlockType;
  title: string;
  durationMinutes: number;
  description: string;
  order: number;
};

export type PracticeRoutine = {
  id: string;
  name: string;
  blocks: RoutineBlock[];
  totalMinutes: number;
  usageCount: number;
  createdAt: string;
  lastUsedAt?: string;
};

// ============================================
// Personality Profile (멤버 성격/역할 프로필)
// ============================================

export type PersonalityDanceRole =
  | "dancer"
  | "choreographer"
  | "director"
  | "support"
  | "performer";

export type PersonalityTrait = {
  trait: "리더십" | "창의성" | "체력" | "표현력" | "협동심";
  score: number;
};

export type PersonalityProfile = {
  userId: string;
  preferredRoles: PersonalityDanceRole[];
  traits: PersonalityTrait[];
  bio: string;
  updatedAt: string;
};

// ============================================
// Practice Card Playlist
// ============================================

export type PracticeCardTrack = {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  duration: string;
  genre: string;
  order: number;
  createdAt: string;
};

export type PracticeCardPlaylist = {
  tracks: PracticeCardTrack[];
  updatedAt: string;
};

// ============================================
// Onboarding Checklist (신입 멤버 온보딩 체크리스트)
// ============================================

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
};

export type OnboardingProgress = {
  userId: string;
  steps: OnboardingStep[];
  startedAt: string;
  completionRate: number;
};

// ============================================
// Group Activity Heatmap (그룹 활동 히트맵)
// ============================================

export type HeatmapCell = {
  dayIndex: number;
  hourSlot: number;
  attendanceCount: number;
  scheduleCount: number;
  avgAttendanceRate: number;
};

export type ActivityHeatmapData = {
  cells: HeatmapCell[];
  bestSlots: { dayIndex: number; hourSlot: number; rate: number }[];
};

// ============================================
// Costume Rental (의상 대여 관리)
// ============================================

export type CostumeRentalItemStatus =
  | "available"
  | "rented"
  | "damaged"
  | "lost";

export type CostumeRentalItem = {
  id: string;
  name: string;
  category: "상의" | "하의" | "소품" | "신발" | "기타";
  size: string;
  status: CostumeRentalItemStatus;
  currentRenter?: string;
  rentedAt?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
};

export type CostumeRentalRecord = {
  id: string;
  itemId: string;
  renterName: string;
  rentedAt: string;
  returnedAt?: string;
  condition?: "good" | "damaged" | "lost";
  notes?: string;
};

// ============================================
// Member Compatibility Matching (멤버 호환도 매칭)
// ============================================

export type CompatibilityDimension =
  | "personality"
  | "skill_level"
  | "schedule"
  | "communication"
  | "dance_style";

export type MemberCompatibilityProfile = {
  id: string;
  memberName: string;
  dimensions: Record<CompatibilityDimension, number>;
  createdAt: string;
};

export type CompatibilityPairResult = {
  memberA: string;
  memberB: string;
  overallScore: number;
  dimensionScores: Record<CompatibilityDimension, number>;
};

// ============================================
// Member Leave (멤버 휴가 관리)
// ============================================

export type MemberLeaveReason =
  | "health"
  | "travel"
  | "personal"
  | "academic"
  | "work"
  | "other";

export type MemberLeaveStatus =
  | "applied"
  | "approved"
  | "active"
  | "completed"
  | "rejected";

export type MemberLeaveEntry = {
  id: string;
  memberName: string;
  reason: MemberLeaveReason;
  reasonDetail: string;
  startDate: string;
  endDate: string;
  status: MemberLeaveStatus;
  approvedBy?: string;
  appliedAt: string;
  createdAt: string;
};

// ============================================
// Dance Genre Explorer (장르 탐색기)
// ============================================

export type DanceGenreType =
  | "hiphop"
  | "kpop"
  | "ballet"
  | "jazz"
  | "contemporary"
  | "latin"
  | "waacking"
  | "locking"
  | "popping"
  | "breaking"
  | "other";

export type GenreExplorerEntry = {
  id: string;
  genre: DanceGenreType;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  recommendedSongs: string[];
  tips: string[];
  addedBy: string;
  createdAt: string;
};

export type GenreMemberInterest = {
  id: string;
  memberName: string;
  genre: DanceGenreType;
  experienceLevel: 1 | 2 | 3 | 4 | 5;
  interest: boolean;
};

// ============================================
// Return Onboarding (복귀 온보딩)
// ============================================

export type OnboardingCheckItemCategory =
  | "choreography"
  | "schedule"
  | "rule_change"
  | "member_change"
  | "equipment"
  | "other";

export type OnboardingCheckItem = {
  id: string;
  category: OnboardingCheckItemCategory;
  title: string;
  description: string;
  createdAt: string;
};

export type MemberOnboardingSession = {
  id: string;
  memberName: string;
  startDate: string;
  items: {
    itemId: string;
    checked: boolean;
    checkedAt?: string;
  }[];
  completedAt?: string;
  notes: string;
  createdAt: string;
};

// ============================================
// Member Goal Entry (멤버 목표 설정)
// ============================================

export type MemberGoalCategory =
  | "technique"
  | "flexibility"
  | "stamina"
  | "performance"
  | "attendance"
  | "leadership"
  | "other";

export type MemberGoalPriority = "high" | "medium" | "low";

export type MemberGoalEntry = {
  id: string;
  memberName: string;
  category: MemberGoalCategory;
  title: string;
  description: string;
  priority: MemberGoalPriority;
  targetDate: string;
  progress: number;
  milestones: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  status: "active" | "completed" | "abandoned";
  createdAt: string;
};

// ============================================
// Group Announcement Entry (그룹 공지 보드)
// ============================================

export type AnnouncementPriority = "urgent" | "important" | "normal";

export type GroupAnnouncementEntry = {
  id: string;
  title: string;
  content: string;
  author: string;
  priority: AnnouncementPriority;
  pinned: boolean;
  readBy: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Lighting Cue Sheet (무대 조명 큐시트)
// ============================================

export type LightingCueAction =
  | "on"
  | "off"
  | "fade_in"
  | "fade_out"
  | "color_change"
  | "strobe"
  | "spotlight"
  | "blackout";

export type LightingCueColor =
  | "white"
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "pink"
  | "warm"
  | "cool";

export type LightingCueEntry = {
  id: string;
  cueNumber: number;
  timestamp: string;
  action: LightingCueAction;
  color?: LightingCueColor;
  intensity: number;
  zone: string;
  notes?: string;
  createdAt: string;
};

// ============================================
// Attendance Exception (연습 출결 예외)
// ============================================

export type AttendanceExceptionType =
  | "late"
  | "early_leave"
  | "excused"
  | "sick"
  | "personal"
  | "emergency";

export type AttendanceExceptionEntry = {
  id: string;
  memberName: string;
  date: string;
  type: AttendanceExceptionType;
  reason: string;
  duration?: number;
  approvedBy?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

// ============================================
// Show Review (공연 리뷰 수집)
// ============================================

export type ShowReviewSource = "audience" | "member" | "judge" | "instructor";

export type ShowReviewEntry = {
  id: string;
  reviewerName: string;
  source: ShowReviewSource;
  rating: number;
  choreographyRating: number;
  stagePresenceRating: number;
  teamworkRating: number;
  comment: string;
  highlights: string[];
  improvements: string[];
  createdAt: string;
};

// ============================================
// Formation Note (동선 노트)
// ============================================

export type FormationNotePosition = {
  memberName: string;
  x: number;
  y: number;
};

export type FormationSnapshot = {
  id: string;
  name: string;
  timestamp: string;
  positions: FormationNotePosition[];
  notes?: string;
  createdAt: string;
};

export type FormationNoteData = {
  snapshots: FormationSnapshot[];
};

// ============================================
// Member Badge System (멤버 뱃지 시스템)
// ============================================

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: BadgeRarity;
  category: string;
  createdAt: string;
};

export type MemberBadgeAward = {
  id: string;
  badgeId: string;
  memberName: string;
  awardedBy: string;
  reason: string;
  awardedAt: string;
};

// ============================================
// Receipt Management (비용 영수증 관리)
// ============================================

export type ReceiptCategory =
  | "venue"
  | "costume"
  | "equipment"
  | "food"
  | "transport"
  | "marketing"
  | "other";

export type ReceiptStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "reimbursed";

export type ReceiptEntry = {
  id: string;
  title: string;
  amount: number;
  category: ReceiptCategory;
  date: string;
  submittedBy: string;
  status: ReceiptStatus;
  approvedBy?: string;
  receiptNumber?: string;
  vendor?: string;
  notes?: string;
  createdAt: string;
};

// ============================================
// Group Vote (그룹 투표)
// ============================================

export type GroupVoteType = "single" | "multiple" | "ranking";
export type GroupVoteStatus = "draft" | "active" | "closed";

export type GroupVoteOption = {
  id: string;
  label: string;
  voteCount: number;
};

export type GroupVoteBallot = {
  voterName: string;
  selectedOptionIds: string[];
  rankedOptionIds?: string[];
  votedAt: string;
};

export type GroupVoteEntry = {
  id: string;
  title: string;
  description: string;
  type: GroupVoteType;
  status: GroupVoteStatus;
  options: GroupVoteOption[];
  ballots: GroupVoteBallot[];
  anonymous: boolean;
  deadline?: string;
  createdBy: string;
  createdAt: string;
};

// ============================================
// Peer Scoring (피어 점수)
// ============================================

export type PeerScoreDimension = "timing" | "expression" | "energy" | "technique" | "teamwork";

export type PeerScoreEntry = {
  id: string;
  targetName: string;
  scorerName: string;
  dimension: PeerScoreDimension;
  score: number;
  comment: string;
  sessionDate: string;
  createdAt: string;
};

export type PeerScoreSummary = {
  targetName: string;
  avgScore: number;
  dimensionAvgs: Record<PeerScoreDimension, number>;
  totalRatings: number;
};

// ============================================
// Culture Alignment (문화 맞춤도)
// ============================================

export type CultureDimension = "teamwork" | "creativity" | "discipline" | "fun" | "growth";

export type CultureProfile = {
  id: string;
  memberName: string;
  scores: Record<CultureDimension, number>;
  updatedAt: string;
};

export type GroupCultureConfig = {
  idealScores: Record<CultureDimension, number>;
  profiles: CultureProfile[];
  createdAt: string;
};

// ============================================
// Growth Trajectory (성장 궤적)
// ============================================

export type GrowthDimension = "skill" | "attendance" | "leadership" | "creativity" | "collaboration";

export type GrowthDataPoint = {
  month: string;
  scores: Record<GrowthDimension, number>;
};

export type GrowthTrajectory = {
  id: string;
  memberName: string;
  dataPoints: GrowthDataPoint[];
  goal: number;
  trend: "rising" | "steady" | "declining";
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Music Cuesheet (음악 큐시트)
// ============================================

export type CueAction = "play" | "fade_in" | "fade_out" | "stop" | "transition";

export type CueEntry = {
  id: string;
  order: number;
  songTitle: string;
  artist: string;
  startTime: string;
  duration: string;
  action: CueAction;
  note: string;
  volume: number;
};

export type MusicCuesheet = {
  id: string;
  title: string;
  entries: CueEntry[];
  totalDuration: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Role Rotation (역할 로테이션)
// ============================================

export type RotationRole = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export type RotationAssignment = {
  id: string;
  roleId: string;
  memberName: string;
  weekStart: string;
  completed: boolean;
};

export type RoleRotationConfig = {
  roles: RotationRole[];
  members: string[];
  assignments: RotationAssignment[];
  rotationWeeks: number;
  createdAt: string;
};

// ============================================
// Ticket Management (Legacy - TicketConfig)
// ============================================

export type TicketTier = "vip" | "general" | "student" | "free";

export type TicketReservation = {
  id: string;
  buyerName: string;
  buyerContact: string;
  tier: TicketTier;
  quantity: number;
  totalPrice: number;
  isPaid: boolean;
  reservedAt: string;
  note: string;
};

export type TicketConfig = {
  id: string;
  eventName: string;
  eventDate: string;
  tiers: { tier: TicketTier; price: number; capacity: number }[];
  reservations: TicketReservation[];
  createdAt: string;
};

// ============================================
// Video Feedback (영상 피드백)
// ============================================

export type VideoFeedbackTimestamp = {
  id: string;
  time: string;
  authorName: string;
  comment: string;
  category: "praise" | "correction" | "question" | "idea";
  createdAt: string;
};

export type VideoFeedbackItem = {
  id: string;
  title: string;
  videoUrl: string;
  timestamps: VideoFeedbackTimestamp[];
  createdAt: string;
};

// ============================================
// Attendance Streak (출결 스트릭)
// ============================================

export type StreakRecord = {
  date: string;
  attended: boolean;
};

export type MemberStreak = {
  id: string;
  memberName: string;
  records: StreakRecord[];
  currentStreak: number;
  longestStreak: number;
  totalAttended: number;
  totalSessions: number;
};

// ============================================
// Impression Wall (소감 벽)
// ============================================

export type ImpressionMood = "happy" | "proud" | "tired" | "excited" | "grateful" | "reflective";

export type ImpressionPost = {
  id: string;
  authorName: string;
  content: string;
  mood: ImpressionMood;
  likes: number;
  eventTitle: string;
  createdAt: string;
};

// ============================================
// Performance Checkin (공연 체크인)
// ============================================

export type CheckinStatus = "pending" | "arrived" | "costume_ready" | "stage_ready";

export type CheckinMember = {
  id: string;
  memberName: string;
  status: CheckinStatus;
  arrivedAt?: string;
  costumeNote: string;
  isReady: boolean;
};

export type PerformanceCheckinEvent = {
  id: string;
  eventName: string;
  eventDate: string;
  callTime: string;
  members: CheckinMember[];
  createdAt: string;
};

// ============================================
// Group Wishlist (그룹 위시리스트)
// ============================================

export type WishCategory = "song" | "performance" | "event" | "workshop" | "other";
export type WishPriority = "high" | "medium" | "low";

export type WishlistItem = {
  id: string;
  title: string;
  description: string;
  category: WishCategory;
  priority: WishPriority;
  proposedBy: string;
  votes: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
};

// ============================================
// Session Rating (세션 레이팅)
// ============================================

export type SessionRatingEntry = {
  id: string;
  sessionDate: string;
  sessionTitle: string;
  raterName: string;
  satisfaction: number;
  efficiency: number;
  difficulty: number;
  comment: string;
  createdAt: string;
};

export type SessionRatingAvg = {
  sessionDate: string;
  sessionTitle: string;
  avgSatisfaction: number;
  avgEfficiency: number;
  avgDifficulty: number;
  ratingCount: number;
};

// ============================================
// Contribution Board (기여도 보드)
// ============================================

export type ContributionType = "teaching" | "organizing" | "choreography" | "music" | "logistics" | "mentoring" | "other";

export type ContributionRecord = {
  id: string;
  memberName: string;
  type: ContributionType;
  description: string;
  points: number;
  date: string;
  awardedBy: string;
  createdAt: string;
};

export type ContributionSummary = {
  memberName: string;
  totalPoints: number;
  typeBreakdown: Record<ContributionType, number>;
  recordCount: number;
};

// ============================================
// Practice Notes (연습 노트 공유)
// ============================================

export type PracticeNoteTag =
  | "improvement"
  | "issue"
  | "achievement"
  | "reminder"
  | "technique"
  | "general";

export type PracticeNoteComment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type PracticeNoteEntry = {
  id: string;
  date: string;
  title: string;
  content: string;
  author: string;
  tags: PracticeNoteTag[];
  comments: PracticeNoteComment[];
  isPinned: boolean;
  createdAt: string;
};

export type SharedPracticeNote = PracticeNoteEntry;

// ============================================
// Attendance Heatmap (출석 히트맵)
// ============================================

export type HeatmapDayData = {
  date: string;
  count: number;
  activities: string[];
};

export type AttendanceHeatmapData = {
  memberName: string;
  year: number;
  days: HeatmapDayData[];
  totalActiveDays: number;
  longestStreak: number;
};

// ============================================
// Practice Queue (연습 플레이리스트 큐)
// ============================================

export type QueueItemStatus = "pending" | "playing" | "done" | "skipped";

export type PracticeQueueItem = {
  id: string;
  songTitle: string;
  artist: string;
  duration: string;
  repeatCount: number;
  status: QueueItemStatus;
  order: number;
  note: string;
};

export type PracticeQueue = {
  id: string;
  name: string;
  items: PracticeQueueItem[];
  currentIndex: number;
  createdAt: string;
};

// ============================================
// Social Graph (소셜 그래프)
// ============================================

export type SocialRelationType = "friend" | "practice_partner" | "mentor" | "rival";

export type SocialRelation = {
  id: string;
  member1: string;
  member2: string;
  relationType: SocialRelationType;
  strength: number;
  since: string;
  note: string;
  createdAt: string;
};

// ============================================
// Decision Poll (의사결정 투표)
// ============================================

export type PollVoteChoice = "agree" | "disagree" | "abstain";

export type PollVote = {
  id: string;
  voterName: string;
  choice: PollVoteChoice;
  reason: string;
  createdAt: string;
};

export type DecisionPoll = {
  id: string;
  topic: string;
  description: string;
  deadline: string;
  votes: PollVote[];
  isClosed: boolean;
  result?: PollVoteChoice;
  createdAt: string;
};

// ============================================
// Focus Timer (집중 모드 타이머)
// ============================================

export type FocusTimerPhase = "focus" | "short_break" | "long_break";

export type FocusTimerSession = {
  id: string;
  date: string;
  focusMinutes: number;
  breakMinutes: number;
  completedCycles: number;
  totalFocusTime: number;
  note: string;
  createdAt: string;
};

export type FocusTimerConfig = {
  focusDuration: number;
  shortBreak: number;
  longBreak: number;
  cyclesBeforeLongBreak: number;
};

// ============================================
// Event Calendar (이벤트 캘린더)
// ============================================

export type CalendarEventType = "practice" | "performance" | "meeting" | "workshop" | "social" | "other";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  type: CalendarEventType;
  location: string;
  description: string;
  createdAt: string;
};

// ============================================
// Seating Chart (좌석 배치도)
// ============================================

export type SeatStatus = "available" | "reserved" | "blocked";

export type SeatInfo = {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
  reservedBy: string;
  tier: "vip" | "standard" | "economy";
};

export type SeatingChart = {
  id: string;
  eventName: string;
  rows: number;
  seatsPerRow: number;
  seats: SeatInfo[];
  createdAt: string;
};

// ============================================
// Show Timeline (공연 타임라인)
// ============================================

export type ShowMilestoneStatus = "pending" | "in_progress" | "completed" | "delayed";

export type ShowMilestone = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: ShowMilestoneStatus;
  assignee: string;
  completedAt?: string;
  order: number;
};

export type ShowTimeline = {
  id: string;
  showName: string;
  showDate: string;
  milestones: ShowMilestone[];
  createdAt: string;
};

// ============================================
// Skill Matrix (스킬 매트릭스)
// ============================================

export type SkillMatrixLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type SkillMatrixEntry = {
  memberName: string;
  skills: Record<string, SkillMatrixLevel>;
};

export type SkillMatrixConfig = {
  skillNames: string[];
  entries: SkillMatrixEntry[];
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Member Quiz (멤버 퀴즈)
// ============================================

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  aboutMember: string;
  createdBy: string;
};

export type QuizAttempt = {
  id: string;
  playerName: string;
  answers: { questionId: string; selectedIndex: number; isCorrect: boolean }[];
  score: number;
  totalQuestions: number;
  completedAt: string;
};

export type MemberQuizData = {
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  createdAt: string;
};

// ============================================
// Anonymous Feedback (익명 피어 피드백)
// ============================================

export type FeedbackCategory = "praise" | "encouragement" | "improvement" | "other";

export type AnonymousFeedback = {
  id: string;
  groupId: string;
  targetUserId: string;
  senderId: string;
  category: FeedbackCategory;
  content: string;
  createdAt: string;
};

// ============================================
// Skill Self Evaluation (스킬 자가 평가)
// ============================================

export type SkillCertLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert"
  | "master";

export type SkillCertDefinition = {
  id: string;
  skillName: string;
  description: string;
  category: string;
  level: SkillCertLevel;
  requirements: string[];
  createdAt: string;
};

export type SkillCertAward = {
  id: string;
  certId: string;
  memberName: string;
  certifiedBy: string;
  certifiedAt: string;
  notes?: string;
};

// ============================================
// Member Schedule Preference (멤버 스케줄 선호도)
// ============================================

export type WeekDayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type TimeSlotPreference = "available" | "preferred" | "unavailable";

export type TimeSlotEntry = {
  day: WeekDayIndex;
  startHour: number;
  endHour: number;
  preference: TimeSlotPreference;
};

export type MemberSchedulePreference = {
  id: string;
  memberName: string;
  preferences: TimeSlotEntry[];
  updatedAt: string;
  createdAt: string;
};

export type OptimalSlotResult = {
  day: WeekDayIndex;
  startHour: number;
  endHour: number;
  availableCount: number;
  preferredCount: number;
  score: number;
};

// ============================================
// Growth Journal (멤버 성장 일지)
// ============================================

export type GrowthJournalMood =
  | "motivated"
  | "confident"
  | "neutral"
  | "struggling"
  | "discouraged";

export type GrowthArea =
  | "테크닉"
  | "표현력"
  | "체력"
  | "리더십"
  | "협동심"
  | "자신감";

export type GrowthJournalEntry = {
  id: string;
  memberName: string;
  date: string;
  title: string;
  content: string;
  mood: GrowthJournalMood;
  skillsPracticed: string[];
  achievementsToday: string[];
  challengesFaced: string[];
  nextGoals: string[];
  selfRating: number;
  area?: GrowthArea;
  level?: number;
  createdAt: string;
  updatedAt?: string;
};

export type GrowthJournalData = {
  groupId: string;
  entries: GrowthJournalEntry[];
  updatedAt: string;
};

// ============================================
// Dance Glossary New (댄스 용어 사전 - SWR+localStorage)
// ============================================

export type GlossaryCategoryNew =
  | "basic"
  | "technique"
  | "formation"
  | "rhythm"
  | "style"
  | "stage"
  | "other";

export type DanceGlossaryEntry = {
  id: string;
  term: string;
  definition: string;
  category: GlossaryCategoryNew;
  relatedTerms: string[];
  example?: string;
  addedBy: string;
  createdAt: string;
};

// ============================================
// Venue Review Entry (연습 장소 리뷰)
// ============================================

export type VenueReviewEntry = {
  id: string;
  venueName: string;
  address?: string;
  rating: number;
  floorRating: number;
  mirrorRating: number;
  soundRating: number;
  accessRating: number;
  pricePerHour?: number;
  capacity?: number;
  pros: string[];
  cons: string[];
  comment?: string;
  reviewedBy: string;
  visitDate: string;
  createdAt: string;
};

// ============================================
// Set List Item (공연 세트리스트)
// ============================================

export type SetListItemType =
  | "performance"
  | "mc_talk"
  | "intermission"
  | "opening"
  | "closing"
  | "encore";

export type SetListItem = {
  id: string;
  order: number;
  type: SetListItemType;
  title: string;
  artist?: string;
  duration: number;
  performers: string[];
  notes?: string;
  transitionNote?: string;
  createdAt: string;
};

// ============================================
// Meeting Minutes Entry (그룹 회의록)
// ============================================

export type MeetingMinutesType =
  | "regular"
  | "emergency"
  | "planning"
  | "review"
  | "other";

export type MeetingActionItem = {
  assignee: string;
  task: string;
  deadline?: string;
};

export type MeetingAgendaItem = {
  id: string;
  title: string;
  discussion: string;
  decision?: string;
  actionItems: MeetingActionItem[];
};

export type MeetingMinutesEntry = {
  id: string;
  title: string;
  type: MeetingMinutesType;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: string[];
  absentees: string[];
  recorder: string;
  agendaItems: MeetingAgendaItem[];
  generalNotes?: string;
  nextMeetingDate?: string;
  createdAt: string;
};

// ============================================
// Choreo Section Analysis (안무 구간 분석)
// ============================================

export type ChoreoSectionDifficulty = 1 | 2 | 3 | 4 | 5;

export type ChoreoSectionEntry = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  difficulty: ChoreoSectionDifficulty;
  completionRate: number;
  keyMoves: string[];
  assignedMembers: string[];
  notes?: string;
  order: number;
  createdAt: string;
};

// ============================================
// Personal Schedule Conflict (그룹 일정 충돌 감지)
// ============================================

export type PersonalScheduleType =
  | "work"
  | "school"
  | "appointment"
  | "travel"
  | "family"
  | "other";

export type PersonalScheduleEntry = {
  id: string;
  memberName: string;
  title: string;
  type: PersonalScheduleType;
  date: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  recurringDay?: number;
  createdAt: string;
};

export type ScheduleConflictResult = {
  memberName: string;
  personalSchedule: PersonalScheduleEntry;
  conflictDate: string;
  overlapMinutes: number;
};

// ============================================
// Backstage Check (공연 백스테이지 체크)
// ============================================

export type BackstageCategory =
  | "sound"
  | "lighting"
  | "costume"
  | "props"
  | "safety"
  | "communication"
  | "other";

export type BackstageCheckItem = {
  id: string;
  category: BackstageCategory;
  title: string;
  description?: string;
  assignedTo?: string;
  checked: boolean;
  checkedAt?: string;
  checkedBy?: string;
  priority: "high" | "medium" | "low";
  order: number;
  createdAt: string;
};

export type BackstageCheckSession = {
  id: string;
  eventName: string;
  eventDate: string;
  items: BackstageCheckItem[];
  startedAt: string;
  completedAt?: string;
  notes?: string;
};

// ============================================
// Show Inventory (공연 물품 목록)
// ============================================

export type ShowInventoryCategory =
  | "costume"
  | "prop"
  | "tech"
  | "music"
  | "document"
  | "first_aid"
  | "other";

export type ShowInventoryItem = {
  id: string;
  name: string;
  category: ShowInventoryCategory;
  quantity: number;
  assignedTo?: string;
  packed: boolean;
  packedBy?: string;
  packedAt?: string;
  notes?: string;
  priority: "essential" | "important" | "optional";
  createdAt: string;
};

// ============================================
// Emergency Contact (멤버 긴급 연락처)
// ============================================

export type EmergencyContactBloodType =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-"
  | "unknown";

export type EmergencyContactRelation =
  | "parent"
  | "spouse"
  | "sibling"
  | "friend"
  | "guardian"
  | "other";

export type EmergencyContactPerson = {
  id: string;
  name: string;
  relation: EmergencyContactRelation;
  phone: string;
  note?: string;
};

export type EmergencyContactEntry = {
  id: string;
  groupId: string;
  memberName: string;
  memberPhone?: string;
  contactName: string;
  relation: EmergencyContactRelation;
  phone: string;
  email?: string;
  notes?: string;
  bloodType: EmergencyContactBloodType;
  allergies?: string;
  medicalNotes?: string;
  insuranceInfo?: string;
  extraContacts?: EmergencyContactPerson[];
  createdAt: string;
  updatedAt?: string;
};

// ============================================
// Practice Feedback (연습 피드백)
// ============================================

export type PracticeFeedbackMood =
  | "great"
  | "good"
  | "okay"
  | "tired"
  | "frustrated";

export type PracticeFeedbackEntry = {
  id: string;
  memberName: string;
  date: string;
  mood: PracticeFeedbackMood;
  energyLevel: number;
  focusLevel: number;
  enjoymentLevel: number;
  learnedToday?: string;
  wantToImprove?: string;
  generalComment?: string;
  createdAt: string;
};

// ============================================
// Group Rules (그룹 규칙 관리)
// ============================================

export type GroupRuleCategory =
  | "attendance"
  | "behavior"
  | "finance"
  | "performance"
  | "communication"
  | "general";

export type GroupRuleEntry = {
  id: string;
  category: GroupRuleCategory;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupRuleAcknowledgment = {
  id: string;
  ruleId: string;
  memberName: string;
  acknowledgedAt: string;
};

// ============================================
// Mastercurve Entry (안무 습득 곡선)
// ============================================

export type MasteryCheckpoint = {
  date: string;
  progress: number;
  note: string;
};

export type MasteryCurveEntry = {
  id: string;
  choreographyName: string;
  targetDate: string;
  checkpoints: MasteryCheckpoint[];
  currentProgress: number;
  createdAt: string;
};

// ============================================
// Readiness Checklist (공연 준비도)
// ============================================

export type ReadinessCategory = "choreography" | "costume" | "music" | "stage" | "logistics" | "other";

export type ReadinessCheckItem = {
  id: string;
  category: ReadinessCategory;
  title: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  note: string;
};

export type ReadinessChecklist = {
  id: string;
  eventName: string;
  eventDate: string;
  items: ReadinessCheckItem[];
  createdAt: string;
};

// ============================================
// Weekly Timetable (주간 시간표)
// ============================================

export type TimetableDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type TimetableSlotType = "practice" | "personal" | "meeting" | "performance" | "rest" | "other";

export type TimetableSlot = {
  id: string;
  day: TimetableDay;
  startTime: string;
  endTime: string;
  type: TimetableSlotType;
  title: string;
  location: string;
  color: string;
  note: string;
};

// ============================================
// Venue Entry (연습 장소 리뷰)
// ============================================

export type VenueFeature = "mirror" | "sound" | "parking" | "aircon" | "floor" | "shower" | "wifi" | "storage";

export type VenueEntry = {
  id: string;
  name: string;
  address: string;
  hourlyRate: number;
  features: VenueFeature[];
  note: string;
  createdAt: string;
};

export type VenueReview = {
  id: string;
  venueId: string;
  reviewerName: string;
  rating: number;
  pros: string;
  cons: string;
  createdAt: string;
};

// ============================================
// Performance Retro (공연 회고)
// ============================================

export type RetroCategory = "keep" | "problem" | "try";

export type RetroItem = {
  id: string;
  category: RetroCategory;
  content: string;
  authorName: string;
  votes: number;
  createdAt: string;
};

export type PerformanceRetro = {
  id: string;
  performanceTitle: string;
  performanceDate: string;
  overallRating: number;
  items: RetroItem[];
  actionItems: string[];
  createdAt: string;
};

// ============================================
// Equipment Inventory (장비 인벤토리 관리)
// ============================================

export type EquipmentCondition = "excellent" | "good" | "fair" | "poor" | "broken";

export type EquipmentItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: EquipmentCondition;
  location: string;
  lastCheckedAt: string;
  note: string;
  createdAt: string;
};

export type EquipmentCheckout = {
  id: string;
  equipmentId: string;
  borrowerName: string;
  borrowedAt: string;
  expectedReturn: string;
  returnedAt?: string;
  note: string;
};

// ============================================
// Dance Challenge (댄스 챌린지)
// ============================================

export type ChallengeCategory = "technique" | "freestyle" | "cover" | "flexibility" | "endurance" | "creativity";

export type ChallengeParticipant = {
  id: string;
  name: string;
  progress: number;
  completedAt?: string;
  note: string;
};

export type DanceChallenge = {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  startDate: string;
  endDate: string;
  targetCount: number;
  participants: ChallengeParticipant[];
  reward: string;
  status: "upcoming" | "active" | "ended";
  createdAt: string;
};

// ============================================
// Onboarding Checkin (새 멤버 온보딩 체크인)
// ============================================

export type MemberIntroCardData = {
  userId: string;
  name: string;
  joinReason: string;
  mainPart: string;
  favoriteGenre: string;
  oneWord: string;
  updatedAt: string;
};

// ============================================
// Group Noticeboard (그룹 게시판 - localStorage 기반)
// ============================================

export const NOTICEBOARD_POST_CATEGORIES = ["자유", "질문", "정보공유", "후기"] as const;
export type NoticeboardPostCategory = (typeof NOTICEBOARD_POST_CATEGORIES)[number];

export type NoticeboardComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export type NoticeboardPost = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  category: NoticeboardPostCategory;
  comments: NoticeboardComment[];
};

export type NoticeboardData = {
  posts: NoticeboardPost[];
};

export const NOTICEBOARD_STORAGE_KEY = "group-noticeboard" as const;

export const DEFAULT_NOTICEBOARD_DATA: NoticeboardData = {
  posts: [],
};

// ============================================
// Practice Journal (연습 일지)
// ============================================


export type JournalCondition = "excellent" | "good" | "normal" | "tired" | "bad";

export type PracticeJournalEntry = {
  id: string;
  date: string;          // YYYY-MM-DD
  title: string;         // 제목 (최대 50자)
  learned: string;       // 배운 점
  improvement: string;   // 개선할 점
  feeling: string;       // 느낀 점
  condition: JournalCondition;
  tags: string[];        // "힙합", "스트레칭" 등
  createdAt: string;
};


// ============================================
// Music Tempo Matching (음악 템포 매칭)
// ============================================


export type TempoCategory = "very_slow" | "slow" | "moderate" | "fast" | "very_fast";

export type MusicTempoEntry = {
  id: string;
  songTitle: string;
  artist: string;
  bpm: number;            // 40-240
  tempoCategory: TempoCategory;
  sections: TempoSection[];
  note: string;
  createdAt: string;
};

export type TempoSection = {
  label: string;         // "인트로", "버스", "코러스" 등
  bpm: number;
  startTime: string;     // "0:00" 형식
};


// ============================================
// Digital Waiver Management (디지털 동의서 관리)
// ============================================


export type WaiverType = "safety" | "activity" | "photo" | "liability" | "custom";

export type WaiverTemplate = {
  id: string;
  title: string;
  type: WaiverType;
  content: string;         // 동의서 본문 (최대 2000자)
  required: boolean;       // 필수 동의 여부
  expiresInDays?: number;  // 유효기간 (일 단위, 선택)
  createdAt: string;
};

export type WaiverSignature = {
  id: string;
  waiverId: string;
  memberId: string;
  memberName: string;
  signedAt: string;
  expiresAt?: string;      // 만료일
};

export type WaiverStore = {
  templates: WaiverTemplate[];
  signatures: WaiverSignature[];
  updatedAt: string;
};

export type InspirationMediaType = "video" | "image" | "article" | "quote" | "idea";

export type InspirationTag = string;

export type InspirationCategory =
  | "choreography"
  | "music"
  | "fashion"
  | "stage_design"
  | "artwork"
  | "other";

export type InspirationBoardItem = {
  id: string;
  title: string;
  mediaType: InspirationMediaType;
  /** 댄스 영감 카테고리 */
  category: InspirationCategory;
  url?: string;
  content: string;
  tags: InspirationTag[];
  isFavorite: boolean;
  source?: string;
  createdAt: string;
};

export type InspirationBoardData = {
  memberId: string;
  items: InspirationBoardItem[];
  updatedAt: string;
};

export type VipGuestTier = "VVIP" | "VIP" | "general";

export type VipGuestStatus =
  | "pending"
  | "invited"
  | "confirmed"
  | "declined";

export type VipGuestEntry = {
  /** 고유 식별자 */
  id: string;
  /** 이름 */
  name: string;
  /** 소속 (기관/단체명) */
  organization?: string;
  /** 직함 */
  title?: string;
  /** 연락처 */
  phone?: string;
  /** 이메일 */
  email?: string;
  /** 게스트 등급 */
  tier: VipGuestTier;
  /** 초대 상태 */
  status: VipGuestStatus;
  /** 좌석 구역 */
  seatZone?: string;
  /** 좌석 번호 */
  seatNumber?: string;
  /** 특별 요청 사항 */
  specialRequest?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type VipGuestStore = {
  groupId: string;
  projectId: string;
  entries: VipGuestEntry[];
  updatedAt: string;
};

export type AttendanceDashStatus = "present" | "late" | "absent" | "excused";

export type AttendanceDashRecord = {
  id: string;
  memberName: string;
  date: string;
  status: AttendanceDashStatus;
  notes?: string;
};

export type AttendanceDashSummary = {
  memberName: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
};

export type MusicQueueTrack = {
  id: string;
  title: string;
  artist?: string;
  durationSeconds: number;
  bpm?: number;
  genre?: string;
  notes?: string;
};

export type MusicQueueSet = {
  id: string;
  setName: string;
  tracks: MusicQueueTrack[];
  totalDuration: number;
  isActive: boolean;
  createdAt: string;
};

export type SharedLibFileType =
  | "document"
  | "spreadsheet"
  | "presentation"
  | "video"
  | "audio"
  | "image"
  | "link"
  | "other";

export type SharedLibItem = {
  id: string;
  title: string;
  fileType: SharedLibFileType;
  url?: string;
  description?: string;
  category: string;
  uploadedBy: string;
  tags: string[];
  downloadCount: number;
  isPinned: boolean;
  createdAt: string;
};


// ============================================================
// 멤버 댄스 스타일 프로필
// ============================================================


export type DanceStyleLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type DanceStyleEntry = {
  style: string;
  level: DanceStyleLevel;
  yearsOfExperience: number;
  isFavorite: boolean;
};

export type MemberDanceStyleProfile = {
  id: string;
  memberId: string;
  styles: DanceStyleEntry[];
  strengths: string[];
  weaknesses: string[];
  goals: string[];
  influences: string[];
  bio?: string;
  updatedAt: string;
};


// ============================================================
// 공연 무대 전환 계획 (레거시 타입 - 내부 전용)

type StageTransitionTaskLegacy = {
  id: string;
  description: string;
  assignee?: string;
  durationSeconds: number;
  isCompleted: boolean;
};

export type StageTransitionEntry = {
  id: string;
  fromScene: string;
  toScene: string;
  transitionOrder: number;
  tasks: StageTransitionTaskLegacy[];
  totalDuration: number;
  notes?: string;
  lightingChange?: string;
  musicChange?: string;
  propsNeeded: string[];
  createdAt: string;
};

export type AttendanceForecastIntent = "yes" | "maybe" | "no" | "pending";

export type AttendanceForecastResponse = {
  memberName: string;
  intent: AttendanceForecastIntent;
  reason?: string;
  respondedAt: string;
};

export type AttendanceForecastSession = {
  id: string;
  date: string;
  time?: string;
  title: string;
  location?: string;
  responses: AttendanceForecastResponse[];
  createdBy: string;
  createdAt: string;
};


// ============================================================
// 공연 협찬품 관리
// ============================================================


export type SponsoredGoodsStatus =
  | "pending"
  | "received"
  | "distributed"
  | "returned";

export type SponsoredGoodsDistribution = {
  memberName: string;
  quantity: number;
  distributedAt: string;
};

export type SponsoredGoodsItem = {
  id: string;
  itemName: string;
  sponsor: string;
  quantity: number;
  status: SponsoredGoodsStatus;
  estimatedValue?: number;
  receivedDate?: string;
  returnDueDate?: string;
  distributions: SponsoredGoodsDistribution[];
  category?: string;
  notes?: string;
  createdAt: string;
};


// ============================================================
// 멤버 댄스 포트폴리오
// ============================================================


export type PortfolioEntryType =
  | "performance"
  | "competition"
  | "workshop"
  | "collaboration"
  | "solo";

export type PortfolioAward = {
  title: string;
  rank?: string;
  date: string;
};

export type DancePortfolioEntry = {
  id: string;
  type: PortfolioEntryType;
  title: string;
  date: string;
  venue?: string;
  role?: string;
  genre?: string;
  description?: string;
  awards: PortfolioAward[];
  highlights: string[];
  createdAt: string;
};


// ============================================================
// 공연 관객 좌석 예약
// ============================================================


export type SeatReservationStatus =
  | "available"
  | "reserved"
  | "occupied"
  | "blocked";

export type SeatReservationEntry = {
  id: string;
  seatLabel: string;
  row: string;
  number: number;
  status: SeatReservationStatus;
  reservedBy?: string;
  reservedFor?: string;
  phone?: string;
  notes?: string;
  reservedAt?: string;
};

export type SeatReservationLayout = {
  id: string;
  projectId: string;
  layoutName: string;
  rows: number;
  seatsPerRow: number;
  seats: SeatReservationEntry[];
  createdAt: string;
};


// ============================================================
// 그룹 팀빌딩 활동
// ============================================================


export type TeamBuildingCategory =
  | "ice_breaker"
  | "trust"
  | "creativity"
  | "communication"
  | "party"
  | "outdoor"
  | "other";

export type TeamBuildingParticipant = {
  memberName: string;
  feedback?: string;
  rating?: number; // 1-5
};

export type TeamBuildingEvent = {
  id: string;
  title: string;
  category: TeamBuildingCategory;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  organizer: string;
  /** 소요 시간 (분) */
  duration?: number;
  budget?: number;
  participants: TeamBuildingParticipant[];
  maxParticipants?: number;
  isCompleted: boolean;
  photos?: string[];
  createdAt: string;
};


// ============================================================
// 그룹 연습 날씨 알림
// ============================================================


export type WeatherAlertCondition =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "windy"
  | "hot"
  | "cold"
  | "humid";

export type WeatherAlertLevel = "safe" | "caution" | "warning" | "danger";

export type WeatherAlertEntry = {
  id: string;
  date: string;
  condition: WeatherAlertCondition;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  alertLevel: WeatherAlertLevel;
  recommendation: string;
  isOutdoorSafe: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
};


// ============================================================
// 공연 기술 요구사항
// ============================================================


export type TechRequirementCategory =
  | "sound"
  | "lighting"
  | "video"
  | "stage"
  | "power"
  | "communication"
  | "other";

export type TechRequirementPriority =
  | "essential"
  | "important"
  | "nice_to_have";

export type TechRequirementItem = {
  id: string;
  category: TechRequirementCategory;
  title: string;
  description: string;
  priority: TechRequirementPriority;
  quantity?: number;
  isAvailable: boolean;
  supplier?: string;
  estimatedCost?: number;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
};


// ============================================================
// 그룹 공연 히스토리
// ============================================================


export type PerformanceHistoryType =
  | "concert"
  | "competition"
  | "festival"
  | "showcase"
  | "flash_mob"
  | "other";

export type PerformanceHistoryRecord = {
  id: string;
  title: string;
  type: PerformanceHistoryType;
  date: string;
  venue: string;
  audienceCount?: number;
  performers: string[];
  setlist: string[];
  awards?: string[];
  rating?: number;
  highlights?: string;
  lessonsLearned?: string;
  createdAt: string;
};


// ============================================
// 멤버 체중/체형 추적
// ============================================


export type BodyTrackerEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  weight?: number; // kg
  bodyFat?: number; // %
  muscleMass?: number; // kg
  height?: number; // cm
  waist?: number; // cm
  notes?: string;
  createdAt: string;
};


// ============================================================
// 공연 무대 평면도
// ============================================================


export type StageLayoutItemType =
  | "speaker"
  | "light"
  | "prop"
  | "screen"
  | "mic"
  | "camera"
  | "table"
  | "chair"
  | "other";

export type StageLayoutItem = {
  id: string;
  type: StageLayoutItemType;
  label: string;
  x: number; // 0-100 (%)
  y: number; // 0-100 (%)
  width?: number; // 상대 너비 (기본 8)
  height?: number; // 상대 높이 (기본 8)
  rotation?: number; // 도(degree)
  notes?: string;
};

export type StageLayoutPlan = {
  id: string;
  projectId: string;
  planName: string;
  items: StageLayoutItem[];
  stageWidth?: number; // 단위: m
  stageDepth?: number; // 단위: m
  createdAt: string;
};


// ============================================================
// 공연 커튼콜 계획
// ============================================================


export type CurtainCallStep = {
  id: string;
  order: number;
  description: string;
  performers: string[];
  position?: string;
  durationSeconds?: number;
  bowType?: "individual" | "group" | "lead" | "all";
};

export type CurtainCallPlan = {
  id: string;
  projectId: string;
  planName: string;
  steps: CurtainCallStep[];
  musicTrack?: string;
  totalDuration?: number;
  notes?: string;
  createdAt: string;
};

export type MentalWellnessEntry = {
  id: string;
  date: string;
  confidence: number; // 1-10 자신감
  stress: number; // 1-10 스트레스
  motivation: number; // 1-10 동기
  anxiety: number; // 1-10 불안
  overallMood: "great" | "good" | "okay" | "low" | "struggling";
  journalNote?: string;
  copingStrategies?: string[];
  createdAt: string;
};


// ============================================================
// 그룹 대회 준비 체크
// ============================================================


export type CompetitionPrepCategory =
  | "registration"
  | "choreography"
  | "music"
  | "costume"
  | "travel"
  | "documents"
  | "other";

export type CompetitionPrepItem = {
  id: string;
  category: CompetitionPrepCategory;
  task: string;
  assignee?: string;
  dueDate?: string;
  isCompleted: boolean;
  notes?: string;
};

export type CompetitionPrepEvent = {
  id: string;
  competitionName: string;
  date: string;
  location: string;
  category?: string;
  items: CompetitionPrepItem[];
  teamSize?: number;
  registrationDeadline?: string;
  notes?: string;
  createdAt: string;
};

export type SoundcheckChannel = {
  id: string;
  channelNumber: number;
  source: string;
  type: "vocal" | "instrument" | "playback" | "sfx" | "monitor";
  volume: number; // 0-100
  pan?: number; // -100 ~ 100
  eq?: string;
  isChecked: boolean;
  notes?: string;
};

export type SoundcheckSheet = {
  id: string;
  projectId: string;
  sheetName: string;
  channels: SoundcheckChannel[];
  engineer?: string;
  checkDate?: string;
  overallNotes?: string;
  createdAt: string;
};


// ============================================================
// 공연 앵콜 계획
// ============================================================


export type EncoreTriggerCondition =
  | "audience_request"
  | "standing_ovation"
  | "time_available"
  | "planned"
  | "spontaneous";

export type EncoreSong = {
  id: string;
  order: number;
  songTitle: string;
  artist?: string;
  durationSeconds: number;
  performers: string[];
  notes?: string;
};

export type EncorePlan = {
  id: string;
  projectId: string;
  planName: string;
  songs: EncoreSong[];
  triggerCondition: EncoreTriggerCondition;
  maxEncores: number;
  signalCue?: string;
  lightingNotes?: string;
  notes?: string;
  createdAt: string;
};


// ============================================================
// 그룹 연습 비디오 리뷰
// ============================================================


export type VideoReviewTimestampType = "praise" | "correction" | "question" | "note";

export type VideoReviewTimestamp = {
  id: string;
  time: string; // MM:SS 형식
  comment: string;
  author: string;
  type: VideoReviewTimestampType;
  createdAt: string;
};

export type VideoReviewEntry = {
  id: string;
  title: string;
  videoUrl?: string;
  date: string;
  duration?: string;
  description?: string;
  timestamps: VideoReviewTimestamp[];
  overallRating?: number; // 1-5
  reviewedBy: string[];
  createdAt: string;
};


// ============================================================
// 멤버 목표 달성 배지 (Achievement Badges)
// ============================================================


export type AchievementBadgeCategory =
  | "practice"   // 연습
  | "performance" // 공연
  | "teamwork"   // 팀워크
  | "attendance" // 출석
  | "skill"      // 실력
  | "leadership" // 리더십
  | "other";     // 기타

export type AchievementBadgeLevel =
  | "bronze"  // 브론즈
  | "silver"  // 실버
  | "gold";   // 골드

export type AchievementBadgeEntry = {
  id: string;
  memberId: string;
  memberName: string;
  title: string;
  description?: string;
  category: AchievementBadgeCategory;
  level: AchievementBadgeLevel;
  condition?: string;   // 획득 조건 설명
  earnedAt: string;     // ISO 날짜 문자열
  awardedBy?: string;   // 수여자 이름 (선택)
  createdAt: string;
};

export type PracticeVenueFacility =
  | "mirror"      // 거울
  | "sound"       // 음향
  | "parking"     // 주차
  | "shower"      // 샤워실
  | "locker"      // 사물함
  | "aircon"      // 에어컨
  | "heating"     // 난방
  | "piano"       // 피아노
  | "stage"       // 무대
  | "bar";        // 바(연습용 봉)

export type PracticeVenueStatus =
  | "available"   // 예약 가능
  | "booked"      // 예약됨
  | "unavailable" // 이용 불가
  | "unknown";    // 상태 미확인

export type PracticeVenueEntry = {
  id: string;
  name: string;           // 장소명
  address?: string;       // 주소
  phone?: string;         // 전화번호
  website?: string;       // 웹사이트 URL
  costPerHour?: number;   // 시간당 비용 (원)
  capacity?: number;      // 수용 인원
  size?: number;          // 면적 (m²)
  facilities: PracticeVenueFacility[]; // 시설 목록
  status: PracticeVenueStatus;         // 예약 상태
  rating?: number;        // 평점 (1-5)
  ratingCount: number;    // 평점 참여 수
  isFavorite: boolean;    // 즐겨찾기 여부
  memo?: string;          // 메모
  lastUsedAt?: string;    // 마지막 이용일 (ISO date string)
  createdAt: string;      // 생성일 (ISO datetime string)
};


// ============================================================
// 공연 프로그램 편집 (Show Program Editor)
// ============================================================


export type ShowProgramPiece = {
  id: string;
  order: number;           // 순서 인덱스 (1부터)
  title: string;           // 작품/곡명
  subtitle?: string;       // 부제 (선택)
  choreographer?: string;  // 안무가
  performers: string[];    // 출연자 목록
  duration?: string;       // 소요시간 (예: "3분 30초")
  notes?: string;          // 추가 메모
};

export type ShowProgramCreditRole =
  | "director"       // 연출
  | "choreographer"  // 안무
  | "music"          // 음악/음향
  | "lighting"       // 조명
  | "costume"        // 의상
  | "makeup"         // 메이크업
  | "stage"          // 무대 감독
  | "photography"    // 사진/영상
  | "design"         // 디자인
  | "sponsor"        // 후원
  | "other";         // 기타

export type ShowProgramCredit = {
  id: string;
  role: ShowProgramCreditRole;
  roleLabel?: string;  // 역할 커스텀 레이블 (role이 other일 때)
  names: string[];     // 담당자 이름 목록
};

export type ShowProgramSponsor = {
  id: string;
  name: string;        // 스폰서명
  tier?: string;       // 등급 (예: 골드, 실버, 브론즈)
  description?: string;
};

export type ShowProgramEntry = {
  id: string;
  groupId: string;
  projectId: string;
  showTitle: string;            // 공연 제목
  showSubtitle?: string;        // 부제
  showDate?: string;            // 공연 날짜 (ISO)
  venue?: string;               // 공연 장소
  greeting?: string;            // 인사말
  closingMessage?: string;      // 마무리 인사
  pieces: ShowProgramPiece[];   // 프로그램 순서
  credits: ShowProgramCredit[]; // 크레딧
  sponsors: ShowProgramSponsor[]; // 스폰서
  specialThanks?: string;       // 특별 감사
  createdAt: string;
  updatedAt: string;
};


// ============================================================
// 멤버 유연성 테스트 기록
// ============================================================


export type FlexibilityTestItemKey =
  | "sit_and_reach"         // 앉아서 앞으로 굽히기 (cm)
  | "standing_reach"        // 서서 앞으로 굽히기 (cm)
  | "side_split"            // 개각 (도)
  | "front_split"           // 전굴 (도)
  | "shoulder_flexibility"  // 어깨 유연성 (cm)
  | "hip_flexibility"       // 힙 유연성 (도)
  | "spine_flexibility"     // 척추 유연성 (cm)
  | "ankle_flexibility"     // 발목 유연성 (도)
  | "custom";               // 커스텀 항목

export type FlexibilityTestUnit = "cm" | "도" | "mm" | "초" | "회" | "기타";

export type FlexibilityTestItem = {
  id: string;
  key: FlexibilityTestItemKey;
  name: string;              // 표시 이름 (커스텀인 경우 직접 입력)
  unit: FlexibilityTestUnit;
  higherIsBetter: boolean;   // 값이 클수록 좋은지 여부
  targetValue?: number;      // 목표값
  description?: string;      // 항목 설명
};

export type FlexibilityTestEntry = {
  itemId: string;            // FlexibilityTestItem.id
  value: number;             // 측정값
};

export type FlexibilityTestRecord = {
  id: string;
  memberId: string;
  date: string;              // YYYY-MM-DD
  entries: FlexibilityTestEntry[];
  notes?: string;
  createdAt: string;
};

export type FlexibilityTestData = {
  items: FlexibilityTestItem[];
  records: FlexibilityTestRecord[];
};


// ============================================================
// 공연 백스테이지 커뮤니케이션
// ============================================================


export type BackstageCommType =
  | "urgent"     // 긴급
  | "notice"     // 공지
  | "cue"        // 큐 신호
  | "issue"      // 문제 보고
  | "general";   // 일반

export type BackstageCommTargetScope =
  | "all"        // 전체
  | "individual" // 개인
  | "team";      // 팀

export type BackstageCommTarget = {
  scope: BackstageCommTargetScope;
  label?: string; // 개인명 또는 팀명 (all 이면 undefined)
};

export type BackstageCommMessage = {
  id: string;
  type: BackstageCommType;
  content: string;
  senderName: string;
  target: BackstageCommTarget;
  isPinned: boolean;
  isRead: boolean;
  readBy: string[];    // 확인한 사람 이름 목록
  createdAt: string;   // ISO timestamp
};

export type BackstageCommEntry = {
  id: string;
  groupId: string;
  projectId: string;
  messages: BackstageCommMessage[];
  createdAt: string;
  updatedAt: string;
};


// ============================================================
// 그룹 멤버 생일 캘린더 (Birthday Calendar - localStorage 기반)
// ============================================================


export type BirthdayCalendarEntry = {
  id: string;
  groupId: string;
  /** 멤버 이름 */
  name: string;
  /** 생일 (MM-DD 형식, 예: "03-15") */
  birthday: string;
  /** 선호 선물 또는 케이크 */
  giftPreference?: string;
  /** 파티 계획 여부 */
  partyPlanned: boolean;
  /** 기타 메모 */
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type BirthdayCalendarMessage = {
  id: string;
  /** 해당하는 BirthdayCalendarEntry.id */
  entryId: string;
  groupId: string;
  /** 메시지 작성자 */
  author: string;
  /** 축하 메시지 내용 */
  content: string;
  createdAt: string;
};

export type BirthdayCalendarStore = {
  groupId: string;
  entries: BirthdayCalendarEntry[];
  messages: BirthdayCalendarMessage[];
  updatedAt: string;
};


// ============================================================
// 그룹 연습 룰/규칙 (Practice Rules & Etiquette)
// ============================================================


export type PracticeRuleCategory =
  | "attendance"    // 출석
  | "dress"         // 복장
  | "manner"        // 매너
  | "safety"        // 안전
  | "equipment"     // 장비/기자재
  | "hygiene"       // 위생
  | "communication" // 소통
  | "other";        // 기타

export type PracticeRulePriority =
  | "required"      // 필수 (반드시 지켜야 함)
  | "recommended"   // 권장 (지키는 것이 좋음)
  | "optional";     // 선택 (자율)

export type PracticeRulePenaltyType =
  | "none"          // 없음
  | "warning"       // 경고
  | "fine"          // 벌금
  | "exclusion"     // 연습 제외
  | "custom";       // 커스텀

export type PracticeRuleEntry = {
  id: string;
  groupId: string;
  category: PracticeRuleCategory;       // 카테고리
  priority: PracticeRulePriority;       // 중요도
  title: string;                        // 규칙 제목
  description?: string;                 // 상세 설명
  penaltyType: PracticeRulePenaltyType; // 페널티 유형
  penaltyDetail?: string;               // 페널티 상세 (벌금 금액, 커스텀 내용 등)
  isActive: boolean;                    // 활성화 여부
  order: number;                        // 정렬 순서
  createdAt: string;                    // 생성일 (ISO datetime)
  updatedAt: string;                    // 수정일 (ISO datetime)
};


// ============================================================
// 멤버 댄스 목표 마일스톤 (DanceMilestone)
// ============================================================


export type DanceMilestoneStep = {
  id: string;
  title: string;          // 단계 제목 (예: "기초 아이솔레이션")
  description?: string;   // 상세 설명
  isCompleted: boolean;   // 완료 여부
  completedAt?: string;   // 완료 일시 (ISO datetime)
  order: number;          // 정렬 순서
};

export type DanceMilestoneCategory =
  | "genre"        // 장르 마스터 (팝핑, 락킹, 왁킹 등)
  | "technique"    // 테크닉 향상
  | "flexibility"  // 유연성
  | "stamina"      // 체력/지구력
  | "performance"  // 무대 퍼포먼스
  | "freestyle"    // 프리스타일
  | "choreography" // 안무 창작
  | "other";       // 기타

export type DanceMilestoneGoal = {
  id: string;
  memberId: string;                   // 멤버 ID
  title: string;                      // 목표 제목 (예: "팝핑 마스터")
  description?: string;               // 목표 설명
  category: DanceMilestoneCategory;   // 카테고리
  steps: DanceMilestoneStep[];        // 마일스톤 단계 목록
  targetDate?: string;                // 목표 기한 (YYYY-MM-DD)
  createdAt: string;                  // 생성일 (ISO datetime)
  updatedAt: string;                  // 수정일 (ISO datetime)
};

export type DanceMilestoneData = {
  goals: DanceMilestoneGoal[];
};


// ============================================================
// 공연 의상 변경 시트 (Costume Change Sheet)
// ============================================================


export type CostumeChangeLocation =
  | "stage_left"    // 무대 좌측
  | "stage_right"   // 무대 우측
  | "backstage"     // 백스테이지
  | "dressing_room" // 분장실
  | "other";        // 기타

export type CostumeChangeEntry = {
  id: string;
  groupId: string;
  projectId: string;
  order: number;                    // 변경 순서 (곡 번호 순)
  songNumber: number;               // 곡 번호
  songName: string;                 // 곡 이름
  memberNames: string[];            // 변경 대상 멤버 목록
  costumeFrom: string;              // 변경 전 의상
  costumeTo: string;                // 변경 후 의상
  changeTimeSeconds: number;        // 변경 시간 (초)
  needsHelper: boolean;             // 도우미 필요 여부
  helperName?: string;              // 도우미 이름
  location: CostumeChangeLocation;  // 변경 위치
  locationDetail?: string;          // 위치 상세 설명
  notes?: string;                   // 주의사항
  createdAt: string;                // 생성일 (ISO datetime)
  updatedAt: string;                // 수정일 (ISO datetime)
};


// ============================================================
// 공연 무대 소품 관리 (Stage Props Management)
// ============================================================


export type StagePropStatus =
  | "ready"    // 준비됨
  | "in_use"   // 사용중
  | "stored"   // 보관중
  | "repair"   // 수리중
  | "lost";    // 분실

export type StagePropEntry = {
  id: string;
  groupId: string;
  projectId: string;
  name: string;                // 소품 이름
  scene?: string;              // 사용 곡/장면
  assignedTo?: string;         // 담당자
  storageLocation?: string;    // 보관 위치
  status: StagePropStatus;     // 상태
  quantity: number;            // 수량
  cost?: number;               // 비용 (원)
  photoUrl?: string;           // 사진 URL
  memo?: string;               // 메모
  createdAt: string;           // 생성일 (ISO datetime)
  updatedAt: string;           // 수정일 (ISO datetime)
};


// ============================================================
// 그룹 연습 플레이리스트 (PracticePlaylist - 용도별 관리)
// ============================================================


export type PracticePlaylistPurpose =
  | "warmup"    // 웜업
  | "main"      // 본연습
  | "cooldown"; // 쿨다운

export type PracticePlaylistTrack = {
  id: string;
  title: string;                         // 곡명
  artist?: string;                       // 아티스트
  bpm?: number;                          // BPM
  genre?: string;                        // 장르
  duration: number;                      // 소요시간 (초 단위)
  purpose: PracticePlaylistPurpose;      // 용도 (웜업/본연습/쿨다운)
  notes?: string;                        // 메모
  order: number;                         // 정렬 순서
  addedBy: string;                       // 추가자
  createdAt: string;                     // 생성일 (ISO datetime)
};

export type PracticePlaylistEntry = {
  id: string;
  groupId: string;
  name: string;                          // 플레이리스트 이름
  tracks: PracticePlaylistTrack[];       // 곡 목록
  totalDuration: number;                 // 총 재생시간 (초 단위, 계산값)
  createdAt: string;                     // 생성일 (ISO datetime)
  updatedAt: string;                     // 수정일 (ISO datetime)
};


// ============================================================
// 그룹 공지사항 템플릿 (Announcement Templates)
// ============================================================


export type AnnouncementTemplateCategory =
  | "practice"    // 연습
  | "performance" // 공연
  | "meeting"     // 회의
  | "gathering"   // 모임
  | "etc";        // 기타

export type AnnouncementTemplateVariable = {
  key: string;       // 변수 키 (예: "날짜", "장소")
  label: string;     // 표시 레이블
  defaultValue?: string; // 기본값
};

export type AnnouncementTemplateEntry = {
  id: string;
  groupId: string;
  name: string;                          // 템플릿 이름
  category: AnnouncementTemplateCategory; // 카테고리
  titleTemplate: string;                 // 제목 템플릿 (변수 포함 가능)
  bodyTemplate: string;                  // 본문 템플릿 (변수 포함 가능)
  variables: AnnouncementTemplateVariable[]; // 치환 변수 목록
  useCount: number;                      // 사용 횟수
  createdAt: string;                     // 생성일 (ISO datetime)
  updatedAt: string;                     // 수정일 (ISO datetime)
};


// ============================================================
// 공연 타임라인 플래너 (Show Timeline Planner)
// ============================================================


export type ShowTimelineEventType =
  | "arrival"        // 도착
  | "soundcheck"     // 사운드체크
  | "rehearsal"      // 리허설
  | "makeup"         // 메이크업
  | "door_open"      // 개장
  | "show_start"     // 공연 시작
  | "intermission"   // 인터미션
  | "show_end"       // 공연 종료
  | "teardown"       // 철수
  | "custom";        // 기타

export type ShowTimelineStatus =
  | "scheduled"      // 예정
  | "in_progress"    // 진행중
  | "completed"      // 완료
  | "cancelled";     // 취소

export type ShowTimelineEvent = {
  id: string;
  groupId: string;
  projectId: string;
  title: string;                         // 이벤트 제목
  eventType: ShowTimelineEventType;      // 이벤트 유형
  startTime: string;                     // 시작 시간 (HH:MM)
  endTime?: string;                      // 종료 시간 (HH:MM, 선택)
  assignedTo?: string;                   // 담당자
  location?: string;                     // 장소
  status: ShowTimelineStatus;            // 상태
  notes?: string;                        // 메모
  createdAt: string;                     // 생성일 (ISO datetime)
  updatedAt: string;                     // 수정일 (ISO datetime)
};


// ============================================================
// 공연 포토 콜 시트 (PhotoCall)
// ============================================================


export type PhotoCallType =
  | "group"      // 단체
  | "subgroup"   // 소그룹
  | "individual" // 개인
  | "scene";     // 장면

export type PhotoCallEntry = {
  id: string;
  groupId: string;
  projectId: string;
  order: number;              // 촬영 순서
  time?: string;              // 촬영 시간 (HH:MM)
  type: PhotoCallType;        // 촬영 유형
  participants: string[];     // 참여자 목록
  location?: string;          // 촬영 위치
  poseDescription?: string;   // 포즈/구도 설명
  costume?: string;           // 의상 설명
  props?: string;             // 소품 설명
  photographer?: string;      // 촬영자 이름
  completed: boolean;         // 완료 여부
  memo?: string;              // 메모
  createdAt: string;          // 생성일 (ISO datetime)
  updatedAt: string;          // 수정일 (ISO datetime)
};


// ============================================================
// 멤버 댄스 워크숍 이력 (Dance Workshop History)
// ============================================================


export type DanceWorkshopLevel =
  | "beginner"      // 입문
  | "intermediate"  // 중급
  | "advanced"      // 고급
  | "all_levels";   // 전 레벨

export type DanceWorkshopEntry = {
  id: string;
  memberId: string;
  workshopName: string;         // 워크숍명
  instructor: string;           // 강사
  venue: string;                // 장소
  date: string;                 // 날짜 (ISO date, YYYY-MM-DD)
  genre: string;                // 장르 (힙합, 팝핀 등)
  level: DanceWorkshopLevel;    // 레벨
  cost: number;                 // 비용 (원)
  rating: number;               // 평가 (1~5)
  notes: string;                // 배운 내용 메모
  createdAt: string;            // 생성일 (ISO datetime)
  updatedAt: string;            // 수정일 (ISO datetime)
};

export type DanceWorkshopData = {
  entries: DanceWorkshopEntry[];
};


// ============================================================
// 그룹 연습 파트너 매칭 (Practice Partner Matching)
// ============================================================


export type PracticePartnerSkillLevel =
  | "beginner"     // 초급
  | "intermediate" // 중급
  | "advanced"     // 고급
  | "expert";      // 전문가

export type PracticePartnerMatchStatus = "active" | "ended";

export type PracticePartnerMatch = {
  id: string;
  memberAId: string;                    // 멤버 A ID
  memberAName: string;                  // 멤버 A 이름
  memberBId: string;                    // 멤버 B ID
  memberBName: string;                  // 멤버 B 이름
  status: PracticePartnerMatchStatus;   // 매칭 상태
  matchedAt: string;                    // 매칭 생성일 (ISO datetime)
  endedAt?: string;                     // 매칭 종료일 (ISO datetime)
  ratingAtoB?: number;                  // A가 B에게 준 평점 (1~5)
  ratingBtoA?: number;                  // B가 A에게 준 평점 (1~5)
  noteAtoB?: string;                    // A가 B에게 남긴 코멘트
  noteBtoA?: string;                    // B가 A에게 남긴 코멘트
};

export type PracticePartnerMember = {
  id: string;                            // 멤버 고유 ID
  name: string;                          // 멤버 이름
  skillLevel: PracticePartnerSkillLevel; // 스킬 레벨
  availableTimes: string[];              // 연습 가능 시간대
  preferredPartnerIds: string[];         // 선호 파트너 ID 목록
  currentMatchId?: string;              // 현재 활성 매칭 ID
  joinedAt: string;                      // 등록일 (ISO datetime)
};

export type PracticePartnerEntry = {
  id: string;
  groupId: string;
  members: PracticePartnerMember[];     // 등록 멤버 목록
  matches: PracticePartnerMatch[];      // 전체 매칭 이력
  createdAt: string;                    // 생성일 (ISO datetime)
  updatedAt: string;                    // 수정일 (ISO datetime)
};


// ============================================================
// 그룹 역할 분담표 (Role Assignment Board)
// ============================================================


export type RoleAssignmentStatus = "active" | "expired";

export type RoleAssignmentHistoryItem = {
  id: string;                        // 이력 고유 ID
  changedAt: string;                 // 변경 일시 (ISO datetime)
  changedBy: string;                 // 변경자 이름
  prevAssignee: string;              // 이전 담당자
  nextAssignee: string;              // 새 담당자
  note?: string;                     // 변경 사유 (선택)
};

export type RoleAssignmentItem = {
  id: string;                        // 항목 고유 ID
  roleName: string;                  // 역할 이름 (예: 리더, 총무)
  description?: string;              // 역할 설명
  assignee: string;                  // 현재 담당자 이름
  startDate: string;                 // 담당 시작일 (YYYY-MM-DD)
  endDate?: string;                  // 담당 종료일 (YYYY-MM-DD, 선택)
  status: RoleAssignmentStatus;      // 상태 (활성/만료)
  history: RoleAssignmentHistoryItem[]; // 변경 이력
  createdAt: string;                 // 생성일 (ISO datetime)
  updatedAt: string;                 // 수정일 (ISO datetime)
};

export type RoleAssignmentEntry = {
  id: string;
  groupId: string;
  items: RoleAssignmentItem[];       // 역할 분담 목록
  createdAt: string;                 // 생성일 (ISO datetime)
  updatedAt: string;                 // 수정일 (ISO datetime)
};


// ============================================================
// 멤버 댄스 컨디션 일지 (Dance Condition Log)
// ============================================================


export type DanceConditionPainArea =
  | "neck"       // 목
  | "shoulder"   // 어깨
  | "back"       // 등
  | "waist"      // 허리
  | "hip"        // 고관절
  | "knee"       // 무릎
  | "ankle"      // 발목
  | "wrist"      // 손목
  | "elbow"      // 팔꿈치
  | "calf"       // 종아리
  | "thigh"      // 허벅지
  | "foot"       // 발
  | "none";      // 통증 없음

export type DanceConditionIntensity =
  | "rest"      // 휴식
  | "light"     // 가벼운
  | "moderate"  // 보통
  | "hard"      // 힘든
  | "extreme";  // 극강

export type DanceConditionLog = {
  id: string;                               // 고유 ID
  date: string;                             // 기록 날짜 (YYYY-MM-DD)
  overallScore: number;                     // 전체 컨디션 점수 (1-10)
  energyLevel: number;                      // 에너지 레벨 (1-10)
  focusLevel: number;                       // 집중력 (1-10)
  muscleCondition: number;                  // 근육 상태 (1-10)
  painAreas: DanceConditionPainArea[];      // 통증 부위 목록
  practiceIntensity: DanceConditionIntensity; // 연습 강도
  hydrationMl: number;                      // 수분 섭취량 (ml)
  memo: string;                             // 컨디션 메모
  createdAt: string;                        // 생성일 (ISO datetime)
};

export type DanceConditionEntry = {
  memberId: string;                         // 멤버 ID
  logs: DanceConditionLog[];                // 기록 목록 (최신순)
  updatedAt: string;                        // 마지막 수정일 (ISO datetime)
};


// ============================================================
// 공연 관객 안내 매뉴얼 (Audience Guide Manual)
// ============================================================


export type AudienceGuideSectionType =
  | "location"       // 공연장 위치/교통
  | "parking"        // 주차 안내
  | "seating"        // 좌석 안내
  | "caution"        // 주의사항 (촬영/녹음/음식 등)
  | "etiquette"      // 공연 에티켓
  | "emergency"      // 비상구/대피 안내
  | "faq"            // FAQ
  | "general";       // 일반 안내

export type AudienceGuideFAQ = {
  id: string;
  question: string;   // 질문
  answer: string;     // 답변
  order: number;      // 표시 순서
};

export type AudienceGuideSection = {
  id: string;
  type: AudienceGuideSectionType;   // 섹션 유형
  title: string;                    // 섹션 제목
  content: string;                  // 본문 내용
  faqs: AudienceGuideFAQ[];         // FAQ 목록 (type === "faq" 일 때 주로 사용)
  isVisible: boolean;               // 공개 여부
  order: number;                    // 표시 순서
  createdAt: string;                // 생성일 (ISO datetime)
  updatedAt: string;                // 수정일 (ISO datetime)
};

export type AudienceGuideEntry = {
  id: string;
  groupId: string;
  projectId: string;
  title: string;                      // 매뉴얼 제목
  description: string;                // 매뉴얼 설명
  sections: AudienceGuideSection[];   // 섹션 목록
  createdAt: string;                  // 생성일 (ISO datetime)
  updatedAt: string;                  // 수정일 (ISO datetime)
};


// ============================================================
// 그룹 연습 출결 사유서 (Attendance Excuse Form)
// ============================================================


export type AttendanceExcuseType = "absent" | "late" | "early_leave";

export type AttendanceExcuseReason =
  | "health"   // 건강
  | "study"    // 학업
  | "work"     // 직장
  | "family"   // 가정
  | "other";   // 기타

export type AttendanceExcuseStatus = "pending" | "approved" | "rejected";

export type AttendanceExcuseItem = {
  id: string;
  memberName: string;                   // 제출 멤버 이름
  date: string;                         // 해당 날짜 (YYYY-MM-DD)
  type: AttendanceExcuseType;           // 출결 유형
  reason: AttendanceExcuseReason;       // 사유 카테고리
  detail: string;                       // 상세 사유
  status: AttendanceExcuseStatus;       // 승인 상태
  approverName?: string;                // 승인자 이름
  approvedAt?: string;                  // 승인/반려 일시 (ISO datetime)
  submittedAt: string;                  // 제출 일시 (ISO datetime)
};

export type AttendanceExcuseEntry = {
  id: string;
  groupId: string;
  items: AttendanceExcuseItem[];        // 사유서 목록
  createdAt: string;                    // 생성일 (ISO datetime)
  updatedAt: string;                    // 수정일 (ISO datetime)
};


// ============================================================
// 공연 스태프 콜시트 (Staff Call Sheet)
// ============================================================


export type StaffCallRole =
  | "stage_manager"   // 무대감독
  | "sound"           // 음향
  | "lighting"        // 조명
  | "costume"         // 의상
  | "makeup"          // 메이크업
  | "stage_crew"      // 무대스태프
  | "front_of_house"  // 프론트
  | "other";          // 기타

export type StaffCallItem = {
  id: string;
  name: string;                  // 스태프 이름
  role: StaffCallRole;           // 역할
  callTime: string;              // 콜 시간 (HH:mm)
  location?: string;             // 집결 장소
  phone?: string;                // 연락처
  note?: string;                 // 특이사항
  confirmed: boolean;            // 확인 상태
  createdAt: string;             // 생성일 (ISO datetime)
  updatedAt: string;             // 수정일 (ISO datetime)
};

export type StaffCallSheet = {
  groupId: string;
  projectId: string;
  items: StaffCallItem[];
  updatedAt: string;
};


// ============================================================
// 공연 무대 동선 노트 (Stage Blocking Notes)
// ============================================================


export type StageBlockingPosition =
  | "upstage_left"    // 상수 좌
  | "upstage_center"  // 상수 중앙
  | "upstage_right"   // 상수 우
  | "center_left"     // 센터 좌
  | "center"          // 센터
  | "center_right"    // 센터 우
  | "downstage_left"  // 하수 좌
  | "downstage_center"// 하수 중앙
  | "downstage_right" // 하수 우
  | "wing_left"       // 윙 좌 (대기)
  | "wing_right"      // 윙 우 (대기)
  | "custom";         // 직접 입력

export type StageBlockingDirection =
  | "forward"   // 앞으로
  | "backward"  // 뒤로
  | "left"      // 왼쪽
  | "right"     // 오른쪽
  | "diagonal"  // 대각선
  | "circle"    // 원형
  | "stay"      // 정지
  | "exit"      // 퇴장
  | "enter";    // 등장

export type StageBlockingMemberMove = {
  memberName: string;                    // 멤버 이름
  fromPosition: StageBlockingPosition;   // 시작 위치
  toPosition: StageBlockingPosition;     // 종료 위치
  direction?: StageBlockingDirection;    // 이동 방향
  note?: string;                         // 멤버 동선 메모
};

export type StageBlockingNote = {
  id: string;
  songTitle: string;             // 곡 제목 / 장면 이름
  sceneNumber?: string;          // 장면/섹션 번호 (예: "A1", "2절")
  timeStart?: string;            // 시간 구간 시작 (mm:ss)
  timeEnd?: string;              // 시간 구간 종료 (mm:ss)
  countStart?: number;           // 카운트 시작
  countEnd?: number;             // 카운트 종료
  formation?: string;            // 포메이션 이름
  memberMoves: StageBlockingMemberMove[]; // 멤버별 동선
  caution?: string;              // 주의사항
  memo?: string;                 // 추가 메모
  order: number;                 // 표시 순서
  createdAt: string;             // 생성일 (ISO datetime)
  updatedAt: string;             // 수정일 (ISO datetime)
};

export type StageBlockingEntry = {
  groupId: string;
  projectId: string;
  notes: StageBlockingNote[];
  updatedAt: string;
};


// ============================================================
// 그룹 연습 기여도 포인트 (Practice Contribution Points)
// ============================================================


export type ContributionPointCategory =
  | "attendance"    // 출석
  | "demonstration" // 시범
  | "feedback"      // 피드백
  | "cleaning"      // 청소
  | "equipment"     // 장비관리
  | "teaching"      // 지도
  | "preparation"   // 준비
  | "other";        // 기타

export type ContributionPointTransaction = {
  id: string;
  memberId: string;          // 대상 멤버 ID
  memberName: string;        // 대상 멤버 이름 (스냅샷)
  category: ContributionPointCategory; // 카테고리
  points: number;            // 포인트 (양수: 부여, 음수: 차감)
  reason: string;            // 부여/차감 사유
  date: string;              // 날짜 (YYYY-MM-DD)
  grantedBy: string;         // 부여자 이름
  note?: string;             // 추가 메모
  createdAt: string;         // 생성일 (ISO datetime)
};

export type ContributionPointEntry = {
  memberId: string;
  memberName: string;
  totalPoints: number;
  categoryBreakdown: Record<ContributionPointCategory, number>;
  transactions: ContributionPointTransaction[];
  rank: number;
};

export type ContributionPointStore = {
  groupId: string;
  transactions: ContributionPointTransaction[];
  updatedAt: string;
};


// ============================================================
// 멤버 댄스 오디션 기록 (Dance Audition Records)
// ============================================================


export type DanceAuditionResult =
  | "pass"       // 합격
  | "fail"       // 불합격
  | "pending"    // 대기/결과 미정
  | "cancelled"; // 취소

export type DanceAuditionRecord = {
  id: string;
  auditionName: string;          // 오디션명
  organizer: string;             // 주최사/주최자
  date: string;                  // 오디션 날짜 (YYYY-MM-DD)
  genre: string;                 // 장르
  result: DanceAuditionResult;   // 결과
  prepSong: string;              // 준비한 곡
  judgesFeedback: string;        // 심사위원 피드백
  personalNote: string;          // 개인 소감 메모
  createdAt: string;             // 생성일 (ISO datetime)
  updatedAt: string;             // 수정일 (ISO datetime)
};

export type DanceAuditionEntry = {
  memberId: string;
  records: DanceAuditionRecord[];
  updatedAt: string;
};


// ============================================================
// 그룹 외부 강사 관리 (Guest Instructor Management)
// ============================================================


export type GuestInstructorLesson = {
  id: string;
  date: string;           // YYYY-MM-DD
  topic: string;          // 수업 주제
  rating: number;         // 평점 1~5
  note?: string;          // 메모
  createdAt: string;      // 생성일 (ISO datetime)
};

export type GuestInstructorEntry = {
  id: string;
  name: string;           // 강사 이름
  genre: string;          // 전문 장르 (예: 팝핀, 비보잉, 힙합, 재즈 등)
  career?: string;        // 경력 소개
  phone?: string;         // 연락처
  email?: string;         // 이메일
  hourlyRate?: number;    // 시간당 비용 (원)
  lessons: GuestInstructorLesson[];  // 수업 이력
  note?: string;          // 메모
  createdAt: string;      // 생성일 (ISO datetime)
  updatedAt: string;      // 수정일 (ISO datetime)
};

export type GuestInstructorData = {
  groupId: string;
  instructors: GuestInstructorEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 관객 카운트 (Audience Count Tracker)
// ============================================================


export type AudienceCountType =
  | "paid"       // 유료
  | "invited"    // 초대
  | "free"       // 무료
  | "staff";     // 관계자

export type AudienceCountRecord = {
  id: string;
  sessionNumber: number;        // 회차 번호 (1, 2, 3...)
  sessionLabel?: string;        // 회차 라벨 (예: "오후 2시 공연")
  date: string;                 // 공연 날짜 (YYYY-MM-DD)
  totalSeats: number;           // 총 좌석 수
  actualCount: number;          // 실제 관객 수
  vipCount: number;             // VIP 수
  byType: {
    paid: number;               // 유료 관객
    invited: number;            // 초대 관객
    free: number;               // 무료 관객
    staff: number;              // 관계자
  };
  note?: string;                // 메모
  createdAt: string;            // 생성일 (ISO datetime)
  updatedAt: string;            // 수정일 (ISO datetime)
};

export type AudienceCountEntry = {
  sessionNumber: number;
  sessionLabel?: string;
  date: string;
  totalSeats: number;
  actualCount: number;
  vipCount: number;
  byType: {
    paid: number;
    invited: number;
    free: number;
    staff: number;
  };
  note?: string;
};

export type AudienceCountSheet = {
  groupId: string;
  projectId: string;
  records: AudienceCountRecord[];
  updatedAt: string;
};


// ============================================================
// 멤버 댄스 수업 수강 기록
// ============================================================


export type DanceClassLogSource = "internal" | "external";

export type DanceClassLogLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "all_levels";

export type DanceClassLogEntry = {
  id: string;
  memberId: string;

  /** 수업명 */
  className: string;

  /** 강사명 */
  instructor: string;

  /** 수업 날짜 (YYYY-MM-DD) */
  date: string;

  /** 수업 시간 (HH:MM) */
  startTime?: string;

  /** 수업 시간 (분) */
  durationMin?: number;

  /** 출처 (내부/외부) */
  source: DanceClassLogSource;

  /** 장르 */
  genre: string;

  /** 레벨 */
  level: DanceClassLogLevel;

  /** 내용 요약 */
  summary?: string;

  /** 배운 기술 (쉼표 구분 태그) */
  skills: string[];

  /** 자가 평가 (1-5) */
  selfRating: number;

  /** 추가 메모 */
  notes?: string;

  createdAt: string;
  updatedAt: string;
};

export type DanceClassLogData = {
  memberId: string;
  entries: DanceClassLogEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 미디어 보도 자료 (Media Press Kit)
// ============================================================


export type MediaPressKitStatus = "draft" | "review" | "published";

export type MediaPressKitOutletType =
  | "newspaper"
  | "magazine"
  | "online"
  | "broadcast"
  | "sns"
  | "other";

export type MediaPressKitOutlet = {
  id: string;
  name: string;
  type: MediaPressKitOutletType;
  contactName?: string;
  contactEmail?: string;
  published: boolean;
  publishedAt?: string;
  publishedUrl?: string;
  note?: string;
};

export type MediaPressKitEntry = {
  id: string;
  title: string;
  writtenAt: string;
  content: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  attachmentUrls: string[];
  outlets: MediaPressKitOutlet[];
  status: MediaPressKitStatus;
  createdAt: string;
  updatedAt: string;
};

export type MediaPressKitSheet = {
  groupId: string;
  projectId: string;
  entries: MediaPressKitEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 입장 게이트 관리
// ============================================================


export type EntranceGateStatus = "open" | "closed" | "standby";

export type EntranceGateType = "general" | "vip" | "staff" | "disabled";

export type EntranceGateEntry = {
  /** 게이트 ID */
  id: string;
  /** 게이트 번호 (예: 1, 2, 3) */
  gateNumber: number;
  /** 게이트 이름 (예: 메인 게이트, VIP 전용) */
  gateName: string;
  /** 위치 설명 (예: 1층 정문, 2층 좌측) */
  location?: string;
  /** 담당 스태프 이름 */
  staffName?: string;
  /** 개방 시작 시간 (HH:mm) */
  openTime?: string;
  /** 개방 종료 시간 (HH:mm) */
  closeTime?: string;
  /** 허용 입장 유형 목록 */
  allowedTypes: EntranceGateType[];
  /** 현재 게이트 상태 */
  status: EntranceGateStatus;
  /** 현재 입장 카운트 */
  count: number;
  /** 메모 */
  note?: string;
  /** 생성 시각 */
  createdAt: string;
  /** 수정 시각 */
  updatedAt: string;
};

export type EntranceGateSheet = {
  groupId: string;
  projectId: string;
  gates: EntranceGateEntry[];
  updatedAt: string;
};


// ============================================================
// 그룹 연습 장비 체크리스트
// ============================================================


export type EquipmentChecklistPhase = "before" | "after";

export type EquipmentChecklistItem = {
  id: string;
  name: string;
  phase: EquipmentChecklistPhase;
  category: string;
  order: number;
};

export type EquipmentChecklistEntry = {
  itemId: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
  note?: string;
};

export type EquipmentChecklistRecord = {
  id: string;
  date: string;
  phase: EquipmentChecklistPhase;
  assignee?: string;
  entries: EquipmentChecklistEntry[];
  completedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentChecklistSheet = {
  groupId: string;
  items: EquipmentChecklistItem[];
  records: EquipmentChecklistRecord[];
  updatedAt: string;
};


// ============================================================
// 그룹 연습 피드백 수집
// ============================================================


export type PracticeFeedbackRating = {
  /** 안무 평가 */
  choreography: number;
  /** 음악 평가 */
  music: number;
  /** 환경 평가 */
  environment: number;
  /** 분위기 평가 */
  atmosphere: number;
};

export type PracticeFeedbackResponse = {
  id: string;
  sessionId: string;
  /** 작성자 이름 (익명이면 "익명") */
  authorName: string;
  /** 익명 여부 */
  isAnonymous: boolean;
  /** 전체 만족도 (1-5) */
  overallRating: number;
  /** 카테고리별 평가 */
  categoryRatings: PracticeFeedbackRating;
  /** 좋았던 점 */
  goodPoints?: string;
  /** 개선할 점 */
  improvements?: string;
  createdAt: string;
};

export type PracticeFeedbackSession = {
  id: string;
  groupId: string;
  /** 연습 날짜 (YYYY-MM-DD) */
  practiceDate: string;
  /** 세션 제목 (선택) */
  title?: string;
  /** 피드백 목록 */
  responses: PracticeFeedbackResponse[];
  createdAt: string;
};

export type PracticeFeedbackAggregate = {
  sessionId: string;
  practiceDate: string;
  title?: string;
  totalResponses: number;
  /** 전체 만족도 평균 */
  averageOverall: number;
  /** 카테고리별 평균 */
  averageCategories: PracticeFeedbackRating;
  /** 좋았던 점 목록 */
  goodPointsList: string[];
  /** 개선할 점 목록 */
  improvementsList: string[];
};

export type PracticeFeedbackData = {
  groupId: string;
  sessions: PracticeFeedbackSession[];
  updatedAt: string;
};


// ============================================
// Dance Certification Manager (멤버 댄스 인증서/자격증 관리)
// ============================================


export type DanceCertificationCategory =
  | "genre"       // 장르 자격
  | "instructor"  // 지도자
  | "judge"       // 심판
  | "safety"      // 안전
  | "other";      // 기타

export type DanceCertificationStatus =
  | "valid"       // 유효
  | "expired"     // 만료
  | "renewal";    // 갱신 필요

export type DanceCertificationEntry = {
  id: string;
  /** 자격증명 */
  name: string;
  /** 발급 기관 */
  issuer: string;
  /** 취득일 (YYYY-MM-DD) */
  issuedAt: string;
  /** 만료일 (YYYY-MM-DD, 없으면 영구) */
  expiresAt?: string;
  /** 등급 (예: 1급, 2급, 마스터 등) */
  grade?: string;
  /** 카테고리 */
  category: DanceCertificationCategory;
  /** 상태 (자동 판별이지만 수동 override 가능) */
  status: DanceCertificationStatus;
  /** 자격증 파일 URL */
  fileUrl?: string;
  /** 메모 */
  note?: string;
  /** 생성일시 */
  createdAt: string;
};

export type DanceCertificationData = {
  memberId: string;
  entries: DanceCertificationEntry[];
  updatedAt: string;
};


// ============================================
// 그룹 멤버 기술 매트릭스 (Member Skill Matrix)
// ============================================


export type SkillMatrixSkill = {
  /** 기술 고유 ID */
  id: string;
  /** 기술 이름 (예: 턴, 점프, 플로어워크 등) */
  name: string;
  /** 카테고리 (예: 기초기술, 파워무브, 스타일 등) */
  category?: string;
  /** 기술 설명 */
  description?: string;
  /** 생성일시 */
  createdAt: string;
};

export type SkillMatrixMemberScore = {
  /** 현재 레벨 (0=미평가, 1~5) */
  currentLevel: SkillMatrixLevel;
  /** 목표 레벨 (1~5, 없으면 undefined) */
  targetLevel?: SkillMatrixLevel;
  /** 최종 평가일 (YYYY-MM-DD) */
  lastEvaluatedAt?: string;
  /** 메모 */
  note?: string;
};

export type SkillMatrixMemberEntry = {
  /** 멤버 이름 (또는 ID) */
  memberName: string;
  /** skillId → 점수 정보 */
  scores: Record<string, SkillMatrixMemberScore>;
};

export type SkillMatrixData = {
  groupId: string;
  /** 등록된 기술 목록 */
  skills: SkillMatrixSkill[];
  /** 멤버별 점수 목록 */
  members: SkillMatrixMemberEntry[];
  updatedAt: string;
};


// ============================================================
// 그룹 연습 일지 요약 (Group Practice Journal Summary)
// ============================================================


export type GroupPracticeJournalEntry = {
  /** 고유 ID */
  id: string;
  /** 연습 날짜 (YYYY-MM-DD) */
  date: string;
  /** 연습 시간 (분 단위) */
  durationMinutes: number;
  /** 참여 멤버 이름 목록 */
  participants: string[];
  /** 연습 내용 요약 */
  contentSummary: string;
  /** 진행된 곡/안무 목록 */
  songs: string[];
  /** 달성 목표 */
  achievedGoals: string[];
  /** 미달성 사항 */
  unachievedItems: string[];
  /** 다음 연습 계획 */
  nextPlanNote: string;
  /** 작성자 이름 */
  authorName: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type GroupPracticeJournalMonthStat = {
  /** 연도-월 (YYYY-MM) */
  yearMonth: string;
  /** 해당 월 일지 수 */
  entryCount: number;
  /** 해당 월 총 연습 시간 (분) */
  totalMinutes: number;
  /** 해당 월 평균 참여 인원 */
  avgParticipants: number;
};


// ============================================================
// 공연 후원 감사편지 (ThankYouLetter)
// ============================================================


export type ThankYouLetterSponsorType =
  | "money"      // 금전
  | "goods"      // 물품
  | "venue"      // 장소
  | "service";   // 서비스

export type ThankYouLetterStatus =
  | "draft"      // 작성중
  | "sent";      // 발송완료

export type ThankYouLetterEntry = {
  id: string;
  /** 후원사명 */
  sponsorName: string;
  /** 후원 유형 */
  sponsorType: ThankYouLetterSponsorType;
  /** 후원 내용 (금액, 물품명, 장소명 등) */
  sponsorDetail?: string;
  /** 감사편지 내용 */
  letterContent: string;
  /** 발송 상태 */
  status: ThankYouLetterStatus;
  /** 발송 날짜 */
  sentAt?: string;
  /** 담당자 */
  managerName: string;
  /** 후원사 연락처 */
  sponsorContact?: string;
  /** 후원사 이메일 */
  sponsorEmail?: string;
  /** 비고 */
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type ThankYouLetterSheet = {
  groupId: string;
  projectId: string;
  entries: ThankYouLetterEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 출연료 정산 (Performance Fee Settlement)
// ============================================================


export type PerformanceFeeRole = "main" | "sub" | "extra" | "staff";

export type PerformanceFeeStatus = "pending" | "settled";

export type PerformanceFeeAdjustmentType =
  | "rehearsal"
  | "overtime"
  | "transport"
  | "meal"
  | "other";

export type PerformanceFeeAdjustment = {
  /** 고유 ID */
  id: string;
  /** 항목 유형 */
  type: PerformanceFeeAdjustmentType;
  /** 항목 설명 */
  label: string;
  /** 금액 (양수: 추가 수당, 음수: 공제) */
  amount: number;
};

export type PerformanceFeeEntry = {
  /** 고유 ID */
  id: string;
  /** 멤버 이름 */
  memberName: string;
  /** 출연 역할 */
  role: PerformanceFeeRole;
  /** 기본 출연료 */
  baseFee: number;
  /** 수당/공제 항목 목록 */
  adjustments: PerformanceFeeAdjustment[];
  /** 최종 정산 금액 (baseFee + adjustments 합계) */
  finalAmount: number;
  /** 정산 상태 */
  status: PerformanceFeeStatus;
  /** 정산 완료일 (YYYY-MM-DD) */
  settledAt?: string;
  /** 메모 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type PerformanceFeeData = {
  groupId: string;
  projectId: string;
  entries: PerformanceFeeEntry[];
  updatedAt: string;
};


// ============================================
// Practice Goal Board v2 (그룹 연습 목표 보드)
// ============================================


export type PracticeGoalCategory =
  | "choreography"
  | "fitness"
  | "sync"
  | "technique"
  | "other";

export type PracticeGoalStatus = "active" | "completed" | "paused";

export type PracticeGoalSubTask = {
  id: string;
  title: string;
  done: boolean;
};

export type PracticeGoalEntry = {
  id: string;
  /** 목표 제목 */
  title: string;
  /** 목표 설명 */
  description?: string;
  /** 카테고리 */
  category: PracticeGoalCategory;
  /** 기한 (YYYY-MM-DD) */
  dueDate?: string;
  /** 진행률 (0–100) */
  progress: number;
  /** 상태 */
  status: PracticeGoalStatus;
  /** 담당자 목록 */
  assignees: string[];
  /** 하위 목표 */
  subTasks: PracticeGoalSubTask[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type PracticeGoalBoardData = {
  groupId: string;
  entries: PracticeGoalEntry[];
  updatedAt: string;
};


// ============================================================
// 댄스 챌린지 참여 기록 (Dance Challenge Participation)
// ============================================================


export type DanceChallengePlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "offline"
  | "other";

export type DanceChallengeResult =
  | "completed"
  | "in_progress"
  | "abandoned";

export type DanceChallengeEntry = {
  /** 고유 ID */
  id: string;
  /** 챌린지명 */
  challengeName: string;
  /** 플랫폼 */
  platform: DanceChallengePlatform;
  /** 참여 날짜 (YYYY-MM-DD) */
  date: string;
  /** 곡명 */
  songTitle?: string;
  /** 영상 URL */
  videoUrl?: string;
  /** 조회수 */
  viewCount?: number;
  /** 좋아요 수 */
  likeCount?: number;
  /** 결과 */
  result: DanceChallengeResult;
  /** 메모 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type DanceChallengeData = {
  memberId: string;
  entries: DanceChallengeEntry[];
  updatedAt: string;
};


// ============================================
// 그룹 멤버 가용 시간표 (Member Availability Schedule)
// ============================================


export type MemberAvailabilityLevel = "available" | "difficult" | "unavailable";

export type MemberAvailabilityDay =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type MemberAvailabilitySlot = {
  /** 시작 시각 (HH:MM 형식) */
  startTime: string;
  /** 종료 시각 (HH:MM 형식) */
  endTime: string;
  /** 가용 수준 */
  level: MemberAvailabilityLevel;
  /** 메모 */
  note?: string;
};

export type MemberAvailabilityEntry = {
  /** 고유 ID */
  id: string;
  /** 멤버 이름 */
  memberName: string;
  /** 요일별 슬롯 목록 */
  slots: Partial<Record<MemberAvailabilityDay, MemberAvailabilitySlot[]>>;
  /** 전반적인 메모 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type MemberAvailabilityOverlap = {
  /** 요일 */
  day: MemberAvailabilityDay;
  /** 시작 시각 */
  startTime: string;
  /** 종료 시각 */
  endTime: string;
  /** 해당 시간대에 가능한 멤버 이름 목록 */
  availableMembers: string[];
  /** 어려움 멤버 이름 목록 */
  difficultMembers: string[];
};

export type MemberAvailabilityData = {
  groupId: string;
  entries: MemberAvailabilityEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 케이터링 관리 (Catering Management)
// ============================================================


export type CateringDietaryRestriction =
  | "none"
  | "vegetarian"
  | "vegan"
  | "halal"
  | "kosher"
  | "gluten_free"
  | "nut_allergy"
  | "dairy_free"
  | "seafood_allergy"
  | "other";

export type CateringStatus =
  | "pending"
  | "confirmed"
  | "delivering"
  | "delivered"
  | "cancelled";

export type CateringMealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "beverage";

export type CateringEntry = {
  /** 고유 ID */
  id: string;
  /** 식사 유형 */
  mealType: CateringMealType;
  /** 식사 시간 (HH:MM) */
  mealTime: string;
  /** 메뉴 설명 */
  menuDescription: string;
  /** 총 인원 수 */
  headcount: number;
  /** 식이 제한 목록 */
  dietaryRestrictions: CateringDietaryRestriction[];
  /** 식이 제한 상세 메모 */
  dietaryNotes?: string;
  /** 업체명 */
  vendorName?: string;
  /** 업체 연락처 */
  vendorContact?: string;
  /** 총 비용 (원) */
  totalCost?: number;
  /** 배달 예정 시간 (HH:MM) */
  deliveryTime?: string;
  /** 배치 장소 */
  deliveryLocation?: string;
  /** 상태 */
  status: CateringStatus;
  /** 추가 메모 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type CateringData = {
  groupId: string;
  projectId: string;
  entries: CateringEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 무대 효과 큐시트 (Stage Effects Cue Sheet)
// ============================================================


export type StageEffectType =
  | "smoke"      // 연기
  | "flame"      // 불꽃
  | "laser"      // 레이저
  | "confetti"   // 컨페티
  | "bubble"     // 버블
  | "foam"       // 폼
  | "snow"       // 스노우
  | "strobe"     // 스트로브
  | "pyro"       // 파이로테크닉
  | "co2"        // CO2 제트
  | "uv"         // UV/블랙라이트
  | "other";     // 기타

export type StageEffectIntensity = "low" | "medium" | "high" | "custom";

export type StageEffectTrigger = "manual" | "timecode" | "dmx" | "midi";

export type StageEffectSafetyLevel = "safe" | "caution" | "danger";

export type StageEffectEntry = {
  /** 고유 ID */
  id: string;
  /** 큐 번호 (예: 1, 2, 2.5, 3A) */
  cueNumber: string;
  /** 효과 유형 */
  effectType: StageEffectType;
  /** 트리거 시점 (MM:SS 형식) */
  triggerTime: string;
  /** 지속 시간 (초 단위) */
  durationSec: number;
  /** 강도 */
  intensity: StageEffectIntensity;
  /** 강도 커스텀 값 (intensity가 custom일 때) */
  intensityCustom?: string;
  /** 트리거 방식 */
  trigger: StageEffectTrigger;
  /** 무대 위치 (예: 무대 좌측, 중앙, 전체) */
  position: string;
  /** 안전 등급 */
  safetyLevel: StageEffectSafetyLevel;
  /** 안전 주의사항 */
  safetyNotes?: string;
  /** 담당 운영자 */
  operator?: string;
  /** 메모 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type StageEffectData = {
  groupId: string;
  projectId: string;
  entries: StageEffectEntry[];
  updatedAt: string;
};


// ============================================
// 댄스 영상 포트폴리오 링크 (VideoPortfolio)
// ============================================


export type VideoPortfolioCategory =
  | "solo"
  | "group"
  | "freestyle"
  | "battle"
  | "performance"
  | "practice";

export type VideoPortfolioPlatform =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "vimeo"
  | "other";

export type VideoPortfolioEntry = {
  id: string;
  /** 영상 제목 */
  title: string;
  /** 영상 URL */
  url: string;
  /** 플랫폼 */
  platform: VideoPortfolioPlatform;
  /** 카테고리 */
  category: VideoPortfolioCategory;
  /** 촬영/업로드 날짜 (YYYY-MM-DD) */
  date?: string;
  /** 태그 목록 */
  tags: string[];
  /** 설명 */
  description?: string;
  /** 썸네일 URL */
  thumbnailUrl?: string;
  /** 공개 여부 */
  isPublic: boolean;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type VideoPortfolioData = {
  memberId: string;
  entries: VideoPortfolioEntry[];
  updatedAt: string;
};


// ============================================================
// Read Receipt (그룹 공지 읽음 확인)
// ============================================================


export type ReadReceiptPriority = "normal" | "important" | "urgent";

export type ReadReceiptReader = {
  /** 멤버 이름 */
  memberName: string;
  /** 읽은 시각 (ISO 8601) */
  readAt: string;
};

export type ReadReceiptAnnouncement = {
  /** 고유 ID */
  id: string;
  /** 제목 */
  title: string;
  /** 내용 */
  content: string;
  /** 작성자 */
  author: string;
  /** 중요도 */
  priority: ReadReceiptPriority;
  /** 전체 대상 멤버 목록 */
  targetMembers: string[];
  /** 읽음 기록 목록 */
  readers: ReadReceiptReader[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type ReadReceiptData = {
  groupId: string;
  announcements: ReadReceiptAnnouncement[];
  updatedAt: string;
};


// ============================================
// 연습 하이라이트 (Practice Highlights)
// ============================================


export type PracticeHighlightCategory =
  | "awesome_move"    // 멋진 동작
  | "growth_moment"   // 성장 순간
  | "teamwork"        // 팀워크
  | "funny_episode"   // 재미있는 에피소드
  | "other";          // 기타

export type PracticeHighlightEntry = {
  /** 고유 ID */
  id: string;
  /** 연습 날짜 (YYYY-MM-DD) */
  date: string;
  /** 하이라이트 제목 */
  title: string;
  /** 관련 멤버 이름 */
  memberName: string;
  /** 카테고리 */
  category: PracticeHighlightCategory;
  /** 상세 설명 (선택) */
  description?: string;
  /** 좋아요 수 */
  likes: number;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type PracticeHighlightData = {
  groupId: string;
  entries: PracticeHighlightEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 안전 체크리스트 (Safety Checklist)
// ============================================================


export type SafetyChecklistCategory =
  | "stage"      // 무대안전
  | "electric"   // 전기
  | "fire"       // 소방
  | "emergency"  // 응급
  | "audience"   // 관객안전
  | "etc";       // 기타

export type SafetyChecklistStatus =
  | "pending"   // 미확인
  | "checked"   // 확인완료
  | "issue";    // 문제발견

export type SafetyChecklistPriority =
  | "high"    // 높음
  | "medium"  // 보통
  | "low";    // 낮음

export type SafetyChecklistItem = {
  /** 고유 ID */
  id: string;
  /** 카테고리 */
  category: SafetyChecklistCategory;
  /** 항목 내용 */
  content: string;
  /** 담당자 */
  assignee?: string;
  /** 확인 상태 */
  status: SafetyChecklistStatus;
  /** 확인 시간 (ISO 8601) */
  checkedAt?: string;
  /** 우선순위 */
  priority: SafetyChecklistPriority;
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type SafetyChecklistData = {
  groupId: string;
  projectId: string;
  items: SafetyChecklistItem[];
  updatedAt: string;
};


// ============================================================
// 공연 관객 설문조사 (AudienceSurvey)
// ============================================================


export type AudienceSurveyQuestion =
  | "overall"
  | "stage"
  | "choreography"
  | "music"
  | "costume"
  | "revisit";

export type AudienceSurveyScore = 1 | 2 | 3 | 4 | 5;

export type AudienceSurveyQuestionStat = {
  question: AudienceSurveyQuestion;
  avg: number;
  count: number;
};

export type AudienceSurveyEntry = {
  /** 고유 ID */
  id: string;
  /** 엔트리 제목 (예: "1회차 공연") */
  title: string;
  /** 수집 날짜 (YYYY-MM-DD) */
  date: string;
  /** 총 응답 수 */
  responseCount: number;
  /** 항목별 평균 점수 */
  questionStats: AudienceSurveyQuestionStat[];
  /** 자유 의견 목록 */
  freeComments: string[];
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type AudienceSurveyData = {
  groupId: string;
  projectId: string;
  entries: AudienceSurveyEntry[];
  updatedAt: string;
};


// ============================================================
// 댄스 네트워킹 연락처 (Dance Networking Contacts)
// ============================================================


export type DanceNetworkingRole =
  | "dancer"
  | "choreographer"
  | "dj"
  | "videographer"
  | "photographer"
  | "instructor"
  | "event_organizer"
  | "other";

export type DanceNetworkingSns = {
  platform: "instagram" | "youtube" | "tiktok" | "twitter" | "facebook" | "other";
  handle: string;
};

export type DanceNetworkingEntry = {
  id: string;
  /** 이름 */
  name: string;
  /** 소속 (팀/스튜디오) */
  affiliation?: string;
  /** 전문 장르 (예: 팝핀, 락킹, 힙합 등) */
  genres: string[];
  /** 전화번호 */
  phone?: string;
  /** 이메일 */
  email?: string;
  /** SNS 계정 목록 */
  snsAccounts: DanceNetworkingSns[];
  /** 만남 장소 */
  metAt?: string;
  /** 만난 날짜 (YYYY-MM-DD) */
  metDate?: string;
  /** 관계 유형 */
  role: DanceNetworkingRole;
  /** 메모 */
  notes?: string;
  /** 즐겨찾기 여부 */
  isFavorite: boolean;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type DanceNetworkingData = {
  memberId: string;
  entries: DanceNetworkingEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 실시간 피드 (Live Show Feed)
// ============================================================


export type LiveShowFeedType =
  | "stage"       // 무대상황
  | "backstage"   // 백스테이지
  | "audience"    // 관객반응
  | "technical"   // 기술이슈
  | "other";      // 기타

export type LiveShowFeedPriority =
  | "normal"    // 일반
  | "important" // 중요
  | "urgent";   // 긴급

export type LiveShowFeedEntry = {
  /** 고유 ID */
  id: string;
  /** 시각 (ISO 8601) */
  timestamp: string;
  /** 메시지 */
  message: string;
  /** 작성자 이름 */
  author: string;
  /** 피드 유형 */
  type: LiveShowFeedType;
  /** 중요도 */
  priority: LiveShowFeedPriority;
  /** 이미지 URL (선택) */
  imageUrl?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type LiveShowFeedData = {
  groupId: string;
  projectId: string;
  entries: LiveShowFeedEntry[];
  updatedAt: string;
};


// ============================================
// 멤버 감사 카드 (Member Appreciation Cards)
// ============================================


export type AppreciationCardCategory =
  | "leadership"   // 리더십
  | "effort"       // 노력
  | "growth"       // 성장
  | "help"         // 도움
  | "fun"          // 재미
  | "other";       // 기타

export type AppreciationCardEntry = {
  id: string;
  /** 발신자 멤버 이름 */
  fromMember: string;
  /** 수신자 멤버 이름 */
  toMember: string;
  /** 카테고리 */
  category: AppreciationCardCategory;
  /** 메시지 내용 */
  message: string;
  /** 이모지 (선택) */
  emoji?: string;
  /** 공개 여부 */
  isPublic: boolean;
  /** 좋아요 한 멤버 이름 목록 */
  likes: string[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type AppreciationCardData = {
  groupId: string;
  entries: AppreciationCardEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 사후 분석 보고서 (Post-Show Analysis Report)
// ============================================================


export type PostShowReportSection =
  | "choreography"
  | "staging"
  | "sound"
  | "lighting"
  | "costume"
  | "audience_reaction";

export type PostShowReportSectionScore = {
  /** 섹션 키 */
  section: PostShowReportSection;
  /** 점수 (1~5) */
  score: number;
  /** 코멘트 */
  comment: string;
};

export type PostShowReportEntry = {
  /** 고유 ID */
  id: string;
  /** 보고서 제목 */
  title: string;
  /** 공연 날짜 */
  performanceDate: string;
  /** 총평 */
  overallReview: string;
  /** 섹션별 평가 */
  sectionScores: PostShowReportSectionScore[];
  /** 잘된 점 목록 */
  highlights: string[];
  /** 개선할 점 목록 */
  improvements: string[];
  /** 다음 공연 제안 목록 */
  nextSuggestions: string[];
  /** 관객 수 */
  audienceCount?: number;
  /** 매출 (원) */
  revenue?: number;
  /** 작성자 */
  author: string;
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type PostShowReportData = {
  groupId: string;
  projectId: string;
  entries: PostShowReportEntry[];
  updatedAt: string;
};


// ============================================================
// 그룹 연습 타임캡슐 확장 (Practice Time Capsule Extension)
// ============================================================


export type TimeCapsuleMemberMessage = {
  /** 고유 ID */
  id: string;
  /** 작성자 이름 */
  authorName: string;
  /** 메시지 내용 */
  content: string;
  /** 작성 시각 (ISO 8601) */
  createdAt: string;
};

export type TimeCapsuleEntry = {
  /** 고유 ID */
  id: string;
  /** 캡슐 제목 */
  title: string;
  /** 작성 날짜 (YYYY-MM-DD) */
  writtenAt: string;
  /** 개봉 예정일 (YYYY-MM-DD) */
  openDate: string;
  /** 멤버별 메시지 목록 */
  messages: TimeCapsuleMemberMessage[];
  /** 현재 그룹 목표 */
  currentGoal?: string;
  /** 현재 레퍼토리 목록 */
  currentRepertoire: string[];
  /** 그룹 사진 URL */
  photoUrl?: string;
  /** 봉인 여부 (봉인 후 메시지 추가 불가) */
  isSealed: boolean;
  /** 개봉 여부 */
  isOpened: boolean;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type TimeCapsuleStore = {
  groupId: string;
  entries: TimeCapsuleEntry[];
  updatedAt: string;
};


// ============================================
// Member Attendance Stats Dashboard (멤버 출석 통계 대시보드)
// ============================================


export type MemberAttendStatStatus = "present" | "late" | "early_leave" | "absent";

export type MemberAttendStatRecord = {
  id: string;
  /** 그룹 ID */
  groupId: string;
  /** 멤버 이름 */
  memberName: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 출석 상태 */
  status: MemberAttendStatStatus;
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type MemberAttendStatPeriod = "weekly" | "monthly" | "all";

export type MemberAttendStatSummary = {
  memberName: string;
  totalCount: number;
  presentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  absentCount: number;
  /** 출석률 (0~100) */
  attendanceRate: number;
  /** 연속 출석일 (스트릭) */
  currentStreak: number;
  /** 최장 연속 출석일 */
  longestStreak: number;
};

export type MemberAttendStatOverall = {
  totalRecords: number;
  overallAttendanceRate: number;
  topAttendee: string | null;
  mostAbsentee: string | null;
  perfectAttendanceMembers: string[];
};


// ============================================================
// Dance Injury Log (댄스 부상 기록)
// ============================================================


export type DanceInjuryBodyPart =
  | "shoulder"   // 어깨
  | "knee"       // 무릎
  | "ankle"      // 발목
  | "waist"      // 허리
  | "wrist"      // 손목
  | "neck"       // 목
  | "hip"        // 고관절
  | "elbow"      // 팔꿈치
  | "foot"       // 발
  | "other";     // 기타

export type DanceInjuryType =
  | "muscle_pain"      // 근육통
  | "ligament"         // 인대 손상
  | "fracture"         // 골절
  | "dislocation"      // 탈구
  | "bruise"           // 타박상
  | "sprain"           // 염좌
  | "tendinitis"       // 건염
  | "other";           // 기타

export type DanceInjurySeverity = "mild" | "moderate" | "severe";

export type DanceInjuryRehabStatus = "in_progress" | "recovered" | "chronic";

export type DanceInjuryEntry = {
  /** 고유 ID */
  id: string;
  /** 멤버 ID */
  memberId: string;
  /** 부상 부위 */
  bodyPart: DanceInjuryBodyPart;
  /** 부상 유형 */
  injuryType: DanceInjuryType;
  /** 심각도 */
  severity: DanceInjurySeverity;
  /** 부상 날짜 (YYYY-MM-DD) */
  injuredAt: string;
  /** 예상 회복일 (YYYY-MM-DD, 선택) */
  expectedRecoveryAt?: string;
  /** 재활 상태 */
  rehabStatus: DanceInjuryRehabStatus;
  /** 치료 내용 메모 */
  treatmentNote: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type DanceInjuryLogStore = {
  memberId: string;
  entries: DanceInjuryEntry[];
  updatedAt: string;
};

export type MemberAttendStatStore = {
  groupId: string;
  records: MemberAttendStatRecord[];
  updatedAt: string;
};


// ============================================================
// 소셜 미디어 포스트 플래너 (Social Media Post Planner)
// ============================================================


export type SocialPlatform =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "twitter"
  | "facebook";

export type SocialPostType =
  | "performance_promo"
  | "practice_behind"
  | "member_intro"
  | "review"
  | "etc";

export type SocialPostEntry = {
  /** 고유 ID */
  id: string;
  /** 포스트 제목 */
  title: string;
  /** 본문 내용 */
  content: string;
  /** 해시태그 목록 */
  hashtags: string[];
  /** 플랫폼 */
  platform: SocialPlatform;
  /** 포스트 유형 */
  postType: SocialPostType;
  /** 게시 상태 */
  status: SocialPostStatus;
  /** 예정 날짜 (YYYY-MM-DD) */
  scheduledDate: string;
  /** 예정 시각 (HH:mm) */
  scheduledTime: string;
  /** 담당자 */
  assignee: string;
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type SocialPostPlannerData = {
  groupId: string;
  projectId: string;
  entries: SocialPostEntry[];
  updatedAt: string;
};


// ============================================================
// 댄스 스타일 분석 (Dance Style Analysis)
// ============================================================


export type DanceStyleTrait =
  | "power"
  | "flexibility"
  | "rhythm"
  | "expression"
  | "technique"
  | "musicality";

export type DanceStyleTraitScores = Record<DanceStyleTrait, number>;

export type DanceStyleSnapshot = {
  id: string;
  /** 기록 날짜 (YYYY-MM-DD) */
  date: string;
  /** 주력 장르 목록 */
  primaryGenres: string[];
  /** 부력 장르 목록 */
  secondaryGenres: string[];
  /** 강점 태그 */
  strengths: string[];
  /** 약점 태그 */
  weaknesses: string[];
  /** 특성별 점수 */
  traitScores: DanceStyleTraitScores;
  /** 스타일 노트/코멘트 */
  notes: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type DanceStyleAnalysisData = {
  memberId: string;
  /** 스냅샷 목록 (최신순) */
  snapshots: DanceStyleSnapshot[];
  updatedAt: string;
};


// ============================================================
// 공연 엔딩 크레딧 (Show Ending Credits)
// ============================================================


export type CreditSectionType =
  | "cast"
  | "choreography"
  | "music"
  | "lighting"
  | "costume"
  | "stage"
  | "planning"
  | "special_thanks";

export type CreditPerson = {
  /** 고유 ID */
  id: string;
  /** 이름 */
  name: string;
  /** 역할/직함 */
  role: string;
};

export type CreditSection = {
  /** 고유 ID */
  id: string;
  /** 섹션 유형 */
  type: CreditSectionType;
  /** 섹션 제목 (커스텀 가능) */
  title: string;
  /** 섹션 내 인원 목록 */
  people: CreditPerson[];
  /** 섹션 순서 (0부터 시작) */
  order: number;
};

export type ShowCreditsData = {
  groupId: string;
  projectId: string;
  sections: CreditSection[];
  updatedAt: string;
};


// ============================================================
// 그룹 월간 하이라이트 (Monthly Highlights)
// ============================================================


export type HighlightCategory =
  | "best_practice"
  | "best_performance"
  | "mvp"
  | "growth"
  | "teamwork"
  | "fun_moment";

export type MonthlyHighlight = {
  /** 고유 ID */
  id: string;
  /** YYYY-MM 형식 */
  yearMonth: string;
  /** 하이라이트 제목 */
  title: string;
  /** 카테고리 */
  category: HighlightCategory;
  /** 설명 */
  description: string;
  /** 관련 멤버 이름 목록 */
  relatedMembers: string[];
  /** 사진 URL (선택) */
  photoUrl?: string;
  /** 좋아요한 멤버 이름 목록 */
  likes: string[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type MonthlyHighlightData = {
  groupId: string;
  highlights: MonthlyHighlight[];
  updatedAt: string;
};


// ============================================================
// 공연 무대 세팅 체크리스트 (Stage Setup Checklist)
// ============================================================


export type StageSetupCategory =
  | "sound"
  | "lighting"
  | "floor"
  | "props"
  | "costume"
  | "tech";

export type StageSetupChecklistItem = {
  /** 고유 ID */
  id: string;
  /** 카테고리 */
  category: StageSetupCategory;
  /** 항목 내용 */
  content: string;
  /** 완료 여부 */
  completed: boolean;
  /** 담당자 */
  assignee?: string;
  /** 완료 시각 (ISO 8601) */
  completedAt?: string;
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type StageSetupChecklistData = {
  groupId: string;
  projectId: string;
  items: StageSetupChecklistItem[];
  updatedAt: string;
};


// ============================================================
// 그룹 멘탈 코칭 노트 (Mental Coaching Notes)
// ============================================================


export type MentalCoachingTopic =
  | "자신감"
  | "무대 공포증"
  | "동기부여"
  | "팀워크"
  | "스트레스 관리"
  | "목표 설정";

export type MentalCoachingStatus = "진행중" | "개선됨" | "해결됨";

export type MentalCoachingActionItem = {
  id: string;
  text: string;
  done: boolean;
};

export type MentalCoachingNote = {
  id: string;
  /** 대상 멤버 이름 */
  memberName: string;
  /** 코치 이름 */
  coachName: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 주제 카테고리 */
  topic: MentalCoachingTopic;
  /** 노트 내용 */
  content: string;
  /** 기분/에너지 레벨 (1-5) */
  energyLevel: number;
  /** 액션 아이템 목록 */
  actionItems: MentalCoachingActionItem[];
  /** 진행 상태 */
  status: MentalCoachingStatus;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type MentalCoachingData = {
  groupId: string;
  notes: MentalCoachingNote[];
  updatedAt: string;
};


// ============================================================
// 댄스 루틴 빌더 (Dance Routine Builder)
// ============================================================


export type RoutineStepCategory =
  | "warmup"
  | "stretching"
  | "technique"
  | "choreography"
  | "cooldown";

export type RoutineStep = {
  id: string;
  /** 운동/동작 이름 */
  name: string;
  /** 카테고리 */
  category: RoutineStepCategory;
  /** 세트 수 */
  sets: number;
  /** 반복 횟수 (reps 또는 seconds) */
  reps: number;
  /** 반복 단위: 횟수 | 초 */
  repUnit: "reps" | "seconds";
  /** 메모 */
  memo?: string;
  /** 순서 (1-based) */
  order: number;
};

export type DanceRoutine = {
  id: string;
  /** 루틴 제목 */
  title: string;
  /** 목적 */
  purpose?: string;
  /** 예상 소요시간 (분) */
  estimatedMinutes: number;
  /** 즐겨찾기 여부 */
  favorited: boolean;
  /** 스텝 목록 */
  steps: RoutineStep[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type DanceRoutineData = {
  memberId: string;
  routines: DanceRoutine[];
  updatedAt: string;
};


// ============================================================
// 공연 드레스 리허설 노트 (Dress Rehearsal Notes)
// ============================================================


export type DressRehearsalCategory =
  | "안무"
  | "음악"
  | "조명"
  | "의상"
  | "동선"
  | "소품"
  | "기타";

export type DressRehearsalSeverity = "높음" | "보통" | "낮음";

export type DressRehearsalIssue = {
  /** 고유 ID */
  id: string;
  /** 장면/섹션 */
  section: string;
  /** 이슈 내용 */
  content: string;
  /** 카테고리 */
  category: DressRehearsalCategory;
  /** 심각도 */
  severity: DressRehearsalSeverity;
  /** 담당자 */
  assignee?: string;
  /** 해결 여부 */
  resolved: boolean;
  /** 해결 시각 (ISO 8601) */
  resolvedAt?: string;
};

export type DressRehearsalSession = {
  /** 고유 ID */
  id: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 시간 (HH:mm) */
  time: string;
  /** 장소 */
  venue: string;
  /** 회차 이슈 목록 */
  issues: DressRehearsalIssue[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type DressRehearsalData = {
  projectId: string;
  sessions: DressRehearsalSession[];
  updatedAt: string;
};


// ============================================================
// 그룹 이벤트 캘린더 (Group Event Calendar)
// ============================================================


export type GroupEventCategory =
  | "공연"
  | "워크숍"
  | "모임"
  | "대회"
  | "축제"
  | "연습"
  | "기타";

export type GroupEventRsvpStatus = "참석" | "미참석" | "미정";

export type GroupEventRsvp = {
  /** 사용자 식별자 (브라우저 UUID) */
  userId: string;
  /** 참석 여부 */
  status: GroupEventRsvpStatus;
  /** 업데이트 시각 (ISO 8601) */
  updatedAt: string;
};

export type GroupCalendarEvent = {
  id: string;
  /** 제목 */
  title: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 시작 시간 (HH:MM) */
  time: string;
  /** 종료 시간 (HH:MM) */
  endTime: string;
  /** 장소 */
  location: string;
  /** 카테고리 */
  category: GroupEventCategory;
  /** 설명 */
  description: string;
  /** RSVP 목록 */
  rsvps: GroupEventRsvp[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type GroupEventCalendarData = {
  groupId: string;
  events: GroupCalendarEvent[];
  updatedAt: string;
};


// ============================================================
// 연습실 예약 (Practice Room Booking)
// ============================================================


export type PracticeRoom = {
  id: string;
  /** 연습실 이름 */
  name: string;
  /** 주소 */
  address: string;
  /** 수용 인원 */
  capacity: number;
  /** 시간당 비용 (원) */
  costPerHour: number;
  /** 연락처 */
  contact: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type PracticeRoomBookingStatus =
  | "예약됨"
  | "확정됨"
  | "취소됨"
  | "완료됨";

export type PracticeRoomBooking = {
  id: string;
  /** 연습실 ID */
  roomId: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 시작 시간 (HH:MM) */
  startTime: string;
  /** 종료 시간 (HH:MM) */
  endTime: string;
  /** 예약자 이름 */
  bookedBy: string;
  /** 예약 상태 */
  status: PracticeRoomBookingStatus;
  /** 메모 */
  memo: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type PracticeRoomBookingData = {
  groupId: string;
  rooms: PracticeRoom[];
  bookings: PracticeRoomBooking[];
  updatedAt: string;
};


// ============================================================
// 공연 무대 전환 계획 (Stage Transition Plan)
// ============================================================


export type StageTransitionType =
  | "blackout"
  | "light_fade"
  | "curtain"
  | "set_change"
  | "costume_change"
  | "other";

export type StageTransitionTask = {
  /** 고유 ID */
  id: string;
  /** 할 일 내용 */
  text: string;
  /** 완료 여부 */
  done: boolean;
};

export type StageTransitionItem = {
  /** 고유 ID */
  id: string;
  /** 순서 (1-based) */
  order: number;
  /** 이전 장면 */
  fromScene: string;
  /** 다음 장면 */
  toScene: string;
  /** 전환 시간 (초) */
  durationSec: number;
  /** 전환 유형 */
  transitionType: StageTransitionType;
  /** 할 일 체크리스트 */
  tasks: StageTransitionTask[];
  /** 담당 스태프 */
  assignedStaff: string;
  /** 연습 완료 여부 */
  rehearsed: boolean;
  /** 메모 */
  notes: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type StageTransitionData = {
  projectId: string;
  items: StageTransitionItem[];
  updatedAt: string;
};


// ============================================
// Group Budget Tracker (그룹 예산 트래커, localStorage 기반)
// ============================================


export type GroupBudgetTransaction = {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  paidBy: string | null;
  receiptNote: string | null;
  createdAt: string;
};

export type GroupBudgetCategory = {
  name: string;
  icon: string; // emoji
};

export type GroupBudgetData = {
  groupId: string;
  transactions: GroupBudgetTransaction[];
  categories: GroupBudgetCategory[];
  monthlyBudgetLimit: number | null;
  updatedAt: string;
};


// ============================================================
// QR 체크인 (그룹 출결 QR 기반 체크인 시스템)
// ============================================================


export type QrCheckInSession = {
  /** 세션 ID */
  id: string;
  /** 세션 제목 (예: "2024년 2월 정기 연습") */
  title: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 시작 시간 (HH:MM) */
  startTime: string;
  /** 종료 시간 (HH:MM) — 진행 중이면 null */
  endTime: string | null;
  /** QR 코드로 사용할 랜덤 문자열 */
  qrCode: string;
  /** 활성 여부 */
  isActive: boolean;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type QrCheckInRecord = {
  /** 기록 ID */
  id: string;
  /** 세션 ID */
  sessionId: string;
  /** 체크인한 멤버 이름 */
  memberName: string;
  /** 체크인 시각 (ISO 8601) */
  checkedInAt: string;
  /** 체크인 방식 */
  method: "qr" | "manual";
};

export type QrCheckInData = {
  groupId: string;
  sessions: QrCheckInSession[];
  records: QrCheckInRecord[];
  updatedAt: string;
};


// ============================================
// 공연 티켓 관리 (Performance Ticket)
// ============================================


export type PerfTicketTier = {
  id: string;
  /** 등급 이름 (VIP, 일반석 등) */
  name: string;
  /** 티켓 가격 (원) */
  price: number;
  /** 총 수량 */
  totalQuantity: number;
  /** 표시 색상 */
  color: string;
};

export type PerfAllocationStatus = "reserved" | "confirmed" | "cancelled";

export type PerfTicketAllocation = {
  id: string;
  /** 연결된 등급 id */
  tierId: string;
  /** 수령인 이름 */
  recipientName: string;
  /** 배분 수량 */
  quantity: number;
  /** 배분 상태 */
  status: PerfAllocationStatus;
  /** 메모 */
  notes: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type PerfTicketData = {
  projectId: string;
  tiers: PerfTicketTier[];
  allocations: PerfTicketAllocation[];
  /** 판매 목표 수량 (null = 미설정) */
  salesGoal: number | null;
  updatedAt: string;
};


// ============================================
// Stage Formation (무대 포메이션 디자이너, localStorage 기반)
// ============================================


export type StageFormationPosition = {
  /** 고유 ID */
  id: string;
  /** 멤버 이름 */
  memberName: string;
  /** 가로 위치 (0~100%) */
  x: number;
  /** 세로 위치 (0~100%) */
  y: number;
  /** 마커 색상 */
  color: string;
};

export type StageFormationScene = {
  /** 고유 ID */
  id: string;
  /** 씬 이름 */
  name: string;
  /** 씬 설명 */
  description: string;
  /** 멤버 위치 목록 */
  positions: StageFormationPosition[];
  /** 표시 순서 */
  order: number;
  /** 지속 시간 (초, null 이면 미지정) */
  durationSec: number | null;
};

export type StageFormationData = {
  projectId: string;
  scenes: StageFormationScene[];
  /** 무대 너비 (m) */
  stageWidth: number;
  /** 무대 깊이 (m) */
  stageDepth: number;
  /** 전체 메모 */
  notes: string;
  updatedAt: string;
};


// ============================================================
// 멤버 댄스 뮤직 플레이리스트 (Dance Music Playlist, localStorage 기반)
// ============================================================


export type DanceMusicTrack = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 곡명 */
  title: string;
  /** 아티스트 */
  artist: string;
  /** 장르 */
  genre: string;
  /** BPM (선택) */
  bpm: number | null;
  /** 재생 시간 (예: "3:45", 선택) */
  duration: string | null;
  /** 링크 URL (YouTube, Spotify 등, 선택) */
  url: string | null;
  /** 태그 목록 */
  tags: string[];
  /** 메모 */
  notes: string;
  /** 즐겨찾기 여부 */
  isFavorite: boolean;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type DanceMusicPlaylist = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 플레이리스트 이름 */
  name: string;
  /** 설명 */
  description: string;
  /** 트랙 목록 */
  tracks: DanceMusicTrack[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type DanceMusicData = {
  /** 멤버 ID */
  memberId: string;
  /** 플레이리스트 목록 */
  playlists: DanceMusicPlaylist[];
  /** 마지막 수정 시각 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// Dance Goal Tracker (멤버 댄스 목표 트래커, localStorage 기반)
// ============================================


export type DanceGoalMilestone = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 마일스톤 제목 */
  title: string;
  /** 완료 여부 */
  isCompleted: boolean;
  /** 완료 일시 (ISO 8601, null이면 미완료) */
  completedAt: string | null;
};

export type DanceGoalCategory =
  | "technique"
  | "flexibility"
  | "strength"
  | "performance"
  | "choreography"
  | "other";

export type DanceGoalPriority = "high" | "medium" | "low";

export type DanceGoalStatus = "active" | "completed" | "paused";

export type DanceGoal = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 목표 제목 */
  title: string;
  /** 목표 설명 */
  description: string;
  /** 카테고리 */
  category: DanceGoalCategory;
  /** 우선순위 */
  priority: DanceGoalPriority;
  /** 마일스톤 목록 */
  milestones: DanceGoalMilestone[];
  /** 목표 날짜 (ISO 8601, null이면 미설정) */
  targetDate: string | null;
  /** 진행률 (0~100) */
  progress: number;
  /** 상태 */
  status: DanceGoalStatus;
  /** 생성 일시 (ISO 8601) */
  createdAt: string;
  /** 수정 일시 (ISO 8601) */
  updatedAt: string;
};

export type DanceGoalTrackerData = {
  /** 멤버 ID */
  memberId: string;
  /** 목표 목록 */
  goals: DanceGoal[];
  /** 마지막 수정 시각 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// 백스테이지 커뮤니케이션 로그
// ============================================================


export type BackstageLogCategory =
  | "cue"
  | "warning"
  | "info"
  | "emergency"
  | "general";

export type BackstageLogEntry = {
  /** 항목 고유 ID */
  id: string;
  /** 발신자 이름 */
  senderName: string;
  /** 메시지 내용 */
  message: string;
  /** 카테고리 */
  category: BackstageLogCategory;
  /** 타임스탬프 (ISO 8601) */
  timestamp: string;
  /** 해결 여부 */
  isResolved: boolean;
  /** 해결 처리자 이름 (null이면 미해결) */
  resolvedBy: string | null;
};

export type BackstageLogSession = {
  /** 세션 고유 ID */
  id: string;
  /** 공연명 */
  showName: string;
  /** 공연 날짜 (YYYY-MM-DD) */
  showDate: string;
  /** 로그 항목 목록 */
  entries: BackstageLogEntry[];
  /** 세션 활성 여부 */
  isActive: boolean;
  /** 세션 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type BackstageLogData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 세션 목록 */
  sessions: BackstageLogSession[];
  /** 마지막 수정 시각 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// 공연 후원/스폰서 관리 (localStorage 기반)
// ============================================================


export type PerfSponsorTier =
  | "platinum"
  | "gold"
  | "silver"
  | "bronze"
  | "supporter";

export type PerfSponsorEntry = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 스폰서 이름 (기업/개인) */
  name: string;
  /** 담당자 이름 (null이면 미지정) */
  contactPerson: string | null;
  /** 담당자 이메일 (null이면 미지정) */
  contactEmail: string | null;
  /** 후원 등급 */
  tier: PerfSponsorTier;
  /** 후원 금액 (원) */
  amount: number;
  /** 현물 후원 설명 (null이면 현물 없음) */
  inKind: string | null;
  /** 로고 게재 위치 (null이면 해당 없음) */
  logoPlacement: string | null;
  /** 제공 혜택 목록 */
  benefits: string[];
  /** 후원 상태 */
  status: "confirmed" | "pending" | "declined";
  /** 메모 */
  notes: string;
  /** 생성 일시 (ISO 8601) */
  createdAt: string;
};

export type PerfSponsorshipData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 스폰서 목록 */
  sponsors: PerfSponsorEntry[];
  /** 후원 목표 금액 (null이면 미설정) */
  totalGoal: number | null;
  /** 마지막 수정 시각 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// Attendance Book (그룹 출석부, localStorage 기반)
// ============================================


export type BookAttendanceStatus = "present" | "absent" | "late" | "excused";

export type AttendanceRecord = {
  memberName: string;
  status: BookAttendanceStatus;
  note: string | null;
};

export type AttendanceSheet = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  records: AttendanceRecord[];
  createdAt: string; // ISO 8601
};

export type AttendanceBookData = {
  groupId: string;
  sheets: AttendanceSheet[];
  updatedAt: string; // ISO 8601
};


// ============================================================
// 멤버 댄스 컨디션 일지 v2 (DanceConditionJournal)
// ============================================================


export type DanceConditionMood =
  | "great"    // 최고
  | "good"     // 좋음
  | "neutral"  // 보통
  | "tired"    // 피곤
  | "bad";     // 나쁨

export type DanceConditionJournalEntry = {
  id: string;                // 고유 ID
  date: string;              // 기록 날짜 (YYYY-MM-DD)
  energyLevel: number;       // 에너지 레벨 (1~5)
  mood: DanceConditionMood;  // 기분 상태
  bodyParts: string[];       // 통증 부위 목록
  sleepHours: number | null; // 수면 시간 (시간 단위)
  practiceMinutes: number | null; // 연습 시간 (분 단위)
  notes: string;             // 메모
  createdAt: string;         // 생성일 (ISO datetime)
};

export type DanceConditionJournalData = {
  memberId: string;                      // 멤버 ID
  entries: DanceConditionJournalEntry[]; // 기록 목록 (최신순)
  updatedAt: string;                     // 마지막 수정일 (ISO datetime)
};


// ============================================
// Group Equipment (그룹 장비 관리, localStorage 기반)
// ============================================


export type EquipmentCategory = "audio" | "lighting" | "costume" | "prop" | "other";

export type GroupEquipmentCondition = "good" | "fair" | "poor" | "broken";

export type GroupEquipmentItem = {
  id: string;
  name: string;
  category: EquipmentCategory;
  quantity: number;
  condition: GroupEquipmentCondition;
  location: string | null;
  notes: string;
  createdAt: string; // ISO 8601
};

export type EquipmentLoanRecord = {
  id: string;
  equipmentId: string;
  borrowerName: string;
  borrowedAt: string; // ISO 8601
  returnedAt: string | null; // ISO 8601 or null (미반납)
  quantity: number;
  notes: string;
};

export type GroupEquipmentData = {
  groupId: string;
  items: GroupEquipmentItem[];
  loans: EquipmentLoanRecord[];
  updatedAt: string; // ISO 8601
};


// ============================================
// Program Book Editor (공연 프로그램 북 편집기, localStorage 기반)
// ============================================


export type ProgramBookItemType =
  | "performance"
  | "intermission"
  | "opening"
  | "closing"
  | "special";

export type ProgramBookItem = {
  id: string;
  order: number;
  type: ProgramBookItemType;
  title: string;
  performers: string[];
  duration: string | null;
  description: string;
  musicTitle: string | null;
};

export type ProgramBookCast = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
};

export type ProgramBookEditorData = {
  projectId: string;
  items: ProgramBookItem[];
  cast: ProgramBookCast[];
  showTitle: string;
  showDate: string | null;
  venue: string | null;
  notes: string;
  updatedAt: string;
};


// ============================================================
// 그룹 회의록 투표 (MeetingVoteAgenda)
// ============================================================


export type MeetingVoteOption = {
  id: string;
  text: string;
};

export type MeetingVoteRecord = {
  optionId: string;
  voterName: string;
  votedAt: string; // ISO 8601
};

export type MeetingVoteAgendaItem = {
  id: string;
  meetingTitle: string;
  question: string;
  options: MeetingVoteOption[];
  votes: MeetingVoteRecord[];
  isMultiSelect: boolean;
  isAnonymous: boolean;
  isClosed: boolean;
  deadline: string | null; // ISO 8601 or null
  createdAt: string; // ISO 8601
};

export type MeetingVoteData = {
  groupId: string;
  agendas: MeetingVoteAgendaItem[];
  updatedAt: string; // ISO 8601
};


// ============================================
// Marketing Campaign (공연 마케팅 캠페인 관리, localStorage 기반)
// ============================================


export type MarketingChannel =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "poster"
  | "flyer"
  | "email"
  | "other";

export type MarketingCampaignTask = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 태스크 제목 */
  title: string;
  /** 마케팅 채널 */
  channel: MarketingChannel;
  /** 담당자 이름 (null = 미배정) */
  assignee: string | null;
  /** 마감일 (YYYY-MM-DD, null = 없음) */
  dueDate: string | null;
  /** 진행 상태 */
  status: "todo" | "in_progress" | "done";
  /** 콘텐츠 URL (SNS 게시물, 이미지 링크 등, null = 없음) */
  contentUrl: string | null;
  /** 메모 */
  notes: string;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type MarketingCampaignData = {
  /** 연결된 프로젝트 ID */
  projectId: string;
  /** 태스크 목록 */
  tasks: MarketingCampaignTask[];
  /** 캠페인 이름 */
  campaignName: string;
  /** 타겟 관객 설명 (null = 미설정) */
  targetAudience: string | null;
  /** 예산 (원, null = 미설정) */
  budget: number | null;
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// 그룹 공유 파일함
// ============================================


export type SharedFileCategory =
  | "document"
  | "image"
  | "video"
  | "audio"
  | "spreadsheet"
  | "other";

export type SharedFileItem = {
  /** 고유 ID */
  id: string;
  /** 파일/자료 이름 */
  name: string;
  /** 파일 URL 또는 링크 */
  url: string;
  /** 카테고리 */
  category: SharedFileCategory;
  /** 설명 (null = 미입력) */
  description: string | null;
  /** 업로더 이름 */
  uploadedBy: string;
  /** 파일 크기 표시 텍스트 (null = 미입력) */
  fileSize: string | null;
  /** 태그 목록 */
  tags: string[];
  /** 소속 폴더 ID (null = 루트) */
  folderId: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type SharedFileFolderItem = {
  /** 고유 ID */
  id: string;
  /** 폴더 이름 */
  name: string;
  /** 상위 폴더 ID (null = 루트) */
  parentId: string | null;
};

export type SharedFileData = {
  /** 연결된 그룹 ID */
  groupId: string;
  /** 파일 목록 */
  files: SharedFileItem[];
  /** 폴더 목록 */
  folders: SharedFileFolderItem[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// 리허설 스케줄러 (공연 리허설 일정 관리 - localStorage 기반)
// ============================================================


export type RehearsalScheduleCheckItem = {
  /** 항목 ID */
  id: string;
  /** 항목 제목 */
  title: string;
  /** 완료 여부 */
  isChecked: boolean;
};

export type RehearsalScheduleType = "full" | "partial" | "tech" | "dress" | "blocking";

export type RehearsalScheduleStatus = "scheduled" | "completed" | "cancelled";

export type RehearsalScheduleItem = {
  /** 리허설 ID */
  id: string;
  /** 리허설 제목 */
  title: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 시작 시간 (HH:MM) */
  startTime: string;
  /** 종료 시간 (HH:MM, null = 미설정) */
  endTime: string | null;
  /** 장소 (null = 미설정) */
  location: string | null;
  /** 리허설 유형 */
  type: RehearsalScheduleType;
  /** 참여자 목록 */
  participants: string[];
  /** 체크리스트 */
  checklist: RehearsalScheduleCheckItem[];
  /** 메모 */
  notes: string;
  /** 상태 */
  status: RehearsalScheduleStatus;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type RehearsalScheduleData = {
  /** 연결된 프로젝트 ID */
  projectId: string;
  /** 리허설 목록 */
  rehearsals: RehearsalScheduleItem[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// 멤버 댄스 영상 포트폴리오
// ============================================


export type DanceVideoItem = {
  /** 고유 ID */
  id: string;
  /** 영상 제목 */
  title: string;
  /** 영상 URL (유튜브, 인스타 등) */
  url: string;
  /** 썸네일 URL (null = 없음) */
  thumbnailUrl: string | null;
  /** 장르 (예: 힙합, 팝핀, null = 미설정) */
  genre: string | null;
  /** 태그 목록 */
  tags: string[];
  /** 설명 */
  description: string;
  /** 영상 길이 (예: "3:45", null = 미설정) */
  duration: string | null;
  /** 촬영/업로드 날짜 (YYYY-MM-DD, null = 미설정) */
  recordedAt: string | null;
  /** 대표 영상 여부 */
  isFeatured: boolean;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type DanceVideoPortfolioData = {
  /** 연결된 멤버 ID */
  memberId: string;
  /** 영상 목록 */
  videos: DanceVideoItem[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// 그룹 멤버 생일 캘린더 (Member Birthday Calendar - localStorage 기반)
// ============================================================


export type MemberBirthdayEntry = {
  /** 항목 고유 ID */
  id: string;
  /** 멤버 이름 */
  memberName: string;
  /** 생일 월 (1~12) */
  birthMonth: number;
  /** 생일 일 (1~31) */
  birthDay: number;
  /** 소원/희망 메시지 (null = 미설정) */
  wishMessage: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type BirthdayCelebration = {
  /** 항목 고유 ID */
  id: string;
  /** 연결된 MemberBirthdayEntry.id */
  birthdayId: string;
  /** 작성자 이름 */
  fromName: string;
  /** 축하 메시지 */
  message: string;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type MemberBirthdayData = {
  /** 연결된 그룹 ID */
  groupId: string;
  /** 생일 목록 */
  birthdays: MemberBirthdayEntry[];
  /** 축하 메시지 목록 */
  celebrations: BirthdayCelebration[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// 공연 관객 피드백 수집 (Audience Feedback - localStorage 기반)
// ============================================================


export type AudienceFeedbackQuestion = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 질문 내용 */
  question: string;
  /** 질문 유형: rating(별점), text(주관식), choice(객관식) */
  type: "rating" | "text" | "choice";
  /** 객관식 보기 목록 (choice 타입일 때만 사용, 나머지는 null) */
  choices: string[] | null;
};

export type AudienceFeedbackResponse = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 응답자 이름 (null = 익명) */
  respondentName: string | null;
  /** 질문별 답변 (key: questionId, value: 별점 숫자 또는 텍스트) */
  answers: Record<string, string | number>;
  /** 제출 시각 (ISO 8601) */
  submittedAt: string;
};

export type AudienceFeedbackSurveyItem = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 설문 제목 */
  title: string;
  /** 질문 목록 */
  questions: AudienceFeedbackQuestion[];
  /** 응답 목록 */
  responses: AudienceFeedbackResponse[];
  /** 설문 활성 여부 */
  isActive: boolean;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type AudienceFeedbackData = {
  /** 연결된 프로젝트 ID */
  projectId: string;
  /** 설문 목록 */
  surveys: AudienceFeedbackSurveyItem[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// Dance Class Review (댄스 수업 평가 노트, localStorage 기반)
// ============================================


export type DanceClassDifficulty = "beginner" | "intermediate" | "advanced";

export type DanceClassReview = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 수업/워크숍 이름 */
  className: string;
  /** 강사 이름 (null = 미기재) */
  instructorName: string | null;
  /** 수강 날짜 (YYYY-MM-DD) */
  date: string;
  /** 평가 별점 (1~5) */
  rating: number;
  /** 난이도 */
  difficulty: DanceClassDifficulty;
  /** 장르 (null = 미기재) */
  genre: string | null;
  /** 배운 점 / 핵심 메모 */
  takeaways: string;
  /** 재수강 의향 */
  wouldRepeat: boolean;
  /** 수업 비용 (null = 미기재, 0 = 무료) */
  cost: number | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type DanceClassReviewData = {
  /** 연결된 멤버 ID */
  memberId: string;
  /** 평가 목록 */
  reviews: DanceClassReview[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// 공연 무대 안전 점검
// ============================================================


export type SafetyCheckItem = {
  /** 항목 ID */
  id: string;
  /** 카테고리 */
  category:
    | "electrical"
    | "structural"
    | "fire"
    | "emergency"
    | "equipment"
    | "other";
  /** 점검 내용 */
  description: string;
  /** 점검 상태 */
  status: "pass" | "fail" | "pending" | "na";
  /** 비고 */
  notes: string | null;
  /** 점검자 이름 */
  inspectorName: string | null;
};

export type SafetyInspection = {
  /** 점검 ID */
  id: string;
  /** 점검 제목 */
  title: string;
  /** 점검 일자 (ISO 8601) */
  date: string;
  /** 공연장 */
  venue: string | null;
  /** 점검 항목 목록 */
  items: SafetyCheckItem[];
  /** 전체 결과 */
  overallStatus: "approved" | "conditional" | "rejected";
  /** 서명자 */
  signedBy: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type StageSafetyData = {
  /** 연결된 프로젝트 ID */
  projectId: string;
  /** 점검 기록 목록 */
  inspections: SafetyInspection[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// Costume Fitting (공연 의상 핏팅 기록, localStorage 기반)
// ============================================


export type CostumeFittingMeasurement = {
  /** 키 (cm) */
  height: string | null;
  /** 가슴둘레 (cm) */
  chest: string | null;
  /** 허리둘레 (cm) */
  waist: string | null;
  /** 엉덩이둘레 (cm) */
  hip: string | null;
  /** 신발 사이즈 (mm) */
  shoeSize: string | null;
  /** 기타 메모 */
  notes: string | null;
};

export type CostumeFittingStatus = "pending" | "fitted" | "altered" | "completed";

export type CostumeFittingEntry = {
  /** 고유 ID */
  id: string;
  /** 멤버 이름 */
  memberName: string;
  /** 의상 이름 */
  costumeName: string;
  /** 치수 정보 */
  measurements: CostumeFittingMeasurement;
  /** 핏팅 상태 */
  status: CostumeFittingStatus;
  /** 핏팅 날짜 (ISO 8601) */
  fittingDate: string | null;
  /** 수선 메모 */
  alterationNotes: string | null;
  /** 사진 URL */
  photoUrl: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type CostumeFittingData = {
  /** 연결된 프로젝트 ID */
  projectId: string;
  /** 핏팅 항목 목록 */
  entries: CostumeFittingEntry[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};

export type MediaGalleryItem = {
  /** 고유 ID */
  id: string;
  /** 미디어 유형 */
  type: "photo" | "video";
  /** 제목 */
  title: string;
  /** 미디어 URL */
  url: string;
  /** 썸네일 URL (null이면 url을 직접 사용) */
  thumbnailUrl: string | null;
  /** 설명 */
  description: string | null;
  /** 업로드한 멤버 이름 또는 ID */
  uploadedBy: string;
  /** 태그 목록 */
  tags: string[];
  /** 소속 앨범 ID (null이면 미분류) */
  albumId: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type MediaAlbum = {
  /** 고유 ID */
  id: string;
  /** 앨범 이름 */
  name: string;
  /** 앨범 설명 */
  description: string | null;
  /** 커버 이미지 URL */
  coverUrl: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type MediaGalleryData = {
  /** 연결된 그룹 ID */
  groupId: string;
  /** 미디어 항목 목록 */
  items: MediaGalleryItem[];
  /** 앨범 목록 */
  albums: MediaAlbum[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// 그룹 기념일 (Group Anniversary, localStorage 기반)
// ============================================================


export type GroupAnniversaryType =
  | "founding"       // 창립 기념일
  | "performance"    // 공연 기념일
  | "achievement"    // 성과/수상 기념일
  | "custom";        // 사용자 정의

export type GroupAnniversaryItem = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 기념일 제목 */
  title: string;
  /** 기념일 날짜 (YYYY-MM-DD) */
  date: string;
  /** 기념일 유형 */
  type: GroupAnniversaryType;
  /** 설명 (선택) */
  description: string | null;
  /** 매년 반복 여부 */
  isRecurring: boolean;
  /** 사전 알림 일수 (null이면 알림 없음) */
  reminderDays: number | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type GroupAnniversaryData = {
  /** 그룹 ID */
  groupId: string;
  /** 기념일 목록 */
  anniversaries: GroupAnniversaryItem[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// 공연 무대 소품 관리 v2 (StagePropItem / StagePropData)
// ============================================================


export type StagePropCategory =
  | "furniture"      // 가구/소품
  | "decoration"     // 장식
  | "handheld"       // 핸드헬드
  | "backdrop"       // 배경막
  | "lighting_prop"  // 조명 소품
  | "other";         // 기타

export type StagePropItemStatus =
  | "available"  // 사용 가능
  | "in_use"     // 사용 중
  | "damaged"    // 손상됨
  | "missing";   // 분실

export type StagePropItem = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 소품 이름 */
  name: string;
  /** 카테고리 */
  category: StagePropCategory;
  /** 수량 */
  quantity: number;
  /** 사용 씬/장면 */
  scene: string | null;
  /** 배치 위치 */
  placement: string | null;
  /** 담당자 */
  responsiblePerson: string | null;
  /** 상태 */
  status: StagePropItemStatus;
  /** 메모 */
  notes: string;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type StagePropData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 소품 목록 */
  props: StagePropItem[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// 공연 세트리스트 v2 (ShowSetlist - 곡 순서/전환 타이밍 관리)
// ============================================


export type ShowSetlistItem = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 순서 (1부터 시작) */
  order: number;
  /** 곡 제목 */
  songTitle: string;
  /** 아티스트 (선택) */
  artist: string | null;
  /** 장르 (선택) */
  genre: string | null;
  /** 재생 시간 - 예: "3:45" (선택) */
  duration: string | null;
  /** 다음 곡으로의 전환 메모 (선택) */
  transitionNote: string | null;
  /** 담당 퍼포머 목록 */
  performers: string[];
  /** 앙코르 여부 */
  isEncore: boolean;
  /** 비고 */
  notes: string;
};

export type ShowSetlistData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 세트리스트 항목 목록 */
  items: ShowSetlistItem[];
  /** 공연 제목 */
  showTitle: string;
  /** 총 소요시간 (선택) */
  totalDuration: string | null;
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};

export type MembershipFeePayment = {
  /** 고유 ID */
  id: string;
  /** 멤버 이름 */
  memberName: string;
  /** 대상 월 ("2024-01" 형식) */
  month: string;
  /** 납부 금액 */
  amount: number;
  /** 납부일 (ISO 8601, null이면 미납) */
  paidAt: string | null;
  /** 납부 상태 */
  status: "paid" | "unpaid" | "partial" | "exempt";
  /** 메모 */
  notes: string | null;
};

export type MembershipFeeData = {
  /** 그룹 ID */
  groupId: string;
  /** 납부 항목 목록 */
  payments: MembershipFeePayment[];
  /** 월 기본 회비 금액 */
  monthlyFee: number;
  /** 통화 단위 */
  currency: string;
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// Dance Competition Record (댄스 대회 참가 기록)
// ============================================


export type DanceCompetitionRecord = {
  /** 고유 ID */
  id: string;
  /** 대회명 */
  competitionName: string;
  /** 대회 날짜 (YYYY-MM-DD) */
  date: string;
  /** 장소 */
  location: string | null;
  /** 참가 부문/카테고리 */
  category: string | null;
  /** 입상 결과 ("1위", "2위", "3위", "결선진출", "본선진출" 등) */
  placement: string | null;
  /** 참가 유형 */
  teamOrSolo: "solo" | "team" | "duo";
  /** 팀명 (팀/듀오 참가 시) */
  teamName: string | null;
  /** 장르 */
  genre: string | null;
  /** 메모 */
  notes: string;
  /** 수상 증명서 URL (선택) */
  certificateUrl: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type DanceCompetitionData = {
  /** 멤버 ID */
  memberId: string;
  /** 참가 기록 목록 */
  records: DanceCompetitionRecord[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// Group Rulebook (그룹 규정집 관리, localStorage 기반)
// ============================================================


export type GroupRuleSection = {
  /** 고유 식별자 */
  id: string;
  /** 섹션 제목 */
  title: string;
  /** 섹션 내용 */
  content: string;
  /** 정렬 순서 (낮을수록 앞) */
  order: number;
  /** 중요 규정 여부 */
  isImportant: boolean;
  /** 마지막 편집자 이름 (없으면 null) */
  lastEditedBy: string | null;
  /** 수정일 (ISO 8601) */
  updatedAt: string;
};

export type GroupRulebookData = {
  /** 그룹 ID */
  groupId: string;
  /** 규정 섹션 목록 */
  sections: GroupRuleSection[];
  /** 규정집 버전 (예: "v1.0", "2026년 개정판") */
  version: string;
  /** 시행일 (YYYY-MM-DD, null이면 미정) */
  effectiveDate: string | null;
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// Consent Form (공연 출연 동의서 관리, localStorage 기반)
// ============================================


export type ConsentFormType =
  | "performance"
  | "photo"
  | "video"
  | "medical"
  | "liability"
  | "other";

export type ConsentFormStatus = "pending" | "signed" | "declined";

export type ConsentFormItem = {
  id: string;
  memberName: string;
  formType: ConsentFormType;
  status: ConsentFormStatus;
  signedAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type ConsentFormData = {
  projectId: string;
  items: ConsentFormItem[];
  updatedAt: string;
};


// ============================================
// Group Music Library (그룹 음악 라이브러리)
// ============================================


export type MusicTrackUseCase =
  | "practice"
  | "performance"
  | "warmup"
  | "cooldown"
  | "other";

export type GroupMusicTrack = {
  /** 트랙 고유 ID */
  id: string;
  /** 트랙 제목 */
  title: string;
  /** 아티스트명 */
  artist: string;
  /** 장르 (없으면 null) */
  genre: string | null;
  /** BPM (없으면 null) */
  bpm: number | null;
  /** 재생 시간 (예: "3:45", 없으면 null) */
  duration: string | null;
  /** 음악 URL 또는 링크 (없으면 null) */
  url: string | null;
  /** 추가한 멤버 이름 */
  addedBy: string;
  /** 태그 목록 */
  tags: string[];
  /** 즐겨찾기 여부 */
  isFavorite: boolean;
  /** 용도 */
  useCase: MusicTrackUseCase;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type GroupMusicLibraryData = {
  /** 그룹 ID */
  groupId: string;
  /** 트랙 목록 */
  tracks: GroupMusicTrack[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// Group Practice Feedback v2 (그룹 연습 피드백 - 상호 피드백 공유)
// ============================================


export type GroupPracticeFeedbackEntry = {
  id: string;
  /** 연습 날짜 (YYYY-MM-DD) */
  practiceDate: string;
  /** 연습 제목 (선택) */
  practiceTitle: string | null;
  /** 작성자 이름 */
  authorName: string;
  /** 별점 (1~5) */
  rating: number;
  /** 잘한 점 */
  positives: string;
  /** 개선할 점 */
  improvements: string;
  /** 다음 목표 (선택) */
  goals: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type GroupPracticeFeedbackData = {
  /** 그룹 ID */
  groupId: string;
  /** 피드백 항목 목록 */
  entries: GroupPracticeFeedbackEntry[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// Photo Shoot Plan (공연 사진 촬영 계획, localStorage 기반)
// ============================================


export type PhotoShootPlanType =
  | "group"
  | "individual"
  | "action"
  | "backstage"
  | "detail";

export type PhotoShootPlan = {
  id: string;
  title: string;
  type: PhotoShootPlanType;
  location: string | null;
  timing: string | null;
  participants: string[];
  poseDescription: string | null;
  referenceUrl: string | null;
  isCompleted: boolean;
  notes: string;
  createdAt: string;
};

export type PhotoShootData = {
  projectId: string;
  plans: PhotoShootPlan[];
  photographerName: string | null;
  updatedAt: string;
};


// ============================================
// Fitness Test (멤버 댄스 체력 측정 기록, localStorage 기반)
// ============================================


export type FitnessTestRecord = {
  /** 고유 식별자 */
  id: string;
  /** 측정 날짜 (YYYY-MM-DD) */
  date: string;
  /** 유연성 점수 (0~100, 없으면 null) */
  flexibility: number | null;
  /** 근력 점수 (0~100, 없으면 null) */
  strength: number | null;
  /** 지구력 점수 (0~100, 없으면 null) */
  endurance: number | null;
  /** 균형감각 점수 (0~100, 없으면 null) */
  balance: number | null;
  /** 스피드/리듬 점수 (0~100, 없으면 null) */
  speed: number | null;
  /** 메모 (없으면 null) */
  notes: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type FitnessTestData = {
  /** 멤버 ID */
  memberId: string;
  /** 측정 기록 목록 */
  records: FitnessTestRecord[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// 댄스 스타일 프로필 v2 (DanceStyleProfileCard 전용)
// ============================================================


export type DanceProfileSkillStar = 1 | 2 | 3 | 4 | 5;

export type DanceProfileGenreEntry = {
  /** 장르명 (예: 힙합, 팝핑 등) */
  genre: string;
  /** 숙련도 별점 1~5 */
  stars: DanceProfileSkillStar;
};

export type DanceProfilePosition = "center" | "side" | "back";

export type DanceProfilePracticeTime = "morning" | "afternoon" | "evening" | "midnight";

export type DanceProfileInspirationEntry = {
  /** 댄서 이름 */
  name: string;
  /** 메모 (선택) */
  memo?: string;
};

export type DanceProfileBpmRange = {
  min: number;
  max: number;
};

export type DanceStyleProfileV2 = {
  /** 멤버 ID */
  memberId: string;
  /** 선호 장르 + 숙련도 목록 */
  genres: DanceProfileGenreEntry[];
  /** 선호 포지션 */
  position: DanceProfilePosition | null;
  /** 자기소개 */
  bio: string;
  /** 영감을 받은 댄서 목록 */
  inspirations: DanceProfileInspirationEntry[];
  /** 연습 시간 선호도 목록 (복수 선택 가능) */
  practiceTimes: DanceProfilePracticeTime[];
  /** 선호 음악 BPM 범위 */
  bpmRange: DanceProfileBpmRange;
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// GroupMentorCard (그룹 멘토 매칭, localStorage 기반)
// ============================================


export type GroupMentorField =
  | "기술"
  | "안무"
  | "체력"
  | "무대매너";

export type GroupMentorStatus = "진행중" | "완료" | "중단";

export type GroupMentorSession = {
  /** 고유 식별자 */
  id: string;
  /** 세션 날짜 (YYYY-MM-DD) */
  date: string;
  /** 세션 내용 */
  content: string;
  /** 평가 점수 (1~5) */
  rating: number;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type GroupMentorMatch = {
  /** 고유 식별자 */
  id: string;
  /** 멘토 이름 */
  mentorName: string;
  /** 멘티 이름 */
  menteeName: string;
  /** 매칭 분야 */
  field: GroupMentorField;
  /** 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 종료일 (YYYY-MM-DD, 없으면 null) */
  endDate: string | null;
  /** 매칭 상태 */
  status: GroupMentorStatus;
  /** 세션 기록 목록 */
  sessions: GroupMentorSession[];
  /** 생성일 (ISO 8601) */
  createdAt: string;
};


// ============================================
// GroupChallengeCard (댄스 그룹 챌린지 카드)
// ============================================


export type DanceGroupChallengeCategory =
  | "choreography"
  | "freestyle"
  | "cover"
  | "fitness";

export type DanceGroupChallengeParticipantStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export type DanceGroupChallengeParticipant = {
  /** 참여자 ID (로컬 고유 ID) */
  id: string;
  /** 참여자 이름 */
  name: string;
  /** 진행 상태 */
  status: DanceGroupChallengeParticipantStatus;
  /** 완료 순서 (완료 시 기록, null이면 미완료) */
  completedRank: number | null;
  /** 참여 등록일 (ISO 8601) */
  joinedAt: string;
};

export type DanceGroupChallengeEntry = {
  /** 고유 ID */
  id: string;
  /** 챌린지 제목 */
  title: string;
  /** 챌린지 설명 */
  description: string;
  /** 카테고리 */
  category: DanceGroupChallengeCategory;
  /** 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 종료일 (YYYY-MM-DD) */
  endDate: string;
  /** 참여자 목록 */
  participants: DanceGroupChallengeParticipant[];
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601) */
  updatedAt: string;
};

export type DanceGroupChallengeStore = {
  /** 챌린지 목록 */
  entries: DanceGroupChallengeEntry[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// 공연장 관리 (VenueManagement)
// ============================================


export type VenueMgmtBookingStatus = "미확정" | "확정" | "취소";

export type VenueMgmtFacility = {
  /** 시설 ID */
  id: string;
  /** 시설 이름 */
  name: string;
  /** 보유 여부 */
  available: boolean;
};

export type VenueMgmtContact = {
  /** 담당자 이름 */
  managerName: string;
  /** 전화번호 */
  phone: string;
  /** 이메일 */
  email: string;
};

export type VenueMgmtStageSize = {
  /** 가로 (m) */
  width: number | null;
  /** 세로 (m) */
  depth: number | null;
};

export type VenueMgmtRental = {
  /** 대관료 (원) */
  fee: number | null;
  /** 예약 상태 */
  bookingStatus: VenueMgmtBookingStatus;
  /** 입장 시간 (HH:mm) */
  entryTime: string;
  /** 퇴장 시간 (HH:mm) */
  exitTime: string;
};

export type VenueMgmtAccess = {
  /** 대중교통 안내 */
  transit: string;
  /** 주차 안내 */
  parking: string;
};

export type VenueMgmtVenue = {
  /** 고유 ID */
  id: string;
  /** 공연장 이름 */
  name: string;
  /** 주소 */
  address: string;
  /** 수용 인원 */
  capacity: number | null;
  /** 무대 크기 */
  stageSize: VenueMgmtStageSize;
  /** 시설 체크리스트 */
  facilities: VenueMgmtFacility[];
  /** 연락처 */
  contact: VenueMgmtContact;
  /** 대관 정보 */
  rental: VenueMgmtRental;
  /** 무대 도면 메모 */
  stageMemo: string;
  /** 접근 정보 */
  access: VenueMgmtAccess;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601) */
  updatedAt: string;
};

export type VenueMgmtData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 공연장 목록 */
  venues: VenueMgmtVenue[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// MakeupHairCard (분장/헤어 관리, localStorage 기반)
// ============================================


export type MakeupHairMakeupType =
  | "내추럴"
  | "스테이지"
  | "특수분장";

export type MakeupHairStyle =
  | "업스타일"
  | "다운스타일"
  | "반묶음"
  | "특수";

export type MakeupHairPlan = {
  /** 고유 식별자 */
  id: string;
  /** 멤버명 */
  memberName: string;
  /** 장면(Scene) 번호 */
  scene: number;
  /** 분장 유형 */
  makeupType: MakeupHairMakeupType;
  /** 헤어 스타일 */
  hairStyle: MakeupHairStyle;
  /** 색상 톤 (없으면 null) */
  colorTone: string | null;
  /** 특이사항 메모 (없으면 null) */
  memo: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type MakeupHairTimelineEntry = {
  /** 고유 식별자 */
  id: string;
  /** 멤버명 */
  memberName: string;
  /** 분장 시작 예정 시간 (HH:MM) */
  startTime: string;
  /** 소요 시간 (분) */
  durationMinutes: number;
};

export type MakeupHairChecklistItem = {
  /** 고유 식별자 */
  id: string;
  /** 아이템명 */
  item: string;
  /** 체크 여부 */
  checked: boolean;
};

export type MakeupHairArtist = {
  /** 고유 식별자 */
  id: string;
  /** 이름 */
  name: string;
  /** 연락처 (없으면 null) */
  contact: string | null;
  /** 전문 분야 (없으면 null) */
  specialty: string | null;
};

export type MakeupHairData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 분장/헤어 플랜 목록 */
  plans: MakeupHairPlan[];
  /** 분장 타임라인 목록 */
  timeline: MakeupHairTimelineEntry[];
  /** 준비물 체크리스트 */
  checklist: MakeupHairChecklistItem[];
  /** 담당 아티스트 목록 */
  artists: MakeupHairArtist[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};

export type DiaryCardEmotion = "happy" | "neutral" | "sad" | "passionate" | "frustrated";

export type DiaryCardEmotionMeta = {
  value: DiaryCardEmotion;
  label: string;
  emoji: string;
  color: string;
};

export type DiaryCardEntry = {
  /** 고유 ID */
  id: string;
  /** 멤버 ID */
  memberId: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 제목 */
  title: string;
  /** 내용 */
  content: string;
  /** 감정 */
  emotion: DiaryCardEmotion;
  /** 컨디션 (1~5) */
  condition: number;
  /** 오늘의 발견 (짧은 메모) */
  discovery: string;
  /** 태그 목록 */
  tags: string[];
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601) */
  updatedAt: string;
};

export type DiaryCardData = {
  /** 멤버 ID */
  memberId: string;
  /** 일기 목록 */
  entries: DiaryCardEntry[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};

export type StreakTrackRecord = {
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 출석 여부 */
  attended: boolean;
};

export type StreakTrackMember = {
  /** 고유 ID (UUID) */
  id: string;
  /** 멤버명 */
  name: string;
  /** 출석 기록 목록 */
  records: StreakTrackRecord[];
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type StreakTrackMilestone = 7 | 30 | 100;

export type StreakTrackLeaderboardEntry = {
  memberId: string;
  memberName: string;
  currentStreak: number;
  longestStreak: number;
  monthlyRate: number;
};

export type StreakTrackData = {
  /** 그룹 ID */
  groupId: string;
  /** 멤버 스트릭 목록 */
  members: StreakTrackMember[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};

export type EmergencyContactRole =
  | "총감독"
  | "무대감독"
  | "음향감독"
  | "조명감독"
  | "의료진"
  | "보안"
  | "기타";

export type EmergencyContactPriority = 1 | 2 | 3;

export type EmergencyContact = {
  /** 고유 ID (UUID) */
  id: string;
  /** 이름 */
  name: string;
  /** 역할 */
  role: EmergencyContactRole;
  /** 전화번호 */
  phone: string;
  /** 이메일 (선택) */
  email: string;
  /** 비고 (선택) */
  note: string;
  /** 긴급도 레벨 (1=1순위, 2=2순위, 3=3순위) */
  priority: EmergencyContactPriority;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601) */
  updatedAt: string;
};

export type EmergencyContactData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 연락처 목록 */
  contacts: EmergencyContact[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================
// GroupWishlistCard (그룹 위시리스트)
// ============================================


export type GroupWishCategory =
  | "practice_song"
  | "equipment"
  | "costume"
  | "venue"
  | "event"
  | "other";

export type GroupWishPriority = "high" | "medium" | "low";

export type GroupWishStatus =
  | "proposed"
  | "reviewing"
  | "approved"
  | "completed"
  | "rejected";

export type GroupWishItem = {
  id: string;
  /** 제목 */
  title: string;
  /** 설명 (선택) */
  description: string;
  /** 카테고리 */
  category: GroupWishCategory;
  /** 우선순위 */
  priority: GroupWishPriority;
  /** 상태 */
  status: GroupWishStatus;
  /** 예상 비용 (원, 0이면 미지정) */
  estimatedCost: number;
  /** 좋아요(추천) 수 */
  likes: number;
  /** 제안자 */
  proposedBy: string;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 상태 변경일 (ISO 8601, 선택) */
  updatedAt?: string;
};


// ============================================================
// DanceCertification 타입
// ============================================================


export type DanceCertKind =
  | "certificate" // 자격증
  | "completion"  // 수료증
  | "workshop"    // 워크숍
  | "award";      // 대회 수상

export type DanceCertItem = {
  id: string;
  /** 자격증/수료증 이름 */
  name: string;
  /** 발급기관 */
  issuer: string;
  /** 취득일 (YYYY-MM-DD) */
  acquiredAt: string;
  /** 만료일 (YYYY-MM-DD, 선택) */
  expiresAt?: string;
  /** 종류 */
  kind: DanceCertKind;
  /** 등급 (선택) */
  grade?: string;
  /** 메모 (선택) */
  memo?: string;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601, 선택) */
  updatedAt?: string;
};


// ─────────────────────────────────────────────────────────────────────────────
// DuesTracker — 그룹 회비 납부 추적기
// ─────────────────────────────────────────────────────────────────────────────


export type DuesTrackPaymentStatus = "paid" | "unpaid" | "exempt";

export type DuesTrackMember = {
  id: string;
  /** 멤버 이름 */
  name: string;
  /** 납부 상태 */
  status: DuesTrackPaymentStatus;
  /** 납부일 (ISO 8601, paid일 때만) */
  paidAt?: string;
  /** 메모 (선택) */
  memo?: string;
};

export type DuesTrackPeriod = {
  id: string;
  /** 년도 */
  year: number;
  /** 월 (1~12) */
  month: number;
  /** 납부 금액 (원) */
  amount: number;
  /** 납부 기한 (YYYY-MM-DD) */
  dueDate: string;
  /** 멤버 납부 현황 */
  members: DuesTrackMember[];
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type DuesTrackData = {
  /** 그룹 ID */
  groupId: string;
  /** 납부 기간 목록 (최신순) */
  periods: DuesTrackPeriod[];
};


// ============================================================
// ShowCueSheet 타입 (공연 큐시트)
// ============================================================


export type ShowCueStatus = "대기" | "진행중" | "완료";

export type ShowCueItem = {
  /** 고유 ID */
  id: string;
  /** 순서 (1-based, 자동 계산) */
  order: number;
  /** 시간 (HH:MM) */
  time: string;
  /** 항목명 */
  title: string;
  /** 담당자 */
  assignee: string;
  /** 내용 설명 */
  description: string;
  /** 비고 */
  note: string;
  /** 진행 상태 */
  status: ShowCueStatus;
};

export type ShowCueSheet = {
  /** 프로젝트 ID */
  projectId: string;
  /** 큐 항목 목록 */
  items: ShowCueItem[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// WardrobeTracker (의상 추적기)
// ============================================================


export type WardrobeTrackStatus =
  | "preparing"  // 준비중
  | "repairing"  // 수선중
  | "ready"      // 완료
  | "lost";      // 분실

export type WardrobeTrackItem = {
  id: string;
  /** 의상명 */
  name: string;
  /** 장면(Scene) 번호 */
  scene: string;
  /** 배정 멤버명 */
  memberName: string;
  /** 사이즈 */
  size: string;
  /** 색상 */
  color: string;
  /** 상태 */
  status: WardrobeTrackStatus;
  /** 반납 여부 */
  returned: boolean;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601, 선택) */
  updatedAt?: string;
};

export type WardrobeTrackerData = {
  projectId: string;
  items: WardrobeTrackItem[];
  updatedAt: string;
};


// ============================================================
// 개인 댄스 플레이리스트 (MyPlaylist*)
// ============================================================


export type MyPlaylistSongPurpose =
  | "warmup"
  | "main"
  | "cooldown"
  | "performance";

export type MyPlaylistSong = {
  /** 고유 ID */
  id: string;
  /** 곡명 */
  title: string;
  /** 아티스트 */
  artist: string;
  /** BPM (선택) */
  bpm: number | null;
  /** 장르 (선택) */
  genre: string;
  /** 용도 */
  purpose: MyPlaylistSongPurpose;
  /** 순서 (0-based) */
  order: number;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type MyPlaylist = {
  /** 고유 ID */
  id: string;
  /** 플레이리스트 이름 */
  name: string;
  /** 설명 (선택) */
  description: string;
  /** 곡 목록 */
  songs: MyPlaylistSong[];
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type MyPlaylistData = {
  memberId: string;
  playlists: MyPlaylist[];
  updatedAt: string;
};


// ============================================================
// GroupVotingCard (그룹 투표)
// ============================================================


export type GroupVoteCardOption = {
  id: string;
  /** 선택지 텍스트 */
  label: string;
  /** 투표한 사용자 ID 목록 */
  voterIds: string[];
};

export type GroupVoteCardItem = {
  id: string;
  /** 투표 제목 */
  title: string;
  /** 투표 설명 (선택) */
  description?: string;
  /** 선택지 목록 (2~6개) */
  options: GroupVoteCardOption[];
  /** 마감일 (ISO 8601, 선택) */
  deadline?: string;
  /** 복수선택 허용 여부 */
  multipleChoice: boolean;
  /** 익명 투표 여부 */
  anonymous: boolean;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 생성자 ID */
  createdBy: string;
};

export type GroupVotingCardData = {
  groupId: string;
  votes: GroupVoteCardItem[];
  updatedAt: string;
};


// ============================================================
// ShowIntercom (인터컴/통신 체계)
// ============================================================


export type ShowIntercomZone =
  | "stage"        // 무대
  | "sound"        // 음향
  | "lighting"     // 조명
  | "backstage"    // 백스테이지
  | "overall"      // 총괄
  | "other";       // 기타

export type ShowIntercomPerson = {
  /** 인원 고유 ID */
  id: string;
  /** 이름 */
  name: string;
  /** 호출부호 (콜사인) */
  callSign: string;
};

export type ShowIntercomChannel = {
  /** 채널 고유 ID */
  id: string;
  /** 채널명 */
  name: string;
  /** 주파수 또는 채널 번호 */
  frequency: string;
  /** 담당 영역 */
  zone: ShowIntercomZone;
  /** 비상 채널 여부 */
  isEmergency: boolean;
  /** 배정 인원 목록 */
  persons: ShowIntercomPerson[];
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601, 선택) */
  updatedAt?: string;
};

export type ShowIntercomData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 채널 목록 */
  channels: ShowIntercomChannel[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// StageWeather (야외 공연 날씨 관리)
// ============================================================


export type StageWeatherCondition =
  | "sunny"   // 맑음
  | "cloudy"  // 흐림
  | "rainy"   // 비
  | "snowy"   // 눈
  | "windy";  // 바람

export type StageWeatherSafety = "safe" | "caution" | "danger";

export type StageWeatherCheckItem = {
  id: string;
  label: string;
  done: boolean;
};

export type StageWeatherPlan = {
  id: string;
  /** 해당 날씨 조건 */
  condition: StageWeatherCondition;
  /** 대응 내용 */
  action: string;
  /** 필요 장비 목록 */
  equipment: string[];
};

export type StageWeatherRainPlan = {
  /** 장소 변경 여부 */
  venueChange: boolean;
  /** 대체 장소 */
  alternativeVenue: string;
  /** 우비 준비 여부 */
  raincoatReady: boolean;
  /** 텐트 준비 여부 */
  tentReady: boolean;
};

export type StageWeatherForecast = {
  id: string;
  /** 공연 날짜 (ISO 8601) */
  date: string;
  /** 예상 날씨 */
  condition: StageWeatherCondition;
  /** 기온 (°C) */
  temperature: number;
  /** 습도 (%) */
  humidity: number;
  /** 풍속 메모 */
  windNote: string;
  /** 공연 가능 여부 판정 */
  safety: StageWeatherSafety;
  /** 체크리스트 항목 */
  checklist: StageWeatherCheckItem[];
};

export type StageWeatherData = {
  projectId: string;
  /** 공연일 날씨 예보 목록 */
  forecasts: StageWeatherForecast[];
  /** 날씨별 대응 플랜 목록 */
  plans: StageWeatherPlan[];
  /** 우천 시 대체 계획 */
  rainPlan: StageWeatherRainPlan;
  updatedAt: string;
};


// ============================================================
// CarPool 타입 (GroupCarPoolCard - localStorage 기반)
// ============================================================


export type CarPoolStatus = "모집중" | "마감" | "완료";

export type CarPoolPassenger = {
  id: string;
  name: string;
  addedAt: string;
};

export type CarPoolItem = {
  id: string;
  /** 운전자명 */
  driverName: string;
  /** 출발지 */
  departurePlace: string;
  /** 도착지 */
  arrivalPlace: string;
  /** 출발 시간 (ISO 8601) */
  departureTime: string;
  /** 탑승 가능 인원 (운전자 제외) */
  maxPassengers: number;
  /** 차량 정보 (선택) */
  carInfo?: string;
  /** 상태 */
  status: CarPoolStatus;
  /** 탑승자 목록 */
  passengers: CarPoolPassenger[];
  createdAt: string;
};

export type CarPoolData = {
  groupId: string;
  carpools: CarPoolItem[];
  updatedAt: string;
};

export type ShowRundownItem = {
  id: string;
  /** 시작 시간 (HH:MM) */
  startTime: string;
  /** 종료 시간 (HH:MM) */
  endTime: string;
  /** 활동명 */
  activity: string;
  /** 장소 */
  location: string;
  /** 담당자 */
  owner: string;
  /** 참여자 목록 (쉼표 구분 문자열) */
  participants: string;
  /** 비고 */
  note: string;
  /** 완료 여부 */
  done: boolean;
};

export type ShowRundownData = {
  projectId: string;
  /** 런다운 항목 목록 (시간순 정렬) */
  items: ShowRundownItem[];
  updatedAt: string;
};


// ============================================================
// FlexTrack* - 유연성 트래커 (DanceFlexibilityCard)
// ============================================================


export type FlexTrackPart =
  | "forward_bend"    // 전굴 (앞으로 숙이기) - cm
  | "side_split"      // 개각 (좌우 벌리기) - °
  | "y_balance"       // Y밸런스 (한발 균형) - cm
  | "shoulder"        // 어깨 유연성 - cm
  | "hip_mobility";   // 고관절 가동범위 - °

export type FlexTrackUnit = "cm" | "deg";

export type FlexTrackRecord = {
  id: string;
  /** 측정일 (YYYY-MM-DD) */
  date: string;
  /** 측정값 */
  value: number;
  /** 메모 */
  note: string;
};

export type FlexTrackPartConfig = {
  part: FlexTrackPart;
  /** 목표값 */
  goal: number;
  /** 기록 목록 (최신순) */
  records: FlexTrackRecord[];
};

export type FlexTrackData = {
  memberId: string;
  parts: FlexTrackPartConfig[];
  updatedAt: string;
};


// ============================================================
// ShowRider* - 아티스트 라이더 (ArtistRiderCard)
// ============================================================


export type ShowRiderCategory =
  | "technical"     // 기술
  | "backstage"     // 백스테이지
  | "catering"      // 케이터링
  | "accommodation" // 숙박
  | "transport"     // 교통
  | "etc";          // 기타

export type ShowRiderPriority =
  | "required"   // 필수
  | "preferred"  // 희망
  | "optional";  // 선택

export type ShowRiderStatus =
  | "pending"      // 미확인
  | "secured"      // 확보
  | "unavailable"; // 불가

export type ShowRiderItem = {
  id: string;
  /** 아티스트/팀명 */
  artistName: string;
  /** 카테고리 */
  category: ShowRiderCategory;
  /** 요청 내용 */
  request: string;
  /** 수량 */
  quantity: number;
  /** 우선순위 */
  priority: ShowRiderPriority;
  /** 확보 상태 */
  status: ShowRiderStatus;
  /** 메모 */
  note: string;
};

export type ShowRiderData = {
  projectId: string;
  /** 라이더 항목 목록 */
  items: ShowRiderItem[];
  updatedAt: string;
};


// ============================================================
// AnonFeedback* — 익명 피드백 박스 (localStorage 기반)
// ============================================================


export type AnonFeedbackCategory =
  | "칭찬"
  | "건의"
  | "불만"
  | "아이디어"
  | "기타";

export type AnonFeedbackItem = {
  id: string;
  /** 피드백 내용 */
  content: string;
  /** 카테고리 */
  category: AnonFeedbackCategory;
  /** 작성일 (ISO 8601) */
  createdAt: string;
  /** 해결 여부 */
  resolved: boolean;
  /** 관리자 답변 텍스트 (없으면 undefined) */
  replyText?: string;
  /** 관리자 답변일 (ISO 8601, 없으면 undefined) */
  repliedAt?: string;
};

export type AnonFeedbackData = {
  groupId: string;
  feedbacks: AnonFeedbackItem[];
  updatedAt: string;
};


// ─────────────────────────────────────────────
// GroupSkillShareCard 타입 (localStorage 기반)
// ─────────────────────────────────────────────


export type SkillShareCategory = "동작" | "리듬" | "표현" | "체력" | "기타";

export type SkillShareDifficulty = "초급" | "중급" | "고급";

export type SkillShareRequestStatus = "요청" | "수락" | "완료";

export type SkillShareItem = {
  id: string;
  skillName: string;
  category: SkillShareCategory;
  difficulty: SkillShareDifficulty;
  providerName: string;
  description: string;
  createdAt: string;
};

export type SkillShareRequest = {
  id: string;
  skillId: string;
  requesterName: string;
  status: SkillShareRequestStatus;
  createdAt: string;
};

export type SkillShareData = {
  groupId: string;
  skills: SkillShareItem[];
  requests: SkillShareRequest[];
  updatedAt: string;
};


// ─────────────────────────────────────────────
// DanceMoodBoardCard 타입 (localStorage 기반)
// ─────────────────────────────────────────────


export type MoodBoardCategory =
  | "안무영감"
  | "의상"
  | "무대연출"
  | "음악"
  | "감정표현"
  | "기타";

export type MoodBoardItem = {
  id: string;
  /** 제목 */
  title: string;
  /** 메모 */
  memo: string;
  /** 카테고리 */
  category: MoodBoardCategory;
  /** 색상 코드 (hex) */
  color: string;
  /** 태그 목록 */
  tags: string[];
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601) */
  updatedAt: string;
};

export type MoodBoardData = {
  memberId: string;
  items: MoodBoardItem[];
  updatedAt: string;
};


// ============================================================
// TicketSalesCard 타입 (localStorage 기반)
// ============================================================


export type TicketSalesTier = {
  id: string;
  /** 등급명 (예: VIP, R석, S석, A석, 스탠딩) */
  name: string;
  /** 좌석 단가 (원) */
  price: number;
  /** 총 수량 */
  totalQty: number;
};

export type TicketSalesRecord = {
  id: string;
  /** 구매자명 */
  buyerName: string;
  /** 등급 ID (TicketSalesTier.id 참조) */
  tierId: string;
  /** 구매 수량 */
  qty: number;
  /** 구매 날짜 (YYYY-MM-DD) */
  date: string;
};

export type TicketSalesData = {
  projectId: string;
  /** 좌석 등급 목록 */
  tiers: TicketSalesTier[];
  /** 판매 기록 목록 */
  records: TicketSalesRecord[];
  updatedAt: string;
};


// ─────────────────────────────────────────────
// StageAccessCard 타입 (localStorage 기반)
// ─────────────────────────────────────────────


export type StageAccessRole =
  | "출연진"
  | "스태프"
  | "VIP"
  | "미디어"
  | "기타";

export type StageAccessZone =
  | "무대"
  | "백스테이지"
  | "관객석"
  | "모든구역";

export type StageAccessStatus = "활성" | "비활성" | "분실";

export type StageAccessPass = {
  id: string;
  name: string;
  role: StageAccessRole;
  zone: StageAccessZone;
  passNumber: string;
  issuedAt: string;
  expiresAt: string;
  status: StageAccessStatus;
  createdAt: string;
};

export type StageAccessData = {
  projectId: string;
  passes: StageAccessPass[];
  updatedAt: string;
};


// ─────────────────────────────────────────────
// GroupPenaltyCard 타입 (localStorage 기반)
// ─────────────────────────────────────────────


export type GroupPenaltyViolationType =
  | "지각"
  | "무단결석"
  | "핸드폰사용"
  | "비협조"
  | "기타";

export type GroupPenaltyRule = {
  id: string;
  violationType: GroupPenaltyViolationType;
  description: string;
  penaltyContent: string;
  demerits: number;
  createdAt: string;
};

export type GroupPenaltyRecord = {
  id: string;
  memberName: string;
  violationType: GroupPenaltyViolationType;
  date: string;
  demerits: number;
  memo: string;
  createdAt: string;
};

export type GroupPenaltyData = {
  groupId: string;
  rules: GroupPenaltyRule[];
  records: GroupPenaltyRecord[];
  monthlyResetEnabled: boolean;
  lastResetAt: string | null;
  updatedAt: string;
};

export type SetChangeItem = {
  id: string;
  /** 전환 번호 (자동 부여, 표시용) */
  order: number;
  /** 이전 장면 */
  fromScene: string;
  /** 다음 장면 */
  toScene: string;
  /** 목표 시간 (초) */
  targetSeconds: number;
  /** 실제 시간 (초) */
  actualSeconds: number | null;
  /** 담당 스태프 목록 */
  staffList: string[];
  /** 필요 소품 목록 */
  propList: string[];
  /** 메모 */
  memo: string;
  /** 완료 여부 */
  completed: boolean;
  createdAt: string;
};

export type SetChangeLogData = {
  projectId: string;
  items: SetChangeItem[];
  updatedAt: string;
};

export type GroupTimelineCategory =
  | "창립"
  | "공연"
  | "대회"
  | "합숙"
  | "특별이벤트"
  | "기타";

export type GroupTimelineImportance = "일반" | "중요" | "매우중요";

export type GroupTimelineEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  category: GroupTimelineCategory;
  importance: GroupTimelineImportance;
  createdAt: string;
};

export type GroupTimelineData = {
  groupId: string;
  events: GroupTimelineEvent[];
  updatedAt: string;
};

export type DanceNutritionMealTime = "breakfast" | "lunch" | "dinner" | "snack";

export type DanceNutritionEntry = {
  id: string;
  date: string;
  mealTime: DanceNutritionMealTime;
  menuName: string;
  calories: number;
  protein: number;
  carbs: number;
  water: number;
  memo: string;
  createdAt: string;
};

export type DanceNutritionGoal = {
  targetCalories: number;
  targetWater: number;
};

export type DanceNutritionData = {
  memberId: string;
  entries: DanceNutritionEntry[];
  goal: DanceNutritionGoal;
  updatedAt: string;
};


// ============================================================
// GroupLostFoundCard 타입 (localStorage 기반)
// ============================================================


export type LostFoundStatus = "분실" | "발견" | "반환완료";

export type LostFoundItem = {
  id: string;
  itemName: string;
  description: string;
  lostPlace: string;
  lostDate: string;
  reporterName: string;
  status: LostFoundStatus;
  finderName: string;
  createdAt: string;
  updatedAt: string;
};

export type LostFoundData = {
  groupId: string;
  items: LostFoundItem[];
  updatedAt: string;
};

export type ShowDayTimeSlot =
  | "entry"
  | "rehearsal"
  | "makeup"
  | "standby"
  | "preshow"
  | "postshow"
  | "teardown";

export type ShowDayPriority = "required" | "recommended" | "optional";

export type ShowDayChecklistItem = {
  id: string;
  timeSlot: ShowDayTimeSlot;
  title: string;
  assignedTo?: string;
  completed: boolean;
  priority: ShowDayPriority;
  createdAt: string;
};

export type ShowDayChecklistData = {
  projectId: string;
  items: ShowDayChecklistItem[];
  updatedAt: string;
};
