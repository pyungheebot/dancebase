"use client";

import { useCallback, useState } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { saveToStorage } from "@/lib/local-storage";
import type {
  DanceStyleAnalysisData,
  DanceStyleSnapshot,
  DanceStyleTrait,
  DanceStyleTraitScores,
} from "@/types";

// ============================================================
// 상수 정의
// ============================================================

export const TRAIT_LABELS: Record<DanceStyleTrait, string> = {
  power: "파워",
  flexibility: "유연성",
  rhythm: "리듬감",
  expression: "표현력",
  technique: "테크닉",
  musicality: "음악성",
};

export const TRAIT_COLORS: Record<DanceStyleTrait, string> = {
  power: "bg-red-500",
  flexibility: "bg-green-500",
  rhythm: "bg-blue-500",
  expression: "bg-purple-500",
  technique: "bg-orange-500",
  musicality: "bg-pink-500",
};

export const TRAIT_TEXT_COLORS: Record<DanceStyleTrait, string> = {
  power: "text-red-600",
  flexibility: "text-green-600",
  rhythm: "text-blue-600",
  expression: "text-purple-600",
  technique: "text-orange-600",
  musicality: "text-pink-600",
};

export const ALL_TRAITS: DanceStyleTrait[] = [
  "power",
  "flexibility",
  "rhythm",
  "expression",
  "technique",
  "musicality",
];

export const DEFAULT_TRAIT_SCORES: DanceStyleTraitScores = {
  power: 5,
  flexibility: 5,
  rhythm: 5,
  expression: 5,
  technique: 5,
  musicality: 5,
};

/** 장르 추천 목록 */
export const GENRE_SUGGESTIONS = [
  "힙합",
  "팝핑",
  "락킹",
  "왁킹",
  "하우스",
  "크럼프",
  "브레이킹",
  "왈츠",
  "탱고",
  "살사",
  "재즈",
  "컨템포러리",
  "발레",
  "스트릿",
  "케이팝",
  "걸스힙합",
  "보그",
  "웨이킹",
];

/** 강점/약점 추천 태그 */
export const STRENGTH_TAGS = [
  "강한 파워",
  "정확한 리듬",
  "풍부한 표현",
  "섬세한 테크닉",
  "높은 유연성",
  "음악 해석력",
  "무대 장악력",
  "팀워크",
  "즉흥 능력",
  "스타일 다양성",
];

export const WEAKNESS_TAGS = [
  "유연성 부족",
  "리듬 불안정",
  "표현 억제",
  "테크닉 미숙",
  "파워 부족",
  "무대 경험 부족",
  "음악 해석 약함",
  "체력 부족",
  "집중력 분산",
];

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.danceStyleAnalysis(memberId);
}

function makeEmpty(memberId: string): DanceStyleAnalysisData {
  return {
    memberId,
    snapshots: [],
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 날짜 유틸
// ============================================================

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================================
// 파생 분석 타입
// ============================================================

export type StyleAnalysisStats = {
  /** 전체 평균 점수 */
  overallAverage: number;
  /** 최고 특성 */
  topTrait: DanceStyleTrait | null;
  /** 최저 특성 */
  bottomTrait: DanceStyleTrait | null;
  /** 특성별 점수 */
  traitScores: DanceStyleTraitScores;
  /** 스냅샷 수 */
  totalSnapshots: number;
};

// ============================================================
// 점수 색상 헬퍼
// ============================================================

export function getScoreBarColor(score: number): string {
  if (score >= 8) return "bg-green-500";
  if (score >= 6) return "bg-blue-500";
  if (score >= 4) return "bg-yellow-500";
  return "bg-red-500";
}

export function getScoreTextStyle(score: number): string {
  if (score >= 8) return "text-green-600 font-semibold";
  if (score >= 6) return "text-blue-600 font-semibold";
  if (score >= 4) return "text-yellow-600 font-semibold";
  return "text-red-600 font-semibold";
}

// ============================================================
// 훅
// ============================================================

export function useDanceStyleAnalysis(memberId: string) {
  const [data, setData] = useState<DanceStyleAnalysisData>(() =>
    makeEmpty(memberId)
  );

  // 상태 업데이트 + localStorage 동기화
  const updateData = useCallback(
    (updater: (prev: DanceStyleAnalysisData) => DanceStyleAnalysisData) => {
      setData((prev) => {
        const next = updater({ ...prev, updatedAt: new Date().toISOString() });
        saveToStorage(getStorageKey(memberId), next);
        return next;
      });
    },
    [memberId]
  );

  // ──────────────────────────────────────────
  // CRUD
  // ──────────────────────────────────────────

  /** 스냅샷 추가 */
  const addSnapshot = useCallback(
    (payload: Omit<DanceStyleSnapshot, "id" | "createdAt">) => {
      const newSnap: DanceStyleSnapshot = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      updateData((prev) => ({
        ...prev,
        snapshots: [newSnap, ...prev.snapshots].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
      }));
    },
    [updateData]
  );

  /** 스냅샷 수정 */
  const updateSnapshot = useCallback(
    (
      snapId: string,
      patch: Partial<Omit<DanceStyleSnapshot, "id" | "createdAt">>
    ) => {
      updateData((prev) => ({
        ...prev,
        snapshots: prev.snapshots.map((s) =>
          s.id === snapId ? { ...s, ...patch } : s
        ),
      }));
    },
    [updateData]
  );

  /** 스냅샷 삭제 */
  const deleteSnapshot = useCallback(
    (snapId: string) => {
      updateData((prev) => ({
        ...prev,
        snapshots: prev.snapshots.filter((s) => s.id !== snapId),
      }));
    },
    [updateData]
  );

  // ──────────────────────────────────────────
  // 분석 함수
  // ──────────────────────────────────────────

  /** 최신 스냅샷 기준 통계 계산 */
  const getStats = useCallback((): StyleAnalysisStats => {
    const latest = data.snapshots[0] ?? null;

    if (!latest) {
      return {
        overallAverage: 0,
        topTrait: null,
        bottomTrait: null,
        traitScores: { ...DEFAULT_TRAIT_SCORES },
        totalSnapshots: 0,
      };
    }

    const scores = latest.traitScores;
    const values = ALL_TRAITS.map((t) => scores[t]);
    const overallAverage =
      Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) /
      10;

    let topTrait: DanceStyleTrait = ALL_TRAITS[0];
    let bottomTrait: DanceStyleTrait = ALL_TRAITS[0];

    for (const trait of ALL_TRAITS) {
      if (scores[trait] > scores[topTrait]) topTrait = trait;
      if (scores[trait] < scores[bottomTrait]) bottomTrait = trait;
    }

    return {
      overallAverage,
      topTrait,
      bottomTrait,
      traitScores: scores,
      totalSnapshots: data.snapshots.length,
    };
  }, [data.snapshots]);

  /** 특정 특성의 시간 흐름에 따른 점수 변화 */
  const getTraitHistory = useCallback(
    (trait: DanceStyleTrait): { date: string; score: number }[] => {
      return [...data.snapshots]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => ({ date: s.date, score: s.traitScores[trait] }));
    },
    [data.snapshots]
  );

  /** 최근 N개 스냅샷 */
  const getRecentSnapshots = useCallback(
    (limit = 5): DanceStyleSnapshot[] => {
      return data.snapshots.slice(0, limit);
    },
    [data.snapshots]
  );

  // ──────────────────────────────────────────
  // 파생 데이터
  // ──────────────────────────────────────────

  const latestSnapshot = data.snapshots[0] ?? null;
  const stats = getStats();

  return {
    data,
    snapshots: data.snapshots,
    latestSnapshot,
    stats,
    addSnapshot,
    updateSnapshot,
    deleteSnapshot,
    getStats,
    getTraitHistory,
    getRecentSnapshots,
  };
}
