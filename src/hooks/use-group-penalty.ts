"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  GroupPenaltyData,
  GroupPenaltyRule,
  GroupPenaltyRecord,
  GroupPenaltyViolationType,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:group-penalty:${groupId}`;
}

function loadData(groupId: string): GroupPenaltyData {
  if (typeof window === "undefined") {
    return {
      groupId,
      rules: [],
      records: [],
      monthlyResetEnabled: false,
      lastResetAt: null,
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) {
      return {
        groupId,
        rules: [],
        records: [],
        monthlyResetEnabled: false,
        lastResetAt: null,
        updatedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(raw) as GroupPenaltyData;
  } catch {
    return {
      groupId,
      rules: [],
      records: [],
      monthlyResetEnabled: false,
      lastResetAt: null,
      updatedAt: new Date().toISOString(),
    };
  }
}

function saveData(groupId: string, data: GroupPenaltyData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useGroupPenalty(groupId: string) {
  const { data, mutate, isLoading } = useSWR(
    groupId ? swrKeys.groupPenalty(groupId) : null,
    () => loadData(groupId)
  );

  const current: GroupPenaltyData = data ?? {
    groupId,
    rules: [],
    records: [],
    monthlyResetEnabled: false,
    lastResetAt: null,
    updatedAt: new Date().toISOString(),
  };

  const persist = useCallback(
    (next: GroupPenaltyData) => {
      saveData(groupId, next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  // ── 규칙 추가 ─────────────────────────────────────────────

  const addRule = useCallback(
    (
      violationType: GroupPenaltyViolationType,
      description: string,
      penaltyContent: string,
      demerits: number
    ): GroupPenaltyRule => {
      const rule: GroupPenaltyRule = {
        id: crypto.randomUUID(),
        violationType,
        description: description.trim(),
        penaltyContent: penaltyContent.trim(),
        demerits,
        createdAt: new Date().toISOString(),
      };
      persist({
        ...current,
        rules: [...current.rules, rule],
        updatedAt: new Date().toISOString(),
      });
      return rule;
    },
    [current, persist]
  );

  // ── 규칙 수정 ─────────────────────────────────────────────

  const updateRule = useCallback(
    (
      ruleId: string,
      patch: Partial<
        Pick<
          GroupPenaltyRule,
          "violationType" | "description" | "penaltyContent" | "demerits"
        >
      >
    ): boolean => {
      const idx = current.rules.findIndex((r) => r.id === ruleId);
      if (idx === -1) return false;
      const updated = current.rules.map((r) =>
        r.id === ruleId ? { ...r, ...patch } : r
      );
      persist({
        ...current,
        rules: updated,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  // ── 규칙 삭제 ─────────────────────────────────────────────

  const deleteRule = useCallback(
    (ruleId: string): boolean => {
      const filtered = current.rules.filter((r) => r.id !== ruleId);
      if (filtered.length === current.rules.length) return false;
      persist({
        ...current,
        rules: filtered,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  // ── 벌칙 기록 추가 ───────────────────────────────────────

  const addRecord = useCallback(
    (
      memberName: string,
      violationType: GroupPenaltyViolationType,
      date: string,
      demerits: number,
      memo: string
    ): GroupPenaltyRecord => {
      const record: GroupPenaltyRecord = {
        id: crypto.randomUUID(),
        memberName: memberName.trim(),
        violationType,
        date,
        demerits,
        memo: memo.trim(),
        createdAt: new Date().toISOString(),
      };
      persist({
        ...current,
        records: [record, ...current.records],
        updatedAt: new Date().toISOString(),
      });
      return record;
    },
    [current, persist]
  );

  // ── 벌칙 기록 삭제 ───────────────────────────────────────

  const deleteRecord = useCallback(
    (recordId: string): boolean => {
      const filtered = current.records.filter((r) => r.id !== recordId);
      if (filtered.length === current.records.length) return false;
      persist({
        ...current,
        records: filtered,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  // ── 월별 초기화 토글 ─────────────────────────────────────

  const toggleMonthlyReset = useCallback(() => {
    persist({
      ...current,
      monthlyResetEnabled: !current.monthlyResetEnabled,
      updatedAt: new Date().toISOString(),
    });
  }, [current, persist]);

  // ── 벌점 즉시 초기화 ─────────────────────────────────────

  const resetNow = useCallback(() => {
    persist({
      ...current,
      records: [],
      lastResetAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [current, persist]);

  // ── 통계 계산 ─────────────────────────────────────────────

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const totalRecords = current.records.length;
  const thisMonthRecords = current.records.filter((r) =>
    r.date.startsWith(thisMonth)
  ).length;

  const VIOLATION_TYPES: GroupPenaltyViolationType[] = [
    "지각",
    "무단결석",
    "핸드폰사용",
    "비협조",
    "기타",
  ];

  const violationStats = VIOLATION_TYPES.map((type) => {
    const count = current.records.filter(
      (r) => r.violationType === type
    ).length;
    return { type, count };
  }).filter((s) => s.count > 0);

  const maxViolationCount = Math.max(...violationStats.map((s) => s.count), 1);

  // 멤버별 누적 벌점 랭킹
  const memberMap = new Map<string, number>();
  for (const r of current.records) {
    memberMap.set(r.memberName, (memberMap.get(r.memberName) ?? 0) + r.demerits);
  }
  const memberRanking = Array.from(memberMap.entries())
    .map(([memberName, totalDemerits]) => ({ memberName, totalDemerits }))
    .sort((a, b) => b.totalDemerits - a.totalDemerits);

  const stats = {
    totalRecords,
    thisMonthRecords,
    violationStats,
    maxViolationCount,
    memberRanking,
  };

  return {
    data: current,
    loading: isLoading,
    addRule,
    updateRule,
    deleteRule,
    addRecord,
    deleteRecord,
    toggleMonthlyReset,
    resetNow,
    stats,
    refetch: () => mutate(),
  };
}
