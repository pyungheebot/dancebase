"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  BoardTrendResult,
  BoardTrendWeekData,
  BoardTrendTopAuthor,
  BoardTrendPopularPost,
} from "@/types";

// ── 내부 타입 ─────────────────────────────────────────────
type PostRow = {
  id: string;
  created_at: string;
  author_id: string;
  profiles: { id: string; name: string } | { id: string; name: string }[] | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  created_at: string;
  profiles: { id: string; name: string } | { id: string; name: string }[] | null;
};

type TopPostRow = {
  id: string;
  title: string | null;
  author_id: string;
  profiles: { id: string; name: string } | { id: string; name: string }[] | null;
};

function resolveProfile(
  profiles: { id: string; name: string } | { id: string; name: string }[] | null
): { id: string; name: string } | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

export function useBoardTrendAnalytics(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.boardTrendAnalytics(groupId),
    async (): Promise<BoardTrendResult> => {
      const supabase = createClient();

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      // 최근 30일 게시글 전체 조회 (삭제되지 않은 것)
      const { data: posts, error: postsError } = await supabase
        .from("board_posts")
        .select("id, created_at, author_id, profiles(id, name)")
        .eq("group_id", groupId)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgoISO)
        .order("created_at", { ascending: true });

      if (postsError) {
        throw new Error(postsError.message);
      }

      const postList: PostRow[] = (posts ?? []) as PostRow[];
      const postIds: string[] = postList.map((p: PostRow) => p.id);

      // 최근 30일 댓글 전체 조회
      let commentList: CommentRow[] = [];

      if (postIds.length > 0) {
        const { data: comments, error: commentsError } = await supabase
          .from("board_comments")
          .select("id, post_id, author_id, created_at, profiles(id, name)")
          .in("post_id", postIds)
          .is("deleted_at", null)
          .gte("created_at", thirtyDaysAgoISO);

        if (commentsError) {
          throw new Error(commentsError.message);
        }
        commentList = (comments ?? []) as CommentRow[];
      }

      // ── 주간 추이 계산 (4주) ──────────────────────────────
      const weeklyTrend: BoardTrendWeekData[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        weekEnd.setHours(23, 59, 59, 999);

        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const weekStartISO = weekStart.toISOString();
        const weekEndISO = weekEnd.toISOString();

        const postCount = postList.filter((p: PostRow) => {
          const t = p.created_at;
          return t >= weekStartISO && t <= weekEndISO;
        }).length;

        const commentCount = commentList.filter((c: CommentRow) => {
          const t = c.created_at;
          return t >= weekStartISO && t <= weekEndISO;
        }).length;

        const label = i === 0 ? "이번 주" : `${i}주 전`;
        weeklyTrend.push({ weekLabel: label, postCount, commentCount });
      }

      // ── 요일별 패턴 (0=일 ~ 6=토) ─────────────────────────
      const dayOfWeekPattern = [0, 0, 0, 0, 0, 0, 0];
      for (const p of postList) {
        const day = new Date(p.created_at).getDay();
        dayOfWeekPattern[day]++;
      }
      for (const c of commentList) {
        const day = new Date(c.created_at).getDay();
        dayOfWeekPattern[day]++;
      }

      // ── TOP 작성자 5명 ────────────────────────────────────
      const authorMap = new Map<
        string,
        { name: string; postCount: number; commentCount: number }
      >();

      for (const p of postList) {
        const id = p.author_id;
        if (!id) continue;
        const profile = resolveProfile(p.profiles);
        const name = profile?.name ?? "알 수 없음";
        const existing = authorMap.get(id);
        if (existing) {
          existing.postCount++;
        } else {
          authorMap.set(id, { name, postCount: 1, commentCount: 0 });
        }
      }

      for (const c of commentList) {
        const id = c.author_id;
        if (!id) continue;
        const profile = resolveProfile(c.profiles);
        const name = profile?.name ?? "알 수 없음";
        const existing = authorMap.get(id);
        if (existing) {
          existing.commentCount++;
        } else {
          authorMap.set(id, { name, postCount: 0, commentCount: 1 });
        }
      }

      const topAuthors: BoardTrendTopAuthor[] = Array.from(authorMap.entries())
        .map(([userId, stats]: [string, { name: string; postCount: number; commentCount: number }]) => ({
          userId,
          ...stats,
        }))
        .sort(
          (
            a: { postCount: number; commentCount: number },
            b: { postCount: number; commentCount: number }
          ) => b.postCount + b.commentCount - (a.postCount + a.commentCount)
        )
        .slice(0, 5);

      // ── 인기 게시글 TOP 3 (댓글 수 기준) ──────────────────
      const commentCountByPost = new Map<string, number>();
      for (const c of commentList) {
        commentCountByPost.set(
          c.post_id,
          (commentCountByPost.get(c.post_id) ?? 0) + 1
        );
      }

      let popularPosts: BoardTrendPopularPost[] = [];
      if (postIds.length > 0) {
        const sortedPostIds = postIds
          .map((id: string) => ({
            id,
            commentCount: commentCountByPost.get(id) ?? 0,
          }))
          .sort(
            (
              a: { commentCount: number },
              b: { commentCount: number }
            ) => b.commentCount - a.commentCount
          )
          .slice(0, 3)
          .filter((p: { id: string; commentCount: number }) => p.commentCount > 0);

        if (sortedPostIds.length > 0) {
          const { data: topPosts, error: topPostsError } = await supabase
            .from("board_posts")
            .select("id, title, author_id, profiles(id, name)")
            .in(
              "id",
              sortedPostIds.map((p: { id: string }) => p.id)
            );

          if (topPostsError) {
            throw new Error(topPostsError.message);
          }

          const topPostRows: TopPostRow[] = (topPosts ?? []) as TopPostRow[];
          popularPosts = topPostRows
            .map((post: TopPostRow) => {
              const profile = resolveProfile(post.profiles);
              return {
                postId: post.id,
                title: post.title ?? "(제목 없음)",
                commentCount: commentCountByPost.get(post.id) ?? 0,
                authorName: profile?.name ?? "알 수 없음",
              };
            })
            .sort(
              (a: { commentCount: number }, b: { commentCount: number }) =>
                b.commentCount - a.commentCount
            );
        }
      }

      // ── 요약 통계 ─────────────────────────────────────────
      const totalPosts = postList.length;
      const totalComments = commentList.length;
      const avgCommentsPerPost =
        totalPosts > 0
          ? Math.round((totalComments / totalPosts) * 10) / 10
          : 0;
      const uniqueAuthors = new Set([
        ...postList
          .map((p: PostRow) => p.author_id)
          .filter((id: string) => Boolean(id)),
        ...commentList
          .map((c: CommentRow) => c.author_id)
          .filter((id: string) => Boolean(id)),
      ]).size;

      return {
        weeklyTrend,
        dayOfWeekPattern,
        topAuthors,
        popularPosts,
        totalPosts,
        totalComments,
        avgCommentsPerPost,
        uniqueAuthors,
      };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5분 캐시
    }
  );

  return {
    trend: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
