"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import { type GroupRuleSection, type GroupRulebookData } from "@/types";

// ============================================
// localStorage 키 및 유틸
// ============================================

function getStorageKey(groupId: string): string {
  return `dancebase:rulebook:${groupId}`;
}

function loadFromStorage(groupId: string): GroupRulebookData {
  if (typeof window === "undefined") {
    return {
      groupId,
      sections: [],
      version: "v1.0",
      effectiveDate: null,
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) {
      return {
        groupId,
        sections: [],
        version: "v1.0",
        effectiveDate: null,
        updatedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(raw) as GroupRulebookData;
  } catch {
    return {
      groupId,
      sections: [],
      version: "v1.0",
      effectiveDate: null,
      updatedAt: new Date().toISOString(),
    };
  }
}

function saveToStorage(data: GroupRulebookData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(data.groupId), JSON.stringify(data));
}

// ============================================
// 훅
// ============================================

export function useGroupRulebook(groupId: string) {
  // SWR을 통한 캐시 관리 (fetcher는 localStorage에서 읽음)
  const { data, mutate } = useSWR(
    swrKeys.groupRulebook(groupId),
    () => loadFromStorage(groupId),
    { revalidateOnFocus: false }
  );

  // 내부 저장 헬퍼
  const persist = useCallback(
    (next: GroupRulebookData) => {
      saveToStorage(next);
      mutate(next, false);
    },
    [mutate]
  );

  // 현재 데이터 (초기화 전이면 빈 상태 반환)
  const current: GroupRulebookData = useMemo(() => data ?? {
    groupId,
    sections: [],
    version: "v1.0",
    effectiveDate: null,
    updatedAt: new Date().toISOString(),
  }, [data, groupId]);

  // 섹션 추가
  const addSection = useCallback(
    (
      title: string,
      content: string,
      isImportant: boolean,
      editedBy?: string
    ): boolean => {
      const trimTitle = title.trim();
      if (!trimTitle) {
        toast.error("섹션 제목을 입력해주세요");
        return false;
      }
      const maxOrder = current.sections.reduce(
        (max, s) => Math.max(max, s.order),
        -1
      );
      const newSection: GroupRuleSection = {
        id: crypto.randomUUID(),
        title: trimTitle,
        content: content.trim(),
        order: maxOrder + 1,
        isImportant,
        lastEditedBy: editedBy ?? null,
        updatedAt: new Date().toISOString(),
      };
      const next: GroupRulebookData = {
        ...current,
        sections: [...current.sections, newSection],
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("규정 섹션이 추가되었습니다");
      return true;
    },
    [current, persist]
  );

  // 섹션 수정
  const updateSection = useCallback(
    (
      id: string,
      updates: Partial<Pick<GroupRuleSection, "title" | "content" | "isImportant" | "lastEditedBy">>
    ): boolean => {
      const idx = current.sections.findIndex((s) => s.id === id);
      if (idx === -1) {
        toast.error("섹션을 찾을 수 없습니다");
        return false;
      }
      const updatedSections = current.sections.map((s) =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      );
      const next: GroupRulebookData = {
        ...current,
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("규정 섹션이 수정되었습니다");
      return true;
    },
    [current, persist]
  );

  // 섹션 삭제
  const deleteSection = useCallback(
    (id: string): void => {
      const next: GroupRulebookData = {
        ...current,
        sections: current.sections.filter((s) => s.id !== id),
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("규정 섹션이 삭제되었습니다");
    },
    [current, persist]
  );

  // 순서 이동 (위/아래)
  const reorderSections = useCallback(
    (id: string, direction: "up" | "down"): void => {
      const sorted = [...current.sections].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === id);
      if (idx === -1) return;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;

      const updatedSections = current.sections.map((section) => {
        if (section.id === sorted[idx].id) {
          return { ...section, order: sorted[swapIdx].order };
        }
        if (section.id === sorted[swapIdx].id) {
          return { ...section, order: sorted[idx].order };
        }
        return section;
      });

      const next: GroupRulebookData = {
        ...current,
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
    },
    [current, persist]
  );

  // 버전 설정
  const setVersion = useCallback(
    (version: string): void => {
      const next: GroupRulebookData = {
        ...current,
        version: version.trim(),
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("버전이 업데이트되었습니다");
    },
    [current, persist]
  );

  // 시행일 설정
  const setEffectiveDate = useCallback(
    (date: string | null): void => {
      const next: GroupRulebookData = {
        ...current,
        effectiveDate: date,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("시행일이 업데이트되었습니다");
    },
    [current, persist]
  );

  // order 기준 정렬된 섹션 목록
  const sortedSections = [...current.sections].sort(
    (a, b) => a.order - b.order
  );

  // 통계
  const totalSections = current.sections.length;
  const importantCount = current.sections.filter((s) => s.isImportant).length;

  // 첫 번째/마지막 여부
  const isFirst = useCallback(
    (id: string): boolean => {
      return sortedSections.length > 0 && sortedSections[0].id === id;
    },
    [sortedSections]
  );

  const isLast = useCallback(
    (id: string): boolean => {
      return (
        sortedSections.length > 0 &&
        sortedSections[sortedSections.length - 1].id === id
      );
    },
    [sortedSections]
  );

  return {
    sections: sortedSections,
    version: current.version,
    effectiveDate: current.effectiveDate,
    updatedAt: current.updatedAt,
    loading: false,
    totalSections,
    importantCount,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    setVersion,
    setEffectiveDate,
    isFirst,
    isLast,
  };
}
