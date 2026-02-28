"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  StageEffectData,
  StageEffectEntry,
  StageEffectType,
  StageEffectIntensity,
  StageEffectTrigger,
  StageEffectSafetyLevel,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:stage-effect:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): StageEffectData {
  if (typeof window === "undefined") {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) {
      return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as StageEffectData;
  } catch {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: StageEffectData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(data.groupId, data.projectId),
      JSON.stringify(data)
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useStageEffect(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.stageEffect(groupId, projectId),
    () => loadData(groupId, projectId),
    {
      fallbackData: {
        groupId,
        projectId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: StageEffectEntry[] = data?.entries ?? [];

  // 큐 추가
  const addEntry = useCallback(
    (params: {
      cueNumber: string;
      effectType: StageEffectType;
      triggerTime: string;
      durationSec: number;
      intensity: StageEffectIntensity;
      intensityCustom?: string;
      trigger: StageEffectTrigger;
      position: string;
      safetyLevel: StageEffectSafetyLevel;
      safetyNotes?: string;
      operator?: string;
      notes?: string;
    }): StageEffectEntry => {
      const current = loadData(groupId, projectId);
      const now = new Date().toISOString();
      const newEntry: StageEffectEntry = {
        id: crypto.randomUUID(),
        cueNumber: params.cueNumber.trim(),
        effectType: params.effectType,
        triggerTime: params.triggerTime.trim(),
        durationSec: params.durationSec,
        intensity: params.intensity,
        intensityCustom: params.intensityCustom?.trim() || undefined,
        trigger: params.trigger,
        position: params.position.trim(),
        safetyLevel: params.safetyLevel,
        safetyNotes: params.safetyNotes?.trim() || undefined,
        operator: params.operator?.trim() || undefined,
        notes: params.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      // 큐 번호 순서로 정렬 후 삽입
      const updatedEntries = [...current.entries, newEntry].sort(
        (a, b) => compareCueNumbers(a.cueNumber, b.cueNumber)
      );
      const updated: StageEffectData = {
        ...current,
        entries: updatedEntries,
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated, false);
      return newEntry;
    },
    [groupId, projectId, mutate]
  );

  // 큐 수정
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        cueNumber: string;
        effectType: StageEffectType;
        triggerTime: string;
        durationSec: number;
        intensity: StageEffectIntensity;
        intensityCustom: string;
        trigger: StageEffectTrigger;
        position: string;
        safetyLevel: StageEffectSafetyLevel;
        safetyNotes: string;
        operator: string;
        notes: string;
      }>
    ): boolean => {
      const current = loadData(groupId, projectId);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: StageEffectEntry = {
        ...existing,
        ...params,
        intensityCustom: params.intensityCustom?.trim() || existing.intensityCustom,
        safetyNotes: params.safetyNotes?.trim() || existing.safetyNotes,
        operator: params.operator?.trim() || existing.operator,
        notes: params.notes?.trim() || existing.notes,
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = current.entries.map((e) =>
        e.id === entryId ? updatedEntry : e
      ).sort((a, b) => compareCueNumbers(a.cueNumber, b.cueNumber));

      const updated: StageEffectData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 큐 삭제
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadData(groupId, projectId);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: StageEffectData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 통계
  const stats = (() => {
    const totalCount = entries.length;
    const dangerCount = entries.filter((e) => e.safetyLevel === "danger").length;
    const cautionCount = entries.filter((e) => e.safetyLevel === "caution").length;
    const safeCount = entries.filter((e) => e.safetyLevel === "safe").length;
    const typeBreakdown = entries.reduce<Record<StageEffectType, number>>(
      (acc, e) => {
        acc[e.effectType] = (acc[e.effectType] ?? 0) + 1;
        return acc;
      },
      {} as Record<StageEffectType, number>
    );
    return { totalCount, dangerCount, cautionCount, safeCount, typeBreakdown };
  })();

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    stats,
  };
}

// ============================================
// 큐 번호 정렬 유틸 (1, 1A, 2, 2.5, 3 순서)
// ============================================

function compareCueNumbers(a: string, b: string): number {
  const parseNum = (s: string) => {
    const match = s.match(/^(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };
  const na = parseNum(a);
  const nb = parseNum(b);
  if (na !== nb) return na - nb;
  return a.localeCompare(b);
}
