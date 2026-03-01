"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { GroupMemoryItem, MemoryCategory } from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:memory-album:";
const MAX_ITEMS = 50;

function getKey(groupId: string) {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadItems(groupId: string): GroupMemoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getKey(groupId));
    if (!raw) return [];
    return (JSON.parse(raw) as GroupMemoryItem[]).sort((a, b) => (a.date > b.date ? -1 : 1));
  } catch {
    return [];
  }
}

function saveItems(groupId: string, items: GroupMemoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getKey(groupId), JSON.stringify(items));
  } catch { /* ignore */ }
}

export function useGroupMemoryAlbum(groupId: string) {
  const [items, setItems] = useState<GroupMemoryItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | "all">("all");
  const [yearFilter, setYearFilter] = useState<string>("all");



  const addItem = useCallback(
    (input: { title: string; description: string; date: string; category: MemoryCategory; emoji: string }) => {
      if (items.length >= MAX_ITEMS) {
        toast.error(`추억은 최대 ${MAX_ITEMS}개까지 기록할 수 있습니다.`);
        return;
      }
      const newItem: GroupMemoryItem = {
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: input.title,
        description: input.description,
        date: input.date,
        category: input.category,
        emoji: input.emoji || "🎉",
        createdAt: new Date().toISOString(),
      };
      const updated = [newItem, ...items].sort((a, b) => (a.date > b.date ? -1 : 1));
      setItems(updated);
      saveItems(groupId, updated);
      toast.success("추억이 기록되었습니다.");
    },
    [groupId, items]
  );

  const deleteItem = useCallback(
    (id: string) => {
      const updated = items.filter((i) => i.id !== id);
      if (updated.length === items.length) return;
      setItems(updated);
      saveItems(groupId, updated);
      toast.success("추억이 삭제되었습니다.");
    },
    [groupId, items]
  );

  const availableYears = Array.from(new Set(items.map((i) => i.date.slice(0, 4)))).sort((a, b) => b.localeCompare(a));

  const filteredItems = items.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (yearFilter !== "all" && !item.date.startsWith(yearFilter)) return false;
    return true;
  });

  return {
    items: filteredItems,
    totalCount: items.length,
    addItem,
    deleteItem,
    categoryFilter,
    setCategoryFilter,
    yearFilter,
    setYearFilter,
    availableYears,
  };
}
