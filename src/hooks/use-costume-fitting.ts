"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  CostumeFittingData,
  CostumeFittingEntry,
  CostumeFittingMeasurement,
  CostumeFittingStatus,
} from "@/types";

// ——————————————————————————————
// localStorage 헬퍼
// ——————————————————————————————

function loadData(projectId: string): CostumeFittingData {
  if (typeof window === "undefined") {
    return { projectId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(`costume-fitting-${projectId}`);
    if (!raw) {
      return { projectId, entries: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as CostumeFittingData;
  } catch {
    return { projectId, entries: [], updatedAt: new Date().toISOString() };
  }
}

function persistData(data: CostumeFittingData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `costume-fitting-${data.projectId}`,
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

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

export function useCostumeFitting(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.costumeFitting(projectId),
    () => loadData(projectId),
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
      const current = loadData(projectId);
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
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 항목 수정 ———
  const updateEntry = useCallback(
    (entryId: string, params: UpdateEntryParams) => {
      const current = loadData(projectId);
      const updated: CostumeFittingData = {
        ...current,
        entries: current.entries.map((e) =>
          e.id !== entryId ? e : { ...e, ...params }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 항목 삭제 ———
  const deleteEntry = useCallback(
    (entryId: string) => {
      const current = loadData(projectId);
      const updated: CostumeFittingData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
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
      const current = loadData(projectId);
      const updated: CostumeFittingData = {
        ...current,
        entries: current.entries.map((e) =>
          e.id !== entryId
            ? e
            : { ...e, measurements: { ...e.measurements, ...measurements } }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 상태 업데이트 ———
  const updateStatus = useCallback(
    (entryId: string, status: CostumeFittingStatus) => {
      const current = loadData(projectId);
      const updated: CostumeFittingData = {
        ...current,
        entries: current.entries.map((e) =>
          e.id !== entryId ? e : { ...e, status }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
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
