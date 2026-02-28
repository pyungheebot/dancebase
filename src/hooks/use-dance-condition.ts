"use client";

import { useCallback, useState, useEffect } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceConditionEntry,
  DanceConditionLog,
  DanceConditionPainArea,
  DanceConditionIntensity,
} from "@/types";

// ============================================================
// 상수 레이블
// ============================================================

export const PAIN_AREA_LABELS: Record<DanceConditionPainArea, string> = {
  neck: "목",
  shoulder: "어깨",
  back: "등",
  waist: "허리",
  hip: "고관절",
  knee: "무릎",
  ankle: "발목",
  wrist: "손목",
  elbow: "팔꿈치",
  calf: "종아리",
  thigh: "허벅지",
  foot: "발",
  none: "통증 없음",
};

export const INTENSITY_LABELS: Record<DanceConditionIntensity, string> = {
  rest: "휴식",
  light: "가벼운",
  moderate: "보통",
  hard: "힘든",
  extreme: "극강",
};

export const INTENSITY_COLORS: Record<DanceConditionIntensity, string> = {
  rest: "bg-slate-100 text-slate-600 border-slate-200",
  light: "bg-green-100 text-green-700 border-green-200",
  moderate: "bg-blue-100 text-blue-700 border-blue-200",
  hard: "bg-orange-100 text-orange-700 border-orange-200",
  extreme: "bg-red-100 text-red-700 border-red-200",
};

export const PAIN_AREA_LIST: DanceConditionPainArea[] = [
  "none",
  "neck",
  "shoulder",
  "back",
  "waist",
  "hip",
  "knee",
  "ankle",
  "wrist",
  "elbow",
  "calf",
  "thigh",
  "foot",
];

export const INTENSITY_LIST: DanceConditionIntensity[] = [
  "rest",
  "light",
  "moderate",
  "hard",
  "extreme",
];

// ============================================================
// 점수 → 색상 헬퍼
// ============================================================

export function getScoreColor(score: number): string {
  if (score >= 8) return "bg-green-500";
  if (score >= 6) return "bg-blue-500";
  if (score >= 4) return "bg-yellow-500";
  return "bg-red-500";
}

export function getScoreTextColor(score: number): string {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-blue-600";
  if (score >= 4) return "text-yellow-600";
  return "text-red-600";
}

export function getScoreLabel(score: number): string {
  if (score >= 9) return "최상";
  if (score >= 7) return "좋음";
  if (score >= 5) return "보통";
  if (score >= 3) return "나쁨";
  return "매우 나쁨";
}

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.danceCondition(memberId);
}

function makeEmpty(memberId: string): DanceConditionEntry {
  return {
    memberId,
    logs: [],
    updatedAt: new Date().toISOString(),
  };
}

function loadData(memberId: string): DanceConditionEntry {
  if (typeof window === "undefined") return makeEmpty(memberId);
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    if (!raw) return makeEmpty(memberId);
    return JSON.parse(raw) as DanceConditionEntry;
  } catch {
    return makeEmpty(memberId);
  }
}

function saveData(entry: DanceConditionEntry): void {
  localStorage.setItem(getStorageKey(entry.memberId), JSON.stringify(entry));
}

// ============================================================
// 날짜 유틸
// ============================================================

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=일
  d.setDate(d.getDate() - day);
  return d;
}

// ============================================================
// 파생 분석 타입
// ============================================================

export type DanceConditionWeeklyAvg = {
  weekStart: string;      // YYYY-MM-DD (주 시작일, 일요일)
  avgOverall: number;
  avgEnergy: number;
  avgFocus: number;
  avgMuscle: number;
  count: number;
};

export type DanceConditionTrend = "up" | "down" | "stable" | "nodata";

// ============================================================
// 훅
// ============================================================

export function useDanceCondition(memberId: string) {
  const [entry, setEntry] = useState<DanceConditionEntry>(() =>
    makeEmpty(memberId)
  );

  // 초기 로드
  useEffect(() => {
    setEntry(loadData(memberId));
  }, [memberId]);

  // 상태 업데이트 + localStorage 동기화
  const updateEntry = useCallback(
    (updater: (prev: DanceConditionEntry) => DanceConditionEntry) => {
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
  const addLog = useCallback(
    (payload: Omit<DanceConditionLog, "id" | "createdAt">) => {
      const newLog: DanceConditionLog = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      updateEntry((prev) => ({
        ...prev,
        // 날짜 기준 내림차순 정렬 (최신 먼저)
        logs: [newLog, ...prev.logs].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
      }));
    },
    [updateEntry]
  );

  /** 기록 수정 */
  const updateLog = useCallback(
    (logId: string, patch: Partial<Omit<DanceConditionLog, "id" | "createdAt">>) => {
      updateEntry((prev) => ({
        ...prev,
        logs: prev.logs.map((l) =>
          l.id === logId ? { ...l, ...patch } : l
        ),
      }));
    },
    [updateEntry]
  );

  /** 기록 삭제 */
  const deleteLog = useCallback(
    (logId: string) => {
      updateEntry((prev) => ({
        ...prev,
        logs: prev.logs.filter((l) => l.id !== logId),
      }));
    },
    [updateEntry]
  );

  // ──────────────────────────────────────────
  // 분석 함수
  // ──────────────────────────────────────────

  /** 주간 평균 계산 (최근 N주, 기본 4주) */
  const getWeeklyAverages = useCallback(
    (weeks = 4): DanceConditionWeeklyAvg[] => {
      const today = new Date();
      const result: DanceConditionWeeklyAvg[] = [];

      for (let w = weeks - 1; w >= 0; w--) {
        const weekDate = new Date(today);
        weekDate.setDate(today.getDate() - w * 7);
        const ws = startOfWeek(weekDate);
        const we = new Date(ws);
        we.setDate(ws.getDate() + 6);

        const wsStr = toDateStr(ws);
        const weStr = toDateStr(we);

        const weekLogs = entry.logs.filter(
          (l) => l.date >= wsStr && l.date <= weStr
        );

        if (weekLogs.length === 0) {
          result.push({
            weekStart: wsStr,
            avgOverall: 0,
            avgEnergy: 0,
            avgFocus: 0,
            avgMuscle: 0,
            count: 0,
          });
        } else {
          const avg = (field: keyof Pick<DanceConditionLog, "overallScore" | "energyLevel" | "focusLevel" | "muscleCondition">) =>
            Math.round(
              (weekLogs.reduce((s, l) => s + l[field], 0) / weekLogs.length) * 10
            ) / 10;

          result.push({
            weekStart: wsStr,
            avgOverall: avg("overallScore"),
            avgEnergy: avg("energyLevel"),
            avgFocus: avg("focusLevel"),
            avgMuscle: avg("muscleCondition"),
            count: weekLogs.length,
          });
        }
      }
      return result;
    },
    [entry.logs]
  );

  /** 최근 N일 기록 */
  const getRecentLogs = useCallback(
    (days = 7): DanceConditionLog[] => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days + 1);
      const cutoffStr = toDateStr(cutoff);
      return entry.logs.filter((l) => l.date >= cutoffStr);
    },
    [entry.logs]
  );

  /** 월간 평균 (현재 월) */
  const getMonthlyAverage = useCallback((): {
    avgOverall: number;
    avgEnergy: number;
    avgFocus: number;
    avgMuscle: number;
    count: number;
  } => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `${y}-${m}`;
    const monthLogs = entry.logs.filter((l) => l.date.startsWith(prefix));

    if (monthLogs.length === 0) {
      return { avgOverall: 0, avgEnergy: 0, avgFocus: 0, avgMuscle: 0, count: 0 };
    }

    const avg = (field: keyof Pick<DanceConditionLog, "overallScore" | "energyLevel" | "focusLevel" | "muscleCondition">) =>
      Math.round(
        (monthLogs.reduce((s, l) => s + l[field], 0) / monthLogs.length) * 10
      ) / 10;

    return {
      avgOverall: avg("overallScore"),
      avgEnergy: avg("energyLevel"),
      avgFocus: avg("focusLevel"),
      avgMuscle: avg("muscleCondition"),
      count: monthLogs.length,
    };
  }, [entry.logs]);

  /** 전체 컨디션 트렌드 (최근 7일 vs 이전 7일 비교) */
  const getOverallTrend = useCallback((): DanceConditionTrend => {
    const today = new Date();
    const r1Start = new Date(today);
    r1Start.setDate(today.getDate() - 6);
    const r2Start = new Date(today);
    r2Start.setDate(today.getDate() - 13);
    const r2End = new Date(today);
    r2End.setDate(today.getDate() - 7);

    const recent = entry.logs.filter(
      (l) => l.date >= toDateStr(r1Start) && l.date <= toDateStr(today)
    );
    const prev = entry.logs.filter(
      (l) => l.date >= toDateStr(r2Start) && l.date <= toDateStr(r2End)
    );

    if (recent.length === 0 && prev.length === 0) return "nodata";
    if (recent.length === 0 || prev.length === 0) return "stable";

    const recentAvg =
      recent.reduce((s, l) => s + l.overallScore, 0) / recent.length;
    const prevAvg =
      prev.reduce((s, l) => s + l.overallScore, 0) / prev.length;

    const diff = recentAvg - prevAvg;
    if (diff > 0.5) return "up";
    if (diff < -0.5) return "down";
    return "stable";
  }, [entry.logs]);

  /** 가장 자주 통증 부위 (상위 3개, none 제외) */
  const getTopPainAreas = useCallback(
    (topN = 3): { area: DanceConditionPainArea; count: number }[] => {
      const counter: Partial<Record<DanceConditionPainArea, number>> = {};
      for (const log of entry.logs) {
        for (const area of log.painAreas) {
          if (area === "none") continue;
          counter[area] = (counter[area] ?? 0) + 1;
        }
      }
      return Object.entries(counter)
        .map(([area, count]) => ({
          area: area as DanceConditionPainArea,
          count: count ?? 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topN);
    },
    [entry.logs]
  );

  // ──────────────────────────────────────────
  // 파생 데이터
  // ──────────────────────────────────────────

  const todayStr = toDateStr(new Date());
  const todayLog = entry.logs.find((l) => l.date === todayStr) ?? null;
  const recentLogs = entry.logs.slice(0, 10);

  return {
    entry,
    logs: entry.logs,
    recentLogs,
    todayLog,
    addLog,
    updateLog,
    deleteLog,
    getWeeklyAverages,
    getRecentLogs,
    getMonthlyAverage,
    getOverallTrend,
    getTopPainAreas,
  };
}
