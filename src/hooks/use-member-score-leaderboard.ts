"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MemberScoreBreakdown,
  MemberScoreEntry,
  MemberScoreLeaderboardResult,
} from "@/types";

// 빈 결과 기본값
const EMPTY_RESULT: MemberScoreLeaderboardResult = {
  entries: [],
  totalMembers: 0,
  myEntry: null,
};

// 점수 가중치 상수
const SCORE_WEIGHTS = {
  attendancePresent: 10,
  attendanceLate: 5,
  post: 15,
  comment: 5,
  rsvp: 3,
} as const;

// 멤버 기본 정보 타입
type MemberBasic = {
  userId: string;
  name: string;
};

export function useMemberScoreLeaderboard(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.memberScoreLeaderboard(groupId) : null,
    async (): Promise<MemberScoreLeaderboardResult> => {
      const supabase = createClient();

      // 최근 30일 범위 계산
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const fromDate = thirtyDaysAgo.toISOString();

      // 현재 로그인 사용자 확인
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      // 1. 그룹 멤버 목록 조회 (profiles 조인)
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name)")
        .eq("group_id", groupId);

      if (memberErr || !memberRows || memberRows.length === 0) {
        return EMPTY_RESULT;
      }

      // 멤버 기본 정보 매핑
      const members: MemberBasic[] = (
        memberRows as Array<{
          user_id: string;
          profiles:
            | { name: string }
            | Array<{ name: string }>
            | null;
        }>
      ).map((row) => {
        const profile = Array.isArray(row.profiles)
          ? row.profiles[0]
          : row.profiles;
        return {
          userId: row.user_id,
          name: profile?.name ?? "알 수 없음",
        };
      });

      const userIds: string[] = members.map((m) => m.userId);

      // 2. 최근 30일 그룹 일정 ID 조회
      const { data: scheduleRows } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .gte("starts_at", fromDate);

      const scheduleIds: string[] = (
        (scheduleRows as Array<{ id: string }> | null) ?? []
      ).map((s) => s.id);

      // 3. 출석 기록 조회 (present / late 구분)
      const attendancePresentMap = new Map<string, number>();
      const attendanceLateMap = new Map<string, number>();

      if (scheduleIds.length > 0) {
        const { data: attRows } = await supabase
          .from("attendance")
          .select("user_id, status")
          .in("schedule_id", scheduleIds)
          .in("user_id", userIds)
          .in("status", ["present", "late"]);

        for (const row of (
          attRows as Array<{ user_id: string; status: string }> | null) ?? []
        ) {
          if (row.status === "present") {
            attendancePresentMap.set(
              row.user_id,
              (attendancePresentMap.get(row.user_id) ?? 0) + 1
            );
          } else if (row.status === "late") {
            attendanceLateMap.set(
              row.user_id,
              (attendanceLateMap.get(row.user_id) ?? 0) + 1
            );
          }
        }
      }

      // 4. 게시글 작성 건수 조회 (최근 30일)
      const postCountMap = new Map<string, number>();
      {
        const { data: postRows } = await supabase
          .from("board_posts")
          .select("author_id")
          .eq("group_id", groupId)
          .in("author_id", userIds)
          .gte("created_at", fromDate)
          .is("deleted_at", null);

        for (const row of (
          postRows as Array<{ author_id: string }> | null) ?? []
        ) {
          postCountMap.set(
            row.author_id,
            (postCountMap.get(row.author_id) ?? 0) + 1
          );
        }
      }

      // 5. 댓글 작성 건수 조회 (최근 30일, 해당 그룹 게시글에 달린 댓글만)
      const commentCountMap = new Map<string, number>();
      {
        const { data: commentRows } = await supabase
          .from("board_comments")
          .select("author_id, board_posts!inner(group_id)")
          .eq("board_posts.group_id", groupId)
          .in("author_id", userIds)
          .gte("created_at", fromDate)
          .is("deleted_at", null);

        for (const row of (
          commentRows as Array<{ author_id: string }> | null) ?? []
        ) {
          commentCountMap.set(
            row.author_id,
            (commentCountMap.get(row.author_id) ?? 0) + 1
          );
        }
      }

      // 6. RSVP 응답 건수 조회 (최근 30일 일정 기준)
      const rsvpCountMap = new Map<string, number>();
      if (scheduleIds.length > 0) {
        const { data: rsvpRows } = await supabase
          .from("schedule_rsvp")
          .select("user_id")
          .in("schedule_id", scheduleIds)
          .in("user_id", userIds);

        for (const row of (
          rsvpRows as Array<{ user_id: string }> | null) ?? []
        ) {
          rsvpCountMap.set(
            row.user_id,
            (rsvpCountMap.get(row.user_id) ?? 0) + 1
          );
        }
      }

      // 7. 멤버별 종합 점수 계산
      const scoredEntries: Omit<MemberScoreEntry, "rank">[] = members.map(
        (member) => {
          const presentCount = attendancePresentMap.get(member.userId) ?? 0;
          const lateCount = attendanceLateMap.get(member.userId) ?? 0;
          const postCount = postCountMap.get(member.userId) ?? 0;
          const commentCount = commentCountMap.get(member.userId) ?? 0;
          const rsvpCount = rsvpCountMap.get(member.userId) ?? 0;

          const breakdown: MemberScoreBreakdown = {
            attendance:
              presentCount * SCORE_WEIGHTS.attendancePresent +
              lateCount * SCORE_WEIGHTS.attendanceLate,
            posts: postCount * SCORE_WEIGHTS.post,
            comments: commentCount * SCORE_WEIGHTS.comment,
            rsvp: rsvpCount * SCORE_WEIGHTS.rsvp,
          };

          const totalScore =
            breakdown.attendance +
            breakdown.posts +
            breakdown.comments +
            breakdown.rsvp;

          return {
            userId: member.userId,
            name: member.name,
            totalScore,
            breakdown,
          };
        }
      );

      // 8. 총점 내림차순 정렬
      scoredEntries.sort((a, b) => b.totalScore - a.totalScore);

      // 9. 순위 부여 (동점자는 같은 순위)
      const ranked: MemberScoreEntry[] = [];
      let currentRank = 1;
      for (let i = 0; i < scoredEntries.length; i++) {
        if (i > 0 && scoredEntries[i].totalScore < scoredEntries[i - 1].totalScore) {
          currentRank = i + 1;
        }
        ranked.push({ ...scoredEntries[i], rank: currentRank });
      }

      const totalMembers = ranked.length;

      // 최대 20명만 표시
      const entries = ranked.slice(0, 20);

      // 현재 로그인 사용자 항목 찾기 (20위 밖이어도 포함)
      const myEntry = currentUser
        ? (ranked.find((e) => e.userId === currentUser.id) ?? null)
        : null;

      return { entries, totalMembers, myEntry };
    }
  );

  return {
    data: data ?? EMPTY_RESULT,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
