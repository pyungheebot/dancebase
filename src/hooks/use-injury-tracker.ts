"use client";

import { useState, useEffect, useCallback } from "react";
import type { InjuryTrackerEntry, InjuryBodyPart, InjuryTrackerSeverity } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:injury-tracker:${groupId}`;
}

function loadData(groupId: string): InjuryTrackerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as InjuryTrackerEntry[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: InjuryTrackerEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type InjuryTrackerStats = {
  totalInjuries: number;
  activeCount: number;
  recoveringCount: number;
  recoveredCount: number;
  bodyPartDistribution: Record<InjuryBodyPart, number>;
};

// ============================================================
// 훅
// ============================================================

export function useInjuryTracker(groupId: string) {
  const [entries, setEntries] = useState<InjuryTrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setEntries(data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: InjuryTrackerEntry[]) => {
      saveData(groupId, next);
      setEntries(next);
    },
    [groupId]
  );

  // 부상 등록
  const addInjury = useCallback(
    (
      memberName: string,
      bodyPart: InjuryBodyPart,
      description: string,
      severity: InjuryTrackerSeverity,
      injuryDate: string,
      expectedRecoveryDate?: string,
      restrictions: string[] = [],
      notes?: string
    ): InjuryTrackerEntry => {
      const entry: InjuryTrackerEntry = {
        id: crypto.randomUUID(),
        memberName,
        bodyPart,
        description,
        severity,
        injuryDate,
        expectedRecoveryDate,
        status: "active",
        restrictions,
        notes,
        createdAt: new Date().toISOString(),
      };
      persist([...entries, entry]);
      return entry;
    },
    [entries, persist]
  );

  // 부상 수정
  const updateInjury = useCallback(
    (id: string, patch: Partial<InjuryTrackerEntry>): boolean => {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx === -1) return false;
      const next = [...entries];
      next[idx] = { ...next[idx], ...patch };
      persist(next);
      return true;
    },
    [entries, persist]
  );

  // 부상 삭제
  const deleteInjury = useCallback(
    (id: string): boolean => {
      const next = entries.filter((e) => e.id !== id);
      if (next.length === entries.length) return false;
      persist(next);
      return true;
    },
    [entries, persist]
  );

  // 회복중으로 변경
  const markRecovering = useCallback(
    (id: string): boolean => {
      return updateInjury(id, { status: "recovering" });
    },
    [updateInjury]
  );

  // 회복 완료
  const markRecovered = useCallback(
    (id: string): boolean => {
      return updateInjury(id, {
        status: "recovered",
        recoveredDate: new Date().toISOString(),
      });
    },
    [updateInjury]
  );

  // 멤버별 조회
  const getByMember = useCallback(
    (memberName: string): InjuryTrackerEntry[] => {
      return entries.filter((e) => e.memberName === memberName);
    },
    [entries]
  );

  // 현재 부상중 조회 (active + recovering)
  const getActiveInjuries = useCallback((): InjuryTrackerEntry[] => {
    return entries.filter(
      (e) => e.status === "active" || e.status === "recovering"
    );
  }, [entries]);

  // 통계
  const stats: InjuryTrackerStats = (() => {
    const activeCount = entries.filter((e) => e.status === "active").length;
    const recoveringCount = entries.filter(
      (e) => e.status === "recovering"
    ).length;
    const recoveredCount = entries.filter(
      (e) => e.status === "recovered"
    ).length;

    const bodyPartDistribution = entries.reduce(
      (acc, e) => {
        acc[e.bodyPart] = (acc[e.bodyPart] ?? 0) + 1;
        return acc;
      },
      {} as Record<InjuryBodyPart, number>
    );

    return {
      totalInjuries: entries.length,
      activeCount,
      recoveringCount,
      recoveredCount,
      bodyPartDistribution,
    };
  })();

  return {
    entries,
    loading,
    addInjury,
    updateInjury,
    deleteInjury,
    markRecovering,
    markRecovered,
    getByMember,
    getActiveInjuries,
    stats,
    refetch: reload,
  };
}
