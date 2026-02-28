"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AchievementBadgeEntry,
  AchievementBadgeCategory,
  AchievementBadgeLevel,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(memberId: string): string {
  return `dancebase:achievement-badge:${memberId}`;
}

function loadEntries(memberId: string): AchievementBadgeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    return raw ? (JSON.parse(raw) as AchievementBadgeEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(memberId: string, entries: AchievementBadgeEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(memberId), JSON.stringify(entries));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useAchievementBadge(memberId: string) {
  const { data, isLoading, mutate } = useSWR(
    memberId ? swrKeys.achievementBadge(memberId) : null,
    async () => loadEntries(memberId)
  );

  const entries = data ?? [];

  // ── 배지 추가 ──
  async function addBadge(
    input: Omit<AchievementBadgeEntry, "id" | "memberId" | "createdAt">
  ): Promise<void> {
    const newEntry: AchievementBadgeEntry = {
      ...input,
      id: crypto.randomUUID(),
      memberId,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    saveEntries(memberId, updated);
    await mutate(updated, false);
  }

  // ── 배지 레벨 업그레이드 ──
  async function upgradeBadgeLevel(
    badgeId: string,
    newLevel: AchievementBadgeLevel
  ): Promise<void> {
    const updated = entries.map((e) =>
      e.id === badgeId ? { ...e, level: newLevel } : e
    );
    saveEntries(memberId, updated);
    await mutate(updated, false);
  }

  // ── 배지 삭제 ──
  async function deleteBadge(badgeId: string): Promise<void> {
    const updated = entries.filter((e) => e.id !== badgeId);
    saveEntries(memberId, updated);
    await mutate(updated, false);
  }

  // ── 카테고리별 필터 ──
  function getBadgesByCategory(
    category: AchievementBadgeCategory
  ): AchievementBadgeEntry[] {
    return entries.filter((e) => e.category === category);
  }

  // ── 레벨별 필터 ──
  function getBadgesByLevel(
    level: AchievementBadgeLevel
  ): AchievementBadgeEntry[] {
    return entries.filter((e) => e.level === level);
  }

  // ── 통계 ──
  const totalBadges = entries.length;

  const levelCounts: Record<AchievementBadgeLevel, number> = {
    bronze: 0,
    silver: 0,
    gold: 0,
  };
  const categoryCounts: Record<AchievementBadgeCategory, number> = {
    practice: 0,
    performance: 0,
    teamwork: 0,
    attendance: 0,
    skill: 0,
    leadership: 0,
    other: 0,
  };

  for (const entry of entries) {
    levelCounts[entry.level]++;
    categoryCounts[entry.category]++;
  }

  const stats = {
    totalBadges,
    levelCounts,
    categoryCounts,
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addBadge,
    upgradeBadgeLevel,
    deleteBadge,
    getBadgesByCategory,
    getBadgesByLevel,
    stats,
  };
}
