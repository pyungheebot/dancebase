"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { DanceGenreType, GenreExplorerEntry, GenreMemberInterest } from "@/types";

// ─── localStorage 키 ──────────────────────────────────────────
const STORAGE_KEY = (groupId: string) =>
  `dancebase:genre-explorer:${groupId}`;

// ─── 저장 데이터 구조 ─────────────────────────────────────────
type GenreExplorerStore = {
  entries: GenreExplorerEntry[];
  interests: GenreMemberInterest[];
};

// ─── localStorage 헬퍼 ────────────────────────────────────────
function loadStore(groupId: string): GenreExplorerStore {
  if (typeof window === "undefined") return { entries: [], interests: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId));
    if (!raw) return { entries: [], interests: [] };
    const parsed = JSON.parse(raw) as Partial<GenreExplorerStore>;
    return {
      entries: parsed.entries ?? [],
      interests: parsed.interests ?? [],
    };
  } catch {
    return { entries: [], interests: [] };
  }
}

function saveStore(groupId: string, store: GenreExplorerStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(groupId), JSON.stringify(store));
}

// ─── 훅 ──────────────────────────────────────────────────────
export function useGenreExplorer(groupId: string) {
  const [store, setStore] = useState<GenreExplorerStore>({
    entries: [],
    interests: [],
  });

  // 초기 로드
  useEffect(() => {
    if (!groupId) return;
    setStore(loadStore(groupId));
  }, [groupId]);

  // 저장 + 상태 갱신
  const persist = useCallback(
    (updated: GenreExplorerStore) => {
      saveStore(groupId, updated);
      setStore(updated);
    },
    [groupId]
  );

  // 장르 정보 추가
  const addEntry = useCallback(
    (
      genre: DanceGenreType,
      title: string,
      description: string,
      difficulty: 1 | 2 | 3 | 4 | 5,
      recommendedSongs: string[],
      tips: string[],
      addedBy: string
    ): GenreExplorerEntry => {
      const current = loadStore(groupId);
      const newEntry: GenreExplorerEntry = {
        id: crypto.randomUUID(),
        genre,
        title: title.trim(),
        description: description.trim(),
        difficulty,
        recommendedSongs: recommendedSongs.map((s) => s.trim()).filter(Boolean),
        tips: tips.map((t) => t.trim()).filter(Boolean),
        addedBy: addedBy.trim() || "익명",
        createdAt: new Date().toISOString(),
      };
      persist({ ...current, entries: [...current.entries, newEntry] });
      return newEntry;
    },
    [groupId, persist]
  );

  // 장르 정보 수정
  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<GenreExplorerEntry, "id" | "createdAt">>): boolean => {
      const current = loadStore(groupId);
      const target = current.entries.find((e) => e.id === id);
      if (!target) return false;
      persist({
        ...current,
        entries: current.entries.map((e) =>
          e.id === id ? { ...e, ...patch } : e
        ),
      });
      return true;
    },
    [groupId, persist]
  );

  // 장르 정보 삭제
  const deleteEntry = useCallback(
    (id: string): void => {
      const current = loadStore(groupId);
      persist({
        ...current,
        entries: current.entries.filter((e) => e.id !== id),
      });
    },
    [groupId, persist]
  );

  // 멤버 관심 장르 등록 (있으면 갱신, 없으면 추가)
  const setInterest = useCallback(
    (
      memberName: string,
      genre: DanceGenreType,
      experienceLevel: 1 | 2 | 3 | 4 | 5
    ): void => {
      const current = loadStore(groupId);
      const existing = current.interests.find(
        (i) => i.memberName === memberName && i.genre === genre
      );
      let updated: GenreMemberInterest[];
      if (existing) {
        updated = current.interests.map((i) =>
          i.memberName === memberName && i.genre === genre
            ? { ...i, experienceLevel, interest: true }
            : i
        );
      } else {
        const newInterest: GenreMemberInterest = {
          id: crypto.randomUUID(),
          memberName,
          genre,
          experienceLevel,
          interest: true,
        };
        updated = [...current.interests, newInterest];
      }
      persist({ ...current, interests: updated });
    },
    [groupId, persist]
  );

  // 관심 해제
  const removeInterest = useCallback(
    (memberName: string, genre: DanceGenreType): void => {
      const current = loadStore(groupId);
      persist({
        ...current,
        interests: current.interests.filter(
          (i) => !(i.memberName === memberName && i.genre === genre)
        ),
      });
    },
    [groupId, persist]
  );

  // 장르별 항목 조회
  const getByGenre = useCallback(
    (genre: DanceGenreType): GenreExplorerEntry[] => {
      return store.entries.filter((e) => e.genre === genre);
    },
    [store.entries]
  );

  // 멤버의 관심 장르 목록
  const getMemberGenres = useCallback(
    (memberName: string): GenreMemberInterest[] => {
      return store.interests.filter(
        (i) => i.memberName === memberName && i.interest
      );
    },
    [store.interests]
  );

  // 통계: 총 항목 수
  const totalEntries = store.entries.length;

  // 통계: 장르별 분포 (관심 있는 멤버 수 기준)
  const genreDistribution = useMemo((): Record<DanceGenreType, number> => {
    const ALL_GENRES: DanceGenreType[] = [
      "hiphop", "kpop", "ballet", "jazz", "contemporary",
      "latin", "waacking", "locking", "popping", "breaking", "other",
    ];
    const dist = {} as Record<DanceGenreType, number>;
    for (const g of ALL_GENRES) dist[g] = 0;
    for (const i of store.interests) {
      if (i.interest) dist[i.genre] = (dist[i.genre] ?? 0) + 1;
    }
    return dist;
  }, [store.interests]);

  // 통계: 가장 인기 있는 장르
  const mostPopularGenre = useMemo((): DanceGenreType | null => {
    const entries = Object.entries(genreDistribution) as [DanceGenreType, number][];
    const max = entries.reduce<[DanceGenreType, number] | null>(
      (best, cur) => (best === null || cur[1] > best[1] ? cur : best),
      null
    );
    return max && max[1] > 0 ? max[0] : null;
  }, [genreDistribution]);

  return {
    entries: store.entries,
    interests: store.interests,
    addEntry,
    updateEntry,
    deleteEntry,
    setInterest,
    removeInterest,
    getByGenre,
    getMemberGenres,
    totalEntries,
    genreDistribution,
    mostPopularGenre,
  };
}
