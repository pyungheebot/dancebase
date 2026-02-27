"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { PairingRecommendation, PairingState, PairingSimilarityTag } from "@/types";
import type { EntityMember } from "@/types/entity-context";

// ============================================
// localStorage 키 및 헬퍼
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:member-pairing:${groupId}`;
}

function loadPairingState(groupId: string): PairingState {
  if (typeof window === "undefined") return { dismissed: [], accepted: [] };
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return { dismissed: [], accepted: [] };
    return JSON.parse(raw) as PairingState;
  } catch {
    return { dismissed: [], accepted: [] };
  }
}

function savePairingState(groupId: string, state: PairingState): void {
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
// 호환성 점수 계산 원시 데이터
// ============================================

type MemberRawStats = {
  userId: string;
  attendanceRate: number;   // 0~1
  activityCount: number;    // 게시글 + 댓글 합계
  joinedAt: string;         // ISO 날짜
};

/**
 * 두 값의 유사도 점수를 반환 (0~1).
 * 차이가 0이면 1, 차이가 크면 0에 가까워짐.
 */
function similarity(a: number, b: number, maxDiff: number): number {
  const diff = Math.abs(a - b);
  return Math.max(0, 1 - diff / maxDiff);
}

/**
 * 두 멤버의 호환성 점수(0~100)와 유사 태그를 계산한다.
 */
function calcCompatibility(
  a: MemberRawStats,
  b: MemberRawStats,
  maxActivity: number,
  maxJoinDiffDays: number
): { score: number; tags: PairingSimilarityTag[] } {
  const tags: PairingSimilarityTag[] = [];

  // 출석률 유사도 (0~1 범위 차이 기준)
  const attendanceSim = similarity(a.attendanceRate, b.attendanceRate, 1);
  if (attendanceSim >= 0.8) tags.push("출석률 유사");

  // 활동 빈도 유사도 (최대 활동 수 기준)
  const activitySim =
    maxActivity > 0
      ? similarity(a.activityCount, b.activityCount, maxActivity)
      : 1;
  if (activitySim >= 0.8) tags.push("활동 유사");

  // 가입 시기 유사도 (최대 차이일 기준)
  const daysDiff =
    Math.abs(
      new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    ) /
    (1000 * 60 * 60 * 24);
  const joinSim =
    maxJoinDiffDays > 0 ? similarity(daysDiff, 0, maxJoinDiffDays) : 1;
  if (joinSim >= 0.8) tags.push("가입 시기 유사");

  // 가중 평균 (출석률 40%, 활동 40%, 가입 시기 20%)
  const score = Math.round(
    (attendanceSim * 0.4 + activitySim * 0.4 + joinSim * 0.2) * 100
  );

  return { score, tags };
}

// ============================================
// useMemberPairing 훅
// ============================================

export function useMemberPairing(
  groupId: string,
  members: EntityMember[],
  currentUserId: string
) {
  const [pairingState, setPairingStateLocal] = useState<PairingState>(() =>
    loadPairingState(groupId)
  );

  // SWR로 원시 데이터 조회 (출석 + 게시글 + 댓글)
  const { data: rawStats, isLoading } = useSWR(
    groupId && members.length > 1
      ? swrKeys.memberPairing(groupId)
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

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

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

      const allGroupPostIds = (groupPostIds ?? []).map((p: { id: string }) => p.id);

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
        // 출석률
        const attended = attendanceRows.filter(
          (a) => a.user_id === member.userId
        ).length;
        const attendanceRate =
          totalSchedules > 0 ? attended / totalSchedules : 0;

        // 활동 수 (게시글 + 댓글)
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

  // 추천 목록 계산 (현재 사용자 기준 상위 5명)
  const recommendations: PairingRecommendation[] = (() => {
    if (!rawStats || rawStats.length < 2) return [];

    const currentStats = rawStats.find((s) => s.userId === currentUserId);
    if (!currentStats) return [];

    const others = rawStats.filter((s) => s.userId !== currentUserId);
    const maxActivity = Math.max(...rawStats.map((s) => s.activityCount), 1);

    // 가입 시기 최대 차이 (일 단위)
    const joinDates = rawStats.map((s) => new Date(s.joinedAt).getTime());
    const maxJoinDiffDays =
      joinDates.length > 1
        ? (Math.max(...joinDates) - Math.min(...joinDates)) /
          (1000 * 60 * 60 * 24)
        : 1;

    const memberMap = new Map(members.map((m) => [m.userId, m]));

    return others
      .map((other) => {
        const { score, tags } = calcCompatibility(
          currentStats,
          other,
          maxActivity,
          Math.max(maxJoinDiffDays, 1)
        );
        const member = memberMap.get(other.userId);
        return {
          userId: other.userId,
          name: member
            ? member.nickname || member.profile.name
            : other.userId,
          avatarUrl: member?.profile.avatar_url ?? null,
          score,
          similarityTags: tags,
        } satisfies PairingRecommendation;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  })();

  // 숨김 처리되지 않은 추천만 노출
  const visibleRecommendations = recommendations.filter(
    (r) => !pairingState.dismissed.includes(r.userId)
  );

  // 숨긴 추천 목록
  const dismissedRecommendations = recommendations.filter((r) =>
    pairingState.dismissed.includes(r.userId)
  );

  // 페어링 상태 업데이트 헬퍼
  const updateState = useCallback(
    (updater: (prev: PairingState) => PairingState) => {
      setPairingStateLocal((prev) => {
        const next = updater(prev);
        savePairingState(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  // 추천 숨기기 (관심 없음)
  const dismiss = useCallback(
    (userId: string) => {
      updateState((prev) => ({
        ...prev,
        dismissed: prev.dismissed.includes(userId)
          ? prev.dismissed
          : [...prev.dismissed, userId],
      }));
    },
    [updateState]
  );

  // 숨김 복원
  const restore = useCallback(
    (userId: string) => {
      updateState((prev) => ({
        ...prev,
        dismissed: prev.dismissed.filter((id) => id !== userId),
      }));
    },
    [updateState]
  );

  // 전체 숨김 초기화
  const restoreAll = useCallback(() => {
    updateState((prev) => ({ ...prev, dismissed: [] }));
  }, [updateState]);

  return {
    recommendations,
    visibleRecommendations,
    dismissedRecommendations,
    loading: isLoading,
    dismiss,
    restore,
    restoreAll,
  };
}
