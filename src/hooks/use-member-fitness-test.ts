"use client";

import { useCallback, useState } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type { FitnessTestRecord, FitnessTestData } from "@/types";

// ============================================================
// 상수
// ============================================================

export type FitnessMetricKey =
  | "flexibility"
  | "strength"
  | "endurance"
  | "balance"
  | "speed";

export const FITNESS_METRIC_KEYS: FitnessMetricKey[] = [
  "flexibility",
  "strength",
  "endurance",
  "balance",
  "speed",
];

export const FITNESS_METRIC_LABELS: Record<FitnessMetricKey, string> = {
  flexibility: "유연성",
  strength: "근력",
  endurance: "지구력",
  balance: "균형감각",
  speed: "스피드/리듬",
};

export const FITNESS_METRIC_COLORS: Record<FitnessMetricKey, string> = {
  flexibility: "bg-blue-500",
  strength: "bg-red-500",
  endurance: "bg-green-500",
  balance: "bg-purple-500",
  speed: "bg-orange-500",
};

export const FITNESS_METRIC_LIGHT_COLORS: Record<FitnessMetricKey, string> = {
  flexibility: "bg-blue-100 text-blue-700",
  strength: "bg-red-100 text-red-700",
  endurance: "bg-green-100 text-green-700",
  balance: "bg-purple-100 text-purple-700",
  speed: "bg-orange-100 text-orange-700",
};

// ============================================================
// 통계 타입
// ============================================================

export type MemberFitnessTestStats = {
  /** 총 측정 횟수 */
  totalRecords: number;
  /** 가장 최근 기록 */
  latestRecord: FitnessTestRecord | null;
  /** 각 지표별 평균 점수 */
  averageScores: Record<FitnessMetricKey, number | null>;
  /** 최근 5회 기록 기반 추세 (양수=상승, 음수=하강, null=데이터 부족) */
  progressTrend: Record<FitnessMetricKey, number | null>;
};

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.fitnessTest(memberId);
}

function loadData(memberId: string): FitnessTestData {
  if (typeof window === "undefined") {
    return { memberId, records: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    if (!raw)
      return { memberId, records: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as FitnessTestData;
  } catch {
    return { memberId, records: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(memberId: string, data: FitnessTestData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(memberId), JSON.stringify(data));
  } catch {
    // 저장 실패 시 무시
  }
}

// ============================================================
// 통계 계산
// ============================================================

function calcStats(records: FitnessTestRecord[]): MemberFitnessTestStats {
  const totalRecords = records.length;
  const latestRecord = records.length > 0 ? records[0] : null;

  // 각 지표별 평균
  const averageScores: Record<FitnessMetricKey, number | null> = {
    flexibility: null,
    strength: null,
    endurance: null,
    balance: null,
    speed: null,
  };

  for (const key of FITNESS_METRIC_KEYS) {
    const values = records
      .map((r) => r[key])
      .filter((v): v is number => v !== null);
    if (values.length > 0) {
      averageScores[key] =
        Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) /
        10;
    }
  }

  // 최근 5회 기록 기반 추세
  const progressTrend: Record<FitnessMetricKey, number | null> = {
    flexibility: null,
    strength: null,
    endurance: null,
    balance: null,
    speed: null,
  };

  const recent5 = records.slice(0, 5);
  if (recent5.length >= 2) {
    for (const key of FITNESS_METRIC_KEYS) {
      const values = recent5
        .map((r) => r[key])
        .filter((v): v is number => v !== null);
      if (values.length >= 2) {
        // 가장 최근(index 0) - 가장 오래된 것(last index) = 추세
        progressTrend[key] = values[0] - values[values.length - 1];
      }
    }
  }

  return { totalRecords, latestRecord, averageScores, progressTrend };
}

// ============================================================
// 훅
// ============================================================

export function useMemberFitnessTest(memberId: string) {
  const [records, setRecords] = useState<FitnessTestRecord[]>(() =>
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
    (nextRecords: FitnessTestRecord[]) => {
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
      params: Omit<FitnessTestRecord, "id" | "createdAt">
    ): FitnessTestRecord => {
      const newRecord: FitnessTestRecord = {
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
      patch: Partial<Omit<FitnessTestRecord, "id" | "createdAt">>
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

  /** 연도 목록 (중복 제거, 내림차순) */
  const years = Array.from(
    new Set(records.map((r) => r.date.slice(0, 4)))
  ).sort((a, b) => b.localeCompare(a));

  return {
    records,
    loading: false,
    years,
    stats,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: reload,
  };
}
