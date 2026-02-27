"use client";

import { useState, useCallback } from "react";
import type { ShowInventoryItem, ShowInventoryCategory } from "@/types";

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:show-inventory:${groupId}:${projectId}`;
}

function loadItems(groupId: string, projectId: string): ShowInventoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as ShowInventoryItem[];
  } catch {
    return [];
  }
}

function saveItems(
  groupId: string,
  projectId: string,
  items: ShowInventoryItem[]
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

export function useShowInventory(groupId: string, projectId: string) {
  const [items, setItems] = useState<ShowInventoryItem[]>(() =>
    loadItems(groupId, projectId)
  );

  const persist = useCallback(
    (next: ShowInventoryItem[]) => {
      setItems(next);
      saveItems(groupId, projectId, next);
    },
    [groupId, projectId]
  );

  // 아이템 추가
  const addItem = useCallback(
    (
      name: string,
      category: ShowInventoryCategory,
      quantity: number,
      assignedTo?: string,
      notes?: string,
      priority: "essential" | "important" | "optional" = "important"
    ): boolean => {
      if (!name.trim()) return false;
      const newItem: ShowInventoryItem = {
        id: crypto.randomUUID(),
        name: name.trim(),
        category,
        quantity: Math.max(1, quantity),
        assignedTo: assignedTo?.trim() || undefined,
        packed: false,
        notes: notes?.trim() || undefined,
        priority,
        createdAt: new Date().toISOString(),
      };
      persist([...items, newItem]);
      return true;
    },
    [items, persist]
  );

  // 아이템 수정
  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<ShowInventoryItem, "id" | "createdAt">>): void => {
      persist(
        items.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        )
      );
    },
    [items, persist]
  );

  // 아이템 삭제
  const deleteItem = useCallback(
    (id: string): void => {
      persist(items.filter((item) => item.id !== id));
    },
    [items, persist]
  );

  // 짐 싸기 토글
  const togglePacked = useCallback(
    (id: string, packedBy: string): void => {
      persist(
        items.map((item) => {
          if (item.id !== id) return item;
          const nowPacked = !item.packed;
          return {
            ...item,
            packed: nowPacked,
            packedBy: nowPacked ? packedBy : undefined,
            packedAt: nowPacked ? new Date().toISOString() : undefined,
          };
        })
      );
    },
    [items, persist]
  );

  // 카테고리별 필터
  const getByCategory = useCallback(
    (category: ShowInventoryCategory): ShowInventoryItem[] => {
      return items.filter((item) => item.category === category);
    },
    [items]
  );

  // 통계
  const totalItems = items.length;
  const packedCount = items.filter((item) => item.packed).length;
  const unpackedCount = totalItems - packedCount;
  const essentialUnpacked = items.filter(
    (item) => item.priority === "essential" && !item.packed
  ).length;
  const packProgress =
    totalItems === 0 ? 0 : Math.round((packedCount / totalItems) * 100);

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    togglePacked,
    getByCategory,
    totalItems,
    packedCount,
    unpackedCount,
    essentialUnpacked,
    packProgress,
  };
}
