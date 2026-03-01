"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  CreditSection,
  CreditSectionType,
  CreditPerson,
  ShowCreditsData,
} from "@/types";

// ============================================================
// 섹션 유형 기본 제목
// ============================================================

export const CREDIT_SECTION_DEFAULT_TITLES: Record<CreditSectionType, string> =
  {
    cast: "출연진",
    choreography: "안무",
    music: "음악",
    lighting: "조명",
    costume: "의상",
    stage: "무대",
    planning: "기획",
    special_thanks: "특별 감사",
  };

// ============================================================
// localStorage 유틸
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:show-credits:${groupId}:${projectId}`;
}

// ============================================================
// 훅
// ============================================================

export function useShowCredits(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.showCredits(groupId, projectId),
    () => loadFromStorage<ShowCreditsData>(storageKey(groupId, projectId), {} as ShowCreditsData),
    {
      fallbackData: {
        groupId,
        projectId,
        sections: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const sections: CreditSection[] = (data?.sections ?? []).sort(
    (a, b) => a.order - b.order
  );

  /** 섹션 추가 */
  const addSection = useCallback(
    (type: CreditSectionType, customTitle?: string): CreditSection => {
      const current = loadFromStorage<ShowCreditsData>(storageKey(groupId, projectId), {} as ShowCreditsData);
      const maxOrder =
        current.sections.length > 0
          ? Math.max(...current.sections.map((s) => s.order))
          : -1;
      const newSection: CreditSection = {
        id: crypto.randomUUID(),
        type,
        title: customTitle?.trim() || CREDIT_SECTION_DEFAULT_TITLES[type],
        people: [],
        order: maxOrder + 1,
      };
      const updated: ShowCreditsData = {
        ...current,
        sections: [...current.sections, newSection],
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return newSection;
    },
    [groupId, projectId, mutate]
  );

  /** 섹션 제목 수정 */
  const updateSectionTitle = useCallback(
    (sectionId: string, title: string): boolean => {
      const current = loadFromStorage<ShowCreditsData>(storageKey(groupId, projectId), {} as ShowCreditsData);
      const idx = current.sections.findIndex((s) => s.id === sectionId);
      if (idx === -1) return false;
      const updated: ShowCreditsData = {
        ...current,
        sections: current.sections.map((s) =>
          s.id === sectionId ? { ...s, title: title.trim() } : s
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 섹션 삭제 */
  const deleteSection = useCallback(
    (sectionId: string): boolean => {
      const current = loadFromStorage<ShowCreditsData>(storageKey(groupId, projectId), {} as ShowCreditsData);
      const exists = current.sections.some((s) => s.id === sectionId);
      if (!exists) return false;
      const filtered = current.sections.filter((s) => s.id !== sectionId);
      // order 재정렬
      const reordered = filtered
        .sort((a, b) => a.order - b.order)
        .map((s, i) => ({ ...s, order: i }));
      const updated: ShowCreditsData = {
        ...current,
        sections: reordered,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 섹션 순서 변경 (위/아래) */
  const moveSectionUp = useCallback(
    (sectionId: string): boolean => {
      const current = loadFromStorage<ShowCreditsData>(storageKey(groupId, projectId), {} as ShowCreditsData);
      const sorted = [...current.sections].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === sectionId);
      if (idx <= 0) return false;
      // swap order
      const a = sorted[idx];
      const b = sorted[idx - 1];
      const reordered = sorted.map((s) => {
        if (s.id === a.id) return { ...s, order: b.order };
        if (s.id === b.id) return { ...s, order: a.order };
        return s;
      });
      const updated: ShowCreditsData = {
        ...current,
        sections: reordered,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  const moveSectionDown = useCallback(
    (sectionId: string): boolean => {
      const current = loadFromStorage<ShowCreditsData>(storageKey(groupId, projectId), {} as ShowCreditsData);
      const sorted = [...current.sections].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === sectionId);
      if (idx === -1 || idx >= sorted.length - 1) return false;
      const a = sorted[idx];
      const b = sorted[idx + 1];
      const reordered = sorted.map((s) => {
        if (s.id === a.id) return { ...s, order: b.order };
        if (s.id === b.id) return { ...s, order: a.order };
        return s;
      });
      const updated: ShowCreditsData = {
        ...current,
        sections: reordered,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 섹션에 인원 추가 */
  const addPerson = useCallback(
    (sectionId: string, name: string, role: string): CreditPerson | null => {
      const current = loadFromStorage<ShowCreditsData>(storageKey(groupId, projectId), {} as ShowCreditsData);
      const sectionIdx = current.sections.findIndex((s) => s.id === sectionId);
      if (sectionIdx === -1) return null;
      const newPerson: CreditPerson = {
        id: crypto.randomUUID(),
        name: name.trim(),
        role: role.trim(),
      };
      const updated: ShowCreditsData = {
        ...current,
        sections: current.sections.map((s) =>
          s.id === sectionId
            ? { ...s, people: [...s.people, newPerson] }
            : s
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return newPerson;
    },
    [groupId, projectId, mutate]
  );

  /** 인원 수정 */
  const updatePerson = useCallback(
    (
      sectionId: string,
      personId: string,
      name: string,
      role: string
    ): boolean => {
      const current = loadFromStorage<ShowCreditsData>(storageKey(groupId, projectId), {} as ShowCreditsData);
      const sectionIdx = current.sections.findIndex((s) => s.id === sectionId);
      if (sectionIdx === -1) return false;
      const personIdx = current.sections[sectionIdx].people.findIndex(
        (p) => p.id === personId
      );
      if (personIdx === -1) return false;
      const updated: ShowCreditsData = {
        ...current,
        sections: current.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                people: s.people.map((p) =>
                  p.id === personId
                    ? { ...p, name: name.trim(), role: role.trim() }
                    : p
                ),
              }
            : s
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 인원 삭제 */
  const deletePerson = useCallback(
    (sectionId: string, personId: string): boolean => {
      const current = loadFromStorage<ShowCreditsData>(storageKey(groupId, projectId), {} as ShowCreditsData);
      const sectionIdx = current.sections.findIndex((s) => s.id === sectionId);
      if (sectionIdx === -1) return false;
      const updated: ShowCreditsData = {
        ...current,
        sections: current.sections.map((s) =>
          s.id === sectionId
            ? { ...s, people: s.people.filter((p) => p.id !== personId) }
            : s
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 통계 */
  const stats = (() => {
    const totalPeople = sections.reduce((sum, s) => sum + s.people.length, 0);
    const sectionStats = sections.map((s) => ({
      id: s.id,
      title: s.title,
      count: s.people.length,
    }));
    return { totalPeople, sectionCount: sections.length, sectionStats };
  })();

  return {
    sections,
    loading: isLoading,
    refetch: () => mutate(),
    addSection,
    updateSectionTitle,
    deleteSection,
    moveSectionUp,
    moveSectionDown,
    addPerson,
    updatePerson,
    deletePerson,
    stats,
  };
}
