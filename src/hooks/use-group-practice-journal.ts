"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  GroupPracticeJournalEntry,
  GroupPracticeJournalMonthStat,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:group-practice-journal:${groupId}`;
}

function loadEntries(groupId: string): GroupPracticeJournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as GroupPracticeJournalEntry[];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  entries: GroupPracticeJournalEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(entries));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useGroupPracticeJournal(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupPracticeJournal(groupId),
    () => loadEntries(groupId),
    { fallbackData: [] }
  );

  const entries = useMemo(() => data ?? [], [data]);

  // 일지 추가
  const addEntry = useCallback(
    (params: {
      date: string;
      durationMinutes: number;
      participants: string[];
      contentSummary: string;
      songs: string[];
      achievedGoals: string[];
      unachievedItems: string[];
      nextPlanNote: string;
      authorName: string;
    }): boolean => {
      const current = loadEntries(groupId);
      const now = new Date().toISOString();
      const newEntry: GroupPracticeJournalEntry = {
        id: crypto.randomUUID(),
        date: params.date,
        durationMinutes: params.durationMinutes,
        participants: params.participants,
        contentSummary: params.contentSummary,
        songs: params.songs,
        achievedGoals: params.achievedGoals,
        unachievedItems: params.unachievedItems,
        nextPlanNote: params.nextPlanNote,
        authorName: params.authorName,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newEntry, ...current].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      saveEntries(groupId, updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 일지 수정
  const updateEntry = useCallback(
    (
      id: string,
      params: Partial<
        Omit<GroupPracticeJournalEntry, "id" | "createdAt" | "updatedAt">
      >
    ): boolean => {
      const current = loadEntries(groupId);
      const idx = current.findIndex((e) => e.id === id);
      if (idx === -1) return false;
      const updated = [...current];
      updated[idx] = {
        ...updated[idx],
        ...params,
        updatedAt: new Date().toISOString(),
      };
      updated.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      saveEntries(groupId, updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 일지 삭제
  const deleteEntry = useCallback(
    (id: string): void => {
      const current = loadEntries(groupId);
      const updated = current.filter((e) => e.id !== id);
      saveEntries(groupId, updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // 월별 필터 (yearMonth: "YYYY-MM")
  const getByMonth = useCallback(
    (yearMonth: string): GroupPracticeJournalEntry[] => {
      return entries.filter((e) => e.date.startsWith(yearMonth));
    },
    [entries]
  );

  // 월별 통계 목록 (최신 월 순)
  const monthStats: GroupPracticeJournalMonthStat[] = (() => {
    const map = new Map<string, GroupPracticeJournalEntry[]>();
    for (const entry of entries) {
      const ym = entry.date.slice(0, 7);
      const existing = map.get(ym) ?? [];
      existing.push(entry);
      map.set(ym, existing);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([yearMonth, items]) => ({
        yearMonth,
        entryCount: items.length,
        totalMinutes: items.reduce((sum, e) => sum + e.durationMinutes, 0),
        avgParticipants:
          items.length > 0
            ? items.reduce((sum, e) => sum + e.participants.length, 0) /
              items.length
            : 0,
      }));
  })();

  // 전체 연습 시간 합계 (분)
  const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);

  // 이번 달 연습 시간 (분)
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const currentMonthMinutes = entries
    .filter((e) => e.date.startsWith(currentYearMonth))
    .reduce((sum, e) => sum + e.durationMinutes, 0);

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    getByMonth,
    monthStats,
    totalMinutes,
    currentMonthMinutes,
  };
}
