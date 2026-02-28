"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { VipGuestEntry, VipGuestStatus, VipGuestCategory } from "@/types";

function getStorageKey(groupId: string, projectId: string) {
  return `dancebase:vip-guest:${groupId}:${projectId}`;
}

function loadGuests(groupId: string, projectId: string): VipGuestEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as VipGuestEntry[]) : [];
  } catch {
    return [];
  }
}

function saveGuests(groupId: string, projectId: string, guests: VipGuestEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId, projectId), JSON.stringify(guests));
}

export function useVipGuest(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.vipGuest(groupId, projectId),
    async () => loadGuests(groupId, projectId)
  );

  const guests = data ?? [];

  async function addGuest(
    input: Omit<VipGuestEntry, "id" | "createdAt">
  ): Promise<void> {
    const newGuest: VipGuestEntry = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...guests, newGuest];
    saveGuests(groupId, projectId, updated);
    await mutate(updated, false);
  }

  async function updateGuest(
    guestId: string,
    changes: Partial<Omit<VipGuestEntry, "id" | "createdAt">>
  ): Promise<void> {
    const updated = guests.map((g) =>
      g.id === guestId ? { ...g, ...changes } : g
    );
    saveGuests(groupId, projectId, updated);
    await mutate(updated, false);
  }

  async function deleteGuest(guestId: string): Promise<void> {
    const updated = guests.filter((g) => g.id !== guestId);
    saveGuests(groupId, projectId, updated);
    await mutate(updated, false);
  }

  async function updateStatus(guestId: string, status: VipGuestStatus): Promise<void> {
    await updateGuest(guestId, { status });
  }

  const totalGuests = guests.length;
  const confirmedGuests = guests.filter((g) => g.status === "confirmed" || g.status === "attended").length;
  const declinedGuests = guests.filter((g) => g.status === "declined" || g.status === "no_show").length;

  const categoryBreakdown: Record<VipGuestCategory, number> = {
    sponsor: 0,
    media: 0,
    celebrity: 0,
    judge: 0,
    family: 0,
    other: 0,
  };
  for (const g of guests) {
    categoryBreakdown[g.category] = (categoryBreakdown[g.category] ?? 0) + 1;
  }

  const stats = {
    totalGuests,
    confirmedGuests,
    declinedGuests,
    categoryBreakdown,
  };

  return {
    guests,
    loading: isLoading,
    refetch: () => mutate(),
    addGuest,
    updateGuest,
    deleteGuest,
    updateStatus,
    stats,
  };
}
