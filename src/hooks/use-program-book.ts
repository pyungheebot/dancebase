"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  ProgramBookData,
  ProgramBookSection,
  ProgramSectionType,
} from "@/types";

// ============================================================
// 필수 섹션 유형 정의
// ============================================================

const REQUIRED_SECTION_TYPES: ProgramSectionType[] = [
  "cover",
  "program_list",
  "performer_intro",
];

// ============================================================
// localStorage 유틸
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:program-book:${groupId}:${projectId}`;
}

// ============================================================
// 훅
// ============================================================

export function useProgramBook(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.programBook(groupId, projectId),
    () => loadFromStorage<ProgramBookData | null>(storageKey(groupId, projectId), {} as ProgramBookData | null),
    { fallbackData: null }
  );

  /** 프로그램북 초기화 */
  const initBook = useCallback(
    (showTitle: string, showDate: string, venue: string): boolean => {
      if (!showTitle.trim()) return false;
      const existing = loadFromStorage<ProgramBookData | null>(storageKey(groupId, projectId), {} as ProgramBookData | null);
      const newData: ProgramBookData = {
        id: existing?.id ?? crypto.randomUUID(),
        showTitle: showTitle.trim(),
        showDate,
        venue: venue.trim(),
        sections: existing?.sections ?? [],
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), newData);
      mutate(newData, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 섹션 추가 */
  const addSection = useCallback(
    (
      type: ProgramSectionType,
      title: string,
      content: string
    ): boolean => {
      if (!title.trim()) return false;
      const current = loadFromStorage<ProgramBookData | null>(storageKey(groupId, projectId), {} as ProgramBookData | null);
      if (!current) return false;
      const maxOrder =
        current.sections.length > 0
          ? Math.max(...current.sections.map((s) => s.order))
          : 0;
      const newSection: ProgramBookSection = {
        id: crypto.randomUUID(),
        type,
        title: title.trim(),
        content,
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
      };
      const updated: ProgramBookData = {
        ...current,
        sections: [...current.sections, newSection],
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 섹션 수정 */
  const updateSection = useCallback(
    (
      sectionId: string,
      patch: Partial<Omit<ProgramBookSection, "id" | "createdAt">>
    ): void => {
      const current = loadFromStorage<ProgramBookData | null>(storageKey(groupId, projectId), {} as ProgramBookData | null);
      if (!current) return;
      const updated: ProgramBookData = {
        ...current,
        sections: current.sections.map((s) =>
          s.id === sectionId ? { ...s, ...patch } : s
        ),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
    },
    [groupId, projectId, mutate]
  );

  /** 섹션 삭제 */
  const deleteSection = useCallback(
    (sectionId: string): void => {
      const current = loadFromStorage<ProgramBookData | null>(storageKey(groupId, projectId), {} as ProgramBookData | null);
      if (!current) return;
      const remaining = current.sections.filter((s) => s.id !== sectionId);
      // order 재정렬
      const reordered = remaining
        .sort((a, b) => a.order - b.order)
        .map((s, idx) => ({ ...s, order: idx + 1 }));
      const updated: ProgramBookData = {
        ...current,
        sections: reordered,
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
    },
    [groupId, projectId, mutate]
  );

  /** 섹션 순서 변경 */
  const moveSection = useCallback(
    (sectionId: string, direction: "up" | "down"): void => {
      const current = loadFromStorage<ProgramBookData | null>(storageKey(groupId, projectId), {} as ProgramBookData | null);
      if (!current) return;
      const sorted = [...current.sections].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === sectionId);
      if (idx === -1) return;
      if (direction === "up" && idx === 0) return;
      if (direction === "down" && idx === sorted.length - 1) return;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const tempOrder = sorted[idx].order;
      sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
      sorted[swapIdx] = { ...sorted[swapIdx], order: tempOrder };

      const updated: ProgramBookData = {
        ...current,
        sections: sorted,
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
    },
    [groupId, projectId, mutate]
  );

  // ─── 통계 ────────────────────────────────────────────────────
  const sections = data?.sections ?? [];
  const totalSections = sections.length;

  const existingTypes = new Set(sections.map((s) => s.type));
  const isComplete = REQUIRED_SECTION_TYPES.every((t) =>
    existingTypes.has(t)
  );

  return {
    book: data,
    loading: isLoading,
    refetch: () => mutate(),
    initBook,
    addSection,
    updateSection,
    deleteSection,
    moveSection,
    totalSections,
    isComplete,
  };
}
