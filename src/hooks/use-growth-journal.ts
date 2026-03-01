"use client";

import { useState, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  GrowthJournalEntry,
  GrowthJournalData,
  GrowthArea,
} from "@/types";

// ============================================================
// 성장 영역 목록 (상수)
// ============================================================

export const GROWTH_AREAS: GrowthArea[] = [
  "테크닉",
  "표현력",
  "체력",
  "리더십",
  "협동심",
  "자신감",
];

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return swrKeys.growthJournal(groupId);
}

function loadData(groupId: string): GrowthJournalData {
  if (typeof window === "undefined") {
    return { groupId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return { groupId, entries: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as GrowthJournalData;
  } catch {
    return { groupId, entries: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: GrowthJournalData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type GrowthJournalStats = {
  /** 총 일지 수 */
  totalEntries: number;
  /** 영역별 평균 성장도 */
  areaAvgLevel: { area: GrowthArea; avgLevel: number; count: number }[];
  /** 멤버별 일지 수 */
  memberEntryCount: { memberName: string; count: number }[];
  /** 전체 평균 성장 수준 */
  overallAvgLevel: number;
};

// ============================================================
// 훅
// ============================================================

export function useGrowthJournal(groupId: string) {
  const [entries, setEntries] = useState<GrowthJournalEntry[]>(() => loadData(groupId).entries);

  // localStorage에서 데이터 불러오기
  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setEntries(data.entries);
  }, [groupId]);

  // 내부 저장 헬퍼
  const persist = useCallback(
    (updated: GrowthJournalEntry[]) => {
      const data: GrowthJournalData = {
        groupId,
        entries: updated,
        updatedAt: new Date().toISOString(),
      };
      saveData(data);
      setEntries(updated);
    },
    [groupId]
  );

  // 일지 추가
  const addEntry = useCallback(
    (params: {
      memberName: string;
      date: string;
      title: string;
      content: string;
      area?: GrowthArea;
      level?: number;
      // 레거시 필드 (members/growth-journal-card.tsx 호환)
      mood?: GrowthJournalEntry["mood"];
      skillsPracticed?: string[];
      achievementsToday?: string[];
      challengesFaced?: string[];
      nextGoals?: string[];
      selfRating?: number;
    }): GrowthJournalEntry => {
      const now = new Date().toISOString();
      const resolvedLevel = params.level ?? params.selfRating ?? 3;
      const newEntry: GrowthJournalEntry = {
        id: crypto.randomUUID(),
        memberName: params.memberName,
        date: params.date,
        title: params.title,
        content: params.content,
        area: params.area,
        level: resolvedLevel,
        mood: params.mood ?? "neutral",
        skillsPracticed: params.skillsPracticed ?? [],
        achievementsToday: params.achievementsToday ?? [],
        challengesFaced: params.challengesFaced ?? [],
        nextGoals: params.nextGoals ?? [],
        selfRating: params.selfRating ?? resolvedLevel,
        createdAt: now,
        updatedAt: now,
      };
      persist([...entries, newEntry]);
      return newEntry;
    },
    [entries, persist]
  );

  // 일지 수정
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<Omit<GrowthJournalEntry, "id" | "createdAt">>
    ): boolean => {
      const idx = entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;
      const updated = entries.map((e) =>
        e.id === entryId
          ? { ...e, ...params, updatedAt: new Date().toISOString() }
          : e
      );
      persist(updated);
      return true;
    },
    [entries, persist]
  );

  // 일지 삭제
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const exists = entries.some((e) => e.id === entryId);
      if (!exists) return false;
      persist(entries.filter((e) => e.id !== entryId));
      return true;
    },
    [entries, persist]
  );

  // 이전 항목 조회 (같은 멤버 + 같은 영역 기준)
  const getPreviousEntry = useCallback(
    (
      memberName: string,
      area: GrowthArea,
      currentDate: string,
      currentId: string
    ): GrowthJournalEntry | null => {
      const prev = entries
        .filter(
          (e) =>
            e.memberName === memberName &&
            e.area === area &&
            e.id !== currentId &&
            e.date <= currentDate
        )
        .sort((a, b) => b.date.localeCompare(a.date));
      return prev[0] ?? null;
    },
    [entries]
  );

  // 통계 계산
  const stats: GrowthJournalStats = (() => {
    const levelEntries = entries.filter(
      (e) => e.area !== undefined && e.level !== undefined
    );

    if (levelEntries.length === 0) {
      return {
        totalEntries: entries.length,
        areaAvgLevel: [],
        memberEntryCount: [],
        overallAvgLevel: 0,
      };
    }

    // 영역별 평균 성장도
    const areaAvgLevel = GROWTH_AREAS.map((area) => {
      const areaEntries = levelEntries.filter((e) => e.area === area);
      if (areaEntries.length === 0) return null;
      const avgLevel =
        Math.round(
          (areaEntries.reduce((acc, e) => acc + (e.level ?? 0), 0) /
            areaEntries.length) *
            10
        ) / 10;
      return { area, avgLevel, count: areaEntries.length };
    }).filter(
      (a): a is { area: GrowthArea; avgLevel: number; count: number } =>
        a !== null
    );

    // 멤버별 일지 수
    const memberMap = new Map<string, number>();
    for (const e of entries) {
      memberMap.set(e.memberName, (memberMap.get(e.memberName) ?? 0) + 1);
    }
    const memberEntryCount = Array.from(memberMap.entries())
      .map(([memberName, count]) => ({ memberName, count }))
      .sort((a, b) => b.count - a.count);

    // 전체 평균 성장 수준
    const overallAvgLevel =
      Math.round(
        (levelEntries.reduce((acc, e) => acc + (e.level ?? 0), 0) /
          levelEntries.length) *
          10
      ) / 10;

    return {
      totalEntries: entries.length,
      areaAvgLevel,
      memberEntryCount,
      overallAvgLevel,
    };
  })();

  // 기존 members/growth-journal-card.tsx 호환을 위한 레거시 통계
  const totalEntries = entries.length;
  const averageSelfRating =
    totalEntries > 0
      ? Math.round(
          (entries.reduce((sum, e) => sum + e.selfRating, 0) / totalEntries) *
            10
        ) / 10
      : 0;
  const moodDistribution = entries.reduce<Record<string, number>>(
    (acc, e) => {
      acc[e.mood] = (acc[e.mood] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const skillCountMap = entries
    .flatMap((e) => e.skillsPracticed)
    .reduce<Record<string, number>>((acc, skill) => {
      acc[skill] = (acc[skill] ?? 0) + 1;
      return acc;
    }, {});
  const topSkillsPracticed = Object.entries(skillCountMap)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    entries,
    loading: false,
    stats,
    addEntry,
    updateEntry,
    deleteEntry,
    getPreviousEntry,
    refetch: reload,
    // 레거시 호환 필드
    totalEntries,
    averageSelfRating,
    moodDistribution,
    topSkillsPracticed,
  };
}
