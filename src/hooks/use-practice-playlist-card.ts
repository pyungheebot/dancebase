"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  PracticePlaylistEntry,
  PracticePlaylistTrack,
  PracticePlaylistPurpose,
} from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:practice-playlist:${groupId}`;
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

/** 총 재생시간 계산 */
function calcTotalDuration(tracks: PracticePlaylistTrack[]): number {
  return tracks.reduce((sum, t) => sum + t.duration, 0);
}

// ============================================
// 훅
// ============================================

export function usePracticePlaylistCard(groupId: string) {
  const swrKey = swrKeys.practicePlaylist(groupId);

  const { data: playlists = [], mutate } = useSWR(swrKey, () =>
    loadFromStorage<PracticePlaylistEntry[]>(storageKey(groupId), [])
  );

  // 상태 업데이트 + localStorage 동기화
  const update = useCallback(
    (
      updater: (prev: PracticePlaylistEntry[]) => PracticePlaylistEntry[]
    ) => {
      const next = updater(playlists);
      saveToStorage(storageKey(groupId), next);
      mutate(next, false);
    },
    [groupId, playlists, mutate]
  );

  // 플레이리스트 생성
  const createPlaylist = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const now = new Date().toISOString();
      const newPlaylist: PracticePlaylistEntry = {
        id: crypto.randomUUID(),
        groupId,
        name: trimmed,
        tracks: [],
        totalDuration: 0,
        createdAt: now,
        updatedAt: now,
      };
      update((prev) => [...prev, newPlaylist]);
    },
    [groupId, update]
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
      purpose: PracticePlaylistPurpose,
      bpm?: number,
      genre?: string,
      notes?: string,
      addedBy?: string
    ) => {
      update((prev) =>
        prev.map((p) => {
          if (p.id !== playlistId) return p;
          const maxOrder = p.tracks.reduce(
            (m, t) => Math.max(m, t.order),
            0
          );
          const newTrack: PracticePlaylistTrack = {
            id: crypto.randomUUID(),
            title: title.trim(),
            artist: artist.trim() || undefined,
            duration,
            purpose,
            bpm: bpm ?? undefined,
            genre: genre?.trim() || undefined,
            notes: notes?.trim() || undefined,
            order: maxOrder + 1,
            addedBy: (addedBy ?? "").trim() || "나",
            createdAt: new Date().toISOString(),
          };
          const updatedTracks = [...p.tracks, newTrack];
          return {
            ...p,
            tracks: updatedTracks,
            totalDuration: calcTotalDuration(updatedTracks),
            updatedAt: new Date().toISOString(),
          };
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
          const reordered = filtered.map((t, idx) => ({
            ...t,
            order: idx + 1,
          }));
          return {
            ...p,
            tracks: reordered,
            totalDuration: calcTotalDuration(reordered),
            updatedAt: new Date().toISOString(),
          };
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
          return {
            ...p,
            tracks: reordered,
            totalDuration: calcTotalDuration(reordered),
            updatedAt: new Date().toISOString(),
          };
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
    (sum, p) => sum + p.totalDuration,
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
