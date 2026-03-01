"use client";

import { useState, useCallback } from "react";
import type { ChoreoSectionEntry, ChoreoSectionDifficulty } from "@/types";

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:choreo-section:${groupId}:${projectId}`;
}

function loadSections(groupId: string, projectId: string): ChoreoSectionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as ChoreoSectionEntry[];
  } catch {
    return [];
  }
}

function saveSections(
  groupId: string,
  projectId: string,
  sections: ChoreoSectionEntry[]
): void {
  localStorage.setItem(
    getStorageKey(groupId, projectId),
    JSON.stringify(sections)
  );
}

// ============================================
// 훅
// ============================================

export function useChoreoSection(groupId: string, projectId: string) {
  const [sections, setSections] = useState<ChoreoSectionEntry[]>([]);


  // 상태 업데이트 + localStorage 동기화
  const updateSections = useCallback(
    (updater: (prev: ChoreoSectionEntry[]) => ChoreoSectionEntry[]) => {
      setSections((prev) => {
        const next = updater(prev);
        saveSections(groupId, projectId, next);
        return next;
      });
    },
    [groupId, projectId]
  );

  // 구간 추가
  const addSection = useCallback(
    (
      name: string,
      startTime: string,
      endTime: string,
      difficulty: ChoreoSectionDifficulty,
      keyMoves: string[],
      assignedMembers: string[],
      notes?: string
    ) => {
      const trimmedName = name.trim();
      if (!trimmedName) return false;

      updateSections((prev) => {
        const maxOrder = prev.length > 0 ? Math.max(...prev.map((s) => s.order)) : -1;
        const newSection: ChoreoSectionEntry = {
          id: crypto.randomUUID(),
          name: trimmedName,
          startTime,
          endTime,
          difficulty,
          completionRate: 0,
          keyMoves,
          assignedMembers,
          notes: notes?.trim() || undefined,
          order: maxOrder + 1,
          createdAt: new Date().toISOString(),
        };
        return [...prev, newSection];
      });
      return true;
    },
    [updateSections]
  );

  // 구간 수정
  const updateSection = useCallback(
    (id: string, patch: Partial<Omit<ChoreoSectionEntry, "id" | "createdAt">>) => {
      updateSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    [updateSections]
  );

  // 구간 삭제
  const deleteSection = useCallback(
    (id: string) => {
      updateSections((prev) => {
        const filtered = prev.filter((s) => s.id !== id);
        // order 재정렬
        return filtered.map((s, i) => ({ ...s, order: i }));
      });
    },
    [updateSections]
  );

  // 완성도 업데이트
  const updateCompletionRate = useCallback(
    (id: string, rate: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(rate)));
      updateSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, completionRate: clamped } : s))
      );
    },
    [updateSections]
  );

  // 순서 변경
  const moveSection = useCallback(
    (id: string, direction: "up" | "down") => {
      updateSections((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((s) => s.id === id);
        if (idx === -1) return prev;
        if (direction === "up" && idx === 0) return prev;
        if (direction === "down" && idx === sorted.length - 1) return prev;

        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        const newSorted = [...sorted];
        // order 값 교환
        const tempOrder = newSorted[idx].order;
        newSorted[idx] = { ...newSorted[idx], order: newSorted[swapIdx].order };
        newSorted[swapIdx] = { ...newSorted[swapIdx], order: tempOrder };
        return newSorted;
      });
    },
    [updateSections]
  );

  // ============================================
  // 통계
  // ============================================

  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const totalSections = sections.length;

  const averageDifficulty =
    totalSections > 0
      ? Math.round(
          (sections.reduce((sum, s) => sum + s.difficulty, 0) / totalSections) * 10
        ) / 10
      : 0;

  const averageCompletion =
    totalSections > 0
      ? Math.round(
          sections.reduce((sum, s) => sum + s.completionRate, 0) / totalSections
        )
      : 0;

  const hardestSection =
    totalSections > 0
      ? [...sections].sort((a, b) => b.difficulty - a.difficulty)[0].name
      : null;

  const leastCompletedSection =
    totalSections > 0
      ? [...sections].sort((a, b) => a.completionRate - b.completionRate)[0].name
      : null;

  return {
    sections: sorted,
    loading: false,
    totalSections,
    averageDifficulty,
    averageCompletion,
    hardestSection,
    leastCompletedSection,
    addSection,
    updateSection,
    deleteSection,
    updateCompletionRate,
    moveSection,
  };
}
