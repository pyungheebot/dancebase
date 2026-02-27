"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { ImpressionPost, ImpressionMood } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:impressions:${groupId}`;

function loadPosts(groupId: string): ImpressionPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as ImpressionPost[];
  } catch {
    return [];
  }
}

function savePosts(groupId: string, posts: ImpressionPost[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(posts));
  } catch {
    /* ignore */
  }
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useImpressionWall(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.impressionWall(groupId) : null,
    () => loadPosts(groupId),
    { revalidateOnFocus: false }
  );

  const posts: ImpressionPost[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: ImpressionPost[]): void {
    savePosts(groupId, next);
    mutate(next, false);
  }

  // ── 소감 추가 ────────────────────────────────────────────

  function addPost(
    authorName: string,
    eventTitle: string,
    mood: ImpressionMood,
    content: string
  ): boolean {
    if (!authorName.trim() || !content.trim() || !eventTitle.trim()) return false;
    const stored = loadPosts(groupId);
    const newPost: ImpressionPost = {
      id: crypto.randomUUID(),
      authorName: authorName.trim(),
      eventTitle: eventTitle.trim(),
      mood,
      content: content.trim(),
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    update([newPost, ...stored]);
    return true;
  }

  // ── 소감 삭제 ────────────────────────────────────────────

  function deletePost(postId: string): boolean {
    const stored = loadPosts(groupId);
    const next = stored.filter((p) => p.id !== postId);
    if (next.length === stored.length) return false;
    update(next);
    return true;
  }

  // ── 좋아요 (+1) ──────────────────────────────────────────

  function likePost(postId: string): boolean {
    const stored = loadPosts(groupId);
    const idx = stored.findIndex((p) => p.id === postId);
    if (idx === -1) return false;
    const next = stored.map((p) =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    );
    update(next);
    return true;
  }

  // ── 기분 필터 ────────────────────────────────────────────

  function filterByMood(mood: ImpressionMood | "all"): ImpressionPost[] {
    if (mood === "all") return posts;
    return posts.filter((p) => p.mood === mood);
  }

  // ── 이벤트 필터 ──────────────────────────────────────────

  function filterByEvent(eventTitle: string): ImpressionPost[] {
    if (!eventTitle) return posts;
    return posts.filter((p) =>
      p.eventTitle.toLowerCase().includes(eventTitle.toLowerCase())
    );
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalPosts = posts.length;

  const mostActiveMember = (() => {
    if (posts.length === 0) return null;
    const countMap: Record<string, number> = {};
    for (const p of posts) {
      countMap[p.authorName] = (countMap[p.authorName] ?? 0) + 1;
    }
    return Object.entries(countMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  })();

  const popularMood = (() => {
    if (posts.length === 0) return null;
    const countMap: Record<string, number> = {};
    for (const p of posts) {
      countMap[p.mood] = (countMap[p.mood] ?? 0) + 1;
    }
    return (
      (Object.entries(countMap).sort((a, b) => b[1] - a[1])[0]?.[0] as ImpressionMood) ?? null
    );
  })();

  // ── 인기 소감 TOP 3 ──────────────────────────────────────

  const top3Posts = [...posts]
    .sort((a, b) => b.likes - a.likes || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  // ── 이벤트 목록 (중복 제거) ──────────────────────────────

  const uniqueEvents = Array.from(new Set(posts.map((p) => p.eventTitle)));

  return {
    posts,
    // CRUD
    addPost,
    deletePost,
    likePost,
    // 필터
    filterByMood,
    filterByEvent,
    // 통계
    totalPosts,
    mostActiveMember,
    popularMood,
    top3Posts,
    uniqueEvents,
    // SWR
    refetch: () => mutate(),
  };
}
