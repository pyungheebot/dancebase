"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  DuesTrackData,
  DuesTrackPeriod,
  DuesTrackMember,
  DuesTrackPaymentStatus,
} from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:dues-tracker:${groupId}`;

// ─── 유틸: 연-월 문자열 ──────────────────────────────────────

export function toYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useGroupDuesTracker(groupId: string) {
  const { data, mutate, isLoading } = useSWR(
    groupId ? swrKeys.groupDuesTracker(groupId) : null,
    () => loadFromStorage<DuesTrackData>(LS_KEY(groupId), { groupId, periods: [] }),
    { revalidateOnFocus: false }
  );

  const tracker: DuesTrackData = data ?? { groupId, periods: [] };
  const periods = tracker.periods;

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  const persist = useCallback(
    (next: DuesTrackData): void => {
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
    },
    [mutate]
  );

  // ── 납부 기간 추가 ───────────────────────────────────────

  const addPeriod = useCallback(
    (
      year: number,
      month: number,
      amount: number,
      dueDate: string,
      memberNames: string[]
    ): boolean => {
      const stored = loadFromStorage<DuesTrackData>(LS_KEY(groupId), { groupId, periods: [] });
      // 중복 체크
      const exists = stored.periods.some(
        (p) => p.year === year && p.month === month
      );
      if (exists) return false;

      const newPeriod: DuesTrackPeriod = {
        id: crypto.randomUUID(),
        year,
        month,
        amount: Math.max(0, amount),
        dueDate,
        members: memberNames
          .filter((n) => n.trim())
          .map((name) => ({
            id: crypto.randomUUID(),
            name: name.trim(),
            status: "unpaid" as DuesTrackPaymentStatus,
          })),
        createdAt: new Date().toISOString(),
      };

      const next: DuesTrackData = {
        ...stored,
        periods: [newPeriod, ...stored.periods].sort(
          (a, b) => b.year * 100 + b.month - (a.year * 100 + a.month)
        ),
      };
      persist(next);
      return true;
    },
    [groupId, persist]
  );

  // ── 납부 기간 삭제 ───────────────────────────────────────

  const deletePeriod = useCallback(
    (periodId: string): boolean => {
      const stored = loadFromStorage<DuesTrackData>(LS_KEY(groupId), { groupId, periods: [] });
      const next: DuesTrackData = {
        ...stored,
        periods: stored.periods.filter((p) => p.id !== periodId),
      };
      if (next.periods.length === stored.periods.length) return false;
      persist(next);
      return true;
    },
    [groupId, persist]
  );

  // ── 멤버 납부 상태 변경 ──────────────────────────────────

  const setMemberStatus = useCallback(
    (
      periodId: string,
      memberId: string,
      status: DuesTrackPaymentStatus
    ): boolean => {
      const stored = loadFromStorage<DuesTrackData>(LS_KEY(groupId), { groupId, periods: [] });
      const pIdx = stored.periods.findIndex((p) => p.id === periodId);
      if (pIdx === -1) return false;

      const period = stored.periods[pIdx];
      const mIdx = period.members.findIndex((m) => m.id === memberId);
      if (mIdx === -1) return false;

      const updatedMember: DuesTrackMember = {
        ...period.members[mIdx],
        status,
        paidAt: status === "paid" ? new Date().toISOString() : undefined,
      };
      const updatedMembers = [...period.members];
      updatedMembers[mIdx] = updatedMember;

      const updatedPeriods = [...stored.periods];
      updatedPeriods[pIdx] = { ...period, members: updatedMembers };

      persist({ ...stored, periods: updatedPeriods });
      return true;
    },
    [groupId, persist]
  );

  // ── 멤버 납부 상태 일괄 변경 ─────────────────────────────

  const bulkSetMemberStatus = useCallback(
    (
      periodId: string,
      memberIds: string[],
      status: DuesTrackPaymentStatus
    ): boolean => {
      const stored = loadFromStorage<DuesTrackData>(LS_KEY(groupId), { groupId, periods: [] });
      const pIdx = stored.periods.findIndex((p) => p.id === periodId);
      if (pIdx === -1) return false;

      const period = stored.periods[pIdx];
      const idSet = new Set(memberIds);
      const updatedMembers = period.members.map((m) =>
        idSet.has(m.id)
          ? {
              ...m,
              status,
              paidAt: status === "paid" ? new Date().toISOString() : undefined,
            }
          : m
      );

      const updatedPeriods = [...stored.periods];
      updatedPeriods[pIdx] = { ...period, members: updatedMembers };

      persist({ ...stored, periods: updatedPeriods });
      return true;
    },
    [groupId, persist]
  );

  // ── 멤버 추가 ────────────────────────────────────────────

  const addMemberToPeriod = useCallback(
    (periodId: string, name: string): boolean => {
      if (!name.trim()) return false;
      const stored = loadFromStorage<DuesTrackData>(LS_KEY(groupId), { groupId, periods: [] });
      const pIdx = stored.periods.findIndex((p) => p.id === periodId);
      if (pIdx === -1) return false;

      const period = stored.periods[pIdx];
      const newMember: DuesTrackMember = {
        id: crypto.randomUUID(),
        name: name.trim(),
        status: "unpaid",
      };
      const updatedPeriods = [...stored.periods];
      updatedPeriods[pIdx] = {
        ...period,
        members: [...period.members, newMember],
      };
      persist({ ...stored, periods: updatedPeriods });
      return true;
    },
    [groupId, persist]
  );

  // ── 멤버 삭제 ────────────────────────────────────────────

  const removeMemberFromPeriod = useCallback(
    (periodId: string, memberId: string): boolean => {
      const stored = loadFromStorage<DuesTrackData>(LS_KEY(groupId), { groupId, periods: [] });
      const pIdx = stored.periods.findIndex((p) => p.id === periodId);
      if (pIdx === -1) return false;

      const period = stored.periods[pIdx];
      const updatedPeriods = [...stored.periods];
      updatedPeriods[pIdx] = {
        ...period,
        members: period.members.filter((m) => m.id !== memberId),
      };
      persist({ ...stored, periods: updatedPeriods });
      return true;
    },
    [groupId, persist]
  );

  // ── 통계 헬퍼 ────────────────────────────────────────────

  const getPeriodStats = useCallback((period: DuesTrackPeriod) => {
    const total = period.members.length;
    const paid = period.members.filter((m) => m.status === "paid").length;
    const unpaid = period.members.filter((m) => m.status === "unpaid").length;
    const exempt = period.members.filter((m) => m.status === "exempt").length;
    const payable = total - exempt;
    const paidRate = payable > 0 ? Math.round((paid / payable) * 100) : 0;
    const totalIncome = paid * period.amount;
    return { total, paid, unpaid, exempt, payable, paidRate, totalIncome };
  }, []);

  // ── 최근 6개월 납부율 추이 ───────────────────────────────

  const recentTrend = (() => {
    const sorted = [...periods]
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month))
      .slice(0, 6)
      .reverse();

    return sorted.map((p) => {
      const stats = getPeriodStats(p);
      return {
        label: `${p.year % 100}/${String(p.month).padStart(2, "0")}`,
        paidRate: stats.paidRate,
        paid: stats.paid,
        payable: stats.payable,
      };
    });
  })();

  return {
    periods,
    loading: isLoading,
    // CRUD
    addPeriod,
    deletePeriod,
    setMemberStatus,
    bulkSetMemberStatus,
    addMemberToPeriod,
    removeMemberFromPeriod,
    // 통계
    getPeriodStats,
    recentTrend,
    // SWR
    refetch: () => mutate(),
  };
}
