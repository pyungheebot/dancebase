"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type {
  DecisionLogItem,
  DecisionCategory,
  DecisionImpact,
} from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:decision-log:";
const MAX_ITEMS = 100;

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function saveItems(groupId: string, items: DecisionLogItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(items));
  } catch {
    // localStorage 용량 초과 등의 경우 무시
  }
}

export type DecisionLogInput = {
  title: string;
  category: DecisionCategory;
  description: string;
  decidedBy: string;
  impact: DecisionImpact;
};

export function useDecisionLog(groupId: string) {
  const [items, setItems] = useState<DecisionLogItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<
    DecisionCategory | "all"
  >("all");
  const [impactFilter, setImpactFilter] = useState<DecisionImpact | "all">(
    "all"
  );

  // 필터링된 항목
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    const matchesImpact =
      impactFilter === "all" || item.impact === impactFilter;
    return matchesCategory && matchesImpact;
  });

  const persistAndUpdate = useCallback(
    (newItems: DecisionLogItem[]) => {
      const sorted = [...newItems].sort(
        (a, b) =>
          new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime()
      );
      saveItems(groupId, sorted);
      setItems(sorted);
    },
    [groupId]
  );

  const addItem = useCallback(
    (input: DecisionLogInput): boolean => {
      if (items.length >= MAX_ITEMS) {
        toast.error(`의사결정 로그는 최대 ${MAX_ITEMS}개까지 기록할 수 있습니다.`);
        return false;
      }
      if (!input.title.trim()) {
        toast.error(TOAST.TITLE_REQUIRED_DOT);
        return false;
      }
      if (!input.decidedBy.trim()) {
        toast.error(TOAST.DECISION.DECIDER_REQUIRED);
        return false;
      }

      const newItem: DecisionLogItem = {
        id: crypto.randomUUID(),
        groupId,
        title: input.title.trim(),
        category: input.category,
        description: input.description.trim(),
        decidedBy: input.decidedBy.trim(),
        decidedAt: new Date().toISOString(),
        impact: input.impact,
      };

      persistAndUpdate([...items, newItem]);
      toast.success(TOAST.DECISION.CREATED);
      return true;
    },
    [items, groupId, persistAndUpdate]
  );

  const deleteItem = useCallback(
    (id: string): void => {
      const updated = items.filter((item) => item.id !== id);
      persistAndUpdate(updated);
      toast.success(TOAST.DECISION.DELETED);
    },
    [items, persistAndUpdate]
  );

  return {
    items,
    filteredItems,
    loading: false,
    categoryFilter,
    setCategoryFilter,
    impactFilter,
    setImpactFilter,
    addItem,
    deleteItem,
    totalCount: items.length,
    maxReached: items.length >= MAX_ITEMS,
  };
}
