"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { VideoReviewEntry, VideoReviewTimestamp, VideoReviewTimestampType } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:video-review:${groupId}`;
}

function loadEntries(groupId: string): VideoReviewEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as VideoReviewEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: VideoReviewEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(entries));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useVideoReview(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.videoReview(groupId) : null,
    async () => loadEntries(groupId)
  );

  const entries = data ?? [];

  // ── 영상 엔트리 추가 ──
  async function addEntry(
    input: Omit<VideoReviewEntry, "id" | "timestamps" | "createdAt">
  ): Promise<void> {
    const newEntry: VideoReviewEntry = {
      ...input,
      id: crypto.randomUUID(),
      timestamps: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 영상 엔트리 수정 ──
  async function updateEntry(
    entryId: string,
    changes: Partial<Omit<VideoReviewEntry, "id" | "timestamps" | "createdAt">>
  ): Promise<void> {
    const updated = entries.map((e) =>
      e.id === entryId ? { ...e, ...changes } : e
    );
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 영상 엔트리 삭제 ──
  async function deleteEntry(entryId: string): Promise<void> {
    const updated = entries.filter((e) => e.id !== entryId);
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 타임스탬프 추가 ──
  async function addTimestamp(
    entryId: string,
    input: { time: string; comment: string; author: string; type: VideoReviewTimestampType }
  ): Promise<void> {
    const newTimestamp: VideoReviewTimestamp = {
      id: crypto.randomUUID(),
      time: input.time,
      comment: input.comment.trim(),
      author: input.author.trim(),
      type: input.type,
      createdAt: new Date().toISOString(),
    };
    const updated = entries.map((e) =>
      e.id === entryId
        ? { ...e, timestamps: [...e.timestamps, newTimestamp] }
        : e
    );
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 타임스탬프 수정 ──
  async function updateTimestamp(
    entryId: string,
    timestampId: string,
    changes: Partial<Omit<VideoReviewTimestamp, "id" | "createdAt">>
  ): Promise<void> {
    const updated = entries.map((e) =>
      e.id === entryId
        ? {
            ...e,
            timestamps: e.timestamps.map((t) =>
              t.id === timestampId ? { ...t, ...changes } : t
            ),
          }
        : e
    );
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 타임스탬프 삭제 ──
  async function deleteTimestamp(
    entryId: string,
    timestampId: string
  ): Promise<void> {
    const updated = entries.map((e) =>
      e.id === entryId
        ? {
            ...e,
            timestamps: e.timestamps.filter((t) => t.id !== timestampId),
          }
        : e
    );
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 통계 ──
  const totalVideos = entries.length;
  const totalTimestamps = entries.reduce(
    (sum, e) => sum + e.timestamps.length,
    0
  );
  const ratedEntries = entries.filter((e) => e.overallRating != null);
  const averageRating =
    ratedEntries.length > 0
      ? ratedEntries.reduce((sum, e) => sum + (e.overallRating ?? 0), 0) /
        ratedEntries.length
      : 0;

  const stats = {
    totalVideos,
    totalTimestamps,
    averageRating,
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    addTimestamp,
    updateTimestamp,
    deleteTimestamp,
    stats,
  };
}
