"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { BadgeDefinition, BadgeRarity, MemberBadgeAward } from "@/types";

type MemberBadgeStore = {
  badges: BadgeDefinition[];
  awards: MemberBadgeAward[];
};

function getStorageKey(groupId: string): string {
  return `dancebase:member-badge:${groupId}`;
}

function loadStore(groupId: string): MemberBadgeStore {
  if (typeof window === "undefined") return { badges: [], awards: [] };
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return { badges: [], awards: [] };
    return JSON.parse(raw) as MemberBadgeStore;
  } catch {
    return { badges: [], awards: [] };
  }
}

function saveStore(groupId: string, store: MemberBadgeStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(store));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useMemberBadge(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.memberBadge(groupId) : null,
    () => loadStore(groupId),
    { revalidateOnFocus: false }
  );

  const store: MemberBadgeStore = data ?? { badges: [], awards: [] };

  // 뱃지 정의 추가
  function createBadge(
    name: string,
    description: string,
    emoji: string,
    rarity: BadgeRarity,
    category: string
  ): BadgeDefinition {
    const newBadge: BadgeDefinition = {
      id: generateId(),
      name,
      description,
      emoji,
      rarity,
      category,
      createdAt: new Date().toISOString(),
    };
    const next: MemberBadgeStore = {
      ...store,
      badges: [...store.badges, newBadge],
    };
    saveStore(groupId, next);
    mutate(next, false);
    return newBadge;
  }

  // 뱃지 삭제 (관련 수여도 함께 삭제)
  function deleteBadge(badgeId: string): void {
    const next: MemberBadgeStore = {
      badges: store.badges.filter((b) => b.id !== badgeId),
      awards: store.awards.filter((a) => a.badgeId !== badgeId),
    };
    saveStore(groupId, next);
    mutate(next, false);
  }

  // 뱃지 수여
  function awardBadge(
    badgeId: string,
    memberName: string,
    awardedBy: string,
    reason: string
  ): MemberBadgeAward {
    const award: MemberBadgeAward = {
      id: generateId(),
      badgeId,
      memberName,
      awardedBy,
      reason,
      awardedAt: new Date().toISOString(),
    };
    const next: MemberBadgeStore = {
      ...store,
      awards: [...store.awards, award],
    };
    saveStore(groupId, next);
    mutate(next, false);
    return award;
  }

  // 수여 취소
  function revokeAward(awardId: string): void {
    const next: MemberBadgeStore = {
      ...store,
      awards: store.awards.filter((a) => a.id !== awardId),
    };
    saveStore(groupId, next);
    mutate(next, false);
  }

  // 멤버 보유 뱃지 목록 (수여 기록 + 뱃지 정의 조인)
  function getMemberBadges(
    memberName: string
  ): Array<{ award: MemberBadgeAward; badge: BadgeDefinition }> {
    return store.awards
      .filter((a) => a.memberName === memberName)
      .map((a) => {
        const badge = store.badges.find((b) => b.id === a.badgeId);
        return badge ? { award: a, badge } : null;
      })
      .filter((x): x is { award: MemberBadgeAward; badge: BadgeDefinition } => x !== null);
  }

  // 뱃지 보유자 목록
  function getBadgeHolders(
    badgeId: string
  ): Array<{ award: MemberBadgeAward }> {
    return store.awards
      .filter((a) => a.badgeId === badgeId)
      .map((a) => ({ award: a }));
  }

  // 통계
  const totalBadges = store.badges.length;
  const totalAwards = store.awards.length;

  // 가장 많은 뱃지를 보유한 멤버 (동점 시 이름 오름차순)
  const memberAwardCounts: Record<string, number> = {};
  for (const award of store.awards) {
    memberAwardCounts[award.memberName] =
      (memberAwardCounts[award.memberName] ?? 0) + 1;
  }
  const topCollector: string | null =
    Object.keys(memberAwardCounts).length === 0
      ? null
      : Object.entries(memberAwardCounts).sort((a, b) =>
          b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])
        )[0][0];

  // 희귀도별 뱃지 분포
  const rarityDistribution: Record<BadgeRarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  for (const badge of store.badges) {
    rarityDistribution[badge.rarity] += 1;
  }

  // 최다 수집자 랭킹 상위 5명
  const topCollectors: Array<{ memberName: string; count: number }> = Object.entries(
    memberAwardCounts
  )
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])))
    .slice(0, 5)
    .map(([memberName, count]) => ({ memberName, count }));

  return {
    badges: store.badges,
    awards: store.awards,
    createBadge,
    deleteBadge,
    awardBadge,
    revokeAward,
    getMemberBadges,
    getBadgeHolders,
    totalBadges,
    totalAwards,
    topCollector,
    topCollectors,
    rarityDistribution,
  };
}
