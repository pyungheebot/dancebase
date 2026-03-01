// ============================================
// Countdown Event (이벤트 카운트다운)
// ============================================

export type CountdownEvent = {
  id: string;
  title: string;
  eventDate: string;
  eventTime?: string;
  emoji: string;
  createdAt: string;
};

// ============================================
// Schedule Feedback Item (일정 피드백/후기)
// ============================================

export type ScheduleFeedbackMood = "great" | "good" | "ok" | "bad";

export type ScheduleFeedbackItem = {
  id: string;
  scheduleId: string;
  rating: number;
  content: string;
  mood: ScheduleFeedbackMood;
  createdAt: string;
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
// Schedule Recurrence (일정 반복 설정)
// ============================================

export type RecurrenceType = "weekly" | "biweekly" | "monthly";
export type RecurrenceEndType = "never" | "by_date" | "by_count";

export type ScheduleRecurrenceRule = {
  id: string;
  groupId: string;
  type: RecurrenceType;
  daysOfWeek: number[];
  startTime: string;
  durationMinutes: number;
  title: string;
  location: string;
  endType: RecurrenceEndType;
  endDate: string | null;
  endCount: number | null;
  createdAt: string;
};

// ============================================
// Event RSVP (그룹 이벤트 RSVP)
// ============================================

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

// ============================================
// Event Calendar (이벤트 캘린더)
// ============================================

export type CalendarEventType = "practice" | "performance" | "meeting" | "workshop" | "social" | "other";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  type: CalendarEventType;
  location: string;
  description: string;
  createdAt: string;
};

// ============================================
// Unified Calendar (그룹 통합 캘린더)
// ============================================

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
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  participants: string[];
  isAllDay: boolean;
  color?: string;
  reminder?: boolean;
  createdBy: string;
  createdAt: string;
};

// ============================================
// Event Gallery (그룹 이벤트 갤러리)
// ============================================

export type EventTag = "performance" | "competition" | "workshop" | "other";

export type GroupEvent = {
  id: string;
  groupId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  tag: EventTag;
  participantCount: number;
  createdAt: string;
};

// ============================================
// Personal Schedule Conflict (그룹 일정 충돌 감지)
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
  date: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  recurringDay?: number;
  createdAt: string;
};

export type ScheduleConflictResult = {
  memberName: string;
  personalSchedule: PersonalScheduleEntry;
  conflictDate: string;
  overlapMinutes: number;
};

// ============================================
// Attendance Forecast
// ============================================

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

// ============================================
// Show Day Checklist (공연 당일 체크리스트)
// ============================================

export type ShowDayTimeSlot =
  | "entry"
  | "rehearsal"
  | "makeup"
  | "standby"
  | "preshow"
  | "postshow"
  | "teardown";

export type ShowDayPriority = "required" | "recommended" | "optional";

export type ShowDayChecklistItem = {
  id: string;
  timeSlot: ShowDayTimeSlot;
  title: string;
  assignedTo?: string;
  completed: boolean;
  priority: ShowDayPriority;
  createdAt: string;
};

export type ShowDayChecklistData = {
  projectId: string;
  items: ShowDayChecklistItem[];
  updatedAt: string;
};
