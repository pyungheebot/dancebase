"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MemberInteractionScoreResult,
  MemberInteractionScoreItem,
  MemberInteractionBreakdown,
  InteractionActivityLevel,
} from "@/types";

/**
 * 멤버 상호작용 분석 훅 (최근 30일)
 *
 * 점수 가중치:
 *   - 게시글 작성: 건당 15점
 *   - 댓글 작성:   건당  5점
 *   - 출석 확인:   건당 10점
 *   - RSVP 응답:   건당  3점
 *
 * 활동 수준:
 *   - active  : 평균 >= 30점
 *   - normal  : 평균 >= 10점
 *   - low     : 평균 <  10점
 */
export function useMemberInteractionScore(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.memberInteractionScore(groupId) : null,
    async (): Promise<MemberInteractionScoreResult> => {
      const supabase = createClient();

      const now = new Date();
      const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // ─────────────────────────────────────────
      // 1. 그룹 멤버 목록 + 프로필
      // ─────────────────────────────────────────
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("user_id, profiles(name, avatar_url)")
        .eq("group_id", groupId);

      if (memberErr) throw new Error("멤버 데이터를 불러오지 못했습니다");
      if (!memberRows || memberRows.length === 0) {
        return { members: [], averageScore: 0, activityLevel: "low", hasData: false };
      }

      type MemberRow = {
        user_id: string;
        profiles: { name: string; avatar_url: string | null } | null;
      };
      const members = memberRows as MemberRow[];
      const memberUserIds = members.map((m) => m.user_id);

      // ─────────────────────────────────────────
      // 2. 최근 30일 게시글 (author_id 기준)
      // ─────────────────────────────────────────
      const { data: postRows, error: postErr } = await supabase
        .from("board_posts")
        .select("id, author_id")
        .eq("group_id", groupId)
        .gte("created_at", since30);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");
      const posts = (postRows ?? []) as { id: string; author_id: string }[];
      const postIds = posts.map((p) => p.id);

      // ─────────────────────────────────────────
      // 3. 최근 30일 댓글 (해당 게시글 또는 기간 기준)
      // ─────────────────────────────────────────
      type CommentRow = { author_id: string };
      let comments: CommentRow[] = [];

      if (postIds.length > 0) {
        const { data: commentRows, error: commentErr } = await supabase
          .from("board_comments")
          .select("author_id")
          .in("post_id", postIds)
          .gte("created_at", since30);

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");
        comments = (commentRows ?? []) as CommentRow[];
      }

      // ─────────────────────────────────────────
      // 4. 최근 30일 일정 목록 → 출석·RSVP 조회
      // ─────────────────────────────────────────
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .gte("starts_at", since30)
        .lte("starts_at", now.toISOString());

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");
      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      // ─────────────────────────────────────────
      // 5. 출석 데이터
      // ─────────────────────────────────────────
      type AttRow = { user_id: string; status: string };
      let attRows: AttRow[] = [];

      if (scheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("user_id, status")
          .in("schedule_id", scheduleIds)
          .in("status", ["present", "late"]);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");
        attRows = (attData ?? []) as AttRow[];
      }

      // ─────────────────────────────────────────
      // 6. RSVP 데이터
      // ─────────────────────────────────────────
      type RsvpRow = { user_id: string };
      let rsvpRows: RsvpRow[] = [];

      if (scheduleIds.length > 0) {
        const { data: rsvpData, error: rsvpErr } = await supabase
          .from("schedule_rsvp")
          .select("user_id")
          .in("schedule_id", scheduleIds);

        if (rsvpErr) throw new Error("RSVP 데이터를 불러오지 못했습니다");
        rsvpRows = (rsvpData ?? []) as RsvpRow[];
      }

      // ─────────────────────────────────────────
      // 7. 멤버별 카운트 집계
      // ─────────────────────────────────────────
      const postCount: Record<string, number> = {};
      const commentCount: Record<string, number> = {};
      const attendanceCount: Record<string, number> = {};
      const rsvpCount: Record<string, number> = {};

      for (const uid of memberUserIds) {
        postCount[uid] = 0;
        commentCount[uid] = 0;
        attendanceCount[uid] = 0;
        rsvpCount[uid] = 0;
      }

      for (const post of posts) {
        if (postCount[post.author_id] !== undefined) {
          postCount[post.author_id]++;
        }
      }
      for (const comment of comments) {
        if (commentCount[comment.author_id] !== undefined) {
          commentCount[comment.author_id]++;
        }
      }
      for (const att of attRows) {
        if (attendanceCount[att.user_id] !== undefined) {
          attendanceCount[att.user_id]++;
        }
      }
      for (const rsvp of rsvpRows) {
        if (rsvpCount[rsvp.user_id] !== undefined) {
          rsvpCount[rsvp.user_id]++;
        }
      }

      // ─────────────────────────────────────────
      // 8. 점수 계산 + 순위 부여
      // ─────────────────────────────────────────
      const WEIGHTS = { post: 15, comment: 5, attendance: 10, rsvp: 3 } as const;

      const scored: MemberInteractionScoreItem[] = members.map((m) => {
        const uid = m.user_id;
        const pScore = postCount[uid] * WEIGHTS.post;
        const cScore = commentCount[uid] * WEIGHTS.comment;
        const aScore = attendanceCount[uid] * WEIGHTS.attendance;
        const rScore = rsvpCount[uid] * WEIGHTS.rsvp;
        const total = pScore + cScore + aScore + rScore;

        const breakdown: MemberInteractionBreakdown = {
          postCount: postCount[uid],
          commentCount: commentCount[uid],
          attendanceCount: attendanceCount[uid],
          rsvpCount: rsvpCount[uid],
          postScore: pScore,
          commentScore: cScore,
          attendanceScore: aScore,
          rsvpScore: rScore,
        };

        return {
          userId: uid,
          name: m.profiles?.name ?? "알 수 없음",
          avatarUrl: m.profiles?.avatar_url ?? null,
          totalScore: total,
          rank: 0, // 아래에서 채움
          breakdown,
        };
      });

      // 점수 내림차순 정렬 후 순위 부여
      scored.sort((a, b) => b.totalScore - a.totalScore);
      scored.forEach((item, idx) => {
        item.rank = idx + 1;
      });

      // ─────────────────────────────────────────
      // 9. 그룹 평균 + 활동 수준 판정
      // ─────────────────────────────────────────
      const averageScore =
        scored.length > 0
          ? Math.round(scored.reduce((sum, m) => sum + m.totalScore, 0) / scored.length)
          : 0;

      let activityLevel: InteractionActivityLevel;
      if (averageScore >= 30) activityLevel = "active";
      else if (averageScore >= 10) activityLevel = "normal";
      else activityLevel = "low";

      return {
        members: scored,
        averageScore,
        activityLevel,
        hasData: scored.length > 0,
      };
    }
  );

  const defaultData: MemberInteractionScoreResult = {
    members: [],
    averageScore: 0,
    activityLevel: "low",
    hasData: false,
  };

  return {
    data: data ?? defaultData,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
