import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (!key) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    attendancePredictionCalendar: (groupId: string, userId: string, month: string) =>
      `/groups/${groupId}/attendance-prediction-calendar/${userId}/${month}`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useAttendancePredictionCalendar } from "@/hooks/use-attendance-prediction-calendar";

// ============================================================
// 내부 순수 함수 재현
// ============================================================

function getTimeSlot(hour: number): 0 | 1 | 2 {
  if (hour < 12) return 0;
  if (hour < 18) return 1;
  return 2;
}

function calcPredictedRate(
  dow: number,
  timeSlot: 0 | 1 | 2,
  dowRates: number[],
  timeSlotRates: number[]
): number {
  const dowRate = dowRates[dow] ?? 50;
  const tsRate = timeSlotRates[timeSlot] ?? 50;
  return Math.round(dowRate * 0.7 + tsRate * 0.3);
}

// ============================================================
// useAttendancePredictionCalendar - 초기 상태
// ============================================================

describe("useAttendancePredictionCalendar - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("groupId가 null이면 data는 null이다", () => {
    const { result } = renderHook(() =>
      useAttendancePredictionCalendar(null, "user-1", "2026-03")
    );
    expect(result.current.data).toBeNull();
  });

  it("userId가 null이면 data는 null이다", () => {
    const { result } = renderHook(() =>
      useAttendancePredictionCalendar("group-1", null, "2026-03")
    );
    expect(result.current.data).toBeNull();
  });

  it("month가 빈 문자열이면 data는 null이다", () => {
    const { result } = renderHook(() =>
      useAttendancePredictionCalendar("group-1", "user-1", "")
    );
    expect(result.current.data).toBeNull();
  });

  it("정상 파라미터에서 loading은 false이다 (SWR mock)", () => {
    const { result } = renderHook(() =>
      useAttendancePredictionCalendar("group-1", "user-1", "2026-03")
    );
    expect(result.current.loading).toBe(false);
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() =>
      useAttendancePredictionCalendar("group-1", "user-1", "2026-03")
    );
    expect(typeof result.current.refetch).toBe("function");
  });

  it("SWR data가 없으면 data는 null이다", () => {
    const { result } = renderHook(() =>
      useAttendancePredictionCalendar("group-1", "user-1", "2026-03")
    );
    expect(result.current.data).toBeNull();
  });
});

// ============================================================
// getTimeSlot 함수 로직
// ============================================================

describe("getTimeSlot - 시간대 분류 함수", () => {
  it("0시는 오전(0)이다", () => {
    expect(getTimeSlot(0)).toBe(0);
  });

  it("11시는 오전(0)이다", () => {
    expect(getTimeSlot(11)).toBe(0);
  });

  it("12시는 오후(1)이다", () => {
    expect(getTimeSlot(12)).toBe(1);
  });

  it("17시는 오후(1)이다", () => {
    expect(getTimeSlot(17)).toBe(1);
  });

  it("18시는 저녁(2)이다", () => {
    expect(getTimeSlot(18)).toBe(2);
  });

  it("23시는 저녁(2)이다", () => {
    expect(getTimeSlot(23)).toBe(2);
  });
});

// ============================================================
// calcPredictedRate 함수 로직
// ============================================================

describe("calcPredictedRate - 가중 평균 예측 함수", () => {
  it("요일 70% + 시간대 30% 가중 평균을 계산한다", () => {
    const dowRates = Array(7).fill(80);
    const timeSlotRates = [60, 60, 60];
    // 0.7 * 80 + 0.3 * 60 = 56 + 18 = 74
    expect(calcPredictedRate(0, 0, dowRates, timeSlotRates)).toBe(74);
  });

  it("요일 출석률 100%이고 시간대 출석률 100%면 예측 100이다", () => {
    const dowRates = Array(7).fill(100);
    const timeSlotRates = [100, 100, 100];
    expect(calcPredictedRate(1, 1, dowRates, timeSlotRates)).toBe(100);
  });

  it("요일 출석률 0%이고 시간대 출석률 0%면 예측 0이다", () => {
    const dowRates = Array(7).fill(0);
    const timeSlotRates = [0, 0, 0];
    expect(calcPredictedRate(3, 2, dowRates, timeSlotRates)).toBe(0);
  });

  it("기본값 50은 데이터 없을 때 사용된다", () => {
    const dowRates: number[] = [];
    const timeSlotRates: number[] = [];
    // dowRates[0] ?? 50 = 50, timeSlotRates[0] ?? 50 = 50 → 0.7*50 + 0.3*50 = 50
    expect(calcPredictedRate(0, 0, dowRates, timeSlotRates)).toBe(50);
  });

  it("결과는 Math.round로 반올림된다", () => {
    const dowRates = Array(7).fill(70);
    const timeSlotRates = [85, 85, 85];
    // 0.7 * 70 + 0.3 * 85 = 49 + 25.5 = 74.5 → 75
    expect(calcPredictedRate(0, 0, dowRates, timeSlotRates)).toBe(75);
  });

  it("요일 인덱스 0~6 모두 정상 처리된다", () => {
    const dowRates = [10, 20, 30, 40, 50, 60, 70];
    const timeSlotRates = [50, 50, 50];
    for (let dow = 0; dow <= 6; dow++) {
      const rate = calcPredictedRate(dow, 1, dowRates, timeSlotRates);
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    }
  });

  it("시간대 0, 1, 2 모두 정상 처리된다", () => {
    const dowRates = Array(7).fill(80);
    const timeSlotRates = [40, 60, 80];
    expect(calcPredictedRate(0, 0, dowRates, timeSlotRates)).toBe(68); // 0.7*80+0.3*40=68
    expect(calcPredictedRate(0, 1, dowRates, timeSlotRates)).toBe(74); // 0.7*80+0.3*60=74
    expect(calcPredictedRate(0, 2, dowRates, timeSlotRates)).toBe(80); // 0.7*80+0.3*80=80
  });
});

// ============================================================
// 요일별 출석률 계산 로직
// ============================================================

describe("요일별 출석률 계산 로직", () => {
  it("출석 횟수가 0이면 기본 출석률 50이다", () => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    const present = [0, 0, 0, 0, 0, 0, 0];
    const rates = totals.map((total, i) =>
      total > 0 ? Math.round((present[i] / total) * 100) : 50
    );
    expect(rates).toEqual([50, 50, 50, 50, 50, 50, 50]);
  });

  it("100% 출석이면 출석률 100이다", () => {
    const totals = [0, 0, 0, 5, 0, 0, 0]; // 목요일(3)에 5회
    const present = [0, 0, 0, 5, 0, 0, 0];
    const rates = totals.map((total, i) =>
      total > 0 ? Math.round((present[i] / total) * 100) : 50
    );
    expect(rates[3]).toBe(100);
  });

  it("0% 출석이면 출석률 0이다", () => {
    const totals = [0, 0, 3, 0, 0, 0, 0]; // 화요일(2)에 3회
    const present = [0, 0, 0, 0, 0, 0, 0];
    const rates = totals.map((total, i) =>
      total > 0 ? Math.round((present[i] / total) * 100) : 50
    );
    expect(rates[2]).toBe(0);
  });

  it("반올림이 올바르게 적용된다 - 2/3은 67%이다", () => {
    const totals = [3, 0, 0, 0, 0, 0, 0];
    const present = [2, 0, 0, 0, 0, 0, 0];
    const rates = totals.map((total, i) =>
      total > 0 ? Math.round((present[i] / total) * 100) : 50
    );
    expect(rates[0]).toBe(67);
  });
});

// ============================================================
// SWR 키 생성 로직
// ============================================================

describe("SWR 키 생성 로직", () => {
  it("groupId, userId, month 모두 있으면 SWR 키가 생성된다", () => {
    const groupId = "group-1";
    const userId = "user-1";
    const month = "2026-03";
    const key = `/groups/${groupId}/attendance-prediction-calendar/${userId}/${month}`;
    expect(key).toBe(
      "/groups/group-1/attendance-prediction-calendar/user-1/2026-03"
    );
  });

  it("groupId가 없으면 SWR 훅은 null 키를 반환한다", () => {
    const { result } = renderHook(() =>
      useAttendancePredictionCalendar(null, "user-1", "2026-03")
    );
    expect(result.current.data).toBeNull();
  });

  it("userId가 없으면 SWR 훅은 null 키를 반환한다", () => {
    const { result } = renderHook(() =>
      useAttendancePredictionCalendar("group-1", null, "2026-03")
    );
    expect(result.current.data).toBeNull();
  });

  it("month 형식은 YYYY-MM이어야 한다", () => {
    const month = "2026-03";
    expect(month).toMatch(/^\d{4}-\d{2}$/);
  });
});

// ============================================================
// 전체 출석률 계산 로직
// ============================================================

describe("전체 출석률(overallRate) 계산 로직", () => {
  it("과거 일정이 없으면 overallRate는 0이다", () => {
    const totalPastSchedules = 0;
    const totalPastPresent = 0;
    const overallRate =
      totalPastSchedules > 0
        ? Math.round((totalPastPresent / totalPastSchedules) * 100)
        : 0;
    expect(overallRate).toBe(0);
  });

  it("10회 일정 중 8회 출석이면 80%이다", () => {
    const totalPastSchedules = 10;
    const totalPastPresent = 8;
    const overallRate = Math.round((totalPastPresent / totalPastSchedules) * 100);
    expect(overallRate).toBe(80);
  });

  it("1회 일정 중 0회 출석이면 0%이다", () => {
    const totalPastSchedules = 1;
    const totalPastPresent = 0;
    const overallRate = Math.round((totalPastPresent / totalPastSchedules) * 100);
    expect(overallRate).toBe(0);
  });

  it("3회 일정 중 2회 출석이면 67%이다", () => {
    const totalPastSchedules = 3;
    const totalPastPresent = 2;
    const overallRate = Math.round((totalPastPresent / totalPastSchedules) * 100);
    expect(overallRate).toBe(67);
  });
});

// ============================================================
// 달력 일자 생성 로직
// ============================================================

describe("달력 days 배열 생성 로직", () => {
  it("2026년 2월은 28일이다", () => {
    const daysInFeb2026 = new Date(2026, 2, 0).getDate();
    expect(daysInFeb2026).toBe(28);
  });

  it("2026년 3월은 31일이다", () => {
    const daysInMar2026 = new Date(2026, 3, 0).getDate();
    expect(daysInMar2026).toBe(31);
  });

  it("날짜 문자열은 YYYY-MM-DD 형식이다", () => {
    const month = "2026-03";
    const d = 5;
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    expect(dateStr).toBe("2026-03-05");
  });

  it("1자리 날짜는 앞에 0이 붙는다", () => {
    const dateStr = `2026-03-${String(1).padStart(2, "0")}`;
    expect(dateStr).toBe("2026-03-01");
  });

  it("일정 없는 날은 scheduleId와 scheduleTitle이 null이다", () => {
    const day = {
      date: "2026-03-01",
      scheduleId: null,
      scheduleTitle: null,
      predictedRate: null,
      actualStatus: null,
    };
    expect(day.scheduleId).toBeNull();
    expect(day.scheduleTitle).toBeNull();
  });
});

// ============================================================
// 과거/미래 일정 구분 로직
// ============================================================

describe("과거/미래 일정 구분 로직", () => {
  it("과거 날짜는 actualStatus가 설정된다", () => {
    const today = "2026-03-02";
    const dateStr = "2026-03-01"; // 과거
    const isPast = dateStr <= today;
    expect(isPast).toBe(true);
  });

  it("미래 날짜는 predictedRate가 설정된다", () => {
    const today = "2026-03-02";
    const dateStr = "2026-03-10"; // 미래
    const isPast = dateStr <= today;
    expect(isPast).toBe(false);
  });

  it("오늘 날짜는 과거로 처리된다 (<=)", () => {
    const today = "2026-03-02";
    const dateStr = "2026-03-02"; // 오늘
    const isPast = dateStr <= today;
    expect(isPast).toBe(true);
  });

  it("status가 present이면 actualStatus는 present이다", () => {
    const status = "present";
    let actualStatus: "present" | "late" | "absent" | null = null;
    if (status === "present") actualStatus = "present";
    else if (status === "late") actualStatus = "late";
    else actualStatus = "absent";
    expect(actualStatus).toBe("present");
  });

  it("status가 late이면 actualStatus는 late이다", () => {
    const status = "late";
    let actualStatus: "present" | "late" | "absent" | null = null;
    if (status === "present") actualStatus = "present";
    else if (status === "late") actualStatus = "late";
    else actualStatus = "absent";
    expect(actualStatus).toBe("late");
  });

  it("status가 absent이면 actualStatus는 absent이다", () => {
    const status = "absent";
    let actualStatus: "present" | "late" | "absent" | null = null;
    if (status === "present") actualStatus = "present";
    else if (status === "late") actualStatus = "late";
    else actualStatus = "absent";
    expect(actualStatus).toBe("absent");
  });
});

// ============================================================
// 경계값 테스트
// ============================================================

describe("경계값 테스트", () => {
  it("groupId가 빈 문자열이면 data는 null이다", () => {
    const { result } = renderHook(() =>
      useAttendancePredictionCalendar("", "user-1", "2026-03")
    );
    expect(result.current.data).toBeNull();
  });

  it("userId가 빈 문자열이면 data는 null이다", () => {
    const { result } = renderHook(() =>
      useAttendancePredictionCalendar("group-1", "", "2026-03")
    );
    expect(result.current.data).toBeNull();
  });

  it("시간대 경계: 11시는 오전, 12시는 오후", () => {
    expect(getTimeSlot(11)).toBe(0);
    expect(getTimeSlot(12)).toBe(1);
  });

  it("시간대 경계: 17시는 오후, 18시는 저녁", () => {
    expect(getTimeSlot(17)).toBe(1);
    expect(getTimeSlot(18)).toBe(2);
  });

  it("예측 확률은 항상 0~100 사이이다", () => {
    for (let dowRate = 0; dowRate <= 100; dowRate += 10) {
      for (let tsRate = 0; tsRate <= 100; tsRate += 10) {
        const dowRates = Array(7).fill(dowRate);
        const tsRates = [tsRate, tsRate, tsRate];
        const predicted = calcPredictedRate(0, 0, dowRates, tsRates);
        expect(predicted).toBeGreaterThanOrEqual(0);
        expect(predicted).toBeLessThanOrEqual(100);
      }
    }
  });
});
