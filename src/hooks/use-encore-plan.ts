"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { EncorePlan, EncoreSong } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:encore-plan:${groupId}:${projectId}`;
}

function loadPlans(groupId: string, projectId: string): EncorePlan[] {
  return loadFromStorage<EncorePlan[]>(getStorageKey(groupId, projectId), []);
}

function savePlans(
  groupId: string,
  projectId: string,
  plans: EncorePlan[]
): void {
  saveToStorage(getStorageKey(groupId, projectId), plans);
}

// ============================================================
// 훅
// ============================================================

export function useEncorePlan(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.encorePlan(groupId, projectId),
    async () => loadPlans(groupId, projectId)
  );

  const plans = data ?? [];

  // ── 플랜 추가 ──
  async function addPlan(
    input: Omit<EncorePlan, "id" | "createdAt" | "songs">
  ): Promise<EncorePlan> {
    const newPlan: EncorePlan = {
      ...input,
      id: crypto.randomUUID(),
      songs: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...plans, newPlan];
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
    return newPlan;
  }

  // ── 플랜 수정 ──
  async function updatePlan(
    planId: string,
    changes: Partial<Omit<EncorePlan, "id" | "createdAt" | "songs">>
  ): Promise<void> {
    const updated = plans.map((p) =>
      p.id === planId ? { ...p, ...changes } : p
    );
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 플랜 삭제 ──
  async function deletePlan(planId: string): Promise<void> {
    const updated = plans.filter((p) => p.id !== planId);
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 곡 추가 ──
  async function addSong(
    planId: string,
    input: Omit<EncoreSong, "id" | "order">
  ): Promise<void> {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const newSong: EncoreSong = {
        ...input,
        id: crypto.randomUUID(),
        order: p.songs.length + 1,
      };
      return { ...p, songs: [...p.songs, newSong] };
    });
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 곡 수정 ──
  async function updateSong(
    planId: string,
    songId: string,
    changes: Partial<Omit<EncoreSong, "id" | "order">>
  ): Promise<void> {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const newSongs = p.songs.map((s) =>
        s.id === songId ? { ...s, ...changes } : s
      );
      return { ...p, songs: newSongs };
    });
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 곡 삭제 ──
  async function deleteSong(planId: string, songId: string): Promise<void> {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const newSongs = p.songs
        .filter((s) => s.id !== songId)
        .map((s, idx) => ({ ...s, order: idx + 1 }));
      return { ...p, songs: newSongs };
    });
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 곡 순서 변경 ──
  async function reorderSongs(
    planId: string,
    songIds: string[]
  ): Promise<void> {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const songMap = new Map(p.songs.map((s) => [s.id, s]));
      const newSongs = songIds
        .map((id, idx) => {
          const song = songMap.get(id);
          if (!song) return null;
          return { ...song, order: idx + 1 };
        })
        .filter((s): s is EncoreSong => s !== null);
      return { ...p, songs: newSongs };
    });
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 통계 ──
  const totalPlans = plans.length;
  const totalSongs = plans.reduce((sum, p) => sum + p.songs.length, 0);
  const totalDuration = plans.reduce(
    (sum, p) => sum + p.songs.reduce((s2, song) => s2 + song.durationSeconds, 0),
    0
  );

  const stats = {
    totalPlans,
    totalSongs,
    totalDuration,
  };

  return {
    plans,
    loading: isLoading,
    refetch: () => mutate(),
    addPlan,
    updatePlan,
    deletePlan,
    addSong,
    updateSong,
    deleteSong,
    reorderSongs,
    stats,
  };
}
