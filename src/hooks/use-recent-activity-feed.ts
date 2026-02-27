"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { ActivityFeedItem } from "@/types";

export function useRecentActivityFeed(groupIds: string[], limit: number = 20) {
  const key = groupIds.length > 0 ? swrKeys.recentActivityFeed(groupIds, limit) : null;

  const { data, isLoading, mutate } = useSWR(key, async () => {
    if (groupIds.length === 0) return [] as ActivityFeedItem[];

    const supabase = createClient();

    // 그룹 이름 조회
    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select("id, name")
      .in("id", groupIds);

    if (groupsError) throw groupsError;

    const groupNameMap: Record<string, string> = {};
    for (const g of groupsData ?? []) {
      groupNameMap[g.id] = g.name;
    }

    // 게시글, 댓글, 일정을 병렬 조회
    const [postsRes, commentsRes, schedulesRes] = await Promise.all([
      supabase
        .from("board_posts")
        .select("id, group_id, title, author_id, created_at, profiles(name)")
        .in("group_id", groupIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit),

      supabase
        .from("board_comments")
        .select("id, post_id, content, author_id, created_at, board_posts!inner(group_id), profiles(name)")
        .in("board_posts.group_id", groupIds)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(limit),

      supabase
        .from("schedules")
        .select("id, group_id, title, starts_at, created_by, created_at")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    const items: ActivityFeedItem[] = [];

    // 게시글 변환
    for (const post of postsRes.data ?? []) {
      const groupName = groupNameMap[post.group_id] ?? "";
      // profiles는 조인 결과 — 단일 객체 또는 배열일 수 있음
      const profiles = post.profiles as { name: string } | { name: string }[] | null;
      const authorName = Array.isArray(profiles)
        ? (profiles[0]?.name ?? "알 수 없음")
        : (profiles?.name ?? "알 수 없음");

      items.push({
        id: `post-${post.id}`,
        type: "post",
        title: `[${groupName}] ${authorName}님이 게시글을 작성했습니다: ${post.title}`,
        description: null,
        groupId: post.group_id,
        groupName,
        createdAt: post.created_at,
        userId: post.author_id,
        postId: post.id,
      });
    }

    // 댓글 변환
    for (const comment of commentsRes.data ?? []) {
      const boardPost = comment.board_posts as { group_id: string } | null;
      const groupId = boardPost?.group_id ?? "";
      const groupName = groupNameMap[groupId] ?? "";
      const snippet = comment.content.slice(0, 50) + (comment.content.length > 50 ? "..." : "");
      const profiles = comment.profiles as { name: string } | { name: string }[] | null;
      const authorName = Array.isArray(profiles)
        ? (profiles[0]?.name ?? "알 수 없음")
        : (profiles?.name ?? "알 수 없음");

      items.push({
        id: `comment-${comment.id}`,
        type: "comment",
        title: `[${groupName}] ${authorName}님이 댓글을 달았습니다`,
        description: snippet,
        groupId,
        groupName,
        createdAt: comment.created_at,
        userId: comment.author_id,
        postId: comment.post_id,
      });
    }

    // 일정 변환
    for (const schedule of schedulesRes.data ?? []) {
      const groupName = groupNameMap[schedule.group_id] ?? "";

      items.push({
        id: `schedule-${schedule.id}`,
        type: "schedule",
        title: `[${groupName}] 새 일정이 등록됐습니다: ${schedule.title}`,
        description: null,
        groupId: schedule.group_id,
        groupName,
        createdAt: schedule.created_at,
        userId: schedule.created_by,
      });
    }

    // created_at 내림차순 정렬 후 limit 적용
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items.slice(0, limit);
  });

  return {
    items: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
