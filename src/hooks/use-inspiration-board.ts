"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  InspirationBoardItem,
  InspirationCategory,
  InspirationMediaType,
} from "@/types";

function getStorageKey(memberId: string) {
  return `dancebase:inspiration-board:${memberId}`;
}

function loadItems(memberId: string): InspirationBoardItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    return raw ? (JSON.parse(raw) as InspirationBoardItem[]) : [];
  } catch {
    return [];
  }
}

function saveItems(memberId: string, items: InspirationBoardItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(memberId), JSON.stringify(items));
}

export function useInspirationBoard(memberId: string) {
  const { data, mutate } = useSWR(
    swrKeys.inspirationBoard(memberId),
    () => loadItems(memberId),
    { fallbackData: [] }
  );

  const items: InspirationBoardItem[] = data ?? [];

  // 아이템 추가
  async function addItem(
    payload: Omit<InspirationBoardItem, "id" | "createdAt" | "isFavorite">
  ) {
    const newItem: InspirationBoardItem = {
      ...payload,
      id: crypto.randomUUID(),
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...items];
    saveItems(memberId, updated);
    await mutate(updated, false);
    return newItem;
  }

  // 아이템 수정
  async function updateItem(
    id: string,
    patch: Partial<Omit<InspirationBoardItem, "id" | "createdAt">>
  ) {
    const updated = items.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    saveItems(memberId, updated);
    await mutate(updated, false);
  }

  // 아이템 삭제
  async function deleteItem(id: string) {
    const updated = items.filter((item) => item.id !== id);
    saveItems(memberId, updated);
    await mutate(updated, false);
  }

  // 즐겨찾기 토글
  async function toggleFavorite(id: string) {
    const updated = items.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    saveItems(memberId, updated);
    await mutate(updated, false);
  }

  // 태그별 필터
  function getByTag(tag: string): InspirationBoardItem[] {
    return items.filter((item) => item.tags.includes(tag));
  }

  // 카테고리별 필터
  function getByCategory(category: InspirationCategory): InspirationBoardItem[] {
    return items.filter((item) => item.category === category);
  }

  // 미디어 유형별 필터
  function getByMediaType(type: InspirationMediaType): InspirationBoardItem[] {
    return items.filter((item) => item.mediaType === type);
  }

  // 즐겨찾기 목록
  function getFavorites(): InspirationBoardItem[] {
    return items.filter((item) => item.isFavorite);
  }

  // 태그 클라우드 (태그별 카운트)
  const tagCloud: Record<string, number> = {};
  for (const item of items) {
    for (const tag of item.tags) {
      tagCloud[tag] = (tagCloud[tag] ?? 0) + 1;
    }
  }

  // 카테고리별 분포
  const categoryDistribution: Record<InspirationCategory, number> = {
    choreography: 0,
    music: 0,
    fashion: 0,
    stage_design: 0,
    artwork: 0,
    other: 0,
  };
  for (const item of items) {
    if (item.category) {
      categoryDistribution[item.category] =
        (categoryDistribution[item.category] ?? 0) + 1;
    }
  }

  const stats = {
    totalItems: items.length,
    favoriteCount: items.filter((i) => i.isFavorite).length,
    tagCloud,
    categoryDistribution,
  };

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    getByTag,
    getByCategory,
    getByMediaType,
    getFavorites,
    stats,
    refetch: () => mutate(),
  };
}
