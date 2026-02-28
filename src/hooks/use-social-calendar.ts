"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  SocialCalendarPost,
  SocialPlatformType,
  SocialPostStatus,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:social-calendar:${groupId}`;
}

function loadData(groupId: string): SocialCalendarPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as SocialCalendarPost[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: SocialCalendarPost[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type SocialCalendarStats = {
  totalPosts: number;
  draftCount: number;
  scheduledCount: number;
  publishedCount: number;
  cancelledCount: number;
  platformBreakdown: Record<SocialPlatformType, number>;
};

// ============================================================
// 훅
// ============================================================

export function useSocialCalendar(groupId: string) {
  const [posts, setPosts] = useState<SocialCalendarPost[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setPosts(data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: SocialCalendarPost[]) => {
      saveData(groupId, next);
      setPosts(next);
    },
    [groupId]
  );

  // 게시물 추가
  const addPost = useCallback(
    (
      input: Omit<SocialCalendarPost, "id" | "createdAt">
    ): SocialCalendarPost => {
      const post: SocialCalendarPost = {
        id: crypto.randomUUID(),
        ...input,
        createdAt: new Date().toISOString(),
      };
      persist([...posts, post]);
      return post;
    },
    [posts, persist]
  );

  // 게시물 수정
  const updatePost = useCallback(
    (
      id: string,
      updates: Partial<Omit<SocialCalendarPost, "id" | "createdAt">>
    ): boolean => {
      const next = posts.map((p) => (p.id === id ? { ...p, ...updates } : p));
      if (next.every((p, i) => p === posts[i])) return false;
      persist(next);
      return true;
    },
    [posts, persist]
  );

  // 게시물 삭제
  const deletePost = useCallback(
    (id: string): boolean => {
      const next = posts.filter((p) => p.id !== id);
      if (next.length === posts.length) return false;
      persist(next);
      return true;
    },
    [posts, persist]
  );

  // 상태 변경
  const updateStatus = useCallback(
    (postId: string, status: SocialPostStatus): boolean => {
      return updatePost(postId, { status });
    },
    [updatePost]
  );

  // 월별 게시물 조회
  const getPostsByMonth = useCallback(
    (year: number, month: number): SocialCalendarPost[] => {
      const pad = (n: number) => String(n).padStart(2, "0");
      const prefix = `${year}-${pad(month)}`;
      return posts.filter((p) => p.scheduledDate.startsWith(prefix));
    },
    [posts]
  );

  // 플랫폼별 게시물 조회
  const getPostsByPlatform = useCallback(
    (platform: SocialPlatformType): SocialCalendarPost[] => {
      return posts.filter((p) => p.platform === platform);
    },
    [posts]
  );

  // 통계
  const stats: SocialCalendarStats = (() => {
    const totalPosts = posts.length;
    const draftCount = posts.filter((p) => p.status === "draft").length;
    const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
    const publishedCount = posts.filter((p) => p.status === "published").length;
    const cancelledCount = posts.filter((p) => p.status === "cancelled").length;

    const platformBreakdown: Record<SocialPlatformType, number> = {
      instagram: 0,
      youtube: 0,
      tiktok: 0,
      twitter: 0,
      facebook: 0,
      blog: 0,
    };
    for (const p of posts) {
      platformBreakdown[p.platform] += 1;
    }

    return {
      totalPosts,
      draftCount,
      scheduledCount,
      publishedCount,
      cancelledCount,
      platformBreakdown,
    };
  })();

  return {
    posts,
    loading,
    addPost,
    updatePost,
    deletePost,
    updateStatus,
    getPostsByMonth,
    getPostsByPlatform,
    stats,
    refetch: reload,
  };
}
