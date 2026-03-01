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
// 그룹 연습 일지 요약 (Group Practice Journal Summary)
// ============================================

export type GroupPracticeJournalEntry = {
  id: string;
  date: string;
  durationMinutes: number;
  participants: string[];
  contentSummary: string;
  songs: string[];
  achievedGoals: string[];
  unachievedItems: string[];
  nextPlanNote: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupPracticeJournalMonthStat = {
  yearMonth: string;
  entryCount: number;
  totalMinutes: number;
  avgParticipants: number;
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
  title: string;
  description?: string;
  category: PracticeGoalCategory;
  dueDate?: string;
  progress: number;
  status: PracticeGoalStatus;
  assignees: string[];
  subTasks: PracticeGoalSubTask[];
  createdAt: string;
  updatedAt: string;
};

export type PracticeGoalBoardData = {
  groupId: string;
  entries: PracticeGoalEntry[];
  updatedAt: string;
};

// ============================================
// Practice Highlights (연습 하이라이트)
// ============================================

export type PracticeHighlightCategory =
  | "awesome_move"    // 멋진 동작
  | "growth_moment"   // 성장 순간
  | "teamwork"        // 팀워크
  | "funny_episode"   // 재미있는 에피소드
  | "other";          // 기타

export type PracticeHighlightEntry = {
  id: string;
  date: string;
  title: string;
  memberName: string;
  category: PracticeHighlightCategory;
  description?: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
};

export type PracticeHighlightData = {
  groupId: string;
  entries: PracticeHighlightEntry[];
  updatedAt: string;
};

// ============================================
// 그룹 연습 피드백 수집
// ============================================

export type PracticeFeedbackRating = {
  choreography: number;
  music: number;
  environment: number;
  atmosphere: number;
};

export type PracticeFeedbackResponse = {
  id: string;
  sessionId: string;
  authorName: string;
  isAnonymous: boolean;
  overallRating: number;
  categoryRatings: PracticeFeedbackRating;
  goodPoints?: string;
  improvements?: string;
  createdAt: string;
};

export type PracticeFeedbackSession = {
  id: string;
  groupId: string;
  practiceDate: string;
  title?: string;
  responses: PracticeFeedbackResponse[];
  createdAt: string;
};

export type PracticeFeedbackAggregate = {
  sessionId: string;
  practiceDate: string;
  title?: string;
  totalResponses: number;
  averageOverall: number;
  averageCategories: PracticeFeedbackRating;
  goodPointsList: string[];
  improvementsList: string[];
};

export type PracticeFeedbackData = {
  groupId: string;
  sessions: PracticeFeedbackSession[];
  updatedAt: string;
};

// ============================================
// Group Practice Feedback v2 (그룹 연습 피드백 - 상호 피드백 공유)
// ============================================

export type GroupPracticeFeedbackEntry = {
  id: string;
  practiceDate: string;
  practiceTitle: string | null;
  authorName: string;
  rating: number;
  positives: string;
  improvements: string;
  goals: string | null;
  createdAt: string;
};

export type GroupPracticeFeedbackData = {
  groupId: string;
  entries: GroupPracticeFeedbackEntry[];
  updatedAt: string;
};

// ============================================
// Group Practice Playlist (그룹 연습 플레이리스트)
// ============================================

export type PracticePlaylistPurpose =
  | "warmup"    // 웜업
  | "main"      // 본연습
  | "cooldown"; // 쿨다운

export type PracticePlaylistTrack = {
  id: string;
  title: string;
  artist?: string;
  bpm?: number;
  genre?: string;
  duration: number;
  purpose: PracticePlaylistPurpose;
  notes?: string;
  order: number;
  addedBy: string;
  createdAt: string;
};

export type PracticePlaylistEntry = {
  id: string;
  groupId: string;
  name: string;
  tracks: PracticePlaylistTrack[];
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// QR 체크인
// ============================================

export type QrCheckInSession = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string | null;
  qrCode: string;
  isActive: boolean;
  createdAt: string;
};

export type QrCheckInRecord = {
  id: string;
  sessionId: string;
  memberName: string;
  checkedInAt: string;
  method: "qr" | "manual";
};

export type QrCheckInData = {
  groupId: string;
  sessions: QrCheckInSession[];
  records: QrCheckInRecord[];
  updatedAt: string;
};

// ============================================
// 연습실 예약 (Practice Room Booking)
// ============================================

export type PracticeRoom = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  costPerHour: number;
  contact: string;
  createdAt: string;
};

export type PracticeRoomBookingStatus =
  | "예약됨"
  | "확정됨"
  | "취소됨"
  | "완료됨";

export type PracticeRoomBooking = {
  id: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  bookedBy: string;
  status: PracticeRoomBookingStatus;
  memo: string;
  createdAt: string;
};

export type PracticeRoomBookingData = {
  groupId: string;
  rooms: PracticeRoom[];
  bookings: PracticeRoomBooking[];
  updatedAt: string;
};

// ============================================
// 그룹 연습 기여도 포인트
// ============================================

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
  memberId: string;
  memberName: string;
  category: ContributionPointCategory;
  points: number;
  reason: string;
  date: string;
  grantedBy: string;
  note?: string;
  createdAt: string;
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
// 연습 출석 예외 (Attendance Exception)
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
// 출결 사유서 (Attendance Excuse Form)
// ============================================

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
  memberName: string;
  date: string;
  type: AttendanceExcuseType;
  reason: AttendanceExcuseReason;
  detail: string;
  status: AttendanceExcuseStatus;
  approverName?: string;
  approvedAt?: string;
  submittedAt: string;
};

export type AttendanceExcuseEntry = {
  id: string;
  groupId: string;
  items: AttendanceExcuseItem[];
  createdAt: string;
  updatedAt: string;
};
