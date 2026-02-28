"use client";

import useSWR from "swr";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type {
  StagePropData,
  StagePropItem,
  StagePropCategory,
  StagePropItemStatus,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

const STORAGE_PREFIX = "dancebase:stage-prop-management";

function getStorageKey(projectId: string): string {
  return `${STORAGE_PREFIX}:${projectId}`;
}

function loadData(projectId: string): StagePropData {
  if (typeof window === "undefined") return createEmptyData(projectId);
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    return raw ? (JSON.parse(raw) as StagePropData) : createEmptyData(projectId);
  } catch {
    return createEmptyData(projectId);
  }
}

function saveData(data: StagePropData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(data.projectId), JSON.stringify(data));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

function createEmptyData(projectId: string): StagePropData {
  return {
    projectId,
    props: [],
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 입력 타입
// ============================================================

export type StagePropInput = {
  name: string;
  category: StagePropCategory;
  quantity: number;
  scene: string | null;
  placement: string | null;
  responsiblePerson: string | null;
  status: StagePropItemStatus;
  notes: string;
};

// ============================================================
// 훅
// ============================================================

export function useStagePropManagement(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    projectId ? swrKeys.stagePropManagement(projectId) : null,
    async () => loadData(projectId)
  );

  const store = data ?? createEmptyData(projectId);

  /** 저장 후 SWR 캐시 업데이트 */
  function persist(updated: StagePropData): void {
    const withTimestamp: StagePropData = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    saveData(withTimestamp);
    mutate(withTimestamp, false);
  }

  // ── 소품 추가 ──
  function addProp(input: StagePropInput): StagePropItem | null {
    if (!input.name.trim()) {
      toast.error("소품 이름을 입력해주세요");
      return null;
    }
    if (input.quantity < 1) {
      toast.error("수량은 1 이상이어야 합니다");
      return null;
    }
    const item: StagePropItem = {
      ...input,
      id: crypto.randomUUID(),
      name: input.name.trim(),
      notes: input.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    persist({ ...store, props: [...store.props, item] });
    toast.success("소품이 추가되었습니다");
    return item;
  }

  // ── 소품 수정 ──
  function updateProp(id: string, fields: Partial<StagePropInput>): boolean {
    const target = store.props.find((p) => p.id === id);
    if (!target) {
      toast.error("소품을 찾을 수 없습니다");
      return false;
    }
    const updated = store.props.map((p) =>
      p.id === id
        ? {
            ...p,
            ...fields,
            name: fields.name !== undefined ? fields.name.trim() : p.name,
            notes: fields.notes !== undefined ? fields.notes.trim() : p.notes,
          }
        : p
    );
    persist({ ...store, props: updated });
    toast.success("소품이 수정되었습니다");
    return true;
  }

  // ── 소품 삭제 ──
  function deleteProp(id: string): boolean {
    const filtered = store.props.filter((p) => p.id !== id);
    persist({ ...store, props: filtered });
    toast.success("소품이 삭제되었습니다");
    return true;
  }

  // ── 통계 ──
  const totalProps = store.props.length;

  const categoryBreakdown: Record<StagePropCategory, number> = {
    furniture: 0,
    decoration: 0,
    handheld: 0,
    backdrop: 0,
    lighting_prop: 0,
    other: 0,
  };
  for (const p of store.props) {
    categoryBreakdown[p.category] = (categoryBreakdown[p.category] ?? 0) + 1;
  }

  const statusSummary: Record<StagePropItemStatus, number> = {
    available: 0,
    in_use: 0,
    damaged: 0,
    missing: 0,
  };
  for (const p of store.props) {
    statusSummary[p.status] = (statusSummary[p.status] ?? 0) + 1;
  }

  const sceneSet = new Set<string>();
  for (const p of store.props) {
    if (p.scene) sceneSet.add(p.scene);
  }
  const sceneDistribution: Record<string, number> = {};
  for (const p of store.props) {
    const key = p.scene ?? "(씬 없음)";
    sceneDistribution[key] = (sceneDistribution[key] ?? 0) + 1;
  }

  return {
    props: store.props,
    loading: isLoading,
    // CRUD
    addProp,
    updateProp,
    deleteProp,
    // 통계
    totalProps,
    categoryBreakdown,
    statusSummary,
    sceneDistribution,
    // SWR 갱신
    refetch: () => mutate(),
  };
}
