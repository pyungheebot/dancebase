"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  SafetyChecklistData,
  SafetyChecklistItem,
  SafetyChecklistCategory,
  SafetyChecklistStatus,
  SafetyChecklistPriority,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:safety-checklist:${groupId}:${projectId}`;
}

// ============================================
// 훅
// ============================================

export function useSafetyChecklist(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.safetyChecklist(groupId, projectId),
    () => loadFromStorage<SafetyChecklistData>(storageKey(groupId, projectId), {} as SafetyChecklistData),
    {
      fallbackData: {
        groupId,
        projectId,
        items: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const items: SafetyChecklistItem[] = data?.items ?? [];

  // 항목 추가
  const addItem = useCallback(
    (params: {
      category: SafetyChecklistCategory;
      content: string;
      assignee?: string;
      priority: SafetyChecklistPriority;
      notes?: string;
    }): SafetyChecklistItem => {
      const current = loadFromStorage<SafetyChecklistData>(storageKey(groupId, projectId), {} as SafetyChecklistData);
      const now = new Date().toISOString();
      const newItem: SafetyChecklistItem = {
        id: crypto.randomUUID(),
        category: params.category,
        content: params.content.trim(),
        assignee: params.assignee?.trim() || undefined,
        status: "pending",
        priority: params.priority,
        notes: params.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated: SafetyChecklistData = {
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
        category: SafetyChecklistCategory;
        content: string;
        assignee: string;
        priority: SafetyChecklistPriority;
        notes: string;
      }>
    ): boolean => {
      const current = loadFromStorage<SafetyChecklistData>(storageKey(groupId, projectId), {} as SafetyChecklistData);
      const idx = current.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;

      const existing = current.items[idx];
      const updatedItem: SafetyChecklistItem = {
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

      const updated: SafetyChecklistData = {
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

  // 확인 상태 변경
  const updateStatus = useCallback(
    (itemId: string, status: SafetyChecklistStatus): boolean => {
      const current = loadFromStorage<SafetyChecklistData>(storageKey(groupId, projectId), {} as SafetyChecklistData);
      const idx = current.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;

      const existing = current.items[idx];
      const now = new Date().toISOString();
      const updatedItem: SafetyChecklistItem = {
        ...existing,
        status,
        checkedAt: status === "checked" || status === "issue" ? now : undefined,
        updatedAt: now,
      };

      const updated: SafetyChecklistData = {
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
      const current = loadFromStorage<SafetyChecklistData>(storageKey(groupId, projectId), {} as SafetyChecklistData);
      const exists = current.items.some((i) => i.id === itemId);
      if (!exists) return false;

      const updated: SafetyChecklistData = {
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

  // 전체 초기화
  const resetAll = useCallback((): void => {
    const current = loadFromStorage<SafetyChecklistData>(storageKey(groupId, projectId), {} as SafetyChecklistData);
    const now = new Date().toISOString();
    const updated: SafetyChecklistData = {
      ...current,
      items: current.items.map((i) => ({
        ...i,
        status: "pending" as SafetyChecklistStatus,
        checkedAt: undefined,
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
    const checkedCount = items.filter((i) => i.status === "checked").length;
    const issueCount = items.filter((i) => i.status === "issue").length;
    const pendingCount = items.filter((i) => i.status === "pending").length;
    const progressRate =
      totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

    const categoryBreakdown = items.reduce<
      Record<SafetyChecklistCategory, number>
    >(
      (acc, i) => {
        acc[i.category] = (acc[i.category] ?? 0) + 1;
        return acc;
      },
      {} as Record<SafetyChecklistCategory, number>
    );

    const highPriorityPending = items.filter(
      (i) => i.priority === "high" && i.status === "pending"
    ).length;

    return {
      totalCount,
      checkedCount,
      issueCount,
      pendingCount,
      progressRate,
      categoryBreakdown,
      highPriorityPending,
    };
  })();

  return {
    items,
    loading: isLoading,
    refetch: () => mutate(),
    addItem,
    updateItem,
    updateStatus,
    deleteItem,
    resetAll,
    stats,
  };
}
