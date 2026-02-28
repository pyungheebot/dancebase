"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { PerformanceHistoryRecord, PerformanceHistoryType } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:performance-history:${groupId}`;
}

function loadRecords(groupId: string): PerformanceHistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as PerformanceHistoryRecord[]) : [];
  } catch {
    return [];
  }
}

function saveRecords(
  groupId: string,
  records: PerformanceHistoryRecord[]
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(records));
}

// ============================================================
// 훅
// ============================================================

export function usePerformanceHistory(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.performanceHistory(groupId),
    async () => loadRecords(groupId)
  );

  const records = data ?? [];

  // ── 기록 추가 ──
  async function addRecord(
    input: Omit<PerformanceHistoryRecord, "id" | "createdAt">
  ): Promise<void> {
    const newRecord: PerformanceHistoryRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...records, newRecord];
    saveRecords(groupId, updated);
    await mutate(updated, false);
  }

  // ── 기록 수정 ──
  async function updateRecord(
    recordId: string,
    changes: Partial<Omit<PerformanceHistoryRecord, "id" | "createdAt">>
  ): Promise<void> {
    const updated = records.map((r) =>
      r.id === recordId ? { ...r, ...changes } : r
    );
    saveRecords(groupId, updated);
    await mutate(updated, false);
  }

  // ── 기록 삭제 ──
  async function deleteRecord(recordId: string): Promise<void> {
    const updated = records.filter((r) => r.id !== recordId);
    saveRecords(groupId, updated);
    await mutate(updated, false);
  }

  // ── 연도별 필터 ──
  function getByYear(year: number): PerformanceHistoryRecord[] {
    return records.filter((r) => new Date(r.date).getFullYear() === year);
  }

  // ── 유형별 필터 ──
  function getByType(type: PerformanceHistoryType): PerformanceHistoryRecord[] {
    return records.filter((r) => r.type === type);
  }

  // ── 통계 ──
  const totalPerformances = records.length;

  const totalAudience = records.reduce(
    (sum, r) => sum + (r.audienceCount ?? 0),
    0
  );

  const awardCount = records.reduce(
    (sum, r) => sum + (r.awards?.length ?? 0),
    0
  );

  const years = records.map((r) => new Date(r.date).getFullYear());
  const yearRange =
    years.length > 0
      ? { min: Math.min(...years), max: Math.max(...years) }
      : null;

  const stats = {
    totalPerformances,
    totalAudience,
    awardCount,
    yearRange,
  };

  return {
    records,
    loading: isLoading,
    refetch: () => mutate(),
    addRecord,
    updateRecord,
    deleteRecord,
    getByYear,
    getByType,
    stats,
  };
}

export type { PerformanceHistoryType };
