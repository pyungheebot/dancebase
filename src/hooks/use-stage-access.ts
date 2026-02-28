"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  StageAccessData,
  StageAccessPass,
  StageAccessRole,
  StageAccessStatus,
} from "@/types";

// ─── 기본값 ────────────────────────────────────────────────

function buildDefaultData(projectId: string): StageAccessData {
  return {
    projectId,
    passes: [],
    updatedAt: new Date().toISOString(),
  };
}

function getStorageKey(projectId: string) {
  return `stage-access-${projectId}`;
}

function loadFromStorage(projectId: string): StageAccessData {
  if (typeof window === "undefined") return buildDefaultData(projectId);
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return buildDefaultData(projectId);
    return JSON.parse(raw) as StageAccessData;
  } catch {
    return buildDefaultData(projectId);
  }
}

function saveToStorage(data: StageAccessData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(data.projectId), JSON.stringify(data));
}

// ─── 통계 계산 ──────────────────────────────────────────────

export type StageAccessStats = {
  /** 전체 패스 수 */
  total: number;
  /** 활성 패스 수 */
  active: number;
  /** 역할별 인원 수 */
  byRole: Record<StageAccessRole, number>;
  /** 상태별 인원 수 */
  byStatus: Record<StageAccessStatus, number>;
};

export function calcStageAccessStats(
  passes: StageAccessPass[]
): StageAccessStats {
  const total = passes.length;
  const active = passes.filter((p) => p.status === "활성").length;

  const byRole: Record<StageAccessRole, number> = {
    출연진: 0,
    스태프: 0,
    VIP: 0,
    미디어: 0,
    기타: 0,
  };
  const byStatus: Record<StageAccessStatus, number> = {
    활성: 0,
    비활성: 0,
    분실: 0,
  };

  for (const pass of passes) {
    byRole[pass.role]++;
    byStatus[pass.status]++;
  }

  return { total, active, byRole, byStatus };
}

// ─── 훅 ────────────────────────────────────────────────────

export function useStageAccess(projectId: string) {
  const { data, mutate } = useSWR(
    swrKeys.stageAccess(projectId),
    () => loadFromStorage(projectId),
    { revalidateOnFocus: false }
  );

  const accessData = data ?? buildDefaultData(projectId);

  // 패스 추가
  function addPass(pass: Omit<StageAccessPass, "id" | "createdAt">) {
    const next: StageAccessData = {
      ...accessData,
      passes: [
        ...accessData.passes,
        {
          ...pass,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    mutate(next, false);
  }

  // 패스 수정
  function updatePass(
    passId: string,
    patch: Partial<Omit<StageAccessPass, "id" | "createdAt">>
  ) {
    const next: StageAccessData = {
      ...accessData,
      passes: accessData.passes.map((p) =>
        p.id === passId ? { ...p, ...patch } : p
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    mutate(next, false);
  }

  // 패스 삭제
  function removePass(passId: string) {
    const next: StageAccessData = {
      ...accessData,
      passes: accessData.passes.filter((p) => p.id !== passId),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    mutate(next, false);
  }

  return {
    data: accessData,
    stats: calcStageAccessStats(accessData.passes),
    addPass,
    updatePass,
    removePass,
    refetch: () => mutate(),
  };
}
