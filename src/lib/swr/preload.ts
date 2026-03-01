/**
 * SWR 라우트 프리페치 유틸리티
 *
 * 사이드바/네비게이션 링크에 마우스 호버 시 호출하여
 * 해당 페이지에 필요한 데이터를 미리 캐시에 적재한다.
 *
 * 주의사항:
 * - preload()는 SWR 글로벌 fetcher를 사용하지 않으므로 fetcher를 함께 전달해야 한다.
 * - 실패해도 사용자 경험에 영향이 없도록 모든 에러를 무시한다.
 * - 과도한 프리로드를 피하기 위해 주요 라우트(대시보드, 일정, 메시지)만 적용한다.
 */

import { preload } from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { Notification } from "@/types";
import type { Group } from "@/types";
import type { Conversation } from "@/types";
import type { Schedule } from "@/types";

// -----------------------------------------------------------------------
// 대시보드 프리로드
// 필요 데이터: 알림 목록, 그룹 목록, 오늘 일정
// -----------------------------------------------------------------------
export function preloadDashboard() {
  // 알림 목록
  preload(swrKeys.notifications(), async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [] as Notification[];

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return (data as Notification[]) ?? [];
  }).catch(() => {});

  // 그룹 목록 (대시보드에서 그룹 카드 렌더링에 사용)
  preload(swrKeys.groups(), async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase.rpc("get_user_groups", {
      p_user_id: user.id,
    });

    return (data as (Group & { member_count: number; my_role: string })[]) || [];
  }).catch(() => {});

  // 오늘 일정 (대시보드 today schedules 카드)
  preload(swrKeys.todaySchedules(), async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [] as Schedule[];

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toISOString();
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    ).toISOString();

    const { data: memberGroups } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (!memberGroups || memberGroups.length === 0) return [] as Schedule[];

    const groupIds = memberGroups.map((m: { group_id: string }) => m.group_id);

    const { data } = await supabase
      .from("schedules")
      .select(
        "id, group_id, project_id, title, description, location, address, latitude, longitude, attendance_method, starts_at, ends_at, created_by, late_threshold, attendance_deadline, require_checkout, recurrence_id, max_attendees"
      )
      .in("group_id", groupIds)
      .gte("starts_at", startOfDay)
      .lt("starts_at", endOfDay)
      .order("starts_at", { ascending: true });

    return (data ?? []) as Schedule[];
  }).catch(() => {});
}

// -----------------------------------------------------------------------
// 전체 일정 페이지 프리로드
// 필요 데이터: 그룹 목록 (일정 목록은 그룹별로 필요하므로 그룹만 프리로드)
// -----------------------------------------------------------------------
export function preloadSchedules() {
  // 그룹 목록 (일정 페이지에서 드롭다운 등에 사용)
  preload(swrKeys.groups(), async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase.rpc("get_user_groups", {
      p_user_id: user.id,
    });

    return (data as (Group & { member_count: number; my_role: string })[]) || [];
  }).catch(() => {});
}

// -----------------------------------------------------------------------
// 메시지 페이지 프리로드
// 필요 데이터: 대화 목록, 읽지 않은 메시지 수
// -----------------------------------------------------------------------
export function preloadMessages() {
  // 대화 목록
  preload(swrKeys.conversations(), async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_conversations");
    return (data as Conversation[]) ?? [];
  }).catch(() => {});

  // 읽지 않은 메시지 수
  preload(swrKeys.unreadCount(), async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_unread_message_count");
    return typeof data === "number" ? data : 0;
  }).catch(() => {});
}

// -----------------------------------------------------------------------
// 그룹 상세 페이지 프리로드
// 필요 데이터: 그룹 상세 정보 (members, categories 포함)
// -----------------------------------------------------------------------
export function preloadGroupDetail(groupId: string) {
  preload(swrKeys.groupDetail(groupId), async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const [groupRes, membersRes, categoriesRes] = await Promise.all([
      supabase
        .from("groups")
        .select(
          "id, name, description, invite_code, invite_code_enabled, invite_code_expires_at, created_by, created_at, group_type, visibility, join_policy, dance_genre, avatar_url, max_members, parent_group_id"
        )
        .eq("id", groupId)
        .single(),
      supabase
        .from("group_members")
        .select(
          "id, group_id, user_id, role, joined_at, nickname, category_id, dashboard_settings, profiles(id, name, avatar_url)"
        )
        .eq("group_id", groupId)
        .order("joined_at"),
      supabase
        .from("member_categories")
        .select("id, group_id, name, sort_order, color, created_at")
        .eq("group_id", groupId)
        .order("sort_order"),
    ]);

    return {
      group: groupRes.data,
      members: membersRes.data ?? [],
      categories: categoriesRes.data ?? [],
    };
  }).catch(() => {});
}
