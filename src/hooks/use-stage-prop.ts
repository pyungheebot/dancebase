"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type { StagePropEntry, StagePropStatus } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:stage-prop:${groupId}:${projectId}`;
}

function loadEntries(groupId: string, projectId: string): StagePropEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as StagePropEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  projectId: string,
  entries: StagePropEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(groupId, projectId),
      JSON.stringify(entries)
    );
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 입력 타입
// ============================================================

export type AddStagePropInput = {
  name: string;
  scene?: string;
  assignedTo?: string;
  storageLocation?: string;
  status: StagePropStatus;
  quantity: number;
  cost?: number;
  photoUrl?: string;
  memo?: string;
};

export type UpdateStagePropInput = Partial<AddStagePropInput>;

// ============================================================
// 훅
// ============================================================

export function useStageProp(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && projectId ? swrKeys.stageProp(groupId, projectId) : null,
    async () => loadEntries(groupId, projectId)
  );

  const entries = data ?? [];

  // ── 소품 추가 ──
  const addProp = useCallback(
    async (input: AddStagePropInput): Promise<boolean> => {
      if (!input.name.trim()) {
        toast.error("소품 이름을 입력해주세요");
        return false;
      }
      if (input.quantity < 1) {
        toast.error("수량은 1 이상이어야 합니다");
        return false;
      }

      const now = new Date().toISOString();
      const newEntry: StagePropEntry = {
        id: crypto.randomUUID(),
        groupId,
        projectId,
        name: input.name.trim(),
        scene: input.scene?.trim() || undefined,
        assignedTo: input.assignedTo?.trim() || undefined,
        storageLocation: input.storageLocation?.trim() || undefined,
        status: input.status,
        quantity: input.quantity,
        cost: input.cost,
        photoUrl: input.photoUrl?.trim() || undefined,
        memo: input.memo?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...entries, newEntry];
      saveEntries(groupId, projectId, updated);
      await mutate(updated, false);
      toast.success("소품이 추가되었습니다");
      return true;
    },
    [groupId, projectId, entries, mutate]
  );

  // ── 소품 수정 ──
  const updateProp = useCallback(
    async (id: string, changes: UpdateStagePropInput): Promise<boolean> => {
      const target = entries.find((e) => e.id === id);
      if (!target) {
        toast.error("소품을 찾을 수 없습니다");
        return false;
      }

      const updated = entries.map((e) =>
        e.id === id
          ? {
              ...e,
              ...changes,
              name:
                changes.name !== undefined
                  ? changes.name.trim()
                  : e.name,
              scene:
                changes.scene !== undefined
                  ? changes.scene.trim() || undefined
                  : e.scene,
              assignedTo:
                changes.assignedTo !== undefined
                  ? changes.assignedTo.trim() || undefined
                  : e.assignedTo,
              storageLocation:
                changes.storageLocation !== undefined
                  ? changes.storageLocation.trim() || undefined
                  : e.storageLocation,
              memo:
                changes.memo !== undefined
                  ? changes.memo.trim() || undefined
                  : e.memo,
              updatedAt: new Date().toISOString(),
            }
          : e
      );

      saveEntries(groupId, projectId, updated);
      await mutate(updated, false);
      toast.success("소품이 수정되었습니다");
      return true;
    },
    [groupId, projectId, entries, mutate]
  );

  // ── 소품 삭제 ──
  const deleteProp = useCallback(
    async (id: string): Promise<boolean> => {
      const filtered = entries.filter((e) => e.id !== id);
      saveEntries(groupId, projectId, filtered);
      await mutate(filtered, false);
      toast.success("소품이 삭제되었습니다");
      return true;
    },
    [groupId, projectId, entries, mutate]
  );

  // ── 상태 변경 ──
  const changeStatus = useCallback(
    async (id: string, status: StagePropStatus): Promise<boolean> => {
      const updated = entries.map((e) =>
        e.id === id
          ? { ...e, status, updatedAt: new Date().toISOString() }
          : e
      );
      saveEntries(groupId, projectId, updated);
      await mutate(updated, false);
      return true;
    },
    [groupId, projectId, entries, mutate]
  );

  // ── 상태별 필터 ──
  const filterByStatus = useCallback(
    (status: StagePropStatus | "all"): StagePropEntry[] => {
      if (status === "all") return entries;
      return entries.filter((e) => e.status === status);
    },
    [entries]
  );

  // ── 담당자별 필터 ──
  const filterByAssignee = useCallback(
    (assignedTo: string | "all"): StagePropEntry[] => {
      if (assignedTo === "all") return entries;
      return entries.filter((e) => e.assignedTo === assignedTo);
    },
    [entries]
  );

  // ── 통계 ──
  const stats = {
    total: entries.length,
    totalQuantity: entries.reduce((sum, e) => sum + e.quantity, 0),
    totalCost: entries.reduce((sum, e) => sum + (e.cost ?? 0), 0),
    byStatus: {
      ready: entries.filter((e) => e.status === "ready").length,
      in_use: entries.filter((e) => e.status === "in_use").length,
      stored: entries.filter((e) => e.status === "stored").length,
      repair: entries.filter((e) => e.status === "repair").length,
      lost: entries.filter((e) => e.status === "lost").length,
    },
    assignees: [
      ...new Set(entries.map((e) => e.assignedTo).filter(Boolean)),
    ] as string[],
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addProp,
    updateProp,
    deleteProp,
    changeStatus,
    filterByStatus,
    filterByAssignee,
    stats,
  };
}
