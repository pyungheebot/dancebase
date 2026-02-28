"use client";

import { useState, useEffect, useCallback } from "react";
import type { SoundCueSheet, SoundCueEntry, SoundCueType, SoundCueAction } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:sound-cue:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): SoundCueSheet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as SoundCueSheet[];
  } catch {
    return [];
  }
}

function saveData(
  groupId: string,
  projectId: string,
  data: SoundCueSheet[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type SoundCueStats = {
  totalSheets: number;
  totalCues: number;
  activeCues: number;
};

// ============================================================
// 훅
// ============================================================

export function useSoundCue(groupId: string, projectId: string) {
  const [sheets, setSheets] = useState<SoundCueSheet[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadData(groupId, projectId);
    setSheets(data);
    setLoading(false);
  }, [groupId, projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: SoundCueSheet[]) => {
      saveData(groupId, projectId, next);
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
      partial: Omit<SoundCueEntry, "id" | "isActive">
    ): SoundCueEntry | null => {
      const sheetIdx = sheets.findIndex((s) => s.id === sheetId);
      if (sheetIdx === -1) return null;

      const newCue: SoundCueEntry = {
        id: crypto.randomUUID(),
        isActive: true,
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

  // ── 큐 순서 변경 ──────────────────────────────────────────

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

      const next = [...sheets];
      next[sheetIdx] = { ...next[sheetIdx], cues: reordered };
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

  // ── 통계 ──────────────────────────────────────────────────

  const stats: SoundCueStats = (() => {
    const totalSheets = sheets.length;
    const allCues = sheets.flatMap((s) => s.cues);
    const totalCues = allCues.length;
    const activeCues = allCues.filter((c) => c.isActive).length;
    return { totalSheets, totalCues, activeCues };
  })();

  return {
    sheets,
    loading,
    addSheet,
    updateSheet,
    deleteSheet,
    addCue,
    updateCue,
    deleteCue,
    reorderCues,
    toggleActive,
    stats,
    refetch: reload,
  };
}
