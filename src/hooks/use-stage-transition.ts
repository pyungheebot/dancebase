"use client";

import { useState, useEffect, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  StageTransitionItem,
  StageTransitionData,
  StageTransitionType,
  StageTransitionTask,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(projectId: string): string {
  return swrKeys.stageTransitionPlan(projectId);
}

function loadData(projectId: string): StageTransitionData {
  if (typeof window === "undefined") {
    return { projectId, items: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw)
      return { projectId, items: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as StageTransitionData;
  } catch {
    return { projectId, items: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: StageTransitionData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type StageTransitionStats = {
  /** 총 전환 수 */
  total: number;
  /** 전체 전환 시간 합계 (초) */
  totalDurationSec: number;
  /** 미연습 전환 수 */
  unrehearsedCount: number;
  /** 연습 완료 전환 수 */
  rehearsedCount: number;
  /** 평균 전환 시간 (초) */
  avgDurationSec: number;
};

// ============================================================
// 훅
// ============================================================

export function useStageTransition(projectId: string) {
  const [items, setItems] = useState<StageTransitionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!projectId) return;
    const data = loadData(projectId);
    const sorted = [...data.items].sort((a, b) => a.order - b.order);
    setItems(sorted);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (updated: StageTransitionItem[]) => {
      const data: StageTransitionData = {
        projectId,
        items: updated,
        updatedAt: new Date().toISOString(),
      };
      saveData(data);
      const sorted = [...updated].sort((a, b) => a.order - b.order);
      setItems(sorted);
    },
    [projectId]
  );

  // 전환 항목 추가
  const addItem = useCallback(
    (params: {
      fromScene: string;
      toScene: string;
      durationSec: number;
      transitionType: StageTransitionType;
      assignedStaff: string;
      notes: string;
    }): StageTransitionItem => {
      const now = new Date().toISOString();
      const maxOrder =
        items.length > 0 ? Math.max(...items.map((i) => i.order)) : 0;
      const newItem: StageTransitionItem = {
        id: crypto.randomUUID(),
        order: maxOrder + 1,
        fromScene: params.fromScene,
        toScene: params.toScene,
        durationSec: params.durationSec,
        transitionType: params.transitionType,
        tasks: [],
        assignedStaff: params.assignedStaff,
        rehearsed: false,
        notes: params.notes,
        createdAt: now,
        updatedAt: now,
      };
      persist([...items, newItem]);
      return newItem;
    },
    [items, persist]
  );

  // 전환 항목 수정
  const updateItem = useCallback(
    (
      itemId: string,
      params: Partial<Omit<StageTransitionItem, "id" | "createdAt">>
    ): boolean => {
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;
      const updated = items.map((i) =>
        i.id === itemId
          ? { ...i, ...params, updatedAt: new Date().toISOString() }
          : i
      );
      persist(updated);
      return true;
    },
    [items, persist]
  );

  // 전환 항목 삭제
  const deleteItem = useCallback(
    (itemId: string): boolean => {
      const exists = items.some((i) => i.id === itemId);
      if (!exists) return false;
      const filtered = items
        .filter((i) => i.id !== itemId)
        .map((i, idx) => ({ ...i, order: idx + 1 }));
      persist(filtered);
      return true;
    },
    [items, persist]
  );

  // 연습 완료 토글
  const toggleRehearsed = useCallback(
    (itemId: string): boolean => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return false;
      return updateItem(itemId, { rehearsed: !item.rehearsed });
    },
    [items, updateItem]
  );

  // 순서 이동 (위/아래)
  const moveItem = useCallback(
    (itemId: string, direction: "up" | "down"): boolean => {
      const sorted = [...items].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;
      if (direction === "up" && idx === 0) return false;
      if (direction === "down" && idx === sorted.length - 1) return false;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const newSorted = [...sorted];
      const tempOrder = newSorted[idx].order;
      newSorted[idx] = { ...newSorted[idx], order: newSorted[swapIdx].order };
      newSorted[swapIdx] = { ...newSorted[swapIdx], order: tempOrder };

      persist(newSorted);
      return true;
    },
    [items, persist]
  );

  // 할 일 추가
  const addTask = useCallback(
    (itemId: string, text: string): boolean => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return false;
      const newTask: StageTransitionTask = {
        id: crypto.randomUUID(),
        text,
        done: false,
      };
      return updateItem(itemId, { tasks: [...item.tasks, newTask] });
    },
    [items, updateItem]
  );

  // 할 일 완료 토글
  const toggleTask = useCallback(
    (itemId: string, taskId: string): boolean => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return false;
      const updatedTasks = item.tasks.map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      );
      return updateItem(itemId, { tasks: updatedTasks });
    },
    [items, updateItem]
  );

  // 할 일 삭제
  const deleteTask = useCallback(
    (itemId: string, taskId: string): boolean => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return false;
      const updatedTasks = item.tasks.filter((t) => t.id !== taskId);
      return updateItem(itemId, { tasks: updatedTasks });
    },
    [items, updateItem]
  );

  // 통계 계산
  const stats: StageTransitionStats = (() => {
    if (items.length === 0) {
      return {
        total: 0,
        totalDurationSec: 0,
        unrehearsedCount: 0,
        rehearsedCount: 0,
        avgDurationSec: 0,
      };
    }

    const totalDurationSec = items.reduce((acc, i) => acc + i.durationSec, 0);
    const rehearsedCount = items.filter((i) => i.rehearsed).length;
    const unrehearsedCount = items.length - rehearsedCount;
    const avgDurationSec =
      Math.round((totalDurationSec / items.length) * 10) / 10;

    return {
      total: items.length,
      totalDurationSec,
      unrehearsedCount,
      rehearsedCount,
      avgDurationSec,
    };
  })();

  return {
    items,
    loading,
    stats,
    addItem,
    updateItem,
    deleteItem,
    toggleRehearsed,
    moveItem,
    addTask,
    toggleTask,
    deleteTask,
    refetch: reload,
  };
}
