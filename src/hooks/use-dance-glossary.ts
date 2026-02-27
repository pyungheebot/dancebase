"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { GlossaryTerm, GlossaryCategory } from "@/types";

const STORAGE_KEY = (groupId: string) => `dancebase:glossary:${groupId}`;

// ─── localStorage 헬퍼 ────────────────────────────────────────
function loadTerms(groupId: string): GlossaryTerm[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as GlossaryTerm[];
  } catch {
    return [];
  }
}

function saveTerms(groupId: string, terms: GlossaryTerm[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(groupId), JSON.stringify(terms));
}

// ─── 가나다/알파벳 정렬 ─────────────────────────────────────
function sortTerms(terms: GlossaryTerm[]): GlossaryTerm[] {
  return [...terms].sort((a, b) =>
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
      "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ",
      "ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
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
export type AddTermParams = Omit<GlossaryTerm, "id" | "createdAt">;
export type UpdateTermParams = Partial<Omit<GlossaryTerm, "id" | "createdAt">>;

// ─── 훅 ──────────────────────────────────────────────────────
export function useDanceGlossary(groupId: string) {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<GlossaryTerm["difficulty"] | "all">("all");

  // 초기 로드
  useEffect(() => {
    if (!groupId) return;
    setTerms(sortTerms(loadTerms(groupId)));
  }, [groupId]);

  // 저장 + 상태 갱신
  const persist = useCallback(
    (updated: GlossaryTerm[]) => {
      const sorted = sortTerms(updated);
      saveTerms(groupId, sorted);
      setTerms(sorted);
    },
    [groupId]
  );

  // 용어 추가
  const addTerm = useCallback(
    (params: AddTermParams): boolean => {
      const current = loadTerms(groupId);
      const newTerm: GlossaryTerm = {
        id: crypto.randomUUID(),
        term: params.term.trim(),
        definition: params.definition.slice(0, 500),
        category: params.category,
        difficulty: params.difficulty,
        example: params.example.trim(),
        addedBy: params.addedBy.trim() || "익명",
        createdAt: new Date().toISOString(),
      };
      persist([...current, newTerm]);
      return true;
    },
    [groupId, persist]
  );

  // 용어 수정
  const updateTerm = useCallback(
    (id: string, patch: UpdateTermParams): boolean => {
      const current = loadTerms(groupId);
      const target = current.find((t) => t.id === id);
      if (!target) return false;

      persist(
        current.map((t) =>
          t.id === id
            ? {
                ...t,
                ...patch,
                term: patch.term?.trim() ?? t.term,
                definition: patch.definition
                  ? patch.definition.slice(0, 500)
                  : t.definition,
                example: patch.example?.trim() ?? t.example,
                addedBy: patch.addedBy?.trim() ?? t.addedBy,
              }
            : t
        )
      );
      return true;
    },
    [groupId, persist]
  );

  // 용어 삭제
  const deleteTerm = useCallback(
    (id: string): void => {
      const current = loadTerms(groupId);
      persist(current.filter((t) => t.id !== id));
    },
    [groupId, persist]
  );

  // 필터링된 용어 목록
  const filteredTerms = useMemo(() => {
    return terms.filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q);
      const matchCategory =
        selectedCategory === "all" || t.category === selectedCategory;
      const matchDifficulty =
        selectedDifficulty === "all" || t.difficulty === selectedDifficulty;
      return matchSearch && matchCategory && matchDifficulty;
    });
  }, [terms, searchQuery, selectedCategory, selectedDifficulty]);

  // 총 용어 수
  const totalCount = terms.length;

  // 카테고리별 수
  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of terms) {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    }
    return counts;
  }, [terms]);

  // 알파벳 인덱스 (초성별 그룹)
  const indexGroups = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    for (const t of filteredTerms) {
      const initial = getInitial(t.term);
      if (!map.has(initial)) map.set(initial, []);
      map.get(initial)!.push(t);
    }
    return map;
  }, [filteredTerms]);

  // 인덱스 키 목록 (정렬)
  const indexKeys = useMemo(() => {
    return Array.from(indexGroups.keys()).sort((a, b) =>
      a.localeCompare(b, "ko", { sensitivity: "base" })
    );
  }, [indexGroups]);

  return {
    terms,
    filteredTerms,
    totalCount,
    categoryCount,
    indexGroups,
    indexKeys,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    addTerm,
    updateTerm,
    deleteTerm,
  };
}
