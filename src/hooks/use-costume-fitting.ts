"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  CostumeFittingData,
  CostumeFittingEntry,
  CostumeFittingMeasurement,
  CostumeFittingStatus,
} from "@/types";

// ——————————————————————————————
// 파라미터 타입
// ——————————————————————————————

export type AddEntryParams = {
  memberName: string;
  costumeName: string;
  measurements?: Partial<CostumeFittingMeasurement>;
  fittingDate?: string | null;
  alterationNotes?: string | null;
  photoUrl?: string | null;
};

export type UpdateEntryParams = Partial<
  Omit<CostumeFittingEntry, "id" | "createdAt">
>;

// ——————————————————————————————
// 훅
// ——————————————————————————————

const STORAGE_KEY = (projectId: string) => `costume-fitting-${projectId}`;

export function useCostumeFitting(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.costumeFitting(projectId),
    () => loadFromStorage<CostumeFittingData>(STORAGE_KEY(projectId), {} as CostumeFittingData),
    { revalidateOnFocus: false }
  );

  const fittingData: CostumeFittingData = data ?? {
    projectId,
    entries: [],
    updatedAt: new Date().toISOString(),
  };

  // ——— 항목 추가 ———
  const addEntry = useCallback(
    (params: AddEntryParams) => {
      const current = loadFromStorage<CostumeFittingData>(STORAGE_KEY(projectId), {} as CostumeFittingData);
      const defaultMeasurements: CostumeFittingMeasurement = {
        height: null,
        chest: null,
        waist: null,
        hip: null,
        shoeSize: null,
        notes: null,
      };
      const newEntry: CostumeFittingEntry = {
        id: crypto.randomUUID(),
        memberName: params.memberName,
        costumeName: params.costumeName,
        measurements: { ...defaultMeasurements, ...params.measurements },
        status: "pending",
        fittingDate: params.fittingDate ?? null,
        alterationNotes: params.alterationNotes ?? null,
        photoUrl: params.photoUrl ?? null,
        createdAt: new Date().toISOString(),
      };
      const updated: CostumeFittingData = {
        ...current,
        entries: [newEntry, ...current.entries],
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(projectId), updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 항목 수정 ———
  const updateEntry = useCallback(
    (entryId: string, params: UpdateEntryParams) => {
      const current = loadFromStorage<CostumeFittingData>(STORAGE_KEY(projectId), {} as CostumeFittingData);
      const updated: CostumeFittingData = {
        ...current,
        entries: current.entries.map((e) =>
          e.id !== entryId ? e : { ...e, ...params }
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(projectId), updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 항목 삭제 ———
  const deleteEntry = useCallback(
    (entryId: string) => {
      const current = loadFromStorage<CostumeFittingData>(STORAGE_KEY(projectId), {} as CostumeFittingData);
      const updated: CostumeFittingData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(projectId), updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 치수 업데이트 ———
  const updateMeasurements = useCallback(
    (
      entryId: string,
      measurements: Partial<CostumeFittingMeasurement>
    ) => {
      const current = loadFromStorage<CostumeFittingData>(STORAGE_KEY(projectId), {} as CostumeFittingData);
      const updated: CostumeFittingData = {
        ...current,
        entries: current.entries.map((e) =>
          e.id !== entryId
            ? e
            : { ...e, measurements: { ...e.measurements, ...measurements } }
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(projectId), updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 상태 업데이트 ———
  const updateStatus = useCallback(
    (entryId: string, status: CostumeFittingStatus) => {
      const current = loadFromStorage<CostumeFittingData>(STORAGE_KEY(projectId), {} as CostumeFittingData);
      const updated: CostumeFittingData = {
        ...current,
        entries: current.entries.map((e) =>
          e.id !== entryId ? e : { ...e, status }
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(projectId), updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——————————————————————————————
  // 통계 계산
  // ——————————————————————————————

  const entries = fittingData.entries;
  const totalEntries = entries.length;
  const completedCount = entries.filter((e) => e.status === "completed").length;
  const pendingCount = entries.filter((e) => e.status === "pending").length;

  const statusDistribution: Record<CostumeFittingStatus, number> = {
    pending: 0,
    fitted: 0,
    altered: 0,
    completed: 0,
  };
  for (const entry of entries) {
    statusDistribution[entry.status] =
      (statusDistribution[entry.status] ?? 0) + 1;
  }

  return {
    fittingData,
    loading: isLoading,
    refetch: () => mutate(),
    // CRUD
    addEntry,
    updateEntry,
    deleteEntry,
    // 세부 업데이트
    updateMeasurements,
    updateStatus,
    // 통계
    totalEntries,
    completedCount,
    pendingCount,
    statusDistribution,
  };
}
