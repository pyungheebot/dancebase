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
// Dashboard Settings (대시보드 카드 설정) - GroupMember에서 참조
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

export type GroupWithMemberCount = Group & {
  member_count: number;
  my_role?: "leader" | "sub_leader" | "member";
};

export type GroupMemberWithProfile = GroupMember & {
  profiles: Profile;
};

// ============================================
// Project (기본 타입 - 여러 도메인에서 참조)
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

export type GroupFaqCategory = "가입" | "연습" | "공연" | "회비" | "기타";

export const GROUP_FAQ_CATEGORIES: GroupFaqCategory[] = [
  "가입",
  "연습",
  "공연",
  "회비",
  "기타",
];

export type GroupFaq = {
  id: string;
  question: string;
  answer: string;
  order: number;
  category: GroupFaqCategory;
  authorName: string;
  createdAt: string;
  pinned: boolean;
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
  content: string;
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
// Day of Week Key (요일 키)
// ============================================

export type DayOfWeekKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** @deprecated DayOfWeekKey 를 사용하세요 */
export type DayOfWeek = DayOfWeekKey;

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
