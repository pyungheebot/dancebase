"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  StageSetupChecklistData,
  StageSetupChecklistItem,
  StageSetupCategory,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:stage-setup-checklist:${groupId}:${projectId}`;
}

// ============================================
// 훅
// ============================================

export function useStageSetupChecklist(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.stageSetupChecklist(groupId, projectId),
    () => loadFromStorage<StageSetupChecklistData>(storageKey(groupId, projectId), {} as StageSetupChecklistData),
    {
      fallbackData: {
        groupId,
        projectId,
        items: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const items: StageSetupChecklistItem[] = data?.items ?? [];

  // 항목 추가
  const addItem = useCallback(
    (params: {
      category: StageSetupCategory;
      content: string;
      assignee?: string;
      notes?: string;
    }): StageSetupChecklistItem => {
      const current = loadFromStorage<StageSetupChecklistData>(storageKey(groupId, projectId), {} as StageSetupChecklistData);
      const now = new Date().toISOString();
      const newItem: StageSetupChecklistItem = {
        id: crypto.randomUUID(),
        category: params.category,
        content: params.content.trim(),
        completed: false,
        assignee: params.assignee?.trim() || undefined,
        notes: params.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated: StageSetupChecklistData = {
        ...current,
        items: [...current.items, newItem],
        updatedAt: now,
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return newItem;
    },
    [groupId, projectId, mutate]
  );

  // 항목 수정
  const updateItem = useCallback(
    (
      itemId: string,
      params: Partial<{
        category: StageSetupCategory;
        content: string;
        assignee: string;
        notes: string;
      }>
    ): boolean => {
      const current = loadFromStorage<StageSetupChecklistData>(storageKey(groupId, projectId), {} as StageSetupChecklistData);
      const idx = current.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;

      const existing = current.items[idx];
      const updatedItem: StageSetupChecklistItem = {
        ...existing,
        ...params,
        content: params.content?.trim() ?? existing.content,
        assignee:
          params.assignee !== undefined
            ? params.assignee.trim() || undefined
            : existing.assignee,
        notes:
          params.notes !== undefined
            ? params.notes.trim() || undefined
            : existing.notes,
        updatedAt: new Date().toISOString(),
      };

      const updated: StageSetupChecklistData = {
        ...current,
        items: current.items.map((i) => (i.id === itemId ? updatedItem : i)),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 완료 토글
  const toggleItem = useCallback(
    (itemId: string): boolean => {
      const current = loadFromStorage<StageSetupChecklistData>(storageKey(groupId, projectId), {} as StageSetupChecklistData);
      const idx = current.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;

      const existing = current.items[idx];
      const now = new Date().toISOString();
      const nextCompleted = !existing.completed;
      const updatedItem: StageSetupChecklistItem = {
        ...existing,
        completed: nextCompleted,
        completedAt: nextCompleted ? now : undefined,
        updatedAt: now,
      };

      const updated: StageSetupChecklistData = {
        ...current,
        items: current.items.map((i) => (i.id === itemId ? updatedItem : i)),
        updatedAt: now,
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 항목 삭제
  const deleteItem = useCallback(
    (itemId: string): boolean => {
      const current = loadFromStorage<StageSetupChecklistData>(storageKey(groupId, projectId), {} as StageSetupChecklistData);
      const exists = current.items.some((i) => i.id === itemId);
      if (!exists) return false;

      const updated: StageSetupChecklistData = {
        ...current,
        items: current.items.filter((i) => i.id !== itemId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 전체 초기화 (완료 상태만 리셋)
  const resetAll = useCallback((): void => {
    const current = loadFromStorage<StageSetupChecklistData>(storageKey(groupId, projectId), {} as StageSetupChecklistData);
    const now = new Date().toISOString();
    const updated: StageSetupChecklistData = {
      ...current,
      items: current.items.map((i) => ({
        ...i,
        completed: false,
        completedAt: undefined,
        updatedAt: now,
      })),
      updatedAt: now,
    };
    saveToStorage(storageKey(groupId, projectId), updated);
    mutate(updated, false);
  }, [groupId, projectId, mutate]);

  // 통계
  const stats = (() => {
    const totalCount = items.length;
    const completedCount = items.filter((i) => i.completed).length;
    const pendingCount = totalCount - completedCount;
    const progressRate =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const categoryStats = (
      [
        "sound",
        "lighting",
        "floor",
        "props",
        "costume",
        "tech",
      ] as StageSetupCategory[]
    ).reduce<
      Record<
        StageSetupCategory,
        { total: number; completed: number; rate: number }
      >
    >(
      (acc, cat) => {
        const catItems = items.filter((i) => i.category === cat);
        const catCompleted = catItems.filter((i) => i.completed).length;
        acc[cat] = {
          total: catItems.length,
          completed: catCompleted,
          rate:
            catItems.length > 0
              ? Math.round((catCompleted / catItems.length) * 100)
              : 0,
        };
        return acc;
      },
      {} as Record<
        StageSetupCategory,
        { total: number; completed: number; rate: number }
      >
    );

    return {
      totalCount,
      completedCount,
      pendingCount,
      progressRate,
      categoryStats,
    };
  })();

  return {
    items,
    loading: isLoading,
    refetch: () => mutate(),
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    resetAll,
    stats,
  };
}
