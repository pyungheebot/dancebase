"use client";

import { useState, useCallback } from "react";
import type { SongReadinessEntry, SongReadinessVote } from "@/types";

export const VOTE_LABELS: Record<SongReadinessVote, string> = {
  not_ready: "아직 멀었어요",
  almost: "거의 다 됐어요",
  ready: "완성!",
};

export const VOTE_COLORS: Record<SongReadinessVote, string> = {
  not_ready: "red",
  almost: "yellow",
  ready: "green",
};

function getStorageKey(groupId: string): string {
  return `song-readiness-${groupId}`;
}

function loadEntries(groupId: string): SongReadinessEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as SongReadinessEntry[];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: SongReadinessEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(entries));
  } catch {
    // 저장 실패 시 무시
  }
}

export function useSongReadinessVote(groupId: string) {
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  const getVotes = useCallback(
    (songId: string): SongReadinessEntry[] => {
      return loadEntries(groupId).filter((e) => e.songId === songId);
    },
    [groupId]
  );

  const castVote = useCallback(
    (
      songId: string,
      userId: string,
      userName: string,
      vote: SongReadinessVote
    ): void => {
      const entries = loadEntries(groupId);
      const idx = entries.findIndex(
        (e) => e.songId === songId && e.userId === userId
      );
      const entry: SongReadinessEntry = {
        songId,
        userId,
        userName,
        vote,
        votedAt: new Date().toISOString(),
      };
      if (idx >= 0) {
        entries[idx] = entry;
      } else {
        entries.push(entry);
      }
      saveEntries(groupId, entries);
      refresh();
    },
    [groupId, refresh]
  );

  const getMyVote = useCallback(
    (songId: string, userId: string): SongReadinessVote | null => {
      const entry = loadEntries(groupId).find(
        (e) => e.songId === songId && e.userId === userId
      );
      return entry?.vote ?? null;
    },
    [groupId]
  );

  const getSummary = useCallback(
    (
      songId: string
    ): { notReady: number; almost: number; ready: number; total: number } => {
      const votes = loadEntries(groupId).filter((e) => e.songId === songId);
      const notReady = votes.filter((e) => e.vote === "not_ready").length;
      const almost = votes.filter((e) => e.vote === "almost").length;
      const ready = votes.filter((e) => e.vote === "ready").length;
      return { notReady, almost, ready, total: votes.length };
    },
    [groupId]
  );

  const getReadinessRate = useCallback(
    (songId: string): number => {
      const { notReady, almost, ready, total } = getSummary(songId);
      if (total === 0) return 0;
      const score = ready * 100 + almost * 50 + notReady * 0;
      return Math.round(score / total);
    },
    [getSummary]
  );

  return {
    getVotes,
    castVote,
    getMyVote,
    getSummary,
    getReadinessRate,
    VOTE_LABELS,
    VOTE_COLORS,
  };
}
