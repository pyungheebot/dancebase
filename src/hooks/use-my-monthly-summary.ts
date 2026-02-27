"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { startOfMonth, endOfMonth, format } from "date-fns";

export type MyMonthlySummary = {
  attendance: {
    present: number;
    absent: number;
    total: number;
    rate: number;
  };
  posts: number;
  comments: number;
  rsvp: {
    responded: number;
    total: number;
    rate: number;
  };
  schedulesAttended: number;
};

export function useMyMonthlySummary() {
  const now = new Date();
  const yearMonth = format(now, "yyyy-MM");
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const { data, isLoading, mutate } = useSWR(
    swrKeys.myMonthlySummary(yearMonth),
    async (): Promise<MyMonthlySummary> => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          attendance: { present: 0, absent: 0, total: 0, rate: 0 },
          posts: 0,
          comments: 0,
          rsvp: { responded: 0, total: 0, rate: 0 },
          schedulesAttended: 0,
        };
      }

      // 사용자의 모든 그룹 ID 조회
      const { data: groupMemberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      const groupIds = (groupMemberships ?? []).map(
        (m: { group_id: string }) => m.group_id
      );

      if (groupIds.length === 0) {
        return {
          attendance: { present: 0, absent: 0, total: 0, rate: 0 },
          posts: 0,
          comments: 0,
          rsvp: { responded: 0, total: 0, rate: 0 },
          schedulesAttended: 0,
        };
      }

      // 이번 달 일정 목록 (출석 방식 있는 것) 조회 — RSVP와 출석 집계에 필요
      const schedulesPromise = supabase
        .from("schedules")
        .select("id")
        .in("group_id", groupIds)
        .neq("attendance_method", "none")
        .gte("starts_at", monthStart)
        .lte("starts_at", monthEnd);

      // 이번 달 게시글 수
      const postsPromise = supabase
        .from("board_posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user.id)
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd)
        .is("deleted_at", null);

      // 이번 달 댓글 수
      const commentsPromise = supabase
        .from("board_comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd)
        .is("deleted_at", null);

      const [schedulesRes, postsRes, commentsRes] = await Promise.all([
        schedulesPromise,
        postsPromise,
        commentsPromise,
      ]);

      const scheduleIds = (schedulesRes.data ?? []).map(
        (s: { id: string }) => s.id
      );
      const totalSchedules = scheduleIds.length;

      // 출석 기록 및 RSVP 집계 (일정이 있을 때만)
      let attendancePresent = 0;
      let attendanceAbsent = 0;
      let rsvpResponded = 0;

      if (scheduleIds.length > 0) {
        const [attendanceRes, rsvpRes] = await Promise.all([
          supabase
            .from("attendance")
            .select("status")
            .eq("user_id", user.id)
            .in("schedule_id", scheduleIds),
          supabase
            .from("schedule_rsvp")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .in("schedule_id", scheduleIds),
        ]);

        type AttRow = { status: string };
        const attRows = (attendanceRes.data ?? []) as AttRow[];
        attendancePresent = attRows.filter(
          (a) => a.status === "present" || a.status === "late"
        ).length;
        const schedulesAttended = attendancePresent;
        attendanceAbsent = Math.max(
          0,
          totalSchedules - attRows.length
        );

        rsvpResponded = rsvpRes.count ?? 0;

        const attendanceRate =
          totalSchedules > 0
            ? Math.round((attendancePresent / totalSchedules) * 100)
            : 0;
        const rsvpRate =
          totalSchedules > 0
            ? Math.round((rsvpResponded / totalSchedules) * 100)
            : 0;

        return {
          attendance: {
            present: attendancePresent,
            absent: totalSchedules - attRows.length,
            total: totalSchedules,
            rate: attendanceRate,
          },
          posts: postsRes.count ?? 0,
          comments: commentsRes.count ?? 0,
          rsvp: {
            responded: rsvpResponded,
            total: totalSchedules,
            rate: rsvpRate,
          },
          schedulesAttended,
        };
      }

      return {
        attendance: {
          present: attendancePresent,
          absent: attendanceAbsent,
          total: totalSchedules,
          rate: 0,
        },
        posts: postsRes.count ?? 0,
        comments: commentsRes.count ?? 0,
        rsvp: { responded: 0, total: totalSchedules, rate: 0 },
        schedulesAttended: 0,
      };
    }
  );

  return {
    summary: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
    yearMonth,
  };
}
