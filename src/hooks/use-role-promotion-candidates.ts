"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { EntityMember } from "@/types/entity-context";

/** 승격 후보 조건 */
const MIN_ATTENDANCE_RATE = 0.8; // 80%
const MIN_POST_COUNT = 5;        // 게시글 5건
const MIN_MONTHS_SINCE_JOIN = 3; // 가입 후 3개월

/** 최근 3개월 기준 시작일 계산 */
function getThreeMonthsAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString();
}

export type PromotionCandidate = {
  userId: string;
  memberId: string;
  name: string;
  attendanceRate: number;  // 0~1
  postCount: number;
  joinedAt: string;
  score: number;
};

/**
 * 일반 멤버(role="member") 중 활동도 기준을 충족하는 "승격 후보"를 반환하는 훅.
 *
 * 조건:
 * - 최근 3개월 출석률 80% 이상
 * - 최근 3개월 게시글 5건 이상
 * - 가입 후 3개월 이상 경과
 *
 * @param groupId - 그룹 ID
 * @param members - 엔티티 멤버 목록
 */
export function useRolePromotionCandidates(
  groupId: string,
  members: EntityMember[]
) {
  const regularMembers = members.filter((m) => m.role === "member");

  const { data, isLoading, mutate } = useSWR(
    groupId && regularMembers.length > 0
      ? swrKeys.rolePromotionCandidates(groupId)
      : null,
    async (): Promise<PromotionCandidate[]> => {
      const supabase = createClient();
      const since = getThreeMonthsAgo();
      const memberUserIds = regularMembers.map((m) => m.userId);

      // 1. 최근 3개월 일정 목록 (출석률 분모)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .gte("start_at", since);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);
      const totalSchedules = scheduleIds.length;

      // 2. 출석 기록 (present, late)
      let attendanceRows: { user_id: string }[] = [];
      if (scheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("user_id")
          .in("schedule_id", scheduleIds)
          .in("user_id", memberUserIds)
          .in("status", ["present", "late"]);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");
        attendanceRows = (attData ?? []) as { user_id: string }[];
      }

      // 3. 최근 3개월 게시글 수
      const { data: postRows, error: postErr } = await supabase
        .from("board_posts")
        .select("author_id")
        .eq("group_id", groupId)
        .in("author_id", memberUserIds)
        .gte("created_at", since);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      const now = new Date();
      const candidates: PromotionCandidate[] = [];

      for (const member of regularMembers) {
        // 가입 후 3개월 이상 경과 여부 확인
        if (!member.joinedAt) continue;
        const joinedDate = new Date(member.joinedAt);
        const monthsSinceJoin =
          (now.getFullYear() - joinedDate.getFullYear()) * 12 +
          (now.getMonth() - joinedDate.getMonth());
        if (monthsSinceJoin < MIN_MONTHS_SINCE_JOIN) continue;

        // 출석률 계산
        const attendedCount = attendanceRows.filter(
          (a) => a.user_id === member.userId
        ).length;
        const attendanceRate =
          totalSchedules > 0 ? attendedCount / totalSchedules : 0;
        if (attendanceRate < MIN_ATTENDANCE_RATE) continue;

        // 게시글 수 확인
        const postCount = (postRows ?? []).filter(
          (p: { author_id: string }) => p.author_id === member.userId
        ).length;
        if (postCount < MIN_POST_COUNT) continue;

        // 종합 점수 계산 (출석률×50 + 게시글×3)
        const score = Math.round(attendanceRate * 50 + postCount * 3);

        candidates.push({
          userId: member.userId,
          memberId: member.id,
          name: member.nickname || member.profile.name,
          attendanceRate,
          postCount,
          joinedAt: member.joinedAt,
          score,
        });
      }

      // 점수 내림차순 정렬
      candidates.sort((a, b) => b.score - a.score);

      return candidates;
    }
  );

  return {
    candidates: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
