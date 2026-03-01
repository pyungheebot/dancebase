"use client";

import { useState, useCallback } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  GroupRuleEntry,
  GroupRuleAcknowledgment,
  GroupRuleCategory,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

interface GroupRulesStore {
  rules: GroupRuleEntry[];
  acknowledgments: GroupRuleAcknowledgment[];
}

function getStorageKey(groupId: string): string {
  return `dancebase:group-rules:${groupId}`;
}

function loadStore(groupId: string): GroupRulesStore {
  return loadFromStorage<GroupRulesStore>(getStorageKey(groupId), { rules: [], acknowledgments: [] });
}

function saveStore(groupId: string, store: GroupRulesStore): void {
  saveToStorage(getStorageKey(groupId), store);
}

// ============================================
// 훅
// ============================================

export function useGroupRules(groupId: string) {
  const [store, setStore] = useState<GroupRulesStore>(() =>
    loadStore(groupId)
  );

  const persist = useCallback(
    (next: GroupRulesStore) => {
      setStore(next);
      saveStore(groupId, next);
    },
    [groupId]
  );

  // 규칙 추가
  const addRule = useCallback(
    (
      category: GroupRuleCategory,
      title: string,
      content: string,
      createdBy: string
    ): boolean => {
      if (!title.trim() || !content.trim() || !createdBy.trim()) return false;
      const now = new Date().toISOString();
      const newRule: GroupRuleEntry = {
        id: crypto.randomUUID(),
        category,
        title: title.trim(),
        content: content.trim(),
        order: store.rules.length,
        isActive: true,
        createdBy: createdBy.trim(),
        createdAt: now,
        updatedAt: now,
      };
      persist({ ...store, rules: [...store.rules, newRule] });
      return true;
    },
    [store, persist]
  );

  // 규칙 수정
  const updateRule = useCallback(
    (
      id: string,
      patch: Partial<Omit<GroupRuleEntry, "id" | "createdAt" | "createdBy">>
    ): boolean => {
      const idx = store.rules.findIndex((r) => r.id === id);
      if (idx === -1) return false;
      const updated = store.rules.map((r) =>
        r.id === id
          ? { ...r, ...patch, updatedAt: new Date().toISOString() }
          : r
      );
      persist({ ...store, rules: updated });
      return true;
    },
    [store, persist]
  );

  // 규칙 삭제
  const deleteRule = useCallback(
    (id: string): void => {
      const filtered = store.rules.filter((r) => r.id !== id);
      const reordered = filtered.map((r, idx) => ({ ...r, order: idx }));
      const filteredAck = store.acknowledgments.filter((a) => a.ruleId !== id);
      persist({ rules: reordered, acknowledgments: filteredAck });
    },
    [store, persist]
  );

  // 활성/비활성 토글
  const toggleActive = useCallback(
    (id: string): void => {
      const updated = store.rules.map((r) =>
        r.id === id
          ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString() }
          : r
      );
      persist({ ...store, rules: updated });
    },
    [store, persist]
  );

  // 순서 변경
  const moveRule = useCallback(
    (id: string, direction: "up" | "down"): void => {
      const sorted = [...store.rules].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((r) => r.id === id);
      if (idx === -1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;

      const reordered = sorted.map((r, i) => {
        if (i === idx) return { ...r, order: swapIdx };
        if (i === swapIdx) return { ...r, order: idx };
        return r;
      });
      persist({ ...store, rules: reordered });
    },
    [store, persist]
  );

  // 규칙 확인 (멤버가 읽었음을 표시)
  const acknowledgeRule = useCallback(
    (ruleId: string, memberName: string): boolean => {
      if (!memberName.trim()) return false;
      const already = store.acknowledgments.some(
        (a) => a.ruleId === ruleId && a.memberName === memberName
      );
      if (already) return false;
      const newAck: GroupRuleAcknowledgment = {
        id: crypto.randomUUID(),
        ruleId,
        memberName: memberName.trim(),
        acknowledgedAt: new Date().toISOString(),
      };
      persist({
        ...store,
        acknowledgments: [...store.acknowledgments, newAck],
      });
      return true;
    },
    [store, persist]
  );

  // 확인률 계산 (0 ~ 100)
  const getAcknowledgmentRate = useCallback(
    (ruleId: string, totalMembers: number): number => {
      if (totalMembers === 0) return 0;
      const count = store.acknowledgments.filter(
        (a) => a.ruleId === ruleId
      ).length;
      return Math.round((count / totalMembers) * 100);
    },
    [store.acknowledgments]
  );

  // 특정 규칙을 멤버가 확인했는지 여부
  const hasAcknowledged = useCallback(
    (ruleId: string, memberName: string): boolean => {
      return store.acknowledgments.some(
        (a) => a.ruleId === ruleId && a.memberName === memberName
      );
    },
    [store.acknowledgments]
  );

  // 통계
  const totalRules = store.rules.length;
  const activeRules = store.rules.filter((r) => r.isActive).length;
  const totalAcknowledgments = store.acknowledgments.length;

  // order 기준 정렬
  const sortedRules = [...store.rules].sort((a, b) => a.order - b.order);

  return {
    rules: sortedRules,
    acknowledgments: store.acknowledgments,
    totalRules,
    activeRules,
    totalAcknowledgments,
    addRule,
    updateRule,
    deleteRule,
    toggleActive,
    moveRule,
    acknowledgeRule,
    getAcknowledgmentRate,
    hasAcknowledged,
  };
}
