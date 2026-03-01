"use client";

import { useState, useCallback } from "react";
import type {
  AudienceGuideEntry,
  AudienceGuideSection,
  AudienceGuideSectionType,
  AudienceGuideFAQ,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const STORAGE_KEY_PREFIX = "audience-guide-";

export const SECTION_TYPE_LABELS: Record<AudienceGuideSectionType, string> = {
  location: "공연장 위치/교통",
  parking: "주차 안내",
  seating: "좌석 안내",
  caution: "주의사항",
  etiquette: "공연 에티켓",
  emergency: "비상구/대피 안내",
  faq: "FAQ",
  general: "일반 안내",
};

export const SECTION_TYPE_COLORS: Record<AudienceGuideSectionType, string> = {
  location: "bg-blue-100 text-blue-700 border-blue-200",
  parking: "bg-orange-100 text-orange-700 border-orange-200",
  seating: "bg-purple-100 text-purple-700 border-purple-200",
  caution: "bg-red-100 text-red-700 border-red-200",
  etiquette: "bg-green-100 text-green-700 border-green-200",
  emergency: "bg-rose-100 text-rose-700 border-rose-200",
  faq: "bg-cyan-100 text-cyan-700 border-cyan-200",
  general: "bg-gray-100 text-gray-700 border-gray-200",
};

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}-${projectId}`;
}

function saveData(entry: AudienceGuideEntry): void {
  localStorage.setItem(
    getStorageKey(entry.groupId, entry.projectId),
    JSON.stringify(entry)
  );
}

function makeEmpty(groupId: string, projectId: string): AudienceGuideEntry {
  return {
    id: crypto.randomUUID(),
    groupId,
    projectId,
    title: "관객 안내 매뉴얼",
    description: "",
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 훅
// ============================================================

export function useAudienceGuide(groupId: string, projectId: string) {
  const [entry, setEntry] = useState<AudienceGuideEntry>(() =>
    makeEmpty(groupId, projectId)
  );

  // 상태 업데이트 + localStorage 동기화
  const updateEntry = useCallback(
    (updater: (prev: AudienceGuideEntry) => AudienceGuideEntry) => {
      setEntry((prev) => {
        const next = updater({ ...prev, updatedAt: new Date().toISOString() });
        saveData(next);
        return next;
      });
    },
    []
  );

  // ============================================================
  // 매뉴얼 기본 정보 수정
  // ============================================================

  /** 매뉴얼 제목/설명 수정 */
  const updateManualInfo = useCallback(
    (patch: Partial<Pick<AudienceGuideEntry, "title" | "description">>) => {
      updateEntry((prev) => ({ ...prev, ...patch }));
    },
    [updateEntry]
  );

  // ============================================================
  // 섹션 관리
  // ============================================================

  /** 섹션 추가 */
  const addSection = useCallback(
    (
      type: AudienceGuideSectionType,
      title: string,
      content: string = ""
    ) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;
      const maxOrder =
        entry.sections.length > 0
          ? Math.max(...entry.sections.map((s) => s.order))
          : -1;
      const newSection: AudienceGuideSection = {
        id: crypto.randomUUID(),
        type,
        title: trimmedTitle,
        content,
        faqs: [],
        isVisible: true,
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updateEntry((prev) => ({
        ...prev,
        sections: [...prev.sections, newSection],
      }));
    },
    [entry.sections, updateEntry]
  );

  /** 섹션 수정 */
  const updateSection = useCallback(
    (
      sectionId: string,
      patch: Partial<
        Pick<
          AudienceGuideSection,
          "type" | "title" | "content" | "isVisible"
        >
      >
    ) => {
      updateEntry((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId
            ? { ...s, ...patch, updatedAt: new Date().toISOString() }
            : s
        ),
      }));
    },
    [updateEntry]
  );

  /** 섹션 삭제 */
  const removeSection = useCallback(
    (sectionId: string) => {
      updateEntry((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== sectionId),
      }));
    },
    [updateEntry]
  );

  /** 섹션 순서 위로 이동 */
  const moveSectionUp = useCallback(
    (sectionId: string) => {
      updateEntry((prev) => {
        const sorted = [...prev.sections].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((s) => s.id === sectionId);
        if (idx <= 0) return prev;
        const updated = sorted.map((s, i) => {
          if (i === idx - 1) return { ...s, order: sorted[idx].order };
          if (i === idx) return { ...s, order: sorted[idx - 1].order };
          return s;
        });
        return { ...prev, sections: updated };
      });
    },
    [updateEntry]
  );

  /** 섹션 순서 아래로 이동 */
  const moveSectionDown = useCallback(
    (sectionId: string) => {
      updateEntry((prev) => {
        const sorted = [...prev.sections].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((s) => s.id === sectionId);
        if (idx < 0 || idx >= sorted.length - 1) return prev;
        const updated = sorted.map((s, i) => {
          if (i === idx) return { ...s, order: sorted[idx + 1].order };
          if (i === idx + 1) return { ...s, order: sorted[idx].order };
          return s;
        });
        return { ...prev, sections: updated };
      });
    },
    [updateEntry]
  );

  /** 섹션 공개 여부 토글 */
  const toggleSectionVisibility = useCallback(
    (sectionId: string) => {
      updateEntry((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId
            ? { ...s, isVisible: !s.isVisible, updatedAt: new Date().toISOString() }
            : s
        ),
      }));
    },
    [updateEntry]
  );

  // ============================================================
  // FAQ 관리
  // ============================================================

  /** FAQ 추가 */
  const addFAQ = useCallback(
    (sectionId: string, question: string, answer: string) => {
      const trimmedQ = question.trim();
      const trimmedA = answer.trim();
      if (!trimmedQ || !trimmedA) return;
      updateEntry((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const maxOrder =
            s.faqs.length > 0
              ? Math.max(...s.faqs.map((f) => f.order))
              : -1;
          const newFaq: AudienceGuideFAQ = {
            id: crypto.randomUUID(),
            question: trimmedQ,
            answer: trimmedA,
            order: maxOrder + 1,
          };
          return {
            ...s,
            faqs: [...s.faqs, newFaq],
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    [updateEntry]
  );

  /** FAQ 수정 */
  const updateFAQ = useCallback(
    (
      sectionId: string,
      faqId: string,
      patch: Partial<Pick<AudienceGuideFAQ, "question" | "answer">>
    ) => {
      updateEntry((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            faqs: s.faqs.map((f) =>
              f.id === faqId ? { ...f, ...patch } : f
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    [updateEntry]
  );

  /** FAQ 삭제 */
  const removeFAQ = useCallback(
    (sectionId: string, faqId: string) => {
      updateEntry((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            faqs: s.faqs.filter((f) => f.id !== faqId),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    [updateEntry]
  );

  /** FAQ 순서 위로 이동 */
  const moveFAQUp = useCallback(
    (sectionId: string, faqId: string) => {
      updateEntry((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const sorted = [...s.faqs].sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((f) => f.id === faqId);
          if (idx <= 0) return s;
          const updated = sorted.map((f, i) => {
            if (i === idx - 1) return { ...f, order: sorted[idx].order };
            if (i === idx) return { ...f, order: sorted[idx - 1].order };
            return f;
          });
          return { ...s, faqs: updated, updatedAt: new Date().toISOString() };
        }),
      }));
    },
    [updateEntry]
  );

  /** FAQ 순서 아래로 이동 */
  const moveFAQDown = useCallback(
    (sectionId: string, faqId: string) => {
      updateEntry((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const sorted = [...s.faqs].sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((f) => f.id === faqId);
          if (idx < 0 || idx >= sorted.length - 1) return s;
          const updated = sorted.map((f, i) => {
            if (i === idx) return { ...f, order: sorted[idx + 1].order };
            if (i === idx + 1) return { ...f, order: sorted[idx].order };
            return f;
          });
          return { ...s, faqs: updated, updatedAt: new Date().toISOString() };
        }),
      }));
    },
    [updateEntry]
  );

  // ============================================================
  // 파생 데이터
  // ============================================================

  const sortedSections = [...entry.sections].sort(
    (a, b) => a.order - b.order
  );

  const visibleSections = sortedSections.filter((s) => s.isVisible);

  return {
    entry,
    sections: sortedSections,
    visibleSections,
    updateManualInfo,
    addSection,
    updateSection,
    removeSection,
    moveSectionUp,
    moveSectionDown,
    toggleSectionVisibility,
    addFAQ,
    updateFAQ,
    removeFAQ,
    moveFAQUp,
    moveFAQDown,
  };
}
