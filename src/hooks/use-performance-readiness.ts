"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReadinessChecklist, ReadinessCheckItem, ReadinessCategory } from "@/types";

// ─── localStorage 키 ────────────────────────────────────────

const STORAGE_KEY = (groupId: string, projectId: string) =>
  `dancebase:readiness:${groupId}:${projectId}`;

// ─── 저장/로드 헬퍼 ──────────────────────────────────────────

function loadChecklists(groupId: string, projectId: string): ReadinessChecklist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as ReadinessChecklist[];
  } catch {
    return [];
  }
}

function saveChecklists(groupId: string, projectId: string, lists: ReadinessChecklist[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(groupId, projectId), JSON.stringify(lists));
}

// ─── 카테고리별 진행률 계산 ──────────────────────────────────

export function calcCategoryProgress(
  items: ReadinessCheckItem[],
  category: ReadinessCategory
): number {
  const catItems = items.filter((i) => i.category === category);
  if (catItems.length === 0) return 0;
  const done = catItems.filter((i) => i.completed).length;
  return Math.round((done / catItems.length) * 100);
}

// ─── 전체 진행률 계산 ────────────────────────────────────────

export function calcTotalProgress(items: ReadinessCheckItem[]): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.completed).length;
  return Math.round((done / items.length) * 100);
}

// ─── 훅 ──────────────────────────────────────────────────────

export function usePerformanceReadiness(groupId: string, projectId: string) {
  const [checklists, setChecklists] = useState<ReadinessChecklist[]>([]);

  // 초기 로드
  useEffect(() => {
    if (!groupId || !projectId) return;
    setChecklists(loadChecklists(groupId, projectId));
  }, [groupId, projectId]);

  // 상태 동기화 + 저장
  const persist = useCallback(
    (next: ReadinessChecklist[]) => {
      saveChecklists(groupId, projectId, next);
      setChecklists(next);
    },
    [groupId, projectId]
  );

  // ── 체크리스트 생성 ──────────────────────────────────────

  const createChecklist = useCallback(
    (params: { eventName: string; eventDate: string }): string => {
      const current = loadChecklists(groupId, projectId);
      const newList: ReadinessChecklist = {
        id: crypto.randomUUID(),
        eventName: params.eventName,
        eventDate: params.eventDate,
        items: [],
        createdAt: new Date().toISOString(),
      };
      persist([...current, newList]);
      return newList.id;
    },
    [groupId, projectId, persist]
  );

  // ── 체크리스트 삭제 ──────────────────────────────────────

  const deleteChecklist = useCallback(
    (checklistId: string) => {
      const current = loadChecklists(groupId, projectId);
      persist(current.filter((c) => c.id !== checklistId));
    },
    [groupId, projectId, persist]
  );

  // ── 항목 추가 ────────────────────────────────────────────

  const addItem = useCallback(
    (
      checklistId: string,
      params: Omit<ReadinessCheckItem, "id" | "completed" | "completedAt">
    ): boolean => {
      const current = loadChecklists(groupId, projectId);
      const idx = current.findIndex((c) => c.id === checklistId);
      if (idx === -1) return false;

      const newItem: ReadinessCheckItem = {
        id: crypto.randomUUID(),
        ...params,
        completed: false,
      };
      const updated = current.map((c, i) =>
        i === idx ? { ...c, items: [...c.items, newItem] } : c
      );
      persist(updated);
      return true;
    },
    [groupId, projectId, persist]
  );

  // ── 항목 완료 토글 ──────────────────────────────────────

  const toggleItem = useCallback(
    (checklistId: string, itemId: string) => {
      const current = loadChecklists(groupId, projectId);
      const updated = current.map((c) => {
        if (c.id !== checklistId) return c;
        return {
          ...c,
          items: c.items.map((item) => {
            if (item.id !== itemId) return item;
            const nowDone = !item.completed;
            return {
              ...item,
              completed: nowDone,
              completedAt: nowDone ? new Date().toISOString() : undefined,
            };
          }),
        };
      });
      persist(updated);
    },
    [groupId, projectId, persist]
  );

  // ── 항목 삭제 ────────────────────────────────────────────

  const deleteItem = useCallback(
    (checklistId: string, itemId: string) => {
      const current = loadChecklists(groupId, projectId);
      const updated = current.map((c) =>
        c.id !== checklistId
          ? c
          : { ...c, items: c.items.filter((i) => i.id !== itemId) }
      );
      persist(updated);
    },
    [groupId, projectId, persist]
  );

  // ── 카테고리별 진행률 ────────────────────────────────────

  const getCategoryProgress = useCallback(
    (checklistId: string, category: ReadinessCategory): number => {
      const checklist = checklists.find((c) => c.id === checklistId);
      if (!checklist) return 0;
      return calcCategoryProgress(checklist.items, category);
    },
    [checklists]
  );

  // ── 전체 진행률 ──────────────────────────────────────────

  const getTotalProgress = useCallback(
    (checklistId: string): number => {
      const checklist = checklists.find((c) => c.id === checklistId);
      if (!checklist) return 0;
      return calcTotalProgress(checklist.items);
    },
    [checklists]
  );

  return {
    checklists,
    createChecklist,
    deleteChecklist,
    addItem,
    toggleItem,
    deleteItem,
    getCategoryProgress,
    getTotalProgress,
  };
}
