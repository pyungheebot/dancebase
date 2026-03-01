"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SponsorEntry, SponsorType, SponsorStatus } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ─── 훅 ─────────────────────────────────────────────────────

const STORAGE_KEY = (groupId: string) => `dancebase:sponsors:${groupId}`;

export function useEventSponsorship(groupId: string) {
  const key = swrKeys.eventSponsorship(groupId);

  const { data, mutate } = useSWR(key, () => loadFromStorage<SponsorEntry[]>(STORAGE_KEY(groupId), []), {
    revalidateOnFocus: false,
  });

  const sponsors = data ?? [];

  // ── CRUD ──────────────────────────────────────────────────

  function addSponsor(
    input: Omit<SponsorEntry, "id" | "createdAt">
  ): boolean {
    try {
      const stored = loadFromStorage<SponsorEntry[]>(STORAGE_KEY(groupId), []);
      const newEntry: SponsorEntry = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const next = [...stored, newEntry];
      saveToStorage(STORAGE_KEY(groupId), next);
      mutate(next, false);
      return true;
    } catch {
      return false;
    }
  }

  function updateSponsor(
    id: string,
    patch: Partial<Omit<SponsorEntry, "id" | "createdAt">>
  ): boolean {
    try {
      const stored = loadFromStorage<SponsorEntry[]>(STORAGE_KEY(groupId), []);
      const idx = stored.findIndex((s) => s.id === id);
      if (idx === -1) return false;
      stored[idx] = { ...stored[idx], ...patch };
      saveToStorage(STORAGE_KEY(groupId), stored);
      mutate(stored, false);
      return true;
    } catch {
      return false;
    }
  }

  function deleteSponsor(id: string): boolean {
    try {
      const stored = loadFromStorage<SponsorEntry[]>(STORAGE_KEY(groupId), []);
      const next = stored.filter((s) => s.id !== id);
      saveToStorage(STORAGE_KEY(groupId), next);
      mutate(next, false);
      return true;
    } catch {
      return false;
    }
  }

  function changeStatus(id: string, status: SponsorStatus): boolean {
    return updateSponsor(id, { status });
  }

  // ── 필터 ──────────────────────────────────────────────────

  function getByType(type: SponsorType): SponsorEntry[] {
    return sponsors.filter((s) => s.type === type);
  }

  function getByStatus(status: SponsorStatus): SponsorEntry[] {
    return sponsors.filter((s) => s.status === status);
  }

  // ── 통계 ──────────────────────────────────────────────────

  const totalCount = sponsors.length;

  const confirmedAmount = sponsors
    .filter((s) => s.status === "confirmed" || s.status === "completed")
    .reduce((sum, s) => sum + (s.supportAmount ?? 0), 0);

  const typeDistribution: Record<SponsorType, number> = {
    financial: 0,
    venue: 0,
    equipment: 0,
    media: 0,
    other: 0,
  };
  for (const s of sponsors) {
    typeDistribution[s.type]++;
  }

  const statusDistribution: Record<SponsorStatus, number> = {
    prospect: 0,
    negotiating: 0,
    confirmed: 0,
    completed: 0,
  };
  for (const s of sponsors) {
    statusDistribution[s.status]++;
  }

  return {
    sponsors,
    // CRUD
    addSponsor,
    updateSponsor,
    deleteSponsor,
    changeStatus,
    // 필터
    getByType,
    getByStatus,
    // 통계
    totalCount,
    confirmedAmount,
    typeDistribution,
    statusDistribution,
    // SWR
    refetch: () => mutate(),
  };
}
