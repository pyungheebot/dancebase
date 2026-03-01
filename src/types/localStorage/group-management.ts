// ============================================
// Announcement Template (그룹 공지사항 템플릿)
// ============================================

export type AnnouncementTemplateCategory =
  | "practice"
  | "performance"
  | "meeting"
  | "gathering"
  | "etc";

export type AnnouncementTemplateVariable = {
  key: string;
  label: string;
  defaultValue?: string;
};

export type AnnouncementTemplateEntry = {
  id: string;
  groupId: string;
  name: string;
  category: AnnouncementTemplateCategory;
  titleTemplate: string;
  bodyTemplate: string;
  variables: AnnouncementTemplateVariable[];
  useCount: number;
  createdAt: string;
  updatedAt: string;
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
// Group Challenge (그룹 챌린지)
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
// Group Rulebook (그룹 규정집 관리)
// ============================================

export type GroupRuleSection = {
  id: string;
  title: string;
  content: string;
  order: number;
  isImportant: boolean;
  lastEditedBy: string | null;
  updatedAt: string;
};

export type GroupRulebookData = {
  groupId: string;
  sections: GroupRuleSection[];
  version: string;
  effectiveDate: string | null;
  updatedAt: string;
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

export type GroupVoteCardOption = {
  id: string;
  label: string;
  voterIds: string[];
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
// Wishlist (그룹 위시리스트)
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
  title: string;
  description: string;
  category: GroupWishCategory;
  priority: GroupWishPriority;
  status: GroupWishStatus;
  estimatedCost: number;
  likes: number;
  proposedBy: string;
  createdAt: string;
  updatedAt?: string;
};

// ============================================
// Read Receipt (그룹 공지 읽음 확인)
// ============================================

export type ReadReceiptPriority = "normal" | "important" | "urgent";

export type ReadReceiptReader = {
  memberName: string;
  readAt: string;
};

export type ReadReceiptAnnouncement = {
  id: string;
  title: string;
  content: string;
  author: string;
  priority: ReadReceiptPriority;
  targetMembers: string[];
  readers: ReadReceiptReader[];
  createdAt: string;
  updatedAt: string;
};

export type ReadReceiptData = {
  groupId: string;
  announcements: ReadReceiptAnnouncement[];
  updatedAt: string;
};

// ============================================
// Anonymous Feedback (익명 피드백 박스)
// ============================================

export type AnonFeedbackCategory =
  | "칭찬"
  | "건의"
  | "불만"
  | "아이디어"
  | "기타";

export type AnonFeedbackItem = {
  id: string;
  content: string;
  category: AnonFeedbackCategory;
  createdAt: string;
  resolved: boolean;
  replyText?: string;
  repliedAt?: string;
};

export type AnonFeedbackData = {
  groupId: string;
  feedbacks: AnonFeedbackItem[];
  updatedAt: string;
};

// ============================================
// Skill Share (그룹 스킬 공유)
// ============================================

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

// ============================================
// Group Penalty (그룹 벌칙 관리)
// ============================================

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

// ============================================
// Group Timeline (그룹 타임라인)
// ============================================

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

export type MeetingVoteOption = {
  id: string;
  text: string;
};

export type MeetingVoteRecord = {
  optionId: string;
  voterName: string;
  votedAt: string;
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
  deadline: string | null;
  createdAt: string;
};

export type MeetingVoteData = {
  groupId: string;
  agendas: MeetingVoteAgendaItem[];
  updatedAt: string;
};

// ============================================
// Group Budget Tracker (그룹 예산 트래커)
// ============================================

export type GroupBudgetTransaction = {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
  paidBy: string | null;
  receiptNote: string | null;
  createdAt: string;
};

export type GroupBudgetCategory = {
  name: string;
  icon: string;
};

export type GroupBudgetData = {
  groupId: string;
  transactions: GroupBudgetTransaction[];
  categories: GroupBudgetCategory[];
  monthlyBudgetLimit: number | null;
  updatedAt: string;
};

// ============================================
// Dues Tracker (그룹 회비 납부 추적기)
// ============================================

export type DuesTrackPaymentStatus = "paid" | "unpaid" | "exempt";

export type DuesTrackMember = {
  id: string;
  name: string;
  status: DuesTrackPaymentStatus;
  paidAt?: string;
  memo?: string;
};

export type DuesTrackPeriod = {
  id: string;
  year: number;
  month: number;
  amount: number;
  dueDate: string;
  members: DuesTrackMember[];
  createdAt: string;
};

export type DuesTrackData = {
  groupId: string;
  periods: DuesTrackPeriod[];
};

// ============================================
// Lost & Found (분실물 관리)
// ============================================

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

// ============================================
// Group Anniversary (그룹 기념일)
// ============================================

export type GroupAnniversaryType =
  | "founding"
  | "performance"
  | "achievement"
  | "custom";

export type GroupAnniversaryItem = {
  id: string;
  title: string;
  date: string;
  type: GroupAnniversaryType;
  description: string | null;
  isRecurring: boolean;
  reminderDays: number | null;
  createdAt: string;
};

export type GroupAnniversaryData = {
  groupId: string;
  anniversaries: GroupAnniversaryItem[];
  updatedAt: string;
};

// ============================================
// Noticeboard (그룹 게시판)
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

// QnaStatus, QnaAnswer, QnaQuestion — misc.ts에 정의됨
