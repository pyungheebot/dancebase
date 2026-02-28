"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ContributionPointCategory,
  ContributionPointEntry,
  ContributionPointStore,
  ContributionPointTransaction,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:contribution-point:${groupId}`;
}

function loadStore(groupId: string): ContributionPointStore {
  if (typeof window === "undefined") {
    return { groupId, transactions: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (raw) return JSON.parse(raw) as ContributionPointStore;
  } catch {
    // 파싱 실패 시 빈 스토어 반환
  }
  return { groupId, transactions: [], updatedAt: new Date().toISOString() };
}

function saveStore(store: ContributionPointStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(store.groupId), JSON.stringify(store));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 입력 타입
// ============================================================

export type AddContributionPointInput = {
  memberId: string;
  memberName: string;
  category: ContributionPointCategory;
  points: number;
  reason: string;
  date: string;
  grantedBy: string;
  note?: string;
};

// ============================================================
// 카테고리 메타
// ============================================================

export const CONTRIBUTION_CATEGORY_META: Record<
  ContributionPointCategory,
  { label: string; color: string }
> = {
  attendance:    { label: "출석",     color: "bg-blue-500" },
  demonstration: { label: "시범",     color: "bg-purple-500" },
  feedback:      { label: "피드백",   color: "bg-green-500" },
  cleaning:      { label: "청소",     color: "bg-yellow-500" },
  equipment:     { label: "장비관리", color: "bg-orange-500" },
  teaching:      { label: "지도",     color: "bg-pink-500" },
  preparation:   { label: "준비",     color: "bg-cyan-500" },
  other:         { label: "기타",     color: "bg-gray-500" },
};

// ============================================================
// 집계 유틸
// ============================================================

const ALL_CATEGORIES: ContributionPointCategory[] = [
  "attendance",
  "demonstration",
  "feedback",
  "cleaning",
  "equipment",
  "teaching",
  "preparation",
  "other",
];

function buildEntries(
  transactions: ContributionPointTransaction[]
): ContributionPointEntry[] {
  const memberMap = new Map<
    string,
    {
      memberName: string;
      totalPoints: number;
      breakdown: Record<ContributionPointCategory, number>;
      transactions: ContributionPointTransaction[];
    }
  >();

  for (const tx of transactions) {
    if (!memberMap.has(tx.memberId)) {
      const breakdown = {} as Record<ContributionPointCategory, number>;
      for (const cat of ALL_CATEGORIES) breakdown[cat] = 0;
      memberMap.set(tx.memberId, {
        memberName: tx.memberName,
        totalPoints: 0,
        breakdown,
        transactions: [],
      });
    }
    const entry = memberMap.get(tx.memberId)!;
    entry.totalPoints += tx.points;
    entry.breakdown[tx.category] = (entry.breakdown[tx.category] ?? 0) + tx.points;
    entry.transactions.push(tx);
  }

  const entries: Omit<ContributionPointEntry, "rank">[] = Array.from(
    memberMap.entries()
  ).map(([memberId, val]) => ({
    memberId,
    memberName: val.memberName,
    totalPoints: val.totalPoints,
    categoryBreakdown: val.breakdown,
    transactions: val.transactions.sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    ),
  }));

  // 총 포인트 내림차순 정렬
  entries.sort((a, b) => b.totalPoints - a.totalPoints);

  return entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
}

// ============================================================
// 훅
// ============================================================

export function useContributionPoint(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.contributionPoint(groupId) : null,
    async () => loadStore(groupId)
  );

  const store = data ?? {
    groupId,
    transactions: [],
    updatedAt: new Date().toISOString(),
  };

  const transactions = store.transactions;
  const entries = buildEntries(transactions);

  // ── 포인트 부여/차감 ──
  const addTransaction = useCallback(
    async (input: AddContributionPointInput): Promise<boolean> => {
      if (!input.memberId.trim()) {
        toast.error("멤버를 선택해주세요");
        return false;
      }
      if (!input.reason.trim()) {
        toast.error("사유를 입력해주세요");
        return false;
      }
      if (!input.points || input.points === 0) {
        toast.error("포인트를 입력해주세요 (0 제외)");
        return false;
      }
      if (!input.date) {
        toast.error("날짜를 입력해주세요");
        return false;
      }
      if (!input.grantedBy.trim()) {
        toast.error("부여자를 입력해주세요");
        return false;
      }

      const current = loadStore(groupId);
      const now = new Date().toISOString();

      const newTx: ContributionPointTransaction = {
        id: crypto.randomUUID(),
        memberId: input.memberId.trim(),
        memberName: input.memberName.trim(),
        category: input.category,
        points: input.points,
        reason: input.reason.trim(),
        date: input.date,
        grantedBy: input.grantedBy.trim(),
        note: input.note?.trim() || undefined,
        createdAt: now,
      };

      const updated: ContributionPointStore = {
        ...current,
        transactions: [...current.transactions, newTx],
        updatedAt: now,
      };
      saveStore(updated);
      await mutate(updated, false);
      toast.success(
        input.points > 0
          ? `${input.memberName}에게 +${input.points}pt 부여되었습니다`
          : `${input.memberName}에게 ${input.points}pt 차감되었습니다`
      );
      return true;
    },
    [groupId, mutate]
  );

  // ── 내역 삭제 ──
  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadStore(groupId);
      const now = new Date().toISOString();
      const updated: ContributionPointStore = {
        ...current,
        transactions: current.transactions.filter((t) => t.id !== id),
        updatedAt: now,
      };
      saveStore(updated);
      await mutate(updated, false);
      toast.success("내역이 삭제되었습니다");
      return true;
    },
    [groupId, mutate]
  );

  // ── 멤버별 포인트 조회 ──
  function getMemberEntry(memberId: string): ContributionPointEntry | undefined {
    return entries.find((e) => e.memberId === memberId);
  }

  // ── 카테고리별 통계 (전체 그룹) ──
  const categoryStats: Record<ContributionPointCategory, number> = (() => {
    const stats = {} as Record<ContributionPointCategory, number>;
    for (const cat of ALL_CATEGORIES) stats[cat] = 0;
    for (const tx of transactions) {
      stats[tx.category] = (stats[tx.category] ?? 0) + tx.points;
    }
    return stats;
  })();

  const totalGroupPoints = transactions.reduce((sum, tx) => sum + tx.points, 0);

  // ── 요약 통계 ──
  const summary = {
    totalTransactions: transactions.length,
    totalGroupPoints,
    memberCount: entries.length,
    topMember: entries[0] ?? null,
    categoryStats,
  };

  return {
    transactions,
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addTransaction,
    deleteTransaction,
    getMemberEntry,
    summary,
    allCategories: ALL_CATEGORIES,
  };
}
