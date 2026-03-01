"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceGlossaryEntry,
  GlossaryCategoryNew,
  GlossaryTerm,
  GlossaryCategory,
} from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ─── localStorage 스토리지 키 ─────────────────────────────────
function storageKey(groupId: string): string {
  return `dancebase:dance-glossary:${groupId}`;
}

// ─── localStorage 헬퍼 ────────────────────────────────────────
function loadEntries(groupId: string): DanceGlossaryEntry[] {
  return loadFromStorage<DanceGlossaryEntry[]>(storageKey(groupId), []);
}

function saveEntries(groupId: string, entries: DanceGlossaryEntry[]): void {
  saveToStorage(storageKey(groupId), entries);
}

// ─── 가나다/알파벳 정렬 ──────────────────────────────────────
function sortEntries(entries: DanceGlossaryEntry[]): DanceGlossaryEntry[] {
  return [...entries].sort((a, b) =>
    a.term.localeCompare(b.term, "ko", { sensitivity: "base" })
  );
}

// ─── 첫 글자 추출 (한글 초성 or 알파벳 대문자) ───────────────
export function getInitial(term: string): string {
  const ch = term.trim().charAt(0);
  if (!ch) return "#";

  const code = ch.charCodeAt(0);

  // 한글 완성자 (가-힣)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const CHOSUNG = [
      "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
      "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
    ];
    return CHOSUNG[Math.floor((code - 0xac00) / 28 / 21)];
  }

  // 한글 자모 (ㄱ-ㅎ)
  if (code >= 0x3131 && code <= 0x314e) return ch;

  // 알파벳
  if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
    return ch.toUpperCase();
  }

  return "#";
}

// ─── 파라미터 타입 ────────────────────────────────────────────
export type AddTermParams = {
  term: string;
  definition: string;
  category: GlossaryCategoryNew;
  relatedTerms: string[];
  example?: string;
  addedBy: string;
};

export type UpdateTermParams = Partial<
  Omit<DanceGlossaryEntry, "id" | "createdAt">
>;

// ─── 하위 호환: 기존 GlossaryTerm 기반 훅도 유지 ─────────────
// (dance-glossary-card.tsx 가 기존 타입을 import 하므로 재-export)
export type { AddTermParams as LegacyAddTermParams };

// ─── 훅 ──────────────────────────────────────────────────────
export function useDanceGlossary(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.danceGlossaryEntries(groupId),
    () => loadEntries(groupId),
    { fallbackData: [] }
  );

  const entries = useMemo(() => sortEntries(data ?? []), [data]);

  // 저장 + SWR 갱신
  const persist = useCallback(
    (updated: DanceGlossaryEntry[]) => {
      const sorted = sortEntries(updated);
      saveEntries(groupId, sorted);
      mutate(sorted, false);
    },
    [groupId, mutate]
  );

  // 용어 추가
  const addTerm = useCallback(
    (params: AddTermParams): boolean => {
      const current = loadEntries(groupId);
      const newEntry: DanceGlossaryEntry = {
        id: crypto.randomUUID(),
        term: params.term.trim(),
        definition: params.definition.slice(0, 500),
        category: params.category,
        relatedTerms: params.relatedTerms ?? [],
        example: params.example?.trim(),
        addedBy: params.addedBy.trim() || "익명",
        createdAt: new Date().toISOString(),
      };
      persist([...current, newEntry]);
      return true;
    },
    [groupId, persist]
  );

  // 용어 수정
  const updateTerm = useCallback(
    (id: string, patch: UpdateTermParams): boolean => {
      const current = loadEntries(groupId);
      const target = current.find((e) => e.id === id);
      if (!target) return false;
      persist(
        current.map((e) =>
          e.id === id
            ? {
                ...e,
                ...patch,
                term: patch.term !== undefined ? patch.term.trim() : e.term,
                definition:
                  patch.definition !== undefined
                    ? patch.definition.slice(0, 500)
                    : e.definition,
                example:
                  patch.example !== undefined
                    ? patch.example.trim() || undefined
                    : e.example,
                addedBy:
                  patch.addedBy !== undefined
                    ? patch.addedBy.trim() || "익명"
                    : e.addedBy,
                relatedTerms: patch.relatedTerms ?? e.relatedTerms,
              }
            : e
        )
      );
      return true;
    },
    [groupId, persist]
  );

  // 용어 삭제
  const deleteTerm = useCallback(
    (id: string): void => {
      const current = loadEntries(groupId);
      persist(current.filter((e) => e.id !== id));
    },
    [groupId, persist]
  );

  // 검색 (용어명/정의)
  const searchTerms = useCallback(
    (query: string): DanceGlossaryEntry[] => {
      const q = query.trim().toLowerCase();
      if (!q) return entries;
      return entries.filter(
        (e) =>
          e.term.toLowerCase().includes(q) ||
          e.definition.toLowerCase().includes(q)
      );
    },
    [entries]
  );

  // 카테고리별 필터
  const getByCategory = useCallback(
    (category: GlossaryCategoryNew): DanceGlossaryEntry[] => {
      return entries.filter((e) => e.category === category);
    },
    [entries]
  );

  // 통계
  const totalTerms = entries.length;

  const categoryDistribution = useMemo(() => {
    const dist: Partial<Record<GlossaryCategoryNew, number>> = {};
    for (const e of entries) {
      dist[e.category] = (dist[e.category] ?? 0) + 1;
    }
    return dist as Record<GlossaryCategoryNew, number>;
  }, [entries]);

  // 알파벳/가나다 인덱스 그룹
  const indexGroups = useMemo(() => {
    const map = new Map<string, DanceGlossaryEntry[]>();
    for (const e of entries) {
      const initial = getInitial(e.term);
      if (!map.has(initial)) map.set(initial, []);
      map.get(initial)!.push(e);
    }
    return map;
  }, [entries]);

  const indexKeys = useMemo(() => {
    return Array.from(indexGroups.keys()).sort((a, b) =>
      a.localeCompare(b, "ko", { sensitivity: "base" })
    );
  }, [indexGroups]);

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addTerm,
    updateTerm,
    deleteTerm,
    searchTerms,
    getByCategory,
    totalTerms,
    categoryDistribution,
    indexGroups,
    indexKeys,
  };
}

// ─── 하위 호환: 기존 dance-glossary-card.tsx 가 사용하는 인터페이스 ──
// GlossaryTerm / GlossaryCategory 기반의 카드는 별도 레거시 훅 사용

const LEGACY_KEY = (id: string) => `dancebase:glossary:${id}`;

function loadLegacy(id: string): GlossaryTerm[] {
  return loadFromStorage<GlossaryTerm[]>(LEGACY_KEY(id), []);
}

function saveLegacy(id: string, terms: GlossaryTerm[]): void {
  saveToStorage(LEGACY_KEY(id), terms);
}

function sortLegacy(terms: GlossaryTerm[]): GlossaryTerm[] {
  return [...terms].sort((a, b) =>
    a.term.localeCompare(b.term, "ko", { sensitivity: "base" })
  );
}

export function useDanceGlossaryLegacy(groupId: string) {

  const { data, isLoading, mutate } = useSWR(
    swrKeys.danceGlossary(groupId),
    () => loadLegacy(groupId),
    { fallbackData: [] }
  );

  const terms = useMemo(() => sortLegacy(data ?? []), [data]);

  const persistLegacy = useCallback(
    (updated: GlossaryTerm[]) => {
      const sorted = sortLegacy(updated);
      saveLegacy(groupId, sorted);
      mutate(sorted, false);
    },
    [groupId, mutate]
  );

  const addTermLegacy = useCallback(
    (params: Omit<GlossaryTerm, "id" | "createdAt">): boolean => {
      const current = loadLegacy(groupId);
      const newTerm: GlossaryTerm = {
        id: crypto.randomUUID(),
        ...params,
        term: params.term.trim(),
        definition: params.definition.slice(0, 500),
        example: params.example?.trim() ?? "",
        addedBy: params.addedBy.trim() || "익명",
        createdAt: new Date().toISOString(),
      };
      persistLegacy([...current, newTerm]);
      return true;
    },
    [groupId, persistLegacy]
  );

  const updateTermLegacy = useCallback(
    (id: string, patch: Partial<GlossaryTerm>): boolean => {
      const current = loadLegacy(groupId);
      if (!current.find((t) => t.id === id)) return false;
      persistLegacy(
        current.map((t) =>
          t.id === id ? { ...t, ...patch } : t
        )
      );
      return true;
    },
    [groupId, persistLegacy]
  );

  const deleteTermLegacy = useCallback(
    (id: string): void => {
      const current = loadLegacy(groupId);
      persistLegacy(current.filter((t) => t.id !== id));
    },
    [groupId, persistLegacy]
  );

  const totalCount = terms.length;

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of terms) {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    }
    return counts;
  }, [terms]);

  const indexGroups = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    for (const t of terms) {
      const initial = getInitial(t.term);
      if (!map.has(initial)) map.set(initial, []);
      map.get(initial)!.push(t);
    }
    return map;
  }, [terms]);

  const indexKeys = useMemo(() => {
    return Array.from(indexGroups.keys()).sort((a, b) =>
      a.localeCompare(b, "ko", { sensitivity: "base" })
    );
  }, [indexGroups]);

  return {
    terms,
    filteredTerms: terms,
    totalCount,
    categoryCount,
    indexGroups,
    indexKeys,
    searchQuery: "",
    setSearchQuery: (_str: string) => {},
    selectedCategory: "all" as GlossaryCategory | "all",
    setSelectedCategory: (_cat: GlossaryCategory | "all") => {},
    selectedDifficulty: "all" as GlossaryTerm["difficulty"] | "all",
    setSelectedDifficulty: (_diff: GlossaryTerm["difficulty"] | "all") => {},
    addTerm: addTermLegacy,
    updateTerm: updateTermLegacy,
    deleteTerm: deleteTermLegacy,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
