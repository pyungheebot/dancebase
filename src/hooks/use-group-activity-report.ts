"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ActivityReportPeriod,
  ActivityReportInsight,
  GroupActivityReportData,
} from "@/types";

// -----------------------------------------------
// 날짜 범위 유틸
// -----------------------------------------------

type DateRange = { start: string; end: string };

function getWeekRange(): DateRange {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=일, 1=월 ... 6=토
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
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

function getMonthRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getRange(period: ActivityReportPeriod): DateRange {
  return period === "week" ? getWeekRange() : getMonthRange();
}

// -----------------------------------------------
// 인사이트 자동 생성
// -----------------------------------------------

function generateInsights(params: {
  attendanceRate: number;
  postCount: number;
  newMemberCount: number;
  rsvpRate: number;
  activeMemberCount: number;
  scheduleCount: number;
}): ActivityReportInsight[] {
  const insights: ActivityReportInsight[] = [];

  // 출석률 80%+ → 우수한 출석률
  if (params.attendanceRate >= 80) {
    insights.push({
      message: "우수한 출석률입니다!",
      type: "positive",
    });
  }

  // 게시글 5개+ → 게시판 활동 활발
  if (params.postCount >= 5) {
    insights.push({
      message: "게시판 활동이 활발합니다",
      type: "positive",
    });
  }

  // 신규 멤버 합류
  if (params.newMemberCount > 0) {
    insights.push({
      message: `새로운 멤버 ${params.newMemberCount}명이 합류했습니다`,
      type: "positive",
    });
  }

  // RSVP 응답률 70%+ → 높은 참여 의지
  if (params.rsvpRate >= 70) {
    insights.push({
      message: "멤버들의 일정 참여 의지가 높습니다",
      type: "positive",
    });
  }

  // 활동 멤버 비율이 높을 때
  if (params.activeMemberCount >= 3) {
    insights.push({
      message: `${params.activeMemberCount}명의 멤버가 활발히 활동 중입니다`,
      type: "positive",
    });
  }

  // 일정이 없을 때 중립 메시지
  if (params.scheduleCount === 0) {
    insights.push({
      message: "이번 기간에 예정된 일정이 없습니다",
      type: "neutral",
    });
  }

  return insights;
}

// -----------------------------------------------
// Hook
// -----------------------------------------------

export function useGroupActivityReport(
  groupId: string,
  period: ActivityReportPeriod
) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupActivityReport(groupId, period) : null,
    async (): Promise<GroupActivityReportData> => {
      const supabase = createClient();
      const { start, end } = getRange(period);

      // 1. 병렬 집계: 일정, 게시글, 댓글, RSVP, 신규 멤버
      const [schedulesRes, postsRes, commentsRes, rsvpRes, newMembersRes] =
        await Promise.all([
          // 일정 목록 (출석 집계를 위해 id 필요)
          supabase
            .from("schedules")
            .select("id")
            .eq("group_id", groupId)
            .gte("starts_at", start)
            .lt("starts_at", end),

          // 게시글 수 + 작성자 (활동 멤버 집계용)
          supabase
            .from("board_posts")
            .select("id, author_id")
            .eq("group_id", groupId)
            .gte("created_at", start)
            .lt("created_at", end),

          // 댓글 수 + 작성자 (활동 멤버 집계용)
          supabase
            .from("board_comments")
            .select("id, author_id, board_posts!inner(group_id)")
            .eq("board_posts.group_id", groupId)
            .gte("created_at", start)
            .lt("created_at", end),

          // RSVP 응답 (schedule_rsvp via schedules join)
          supabase
            .from("schedule_rsvp")
            .select("id, response, schedules!inner(group_id)")
            .eq("schedules.group_id", groupId)
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

      // 3. 출석률 계산
      let attendanceRate = 0;
      if (scheduleRows.length > 0) {
        const scheduleIds = scheduleRows.map((s: { id: string }) => s.id);
        const { data: attendanceRows } = await supabase
          .from("attendance")
          .select("status")
          .in("schedule_id", scheduleIds);

        const records = attendanceRows ?? [];
        const present = records.filter(
          (a: { status: string }) =>
            a.status === "present" || a.status === "late"
        ).length;
        const absent = records.filter(
          (a: { status: string }) => a.status === "absent"
        ).length;
        const total = present + absent;
        attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
      }

      // 4. 게시글 수 / 댓글 수
      const postRows = postsRes.data ?? [];
      const commentRows = commentsRes.data ?? [];
      const postCount = postRows.length;
      const commentCount = commentRows.length;

      // 5. RSVP 응답률 계산
      const rsvpRows = rsvpRes.data ?? [];
      const rsvpResponded = rsvpRows.filter(
        (r: { response: string }) =>
          r.response === "yes" ||
          r.response === "no" ||
          r.response === "maybe"
      ).length;
      const rsvpRate =
        rsvpRows.length > 0
          ? Math.round((rsvpResponded / rsvpRows.length) * 100)
          : 0;

      // 6. 신규 멤버 수
      const newMemberCount = newMembersRes.count ?? 0;

      // 7. 유니크 활동 멤버 수 (게시글 + 댓글 작성자 합산)
      const activeUserIds = new Set<string>();
      for (const post of postRows) {
        if (post.author_id) activeUserIds.add(post.author_id);
      }
      for (const comment of commentRows) {
        if (comment.author_id) activeUserIds.add(comment.author_id);
      }
      const activeMemberCount = activeUserIds.size;

      // 8. 인사이트 생성
      const insights = generateInsights({
        attendanceRate,
        postCount,
        newMemberCount,
        rsvpRate,
        activeMemberCount,
        scheduleCount,
      });

      return {
        period,
        scheduleCount: { value: scheduleCount, label: "일정" },
        attendanceRate: { value: attendanceRate, label: "출석률" },
        postCount: { value: postCount, label: "게시글" },
        commentCount: { value: commentCount, label: "댓글" },
        rsvpRate: { value: rsvpRate, label: "RSVP 응답률" },
        newMemberCount: { value: newMemberCount, label: "신규 멤버" },
        activeMemberCount: { value: activeMemberCount, label: "활동 멤버" },
        insights,
      };
    }
  );

  return {
    report: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
