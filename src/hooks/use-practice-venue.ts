"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  PracticeVenueEntry,
  PracticeVenueFacility,
  PracticeVenueStatus,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:practice-venue:${groupId}`;
}

function loadEntries(groupId: string): PracticeVenueEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as PracticeVenueEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: PracticeVenueEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(entries));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function usePracticeVenue(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.practiceVenue(groupId) : null,
    async () => loadEntries(groupId)
  );

  const entries = data ?? [];

  // ── 장소 추가 ──
  async function addVenue(
    input: Omit<
      PracticeVenueEntry,
      "id" | "ratingCount" | "isFavorite" | "createdAt"
    >
  ): Promise<void> {
    const newEntry: PracticeVenueEntry = {
      ...input,
      id: crypto.randomUUID(),
      ratingCount: input.rating != null ? 1 : 0,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 장소 수정 ──
  async function updateVenue(
    venueId: string,
    changes: Partial<
      Omit<PracticeVenueEntry, "id" | "ratingCount" | "createdAt">
    >
  ): Promise<void> {
    const updated = entries.map((e) =>
      e.id === venueId ? { ...e, ...changes } : e
    );
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 장소 삭제 ──
  async function deleteVenue(venueId: string): Promise<void> {
    const updated = entries.filter((e) => e.id !== venueId);
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 평점 매기기 (누적 평균 계산) ──
  async function rateVenue(venueId: string, newRating: number): Promise<void> {
    const updated = entries.map((e) => {
      if (e.id !== venueId) return e;
      const prevRating = e.rating ?? 0;
      const prevCount = e.ratingCount;
      const totalScore = prevRating * prevCount + newRating;
      const newCount = prevCount + 1;
      const avgRating = Math.round((totalScore / newCount) * 10) / 10;
      return { ...e, rating: avgRating, ratingCount: newCount };
    });
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 즐겨찾기 토글 ──
  async function toggleFavorite(venueId: string): Promise<void> {
    const updated = entries.map((e) =>
      e.id === venueId ? { ...e, isFavorite: !e.isFavorite } : e
    );
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 예약 상태 변경 ──
  async function updateStatus(
    venueId: string,
    status: PracticeVenueStatus
  ): Promise<void> {
    const updated = entries.map((e) =>
      e.id === venueId ? { ...e, status } : e
    );
    saveEntries(groupId, updated);
    await mutate(updated, false);
  }

  // ── 시설 필터링 ──
  function filterByFacility(
    facility: PracticeVenueFacility | "all"
  ): PracticeVenueEntry[] {
    if (facility === "all") return entries;
    return entries.filter((e) => e.facilities.includes(facility));
  }

  // ── 통계 ──
  const totalVenues = entries.length;
  const favoriteVenues = entries.filter((e) => e.isFavorite);
  const availableVenues = entries.filter((e) => e.status === "available");

  const ratedEntries = entries.filter((e) => e.rating != null);
  const averageRating =
    ratedEntries.length > 0
      ? Math.round(
          (ratedEntries.reduce((sum, e) => sum + (e.rating ?? 0), 0) /
            ratedEntries.length) *
            10
        ) / 10
      : null;

  const pricedEntries = entries.filter((e) => e.costPerHour != null);
  const averageCost =
    pricedEntries.length > 0
      ? Math.round(
          pricedEntries.reduce((sum, e) => sum + (e.costPerHour ?? 0), 0) /
            pricedEntries.length
        )
      : null;

  const topRated =
    ratedEntries.length > 0
      ? ratedEntries.reduce((best, e) =>
          (e.rating ?? 0) > (best.rating ?? 0) ? e : best
        )
      : null;

  const stats = {
    totalVenues,
    favoriteCount: favoriteVenues.length,
    availableCount: availableVenues.length,
    averageRating,
    averageCost,
    topRated,
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addVenue,
    updateVenue,
    deleteVenue,
    rateVenue,
    toggleFavorite,
    updateStatus,
    filterByFacility,
    stats,
  };
}
