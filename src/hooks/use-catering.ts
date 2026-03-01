"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  CateringData,
  CateringEntry,
  CateringMealType,
  CateringDietaryRestriction,
  CateringStatus,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:catering:${groupId}:${projectId}`;
}

// ============================================
// 훅
// ============================================

export function useCatering(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.catering(groupId, projectId),
    () => loadFromStorage<CateringData>(storageKey(groupId, projectId), {} as CateringData),
    {
      fallbackData: {
        groupId,
        projectId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: CateringEntry[] = data?.entries ?? [];

  // 항목 추가
  const addEntry = useCallback(
    (params: {
      mealType: CateringMealType;
      mealTime: string;
      menuDescription: string;
      headcount: number;
      dietaryRestrictions: CateringDietaryRestriction[];
      dietaryNotes?: string;
      vendorName?: string;
      vendorContact?: string;
      totalCost?: number;
      deliveryTime?: string;
      deliveryLocation?: string;
      notes?: string;
    }): CateringEntry => {
      const current = loadFromStorage<CateringData>(storageKey(groupId, projectId), {} as CateringData);
      const now = new Date().toISOString();
      const newEntry: CateringEntry = {
        id: crypto.randomUUID(),
        mealType: params.mealType,
        mealTime: params.mealTime,
        menuDescription: params.menuDescription,
        headcount: params.headcount,
        dietaryRestrictions: params.dietaryRestrictions,
        dietaryNotes: params.dietaryNotes?.trim() || undefined,
        vendorName: params.vendorName?.trim() || undefined,
        vendorContact: params.vendorContact?.trim() || undefined,
        totalCost: params.totalCost,
        deliveryTime: params.deliveryTime?.trim() || undefined,
        deliveryLocation: params.deliveryLocation?.trim() || undefined,
        status: "pending",
        notes: params.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated: CateringData = {
        ...current,
        entries: [newEntry, ...current.entries],
        updatedAt: now,
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return newEntry;
    },
    [groupId, projectId, mutate]
  );

  // 항목 수정
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        mealType: CateringMealType;
        mealTime: string;
        menuDescription: string;
        headcount: number;
        dietaryRestrictions: CateringDietaryRestriction[];
        dietaryNotes: string;
        vendorName: string;
        vendorContact: string;
        totalCost: number;
        deliveryTime: string;
        deliveryLocation: string;
        status: CateringStatus;
        notes: string;
      }>
    ): boolean => {
      const current = loadFromStorage<CateringData>(storageKey(groupId, projectId), {} as CateringData);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: CateringEntry = {
        ...existing,
        ...params,
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = [...current.entries];
      updatedEntries[idx] = updatedEntry;

      const updated: CateringData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 상태 변경
  const updateStatus = useCallback(
    (entryId: string, status: CateringStatus): boolean => {
      const current = loadFromStorage<CateringData>(storageKey(groupId, projectId), {} as CateringData);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const updatedEntries = [...current.entries];
      updatedEntries[idx] = {
        ...updatedEntries[idx],
        status,
        updatedAt: new Date().toISOString(),
      };

      const updated: CateringData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 항목 삭제
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadFromStorage<CateringData>(storageKey(groupId, projectId), {} as CateringData);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: CateringData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 통계 계산
  const stats = (() => {
    const totalCount = entries.length;
    const totalHeadcount = entries.reduce((s, e) => s + e.headcount, 0);
    const totalCost = entries.reduce((s, e) => s + (e.totalCost ?? 0), 0);
    const statusCounts: Record<CateringStatus, number> = {
      pending: 0,
      confirmed: 0,
      delivering: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const e of entries) {
      statusCounts[e.status]++;
    }
    return { totalCount, totalHeadcount, totalCost, statusCounts };
  })();

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    updateStatus,
    deleteEntry,
    stats,
  };
}
