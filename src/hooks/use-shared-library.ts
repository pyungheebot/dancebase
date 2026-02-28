"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SharedLibItem, SharedLibFileType } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

function getStorageKey(groupId: string) {
  return `dancebase:shared-library:${groupId}`;
}

function loadItems(groupId: string): SharedLibItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as SharedLibItem[]) : [];
  } catch {
    return [];
  }
}

function saveItems(groupId: string, items: SharedLibItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(items));
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useSharedLibrary(groupId: string) {
  const { data, mutate } = useSWR(
    swrKeys.sharedLibrary(groupId),
    () => loadItems(groupId),
    { fallbackData: [] }
  );

  const items: SharedLibItem[] = data ?? [];

  // ─── CRUD ─────────────────────────────────────────────────

  async function addItem(
    payload: Omit<SharedLibItem, "id" | "downloadCount" | "isPinned" | "createdAt">
  ): Promise<string> {
    const newItem: SharedLibItem = {
      ...payload,
      id: crypto.randomUUID(),
      downloadCount: 0,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...items, newItem];
    saveItems(groupId, updated);
    await mutate(updated, false);
    return newItem.id;
  }

  async function updateItem(
    itemId: string,
    patch: Partial<Omit<SharedLibItem, "id" | "createdAt">>
  ) {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    saveItems(groupId, updated);
    await mutate(updated, false);
  }

  async function deleteItem(itemId: string) {
    const updated = items.filter((item) => item.id !== itemId);
    saveItems(groupId, updated);
    await mutate(updated, false);
  }

  async function togglePin(itemId: string) {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, isPinned: !item.isPinned } : item
    );
    saveItems(groupId, updated);
    await mutate(updated, false);
  }

  async function incrementDownload(itemId: string) {
    const updated = items.map((item) =>
      item.id === itemId
        ? { ...item, downloadCount: item.downloadCount + 1 }
        : item
    );
    saveItems(groupId, updated);
    await mutate(updated, false);
  }

  // ─── 필터 헬퍼 ────────────────────────────────────────────

  function getByCategory(category: string): SharedLibItem[] {
    return items.filter((item) => item.category === category);
  }

  function getByFileType(type: SharedLibFileType): SharedLibItem[] {
    return items.filter((item) => item.fileType === type);
  }

  function getPinned(): SharedLibItem[] {
    return items.filter((item) => item.isPinned);
  }

  // ─── 통계 ─────────────────────────────────────────────────

  const categoryList = Array.from(new Set(items.map((item) => item.category))).filter(Boolean);

  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = {
    totalItems: items.length,
    pinnedCount: items.filter((item) => item.isPinned).length,
    categoryList,
    recentItems,
  };

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    togglePin,
    incrementDownload,
    getByCategory,
    getByFileType,
    getPinned,
    stats,
    refetch: () => mutate(),
  };
}
