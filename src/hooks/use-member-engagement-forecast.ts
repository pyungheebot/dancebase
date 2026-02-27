"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MemberEngagementForecast,
  MemberEngagementForecastResult,
  MemberEngagementLevel,
} from "@/types";

const CACHE_KEY = (groupId: string) =>
  `dancebase:engagement-forecast:${groupId}`;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

type CacheEntry = {
  data: MemberEngagementForecastResult;
  cachedAt: number;
};

function loadCache(groupId: string): MemberEngagementForecastResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY(groupId));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    const isExpired = Date.now() - entry.cachedAt > CACHE_TTL_MS;
    if (isExpired) {
      localStorage.removeItem(CACHE_KEY(groupId));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function saveCache(groupId: string, data: MemberEngagementForecastResult) {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { data, cachedAt: Date.now() };
    localStorage.setItem(CACHE_KEY(groupId), JSON.stringify(entry));
  } catch {
    // localStorage 저장 실패 시 무시
  }
}

function buildEmptyResult(): MemberEngagementForecastResult {
  return {
    forecasts: [],
    totalCount: 0,
    riskCount: 0,
    lowCount: 0,
    mediumCount: 0,
    highCount: 0,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 멤버 관여도 예측 훅
 *
 * 최근 3개월(90일)간 멤버별 출석/게시글/댓글 패턴을 분석하여
 * 이탈 위험도를 자동 예측합니다.
 *
 * 점수 계산:
 * - 출석 가중치 50%: 최근 30일 출석률 × 50
 * - 게시글 가중치 30%: 게시글 수 기반 (최대 30점)
 * - 댓글 가중치 20%: 댓글 수 기반 (최대 20점)
 *
 * 관여도 수준:
 * - high:   75 이상
 * - medium: 50 이상
 * - low:    25 이상
 * - risk:   25 미만
 *
 * 추세:
 * - improving:  최근 30일 출석률 > 이전 30일 + 10%p
 * - declining:  최근 30일 출석률 < 이전 30일 - 10%p
 * - stable:     그 외
 */
export function useMemberEngagementForecast(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.memberEngagementForecast(groupId) : null,
    async (): Promise<MemberEngagementForecastResult> => {
      // 캐시 우선 조회
      const cached = loadCache(groupId);
      if (cached) return cached;

      const supabase = createClient();

      const now = new Date();
      const daysAgo = (n: number) =>
        new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

      const t30 = daysAgo(30);   // 최근 30일 기준
      const t60 = daysAgo(60);   // 31-60일 기준
      const t90 = daysAgo(90);   // 90일 기준 (게시판)
      const nowIso = now.toISOString();

      // =========================================
      // 1. 멤버 목록 + 프로필 (display_name)
      // =========================================
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("user_id, profiles(name)")
        .eq("group_id", groupId);

      if (memberErr) throw new Error("멤버 데이터를 불러오지 못했습니다");
      if (!memberRows || memberRows.length === 0) {
        return buildEmptyResult();
      }

      type MemberRow = {
        user_id: string;
        profiles: { name: string } | null;
      };
      const members = memberRows as MemberRow[];
      const memberUserIds = members.map((m) => m.user_id);

      // =========================================
      // 2. 일정 목록 (최근 60일 - 출석률 비교용)
      // =========================================
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", t60)
        .lte("starts_at", nowIso);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const allSchedules = (scheduleRows ?? []) as {
        id: string;
        starts_at: string;
      }[];

      // 최근 30일 일정 ID
      const recentScheduleIds = allSchedules
        .filter((s) => s.starts_at >= t30)
        .map((s) => s.id);

      // 31-60일 전 일정 ID
      const previousScheduleIds = allSchedules
        .filter((s) => s.starts_at >= t60 && s.starts_at < t30)
        .map((s) => s.id);

      // =========================================
      // 3. 출석 데이터 (최근 60일)
      // =========================================
      const allScheduleIds = allSchedules.map((s) => s.id);

      type AttRow = { user_id: string; status: string; schedule_id: string };
      let attRows: AttRow[] = [];

      if (allScheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("user_id, status, schedule_id")
          .in("schedule_id", allScheduleIds);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");
        attRows = (attData ?? []) as AttRow[];
      }

      // 멤버별 최근 30일 출석 수
      const recentPresentByUser: Record<string, number> = {};
      // 멤버별 31-60일 출석 수
      const previousPresentByUser: Record<string, number> = {};

      for (const uid of memberUserIds) {
        recentPresentByUser[uid] = 0;
        previousPresentByUser[uid] = 0;
      }

      for (const att of attRows) {
        if (
          att.status !== "present" &&
          att.status !== "late"
        ) continue;

        const uid = att.user_id;
        if (!Object.prototype.hasOwnProperty.call(recentPresentByUser, uid)) continue;

        if (recentScheduleIds.includes(att.schedule_id)) {
          recentPresentByUser[uid]++;
        } else if (previousScheduleIds.includes(att.schedule_id)) {
          previousPresentByUser[uid]++;
        }
      }

      // =========================================
      // 4. 게시글 수 (최근 90일)
      // =========================================
      const { data: postData, error: postErr } = await supabase
        .from("board_posts")
        .select("id, author_id")
        .eq("group_id", groupId)
        .gte("created_at", t90);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      const postRows = (postData ?? []) as { id: string; author_id: string }[];
      const postIds = postRows.map((p) => p.id);

      const postCountByUser: Record<string, number> = {};
      for (const uid of memberUserIds) postCountByUser[uid] = 0;

      for (const post of postRows) {
        if (Object.prototype.hasOwnProperty.call(postCountByUser, post.author_id)) {
          postCountByUser[post.author_id]++;
        }
      }

      // =========================================
      // 5. 댓글 수 (최근 90일)
      // =========================================
      type CommentRow = { author_id: string };
      let commentRows: CommentRow[] = [];

      if (postIds.length > 0) {
        const { data: commentData, error: commentErr } = await supabase
          .from("board_comments")
          .select("author_id")
          .in("post_id", postIds)
          .gte("created_at", t90);

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");
        commentRows = (commentData ?? []) as CommentRow[];
      }

      const commentCountByUser: Record<string, number> = {};
      for (const uid of memberUserIds) commentCountByUser[uid] = 0;

      for (const comment of commentRows) {
        if (Object.prototype.hasOwnProperty.call(commentCountByUser, comment.author_id)) {
          commentCountByUser[comment.author_id]++;
        }
      }

      // =========================================
      // 6. 멤버별 관여도 점수 계산
      // =========================================
      const forecasts: MemberEngagementForecast[] = [];

      // 게시글/댓글 상한선 (점수 정규화용)
      // 90일간 합리적 최대치: 게시글 10개, 댓글 20개
      const MAX_POSTS = 10;
      const MAX_COMMENTS = 20;

      for (const member of members) {
        const uid = member.user_id;
        const displayName = member.profiles?.name ?? "알 수 없음";

        // 출석률 계산
        const recentTotal = recentScheduleIds.length;
        const previousTotal = previousScheduleIds.length;

        const recentAttendanceRate =
          recentTotal > 0
            ? Math.round((recentPresentByUser[uid] / recentTotal) * 100)
            : 0;

        const previousAttendanceRate =
          previousTotal > 0
            ? Math.round((previousPresentByUser[uid] / previousTotal) * 100)
            : 0;

        const postCount = postCountByUser[uid] ?? 0;
        const commentCount = commentCountByUser[uid] ?? 0;

        // 점수 계산 (0-100)
        // - 출석 50점: 최근 30일 출석률 × 0.5
        // - 게시글 30점: min(postCount / MAX_POSTS, 1) × 30
        // - 댓글 20점: min(commentCount / MAX_COMMENTS, 1) × 20
        const attendanceScore = recentAttendanceRate * 0.5;
        const postScore = Math.min(postCount / MAX_POSTS, 1) * 30;
        const commentScore = Math.min(commentCount / MAX_COMMENTS, 1) * 20;
        const engagementScore = Math.round(
          attendanceScore + postScore + commentScore
        );

        // 관여도 수준 결정
        let level: MemberEngagementLevel;
        if (engagementScore >= 75) level = "high";
        else if (engagementScore >= 50) level = "medium";
        else if (engagementScore >= 25) level = "low";
        else level = "risk";

        // 추세: 최근 30일 vs 이전 30일 출석률 비교
        // (이전 30일 일정이 없으면 stable)
        let trend: "improving" | "declining" | "stable";
        if (previousTotal === 0) {
          trend = "stable";
        } else {
          const diff = recentAttendanceRate - previousAttendanceRate;
          if (diff > 10) trend = "improving";
          else if (diff < -10) trend = "declining";
          else trend = "stable";
        }

        forecasts.push({
          userId: uid,
          displayName,
          recentAttendanceRate,
          previousAttendanceRate,
          postCount,
          commentCount,
          engagementScore,
          level,
          trend,
        });
      }

      // 위험 우선 정렬: risk → low → medium → high, 같은 level 내에서는 score 오름차순
      const levelOrder: Record<MemberEngagementLevel, number> = {
        risk: 0,
        low: 1,
        medium: 2,
        high: 3,
      };
      forecasts.sort((a, b) => {
        const orderDiff = levelOrder[a.level] - levelOrder[b.level];
        if (orderDiff !== 0) return orderDiff;
        return a.engagementScore - b.engagementScore;
      });

      // 집계
      const riskCount = forecasts.filter((f) => f.level === "risk").length;
      const lowCount = forecasts.filter((f) => f.level === "low").length;
      const mediumCount = forecasts.filter((f) => f.level === "medium").length;
      const highCount = forecasts.filter((f) => f.level === "high").length;

      const result: MemberEngagementForecastResult = {
        forecasts,
        totalCount: forecasts.length,
        riskCount,
        lowCount,
        mediumCount,
        highCount,
        generatedAt: new Date().toISOString(),
      };

      // localStorage 캐시 저장
      saveCache(groupId, result);

      return result;
    }
  );

  return {
    data: data ?? buildEmptyResult(),
    loading: isLoading,
    refetch: () => mutate(),
  };
}
