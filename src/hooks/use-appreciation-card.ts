"use client";

import { useState, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AppreciationCardCategory,
  AppreciationCardData,
  AppreciationCardEntry,
} from "@/types";

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string): string {
  return swrKeys.appreciationCard(groupId);
}

function loadData(groupId: string): AppreciationCardData {
  if (typeof window === "undefined") {
    return { groupId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return { groupId, entries: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as AppreciationCardData;
  } catch {
    return { groupId, entries: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: AppreciationCardData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================
// 훅
// ============================================

export function useAppreciationCard(groupId: string) {
  const [entries, setEntries] = useState<AppreciationCardEntry[]>([]);


  // 감사 카드 보내기
  const sendCard = useCallback(
    (
      fromMember: string,
      toMember: string,
      category: AppreciationCardCategory,
      message: string,
      emoji?: string,
      isPublic: boolean = true
    ) => {
      const newEntry: AppreciationCardEntry = {
        id: crypto.randomUUID(),
        fromMember,
        toMember,
        category,
        message,
        emoji,
        isPublic,
        likes: [],
        createdAt: new Date().toISOString(),
      };

      setEntries((prev) => {
        const updated = [newEntry, ...prev];
        const data = loadData(groupId);
        saveData({
          ...data,
          entries: updated,
          updatedAt: new Date().toISOString(),
        });
        return updated;
      });
    },
    [groupId]
  );

  // 감사 카드 삭제
  const deleteCard = useCallback(
    (entryId: string) => {
      setEntries((prev) => {
        const updated = prev.filter((e) => e.id !== entryId);
        const data = loadData(groupId);
        saveData({
          ...data,
          entries: updated,
          updatedAt: new Date().toISOString(),
        });
        return updated;
      });
    },
    [groupId]
  );

  // 좋아요 토글
  const toggleLike = useCallback(
    (entryId: string, memberName: string) => {
      setEntries((prev) => {
        const updated = prev.map((e) => {
          if (e.id !== entryId) return e;
          const hasLiked = e.likes.includes(memberName);
          return {
            ...e,
            likes: hasLiked
              ? e.likes.filter((n) => n !== memberName)
              : [...e.likes, memberName],
          };
        });
        const data = loadData(groupId);
        saveData({
          ...data,
          entries: updated,
          updatedAt: new Date().toISOString(),
        });
        return updated;
      });
    },
    [groupId]
  );

  // 공개 카드 필터 (비공개는 본인만 조회 가능)
  const getVisibleEntries = useCallback(
    (currentMemberName?: string): AppreciationCardEntry[] => {
      return entries.filter(
        (e) =>
          e.isPublic ||
          e.fromMember === currentMemberName ||
          e.toMember === currentMemberName
      );
    },
    [entries]
  );

  // 수신 카드
  const getEntriesTo = useCallback(
    (memberName: string): AppreciationCardEntry[] =>
      entries.filter((e) => e.toMember === memberName),
    [entries]
  );

  // 발신 카드
  const getEntriesFrom = useCallback(
    (memberName: string): AppreciationCardEntry[] =>
      entries.filter((e) => e.fromMember === memberName),
    [entries]
  );

  // 통계: 가장 많이 받은 멤버
  const topReceiver = (() => {
    const count: Record<string, number> = {};
    entries.forEach((e) => {
      count[e.toMember] = (count[e.toMember] ?? 0) + 1;
    });
    const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
  })();

  // 통계: 가장 많이 보낸 멤버
  const topSender = (() => {
    const count: Record<string, number> = {};
    entries.forEach((e) => {
      count[e.fromMember] = (count[e.fromMember] ?? 0) + 1;
    });
    const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
  })();

  // 통계: 카테고리별 분포
  const categoryDistribution = (() => {
    const dist: Record<AppreciationCardCategory, number> = {
      leadership: 0,
      effort: 0,
      growth: 0,
      help: 0,
      fun: 0,
      other: 0,
    };
    entries.forEach((e) => {
      dist[e.category] = (dist[e.category] ?? 0) + 1;
    });
    return dist;
  })();

  return {
    entries,
    loading: false,
    totalEntries: entries.length,
    topReceiver,
    topSender,
    categoryDistribution,
    sendCard,
    deleteCard,
    toggleLike,
    getVisibleEntries,
    getEntriesTo,
    getEntriesFrom,
  };
}
