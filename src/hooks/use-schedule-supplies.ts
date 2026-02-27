"use client";

import { useState, useEffect, useCallback } from "react";
import type { ScheduleSupplyItem, ScheduleSupplyList } from "@/types";

const MAX_ITEMS_PER_SCHEDULE = 20;
const STORAGE_PREFIX = "dancebase:schedule-supplies:";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage(groupId: string): ScheduleSupplyList | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${groupId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ScheduleSupplyList;
  } catch {
    return null;
  }
}

function saveToStorage(list: ScheduleSupplyList): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${list.groupId}`,
      JSON.stringify({ ...list, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage 저장 실패 시 무시
  }
}

export function useScheduleSupplies(groupId: string, scheduleId: string) {
  const [allItems, setAllItems] = useState<ScheduleSupplyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    if (!groupId || !scheduleId) {
      setLoading(false);
      return;
    }
    const stored = loadFromStorage(groupId);
    if (stored) {
      setAllItems(stored.items);
    } else {
      setAllItems([]);
    }
    setLoading(false);
  }, [groupId, scheduleId]);

  /** 저장 헬퍼: 전체 items 배열을 받아 storage에 저장하고 state 갱신 */
  const persist = useCallback(
    (nextItems: ScheduleSupplyItem[]) => {
      const list: ScheduleSupplyList = {
        groupId,
        items: nextItems,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(list);
      setAllItems([...nextItems]);
    },
    [groupId]
  );

  /** 현재 scheduleId에 해당하는 항목만 필터링 (생성 순 정렬) */
  const items = allItems
    .filter((it) => it.scheduleId === scheduleId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  /** 준비물 추가 */
  const addItem = useCallback(
    (name: string, assignee?: string): boolean => {
      const trimmedName = name.trim();
      if (!trimmedName) return false;

      const currentCount = allItems.filter(
        (it) => it.scheduleId === scheduleId
      ).length;
      if (currentCount >= MAX_ITEMS_PER_SCHEDULE) return false;

      const newItem: ScheduleSupplyItem = {
        id: generateId(),
        scheduleId,
        name: trimmedName,
        checked: false,
        assignee: assignee?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      persist([...allItems, newItem]);
      return true;
    },
    [allItems, scheduleId, persist]
  );

  /** 준비물 삭제 */
  const removeItem = useCallback(
    (id: string): void => {
      persist(allItems.filter((it) => it.id !== id));
    },
    [allItems, persist]
  );

  /** 체크 토글 */
  const toggleItem = useCallback(
    (id: string): void => {
      persist(
        allItems.map((it) =>
          it.id === id ? { ...it, checked: !it.checked } : it
        )
      );
    },
    [allItems, persist]
  );

  const doneCount = items.filter((it) => it.checked).length;
  const totalCount = items.length;
  const completionRate =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isAtLimit = totalCount >= MAX_ITEMS_PER_SCHEDULE;

  return {
    items,
    loading,
    addItem,
    removeItem,
    toggleItem,
    doneCount,
    totalCount,
    completionRate,
    isAtLimit,
    maxItems: MAX_ITEMS_PER_SCHEDULE,
  };
}
