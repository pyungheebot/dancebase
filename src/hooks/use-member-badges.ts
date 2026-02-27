"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { computeBadges } from "@/lib/member-badges";
import type { MemberBadge } from "@/lib/member-badges";

/**
 * 특정 그룹 내 특정 멤버의 성과 뱃지를 계산하는 훅.
 *
 * - 출석 데이터 및 게시글 수를 Supabase에서 조회합니다.
 * - computeBadges()로 뱃지를 클라이언트에서 계산합니다.
 *
 * @param groupId - 그룹 ID
 * @param userId - 사용자 ID
 * @param joinedAt - 가입일 (ISO 문자열)
 * @param role - 그룹 역할 ("leader" | "sub_leader" | "member")
 */
export function useMemberBadges(
  groupId: string,
  userId: string,
  joinedAt: string | null | undefined,
  role: string
): { badges: MemberBadge[]; loading: boolean } {
  const { data, isLoading } = useSWR(
    // userId 또는 groupId가 비어 있으면 fetch 하지 않음
    userId && groupId ? swrKeys.memberBadgeStats(groupId, userId) : null,
    async () => {
      const supabase = createClient();

      // 그룹의 모든 일정 ID 조회
      const { data: schedules, error: schedulesError } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId);

      if (schedulesError) {
        return { totalSchedules: 0, attendedCount: 0, postCount: 0 };
      }

      const scheduleIds = (schedules ?? []).map((s: { id: string }) => s.id);
      const totalSchedules = scheduleIds.length;

      // 해당 유저의 출석 기록 조회 (present 또는 late 만 출석으로 집계)
      let attendedCount = 0;
      if (scheduleIds.length > 0) {
        const { count, error: attendanceError } = await supabase
          .from("attendances")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .in("schedule_id", scheduleIds)
          .in("status", ["present", "late"]);

        if (!attendanceError) {
          attendedCount = count ?? 0;
        }
      }

      // 해당 그룹에서 유저가 작성한 게시글 수 조회
      const { count: postCount, error: postError } = await supabase
        .from("board_posts")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("author_id", userId);

      if (postError) {
        return { totalSchedules, attendedCount, postCount: 0 };
      }

      return {
        totalSchedules,
        attendedCount,
        postCount: postCount ?? 0,
      };
    }
  );

  const badges: MemberBadge[] = data
    ? computeBadges(joinedAt, role, data)
    : [];

  return { badges, loading: isLoading };
}
