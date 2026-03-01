"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { MusicCuesheet, CueEntry, CueAction } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================
// localStorage 유틸리티
// ============================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:music-cuesheet:${groupId}:${projectId}`;
}

// ============================================
// 유틸리티: 시간 파싱 및 계산
// ============================================

/** "MM:SS" 문자열을 초 단위로 변환 */
function parseTimeToSeconds(time: string): number {
  const parts = time.split(":");
  if (parts.length !== 2) return 0;
  const m = parseInt(parts[0], 10) || 0;
  const s = parseInt(parts[1], 10) || 0;
  return Math.max(0, m * 60 + s);
}

/** 초를 "MM:SS" 형식으로 변환 */
export function formatSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 큐시트의 총 시간 계산 (모든 항목 duration 합산) */
function calcTotalDuration(entries: CueEntry[]): string {
  const totalSec = entries.reduce(
    (sum, e) => sum + parseTimeToSeconds(e.duration),
    0
  );
  return formatSeconds(totalSec);
}

// ============================================
// 훅
// ============================================

export function useMusicCuesheet(groupId: string, projectId: string) {
  const key = swrKeys.musicCuesheet(groupId, projectId);

  const { data, mutate } = useSWR<MusicCuesheet[]>(key, () =>
    loadFromStorage<MusicCuesheet[]>(getStorageKey(groupId, projectId), [])
  );

  const cuesheets: MusicCuesheet[] = useMemo(() => data ?? [], [data]);

  /** 내부 상태 + localStorage 동기 업데이트 */
  const update = useCallback(
    (next: MusicCuesheet[]) => {
      saveToStorage(getStorageKey(groupId, projectId), next);
      mutate(next, false);
    },
    [groupId, projectId, mutate]
  );

  // ============================================
  // 큐시트 CRUD
  // ============================================

  /** 큐시트 생성 */
  const addCuesheet = useCallback(
    (title: string) => {
      const now = new Date().toISOString();
      const newSheet: MusicCuesheet = {
        id: crypto.randomUUID(),
        title: title.trim(),
        entries: [],
        totalDuration: "00:00",
        createdAt: now,
        updatedAt: now,
      };
      update([...cuesheets, newSheet]);
    },
    [cuesheets, update]
  );

  /** 큐시트 삭제 */
  const deleteCuesheet = useCallback(
    (id: string) => {
      update(cuesheets.filter((cs) => cs.id !== id));
    },
    [cuesheets, update]
  );

  // ============================================
  // 큐 항목 CRUD
  // ============================================

  /** 큐 항목 추가 (order 자동 계산) */
  const addCue = useCallback(
    (
      cuesheetId: string,
      entry: Omit<CueEntry, "id" | "order">
    ) => {
      const now = new Date().toISOString();
      const next = cuesheets.map((cs) => {
        if (cs.id !== cuesheetId) return cs;
        const newEntry: CueEntry = {
          ...entry,
          id: crypto.randomUUID(),
          order: cs.entries.length + 1,
        };
        const entries = [...cs.entries, newEntry];
        return {
          ...cs,
          entries,
          totalDuration: calcTotalDuration(entries),
          updatedAt: now,
        };
      });
      update(next);
    },
    [cuesheets, update]
  );

  /** 큐 항목 삭제 */
  const removeCue = useCallback(
    (cuesheetId: string, cueId: string) => {
      const now = new Date().toISOString();
      const next = cuesheets.map((cs) => {
        if (cs.id !== cuesheetId) return cs;
        const entries = cs.entries
          .filter((e) => e.id !== cueId)
          .map((e, idx) => ({ ...e, order: idx + 1 }));
        return {
          ...cs,
          entries,
          totalDuration: calcTotalDuration(entries),
          updatedAt: now,
        };
      });
      update(next);
    },
    [cuesheets, update]
  );

  /** 큐 항목 순서 변경 */
  const reorderCue = useCallback(
    (cuesheetId: string, cueId: string, newOrder: number) => {
      const now = new Date().toISOString();
      const next = cuesheets.map((cs) => {
        if (cs.id !== cuesheetId) return cs;
        const entries = [...cs.entries];
        const fromIdx = entries.findIndex((e) => e.id === cueId);
        if (fromIdx === -1) return cs;
        const toIdx = Math.max(0, Math.min(entries.length - 1, newOrder - 1));
        const [moved] = entries.splice(fromIdx, 1);
        entries.splice(toIdx, 0, moved);
        const reordered = entries.map((e, idx) => ({ ...e, order: idx + 1 }));
        return {
          ...cs,
          entries: reordered,
          totalDuration: calcTotalDuration(reordered),
          updatedAt: now,
        };
      });
      update(next);
    },
    [cuesheets, update]
  );

  /** 큐 항목 수정 */
  const updateCue = useCallback(
    (cuesheetId: string, cueId: string, patch: Partial<Omit<CueEntry, "id" | "order">>) => {
      const now = new Date().toISOString();
      const next = cuesheets.map((cs) => {
        if (cs.id !== cuesheetId) return cs;
        const entries = cs.entries.map((e) =>
          e.id === cueId ? { ...e, ...patch } : e
        );
        return {
          ...cs,
          entries,
          totalDuration: calcTotalDuration(entries),
          updatedAt: now,
        };
      });
      update(next);
    },
    [cuesheets, update]
  );

  /** 특정 큐시트의 총 시간 반환 */
  const calculateTotalDuration = useCallback(
    (cuesheetId: string): string => {
      const cs = cuesheets.find((c) => c.id === cuesheetId);
      if (!cs) return "00:00";
      return calcTotalDuration(cs.entries);
    },
    [cuesheets]
  );

  // ============================================
  // 통계
  // ============================================

  const totalCuesheets = cuesheets.length;
  const activeCuesheet = cuesheets.length > 0 ? cuesheets[cuesheets.length - 1] : null;

  return {
    cuesheets,
    totalCuesheets,
    activeCuesheet,
    addCuesheet,
    deleteCuesheet,
    addCue,
    removeCue,
    reorderCue,
    updateCue,
    calculateTotalDuration,
    refetch: () => mutate(),
  };
}

export type { CueAction };
