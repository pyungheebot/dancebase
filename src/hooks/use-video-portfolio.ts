"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  VideoPortfolioData,
  VideoPortfolioEntry,
  VideoPortfolioCategory,
  VideoPortfolioPlatform,
} from "@/types";

// ============================================
// 플랫폼 감지 유틸
// ============================================

export function detectPlatform(url: string): VideoPortfolioPlatform {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  return "other";
}

// ============================================
// localStorage 유틸
// ============================================

function storageKey(memberId: string): string {
  return `dancebase:video-portfolio:${memberId}`;
}

// ============================================
// 훅
// ============================================

export function useVideoPortfolio(memberId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.videoPortfolio(memberId),
    () => loadFromStorage<VideoPortfolioData>(storageKey(memberId), {} as VideoPortfolioData),
    {
      fallbackData: {
        memberId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: VideoPortfolioEntry[] = useMemo(() => data?.entries ?? [], [data?.entries]);

  // 영상 추가
  const addEntry = useCallback(
    (params: {
      title: string;
      url: string;
      category: VideoPortfolioCategory;
      date?: string;
      tags?: string[];
      description?: string;
      thumbnailUrl?: string;
      isPublic?: boolean;
    }): VideoPortfolioEntry => {
      const current = loadFromStorage<VideoPortfolioData>(storageKey(memberId), {} as VideoPortfolioData);
      const now = new Date().toISOString();
      const newEntry: VideoPortfolioEntry = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        url: params.url.trim(),
        platform: detectPlatform(params.url),
        category: params.category,
        date: params.date?.trim() || undefined,
        tags: params.tags ?? [],
        description: params.description?.trim() || undefined,
        thumbnailUrl: params.thumbnailUrl?.trim() || undefined,
        isPublic: params.isPublic ?? true,
        createdAt: now,
        updatedAt: now,
      };
      const updated: VideoPortfolioData = {
        ...current,
        entries: [newEntry, ...current.entries],
        updatedAt: now,
      };
      saveToStorage(storageKey(memberId), updated);
      mutate(updated, false);
      return newEntry;
    },
    [memberId, mutate]
  );

  // 영상 수정
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        title: string;
        url: string;
        category: VideoPortfolioCategory;
        date: string;
        tags: string[];
        description: string;
        thumbnailUrl: string;
        isPublic: boolean;
      }>
    ): boolean => {
      const current = loadFromStorage<VideoPortfolioData>(storageKey(memberId), {} as VideoPortfolioData);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const newUrl = params.url?.trim() ?? existing.url;
      const updatedEntry: VideoPortfolioEntry = {
        ...existing,
        ...params,
        url: newUrl,
        platform: params.url ? detectPlatform(newUrl) : existing.platform,
        title: params.title?.trim() ?? existing.title,
        date: params.date !== undefined ? (params.date.trim() || undefined) : existing.date,
        description:
          params.description !== undefined
            ? (params.description.trim() || undefined)
            : existing.description,
        thumbnailUrl:
          params.thumbnailUrl !== undefined
            ? (params.thumbnailUrl.trim() || undefined)
            : existing.thumbnailUrl,
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = current.entries.map((e) =>
        e.id === entryId ? updatedEntry : e
      );
      const updated: VideoPortfolioData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(memberId), updated);
      mutate(updated, false);
      return true;
    },
    [memberId, mutate]
  );

  // 영상 삭제
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadFromStorage<VideoPortfolioData>(storageKey(memberId), {} as VideoPortfolioData);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: VideoPortfolioData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(memberId), updated);
      mutate(updated, false);
      return true;
    },
    [memberId, mutate]
  );

  // 태그로 필터링
  const getEntriesByTag = useCallback(
    (tag: string): VideoPortfolioEntry[] =>
      entries.filter((e) => e.tags.includes(tag)),
    [entries]
  );

  // 카테고리로 필터링
  const getEntriesByCategory = useCallback(
    (category: VideoPortfolioCategory): VideoPortfolioEntry[] =>
      entries.filter((e) => e.category === category),
    [entries]
  );

  // 통계
  const stats = (() => {
    const totalCount = entries.length;
    const publicCount = entries.filter((e) => e.isPublic).length;
    const categoryBreakdown = entries.reduce<Record<VideoPortfolioCategory, number>>(
      (acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + 1;
        return acc;
      },
      {} as Record<VideoPortfolioCategory, number>
    );
    const platformBreakdown = entries.reduce<Record<VideoPortfolioPlatform, number>>(
      (acc, e) => {
        acc[e.platform] = (acc[e.platform] ?? 0) + 1;
        return acc;
      },
      {} as Record<VideoPortfolioPlatform, number>
    );
    const allTags = entries.flatMap((e) => e.tags);
    const uniqueTags = [...new Set(allTags)].sort();
    return { totalCount, publicCount, categoryBreakdown, platformBreakdown, uniqueTags };
  })();

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByTag,
    getEntriesByCategory,
    stats,
  };
}
