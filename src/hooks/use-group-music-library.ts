"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
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

function loadFromStorage(groupId: string): GroupMusicLibraryData {
  if (typeof window === "undefined") {
    return { groupId, tracks: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) {
      return { groupId, tracks: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as GroupMusicLibraryData;
  } catch {
    return { groupId, tracks: [], updatedAt: new Date().toISOString() };
  }
}

function saveToStorage(data: GroupMusicLibraryData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(data.groupId), JSON.stringify(data));
}

// ============================================
// 훅
// ============================================

export function useGroupMusicLibrary(groupId: string) {
  const { data, mutate } = useSWR(
    swrKeys.groupMusicLibrary(groupId),
    () => loadFromStorage(groupId),
    { revalidateOnFocus: false }
  );

  // 내부 저장 헬퍼
  const persist = useCallback(
    (next: GroupMusicLibraryData) => {
      saveToStorage(next);
      mutate(next, false);
    },
    [mutate]
  );

  const current: GroupMusicLibraryData = data ?? {
    groupId,
    tracks: [],
    updatedAt: new Date().toISOString(),
  };

  // ── 트랙 추가 ──────────────────────────────────────
  const addTrack = useCallback(
    (
      input: Omit<GroupMusicTrack, "id" | "createdAt" | "isFavorite">
    ): boolean => {
      const trimTitle = input.title.trim();
      const trimArtist = input.artist.trim();
      if (!trimTitle) {
        toast.error("트랙 제목을 입력해주세요");
        return false;
      }
      if (!trimArtist) {
        toast.error("아티스트명을 입력해주세요");
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
      toast.success("트랙이 추가되었습니다");
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
        toast.error("트랙을 찾을 수 없습니다");
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
      toast.success("트랙이 수정되었습니다");
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
      toast.success("트랙이 삭제되었습니다");
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
        toast.success("즐겨찾기에 추가되었습니다");
      } else {
        toast.success("즐겨찾기에서 제거되었습니다");
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
