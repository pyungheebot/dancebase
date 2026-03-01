"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { ReceiptEntry, ReceiptCategory, ReceiptStatus } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:receipt:${groupId}`;
}

// ============================================
// 훅
// ============================================

export function useReceiptManagement(groupId: string) {
  const swrKey = swrKeys.receiptManagement(groupId);

  const { data: receipts = [], mutate } = useSWR(swrKey, () =>
    loadFromStorage<ReceiptEntry[]>(storageKey(groupId), [])
  );

  // 영수증 추가
  const addReceipt = useCallback(
    (
      title: string,
      amount: number,
      category: ReceiptCategory,
      date: string,
      submittedBy: string,
      vendor?: string,
      notes?: string
    ) => {
      const newEntry: ReceiptEntry = {
        id: crypto.randomUUID(),
        title: title.trim(),
        amount,
        category,
        date,
        submittedBy: submittedBy.trim(),
        status: "pending",
        vendor: vendor?.trim(),
        notes: notes?.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...receipts];
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, receipts, mutate]
  );

  // 영수증 수정
  const updateReceipt = useCallback(
    (id: string, patch: Partial<ReceiptEntry>) => {
      const updated = receipts.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      );
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
    },
    [groupId, receipts, mutate]
  );

  // 영수증 삭제
  const deleteReceipt = useCallback(
    (id: string) => {
      const updated = receipts.filter((r) => r.id !== id);
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
    },
    [groupId, receipts, mutate]
  );

  // 영수증 승인
  const approveReceipt = useCallback(
    (id: string, approverName: string) => {
      const updated = receipts.map((r) =>
        r.id === id
          ? { ...r, status: "approved" as ReceiptStatus, approvedBy: approverName.trim() }
          : r
      );
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
    },
    [groupId, receipts, mutate]
  );

  // 영수증 거절
  const rejectReceipt = useCallback(
    (id: string) => {
      const updated = receipts.map((r) =>
        r.id === id ? { ...r, status: "rejected" as ReceiptStatus } : r
      );
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
    },
    [groupId, receipts, mutate]
  );

  // 환급 처리
  const reimburseReceipt = useCallback(
    (id: string) => {
      const updated = receipts.map((r) =>
        r.id === id ? { ...r, status: "reimbursed" as ReceiptStatus } : r
      );
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
    },
    [groupId, receipts, mutate]
  );

  // 카테고리별 조회
  const getByCategory = useCallback(
    (category: ReceiptCategory): ReceiptEntry[] =>
      receipts.filter((r) => r.category === category),
    [receipts]
  );

  // 상태별 조회
  const getByStatus = useCallback(
    (status: ReceiptStatus): ReceiptEntry[] =>
      receipts.filter((r) => r.status === status),
    [receipts]
  );

  // 월별 조회 (YYYY-MM)
  const getByMonth = useCallback(
    (yearMonth: string): ReceiptEntry[] =>
      receipts.filter((r) => r.date.startsWith(yearMonth)),
    [receipts]
  );

  // ============================================
  // 통계
  // ============================================

  const totalReceipts = receipts.length;

  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

  const pendingAmount = receipts
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0);

  const approvedAmount = receipts
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.amount, 0);

  const reimbursedAmount = receipts
    .filter((r) => r.status === "reimbursed")
    .reduce((sum, r) => sum + r.amount, 0);

  const allCategories: ReceiptCategory[] = [
    "venue",
    "costume",
    "equipment",
    "food",
    "transport",
    "marketing",
    "other",
  ];

  const categoryBreakdown: Record<ReceiptCategory, number> = allCategories.reduce(
    (acc, cat) => {
      acc[cat] = receipts
        .filter((r) => r.category === cat)
        .reduce((sum, r) => sum + r.amount, 0);
      return acc;
    },
    {} as Record<ReceiptCategory, number>
  );

  return {
    receipts,
    loading: false,
    // CRUD
    addReceipt,
    updateReceipt,
    deleteReceipt,
    approveReceipt,
    rejectReceipt,
    reimburseReceipt,
    // 필터
    getByCategory,
    getByStatus,
    getByMonth,
    // 통계
    totalReceipts,
    totalAmount,
    pendingAmount,
    approvedAmount,
    reimbursedAmount,
    categoryBreakdown,
  };
}
