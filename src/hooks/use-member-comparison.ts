"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { MemberComparisonData } from "@/types";
import type { EntityMember } from "@/types/entity-context";

/**
 * 여러 멤버의 최근 30일 활동 데이터를 비교하는 훅.
 *
 * 수집 지표:
 * - 출석률: attendance 테이블 (present / late 기준)
 * - 게시글 수: board_posts
 * - 댓글 수: board_comments
 * - RSVP 응답률: schedule_rsvp
 */
export function useMemberComparison(
  groupId: string,
  selectedMemberIds: string[],
  allMembers: EntityMember[]
) {
  const sortedIds = [...selectedMemberIds].sort();

  const { data, isLoading, mutate } = useSWR(
    groupId && sortedIds.length > 0
      ? swrKeys.memberComparison(groupId, sortedIds)
      : null,
    async (): Promise<MemberComparisonData[]> => {
      const supabase = createClient();

      // 30일 전 시각 계산
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString();

      // 선택된 멤버 객체 조회
      const targetMembers = allMembers.filter((m) =>
        sortedIds.includes(m.userId)
      );
      const userIds = targetMembers.map((m) => m.userId);

      // ── 1. 그룹 내 일정 ID 목록 조회 ──
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map(
        (s: { id: string }) => s.id
      );

      // ── 2. 최근 30일 출석 데이터 조회 ──
      let attendanceRows: { user_id: string }[] = [];
      let totalScheduleCount = scheduleIds.length;

      if (scheduleIds.length > 0) {
        // 최근 30일 일정만 필터 (실제 일정 날짜 기준)
        const { data: recentSchedules } = await supabase
          .from("schedules")
          .select("id")
          .eq("group_id", groupId)
          .gte("start_at", sinceIso);

        const recentScheduleIds = (recentSchedules ?? []).map(
          (s: { id: string }) => s.id
        );
        totalScheduleCount = recentScheduleIds.length;

        if (recentScheduleIds.length > 0) {
          const { data: attData, error: attErr } = await supabase
            .from("attendance")
            .select("user_id")
            .in("schedule_id", recentScheduleIds)
            .in("user_id", userIds)
            .in("status", ["present", "late"]);

          if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");
          attendanceRows = (attData ?? []) as { user_id: string }[];
        }
      }

      // ── 3. 최근 30일 게시글 수 조회 ──
      const { data: postRows, error: postErr } = await supabase
        .from("board_posts")
        .select("author_id")
        .eq("group_id", groupId)
        .in("author_id", userIds)
        .gte("created_at", sinceIso);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      // ── 4. 최근 30일 댓글 수 조회 ──
      // 그룹 내 전체 게시글 ID 목록 조회 후 댓글 필터
      const { data: allPostRows } = await supabase
        .from("board_posts")
        .select("id")
        .eq("group_id", groupId);

      const allPostIds = (allPostRows ?? []).map((p: { id: string }) => p.id);

      let commentRows: { author_id: string }[] = [];
      if (allPostIds.length > 0) {
        const { data: cmtData, error: cmtErr } = await supabase
          .from("board_comments")
          .select("author_id")
          .in("post_id", allPostIds)
          .in("author_id", userIds)
          .gte("created_at", sinceIso);

        if (cmtErr) throw new Error("댓글 데이터를 불러오지 못했습니다");
        commentRows = (cmtData ?? []) as { author_id: string }[];
      }

      // ── 5. 최근 30일 RSVP 응답 조회 ──
      // RSVP 응답률 = 응답한 일정 수 / 전체 일정 수
      let rsvpRows: { user_id: string; schedule_id: string }[] = [];
      if (scheduleIds.length > 0) {
        const { data: recentSchedules } = await supabase
          .from("schedules")
          .select("id")
          .eq("group_id", groupId)
          .gte("start_at", sinceIso);

        const recentScheduleIds = (recentSchedules ?? []).map(
          (s: { id: string }) => s.id
        );

        if (recentScheduleIds.length > 0) {
          const { data: rsvpData, error: rsvpErr } = await supabase
            .from("schedule_rsvp")
            .select("user_id, schedule_id")
            .in("schedule_id", recentScheduleIds)
            .in("user_id", userIds);

          if (rsvpErr) throw new Error("RSVP 데이터를 불러오지 못했습니다");
          rsvpRows = (rsvpData ?? []) as {
            user_id: string;
            schedule_id: string;
          }[];
        }
      }

      // ── 6. 멤버별 집계 ──
      return targetMembers.map((member) => {
        const uid = member.userId;

        const attended = attendanceRows.filter(
          (a) => a.user_id === uid
        ).length;
        const attendanceRate =
          totalScheduleCount > 0
            ? Math.round((attended / totalScheduleCount) * 100)
            : 0;

        const postCount = (postRows ?? []).filter(
          (p: { author_id: string }) => p.author_id === uid
        ).length;

        const commentCount = commentRows.filter(
          (c) => c.author_id === uid
        ).length;

        // RSVP 응답률: 유니크한 응답 일정 수 / 전체 일정 수
        const respondedScheduleIds = new Set(
          rsvpRows
            .filter((r) => r.user_id === uid)
            .map((r) => r.schedule_id)
        );
        const rsvpRate =
          totalScheduleCount > 0
            ? Math.round(
                (respondedScheduleIds.size / totalScheduleCount) * 100
              )
            : 0;

        return {
          userId: uid,
          name: member.nickname || member.profile.name,
          avatarUrl: member.profile.avatar_url,
          attendanceRate,
          postCount,
          commentCount,
          rsvpRate,
        };
      });
    }
  );

  return {
    comparisonData: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
