// ============================================
// Command Palette
// ============================================

export type CommandItemType = "navigation" | "action" | "recent";

export type CommandItem = {
  id: string;
  label: string;
  href: string;
  type: CommandItemType;
  group: string;
  shortcut?: string;
  icon?: string;
};

export type RecentPage = {
  href: string;
  label: string;
  visitedAt: number;
};

// ============================================
// Privacy
// ============================================

export type PrivacyLevel = "public" | "private" | "mutual_follow";

export type PrivacyField =
  | "bio"
  | "birth_date"
  | "phone"
  | "instagram"
  | "youtube"
  | "active_region"
  | "dance_genre_start_dates"
  | "dance_genre";

export type PrivacySettings = Record<PrivacyField, PrivacyLevel>;

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  bio: "public",
  birth_date: "private",
  phone: "private",
  instagram: "public",
  youtube: "public",
  active_region: "public",
  dance_genre_start_dates: "public",
  dance_genre: "public",
};

export const PRIVACY_FIELD_LABELS: Record<PrivacyField, string> = {
  bio: "자기소개",
  birth_date: "생년월일",
  phone: "전화번호",
  instagram: "인스타그램",
  youtube: "유튜브",
  active_region: "활동 지역",
  dance_genre_start_dates: "장르별 시작일",
  dance_genre: "댄스 장르",
};

// ============================================
// Profile
// ============================================

export type Profile = {
  id: string;
  name: string;
  dance_genre: string[];
  avatar_url: string | null;
  bio: string;
  birth_date: string | null;
  phone: string;
  instagram: string;
  youtube: string;
  active_region: string;
  dance_genre_start_dates: Record<string, string>;
  privacy_settings: PrivacySettings;
  team_privacy: Record<string, PrivacyLevel>;
  created_at: string;
  updated_at: string;
};

export type PublicProfileGroup = {
  id: string;
  name: string;
  avatar_url: string | null;
  dance_genre: string[];
  group_type: "팀" | "동호회" | "친목" | "기타";
  visibility: "public" | "unlisted" | "private";
  member_count: number;
};

export type PublicProfile = {
  id: string;
  name: string;
  avatar_url: string | null;
  dance_genre: string[] | null;
  bio: string | null;
  birth_date: string | null;
  phone: string | null;
  instagram: string | null;
  youtube: string | null;
  active_region: string | null;
  dance_genre_start_dates: Record<string, string> | null;
  teams: string[] | null;
  groups: PublicProfileGroup[] | null;
  created_at: string;
};

// ============================================
// Follow
// ============================================

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

// ============================================
// Group
// ============================================

export type GroupType = "팀" | "동호회" | "친목" | "기타";
export const GROUP_TYPES: GroupType[] = ["팀", "동호회", "친목", "기타"];

export type GroupVisibility = "public" | "unlisted" | "private";
export type GroupJoinPolicy = "invite_only" | "approval" | "open";

export type Group = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  invite_code_enabled: boolean;
  invite_code_expires_at: string | null;
  created_by: string;
  created_at: string;
  group_type: GroupType;
  visibility: GroupVisibility;
  join_policy: GroupJoinPolicy;
  dance_genre: string[];
  avatar_url: string | null;
  max_members: number | null;
  parent_group_id: string | null;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: "leader" | "sub_leader" | "member";
  joined_at: string;
  nickname?: string | null;
  category_id?: string | null;
  dashboard_settings?: DashboardSettings | null;
};

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
// Dashboard Settings (대시보드 카드 설정)
// ============================================

export type DashboardCardId =
  | "upcoming_schedule"
  | "attendance"
  | "recent_posts"
  | "finance"
  | "members"
  | "subgroups";

export type DashboardCardConfig = {
  id: DashboardCardId;
  visible: boolean;
};

export type DashboardSettings = DashboardCardConfig[];

export const DASHBOARD_CARDS: { id: DashboardCardId; label: string }[] = [
  { id: "upcoming_schedule", label: "다가오는 일정" },
  { id: "attendance", label: "출석 현황" },
  { id: "recent_posts", label: "최근 게시글" },
  { id: "finance", label: "회비" },
  { id: "members", label: "멤버" },
  { id: "subgroups", label: "하위그룹" },
];

export const DEFAULT_DASHBOARD_CARDS: DashboardSettings = [
  { id: "upcoming_schedule", visible: true },
  { id: "attendance", visible: true },
  { id: "recent_posts", visible: true },
  { id: "finance", visible: true },
  { id: "members", visible: true },
  { id: "subgroups", visible: true },
];

export type GroupMemberWithProfile = GroupMember & {
  profiles: Profile;
};

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

export type GroupWithMemberCount = Group & {
  member_count: number;
  my_role?: "leader" | "sub_leader" | "member";
};

// ============================================
// Finance (회비 관리)
// ============================================

export type FinanceCategory = {
  id: string;
  group_id: string;
  project_id: string | null;
  name: string;
  sort_order: number;
  fee_rate: number;
  created_at: string;
};

export type FinanceTransaction = {
  id: string;
  group_id: string;
  project_id: string | null;
  category_id: string | null;
  type: "income" | "expense";
  amount: number;
  title: string;
  description: string | null;
  transaction_date: string;
  created_by: string | null;
  paid_by: string | null;
  created_at: string;
};

export type FinanceTransactionWithDetails = FinanceTransaction & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url"> | null;
  paid_by_profile: Pick<Profile, "id" | "name" | "avatar_url"> | null;
  finance_categories: Pick<FinanceCategory, "id" | "name"> | null;
  projects?: Pick<Project, "id" | "name"> | null;
};

export type FinanceRole = "manager" | "viewer" | null;

export type FinanceBudget = {
  id: string;
  entity_type: "group" | "project";
  entity_id: string;
  year_month: string;
  budget_income: number;
  budget_expense: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================
// Finance Split (분할 정산 AA)
// ============================================

export type FinanceSplit = {
  id: string;
  group_id: string;
  project_id: string | null;
  title: string;
  total_amount: number;
  paid_by: string;
  split_type: "equal" | "custom";
  created_at: string;
  settled_at: string | null;
};

export type FinanceSplitMember = {
  id: string;
  split_id: string;
  user_id: string;
  amount: number;
  is_settled: boolean;
  settled_at: string | null;
};

// ============================================
// Project (프로젝트)
// ============================================

export type ProjectType = "공연" | "모임" | "연습" | "이벤트" | "기타";
export const PROJECT_TYPES: ProjectType[] = ["공연", "모임", "연습", "이벤트", "기타"];

export type ProjectStatus = "신규" | "진행" | "보류" | "종료";
export const PROJECT_STATUSES: ProjectStatus[] = ["신규", "진행", "보류", "종료"];

export type ProjectVisibility = "public" | "unlisted" | "private";

export type ProjectFeature = "board" | "schedule" | "attendance" | "finance";
export const PROJECT_FEATURES: { value: ProjectFeature; label: string }[] = [
  { value: "board", label: "게시판" },
  { value: "schedule", label: "일정" },
  { value: "attendance", label: "출석" },
  { value: "finance", label: "회비" },
];

export type Project = {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  type: ProjectType;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  start_date: string | null;
  end_date: string | null;
};

export type ProjectSharedGroup = {
  project_id: string;
  group_id: string;
  shared_at: string;
  shared_by: string | null;
};

export type ProjectDashboardCardId =
  | "schedule"
  | "attendance"
  | "board"
  | "finance";

export type ProjectDashboardCardConfig = {
  id: ProjectDashboardCardId;
  visible: boolean;
};

export type ProjectDashboardSettings = ProjectDashboardCardConfig[];

export const PROJECT_DASHBOARD_CARDS: { id: ProjectDashboardCardId; label: string }[] = [
  { id: "schedule", label: "다가오는 일정" },
  { id: "attendance", label: "출석 현황" },
  { id: "board", label: "최근 게시글" },
  { id: "finance", label: "회비" },
];

export const DEFAULT_PROJECT_DASHBOARD_CARDS: ProjectDashboardSettings = [
  { id: "schedule", visible: true },
  { id: "attendance", visible: true },
  { id: "board", visible: true },
  { id: "finance", visible: true },
];

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: "leader" | "member";
  joined_at: string;
  dashboard_settings?: ProjectDashboardSettings | null;
};

export type ProjectMemberWithProfile = ProjectMember & {
  profiles: Profile;
};

// ============================================
// Board (게시판)
// ============================================

export const BOARD_CATEGORIES = [
  "전체",
  "공지사항",
  "잡담",
  "정보",
  "사진/영상",
  "투표",
  "미분류",
  "프로젝트",
] as const;

export type BoardCategory = (typeof BOARD_CATEGORIES)[number];

// 그룹별 커스텀 게시판 카테고리 (DB 테이블)
export type BoardCategoryRow = {
  id: string;
  group_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type BoardPost = {
  id: string;
  group_id: string;
  project_id: string | null;
  category: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BoardPostWithDetails = BoardPost & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
  comment_count: number;
  like_count: number;
  projects?: Pick<Project, "id" | "name"> | null;
};

export type BoardComment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  is_hidden: boolean;
  created_at: string;
};

export type BoardCommentWithProfile = BoardComment & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
};

export type BoardPoll = {
  id: string;
  post_id: string;
  allow_multiple: boolean;
  ends_at: string | null;
};

export type BoardPollOption = {
  id: string;
  poll_id: string;
  text: string;
  sort_order: number;
};

export type BoardPollVote = {
  id: string;
  option_id: string;
  user_id: string;
};

export type BoardPollOptionWithVotes = BoardPollOption & {
  vote_count: number;
  voted_by_me: boolean;
};

export type BoardPostAttachment = {
  id: string;
  post_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

export type BoardPostLike = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type BoardPostRevision = {
  id: string;
  post_id: string;
  title: string;
  content: string;
  revised_by: string | null;
  revised_at: string;
};

export type PostBookmark = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
};

export type PostBookmarkWithPost = PostBookmark & {
  board_posts: Pick<BoardPost, "id" | "group_id" | "project_id" | "title" | "category" | "created_at"> & {
    groups: { id: string; name: string } | null;
  };
};

export type PostReadStatus = {
  post_id: string;
  user_id: string;
  read_at: string;
};

// ============================================
// Activity Feed (최근 활동 피드)
// ============================================

export type ActivityFeedItemType = "post" | "comment" | "schedule";

export type ActivityFeedItem = {
  id: string;
  type: ActivityFeedItemType;
  title: string;
  description: string | null;
  groupId: string;
  groupName: string;
  createdAt: string;
  userId: string;
  /** 게시글/댓글의 경우 해당 게시글 ID */
  postId?: string;
};

// ============================================
// Group Activity Timeline (그룹 활동 타임라인)
// ============================================

export type ActivityType = "post" | "comment" | "rsvp" | "member_join" | "schedule_create" | "finance";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  userName: string;
  userId: string;
  createdAt: string;
  metadata?: Record<string, string>;
};

// ============================================
// Content Report (콘텐츠 신고)
// ============================================

export type ContentReport = {
  id: string;
  group_id: string;
  target_type: "post" | "comment";
  target_id: string;
  reporter_id: string;
  reason: "spam" | "harassment" | "inappropriate" | "other";
  description: string | null;
  status: "pending" | "reviewed" | "dismissed";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

// ============================================
// Join Request (가입 신청)
// ============================================

export type JoinRequestStatus = "pending" | "approved" | "rejected";

export type JoinRequest = {
  id: string;
  group_id: string;
  user_id: string;
  status: JoinRequestStatus;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type JoinRequestWithProfile = JoinRequest & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
};

// ============================================
// Notification (알림)
// ============================================

export type NotificationType =
  | "new_post"
  | "new_comment"
  | "attendance"
  | "join_request"
  | "join_approved"
  | "join_rejected"
  | "finance_unpaid"
  | "action_item";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
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
// Activity Log (활동 감사 로그)
// ============================================

export type ActivityLogAction =
  | "member_joined"
  | "member_left"
  | "member_removed"
  | "role_changed"
  | "settings_changed"
  | "post_deleted"
  | "project_created"
  | "project_deleted"
  | "member_approved"
  | "member_rejected";

export const ACTIVITY_ACTION_LABELS: Record<ActivityLogAction, string> = {
  member_joined: "멤버 가입",
  member_left: "멤버 탈퇴",
  member_removed: "멤버 강제 탈퇴",
  role_changed: "역할 변경",
  settings_changed: "설정 변경",
  post_deleted: "게시글 삭제",
  project_created: "프로젝트 생성",
  project_deleted: "프로젝트 삭제",
  member_approved: "가입 승인",
  member_rejected: "가입 거부",
};

export type ActivityLog = {
  id: string;
  entity_type: "group" | "project";
  entity_id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type ActivityLogWithProfile = ActivityLog & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url"> | null;
};

// ============================================
// Message (쪽지)
// ============================================

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type MessageWithProfile = Message & {
  sender: Pick<Profile, "id" | "name" | "avatar_url">;
};

// ============================================
// Entity Settings
// ============================================

export type EntitySettingRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
};

// 출석 리마인더 설정 타입
export type ReminderSettingValue = {
  enabled: boolean;
  offsets: number[]; // 분 단위 (60=1시간 전, 180=3시간 전, 1440=하루 전)
};

export const REMINDER_SETTING_KEY = "attendance_reminder";

export const DEFAULT_REMINDER_SETTING: ReminderSettingValue = {
  enabled: false,
  offsets: [60],
};

// 회비 납부 기한 설정 타입
export type FinanceDueDateSettingValue = {
  day: number; // 매월 N일 (1~28)
};

export const FINANCE_DUE_DATE_SETTING_KEY = "finance_due_date";

export const DEFAULT_FINANCE_DUE_DATE_SETTING: FinanceDueDateSettingValue = {
  day: 0, // 0이면 미설정
};

// 회비 자동 상기 알림 설정 타입
export type FinanceAutoReminderSettingValue = {
  enabled: boolean;
  interval: "weekly" | "biweekly" | "monthly"; // 매주, 격주, 매월
  message: string;
};

export const FINANCE_AUTO_REMINDER_SETTING_KEY = "finance_auto_reminder";

export const DEFAULT_FINANCE_AUTO_REMINDER_SETTING: FinanceAutoReminderSettingValue = {
  enabled: false,
  interval: "monthly",
  message: "안녕하세요! {name}님, 회비 납부를 부탁드립니다. 미납 금액: {amount}원",
};

// 회비 자동 알림 마지막 발송 시간 설정 타입
export type FinanceAutoReminderLastSentValue = {
  sentAt: string; // ISO 8601
  sentCount: number;
};

export const FINANCE_AUTO_REMINDER_LAST_SENT_KEY = "finance_auto_reminder_last_sent";

// ============================================
// Group Links (그룹 링크 모음)
// ============================================

export type GroupLink = {
  id: string;
  url: string;
  title: string;
  icon: string; // 이모지
  order: number;
};

export type GroupLinksSettingValue = {
  links: GroupLink[];
};

export const GROUP_LINKS_SETTING_KEY = "group_links";

export const DEFAULT_GROUP_LINKS_SETTING: GroupLinksSettingValue = {
  links: [],
};

export const GROUP_LINK_ICONS: { emoji: string; label: string }[] = [
  { emoji: "📹", label: "영상" },
  { emoji: "📱", label: "SNS" },
  { emoji: "📋", label: "폼" },
  { emoji: "🔗", label: "일반" },
  { emoji: "🎵", label: "음악" },
  { emoji: "📍", label: "장소" },
  { emoji: "💰", label: "결제" },
  { emoji: "📝", label: "문서" },
];

// ============================================
// Group FAQ (그룹 자주 묻는 질문)
// ============================================

export type GroupFaq = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

export type GroupFaqSettingValue = {
  faqs: GroupFaq[];
};

export const GROUP_FAQ_SETTING_KEY = "group_faq";

export const DEFAULT_GROUP_FAQ_SETTING: GroupFaqSettingValue = {
  faqs: [],
};

// ============================================
// Group Rules (그룹 규칙/공지 고정 배너)
// ============================================

export type GroupRulesData = {
  title: string;
  content: string; // 마크다운 또는 줄바꿈 텍스트
  isVisible: boolean;
  updatedAt: string;
};

export const GROUP_RULES_SETTING_KEY = "group_rules";

export const DEFAULT_GROUP_RULES_DATA: GroupRulesData = {
  title: "",
  content: "",
  isVisible: false,
  updatedAt: "",
};

// ============================================
// Group Notices (그룹 공지 배너)
// ============================================

export type NoticePriority = "urgent" | "important" | "normal";

export type GroupNotice = {
  id: string;
  title: string;
  content: string;
  priority: NoticePriority;
  createdAt: string;
  expiresAt: string | null;
};

export type Conversation = {
  partner_id: string;
  partner_name: string;
  partner_avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
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
// Permission Audit (권한 감사 로그)
// ============================================

export type PermissionAudit = {
  id: string;
  group_id: string;
  actor_id: string;
  target_user_id: string;
  action: "role_change" | "member_add" | "member_remove" | "permission_grant" | "permission_revoke";
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
};

export type PermissionAuditWithProfiles = PermissionAudit & {
  actor: Pick<Profile, "id" | "name" | "avatar_url"> | null;
  target: Pick<Profile, "id" | "name" | "avatar_url"> | null;
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
  /** 진행도 텍스트 (예: "10/50회 출석") */
  progress: string;
  /** 현재 달성값 */
  current: number;
  /** 달성 기준값 */
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
// Receipt Share Token (영수증 공유 링크)
// ============================================

export type ReceiptShareToken = {
  id: string;
  transaction_id: string;
  token: string;
  expires_at: string;
  created_by: string;
  created_at: string;
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
// Member Personal Goal (멤버 개인 목표, localStorage 기반)
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
// Finance Goal (회비 목표, localStorage 기반)
// ============================================

export type FinanceGoal = {
  id: string;
  title: string;
  targetAmount: number;
  deadline: string | null; // "YYYY-MM-DD" 형식
  isAchieved: boolean;
  createdAt: string;
};

// ============================================
// Schedule Checklist (일정 준비물 체크리스트)
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
  /** 곡 ID (project_songs.id) */
  songId: string;
  songTitle: string;
  artist: string | null;
  orderIndex: number;
  /** 예상 연습 시간 (분) */
  plannedMinutes: number;
};

// ============================================
// Poll Decision (투표 기반 의사결정 히스토리, localStorage 기반)
// ============================================

export type PollDecision = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 투표 ID (board_polls.id) */
  pollId: string;
  /** 게시글 ID (board_posts.id) */
  postId: string;
  /** 투표 질문 (게시글 제목) */
  question: string;
  /** 최다 득표 옵션 텍스트 */
  winningOption: string;
  /** 결정 요약 메모 */
  decisionSummary: string;
  /** 채택 일시 (ISO 8601) */
  decidedAt: string;
  /** 채택자 사용자 ID */
  decidedBy: string;
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
// Practice Playlist (연습 음악 플레이리스트, localStorage 기반)
// ============================================

export type PlaylistTrack = {
  id: string;
  title: string;
  artist: string;
  url: string; // YouTube/Spotify URL
  platform: "youtube" | "spotify" | "soundcloud" | "other";
  category: "warmup" | "practice" | "cooldown" | "freestyle";
  addedBy: string; // user name
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
// Split Preset (회비 분담 비율 프리셋, localStorage 기반)
// ============================================

export type SplitRuleType = "equal" | "by_role" | "by_attendance" | "custom_ratio";

export type SplitPreset = {
  id: string;
  name: string;
  ruleType: SplitRuleType;
  config: {
    /** by_role: 역할별 비율 (0~100, 0이면 면제) */
    roleRatios?: Record<string, number>; // { leader: 0, sub_leader: 50, member: 100 }
    /** by_attendance: 출석률 구간별 분담 비율 */
    attendanceThresholds?: Array<{ minRate: number; ratio: number }>; // [{ minRate: 90, ratio: 80 }, ...]
    /** custom_ratio: 수동 비율 (userId → ratio) */
    customRatios?: Record<string, number>;
  };
  createdAt: string;
};

export const SPLIT_RULE_TYPE_LABELS: Record<SplitRuleType, string> = {
  equal: "균등 분배",
  by_role: "역할별",
  by_attendance: "출석률별",
  custom_ratio: "수동 비율",
};

// ============================================
// Video Timestamp (연습 영상 구간 타임스탬프 메모, localStorage 기반)
// ============================================

export type VideoTimestamp = {
  id: string;
  videoId: string;
  seconds: number; // 초 단위
  comment: string;
  authorName: string;
  authorId: string;
  createdAt: string;
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
// Member Intro Card (멤버 자기소개 카드, localStorage 기반)
// ============================================

export type MemberIntroCard = {
  userId: string;
  userName: string;
  joinReason: string; // 입단 계기
  mainPart: string; // 주로 담당하는 파트
  favoriteGenre: string; // 좋아하는 장르
  oneWord: string; // 한마디
  updatedAt: string;
};

// ============================================
// Schedule D-Day Checklist (일정 D-Day 준비 체크리스트, localStorage 기반)
// ============================================

export type DdayChecklistItem = {
  id: string;
  scheduleId: string;
  daysBefore: number; // D-7, D-3, D-1, D-0
  title: string;
  isDone: boolean;
  createdAt: string;
};

// ============================================
// Peer Feedback (멤버 간 익명 피드백)
// ============================================

export type PeerFeedbackType = "strength" | "improvement";

export type PeerFeedback = {
  id: string;
  senderId: string; // 저장되지만 수신자에게는 보이지 않음
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
  /** profiles.id */
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** 생년월일 원본 문자열 (YYYY-MM-DD) */
  birthDate: string;
  /** 이번 연도 기준 생일 날짜 (MM-DD 형식) */
  monthDay: string;
  /** 이번 연도 생일 (Date 객체) */
  birthdayThisYear: Date;
  /** D-Day (0 = 오늘, 양수 = N일 후, 음수 = N일 전) */
  dDay: number;
  /** 오늘이 생일인지 여부 */
  isToday: boolean;
};

// ============================================
// Runthrough Session (공연 런스루 모드, localStorage 기반)
// ============================================

export type RunthroughNote = {
  songId: string;
  songTitle: string;
  timestamp: number; // 해당 곡 시작부터 경과 초
  content: string;
};

export type RunthroughSession = {
  id: string;
  projectId: string;
  startedAt: string;
  endedAt: string | null;
  notes: RunthroughNote[];
  songOrder: string[]; // songId 순서
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
// Reward Points Shop (포인트 상점, localStorage 기반)
// ============================================

export type RewardItem = {
  id: string;
  name: string;
  description: string;
  cost: number; // 필요 포인트
  category: "title" | "badge" | "privilege"; // 칭호, 뱃지, 특권
  emoji: string; // 아이콘 이모지
  isActive: boolean;
};

export type PointTransaction = {
  id: string;
  userId: string;
  amount: number; // +면 적립, -면 사용
  reason: string;
  createdAt: string;
};

export const REWARD_CATEGORY_LABELS: Record<RewardItem["category"], string> = {
  title: "칭호",
  badge: "뱃지",
  privilege: "특권",
};

// 포인트 적립 규칙
export const POINT_RULES = {
  attendance: 10,       // 출석 1회
  streak5: 50,          // 스트릭 5일
  streak10: 100,        // 스트릭 10일
  post: 5,              // 게시글 작성
  rsvp: 3,              // RSVP 응답
} as const;

// ============================================
// Schedule Expense (일정별 비용 정산, localStorage 기반)
// ============================================

export type ScheduleExpense = {
  id: string;
  scheduleId: string;
  title: string;
  amount: number;
  paidBy: string; // 결제자 이름
  category: string; // venue, drink, transport, food, other
  createdAt: string;
};

// ============================================
// Member Dashboard Activity (멤버별 활동 대시보드)
// ============================================

export type MemberActivityType = "attendance" | "post" | "comment" | "rsvp";

export type MemberActivityItem = {
  id: string;
  type: MemberActivityType;
  description: string;
  occurredAt: string; // ISO 8601
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
// Goal Progress Tracker (출석 목표 진행 추적)
// ============================================

export type GoalProgressSetting = {
  targetRate: number; // 0-100
  month: string;      // YYYY-MM 형식
};

export type GoalProgressStatus = "achievable" | "warning" | "impossible" | "achieved";

export type GoalProgressTrackerData = {
  // 목표 설정
  setting: GoalProgressSetting | null;
  // 이번 달 일정/출석 현황
  totalSchedules: number;
  attendedSchedules: number;
  remainingSchedules: number;
  // 계산 결과
  currentRate: number;          // 현재 출석률 (0-100)
  progressRate: number;         // 목표 대비 진행률 (0-100)
  neededAttendances: number;    // 목표 달성까지 필요한 추가 출석 횟수
  status: GoalProgressStatus;   // 달성 가능 여부
  isAchieved: boolean;          // 이미 달성 여부
};

// ============================================
// Winback Campaign (멤버 재참여 캠페인)
// ============================================

export type WinbackCandidate = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  lastActivityAt: string | null;   // 마지막 활동일 (ISO 8601), null이면 활동 기록 없음
  inactiveDays: number;            // 비활성 일수
};

export type WinbackCampaignData = {
  candidates: WinbackCandidate[];
  totalCount: number;
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
// Group Performance Snapshot (그룹 성과 스냅샷)
// ============================================

export type PerformancePeriod = "week" | "month";

export type PerformanceMetric = {
  value: number;
  changeRate: number | null; // 이전 기간 대비 변화율 (%), null이면 비교 불가
};

export type TopContributor = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  activityCount: number; // 게시글 + 댓글 수
};

export type GroupPerformanceSnapshotData = {
  period: PerformancePeriod;
  scheduleCount: PerformanceMetric;
  attendanceRate: PerformanceMetric; // 0~100 (%)
  contentCount: PerformanceMetric;   // 게시글 + 댓글 합계
  newMemberCount: PerformanceMetric;
  topContributor: TopContributor | null;
};

// ============================================
// Notification Template (일정 알림 템플릿)
// ============================================

export type NotificationTemplate = {
  id: string;
  groupId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationTemplateVariable =
  | "scheduleTitle"
  | "location"
  | "time"
  | "nextSchedule";

export const NOTIFICATION_TEMPLATE_VARIABLE_LABELS: Record<
  NotificationTemplateVariable,
  string
> = {
  scheduleTitle: "일정 제목",
  location: "장소",
  time: "시간",
  nextSchedule: "다음 일정",
};

export type SendNotificationResult = {
  success: boolean;
  count: number;
  error?: string;
};

// ============================================
// Member Comparison Dashboard (멤버 활동 비교)
// ============================================

export type MemberComparisonData = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  attendanceRate: number;   // 0~100 (%)
  postCount: number;
  commentCount: number;
  rsvpRate: number;         // 0~100 (%)
};

// ============================================
// Analytics Export (그룹 통계 내보내기)
// ============================================

/** 내보내기 기간 프리셋 */
export type ExportPeriodPreset = "this_month" | "last_month" | "last_3_months" | "all";

/** 내보내기 기간 범위 */
export type ExportDateRange = {
  startDate: string | null; // ISO 날짜 문자열 (null = 전체)
  endDate: string | null;
};

/** 내보내기 데이터 유형 */
export type ExportDataType = "attendance" | "board" | "finance";

/** 출석 CSV 행 */
export type AttendanceExportRow = {
  date: string;
  scheduleTitle: string;
  memberName: string;
  status: string;
};

/** 게시판 활동 CSV 행 */
export type BoardActivityExportRow = {
  date: string;
  title: string;
  authorName: string;
  commentCount: number;
};

/** 재무 CSV 행 */
export type FinanceExportRow = {
  date: string;
  type: string;
  amount: number;
  title: string;
  description: string;
};

// ============================================
// Onboarding Progress Tracker (멤버 온보딩 완료도 추적)
// ============================================

/** 온보딩 항목 ID */
export type OnboardingItemId =
  | "avatar"
  | "bio"
  | "attendance"
  | "post_or_comment"
  | "rsvp";

/** 온보딩 항목 완료 상태 */
export type OnboardingItemStatus = {
  id: OnboardingItemId;
  label: string;
  isDone: boolean;
};

/** 멤버별 온보딩 진행 상황 */
export type MemberOnboardingProgress = {
  userId: string;
  memberId: string;
  name: string;
  joinedAt: string;
  items: OnboardingItemStatus[];
  completionRate: number;
  isAllDone: boolean;
};

/** 그룹 전체 온보딩 추적 결과 */
export type OnboardingProgressResult = {
  members: MemberOnboardingProgress[];
  averageCompletionRate: number;
  totalCount: number;
  allDoneCount: number;
};

// ============================================
// Member Filter Preset (멤버 필터 프리셋)
// ============================================

/** 멤버 역할 타입 */
export type MemberFilterRole = "leader" | "sub_leader" | "member";

/** 멤버 활동 상태 */
export type MemberActivityStatus = "active" | "inactive" | "all";

/** 멤버 필터 조건 */
export type MemberFilterCondition = {
  role: MemberFilterRole[];
  joinedAfter: string | null;
  joinedBefore: string | null;
  minAttendanceRate: number | null;
  maxAttendanceRate: number | null;
  activityStatus: MemberActivityStatus;
};

/** 멤버 필터 프리셋 */
export type MemberFilterPreset = {
  id: string;
  name: string;
  filters: MemberFilterCondition;
  isDefault?: boolean;
  createdAt: string;
};

// ============================================
// Member Pairing (스마트 멤버 페어링, localStorage 기반)
// ============================================

/** 페어링 추천 카드의 유사 항목 배지 유형 */
export type PairingSimilarityTag = "출석률 유사" | "활동 유사" | "가입 시기 유사";

/** 단일 페어링 추천 결과 */
export type PairingRecommendation = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** 호환성 점수: 0~100 */
  score: number;
  /** 유사 항목 배지 목록 */
  similarityTags: PairingSimilarityTag[];
};

/** localStorage에 저장되는 페어링 상태 */
export type PairingState = {
  /** 숨김 처리된 userId 목록 */
  dismissed: string[];
  /** 수락된 userId 목록 */
  accepted: string[];
};

// ============================================
// Member Activity Distribution (멤버 활동 분포도)
// ============================================

/** 멤버 활동 등급 */
export type MemberActivityGrade =
  | "매우 활발"
  | "활발"
  | "보통"
  | "저조";

/** 멤버별 활동 점수 항목 */
export type MemberActivityScore = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** 총 활동 점수 (출석 3점, 게시글 2점, 댓글 1점, RSVP 1점) */
  totalScore: number;
  /** 세부 점수 내역 */
  breakdown: {
    attendance: number;
    posts: number;
    comments: number;
    rsvp: number;
  };
  grade: MemberActivityGrade;
  rank: number;
};

/** 등급별 집계 */
export type MemberActivityGradeSummary = {
  grade: MemberActivityGrade;
  count: number;
  color: string;
};

/** 멤버 활동 분포도 전체 결과 */
export type MemberActivityDistribution = {
  /** 등급별 멤버 수 집계 (4개 등급) */
  gradeSummary: MemberActivityGradeSummary[];
  /** TOP 5 활동 멤버 */
  top5: MemberActivityScore[];
  /** 전체 멤버 수 */
  totalMembers: number;
  /** 그룹 평균 활동 점수 */
  avgScore: number;
};

// ============================================
// Group Activity Trends
// ============================================

/** 월별 그룹 활동 트렌드 데이터 */
export type MonthlyActivityTrend = {
  /** YYYY-MM 형식 */
  month: string;
  /** 한글 월 표시 (예: "9월") */
  label: string;
  /** 해당 월 일정 수 */
  scheduleCount: number;
  /** 해당 월 출석률 (0~100, %) */
  attendanceRate: number;
  /** 해당 월 게시글 수 */
  postCount: number;
  /** 해당 월 댓글 수 */
  commentCount: number;
};

/** 지표별 전월 대비 변화율 */
export type ActivityTrendChange = {
  scheduleChange: number | null;
  attendanceChange: number | null;
  postChange: number | null;
  commentChange: number | null;
};

/** useGroupActivityTrends 훅 반환 타입 */
export type GroupActivityTrendsResult = {
  monthly: MonthlyActivityTrend[];
  change: ActivityTrendChange;
};

// ============================================
// Attendance Streak Leaderboard
// ============================================

/** 스트릭 배지 등급 */
export type StreakBadgeTier = "FIRE" | "STAR" | "DIAMOND" | "CROWN";

/** 리더보드 단일 멤버 항목 */
export type AttendanceStreakEntry = {
  userId: string;
  name: string;
  /** 현재 연속 출석 횟수 */
  currentStreak: number;
  /** 역대 최장 연속 출석 횟수 */
  longestStreak: number;
  /** 배지 등급 (기준 미달이면 null) */
  badge: StreakBadgeTier | null;
  /** 리더보드 순위 (1-based) */
  rank: number;
};

/** useAttendanceStreakLeaderboard 훅 반환 타입 */
export type AttendanceStreakLeaderboardResult = {
  /** 스트릭 내림차순 정렬된 멤버 목록 */
  entries: AttendanceStreakEntry[];
  /** 그룹 전체 평균 현재 스트릭 */
  averageStreak: number;
  /** 최고 스트릭 보유자 (1위) */
  topEntry: AttendanceStreakEntry | null;
};

// ============================================
// Member Health Score (멤버 건강도 대시보드)
// ============================================

/** 건강도 등급 */
export type MemberHealthGrade = "excellent" | "good" | "warning" | "danger";

/** 멤버별 위험 신호 유형 */
export type MemberHealthRiskType =
  | "attendance_drop"   // 출석률 30% 이상 급락
  | "inactive_14days"   // 14일 이상 미활동
  | "rsvp_no_response"; // RSVP 무응답 3회 연속

/** 멤버별 위험 신호 항목 */
export type MemberHealthRisk = {
  type: MemberHealthRiskType;
  label: string;
};

/** 멤버별 5가지 건강도 지표 점수 (각 0~20점) */
export type MemberHealthMetrics = {
  /** 출석률 점수 (0~20) */
  attendance: number;
  /** RSVP 응답률 점수 (0~20) */
  rsvp: number;
  /** 게시판 참여도 점수 (0~20) */
  board: number;
  /** 가입 기간 대비 활동량 점수 (0~20) */
  longevity: number;
  /** 최근 활동 빈도 점수 (0~20) */
  recentActivity: number;
};

/** 멤버 건강도 결과 항목 */
export type MemberHealthScoreItem = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** 총 건강도 점수 (0~100) */
  totalScore: number;
  /** 건강도 등급 */
  grade: MemberHealthGrade;
  /** 지표별 점수 */
  metrics: MemberHealthMetrics;
  /** 감지된 위험 신호 목록 */
  risks: MemberHealthRisk[];
};

/** useMemberHealthScore 훅 반환 타입 */
export type MemberHealthScoreResult = {
  members: MemberHealthScoreItem[];
  /** 전체 평균 건강도 점수 */
  averageScore: number;
  /** 위험 신호가 있는 멤버 수 */
  atRiskCount: number;
  /** 데이터 유무 */
  hasData: boolean;
};

// ============================================
// 스케줄 가용성 예측 (Availability Forecast)
// ============================================

/** 시간대 슬롯 */
export type TimeSlot = "morning" | "afternoon" | "evening" | "night";

/** 시간대 레이블 및 범위 정보 */
export type TimeSlotInfo = {
  key: TimeSlot;
  label: string;
  range: string;
  /** 시작 시(0-23) */
  startHour: number;
  /** 종료 시(0-23, exclusive) */
  endHour: number;
};

export const TIME_SLOTS: TimeSlotInfo[] = [
  { key: "morning",   label: "오전", range: "06-12", startHour: 6,  endHour: 12 },
  { key: "afternoon", label: "오후", range: "12-18", startHour: 12, endHour: 18 },
  { key: "evening",   label: "저녁", range: "18-22", startHour: 18, endHour: 22 },
  { key: "night",     label: "야간", range: "22-06", startHour: 22, endHour: 6  },
];

/** 요일 레이블 (0=일, 1=월, ... 6=토) */
export const DAY_OF_WEEK_LABELS: string[] = ["일", "월", "화", "수", "목", "금", "토"];

/** 멤버별 요일+시간대 조합 예상 출석 확률 */
export type MemberForecast = {
  userId: string;
  name: string;
  /** 예상 출석 확률 0-100 */
  probability: number;
  /** 해당 조합의 표본 수 (신뢰도 기준) */
  sampleCount: number;
};

/** useAvailabilityForecast 훅 반환 타입 */
export type AvailabilityForecastResult = {
  /** 특정 요일+시간대 조합의 멤버별 예상 출석 확률 반환 */
  getForecast: (dayOfWeek: number, timeSlot: TimeSlot) => MemberForecast[];
  /** 데이터 존재 여부 */
  hasData: boolean;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Genre Role Recommendation (장르 역할 추천, localStorage 기반)
// ============================================

/** 프로젝트 내 댄서 역할 유형 */
export type DanceRole =
  | "메인 댄서"
  | "서포트 댄서"
  | "리드"
  | "트레이니"
  | "코레오그래퍼";

/** 역할 추천 이유 */
export type RoleRecommendationReason =
  | "출석률 높음"
  | "활동량 높음"
  | "신규 멤버"
  | "피어 피드백 높음"
  | "장기 활동";

/** 단일 역할 추천 결과 */
export type RoleRecommendation = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** 알고리즘 추천 역할 */
  recommendedRole: DanceRole;
  /** 사용자가 변경한 역할 (없으면 recommendedRole 사용) */
  overriddenRole: DanceRole | null;
  /** 추천 이유 목록 */
  reasons: RoleRecommendationReason[];
  /** 출석률 (0~100, %) */
  attendanceRate: number;
  /** 활동 점수 (게시글 + 댓글) */
  activityScore: number;
  /** 가입 일수 */
  memberDays: number;
};

/** localStorage에 저장되는 역할 추천 상태 */
export type RoleRecommendationState = {
  /** userId → 최종 적용 역할 매핑 */
  assignments: Record<string, DanceRole>;
  /** 마지막 저장 시각 (ISO 문자열) */
  savedAt: string | null;
};

// ============================================
// Member Preview (멤버 프로필 미리보기 팝오버)
// ============================================

/** 그룹 내 멤버 역할 */
export type GroupMemberRole = "leader" | "sub_leader" | "member";

/** 멤버 프로필 미리보기 데이터 */
export type MemberPreviewData = {
  /** 프로필 */
  userId: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  /** 그룹 멤버십 (groupId가 주어진 경우에만 존재) */
  joinedAt: string | null;
  role: GroupMemberRole | null;
  /** 최근 30일 출석률 (0~100, %, groupId가 주어진 경우에만 계산) */
  attendanceRate: number | null;
  /** 최근 활동 요약 */
  postCount: number;
  commentCount: number;
};

// ============================================
// Attendance Team Balancer (출석 팀 밸런서)
// ============================================

/** 팀 색상 설정 */
export type TeamBalancerColor = {
  key: string;
  label: string;
  bg: string;
  text: string;
  border: string;
  badge: string;
};

/** 팀 밸런서 팀 색상 목록 */
export const TEAM_BALANCER_COLORS: TeamBalancerColor[] = [
  { key: "blue",   label: "파랑", bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700" },
  { key: "green",  label: "초록", bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  badge: "bg-green-100 text-green-700" },
  { key: "orange", label: "주황", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
  { key: "purple", label: "보라", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-100 text-purple-700" },
];

/** 팀 밸런서 단일 멤버 항목 */
export type TeamBalancerMember = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** 최근 2개월 출석률 (0~100, %) */
  attendanceRate: number;
};

/** 팀 밸런서 단일 팀 결과 */
export type BalancedTeam = {
  /** 팀 인덱스 (0-based) */
  index: number;
  /** 팀 이름 (팀 A, 팀 B, ...) */
  name: string;
  /** 팀 색상 키 */
  colorKey: string;
  /** 팀원 목록 */
  members: TeamBalancerMember[];
  /** 팀 평균 출석률 (0~100, %) */
  avgAttendanceRate: number;
};

/** useAttendanceTeamBalance 훅 반환 타입 */
export type AttendanceTeamBalanceResult = {
  teams: BalancedTeam[];
  /** 팀 간 출석률 최대 편차 */
  rateDeviation: number;
  /** 데이터 존재 여부 */
  hasData: boolean;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Group Health Trends
// ============================================

/** 주별 그룹 건강도 트렌드 단일 데이터 포인트 */
export type WeeklyHealthPoint = {
  /** "W1" ~ "W8" 형식 레이블 */
  label: string;
  /** 주 시작일 ISO 문자열 */
  weekStart: string;
  /** 출석률 (0~100, %) */
  attendanceRate: number;
  /** 게시판 활동 수 (게시글 + 댓글) */
  activityCount: number;
  /** 신규 멤버 수 */
  newMemberCount: number;
  /** RSVP 응답률 (0~100, %) */
  rsvpRate: number;
};

/** 그룹 건강도 지표 (현재 값 + 변화율) */
export type HealthMetric = {
  /** 현재 값 (가장 최근 주) */
  current: number;
  /** 전주 대비 변화율 (%), null이면 계산 불가 */
  changeRate: number | null;
  /** 8주 추세 배열 */
  trend: number[];
};

/** useGroupHealthTrends 훅 반환 타입 */
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
// Attendance Consistency (히트맵)
// ============================================

/** 출석 강도 레벨 */
export type AttendanceIntensity = 0 | 1 | 2 | 3;

/** 히트맵 단일 날짜 셀 */
export type AttendanceHeatmapCell = {
  /** YYYY-MM-DD 형식 날짜 */
  date: string;
  /** 해당 날짜에 일정이 있는지 여부 */
  hasSchedule: boolean;
  /** 출석 여부 (일정이 있을 경우) */
  isPresent: boolean;
  /** 색상 강도: 0=없음, 1=낮음(1-50%), 2=중간(50-80%), 3=높음(80%+) */
  intensity: AttendanceIntensity;
};

/** 주별 출석 집계 데이터 */
export type WeeklyAttendanceData = {
  /** 주 인덱스 (0 = 가장 오래된 주) */
  weekIndex: number;
  /** 해당 주의 일정 수 */
  scheduleCount: number;
  /** 해당 주의 출석 수 */
  presentCount: number;
  /** 해당 주의 출석률 (0~100) */
  attendanceRate: number;
};

/** useAttendanceConsistency 훅 반환 타입 */
export type AttendanceConsistencyResult = {
  /** 12주 x 7일 히트맵 그리드 (외부 배열: 12주, 내부 배열: 7일) */
  weeks: AttendanceHeatmapCell[][];
  /** 주별 출석 집계 */
  weeklyData: WeeklyAttendanceData[];
  /** 연속 출석 일수 (일정 기준) */
  currentStreak: number;
  /** 최근 12주 출석률 (0~100) */
  overallRate: number;
  /** 출석 일관성 점수 (0~100, 표준편차가 작을수록 높음) */
  consistencyScore: number;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Schedule Attendance Predictor (일정 출석 예측)
// ============================================

/** 일정 출석 예측 - 멤버별 예측 결과 */
export type ScheduleAttendancePrediction = {
  userId: string;
  name: string;
  /** 종합 예상 출석 확률 0-100 (가중 평균) */
  probability: number;
  /** 전체 출석률 (0-100) */
  overallRate: number;
  /** 같은 요일 출석률 (0-100) */
  sameDayRate: number;
  /** 같은 시간대 출석률 (0-100) */
  sameSlotRate: number;
  /** 분석에 사용된 전체 표본 수 */
  sampleCount: number;
  /** 추천 라벨 */
  label: "참석 예상" | "불확실" | "불참 가능";
};

/** useScheduleAttendancePredictor 훅 반환 타입 */
export type ScheduleAttendancePredictorResult = {
  predictions: ScheduleAttendancePrediction[];
  /** 예상 참석 인원 (50%+ 멤버 수) */
  expectedCount: number;
  /** 전체 멤버 수 */
  totalCount: number;
  /** 분석 기반 설명 (예: "월요일 19시 기준 과거 데이터 12건 분석") */
  analysisSummary: string;
  /** 대상 일정의 요일 (0=일~6=토) */
  dayOfWeek: number;
  /** 대상 일정의 시간대 */
  timeSlot: TimeSlot;
  /** 대상 일정의 시작 시각 (ISO) */
  startsAt: string;
  /** 데이터 존재 여부 */
  hasData: boolean;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Weekly Challenge Board (주간 챌린지 보드)
// ============================================

/** 챌린지 유형 */
export type WeeklyChallengeType = "attendance" | "board" | "rsvp";

/** 단일 챌린지 정의 */
export type WeeklyChallenge = {
  id: WeeklyChallengeType;
  title: string;
  /** 달성 목표 수 */
  goal: number;
};

/** 멤버별 챌린지 진행 상황 */
export type MemberChallengeProgress = {
  /** 챌린지 ID */
  challengeId: WeeklyChallengeType;
  /** 현재 진행 수 */
  current: number;
  /** 목표 수 */
  goal: number;
  /** 완료 여부 */
  completed: boolean;
  /** 진행률 (0~100) */
  progressRate: number;
};

/** 멤버별 주간 챌린지 결과 */
export type WeeklyChallengeEntry = {
  userId: string;
  name: string;
  /** 챌린지별 진행 상황 */
  challenges: MemberChallengeProgress[];
  /** 완료한 챌린지 수 */
  completedCount: number;
  /** 종합 점수 (completedCount 기준) */
  score: number;
  /** 리더보드 순위 (1-based) */
  rank: number;
};

/** useWeeklyChallengeBoard 훅 반환 타입 */
export type WeeklyChallengeBoardResult = {
  /** 점수 내림차순 정렬된 멤버 목록 */
  entries: WeeklyChallengeEntry[];
  /** 챌린지 정의 목록 */
  challenges: WeeklyChallenge[];
  /** 이번 주 월요일 (ISO 날짜 문자열) */
  weekStart: string;
  /** 이번 주 일요일 (ISO 날짜 문자열) */
  weekEnd: string;
  /** 오늘 기준 이번 주 남은 일수 */
  daysLeft: number;
  /** 현재 사용자 항목 */
  myEntry: WeeklyChallengeEntry | null;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Activity Time Heatmap (멤버 활동 시간대 히트맵)
// ============================================

/** 히트맵 단일 셀: 요일 x 시간대 조합의 활동 데이터 */
export type ActivityTimeCell = {
  /** 요일 (0=일, 1=월, ... 6=토) */
  dayOfWeek: number;
  /** 시간대 슬롯 */
  timeSlot: TimeSlot;
  /** 활동 건수 (출석 + 게시글 + 댓글) */
  count: number;
  /** 강도 레벨 0-4 */
  intensity: 0 | 1 | 2 | 3 | 4;
};

/** 히트맵 전체 결과 */
export type ActivityTimeHeatmapResult = {
  /** 28칸 셀 데이터 (7요일 x 4시간대) */
  cells: ActivityTimeCell[];
  /** 가장 활발한 시간대 */
  busiestSlot: { dayOfWeek: number; timeSlot: TimeSlot } | null;
  /** 가장 조용한 시간대 (활동이 있는 셀 중 최솟값) */
  quietestSlot: { dayOfWeek: number; timeSlot: TimeSlot } | null;
  /** 데이터 존재 여부 */
  hasData: boolean;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Project Resource Library (프로젝트 리소스 라이브러리)
// ============================================

/** 리소스 유형 */
export type ResourceType = "music" | "video" | "image" | "document";

/** 프로젝트 리소스 */
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
// Board Emoji Reactions (게시글 이모지 반응)
// ============================================

export const BOARD_REACTION_EMOJIS = ["👍", "❤️", "😂", "👏", "🔥", "😢"] as const;

export type BoardReactionEmoji = (typeof BOARD_REACTION_EMOJIS)[number];

export type BoardReactionEntry = {
  emoji: BoardReactionEmoji;
  userIds: string[];
};

export type BoardReactionsData = BoardReactionEntry[];

// ============================================
// Group Activity Report (그룹 활동 보고서)
// ============================================

export type ActivityReportPeriod = "week" | "month";

export type ActivityReportMetric = {
  /** 지표 값 */
  value: number;
  /** 표시용 레이블 */
  label: string;
};

export type ActivityReportInsight = {
  /** 인사이트 메시지 */
  message: string;
  /** 인사이트 유형 (positive: 긍정, neutral: 중립) */
  type: "positive" | "neutral";
};

export type GroupActivityReportData = {
  period: ActivityReportPeriod;
  /** 기간 내 일정 수 */
  scheduleCount: ActivityReportMetric;
  /** 출석률 (0~100 %) */
  attendanceRate: ActivityReportMetric;
  /** 게시글 수 */
  postCount: ActivityReportMetric;
  /** 댓글 수 */
  commentCount: ActivityReportMetric;
  /** RSVP 응답률 (0~100 %) */
  rsvpRate: ActivityReportMetric;
  /** 신규 멤버 수 */
  newMemberCount: ActivityReportMetric;
  /** 유니크 활동 멤버 수 */
  activeMemberCount: ActivityReportMetric;
  /** 자동 생성 인사이트 목록 */
  insights: ActivityReportInsight[];
};

// ============================================
// Project Milestone (프로젝트 마일스톤, localStorage 기반)
// ============================================

/** 프로젝트 마일스톤 단일 항목 */
export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  /** 목표 날짜 (YYYY-MM-DD) */
  targetDate: string;
  /** 완료 시각 (ISO 8601), null이면 미완료 */
  completedAt: string | null;
  /** 정렬 순서 (낮을수록 앞) */
  sortOrder: number;
  createdAt: string;
};

// ============================================
// Member Benchmarking (멤버 벤치마킹)
// ============================================

/** 단일 벤치마킹 지표 */
export type BenchmarkMetric = {
  /** 내 값 (0~100, %) */
  myValue: number;
  /** 그룹 평균 (0~100, %) */
  groupAverage: number;
  /** 그룹 평균 대비 차이 (양수=평균 초과, 음수=평균 미만) */
  diffFromAverage: number;
  /** 상위 백분위 (1=상위 1%, 100=하위) */
  percentile: number;
};

/** 멤버 벤치마킹 결과 */
export type MemberBenchmarkingResult = {
  /** 출석률 지표 */
  attendance: BenchmarkMetric;
  /** 활동량 지표 (게시글 + 댓글) */
  activity: BenchmarkMetric;
  /** RSVP 응답률 지표 */
  rsvp: BenchmarkMetric;
  /** 데이터 존재 여부 */
  hasData: boolean;
  /** 총 멤버 수 */
  totalMemberCount: number;
};

// ============================================
// Dashboard Layout (대시보드 레이아웃, localStorage 기반)
// ============================================

/** 대시보드 위젯 ID */
export type DashboardWidgetId =
  | "upcoming-schedules"
  | "quick-stats"
  | "recent-activity"
  | "monthly-summary"
  | "weekly-challenge"
  | "health-trend"
  | "activity-report"
  | "member-activity";

/** 대시보드 위젯 메타 (ID + 라벨) */
export type DashboardWidgetMeta = {
  id: DashboardWidgetId;
  label: string;
};

/** 대시보드 위젯 레이아웃 항목 */
export type DashboardWidgetItem = {
  id: DashboardWidgetId;
  visible: boolean;
  order: number;
};

/** 대시보드 레이아웃 전체 */
export type DashboardLayout = DashboardWidgetItem[];

// ============================================
// Filtered Activity Timeline (활동 타임라인 뷰)
// ============================================

/** 필터링 가능한 활동 타임라인 유형 */
export type FilteredActivityType =
  | "attendance"
  | "post"
  | "comment"
  | "rsvp"
  | "member_join";

/** 필터 옵션 (전체 포함) */
export type FilteredActivityFilterType = FilteredActivityType | "all";

/** 활동 타임라인 단일 항목 */
export type FilteredActivityItem = {
  id: string;
  type: FilteredActivityType;
  description: string;
  userName: string;
  userId: string;
  occurredAt: string; // ISO 8601
  metadata?: Record<string, string>;
};

/** 월별 그룹화 결과 */
export type FilteredActivityMonthGroup = {
  /** YYYY-MM 형식 */
  month: string;
  /** 한글 월 레이블 (예: "2026년 2월") */
  label: string;
  items: FilteredActivityItem[];
};

/** useFilteredActivityTimeline 훅 반환 타입 */
export type FilteredActivityTimelineResult = {
  items: FilteredActivityItem[];
  loading: boolean;
  filterByTypes: (types: FilteredActivityType[]) => FilteredActivityItem[];
  groupByMonth: () => FilteredActivityMonthGroup[];
  refetch: () => void;
};

/** 위젯 이동 방향 */
export type DashboardWidgetDirection = "up" | "down";

/** 모든 위젯 메타 목록 */
export const DASHBOARD_WIDGETS: DashboardWidgetMeta[] = [
  { id: "upcoming-schedules", label: "예정 일정" },
  { id: "quick-stats", label: "빠른 통계" },
  { id: "recent-activity", label: "최근 활동" },
  { id: "monthly-summary", label: "월간 요약" },
  { id: "weekly-challenge", label: "주간 챌린지" },
  { id: "health-trend", label: "건강도 트렌드" },
  { id: "activity-report", label: "활동 보고서" },
  { id: "member-activity", label: "내 활동" },
];

/** 기본 대시보드 레이아웃 */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = DASHBOARD_WIDGETS.map((w, i) => ({
  id: w.id,
  visible: true,
  order: i,
}));

// ============================================
// Notification Rules Builder (알림 규칙 빌더, localStorage 기반)
// ============================================

/** 알림 조건 유형 */
export type NotificationConditionType =
  | "attendance_below"   // 출석률 N% 미만
  | "inactive_days"      // N일 이상 미활동
  | "schedule_upcoming"  // 일정 N일 전
  | "rsvp_missing"       // RSVP 미응답 N회 이상
  | "new_post";          // 새 게시글 등록됨

/** 알림 조건 단일 항목 */
export type NotificationCondition = {
  /** 조건 유형 */
  type: NotificationConditionType;
  /**
   * 조건 값 (숫자 기반 조건에서 사용)
   * - attendance_below: 출석률 임계값 (0~100)
   * - inactive_days: 미활동 일수
   * - schedule_upcoming: 일정 전 일수
   * - rsvp_missing: 무응답 횟수
   * - new_post: 사용하지 않음 (undefined 가능)
   */
  value?: number;
};

/** 알림 규칙 액션 유형 */
export type NotificationRuleAction = "in-app";

/** 알림 규칙 단일 항목 */
export type NotificationRule = {
  id: string;
  /** 그룹 ID */
  groupId: string;
  /** 규칙 이름 */
  name: string;
  /** 활성화 여부 */
  enabled: boolean;
  /** 조건 목록 (AND 조건) */
  conditions: NotificationCondition[];
  /** 트리거 시 실행할 액션 */
  action: NotificationRuleAction;
  /** 기본 규칙 여부 */
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// 출석 인증서
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
// Skill Self Evaluation (스킬 자가 평가, localStorage 기반)
// ============================================

/** 스킬 카테고리 */
export type SkillCategory =
  | "physical"
  | "rhythm"
  | "expression"
  | "technique"
  | "memory"
  | "teamwork";

/** 스킬 카테고리 한글 레이블 */
export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  physical: "기초 체력",
  rhythm: "리듬감",
  expression: "표현력",
  technique: "테크닉",
  memory: "안무 기억력",
  teamwork: "팀워크",
};

/** 스킬 카테고리 순서 (레이더 차트 꼭짓점 순서) */
export const SKILL_CATEGORIES: SkillCategory[] = [
  "physical",
  "rhythm",
  "expression",
  "technique",
  "memory",
  "teamwork",
];

/** 단일 자가 평가 기록 */
export type SkillEvaluation = {
  id: string;
  scores: Record<SkillCategory, number>; // 1~5
  totalScore: number;
  evaluatedAt: string; // ISO
};

/** 자가 평가 이력 (localStorage 저장 단위) */
export type SkillEvaluationHistory = {
  evaluations: SkillEvaluation[];
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
// Group Poll (그룹 투표/설문, localStorage 기반)
// ============================================

export type PollOption = {
  id: string;
  text: string;
  voterIds: string[];
};

export type GroupPoll = {
  id: string;
  groupId: string;
  title: string;
  options: PollOption[];
  type: "single" | "multiple";
  anonymous: boolean;
  creatorId: string;
  creatorName: string;
  expiresAt: string | null;
  createdAt: string;
};

// ============================================
// Practice Journal (개인 연습 일지, localStorage 기반)
// ============================================

export type PracticeEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  content: string;
  selfRating: number; // 1~5
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
  goalProgress: number; // 0~100
};

// ============================================
// Weekly Attendance Checkin (주간 출석 체크인, localStorage 기반)
// ============================================

export type WeeklyCheckinRecord = {
  weekStart: string; // ISO (월요일)
  goal: number; // 1~7
  actual: number;
  achieved: boolean;
};

export type WeeklyCheckinData = {
  currentGoal: number | null;
  history: WeeklyCheckinRecord[];
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
  month: string; // YYYY-MM
  label: string; // "2026년 2월"
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
// Member Score Leaderboard (멤버 종합 점수 리더보드)
// ============================================

/** 멤버 종합 점수 세부 내역 */
export type MemberScoreBreakdown = {
  /** 출석 점수 (present: 10점, late: 5점) */
  attendance: number;
  /** 게시글 작성 점수 (건당 15점) */
  posts: number;
  /** 댓글 작성 점수 (건당 5점) */
  comments: number;
  /** RSVP 응답 점수 (건당 3점) */
  rsvp: number;
};

/** 멤버 종합 점수 리더보드 단일 항목 */
export type MemberScoreEntry = {
  userId: string;
  name: string;
  totalScore: number;
  breakdown: MemberScoreBreakdown;
  rank: number;
};

/** useMemberScoreLeaderboard 훅 반환 타입 */
export type MemberScoreLeaderboardResult = {
  /** 점수 내림차순 정렬된 전체 멤버 목록 (최대 20명) */
  entries: MemberScoreEntry[];
  /** 전체 참여 멤버 수 */
  totalMembers: number;
  /** 현재 로그인 사용자 항목 (없으면 null) */
  myEntry: MemberScoreEntry | null;
};

// ============================================
// Bookmark (즐겨찾기/북마크 시스템, localStorage 기반)
// ============================================

export type BookmarkTargetType = "post" | "schedule" | "member";

export type BookmarkItem = {
  id: string;
  targetId: string;
  targetType: BookmarkTargetType;
  title: string;
  href: string;
  createdAt: string;
};

// ============================================
// Music Playlist (그룹 음악 플레이리스트, localStorage 기반)
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
// Practice Assignment (연습 과제 할당, localStorage 기반)
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
// Schedule Template Item (일정 템플릿/복제, localStorage 기반)
// ============================================

export type ScheduleTemplateItem = {
  id: string;
  groupId: string;
  title: string;
  location: string;
  dayOfWeek: number | null; // 0=일 ~ 6=토
  startTime: string; // "HH:mm"
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
// Member Notes (멤버 메모/노트, localStorage 기반)
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
// Onboarding Tasks (온보딩 과제, localStorage 기반)
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
// Board Trend Analytics (게시판 트렌드 분석)
// ============================================

export type BoardTrendWeekData = {
  weekLabel: string;
  postCount: number;
  commentCount: number;
};

export type BoardTrendTopAuthor = {
  userId: string;
  name: string;
  postCount: number;
  commentCount: number;
};

export type BoardTrendPopularPost = {
  postId: string;
  title: string;
  commentCount: number;
  authorName: string;
};

export type BoardTrendResult = {
  weeklyTrend: BoardTrendWeekData[];
  dayOfWeekPattern: number[]; // index 0=일 ~ 6=토
  topAuthors: BoardTrendTopAuthor[];
  popularPosts: BoardTrendPopularPost[];
  totalPosts: number;
  totalComments: number;
  avgCommentsPerPost: number;
  uniqueAuthors: number;
};

// ============================================
// Attendance Prediction Calendar (멤버 출석 예측 달력)
// ============================================

export type PredictionCalendarDay = {
  date: string; // YYYY-MM-DD
  scheduleId: string | null;
  scheduleTitle: string | null;
  predictedRate: number | null; // 0~100
  actualStatus: "present" | "absent" | "late" | null;
};

export type AttendancePredictionCalendarResult = {
  days: PredictionCalendarDay[];
  dayOfWeekRates: number[]; // index 0=일 ~ 6=토
  overallRate: number;
  month: string; // YYYY-MM
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
  isUrgent: boolean; // 24시간 이내
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
// Anonymous Feedback (익명 피어 피드백)
// ============================================

export type FeedbackCategory = "praise" | "encouragement" | "improvement" | "other";

export type AnonymousFeedback = {
  id: string;
  groupId: string;
  targetUserId: string;
  senderId: string; // 로컬에서만 사용, 표시 안함
  category: FeedbackCategory;
  content: string;
  createdAt: string;
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
// Reward Shop (출석 보상 포인트 상점, localStorage 기반)
// ============================================

export type RewardShopItem = {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  quantity: number; // -1 = 무제한
  createdAt: string;
};

export type RewardExchangeRecord = {
  id: string;
  userId: string;
  userName: string;
  itemId: string;
  itemName: string;
  pointsSpent: number;
  exchangedAt: string;
};

export type RewardShopData = {
  items: RewardShopItem[];
  exchanges: RewardExchangeRecord[];
};

// ============================================
// Schedule Recurrence (일정 반복 설정, localStorage 기반)
// ============================================

export type RecurrenceType = "weekly" | "biweekly" | "monthly";

export type RecurrenceEndType = "never" | "by_date" | "by_count";

export type ScheduleRecurrenceRule = {
  id: string;
  groupId: string;
  type: RecurrenceType;
  daysOfWeek: number[]; // 0=일 ~ 6=토
  startTime: string; // "HH:mm"
  durationMinutes: number;
  title: string;
  location: string;
  endType: RecurrenceEndType;
  endDate: string | null;
  endCount: number | null;
  createdAt: string;
};

// ============================================
// Budget Spending Tracker (예산 지출 추적)
// ============================================

export type BudgetAlertLevel = "safe" | "caution" | "warning" | "exceeded";

export type MonthlyBudgetStatus = {
  month: string;
  budget: number;
  spent: number;
  spentRate: number;
  alertLevel: BudgetAlertLevel;
};

export type BudgetSpendingResult = {
  currentMonth: MonthlyBudgetStatus;
  recentMonths: MonthlyBudgetStatus[];
  hasBudget: boolean;
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
// Dynamic Teams (동적 팀/소그룹 관리, localStorage 기반)
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
// Event Gallery (그룹 이벤트 갤러리, localStorage 기반)
// ============================================

export type EventTag = "performance" | "competition" | "workshop" | "other";

export type GroupEvent = {
  id: string;
  groupId: string;
  title: string;
  date: string; // YYYY-MM-DD
  location: string;
  description: string;
  tag: EventTag;
  participantCount: number;
  createdAt: string;
};

// ============================================
// Member Attendance Stats (멤버 출석 통계)
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
  dayIndex: number; // 0=월 ~ 6=일
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
// Group Announcements (그룹 공지사항)
// ============================================

export type GroupAnnouncementPriority = "urgent" | "normal" | "low";

export type GroupAnnouncementItem = {
  id: string;
  title: string;
  content: string;
  priority: GroupAnnouncementPriority;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GroupAnnouncementInput = {
  title: string;
  content: string;
  priority: GroupAnnouncementPriority;
  pinned: boolean;
};

// ============================================
// Schedule Feedback Item (일정 피드백/후기, localStorage 기반)
// ============================================

export type ScheduleFeedbackMood = "great" | "good" | "ok" | "bad";

export type ScheduleFeedbackItem = {
  id: string;
  scheduleId: string;
  rating: number; // 1-5 별점
  content: string; // 후기 텍스트 (선택)
  mood: ScheduleFeedbackMood;
  createdAt: string; // ISO 날짜 문자열
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
// Finance Forecast (재정 건강도 예측)
// ============================================

/** 재정 건강도 레벨 */
export type FinanceHealthLevel = "안정" | "주의" | "위험";

/** 월별 수입/지출/순이익 데이터 (실제 + 예측) */
export type FinanceMonthlyData = {
  /** YYYY-MM 형식 */
  month: string;
  /** 한글 월 레이블 (예: "9월") */
  label: string;
  /** 수입 합계 */
  income: number;
  /** 지출 합계 */
  expense: number;
  /** 순이익 (income - expense) */
  netProfit: number;
  /** 예측 데이터 여부 (true면 점선 테두리로 표시) */
  isForecast: boolean;
};

/** 재정 건강도 예측 전체 결과 */
export type FinanceForecastResult = {
  /** 최근 6개월 실제 데이터 + 예측 3개월 (총 9개월) */
  monthly: FinanceMonthlyData[];
  /** 현재 재정 건강도 레벨 */
  healthLevel: FinanceHealthLevel;
  /** 건강도 판정 근거 메시지 */
  healthMessage: string;
  /** 예측 기간 내 예상 평균 순이익 */
  forecastAvgNetProfit: number;
  /** 데이터 존재 여부 */
  hasData: boolean;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Member Role Badge (멤버 역할 배지, localStorage 기반)
// ============================================

/** 역할 배지 색상 */
export type RoleBadgeColor =
  | "purple"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "pink";

/** 역할 배지 단일 정의 */
export type RoleBadge = {
  id: string;
  name: string;
  color: RoleBadgeColor;
  icon: string; // 이모지
  description: string;
  /** 기본 제공 배지 여부 (기본 배지는 삭제 불가) */
  isDefault: boolean;
};

/** 그룹별 역할 배지 데이터 (localStorage 저장 단위) */
export type RoleBadgesData = {
  badges: RoleBadge[];
};

/** 멤버별 배지 할당 데이터 (localStorage 저장 단위) */
export type MemberBadgeAssignments = {
  /** userId → badgeId[] 매핑 */
  assignments: Record<string, string[]>;
};

/** 기본 제공 역할 배지 목록 */
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

// ============================================
// Skill Evolution Tracker (스킬 성장 타임라인, localStorage 기반)
// ============================================

/** 스킬 성장 타임라인 - 월별 스냅샷 단일 항목 */
export type SkillMonthlySnapshot = {
  /** "YYYY-MM" 형식 (예: "2026-02") */
  month: string;
  /** 카테고리별 점수 (1~5) */
  scores: Record<SkillCategory, number>;
  /** 6개 평균 점수 (소수점 2자리) */
  avgScore: number;
  /** 기록 시각 (ISO 8601) */
  recordedAt: string;
};

/** 스킬 성장 타임라인 전체 저장 단위 */
export type SkillEvolutionData = {
  /** 최신순 정렬된 월별 스냅샷 목록 (최대 12개) */
  snapshots: SkillMonthlySnapshot[];
};

/** 역할 배지 색상별 Tailwind 클래스 */
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
// Decision Log (그룹 의사결정 로그, localStorage 기반)
// ============================================

/** 의사결정 영향도 */
export type DecisionImpact = "high" | "medium" | "low";

/** 의사결정 카테고리 */
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

/** 의사결정 로그 단일 항목 */
export type DecisionLogItem = {
  id: string;
  /** 그룹 ID */
  groupId: string;
  /** 의사결정 제목 */
  title: string;
  /** 카테고리 */
  category: DecisionCategory;
  /** 상세 설명 */
  description: string;
  /** 결정자 이름 */
  decidedBy: string;
  /** 결정 일시 (ISO 8601) */
  decidedAt: string;
  /** 영향도 */
  impact: DecisionImpact;
};

// ============================================
// Schedule Attendance Summary (일정별 참석 요약)
// ============================================

/** 출석 상태 (attendance 테이블 status 값) */
export type AttendanceRecordStatus = "present" | "absent" | "late";

/** 멤버 출석 상태 단일 항목 (미응답 포함) */
export type ScheduleAttendanceMember = {
  userId: string;
  name: string;
  status: AttendanceRecordStatus | "no_response";
};

/** 일정별 참석 요약 결과 */
export type ScheduleAttendanceSummaryResult = {
  scheduleId: string;
  scheduleTitle: string;
  startsAt: string;
  totalMembers: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  noResponseCount: number;
  /** 출석률 = (참석 + 지각) / 전체 멤버 수 × 100 (0~100) */
  attendanceRate: number;
  members: ScheduleAttendanceMember[];
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Engagement Campaign (참여도 목표 캠페인, localStorage 기반)
// ============================================

/** 캠페인 목표 유형 */
export type EngagementGoalType = "attendance" | "posts" | "comments";

/** 캠페인 상태 */
export type EngagementCampaignStatus = "active" | "completed" | "expired";

/** 캠페인 메모 단일 항목 */
export type EngagementCampaignMemo = {
  id: string;
  content: string;
  createdAt: string;
};

/** 참여도 목표 캠페인 단일 항목 */
export type EngagementCampaign = {
  id: string;
  /** 그룹 ID */
  groupId: string;
  /** 대상 멤버 이름 */
  targetMemberName: string;
  /** 목표 유형 */
  goalType: EngagementGoalType;
  /** 목표값 (횟수) */
  goalValue: number;
  /** 현재 진행값 (수동 입력) */
  currentValue: number;
  /** 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 종료일 (YYYY-MM-DD) */
  endDate: string;
  /** 캠페인 상태 */
  status: EngagementCampaignStatus;
  /** 메모 이력 */
  memos: EngagementCampaignMemo[];
  /** 생성 일시 (ISO 8601) */
  createdAt: string;
};

/** 목표 유형 한글 레이블 */
export const ENGAGEMENT_GOAL_TYPE_LABELS: Record<EngagementGoalType, string> = {
  attendance: "출석 N회 이상",
  posts: "게시글 N개 작성",
  comments: "댓글 N개 작성",
};

/** 목표 유형 단위 레이블 */
export const ENGAGEMENT_GOAL_TYPE_UNITS: Record<EngagementGoalType, string> = {
  attendance: "회",
  posts: "개",
  comments: "개",
};

/** 캠페인 상태 한글 레이블 */
export const ENGAGEMENT_CAMPAIGN_STATUS_LABELS: Record<EngagementCampaignStatus, string> = {
  active: "진행 중",
  completed: "완료",
  expired: "만료",
};

/** 최대 캠페인 수 */
export const ENGAGEMENT_CAMPAIGN_MAX = 10;

// ============================================
// Group Guideline (그룹 규칙/가이드, localStorage 기반)
// ============================================

/** 그룹 가이드라인 카테고리 */
export type GroupGuidelineCategory = "출석" | "매너" | "연습" | "재무" | "기타";

/** 그룹 가이드라인 카테고리 목록 */
export const GROUP_GUIDELINE_CATEGORIES: GroupGuidelineCategory[] = [
  "출석",
  "매너",
  "연습",
  "재무",
  "기타",
];

/** 그룹 가이드라인 단일 항목 */
export type GroupGuidelineItem = {
  id: string;
  title: string;
  description: string;
  category: GroupGuidelineCategory;
  order: number;
  createdAt: string;
};

/** localStorage에 저장되는 가이드라인 전체 데이터 */
export type GroupGuidelinesData = {
  items: GroupGuidelineItem[];
};

/** 최대 가이드라인 항목 수 */
export const GROUP_GUIDELINE_MAX = 30;

// ============================================
// Partner Matching (랜덤 짝꿍 매칭, localStorage 기반)
// ============================================

/** 짝꿍 쌍 단일 항목 (2인 또는 3인) */
export type PartnerPair = {
  /** 멤버 user_id 배열 (2명 또는 홀수일 때 마지막 조는 3명) */
  memberIds: string[];
  /** 멤버 이름 배열 (memberIds와 동일 순서) */
  memberNames: string[];
};

/** 매칭 이력 단일 항목 */
export type PartnerMatchingRecord = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 매칭 쌍 목록 */
  pairs: PartnerPair[];
  /** 매칭 실행 일시 (ISO 8601) */
  matchedAt: string;
  /** 라벨 (예: "3월 4주차 연습") */
  label: string;
};

/** localStorage 저장 단위 */
export type PartnerMatchingData = {
  /** 최근 5회 이력 (최신순) */
  records: PartnerMatchingRecord[];
};

// ============================================
// Group Challenge
// ============================================

/** 챌린지 유형: 개인 / 팀 */
export type GroupChallengeType = "individual" | "team";

/** 챌린지 상태: 예정 / 진행 중 / 완료 */
export type GroupChallengeStatus = "upcoming" | "active" | "completed";

/** 그룹 챌린지 단일 항목 */
export type GroupChallengeItem = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 챌린지 제목 */
  title: string;
  /** 챌린지 설명 */
  description: string;
  /** 챌린지 유형 */
  type: GroupChallengeType;
  /** 기간 (일수, startDate ~ endDate 자동 계산) */
  duration: number;
  /** 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 종료일 (YYYY-MM-DD) */
  endDate: string;
  /** 목표 설명 */
  goal: string;
  /** 참가자 이름 목록 */
  participants: string[];
  /** 상태 (startDate/endDate 기준으로 자동 계산) */
  status: GroupChallengeStatus;
  /** 생성 일시 (ISO 8601) */
  createdAt: string;
};

/** localStorage 저장 단위 */
export type GroupChallengeData = {
  /** 챌린지 목록 (최대 20개) */
  challenges: GroupChallengeItem[];
};

// ============================================
// Member Interaction Score (멤버 상호작용 분석)
// ============================================

/** 점수 구성 요소 (각 항목 원점수) */
export type MemberInteractionBreakdown = {
  /** 게시글 수 (원점수) */
  postCount: number;
  /** 댓글 수 (원점수) */
  commentCount: number;
  /** 출석 횟수 (원점수) */
  attendanceCount: number;
  /** RSVP 횟수 (원점수) */
  rsvpCount: number;
  /** 게시글 가중 점수 (postCount * 15) */
  postScore: number;
  /** 댓글 가중 점수 (commentCount * 5) */
  commentScore: number;
  /** 출석 가중 점수 (attendanceCount * 10) */
  attendanceScore: number;
  /** RSVP 가중 점수 (rsvpCount * 3) */
  rsvpScore: number;
};

/** 멤버별 상호작용 점수 항목 */
export type MemberInteractionScoreItem = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalScore: number;
  rank: number;
  breakdown: MemberInteractionBreakdown;
};

/** 활동 수준 배지 */
export type InteractionActivityLevel = "active" | "normal" | "low";

/** useMemberInteractionScore 반환 타입 */
export type MemberInteractionScoreResult = {
  members: MemberInteractionScoreItem[];
  averageScore: number;
  activityLevel: InteractionActivityLevel;
  hasData: boolean;
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

// ============================================
// Learning Path v2 (개인 학습 경로)
// ============================================

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
// Attendance Comparison Detail (멤버 출석 비교 카드)
// ============================================

/** 멤버 출석 비교 카드의 개별 멤버 통계 */
export type AttendanceComparisonDetail = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalSchedules: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number; // 0~100
};

/** useAttendanceComparisonDetail 훅 반환 타입 */
export type AttendanceComparisonDetailResult = {
  members: AttendanceComparisonDetail[];
  hasData: boolean;
};

// ============================================
// Practice Weekly Digest (연습 일지 주간 요약)
// ============================================

export type PracticeWeeklyDigestStat = {
  /** 이번 주 값 */
  current: number;
  /** 전주 값 */
  previous: number;
  /** 변화율(%) - 양수: 증가, 음수: 감소, null: 비교 불가 */
  changeRate: number | null;
};

export type PracticeWeeklyDigest = {
  /** 이번 주 시작일 (YYYY-MM-DD, 월요일) */
  weekStart: string;
  /** 이번 주 종료일 (YYYY-MM-DD, 일요일) */
  weekEnd: string;
  /** 주간 연습 횟수 */
  practiceCount: PracticeWeeklyDigestStat;
  /** 총 연습 시간(분) */
  totalMinutes: PracticeWeeklyDigestStat;
  /** 평균 만족도(별점 1~5) */
  averageRating: PracticeWeeklyDigestStat;
  /** 연속 연습 일수 (오늘 기준) */
  streakDays: number;
  /** 가장 많이 연습한 카테고리/내용 키워드 */
  topCategory: string | null;
  /** 자동 생성 요약 텍스트 */
  summaryText: string;
  /** 이번 주 연습한 날짜 Set (YYYY-MM-DD) */
  practicedDates: string[];
  /** 데이터 존재 여부 */
  hasData: boolean;
};

// ============================================
// Personal Attendance Goal (개인 출석 목표, localStorage 기반)
// ============================================

/** localStorage에 저장되는 개인 월간 출석 횟수 목표 */
export type PersonalAttendanceGoal = {
  /** 목표 출석 횟수 (예: 8회) */
  targetCount: number;
  /** 해당 월 (YYYY-MM 형식) */
  month: string;
  /** 목표 저장 일시 (ISO 8601) */
  savedAt: string;
};

/** 개인 출석 목표 진행 데이터 */
export type PersonalAttendanceGoalData = {
  /** 저장된 목표 (없으면 null) */
  goal: PersonalAttendanceGoal | null;
  /** 이번 달 실제 출석 횟수 */
  actualCount: number;
  /** 이번 달 총 일정 수 */
  totalSchedules: number;
  /** 이미 지난 일정 수 */
  passedSchedules: number;
  /** 남은 일정 수 */
  remainingSchedules: number;
  /** 달성률 (0~100, 목표 기준) */
  achievementRate: number;
  /** 목표 달성 여부 */
  isAchieved: boolean;
  /** 목표 달성까지 남은 출석 횟수 (달성 시 0) */
  remainingCount: number;
  /** 이번 달 남은 일수 */
  remainingDays: number;
  /** 목표 달성을 위해 하루에 필요한 평균 출석 페이스 (남은 일수 기준, null이면 계산 불가) */
  dailyPaceNeeded: number | null;
};

// ============================================
// Schedule Supply Item (일정 준비물 목록, localStorage 기반)
// ============================================

/** 일정 준비물 단일 항목 */
export type ScheduleSupplyItem = {
  id: string;
  scheduleId: string;
  name: string;
  checked: boolean;
  /** 담당자명 (선택) */
  assignee?: string;
  createdAt: string;
};

/** localStorage에 저장되는 일정별 준비물 목록 (groupId 단위로 저장) */
export type ScheduleSupplyList = {
  groupId: string;
  items: ScheduleSupplyItem[];
  updatedAt: string;
};

// ============================================
// Member Activity Export (멤버 활동 내보내기)
// ============================================

/** 내보내기 기간 선택 옵션 */
export type MemberActivityExportPeriod = "all" | "last30" | "last90";

/** 내보내기 항목 선택 */
export type MemberActivityExportItems = {
  attendance: boolean;
  posts: boolean;
  comments: boolean;
};

/** 출석 기록 행 */
export type MemberAttendanceExportRow = {
  date: string;
  scheduleName: string;
  status: string;
};

/** 게시글 행 */
export type MemberPostExportRow = {
  date: string;
  title: string;
};

/** 댓글 행 */
export type MemberCommentExportRow = {
  date: string;
  postTitle: string;
};

/** 내보내기 전체 데이터 */
export type MemberActivityExportData = {
  attendance: MemberAttendanceExportRow[];
  posts: MemberPostExportRow[];
  comments: MemberCommentExportRow[];
};

// ============================================
// 일정 참여도 통계
// ============================================

/** RSVP 응답 상태별 인원 수 */
export type ScheduleEngagementRsvpCounts = {
  /** "going" 응답 수 */
  going: number;
  /** "maybe" 응답 수 */
  maybe: number;
  /** "not_going" 응답 수 */
  not_going: number;
  /** 미응답 수 (전체 멤버 - 응답자) */
  no_response: number;
  /** 전체 멤버 수 */
  total: number;
};

/** RSVP + 출석 종합 통계 결과 */
export type ScheduleEngagementResult = {
  /** RSVP 응답별 인원 */
  rsvp: ScheduleEngagementRsvpCounts;
  /** 실제 출석 인원 (status = "present") */
  actual_attended: number;
  /** going 응답 중 실제 출석 비율 (0~100, going이 0이면 null) */
  rsvp_accuracy: number | null;
  /** 전체 멤버 대비 실제 출석률 (0~100, total이 0이면 null) */
  attendance_rate: number | null;
};

// ============================================
// Group Health Snapshot (그룹 건강도 추이 - localStorage 기반)
// ============================================

/** 월별 그룹 건강도 스냅샷 단일 항목 */
export type GroupHealthSnapshot = {
  /** 연월 (YYYY-MM) */
  month: string;
  /** 출석률 (0~100) */
  attendanceRate: number;
  /** 전체 멤버 수 */
  memberCount: number;
  /** 이번 달 게시글 수 */
  postCount: number;
  /** 활동 멤버 비율 (0~100): 이번 달 활동한 멤버 / 전체 멤버 */
  activeRate: number;
};

/** useGroupHealthSnapshot 훅 반환 타입 */
export type GroupHealthSnapshotResult = {
  /** 최근 6개월 스냅샷 배열 (오래된 순) */
  snapshots: GroupHealthSnapshot[];
  /** 현재 달 스냅샷 (없으면 null) */
  current: GroupHealthSnapshot | null;
  /** 전월 스냅샷 (없으면 null) */
  previous: GroupHealthSnapshot | null;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// 개인 목표 관리 (Personal Goals)
// ============================================

/** 개인 목표 상태 */
export type PersonalGoalStatus = "active" | "completed" | "abandoned";

/** localStorage에 저장되는 개인 목표 항목 */
export type PersonalGoalItem = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 목표 제목 */
  title: string;
  /** 목표 설명 (선택) */
  description: string;
  /** 목표 날짜 (YYYY-MM-DD) */
  targetDate: string;
  /** 진행률 (0~100) */
  progress: number;
  /** 상태 */
  status: PersonalGoalStatus;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 완료일 (ISO 8601, completed 상태일 때만 존재) */
  completedAt?: string;
};

// ============================================
// 연락 선호도
// ============================================

export type CommPreferredTime = "morning" | "afternoon" | "evening" | "night";
export type CommChannel = "push" | "message" | "board";

export type CommunicationPreference = {
  userId: string;
  preferredTimes: CommPreferredTime[];
  preferredChannels: CommChannel[];
  quietHoursStart: string; // HH:MM
  quietHoursEnd: string;   // HH:MM
  updatedAt: string;
};

// ============================================
// 리더십 후보
// ============================================

export type LeadershipCandidate = {
  userId: string;
  displayName: string;
  attendanceScore: number;  // 0-100
  postScore: number;        // 0-100
  commentScore: number;     // 0-100
  totalScore: number;       // 0-100 (가중 평균)
};

// ============================================
// 멤버 가용 시간 캘린더
// ============================================

export type DayOfWeekKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** @deprecated DayOfWeekKey 를 사용하세요 */
export type DayOfWeek = DayOfWeekKey;

export type AvailabilitySlot = {
  day: DayOfWeekKey;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
};

export type MemberAvailability = {
  userId: string;
  slots: AvailabilitySlot[];
  updatedAt: string;
};

// ============================================
// Activity Retrospective (활동 회고 리포트)
// ============================================

export type ActivityRetrospective = {
  month: string;          // YYYY-MM
  attendanceRate: number; // 0-100
  totalSchedules: number;
  totalPosts: number;
  totalComments: number;
  memberGrowth: number;   // 신규 - 탈퇴 멤버
  totalIncome: number;
  totalExpense: number;
  generatedAt: string;
};

// ============================================
// Project Milestone Tracker (프로젝트 마일스톤 트래커, localStorage 기반)
// ============================================

/** 마일스톤 세부 작업 항목 */
export type MilestoneTask = {
  id: string;
  title: string;
  completed: boolean;
};

/** 프로젝트 마일스톤 카드 (groupId+projectId 기반 localStorage 저장) */
export type ProjectMilestoneCard = {
  id: string;
  title: string;
  description: string;
  dueDate: string;       // YYYY-MM-DD
  tasks: MilestoneTask[];
  createdAt: string;
};

// ============================================
// Finance Overview Dashboard (재정 개요 대시보드)
// ============================================

export type MonthlyFinanceSummary = {
  month: string;       // YYYY-MM
  income: number;
  expense: number;
  net: number;
};

export type CategoryExpense = {
  category: string;
  amount: number;
  percentage: number;  // 0-100
};

export type FinanceOverviewData = {
  monthlySummaries: MonthlyFinanceSummary[];
  categoryBreakdown: CategoryExpense[];
  totalIncome: number;
  totalExpense: number;
  period: string;
};

// ============================================
// Member Engagement Forecast (멤버 관여도 예측)
// ============================================

/** 멤버 관여도 수준 */
export type MemberEngagementLevel = "high" | "medium" | "low" | "risk";

/** 멤버 관여도 예측 데이터 */
export type MemberEngagementForecast = {
  userId: string;
  displayName: string;
  recentAttendanceRate: number;   // 최근 30일 출석률 (0-100)
  previousAttendanceRate: number; // 31-60일 전 출석률 (0-100)
  postCount: number;              // 최근 90일 게시글 수
  commentCount: number;           // 최근 90일 댓글 수
  engagementScore: number;        // 종합 관여도 점수 (0-100)
  level: MemberEngagementLevel;   // 관여도 수준
  trend: "improving" | "declining" | "stable"; // 추세
};

/** 멤버 관여도 예측 전체 결과 */
export type MemberEngagementForecastResult = {
  forecasts: MemberEngagementForecast[];
  totalCount: number;
  riskCount: number;     // 이탈 위험
  lowCount: number;      // 저관여
  mediumCount: number;   // 중관여
  highCount: number;     // 고관여
  generatedAt: string;
};

// ============================================
// 멤버 짝 추천 (데이터 기반 호환성 매칭)
// ============================================

/** 멤버 짝 추천 결과 (출석 패턴 기반 호환성 점수) */
export type MemberPairingSuggestion = {
  member1: { userId: string; displayName: string; attendanceRate: number };
  member2: { userId: string; displayName: string; attendanceRate: number };
  compatibilityScore: number;  // 0-100
  reason: string;              // 호환 이유
};

// ============================================
// Personal Growth Portfolio (개인 성장 포트폴리오)
// ============================================

/** 성장 이벤트 유형 */
export type GrowthEventType = "attendance_milestone" | "post" | "first_attendance" | "streak";

/** 성장 타임라인 단일 이벤트 */
export type GrowthTimelineEvent = {
  id: string;
  type: GrowthEventType;
  title: string;
  description: string;
  date: string;
  metadata?: Record<string, string | number>;
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
  autoSummary: string;     // 자동 생성된 요약
  customNote: string;      // 리더 커스텀 메모
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
  weekNumber: number;     // 1-6 (1이 공연 직전 주)
  label: string;          // "D-42 ~ D-36"
  goal: string;           // 주차별 목표
  checks: RehearsalCheckItem[];
};

export type RehearsalPlan = {
  id: string;
  performanceDate: string; // YYYY-MM-DD
  title: string;
  weeks: RehearsalWeek[];
  createdAt: string;
};

// ============================================
// Mood Check-in (기분 체크인)
// ============================================

export type MoodType = "great" | "good" | "okay" | "bad" | "terrible";

export type MoodEntry = {
  date: string;       // YYYY-MM-DD
  mood: MoodType;
  note?: string;      // 한줄 메모 (선택)
  createdAt: string;
};

// ============================================
// Choreography Notes (안무 노트)
// ============================================

export type ChoreographySection = {
  id: string;
  startTime: string;   // "0:00" 형식
  endTime: string;     // "1:30" 형식
  title: string;       // "인트로", "버스1" 등
  description: string; // 동작 설명
  formation: string;   // 대형 설명
  createdAt: string;
};

export type ChoreographyNote = {
  id: string;
  projectId: string;
  title: string;       // 곡명
  sections: ChoreographySection[];
  updatedAt: string;
};

// ============================================
// Personality Profile (멤버 성격/역할 프로필)
// ============================================

/** 댄스 역할 선호도 (성격 프로필 전용, DanceRole과 별개) */
export type PersonalityDanceRole =
  | "dancer"
  | "choreographer"
  | "director"
  | "support"
  | "performer";

/** 성격 특성 점수 (1-5점) */
export type PersonalityTrait = {
  trait: "리더십" | "창의성" | "체력" | "표현력" | "협동심";
  score: number; // 1-5
};

/** 멤버 성격/역할 프로필 (localStorage 저장) */
export type PersonalityProfile = {
  userId: string;
  preferredRoles: PersonalityDanceRole[];
  traits: PersonalityTrait[];
  bio: string; // 한줄 소개 (최대 100자)
  updatedAt: string;
};

// ============================================
// Practice Playlist Card (연습 플레이리스트 카드, localStorage 기반)
// ============================================

export type PracticeCardTrack = {
  id: string;
  title: string;       // 곡명
  artist: string;      // 아티스트
  bpm: number | null;  // BPM (선택)
  duration: string;    // "3:45" 형식
  genre: string;       // 장르
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
  dayIndex: number;     // 0=월 ~ 6=일
  hourSlot: number;     // 0-23 (실제로는 6-22 범위, 2시간 단위 슬롯)
  attendanceCount: number;
  scheduleCount: number;
  avgAttendanceRate: number;
};

export type ActivityHeatmapData = {
  cells: HeatmapCell[];
  bestSlots: { dayIndex: number; hourSlot: number; rate: number }[];
};

// ============================================
// Expense Splitter (경비 분할 계산기)
// ============================================

export type ExpenseSplitItem = {
  id: string;
  description: string;
  amount: number;
  paidBy: string;        // 지불자 이름
  splitAmong: string[];  // 분할 대상 이름 배열
  createdAt: string;
};

export type ExpenseSplitSession = {
  id: string;
  title: string;         // "2월 공연 경비" 등
  items: ExpenseSplitItem[];
  createdAt: string;
};

// ============================================
// Warmup Routine (워밍업 루틴)
// ============================================

// WarmupExerciseType, WarmupExercise, WarmupRoutine 타입은 파일 하단(PracticePlaylistData 섹션 뒤)에 정의됨

// ============================================
// Attendance Streak (출석 스트릭 트래커)
// ============================================

export type AttendanceStreakData = {
  currentStreak: number;
  longestStreak: number;
  totalPresent: number;
  streakDates: string[];     // 현재 스트릭에 포함된 날짜들 (ISO)
  monthlyGrid: { date: string; present: boolean }[];  // 최근 90일 그리드
};

// ============================================
// Session Timer (연습 세션 타이머)
// ============================================

export type SessionTimerSegment = {
  id: string;
  label: string;         // "워밍업", "기본기" 등
  durationMinutes: number;
  color: string;         // 구간 색상 (hex)
};

export type SessionTimerPreset = {
  id: string;
  title: string;         // "2시간 기본 연습" 등
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
  message: string;       // 최대 100자
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
  openDate: string; // YYYY-MM-DD (개봉일)
  messages: TimeCapsuleMessage[];
  isSealed: boolean; // 봉인 여부
  isOpened: boolean; // 개봉 여부
  createdAt: string;
};

// ============================================
// Project Role Assignment Board (프로젝트 역할 배정 보드)
// ============================================

export type ProjectRoleAssignment = {
  id: string;
  roleName: string;        // "메인 안무", "음향 담당" 등
  assignees: string[];     // 담당자 이름 배열
  status: "open" | "filled" | "completed";
  color: string;           // 카드 색상 (hex)
  note: string;
  createdAt: string;
};

// ============================================
// Countdown Event (이벤트 카운트다운)
// ============================================

export type CountdownEvent = {
  id: string;
  title: string;
  eventDate: string;      // YYYY-MM-DD
  eventTime?: string;     // HH:MM (선택)
  emoji: string;          // "🎭", "🏆" 등
  createdAt: string;
};

// ============================================
// Shared Memo (그룹 공유 메모)
// ============================================

export type SharedMemoColor = "yellow" | "blue" | "green" | "pink" | "purple";

export type SharedMemo = {
  id: string;
  content: string;       // 최대 200자
  author: string;
  color: SharedMemoColor;
  pinned: boolean;
  expiresAt?: string;    // YYYY-MM-DD (선택, 만료일)
  createdAt: string;
};

// ============================================
// Formation Editor (포메이션 에디터)
// ============================================

export type FormationPosition = {
  memberId: string;
  memberName: string;
  x: number;    // 0-100 (%)
  y: number;    // 0-100 (%)
  color: string;
};

export type FormationScene = {
  id: string;
  label: string;         // "인트로", "1절" 등
  positions: FormationPosition[];
  createdAt: string;
};

export type FormationProject = {
  scenes: FormationScene[];
  updatedAt: string;
};

// ============================================
// Member Intro Card v2 (자기소개 카드, localStorage 기반)
// ============================================

export type MemberIntroCardV2 = {
  userId: string;
  nickname: string;
  danceExperience: string;   // "3년", "초보" 등
  favoriteGenres: string[];  // ["힙합", "팝핀"] 최대 3개
  motto: string;             // 한마디 (최대 50자)
  joinReason: string;        // 가입 이유 (최대 100자)
  updatedAt: string;
};

// ============================================
// Video Library (연습 영상 라이브러리)
// ============================================

export type VideoCategory = "reference" | "tutorial" | "practice" | "performance" | "other";

export type VideoLibraryItem = {
  id: string;
  title: string;
  url: string;            // YouTube, 기타 링크
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
  score: number; // 1-5
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
  scores: Record<CollabDimension, number>; // 1-5
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
  date: string;           // YYYY-MM-DD
  intensity: IntensityLevel;
  durationMinutes: number;
  bodyParts: string[];    // "다리", "팔", "코어" 등
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
  healthScore: number; // 0-100
};

// ============================================
// Dance Style Compatibility (댄스 스타일 호환성)
// ============================================

export type DanceStyleDimension = "rhythm" | "flexibility" | "power" | "groove" | "precision";

export type DanceStyleProfile = {
  userId: string;
  userName: string;
  scores: Record<DanceStyleDimension, number>; // 각 1-5
  preferredStyle: string;   // "힙합", "팝핀" 등
  updatedAt: string;
};

export type StyleCompatibilityResult = {
  partnerId: string;
  partnerName: string;
  compatibilityScore: number; // 0-100
  complementaryAreas: DanceStyleDimension[];  // 서로 보완하는 영역
  similarAreas: DanceStyleDimension[];        // 유사한 영역
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
  genre: string;           // "힙합", "팝핀", "왁킹" 등
  level: DanceCertLevel;
  certifiedBy: string;     // 인증자 이름
  certifiedAt: string;
  note: string;
  expiresAt?: string;      // 유효기간 (선택, YYYY-MM-DD)
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
// Equipment Inventory (장비 인벤토리 관리)
// ============================================

export type EquipmentCondition = "excellent" | "good" | "fair" | "poor" | "broken";

export type EquipmentItem = {
  id: string;
  name: string;
  category: string;       // "음향", "조명", "무대", "연습용품", "기타"
  quantity: number;
  condition: EquipmentCondition;
  location: string;       // 보관 장소
  lastCheckedAt: string;
  note: string;
  createdAt: string;
};

export type EquipmentCheckout = {
  id: string;
  equipmentId: string;
  borrowerName: string;
  borrowedAt: string;
  expectedReturn: string; // YYYY-MM-DD
  returnedAt?: string;
  note: string;
};


// ============================================
// Costume Management (코스튬/의상 관리)
// ============================================

export type CostumeStatus = "planned" | "ordered" | "arrived" | "distributed" | "returned";

export type CostumeItem = {
  id: string;
  name: string;          // "검은 탑", "빨간 스커트" 등
  category: string;      // "상의", "하의", "신발", "악세서리"
  color: string;         // 색상명
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
  size: string;          // "S", "M", "L" 등
  returned: boolean;
};

export type CostumeStore = {
  items: CostumeItem[];
  assignments: CostumeAssignment[];
  updatedAt: string;
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
  message: string;        // 최대 200자
  category: ThankYouCategory;
  isPublic: boolean;      // 그룹 내 공개 여부
  emoji: string;          // "💖", "🌟", "🙏" 등
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
// Performance Revenue Split (공연 수익 분배)
// ============================================

export type RevenueSplitMethod = "equal" | "weighted";

export type RevenueEntry = {
  id: string;
  eventName: string;
  eventDate: string;        // YYYY-MM-DD
  totalAmount: number;
  splitMethod: RevenueSplitMethod;
  participants: RevenueParticipant[];
  deductions: number;       // 공제액 (교통비, 장비대여 등)
  note: string;
  settled: boolean;
  createdAt: string;
};

export type RevenueParticipant = {
  memberId: string;
  memberName: string;
  weight: number;           // equal일 때 1, weighted일 때 가중치
  amount: number;           // 계산된 분배 금액
  paid: boolean;            // 지급 완료 여부
};

// ============================================
// Choreography Version Control (안무 버전 관리)
// ============================================

export type ChoreoVersionStatus = "draft" | "review" | "approved" | "archived";

export type ChoreoVersion = {
  id: string;
  versionNumber: number;   // 1, 2, 3...
  label: string;           // "초안", "수정본", "최종본" 등
  status: ChoreoVersionStatus;
  description: string;     // 이 버전의 주요 변경사항
  sections: ChoreoSectionNote[];
  createdBy: string;
  createdAt: string;
};

export type ChoreoSectionNote = {
  sectionName: string;     // "인트로", "1절", "브릿지" 등
  content: string;         // 해당 구간 설명/노트
  changed: boolean;        // 이전 버전에서 변경됨 표시
};

export type ChoreoVersionStore = {
  songTitle: string;
  versions: ChoreoVersion[];
  currentVersionId: string | null;
  updatedAt: string;
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

// ============================================
// Venue Review (연습 장소 리뷰)
// ============================================

export type VenueFeature = "mirror" | "sound" | "parking" | "aircon" | "floor" | "shower" | "wifi" | "storage";

export type VenueEntry = {
  id: string;
  name: string;
  address: string;
  hourlyRate: number;      // 시간당 대여비
  features: VenueFeature[];
  note: string;
  createdAt: string;
};

export type VenueReview = {
  id: string;
  venueId: string;
  reviewerName: string;
  rating: number;          // 1-5
  pros: string;            // 장점
  cons: string;            // 단점
  createdAt: string;
};

// ============================================
// Choreography Mastery Curve (안무 습득 곡선)
// ============================================

export type MasteryCheckpoint = {
  date: string;           // YYYY-MM-DD
  progress: number;       // 0-100
  note: string;
};

export type MasteryCurveEntry = {
  id: string;
  choreographyName: string;
  targetDate: string;     // 목표 완성일
  checkpoints: MasteryCheckpoint[];
  currentProgress: number;
  createdAt: string;
};

// ============================================
// Performance Readiness Checklist (공연 준비도)
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
  startTime: string;       // "HH:MM"
  endTime: string;         // "HH:MM"
  type: TimetableSlotType;
  title: string;
  location: string;
  color: string;           // hex 색상
  note: string;
};

// ============================================
// Budget Scenario Planner (예산 시나리오)
// ============================================

export type BudgetScenario = {
  id: string;
  name: string;
  monthlyFee: number;        // 월 회비
  memberCount: number;        // 예상 멤버 수
  venueRentPerMonth: number;  // 월 장소 대여비
  performanceCount: number;   // 월 공연 횟수
  avgPerformanceIncome: number; // 공연 당 평균 수입
  otherExpenses: number;      // 기타 월 지출
  otherIncome: number;        // 기타 월 수입
  createdAt: string;
};

export type ScenarioResult = {
  scenarioId: string;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyProfit: number;
  annualProfit: number;
};

// ============================================
// Setlist Management (세트리스트 관리, localStorage 기반)
// ============================================

export type SetlistItemType = "performance" | "mc" | "break" | "costume_change";

export type PerformanceSetlistItem = {
  id: string;
  order: number;
  type: SetlistItemType;
  title: string;            // 곡명 또는 항목명
  durationSeconds: number;  // 예상 시간 (초)
  costumeChange: boolean;
  performers: string[];     // 참여 멤버명
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
  definition: string;      // 최대 500자
  category: GlossaryCategory;
  difficulty: "beginner" | "intermediate" | "advanced";
  example: string;          // 사용 예시
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
  scores: Record<EnergyDimension, number>; // 0-100
  note: string;
  createdAt: string;
};

// ============================================
// Reward Points (보상 포인트)
// ============================================

export type PointActionType = "attendance" | "post" | "comment" | "kudos" | "streak" | "manual";

export type ActivityPointTransaction = {
  id: string;
  memberId: string;
  memberName: string;
  actionType: PointActionType;
  points: number;
  description: string;
  createdAt: string;
};

export type MemberPointSummary = {
  memberId: string;
  memberName: string;
  totalPoints: number;
  rank: number;
};

export const ACTIVITY_POINT_DEFAULTS: Record<PointActionType, number> = {
  attendance: 10,
  post: 5,
  comment: 2,
  kudos: 3,
  streak: 20,
  manual: 0,
};

export const ACTIVITY_POINT_LABELS: Record<PointActionType, string> = {
  attendance: "출석",
  post: "게시글 작성",
  comment: "댓글",
  kudos: "칭찬 받기",
  streak: "연속 출석",
  manual: "직접 입력",
};

// ============================================
// Practice Goal Board (연습 목표 보드)
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

export type MentoringFeedback = {
  id: string;
  date: string;
  content: string;
  rating: number;        // 1-5 (만족도)
  writtenBy: "mentor" | "mentee";
};

// ============================================
// Choreography Style Vote (안무 스타일 투표)
// ============================================

export type StyleVoteStatus = "open" | "closed";

export type StyleVoteCandidate = {
  id: string;
  title: string;       // 곡명 또는 스타일명
  description: string;
  proposedBy: string;
  votes: string[];     // 투표한 멤버명 배열
};

export type StyleVoteSession = {
  id: string;
  topic: string;        // "다음 안무 선택", "공연 곡 투표" 등
  status: StyleVoteStatus;
  candidates: StyleVoteCandidate[];
  maxVotesPerPerson: number;  // 1인 최대 투표 수
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
  tier: number;            // 1(기본)~5(최상급)
  prerequisiteIds: string[];  // 선행 스킬 ID
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
  category: string;       // "안무", "연습", "운영", "기타"
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
  rehearsalNumber: number;   // 1차, 2차...
  songsRehearsed: string[];  // 연습한 곡 목록
  completionRate: number;    // 0-100 전체 완성도
  issues: RehearsalIssue[];
  nextGoals: string[];       // 다음 목표
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
  participant1: string;   // 이름 또는 팀명
  participant2: string;
  winner: string | null;  // null이면 무승부
  score1?: number;
  score2?: number;
  style: string;          // "프리스타일", "힙합" 등
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
  imageUrl: string;        // 외부 링크 또는 빈 문자열
  description: string;
  tags: string[];
  takenAt: string;         // YYYY-MM-DD
  uploadedBy: string;
  createdAt: string;
};

export type PhotoAlbum = {
  id: string;
  name: string;            // "2024년 정기공연", "연습 스냅" 등
  coverUrl: string;
  photos: PhotoAlbumItem[];
  createdAt: string;
};

// ============================================
// Fundraising Goal (기금 모금 추적)
// ============================================

export type FundraisingContribution = {
  id: string;
  donorName: string;
  amount: number;
  date: string;
  note: string;
};

export type FundraisingMilestone = {
  percent: number; // 25, 50, 75, 100
  reachedAt?: string;
};

export type FundraisingGoal = {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  contributions: FundraisingContribution[];
  milestones: FundraisingMilestone[];
  status: "active" | "completed" | "cancelled";
  createdAt: string;
};

// ============================================
// Group Activity Report (그룹 활동 리포트)
// ============================================

export type GroupReportPeriod = "monthly" | "quarterly";

export type GroupReportSection = {
  label: string;
  value: number;
  unit: string;
  change?: number; // 전기 대비 변화율 (%)
};

export type GroupActivityReport = {
  id: string;
  period: GroupReportPeriod;
  periodLabel: string; // "2026년 2월" 등
  sections: GroupReportSection[];
  highlights: string[]; // 주요 성과
  concerns: string[]; // 개선 필요 사항
  createdAt: string;
};

// ============================================
// Dance Challenge (댄스 챌린지)
// ============================================

export type ChallengeCategory = "technique" | "freestyle" | "cover" | "flexibility" | "endurance" | "creativity";

export type ChallengeParticipant = {
  id: string;
  name: string;
  progress: number; // 0-100
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
  targetCount: number; // 목표 횟수
  participants: ChallengeParticipant[];
  reward: string; // 보상 설명
  status: "upcoming" | "active" | "ended";
  createdAt: string;
};

// ============================================
// Attendance Forecast (출석 예측)
// ============================================

export type AttendancePattern = {
  dayOfWeek: DayOfWeek;
  avgRate: number; // 0-100
  totalSessions: number;
};

export type AttendanceMemberForecast = {
  memberId: string;
  memberName: string;
  overallRate: number; // 전체 출석률
  trend: "improving" | "stable" | "declining";
  patterns: AttendancePattern[];
  predictedNextRate: number; // 다음 일정 예상 출석률
};

export type AttendanceForecastData = {
  groupId: string;
  forecasts: AttendanceMemberForecast[];
  bestDay: DayOfWeek;
  worstDay: DayOfWeek;
  groupTrend: "improving" | "stable" | "declining";
  updatedAt: string;
};

// ============================================
// Performance Retrospective (공연 회고)
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
  overallRating: number; // 1-5
  items: RetroItem[];
  actionItems: string[];
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
  score: number; // 1-5
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
  scores: Record<CultureDimension, number>; // 각 1-10
  updatedAt: string;
};

export type GroupCultureConfig = {
  idealScores: Record<CultureDimension, number>; // 그룹 이상적 가치
  profiles: CultureProfile[];
  createdAt: string;
};

// ============================================
// Growth Trajectory (성장 궤적)
// ============================================

export type GrowthDimension = "skill" | "attendance" | "leadership" | "creativity" | "collaboration";

export type GrowthDataPoint = {
  month: string; // YYYY-MM
  scores: Record<GrowthDimension, number>; // 각 0-100
};

export type GrowthTrajectory = {
  id: string;
  memberName: string;
  dataPoints: GrowthDataPoint[];
  goal: number; // 목표 종합 점수
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
  startTime: string; // "MM:SS" 형태
  duration: string; // "MM:SS" 형태
  action: CueAction;
  note: string;
  volume: number; // 0-100
};

export type MusicCuesheet = {
  id: string;
  title: string; // "정기공연 큐시트" 등
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
  name: string; // "리더", "음향 담당" 등
  icon: string; // 이모지
  description: string;
};

export type RotationAssignment = {
  id: string;
  roleId: string;
  memberName: string;
  weekStart: string; // YYYY-MM-DD (해당 주 월요일)
  completed: boolean;
};

export type RoleRotationConfig = {
  roles: RotationRole[];
  members: string[];
  assignments: RotationAssignment[];
  rotationWeeks: number; // 몇 주마다 교체
  createdAt: string;
};

// ============================================
// Ticket Management (공연 티켓 관리)
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
  time: string; // "MM:SS" 형태
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
  date: string; // YYYY-MM-DD
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
  eventTitle: string; // 관련 공연/연습명
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
  callTime: string; // HH:MM
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
  satisfaction: number; // 1-5
  efficiency: number; // 1-5
  difficulty: number; // 1-5
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
  points: number; // 1-10
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

// 하위 호환 유지 (기존 컴포넌트에서 참조 가능)
export type SharedPracticeNote = PracticeNoteEntry;

// ============================================
// Attendance Heatmap (출석 히트맵)
// ============================================

export type HeatmapDayData = {
  date: string; // YYYY-MM-DD
  count: number; // 해당일 활동 횟수 (0-4+)
  activities: string[]; // "연습", "공연" 등
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
  duration: string; // MM:SS
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
  strength: number; // 1-10
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
  result?: PollVoteChoice; // 최다 득표
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
  totalFocusTime: number; // 분 단위
  note: string;
  createdAt: string;
};

export type FocusTimerConfig = {
  focusDuration: number; // 기본 25분
  shortBreak: number; // 기본 5분
  longBreak: number; // 기본 15분
  cyclesBeforeLongBreak: number; // 기본 4
};

// ============================================
// Event Calendar (이벤트 캘린더)
// ============================================

export type CalendarEventType = "practice" | "performance" | "meeting" | "workshop" | "social" | "other";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  endTime: string; // HH:MM
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
  row: string; // A, B, C...
  number: number; // 1, 2, 3...
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

export type SkillMatrixLevel = 0 | 1 | 2 | 3 | 4 | 5; // 0=미평가, 1=초급~5=마스터

export type SkillMatrixEntry = {
  memberName: string;
  skills: Record<string, SkillMatrixLevel>;
};

export type SkillMatrixConfig = {
  skillNames: string[]; // "팝핑", "락킹", "힙합" 등 커스텀 스킬
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
  options: string[]; // 4개 선택지
  correctIndex: number; // 0-3
  aboutMember: string; // 이 질문의 주인공
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

// ================================================================
// 의상 대여 관리
// ================================================================

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

// ================================================================
// 멤버 호환도 매칭
// ================================================================

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

// ================================================================
// 멤버 휴가 관리
// ================================================================

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

// ================================================================
// 장르 탐색기
// ================================================================

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

// ================================================================
// 복귀 온보딩
// ================================================================

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

// ================================================================
// 멤버 목표 설정
// ================================================================

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
  progress: number; // 0~100
  milestones: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  status: "active" | "completed" | "abandoned";
  createdAt: string;
};

// ─── 그룹 공지 보드 ───────────────────────────────────────────
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
// 무대 조명 큐시트
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
  timestamp: string; // "MM:SS" 형식
  action: LightingCueAction;
  color?: LightingCueColor;
  intensity: number; // 0~100
  zone: string; // 예: "무대 전체" | "센터" | "좌측" | "우측"
  notes?: string;
  createdAt: string;
};

// ================================================================
// 연습 출결 예외
// ================================================================

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
  duration?: number; // 분 단위 (지각/조퇴의 경우)
  approvedBy?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};


// ============================================
// 공연 리뷰 수집
// ============================================

export type ShowReviewSource = "audience" | "member" | "judge" | "instructor";

export type ShowReviewEntry = {
  id: string;
  reviewerName: string;
  source: ShowReviewSource;
  rating: number; // 1~5
  choreographyRating: number; // 1~5
  stagePresenceRating: number; // 1~5
  teamworkRating: number; // 1~5
  comment: string;
  highlights: string[];
  improvements: string[];
  createdAt: string;
};

// ============================================
// 동선 노트 (Formation Note, localStorage 기반)
// ============================================

export type FormationNotePosition = {
  memberName: string;
  x: number; // 0~100 (%)
  y: number; // 0~100 (%)
};

export type FormationSnapshot = {
  id: string;
  name: string;       // 예: "인트로 대형"
  timestamp: string;  // MM:SS 형식
  positions: FormationNotePosition[];
  notes?: string;
  createdAt: string;
};

export type FormationNoteData = {
  snapshots: FormationSnapshot[];
};

// ============================================
// 멤버 뱃지 시스템 (Member Badge System, localStorage 기반)
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
// 비용 영수증 관리 (Receipt Management, localStorage 기반)
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
  date: string; // YYYY-MM-DD
  submittedBy: string;
  status: ReceiptStatus;
  approvedBy?: string;
  receiptNumber?: string;
  vendor?: string;
  notes?: string;
  createdAt: string;
};

// ============================================
// 그룹 투표 (Group Vote, localStorage 기반)
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
// 연습곡 플레이리스트 카드 (localStorage 기반)
// ============================================

export type PracticeTrack = {
  id: string;
  title: string;
  artist: string;
  duration: number; // 초 단위
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
// 워밍업 루틴
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
  duration: number; // 초
  repetitions?: number;
  description?: string;
  bodyPart: string;
  order: number;
};

export type WarmupRoutine = {
  id: string;
  name: string;
  exercises: WarmupExercise[];
  totalDuration: number; // 초, 자동계산
  createdBy: string;
  createdAt: string;
};

// ============================================================
// 멤버 출석 보상
// ============================================================

export type AttendanceRewardTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";

export type AttendanceRewardRule = {
  id: string;
  tier: AttendanceRewardTier;
  requiredAttendance: number; // 필요 출석률 (%)
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
  attendanceRate: number; // 출석률 (%)
  points: number;
};

// ============================================
// 안무 구간 분석
// ============================================

export type ChoreoSectionDifficulty = 1 | 2 | 3 | 4 | 5;

export type ChoreoSectionEntry = {
  id: string;
  name: string;
  startTime: string; // MM:SS
  endTime: string;   // MM:SS
  difficulty: ChoreoSectionDifficulty;
  completionRate: number; // 0~100
  keyMoves: string[];
  assignedMembers: string[];
  notes?: string;
  order: number;
  createdAt: string;
};

// ============================================
// 그룹 일정 충돌 감지
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
  date: string; // YYYY-MM-DD (반복 일정일 경우 최초 날짜)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  recurring: boolean;
  recurringDay?: number; // 0=일요일 ~ 6=토요일
  createdAt: string;
};

export type ScheduleConflictResult = {
  memberName: string;
  personalSchedule: PersonalScheduleEntry;
  conflictDate: string; // YYYY-MM-DD
  overlapMinutes: number;
};

// ============================================
// 공연 백스테이지 체크
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
// 공연 물품 목록
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
// 멤버 긴급 연락처
// ============================================

/** 혈액형 */
export type EmergencyContactBloodType =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-"
  | "unknown"; // 모름

export type EmergencyContactRelation =
  | "parent"   // 부모
  | "spouse"   // 배우자
  | "sibling"  // 형제/자매
  | "friend"   // 친구
  | "guardian" // 보호자
  | "other";   // 기타

/** 긴급 연락처 인물 (멤버의 비상 연락 대상) */
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
  memberName: string;                        // 멤버 이름
  memberPhone?: string;                      // 멤버 본인 연락처
  contactName: string;                       // 긴급 연락처 이름 (대표 1명, 호환성 유지)
  relation: EmergencyContactRelation;        // 대표 연락처 관계
  phone: string;                             // 대표 연락처 전화번호
  email?: string;                            // 이메일
  notes?: string;                            // 일반 메모
  bloodType: EmergencyContactBloodType;      // 혈액형
  allergies?: string;                        // 알레르기/질환 정보
  medicalNotes?: string;                     // 의료 특이사항
  insuranceInfo?: string;                    // 보험 정보
  extraContacts?: EmergencyContactPerson[];  // 추가 긴급 연락처 목록
  createdAt: string;                         // 생성일 (ISO datetime)
  updatedAt?: string;                        // 수정일 (ISO datetime)
};

// ============================================
// 연습 피드백
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
// 그룹 규칙 관리
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
// 멤버 스케줄 선호도
// ============================================

/** 0=일요일, 1=월요일, ... 6=토요일 */
export type WeekDayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 시간대별 선호도 상태 */
export type TimeSlotPreference = "available" | "preferred" | "unavailable";

/** 특정 시간대의 선호도 항목 */
export type TimeSlotEntry = {
  day: WeekDayIndex;
  startHour: number; // 0~23
  endHour: number;   // 0~23
  preference: TimeSlotPreference;
};

/** 멤버 한 명의 스케줄 선호도 */
export type MemberSchedulePreference = {
  id: string;
  memberName: string;
  preferences: TimeSlotEntry[];
  updatedAt: string;
  createdAt: string;
};

/** 최적 슬롯 분석 결과 */
export type OptimalSlotResult = {
  day: WeekDayIndex;
  startHour: number;
  endHour: number;
  availableCount: number;
  preferredCount: number;
  score: number;
};

// ============================================
// 멤버 성장 일지
// ============================================

/** 성장 일지 무드 */
export type GrowthJournalMood =
  | "motivated"
  | "confident"
  | "neutral"
  | "struggling"
  | "discouraged";

/** 성장 일지 항목 */
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
  selfRating: number; // 1~5
  createdAt: string;
};

// ============================================
// Dance Glossary Entry (댄스 용어 사전 - SWR+localStorage)
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
// 연습 장소 리뷰 (VenueReviewEntry)
// ============================================

/** 연습 장소 리뷰 항목 */
export type VenueReviewEntry = {
  id: string;
  venueName: string;
  address?: string;
  rating: number;           // 1~5 종합 별점
  floorRating: number;      // 1~5 바닥 평점
  mirrorRating: number;     // 1~5 거울 평점
  soundRating: number;      // 1~5 음향 평점
  accessRating: number;     // 1~5 접근성 평점
  pricePerHour?: number;    // 시간당 가격 (원)
  capacity?: number;        // 수용 인원
  pros: string[];           // 장점 목록
  cons: string[];           // 단점 목록
  comment?: string;         // 추가 코멘트
  reviewedBy: string;       // 작성자
  visitDate: string;        // 방문일 (YYYY-MM-DD)
  createdAt: string;
};

// ============================================================
// 공연 세트리스트
// ============================================================

/** 세트리스트 항목 유형 */
export type SetListItemType =
  | "performance"
  | "mc_talk"
  | "intermission"
  | "opening"
  | "closing"
  | "encore";

/** 세트리스트 항목 */
export type SetListItem = {
  id: string;
  order: number;
  type: SetListItemType;
  title: string;
  artist?: string;
  /** 재생/수행 시간 (초) */
  duration: number;
  performers: string[];
  notes?: string;
  transitionNote?: string;
  createdAt: string;
};

// ============================================================
// 그룹 회의록
// ============================================================

/** 회의 유형 */
export type MeetingMinutesType =
  | "regular"
  | "emergency"
  | "planning"
  | "review"
  | "other";

/** 안건 실행과제 */
export type MeetingActionItem = {
  assignee: string;
  task: string;
  deadline?: string;
};

/** 안건 항목 */
export type MeetingAgendaItem = {
  id: string;
  title: string;
  discussion: string;
  decision?: string;
  actionItems: MeetingActionItem[];
};

/** 회의록 항목 */
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

// ============================================================
// 멤버 기술 인증 (Skill Certification)
// ============================================================

/** 기술 인증 레벨 */
export type SkillCertLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert"
  | "master";

/** 기술 인증 정의 */
export type SkillCertDefinition = {
  id: string;
  skillName: string;
  description: string;
  category: string;
  level: SkillCertLevel;
  requirements: string[];
  createdAt: string;
};

/** 기술 인증 수여 기록 */
export type SkillCertAward = {
  id: string;
  certId: string;
  memberName: string;
  certifiedBy: string;
  certifiedAt: string;
  notes?: string;
};

/** 멤버 역할 유형 */
export type MemberRoleType =
  | "leader"
  | "sub_leader"
  | "treasurer"
  | "secretary"
  | "choreographer"
  | "trainer"
  | "member"
  | "other";

/** 멤버 역할 히스토리 항목 */
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
// 감사 메시지 보드
// ============================================

/** 감사 메시지 항목 */
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
// 연습 체크인
// ============================================

/** 연습 체크인 상태 */
export type PracticeCheckinStatus = "checked_in" | "checked_out" | "absent";

/** 연습 체크인 세션 */
export type PracticeCheckinSession = {
  id: string;
  date: string;
  title: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  createdAt: string;
};

/** 연습 체크인 기록 */
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

// ============================================================
// 공연 리허설 스케줄
// ============================================================

/** 리허설 유형 */
export type RehearsalType =
  | "full_run"
  | "tech_rehearsal"
  | "dress_rehearsal"
  | "section"
  | "blocking"
  | "other";

/** 리허설 스케줄 항목 */
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

// ─── 댄스 배틀 토너먼트 ───────────────────────────────────────

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

// ============================================================
// 멤버 체력 테스트
// ============================================================

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

// ─── 공연 프로그램 북 ──────────────────────────────────────────

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

// ─── 그룹 통합 캘린더 ───────────────────────────────────────────

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
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location?: string;
  description?: string;
  participants: string[];
  isAllDay: boolean;
  color?: string;
  reminder?: boolean;
  createdBy: string;
  createdAt: string;
};

// ============================================================
// 의상 디자인 보드
// ============================================================

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

// ============================================================
// 부상 추적 (Injury Tracker)
// ============================================================

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

// ============================================================
// 그룹 미션 보드 (Mission Board)
// ============================================================

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


// ============================================================
// 공연 사진 갤러리
// ============================================================

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

// ============================================================
// 연습 타이머 기록 (Practice Timer Log)
// ============================================================

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
  intensity: number; // 1~5
  createdAt: string;
};

// ============================================================
// 그룹 예산 플래너
// ============================================================

export type BudgetPlannerCategory =
  | "costume"
  | "venue"
  | "equipment"
  | "food"
  | "transportation"
  | "promotion"
  | "education"
  | "other";

export type BudgetPlannerItem = {
  id: string;
  category: BudgetPlannerCategory;
  label: string;
  plannedAmount: number;
  actualAmount: number;
  note?: string;
  period: string; // YYYY-MM
};

export type BudgetPlannerPlan = {
  id: string;
  title: string;
  year: number;
  items: BudgetPlannerItem[];
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// 공연 관객 피드백
// ============================================================

export type AudienceFeedbackRating = {
  choreography: number; // 안무 (1-5)
  music: number; // 음악 (1-5)
  costumes: number; // 의상 (1-5)
  stagePresence: number; // 무대 존재감 (1-5)
  overall: number; // 전체 만족도 (1-5)
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

// ============================================================
// 멤버 댄스 다이어리
// ============================================================

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
  date: string; // YYYY-MM-DD
  mood: DanceDiaryMood;
  condition: DanceDiaryCondition;
  practiceHours: number;
  achievements: string[];
  struggles: string[];
  notes: string;
  songsPracticed: string[];
  rating: number; // 1~5
  createdAt: string;
};

// ============================================================
// 그룹 멘토링 매칭
// ============================================================

export type MentoringMatchStatus = "active" | "completed" | "paused";

export type MentoringSessionRecord = {
  id: string;
  date: string;
  topic: string;
  durationMinutes: number;
  notes?: string;
  menteeRating?: number; // 1-5
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

// ============================================================
// 공연 무대 메모
// ============================================================

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

// ============================================================
// 멤버 식단 관리 (DietTracker)
// ============================================================

export type DietMealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "supplement";

export type DietTrackerMeal = {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: DietMealType;
  foods: string[];
  calories?: number;
  protein?: number;
  notes?: string;
  time?: string; // HH:MM
};

export type DietTrackerWater = {
  date: string; // YYYY-MM-DD
  cups: number; // 1잔 = 250ml
};

export type DietTrackerDayLog = {
  date: string;
  meals: DietTrackerMeal[];
  water: DietTrackerWater;
  memberName: string;
};

// ============================================================
// 그룹 음악 저작권 관리
// ============================================================

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

// ============================================================
// 공연 스폰서 후원 추적 (SponsorTracking)
// ============================================================

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

// ============================================================
// 그룹 소셜 미디어 캘린더 (SocialCalendar)
// ============================================================

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
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:MM
  status: SocialPostStatus;
  assignee?: string;
  hashtags: string[];
  mediaType?: "photo" | "video" | "reel" | "story" | "text";
  notes?: string;
  createdAt: string;
};

// ============================================================
// 공연 드레스 코드 (DressCode)
// ============================================================

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

export type SleepTrackerQuality =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "terrible";

export type SleepTrackerEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // HH:MM
  wakeTime: string; // HH:MM
  durationHours: number;
  quality: SleepTrackerQuality;
  notes?: string;
  hadNap: boolean;
  napMinutes?: number;
  createdAt: string;
};

// 그룹 장비 대여 관리
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

// 공연 티켓 관리
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

// 공연 메이크업 시트
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

// 그룹 연습 도전 과제
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

// ─── 스트레칭 루틴 ────────────────────────────────────────────

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

// ─── 그룹 연습 평가표 ─────────────────────────────────────────

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

// ─── 그룹 이벤트 RSVP ────────────────────────────────────────

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

// ─── 공연 포스터 관리 ─────────────────────────────────────

export type PosterVersionStatus =
  | "draft"
  | "review"
  | "approved"
  | "rejected"
  | "final";

export type PosterVote = {
  memberName: string;
  rating: number; // 1-5
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

// ─── 공연 음향 큐시트 ─────────────────────────────────────────

export type SoundCueType =
  | "music"
  | "sfx"
  | "voiceover"
  | "ambient"
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
  type: SoundCueType;
  action: SoundCueAction;
  triggerTime?: string;
  duration?: string;
  volume: number;
  source?: string;
  notes?: string;
  isActive: boolean;
};

export type SoundCueSheet = {
  id: string;
  projectId: string;
  title: string;
  cues: SoundCueEntry[];
  createdAt: string;
};

// 공연 무대 위험 평가
export type StageRiskLevel = "critical" | "high" | "medium" | "low";

export type StageRiskCategory =
  | "physical"
  | "electrical"
  | "structural"
  | "fire"
  | "crowd"
  | "weather"
  | "other";

export type StageRiskMitigation = {
  id: string;
  action: string;
  responsible: string;
  isCompleted: boolean;
  dueDate?: string;
};

export type StageRiskItem = {
  id: string;
  title: string;
  category: StageRiskCategory;
  level: StageRiskLevel;
  description: string;
  location?: string;
  mitigations: StageRiskMitigation[];
  isResolved: boolean;
  reportedBy: string;
  createdAt: string;
};

// 멤버 댄스 영감 보드
export type InspirationMediaType = "video" | "image" | "article" | "quote" | "idea";

export type InspirationTag = string;

export type InspirationBoardItem = {
  id: string;
  title: string;
  mediaType: InspirationMediaType;
  url?: string;
  content: string;
  tags: InspirationTag[];
  isFavorite: boolean;
  source?: string;
  createdAt: string;
};

// 공연 VIP 게스트 관리
export type VipGuestCategory =
  | "sponsor"
  | "media"
  | "celebrity"
  | "judge"
  | "family"
  | "other";

export type VipGuestStatus =
  | "invited"
  | "confirmed"
  | "declined"
  | "attended"
  | "no_show";

export type VipGuestEntry = {
  id: string;
  name: string;
  category: VipGuestCategory;
  status: VipGuestStatus;
  organization?: string;
  email?: string;
  phone?: string;
  seatAssignment?: string;
  plusOne: boolean;
  specialRequirements?: string;
  invitedBy: string;
  notes?: string;
  createdAt: string;
};

// 그룹 출석 통계 대시보드
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

// 그룹 연습 음악 큐
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

// ─── 그룹 공유 자료실 ──────────────────────────────────────────

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
// 공연 무대 전환 계획

export type StageTransitionTask = {
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
  tasks: StageTransitionTask[];
  totalDuration: number;
  notes?: string;
  lightingChange?: string;
  musicChange?: string;
  propsNeeded: string[];
  createdAt: string;
};

// ─── 그룹 연습 출석 예측 ───────────────────────────────────────

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
  | "game"
  | "outing"
  | "workshop"
  | "dinner"
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

// ── 그룹 연습 장소 관리 ───────────────────────────────────────

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

/** 프로그램 순서 항목 (곡명, 안무가, 출연진 등) */
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

/** 크레딧 역할 유형 */
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

/** 크레딧 항목 */
export type ShowProgramCredit = {
  id: string;
  role: ShowProgramCreditRole;
  roleLabel?: string;  // 역할 커스텀 레이블 (role이 other일 때)
  names: string[];     // 담당자 이름 목록
};

/** 스폰서 항목 */
export type ShowProgramSponsor = {
  id: string;
  name: string;        // 스폰서명
  tier?: string;       // 등급 (예: 골드, 실버, 브론즈)
  description?: string;
};

/** 공연 프로그램 전체 엔트리 */
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

/** 생일 정보 항목 */
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

/** 생일 축하 메시지 */
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

/** 전체 저장소 구조 */
export type BirthdayCalendarStore = {
  groupId: string;
  entries: BirthdayCalendarEntry[];
  messages: BirthdayCalendarMessage[];
  updatedAt: string;
};

// ============================================================
// 그룹 연습 룰/규칙 (Practice Rules & Etiquette)
// ============================================================

/** 규칙 카테고리 */
export type PracticeRuleCategory =
  | "attendance"    // 출석
  | "dress"         // 복장
  | "manner"        // 매너
  | "safety"        // 안전
  | "equipment"     // 장비/기자재
  | "hygiene"       // 위생
  | "communication" // 소통
  | "other";        // 기타

/** 규칙 중요도 */
export type PracticeRulePriority =
  | "required"      // 필수 (반드시 지켜야 함)
  | "recommended"   // 권장 (지키는 것이 좋음)
  | "optional";     // 선택 (자율)

/** 페널티 유형 */
export type PracticeRulePenaltyType =
  | "none"          // 없음
  | "warning"       // 경고
  | "fine"          // 벌금
  | "exclusion"     // 연습 제외
  | "custom";       // 커스텀

/** 연습 규칙 단일 항목 */
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

/** 마일스톤 단계 */
export type DanceMilestoneStep = {
  id: string;
  title: string;          // 단계 제목 (예: "기초 아이솔레이션")
  description?: string;   // 상세 설명
  isCompleted: boolean;   // 완료 여부
  completedAt?: string;   // 완료 일시 (ISO datetime)
  order: number;          // 정렬 순서
};

/** 댄스 목표 카테고리 */
export type DanceMilestoneCategory =
  | "genre"        // 장르 마스터 (팝핑, 락킹, 왁킹 등)
  | "technique"    // 테크닉 향상
  | "flexibility"  // 유연성
  | "stamina"      // 체력/지구력
  | "performance"  // 무대 퍼포먼스
  | "freestyle"    // 프리스타일
  | "choreography" // 안무 창작
  | "other";       // 기타

/** 댄스 목표 전체 */
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

/** localStorage 저장 전체 데이터 */
export type DanceMilestoneData = {
  goals: DanceMilestoneGoal[];
};

// ============================================================
// 공연 의상 변경 시트 (Costume Change Sheet)
// ============================================================

/** 의상 변경 위치 */
export type CostumeChangeLocation =
  | "stage_left"    // 무대 좌측
  | "stage_right"   // 무대 우측
  | "backstage"     // 백스테이지
  | "dressing_room" // 분장실
  | "other";        // 기타

/** 공연 의상 변경 단일 항목 */
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

/** 무대 소품 상태 */
export type StagePropStatus =
  | "ready"    // 준비됨
  | "in_use"   // 사용중
  | "stored"   // 보관중
  | "repair"   // 수리중
  | "lost";    // 분실

/** 무대 소품 단일 항목 */
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

/** 곡 용도 (연습 단계) */
export type PracticePlaylistPurpose =
  | "warmup"    // 웜업
  | "main"      // 본연습
  | "cooldown"; // 쿨다운

/** 플레이리스트 단일 곡 */
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

/** 플레이리스트 항목 */
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

/** 공지사항 템플릿 카테고리 */
export type AnnouncementTemplateCategory =
  | "practice"    // 연습
  | "performance" // 공연
  | "meeting"     // 회의
  | "gathering"   // 모임
  | "etc";        // 기타

/** 공지사항 템플릿 변수 */
export type AnnouncementTemplateVariable = {
  key: string;       // 변수 키 (예: "날짜", "장소")
  label: string;     // 표시 레이블
  defaultValue?: string; // 기본값
};

/** 공지사항 템플릿 항목 */
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

/** 공연 타임라인 이벤트 유형 */
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

/** 공연 타임라인 이벤트 상태 */
export type ShowTimelineStatus =
  | "scheduled"      // 예정
  | "in_progress"    // 진행중
  | "completed"      // 완료
  | "cancelled";     // 취소

/** 공연 타임라인 이벤트 */
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

/** 포토콜 촬영 유형 */
export type PhotoCallType =
  | "group"      // 단체
  | "subgroup"   // 소그룹
  | "individual" // 개인
  | "scene";     // 장면

/** 포토콜 항목 */
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

/** 워크숍 레벨 */
export type DanceWorkshopLevel =
  | "beginner"      // 입문
  | "intermediate"  // 중급
  | "advanced"      // 고급
  | "all_levels";   // 전 레벨

/** 워크숍 참석 이력 항목 */
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

/** 워크숍 이력 저장 데이터 */
export type DanceWorkshopData = {
  entries: DanceWorkshopEntry[];
};

// ============================================================
// 그룹 연습 파트너 매칭 (Practice Partner Matching)
// ============================================================

/** 스킬 레벨 */
export type PracticePartnerSkillLevel =
  | "beginner"     // 초급
  | "intermediate" // 중급
  | "advanced"     // 고급
  | "expert";      // 전문가

/** 매칭 상태 */
export type PracticePartnerMatchStatus = "active" | "ended";

/** 파트너 매칭 이력 항목 */
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

/** 연습 파트너 멤버 등록 항목 */
export type PracticePartnerMember = {
  id: string;                            // 멤버 고유 ID
  name: string;                          // 멤버 이름
  skillLevel: PracticePartnerSkillLevel; // 스킬 레벨
  availableTimes: string[];              // 연습 가능 시간대
  preferredPartnerIds: string[];         // 선호 파트너 ID 목록
  currentMatchId?: string;              // 현재 활성 매칭 ID
  joinedAt: string;                      // 등록일 (ISO datetime)
};

/** 연습 파트너 매칭 전체 데이터 */
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

/** 역할 분담 상태 */
export type RoleAssignmentStatus = "active" | "expired";

/** 역할 분담 이력 항목 */
export type RoleAssignmentHistoryItem = {
  id: string;                        // 이력 고유 ID
  changedAt: string;                 // 변경 일시 (ISO datetime)
  changedBy: string;                 // 변경자 이름
  prevAssignee: string;              // 이전 담당자
  nextAssignee: string;              // 새 담당자
  note?: string;                     // 변경 사유 (선택)
};

/** 역할 분담 항목 */
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

/** 역할 분담표 전체 데이터 */
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

/** 통증 부위 */
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

/** 연습 강도 */
export type DanceConditionIntensity =
  | "rest"      // 휴식
  | "light"     // 가벼운
  | "moderate"  // 보통
  | "hard"      // 힘든
  | "extreme";  // 극강

/** 댄스 컨디션 일지 단건 기록 */
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

/** 댄스 컨디션 일지 전체 데이터 (localStorage 저장 단위) */
export type DanceConditionEntry = {
  memberId: string;                         // 멤버 ID
  logs: DanceConditionLog[];                // 기록 목록 (최신순)
  updatedAt: string;                        // 마지막 수정일 (ISO datetime)
};

// ============================================================
// 공연 관객 안내 매뉴얼 (Audience Guide Manual)
// ============================================================

/** 관객 안내 섹션 유형 */
export type AudienceGuideSectionType =
  | "location"       // 공연장 위치/교통
  | "parking"        // 주차 안내
  | "seating"        // 좌석 안내
  | "caution"        // 주의사항 (촬영/녹음/음식 등)
  | "etiquette"      // 공연 에티켓
  | "emergency"      // 비상구/대피 안내
  | "faq"            // FAQ
  | "general";       // 일반 안내

/** FAQ 항목 */
export type AudienceGuideFAQ = {
  id: string;
  question: string;   // 질문
  answer: string;     // 답변
  order: number;      // 표시 순서
};

/** 관객 안내 섹션 */
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

/** 관객 안내 매뉴얼 전체 데이터 */
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

/** 출결 유형: 불참 / 지각 / 조퇴 */
export type AttendanceExcuseType = "absent" | "late" | "early_leave";

/** 사유 카테고리 */
export type AttendanceExcuseReason =
  | "health"   // 건강
  | "study"    // 학업
  | "work"     // 직장
  | "family"   // 가정
  | "other";   // 기타

/** 승인 상태 */
export type AttendanceExcuseStatus = "pending" | "approved" | "rejected";

/** 사유서 단건 */
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

/** 그룹 전체 사유서 데이터 */
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

/** 스태프 역할 */
export type StaffCallRole =
  | "stage_manager"   // 무대감독
  | "sound"           // 음향
  | "lighting"        // 조명
  | "costume"         // 의상
  | "makeup"          // 메이크업
  | "stage_crew"      // 무대스태프
  | "front_of_house"  // 프론트
  | "other";          // 기타

/** 스태프 콜시트 항목 */
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

/** 스태프 콜시트 전체 데이터 */
export type StaffCallSheet = {
  groupId: string;
  projectId: string;
  items: StaffCallItem[];
  updatedAt: string;
};

// ============================================================
// 공연 무대 동선 노트 (Stage Blocking Notes)
// ============================================================

/** 무대 위치 */
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

/** 전환 방향 */
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

/** 멤버별 동선 */
export type StageBlockingMemberMove = {
  memberName: string;                    // 멤버 이름
  fromPosition: StageBlockingPosition;   // 시작 위치
  toPosition: StageBlockingPosition;     // 종료 위치
  direction?: StageBlockingDirection;    // 이동 방향
  note?: string;                         // 멤버 동선 메모
};

/** 무대 동선 노트 단건 */
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

/** 무대 동선 전체 데이터 */
export type StageBlockingEntry = {
  groupId: string;
  projectId: string;
  notes: StageBlockingNote[];
  updatedAt: string;
};

// ============================================================
// 그룹 연습 기여도 포인트 (Practice Contribution Points)
// ============================================================

/** 기여도 포인트 카테고리 */
export type ContributionPointCategory =
  | "attendance"    // 출석
  | "demonstration" // 시범
  | "feedback"      // 피드백
  | "cleaning"      // 청소
  | "equipment"     // 장비관리
  | "teaching"      // 지도
  | "preparation"   // 준비
  | "other";        // 기타

/** 기여도 포인트 거래 (부여/차감 내역) */
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

/** 멤버별 포인트 집계 엔트리 */
export type ContributionPointEntry = {
  memberId: string;
  memberName: string;
  totalPoints: number;
  categoryBreakdown: Record<ContributionPointCategory, number>;
  transactions: ContributionPointTransaction[];
  rank: number;
};

/** 기여도 포인트 전체 데이터 */
export type ContributionPointStore = {
  groupId: string;
  transactions: ContributionPointTransaction[];
  updatedAt: string;
};

// ============================================================
// 멤버 댄스 오디션 기록 (Dance Audition Records)
// ============================================================

/** 오디션 결과 */
export type DanceAuditionResult =
  | "pass"       // 합격
  | "fail"       // 불합격
  | "pending"    // 대기/결과 미정
  | "cancelled"; // 취소

/** 오디션 개별 기록 */
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

/** 멤버 댄스 오디션 전체 데이터 */
export type DanceAuditionEntry = {
  memberId: string;
  records: DanceAuditionRecord[];
  updatedAt: string;
};

// ============================================================
// 그룹 외부 강사 관리 (Guest Instructor Management)
// ============================================================

/** 외부 강사 수업 이력 */
export type GuestInstructorLesson = {
  id: string;
  date: string;           // YYYY-MM-DD
  topic: string;          // 수업 주제
  rating: number;         // 평점 1~5
  note?: string;          // 메모
  createdAt: string;      // 생성일 (ISO datetime)
};

/** 외부 강사 정보 */
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

/** 외부 강사 전체 데이터 */
export type GuestInstructorData = {
  groupId: string;
  instructors: GuestInstructorEntry[];
  updatedAt: string;
};

// ============================================================
// 공연 관객 카운트 (Audience Count Tracker)
// ============================================================

/** 관객 유형 */
export type AudienceCountType =
  | "paid"       // 유료
  | "invited"    // 초대
  | "free"       // 무료
  | "staff";     // 관계자

/** 회차별 관객 수 기록 */
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

/** 공연 관객 카운트 항목 입력 타입 */
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

/** 공연 관객 카운트 전체 데이터 */
export type AudienceCountSheet = {
  groupId: string;
  projectId: string;
  records: AudienceCountRecord[];
  updatedAt: string;
};
