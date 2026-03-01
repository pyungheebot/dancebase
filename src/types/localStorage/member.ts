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
// Personal Goal (개인 목표 관리)
// ============================================

export type PersonalGoalCategory =
  | "technique"
  | "choreography"
  | "performance"
  | "fitness"
  | "other";

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
// Health Tracking (멤버 건강 추적)
// ============================================

export type HealthMetricType = "weight" | "height" | "bmi" | "flexibility" | "endurance" | "strength";

export type HealthDataPoint = {
  date: string;
  value: number;
};

export type HealthTracking = {
  id: string;
  memberName: string;
  metric: HealthMetricType;
  dataPoints: HealthDataPoint[];
  unit: string;
  updatedAt: string;
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

export type GroupMentorField =
  | "기술"
  | "안무"
  | "체력"
  | "무대매너";

export type GroupMentorStatus = "진행중" | "완료" | "중단";

export type GroupMentorSession = {
  id: string;
  date: string;
  content: string;
  rating: number;
  createdAt: string;
};

export type GroupMentorMatch = {
  id: string;
  mentorName: string;
  menteeName: string;
  field: GroupMentorField;
  startDate: string;
  endDate: string | null;
  status: GroupMentorStatus;
  sessions: GroupMentorSession[];
  createdAt: string;
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

// GrowthJournalMood, GrowthArea, GrowthJournalEntry, GrowthJournalData — dance.ts에 정의됨

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
// Attendance Streak (출결 스트릭)
// ============================================

export type MemberStreakData = {
  memberName: string;
  currentStreak: number;
  longestStreak: number;
  totalPresent: number;
  lastAttendedAt: string | null;
};

export type AttendanceStreakData = {
  currentStreak: number;
  longestStreak: number;
  totalPresent: number;
  streakDates: string[];
  monthlyGrid: { date: string; present: boolean }[];
};

// ============================================
// Member Attendance Stats (멤버 출석 통계 대시보드)
// ============================================

export type MemberAttendStatStatus = "present" | "late" | "early_leave" | "absent";

export type MemberAttendStatRecord = {
  id: string;
  groupId: string;
  memberName: string;
  date: string;
  status: MemberAttendStatStatus;
  notes?: string;
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
  attendanceRate: number;
  currentStreak: number;
  longestStreak: number;
};

export type MemberAttendStatOverall = {
  totalRecords: number;
  overallAttendanceRate: number;
  topAttendee: string | null;
  mostAbsentee: string | null;
  perfectAttendanceMembers: string[];
};

export type MemberAttendStatStore = {
  groupId: string;
  records: MemberAttendStatRecord[];
  updatedAt: string;
};

// ============================================
// Attendance Book (그룹 출석부)
// ============================================

export type BookAttendanceStatus = "present" | "absent" | "late" | "excused";

export type AttendanceRecord = {
  memberName: string;
  status: BookAttendanceStatus;
  note: string | null;
};

export type AttendanceSheet = {
  id: string;
  date: string;
  title: string;
  records: AttendanceRecord[];
  createdAt: string;
};

export type AttendanceBookData = {
  groupId: string;
  sheets: AttendanceSheet[];
  updatedAt: string;
};

// ============================================
// Streak Track (스트릭 추적)
// ============================================

export type StreakTrackRecord = {
  date: string;
  attended: boolean;
};

export type StreakTrackMember = {
  id: string;
  name: string;
  records: StreakTrackRecord[];
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
  groupId: string;
  members: StreakTrackMember[];
  updatedAt: string;
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
  id: string;
  name: string;
  role: EmergencyContactRole;
  phone: string;
  email: string;
  note: string;
  priority: EmergencyContactPriority;
  createdAt: string;
  updatedAt: string;
};

export type EmergencyContactData = {
  projectId: string;
  contacts: EmergencyContact[];
  updatedAt: string;
};

// ============================================
// Member Birthday (멤버 생일 캘린더)
// ============================================

export type MemberBirthdayEntry = {
  id: string;
  memberName: string;
  birthMonth: number;
  birthDay: number;
  wishMessage: string | null;
  createdAt: string;
};

export type BirthdayCelebration = {
  id: string;
  birthdayId: string;
  fromName: string;
  message: string;
  createdAt: string;
};

export type MemberBirthdayData = {
  groupId: string;
  birthdays: MemberBirthdayEntry[];
  celebrations: BirthdayCelebration[];
  updatedAt: string;
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

// FitnessTestCategory, FitnessTestItem, FitnessTestResult — dance.ts에 정의됨

// ============================================
// Fitness Test Record (체력 테스트 기록)
// ============================================

export type FitnessTestRecord = {
  id: string;
  date: string;
  flexibility: number | null;
  strength: number | null;
  endurance: number | null;
  balance: number | null;
  speed: number | null;
  notes: string | null;
  createdAt: string;
};

export type FitnessTestData = {
  memberId: string;
  records: FitnessTestRecord[];
  updatedAt: string;
};

// ============================================
// Member Intro Card (온보딩 체크인)
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

// PracticePartnerEntry — misc.ts에 정의됨
