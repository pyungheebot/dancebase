"use client";

import { useState } from "react";
import type { ScheduleSupplyItem, ScheduleSupplyList } from "@/types";
import { saveToStorage } from "@/lib/local-storage";

const MAX_ITEMS_PER_SCHEDULE = 20;
const STORAGE_PREFIX = "dancebase:schedule-supplies:";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const STORAGE_KEY = (groupId: string) => `${STORAGE_PREFIX}${groupId}`;

export function useScheduleSupplies(groupId: string, scheduleId: string) {
  const [allItems, setAllItems] = useState<ScheduleSupplyItem[]>([]);

  /** 저장 헬퍼: 전체 items 배열을 받아 storage에 저장하고 state 갱신 */
  function persist(nextItems: ScheduleSupplyItem[]) {
    const list: ScheduleSupplyList = {
      groupId,
      items: nextItems,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEY(groupId), list);
    setAllItems([...nextItems]);
  }

  /** 현재 scheduleId에 해당하는 항목만 필터링 (생성 순 정렬) */
  const items = allItems
    .filter((it) => it.scheduleId === scheduleId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  /** 준비물 추가 */
  function addItem(name: string, assignee?: string): boolean {
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
  }

  /** 준비물 삭제 */
  function removeItem(id: string): void {
    persist(allItems.filter((it) => it.id !== id));
  }

  /** 체크 토글 */
  function toggleItem(id: string): void {
    persist(
      allItems.map((it) =>
        it.id === id ? { ...it, checked: !it.checked } : it
      )
    );
  }

  const doneCount = items.filter((it) => it.checked).length;
  const totalCount = items.length;
  const completionRate =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isAtLimit = totalCount >= MAX_ITEMS_PER_SCHEDULE;

  return {
    items,
    loading: false,
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
