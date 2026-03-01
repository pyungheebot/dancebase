"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AudienceCountEntry,
  AudienceCountRecord,
  AudienceCountSheet,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:audience-count:${groupId}:${projectId}`;
}

function loadSheet(groupId: string, projectId: string): AudienceCountSheet {
  if (typeof window === "undefined") {
    return { groupId, projectId, records: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    if (raw) return JSON.parse(raw) as AudienceCountSheet;
  } catch {
    // 파싱 실패 시 빈 시트 반환
  }
  return { groupId, projectId, records: [], updatedAt: new Date().toISOString() };
}

function saveSheet(sheet: AudienceCountSheet): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(sheet.groupId, sheet.projectId),
      JSON.stringify(sheet)
    );
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 유틸 계산 함수
// ============================================================

/** 점유율(%) 계산 */
export function calcOccupancyRate(totalSeats: number, actualCount: number): number {
  if (totalSeats <= 0) return 0;
  return Math.min(100, Math.round((actualCount / totalSeats) * 100));
}

/** 유형별 합계 계산 */
export function calcByTypeTotal(
  byType: AudienceCountRecord["byType"]
): number {
  return byType.paid + byType.invited + byType.free + byType.staff;
}

// ============================================================
// 입력 타입
// ============================================================

export type AddAudienceCountInput = AudienceCountEntry;

export type UpdateAudienceCountInput = Partial<AudienceCountEntry>;

// ============================================================
// 훅
// ============================================================

export function useAudienceCount(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && projectId ? swrKeys.audienceCount(groupId, projectId) : null,
    async () => loadSheet(groupId, projectId)
  );

  const sheet = data ?? {
    groupId,
    projectId,
    records: [],
    updatedAt: new Date().toISOString(),
  };

  // 회차 번호 오름차순 정렬
  const records = [...sheet.records].sort(
    (a, b) => a.sessionNumber - b.sessionNumber
  );

  // ── 기록 추가 ──
  const addRecord = useCallback(
    async (input: AddAudienceCountInput): Promise<boolean> => {
      if (!input.date) {
        toast.error(TOAST.AUDIENCE.DATE_REQUIRED);
        return false;
      }
      if (input.totalSeats <= 0) {
        toast.error(TOAST.AUDIENCE.SEAT_REQUIRED);
        return false;
      }
      if (input.actualCount < 0) {
        toast.error(TOAST.AUDIENCE.COUNT_REQUIRED);
        return false;
      }

      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();

      // 회차 번호 자동 부여 (미입력 시)
      const nextSessionNumber =
        input.sessionNumber ||
        (current.records.length > 0
          ? Math.max(...current.records.map((r) => r.sessionNumber)) + 1
          : 1);

      const newRecord: AudienceCountRecord = {
        id: crypto.randomUUID(),
        sessionNumber: nextSessionNumber,
        sessionLabel: input.sessionLabel?.trim() || undefined,
        date: input.date,
        totalSeats: input.totalSeats,
        actualCount: input.actualCount,
        vipCount: input.vipCount,
        byType: { ...input.byType },
        note: input.note?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const updated: AudienceCountSheet = {
        ...current,
        records: [...current.records, newRecord],
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.AUDIENCE.ADDED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 기록 수정 ──
  const updateRecord = useCallback(
    async (id: string, changes: UpdateAudienceCountInput): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const target = current.records.find((r) => r.id === id);
      if (!target) {
        toast.error(TOAST.NOT_FOUND);
        return false;
      }

      const now = new Date().toISOString();
      const updated: AudienceCountSheet = {
        ...current,
        records: current.records.map((r) =>
          r.id === id
            ? {
                ...r,
                sessionNumber:
                  changes.sessionNumber !== undefined
                    ? changes.sessionNumber
                    : r.sessionNumber,
                sessionLabel:
                  changes.sessionLabel !== undefined
                    ? changes.sessionLabel?.trim() || undefined
                    : r.sessionLabel,
                date:
                  changes.date !== undefined ? changes.date : r.date,
                totalSeats:
                  changes.totalSeats !== undefined
                    ? changes.totalSeats
                    : r.totalSeats,
                actualCount:
                  changes.actualCount !== undefined
                    ? changes.actualCount
                    : r.actualCount,
                vipCount:
                  changes.vipCount !== undefined ? changes.vipCount : r.vipCount,
                byType:
                  changes.byType !== undefined
                    ? { ...r.byType, ...changes.byType }
                    : r.byType,
                note:
                  changes.note !== undefined
                    ? changes.note?.trim() || undefined
                    : r.note,
                updatedAt: now,
              }
            : r
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.ITEM_UPDATED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 기록 삭제 ──
  const deleteRecord = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();
      const updated: AudienceCountSheet = {
        ...current,
        records: current.records.filter((r) => r.id !== id),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.ITEM_DELETED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 통계 ──
  const totalActual = records.reduce((sum, r) => sum + r.actualCount, 0);
  const totalSeats = records.reduce((sum, r) => sum + r.totalSeats, 0);
  const totalVip = records.reduce((sum, r) => sum + r.vipCount, 0);
  const avgOccupancy =
    records.length > 0
      ? Math.round(
          records.reduce(
            (sum, r) => sum + calcOccupancyRate(r.totalSeats, r.actualCount),
            0
          ) / records.length
        )
      : 0;

  const totalByType = records.reduce(
    (acc, r) => ({
      paid: acc.paid + r.byType.paid,
      invited: acc.invited + r.byType.invited,
      free: acc.free + r.byType.free,
      staff: acc.staff + r.byType.staff,
    }),
    { paid: 0, invited: 0, free: 0, staff: 0 }
  );

  const stats = {
    sessionCount: records.length,
    totalActual,
    totalSeats,
    totalVip,
    avgOccupancy,
    overallOccupancy: calcOccupancyRate(totalSeats, totalActual),
    totalByType,
  };

  return {
    records,
    loading: isLoading,
    refetch: () => mutate(),
    addRecord,
    updateRecord,
    deleteRecord,
    stats,
    calcOccupancyRate,
  };
}
