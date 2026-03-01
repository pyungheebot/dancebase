"use client";

import {useCallback} from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { PerformanceSetlistData, PerformanceSetlistItem, SetlistItemType } from "@/types";

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:setlist:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): PerformanceSetlistData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as PerformanceSetlistData) : null;
  } catch {
    return null;
  }
}

function persistData(groupId: string, projectId: string, data: PerformanceSetlistData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId, projectId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

function createDefault(groupId: string, projectId: string): PerformanceSetlistData {
  const now = new Date().toISOString();
  return {
    id: `${groupId}-${projectId}`,
    eventName: "",
    eventDate: "",
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** durationSeconds를 "mm:ss" 형식으로 변환 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** "mm:ss" 또는 "m:ss" 문자열을 초 단위로 변환 */
export function parseDuration(value: string): number {
  const parts = value.split(":");
  if (parts.length !== 2) return 0;
  const m = parseInt(parts[0], 10) || 0;
  const s = parseInt(parts[1], 10) || 0;
  return Math.max(0, m * 60 + s);
}

export function useSetlistManagement(groupId: string, projectId: string) {
  const key = swrKeys.setlistManagement(groupId, projectId);

  const { data, mutate } = useSWR<PerformanceSetlistData>(key, () => {
    const stored = loadData(groupId, projectId);
    return stored ?? createDefault(groupId, projectId);
  });

  const setlistData = data ?? createDefault(groupId, projectId);

  /** 내부 상태 + localStorage 동기 업데이트 */
  const update = useCallback(
    (next: PerformanceSetlistData) => {
      const updated: PerformanceSetlistData = { ...next, updatedAt: new Date().toISOString() };
      persistData(groupId, projectId, updated);
      mutate(updated, false);
    },
    [groupId, projectId, mutate]
  );

  /** 이벤트 정보 수정 */
  const updateEventInfo = useCallback(
    (eventName: string, eventDate: string) => {
      update({ ...setlistData, eventName, eventDate });
    },
    [setlistData, update]
  );

  /** 항목 추가 */
  const addItem = useCallback(
    (item: Omit<PerformanceSetlistItem, "id" | "order">) => {
      const newItem: PerformanceSetlistItem = {
        ...item,
        id: crypto.randomUUID(),
        order: setlistData.items.length + 1,
      };
      update({ ...setlistData, items: [...setlistData.items, newItem] });
    },
    [setlistData, update]
  );

  /** 항목 삭제 */
  const removeItem = useCallback(
    (id: string) => {
      const filtered = setlistData.items
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, order: idx + 1 }));
      update({ ...setlistData, items: filtered });
    },
    [setlistData, update]
  );

  /** 위로 순서 변경 */
  const moveUp = useCallback(
    (id: string) => {
      const items = [...setlistData.items];
      const idx = items.findIndex((item) => item.id === id);
      if (idx <= 0) return;
      [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
      const reordered = items.map((item, i) => ({ ...item, order: i + 1 }));
      update({ ...setlistData, items: reordered });
    },
    [setlistData, update]
  );

  /** 아래로 순서 변경 */
  const moveDown = useCallback(
    (id: string) => {
      const items = [...setlistData.items];
      const idx = items.findIndex((item) => item.id === id);
      if (idx < 0 || idx >= items.length - 1) return;
      [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
      const reordered = items.map((item, i) => ({ ...item, order: i + 1 }));
      update({ ...setlistData, items: reordered });
    },
    [setlistData, update]
  );

  /** 항목 수정 */
  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<PerformanceSetlistItem, "id" | "order">>) => {
      const items = setlistData.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      );
      update({ ...setlistData, items });
    },
    [setlistData, update]
  );

  /** 전체 시간 (초) */
  const totalSeconds = setlistData.items.reduce(
    (sum, item) => sum + item.durationSeconds,
    0
  );

  /** 전체 시간 "mm:ss" 형식 */
  const totalDurationFormatted = formatDuration(totalSeconds);

  /** 의상 변경 횟수 */
  const costumeChangeCount = setlistData.items.filter(
    (item) => item.costumeChange
  ).length;

  /** 타입별 항목 수 */
  const countByType = (type: SetlistItemType) =>
    setlistData.items.filter((item) => item.type === type).length;

  return {
    data: setlistData,
    items: setlistData.items,
    totalSeconds,
    totalDurationFormatted,
    costumeChangeCount,
    countByType,
    updateEventInfo,
    addItem,
    removeItem,
    moveUp,
    moveDown,
    updateItem,
    refetch: () => mutate(),
  };
}
