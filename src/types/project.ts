// ============================================
// Project Task (프로젝트 할 일)
// ============================================

export type ProjectTask = {
  id: string;
  project_id: string;
  title: string;
  assignee_id: string | null;
  due_date: string | null;
  status: 'todo' | 'in_progress' | 'done';
  created_by: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// ============================================
// Project Song (연습 곡/안무 트래커)
// ============================================

export type ProjectSong = {
  id: string;
  project_id: string;
  title: string;
  artist: string | null;
  status: 'not_started' | 'in_progress' | 'mastered';
  youtube_url: string | null;
  spotify_url: string | null;
  sort_order: number;
  created_by: string;
  created_at: string;
};

// ============================================
// Song Note (연습 메모)
// ============================================

export type SongNote = {
  id: string;
  song_id: string;
  content: string;
  created_by: string;
  created_at: string;
};

// ============================================
// Song Part (안무 파트 배정)
// ============================================

export type SongPartType = "all" | "solo" | "point" | "backup" | "intro" | "outro" | "bridge";

export type SongPart = {
  id: string;
  song_id: string;
  user_id: string;
  part_name: string;
  part_type: SongPartType;
  sort_order: number;
  notes: string | null;
  created_by: string;
  created_at: string;
};

// ============================================
// Practice Video (연습 영상 아카이브)
// ============================================

export type PracticeVideo = {
  id: string;
  group_id: string;
  project_id: string | null;
  schedule_id: string | null;
  song_id: string | null;
  url: string;
  title: string;
  platform: string;
  tags: string[];
  uploaded_by: string;
  created_at: string;
};

// ============================================
// Performance Records (공연/대회 성과 기록)
// ============================================

export type PerformanceEventType = "performance" | "competition" | "showcase" | "workshop";

export type PerformanceRecord = {
  id: string;
  group_id: string;
  project_id: string | null;
  event_name: string;
  event_date: string;
  event_type: PerformanceEventType;
  result: string | null;
  ranking: string | null;
  audience_count: number | null;
  venue: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
};

// ============================================
// Project Notice (프로젝트 공지 피드, localStorage 기반)
// ============================================

export type ProjectNoticeImportance = "normal" | "urgent";

export type ProjectNotice = {
  id: string;
  title: string;
  content: string;
  importance: ProjectNoticeImportance;
  createdBy: string;
  createdAt: string;
};

// ============================================
// Project Milestone (프로젝트 마일스톤, localStorage 기반)
// ============================================

export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  targetDate: string;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
};

// ============================================
// Practice Plan (맞춤 연습 플랜, localStorage 기반)
// ============================================

export type PracticePlan = {
  id: string;
  userId: string;
  content: string;
  focusAreas: string[];
  createdAt: string;
  createdBy: string;
};

// ============================================
// Practice Playlist (연습 음악 플레이리스트, localStorage 기반)
// ============================================

export type PlaylistTrack = {
  id: string;
  title: string;
  artist: string;
  url: string;
  platform: "youtube" | "spotify" | "soundcloud" | "other";
  category: "warmup" | "practice" | "cooldown" | "freestyle";
  addedBy: string;
  addedAt: string;
  likes: number;
};

export type PracticePlaylist = {
  id: string;
  name: string;
  tracks: PlaylistTrack[];
  createdAt: string;
};

// ============================================
// Runthrough Session (공연 런스루 모드, localStorage 기반)
// ============================================

export type RunthroughNote = {
  songId: string;
  songTitle: string;
  timestamp: number;
  content: string;
};

export type RunthroughSession = {
  id: string;
  projectId: string;
  startedAt: string;
  endedAt: string | null;
  notes: RunthroughNote[];
  songOrder: string[];
};

// ============================================
// Song Readiness Vote (연습 곡별 완성도 투표, localStorage 기반)
// ============================================

export type SongReadinessVote = "not_ready" | "almost" | "ready";

export type SongReadinessEntry = {
  songId: string;
  userId: string;
  userName: string;
  vote: SongReadinessVote;
  votedAt: string;
};

// ============================================
// Video Timestamp (연습 영상 구간 타임스탬프 메모, localStorage 기반)
// ============================================

export type VideoTimestamp = {
  id: string;
  videoId: string;
  seconds: number;
  comment: string;
  authorName: string;
  authorId: string;
  createdAt: string;
};

// ============================================
// Group Challenge (팀 챌린지)
// ============================================

export type GroupChallenge = {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  target_rate: number;
  starts_at: string;
  ends_at: string;
  is_achieved: boolean;
  created_by: string;
  created_at: string;
};

// ============================================
// Project Resource Library (프로젝트 리소스 라이브러리)
// ============================================

export type ResourceType = "music" | "video" | "image" | "document";

export type ProjectResource = {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  description?: string;
  tags: string[];
  projectId?: string;
  createdAt: string;
};

// ============================================
// Skill Category (스킬 자가 평가)
// ============================================

export type SkillCategory =
  | "physical"
  | "rhythm"
  | "expression"
  | "technique"
  | "memory"
  | "teamwork";

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  physical: "기초 체력",
  rhythm: "리듬감",
  expression: "표현력",
  technique: "테크닉",
  memory: "안무 기억력",
  teamwork: "팀워크",
};

export const SKILL_CATEGORIES: SkillCategory[] = [
  "physical",
  "rhythm",
  "expression",
  "technique",
  "memory",
  "teamwork",
];

export type SkillEvaluation = {
  id: string;
  scores: Record<SkillCategory, number>;
  totalScore: number;
  evaluatedAt: string;
};

export type SkillEvaluationHistory = {
  evaluations: SkillEvaluation[];
};

// ============================================
// Skill Evolution Tracker (스킬 성장 타임라인, localStorage 기반)
// ============================================

export type SkillMonthlySnapshot = {
  month: string;
  scores: Record<SkillCategory, number>;
  avgScore: number;
  recordedAt: string;
};

export type SkillEvolutionData = {
  snapshots: SkillMonthlySnapshot[];
};

// ============================================
// Dance Role / Genre Role Recommendation (장르 역할 추천)
// ============================================

export type DanceRole =
  | "메인 댄서"
  | "서포트 댄서"
  | "리드"
  | "트레이니"
  | "코레오그래퍼";

export type RoleRecommendationReason =
  | "출석률 높음"
  | "활동량 높음"
  | "신규 멤버"
  | "피어 피드백 높음"
  | "장기 활동";

export type RoleRecommendation = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  recommendedRole: DanceRole;
  overriddenRole: DanceRole | null;
  reasons: RoleRecommendationReason[];
  attendanceRate: number;
  activityScore: number;
  memberDays: number;
};

export type RoleRecommendationState = {
  assignments: Record<string, DanceRole>;
  savedAt: string | null;
};

// ============================================
// Project Milestone Tracker (프로젝트 마일스톤 트래커, localStorage 기반)
// ============================================

export type MilestoneTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type ProjectMilestoneCard = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  tasks: MilestoneTask[];
  createdAt: string;
};

// ============================================
// Group Milestone Achievements (그룹 마일스톤 달성 기록)
// ============================================

export type GroupMilestoneCategory = "members" | "schedules" | "posts" | "custom";

export type GroupMilestone = {
  id: string;
  title: string;
  category: GroupMilestoneCategory;
  targetValue: number;
  currentValue: number;
  achieved: boolean;
  achievedAt: string | null;
  isDefault: boolean;
};

// ============================================
// Group Wiki / FAQ (그룹 위키 문서)
// ============================================

export type WikiCategory = "general" | "practice_guide" | "rules" | "faq";

export type WikiDocument = {
  id: string;
  groupId: string;
  title: string;
  content: string;
  category: WikiCategory;
  pinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Group Activity Report (그룹 활동 보고서)
// ============================================

export type ActivityReportPeriod = "week" | "month";

export type ActivityReportMetric = {
  value: number;
  label: string;
};

export type ActivityReportInsight = {
  message: string;
  type: "positive" | "neutral";
};

export type GroupActivityReportData = {
  period: ActivityReportPeriod;
  scheduleCount: ActivityReportMetric;
  attendanceRate: ActivityReportMetric;
  postCount: ActivityReportMetric;
  commentCount: ActivityReportMetric;
  rsvpRate: ActivityReportMetric;
  newMemberCount: ActivityReportMetric;
  activeMemberCount: ActivityReportMetric;
  insights: ActivityReportInsight[];
};

// ============================================
// Group Performance Snapshot (그룹 성과 스냅샷)
// ============================================

export type PerformancePeriod = "week" | "month";

export type PerformanceMetric = {
  value: number;
  changeRate: number | null;
};

export type TopContributor = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  activityCount: number;
};

export type GroupPerformanceSnapshotData = {
  period: PerformancePeriod;
  scheduleCount: PerformanceMetric;
  attendanceRate: PerformanceMetric;
  contentCount: PerformanceMetric;
  newMemberCount: PerformanceMetric;
  topContributor: TopContributor | null;
};

// ============================================
// Group Health Suggestions (그룹 건강도 개선 제안)
// ============================================

export type HealthSuggestionType = "warning" | "info" | "success";

export type HealthSuggestion = {
  type: HealthSuggestionType;
  message: string;
  actionLabel?: string;
};

export type GroupHealthSuggestionsData = {
  score: number | null;
  attendanceRate: number | null;
  activityWeeklyCount: number | null;
  inactiveMemberRatio: number | null;
  suggestions: HealthSuggestion[];
  hasEnoughData: boolean;
};

// ============================================
// Group Activity Trends
// ============================================

export type MonthlyActivityTrend = {
  month: string;
  label: string;
  scheduleCount: number;
  attendanceRate: number;
  postCount: number;
  commentCount: number;
};

export type ActivityTrendChange = {
  scheduleChange: number | null;
  attendanceChange: number | null;
  postChange: number | null;
  commentChange: number | null;
};

export type GroupActivityTrendsResult = {
  monthly: MonthlyActivityTrend[];
  change: ActivityTrendChange;
};

// ============================================
// Group Health Trends
// ============================================

export type WeeklyHealthPoint = {
  label: string;
  weekStart: string;
  attendanceRate: number;
  activityCount: number;
  newMemberCount: number;
  rsvpRate: number;
};

export type HealthMetric = {
  current: number;
  changeRate: number | null;
  trend: number[];
};

export type GroupHealthTrendsResult = {
  attendanceRate: HealthMetric;
  activityCount: HealthMetric;
  newMemberCount: HealthMetric;
  rsvpRate: HealthMetric;
  weeks: WeeklyHealthPoint[];
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Activity Time Heatmap (멤버 활동 시간대 히트맵)
// ============================================

export type ActivityTimeCell = {
  dayOfWeek: number;
  timeSlot: import("./schedule").TimeSlot;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
};

export type ActivityTimeHeatmapResult = {
  cells: ActivityTimeCell[];
  busiestSlot: { dayOfWeek: number; timeSlot: import("./schedule").TimeSlot } | null;
  quietestSlot: { dayOfWeek: number; timeSlot: import("./schedule").TimeSlot } | null;
  hasData: boolean;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Group Performance Report (그룹 성과 요약)
// ============================================

export type ReportMetricItem = {
  current: number;
  previous: number;
  changeRate: number;
};

export type GroupPerformanceReport = {
  period: string;
  attendanceRate: ReportMetricItem;
  attendanceCount: ReportMetricItem;
  postCount: ReportMetricItem;
  commentCount: ReportMetricItem;
  memberCount: ReportMetricItem;
  newMemberCount: ReportMetricItem;
  scheduleCount: ReportMetricItem;
  totalIncome: ReportMetricItem;
  totalExpense: ReportMetricItem;
  netIncome: ReportMetricItem;
};

// ============================================
// Group Health Snapshot (그룹 건강도 추이 - localStorage 기반)
// ============================================

export type GroupHealthSnapshot = {
  month: string;
  attendanceRate: number;
  memberCount: number;
  postCount: number;
  activeRate: number;
};

export type GroupHealthSnapshotResult = {
  snapshots: GroupHealthSnapshot[];
  current: GroupHealthSnapshot | null;
  previous: GroupHealthSnapshot | null;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Activity Archive (그룹 활동 아카이브)
// ============================================

export type MonthlyArchiveTopMember = {
  userId: string;
  name: string;
  score: number;
};

export type MonthlyArchivePopularPost = {
  postId: string;
  title: string;
  commentCount: number;
};

export type MonthlyArchiveEntry = {
  month: string;
  label: string;
  totalSchedules: number;
  totalAttendance: number;
  avgAttendanceRate: number;
  postCount: number;
  commentCount: number;
  newMemberCount: number;
  topMembers: MonthlyArchiveTopMember[];
  popularPost: MonthlyArchivePopularPost | null;
};

// ============================================
// Activity Retrospective (활동 회고 리포트)
// ============================================

export type ActivityRetrospective = {
  month: string;
  attendanceRate: number;
  totalSchedules: number;
  totalPosts: number;
  totalComments: number;
  memberGrowth: number;
  totalIncome: number;
  totalExpense: number;
  generatedAt: string;
};

// ============================================
// Filtered Activity Timeline (활동 타임라인 뷰)
// ============================================

export type FilteredActivityType =
  | "attendance"
  | "post"
  | "comment"
  | "rsvp"
  | "member_join";

export type FilteredActivityFilterType = FilteredActivityType | "all";

export type FilteredActivityItem = {
  id: string;
  type: FilteredActivityType;
  description: string;
  userName: string;
  userId: string;
  occurredAt: string;
  metadata?: Record<string, string>;
};

export type FilteredActivityMonthGroup = {
  month: string;
  label: string;
  items: FilteredActivityItem[];
};

export type FilteredActivityTimelineResult = {
  items: FilteredActivityItem[];
  loading: boolean;
  filterByTypes: (types: FilteredActivityType[]) => FilteredActivityItem[];
  groupByMonth: () => FilteredActivityMonthGroup[];
  refetch: () => void;
};

// ============================================
// Custom Report Builder (커스텀 리포트 빌더, localStorage 기반)
// ============================================

export type ReportMetricType =
  | "attendance_rate"
  | "total_attendance"
  | "post_count"
  | "comment_count"
  | "member_count"
  | "new_member_count"
  | "rsvp_rate";

export type ReportPeriod = "7d" | "30d" | "90d" | "all";

export type CustomReportConfig = {
  id: string;
  name: string;
  metrics: ReportMetricType[];
  period: ReportPeriod;
  createdAt: string;
};

export type ReportMetricValue = {
  type: ReportMetricType;
  label: string;
  value: number;
  unit: string;
};

// ============================================
// Group Report
// ============================================

export type GroupReportPeriod = "monthly" | "quarterly";

export type GroupReportSection = {
  label: string;
  value: number;
  unit: string;
  change?: number;
};

export type GroupActivityReport = {
  id: string;
  period: GroupReportPeriod;
  periodLabel: string;
  sections: GroupReportSection[];
  highlights: string[];
  concerns: string[];
  createdAt: string;
};

// ============================================
// Growth Portfolio (개인 성장 포트폴리오)
// ============================================

export type GrowthEventType = "attendance_milestone" | "post" | "first_attendance" | "streak";

export type GrowthTimelineEvent = {
  id: string;
  type: GrowthEventType;
  title: string;
  description: string;
  date: string;
  metadata?: Record<string, string | number>;
};

// ============================================
// Choreography (안무) 관련
// ============================================

export type ChoreographySection = {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  formation: string;
  createdAt: string;
};

export type ChoreographyNote = {
  id: string;
  projectId: string;
  title: string;
  sections: ChoreographySection[];
  updatedAt: string;
};

export type ChoreoVersionStatus = "draft" | "review" | "approved" | "archived";

export type ChoreoSectionNote = {
  sectionName: string;
  content: string;
  changed: boolean;
};

export type ChoreoVersion = {
  id: string;
  versionNumber: number;
  label: string;
  status: ChoreoVersionStatus;
  description: string;
  sections: ChoreoSectionNote[];
  createdBy: string;
  createdAt: string;
};

export type ChoreoVersionStore = {
  songTitle: string;
  versions: ChoreoVersion[];
  currentVersionId: string | null;
  updatedAt: string;
};

// ============================================
// Dance Style Compatibility (댄스 스타일 호환성)
// ============================================

export type DanceStyleDimension = "rhythm" | "flexibility" | "power" | "groove" | "precision";

export type DanceStyleProfile = {
  userId: string;
  userName: string;
  scores: Record<DanceStyleDimension, number>;
  preferredStyle: string;
  updatedAt: string;
};

export type StyleCompatibilityResult = {
  partnerId: string;
  partnerName: string;
  compatibilityScore: number;
  complementaryAreas: DanceStyleDimension[];
  similarAreas: DanceStyleDimension[];
};

export const DANCE_STYLE_DIMENSION_LABELS: Record<DanceStyleDimension, string> = {
  rhythm:      "리듬감",
  flexibility: "유연성",
  power:       "파워",
  groove:      "그루브",
  precision:   "정확성",
};

export const DANCE_STYLE_DIMENSIONS: DanceStyleDimension[] = [
  "rhythm",
  "flexibility",
  "power",
  "groove",
  "precision",
];

// ============================================
// Dance Certification System (댄스 레벨 인증)
// ============================================

export type DanceCertLevel = "beginner" | "elementary" | "intermediate" | "advanced" | "master";

export type DanceCertification = {
  id: string;
  memberId: string;
  memberName: string;
  genre: string;
  level: DanceCertLevel;
  certifiedBy: string;
  certifiedAt: string;
  note: string;
  expiresAt?: string;
};
