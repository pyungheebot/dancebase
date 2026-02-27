"use client";

import { useState, useCallback, useEffect } from "react";
import type { MusicPlaylist, MusicPlaylistTrack } from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:music-playlist:";
const MAX_PLAYLISTS = 10;
const MAX_TRACKS = 50;

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadPlaylists(groupId: string): MusicPlaylist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as MusicPlaylist[];
  } catch {
    return [];
  }
}

function savePlaylists(groupId: string, playlists: MusicPlaylist[]): void {
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(playlists));
}

// ============================================
// 훅
// ============================================

export function useMusicPlaylist(groupId: string) {
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);

  // 초기 로드
  useEffect(() => {
    setPlaylists(loadPlaylists(groupId));
  }, [groupId]);

  // 상태 업데이트 + localStorage 동기화
  const updatePlaylists = useCallback(
    (updater: (prev: MusicPlaylist[]) => MusicPlaylist[]) => {
      setPlaylists((prev) => {
        const next = updater(prev);
        savePlaylists(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  // ============================================
  // 플레이리스트 CRUD
  // ============================================

  /** 플레이리스트 생성 (최대 10개 제한) */
  const createPlaylist = useCallback(
    (name: string, description: string = "") => {
      const trimmedName = name.trim();
      if (!trimmedName) return false;

      let created = false;
      updatePlaylists((prev) => {
        if (prev.length >= MAX_PLAYLISTS) return prev;
        const now = new Date().toISOString();
        const newPlaylist: MusicPlaylist = {
          id: crypto.randomUUID(),
          groupId,
          name: trimmedName,
          description: description.trim(),
          tracks: [],
          createdAt: now,
          updatedAt: now,
        };
        created = true;
        return [...prev, newPlaylist];
      });
      return created;
    },
    [groupId, updatePlaylists]
  );

  /** 플레이리스트 수정 */
  const updatePlaylist = useCallback(
    (id: string, name: string, description: string = "") => {
      const trimmedName = name.trim();
      if (!trimmedName) return;
      updatePlaylists((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name: trimmedName,
                description: description.trim(),
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
    },
    [updatePlaylists]
  );

  /** 플레이리스트 삭제 */
  const deletePlaylist = useCallback(
    (id: string) => {
      updatePlaylists((prev) => prev.filter((p) => p.id !== id));
    },
    [updatePlaylists]
  );

  // ============================================
  // 곡 CRUD
  // ============================================

  /** 곡 추가 (각 플레이리스트 최대 50곡 제한) */
  const addTrack = useCallback(
    (
      playlistId: string,
      track: Omit<MusicPlaylistTrack, "id" | "order">
    ) => {
      let added = false;
      updatePlaylists((prev) =>
        prev.map((p) => {
          if (p.id !== playlistId) return p;
          if (p.tracks.length >= MAX_TRACKS) return p;
          const maxOrder = p.tracks.reduce(
            (m, t) => Math.max(m, t.order),
            -1
          );
          const newTrack: MusicPlaylistTrack = {
            ...track,
            id: crypto.randomUUID(),
            order: maxOrder + 1,
          };
          added = true;
          return {
            ...p,
            tracks: [...p.tracks, newTrack],
            updatedAt: new Date().toISOString(),
          };
        })
      );
      return added;
    },
    [updatePlaylists]
  );

  /** 곡 삭제 */
  const removeTrack = useCallback(
    (playlistId: string, trackId: string) => {
      updatePlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId
            ? {
                ...p,
                tracks: p.tracks
                  .filter((t) => t.id !== trackId)
                  .map((t, i) => ({ ...t, order: i })),
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
    },
    [updatePlaylists]
  );

  /** 곡 순서 변경 (from 인덱스 → to 인덱스) */
  const reorderTrack = useCallback(
    (playlistId: string, fromIndex: number, toIndex: number) => {
      updatePlaylists((prev) =>
        prev.map((p) => {
          if (p.id !== playlistId) return p;
          const tracks = [...p.tracks];
          const [moved] = tracks.splice(fromIndex, 1);
          tracks.splice(toIndex, 0, moved);
          const reordered = tracks.map((t, i) => ({ ...t, order: i }));
          return {
            ...p,
            tracks: reordered,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [updatePlaylists]
  );

  // 전체 곡 수
  const totalTracks = playlists.reduce((sum, p) => sum + p.tracks.length, 0);

  return {
    playlists,
    totalTracks,
    maxPlaylists: MAX_PLAYLISTS,
    maxTracks: MAX_TRACKS,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    reorderTrack,
  };
}
