"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import {
  type GroupMusicTrack,
  type GroupMusicLibraryData,
  type MusicTrackUseCase,
} from "@/types";

// ============================================
// localStorage 키 및 유틸
// ============================================

function getStorageKey(groupId: string): string {
  return `dancebase:music-library:${groupId}`;
}

// ============================================
// 훅
// ============================================

export function useGroupMusicLibrary(groupId: string) {
  const { data, mutate } = useSWR(
    swrKeys.groupMusicLibrary(groupId),
    () => loadFromStorage<GroupMusicLibraryData>(getStorageKey(groupId), {} as GroupMusicLibraryData),
    { revalidateOnFocus: false }
  );

  // 내부 저장 헬퍼
  const persist = useCallback(
    (next: GroupMusicLibraryData) => {
      saveToStorage(getStorageKey(groupId), next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  const current: GroupMusicLibraryData = useMemo(() => data ?? {
    groupId,
    tracks: [],
    updatedAt: new Date().toISOString(),
  }, [data, groupId]);

  // ── 트랙 추가 ──────────────────────────────────────
  const addTrack = useCallback(
    (
      input: Omit<GroupMusicTrack, "id" | "createdAt" | "isFavorite">
    ): boolean => {
      const trimTitle = input.title.trim();
      const trimArtist = input.artist.trim();
      if (!trimTitle) {
        toast.error(TOAST.SONG_NOTES.TRACK_TITLE_REQUIRED);
        return false;
      }
      if (!trimArtist) {
        toast.error(TOAST.INFO.ARTIST_REQUIRED);
        return false;
      }
      const newTrack: GroupMusicTrack = {
        ...input,
        id: crypto.randomUUID(),
        title: trimTitle,
        artist: trimArtist,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      };
      const next: GroupMusicLibraryData = {
        ...current,
        tracks: [...current.tracks, newTrack],
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success(TOAST.SONG_NOTES.TRACK_ADDED);
      return true;
    },
    [current, persist]
  );

  // ── 트랙 수정 ──────────────────────────────────────
  const updateTrack = useCallback(
    (
      id: string,
      updates: Partial<
        Omit<GroupMusicTrack, "id" | "createdAt" | "isFavorite">
      >
    ): boolean => {
      const idx = current.tracks.findIndex((t) => t.id === id);
      if (idx === -1) {
        toast.error(TOAST.SONG_NOTES.TRACK_NOT_FOUND);
        return false;
      }
      const updatedTracks = current.tracks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      const next: GroupMusicLibraryData = {
        ...current,
        tracks: updatedTracks,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success(TOAST.SONG_NOTES.TRACK_UPDATED);
      return true;
    },
    [current, persist]
  );

  // ── 트랙 삭제 ──────────────────────────────────────
  const deleteTrack = useCallback(
    (id: string): void => {
      const next: GroupMusicLibraryData = {
        ...current,
        tracks: current.tracks.filter((t) => t.id !== id),
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success(TOAST.SONG_NOTES.TRACK_DELETED);
    },
    [current, persist]
  );

  // ── 즐겨찾기 토글 ──────────────────────────────────
  const toggleFavorite = useCallback(
    (id: string): void => {
      const track = current.tracks.find((t) => t.id === id);
      if (!track) return;
      const updatedTracks = current.tracks.map((t) =>
        t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
      );
      const next: GroupMusicLibraryData = {
        ...current,
        tracks: updatedTracks,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      if (!track.isFavorite) {
        toast.success(TOAST.BOOKMARK.ADDED);
      } else {
        toast.success(TOAST.BOOKMARK.REMOVED);
      }
    },
    [current, persist]
  );

  // ── 통계 ───────────────────────────────────────────
  const totalTracks = current.tracks.length;
  const favoriteCount = current.tracks.filter((t) => t.isFavorite).length;

  // 장르 분포: { [genre]: count }
  const genreDistribution = current.tracks.reduce<Record<string, number>>(
    (acc, t) => {
      const genre = t.genre?.trim() || "미분류";
      acc[genre] = (acc[genre] ?? 0) + 1;
      return acc;
    },
    {}
  );

  // 용도 분포: { [useCase]: count }
  const useCaseDistribution = current.tracks.reduce<
    Record<MusicTrackUseCase, number>
  >(
    (acc, t) => {
      acc[t.useCase] = (acc[t.useCase] ?? 0) + 1;
      return acc;
    },
    { practice: 0, performance: 0, warmup: 0, cooldown: 0, other: 0 }
  );

  return {
    tracks: current.tracks,
    updatedAt: current.updatedAt,
    loading: false,
    totalTracks,
    favoriteCount,
    genreDistribution,
    useCaseDistribution,
    addTrack,
    updateTrack,
    deleteTrack,
    toggleFavorite,
    refetch: () => mutate(),
  };
}
