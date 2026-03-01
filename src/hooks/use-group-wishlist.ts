"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { WishlistItem, WishCategory, WishPriority } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:wishlist:${groupId}`;

function loadItems(groupId: string): WishlistItem[] {
  return loadFromStorage<WishlistItem[]>(LS_KEY(groupId), []);
}

function saveItems(groupId: string, items: WishlistItem[]): void {
  saveToStorage(LS_KEY(groupId), items);
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useGroupWishlist(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.groupWishlist(groupId) : null,
    () => loadItems(groupId),
    { revalidateOnFocus: false }
  );

  const items: WishlistItem[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: WishlistItem[]): void {
    saveItems(groupId, next);
    mutate(next, false);
  }

  // ── 위시 추가 ────────────────────────────────────────────

  function addWish(
    title: string,
    description: string,
    category: WishCategory,
    priority: WishPriority,
    proposedBy: string
  ): boolean {
    if (!title.trim() || !proposedBy.trim()) return false;
    const stored = loadItems(groupId);
    const newItem: WishlistItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      proposedBy: proposedBy.trim(),
      votes: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    update([newItem, ...stored]);
    return true;
  }

  // ── 위시 삭제 ────────────────────────────────────────────

  function deleteWish(itemId: string): boolean {
    const stored = loadItems(groupId);
    const next = stored.filter((i) => i.id !== itemId);
    if (next.length === stored.length) return false;
    update(next);
    return true;
  }

  // ── 투표 (+1) ────────────────────────────────────────────

  function voteWish(itemId: string): boolean {
    const stored = loadItems(groupId);
    const idx = stored.findIndex((i) => i.id === itemId);
    if (idx === -1) return false;
    const next = stored.map((i) =>
      i.id === itemId ? { ...i, votes: i.votes + 1 } : i
    );
    update(next);
    return true;
  }

  // ── 완료 처리 ────────────────────────────────────────────

  function completeWish(itemId: string): boolean {
    const stored = loadItems(groupId);
    const idx = stored.findIndex((i) => i.id === itemId);
    if (idx === -1) return false;
    const next = stored.map((i) =>
      i.id === itemId
        ? { ...i, isCompleted: !i.isCompleted, completedAt: !i.isCompleted ? new Date().toISOString() : undefined }
        : i
    );
    update(next);
    return true;
  }

  // ── 카테고리 필터 ────────────────────────────────────────

  function filterByCategory(category: WishCategory | "all"): WishlistItem[] {
    if (category === "all") return items;
    return items.filter((i) => i.category === category);
  }

  // ── 투표수 기준 정렬 ─────────────────────────────────────

  function sortByVotes(list: WishlistItem[]): WishlistItem[] {
    return [...list].sort(
      (a, b) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt)
    );
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalWishes = items.length;
  const completedCount = items.filter((i) => i.isCompleted).length;

  const topCategory: WishCategory | null = (() => {
    const active = items.filter((i) => !i.isCompleted);
    if (active.length === 0) return null;
    const countMap: Record<string, number> = {};
    for (const i of active) {
      countMap[i.category] = (countMap[i.category] ?? 0) + 1;
    }
    const top = Object.entries(countMap).sort((a, b) => b[1] - a[1])[0];
    return (top?.[0] as WishCategory) ?? null;
  })();

  return {
    items,
    // CRUD
    addWish,
    deleteWish,
    voteWish,
    completeWish,
    // 필터 / 정렬
    filterByCategory,
    sortByVotes,
    // 통계
    totalWishes,
    completedCount,
    topCategory,
    // SWR
    refetch: () => mutate(),
  };
}
