"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MemberActivityItem,
  MemberActivitySummary,
  MemberDashboardActivityData,
} from "@/types";

function get7DaysAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export function useMemberDashboardActivity() {
  const { data, isLoading, mutate } = useSWR<MemberDashboardActivityData>(
    // 키는 사용자 로그인 후 확정되므로 fetcher 내부에서 userId를 가져옴
    // 로그인하지 않은 경우 null을 반환해 SWR이 fetcher를 실행하지 않도록
    // 초기에는 고정 키를 사용하고 fetcher에서 인증 확인
    swrKeys.memberDashboardActivity("me"),
    async (): Promise<MemberDashboardActivityData> => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const empty: MemberDashboardActivityData = {
        summary: {
          attendanceCount: 0,
          postCount: 0,
          commentCount: 0,
          rsvpCount: 0,
        },
        timeline: [],
      };

      if (!user) return empty;

      const since = get7DaysAgoISO();

      // 4개 테이블 병렬 조회
      const [attendanceRes, postsRes, commentsRes, rsvpRes] = await Promise.all([
        // 출석 기록 (schedules join으로 일정 제목 가져오기)
        supabase
          .from("attendance")
          .select("id, status, created_at, schedules(title)")
          .eq("user_id", user.id)
          .gte("created_at", since)
          .order("created_at", { ascending: false }),

        // 게시글 작성
        supabase
          .from("board_posts")
          .select("id, title, created_at")
          .eq("author_id", user.id)
          .gte("created_at", since)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),

        // 댓글 작성 (board_posts join으로 게시글 제목 가져오기)
        supabase
          .from("board_comments")
          .select("id, content, created_at, board_posts(title)")
          .eq("user_id", user.id)
          .gte("created_at", since)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),

        // RSVP 응답 (schedules join으로 일정 제목 가져오기)
        supabase
          .from("schedule_rsvp")
          .select("id, status, created_at, schedules(title)")
          .eq("user_id", user.id)
          .gte("created_at", since)
          .order("created_at", { ascending: false }),
      ]);

      // 에러 체크
      if (attendanceRes.error || postsRes.error || commentsRes.error || rsvpRes.error) {
        return empty;
      }

      // 출석 활동 항목 변환
      type AttRow = {
        id: string;
        status: string;
        created_at: string;
        schedules: { title: string } | null;
      };
      const attendanceItems: MemberActivityItem[] = (
        (attendanceRes.data ?? []) as AttRow[]
      ).map((row) => {
        const statusLabel =
          row.status === "present"
            ? "출석"
            : row.status === "late"
            ? "지각"
            : row.status === "absent"
            ? "결석"
            : row.status;
        const scheduleTitle = row.schedules?.title ?? "일정";
        return {
          id: `attendance-${row.id}`,
          type: "attendance",
          description: `${scheduleTitle} - ${statusLabel}`,
          occurredAt: row.created_at,
        };
      });

      // 게시글 활동 항목 변환
      type PostRow = {
        id: string;
        title: string;
        created_at: string;
      };
      const postItems: MemberActivityItem[] = (
        (postsRes.data ?? []) as PostRow[]
      ).map((row) => ({
        id: `post-${row.id}`,
        type: "post",
        description: `게시글 작성: ${row.title}`,
        occurredAt: row.created_at,
      }));

      // 댓글 활동 항목 변환
      type CommentRow = {
        id: string;
        content: string;
        created_at: string;
        board_posts: { title: string } | null;
      };
      const commentItems: MemberActivityItem[] = (
        (commentsRes.data ?? []) as CommentRow[]
      ).map((row) => {
        const postTitle = row.board_posts?.title ?? "게시글";
        return {
          id: `comment-${row.id}`,
          type: "comment",
          description: `댓글 작성: ${postTitle}`,
          occurredAt: row.created_at,
        };
      });

      // RSVP 활동 항목 변환
      type RsvpRow = {
        id: string;
        status: string;
        created_at: string;
        schedules: { title: string } | null;
      };
      const rsvpItems: MemberActivityItem[] = (
        (rsvpRes.data ?? []) as RsvpRow[]
      ).map((row) => {
        const scheduleTitle = row.schedules?.title ?? "일정";
        const statusLabel =
          row.status === "attending"
            ? "참석"
            : row.status === "not_attending"
            ? "불참"
            : row.status === "maybe"
            ? "미정"
            : row.status;
        return {
          id: `rsvp-${row.id}`,
          type: "rsvp",
          description: `RSVP 응답: ${scheduleTitle} (${statusLabel})`,
          occurredAt: row.created_at,
        };
      });

      // 통합 타임라인 - 최신순 정렬
      const timeline: MemberActivityItem[] = [
        ...attendanceItems,
        ...postItems,
        ...commentItems,
        ...rsvpItems,
      ].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );

      // 요약 통계
      const summary: MemberActivitySummary = {
        attendanceCount: attendanceItems.length,
        postCount: postItems.length,
        commentCount: commentItems.length,
        rsvpCount: rsvpItems.length,
      };

      return { summary, timeline };
    }
  );

  return {
    data: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
