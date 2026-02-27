"use client";

import { useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  BoardPostWithDetails,
  BoardPost,
  BoardCommentWithProfile,
  BoardPoll,
  BoardPollOptionWithVotes,
} from "@/types";

export function useBoard(groupId: string, projectId?: string | null) {
  const [category, setCategory] = useState<string>("전체");

  const { data, isLoading, mutate } = useSWR(
    swrKeys.board(groupId, projectId, category),
    async () => {
      const supabase = createClient();

      let query = supabase
        .from("board_posts")
        .select("*, profiles(id, name, avatar_url), board_comments(count), projects(id, name)")
        .eq("group_id", groupId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        const { data: independentEntities } = await supabase.rpc(
          "get_independent_entity_ids",
          { p_group_id: groupId, p_feature: "board" }
        );
        const excludeIds = (independentEntities || []).map((e: { entity_id: string }) => e.entity_id);
        if (excludeIds.length > 0) {
          query = query.not("project_id", "in", `(${excludeIds.join(",")})`);
        }
      }

      if (category && category !== "전체") {
        query = query.eq("category", category);
      }

      const { data } = await query;

      if (data) {
        return data.map((post: Record<string, unknown>) => ({
          ...post,
          comment_count: (post.board_comments as { count: number }[])?.[0]?.count ?? 0,
          board_comments: undefined,
        })) as unknown as BoardPostWithDetails[];
      }

      return [] as BoardPostWithDetails[];
    },
    { keepPreviousData: true },
  );

  return {
    posts: data ?? [],
    loading: isLoading,
    category,
    setCategory,
    refetch: () => mutate(),
  };
}

export function useBoardPost(postId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.boardPost(postId),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [postRes, commentsRes, pollRes] = await Promise.all([
        supabase
          .from("board_posts")
          .select("*, profiles(id, name, avatar_url)")
          .eq("id", postId)
          .single(),
        supabase
          .from("board_comments")
          .select("*, profiles(id, name, avatar_url)")
          .eq("post_id", postId)
          .order("created_at", { ascending: true }),
        supabase
          .from("board_polls")
          .select("*")
          .eq("post_id", postId)
          .maybeSingle(),
      ]);

      const post = (postRes.data as (BoardPost & { profiles: { id: string; name: string; avatar_url: string | null } }) | null) ?? null;
      const comments = (commentsRes.data as BoardCommentWithProfile[]) ?? [];
      let poll: BoardPoll | null = null;
      let pollOptions: BoardPollOptionWithVotes[] = [];

      if (pollRes.data) {
        poll = pollRes.data as BoardPoll;

        const { data: optionsWithVotes } = await supabase.rpc(
          "get_poll_options_with_votes",
          {
            p_poll_id: pollRes.data.id,
            p_user_id: user?.id ?? "00000000-0000-0000-0000-000000000000",
          },
        );

        if (optionsWithVotes) {
          pollOptions = optionsWithVotes as BoardPollOptionWithVotes[];
        }
      }

      return { post, comments, poll, pollOptions };
    },
  );

  return {
    post: data?.post ?? null,
    comments: data?.comments ?? [],
    poll: data?.poll ?? null,
    pollOptions: data?.pollOptions ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
