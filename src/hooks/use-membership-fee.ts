"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { MembershipFeeData, MembershipFeePayment } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

const STORAGE_PREFIX = "dancebase:membership-fee";

function getStorageKey(groupId: string): string {
  return `${STORAGE_PREFIX}:${groupId}`;
}

function loadData(groupId: string): MembershipFeeData {
  if (typeof window === "undefined") {
    return createEmptyData(groupId);
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as MembershipFeeData) : createEmptyData(groupId);
  } catch {
    return createEmptyData(groupId);
  }
}

function saveData(data: MembershipFeeData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(data.groupId), JSON.stringify(data));
}

function createEmptyData(groupId: string): MembershipFeeData {
  return {
    groupId,
    payments: [],
    monthlyFee: 0,
    currency: "KRW",
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 유틸: 현재 연월 반환 ("YYYY-MM")
// ============================================================

export function getCurrentMonth(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

/** "YYYY-MM" 형식을 "YYYY년 MM월" 로 변환 */
export function formatMonth(month: string): string {
  const [yyyy, mm] = month.split("-");
  return `${yyyy}년 ${Number(mm)}월`;
}

// ============================================================
// 훅
// ============================================================

export function useMembershipFee(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.membershipFee(groupId) : null,
    async () => loadData(groupId)
  );

  const store = data ?? createEmptyData(groupId);

  /** 저장 후 SWR 캐시 업데이트 */
  function persist(updated: MembershipFeeData): void {
    const withTimestamp: MembershipFeeData = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    saveData(withTimestamp);
    mutate(withTimestamp, false);
  }

  // ── 납부 항목 추가 ──
  function addPayment(
    input: Omit<MembershipFeePayment, "id">
  ): MembershipFeePayment {
    const item: MembershipFeePayment = {
      ...input,
      id: crypto.randomUUID(),
    };
    persist({ ...store, payments: [...store.payments, item] });
    return item;
  }

  // ── 납부 항목 수정 ──
  function updatePayment(
    id: string,
    fields: Partial<Omit<MembershipFeePayment, "id">>
  ): void {
    const updated = store.payments.map((p) =>
      p.id === id ? { ...p, ...fields } : p
    );
    persist({ ...store, payments: updated });
  }

  // ── 납부 항목 삭제 ──
  function deletePayment(id: string): void {
    const filtered = store.payments.filter((p) => p.id !== id);
    persist({ ...store, payments: filtered });
  }

  // ── 월 기본 회비 설정 ──
  function setMonthlyFee(fee: number): void {
    persist({ ...store, monthlyFee: fee });
  }

  // ── 특정 월에 대해 멤버 목록으로 일괄 생성 ──
  function generateMonthPayments(month: string, memberNames: string[]): void {
    // 이미 해당 월+멤버 항목이 있는 경우 스킵
    const existingKeys = new Set(
      store.payments
        .filter((p) => p.month === month)
        .map((p) => p.memberName)
    );

    const newPayments: MembershipFeePayment[] = memberNames
      .filter((name) => !existingKeys.has(name))
      .map((name) => ({
        id: crypto.randomUUID(),
        memberName: name,
        month,
        amount: store.monthlyFee,
        paidAt: null,
        status: "unpaid" as const,
        notes: null,
      }));

    if (newPayments.length === 0) return;

    persist({ ...store, payments: [...store.payments, ...newPayments] });
  }

  // ── 특정 월의 납부 항목만 추출 ──
  function getMonthPayments(month: string): MembershipFeePayment[] {
    return store.payments
      .filter((p) => p.month === month)
      .sort((a, b) => a.memberName.localeCompare(b.memberName, "ko"));
  }

  // ── 통계 계산 (특정 월 기준) ──
  function getMonthStats(month: string) {
    const payments = getMonthPayments(month);
    const total = payments.length;
    const paidCount = payments.filter(
      (p) => p.status === "paid" || p.status === "exempt"
    ).length;
    const unpaidCount = payments.filter((p) => p.status === "unpaid").length;
    const partialCount = payments.filter((p) => p.status === "partial").length;
    const exemptCount = payments.filter((p) => p.status === "exempt").length;

    const totalCollected = payments
      .filter((p) => p.status === "paid" || p.status === "partial")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalExpected = payments
      .filter((p) => p.status !== "exempt")
      .reduce((_) => _ + store.monthlyFee, 0);

    const collectionRate =
      total > 0 ? Math.round((paidCount / total) * 100) : 0;

    const unpaidMembers = payments
      .filter((p) => p.status === "unpaid")
      .map((p) => p.memberName);

    const memberPaymentStatus = payments.map((p) => ({
      memberName: p.memberName,
      status: p.status,
      amount: p.amount,
      paidAt: p.paidAt,
    }));

    return {
      total,
      paidCount,
      unpaidCount,
      partialCount,
      exemptCount,
      totalCollected,
      totalExpected,
      collectionRate,
      unpaidMembers,
      memberPaymentStatus,
    };
  }

  // ── 납부 상태 토글 (unpaid -> paid -> exempt -> unpaid) ──
  function togglePaymentStatus(id: string): void {
    const payment = store.payments.find((p) => p.id === id);
    if (!payment) return;

    const cycle: MembershipFeePayment["status"][] = [
      "unpaid",
      "paid",
      "exempt",
    ];
    const currentIndex = cycle.indexOf(payment.status);
    const nextStatus = cycle[(currentIndex + 1) % cycle.length];

    const fields: Partial<MembershipFeePayment> = { status: nextStatus };

    if (nextStatus === "paid") {
      fields.paidAt = new Date().toISOString();
      fields.amount = store.monthlyFee;
    } else if (nextStatus === "unpaid") {
      fields.paidAt = null;
      fields.amount = store.monthlyFee;
    } else if (nextStatus === "exempt") {
      fields.paidAt = null;
    }

    updatePayment(id, fields);
  }

  // ── 사용 가능한 월 목록 (과거 12개월 + 현재 + 미래 3개월) ──
  function getAvailableMonths(): string[] {
    const months: string[] = [];
    const now = new Date();
    // 과거 12개월부터 미래 3개월까지
    for (let offset = -12; offset <= 3; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      months.push(`${yyyy}-${mm}`);
    }
    return months;
  }

  return {
    store,
    loading: isLoading,
    // CRUD
    addPayment,
    updatePayment,
    deletePayment,
    togglePaymentStatus,
    // 설정
    setMonthlyFee,
    // 일괄 생성
    generateMonthPayments,
    // 조회
    getMonthPayments,
    getMonthStats,
    getAvailableMonths,
    // 유틸
    getCurrentMonth,
    formatMonth,
    // SWR 갱신
    refetch: () => mutate(),
  };
}
