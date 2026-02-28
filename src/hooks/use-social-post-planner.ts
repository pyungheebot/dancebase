"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  SocialPostEntry,
  SocialPostPlannerData,
  SocialPlatform,
  SocialPostType,
  SocialPostStatus,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:social-post-planner:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): SocialPostPlannerData {
  if (typeof window === "undefined") {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) {
      return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as SocialPostPlannerData;
  } catch {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: SocialPostPlannerData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.groupId, data.projectId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useSocialPostPlanner(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.socialPostPlanner(groupId, projectId),
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

  const entries: SocialPostEntry[] = data?.entries ?? [];

  /** 포스트 추가 */
  const addEntry = useCallback(
    (params: {
      title: string;
      content: string;
      hashtags: string[];
      platform: SocialPlatform;
      postType: SocialPostType;
      status: SocialPostStatus;
      scheduledDate: string;
      scheduledTime: string;
      assignee: string;
      notes?: string;
    }): SocialPostEntry => {
      const current = loadData(groupId, projectId);
      const now = new Date().toISOString();
      const newEntry: SocialPostEntry = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        content: params.content.trim(),
        hashtags: params.hashtags.filter((h) => h.trim() !== ""),
        platform: params.platform,
        postType: params.postType,
        status: params.status,
        scheduledDate: params.scheduledDate,
        scheduledTime: params.scheduledTime,
        assignee: params.assignee.trim(),
        notes: params.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated: SocialPostPlannerData = {
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

  /** 포스트 수정 */
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        title: string;
        content: string;
        hashtags: string[];
        platform: SocialPlatform;
        postType: SocialPostType;
        status: SocialPostStatus;
        scheduledDate: string;
        scheduledTime: string;
        assignee: string;
        notes: string;
      }>
    ): boolean => {
      const current = loadData(groupId, projectId);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: SocialPostEntry = {
        ...existing,
        ...(params.title !== undefined && { title: params.title.trim() }),
        ...(params.content !== undefined && { content: params.content.trim() }),
        ...(params.hashtags !== undefined && {
          hashtags: params.hashtags.filter((h) => h.trim() !== ""),
        }),
        ...(params.platform !== undefined && { platform: params.platform }),
        ...(params.postType !== undefined && { postType: params.postType }),
        ...(params.status !== undefined && { status: params.status }),
        ...(params.scheduledDate !== undefined && { scheduledDate: params.scheduledDate }),
        ...(params.scheduledTime !== undefined && { scheduledTime: params.scheduledTime }),
        ...(params.assignee !== undefined && { assignee: params.assignee.trim() }),
        notes:
          params.notes !== undefined
            ? params.notes.trim() || undefined
            : existing.notes,
        updatedAt: new Date().toISOString(),
      };

      const updated: SocialPostPlannerData = {
        ...current,
        entries: current.entries.map((e) => (e.id === entryId ? updatedEntry : e)),
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 포스트 삭제 */
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadData(groupId, projectId);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: SocialPostPlannerData = {
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

    // 플랫폼별 포스트 수
    const platformCountMap: Partial<Record<SocialPlatform, number>> = {};
    for (const e of entries) {
      platformCountMap[e.platform] = (platformCountMap[e.platform] ?? 0) + 1;
    }

    // 상태별 분포
    const statusCountMap: Record<SocialPostStatus, number> = {
      draft: 0,
      scheduled: 0,
      published: 0,
      cancelled: 0,
    };
    for (const e of entries) {
      statusCountMap[e.status] += 1;
    }

    return { total, platformCountMap, statusCountMap };
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
