"use client";

import { useState, useCallback } from "react";
import type { SetListItem, SetListItemType } from "@/types";

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:set-list:${groupId}:${projectId}`;
}

function loadItems(groupId: string, projectId: string): SetListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as SetListItem[];
  } catch {
    return [];
  }
}

function saveItems(
  groupId: string,
  projectId: string,
  items: SetListItem[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(groupId, projectId),
      JSON.stringify(items)
    );
  } catch {
    // 저장 실패 시 무시
  }
}

export function useSetList(groupId: string, projectId: string) {
  const [items, setItems] = useState<SetListItem[]>(() =>
    loadItems(groupId, projectId)
  );

  const persist = useCallback(
    (next: SetListItem[]) => {
      setItems(next);
      saveItems(groupId, projectId, next);
    },
    [groupId, projectId]
  );

  /** 항목 추가 */
  const addItem = useCallback(
    (
      type: SetListItemType,
      title: string,
      artist?: string,
      duration: number = 0,
      performers: string[] = [],
      notes?: string,
      transitionNote?: string
    ): boolean => {
      if (!title.trim()) return false;
      const maxOrder =
        items.length === 0 ? 0 : Math.max(...items.map((i) => i.order));
      const newItem: SetListItem = {
        id: crypto.randomUUID(),
        order: maxOrder + 1,
        type,
        title: title.trim(),
        artist: artist?.trim() || undefined,
        duration: Math.max(0, duration),
        performers,
        notes: notes?.trim() || undefined,
        transitionNote: transitionNote?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      persist([...items, newItem]);
      return true;
    },
    [items, persist]
  );

  /** 항목 수정 */
  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<SetListItem, "id" | "createdAt">>): void => {
      persist(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [items, persist]
  );

  /** 항목 삭제 */
  const deleteItem = useCallback(
    (id: string): void => {
      const next = items.filter((item) => item.id !== id);
      // order 재정렬
      const reordered = next.map((item, idx) => ({ ...item, order: idx + 1 }));
      persist(reordered);
    },
    [items, persist]
  );

  /** 순서 변경 (up/down) */
  const moveItem = useCallback(
    (id: string, direction: "up" | "down"): void => {
      const sorted = [...items].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((item) => item.id === id);
      if (idx === -1) return;

      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sorted.length) return;

      // order 값 교환
      const updatedA = { ...sorted[idx], order: sorted[targetIdx].order };
      const updatedB = { ...sorted[targetIdx], order: sorted[idx].order };

      persist(
        items.map((item) => {
          if (item.id === updatedA.id) return updatedA;
          if (item.id === updatedB.id) return updatedB;
          return item;
        })
      );
    },
    [items, persist]
  );

  // 통계
  const sortedItems = [...items].sort((a, b) => a.order - b.order);
  const totalItems = items.length;
  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);
  const performanceCount = items.filter((item) => item.type === "performance").length;
  const totalPerformers = new Set(items.flatMap((item) => item.performers)).size;

  return {
    items: sortedItems,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    totalItems,
    totalDuration,
    performanceCount,
    totalPerformers,
  };
}
