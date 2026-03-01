"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  VipGuestEntry,
  VipGuestStore,
  VipGuestTier,
  VipGuestStatus,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:vip-guest:${groupId}:${projectId}`;
}

// ============================================================
// 훅
// ============================================================

export function useVipGuest(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.vipGuest(groupId, projectId),
    () => loadFromStorage<VipGuestStore>(storageKey(groupId, projectId), {} as VipGuestStore),
    {
      fallbackData: {
        groupId,
        projectId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: VipGuestEntry[] = data?.entries ?? [];

  /** 게스트 추가 */
  const addEntry = useCallback(
    (params: {
      name: string;
      organization?: string;
      title?: string;
      phone?: string;
      email?: string;
      tier: VipGuestTier;
      status: VipGuestStatus;
      seatZone?: string;
      seatNumber?: string;
      specialRequest?: string;
    }): VipGuestEntry => {
      const current = loadFromStorage<VipGuestStore>(storageKey(groupId, projectId), {} as VipGuestStore);
      const now = new Date().toISOString();
      const newEntry: VipGuestEntry = {
        id: crypto.randomUUID(),
        name: params.name.trim(),
        organization: params.organization?.trim() || undefined,
        title: params.title?.trim() || undefined,
        phone: params.phone?.trim() || undefined,
        email: params.email?.trim() || undefined,
        tier: params.tier,
        status: params.status,
        seatZone: params.seatZone?.trim() || undefined,
        seatNumber: params.seatNumber?.trim() || undefined,
        specialRequest: params.specialRequest?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated: VipGuestStore = {
        ...current,
        entries: [newEntry, ...current.entries],
        updatedAt: now,
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return newEntry;
    },
    [groupId, projectId, mutate]
  );

  /** 게스트 수정 */
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        name: string;
        organization: string;
        title: string;
        phone: string;
        email: string;
        tier: VipGuestTier;
        status: VipGuestStatus;
        seatZone: string;
        seatNumber: string;
        specialRequest: string;
      }>
    ): boolean => {
      const current = loadFromStorage<VipGuestStore>(storageKey(groupId, projectId), {} as VipGuestStore);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: VipGuestEntry = {
        ...existing,
        ...(params.name !== undefined && { name: params.name.trim() }),
        organization:
          params.organization !== undefined
            ? params.organization.trim() || undefined
            : existing.organization,
        title:
          params.title !== undefined
            ? params.title.trim() || undefined
            : existing.title,
        phone:
          params.phone !== undefined
            ? params.phone.trim() || undefined
            : existing.phone,
        email:
          params.email !== undefined
            ? params.email.trim() || undefined
            : existing.email,
        ...(params.tier !== undefined && { tier: params.tier }),
        ...(params.status !== undefined && { status: params.status }),
        seatZone:
          params.seatZone !== undefined
            ? params.seatZone.trim() || undefined
            : existing.seatZone,
        seatNumber:
          params.seatNumber !== undefined
            ? params.seatNumber.trim() || undefined
            : existing.seatNumber,
        specialRequest:
          params.specialRequest !== undefined
            ? params.specialRequest.trim() || undefined
            : existing.specialRequest,
        updatedAt: new Date().toISOString(),
      };

      const updated: VipGuestStore = {
        ...current,
        entries: current.entries.map((e) => (e.id === entryId ? updatedEntry : e)),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 게스트 삭제 */
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadFromStorage<VipGuestStore>(storageKey(groupId, projectId), {} as VipGuestStore);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: VipGuestStore = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 통계 */
  const stats = (() => {
    const total = entries.length;
    const byTier = {
      VVIP: entries.filter((e) => e.tier === "VVIP").length,
      VIP: entries.filter((e) => e.tier === "VIP").length,
      general: entries.filter((e) => e.tier === "general").length,
    };
    const byStatus = {
      pending: entries.filter((e) => e.status === "pending").length,
      invited: entries.filter((e) => e.status === "invited").length,
      confirmed: entries.filter((e) => e.status === "confirmed").length,
      declined: entries.filter((e) => e.status === "declined").length,
    };
    const confirmedCount = byStatus.confirmed;
    const seatedCount = entries.filter((e) => e.seatNumber).length;
    return { total, byTier, byStatus, confirmedCount, seatedCount };
  })();

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    stats,
  };
}
