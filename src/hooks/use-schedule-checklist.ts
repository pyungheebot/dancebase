"use client";

import { useState, useCallback } from "react";
import type { ScheduleCheckItem, ScheduleChecklist } from "@/types";

const STORAGE_PREFIX = "dancebase:schedule-checklist:";

const DEFAULT_ITEMS: Omit<ScheduleCheckItem, "id">[] = [
  { text: "의상 준비", checked: false, order: 0 },
  { text: "음악 파일 확인", checked: false, order: 1 },
  { text: "연습 복습", checked: false, order: 2 },
  { text: "소품 준비", checked: false, order: 3 },
  { text: "교통 수단 확인", checked: false, order: 4 },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage(scheduleId: string): ScheduleChecklist | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${scheduleId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ScheduleChecklist;
  } catch {
    return null;
  }
}

function saveToStorage(checklist: ScheduleChecklist): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${checklist.scheduleId}`,
      JSON.stringify({ ...checklist, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage 저장 실패 시 무시
  }
}

export function useScheduleChecklist(scheduleId: string) {
  const [items, setItems] = useState<ScheduleCheckItem[]>([]);


  /** 저장 헬퍼 */
  const persist = useCallback(
    (nextItems: ScheduleCheckItem[]) => {
      const checklist: ScheduleChecklist = {
        scheduleId,
        items: nextItems,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(checklist);
      setItems([...nextItems].sort((a, b) => a.order - b.order));
    },
    [scheduleId]
  );

  /** 항목 추가 */
  const addItem = useCallback(
    (text: string): void => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const maxOrder = items.reduce((max, it) => Math.max(max, it.order), -1);
      const newItem: ScheduleCheckItem = {
        id: generateId(),
        text: trimmed,
        checked: false,
        order: maxOrder + 1,
      };
      persist([...items, newItem]);
    },
    [items, persist]
  );

  /** 항목 삭제 */
  const removeItem = useCallback(
    (id: string): void => {
      persist(items.filter((it) => it.id !== id));
    },
    [items, persist]
  );

  /** 체크 토글 */
  const toggleItem = useCallback(
    (id: string): void => {
      persist(
        items.map((it) =>
          it.id === id ? { ...it, checked: !it.checked } : it
        )
      );
    },
    [items, persist]
  );

  /** 순서 변경 (드래그 등 외부에서 reordered 배열 전달) */
  const reorderItems = useCallback(
    (reordered: ScheduleCheckItem[]): void => {
      const withOrder = reordered.map((it, idx) => ({ ...it, order: idx }));
      persist(withOrder);
    },
    [persist]
  );

  /** 전체 초기화 (항목 모두 삭제) */
  const clearAll = useCallback((): void => {
    persist([]);
  }, [persist]);

  /** 기본 항목 복원 */
  const restoreDefaults = useCallback((): void => {
    const defaults: ScheduleCheckItem[] = DEFAULT_ITEMS.map((item) => ({
      ...item,
      id: generateId(),
    }));
    persist(defaults);
  }, [persist]);

  const doneCount = items.filter((it) => it.checked).length;
  const totalCount = items.length;
  const completionRate =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return {
    items,
    loading: false,
    addItem,
    removeItem,
    toggleItem,
    reorderItems,
    clearAll,
    restoreDefaults,
    doneCount,
    totalCount,
    completionRate,
  };
}
