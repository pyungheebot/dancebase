"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type MemberActivityTrendPoint = {
  /** ISO 주차 레이블 (예: "2025-W08") */
  week: string;
  /** 주차 표시용 짧은 레이블 (예: "8주전", "이번주") */
  label: string;
  posts: number;
  comments: number;
  attendances: number;
};

/**
 * ISO week 번호 계산 (목요일 기준 ISO 8601)
 * 반환: { year, week }
 */
function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // 해당 날짜가 속하는 주의 목요일로 이동
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/**
 * ISO 주차 문자열 생성 (예: "2025-W08")
 */
function isoWeekKey(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * N주 전 월요일 00:00:00 UTC 반환
 */
function weeksAgoMonday(n: number): Date {
  const now = new Date();
  // 오늘의 요일 (0=일,1=월,...,6=토) → 이번 주 월요일 구하기
  const dayOfWeek = now.getUTCDay() || 7; // 일=7 처리
  const thisMonday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (dayOfWeek - 1))
  );
  // n주 전 월요일
  thisMonday.setUTCDate(thisMonday.getUTCDate() - n * 7);
  return thisMonday;
}

/**
 * 특정 멤버의 최근 N주 주별 활동(게시글/댓글/출석) 추세 조회 훅
 */
export function useMemberActivityTrend(
  groupId: string,
  userId: string,
  weeks: number = 8
) {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId ? swrKeys.memberActivityTrend(groupId, userId, weeks) : null,
    async (): Promise<MemberActivityTrendPoint[]> => {
      const supabase = createClient();

      // 조회 시작일: weeks주 전 월요일
      const since = weeksAgoMonday(weeks);
      const sinceIso = since.toISOString();

      // 1. 주차 레이블 배열 사전 생성 (오래된 순)
      const weekKeys: string[] = [];
      for (let i = weeks - 1; i >= 0; i--) {
        const monday = weeksAgoMonday(i);
        const { year, week } = getISOWeek(monday);
        weekKeys.push(isoWeekKey(year, week));
      }

      // 주차 → 카운트 맵 초기화
      const postMap: Record<string, number> = {};
      const commentMap: Record<string, number> = {};
      const attendanceMap: Record<string, number> = {};
      weekKeys.forEach((k) => {
        postMap[k] = 0;
        commentMap[k] = 0;
        attendanceMap[k] = 0;
      });

      // 2. 게시글 조회
      const { data: postRows, error: postErr } = await supabase
        .from("board_posts")
        .select("created_at")
        .eq("group_id", groupId)
        .eq("author_id", userId)
        .gte("created_at", sinceIso);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      (postRows ?? []).forEach((row: { created_at: string }) => {
        const d = new Date(row.created_at);
        const { year, week } = getISOWeek(d);
        const key = isoWeekKey(year, week);
        if (key in postMap) postMap[key]++;
      });

      // 3. 댓글 조회 (그룹 게시글의 댓글)
      const { data: allPostIds, error: allPostErr } = await supabase
        .from("board_posts")
        .select("id")
        .eq("group_id", groupId);

      if (allPostErr) throw new Error("게시글 목록을 불러오지 못했습니다");

      const postIdList = (allPostIds ?? []).map((p: { id: string }) => p.id);

      if (postIdList.length > 0) {
        const { data: commentRows, error: commentErr } = await supabase
          .from("board_comments")
          .select("created_at")
          .in("post_id", postIdList)
          .eq("author_id", userId)
          .gte("created_at", sinceIso);

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");

        (commentRows ?? []).forEach((row: { created_at: string }) => {
          const d = new Date(row.created_at);
          const { year, week } = getISOWeek(d);
          const key = isoWeekKey(year, week);
          if (key in commentMap) commentMap[key]++;
        });
      }

      // 4. 출석 조회 (present, late)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      if (scheduleIds.length > 0) {
        const { data: attRows, error: attErr } = await supabase
          .from("attendance")
          .select("checked_at")
          .in("schedule_id", scheduleIds)
          .eq("user_id", userId)
          .in("status", ["present", "late"])
          .gte("checked_at", sinceIso);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");

        (attRows ?? []).forEach((row: { checked_at: string }) => {
          const d = new Date(row.checked_at);
          const { year, week } = getISOWeek(d);
          const key = isoWeekKey(year, week);
          if (key in attendanceMap) attendanceMap[key]++;
        });
      }

      // 5. 주차별 결과 조합
      return weekKeys.map((key, idx) => {
        // 짧은 레이블: 마지막 = "이번주", 나머지 = "N주전"
        const weeksAgo = weeks - 1 - idx;
        const label = weeksAgo === 0 ? "이번주" : `${weeksAgo}주전`;

        return {
          week: key,
          label,
          posts: postMap[key],
          comments: commentMap[key],
          attendances: attendanceMap[key],
        };
      });
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    trend: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
