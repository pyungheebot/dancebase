"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { MusicQueueSet, MusicQueueTrack } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

function getStorageKey(groupId: string) {
  return `dancebase:music-queue:${groupId}`;
}

function loadSets(groupId: string): MusicQueueSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as MusicQueueSet[]) : [];
  } catch {
    return [];
  }
}

function saveSets(groupId: string, sets: MusicQueueSet[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(sets));
}

// ─── 유틸리티 ─────────────────────────────────────────────────

function calcTotalDuration(tracks: MusicQueueTrack[]): number {
  return tracks.reduce((sum, t) => sum + t.durationSeconds, 0);
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useMusicQueue(groupId: string) {
  const { data, mutate } = useSWR(
    swrKeys.musicQueue(groupId),
    () => loadSets(groupId),
    { fallbackData: [] }
  );

  const sets: MusicQueueSet[] = data ?? [];

  // ─── 세트 CRUD ────────────────────────────────────────────

  async function addSet(setName: string): Promise<string | null> {
    if (!setName.trim()) return null;
    const newSet: MusicQueueSet = {
      id: crypto.randomUUID(),
      setName: setName.trim(),
      tracks: [],
      totalDuration: 0,
      isActive: sets.length === 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [...sets, newSet];
    saveSets(groupId, updated);
    await mutate(updated, false);
    return newSet.id;
  }

  async function updateSet(setId: string, patch: Partial<Pick<MusicQueueSet, "setName">>) {
    const updated = sets.map((s) =>
      s.id === setId ? { ...s, ...patch } : s
    );
    saveSets(groupId, updated);
    await mutate(updated, false);
  }

  async function deleteSet(setId: string) {
    const filtered = sets.filter((s) => s.id !== setId);
    // 삭제된 세트가 활성이면 첫 번째 세트를 활성으로
    const deletedWasActive = sets.find((s) => s.id === setId)?.isActive ?? false;
    const updated = filtered.map((s, i) =>
      deletedWasActive && i === 0 ? { ...s, isActive: true } : s
    );
    saveSets(groupId, updated);
    await mutate(updated, false);
  }

  async function setActive(setId: string) {
    const updated = sets.map((s) => ({ ...s, isActive: s.id === setId }));
    saveSets(groupId, updated);
    await mutate(updated, false);
  }

  // ─── 트랙 CRUD ────────────────────────────────────────────

  async function addTrack(
    setId: string,
    payload: Omit<MusicQueueTrack, "id">
  ): Promise<string | null> {
    const newTrack: MusicQueueTrack = {
      ...payload,
      id: crypto.randomUUID(),
    };
    const updated = sets.map((s) => {
      if (s.id !== setId) return s;
      const tracks = [...s.tracks, newTrack];
      return { ...s, tracks, totalDuration: calcTotalDuration(tracks) };
    });
    saveSets(groupId, updated);
    await mutate(updated, false);
    return newTrack.id;
  }

  async function updateTrack(
    setId: string,
    trackId: string,
    patch: Partial<Omit<MusicQueueTrack, "id">>
  ) {
    const updated = sets.map((s) => {
      if (s.id !== setId) return s;
      const tracks = s.tracks.map((t) =>
        t.id === trackId ? { ...t, ...patch } : t
      );
      return { ...s, tracks, totalDuration: calcTotalDuration(tracks) };
    });
    saveSets(groupId, updated);
    await mutate(updated, false);
  }

  async function deleteTrack(setId: string, trackId: string) {
    const updated = sets.map((s) => {
      if (s.id !== setId) return s;
      const tracks = s.tracks.filter((t) => t.id !== trackId);
      return { ...s, tracks, totalDuration: calcTotalDuration(tracks) };
    });
    saveSets(groupId, updated);
    await mutate(updated, false);
  }

  async function reorderTracks(setId: string, fromIndex: number, toIndex: number) {
    const updated = sets.map((s) => {
      if (s.id !== setId) return s;
      const tracks = [...s.tracks];
      const [moved] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, moved);
      return { ...s, tracks };
    });
    saveSets(groupId, updated);
    await mutate(updated, false);
  }

  // ─── 파생 데이터 ──────────────────────────────────────────

  const activeSet = sets.find((s) => s.isActive) ?? sets[0] ?? null;

  const stats = {
    totalSets: sets.length,
    totalTracks: sets.reduce((sum, s) => sum + s.tracks.length, 0),
    totalDuration: sets.reduce((sum, s) => sum + s.totalDuration, 0),
  };

  return {
    sets,
    activeSet,
    addSet,
    updateSet,
    deleteSet,
    setActive,
    addTrack,
    updateTrack,
    deleteTrack,
    reorderTracks,
    stats,
    refetch: () => mutate(),
  };
}
