"use client";

import { useState, useCallback, useMemo } from "react";
import type { DdayChecklistItem } from "@/types";

const STORAGE_KEY_PREFIX = "schedule-dday-";

// 기본 템플릿 항목 (첫 사용 시 자동 생성)
const DEFAULT_ITEMS: Omit<DdayChecklistItem, "id" | "scheduleId" | "createdAt">[] = [
  { daysBefore: 7, title: "장소 예약 확인", isDone: false },
  { daysBefore: 7, title: "참석 인원 1차 확인", isDone: false },
  { daysBefore: 3, title: "의상/소품 준비", isDone: false },
  { daysBefore: 3, title: "음악 파일 확인", isDone: false },
  { daysBefore: 1, title: "RSVP 최종 확인", isDone: false },
  { daysBefore: 1, title: "장소 접근 방법 공유", isDone: false },
  { daysBefore: 0, title: "장비 세팅", isDone: false },
  { daysBefore: 0, title: "출석 체크", isDone: false },
];

function getStorageKey(scheduleId: string): string {
  return `${STORAGE_KEY_PREFIX}${scheduleId}`;
}

function loadItems(scheduleId: string): DdayChecklistItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(scheduleId));
    return raw ? (JSON.parse(raw) as DdayChecklistItem[]) : null;
  } catch {
    return null;
  }
}

function persistItems(scheduleId: string, items: DdayChecklistItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(scheduleId), JSON.stringify(items));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

function createDefaultItems(scheduleId: string): DdayChecklistItem[] {
  const now = new Date().toISOString();
  return DEFAULT_ITEMS.map((item) => ({
    ...item,
    id: `${scheduleId}-${item.daysBefore}-${Math.random().toString(36).slice(2, 9)}`,
    scheduleId,
    createdAt: now,
  }));
}

export function useScheduleDday(scheduleId: string) {
  const [items, setItems] = useState<DdayChecklistItem[]>(() => {
    const stored = loadItems(scheduleId);
    if (stored !== null) return stored;
    // 첫 사용 시 기본 템플릿 생성 및 저장
    const defaults = createDefaultItems(scheduleId);
    persistItems(scheduleId, defaults);
    return defaults;
  });

  /** 항목 추가 */
  const addItem = useCallback(
    (daysBefore: number, title: string) => {
      const newItem: DdayChecklistItem = {
        id: `${scheduleId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        scheduleId,
        daysBefore,
        title,
        isDone: false,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => {
        const next = [...prev, newItem];
        persistItems(scheduleId, next);
        return next;
      });
    },
    [scheduleId]
  );

  /** 완료 토글 */
  const toggleItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === id ? { ...item, isDone: !item.isDone } : item
        );
        persistItems(scheduleId, next);
        return next;
      });
    },
    [scheduleId]
  );

  /** 항목 삭제 */
  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        persistItems(scheduleId, next);
        return next;
      });
    },
    [scheduleId]
  );

  /** 완료율 % */
  const completionRate = useMemo(() => {
    if (items.length === 0) return 0;
    const doneCount = items.filter((item) => item.isDone).length;
    return Math.round((doneCount / items.length) * 100);
  }, [items]);

  return {
    items,
    addItem,
    toggleItem,
    deleteItem,
    completionRate,
  };
}
