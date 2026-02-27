"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  type GroupGuidelineItem,
  type GroupGuidelineCategory,
  type GroupGuidelinesData,
  GROUP_GUIDELINE_MAX,
} from "@/types";

// ============================================
// localStorage 키
// ============================================

function getStorageKey(groupId: string): string {
  return `dancebase:guidelines:${groupId}`;
}

// ============================================
// localStorage 읽기/쓰기 유틸
// ============================================

function loadFromStorage(groupId: string): GroupGuidelineItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    const parsed: GroupGuidelinesData = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function saveToStorage(groupId: string, items: GroupGuidelineItem[]): void {
  if (typeof window === "undefined") return;
  const data: GroupGuidelinesData = { items };
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(data));
}

// ============================================
// 훅
// ============================================

export function useGroupGuidelines(groupId: string) {
  const [items, setItems] = useState<GroupGuidelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 마운트 시 로드
  useEffect(() => {
    setItems(loadFromStorage(groupId));
    setLoading(false);
  }, [groupId]);

  // 항목 추가
  const addItem = useCallback(
    (
      title: string,
      description: string,
      category: GroupGuidelineCategory
    ): boolean => {
      if (items.length >= GROUP_GUIDELINE_MAX) {
        toast.error(`최대 ${GROUP_GUIDELINE_MAX}개까지 추가할 수 있습니다`);
        return false;
      }
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        toast.error("제목을 입력해주세요");
        return false;
      }

      const maxOrder = items.reduce((max, i) => Math.max(max, i.order), -1);
      const newItem: GroupGuidelineItem = {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        description: description.trim(),
        category,
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
      };

      const next = [...items, newItem];
      setItems(next);
      saveToStorage(groupId, next);
      toast.success("규칙이 추가되었습니다");
      return true;
    },
    [groupId, items]
  );

  // 항목 삭제
  const removeItem = useCallback(
    (id: string): void => {
      const next = items.filter((i) => i.id !== id);
      setItems(next);
      saveToStorage(groupId, next);
      toast.success("규칙이 삭제되었습니다");
    },
    [groupId, items]
  );

  // 순서 이동 (위/아래)
  const moveItem = useCallback(
    (id: string, direction: "up" | "down"): void => {
      const sorted = [...items].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((i) => i.id === id);
      if (idx === -1) return;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;

      // order 값을 맞바꿈
      const updatedItems = items.map((item) => {
        if (item.id === sorted[idx].id) {
          return { ...item, order: sorted[swapIdx].order };
        }
        if (item.id === sorted[swapIdx].id) {
          return { ...item, order: sorted[idx].order };
        }
        return item;
      });

      setItems(updatedItems);
      saveToStorage(groupId, updatedItems);
    },
    [groupId, items]
  );

  // 카테고리별 그룹핑 (order 오름차순 정렬 후 카테고리 집계)
  const groupedItems = useCallback((): Record<
    GroupGuidelineCategory,
    GroupGuidelineItem[]
  > => {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    return sorted.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<GroupGuidelineCategory, GroupGuidelineItem[]>
    );
  }, [items]);

  // 전체 항목을 order 기준으로 정렬한 배열
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  const isFirst = useCallback(
    (id: string): boolean => {
      const sorted = [...items].sort((a, b) => a.order - b.order);
      return sorted.length > 0 && sorted[0].id === id;
    },
    [items]
  );

  const isLast = useCallback(
    (id: string): boolean => {
      const sorted = [...items].sort((a, b) => a.order - b.order);
      return sorted.length > 0 && sorted[sorted.length - 1].id === id;
    },
    [items]
  );

  return {
    items: sortedItems,
    loading,
    totalCount: items.length,
    maxReached: items.length >= GROUP_GUIDELINE_MAX,
    addItem,
    removeItem,
    moveItem,
    groupedItems,
    isFirst,
    isLast,
  };
}
