"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { MoodBoardData, MoodBoardItem, MoodBoardCategory } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

const STORAGE_KEY = (memberId: string) => `dance-mood-board-${memberId}`;

export function useDanceMoodBoard(memberId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.danceMoodBoard(memberId),
    () => loadFromStorage<MoodBoardData>(STORAGE_KEY(memberId), {} as MoodBoardData)
  );

  const boardData: MoodBoardData = data ?? {
    memberId,
    items: [],
    updatedAt: new Date().toISOString(),
  };

  /** 항목 추가 */
  async function addItem(
    payload: Omit<MoodBoardItem, "id" | "createdAt" | "updatedAt">
  ): Promise<void> {
    const now = new Date().toISOString();
    const newItem: MoodBoardItem = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const next: MoodBoardData = {
      ...boardData,
      items: [newItem, ...boardData.items],
      updatedAt: now,
    };
    saveToStorage(STORAGE_KEY(memberId), next);
    await mutate(next, false);
  }

  /** 항목 수정 */
  async function updateItem(
    id: string,
    payload: Partial<Omit<MoodBoardItem, "id" | "createdAt">>
  ): Promise<void> {
    const now = new Date().toISOString();
    const next: MoodBoardData = {
      ...boardData,
      items: boardData.items.map((item) =>
        item.id === id ? { ...item, ...payload, updatedAt: now } : item
      ),
      updatedAt: now,
    };
    saveToStorage(STORAGE_KEY(memberId), next);
    await mutate(next, false);
  }

  /** 항목 삭제 */
  async function removeItem(id: string): Promise<void> {
    const now = new Date().toISOString();
    const next: MoodBoardData = {
      ...boardData,
      items: boardData.items.filter((item) => item.id !== id),
      updatedAt: now,
    };
    saveToStorage(STORAGE_KEY(memberId), next);
    await mutate(next, false);
  }

  /** 카테고리별 항목 수 통계 */
  const categoryStats: Record<MoodBoardCategory, number> = {
    안무영감: 0,
    의상: 0,
    무대연출: 0,
    음악: 0,
    감정표현: 0,
    기타: 0,
  };
  for (const item of boardData.items) {
    categoryStats[item.category] = (categoryStats[item.category] ?? 0) + 1;
  }

  /** 태그 빈도 집계 */
  const tagFrequency: Record<string, number> = {};
  for (const item of boardData.items) {
    for (const tag of item.tags) {
      tagFrequency[tag] = (tagFrequency[tag] ?? 0) + 1;
    }
  }
  /** 자주 사용된 순으로 정렬된 태그 목록 (최대 20개) */
  const topTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  return {
    items: boardData.items,
    loading: isLoading,
    categoryStats,
    topTags,
    addItem,
    updateItem,
    removeItem,
    refetch: () => mutate(),
  };
}
