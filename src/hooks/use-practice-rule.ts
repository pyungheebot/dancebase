"use client";

import useSWR from "swr";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import type {
  PracticeRuleEntry,
  PracticeRuleCategory,
  PracticeRulePriority,
  PracticeRulePenaltyType,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:practice-rule:${groupId}`;
}

function loadEntries(groupId: string): PracticeRuleEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as PracticeRuleEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: PracticeRuleEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(entries));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 훅
// ============================================================

export type AddPracticeRuleInput = {
  category: PracticeRuleCategory;
  priority: PracticeRulePriority;
  title: string;
  description?: string;
  penaltyType: PracticeRulePenaltyType;
  penaltyDetail?: string;
};

export type UpdatePracticeRuleInput = Partial<AddPracticeRuleInput & { isActive: boolean }>;

export function usePracticeRule(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.practiceRule(groupId) : null,
    async () => loadEntries(groupId)
  );

  const entries = useMemo(() => data ?? [], [data]);

  // ── 규칙 추가 ──
  const addRule = useCallback(
    async (input: AddPracticeRuleInput): Promise<boolean> => {
      const now = new Date().toISOString();
      const newEntry: PracticeRuleEntry = {
        id: crypto.randomUUID(),
        groupId,
        category: input.category,
        priority: input.priority,
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        penaltyType: input.penaltyType,
        penaltyDetail: input.penaltyDetail?.trim() || undefined,
        isActive: true,
        order: entries.length,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...entries, newEntry];
      saveEntries(groupId, updated);
      await mutate(updated, false);
      toast.success(TOAST.RULE.ADDED);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 규칙 수정 ──
  const updateRule = useCallback(
    async (id: string, changes: UpdatePracticeRuleInput): Promise<boolean> => {
      const target = entries.find((e) => e.id === id);
      if (!target) {
        toast.error(TOAST.RULE.NOT_FOUND);
        return false;
      }

      const updated = entries.map((e) =>
        e.id === id
          ? {
              ...e,
              ...changes,
              title: changes.title !== undefined ? changes.title.trim() : e.title,
              description:
                changes.description !== undefined
                  ? changes.description.trim() || undefined
                  : e.description,
              penaltyDetail:
                changes.penaltyDetail !== undefined
                  ? changes.penaltyDetail.trim() || undefined
                  : e.penaltyDetail,
              updatedAt: new Date().toISOString(),
            }
          : e
      );

      saveEntries(groupId, updated);
      await mutate(updated, false);
      toast.success(TOAST.RULE.UPDATED);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 규칙 삭제 ──
  const deleteRule = useCallback(
    async (id: string): Promise<boolean> => {
      const filtered = entries
        .filter((e) => e.id !== id)
        .map((e, index) => ({ ...e, order: index }));

      saveEntries(groupId, filtered);
      await mutate(filtered, false);
      toast.success(TOAST.RULE.DELETED);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 활성화/비활성화 토글 ──
  const toggleActive = useCallback(
    async (id: string): Promise<boolean> => {
      const updated = entries.map((e) =>
        e.id === id
          ? { ...e, isActive: !e.isActive, updatedAt: new Date().toISOString() }
          : e
      );

      saveEntries(groupId, updated);
      await mutate(updated, false);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 순서 변경 ──
  const moveRule = useCallback(
    async (id: string, direction: "up" | "down"): Promise<boolean> => {
      const index = entries.findIndex((e) => e.id === id);
      if (index === -1) return false;
      if (direction === "up" && index === 0) return false;
      if (direction === "down" && index === entries.length - 1) return false;

      const reordered = [...entries];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [reordered[index], reordered[swapIndex]] = [
        reordered[swapIndex],
        reordered[index],
      ];

      const withOrder = reordered.map((e, i) => ({ ...e, order: i }));
      saveEntries(groupId, withOrder);
      await mutate(withOrder, false);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 카테고리별 필터 ──
  const filterByCategory = useCallback(
    (category: PracticeRuleCategory | "all"): PracticeRuleEntry[] => {
      if (category === "all") return entries;
      return entries.filter((e) => e.category === category);
    },
    [entries]
  );

  // ── 중요도별 필터 ──
  const filterByPriority = useCallback(
    (priority: PracticeRulePriority | "all"): PracticeRuleEntry[] => {
      if (priority === "all") return entries;
      return entries.filter((e) => e.priority === priority);
    },
    [entries]
  );

  // ── 통계 ──
  const stats = {
    total: entries.length,
    active: entries.filter((e) => e.isActive).length,
    required: entries.filter((e) => e.priority === "required").length,
    recommended: entries.filter((e) => e.priority === "recommended").length,
    optional: entries.filter((e) => e.priority === "optional").length,
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addRule,
    updateRule,
    deleteRule,
    toggleActive,
    moveRule,
    filterByCategory,
    filterByPriority,
    stats,
  };
}
