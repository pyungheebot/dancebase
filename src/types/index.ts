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
