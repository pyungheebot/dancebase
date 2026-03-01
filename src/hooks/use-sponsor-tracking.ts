"use client";

import { useState, useCallback } from "react";
import type { SponsorTrackingEntry, SponsorTier } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:sponsor-tracking:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): SponsorTrackingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as SponsorTrackingEntry[];
  } catch {
    return [];
  }
}

function saveData(
  groupId: string,
  projectId: string,
  data: SponsorTrackingEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type SponsorTierBreakdown = Record<
  SponsorTier,
  { count: number; amount: number }
>;

export type SponsorTrackingStats = {
  totalSponsors: number;
  totalAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  tierBreakdown: SponsorTierBreakdown;
  benefitCompletionRate: number;
};

// ============================================================
// 훅
// ============================================================

export function useSponsorTracking(groupId: string, projectId: string) {
  const [sponsors, setSponsors] = useState<SponsorTrackingEntry[]>(() => loadData(groupId, projectId));

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadData(groupId, projectId);
    setSponsors(data);
  }, [groupId, projectId]);

  const persist = useCallback(
    (next: SponsorTrackingEntry[]) => {
      saveData(groupId, projectId, next);
      setSponsors(next);
    },
    [groupId, projectId]
  );

  // 스폰서 추가
  const addSponsor = useCallback(
    (
      data: Omit<SponsorTrackingEntry, "id" | "createdAt">
    ): SponsorTrackingEntry => {
      const entry: SponsorTrackingEntry = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
      };
      persist([...sponsors, entry]);
      return entry;
    },
    [sponsors, persist]
  );

  // 스폰서 수정
  const updateSponsor = useCallback(
    (
      sponsorId: string,
      partial: Partial<Omit<SponsorTrackingEntry, "id" | "createdAt">>
    ): boolean => {
      const idx = sponsors.findIndex((s) => s.id === sponsorId);
      if (idx === -1) return false;
      const next = [...sponsors];
      next[idx] = { ...next[idx], ...partial };
      persist(next);
      return true;
    },
    [sponsors, persist]
  );

  // 스폰서 삭제
  const deleteSponsor = useCallback(
    (sponsorId: string): boolean => {
      const next = sponsors.filter((s) => s.id !== sponsorId);
      if (next.length === sponsors.length) return false;
      persist(next);
      return true;
    },
    [sponsors, persist]
  );

  // 입금 여부 토글
  const togglePayment = useCallback(
    (sponsorId: string): boolean => {
      const idx = sponsors.findIndex((s) => s.id === sponsorId);
      if (idx === -1) return false;
      const next = [...sponsors];
      const current = next[idx];
      next[idx] = {
        ...current,
        paymentReceived: !current.paymentReceived,
        paymentDate: !current.paymentReceived
          ? new Date().toISOString().split("T")[0]
          : undefined,
      };
      persist(next);
      return true;
    },
    [sponsors, persist]
  );

  // 혜택 이행 여부 토글
  const toggleBenefitDelivered = useCallback(
    (sponsorId: string, benefitId: string): boolean => {
      const idx = sponsors.findIndex((s) => s.id === sponsorId);
      if (idx === -1) return false;
      const sponsor = sponsors[idx];
      const bIdx = sponsor.benefits.findIndex((b) => b.id === benefitId);
      if (bIdx === -1) return false;
      const next = [...sponsors];
      const updatedBenefits = [...next[idx].benefits];
      updatedBenefits[bIdx] = {
        ...updatedBenefits[bIdx],
        isDelivered: !updatedBenefits[bIdx].isDelivered,
      };
      next[idx] = { ...next[idx], benefits: updatedBenefits };
      persist(next);
      return true;
    },
    [sponsors, persist]
  );

  // 통계 계산
  const stats: SponsorTrackingStats = (() => {
    const ALL_TIERS: SponsorTier[] = [
      "platinum",
      "gold",
      "silver",
      "bronze",
      "individual",
    ];

    const tierBreakdown = ALL_TIERS.reduce((acc, tier) => {
      acc[tier] = { count: 0, amount: 0 };
      return acc;
    }, {} as SponsorTierBreakdown);

    let totalAmount = 0;
    let receivedAmount = 0;
    let totalBenefits = 0;
    let deliveredBenefits = 0;

    for (const s of sponsors) {
      totalAmount += s.amount;
      if (s.paymentReceived) receivedAmount += s.amount;
      tierBreakdown[s.tier].count += 1;
      tierBreakdown[s.tier].amount += s.amount;
      totalBenefits += s.benefits.length;
      deliveredBenefits += s.benefits.filter((b) => b.isDelivered).length;
    }

    return {
      totalSponsors: sponsors.length,
      totalAmount,
      receivedAmount,
      pendingAmount: totalAmount - receivedAmount,
      tierBreakdown,
      benefitCompletionRate:
        totalBenefits > 0
          ? Math.round((deliveredBenefits / totalBenefits) * 100)
          : 0,
    };
  })();

  return {
    sponsors,
    loading: false,
    addSponsor,
    updateSponsor,
    deleteSponsor,
    togglePayment,
    toggleBenefitDelivered,
    stats,
    refetch: reload,
  };
}
