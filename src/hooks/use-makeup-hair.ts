"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MakeupHairData,
  MakeupHairPlan,
  MakeupHairTimelineEntry,
  MakeupHairChecklistItem,
  MakeupHairArtist,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(projectId: string): string {
  return `dancebase:makeup-hair:${projectId}`;
}

function loadData(projectId: string): MakeupHairData {
  if (typeof window === "undefined") {
    return {
      projectId,
      plans: [],
      timeline: [],
      checklist: [],
      artists: [],
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) {
      return {
        projectId,
        plans: [],
        timeline: [],
        checklist: [],
        artists: [],
        updatedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(raw) as MakeupHairData;
  } catch {
    return {
      projectId,
      plans: [],
      timeline: [],
      checklist: [],
      artists: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

function saveData(projectId: string, data: MakeupHairData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useMakeupHair(projectId: string) {
  const { data, mutate, isLoading } = useSWR(
    projectId ? swrKeys.makeupHair(projectId) : null,
    () => loadData(projectId)
  );

  const current: MakeupHairData = data ?? {
    projectId,
    plans: [],
    timeline: [],
    checklist: [],
    artists: [],
    updatedAt: new Date().toISOString(),
  };

  const persist = useCallback(
    (next: MakeupHairData) => {
      saveData(projectId, next);
      mutate(next, false);
    },
    [projectId, mutate]
  );

  // ── 플랜 CRUD ─────────────────────────────────────────────

  const addPlan = useCallback(
    (partial: Omit<MakeupHairPlan, "id" | "createdAt">): MakeupHairPlan => {
      const newPlan: MakeupHairPlan = {
        id: crypto.randomUUID(),
        ...partial,
        createdAt: new Date().toISOString(),
      };
      persist({
        ...current,
        plans: [...current.plans, newPlan],
        updatedAt: new Date().toISOString(),
      });
      return newPlan;
    },
    [current, persist]
  );

  const updatePlan = useCallback(
    (planId: string, partial: Partial<Omit<MakeupHairPlan, "id" | "createdAt">>): boolean => {
      const idx = current.plans.findIndex((p) => p.id === planId);
      if (idx === -1) return false;
      const next = [...current.plans];
      next[idx] = { ...next[idx], ...partial };
      persist({ ...current, plans: next, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  const deletePlan = useCallback(
    (planId: string): boolean => {
      const filtered = current.plans.filter((p) => p.id !== planId);
      if (filtered.length === current.plans.length) return false;
      persist({ ...current, plans: filtered, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 타임라인 CRUD ─────────────────────────────────────────

  const addTimelineEntry = useCallback(
    (partial: Omit<MakeupHairTimelineEntry, "id">): MakeupHairTimelineEntry => {
      const entry: MakeupHairTimelineEntry = {
        id: crypto.randomUUID(),
        ...partial,
      };
      persist({
        ...current,
        timeline: [...current.timeline, entry],
        updatedAt: new Date().toISOString(),
      });
      return entry;
    },
    [current, persist]
  );

  const updateTimelineEntry = useCallback(
    (entryId: string, partial: Partial<Omit<MakeupHairTimelineEntry, "id">>): boolean => {
      const idx = current.timeline.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;
      const next = [...current.timeline];
      next[idx] = { ...next[idx], ...partial };
      persist({ ...current, timeline: next, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  const deleteTimelineEntry = useCallback(
    (entryId: string): boolean => {
      const filtered = current.timeline.filter((e) => e.id !== entryId);
      if (filtered.length === current.timeline.length) return false;
      persist({ ...current, timeline: filtered, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 체크리스트 CRUD ───────────────────────────────────────

  const addChecklistItem = useCallback(
    (itemName: string): MakeupHairChecklistItem => {
      const item: MakeupHairChecklistItem = {
        id: crypto.randomUUID(),
        item: itemName,
        checked: false,
      };
      persist({
        ...current,
        checklist: [...current.checklist, item],
        updatedAt: new Date().toISOString(),
      });
      return item;
    },
    [current, persist]
  );

  const toggleChecklistItem = useCallback(
    (itemId: string): boolean => {
      const idx = current.checklist.findIndex((c) => c.id === itemId);
      if (idx === -1) return false;
      const next = [...current.checklist];
      next[idx] = { ...next[idx], checked: !next[idx].checked };
      persist({ ...current, checklist: next, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  const deleteChecklistItem = useCallback(
    (itemId: string): boolean => {
      const filtered = current.checklist.filter((c) => c.id !== itemId);
      if (filtered.length === current.checklist.length) return false;
      persist({ ...current, checklist: filtered, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 아티스트 CRUD ─────────────────────────────────────────

  const addArtist = useCallback(
    (partial: Omit<MakeupHairArtist, "id">): MakeupHairArtist => {
      const artist: MakeupHairArtist = {
        id: crypto.randomUUID(),
        ...partial,
      };
      persist({
        ...current,
        artists: [...current.artists, artist],
        updatedAt: new Date().toISOString(),
      });
      return artist;
    },
    [current, persist]
  );

  const updateArtist = useCallback(
    (artistId: string, partial: Partial<Omit<MakeupHairArtist, "id">>): boolean => {
      const idx = current.artists.findIndex((a) => a.id === artistId);
      if (idx === -1) return false;
      const next = [...current.artists];
      next[idx] = { ...next[idx], ...partial };
      persist({ ...current, artists: next, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  const deleteArtist = useCallback(
    (artistId: string): boolean => {
      const filtered = current.artists.filter((a) => a.id !== artistId);
      if (filtered.length === current.artists.length) return false;
      persist({ ...current, artists: filtered, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 통계 ──────────────────────────────────────────────────

  const stats = {
    totalPlans: current.plans.length,
    checklistTotal: current.checklist.length,
    checklistDone: current.checklist.filter((c) => c.checked).length,
    makeupTypeCounts: {
      "내추럴": current.plans.filter((p) => p.makeupType === "내추럴").length,
      "스테이지": current.plans.filter((p) => p.makeupType === "스테이지").length,
      "특수분장": current.plans.filter((p) => p.makeupType === "특수분장").length,
    },
  };

  return {
    data: current,
    loading: isLoading,
    // 플랜
    addPlan,
    updatePlan,
    deletePlan,
    // 타임라인
    addTimelineEntry,
    updateTimelineEntry,
    deleteTimelineEntry,
    // 체크리스트
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    // 아티스트
    addArtist,
    updateArtist,
    deleteArtist,
    // 통계
    stats,
    refetch: () => mutate(),
  };
}
