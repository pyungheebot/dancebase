import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (memStore[key] as T) ?? defaultValue,
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (_key: unknown, fetcher: (() => unknown) | null) => {
    if (!fetcher) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    const result = fetcher();
    return { data: result, isLoading: false, mutate: vi.fn() };
  },
}));

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    attendanceForecast: (groupId: string) =>
      `attendance-forecast-${groupId}`,
  },
}));

// ─── 훅 import ────────────────────────────────────────────────
import {
  useAttendanceForecast,
  generateForecast,
} from "@/hooks/use-attendance-forecast";
import type { AttendancePattern, DayOfWeek } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
const DAYS_OF_WEEK: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

// ============================================================
// generateForecast - 순수 함수 테스트
// ============================================================

describe("generateForecast - 그룹 예측 데이터 생성", () => {
  beforeEach(() => {
    clearStore();
  });

  it("멤버 목록으로 예측 데이터를 생성한다", () => {
    const members = [
      { id: "m1", name: "홍길동" },
      { id: "m2", name: "김철수" },
    ];
    const result = generateForecast("group-1", members);
    expect(result).toBeDefined();
    expect(result.forecasts).toHaveLength(2);
  });

  it("groupId가 올바르게 설정된다", () => {
    const result = generateForecast("my-group", [{ id: "m1", name: "홍" }]);
    expect(result.groupId).toBe("my-group");
  });

  it("updatedAt이 ISO 8601 형식이다", () => {
    const result = generateForecast("group-1", [{ id: "m1", name: "홍" }]);
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("멤버 없이도 예측 데이터가 생성된다", () => {
    const result = generateForecast("group-1", []);
    expect(result).toBeDefined();
    expect(result.forecasts).toHaveLength(0);
  });

  it("각 멤버 예측에 memberId가 설정된다", () => {
    const members = [{ id: "user-abc", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    expect(result.forecasts[0].memberId).toBe("user-abc");
  });

  it("각 멤버 예측에 memberName이 설정된다", () => {
    const members = [{ id: "m1", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    expect(result.forecasts[0].memberName).toBe("홍길동");
  });

  it("각 멤버 예측에 7개의 요일 패턴이 있다", () => {
    const members = [{ id: "m1", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    expect(result.forecasts[0].patterns).toHaveLength(7);
  });

  it("각 요일 패턴의 avgRate는 0~100 사이이다", () => {
    const members = [{ id: "m1", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    result.forecasts[0].patterns.forEach((p: AttendancePattern) => {
      expect(p.avgRate).toBeGreaterThanOrEqual(0);
      expect(p.avgRate).toBeLessThanOrEqual(100);
    });
  });

  it("각 요일 패턴의 totalSessions는 양수이다", () => {
    const members = [{ id: "m1", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    result.forecasts[0].patterns.forEach((p: AttendancePattern) => {
      expect(p.totalSessions).toBeGreaterThan(0);
    });
  });

  it("overallRate는 0~100 사이이다", () => {
    const members = [{ id: "m1", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    expect(result.forecasts[0].overallRate).toBeGreaterThanOrEqual(0);
    expect(result.forecasts[0].overallRate).toBeLessThanOrEqual(100);
  });

  it("trend는 improving/stable/declining 중 하나이다", () => {
    const members = [{ id: "m1", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    expect(["improving", "stable", "declining"]).toContain(
      result.forecasts[0].trend
    );
  });

  it("predictedNextRate는 0~100 사이이다", () => {
    const members = [{ id: "m1", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    expect(result.forecasts[0].predictedNextRate).toBeGreaterThanOrEqual(0);
    expect(result.forecasts[0].predictedNextRate).toBeLessThanOrEqual(100);
  });

  it("bestDay는 DAYS_OF_WEEK 중 하나이다", () => {
    const members = [{ id: "m1", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    expect(DAYS_OF_WEEK).toContain(result.bestDay);
  });

  it("worstDay는 DAYS_OF_WEEK 중 하나이다", () => {
    const members = [{ id: "m1", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    expect(DAYS_OF_WEEK).toContain(result.worstDay);
  });

  it("groupTrend는 improving/stable/declining 중 하나이다", () => {
    const members = [
      { id: "m1", name: "홍길동" },
      { id: "m2", name: "김철수" },
    ];
    const result = generateForecast("group-1", members);
    expect(["improving", "stable", "declining"]).toContain(result.groupTrend);
  });

  it("각 패턴의 dayOfWeek 값이 올바르다", () => {
    const members = [{ id: "m1", name: "홍길동" }];
    const result = generateForecast("group-1", members);
    const patternDays = result.forecasts[0].patterns.map(
      (p: AttendancePattern) => p.dayOfWeek
    );
    DAYS_OF_WEEK.forEach((day) => {
      expect(patternDays).toContain(day);
    });
  });
});

// ============================================================
// calcOverallRate - 가중 평균 출석률 계산 로직
// ============================================================

describe("calcOverallRate - 가중 평균 출석률 계산 로직", () => {
  // 훅 내부 로직 복제
  function calcOverallRate(patterns: AttendancePattern[]): number {
    const totalSessions = patterns.reduce((s, p) => s + p.totalSessions, 0);
    if (totalSessions === 0) return 0;
    const weightedSum = patterns.reduce(
      (s, p) => s + p.avgRate * p.totalSessions,
      0
    );
    return Math.round(weightedSum / totalSessions);
  }

  it("패턴이 없으면 0을 반환한다", () => {
    expect(calcOverallRate([])).toBe(0);
  });

  it("단일 패턴이면 avgRate와 같다", () => {
    const patterns: AttendancePattern[] = [
      { dayOfWeek: "mon", avgRate: 75, totalSessions: 5 },
    ];
    expect(calcOverallRate(patterns)).toBe(75);
  });

  it("totalSessions가 0인 패턴은 0을 반환한다", () => {
    const patterns: AttendancePattern[] = [
      { dayOfWeek: "mon", avgRate: 100, totalSessions: 0 },
    ];
    expect(calcOverallRate(patterns)).toBe(0);
  });

  it("동일한 totalSessions를 가진 패턴들은 단순 평균이다", () => {
    const patterns: AttendancePattern[] = [
      { dayOfWeek: "mon", avgRate: 60, totalSessions: 1 },
      { dayOfWeek: "tue", avgRate: 80, totalSessions: 1 },
    ];
    expect(calcOverallRate(patterns)).toBe(70);
  });

  it("totalSessions가 클수록 가중치가 높다", () => {
    // 60점(3세션) + 80점(1세션) = (180+80)/4 = 65
    const patterns: AttendancePattern[] = [
      { dayOfWeek: "mon", avgRate: 60, totalSessions: 3 },
      { dayOfWeek: "tue", avgRate: 80, totalSessions: 1 },
    ];
    expect(calcOverallRate(patterns)).toBe(65);
  });

  it("반환값은 반올림된 정수이다", () => {
    const patterns: AttendancePattern[] = [
      { dayOfWeek: "mon", avgRate: 67, totalSessions: 3 },
      { dayOfWeek: "tue", avgRate: 34, totalSessions: 3 },
    ];
    const result = calcOverallRate(patterns);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ============================================================
// useAttendanceForecast - 훅 동작
// ============================================================

describe("useAttendanceForecast - 훅 기본 동작", () => {
  beforeEach(() => {
    clearStore();
  });

  it("groupId가 있으면 훅이 정상 초기화된다", () => {
    const { result } = renderHook(() =>
      useAttendanceForecast("group-test")
    );
    expect(result.current).toBeDefined();
  });

  it("data가 반환된다", () => {
    const { result } = renderHook(() =>
      useAttendanceForecast("group-test")
    );
    expect(result.current.data).toBeDefined();
  });

  it("sortedByHighest는 overallRate 내림차순이다", () => {
    const { result } = renderHook(() =>
      useAttendanceForecast("group-sorted")
    );
    const sorted = result.current.sortedByHighest;
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].overallRate).toBeGreaterThanOrEqual(
        sorted[i].overallRate
      );
    }
  });

  it("sortedByLowest는 overallRate 오름차순이다", () => {
    const { result } = renderHook(() =>
      useAttendanceForecast("group-sorted2")
    );
    const sorted = result.current.sortedByLowest;
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].overallRate).toBeLessThanOrEqual(
        sorted[i].overallRate
      );
    }
  });

  it("dayAvgRates에 모든 요일이 포함된다", () => {
    const { result } = renderHook(() =>
      useAttendanceForecast("group-days")
    );
    DAYS_OF_WEEK.forEach((day) => {
      expect(result.current.dayAvgRates).toHaveProperty(day);
    });
  });

  it("dayAvgRates의 각 값은 0~100 사이이다", () => {
    const { result } = renderHook(() =>
      useAttendanceForecast("group-rates")
    );
    DAYS_OF_WEEK.forEach((day) => {
      const rate = result.current.dayAvgRates[day];
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    });
  });

  it("refreshForecast 함수가 존재한다", () => {
    const { result } = renderHook(() =>
      useAttendanceForecast("group-refresh")
    );
    expect(typeof result.current.refreshForecast).toBe("function");
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() =>
      useAttendanceForecast("group-refetch")
    );
    expect(typeof result.current.refetch).toBe("function");
  });

  it("loading 필드가 존재한다", () => {
    const { result } = renderHook(() =>
      useAttendanceForecast("group-loading")
    );
    expect(result.current).toHaveProperty("loading");
  });

  it("groupId가 빈 문자열이면 sortedByHighest가 빈 배열이다", () => {
    const { result } = renderHook(() => useAttendanceForecast(""));
    expect(result.current.sortedByHighest).toEqual([]);
  });

  it("groupId가 빈 문자열이면 sortedByLowest가 빈 배열이다", () => {
    const { result } = renderHook(() => useAttendanceForecast(""));
    expect(result.current.sortedByLowest).toEqual([]);
  });
});
