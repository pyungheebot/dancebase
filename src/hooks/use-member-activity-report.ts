"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { EntityMember } from "@/types/entity-context";

export type ActivityPeriod = "1m" | "3m" | "6m" | "1y";

export type MemberActivityRecord = {
  memberId: string;
  userId: string;
  name: string;
  postCount: number;
  commentCount: number;
  attendanceCount: number;
  financeCount: number;
  score: number;
  rank: number;
};

type Options = {
  period: ActivityPeriod;
};

/** 기간 문자열 → 시작일 ISO 문자열 계산 */
function getPeriodStart(period: ActivityPeriod): string {
  const now = new Date();
  switch (period) {
    case "1m":
      now.setMonth(now.getMonth() - 1);
      break;
    case "3m":
      now.setMonth(now.getMonth() - 3);
      break;
    case "6m":
      now.setMonth(now.getMonth() - 6);
      break;
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now.toISOString();
}

/**
 * 종합 점수 계산 (가중치: 게시글×3, 댓글×1, 출석×5, 회비×2)
 */
function calcScore(
  postCount: number,
  commentCount: number,
  attendanceCount: number,
  financeCount: number
): number {
  return postCount * 3 + commentCount * 1 + attendanceCount * 5 + financeCount * 2;
}

/**
 * 멤버별 활동 리포트를 조회하는 훅.
 *
 * - 게시글 수: board_posts count
 * - 댓글 수: board_comments count
 * - 출석 횟수: attendance (present, late) count
 * - 회비 납부 횟수: finance_transactions count
 * - 종합 점수: 게시글×3 + 댓글×1 + 출석×5 + 회비×2
 */
export function useMemberActivityReport(
  groupId: string,
  members: EntityMember[],
  options: Options
) {
  const { period } = options;

  const { data, isLoading, mutate } = useSWR(
    groupId && members.length > 0
      ? swrKeys.memberActivityReport(groupId, period)
      : null,
    async (): Promise<MemberActivityRecord[]> => {
      const supabase = createClient();
      const since = getPeriodStart(period);
      const memberUserIds = members.map((m) => m.userId);

      // 1. 그룹 내 게시글 ID 목록 (댓글 필터용)
      const { data: groupPostRows, error: groupPostErr } = await supabase
        .from("board_posts")
        .select("id, author_id")
        .eq("group_id", groupId)
        .gte("created_at", since)
        .in("author_id", memberUserIds);

      if (groupPostErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      // 2. 댓글 조회 (그룹 내 모든 게시글의 댓글)
      const { data: allGroupPostIds } = await supabase
        .from("board_posts")
        .select("id")
        .eq("group_id", groupId);

      const postIdList = (allGroupPostIds ?? []).map((p: { id: string }) => p.id);

      let commentRows: { author_id: string }[] = [];
      if (postIdList.length > 0) {
        const { data: comments, error: commentErr } = await supabase
          .from("board_comments")
          .select("author_id")
          .in("post_id", postIdList)
          .in("author_id", memberUserIds)
          .gte("created_at", since);

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");
        commentRows = (comments ?? []) as { author_id: string }[];
      }

      // 3. 출석 조회 (present, late만)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      let attendanceRows: { user_id: string }[] = [];
      if (scheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("user_id")
          .in("schedule_id", scheduleIds)
          .in("user_id", memberUserIds)
          .in("status", ["present", "late"])
          .gte("checked_at", since);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");
        attendanceRows = (attData ?? []) as { user_id: string }[];
      }

      // 4. 회비 납부 조회
      const { data: financeRows, error: financeErr } = await supabase
        .from("finance_transactions")
        .select("created_by")
        .eq("group_id", groupId)
        .in("created_by", memberUserIds)
        .gte("created_at", since);

      if (financeErr) throw new Error("회비 데이터를 불러오지 못했습니다");

      // 5. 멤버별 집계
      const records: Omit<MemberActivityRecord, "rank">[] = members.map((member) => {
        const uid = member.userId;

        const postCount = (groupPostRows ?? []).filter(
          (p: { author_id: string }) => p.author_id === uid
        ).length;

        const commentCount = commentRows.filter((c) => c.author_id === uid).length;

        const attendanceCount = attendanceRows.filter((a) => a.user_id === uid).length;

        const financeCount = (financeRows ?? []).filter(
          (f: { created_by: string }) => f.created_by === uid
        ).length;

        const score = calcScore(postCount, commentCount, attendanceCount, financeCount);

        return {
          memberId: member.id,
          userId: uid,
          name: member.nickname || member.profile.name,
          postCount,
          commentCount,
          attendanceCount,
          financeCount,
          score,
        };
      });

      // 6. 종합 점수 내림차순 정렬 후 순위 부여
      records.sort((a, b) => b.score - a.score);

      return records.map((r, i) => ({ ...r, rank: i + 1 }));
    }
  );

  return {
    records: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
