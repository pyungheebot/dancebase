"use client";

import { useState, useEffect, useCallback } from "react";
import type { GoalBoardItem, GoalBoardStatus, GoalBoardPriority } from "@/types";

const STORAGE_KEY = (groupId: string) => `dancebase:goal-board:${groupId}`;

// ─── localStorage 헬퍼 ───────────────────────────────────────
function loadItems(groupId: string): GoalBoardItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as GoalBoardItem[];
  } catch {
    return [];
  }
}

function saveItems(groupId: string, items: GoalBoardItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(groupId), JSON.stringify(items));
}

// ─── 상태 순서 ───────────────────────────────────────────────
const STATUS_ORDER: GoalBoardStatus[] = ["todo", "in_progress", "done"];

function nextStatus(current: GoalBoardStatus): GoalBoardStatus | null {
  const idx = STATUS_ORDER.indexOf(current);
  return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
}

function prevStatus(current: GoalBoardStatus): GoalBoardStatus | null {
  const idx = STATUS_ORDER.indexOf(current);
  return idx > 0 ? STATUS_ORDER[idx - 1] : null;
}

// ─── 추가 파라미터 타입 ──────────────────────────────────────
export type AddGoalParams = {
  title: string;
  description: string;
  priority: GoalBoardPriority;
  assignees: string[];
  dueDate?: string;
  createdBy: string;
};

export type UpdateGoalParams = Partial<
  Pick<GoalBoardItem, "title" | "description" | "priority" | "assignees" | "dueDate">
>;

// ─── 훅 ────────────────────────────────────────────────────
export function usePracticeGoalBoard(groupId: string) {
  const [items, setItems] = useState<GoalBoardItem[]>([]);

  useEffect(() => {
    if (!groupId) return;
    setItems(loadItems(groupId));
  }, [groupId]);

  const persist = useCallback(
    (updated: GoalBoardItem[]) => {
      saveItems(groupId, updated);
      setItems(updated);
    },
    [groupId]
  );

  // 목표 추가
  const addItem = useCallback(
    (params: AddGoalParams): boolean => {
      if (!params.title.trim()) return false;
      const current = loadItems(groupId);
      const newItem: GoalBoardItem = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        description: params.description.trim(),
        status: "todo",
        priority: params.priority,
        assignees: params.assignees.filter(Boolean),
        dueDate: params.dueDate || undefined,
        createdBy: params.createdBy.trim() || "익명",
        createdAt: new Date().toISOString(),
      };
      persist([...current, newItem]);
      return true;
    },
    [groupId, persist]
  );

  // 목표 수정
  const updateItem = useCallback(
    (id: string, patch: UpdateGoalParams) => {
      const current = loadItems(groupId);
      persist(
        current.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        )
      );
    },
    [groupId, persist]
  );

  // 목표 삭제
  const deleteItem = useCallback(
    (id: string) => {
      const current = loadItems(groupId);
      persist(current.filter((item) => item.id !== id));
    },
    [groupId, persist]
  );

  // 다음 상태로 이동
  const moveForward = useCallback(
    (id: string) => {
      const current = loadItems(groupId);
      persist(
        current.map((item) => {
          if (item.id !== id) return item;
          const next = nextStatus(item.status);
          if (!next) return item;
          return {
            ...item,
            status: next,
            completedAt: next === "done" ? new Date().toISOString() : undefined,
          };
        })
      );
    },
    [groupId, persist]
  );

  // 이전 상태로 이동
  const moveBackward = useCallback(
    (id: string) => {
      const current = loadItems(groupId);
      persist(
        current.map((item) => {
          if (item.id !== id) return item;
          const prev = prevStatus(item.status);
          if (!prev) return item;
          return {
            ...item,
            status: prev,
            completedAt: undefined,
          };
        })
      );
    },
    [groupId, persist]
  );

  // 우선순위 변경
  const changePriority = useCallback(
    (id: string, priority: GoalBoardPriority) => {
      const current = loadItems(groupId);
      persist(
        current.map((item) =>
          item.id === id ? { ...item, priority } : item
        )
      );
    },
    [groupId, persist]
  );

  // ─── 상태별 그룹핑 ────────────────────────────────────────
  const grouped = {
    todo: items.filter((i) => i.status === "todo"),
    in_progress: items.filter((i) => i.status === "in_progress"),
    done: items.filter((i) => i.status === "done"),
  };

  // ─── 통계 ─────────────────────────────────────────────────
  const stats = {
    total: items.length,
    todoCount: grouped.todo.length,
    inProgressCount: grouped.in_progress.length,
    doneCount: grouped.done.length,
    completionRate:
      items.length === 0
        ? 0
        : Math.round((grouped.done.length / items.length) * 100),
  };

  return {
    items,
    grouped,
    stats,
    addItem,
    updateItem,
    deleteItem,
    moveForward,
    moveBackward,
    changePriority,
  };
}
