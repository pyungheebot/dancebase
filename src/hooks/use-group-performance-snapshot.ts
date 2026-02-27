"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  GroupPerformanceSnapshotData,
  PerformancePeriod,
  PerformanceMetric,
  TopContributor,
} from "@/types";

// -----------------------------------------------
// 날짜 범위 유틸
// -----------------------------------------------

type DateRange = { start: string; end: string };

function getWeekRange(offsetWeeks = 0): DateRange {
  const now = new Date();
  // 이번 주 월요일 00:00:00 기준
  const dayOfWeek = now.getDay(); // 0=일, 1=월 ... 6=토
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek) - offsetWeeks * 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  return {
    start: monday.toISOString(),
    end: nextMonday.toISOString(),
  };
}

function getMonthRange(offsetMonths = 0): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - offsetMonths; // JS month: 0-based

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getRange(period: PerformancePeriod, offset = 0): DateRange {
  return period === "week" ? getWeekRange(offset) : getMonthRange(offset);
}

// -----------------------------------------------
// 변화율 계산
// -----------------------------------------------

function calcChangeRate(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : null;
  return Math.round(((current - previous) / previous) * 100);
}

// -----------------------------------------------
// 핵심 데이터 페칭 함수
// -----------------------------------------------

async function fetchSnapshotForRange(
  supabase: ReturnType<typeof createClient>,
  groupId: string,
  range: DateRange
): Promise<{
  scheduleCount: number;
  attendanceRate: number;
  contentCount: number;
  newMemberCount: number;
  topContributor: TopContributor | null;
}> {
  const { start, end } = range;

  // 1. 병렬 조회: 일정, 게시글, 게시글 작성자(최고 기여자용), 댓글, 신규 멤버
  const [schedulesRes, postsRes, commentsRes, newMembersRes] = await Promise.all([
    // 일정 목록 (출석 집계 위해 id 필요)
    supabase
      .from("schedules")
      .select("id")
      .eq("group_id", groupId)
      .gte("starts_at", start)
      .lt("starts_at", end),

    // 게시글 수 + 작성자 정보 (최고 기여자 계산용)
    supabase
      .from("board_posts")
      .select("id, author_id, profiles!inner(id, name, avatar_url)")
      .eq("group_id", groupId)
      .gte("created_at", start)
      .lt("created_at", end),

    // 댓글 수 (group_id 필터 via board_posts join)
    supabase
      .from("board_comments")
      .select("id, author_id, board_posts!inner(group_id)")
      .eq("board_posts.group_id", groupId)
      .gte("created_at", start)
      .lt("created_at", end),

    // 신규 멤버 수
    supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .gte("joined_at", start)
      .lt("joined_at", end),
  ]);

  // 2. 일정 수 집계
  const scheduleRows = schedulesRes.data ?? [];
  const scheduleCount = scheduleRows.length;

  // 3. 출석률 계산 (해당 기간 일정의 출석 기록)
  let attendanceRate = 0;
  if (scheduleRows.length > 0) {
    const scheduleIds = scheduleRows.map((s: { id: string }) => s.id);
    const { data: attendanceRows } = await supabase
      .from("attendance")
      .select("status")
      .in("schedule_id", scheduleIds);

    const records = attendanceRows ?? [];
    const present = records.filter(
      (a: { status: string }) => a.status === "present" || a.status === "late"
    ).length;
    const absent = records.filter(
      (a: { status: string }) => a.status === "absent"
    ).length;
    const total = present + absent;
    attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
  }

  // 4. 콘텐츠 수 (게시글 + 댓글)
  const postRows = postsRes.data ?? [];
  const commentRows = commentsRes.data ?? [];
  const contentCount = postRows.length + commentRows.length;

  // 5. 최고 기여자 계산 (게시글 + 댓글 합산)
  const authorMap = new Map<
    string,
    { name: string; avatarUrl: string | null; count: number }
  >();

  for (const post of postRows) {
    const profile = Array.isArray(post.profiles)
      ? post.profiles[0]
      : post.profiles;
    if (!post.author_id || !profile) continue;
    const existing = authorMap.get(post.author_id);
    if (existing) {
      existing.count += 1;
    } else {
      authorMap.set(post.author_id, {
        name: profile.name ?? "알 수 없음",
        avatarUrl: profile.avatar_url ?? null,
        count: 1,
      });
    }
  }

  for (const comment of commentRows) {
    if (!comment.author_id) continue;
    const existing = authorMap.get(comment.author_id);
    if (existing) {
      existing.count += 1;
    } else {
      // 댓글 작성자의 프로필은 별도 조회 필요 — 여기서는 이름 없이 카운트만 누적
      authorMap.set(comment.author_id, {
        name: "알 수 없음",
        avatarUrl: null,
        count: 1,
      });
    }
  }

  let topContributor: TopContributor | null = null;
  let maxCount = 0;
  for (const [userId, info] of authorMap.entries()) {
    if (info.count > maxCount) {
      maxCount = info.count;
      topContributor = {
        userId,
        name: info.name,
        avatarUrl: info.avatarUrl,
        activityCount: info.count,
      };
    }
  }

  // 댓글 전용 작성자의 프로필을 보완 (이름이 "알 수 없음"인 경우)
  if (topContributor && topContributor.name === "알 수 없음") {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", topContributor.userId)
      .single();
    if (profileData) {
      topContributor = {
        ...topContributor,
        name: profileData.name ?? "알 수 없음",
        avatarUrl: profileData.avatar_url ?? null,
      };
    }
  }

  return {
    scheduleCount,
    attendanceRate,
    contentCount,
    newMemberCount: newMembersRes.count ?? 0,
    topContributor,
  };
}

// -----------------------------------------------
// Hook
// -----------------------------------------------

export function useGroupPerformanceSnapshot(
  groupId: string,
  period: PerformancePeriod
) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupPerformanceSnapshot(groupId, period) : null,
    async (): Promise<GroupPerformanceSnapshotData> => {
      const supabase = createClient();

      const currentRange = getRange(period, 0);
      const prevRange = getRange(period, 1);

      // 현재 기간과 이전 기간 병렬 조회
      const [current, previous] = await Promise.all([
        fetchSnapshotForRange(supabase, groupId, currentRange),
        fetchSnapshotForRange(supabase, groupId, prevRange),
      ]);

      const makeMetric = (
        currentVal: number,
        previousVal: number
      ): PerformanceMetric => ({
        value: currentVal,
        changeRate: calcChangeRate(currentVal, previousVal),
      });

      return {
        period,
        scheduleCount: makeMetric(current.scheduleCount, previous.scheduleCount),
        attendanceRate: makeMetric(current.attendanceRate, previous.attendanceRate),
        contentCount: makeMetric(current.contentCount, previous.contentCount),
        newMemberCount: makeMetric(current.newMemberCount, previous.newMemberCount),
        topContributor: current.topContributor,
      };
    }
  );

  return {
    snapshot: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
