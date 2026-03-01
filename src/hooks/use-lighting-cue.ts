"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  LightingCueEntry,
  LightingCueAction,
  LightingCueColor,
} from "@/types";

// ============================================
// localStorage 유틸리티
// ============================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:lighting-cue:${groupId}:${projectId}`;
}

// ============================================
// 유틸리티: 타임스탬프 파싱
// ============================================

/** "MM:SS" 문자열을 초 단위로 변환 */
export function parseTimestamp(ts: string): number {
  const parts = ts.split(":");
  if (parts.length !== 2) return 0;
  const m = parseInt(parts[0], 10) || 0;
  const s = parseInt(parts[1], 10) || 0;
  return Math.max(0, m * 60 + s);
}

/** 초를 "MM:SS" 형식으로 변환 */
export function formatTimestamp(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ============================================
// 훅
// ============================================

export function useLightingCue(groupId: string, projectId: string) {
  const key = swrKeys.lightingCue(groupId, projectId);

  const { data, mutate } = useSWR<LightingCueEntry[]>(key, () =>
    loadFromStorage<LightingCueEntry[]>(getStorageKey(groupId, projectId), [])
  );

  const cues: LightingCueEntry[] = useMemo(() => data ?? [], [data]);

  /** 내부 상태 + localStorage 동기 업데이트 */
  const update = useCallback(
    (next: LightingCueEntry[]) => {
      saveToStorage(getStorageKey(groupId, projectId), next);
      mutate(next, false);
    },
    [groupId, projectId, mutate]
  );

  // ============================================
  // CRUD
  // ============================================

  /** 큐 추가 (cueNumber 자동 부여, timestamp 기준 정렬 유지) */
  const addCue = useCallback(
    (
      timestamp: string,
      action: LightingCueAction,
      color: LightingCueColor | undefined,
      intensity: number,
      zone: string,
      notes?: string
    ) => {
      const newCue: LightingCueEntry = {
        id: crypto.randomUUID(),
        cueNumber: 0, // reorderCues 에서 재계산
        timestamp,
        action,
        color,
        intensity: Math.max(0, Math.min(100, intensity)),
        zone: zone.trim(),
        notes: notes?.trim(),
        createdAt: new Date().toISOString(),
      };
      const sorted = [...cues, newCue].sort(
        (a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)
      );
      const renumbered = sorted.map((c, idx) => ({
        ...c,
        cueNumber: idx + 1,
      }));
      update(renumbered);
    },
    [cues, update]
  );

  /** 큐 수정 */
  const updateCue = useCallback(
    (id: string, patch: Partial<Omit<LightingCueEntry, "id" | "createdAt">>) => {
      const patched = cues.map((c) => (c.id === id ? { ...c, ...patch } : c));
      // timestamp 변경 시 재정렬
      const sorted = patched.sort(
        (a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)
      );
      const renumbered = sorted.map((c, idx) => ({
        ...c,
        cueNumber: idx + 1,
      }));
      update(renumbered);
    },
    [cues, update]
  );

  /** 큐 삭제 */
  const deleteCue = useCallback(
    (id: string) => {
      const filtered = cues
        .filter((c) => c.id !== id)
        .map((c, idx) => ({ ...c, cueNumber: idx + 1 }));
      update(filtered);
    },
    [cues, update]
  );

  /** timestamp 기준 cueNumber 재정렬 */
  const reorderCues = useCallback(() => {
    const sorted = [...cues]
      .sort(
        (a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)
      )
      .map((c, idx) => ({ ...c, cueNumber: idx + 1 }));
    update(sorted);
  }, [cues, update]);

  /** 구역별 조회 */
  const getByZone = useCallback(
    (zone: string): LightingCueEntry[] => {
      return cues.filter((c) => c.zone === zone);
    },
    [cues]
  );

  // ============================================
  // 통계
  // ============================================

  const totalCues = cues.length;

  /** 고유 구역 목록 */
  const zones: string[] = Array.from(new Set(cues.map((c) => c.zone))).filter(
    Boolean
  );

  /** 마지막 큐 timestamp (전체 공연 길이 참고용) */
  const totalDuration: string =
    cues.length > 0
      ? cues.reduce((max, c) => {
          return parseTimestamp(c.timestamp) > parseTimestamp(max)
            ? c.timestamp
            : max;
        }, "00:00")
      : "00:00";

  return {
    cues,
    totalCues,
    zones,
    totalDuration,
    addCue,
    updateCue,
    deleteCue,
    reorderCues,
    getByZone,
    refetch: () => mutate(),
  };
}
