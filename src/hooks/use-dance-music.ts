"use client";

import { useCallback, useState } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  DanceMusicData,
  DanceMusicPlaylist,
  DanceMusicTrack,
} from "@/types";

// ============================================================
// 상수
// ============================================================

export const DANCE_MUSIC_GENRES = [
  "힙합",
  "팝핀",
  "왁킹",
  "하우스",
  "락킹",
  "크럼프",
  "브레이킹",
  "재즈",
  "케이팝",
  "R&B",
  "팝",
  "일렉트로닉",
  "컨템포러리",
  "기타",
] as const;

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.danceMusicPlaylist(memberId);
}

// ============================================================
// 훅
// ============================================================

export function useDanceMusic(memberId: string) {
  const [playlists, setPlaylists] = useState<DanceMusicPlaylist[]>(() => loadFromStorage<DanceMusicData>(getStorageKey(memberId), {} as DanceMusicData).playlists);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    const data = loadFromStorage<DanceMusicData>(getStorageKey(memberId), {} as DanceMusicData);
    setPlaylists(data.playlists);
  }, [memberId]);

  // 내부 persist 헬퍼
  const persist = useCallback(
    (nextPlaylists: DanceMusicPlaylist[]) => {
      const now = new Date().toISOString();
      saveToStorage(getStorageKey(memberId), { memberId, playlists: nextPlaylists, updatedAt: now });
      setPlaylists(nextPlaylists);
    },
    [memberId]
  );

  // ────────────────────────────────────────────
  // 플레이리스트 CRUD
  // ────────────────────────────────────────────

  /** 플레이리스트 생성 */
  const createPlaylist = useCallback(
    (params: { name: string; description?: string }): DanceMusicPlaylist => {
      const now = new Date().toISOString();
      const newPlaylist: DanceMusicPlaylist = {
        id: crypto.randomUUID(),
        name: params.name.trim(),
        description: params.description?.trim() ?? "",
        tracks: [],
        createdAt: now,
        updatedAt: now,
      };
      persist([...playlists, newPlaylist]);
      return newPlaylist;
    },
    [playlists, persist]
  );

  /** 플레이리스트 수정 */
  const updatePlaylist = useCallback(
    (
      playlistId: string,
      patch: Partial<Pick<DanceMusicPlaylist, "name" | "description">>
    ): void => {
      const next = playlists.map((p) =>
        p.id === playlistId
          ? { ...p, ...patch, updatedAt: new Date().toISOString() }
          : p
      );
      persist(next);
    },
    [playlists, persist]
  );

  /** 플레이리스트 삭제 */
  const deletePlaylist = useCallback(
    (playlistId: string): void => {
      persist(playlists.filter((p) => p.id !== playlistId));
    },
    [playlists, persist]
  );

  // ────────────────────────────────────────────
  // 트랙 CRUD
  // ────────────────────────────────────────────

  /** 트랙 추가 */
  const addTrack = useCallback(
    (
      playlistId: string,
      params: {
        title: string;
        artist: string;
        genre: string;
        bpm?: number | null;
        duration?: string | null;
        url?: string | null;
        tags?: string[];
        notes?: string;
      }
    ): DanceMusicTrack | null => {
      const playlist = playlists.find((p) => p.id === playlistId);
      if (!playlist) return null;

      const now = new Date().toISOString();
      const newTrack: DanceMusicTrack = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        artist: params.artist.trim(),
        genre: params.genre.trim(),
        bpm: params.bpm ?? null,
        duration: params.duration?.trim() || null,
        url: params.url?.trim() || null,
        tags: params.tags ?? [],
        notes: params.notes?.trim() ?? "",
        isFavorite: false,
        createdAt: now,
      };

      const next = playlists.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              tracks: [...p.tracks, newTrack],
              updatedAt: now,
            }
          : p
      );
      persist(next);
      return newTrack;
    },
    [playlists, persist]
  );

  /** 트랙 수정 */
  const updateTrack = useCallback(
    (
      playlistId: string,
      trackId: string,
      patch: Partial<
        Pick<
          DanceMusicTrack,
          | "title"
          | "artist"
          | "genre"
          | "bpm"
          | "duration"
          | "url"
          | "tags"
          | "notes"
        >
      >
    ): void => {
      const now = new Date().toISOString();
      const next = playlists.map((p) => {
        if (p.id !== playlistId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t) =>
            t.id === trackId ? { ...t, ...patch } : t
          ),
          updatedAt: now,
        };
      });
      persist(next);
    },
    [playlists, persist]
  );

  /** 트랙 삭제 */
  const removeTrack = useCallback(
    (playlistId: string, trackId: string): void => {
      const now = new Date().toISOString();
      const next = playlists.map((p) => {
        if (p.id !== playlistId) return p;
        return {
          ...p,
          tracks: p.tracks.filter((t) => t.id !== trackId),
          updatedAt: now,
        };
      });
      persist(next);
    },
    [playlists, persist]
  );

  /** 즐겨찾기 토글 */
  const toggleFavorite = useCallback(
    (playlistId: string, trackId: string): void => {
      const now = new Date().toISOString();
      const next = playlists.map((p) => {
        if (p.id !== playlistId) return p;
        return {
          ...p,
          tracks: p.tracks.map((t) =>
            t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t
          ),
          updatedAt: now,
        };
      });
      persist(next);
    },
    [playlists, persist]
  );

  /** 트랙 순서 변경 (드래그&드롭) */
  const reorderTracks = useCallback(
    (playlistId: string, orderedTrackIds: string[]): void => {
      const now = new Date().toISOString();
      const next = playlists.map((p) => {
        if (p.id !== playlistId) return p;
        const trackMap = new Map(p.tracks.map((t) => [t.id, t]));
        const reordered = orderedTrackIds
          .map((id) => trackMap.get(id))
          .filter((t): t is DanceMusicTrack => t !== undefined);
        return {
          ...p,
          tracks: reordered,
          updatedAt: now,
        };
      });
      persist(next);
    },
    [playlists, persist]
  );

  // ────────────────────────────────────────────
  // 통계
  // ────────────────────────────────────────────

  const allTracks = playlists.flatMap((p) => p.tracks);

  /** 전체 플레이리스트 수 */
  const totalPlaylists = playlists.length;

  /** 전체 트랙 수 */
  const totalTracks = allTracks.length;

  /** 즐겨찾기 수 */
  const favoriteCount = allTracks.filter((t) => t.isFavorite).length;

  /** 장르별 분포 */
  const genreDistribution: { genre: string; count: number; percent: number }[] =
    (() => {
      const genreMap = new Map<string, number>();
      allTracks.forEach((t) => {
        const g = t.genre || "기타";
        genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
      });
      const total = allTracks.length || 1;
      return Array.from(genreMap.entries())
        .map(([genre, count]) => ({
          genre,
          count,
          percent: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);
    })();

  return {
    playlists,
    loading,
    // 플레이리스트 CRUD
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    // 트랙 CRUD
    addTrack,
    updateTrack,
    removeTrack,
    toggleFavorite,
    reorderTracks,
    // 통계
    totalPlaylists,
    totalTracks,
    favoriteCount,
    genreDistribution,
    refetch: reload,
  };
}
