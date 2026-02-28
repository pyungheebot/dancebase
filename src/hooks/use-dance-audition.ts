"use client";

import { useCallback, useState, useEffect } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceAuditionEntry,
  DanceAuditionRecord,
  DanceAuditionResult,
} from "@/types";

// ============================================================
// 상수 레이블
// ============================================================

export const AUDITION_RESULT_LABELS: Record<DanceAuditionResult, string> = {
  pass: "합격",
  fail: "불합격",
  pending: "결과 대기",
  cancelled: "취소",
};

export const AUDITION_RESULT_COLORS: Record<
  DanceAuditionResult,
  { badge: string; text: string }
> = {
  pass: {
    badge: "bg-green-100 text-green-700 border-green-300",
    text: "text-green-600",
  },
  fail: {
    badge: "bg-red-100 text-red-700 border-red-300",
    text: "text-red-600",
  },
  pending: {
    badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
    text: "text-yellow-600",
  },
  cancelled: {
    badge: "bg-gray-100 text-gray-500 border-gray-300",
    text: "text-gray-500",
  },
};

export const AUDITION_RESULT_ORDER: DanceAuditionResult[] = [
  "pass",
  "fail",
  "pending",
  "cancelled",
];

export const SUGGESTED_AUDITION_GENRES: string[] = [
  "K-Pop",
  "힙합",
  "팝핀",
  "락킹",
  "크럼프",
  "왁킹",
  "하우스",
  "보깅",
  "비보잉",
  "재즈",
  "현대무용",
  "한국무용",
];

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.danceAudition(memberId);
}

function makeEmpty(memberId: string): DanceAuditionEntry {
  return {
    memberId,
    records: [],
    updatedAt: new Date().toISOString(),
  };
}

function loadData(memberId: string): DanceAuditionEntry {
  if (typeof window === "undefined") return makeEmpty(memberId);
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    if (!raw) return makeEmpty(memberId);
    return JSON.parse(raw) as DanceAuditionEntry;
  } catch {
    return makeEmpty(memberId);
  }
}

function saveData(entry: DanceAuditionEntry): void {
  localStorage.setItem(getStorageKey(entry.memberId), JSON.stringify(entry));
}

// ============================================================
// 통계 타입
// ============================================================

export type DanceAuditionStats = {
  total: number;
  pass: number;
  fail: number;
  pending: number;
  cancelled: number;
  passRate: number;   // 0~100 (취소 제외, 결과 확정된 것 기준)
  genres: string[];
};

// ============================================================
// 훅
// ============================================================

export function useDanceAudition(memberId: string) {
  const [entry, setEntry] = useState<DanceAuditionEntry>(() =>
    makeEmpty(memberId)
  );
  const [loading, setLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    setEntry(loadData(memberId));
    setLoading(false);
  }, [memberId]);

  // 상태 업데이트 + localStorage 동기화
  const updateEntry = useCallback(
    (updater: (prev: DanceAuditionEntry) => DanceAuditionEntry) => {
      setEntry((prev) => {
        const next = updater({ ...prev, updatedAt: new Date().toISOString() });
        saveData(next);
        return next;
      });
    },
    []
  );

  // ──────────────────────────────────────────
  // CRUD
  // ──────────────────────────────────────────

  /** 기록 추가 */
  const addRecord = useCallback(
    (
      payload: Omit<DanceAuditionRecord, "id" | "createdAt" | "updatedAt">
    ) => {
      const now = new Date().toISOString();
      const newRecord: DanceAuditionRecord = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      updateEntry((prev) => ({
        ...prev,
        records: [newRecord, ...prev.records].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
      }));
    },
    [updateEntry]
  );

  /** 기록 수정 */
  const updateRecord = useCallback(
    (
      recordId: string,
      patch: Partial<Omit<DanceAuditionRecord, "id" | "createdAt">>
    ) => {
      updateEntry((prev) => ({
        ...prev,
        records: prev.records.map((r) =>
          r.id === recordId
            ? { ...r, ...patch, updatedAt: new Date().toISOString() }
            : r
        ),
      }));
    },
    [updateEntry]
  );

  /** 기록 삭제 */
  const deleteRecord = useCallback(
    (recordId: string) => {
      updateEntry((prev) => ({
        ...prev,
        records: prev.records.filter((r) => r.id !== recordId),
      }));
    },
    [updateEntry]
  );

  // ──────────────────────────────────────────
  // 필터
  // ──────────────────────────────────────────

  /** 결과별 필터 */
  const getByResult = useCallback(
    (result: DanceAuditionResult): DanceAuditionRecord[] =>
      entry.records.filter((r) => r.result === result),
    [entry.records]
  );

  /** 장르별 필터 */
  const getByGenre = useCallback(
    (genre: string): DanceAuditionRecord[] =>
      entry.records.filter((r) => r.genre === genre),
    [entry.records]
  );

  // ──────────────────────────────────────────
  // 통계
  // ──────────────────────────────────────────

  const getStats = useCallback((): DanceAuditionStats => {
    const total = entry.records.length;
    const pass = entry.records.filter((r) => r.result === "pass").length;
    const fail = entry.records.filter((r) => r.result === "fail").length;
    const pending = entry.records.filter((r) => r.result === "pending").length;
    const cancelled = entry.records.filter(
      (r) => r.result === "cancelled"
    ).length;

    // 취소 제외, 결과 확정된 것(pass + fail) 기준 합격률
    const decided = pass + fail;
    const passRate =
      decided > 0 ? Math.round((pass / decided) * 100) : 0;

    const genreSet = new Set<string>();
    entry.records.forEach((r) => {
      if (r.genre) genreSet.add(r.genre);
    });
    const genres = Array.from(genreSet).sort();

    return { total, pass, fail, pending, cancelled, passRate, genres };
  }, [entry.records]);

  return {
    entry,
    records: entry.records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    getByResult,
    getByGenre,
    getStats,
  };
}
