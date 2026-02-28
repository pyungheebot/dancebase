"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  LiveShowFeedData,
  LiveShowFeedEntry,
  LiveShowFeedType,
  LiveShowFeedPriority,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:live-show-feed:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): LiveShowFeedData {
  if (typeof window === "undefined") {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) {
      return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as LiveShowFeedData;
  } catch {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: LiveShowFeedData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(data.groupId, data.projectId),
      JSON.stringify(data)
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useLiveShowFeed(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.liveShowFeed(groupId, projectId),
    () => loadData(groupId, projectId),
    {
      fallbackData: {
        groupId,
        projectId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: LiveShowFeedEntry[] = data?.entries ?? [];

  /** 피드 엔트리 추가 */
  const addEntry = useCallback(
    (params: {
      timestamp: string;
      message: string;
      author: string;
      type: LiveShowFeedType;
      priority: LiveShowFeedPriority;
      imageUrl?: string;
    }): LiveShowFeedEntry => {
      const current = loadData(groupId, projectId);
      const now = new Date().toISOString();
      const newEntry: LiveShowFeedEntry = {
        id: crypto.randomUUID(),
        timestamp: params.timestamp,
        message: params.message.trim(),
        author: params.author.trim(),
        type: params.type,
        priority: params.priority,
        imageUrl: params.imageUrl?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated: LiveShowFeedData = {
        ...current,
        entries: [newEntry, ...current.entries],
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated, false);
      return newEntry;
    },
    [groupId, projectId, mutate]
  );

  /** 피드 엔트리 수정 */
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        timestamp: string;
        message: string;
        author: string;
        type: LiveShowFeedType;
        priority: LiveShowFeedPriority;
        imageUrl: string;
      }>
    ): boolean => {
      const current = loadData(groupId, projectId);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: LiveShowFeedEntry = {
        ...existing,
        ...(params.timestamp !== undefined && { timestamp: params.timestamp }),
        ...(params.message !== undefined && { message: params.message.trim() }),
        ...(params.author !== undefined && { author: params.author.trim() }),
        ...(params.type !== undefined && { type: params.type }),
        ...(params.priority !== undefined && { priority: params.priority }),
        imageUrl:
          params.imageUrl !== undefined
            ? params.imageUrl.trim() || undefined
            : existing.imageUrl,
        updatedAt: new Date().toISOString(),
      };

      const updated: LiveShowFeedData = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === entryId ? updatedEntry : e
        ),
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 피드 엔트리 삭제 */
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadData(groupId, projectId);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: LiveShowFeedData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 통계 */
  const stats = (() => {
    const total = entries.length;
    const urgentCount = entries.filter((e) => e.priority === "urgent").length;
    const importantCount = entries.filter((e) => e.priority === "important").length;
    const byType: Record<LiveShowFeedType, number> = {
      stage: 0,
      backstage: 0,
      audience: 0,
      technical: 0,
      other: 0,
    };
    for (const e of entries) {
      byType[e.type] = (byType[e.type] ?? 0) + 1;
    }
    return { total, urgentCount, importantCount, byType };
  })();

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    stats,
  };
}
