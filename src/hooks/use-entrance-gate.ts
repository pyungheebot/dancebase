"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import type {
  EntranceGateEntry,
  EntranceGateSheet,
  EntranceGateStatus,
  EntranceGateType,
} from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:entrance-gate:${groupId}:${projectId}`;
}

function loadSheet(groupId: string, projectId: string): EntranceGateSheet {
  return loadFromStorage<EntranceGateSheet>(
    getStorageKey(groupId, projectId),
    { groupId, projectId, gates: [], updatedAt: new Date().toISOString() }
  );
}

function saveSheet(sheet: EntranceGateSheet): void {
  saveToStorage(getStorageKey(sheet.groupId, sheet.projectId), sheet);
}

// ============================================================
// 입력 타입
// ============================================================

export type AddEntranceGateInput = {
  gateNumber: number;
  gateName: string;
  location?: string;
  staffName?: string;
  openTime?: string;
  closeTime?: string;
  allowedTypes: EntranceGateType[];
  status?: EntranceGateStatus;
  note?: string;
};

export type UpdateEntranceGateInput = Partial<Omit<EntranceGateEntry, "id" | "createdAt" | "updatedAt">>;

// ============================================================
// 훅
// ============================================================

export function useEntranceGate(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && projectId ? swrKeys.entranceGate(groupId, projectId) : null,
    async () => loadSheet(groupId, projectId)
  );

  const sheet = data ?? {
    groupId,
    projectId,
    gates: [],
    updatedAt: new Date().toISOString(),
  };

  // 게이트 번호 오름차순 정렬
  const gates = [...sheet.gates].sort((a, b) => a.gateNumber - b.gateNumber);

  // ── 게이트 추가 ──
  const addGate = useCallback(
    async (input: AddEntranceGateInput): Promise<boolean> => {
      if (!input.gateName.trim()) {
        toast.error(TOAST.ENTRANCE.NAME_REQUIRED);
        return false;
      }
      if (input.gateNumber <= 0) {
        toast.error(TOAST.ENTRANCE.NUMBER_REQUIRED);
        return false;
      }
      if (input.allowedTypes.length === 0) {
        toast.error(TOAST.ENTRANCE.ALLOW_TYPE_REQUIRED);
        return false;
      }

      const current = loadSheet(groupId, projectId);
      const isDuplicate = current.gates.some(
        (g) => g.gateNumber === input.gateNumber
      );
      if (isDuplicate) {
        toast.error(`게이트 번호 ${input.gateNumber}이(가) 이미 존재합니다`);
        return false;
      }

      const now = new Date().toISOString();
      const newGate: EntranceGateEntry = {
        id: crypto.randomUUID(),
        gateNumber: input.gateNumber,
        gateName: input.gateName.trim(),
        location: input.location?.trim() || undefined,
        staffName: input.staffName?.trim() || undefined,
        openTime: input.openTime || undefined,
        closeTime: input.closeTime || undefined,
        allowedTypes: input.allowedTypes,
        status: input.status ?? "standby",
        count: 0,
        note: input.note?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const updated: EntranceGateSheet = {
        ...current,
        gates: [...current.gates, newGate],
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.ENTRANCE.ADDED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 게이트 수정 ──
  const updateGate = useCallback(
    async (id: string, changes: UpdateEntranceGateInput): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const target = current.gates.find((g) => g.id === id);
      if (!target) {
        toast.error(TOAST.ENTRANCE.NOT_FOUND);
        return false;
      }

      // 게이트 번호 중복 체크 (자기 자신 제외)
      if (
        changes.gateNumber !== undefined &&
        changes.gateNumber !== target.gateNumber
      ) {
        const isDuplicate = current.gates.some(
          (g) => g.id !== id && g.gateNumber === changes.gateNumber
        );
        if (isDuplicate) {
          toast.error(`게이트 번호 ${changes.gateNumber}이(가) 이미 존재합니다`);
          return false;
        }
      }

      const now = new Date().toISOString();
      const updated: EntranceGateSheet = {
        ...current,
        gates: current.gates.map((g) =>
          g.id === id
            ? {
                ...g,
                ...changes,
                gateName: changes.gateName?.trim() ?? g.gateName,
                location:
                  changes.location !== undefined
                    ? changes.location?.trim() || undefined
                    : g.location,
                staffName:
                  changes.staffName !== undefined
                    ? changes.staffName?.trim() || undefined
                    : g.staffName,
                note:
                  changes.note !== undefined
                    ? changes.note?.trim() || undefined
                    : g.note,
                updatedAt: now,
              }
            : g
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.ENTRANCE.UPDATED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 게이트 삭제 ──
  const deleteGate = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();
      const updated: EntranceGateSheet = {
        ...current,
        gates: current.gates.filter((g) => g.id !== id),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.ENTRANCE.DELETED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 상태 변경 ──
  const changeStatus = useCallback(
    async (id: string, status: EntranceGateStatus): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();
      const updated: EntranceGateSheet = {
        ...current,
        gates: current.gates.map((g) =>
          g.id === id ? { ...g, status, updatedAt: now } : g
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      const label =
        status === "open" ? "열림" : status === "closed" ? "닫힘" : "대기";
      toast.success(`게이트 상태가 '${label}'으로 변경되었습니다`);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 카운트 증가 ──
  const incrementCount = useCallback(
    async (id: string, delta = 1): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const target = current.gates.find((g) => g.id === id);
      if (!target) return false;
      const now = new Date().toISOString();
      const updated: EntranceGateSheet = {
        ...current,
        gates: current.gates.map((g) =>
          g.id === id
            ? { ...g, count: Math.max(0, g.count + delta), updatedAt: now }
            : g
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 카운트 초기화 ──
  const resetCount = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();
      const updated: EntranceGateSheet = {
        ...current,
        gates: current.gates.map((g) =>
          g.id === id ? { ...g, count: 0, updatedAt: now } : g
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.ENTRANCE.RESET);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 전체 카운트 초기화 ──
  const resetAllCounts = useCallback(async (): Promise<boolean> => {
    const current = loadSheet(groupId, projectId);
    const now = new Date().toISOString();
    const updated: EntranceGateSheet = {
      ...current,
      gates: current.gates.map((g) => ({ ...g, count: 0, updatedAt: now })),
      updatedAt: now,
    };
    saveSheet(updated);
    await mutate(updated, false);
    toast.success(TOAST.ENTRANCE.RESET_ALL);
    return true;
  }, [groupId, projectId, mutate]);

  // ── 통계 ──
  const totalCount = gates.reduce((sum, g) => sum + g.count, 0);
  const openCount = gates.filter((g) => g.status === "open").length;
  const closedCount = gates.filter((g) => g.status === "closed").length;
  const standbyCount = gates.filter((g) => g.status === "standby").length;

  const stats = {
    gateCount: gates.length,
    totalCount,
    openCount,
    closedCount,
    standbyCount,
  };

  return {
    gates,
    loading: isLoading,
    refetch: () => mutate(),
    addGate,
    updateGate,
    deleteGate,
    changeStatus,
    incrementCount,
    resetCount,
    resetAllCounts,
    stats,
  };
}
