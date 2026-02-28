"use client";

import { useState, useEffect, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type { PerfSponsorEntry, PerfSponsorTier, PerfSponsorshipData } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(projectId: string): string {
  return swrKeys.performanceSponsor(projectId);
}

function loadData(projectId: string): PerfSponsorshipData {
  if (typeof window === "undefined") {
    return {
      projectId,
      sponsors: [],
      totalGoal: null,
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) {
      return {
        projectId,
        sponsors: [],
        totalGoal: null,
        updatedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(raw) as PerfSponsorshipData;
  } catch {
    return {
      projectId,
      sponsors: [],
      totalGoal: null,
      updatedAt: new Date().toISOString(),
    };
  }
}

function saveData(data: PerfSponsorshipData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type SponsorTierBreakdown = {
  tier: PerfSponsorTier;
  label: string;
  count: number;
  confirmedAmount: number;
  pendingAmount: number;
  color: string;
};

export type SponsorStats = {
  /** 전체 스폰서 수 */
  totalSponsors: number;
  /** 확정 후원 총액 */
  confirmedAmount: number;
  /** 보류 후원 총액 */
  pendingAmount: number;
  /** 목표 대비 달성률 (0-100, goal 없으면 null) */
  goalProgress: number | null;
  /** 등급별 분포 */
  tierBreakdown: SponsorTierBreakdown[];
};

// ============================================================
// 상수
// ============================================================

const TIER_ORDER: PerfSponsorTier[] = [
  "platinum",
  "gold",
  "silver",
  "bronze",
  "supporter",
];

const TIER_META: Record<
  PerfSponsorTier,
  { label: string; color: string }
> = {
  platinum: { label: "플래티넘", color: "#7c3aed" },
  gold: { label: "골드", color: "#d97706" },
  silver: { label: "실버", color: "#6b7280" },
  bronze: { label: "브론즈", color: "#92400e" },
  supporter: { label: "서포터", color: "#0891b2" },
};

// ============================================================
// 훅
// ============================================================

export function usePerformanceSponsor(projectId: string) {
  const [sponsors, setSponsors] = useState<PerfSponsorEntry[]>([]);
  const [totalGoal, setTotalGoalState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!projectId) return;
    const data = loadData(projectId);
    setSponsors(data.sponsors);
    setTotalGoalState(data.totalGoal);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (updated: {
      sponsors?: PerfSponsorEntry[];
      totalGoal?: number | null;
    }) => {
      const currentData = loadData(projectId);
      const newData: PerfSponsorshipData = {
        projectId,
        sponsors: updated.sponsors ?? currentData.sponsors,
        totalGoal:
          updated.totalGoal !== undefined
            ? updated.totalGoal
            : currentData.totalGoal,
        updatedAt: new Date().toISOString(),
      };
      saveData(newData);
      if (updated.sponsors !== undefined) setSponsors(newData.sponsors);
      if (updated.totalGoal !== undefined) setTotalGoalState(newData.totalGoal);
    },
    [projectId]
  );

  // ── 스폰서 CRUD ──────────────────────────────────────────

  const addSponsor = useCallback(
    (params: Omit<PerfSponsorEntry, "id" | "createdAt">): PerfSponsorEntry => {
      const newSponsor: PerfSponsorEntry = {
        id: crypto.randomUUID(),
        ...params,
        createdAt: new Date().toISOString(),
      };
      persist({ sponsors: [...sponsors, newSponsor] });
      return newSponsor;
    },
    [sponsors, persist]
  );

  const updateSponsor = useCallback(
    (
      sponsorId: string,
      params: Partial<Omit<PerfSponsorEntry, "id" | "createdAt">>
    ): boolean => {
      const idx = sponsors.findIndex((s) => s.id === sponsorId);
      if (idx === -1) return false;
      const updated = sponsors.map((s) =>
        s.id === sponsorId ? { ...s, ...params } : s
      );
      persist({ sponsors: updated });
      return true;
    },
    [sponsors, persist]
  );

  const deleteSponsor = useCallback(
    (sponsorId: string): boolean => {
      const exists = sponsors.some((s) => s.id === sponsorId);
      if (!exists) return false;
      persist({ sponsors: sponsors.filter((s) => s.id !== sponsorId) });
      return true;
    },
    [sponsors, persist]
  );

  // ── 목표 금액 설정 ────────────────────────────────────────

  const setTotalGoal = useCallback(
    (goal: number | null) => {
      persist({ totalGoal: goal });
    },
    [persist]
  );

  // ── 통계 계산 ─────────────────────────────────────────────

  const stats: SponsorStats = (() => {
    const confirmedSponsors = sponsors.filter((s) => s.status === "confirmed");
    const pendingSponsors = sponsors.filter((s) => s.status === "pending");

    const confirmedAmount = confirmedSponsors.reduce(
      (acc, s) => acc + s.amount,
      0
    );
    const pendingAmount = pendingSponsors.reduce((acc, s) => acc + s.amount, 0);

    const goalProgress =
      totalGoal != null && totalGoal > 0
        ? Math.min(100, Math.round((confirmedAmount / totalGoal) * 100))
        : null;

    const tierBreakdown: SponsorTierBreakdown[] = TIER_ORDER.map((tier) => {
      const tierSponsors = sponsors.filter((s) => s.tier === tier);
      const confirmedAmt = tierSponsors
        .filter((s) => s.status === "confirmed")
        .reduce((acc, s) => acc + s.amount, 0);
      const pendingAmt = tierSponsors
        .filter((s) => s.status === "pending")
        .reduce((acc, s) => acc + s.amount, 0);
      return {
        tier,
        label: TIER_META[tier].label,
        count: tierSponsors.length,
        confirmedAmount: confirmedAmt,
        pendingAmount: pendingAmt,
        color: TIER_META[tier].color,
      };
    });

    return {
      totalSponsors: sponsors.length,
      confirmedAmount,
      pendingAmount,
      goalProgress,
      tierBreakdown,
    };
  })();

  return {
    sponsors,
    totalGoal,
    loading,
    stats,
    // CRUD
    addSponsor,
    updateSponsor,
    deleteSponsor,
    // 목표
    setTotalGoal,
    // 정렬된 등급 순서
    tierOrder: TIER_ORDER,
    tierMeta: TIER_META,
    refetch: reload,
  };
}
