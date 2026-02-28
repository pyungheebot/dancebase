"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SetChangeLogData, SetChangeItem } from "@/types";

const STORAGE_PREFIX = "set-change-log-";

function loadFromStorage(projectId: string): SetChangeLogData {
  if (typeof window === "undefined") {
    return { projectId, items: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (raw) return JSON.parse(raw) as SetChangeLogData;
  } catch {
    // 파싱 오류 무시
  }
  return { projectId, items: [], updatedAt: new Date().toISOString() };
}

function saveToStorage(data: SetChangeLogData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${data.projectId}`, JSON.stringify(data));
}

export function useSetChangeLog(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.setChangeLog(projectId),
    () => loadFromStorage(projectId),
    { revalidateOnFocus: false }
  );

  const current: SetChangeLogData = data ?? {
    projectId,
    items: [],
    updatedAt: new Date().toISOString(),
  };

  /** 항목 추가 */
  async function addItem(
    input: Omit<SetChangeItem, "id" | "order" | "createdAt">
  ): Promise<void> {
    const nextOrder =
      current.items.length > 0
        ? Math.max(...current.items.map((i) => i.order)) + 1
        : 1;
    const newItem: SetChangeItem = {
      ...input,
      id: crypto.randomUUID(),
      order: nextOrder,
      createdAt: new Date().toISOString(),
    };
    const next: SetChangeLogData = {
      ...current,
      items: [...current.items, newItem],
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
  }

  /** 항목 수정 */
  async function updateItem(
    id: string,
    patch: Partial<Omit<SetChangeItem, "id" | "order" | "createdAt">>
  ): Promise<void> {
    const next: SetChangeLogData = {
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
  }

  /** 항목 삭제 */
  async function deleteItem(id: string): Promise<void> {
    // 삭제 후 order 재정렬
    const filtered = current.items
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
    const next: SetChangeLogData = {
      ...current,
      items: filtered,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
  }

  return {
    data: current,
    loading: isLoading,
    addItem,
    updateItem,
    deleteItem,
    refetch: () => mutate(),
  };
}
