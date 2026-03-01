"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  WardrobeTrackerData,
  WardrobeTrackItem,
  WardrobeTrackStatus,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(projectId: string): string {
  return `dancebase:wardrobe-tracker:${projectId}`;
}

function loadData(projectId: string): WardrobeTrackerData {
  if (typeof window === "undefined") {
    return { projectId, items: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) {
      return { projectId, items: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as WardrobeTrackerData;
  } catch {
    return { projectId, items: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(projectId: string, data: WardrobeTrackerData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useWardrobeTracker(projectId: string) {
  const { data, mutate, isLoading } = useSWR(
    projectId ? swrKeys.wardrobeTracker(projectId) : null,
    () => loadData(projectId)
  );

  const current: WardrobeTrackerData = useMemo(() => data ?? {
    projectId,
    items: [],
    updatedAt: new Date().toISOString(),
  }, [data, projectId]);

  const persist = useCallback(
    (next: WardrobeTrackerData) => {
      saveData(projectId, next);
      mutate(next, false);
    },
    [projectId, mutate]
  );

  // ── 의상 항목 CRUD ─────────────────────────────────────────

  const addItem = useCallback(
    (partial: Omit<WardrobeTrackItem, "id" | "createdAt">): WardrobeTrackItem => {
      const newItem: WardrobeTrackItem = {
        id: crypto.randomUUID(),
        ...partial,
        createdAt: new Date().toISOString(),
      };
      persist({
        ...current,
        items: [...current.items, newItem],
        updatedAt: new Date().toISOString(),
      });
      return newItem;
    },
    [current, persist]
  );

  const updateItem = useCallback(
    (
      itemId: string,
      partial: Partial<Omit<WardrobeTrackItem, "id" | "createdAt">>
    ): boolean => {
      const idx = current.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;
      const next = [...current.items];
      next[idx] = {
        ...next[idx],
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      persist({ ...current, items: next, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  const deleteItem = useCallback(
    (itemId: string): boolean => {
      const filtered = current.items.filter((i) => i.id !== itemId);
      if (filtered.length === current.items.length) return false;
      persist({ ...current, items: filtered, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  const toggleReturned = useCallback(
    (itemId: string): boolean => {
      const idx = current.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;
      const next = [...current.items];
      next[idx] = {
        ...next[idx],
        returned: !next[idx].returned,
        updatedAt: new Date().toISOString(),
      };
      persist({ ...current, items: next, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 통계 ──────────────────────────────────────────────────

  const total = current.items.length;
  const readyCount = current.items.filter((i) => i.status === "ready").length;
  const readyRate = total === 0 ? 0 : Math.round((readyCount / total) * 100);
  const returnedCount = current.items.filter((i) => i.returned).length;
  const returnRate = total === 0 ? 0 : Math.round((returnedCount / total) * 100);

  const statusCounts: Record<WardrobeTrackStatus, number> = {
    preparing: current.items.filter((i) => i.status === "preparing").length,
    repairing: current.items.filter((i) => i.status === "repairing").length,
    ready: readyCount,
    lost: current.items.filter((i) => i.status === "lost").length,
  };

  // 멤버별 그룹핑
  const byMember: Record<string, WardrobeTrackItem[]> = {};
  for (const item of current.items) {
    if (!byMember[item.memberName]) byMember[item.memberName] = [];
    byMember[item.memberName].push(item);
  }

  const stats = {
    total,
    readyRate,
    returnRate,
    returnedCount,
    statusCounts,
    byMember,
  };

  return {
    data: current,
    loading: isLoading,
    addItem,
    updateItem,
    deleteItem,
    toggleReturned,
    stats,
    refetch: () => mutate(),
  };
}
