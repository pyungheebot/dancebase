"use client";

import { useState, useCallback } from "react";
import type {
  ShowDayChecklistItem,
  ShowDayTimeSlot,
  ShowDayPriority,
} from "@/types";

function getStorageKey(projectId: string): string {
  return `dancebase:show-day-checklist:${projectId}`;
}

function loadItems(projectId: string): ShowDayChecklistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return [];
    return JSON.parse(raw) as ShowDayChecklistItem[];
  } catch {
    return [];
  }
}

function saveItems(projectId: string, items: ShowDayChecklistItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(items));
  } catch {
    // 저장 실패 시 무시
  }
}

export function useShowDayChecklist(projectId: string) {
  const [items, setItems] = useState<ShowDayChecklistItem[]>(() =>
    loadItems(projectId)
  );

  const persist = useCallback(
    (next: ShowDayChecklistItem[]) => {
      setItems(next);
      saveItems(projectId, next);
    },
    [projectId]
  );

  // 항목 추가
  const addItem = useCallback(
    (
      timeSlot: ShowDayTimeSlot,
      title: string,
      priority: ShowDayPriority = "recommended",
      assignedTo?: string
    ): boolean => {
      if (!title.trim()) return false;
      const newItem: ShowDayChecklistItem = {
        id: crypto.randomUUID(),
        timeSlot,
        title: title.trim(),
        assignedTo: assignedTo?.trim() || undefined,
        completed: false,
        priority,
        createdAt: new Date().toISOString(),
      };
      persist([...items, newItem]);
      return true;
    },
    [items, persist]
  );

  // 항목 수정
  const updateItem = useCallback(
    (
      id: string,
      patch: Partial<Omit<ShowDayChecklistItem, "id" | "createdAt">>
    ): void => {
      persist(
        items.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    [items, persist]
  );

  // 항목 삭제
  const deleteItem = useCallback(
    (id: string): void => {
      persist(items.filter((item) => item.id !== id));
    },
    [items, persist]
  );

  // 완료 토글
  const toggleCompleted = useCallback(
    (id: string): void => {
      persist(
        items.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      );
    },
    [items, persist]
  );

  // 시간대별 항목 반환
  const getByTimeSlot = useCallback(
    (timeSlot: ShowDayTimeSlot): ShowDayChecklistItem[] => {
      return items.filter((item) => item.timeSlot === timeSlot);
    },
    [items]
  );

  // 통계
  const totalItems = items.length;
  const completedCount = items.filter((item) => item.completed).length;
  const requiredUncompletedCount = items.filter(
    (item) => item.priority === "required" && !item.completed
  ).length;
  const overallProgress =
    totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100);

  // 시간대별 완료율
  const getTimeSlotProgress = useCallback(
    (timeSlot: ShowDayTimeSlot): number => {
      const slotItems = items.filter((item) => item.timeSlot === timeSlot);
      if (slotItems.length === 0) return 0;
      const done = slotItems.filter((item) => item.completed).length;
      return Math.round((done / slotItems.length) * 100);
    },
    [items]
  );

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    toggleCompleted,
    getByTimeSlot,
    totalItems,
    completedCount,
    requiredUncompletedCount,
    overallProgress,
    getTimeSlotProgress,
  };
}
