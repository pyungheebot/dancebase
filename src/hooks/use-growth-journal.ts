"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { GrowthJournalEntry, GrowthJournalMood } from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:growth-journal:${groupId}`;
}

function loadEntries(groupId: string): GrowthJournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as GrowthJournalEntry[];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: GrowthJournalEntry[]): void {
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

export function useGrowthJournal(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.growthJournal(groupId),
    () => loadEntries(groupId),
    { fallbackData: [] }
  );

  const entries = data ?? [];

  // 일지 추가
  const addEntry = useCallback(
    (params: {
      memberName: string;
      date: string;
      title: string;
      content: string;
      mood: GrowthJournalMood;
      skillsPracticed: string[];
      achievementsToday: string[];
      challengesFaced: string[];
      nextGoals: string[];
      selfRating: number;
    }): boolean => {
      const current = loadEntries(groupId);
      const newEntry: GrowthJournalEntry = {
        id: crypto.randomUUID(),
        memberName: params.memberName,
        date: params.date,
        title: params.title,
        content: params.content,
        mood: params.mood,
        skillsPracticed: params.skillsPracticed,
        achievementsToday: params.achievementsToday,
        challengesFaced: params.challengesFaced,
        nextGoals: params.nextGoals,
        selfRating: params.selfRating,
        createdAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...current];
      saveEntries(groupId, updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 일지 수정
  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<GrowthJournalEntry, "id" | "createdAt">>): boolean => {
      const current = loadEntries(groupId);
      const idx = current.findIndex((e) => e.id === id);
      if (idx === -1) return false;
      const updated = [...current];
      updated[idx] = { ...updated[idx], ...patch };
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

  // 멤버별 필터
  const getByMember = useCallback(
    (memberName: string): GrowthJournalEntry[] => {
      return entries.filter((e) => e.memberName === memberName);
    },
    [entries]
  );

  // 기간별 필터
  const getByDateRange = useCallback(
    (start: string, end: string): GrowthJournalEntry[] => {
      return entries.filter((e) => e.date >= start && e.date <= end);
    },
    [entries]
  );

  // ============================================
  // 통계 계산
  // ============================================

  const totalEntries = entries.length;

  const averageSelfRating =
    totalEntries > 0
      ? entries.reduce((sum, e) => sum + e.selfRating, 0) / totalEntries
      : 0;

  const moodDistribution: Record<GrowthJournalMood, number> = {
    motivated: 0,
    confident: 0,
    neutral: 0,
    struggling: 0,
    discouraged: 0,
  };
  for (const e of entries) {
    moodDistribution[e.mood] = (moodDistribution[e.mood] ?? 0) + 1;
  }

  // 연습한 스킬 빈도순 Top 5
  const skillFrequency: Record<string, number> = {};
  for (const e of entries) {
    for (const skill of e.skillsPracticed) {
      const normalized = skill.trim();
      if (normalized) {
        skillFrequency[normalized] = (skillFrequency[normalized] ?? 0) + 1;
      }
    }
  }
  const topSkillsPracticed = Object.entries(skillFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    getByMember,
    getByDateRange,
    totalEntries,
    averageSelfRating,
    moodDistribution,
    topSkillsPracticed,
  };
}
