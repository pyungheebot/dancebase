"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  PracticeHighlightData,
  PracticeHighlightEntry,
  PracticeHighlightCategory,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:practice-highlight:${groupId}`;
}

// ============================================
// 훅
// ============================================

export function usePracticeHighlight(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.practiceHighlight(groupId),
    () => loadFromStorage<PracticeHighlightData>(storageKey(groupId), {} as PracticeHighlightData),
    {
      fallbackData: {
        groupId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: PracticeHighlightEntry[] = useMemo(() => data?.entries ?? [], [data?.entries]);

  // 하이라이트 추가
  const addEntry = useCallback(
    (params: {
      date: string;
      title: string;
      memberName: string;
      category: PracticeHighlightCategory;
      description?: string;
    }): PracticeHighlightEntry => {
      const current = loadFromStorage<PracticeHighlightData>(storageKey(groupId), {} as PracticeHighlightData);
      const now = new Date().toISOString();
      const newEntry: PracticeHighlightEntry = {
        id: crypto.randomUUID(),
        date: params.date.trim(),
        title: params.title.trim(),
        memberName: params.memberName.trim(),
        category: params.category,
        description: params.description?.trim() || undefined,
        likes: 0,
        createdAt: now,
        updatedAt: now,
      };
      // 날짜 최신순 정렬
      const updatedEntries = [...current.entries, newEntry].sort(
        (a, b) => b.date.localeCompare(a.date)
      );
      const updated: PracticeHighlightData = {
        ...current,
        entries: updatedEntries,
        updatedAt: now,
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return newEntry;
    },
    [groupId, mutate]
  );

  // 좋아요 토글 (1씩 증가, 최대값 없음)
  const likeEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadFromStorage<PracticeHighlightData>(storageKey(groupId), {} as PracticeHighlightData);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: PracticeHighlightEntry = {
        ...existing,
        likes: existing.likes + 1,
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = current.entries.map((e) =>
        e.id === entryId ? updatedEntry : e
      );
      const updated: PracticeHighlightData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 하이라이트 수정
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        date: string;
        title: string;
        memberName: string;
        category: PracticeHighlightCategory;
        description: string;
      }>
    ): boolean => {
      const current = loadFromStorage<PracticeHighlightData>(storageKey(groupId), {} as PracticeHighlightData);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: PracticeHighlightEntry = {
        ...existing,
        ...(params.date !== undefined && { date: params.date.trim() }),
        ...(params.title !== undefined && { title: params.title.trim() }),
        ...(params.memberName !== undefined && { memberName: params.memberName.trim() }),
        ...(params.category !== undefined && { category: params.category }),
        ...(params.description !== undefined && {
          description: params.description.trim() || undefined,
        }),
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = current.entries
        .map((e) => (e.id === entryId ? updatedEntry : e))
        .sort((a, b) => b.date.localeCompare(a.date));

      const updated: PracticeHighlightData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 하이라이트 삭제
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadFromStorage<PracticeHighlightData>(storageKey(groupId), {} as PracticeHighlightData);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: PracticeHighlightData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 카테고리별 집계
  const categoryCounts = entries.reduce<Record<PracticeHighlightCategory, number>>(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<PracticeHighlightCategory, number>
  );

  // 총 좋아요 수
  const totalLikes = entries.reduce((sum, e) => sum + e.likes, 0);

  // 날짜별 조회
  const getByDate = useCallback(
    (date: string) => entries.filter((e) => e.date === date),
    [entries]
  );

  // 카테고리별 조회
  const getByCategory = useCallback(
    (category: PracticeHighlightCategory) =>
      entries.filter((e) => e.category === category),
    [entries]
  );

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    likeEntry,
    updateEntry,
    deleteEntry,
    totalEntries: entries.length,
    totalLikes,
    categoryCounts,
    getByDate,
    getByCategory,
  };
}
