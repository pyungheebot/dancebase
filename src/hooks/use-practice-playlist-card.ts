"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { PracticeTrack, PracticePlaylistData } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:practice-playlist:${groupId}`;
}

// ============================================
// localStorage 헬퍼
// ============================================

function loadFromStorage(groupId: string): PracticePlaylistData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as PracticePlaylistData[];
  } catch {
    return [];
  }
}

function saveToStorage(groupId: string, data: PracticePlaylistData[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================
// 시간 포맷 유틸리티
// ============================================

/** "MM:SS" 문자열 → 초 변환 */
export function mmssToSeconds(mmss: string): number {
  const parts = mmss.split(":");
  if (parts.length !== 2) return 0;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (isNaN(mins) || isNaN(secs)) return 0;
  return mins * 60 + secs;
}

/** 초 → "MM:SS" 문자열 변환 */
export function secondsToMmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ============================================
// 훅
// ============================================

export function usePracticePlaylistCard(groupId: string) {
  const swrKey = swrKeys.practicePlaylist(groupId);

  const { data: playlists = [], mutate } = useSWR(swrKey, () =>
    loadFromStorage(groupId)
  );

  // 상태 업데이트 + localStorage 동기화
  const update = useCallback(
    (updater: (prev: PracticePlaylistData[]) => PracticePlaylistData[]) => {
      const next = updater(playlists);
      saveToStorage(groupId, next);
      mutate(next, false);
    },
    [groupId, playlists, mutate]
  );

  // 플레이리스트 생성
  const createPlaylist = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const newPlaylist: PracticePlaylistData = {
        id: crypto.randomUUID(),
        name: trimmed,
        tracks: [],
        createdAt: new Date().toISOString(),
      };
      update((prev) => [...prev, newPlaylist]);
    },
    [update]
  );

  // 플레이리스트 삭제
  const deletePlaylist = useCallback(
    (playlistId: string) => {
      update((prev) => prev.filter((p) => p.id !== playlistId));
    },
    [update]
  );

  // 곡 추가
  const addTrack = useCallback(
    (
      playlistId: string,
      title: string,
      artist: string,
      duration: number,
      bpm?: number,
      genre?: string,
      notes?: string,
      addedBy?: string
    ) => {
      update((prev) =>
        prev.map((p) => {
          if (p.id !== playlistId) return p;
          const maxOrder = p.tracks.reduce((m, t) => Math.max(m, t.order), 0);
          const newTrack: PracticeTrack = {
            id: crypto.randomUUID(),
            title: title.trim(),
            artist: artist.trim(),
            duration,
            bpm: bpm ?? undefined,
            genre: genre?.trim() || undefined,
            notes: notes?.trim() || undefined,
            order: maxOrder + 1,
            addedBy: (addedBy ?? "").trim() || "나",
            createdAt: new Date().toISOString(),
          };
          return { ...p, tracks: [...p.tracks, newTrack] };
        })
      );
    },
    [update]
  );

  // 곡 제거
  const removeTrack = useCallback(
    (playlistId: string, trackId: string) => {
      update((prev) =>
        prev.map((p) => {
          if (p.id !== playlistId) return p;
          const filtered = p.tracks.filter((t) => t.id !== trackId);
          const reordered = filtered.map((t, idx) => ({ ...t, order: idx + 1 }));
          return { ...p, tracks: reordered };
        })
      );
    },
    [update]
  );

  // 곡 순서 변경 (up / down)
  const moveTrack = useCallback(
    (playlistId: string, trackId: string, direction: "up" | "down") => {
      update((prev) =>
        prev.map((p) => {
          if (p.id !== playlistId) return p;
          const sorted = [...p.tracks].sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((t) => t.id === trackId);
          if (idx === -1) return p;
          const targetIdx = direction === "up" ? idx - 1 : idx + 1;
          if (targetIdx < 0 || targetIdx >= sorted.length) return p;
          [sorted[idx], sorted[targetIdx]] = [sorted[targetIdx], sorted[idx]];
          const reordered = sorted.map((t, i) => ({ ...t, order: i + 1 }));
          return { ...p, tracks: reordered };
        })
      );
    },
    [update]
  );

  // ============================================
  // 통계
  // ============================================

  const totalPlaylists = playlists.length;
  const totalTracks = playlists.reduce((sum, p) => sum + p.tracks.length, 0);
  const totalDuration = playlists.reduce(
    (sum, p) => sum + p.tracks.reduce((s, t) => s + t.duration, 0),
    0
  );

  return {
    playlists,
    loading: false,
    // CRUD
    createPlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    moveTrack,
    // 통계
    totalPlaylists,
    totalTracks,
    totalDuration,
  };
}
