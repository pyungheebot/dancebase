"use client";

import { useState, useCallback, useEffect } from "react";
import type { PracticePlaylist, PlaylistTrack } from "@/types";

const STORAGE_KEY_PREFIX = "practice-playlist-";

// ============================================
// 유틸리티
// ============================================

export function detectPlatform(
  url: string
): PlaylistTrack["platform"] {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = u.hostname.toLowerCase();
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return "youtube";
    }
    if (hostname.includes("spotify.com")) {
      return "spotify";
    }
    if (hostname.includes("soundcloud.com")) {
      return "soundcloud";
    }
    return "other";
  } catch {
    return "other";
  }
}

export const CATEGORY_LABELS: Record<PlaylistTrack["category"], string> = {
  warmup: "워밍업",
  practice: "연습",
  cooldown: "쿨다운",
  freestyle: "프리스타일",
};

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadPlaylists(groupId: string): PracticePlaylist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as PracticePlaylist[];
  } catch {
    return [];
  }
}

function savePlaylists(groupId: string, playlists: PracticePlaylist[]): void {
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(playlists));
}

// ============================================
// 훅
// ============================================

export function usePracticePlaylist(groupId: string) {
  const [playlists, setPlaylists] = useState<PracticePlaylist[]>([]);

  // 초기 로드
  useEffect(() => {
    setPlaylists(loadPlaylists(groupId));
  }, [groupId]);

  // 상태 업데이트 + localStorage 동기화
  const updatePlaylists = useCallback(
    (updater: (prev: PracticePlaylist[]) => PracticePlaylist[]) => {
      setPlaylists((prev) => {
        const next = updater(prev);
        savePlaylists(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  // 플레이리스트 생성
  const createPlaylist = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const newPlaylist: PracticePlaylist = {
        id: crypto.randomUUID(),
        name: trimmed,
        tracks: [],
        createdAt: new Date().toISOString(),
      };
      updatePlaylists((prev) => [...prev, newPlaylist]);
    },
    [updatePlaylists]
  );

  // 플레이리스트 삭제
  const deletePlaylist = useCallback(
    (id: string) => {
      updatePlaylists((prev) => prev.filter((p) => p.id !== id));
    },
    [updatePlaylists]
  );

  // 곡 추가
  const addTrack = useCallback(
    (
      playlistId: string,
      track: Omit<PlaylistTrack, "id" | "addedAt" | "likes">
    ) => {
      const newTrack: PlaylistTrack = {
        ...track,
        id: crypto.randomUUID(),
        addedAt: new Date().toISOString(),
        likes: 0,
      };
      updatePlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId
            ? { ...p, tracks: [...p.tracks, newTrack] }
            : p
        )
      );
    },
    [updatePlaylists]
  );

  // 곡 삭제
  const removeTrack = useCallback(
    (playlistId: string, trackId: string) => {
      updatePlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId
            ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
            : p
        )
      );
    },
    [updatePlaylists]
  );

  // 좋아요 토글
  const toggleLike = useCallback(
    (playlistId: string, trackId: string) => {
      updatePlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId
            ? {
                ...p,
                tracks: p.tracks.map((t) =>
                  t.id === trackId
                    ? { ...t, likes: t.likes > 0 ? t.likes - 1 : t.likes + 1 }
                    : t
                ),
              }
            : p
        )
      );
    },
    [updatePlaylists]
  );

  // 전체 곡 수
  const totalTracks = playlists.reduce((sum, p) => sum + p.tracks.length, 0);

  return {
    playlists,
    totalTracks,
    createPlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    toggleLike,
  };
}
