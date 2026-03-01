"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { GroupHealthSuggestionsData, HealthSuggestion } from "@/types";

/**
 * 그룹 건강도 개선 제안 훅
 *
 * 최근 30일 기준으로 3가지 지표를 측정하고 맞춤형 개선 제안을 생성합니다.
 * - 출석률: present+late / 전체 출석 가능 수 (스케줄 수 x 멤버 수)
 * - 게시판 활동도: 최근 30일 게시글+댓글 수 → 주당 평균 환산
 * - 비활성 멤버 비율: 30일 내 활동(출석/게시글/댓글) 없는 멤버 수 / 전체
 *
 * 종합 점수: 출석률*50 + 활동도*30 + 유지율*20
 */
export function useGroupHealthSuggestions(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupHealthSuggestions(groupId) : null,
    async (): Promise<GroupHealthSuggestionsData> => {
      const supabase = createClient();

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();
      const nowIso = now.toISOString();

      // =========================================
      // 1. 현재 멤버 수 + 멤버 user_id 목록
      // =========================================
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("user_id, joined_at")
        .eq("group_id", groupId);

      if (memberErr) throw new Error("멤버 데이터를 불러오지 못했습니다");

      const allMembers = (memberRows ?? []) as { user_id: string; joined_at: string }[];
      const currentMemberCount = allMembers.length;
      const memberUserIds = allMembers.map((m) => m.user_id);

      // 30일 이전에 가입한 멤버 (유지율 계산용)
      const oldMemberCount = allMembers.filter(
        (m) => new Date(m.joined_at) < thirtyDaysAgo
      ).length;

      // 멤버 유지율
      let retentionRate: number | null = null;
      if (currentMemberCount > 0 && oldMemberCount > 0) {
        retentionRate = Math.min(1, oldMemberCount / currentMemberCount);
      }

      // =========================================
      // 2. 출석률
      // =========================================
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", thirtyDaysAgoIso)
        .lte("starts_at", nowIso);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      let attendanceRate: number | null = null;
      const activeUserIds = new Set<string>();

      if (scheduleIds.length > 0 && currentMemberCount > 0) {
        const { data: attRows, error: attErr } = await supabase
          .from("attendance")
          .select("status, user_id")
          .in("schedule_id", scheduleIds);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");

        const attList = (attRows ?? []) as { status: string; user_id: string }[];
        const totalPossible = scheduleIds.length * currentMemberCount;
        const presentList = attList.filter(
          (a) => a.status === "present" || a.status === "late"
        );
        const presentCount = presentList.length;

        attendanceRate = totalPossible > 0 ? presentCount / totalPossible : null;

        // 출석한 user_id 수집 (비활성 멤버 계산에 사용)
        for (const att of presentList) {
          if (att.user_id) activeUserIds.add(att.user_id);
        }
      }

      // =========================================
      // 3. 최근 30일 게시글 + 댓글 수
      // board_comments에는 group_id가 없으므로 board_posts를 먼저 조회한 뒤
      // post_id 목록을 기반으로 댓글을 조회합니다.
      // =========================================
      const { data: postData, error: postErr } = await supabase
        .from("board_posts")
        .select("id, author_id")
        .eq("group_id", groupId)
        .gte("created_at", thirtyDaysAgoIso);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      const postRows = (postData ?? []) as { id: string; author_id: string }[];
      const postCount = postRows.length;
      const recentPostIds = postRows.map((p) => p.id);

      // 댓글은 최근 30일 게시글에 달린 것들 중 최근 30일 내 작성된 것
      let commentRows: { id: string; author_id: string }[] = [];
      if (recentPostIds.length > 0) {
        const { data: commentData, error: commentErr } = await supabase
          .from("board_comments")
          .select("id, author_id")
          .in("post_id", recentPostIds)
          .gte("created_at", thirtyDaysAgoIso);

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");
        commentRows = (commentData ?? []) as { id: string; author_id: string }[];
      }

      const commentCount = commentRows.length;
      const totalActivityCount = postCount + commentCount;

      // 주당 평균 활동 수 (30일 = 약 4.3주)
      const weeksIn30Days = 30 / 7;
      const activityWeeklyCount = totalActivityCount / weeksIn30Days;

      // 게시글/댓글 작성한 user_id 수집
      for (const post of postRows) {
        if (post.author_id) activeUserIds.add(post.author_id);
      }
      for (const comment of commentRows) {
        if (comment.author_id) activeUserIds.add(comment.author_id);
      }

      // 활동도 비율 (멤버 1인당 월 1개 이상이면 100%)
      let activityRate: number | null = null;
      if (currentMemberCount > 0) {
        activityRate = Math.min(1, (postCount) / currentMemberCount);
      }

      // =========================================
      // 4. 비활성 멤버 비율
      // =========================================
      let inactiveMemberRatio: number | null = null;
      if (currentMemberCount > 0 && memberUserIds.length > 0) {
        const activeCount = memberUserIds.filter((uid) => activeUserIds.has(uid)).length;
        const inactiveCount = currentMemberCount - activeCount;
        inactiveMemberRatio = inactiveCount / currentMemberCount;
      }

      // =========================================
      // 5. 종합 점수 계산
      // =========================================
      const hasEnoughData =
        attendanceRate !== null || activityRate !== null || retentionRate !== null;

      let score: number | null = null;
      if (hasEnoughData) {
        const att = attendanceRate ?? 0;
        const act = activityRate ?? 0;
        const ret = retentionRate ?? 0;

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

      // =========================================
      // 6. 개선 제안 생성
      // =========================================
      const suggestions: HealthSuggestion[] = [];

      if (score !== null && score >= 80) {
        suggestions.push({
          type: "success",
          message: "그룹이 매우 건강하게 운영되고 있습니다. 지금처럼 유지해주세요!",
        });
      } else {
        // 출석률 경고: 출석률 < 70%
        if (attendanceRate !== null && attendanceRate < 0.7) {
          suggestions.push({
            type: "warning",
            message: "출석률이 낮습니다. 일정 알림을 활성화해보세요.",
            actionLabel: "일정 관리",
          });
        }

        // 게시판 활동 경고: 주당 2회 미만
        if (activityWeeklyCount < 2) {
          suggestions.push({
            type: "info",
            message: "게시판 활동이 부족합니다. 주간 루틴 공유를 시작해보세요.",
            actionLabel: "게시판 열기",
          });
        }

        // 비활성 멤버 경고: 비활성 비율 > 30%
        if (inactiveMemberRatio !== null && inactiveMemberRatio > 0.3) {
          suggestions.push({
            type: "warning",
            message: "비활성 멤버가 많습니다. 재참여 메시지를 보내보세요.",
            actionLabel: "멤버 관리",
          });
        }

        // 모든 지표가 괜찮으면 긍정 메시지
        if (suggestions.length === 0 && hasEnoughData) {
          suggestions.push({
            type: "info",
            message: "그룹 건강도를 꾸준히 유지하고 있습니다. 더 나은 활동을 위해 노력해보세요.",
          });
        }
      }

      return {
        score,
        attendanceRate,
        activityWeeklyCount,
        inactiveMemberRatio,
        suggestions,
        hasEnoughData,
      };
    }
  );

  const defaultData: GroupHealthSuggestionsData = {
    score: null,
    attendanceRate: null,
    activityWeeklyCount: null,
    inactiveMemberRatio: null,
    suggestions: [],
    hasEnoughData: false,
  };

  return {
    data: data ?? defaultData,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
