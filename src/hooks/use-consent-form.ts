"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ConsentFormData,
  ConsentFormItem,
  ConsentFormType,
  ConsentFormStatus,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(projectId: string): string {
  return `dancebase:consent-form:${projectId}`;
}

function loadData(projectId: string): ConsentFormData {
  if (typeof window === "undefined") {
    return { projectId, items: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) {
      return { projectId, items: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as ConsentFormData;
  } catch {
    return { projectId, items: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: ConsentFormData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.projectId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useConsentForm(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.consentForm(projectId),
    () => loadData(projectId),
    {
      fallbackData: {
        projectId,
        items: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const items: ConsentFormItem[] = data?.items ?? [];

  // 항목 추가
  const addItem = useCallback(
    (params: {
      memberName: string;
      formType: ConsentFormType;
      notes?: string;
    }): ConsentFormItem => {
      const current = loadData(projectId);
      const now = new Date().toISOString();
      const newItem: ConsentFormItem = {
        id: crypto.randomUUID(),
        memberName: params.memberName.trim(),
        formType: params.formType,
        status: "pending",
        signedAt: null,
        notes: params.notes?.trim() || null,
        createdAt: now,
      };
      const updated: ConsentFormData = {
        ...current,
        items: [...current.items, newItem],
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated, false);
      return newItem;
    },
    [projectId, mutate]
  );

  // 항목 수정
  const updateItem = useCallback(
    (
      itemId: string,
      params: Partial<{
        memberName: string;
        formType: ConsentFormType;
        notes: string | null;
      }>
    ): boolean => {
      const current = loadData(projectId);
      const idx = current.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;

      const existing = current.items[idx];
      const updatedItem: ConsentFormItem = {
        ...existing,
        memberName:
          params.memberName !== undefined
            ? params.memberName.trim()
            : existing.memberName,
        formType: params.formType ?? existing.formType,
        notes:
          params.notes !== undefined
            ? params.notes?.trim() || null
            : existing.notes,
      };
      const updated: ConsentFormData = {
        ...current,
        items: current.items.map((i) => (i.id === itemId ? updatedItem : i)),
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [projectId, mutate]
  );

  // 항목 삭제
  const deleteItem = useCallback(
    (itemId: string): boolean => {
      const current = loadData(projectId);
      const exists = current.items.some((i) => i.id === itemId);
      if (!exists) return false;

      const updated: ConsentFormData = {
        ...current,
        items: current.items.filter((i) => i.id !== itemId),
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [projectId, mutate]
  );

  // 서명 처리
  const signItem = useCallback(
    (itemId: string): boolean => {
      const current = loadData(projectId);
      const idx = current.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;

      const now = new Date().toISOString();
      const updatedItem: ConsentFormItem = {
        ...current.items[idx],
        status: "signed",
        signedAt: now,
      };
      const updated: ConsentFormData = {
        ...current,
        items: current.items.map((i) => (i.id === itemId ? updatedItem : i)),
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [projectId, mutate]
  );

  // 거부 처리
  const declineItem = useCallback(
    (itemId: string): boolean => {
      const current = loadData(projectId);
      const idx = current.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;

      const now = new Date().toISOString();
      const updatedItem: ConsentFormItem = {
        ...current.items[idx],
        status: "declined",
        signedAt: null,
      };
      const updated: ConsentFormData = {
        ...current,
        items: current.items.map((i) => (i.id === itemId ? updatedItem : i)),
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [projectId, mutate]
  );

  // 일괄 생성 (멤버 목록 + 유형으로 동의서 항목 생성)
  const bulkCreate = useCallback(
    (memberNames: string[], formType: ConsentFormType): number => {
      if (memberNames.length === 0) return 0;
      const current = loadData(projectId);
      const now = new Date().toISOString();
      const newItems: ConsentFormItem[] = memberNames
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
        .map((name) => ({
          id: crypto.randomUUID(),
          memberName: name,
          formType,
          status: "pending" as ConsentFormStatus,
          signedAt: null,
          notes: null,
          createdAt: now,
        }));
      if (newItems.length === 0) return 0;
      const updated: ConsentFormData = {
        ...current,
        items: [...current.items, ...newItems],
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated, false);
      return newItems.length;
    },
    [projectId, mutate]
  );

  // 통계
  const totalItems = items.length;
  const signedCount = items.filter((i) => i.status === "signed").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const declinedCount = items.filter((i) => i.status === "declined").length;
  const completionRate =
    totalItems > 0 ? Math.round((signedCount / totalItems) * 100) : 0;

  return {
    items,
    loading: isLoading,
    refetch: () => mutate(),
    addItem,
    updateItem,
    deleteItem,
    signItem,
    declineItem,
    bulkCreate,
    // 통계
    totalItems,
    signedCount,
    pendingCount,
    declinedCount,
    completionRate,
  };
}
