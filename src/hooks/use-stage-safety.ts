"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  StageSafetyData,
  SafetyInspection,
  SafetyCheckItem,
} from "@/types";

// ——————————————————————————————
// localStorage 헬퍼
// ——————————————————————————————

function loadData(projectId: string): StageSafetyData {
  if (typeof window === "undefined") {
    return { projectId, inspections: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(`stage-safety-check-${projectId}`);
    if (!raw) {
      return {
        projectId,
        inspections: [],
        updatedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(raw) as StageSafetyData;
  } catch {
    return { projectId, inspections: [], updatedAt: new Date().toISOString() };
  }
}

function persistData(data: StageSafetyData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `stage-safety-check-${data.projectId}`,
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ——————————————————————————————
// 파라미터 타입
// ——————————————————————————————

export type CreateInspectionParams = {
  title: string;
  date: string;
  venue: string | null;
  items?: Omit<SafetyCheckItem, "id">[];
};

export type AddCheckItemParams = Omit<SafetyCheckItem, "id">;

export type UpdateCheckItemParams = Partial<Omit<SafetyCheckItem, "id">>;

// ——————————————————————————————
// 훅
// ——————————————————————————————

export function useStageSafety(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.stageSafetyCheck(projectId),
    () => loadData(projectId),
    { revalidateOnFocus: false }
  );

  const safetyData: StageSafetyData = data ?? {
    projectId,
    inspections: [],
    updatedAt: new Date().toISOString(),
  };

  // ——— 점검 생성 ———
  const createInspection = useCallback(
    (params: CreateInspectionParams) => {
      const current = loadData(projectId);
      const newInspection: SafetyInspection = {
        id: crypto.randomUUID(),
        title: params.title,
        date: params.date,
        venue: params.venue,
        items: (params.items ?? []).map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        })),
        overallStatus: "approved",
        signedBy: null,
        createdAt: new Date().toISOString(),
      };
      const updated: StageSafetyData = {
        ...current,
        inspections: [newInspection, ...current.inspections],
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 점검 삭제 ———
  const deleteInspection = useCallback(
    (inspectionId: string) => {
      const current = loadData(projectId);
      const updated: StageSafetyData = {
        ...current,
        inspections: current.inspections.filter((i) => i.id !== inspectionId),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 점검 항목 추가 ———
  const addCheckItem = useCallback(
    (inspectionId: string, params: AddCheckItemParams) => {
      const current = loadData(projectId);
      const newItem: SafetyCheckItem = {
        id: crypto.randomUUID(),
        ...params,
      };
      const updated: StageSafetyData = {
        ...current,
        inspections: current.inspections.map((i) =>
          i.id !== inspectionId
            ? i
            : { ...i, items: [...i.items, newItem] }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 점검 항목 수정 ———
  const updateCheckItem = useCallback(
    (
      inspectionId: string,
      itemId: string,
      params: UpdateCheckItemParams
    ) => {
      const current = loadData(projectId);
      const updated: StageSafetyData = {
        ...current,
        inspections: current.inspections.map((i) =>
          i.id !== inspectionId
            ? i
            : {
                ...i,
                items: i.items.map((item) =>
                  item.id !== itemId ? item : { ...item, ...params }
                ),
              }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 점검 항목 삭제 ———
  const removeCheckItem = useCallback(
    (inspectionId: string, itemId: string) => {
      const current = loadData(projectId);
      const updated: StageSafetyData = {
        ...current,
        inspections: current.inspections.map((i) =>
          i.id !== inspectionId
            ? i
            : { ...i, items: i.items.filter((item) => item.id !== itemId) }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 전체 결과 설정 ———
  const setOverallStatus = useCallback(
    (
      inspectionId: string,
      status: SafetyInspection["overallStatus"],
      signedBy?: string | null
    ) => {
      const current = loadData(projectId);
      const updated: StageSafetyData = {
        ...current,
        inspections: current.inspections.map((i) =>
          i.id !== inspectionId
            ? i
            : {
                ...i,
                overallStatus: status,
                signedBy: signedBy !== undefined ? signedBy : i.signedBy,
              }
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

  const inspections = safetyData.inspections;
  const totalInspections = inspections.length;

  // 통과율: 전체 항목 중 pass 항목 비율 (na 제외)
  let totalItems = 0;
  let passItems = 0;
  let pendingItems = 0;

  const categoryBreakdown: Record<
    SafetyCheckItem["category"],
    { pass: number; fail: number; pending: number; na: number }
  > = {
    electrical: { pass: 0, fail: 0, pending: 0, na: 0 },
    structural: { pass: 0, fail: 0, pending: 0, na: 0 },
    fire: { pass: 0, fail: 0, pending: 0, na: 0 },
    emergency: { pass: 0, fail: 0, pending: 0, na: 0 },
    equipment: { pass: 0, fail: 0, pending: 0, na: 0 },
    other: { pass: 0, fail: 0, pending: 0, na: 0 },
  };

  for (const inspection of inspections) {
    for (const item of inspection.items) {
      if (item.status !== "na") {
        totalItems++;
        if (item.status === "pass") passItems++;
        if (item.status === "pending") pendingItems++;
      }
      const cat = categoryBreakdown[item.category];
      if (cat) {
        cat[item.status]++;
      }
    }
  }

  const passRate =
    totalItems === 0
      ? 0
      : Math.round((passItems / totalItems) * 100);

  return {
    safetyData,
    loading: isLoading,
    refetch: () => mutate(),
    // CRUD
    createInspection,
    deleteInspection,
    addCheckItem,
    updateCheckItem,
    removeCheckItem,
    setOverallStatus,
    // 통계
    totalInspections,
    passRate,
    pendingItems,
    categoryBreakdown,
  };
}
