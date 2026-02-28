"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MyPlaylistData,
  MyPlaylist,
  MyPlaylistSong,
  MyPlaylistSongPurpose,
} from "@/types";

// ============================================================
// 상수
// ============================================================

export const DANCE_PLAYLIST_GENRES = [
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

export const PURPOSE_LABELS: Record<MyPlaylistSongPurpose, string> = {
  warmup: "워밍업",
  main: "메인연습",
  cooldown: "쿨다운",
  performance: "공연",
};

export const PURPOSE_COLORS: Record<MyPlaylistSongPurpose, string> = {
  warmup: "bg-orange-100 text-orange-700",
  main: "bg-blue-100 text-blue-700",
  cooldown: "bg-cyan-100 text-cyan-700",
  performance: "bg-purple-100 text-purple-700",
};

export const PURPOSE_BAR_COLORS: Record<MyPlaylistSongPurpose, string> = {
  warmup: "bg-orange-400",
  main: "bg-blue-500",
  cooldown: "bg-cyan-400",
  performance: "bg-purple-500",
};

const ALL_PURPOSES: MyPlaylistSongPurpose[] = [
  "warmup",
  "main",
  "cooldown",
  "performance",
];

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(memberId: string): string {
  return `dancebase:dance-playlist:${memberId}`;
}

function loadData(memberId: string): MyPlaylistData {
  if (typeof window === "undefined") {
    return { memberId, playlists: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(memberId));
    if (!raw) {
      return { memberId, playlists: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as MyPlaylistData;
  } catch {
    return { memberId, playlists: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(memberId: string, data: MyPlaylistData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(memberId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useDancePlaylist(memberId: string) {
  const { data, mutate, isLoading } = useSWR(
    memberId ? swrKeys.dancePlaylist(memberId) : null,
    () => loadData(memberId)
  );

  const current: MyPlaylistData = data ?? {
    memberId,
    playlists: [],
    updatedAt: new Date().toISOString(),
  };

  const persist = useCallback(
    (next: MyPlaylistData) => {
      saveData(memberId, next);
      mutate(next, false);
    },
    [memberId, mutate]
  );

  // ── 플레이리스트 CRUD ──────────────────────────────────────

  const createPlaylist = useCallback(
    (partial: { name: string; description: string }): MyPlaylist => {
      const newPlaylist: MyPlaylist = {
        id: crypto.randomUUID(),
        name: partial.name,
        description: partial.description,
        songs: [],
        createdAt: new Date().toISOString(),
      };
      persist({
        ...current,
        playlists: [...current.playlists, newPlaylist],
        updatedAt: new Date().toISOString(),
      });
      return newPlaylist;
    },
    [current, persist]
  );

  const deletePlaylist = useCallback(
    (playlistId: string): boolean => {
      const filtered = current.playlists.filter((p) => p.id !== playlistId);
      if (filtered.length === current.playlists.length) return false;
      persist({
        ...current,
        playlists: filtered,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  // ── 곡 CRUD ───────────────────────────────────────────────

  const addSong = useCallback(
    (
      playlistId: string,
      partial: Omit<MyPlaylistSong, "id" | "order" | "createdAt">
    ): MyPlaylistSong | null => {
      const playlistIdx = current.playlists.findIndex(
        (p) => p.id === playlistId
      );
      if (playlistIdx === -1) return null;

      const playlist = current.playlists[playlistIdx];
      const newSong: MyPlaylistSong = {
        id: crypto.randomUUID(),
        ...partial,
        order: playlist.songs.length,
        createdAt: new Date().toISOString(),
      };
      const updatedSongs = [...playlist.songs, newSong];
      const updatedPlaylists = [...current.playlists];
      updatedPlaylists[playlistIdx] = { ...playlist, songs: updatedSongs };
      persist({
        ...current,
        playlists: updatedPlaylists,
        updatedAt: new Date().toISOString(),
      });
      return newSong;
    },
    [current, persist]
  );

  const updateSong = useCallback(
    (
      playlistId: string,
      songId: string,
      partial: Partial<Omit<MyPlaylistSong, "id" | "order" | "createdAt">>
    ): boolean => {
      const playlistIdx = current.playlists.findIndex(
        (p) => p.id === playlistId
      );
      if (playlistIdx === -1) return false;
      const playlist = current.playlists[playlistIdx];
      const songIdx = playlist.songs.findIndex((s) => s.id === songId);
      if (songIdx === -1) return false;

      const updatedSongs = [...playlist.songs];
      updatedSongs[songIdx] = { ...updatedSongs[songIdx], ...partial };
      const updatedPlaylists = [...current.playlists];
      updatedPlaylists[playlistIdx] = { ...playlist, songs: updatedSongs };
      persist({
        ...current,
        playlists: updatedPlaylists,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  const deleteSong = useCallback(
    (playlistId: string, songId: string): boolean => {
      const playlistIdx = current.playlists.findIndex(
        (p) => p.id === playlistId
      );
      if (playlistIdx === -1) return false;
      const playlist = current.playlists[playlistIdx];
      const filtered = playlist.songs.filter((s) => s.id !== songId);
      if (filtered.length === playlist.songs.length) return false;

      // 순서 재정렬
      const reordered = filtered.map((s, i) => ({ ...s, order: i }));
      const updatedPlaylists = [...current.playlists];
      updatedPlaylists[playlistIdx] = { ...playlist, songs: reordered };
      persist({
        ...current,
        playlists: updatedPlaylists,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  const moveSong = useCallback(
    (
      playlistId: string,
      songId: string,
      direction: "up" | "down"
    ): boolean => {
      const playlistIdx = current.playlists.findIndex(
        (p) => p.id === playlistId
      );
      if (playlistIdx === -1) return false;
      const playlist = current.playlists[playlistIdx];
      const sorted = [...playlist.songs].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === songId);
      if (idx === -1) return false;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return false;

      // 순서 교환
      const tmp = sorted[idx].order;
      sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
      sorted[swapIdx] = { ...sorted[swapIdx], order: tmp };

      const updatedPlaylists = [...current.playlists];
      updatedPlaylists[playlistIdx] = { ...playlist, songs: sorted };
      persist({
        ...current,
        playlists: updatedPlaylists,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  // ── 통계 ──────────────────────────────────────────────────

  const allSongs = current.playlists.flatMap((p) => p.songs);
  const totalSongs = allSongs.length;

  const purposeStats = ALL_PURPOSES.map((purpose) => {
    const count = allSongs.filter((s) => s.purpose === purpose).length;
    const percent = totalSongs === 0 ? 0 : Math.round((count / totalSongs) * 100);
    return { purpose, count, percent };
  });

  const stats = {
    totalPlaylists: current.playlists.length,
    totalSongs,
    purposeStats,
  };

  return {
    data: current,
    playlists: current.playlists,
    loading: isLoading,
    createPlaylist,
    deletePlaylist,
    addSong,
    updateSong,
    deleteSong,
    moveSong,
    stats,
    refetch: () => mutate(),
  };
}
