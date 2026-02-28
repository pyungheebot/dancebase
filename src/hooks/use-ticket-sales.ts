"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateTicketSales } from "@/lib/swr/invalidate";
import type { TicketSalesData, TicketSalesTier, TicketSalesRecord } from "@/types";

const STORAGE_KEY = (projectId: string) => `ticket-sales-${projectId}`;

function loadFromStorage(projectId: string): TicketSalesData {
  if (typeof window === "undefined") {
    return { projectId, tiers: [], records: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY(projectId));
    if (raw) return JSON.parse(raw) as TicketSalesData;
  } catch {
    // 파싱 오류 시 기본값 반환
  }
  return { projectId, tiers: [], records: [], updatedAt: new Date().toISOString() };
}

function saveToStorage(data: TicketSalesData) {
  localStorage.setItem(STORAGE_KEY(data.projectId), JSON.stringify(data));
}

export function useTicketSales(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.ticketSales(projectId),
    () => loadFromStorage(projectId)
  );

  const current = data ?? { projectId, tiers: [], records: [], updatedAt: new Date().toISOString() };

  /** 등급 추가 */
  async function addTier(tier: Omit<TicketSalesTier, "id">) {
    const next: TicketSalesData = {
      ...current,
      tiers: [
        ...current.tiers,
        { ...tier, id: crypto.randomUUID() },
      ],
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
    invalidateTicketSales(projectId);
  }

  /** 등급 수정 */
  async function updateTier(tierId: string, patch: Partial<Omit<TicketSalesTier, "id">>) {
    const next: TicketSalesData = {
      ...current,
      tiers: current.tiers.map((t) => (t.id === tierId ? { ...t, ...patch } : t)),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
    invalidateTicketSales(projectId);
  }

  /** 등급 삭제 (관련 판매 기록도 삭제) */
  async function removeTier(tierId: string) {
    const next: TicketSalesData = {
      ...current,
      tiers: current.tiers.filter((t) => t.id !== tierId),
      records: current.records.filter((r) => r.tierId !== tierId),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
    invalidateTicketSales(projectId);
  }

  /** 판매 기록 추가 */
  async function addRecord(record: Omit<TicketSalesRecord, "id">) {
    const next: TicketSalesData = {
      ...current,
      records: [
        ...current.records,
        { ...record, id: crypto.randomUUID() },
      ],
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
    invalidateTicketSales(projectId);
  }

  /** 판매 기록 삭제 */
  async function removeRecord(recordId: string) {
    const next: TicketSalesData = {
      ...current,
      records: current.records.filter((r) => r.id !== recordId),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
    invalidateTicketSales(projectId);
  }

  /** 등급별 판매 수량 합계 */
  function soldQtyByTier(tierId: string): number {
    return current.records
      .filter((r) => r.tierId === tierId)
      .reduce((acc, r) => acc + r.qty, 0);
  }

  /** 총 판매 수량 */
  const totalSold = current.records.reduce((acc, r) => acc + r.qty, 0);

  /** 총 좌석 수 */
  const totalQty = current.tiers.reduce((acc, t) => acc + t.totalQty, 0);

  /** 총 매출액 */
  const totalRevenue = current.records.reduce((acc, r) => {
    const tier = current.tiers.find((t) => t.id === r.tierId);
    return acc + (tier ? tier.price * r.qty : 0);
  }, 0);

  /** 전체 판매율 (0~100) */
  const overallSaleRate = totalQty > 0 ? Math.round((totalSold / totalQty) * 100) : 0;

  /** 일별 판매 수량 집계 (최근 14일, YYYY-MM-DD -> qty) */
  const dailySales: { date: string; qty: number }[] = (() => {
    const map = new Map<string, number>();
    current.records.forEach((r) => {
      map.set(r.date, (map.get(r.date) ?? 0) + r.qty);
    });
    return Array.from(map.entries())
      .map(([date, qty]) => ({ date, qty }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  })();

  return {
    data: current,
    loading: isLoading,
    refetch: () => mutate(),
    addTier,
    updateTier,
    removeTier,
    addRecord,
    removeRecord,
    soldQtyByTier,
    totalSold,
    totalQty,
    totalRevenue,
    overallSaleRate,
    dailySales,
  };
}
