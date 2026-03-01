"use client";

import { useState, useCallback, useMemo } from "react";
import type { SoundCueSheet, SoundCueEntry, SoundCueType } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:sound-cue:${groupId}:${projectId}`;
}

// ============================================================
// 시간 문자열 파싱 유틸 (MM:SS -> 초)
// ============================================================

export function parseTimeToSeconds(time: string): number {
  if (!time) return 0;
  const parts = time.split(":").map(Number);
  if (parts.length === 2) {
    const [m, s] = parts;
    return (m || 0) * 60 + (s || 0);
  }
  return 0;
}

// ============================================================
// 통계 타입
// ============================================================

export type SoundCueTypeStats = {
  type: SoundCueType;
  count: number;
};

export type SoundCueStats = {
  totalSheets: number;
  totalCues: number;
  activeCues: number;
  checkedCues: number;
  typeDistribution: SoundCueTypeStats[];
  /** 총 런타임 (초) */
  totalRuntimeSec: number;
  /** 총 런타임 표시 문자열 */
  totalRuntimeLabel: string;
};

// ============================================================
// 훅
// ============================================================

export function useSoundCue(groupId: string, projectId: string) {
  const [sheets, setSheets] = useState<SoundCueSheet[]>(() => loadFromStorage<SoundCueSheet[]>(storageKey(groupId, projectId), []));

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadFromStorage<SoundCueSheet[]>(storageKey(groupId, projectId), []);
    setSheets(data);
  }, [groupId, projectId]);

  const persist = useCallback(
    (next: SoundCueSheet[]) => {
      saveToStorage(storageKey(groupId, projectId), next);
      setSheets(next);
    },
    [groupId, projectId]
  );

  // ── 시트(Sheet) CRUD ───────────────────────────────────────

  const addSheet = useCallback(
    (title: string): SoundCueSheet => {
      const newSheet: SoundCueSheet = {
        id: crypto.randomUUID(),
        projectId,
        title,
        cues: [],
        createdAt: new Date().toISOString(),
      };
      const next = [...sheets, newSheet];
      persist(next);
      return newSheet;
    },
    [sheets, persist, projectId]
  );

  const updateSheet = useCallback(
    (sheetId: string, title: string): boolean => {
      const idx = sheets.findIndex((s) => s.id === sheetId);
      if (idx === -1) return false;
      const next = [...sheets];
      next[idx] = { ...next[idx], title };
      persist(next);
      return true;
    },
    [sheets, persist]
  );

  const deleteSheet = useCallback(
    (sheetId: string): boolean => {
      const next = sheets.filter((s) => s.id !== sheetId);
      if (next.length === sheets.length) return false;
      persist(next);
      return true;
    },
    [sheets, persist]
  );

  // ── 큐(Cue) CRUD ──────────────────────────────────────────

  const addCue = useCallback(
    (
      sheetId: string,
      partial: Omit<SoundCueEntry, "id" | "isActive" | "isChecked">
    ): SoundCueEntry | null => {
      const sheetIdx = sheets.findIndex((s) => s.id === sheetId);
      if (sheetIdx === -1) return null;

      const newCue: SoundCueEntry = {
        id: crypto.randomUUID(),
        isActive: true,
        isChecked: false,
        ...partial,
      };

      const next = [...sheets];
      next[sheetIdx] = {
        ...next[sheetIdx],
        cues: [...next[sheetIdx].cues, newCue],
      };
      persist(next);
      return newCue;
    },
    [sheets, persist]
  );

  const updateCue = useCallback(
    (
      sheetId: string,
      cueId: string,
      partial: Partial<Omit<SoundCueEntry, "id">>
    ): boolean => {
      const sheetIdx = sheets.findIndex((s) => s.id === sheetId);
      if (sheetIdx === -1) return false;

      const cueIdx = sheets[sheetIdx].cues.findIndex((c) => c.id === cueId);
      if (cueIdx === -1) return false;

      const next = [...sheets];
      const updatedCues = [...next[sheetIdx].cues];
      updatedCues[cueIdx] = { ...updatedCues[cueIdx], ...partial };
      next[sheetIdx] = { ...next[sheetIdx], cues: updatedCues };
      persist(next);
      return true;
    },
    [sheets, persist]
  );

  const deleteCue = useCallback(
    (sheetId: string, cueId: string): boolean => {
      const sheetIdx = sheets.findIndex((s) => s.id === sheetId);
      if (sheetIdx === -1) return false;

      const filtered = sheets[sheetIdx].cues.filter((c) => c.id !== cueId);
      if (filtered.length === sheets[sheetIdx].cues.length) return false;

      const next = [...sheets];
      next[sheetIdx] = { ...next[sheetIdx], cues: filtered };
      persist(next);
      return true;
    },
    [sheets, persist]
  );

  // ── 큐 순서 변경 (위/아래) ────────────────────────────────

  const moveCueUp = useCallback(
    (sheetId: string, cueId: string): boolean => {
      const sheetIdx = sheets.findIndex((s) => s.id === sheetId);
      if (sheetIdx === -1) return false;

      const cues = [...sheets[sheetIdx].cues];
      const cueIdx = cues.findIndex((c) => c.id === cueId);
      if (cueIdx <= 0) return false;

      // 배열 요소 교환
      [cues[cueIdx - 1], cues[cueIdx]] = [cues[cueIdx], cues[cueIdx - 1]];
      // cueNumber 재정렬
      const renumbered = cues.map((c, i) => ({ ...c, cueNumber: i + 1 }));

      const next = [...sheets];
      next[sheetIdx] = { ...next[sheetIdx], cues: renumbered };
      persist(next);
      return true;
    },
    [sheets, persist]
  );

  const moveCueDown = useCallback(
    (sheetId: string, cueId: string): boolean => {
      const sheetIdx = sheets.findIndex((s) => s.id === sheetId);
      if (sheetIdx === -1) return false;

      const cues = [...sheets[sheetIdx].cues];
      const cueIdx = cues.findIndex((c) => c.id === cueId);
      if (cueIdx === -1 || cueIdx >= cues.length - 1) return false;

      [cues[cueIdx], cues[cueIdx + 1]] = [cues[cueIdx + 1], cues[cueIdx]];
      const renumbered = cues.map((c, i) => ({ ...c, cueNumber: i + 1 }));

      const next = [...sheets];
      next[sheetIdx] = { ...next[sheetIdx], cues: renumbered };
      persist(next);
      return true;
    },
    [sheets, persist]
  );

  const reorderCues = useCallback(
    (sheetId: string, orderedIds: string[]): boolean => {
      const sheetIdx = sheets.findIndex((s) => s.id === sheetId);
      if (sheetIdx === -1) return false;

      const cueMap = new Map(
        sheets[sheetIdx].cues.map((c) => [c.id, c])
      );
      const reordered = orderedIds
        .map((id) => cueMap.get(id))
        .filter((c): c is SoundCueEntry => c !== undefined);

      if (reordered.length !== sheets[sheetIdx].cues.length) return false;

      const renumbered = reordered.map((c, i) => ({ ...c, cueNumber: i + 1 }));
      const next = [...sheets];
      next[sheetIdx] = { ...next[sheetIdx], cues: renumbered };
      persist(next);
      return true;
    },
    [sheets, persist]
  );

  // ── 활성화 토글 ───────────────────────────────────────────

  const toggleActive = useCallback(
    (sheetId: string, cueId: string): boolean => {
      const sheetIdx = sheets.findIndex((s) => s.id === sheetId);
      if (sheetIdx === -1) return false;

      const cueIdx = sheets[sheetIdx].cues.findIndex((c) => c.id === cueId);
      if (cueIdx === -1) return false;

      const next = [...sheets];
      const updatedCues = [...next[sheetIdx].cues];
      updatedCues[cueIdx] = {
        ...updatedCues[cueIdx],
        isActive: !updatedCues[cueIdx].isActive,
      };
      next[sheetIdx] = { ...next[sheetIdx], cues: updatedCues };
      persist(next);
      return true;
    },
    [sheets, persist]
  );

  // ── 체크 완료 토글 ────────────────────────────────────────

  const toggleChecked = useCallback(
    (sheetId: string, cueId: string): boolean => {
      const sheetIdx = sheets.findIndex((s) => s.id === sheetId);
      if (sheetIdx === -1) return false;

      const cueIdx = sheets[sheetIdx].cues.findIndex((c) => c.id === cueId);
      if (cueIdx === -1) return false;

      const next = [...sheets];
      const updatedCues = [...next[sheetIdx].cues];
      updatedCues[cueIdx] = {
        ...updatedCues[cueIdx],
        isChecked: !updatedCues[cueIdx].isChecked,
      };
      next[sheetIdx] = { ...next[sheetIdx], cues: updatedCues };
      persist(next);
      return true;
    },
    [sheets, persist]
  );

  // ── 통계 (useMemo로 최적화) ───────────────────────────────

  const stats: SoundCueStats = useMemo(() => {
    const totalSheets = sheets.length;
    const allCues = sheets.flatMap((s) => s.cues);
    const totalCues = allCues.length;
    const activeCues = allCues.filter((c) => c.isActive).length;
    const checkedCues = allCues.filter((c) => c.isChecked).length;

    // 유형별 분포
    const typeCount = new Map<SoundCueType, number>();
    for (const cue of allCues) {
      typeCount.set(cue.type, (typeCount.get(cue.type) ?? 0) + 1);
    }
    const typeDistribution: SoundCueTypeStats[] = Array.from(
      typeCount.entries()
    ).map(([type, count]) => ({ type, count }));

    // 총 런타임 계산 (startTime-endTime 차이 합산)
    let totalRuntimeSec = 0;
    for (const cue of allCues) {
      if (cue.startTime && cue.endTime) {
        const start = parseTimeToSeconds(cue.startTime);
        const end = parseTimeToSeconds(cue.endTime);
        if (end > start) totalRuntimeSec += end - start;
      }
    }
    const runtimeMin = Math.floor(totalRuntimeSec / 60);
    const runtimeSec = totalRuntimeSec % 60;
    const totalRuntimeLabel =
      totalRuntimeSec > 0
        ? `${runtimeMin}분 ${runtimeSec}초`
        : "-";

    return {
      totalSheets,
      totalCues,
      activeCues,
      checkedCues,
      typeDistribution,
      totalRuntimeSec,
      totalRuntimeLabel,
    };
  }, [sheets]);

  return {
    sheets,
    loading: false,
    addSheet,
    updateSheet,
    deleteSheet,
    addCue,
    updateCue,
    deleteCue,
    moveCueUp,
    moveCueDown,
    reorderCues,
    toggleActive,
    toggleChecked,
    stats,
    refetch: reload,
  };
}
