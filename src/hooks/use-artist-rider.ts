"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  ShowRiderData,
  ShowRiderItem,
  ShowRiderCategory,

  ShowRiderStatus,
} from "@/types";

// ─── 기본값 ────────────────────────────────────────────────

function buildDefaultData(projectId: string): ShowRiderData {
  return {
    projectId,
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

function getStorageKey(projectId: string) {
  return `artist-rider-${projectId}`;
}

// ─── 통계 계산 ──────────────────────────────────────────────

export type ShowRiderStats = {
  /** 전체 항목 수 */
  total: number;
  /** 확보된 항목 수 */
  secured: number;
  /** 전체 확보율 (0~100) */
  securedRate: number;
  /** 필수 항목 중 미확보(pending/unavailable) 건수 */
  requiredUnresolved: number;
  /** 카테고리별 항목 수 */
  byCategory: Record<ShowRiderCategory, number>;
};

export function calcRiderStats(items: ShowRiderItem[]): ShowRiderStats {
  const total = items.length;
  const secured = items.filter((i) => i.status === "secured").length;
  const securedRate = total === 0 ? 0 : Math.round((secured / total) * 100);
  const requiredUnresolved = items.filter(
    (i) => i.priority === "required" && i.status !== "secured"
  ).length;

  const byCategory: Record<ShowRiderCategory, number> = {
    technical: 0,
    backstage: 0,
    catering: 0,
    accommodation: 0,
    transport: 0,
    etc: 0,
  };
  for (const item of items) {
    byCategory[item.category]++;
  }

  return { total, secured, securedRate, requiredUnresolved, byCategory };
}

// ─── 훅 ────────────────────────────────────────────────────

export function useArtistRider(projectId: string) {
  const { data, mutate } = useSWR(
    swrKeys.artistRider(projectId),
    () => loadFromStorage<ShowRiderData>(getStorageKey(projectId), {} as ShowRiderData),
    { revalidateOnFocus: false }
  );

  const riderData = data ?? buildDefaultData(projectId);

  // 항목 추가
  function addItem(
    item: Omit<ShowRiderItem, "id">
  ) {
    const next: ShowRiderData = {
      ...riderData,
      items: [
        ...riderData.items,
        { ...item, id: crypto.randomUUID() },
      ],
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 항목 수정
  function updateItem(
    itemId: string,
    patch: Partial<Omit<ShowRiderItem, "id">>
  ) {
    const next: ShowRiderData = {
      ...riderData,
      items: riderData.items.map((i) =>
        i.id === itemId ? { ...i, ...patch } : i
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 항목 삭제
  function removeItem(itemId: string) {
    const next: ShowRiderData = {
      ...riderData,
      items: riderData.items.filter((i) => i.id !== itemId),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 확보 상태만 빠르게 변경
  function setStatus(itemId: string, status: ShowRiderStatus) {
    updateItem(itemId, { status });
  }

  return {
    data: riderData,
    stats: calcRiderStats(riderData.items),
    addItem,
    updateItem,
    removeItem,
    setStatus,
    refetch: () => mutate(),
  };
}
