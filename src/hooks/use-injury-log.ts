"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  DanceInjuryEntry,
  DanceInjuryBodyPart,
  DanceInjuryType,
  DanceInjurySeverity,
  DanceInjuryRehabStatus,
  DanceInjuryLogStore,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function storageKey(memberId: string): string {
  return `dance-injury-log-${memberId}`;
}

function loadStore(memberId: string): DanceInjuryLogStore {
  return loadFromStorage<DanceInjuryLogStore>(storageKey(memberId), { memberId, entries: [], updatedAt: new Date().toISOString() });
}

function saveStore(store: DanceInjuryLogStore): void {
  saveToStorage(storageKey(store.memberId), { ...store, updatedAt: new Date().toISOString() });
}

// ============================================================
// 통계 타입
// ============================================================

export type DanceInjuryStats = {
  /** 전체 기록 수 */
  total: number;
  /** 현재 활성(재활 진행중) 부상 수 */
  activeCount: number;
  /** 완치된 부상 수 */
  recoveredCount: number;
  /** 만성 부상 수 */
  chronicCount: number;
  /** 부상 부위별 빈도 */
  bodyPartFrequency: Partial<Record<DanceInjuryBodyPart, number>>;
  /** 부상 유형별 빈도 */
  injuryTypeFrequency: Partial<Record<DanceInjuryType, number>>;
  /** 심각도별 분포 */
  severityDistribution: Partial<Record<DanceInjurySeverity, number>>;
};

// ============================================================
// 통계 계산
// ============================================================

function calcStats(entries: DanceInjuryEntry[]): DanceInjuryStats {
  const bodyPartFrequency: Partial<Record<DanceInjuryBodyPart, number>> = {};
  const injuryTypeFrequency: Partial<Record<DanceInjuryType, number>> = {};
  const severityDistribution: Partial<Record<DanceInjurySeverity, number>> = {};

  let activeCount = 0;
  let recoveredCount = 0;
  let chronicCount = 0;

  for (const entry of entries) {
    // 재활 상태별 카운트
    if (entry.rehabStatus === "in_progress") activeCount += 1;
    else if (entry.rehabStatus === "recovered") recoveredCount += 1;
    else if (entry.rehabStatus === "chronic") chronicCount += 1;

    // 부위별 빈도
    bodyPartFrequency[entry.bodyPart] =
      (bodyPartFrequency[entry.bodyPart] ?? 0) + 1;

    // 유형별 빈도
    injuryTypeFrequency[entry.injuryType] =
      (injuryTypeFrequency[entry.injuryType] ?? 0) + 1;

    // 심각도 분포
    severityDistribution[entry.severity] =
      (severityDistribution[entry.severity] ?? 0) + 1;
  }

  return {
    total: entries.length,
    activeCount,
    recoveredCount,
    chronicCount,
    bodyPartFrequency,
    injuryTypeFrequency,
    severityDistribution,
  };
}

// ============================================================
// 훅
// ============================================================

export function useInjuryLog(memberId: string) {
  // SWR을 통해 localStorage에서 데이터 로드
  const { data: entries = [], isLoading, mutate } = useSWR(
    memberId ? swrKeys.danceInjuryLog(memberId) : null,
    () => {
      const store = loadStore(memberId);
      return store.entries;
    },
    { revalidateOnFocus: false }
  );

  // 내부 저장 헬퍼
  const persist = useCallback(
    (next: DanceInjuryEntry[]) => {
      const store: DanceInjuryLogStore = {
        memberId,
        entries: next,
        updatedAt: new Date().toISOString(),
      };
      saveStore(store);
      mutate(next, false);
    },
    [memberId, mutate]
  );

  // 부상 기록 추가
  const addEntry = useCallback(
    (
      payload: Omit<DanceInjuryEntry, "id" | "memberId" | "createdAt" | "updatedAt">
    ): DanceInjuryEntry => {
      const now = new Date().toISOString();
      const newEntry: DanceInjuryEntry = {
        ...payload,
        id: crypto.randomUUID(),
        memberId,
        createdAt: now,
        updatedAt: now,
      };
      const next = [newEntry, ...entries];
      persist(next);
      return newEntry;
    },
    [entries, memberId, persist]
  );

  // 부상 기록 수정
  const updateEntry = useCallback(
    (
      id: string,
      patch: Partial<
        Omit<DanceInjuryEntry, "id" | "memberId" | "createdAt">
      >
    ): boolean => {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx === -1) return false;
      const updated: DanceInjuryEntry = {
        ...entries[idx],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      const next = entries.map((e) => (e.id === id ? updated : e));
      persist(next);
      return true;
    },
    [entries, persist]
  );

  // 재활 상태 업데이트
  const updateRehabStatus = useCallback(
    (id: string, rehabStatus: DanceInjuryRehabStatus): boolean => {
      return updateEntry(id, { rehabStatus });
    },
    [updateEntry]
  );

  // 부상 기록 삭제
  const deleteEntry = useCallback(
    (id: string): boolean => {
      const exists = entries.some((e) => e.id === id);
      if (!exists) return false;
      const next = entries.filter((e) => e.id !== id);
      persist(next);
      return true;
    },
    [entries, persist]
  );

  // 활성 부상만 필터
  const activeEntries = entries.filter((e) => e.rehabStatus === "in_progress");

  // 통계 계산
  const stats = calcStats(entries);

  return {
    entries,
    activeEntries,
    loading: isLoading,
    stats,
    addEntry,
    updateEntry,
    updateRehabStatus,
    deleteEntry,
    refetch: () => mutate(),
  };
}
