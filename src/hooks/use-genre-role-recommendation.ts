"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceRole,
  RoleRecommendation,
  RoleRecommendationReason,
  RoleRecommendationState,
} from "@/types";
import type { EntityMember } from "@/types/entity-context";

// ============================================
// localStorage 키 및 헬퍼
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:role-recommendations:${groupId}`;
}

function loadState(groupId: string): RoleRecommendationState {
  if (typeof window === "undefined")
    return { assignments: {}, savedAt: null };
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return { assignments: {}, savedAt: null };
    return JSON.parse(raw) as RoleRecommendationState;
  } catch {
    return { assignments: {}, savedAt: null };
  }
}

function saveState(groupId: string, state: RoleRecommendationState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(state));
  } catch {
    // 무시
  }
}

// ============================================
// Supabase 데이터 타입
// ============================================

type AttendanceRow = {
  user_id: string;
  schedule_id: string;
};

type PostRow = {
  author_id: string;
};

type CommentRow = {
  author_id: string;
};

// ============================================
// 역할 추천 알고리즘 원시 데이터
// ============================================

type MemberRawStats = {
  userId: string;
  attendanceRate: number; // 0~1
  activityCount: number;  // 게시글 + 댓글
  joinedAt: string;       // ISO 날짜
};

/**
 * 가입 일수 계산
 */
function calcMemberDays(joinedAt: string): number {
  const ms = Date.now() - new Date(joinedAt).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/**
 * 원시 통계를 바탕으로 역할과 추천 이유를 결정한다.
 *
 * 우선 순위:
 *  1. 가입 일수 < 30일 → 트레이니
 *  2. 출석률 >= 80% → 메인 댄서
 *  3. 출석률 >= 50% && 활동량 상위 25% → 서포트 댄서
 *  4. 활동량 최상위 (상위 10%) → 코레오그래퍼
 *  5. 가입 일수 >= 180일 && 출석률 >= 60% → 리드
 *  6. 나머지 → 서포트 댄서
 */
function determineRole(
  stats: MemberRawStats,
  allStats: MemberRawStats[]
): { role: DanceRole; reasons: RoleRecommendationReason[] } {
  const reasons: RoleRecommendationReason[] = [];
  const memberDays = calcMemberDays(stats.joinedAt);

  // 활동량 기준값 계산
  const sorted = [...allStats].sort((a, b) => b.activityCount - a.activityCount);
  const totalCount = sorted.length;
  const top10Threshold =
    totalCount > 0 ? sorted[Math.max(0, Math.floor(totalCount * 0.1) - 1)].activityCount : 0;
  const top25Threshold =
    totalCount > 0 ? sorted[Math.max(0, Math.floor(totalCount * 0.25) - 1)].activityCount : 0;

  const attendancePct = Math.round(stats.attendanceRate * 100);

  // 1. 신규 멤버
  if (memberDays < 30) {
    reasons.push("신규 멤버");
    return { role: "트레이니", reasons };
  }

  // 2. 출석률 높음 → 메인 댄서
  if (stats.attendanceRate >= 0.8) {
    reasons.push("출석률 높음");
    if (memberDays >= 180) reasons.push("장기 활동");
    return { role: "메인 댄서", reasons };
  }

  // 3. 활동량 최상위 → 코레오그래퍼
  if (stats.activityCount > 0 && stats.activityCount >= top10Threshold && totalCount >= 5) {
    reasons.push("활동량 높음");
    if (attendancePct >= 50) reasons.push("출석률 높음");
    return { role: "코레오그래퍼", reasons };
  }

  // 4. 장기 활동 + 출석률 적당 → 리드
  if (memberDays >= 180 && stats.attendanceRate >= 0.6) {
    reasons.push("장기 활동");
    if (attendancePct >= 60) reasons.push("출석률 높음");
    return { role: "리드", reasons };
  }

  // 5. 출석률 중간 + 활동량 상위 25% → 서포트 댄서
  if (
    stats.attendanceRate >= 0.5 &&
    stats.activityCount > 0 &&
    stats.activityCount >= top25Threshold
  ) {
    reasons.push("출석률 높음");
    reasons.push("활동량 높음");
    return { role: "서포트 댄서", reasons };
  }

  // 6. 기본 서포트
  if (stats.attendanceRate >= 0.5) {
    reasons.push("출석률 높음");
  } else if (stats.activityCount > 0) {
    reasons.push("활동량 높음");
  }

  return { role: "서포트 댄서", reasons };
}

// ============================================
// useGenreRoleRecommendation 훅
// ============================================

export function useGenreRoleRecommendation(
  groupId: string,
  members: EntityMember[]
) {
  const [state, setStateLocal] = useState<RoleRecommendationState>(() =>
    loadState(groupId)
  );

  // SWR로 원시 데이터 조회
  const { data: rawStats, isLoading } = useSWR(
    groupId && members.length > 0
      ? swrKeys.genreRoleRecommendation(groupId)
      : null,
    async (): Promise<MemberRawStats[]> => {
      const supabase = createClient();
      const memberUserIds = members.map((m) => m.userId);

      // 그룹 내 일정 ID 조회
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map(
        (s: { id: string }) => s.id
      );

      // 출석 데이터 조회
      let attendanceRows: AttendanceRow[] = [];
      if (scheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("user_id, schedule_id")
          .in("schedule_id", scheduleIds)
          .in("user_id", memberUserIds);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");
        attendanceRows = (attData ?? []) as AttendanceRow[];
      }

      // 게시글 데이터 조회
      const { data: postRows, error: postErr } = await supabase
        .from("board_posts")
        .select("author_id")
        .eq("group_id", groupId)
        .in("author_id", memberUserIds);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      // 그룹 내 게시글 ID 목록 (댓글 필터링용)
      const { data: groupPostIds, error: gpiErr } = await supabase
        .from("board_posts")
        .select("id")
        .eq("group_id", groupId);

      if (gpiErr) throw new Error("게시글 ID 조회에 실패했습니다");

      const allGroupPostIds = (groupPostIds ?? []).map(
        (p: { id: string }) => p.id
      );

      // 댓글 데이터 조회
      let commentRows: CommentRow[] = [];
      if (allGroupPostIds.length > 0) {
        const { data: comments, error: commentErr } = await supabase
          .from("board_comments")
          .select("author_id")
          .in("post_id", allGroupPostIds)
          .in("author_id", memberUserIds);

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");
        commentRows = (comments ?? []) as CommentRow[];
      }

      const totalSchedules = scheduleIds.length;

      return members.map((member) => {
        const attended = attendanceRows.filter(
          (a) => a.user_id === member.userId
        ).length;
        const attendanceRate =
          totalSchedules > 0 ? attended / totalSchedules : 0;

        const postCount = (postRows ?? []).filter(
          (p: PostRow) => p.author_id === member.userId
        ).length;
        const commentCount = commentRows.filter(
          (c) => c.author_id === member.userId
        ).length;
        const activityCount = postCount + commentCount;

        return {
          userId: member.userId,
          attendanceRate,
          activityCount,
          joinedAt: member.joinedAt,
        };
      });
    }
  );

  // 추천 목록 계산
  const recommendations: RoleRecommendation[] = (() => {
    if (!rawStats || rawStats.length === 0) return [];

    const memberMap = new Map(members.map((m) => [m.userId, m]));

    return rawStats.map((stats) => {
      const { role, reasons } = determineRole(stats, rawStats);
      const member = memberMap.get(stats.userId);
      const memberDays = calcMemberDays(stats.joinedAt);

      return {
        userId: stats.userId,
        name: member
          ? member.nickname || member.profile.name
          : stats.userId,
        avatarUrl: member?.profile.avatar_url ?? null,
        recommendedRole: role,
        overriddenRole: null,
        reasons,
        attendanceRate: Math.round(stats.attendanceRate * 100),
        activityScore: stats.activityCount,
        memberDays,
      } satisfies RoleRecommendation;
    });
  })();

  // 현재 적용된 역할 (override 우선)
  function getEffectiveRole(userId: string, recommended: DanceRole): DanceRole {
    return state.assignments[userId] ?? recommended;
  }

  // 특정 멤버의 역할 변경
  const overrideRole = useCallback(
    (userId: string, role: DanceRole) => {
      setStateLocal((prev) => {
        const next: RoleRecommendationState = {
          assignments: { ...prev.assignments, [userId]: role },
          savedAt: prev.savedAt,
        };
        return next;
      });
    },
    []
  );

  // 전체 적용 (localStorage 저장)
  const applyAll = useCallback(
    (overrides: Record<string, DanceRole>) => {
      const next: RoleRecommendationState = {
        assignments: overrides,
        savedAt: new Date().toISOString(),
      };
      setStateLocal(next);
      saveState(groupId, next);
    },
    [groupId]
  );

  // 초기화
  const resetAll = useCallback(() => {
    const next: RoleRecommendationState = {
      assignments: {},
      savedAt: null,
    };
    setStateLocal(next);
    saveState(groupId, next);
  }, [groupId]);

  return {
    recommendations,
    loading: isLoading,
    state,
    getEffectiveRole,
    overrideRole,
    applyAll,
    resetAll,
  };
}
