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
// Dashboard Layout (대시보드 레이아웃, localStorage 기반)
// ============================================

export type DashboardWidgetId =
  | "upcoming-schedules"
  | "quick-stats"
  | "recent-activity"
  | "monthly-summary"
  | "weekly-challenge"
  | "health-trend"
  | "activity-report"
  | "member-activity";

export type DashboardWidgetMeta = {
  id: DashboardWidgetId;
  label: string;
};

export type DashboardWidgetItem = {
  id: DashboardWidgetId;
  visible: boolean;
  order: number;
};

export type DashboardLayout = DashboardWidgetItem[];

export type DashboardWidgetDirection = "up" | "down";

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

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = DASHBOARD_WIDGETS.map((w, i) => ({
  id: w.id,
  visible: true,
  order: i,
}));

// ============================================
// Reward Points Shop (포인트 상점, localStorage 기반)
// ============================================

export type RewardItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: "title" | "badge" | "privilege";
  emoji: string;
  isActive: boolean;
};

export type PointTransaction = {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
};

export const REWARD_CATEGORY_LABELS: Record<RewardItem["category"], string> = {
  title: "칭호",
  badge: "뱃지",
  privilege: "특권",
};

export const POINT_RULES = {
  attendance: 10,
  streak5: 50,
  streak10: 100,
  post: 5,
  rsvp: 3,
} as const;

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
// Reward Shop (출석 보상 포인트 상점, localStorage 기반)
// ============================================

export type RewardShopItem = {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  quantity: number;
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
// Activity Point (보상 포인트)
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
