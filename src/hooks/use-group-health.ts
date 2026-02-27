"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type GroupHealthData = {
  // 출석률 (0~1)
  attendanceRate: number | null;
  // 활동도 (게시글 수 / 멤버 수, 0~1 클램핑)
  activityRate: number | null;
  // 멤버 유지율 (0~1)
  retentionRate: number | null;
  // 종합 점수 (0~100)
  score: number | null;
  // 데이터 충분 여부
  hasEnoughData: boolean;
};

/**
 * 그룹 건강도 지수 훅
 *
 * 최근 30일 기준:
 * - 출석률: attendance (present+late) / total attendance records
 * - 활동도: board_posts 수 / 멤버 수 (1 이상이면 100%)
 * - 멤버 유지율: 현재 멤버 / (현재 멤버 + 30일 내 탈퇴한 멤버) — 단순히 가입일 기준으로는
 *               30일 이전에 가입한 멤버 수 / 현재 전체 멤버 수로 근사
 *
 * 종합 점수: 출석률*50 + 활동도*30 + 유지율*20
 */
export function useGroupHealth(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupHealth(groupId) : null,
    async (): Promise<GroupHealthData> => {
      const supabase = createClient();

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

      // =========================================
      // 1. 현재 멤버 수 + 30일 이전 가입 멤버 수
      // =========================================
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("joined_at")
        .eq("group_id", groupId);

      if (memberErr) throw new Error("멤버 데이터를 불러오지 못했습니다");

      const allMembers = (memberRows ?? []) as { joined_at: string }[];
      const currentMemberCount = allMembers.length;

      // 30일 이전에 가입한 멤버 (유지율 계산용)
      const oldMemberCount = allMembers.filter(
        (m) => new Date(m.joined_at) < thirtyDaysAgo
      ).length;

      // 멤버 유지율: 현재 활성 멤버 중 30일 이전부터 있었던 비율
      // 멤버가 없으면 null
      let retentionRate: number | null = null;
      if (currentMemberCount > 0 && oldMemberCount > 0) {
        retentionRate = Math.min(1, oldMemberCount / currentMemberCount);
      } else if (currentMemberCount > 0 && oldMemberCount === 0) {
        // 그룹이 30일 미만 — 데이터 부족
        retentionRate = null;
      }

      // =========================================
      // 2. 최근 30일 내 출석 기록
      // =========================================
      // 최근 30일 내 schedules 조회 (출석 방식이 none이 아닌 것)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", thirtyDaysAgoIso)
        .lte("starts_at", now.toISOString());

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      let attendanceRate: number | null = null;

      if (scheduleIds.length > 0 && currentMemberCount > 0) {
        const { data: attRows, error: attErr } = await supabase
          .from("attendance")
          .select("status")
          .in("schedule_id", scheduleIds);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");

        const attList = (attRows ?? []) as { status: string }[];
        const totalPossible = scheduleIds.length * currentMemberCount;
        const presentCount = attList.filter(
          (a) => a.status === "present" || a.status === "late"
        ).length;

        attendanceRate = totalPossible > 0 ? presentCount / totalPossible : null;
      }

      // =========================================
      // 3. 최근 30일 게시글 수 / 멤버 수
      // =========================================
      const { count: postCount, error: postErr } = await supabase
        .from("board_posts")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId)
        .gte("created_at", thirtyDaysAgoIso);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      let activityRate: number | null = null;
      if (currentMemberCount > 0) {
        // 멤버 1인당 1개 이상이면 100%로 간주
        activityRate = Math.min(1, (postCount ?? 0) / currentMemberCount);
      }

      // =========================================
      // 4. 종합 점수 계산
      // =========================================
      const hasEnoughData =
        attendanceRate !== null || activityRate !== null || retentionRate !== null;

      let score: number | null = null;
      if (hasEnoughData) {
        const att = attendanceRate ?? 0;
        const act = activityRate ?? 0;
        const ret = retentionRate ?? 0;

        // 각 항목이 null인 경우 해당 가중치를 재분배
        const attWeight = attendanceRate !== null ? 50 : 0;
        const actWeight = activityRate !== null ? 30 : 0;
        const retWeight = retentionRate !== null ? 20 : 0;
        const totalWeight = attWeight + actWeight + retWeight;

        if (totalWeight > 0) {
          const rawScore =
            (att * attWeight + act * actWeight + ret * retWeight) / totalWeight;
          score = Math.round(rawScore * 100);
        }
      }

      return {
        attendanceRate,
        activityRate,
        retentionRate,
        score,
        hasEnoughData,
      };
    }
  );

  return {
    health: data ?? {
      attendanceRate: null,
      activityRate: null,
      retentionRate: null,
      score: null,
      hasEnoughData: false,
    },
    loading: isLoading,
    refetch: () => mutate(),
  };
}
