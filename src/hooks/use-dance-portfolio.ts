"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { DancePortfolioEntry, PortfolioEntryType } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return `dancebase:dance-portfolio:${memberId}`;
}

function loadEntries(memberId: string): DancePortfolioEntry[] {
  return loadFromStorage<DancePortfolioEntry[]>(getStorageKey(memberId), []);
}

function persistEntries(memberId: string, entries: DancePortfolioEntry[]): void {
  saveToStorage(getStorageKey(memberId), entries);
}

// ============================================================
// 훅
// ============================================================

export function useDancePortfolio(memberId: string) {
  const { data: entries, mutate } = useSWR(
    memberId ? swrKeys.dancePortfolio(memberId) : null,
    () => loadEntries(memberId),
    { fallbackData: [] }
  );

  const current: DancePortfolioEntry[] = entries ?? [];

  // ── 항목 추가 ─────────────────────────────────────────────

  async function addEntry(
    payload: Omit<DancePortfolioEntry, "id" | "createdAt">
  ): Promise<void> {
    const entry: DancePortfolioEntry = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...current];
    persistEntries(memberId, updated);
    await mutate(updated, false);
  }

  // ── 항목 수정 ─────────────────────────────────────────────

  async function updateEntry(
    id: string,
    patch: Partial<Omit<DancePortfolioEntry, "id" | "createdAt">>
  ): Promise<void> {
    const updated = current.map((e) => (e.id === id ? { ...e, ...patch } : e));
    persistEntries(memberId, updated);
    await mutate(updated, false);
  }

  // ── 항목 삭제 ─────────────────────────────────────────────

  async function deleteEntry(id: string): Promise<void> {
    const updated = current.filter((e) => e.id !== id);
    persistEntries(memberId, updated);
    await mutate(updated, false);
  }

  // ── 유형별 필터 ───────────────────────────────────────────

  function getByType(type: PortfolioEntryType): DancePortfolioEntry[] {
    return current.filter((e) => e.type === type);
  }

  // ── 연도별 필터 ───────────────────────────────────────────

  function getByYear(year: number): DancePortfolioEntry[] {
    return current.filter((e) => new Date(e.date).getFullYear() === year);
  }

  // ── 통계 ──────────────────────────────────────────────────

  const totalEntries = current.length;

  const totalAwards = current.reduce((sum, e) => sum + e.awards.length, 0);

  const years = current
    .map((e) => new Date(e.date).getFullYear())
    .filter((y) => !isNaN(y));

  const yearRange =
    years.length > 0
      ? { min: Math.min(...years), max: Math.max(...years) }
      : null;

  const typeBreakdown: Record<PortfolioEntryType, number> = {
    performance: 0,
    competition: 0,
    workshop: 0,
    collaboration: 0,
    solo: 0,
  };
  for (const e of current) {
    typeBreakdown[e.type] += 1;
  }

  const stats = {
    totalEntries,
    totalAwards,
    yearRange,
    typeBreakdown,
  };

  return {
    entries: current,
    addEntry,
    updateEntry,
    deleteEntry,
    getByType,
    getByYear,
    stats,
    refetch: () => mutate(),
  };
}
