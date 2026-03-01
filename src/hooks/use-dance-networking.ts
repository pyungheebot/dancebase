"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  DanceNetworkingData,
  DanceNetworkingEntry,
  DanceNetworkingRole,
  DanceNetworkingSns,
} from "@/types";

// ============================================
// 상수
// ============================================

export const ROLE_LABEL: Record<DanceNetworkingRole, string> = {
  dancer: "댄서",
  choreographer: "안무가",
  dj: "DJ",
  videographer: "촬영감독",
  photographer: "포토그래퍼",
  instructor: "강사",
  event_organizer: "행사기획",
  other: "기타",
};

export const ROLE_COLOR: Record<DanceNetworkingRole, string> = {
  dancer: "bg-blue-100 text-blue-700",
  choreographer: "bg-purple-100 text-purple-700",
  dj: "bg-orange-100 text-orange-700",
  videographer: "bg-cyan-100 text-cyan-700",
  photographer: "bg-pink-100 text-pink-700",
  instructor: "bg-green-100 text-green-700",
  event_organizer: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

export const SNS_PLATFORM_LABEL: Record<DanceNetworkingSns["platform"], string> = {
  instagram: "인스타그램",
  youtube: "유튜브",
  tiktok: "틱톡",
  twitter: "트위터",
  facebook: "페이스북",
  other: "기타",
};

export const ROLE_OPTIONS: { value: DanceNetworkingRole; label: string }[] = [
  { value: "dancer", label: "댄서" },
  { value: "choreographer", label: "안무가" },
  { value: "dj", label: "DJ" },
  { value: "videographer", label: "촬영감독" },
  { value: "photographer", label: "포토그래퍼" },
  { value: "instructor", label: "강사" },
  { value: "event_organizer", label: "행사기획" },
  { value: "other", label: "기타" },
];

export const SNS_PLATFORM_OPTIONS: {
  value: DanceNetworkingSns["platform"];
  label: string;
}[] = [
  { value: "instagram", label: "인스타그램" },
  { value: "youtube", label: "유튜브" },
  { value: "tiktok", label: "틱톡" },
  { value: "twitter", label: "트위터" },
  { value: "facebook", label: "페이스북" },
  { value: "other", label: "기타" },
];

// ============================================
// localStorage 유틸
// ============================================

function storageKey(memberId: string): string {
  return `dancebase:dance-networking:${memberId}`;
}

// ============================================
// 훅
// ============================================

export function useDanceNetworking(memberId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.danceNetworking(memberId),
    () => loadFromStorage<DanceNetworkingData>(storageKey(memberId), {} as DanceNetworkingData),
    {
      fallbackData: {
        memberId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: DanceNetworkingEntry[] = data?.entries ?? [];

  /** 연락처 추가 */
  const addEntry = useCallback(
    (params: {
      name: string;
      affiliation?: string;
      genres: string[];
      phone?: string;
      email?: string;
      snsAccounts: DanceNetworkingSns[];
      metAt?: string;
      metDate?: string;
      role: DanceNetworkingRole;
      notes?: string;
    }): DanceNetworkingEntry => {
      const current = loadFromStorage<DanceNetworkingData>(storageKey(memberId), {} as DanceNetworkingData);
      const now = new Date().toISOString();
      const newEntry: DanceNetworkingEntry = {
        id: crypto.randomUUID(),
        name: params.name.trim(),
        affiliation: params.affiliation?.trim() || undefined,
        genres: params.genres.filter((g) => g.trim() !== ""),
        phone: params.phone?.trim() || undefined,
        email: params.email?.trim() || undefined,
        snsAccounts: params.snsAccounts.filter((s) => s.handle.trim() !== ""),
        metAt: params.metAt?.trim() || undefined,
        metDate: params.metDate || undefined,
        role: params.role,
        notes: params.notes?.trim() || undefined,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      };
      const updated: DanceNetworkingData = {
        ...current,
        entries: [newEntry, ...current.entries],
        updatedAt: now,
      };
      saveToStorage(storageKey(memberId), updated);
      mutate(updated, false);
      return newEntry;
    },
    [memberId, mutate]
  );

  /** 연락처 수정 */
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        name: string;
        affiliation: string;
        genres: string[];
        phone: string;
        email: string;
        snsAccounts: DanceNetworkingSns[];
        metAt: string;
        metDate: string;
        role: DanceNetworkingRole;
        notes: string;
        isFavorite: boolean;
      }>
    ): boolean => {
      const current = loadFromStorage<DanceNetworkingData>(storageKey(memberId), {} as DanceNetworkingData);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const now = new Date().toISOString();
      const updatedEntry: DanceNetworkingEntry = {
        ...existing,
        ...(params.name !== undefined && { name: params.name.trim() }),
        ...(params.affiliation !== undefined && {
          affiliation: params.affiliation.trim() || undefined,
        }),
        ...(params.genres !== undefined && {
          genres: params.genres.filter((g) => g.trim() !== ""),
        }),
        ...(params.phone !== undefined && {
          phone: params.phone.trim() || undefined,
        }),
        ...(params.email !== undefined && {
          email: params.email.trim() || undefined,
        }),
        ...(params.snsAccounts !== undefined && {
          snsAccounts: params.snsAccounts.filter((s) => s.handle.trim() !== ""),
        }),
        ...(params.metAt !== undefined && {
          metAt: params.metAt.trim() || undefined,
        }),
        ...(params.metDate !== undefined && {
          metDate: params.metDate || undefined,
        }),
        ...(params.role !== undefined && { role: params.role }),
        ...(params.notes !== undefined && {
          notes: params.notes.trim() || undefined,
        }),
        ...(params.isFavorite !== undefined && {
          isFavorite: params.isFavorite,
        }),
        updatedAt: now,
      };

      const updated: DanceNetworkingData = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === entryId ? updatedEntry : e
        ),
        updatedAt: now,
      };
      saveToStorage(storageKey(memberId), updated);
      mutate(updated, false);
      return true;
    },
    [memberId, mutate]
  );

  /** 즐겨찾기 토글 */
  const toggleFavorite = useCallback(
    (entryId: string): boolean => {
      const current = loadFromStorage<DanceNetworkingData>(storageKey(memberId), {} as DanceNetworkingData);
      const entry = current.entries.find((e) => e.id === entryId);
      if (!entry) return false;
      return updateEntry(entryId, { isFavorite: !entry.isFavorite });
    },
    [memberId, updateEntry]
  );

  /** 연락처 삭제 */
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadFromStorage<DanceNetworkingData>(storageKey(memberId), {} as DanceNetworkingData);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: DanceNetworkingData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(memberId), updated);
      mutate(updated, false);
      return true;
    },
    [memberId, mutate]
  );

  /** 통계 */
  const stats = (() => {
    const total = entries.length;
    const favorites = entries.filter((e) => e.isFavorite).length;
    const roleCount: Partial<Record<DanceNetworkingRole, number>> = {};
    for (const e of entries) {
      roleCount[e.role] = (roleCount[e.role] ?? 0) + 1;
    }
    return { total, favorites, roleCount };
  })();

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    toggleFavorite,
    deleteEntry,
    stats,
  };
}
