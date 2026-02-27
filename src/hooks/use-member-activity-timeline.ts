"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

// 활동 타입
export type ActivityType = "post" | "comment" | "attendance";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  description: string;
  occurredAt: string;
};

const MAX_ITEMS = 7;

/**
 * 특정 유저의 최근 활동 타임라인 훅.
 * board_posts, board_comments, attendance 세 테이블에서 각 상위 10개씩 조회 후
 * 날짜 내림차순으로 통합하여 최대 MAX_ITEMS개 반환.
 */
export function useMemberActivityTimeline(userId: string, enabled = true) {
  const { data, isLoading, mutate } = useSWR(
    enabled && userId ? swrKeys.memberActivityTimeline(userId) : null,
    async (): Promise<ActivityItem[]> => {
      const supabase = createClient();

      // 1) 게시글 작성 내역
      const { data: posts, error: postErr } = await supabase
        .from("board_posts")
        .select("id, title, created_at")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      // 2) 댓글 작성 내역 (게시글 제목 포함)
      const { data: comments, error: commentErr } = await supabase
        .from("board_comments")
        .select("id, created_at, board_posts(title)")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");

      // 3) 출석 기록 (일정 제목 포함, present/late만)
      const { data: attendances, error: attErr } = await supabase
        .from("attendance")
        .select("id, checked_at, status, schedules(title)")
        .eq("user_id", userId)
        .in("status", ["present", "late"])
        .order("checked_at", { ascending: false })
        .limit(10);

      if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");

      // 통합 타임라인 생성
      const items: ActivityItem[] = [];

      for (const post of posts ?? []) {
        const p = post as { id: string; title: string; created_at: string };
        items.push({
          id: `post-${p.id}`,
          type: "post",
          description: `게시글 작성: ${p.title}`,
          occurredAt: p.created_at,
        });
      }

      for (const comment of comments ?? []) {
        const c = comment as {
          id: string;
          created_at: string;
          board_posts: { title: string } | null;
        };
        items.push({
          id: `comment-${c.id}`,
          type: "comment",
          description: "댓글 작성",
          occurredAt: c.created_at,
        });
      }

      for (const att of attendances ?? []) {
        const a = att as {
          id: string;
          checked_at: string;
          status: string;
          schedules: { title: string } | null;
        };
        const scheduleTitle = a.schedules?.title ?? "일정";
        items.push({
          id: `attendance-${a.id}`,
          type: "attendance",
          description: `일정 참석: ${scheduleTitle}`,
          occurredAt: a.checked_at,
        });
      }

      // 날짜 내림차순 정렬 후 상위 MAX_ITEMS개만 반환
      items.sort((a, b) => (a.occurredAt > b.occurredAt ? -1 : 1));
      return items.slice(0, MAX_ITEMS);
    },
    { revalidateOnFocus: false },
  );

  return {
    activities: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
