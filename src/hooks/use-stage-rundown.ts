"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { ShowRundownData, ShowRundownItem } from "@/types";

// ─── 기본값 ───────────────────────────────────────────────────

function buildDefaultData(projectId: string): ShowRundownData {
  return {
    projectId,
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

function getStorageKey(projectId: string) {
  return `show-rundown-${projectId}`;
}

function loadFromStorage(projectId: string): ShowRundownData {
  if (typeof window === "undefined") return buildDefaultData(projectId);
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return buildDefaultData(projectId);
    return JSON.parse(raw) as ShowRundownData;
  } catch {
    return buildDefaultData(projectId);
  }
}

function saveToStorage(data: ShowRundownData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(data.projectId), JSON.stringify(data));
}

// ─── 시간 비교 헬퍼 ───────────────────────────────────────────

/** "HH:MM" 문자열을 분(minutes)으로 변환 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** 항목을 시작 시간순으로 정렬 */
function sortItems(items: ShowRundownItem[]): ShowRundownItem[] {
  return [...items].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useStageRundown(projectId: string) {
  const { data, mutate } = useSWR(
    swrKeys.showRundown(projectId),
    () => loadFromStorage(projectId),
    { revalidateOnFocus: false }
  );

  const rundownData = data ?? buildDefaultData(projectId);

  // 항목 추가
  function addItem(item: Omit<ShowRundownItem, "id" | "done">) {
    const newItem: ShowRundownItem = {
      ...item,
      id: crypto.randomUUID(),
      done: false,
    };
    const next: ShowRundownData = {
      ...rundownData,
      items: sortItems([...rundownData.items, newItem]),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    mutate(next, false);
  }

  // 항목 수정
  function updateItem(
    itemId: string,
    patch: Partial<Omit<ShowRundownItem, "id">>
  ) {
    const next: ShowRundownData = {
      ...rundownData,
      items: sortItems(
        rundownData.items.map((item) =>
          item.id === itemId ? { ...item, ...patch } : item
        )
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    mutate(next, false);
  }

  // 항목 삭제
  function removeItem(itemId: string) {
    const next: ShowRundownData = {
      ...rundownData,
      items: rundownData.items.filter((item) => item.id !== itemId),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    mutate(next, false);
  }

  // 완료 토글
  function toggleDone(itemId: string) {
    const next: ShowRundownData = {
      ...rundownData,
      items: rundownData.items.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    mutate(next, false);
  }

  // 통계 계산
  const totalCount = rundownData.items.length;
  const doneCount = rundownData.items.filter((i) => i.done).length;
  const doneRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const totalMinutes = rundownData.items.reduce((acc, item) => {
    const diff = timeToMinutes(item.endTime) - timeToMinutes(item.startTime);
    return acc + (diff > 0 ? diff : 0);
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainMinutes = totalMinutes % 60;

  return {
    data: rundownData,
    addItem,
    updateItem,
    removeItem,
    toggleDone,
    stats: {
      totalCount,
      doneCount,
      doneRate,
      totalMinutes,
      totalHours,
      remainMinutes,
    },
    refetch: () => mutate(),
  };
}
