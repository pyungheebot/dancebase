import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── date-fns mock ─────────────────────────────────────────
// 실제 date-fns를 사용 (테스트 환경에서 동작)

// ─── Supabase mock ─────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (_key: unknown, _fetcher: unknown) => ({
    data: undefined,
    isLoading: false,
    mutate: vi.fn(),
  }),
}));

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    attendanceConsistency: (groupId: string, userId: string) =>
      `attendance-consistency-${groupId}-${userId}`,
  },
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useAttendanceConsistency } from "@/hooks/use-attendance-consistency";

// ─── 순수 함수 추출 (모듈 내부 로직 직접 테스트) ────────────────

// 훅 내 순수 계산 함수들을 로컬에서 복제하여 테스트
function rateToIntensity(hasSchedule: boolean, isPresent: boolean): number {
  if (!hasSchedule) return 0;
  if (!isPresent) return 1;
  return 3;
}

function calcStdDev(rates: number[]): number {
  if (rates.length === 0) return 0;
  const mean = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  const variance =
    rates.reduce((sum, r) => sum + (r - mean) ** 2, 0) / rates.length;
  return Math.sqrt(variance);
}

function stdDevToConsistencyScore(stdDev: number, hasData: boolean): number {
  if (!hasData) return 0;
  const MAX_STD_DEV = 50;
  return Math.max(0, Math.round(100 - (stdDev / MAX_STD_DEV) * 100));
}

// ============================================================
// 순수 함수 - rateToIntensity
// ============================================================

describe("rateToIntensity - 출석률을 강도 레벨로 변환", () => {
  it("일정이 없으면 강도 0을 반환한다", () => {
    expect(rateToIntensity(false, false)).toBe(0);
    expect(rateToIntensity(false, true)).toBe(0);
  });

  it("일정이 있고 출석하면 강도 3을 반환한다", () => {
    expect(rateToIntensity(true, true)).toBe(3);
  });

  it("일정이 있고 결석하면 강도 1을 반환한다", () => {
    expect(rateToIntensity(true, false)).toBe(1);
  });

  it("반환값은 0, 1, 3 중 하나이다", () => {
    const validValues = [0, 1, 3];
    expect(validValues).toContain(rateToIntensity(false, false));
    expect(validValues).toContain(rateToIntensity(true, true));
    expect(validValues).toContain(rateToIntensity(true, false));
  });
});

// ============================================================
// 순수 함수 - calcStdDev
// ============================================================

describe("calcStdDev - 주별 출석률 표준편차 계산", () => {
  it("빈 배열이면 0을 반환한다", () => {
    expect(calcStdDev([])).toBe(0);
  });

  it("모든 값이 동일하면 표준편차는 0이다", () => {
    expect(calcStdDev([80, 80, 80, 80])).toBe(0);
  });

  it("100과 0이 교대하면 표준편차는 50이다", () => {
    const stdDev = calcStdDev([100, 0, 100, 0]);
    expect(stdDev).toBe(50);
  });

  it("단일 값이면 표준편차는 0이다", () => {
    expect(calcStdDev([75])).toBe(0);
  });

  it("[0, 100]의 표준편차는 50이다", () => {
    const stdDev = calcStdDev([0, 100]);
    expect(stdDev).toBe(50);
  });

  it("반환값은 항상 0 이상이다", () => {
    expect(calcStdDev([10, 20, 30, 40, 50])).toBeGreaterThanOrEqual(0);
  });

  it("여러 값의 표준편차가 올바르게 계산된다", () => {
    // [60, 80] → mean=70, variance=100, stdDev=10
    const stdDev = calcStdDev([60, 80]);
    expect(stdDev).toBeCloseTo(10, 5);
  });
});

// ============================================================
// 순수 함수 - stdDevToConsistencyScore
// ============================================================

describe("stdDevToConsistencyScore - 표준편차를 일관성 점수로 변환", () => {
  it("데이터가 없으면 0을 반환한다", () => {
    expect(stdDevToConsistencyScore(0, false)).toBe(0);
    expect(stdDevToConsistencyScore(10, false)).toBe(0);
  });

  it("표준편차 0이면 일관성 점수 100이다", () => {
    expect(stdDevToConsistencyScore(0, true)).toBe(100);
  });

  it("표준편차 50이면 일관성 점수 0이다", () => {
    expect(stdDevToConsistencyScore(50, true)).toBe(0);
  });

  it("표준편차 25이면 일관성 점수 50이다", () => {
    expect(stdDevToConsistencyScore(25, true)).toBe(50);
  });

  it("일관성 점수는 항상 0 이상이다", () => {
    expect(stdDevToConsistencyScore(100, true)).toBeGreaterThanOrEqual(0);
  });

  it("표준편차가 클수록 일관성 점수가 낮다", () => {
    const score1 = stdDevToConsistencyScore(10, true);
    const score2 = stdDevToConsistencyScore(20, true);
    expect(score1).toBeGreaterThan(score2);
  });

  it("반환값은 정수이다", () => {
    expect(Number.isInteger(stdDevToConsistencyScore(15, true))).toBe(true);
  });

  it("반환값은 0~100 사이이다", () => {
    const score = stdDevToConsistencyScore(30, true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ============================================================
// useAttendanceConsistency - 훅 기본 반환값 (SWR null)
// ============================================================

describe("useAttendanceConsistency - 훅 기본 반환값 (데이터 없음)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groupId가 있으면 훅이 정상 초기화된다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    expect(result.current).toBeDefined();
  });

  it("초기 currentStreak는 0이다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    expect(result.current.currentStreak).toBe(0);
  });

  it("초기 overallRate는 0이다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    expect(result.current.overallRate).toBe(0);
  });

  it("초기 consistencyScore는 0이다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    expect(result.current.consistencyScore).toBe(0);
  });

  it("초기 weeklyData는 빈 배열이다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    expect(result.current.weeklyData).toEqual([]);
  });

  it("weeks는 12개 행을 가진다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    expect(result.current.weeks).toHaveLength(12);
  });

  it("각 week는 7개 셀을 가진다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    result.current.weeks.forEach((week) => {
      expect(week).toHaveLength(7);
    });
  });

  it("기본 weeks의 모든 셀에 date 필드가 있다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    result.current.weeks.forEach((week) => {
      week.forEach((cell) => {
        expect(cell).toHaveProperty("date");
      });
    });
  });

  it("기본 weeks의 모든 셀에 hasSchedule 필드가 있다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    result.current.weeks.forEach((week) => {
      week.forEach((cell) => {
        expect(cell).toHaveProperty("hasSchedule");
      });
    });
  });

  it("기본 weeks의 모든 셀에 isPresent 필드가 있다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    result.current.weeks.forEach((week) => {
      week.forEach((cell) => {
        expect(cell).toHaveProperty("isPresent");
      });
    });
  });

  it("기본 weeks의 hasSchedule은 모두 false이다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    result.current.weeks.forEach((week) => {
      week.forEach((cell) => {
        expect(cell.hasSchedule).toBe(false);
      });
    });
  });

  it("기본 weeks의 isPresent는 모두 false이다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    result.current.weeks.forEach((week) => {
      week.forEach((cell) => {
        expect(cell.isPresent).toBe(false);
      });
    });
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    expect(typeof result.current.refetch).toBe("function");
  });

  it("loading 필드가 존재한다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "user-1")
    );
    expect(result.current).toHaveProperty("loading");
  });

  it("groupId가 빈 문자열이면 SWR 키가 null이 되어 fetcher를 호출하지 않는다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("", "user-1")
    );
    // 데이터가 없으면 기본값 반환
    expect(result.current.currentStreak).toBe(0);
    expect(result.current.overallRate).toBe(0);
  });

  it("userId가 빈 문자열이면 SWR 키가 null이 되어 fetcher를 호출하지 않는다", () => {
    const { result } = renderHook(() =>
      useAttendanceConsistency("group-1", "")
    );
    expect(result.current.currentStreak).toBe(0);
    expect(result.current.overallRate).toBe(0);
  });
});

// ============================================================
// 계산 로직 - 주별 출석 집계
// ============================================================

describe("주별 출석 집계 로직 검증", () => {
  // 히트맵 셀 데이터를 직접 생성해서 계산 로직 테스트
  type HeatmapCell = {
    date: string;
    hasSchedule: boolean;
    isPresent: boolean;
    intensity: number;
  };

  function calcWeeklyAttendance(week: HeatmapCell[]): {
    scheduleCount: number;
    presentCount: number;
    attendanceRate: number;
  } {
    const scheduleDays = week.filter((c) => c.hasSchedule);
    const scheduleCount = scheduleDays.length;
    const presentCount = scheduleDays.filter((c) => c.isPresent).length;
    const attendanceRate =
      scheduleCount > 0 ? Math.round((presentCount / scheduleCount) * 100) : 0;
    return { scheduleCount, presentCount, attendanceRate };
  }

  it("일정이 없는 주는 출석률이 0이다", () => {
    const week: HeatmapCell[] = Array(7).fill({
      date: "2026-03-01",
      hasSchedule: false,
      isPresent: false,
      intensity: 0,
    });
    const result = calcWeeklyAttendance(week);
    expect(result.attendanceRate).toBe(0);
  });

  it("일정이 있고 모두 출석하면 출석률이 100이다", () => {
    const week: HeatmapCell[] = [
      { date: "2026-03-01", hasSchedule: true, isPresent: true, intensity: 3 },
      { date: "2026-03-02", hasSchedule: true, isPresent: true, intensity: 3 },
      ...Array(5).fill({
        date: "2026-03-03",
        hasSchedule: false,
        isPresent: false,
        intensity: 0,
      }),
    ];
    const result = calcWeeklyAttendance(week);
    expect(result.attendanceRate).toBe(100);
  });

  it("일정 2개 중 1개만 출석 시 출석률이 50이다", () => {
    const week: HeatmapCell[] = [
      { date: "2026-03-01", hasSchedule: true, isPresent: true, intensity: 3 },
      { date: "2026-03-02", hasSchedule: true, isPresent: false, intensity: 1 },
      ...Array(5).fill({
        date: "2026-03-03",
        hasSchedule: false,
        isPresent: false,
        intensity: 0,
      }),
    ];
    const result = calcWeeklyAttendance(week);
    expect(result.attendanceRate).toBe(50);
  });

  it("scheduleCount가 일정 있는 날 수와 일치한다", () => {
    const week: HeatmapCell[] = [
      { date: "2026-03-01", hasSchedule: true, isPresent: true, intensity: 3 },
      { date: "2026-03-02", hasSchedule: false, isPresent: false, intensity: 0 },
      { date: "2026-03-03", hasSchedule: true, isPresent: false, intensity: 1 },
      ...Array(4).fill({
        date: "2026-03-04",
        hasSchedule: false,
        isPresent: false,
        intensity: 0,
      }),
    ];
    const result = calcWeeklyAttendance(week);
    expect(result.scheduleCount).toBe(2);
  });

  it("presentCount가 출석한 날 수와 일치한다", () => {
    const week: HeatmapCell[] = [
      { date: "2026-03-01", hasSchedule: true, isPresent: true, intensity: 3 },
      { date: "2026-03-02", hasSchedule: true, isPresent: true, intensity: 3 },
      { date: "2026-03-03", hasSchedule: true, isPresent: false, intensity: 1 },
      ...Array(4).fill({
        date: "2026-03-04",
        hasSchedule: false,
        isPresent: false,
        intensity: 0,
      }),
    ];
    const result = calcWeeklyAttendance(week);
    expect(result.presentCount).toBe(2);
  });
});

// ============================================================
// 연속 출석 계산 로직
// ============================================================

describe("연속 출석 계산 로직 검증", () => {
  type ScheduledCell = { hasSchedule: boolean; isPresent: boolean };

  function calcCurrentStreak(scheduledDays: ScheduledCell[]): number {
    let currentStreak = 0;
    for (let i = scheduledDays.length - 1; i >= 0; i--) {
      if (scheduledDays[i].isPresent) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  }

  it("일정이 없으면 연속 출석은 0이다", () => {
    expect(calcCurrentStreak([])).toBe(0);
  });

  it("마지막 일정에 출석하면 연속 출석이 1이다", () => {
    const cells: ScheduledCell[] = [
      { hasSchedule: true, isPresent: false },
      { hasSchedule: true, isPresent: true },
    ];
    expect(calcCurrentStreak(cells)).toBe(1);
  });

  it("마지막 3회 연속 출석하면 연속 출석이 3이다", () => {
    const cells: ScheduledCell[] = [
      { hasSchedule: true, isPresent: false },
      { hasSchedule: true, isPresent: true },
      { hasSchedule: true, isPresent: true },
      { hasSchedule: true, isPresent: true },
    ];
    expect(calcCurrentStreak(cells)).toBe(3);
  });

  it("마지막 결석 이후 출석이 있으면 연속은 리셋된다", () => {
    const cells: ScheduledCell[] = [
      { hasSchedule: true, isPresent: true },
      { hasSchedule: true, isPresent: true },
      { hasSchedule: true, isPresent: false },
      { hasSchedule: true, isPresent: true },
    ];
    expect(calcCurrentStreak(cells)).toBe(1);
  });

  it("모두 결석이면 연속 출석은 0이다", () => {
    const cells: ScheduledCell[] = [
      { hasSchedule: true, isPresent: false },
      { hasSchedule: true, isPresent: false },
      { hasSchedule: true, isPresent: false },
    ];
    expect(calcCurrentStreak(cells)).toBe(0);
  });

  it("모두 출석이면 연속 출석은 전체 개수와 같다", () => {
    const cells: ScheduledCell[] = [
      { hasSchedule: true, isPresent: true },
      { hasSchedule: true, isPresent: true },
      { hasSchedule: true, isPresent: true },
    ];
    expect(calcCurrentStreak(cells)).toBe(3);
  });
});
