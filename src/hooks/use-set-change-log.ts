"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SetChangeLogData, SetChangeItem } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

const STORAGE_KEY = (projectId: string) => `${projectId}${projectId}`;

export function useSetChangeLog(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.setChangeLog(projectId),
    () => loadFromStorage<SetChangeLogData>(STORAGE_KEY(projectId), {} as SetChangeLogData),
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
    saveToStorage(STORAGE_KEY(projectId), next);
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
    saveToStorage(STORAGE_KEY(projectId), next);
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
    saveToStorage(STORAGE_KEY(projectId), next);
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
