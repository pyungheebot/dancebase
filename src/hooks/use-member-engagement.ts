"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { EntityMember } from "@/types/entity-context";

/** 비활성 기준: 30일 */
const INACTIVE_THRESHOLD_DAYS = 30;

export type MemberEngagement = {
  member: EntityMember;
  lastActivityAt: string | null;
  inactiveDays: number;
  isInactive: boolean;
};

/**
 * 그룹 멤버별 최종 활동일을 계산해 비활성 멤버를 분류하는 훅.
 *
 * - board_posts, board_comments, attendance 중 가장 최근 활동일 기준
 * - 30일 이상 활동 없으면 비활성으로 분류
 *
 * @param groupId - 그룹 ID
 * @param members - 엔티티 멤버 목록
 */
export function useMemberEngagement(groupId: string, members: EntityMember[]) {
  const { data, isLoading, mutate } = useSWR(
    groupId && members.length > 0 ? swrKeys.memberEngagement(groupId) : null,
    async (): Promise<MemberEngagement[]> => {
      const supabase = createClient();

      const memberUserIds = members.map((m) => m.userId);

      // 그룹 내 일정 ID 조회 (출석 기록과 조인하기 위해)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      // 게시글 최근 활동일
      const { data: postRows, error: postErr } = await supabase
        .from("board_posts")
        .select("author_id, created_at")
        .eq("group_id", groupId)
        .in("author_id", memberUserIds)
        .order("created_at", { ascending: false });

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      // 댓글 최근 활동일 (board_comments는 post_id 기반 → 그룹 게시글의 post_id로 필터)
      const _postIds = (postRows ?? []).map((p: { author_id: string; created_at: string }) => p.author_id);

      // 그룹 내 board_posts의 ID 목록 조회
      const { data: groupPostIds, error: groupPostIdsErr } = await supabase
        .from("board_posts")
        .select("id")
        .eq("group_id", groupId);

      if (groupPostIdsErr) throw new Error("게시글 ID 조회에 실패했습니다");

      const allGroupPostIds = (groupPostIds ?? []).map((p: { id: string }) => p.id);

      // 해당 그룹 게시글에 달린 댓글 조회
      let commentRows: { author_id: string; created_at: string }[] = [];
      if (allGroupPostIds.length > 0) {
        const { data: comments, error: commentErr } = await supabase
          .from("board_comments")
          .select("author_id, created_at")
          .in("post_id", allGroupPostIds)
          .in("author_id", memberUserIds)
          .order("created_at", { ascending: false });

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");
        commentRows = (comments ?? []) as { author_id: string; created_at: string }[];
      }

      // 출석 최근 활동일
      let attendanceRows: { user_id: string; checked_at: string }[] = [];
      if (scheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("user_id, checked_at")
          .in("schedule_id", scheduleIds)
          .in("user_id", memberUserIds)
          .order("checked_at", { ascending: false });

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");
        attendanceRows = (attData ?? []) as { user_id: string; checked_at: string }[];
      }

      const now = new Date();

      return members.map((member) => {
        // 게시글 최근일
        const latestPost = (postRows ?? [])
          .filter((p: { author_id: string; created_at: string }) => p.author_id === member.userId)
          .map((p: { author_id: string; created_at: string }) => p.created_at)[0] ?? null;

        // 댓글 최근일
        const latestComment = commentRows
          .filter((c) => c.author_id === member.userId)
          .map((c) => c.created_at)[0] ?? null;

        // 출석 최근일
        const latestAttendance = attendanceRows
          .filter((a) => a.user_id === member.userId)
          .map((a) => a.checked_at)[0] ?? null;

        // 가장 최근 활동일 (가입일도 폴백으로 포함)
        const candidates = [latestPost, latestComment, latestAttendance, member.joinedAt]
          .filter(Boolean) as string[];

        const lastActivityAt =
          candidates.length > 0
            ? candidates.reduce((a, b) => (a > b ? a : b))
            : null;

        // 비활성 기간 계산
        const lastDate = lastActivityAt ? new Date(lastActivityAt) : null;
        const inactiveDays = lastDate
          ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          : 9999;

        const isInactive = inactiveDays >= INACTIVE_THRESHOLD_DAYS;

        return {
          member,
          lastActivityAt,
          inactiveDays,
          isInactive,
        };
      });
    }
  );

  const engagements = data ?? [];
  const inactiveMembers = engagements.filter((e) => e.isInactive);

  return {
    engagements,
    inactiveMembers,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
