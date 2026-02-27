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
  role: "leader" | "member";
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
};

export type AttendanceStatus = "present" | "absent" | "late" | "early_leave";

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
};

export type AttendanceWithProfile = Attendance & {
  profiles: Profile;
};

export type GroupWithMemberCount = Group & {
  member_count: number;
  my_role?: "leader" | "member";
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

export type BoardPost = {
  id: string;
  group_id: string;
  project_id: string | null;
  category: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type BoardPostWithDetails = BoardPost & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
  comment_count: number;
  projects?: Pick<Project, "id" | "name"> | null;
};

export type BoardComment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
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
  | "join_rejected";

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

export type Conversation = {
  partner_id: string;
  partner_name: string;
  partner_avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};
