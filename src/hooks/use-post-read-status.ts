"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidatePostReadStatus } from "@/lib/swr/invalidate";
import { toast } from "sonner";
import type { PostReadStatus } from "@/types";
import type { GroupMemberWithProfile } from "@/types";

export type ReadStatusMember = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  readAt: string | null;
};

/**
 * 게시글 읽음 현황 조회 훅
 * - 읽은 멤버 목록 / 미읽은 멤버 목록 / 읽음률 계산
 * - members: 그룹 전체 멤버 목록 (GroupMemberWithProfile[]) 전달 필요
 */
export function usePostReadStatus(
  postId: string,
  members: GroupMemberWithProfile[]
) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.postReadStatus(postId),
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("post_read_status")
        .select("post_id, user_id, read_at")
        .eq("post_id", postId);

      if (error) return [] as PostReadStatus[];
      return (data ?? []) as PostReadStatus[];
    }
  );

  const readStatuses = data ?? [];

  // 읽은 멤버 집합 (user_id → read_at)
  const readMap = new Map<string, string>(
    readStatuses.map((s) => [s.user_id, s.read_at])
  );

  // 읽은 멤버 목록
  const readMembers: ReadStatusMember[] = members
    .filter((m) => readMap.has(m.user_id))
    .map((m) => ({
      userId: m.user_id,
      name: m.nickname || m.profiles.name,
      avatarUrl: m.profiles.avatar_url,
      readAt: readMap.get(m.user_id) ?? null,
    }))
    .sort((a, b) => {
      if (!a.readAt || !b.readAt) return 0;
      return new Date(a.readAt).getTime() - new Date(b.readAt).getTime();
    });

  // 미읽은 멤버 목록
  const unreadMembers: ReadStatusMember[] = members
    .filter((m) => !readMap.has(m.user_id))
    .map((m) => ({
      userId: m.user_id,
      name: m.nickname || m.profiles.name,
      avatarUrl: m.profiles.avatar_url,
      readAt: null,
    }));

  const readCount = readMembers.length;
  const totalCount = members.length;
  const readRate = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

  return {
    readStatuses,
    readMembers,
    unreadMembers,
    readCount,
    totalCount,
    readRate,
    loading: isLoading,
    refetch: () => mutate(),
  };
}

/**
 * 게시글 읽음 처리 훅
 * - 페이지 진입 시 자동으로 읽음 처리 (useEffect 포함)
 */
export function useMarkPostAsRead(postId: string, userId: string | null) {
  useEffect(() => {
    if (!postId || !userId) return;

    const markAsRead = async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("post_read_status")
        .upsert(
          { post_id: postId, user_id: userId, read_at: new Date().toISOString() },
          { onConflict: "post_id,user_id" }
        );

      if (error) {
        // 읽음 처리 실패는 조용히 무시 (UX 방해하지 않음)
        console.error("[post-read-status] 읽음 처리 실패:", error.message);
        return;
      }

      invalidatePostReadStatus(postId);
    };

    void markAsRead();
  }, [postId, userId]);
}

/**
 * 수동 읽음 처리 함수 (버튼 클릭 등)
 */
export async function markPostAsRead(postId: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    toast.error("로그인이 필요합니다");
    return false;
  }

  const { error } = await supabase
    .from("post_read_status")
    .upsert(
      { post_id: postId, user_id: user.id, read_at: new Date().toISOString() },
      { onConflict: "post_id,user_id" }
    );

  if (error) {
    toast.error("읽음 처리에 실패했습니다");
    return false;
  }

  invalidatePostReadStatus(postId);
  return true;
}
