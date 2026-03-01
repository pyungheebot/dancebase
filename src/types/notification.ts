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
  | "action_item"
  | "new_follow"
  | "settlement_request";

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
// Notification Rules Builder (알림 규칙 빌더, localStorage 기반)
// ============================================

export type NotificationConditionType =
  | "attendance_below"
  | "inactive_days"
  | "schedule_upcoming"
  | "rsvp_missing"
  | "new_post";

export type NotificationCondition = {
  type: NotificationConditionType;
  value?: number;
};

export type NotificationRuleAction = "in-app";

export type NotificationRule = {
  id: string;
  groupId: string;
  name: string;
  enabled: boolean;
  conditions: NotificationCondition[];
  action: NotificationRuleAction;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
};
