"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AttendanceForecastData,
  AttendanceMemberForecast,
  AttendancePattern,
  DayOfWeek,
} from "@/types";

// ─── 상수 ──────────────────────────────────────────────────────

const DAYS_OF_WEEK: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

// ─── localStorage 헬퍼 ─────────────────────────────────────────

function loadData(groupId: string): AttendanceForecastData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(
      `dancebase:attendance-forecast:${groupId}`
    );
    if (!raw) return null;
    return JSON.parse(raw) as AttendanceForecastData;
  } catch {
    return null;
  }
}

function saveData(groupId: string, data: AttendanceForecastData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `dancebase:attendance-forecast:${groupId}`,
      JSON.stringify(data)
    );
  } catch {
    /* ignore */
  }
}

// ─── 시뮬레이션 데이터 생성 ───────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 멤버 한 명의 요일별 출석 패턴을 랜덤 생성합니다.
 * 멤버마다 "선호 요일"을 1~2개 정해 해당 요일 출석률을 높입니다.
 */
function generatePatterns(_memberId: string): AttendancePattern[] {
  // 멤버 ID 기반 시드값으로 일관된 패턴 생성 (재생성 시 변화 허용)
  const favDayCount = randomInt(1, 2);
  const favDayIndices = new Set<number>();
  while (favDayIndices.size < favDayCount) {
    favDayIndices.add(randomInt(0, 6));
  }

  return DAYS_OF_WEEK.map((day, idx) => {
    const isFav = favDayIndices.has(idx);
    const baseRate = isFav ? randomInt(70, 95) : randomInt(30, 70);
    const noise = randomInt(-5, 5);
    const avgRate = Math.min(100, Math.max(0, baseRate + noise));
    const totalSessions = randomInt(3, 12);
    return { dayOfWeek: day, avgRate, totalSessions };
  });
}

/**
 * 전체 출석률 계산: 요일별 avgRate의 가중 평균 (totalSessions 기준)
 */
function calcOverallRate(patterns: AttendancePattern[]): number {
  const totalSessions = patterns.reduce((s, p) => s + p.totalSessions, 0);
  if (totalSessions === 0) return 0;
  const weightedSum = patterns.reduce(
    (s, p) => s + p.avgRate * p.totalSessions,
    0
  );
  return Math.round(weightedSum / totalSessions);
}

/**
 * 추세 계산: 랜덤이지만 overallRate에 따라 편향
 * - 높은 출석률 멤버는 improving/stable 가능성 높음
 * - 낮은 출석률 멤버는 declining/stable 가능성 높음
 */
function calcTrend(
  overallRate: number
): "improving" | "stable" | "declining" {
  const r = Math.random();
  if (overallRate >= 75) {
    if (r < 0.45) return "improving";
    if (r < 0.85) return "stable";
    return "declining";
  } else if (overallRate >= 50) {
    if (r < 0.3) return "improving";
    if (r < 0.7) return "stable";
    return "declining";
  } else {
    if (r < 0.15) return "improving";
    if (r < 0.5) return "stable";
    return "declining";
  }
}

/**
 * 다음 출석 예측률 계산
 * - 추세 반영: improving +5~10%, declining -5~10%, stable ±3%
 * - 최근 출석률 기반
 */
function calcPredictedNextRate(
  overallRate: number,
  trend: "improving" | "stable" | "declining"
): number {
  let delta = 0;
  if (trend === "improving") delta = randomInt(5, 10);
  else if (trend === "declining") delta = -randomInt(5, 10);
  else delta = randomInt(-3, 3);
  return Math.min(100, Math.max(0, overallRate + delta));
}

/**
 * 멤버 목록 기반 시뮬레이션 데이터 생성
 */
export function generateForecast(
  groupId: string,
  members: { id: string; name: string }[]
): AttendanceForecastData {
  const forecasts: AttendanceMemberForecast[] = members.map((m) => {
    const patterns = generatePatterns(m.id);
    const overallRate = calcOverallRate(patterns);
    const trend = calcTrend(overallRate);
    const predictedNextRate = calcPredictedNextRate(overallRate, trend);

    return {
      memberId: m.id,
      memberName: m.name,
      overallRate,
      trend,
      patterns,
      predictedNextRate,
    };
  });

  // 그룹 전체 요일별 평균 출석률 계산 (bestDay/worstDay)
  const dayAvgRates: Record<DayOfWeek, number> = {} as Record<
    DayOfWeek,
    number
  >;
  for (const day of DAYS_OF_WEEK) {
    const rates = forecasts.map(
      (f) => f.patterns.find((p: AttendancePattern) => p.dayOfWeek === day)?.avgRate ?? 0
    );
    dayAvgRates[day] =
      rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
  }

  let bestDay: DayOfWeek = "mon";
  let worstDay: DayOfWeek = "mon";
  let bestRate = -1;
  let worstRate = 101;

  for (const day of DAYS_OF_WEEK) {
    if (dayAvgRates[day] > bestRate) {
      bestRate = dayAvgRates[day];
      bestDay = day;
    }
    if (dayAvgRates[day] < worstRate) {
      worstRate = dayAvgRates[day];
      worstDay = day;
    }
  }

  // 그룹 추세: 멤버 추세 투표 (다수결)
  const trendCounts: Record<"improving" | "stable" | "declining", number> = {
    improving: 0,
    stable: 0,
    declining: 0,
  };
  for (const f of forecasts) {
    trendCounts[f.trend]++;
  }
  const groupTrend = (
    Object.entries(trendCounts) as [
      "improving" | "stable" | "declining",
      number
    ][]
  ).sort((a, b) => b[1] - a[1])[0][0];

  return {
    groupId,
    forecasts,
    bestDay,
    worstDay,
    groupTrend,
    updatedAt: new Date().toISOString(),
  };
}

// ─── 데모 멤버 목록 ───────────────────────────────────────────

const DEMO_MEMBERS = [
  { id: "demo-1", name: "김지수" },
  { id: "demo-2", name: "이민준" },
  { id: "demo-3", name: "박서연" },
  { id: "demo-4", name: "최현우" },
  { id: "demo-5", name: "정유나" },
  { id: "demo-6", name: "한태양" },
];

// ─── 훅 ───────────────────────────────────────────────────────

export function useAttendanceForecast(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.attendanceForecast(groupId) : null,
    (): AttendanceForecastData => {
      // localStorage에서 기존 데이터 로드
      const cached = loadData(groupId);
      if (cached) return cached;

      // 없으면 데모 데이터 생성 후 저장
      const fresh = generateForecast(groupId, DEMO_MEMBERS);
      saveData(groupId, fresh);
      return fresh;
    }
  );

  /**
   * 새로운 멤버 목록으로 예측 데이터 재생성
   */
  function refreshForecast(
    members?: { id: string; name: string }[]
  ): void {
    const list = members && members.length > 0 ? members : DEMO_MEMBERS;
    const fresh = generateForecast(groupId, list);
    saveData(groupId, fresh);
    mutate(fresh, false);
  }

  /**
   * 출석률 높은 순으로 정렬된 멤버 예측 목록
   */
  const sortedByHighest = [...(data?.forecasts ?? [])].sort(
    (a, b) => b.overallRate - a.overallRate
  );

  /**
   * 출석률 낮은 순으로 정렬된 멤버 예측 목록
   */
  const sortedByLowest = [...(data?.forecasts ?? [])].sort(
    (a, b) => a.overallRate - b.overallRate
  );

  /**
   * 그룹 전체 요일별 평균 출석률 (CSS 바 차트용)
   */
  const dayAvgRates: Record<DayOfWeek, number> = (() => {
    const result = {} as Record<DayOfWeek, number>;
    for (const day of DAYS_OF_WEEK) {
      const rates = (data?.forecasts ?? []).map(
        (f) => f.patterns.find((p: AttendancePattern) => p.dayOfWeek === day)?.avgRate ?? 0
      );
      result[day] =
        rates.length > 0
          ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
          : 0;
    }
    return result;
  })();

  return {
    data: data ?? null,
    loading: isLoading,
    sortedByHighest,
    sortedByLowest,
    dayAvgRates,
    refreshForecast,
    refetch: () => mutate(),
  };
}
