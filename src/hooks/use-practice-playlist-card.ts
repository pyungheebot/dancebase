"use client";

import { useState, useCallback, useEffect } from "react";
import type { PracticeCardPlaylist, PracticeCardTrack } from "@/types";

const MAX_TRACKS = 30;

// ============================================
// localStorage 키
// ============================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:playlist:${groupId}:${projectId}`;
}

// ============================================
// localStorage 헬퍼
// ============================================

function loadPlaylist(groupId: string, projectId: string): PracticeCardPlaylist {
  if (typeof window === "undefined") {
    return { tracks: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    if (!raw) return { tracks: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as PracticeCardPlaylist;
  } catch {
    return { tracks: [], updatedAt: new Date().toISOString() };
  }
}

function savePlaylist(groupId: string, projectId: string, playlist: PracticeCardPlaylist): void {
  localStorage.setItem(getStorageKey(groupId, projectId), JSON.stringify(playlist));
}

// ============================================
// duration 문자열 파싱 ("3:45" → 초)
// ============================================

export function parseDurationToSeconds(duration: string): number {
  if (!duration || !duration.trim()) return 0;
  const parts = duration.trim().split(":");
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (isNaN(minutes) || isNaN(seconds)) return 0;
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

// ============================================
// 총 재생 시간 포맷 (초 → "시간:분:초" or "분:초")
// ============================================

export function formatTotalDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// ============================================
// 훅
// ============================================

export function usePracticePlaylistCard(groupId: string, projectId: string) {
  const [playlist, setPlaylist] = useState<PracticeCardPlaylist>(() =>
    loadPlaylist(groupId, projectId)
  );

  // groupId / projectId가 변경되면 재로드
  useEffect(() => {
    setPlaylist(loadPlaylist(groupId, projectId));
  }, [groupId, projectId]);

  // 상태 업데이트 + localStorage 동기화
  const updatePlaylist = useCallback(
    (updater: (prev: PracticeCardPlaylist) => PracticeCardPlaylist) => {
      setPlaylist((prev) => {
        const next = updater(prev);
        savePlaylist(groupId, projectId, next);
        return next;
      });
    },
    [groupId, projectId]
  );

  // 곡 추가
  const addTrack = useCallback(
    (trackData: Omit<PracticeCardTrack, "id" | "order" | "createdAt">) => {
      updatePlaylist((prev) => {
        if (prev.tracks.length >= MAX_TRACKS) return prev;
        const maxOrder = prev.tracks.reduce((max, t) => Math.max(max, t.order), -1);
        const newTrack: PracticeCardTrack = {
          ...trackData,
          id: crypto.randomUUID(),
          order: maxOrder + 1,
          createdAt: new Date().toISOString(),
        };
        return {
          tracks: [...prev.tracks, newTrack],
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [updatePlaylist]
  );

  // 곡 삭제
  const removeTrack = useCallback(
    (trackId: string) => {
      updatePlaylist((prev) => ({
        tracks: prev.tracks
          .filter((t) => t.id !== trackId)
          .map((t, idx) => ({ ...t, order: idx })),
        updatedAt: new Date().toISOString(),
      }));
    },
    [updatePlaylist]
  );

  // 순서 변경 (fromIndex → toIndex)
  const reorderTracks = useCallback(
    (fromIndex: number, toIndex: number) => {
      updatePlaylist((prev) => {
        const sorted = [...prev.tracks].sort((a, b) => a.order - b.order);
        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= sorted.length ||
          toIndex >= sorted.length ||
          fromIndex === toIndex
        ) {
          return prev;
        }
        const moved = sorted.splice(fromIndex, 1)[0];
        sorted.splice(toIndex, 0, moved);
        return {
          tracks: sorted.map((t, idx) => ({ ...t, order: idx })),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [updatePlaylist]
  );

  // 곡 수정
  const updateTrack = useCallback(
    (trackId: string, updates: Partial<Omit<PracticeCardTrack, "id" | "order" | "createdAt">>) => {
      updatePlaylist((prev) => ({
        tracks: prev.tracks.map((t) =>
          t.id === trackId ? { ...t, ...updates } : t
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [updatePlaylist]
  );

  // 정렬된 트랙 목록
  const sortedTracks = [...playlist.tracks].sort((a, b) => a.order - b.order);

  // 총 재생 시간 (초)
  const totalSeconds = sortedTracks.reduce(
    (sum, t) => sum + parseDurationToSeconds(t.duration),
    0
  );

  return {
    playlist,
    sortedTracks,
    trackCount: playlist.tracks.length,
    maxTracks: MAX_TRACKS,
    totalDuration: formatTotalDuration(totalSeconds),
    addTrack,
    removeTrack,
    reorderTracks,
    updateTrack,
  };
}
