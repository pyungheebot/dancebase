"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { PostBookmarkWithPost } from "@/types";

/**
 * 현재 유저의 북마크 목록 조회 (게시글 정보 JOIN)
 * groupId를 지정하면 해당 그룹의 북마크만 반환
 */
export function usePostBookmarks(groupId?: string | null) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.postBookmarks(groupId),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [] as PostBookmarkWithPost[];

      let query = supabase
        .from("post_bookmarks")
        .select(
          "*, board_posts(id, group_id, project_id, title, category, created_at, groups(id, name))"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (groupId) {
        query = query.eq("board_posts.group_id", groupId);
      }

      const { data, error } = await query;
      if (error) return [] as PostBookmarkWithPost[];

      // board_posts가 null인 항목은 이미 삭제된 게시글이므로 제외
      const filtered = (data ?? []).filter(
        (b: Record<string, unknown>) => b.board_posts !== null
      ) as unknown as PostBookmarkWithPost[];

      if (groupId) {
        return filtered.filter(
          (b) => b.board_posts?.group_id === groupId
        );
      }
      return filtered;
    }
  );

  return {
    bookmarks: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

/**
 * 특정 게시글의 북마크 여부 (현재 유저 기준)
 */
export function useIsBookmarked(postId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.postBookmark(postId),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return { bookmarked: false, bookmarkId: null as string | null };

      const { data, error } = await supabase
        .from("post_bookmarks")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) return { bookmarked: false, bookmarkId: null as string | null };

      return {
        bookmarked: !!data,
        bookmarkId: data?.id ?? null,
      };
    }
  );

  return {
    bookmarked: data?.bookmarked ?? false,
    bookmarkId: data?.bookmarkId ?? null,
    loading: isLoading,
    mutate,
  };
}
