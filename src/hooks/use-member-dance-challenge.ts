"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  DanceChallengeData,
  DanceChallengeEntry,
  DanceChallengePlatform,
  DanceChallengeResult,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(memberId: string): string {
  return `dancebase:member-dance-challenge:${memberId}`;
}

// ============================================
// 훅
// ============================================

export function useMemberDanceChallenge(memberId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.memberDanceChallenge(memberId),
    () => loadFromStorage<DanceChallengeData>(storageKey(memberId), {} as DanceChallengeData),
    {
      fallbackData: {
        memberId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: DanceChallengeEntry[] = data?.entries ?? [];

  // 기록 추가
  const addEntry = useCallback(
    (params: {
      challengeName: string;
      platform: DanceChallengePlatform;
      date: string;
      songTitle?: string;
      videoUrl?: string;
      viewCount?: number;
      likeCount?: number;
      result: DanceChallengeResult;
      notes?: string;
    }): DanceChallengeEntry => {
      const current = loadFromStorage<DanceChallengeData>(storageKey(memberId), {} as DanceChallengeData);
      const now = new Date().toISOString();
      const newEntry: DanceChallengeEntry = {
        id: crypto.randomUUID(),
        challengeName: params.challengeName.trim(),
        platform: params.platform,
        date: params.date,
        songTitle: params.songTitle?.trim() || undefined,
        videoUrl: params.videoUrl?.trim() || undefined,
        viewCount: params.viewCount,
        likeCount: params.likeCount,
        result: params.result,
        notes: params.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated: DanceChallengeData = {
        ...current,
        entries: [newEntry, ...current.entries],
        updatedAt: now,
      };
      saveToStorage(storageKey(memberId), updated);
      mutate(updated, false);
      return newEntry;
    },
    [memberId, mutate]
  );

  // 기록 수정
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        challengeName: string;
        platform: DanceChallengePlatform;
        date: string;
        songTitle: string;
        videoUrl: string;
        viewCount: number;
        likeCount: number;
        result: DanceChallengeResult;
        notes: string;
      }>
    ): boolean => {
      const current = loadFromStorage<DanceChallengeData>(storageKey(memberId), {} as DanceChallengeData);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: DanceChallengeEntry = {
        ...existing,
        ...params,
        challengeName:
          params.challengeName?.trim() ?? existing.challengeName,
        songTitle:
          params.songTitle !== undefined
            ? params.songTitle.trim() || undefined
            : existing.songTitle,
        videoUrl:
          params.videoUrl !== undefined
            ? params.videoUrl.trim() || undefined
            : existing.videoUrl,
        notes:
          params.notes !== undefined
            ? params.notes.trim() || undefined
            : existing.notes,
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = [...current.entries];
      updatedEntries[idx] = updatedEntry;

      const updated: DanceChallengeData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(memberId), updated);
      mutate(updated, false);
      return true;
    },
    [memberId, mutate]
  );

  // 기록 삭제
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadFromStorage<DanceChallengeData>(storageKey(memberId), {} as DanceChallengeData);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: DanceChallengeData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(memberId), updated);
      mutate(updated, false);
      return true;
    },
    [memberId, mutate]
  );

  // 통계 계산
  const stats = (() => {
    const totalCount = entries.length;
    const completedCount = entries.filter(
      (e) => e.result === "completed"
    ).length;
    const inProgressCount = entries.filter(
      (e) => e.result === "in_progress"
    ).length;
    const abandonedCount = entries.filter(
      (e) => e.result === "abandoned"
    ).length;
    const totalViews = entries.reduce((s, e) => s + (e.viewCount ?? 0), 0);
    const totalLikes = entries.reduce((s, e) => s + (e.likeCount ?? 0), 0);

    const platformCounts = entries.reduce<
      Record<DanceChallengePlatform, number>
    >(
      (acc, e) => {
        acc[e.platform] = (acc[e.platform] ?? 0) + 1;
        return acc;
      },
      { instagram: 0, tiktok: 0, youtube: 0, offline: 0, other: 0 }
    );

    return {
      totalCount,
      completedCount,
      inProgressCount,
      abandonedCount,
      totalViews,
      totalLikes,
      platformCounts,
    };
  })();

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    stats,
  };
}
