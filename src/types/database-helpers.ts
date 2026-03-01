// ============================================
// Supabase 자동 생성 타입 기반 헬퍼
// database.ts는 `npx supabase gen types typescript --linked > src/types/database.ts`
// 로 재생성합니다. (package.json의 db:types 스크립트 참고)
// ============================================

import type { Database } from "./database";

// 기본 Tables / TablesInsert / TablesUpdate는 database.ts에서 직접 export됨.
// 여기서는 더 짧은 이름으로 재내보내어 편의를 제공합니다.
export type { Tables, TablesInsert, TablesUpdate } from "./database";

// ────────────────────────────────────────────
// 도메인별 Row 타입 alias
// ────────────────────────────────────────────

type Pub = Database["public"]["Tables"];

// -- 공통 --
export type ProfileRow = Pub["profiles"]["Row"];
export type ActivityLogRow = Pub["activity_logs"]["Row"];
export type NotificationRow = Pub["notifications"]["Row"];
export type MessageRow = Pub["messages"]["Row"];
export type FollowRow = Pub["follows"]["Row"];

// -- 그룹 --
export type GroupRow = Pub["groups"]["Row"];
export type GroupMemberRow = Pub["group_members"]["Row"];
export type GroupPaymentMethodRow = Pub["group_payment_methods"]["Row"];
export type JoinRequestRow = Pub["join_requests"]["Row"];
export type MemberCategoryRow = Pub["member_categories"]["Row"];
export type MemberNoteRow = Pub["member_notes"]["Row"];
export type MemberSkillRow = Pub["member_skills"]["Row"];

// -- 일정 --
export type ScheduleRow = Pub["schedules"]["Row"];
export type ScheduleRsvpRow = Pub["schedule_rsvp"]["Row"];
export type ScheduleRoleRow = Pub["schedule_roles"]["Row"];
export type ScheduleTemplateRow = Pub["schedule_templates"]["Row"];
export type ScheduleCheckinCodeRow = Pub["schedule_checkin_codes"]["Row"];
export type ScheduleChecklistItemRow = Pub["schedule_checklist_items"]["Row"];
export type ScheduleFeedbackRow = Pub["schedule_feedback"]["Row"];
export type ScheduleWaitlistRow = Pub["schedule_waitlist"]["Row"];
export type ScheduleCarpoolOfferRow = Pub["schedule_carpool_offers"]["Row"];
export type ScheduleCarpoolRequestRow = Pub["schedule_carpool_requests"]["Row"];
export type MeetingMinutesRow = Pub["meeting_minutes"]["Row"];

// -- 출석 --
export type AttendanceRow = Pub["attendance"]["Row"];
export type AttendanceGoalRow = Pub["attendance_goals"]["Row"];

// -- 게시판 --
export type BoardCategoryRow = Pub["board_categories"]["Row"];
export type BoardPostRow = Pub["board_posts"]["Row"];
export type BoardCommentRow = Pub["board_comments"]["Row"];
export type BoardPollRow = Pub["board_polls"]["Row"];
export type BoardPollOptionRow = Pub["board_poll_options"]["Row"];
export type BoardPollVoteRow = Pub["board_poll_votes"]["Row"];
export type BoardPostAttachmentRow = Pub["board_post_attachments"]["Row"];
export type BoardPostLikeRow = Pub["board_post_likes"]["Row"];
export type BoardPostRevisionRow = Pub["board_post_revisions"]["Row"];
export type PostBookmarkRow = Pub["post_bookmarks"]["Row"];
export type PostReadStatusRow = Pub["post_read_status"]["Row"];
export type ContentReportRow = Pub["content_reports"]["Row"];

// -- 재정 --
export type FinanceCategoryRow = Pub["finance_categories"]["Row"];
export type FinanceTransactionRow = Pub["finance_transactions"]["Row"];
export type FinanceBudgetRow = Pub["finance_budgets"]["Row"];
export type FinanceSplitRow = Pub["finance_splits"]["Row"];
export type FinanceSplitMemberRow = Pub["finance_split_members"]["Row"];
export type SettlementRequestRow = Pub["settlement_requests"]["Row"];
export type SettlementRequestMemberRow = Pub["settlement_request_members"]["Row"];
export type ReceiptShareTokenRow = Pub["receipt_share_tokens"]["Row"];

// -- 프로젝트 --
export type ProjectRow = Pub["projects"]["Row"];
export type ProjectMemberRow = Pub["project_members"]["Row"];
export type ProjectSharedGroupRow = Pub["project_shared_groups"]["Row"];
export type ProjectTaskRow = Pub["project_tasks"]["Row"];
export type ProjectSongRow = Pub["project_songs"]["Row"];
export type SongNoteRow = Pub["song_notes"]["Row"];
export type SongPartRow = Pub["song_parts"]["Row"];
export type PracticeVideoRow = Pub["practice_videos"]["Row"];
export type PerformanceRecordRow = Pub["performance_records"]["Row"];
export type GroupChallengeRow = Pub["group_challenges"]["Row"];

// -- 권한 / 설정 --
export type EntityFeatureRow = Pub["entity_features"]["Row"];
export type EntityPermissionRow = Pub["entity_permissions"]["Row"];
export type EntitySettingRow = Pub["entity_settings"]["Row"];
export type PermissionAuditRow = Pub["permission_audits"]["Row"];
export type ContactVerificationRow = Pub["contact_verifications"]["Row"];

// ────────────────────────────────────────────
// Insert / Update 타입 alias (자주 쓰는 것만)
// ────────────────────────────────────────────

export type AttendanceInsert = Pub["attendance"]["Insert"];
export type AttendanceUpdate = Pub["attendance"]["Update"];

export type BoardCommentInsert = Pub["board_comments"]["Insert"];
export type BoardCommentUpdate = Pub["board_comments"]["Update"];

export type BoardPostInsert = Pub["board_posts"]["Insert"];
export type BoardPostUpdate = Pub["board_posts"]["Update"];

export type ScheduleInsert = Pub["schedules"]["Insert"];
export type ScheduleUpdate = Pub["schedules"]["Update"];

export type FinanceTransactionInsert = Pub["finance_transactions"]["Insert"];
export type FinanceTransactionUpdate = Pub["finance_transactions"]["Update"];

export type ProfileUpdate = Pub["profiles"]["Update"];
export type GroupUpdate = Pub["groups"]["Update"];
export type ProjectInsert = Pub["projects"]["Insert"];
export type ProjectUpdate = Pub["projects"]["Update"];

// ────────────────────────────────────────────
// RPC 반환 타입 alias
// ────────────────────────────────────────────

type Fn = Database["public"]["Functions"];

export type GetUserGroupsResult = Fn["get_user_groups"]["Returns"][number];
export type GetGroupProjectsResult = Fn["get_group_projects"]["Returns"][number];
export type GetPublicGroupsResult = Fn["get_public_groups"]["Returns"][number];
export type GetPublicProjectsResult = Fn["get_public_projects"]["Returns"][number];
export type GetUserAttendanceStatsResult = Fn["get_user_attendance_stats"]["Returns"][number];
export type GetSuggestedFollowsResult = Fn["get_suggested_follows"]["Returns"][number];
export type GetPollOptionsWithVotesResult = Fn["get_poll_options_with_votes"]["Returns"][number];
export type GetUserPermissionsResult = Fn["get_user_permissions"]["Returns"][number];
export type GetConversationsResult = Fn["get_conversations"]["Returns"][number];
export type GetGroupAncestorsResult = Fn["get_group_ancestors"]["Returns"][number];
export type GetGroupChildrenResult = Fn["get_group_children"]["Returns"][number];
