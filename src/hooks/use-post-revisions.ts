"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { BoardPostRevision } from "@/types";

export function usePostRevisions(postId: string) {
  const { data, isLoading, mutate } = useSWR(
    postId ? swrKeys.postRevisions(postId) : null,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("board_post_revisions")
        .select("*")
        .eq("post_id", postId)
        .order("revised_at", { ascending: false });

      if (error) return [] as BoardPostRevision[];
      return (data ?? []) as BoardPostRevision[];
    }
  );

  return {
    revisions: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

/**
 * 게시글 수정 시 이전 내용을 리비전으로 저장합니다.
 * board-post-form.tsx의 edit 모드 handleSubmit에서 호출하세요.
 */
export async function savePostRevision(params: {
  postId: string;
  title: string;
  content: string;
  revisedBy: string;
}): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("board_post_revisions").insert({
    post_id: params.postId,
    title: params.title,
    content: params.content,
    revised_by: params.revisedBy,
    revised_at: new Date().toISOString(),
  });

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}
