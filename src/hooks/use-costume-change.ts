"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import type { CostumeChangeEntry, CostumeChangeLocation } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:costume-change:${groupId}:${projectId}`;
}

function loadEntries(
  groupId: string,
  projectId: string
): CostumeChangeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as CostumeChangeEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  projectId: string,
  entries: CostumeChangeEntry[]
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

export type AddCostumeChangeInput = {
  songNumber: number;
  songName: string;
  memberNames: string[];
  costumeFrom: string;
  costumeTo: string;
  changeTimeSeconds: number;
  needsHelper: boolean;
  helperName?: string;
  location: CostumeChangeLocation;
  locationDetail?: string;
  notes?: string;
};

export type UpdateCostumeChangeInput = Partial<AddCostumeChangeInput>;

// ============================================================
// 훅
// ============================================================

export function useCostumeChange(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && projectId
      ? swrKeys.costumeChange(groupId, projectId)
      : null,
    async () => loadEntries(groupId, projectId)
  );

  const entries = (data ?? []).sort((a, b) => {
    if (a.songNumber !== b.songNumber) return a.songNumber - b.songNumber;
    return a.order - b.order;
  });

  // ── 항목 추가 ──
  const addEntry = useCallback(
    async (input: AddCostumeChangeInput): Promise<boolean> => {
      const current = loadEntries(groupId, projectId);
      const now = new Date().toISOString();
      const newEntry: CostumeChangeEntry = {
        id: crypto.randomUUID(),
        groupId,
        projectId,
        order: current.length,
        songNumber: input.songNumber,
        songName: input.songName.trim(),
        memberNames: input.memberNames
          .map((m) => m.trim())
          .filter(Boolean),
        costumeFrom: input.costumeFrom.trim(),
        costumeTo: input.costumeTo.trim(),
        changeTimeSeconds: input.changeTimeSeconds,
        needsHelper: input.needsHelper,
        helperName: input.helperName?.trim() || undefined,
        location: input.location,
        locationDetail: input.locationDetail?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...current, newEntry];
      saveEntries(groupId, projectId, updated);
      await mutate(updated, false);
      toast.success(TOAST.COSTUME_CHANGE.ADDED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 항목 수정 ──
  const updateEntry = useCallback(
    async (id: string, changes: UpdateCostumeChangeInput): Promise<boolean> => {
      const current = loadEntries(groupId, projectId);
      const target = current.find((e) => e.id === id);
      if (!target) {
        toast.error(TOAST.NOT_FOUND);
        return false;
      }

      const updated = current.map((e) => {
        if (e.id !== id) return e;
        return {
          ...e,
          ...(changes.songNumber !== undefined && {
            songNumber: changes.songNumber,
          }),
          ...(changes.songName !== undefined && {
            songName: changes.songName.trim(),
          }),
          ...(changes.memberNames !== undefined && {
            memberNames: changes.memberNames
              .map((m) => m.trim())
              .filter(Boolean),
          }),
          ...(changes.costumeFrom !== undefined && {
            costumeFrom: changes.costumeFrom.trim(),
          }),
          ...(changes.costumeTo !== undefined && {
            costumeTo: changes.costumeTo.trim(),
          }),
          ...(changes.changeTimeSeconds !== undefined && {
            changeTimeSeconds: changes.changeTimeSeconds,
          }),
          ...(changes.needsHelper !== undefined && {
            needsHelper: changes.needsHelper,
          }),
          ...(changes.helperName !== undefined && {
            helperName: changes.helperName.trim() || undefined,
          }),
          ...(changes.location !== undefined && {
            location: changes.location,
          }),
          ...(changes.locationDetail !== undefined && {
            locationDetail: changes.locationDetail.trim() || undefined,
          }),
          ...(changes.notes !== undefined && {
            notes: changes.notes.trim() || undefined,
          }),
          updatedAt: new Date().toISOString(),
        };
      });

      saveEntries(groupId, projectId, updated);
      await mutate(updated, false);
      toast.success(TOAST.COSTUME_CHANGE.UPDATED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 항목 삭제 ──
  const deleteEntry = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadEntries(groupId, projectId);
      const filtered = current
        .filter((e) => e.id !== id)
        .map((e, index) => ({ ...e, order: index }));

      saveEntries(groupId, projectId, filtered);
      await mutate(filtered, false);
      toast.success(TOAST.COSTUME_CHANGE.DELETED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 순서 변경 (위/아래) ──
  const moveEntry = useCallback(
    async (id: string, direction: "up" | "down"): Promise<boolean> => {
      const current = loadEntries(groupId, projectId);
      const sorted = [...current].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((e) => e.id === id);
      if (index === -1) return false;
      if (direction === "up" && index === 0) return false;
      if (direction === "down" && index === sorted.length - 1) return false;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [sorted[index], sorted[swapIndex]] = [sorted[swapIndex], sorted[index]];

      const withOrder = sorted.map((e, i) => ({ ...e, order: i }));
      saveEntries(groupId, projectId, withOrder);
      await mutate(withOrder, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 멤버별 필터 ──
  const filterByMember = useCallback(
    (memberName: string): CostumeChangeEntry[] => {
      if (!memberName.trim()) return entries;
      return entries.filter((e) =>
        e.memberNames.some((m) =>
          m.toLowerCase().includes(memberName.toLowerCase())
        )
      );
    },
    [entries]
  );

  // ── 통계 ──
  const stats = {
    total: entries.length,
    needsHelper: entries.filter((e) => e.needsHelper).length,
    avgSeconds:
      entries.length > 0
        ? Math.round(
            entries.reduce((sum, e) => sum + e.changeTimeSeconds, 0) /
              entries.length
          )
        : 0,
    fastChanges: entries.filter((e) => e.changeTimeSeconds <= 30).length,
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    moveEntry,
    filterByMember,
    stats,
  };
}
