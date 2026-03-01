"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { ShowSetlistData, ShowSetlistItem } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 유틸
// ============================================================

const STORAGE_PREFIX = "dancebase:performance-setlist";

function getStorageKey(projectId: string): string {
  return `${STORAGE_PREFIX}:${projectId}`;
}

function createEmptyData(projectId: string): ShowSetlistData {
  return {
    projectId,
    items: [],
    showTitle: "",
    totalDuration: null,
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 시간 계산 유틸
// ============================================================

/**
 * "M:SS" 또는 "MM:SS" 형식의 시간 문자열을 초(number)로 변환.
 * 파싱 불가 시 null 반환.
 */
export function parseDurationToSeconds(duration: string | null): number | null {
  if (!duration) return null;
  const parts = duration.trim().split(":");
  if (parts.length !== 2) return null;
  const minutes = parseInt(parts[0] ?? "0", 10);
  const seconds = parseInt(parts[1] ?? "0", 10);
  if (isNaN(minutes) || isNaN(seconds)) return null;
  return minutes * 60 + seconds;
}

/**
 * 초(number)를 "M:SS" 형식으로 변환.
 */
export function formatSecondsToDisplay(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ============================================================
// 입력 타입
// ============================================================

export type ShowSetlistItemInput = Omit<ShowSetlistItem, "id" | "order">;

// ============================================================
// 훅
// ============================================================

export function usePerformanceSetlist(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    projectId ? swrKeys.performanceSetlist(projectId) : null,
    async () => loadFromStorage<ShowSetlistData>(getStorageKey(projectId), {} as ShowSetlistData)
  );

  const store = data ?? createEmptyData(projectId);

  // ── 저장 후 SWR 캐시 업데이트 ──
  function persist(updated: ShowSetlistData): void {
    const withTimestamp: ShowSetlistData = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), withTimestamp);
    mutate(withTimestamp, false);
  }

  // ── 공연 제목 설정 ──
  function setShowTitle(title: string): void {
    persist({ ...store, showTitle: title });
  }

  // ── 곡 추가 ──
  function addItem(input: ShowSetlistItemInput): ShowSetlistItem {
    const maxOrder = store.items.reduce(
      (acc, item) => Math.max(acc, item.order),
      0
    );
    const newItem: ShowSetlistItem = {
      ...input,
      id: crypto.randomUUID(),
      order: maxOrder + 1,
    };
    persist({ ...store, items: [...store.items, newItem] });
    return newItem;
  }

  // ── 곡 수정 ──
  function updateItem(id: string, fields: Partial<ShowSetlistItemInput>): void {
    const updated = store.items.map((item) =>
      item.id === id ? { ...item, ...fields } : item
    );
    persist({ ...store, items: updated });
  }

  // ── 곡 삭제 후 순서 재정렬 ──
  function deleteItem(id: string): void {
    const filtered = store.items
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
    persist({ ...store, items: filtered });
  }

  // ── 순서 변경 (위/아래 버튼 방식) ──
  function reorderItems(id: string, direction: "up" | "down"): void {
    const sorted = [...store.items].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((item) => item.id === id);
    if (idx === -1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    // 두 항목의 order 값 교환
    const updated = sorted.map((item, i) => {
      if (i === idx) return { ...item, order: sorted[targetIdx]!.order };
      if (i === targetIdx) return { ...item, order: sorted[idx]!.order };
      return item;
    });

    persist({ ...store, items: updated });
  }

  // ── 정렬된 목록 ──
  const sortedItems = [...store.items].sort((a, b) => a.order - b.order);

  // ── 통계 ──
  const totalItems = store.items.length;
  const encoreCount = store.items.filter((item) => item.isEncore).length;

  // duration 합산 계산 (파싱 가능한 것만)
  const totalSeconds = store.items.reduce((acc, item) => {
    const secs = parseDurationToSeconds(item.duration);
    return secs !== null ? acc + secs : acc;
  }, 0);

  const calculatedTotalDuration =
    totalSeconds > 0 ? formatSecondsToDisplay(totalSeconds) : null;

  return {
    setlistData: store,
    items: sortedItems,
    loading: isLoading,
    // 통계
    totalItems,
    encoreCount,
    calculatedTotalDuration,
    // CRUD
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    // 공연 제목
    setShowTitle,
    // SWR 갱신
    refetch: () => mutate(),
  };
}
