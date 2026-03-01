"use client";

import { useState, useCallback } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  TicketMgmtEvent,
  TicketMgmtTier,
  TicketMgmtSale,
  TicketMgmtType,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:ticket-management:${groupId}:${projectId}`;
}

// ============================================================
// 통계 타입
// ============================================================

export type TicketMgmtTierStats = {
  type: TicketMgmtType;
  totalSeats: number;
  soldCount: number;
  remainingSeats: number;
  revenue: number;
  soldRate: number; // 0-100 퍼센트
};

export type TicketMgmtEventStats = {
  tierStats: TicketMgmtTierStats[];
  totalRevenue: number;
  totalSold: number;
  totalSeats: number;
  totalRemaining: number;
};

export type TicketMgmtSummaryStats = {
  totalEvents: number;
  totalRevenue: number;
  totalSold: number;
  soldOutTiers: number;
};

// ============================================================
// 훅
// ============================================================

export function useTicketManagement(groupId: string, projectId: string) {
  const [events, setEvents] = useState<TicketMgmtEvent[]>(() => loadFromStorage<TicketMgmtEvent[]>(storageKey(groupId, projectId), []));

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadFromStorage<TicketMgmtEvent[]>(storageKey(groupId, projectId), []);
    setEvents(data);
  }, [groupId, projectId]);

  const persist = useCallback(
    (next: TicketMgmtEvent[]) => {
      saveToStorage(storageKey(groupId, projectId), next);
      setEvents(next);
    },
    [groupId, projectId]
  );

  // ── 이벤트 CRUD ───────────────────────────────────────────

  const addEvent = useCallback(
    (
      partial: Omit<
        TicketMgmtEvent,
        "id" | "projectId" | "tiers" | "sales" | "createdAt"
      >
    ): TicketMgmtEvent => {
      const newEvent: TicketMgmtEvent = {
        id: crypto.randomUUID(),
        projectId,
        tiers: [],
        sales: [],
        createdAt: new Date().toISOString(),
        ...partial,
      };
      persist([...events, newEvent]);
      return newEvent;
    },
    [events, persist, projectId]
  );

  const updateEvent = useCallback(
    (
      eventId: string,
      partial: Partial<Pick<TicketMgmtEvent, "eventName" | "eventDate">>
    ): boolean => {
      const idx = events.findIndex((e) => e.id === eventId);
      if (idx === -1) return false;
      const next = [...events];
      next[idx] = { ...next[idx], ...partial };
      persist(next);
      return true;
    },
    [events, persist]
  );

  const deleteEvent = useCallback(
    (eventId: string): boolean => {
      const next = events.filter((e) => e.id !== eventId);
      if (next.length === events.length) return false;
      persist(next);
      return true;
    },
    [events, persist]
  );

  // ── 티어(등급) CRUD ───────────────────────────────────────

  const addTier = useCallback(
    (
      eventId: string,
      tier: Omit<TicketMgmtTier, "id">
    ): TicketMgmtTier | null => {
      const idx = events.findIndex((e) => e.id === eventId);
      if (idx === -1) return null;

      const newTier: TicketMgmtTier = {
        id: crypto.randomUUID(),
        ...tier,
      };
      const next = [...events];
      next[idx] = { ...next[idx], tiers: [...next[idx].tiers, newTier] };
      persist(next);
      return newTier;
    },
    [events, persist]
  );

  const updateTier = useCallback(
    (
      eventId: string,
      tierId: string,
      partial: Partial<Omit<TicketMgmtTier, "id">>
    ): boolean => {
      const evIdx = events.findIndex((e) => e.id === eventId);
      if (evIdx === -1) return false;
      const tierIdx = events[evIdx].tiers.findIndex((t) => t.id === tierId);
      if (tierIdx === -1) return false;

      const next = [...events];
      const updatedTiers = [...next[evIdx].tiers];
      updatedTiers[tierIdx] = { ...updatedTiers[tierIdx], ...partial };
      next[evIdx] = { ...next[evIdx], tiers: updatedTiers };
      persist(next);
      return true;
    },
    [events, persist]
  );

  const deleteTier = useCallback(
    (eventId: string, tierId: string): boolean => {
      const evIdx = events.findIndex((e) => e.id === eventId);
      if (evIdx === -1) return false;
      const filtered = events[evIdx].tiers.filter((t) => t.id !== tierId);
      if (filtered.length === events[evIdx].tiers.length) return false;

      const next = [...events];
      next[evIdx] = { ...next[evIdx], tiers: filtered };
      persist(next);
      return true;
    },
    [events, persist]
  );

  // ── 판매 기록 CRUD ────────────────────────────────────────

  const addSale = useCallback(
    (
      eventId: string,
      sale: Omit<TicketMgmtSale, "id" | "soldAt">
    ): TicketMgmtSale | null => {
      const idx = events.findIndex((e) => e.id === eventId);
      if (idx === -1) return null;

      const newSale: TicketMgmtSale = {
        id: crypto.randomUUID(),
        soldAt: new Date().toISOString(),
        ...sale,
      };
      const next = [...events];
      next[idx] = { ...next[idx], sales: [...next[idx].sales, newSale] };
      persist(next);
      return newSale;
    },
    [events, persist]
  );

  const deleteSale = useCallback(
    (eventId: string, saleId: string): boolean => {
      const evIdx = events.findIndex((e) => e.id === eventId);
      if (evIdx === -1) return false;
      const filtered = events[evIdx].sales.filter((s) => s.id !== saleId);
      if (filtered.length === events[evIdx].sales.length) return false;

      const next = [...events];
      next[evIdx] = { ...next[evIdx], sales: filtered };
      persist(next);
      return true;
    },
    [events, persist]
  );

  // ── 이벤트 통계 ───────────────────────────────────────────

  const getEventStats = useCallback(
    (eventId: string): TicketMgmtEventStats | null => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return null;

      const tierStats: TicketMgmtTierStats[] = event.tiers.map((tier) => {
        const soldCount = event.sales
          .filter((s) => s.ticketType === tier.type)
          .reduce((sum, s) => sum + s.quantity, 0);
        const revenue = event.sales
          .filter((s) => s.ticketType === tier.type)
          .reduce((sum, s) => sum + s.totalPrice, 0);
        const remainingSeats = Math.max(0, tier.totalSeats - soldCount);
        const soldRate =
          tier.totalSeats === 0
            ? 0
            : Math.min(100, Math.round((soldCount / tier.totalSeats) * 100));

        return {
          type: tier.type,
          totalSeats: tier.totalSeats,
          soldCount,
          remainingSeats,
          revenue,
          soldRate,
        };
      });

      const totalRevenue = tierStats.reduce((sum, t) => sum + t.revenue, 0);
      const totalSold = tierStats.reduce((sum, t) => sum + t.soldCount, 0);
      const totalSeats = tierStats.reduce((sum, t) => sum + t.totalSeats, 0);
      const totalRemaining = tierStats.reduce(
        (sum, t) => sum + t.remainingSeats,
        0
      );

      return { tierStats, totalRevenue, totalSold, totalSeats, totalRemaining };
    },
    [events]
  );

  // ── 전체 통계 ─────────────────────────────────────────────

  const stats: TicketMgmtSummaryStats = (() => {
    const totalEvents = events.length;
    const totalRevenue = events.reduce(
      (sum, ev) => sum + ev.sales.reduce((s, sl) => s + sl.totalPrice, 0),
      0
    );
    const totalSold = events.reduce(
      (sum, ev) => sum + ev.sales.reduce((s, sl) => s + sl.quantity, 0),
      0
    );

    // 매진된 티어 수
    let soldOutTiers = 0;
    for (const ev of events) {
      for (const tier of ev.tiers) {
        const sold = ev.sales
          .filter((s) => s.ticketType === tier.type)
          .reduce((sum, s) => sum + s.quantity, 0);
        if (tier.totalSeats > 0 && sold >= tier.totalSeats) {
          soldOutTiers++;
        }
      }
    }

    return { totalEvents, totalRevenue, totalSold, soldOutTiers };
  })();

  return {
    events,
    loading: false,
    addEvent,
    updateEvent,
    deleteEvent,
    addTier,
    updateTier,
    deleteTier,
    addSale,
    deleteSale,
    getEventStats,
    stats,
    refetch: reload,
  };
}
