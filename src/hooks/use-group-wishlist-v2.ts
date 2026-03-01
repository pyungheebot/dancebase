"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  GroupWishItem,
  GroupWishCategory,
  GroupWishPriority,
  GroupWishStatus,
} from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:wishlist-v2:${groupId}`;

function loadItems(groupId: string): GroupWishItem[] {
  return loadFromStorage<GroupWishItem[]>(LS_KEY(groupId), []);
}

function saveItems(groupId: string, items: GroupWishItem[]): void {
  saveToStorage(LS_KEY(groupId), items);
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useGroupWishlistV2(groupId: string) {
  const { data, mutate, isLoading } = useSWR(
    groupId ? swrKeys.groupWishlistV2(groupId) : null,
    () => loadItems(groupId),
    { revalidateOnFocus: false }
  );

  const items: GroupWishItem[] = useMemo(() => data ?? [], [data]);

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  const persist = useCallback(
    (next: GroupWishItem[]): void => {
      saveItems(groupId, next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  // ── 항목 추가 ────────────────────────────────────────────

  const addItem = useCallback(
    (
      title: string,
      description: string,
      category: GroupWishCategory,
      priority: GroupWishPriority,
      estimatedCost: number,
      proposedBy: string
    ): boolean => {
      if (!title.trim() || !proposedBy.trim()) return false;
      const stored = loadItems(groupId);
      const newItem: GroupWishItem = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: "proposed",
        estimatedCost: Math.max(0, estimatedCost),
        likes: 0,
        proposedBy: proposedBy.trim(),
        createdAt: new Date().toISOString(),
      };
      persist([newItem, ...stored]);
      return true;
    },
    [groupId, persist]
  );

  // ── 항목 수정 ────────────────────────────────────────────

  const updateItem = useCallback(
    (itemId: string, partial: Partial<Omit<GroupWishItem, "id" | "createdAt">>): boolean => {
      const stored = loadItems(groupId);
      const idx = stored.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;
      const next = [...stored];
      next[idx] = {
        ...next[idx],
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      return true;
    },
    [groupId, persist]
  );

  // ── 항목 삭제 ────────────────────────────────────────────

  const deleteItem = useCallback(
    (itemId: string): boolean => {
      const stored = loadItems(groupId);
      const next = stored.filter((i) => i.id !== itemId);
      if (next.length === stored.length) return false;
      persist(next);
      return true;
    },
    [groupId, persist]
  );

  // ── 좋아요(+1) ───────────────────────────────────────────

  const likeItem = useCallback(
    (itemId: string): boolean => {
      const stored = loadItems(groupId);
      const idx = stored.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;
      const next = stored.map((i) =>
        i.id === itemId ? { ...i, likes: i.likes + 1 } : i
      );
      persist(next);
      return true;
    },
    [groupId, persist]
  );

  // ── 상태 변경 ────────────────────────────────────────────

  const changeStatus = useCallback(
    (itemId: string, status: GroupWishStatus): boolean => {
      return updateItem(itemId, { status });
    },
    [updateItem]
  );

  // ── 필터 ─────────────────────────────────────────────────

  const filterByCategory = useCallback(
    (category: GroupWishCategory | "all"): GroupWishItem[] => {
      if (category === "all") return items;
      return items.filter((i) => i.category === category);
    },
    [items]
  );

  const filterByStatus = useCallback(
    (status: GroupWishStatus | "all"): GroupWishItem[] => {
      if (status === "all") return items;
      return items.filter((i) => i.status === status);
    },
    [items]
  );

  // ── 정렬 (좋아요 내림차순) ───────────────────────────────

  const sortByLikes = useCallback(
    (list: GroupWishItem[]): GroupWishItem[] =>
      [...list].sort(
        (a, b) => b.likes - a.likes || b.createdAt.localeCompare(a.createdAt)
      ),
    []
  );

  // ── 통계 ─────────────────────────────────────────────────

  const stats = {
    total: items.length,
    approved: items.filter((i) => i.status === "approved").length,
    completed: items.filter((i) => i.status === "completed").length,
    approvalRate:
      items.length > 0
        ? Math.round(
            ((items.filter((i) => i.status === "approved" || i.status === "completed").length) /
              items.length) *
              100
          )
        : 0,
    completionRate:
      items.length > 0
        ? Math.round(
            (items.filter((i) => i.status === "completed").length / items.length) * 100
          )
        : 0,
  };

  // 카테고리별 항목 수
  const categoryCount: Record<GroupWishCategory, number> = {
    practice_song: items.filter((i) => i.category === "practice_song").length,
    equipment: items.filter((i) => i.category === "equipment").length,
    costume: items.filter((i) => i.category === "costume").length,
    venue: items.filter((i) => i.category === "venue").length,
    event: items.filter((i) => i.category === "event").length,
    other: items.filter((i) => i.category === "other").length,
  };

  return {
    items,
    loading: isLoading,
    // CRUD
    addItem,
    updateItem,
    deleteItem,
    likeItem,
    changeStatus,
    // 필터 / 정렬
    filterByCategory,
    filterByStatus,
    sortByLikes,
    // 통계
    stats,
    categoryCount,
    // SWR
    refetch: () => mutate(),
  };
}
