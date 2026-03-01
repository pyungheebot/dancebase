"use client";

import { useCallback, useState } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type { DanceCompetitionRecord, DanceCompetitionData } from "@/types";

// ============================================================
// 상수
// ============================================================

export const COMPETITION_TEAM_OR_SOLO_LABELS: Record<
  DanceCompetitionRecord["teamOrSolo"],
  string
> = {
  solo: "솔로",
  team: "팀",
  duo: "듀오",
};

export const COMPETITION_TEAM_OR_SOLO_COLORS: Record<
  DanceCompetitionRecord["teamOrSolo"],
  string
> = {
  solo: "bg-blue-100 text-blue-700 border-blue-300",
  team: "bg-purple-100 text-purple-700 border-purple-300",
  duo: "bg-pink-100 text-pink-700 border-pink-300",
};

export const SUGGESTED_COMPETITION_GENRES = [
  "힙합",
  "팝핀",
  "왁킹",
  "하우스",
  "락킹",
  "크럼프",
  "브레이킹",
  "보깅",
  "재즈",
  "케이팝",
  "컨템포러리",
  "비보이/비걸",
  "어반",
  "소울",
  "프리스타일",
];

export const SUGGESTED_PLACEMENTS = [
  "1위",
  "2위",
  "3위",
  "결선진출",
  "본선진출",
  "예선탈락",
  "특별상",
  "심사위원상",
];

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.danceCompetition(memberId);
}

function loadData(memberId: string): DanceCompetitionData {
  if (typeof window === "undefined") {
    return { memberId, records: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    if (!raw)
      return { memberId, records: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as DanceCompetitionData;
  } catch {
    return { memberId, records: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(memberId: string, data: DanceCompetitionData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(memberId), JSON.stringify(data));
  } catch {
    // 저장 실패 시 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type DanceCompetitionStats = {
  /** 총 참가 횟수 */
  totalRecords: number;
  /** 입상 횟수 (placement가 null이 아닌 경우) */
  placementCount: number;
  /** 연도별 참가 횟수 분포 */
  yearlyDistribution: Record<string, number>;
  /** 장르별 참가 횟수 분포 */
  genreDistribution: Record<string, number>;
};

// ============================================================
// 통계 계산
// ============================================================

function calcStats(records: DanceCompetitionRecord[]): DanceCompetitionStats {
  const totalRecords = records.length;

  // 입상 횟수: placement가 있고 "예선탈락"이 아닌 경우
  const placementCount = records.filter(
    (r) =>
      r.placement !== null &&
      r.placement !== "" &&
      r.placement !== "예선탈락"
  ).length;

  // 연도별 분포
  const yearlyDistribution: Record<string, number> = {};
  for (const r of records) {
    const year = r.date.slice(0, 4);
    yearlyDistribution[year] = (yearlyDistribution[year] ?? 0) + 1;
  }

  // 장르별 분포
  const genreDistribution: Record<string, number> = {};
  for (const r of records) {
    if (r.genre) {
      genreDistribution[r.genre] = (genreDistribution[r.genre] ?? 0) + 1;
    }
  }

  return { totalRecords, placementCount, yearlyDistribution, genreDistribution };
}

// ============================================================
// 훅
// ============================================================

export function useDanceCompetition(memberId: string) {
  const [records, setRecords] = useState<DanceCompetitionRecord[]>(() =>
    memberId
      ? [...loadData(memberId).records].sort((a, b) => b.date.localeCompare(a.date))
      : []
  );

  const reload = useCallback(() => {
    if (!memberId) return;
    const data = loadData(memberId);
    const sorted = [...data.records].sort((a, b) => b.date.localeCompare(a.date));
    setRecords(sorted);
  }, [memberId]);

  // 내부 persist 헬퍼
  const persist = useCallback(
    (nextRecords: DanceCompetitionRecord[]) => {
      const sorted = [...nextRecords].sort((a, b) =>
        b.date.localeCompare(a.date)
      );
      saveData(memberId, {
        memberId,
        records: sorted,
        updatedAt: new Date().toISOString(),
      });
      setRecords(sorted);
    },
    [memberId]
  );

  // ────────────────────────────────────────────
  // CRUD
  // ────────────────────────────────────────────

  /** 기록 추가 */
  const addRecord = useCallback(
    (
      params: Omit<DanceCompetitionRecord, "id" | "createdAt">
    ): DanceCompetitionRecord => {
      const newRecord: DanceCompetitionRecord = {
        ...params,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      persist([newRecord, ...records]);
      return newRecord;
    },
    [records, persist]
  );

  /** 기록 수정 */
  const updateRecord = useCallback(
    (
      recordId: string,
      patch: Partial<Omit<DanceCompetitionRecord, "id" | "createdAt">>
    ): void => {
      const next = records.map((r) =>
        r.id === recordId ? { ...r, ...patch } : r
      );
      persist(next);
    },
    [records, persist]
  );

  /** 기록 삭제 */
  const deleteRecord = useCallback(
    (recordId: string): void => {
      persist(records.filter((r) => r.id !== recordId));
    },
    [records, persist]
  );

  // ────────────────────────────────────────────
  // 통계
  // ────────────────────────────────────────────

  const stats = calcStats(records);

  /** 장르 목록 (중복 제거) */
  const genres = Array.from(
    new Set(records.map((r) => r.genre).filter(Boolean))
  ) as string[];

  /** 연도 목록 (중복 제거, 내림차순) */
  const years = Array.from(
    new Set(records.map((r) => r.date.slice(0, 4)))
  ).sort((a, b) => b.localeCompare(a));

  return {
    records,
    loading: false,
    genres,
    years,
    stats,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: reload,
  };
}
