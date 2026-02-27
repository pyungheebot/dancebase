"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { RevenueEntry, RevenueParticipant, RevenueSplitMethod } from "@/types";

// ──────────────────────────────────────────
// localStorage 헬퍼
// ──────────────────────────────────────────
function storageKey(groupId: string) {
  return `dancebase:revenue:${groupId}`;
}

function loadEntries(groupId: string): RevenueEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    return raw ? (JSON.parse(raw) as RevenueEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: RevenueEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(groupId), JSON.stringify(entries));
}

// ──────────────────────────────────────────
// 분배 금액 계산
// ──────────────────────────────────────────
function calcAmounts(
  totalAmount: number,
  deductions: number,
  splitMethod: RevenueSplitMethod,
  participants: Omit<RevenueParticipant, "amount">[]
): RevenueParticipant[] {
  const net = Math.max(0, totalAmount - deductions);
  if (participants.length === 0) return [];

  if (splitMethod === "equal") {
    const perPerson = Math.floor(net / participants.length);
    const remainder = net - perPerson * participants.length;
    return participants.map((p, idx) => ({
      ...p,
      amount: idx === 0 ? perPerson + remainder : perPerson,
    }));
  }

  // weighted
  const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) {
    return participants.map((p) => ({ ...p, amount: 0 }));
  }

  const amounts = participants.map((p) =>
    Math.floor((net * p.weight) / totalWeight)
  );
  const distributed = amounts.reduce((sum, a) => sum + a, 0);
  const remainder = net - distributed;
  return participants.map((p, idx) => ({
    ...p,
    amount: idx === 0 ? amounts[idx] + remainder : amounts[idx],
  }));
}

// ──────────────────────────────────────────
// 훅
// ──────────────────────────────────────────
export function usePerformanceRevenue(groupId: string) {
  const { data, mutate } = useSWR(
    swrKeys.performanceRevenue(groupId),
    () => loadEntries(groupId),
    { fallbackData: [] }
  );

  const entries: RevenueEntry[] = data ?? [];

  // ── 수익 등록 ──────────────────────────
  function addEntry(params: {
    eventName: string;
    eventDate: string;
    totalAmount: number;
    deductions: number;
    splitMethod: RevenueSplitMethod;
    note: string;
    participants: Omit<RevenueParticipant, "amount">[];
  }) {
    const newEntry: RevenueEntry = {
      id: crypto.randomUUID(),
      eventName: params.eventName,
      eventDate: params.eventDate,
      totalAmount: params.totalAmount,
      deductions: params.deductions,
      splitMethod: params.splitMethod,
      note: params.note,
      settled: false,
      createdAt: new Date().toISOString(),
      participants: calcAmounts(
        params.totalAmount,
        params.deductions,
        params.splitMethod,
        params.participants
      ),
    };
    const updated = [newEntry, ...entries];
    saveEntries(groupId, updated);
    void mutate(updated, false);
    return newEntry;
  }

  // ── 수익 삭제 ──────────────────────────
  function removeEntry(entryId: string) {
    const updated = entries.filter((e) => e.id !== entryId);
    saveEntries(groupId, updated);
    void mutate(updated, false);
  }

  // ── 참여자 추가 ────────────────────────
  function addParticipant(
    entryId: string,
    participant: Omit<RevenueParticipant, "amount">
  ) {
    const updated = entries.map((e) => {
      if (e.id !== entryId) return e;
      const newParticipants = [...e.participants, { ...participant, amount: 0 }];
      return {
        ...e,
        participants: calcAmounts(
          e.totalAmount,
          e.deductions,
          e.splitMethod,
          newParticipants.map((p) => ({
            memberId: p.memberId,
            memberName: p.memberName,
            weight: p.weight,
            paid: p.paid,
          }))
        ),
      };
    });
    saveEntries(groupId, updated);
    void mutate(updated, false);
  }

  // ── 참여자 삭제 ────────────────────────
  function removeParticipant(entryId: string, memberId: string) {
    const updated = entries.map((e) => {
      if (e.id !== entryId) return e;
      const remaining = e.participants.filter((p) => p.memberId !== memberId);
      return {
        ...e,
        participants: calcAmounts(
          e.totalAmount,
          e.deductions,
          e.splitMethod,
          remaining.map((p) => ({
            memberId: p.memberId,
            memberName: p.memberName,
            weight: p.weight,
            paid: p.paid,
          }))
        ),
      };
    });
    saveEntries(groupId, updated);
    void mutate(updated, false);
  }

  // ── 개별 지급 처리 ─────────────────────
  function togglePaid(entryId: string, memberId: string) {
    const updated = entries.map((e) => {
      if (e.id !== entryId) return e;
      return {
        ...e,
        participants: e.participants.map((p) =>
          p.memberId === memberId ? { ...p, paid: !p.paid } : p
        ),
      };
    });
    saveEntries(groupId, updated);
    void mutate(updated, false);
  }

  // ── 정산 완료 처리 ─────────────────────
  function toggleSettled(entryId: string) {
    const updated = entries.map((e) =>
      e.id === entryId
        ? {
            ...e,
            settled: !e.settled,
            participants: e.participants.map((p) => ({
              ...p,
              paid: !e.settled ? true : p.paid,
            })),
          }
        : e
    );
    saveEntries(groupId, updated);
    void mutate(updated, false);
  }

  // ── 분배 미리보기 계산 (저장 없음) ──────
  function previewSplit(
    totalAmount: number,
    deductions: number,
    splitMethod: RevenueSplitMethod,
    participants: Omit<RevenueParticipant, "amount">[]
  ): RevenueParticipant[] {
    return calcAmounts(totalAmount, deductions, splitMethod, participants);
  }

  // ── 통계 ──────────────────────────────
  const stats = {
    totalRevenue: entries.reduce((sum, e) => sum + e.totalAmount, 0),
    totalDistributed: entries.reduce(
      (sum, e) =>
        sum + e.participants.reduce((s, p) => s + p.amount, 0),
      0
    ),
    unsettledCount: entries.filter((e) => !e.settled).length,
  };

  return {
    entries,
    addEntry,
    removeEntry,
    addParticipant,
    removeParticipant,
    togglePaid,
    toggleSettled,
    previewSplit,
    stats,
    refetch: () => mutate(),
  };
}
