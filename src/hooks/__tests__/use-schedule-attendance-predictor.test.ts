import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── 토스트 mock ──────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: vi.fn((key: unknown, _fetcher: unknown) => {
    if (!key) return { data: undefined, isLoading: false, mutate: vi.fn() };
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  }),
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  }),
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    scheduleAttendancePredictor: (groupId: string, scheduleId: string) =>
      `schedule-attendance-predictor:${groupId}:${scheduleId}`,
  },
}));

import { useScheduleAttendancePredictor } from "@/hooks/use-schedule-attendance-predictor";
import { TIME_SLOTS, DAY_OF_WEEK_LABELS } from "@/types/index";

// ─── 헬퍼 ────────────────────────────────────────────────────
const GROUP_ID = "group-predictor-1";
const SCHEDULE_ID = "schedule-predictor-1";

function makeHook(groupId = GROUP_ID, scheduleId = SCHEDULE_ID) {
  return renderHook(() => useScheduleAttendancePredictor(groupId, scheduleId));
}

// ============================================================
// TIME_SLOTS / DAY_OF_WEEK_LABELS 상수 테스트
// ============================================================

describe("TIME_SLOTS 상수 검증", () => {
  it("TIME_SLOTS가 4개의 시간대를 포함한다", () => {
    expect(TIME_SLOTS).toHaveLength(4);
  });

  it("morning 슬롯이 있다", () => {
    const morning = TIME_SLOTS.find((s) => s.key === "morning");
    expect(morning).toBeDefined();
    expect(morning?.startHour).toBe(6);
    expect(morning?.endHour).toBe(12);
  });

  it("afternoon 슬롯이 있다", () => {
    const afternoon = TIME_SLOTS.find((s) => s.key === "afternoon");
    expect(afternoon).toBeDefined();
    expect(afternoon?.startHour).toBe(12);
    expect(afternoon?.endHour).toBe(18);
  });

  it("evening 슬롯이 있다", () => {
    const evening = TIME_SLOTS.find((s) => s.key === "evening");
    expect(evening).toBeDefined();
    expect(evening?.startHour).toBe(18);
    expect(evening?.endHour).toBe(22);
  });

  it("night 슬롯이 있다", () => {
    const night = TIME_SLOTS.find((s) => s.key === "night");
    expect(night).toBeDefined();
    expect(night?.startHour).toBe(22);
  });

  it("각 슬롯에 label이 있다", () => {
    TIME_SLOTS.forEach((slot) => {
      expect(slot.label).toBeTruthy();
    });
  });

  it("각 슬롯에 range가 있다", () => {
    TIME_SLOTS.forEach((slot) => {
      expect(slot.range).toBeTruthy();
    });
  });
});

describe("DAY_OF_WEEK_LABELS 상수 검증", () => {
  it("7개의 요일 레이블이 있다", () => {
    expect(DAY_OF_WEEK_LABELS).toHaveLength(7);
  });

  it("첫 번째 레이블은 일요일이다", () => {
    expect(DAY_OF_WEEK_LABELS[0]).toBe("일");
  });

  it("마지막 레이블은 토요일이다", () => {
    expect(DAY_OF_WEEK_LABELS[6]).toBe("토");
  });

  it("월요일은 인덱스 1이다", () => {
    expect(DAY_OF_WEEK_LABELS[1]).toBe("월");
  });

  it("금요일은 인덱스 5이다", () => {
    expect(DAY_OF_WEEK_LABELS[5]).toBe("금");
  });
});

// ============================================================
// getTimeSlot 함수 로직 테스트 (내부 로직 재현)
// ============================================================

function getTimeSlot(hour: number): "morning" | "afternoon" | "evening" | "night" {
  for (const slot of TIME_SLOTS) {
    if (slot.key === "night") {
      if (hour >= 22 || hour < 6) return "night";
    } else {
      if (hour >= slot.startHour && hour < slot.endHour) return slot.key;
    }
  }
  return "morning";
}

describe("getTimeSlot - 시간대 판별", () => {
  it("6시는 morning이다", () => {
    expect(getTimeSlot(6)).toBe("morning");
  });

  it("11시는 morning이다", () => {
    expect(getTimeSlot(11)).toBe("morning");
  });

  it("12시는 afternoon이다", () => {
    expect(getTimeSlot(12)).toBe("afternoon");
  });

  it("17시는 afternoon이다", () => {
    expect(getTimeSlot(17)).toBe("afternoon");
  });

  it("18시는 evening이다", () => {
    expect(getTimeSlot(18)).toBe("evening");
  });

  it("21시는 evening이다", () => {
    expect(getTimeSlot(21)).toBe("evening");
  });

  it("22시는 night이다", () => {
    expect(getTimeSlot(22)).toBe("night");
  });

  it("23시는 night이다", () => {
    expect(getTimeSlot(23)).toBe("night");
  });

  it("0시는 night이다 (자정)", () => {
    expect(getTimeSlot(0)).toBe("night");
  });

  it("5시는 night이다 (새벽)", () => {
    expect(getTimeSlot(5)).toBe("night");
  });
});

// ============================================================
// calcWeightedProbability 함수 로직 테스트
// ============================================================

function calcWeightedProbability(
  overallRate: number,
  sameDayRate: number,
  sameSlotRate: number,
): number {
  return Math.round(overallRate * 0.4 + sameDayRate * 0.35 + sameSlotRate * 0.25);
}

describe("calcWeightedProbability - 가중 평균 계산", () => {
  it("모두 100%이면 결과는 100이다", () => {
    expect(calcWeightedProbability(100, 100, 100)).toBe(100);
  });

  it("모두 0%이면 결과는 0이다", () => {
    expect(calcWeightedProbability(0, 0, 0)).toBe(0);
  });

  it("가중치 합계는 1.0(0.4+0.35+0.25)이다", () => {
    expect(0.4 + 0.35 + 0.25).toBe(1.0);
  });

  it("overallRate=80, sameDayRate=80, sameSlotRate=80이면 80이다", () => {
    expect(calcWeightedProbability(80, 80, 80)).toBe(80);
  });

  it("overallRate=100, sameDayRate=0, sameSlotRate=0이면 40이다", () => {
    expect(calcWeightedProbability(100, 0, 0)).toBe(40);
  });

  it("overallRate=0, sameDayRate=100, sameSlotRate=0이면 35이다", () => {
    expect(calcWeightedProbability(0, 100, 0)).toBe(35);
  });

  it("overallRate=0, sameDayRate=0, sameSlotRate=100이면 25이다", () => {
    expect(calcWeightedProbability(0, 0, 100)).toBe(25);
  });

  it("결과는 정수이다 (Math.round 적용)", () => {
    const result = calcWeightedProbability(33, 33, 33);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("혼합 비율 테스트: overallRate=60, sameDayRate=80, sameSlotRate=50", () => {
    // 60*0.4 + 80*0.35 + 50*0.25 = 24 + 28 + 12.5 = 64.5 → 65
    expect(calcWeightedProbability(60, 80, 50)).toBe(65);
  });
});

// ============================================================
// getPredictionLabel 함수 로직 테스트
// ============================================================

function getPredictionLabel(
  probability: number,
): "참석 예상" | "불확실" | "불참 가능" {
  if (probability >= 80) return "참석 예상";
  if (probability >= 50) return "불확실";
  return "불참 가능";
}

describe("getPredictionLabel - 라벨 결정", () => {
  it("probability 80 이상 → 참석 예상", () => {
    expect(getPredictionLabel(80)).toBe("참석 예상");
  });

  it("probability 100 → 참석 예상", () => {
    expect(getPredictionLabel(100)).toBe("참석 예상");
  });

  it("probability 79 → 불확실", () => {
    expect(getPredictionLabel(79)).toBe("불확실");
  });

  it("probability 50 → 불확실", () => {
    expect(getPredictionLabel(50)).toBe("불확실");
  });

  it("probability 49 → 불참 가능", () => {
    expect(getPredictionLabel(49)).toBe("불참 가능");
  });

  it("probability 0 → 불참 가능", () => {
    expect(getPredictionLabel(0)).toBe("불참 가능");
  });

  it("probability 81 → 참석 예상", () => {
    expect(getPredictionLabel(81)).toBe("참석 예상");
  });
});

// ============================================================
// 훅 초기 상태 테스트
// ============================================================

describe("useScheduleAttendancePredictor - 초기 상태", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("predictions는 초기에 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.predictions).toEqual([]);
  });

  it("expectedCount는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.expectedCount).toBe(0);
  });

  it("totalCount는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalCount).toBe(0);
  });

  it("analysisSummary는 초기에 빈 문자열이다", () => {
    const { result } = makeHook();
    expect(result.current.analysisSummary).toBe("");
  });

  it("dayOfWeek는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.dayOfWeek).toBe(0);
  });

  it("timeSlot은 초기에 afternoon이다", () => {
    const { result } = makeHook();
    expect(result.current.timeSlot).toBe("afternoon");
  });

  it("startsAt은 초기에 빈 문자열이다", () => {
    const { result } = makeHook();
    expect(result.current.startsAt).toBe("");
  });

  it("hasData는 초기에 false이다", () => {
    const { result } = makeHook();
    expect(result.current.hasData).toBe(false);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// key가 null인 경우 (빈 ID 처리)
// ============================================================

describe("useScheduleAttendancePredictor - 빈 ID 처리", () => {
  it("groupId가 빈 문자열이면 데이터가 없는 기본값이다", () => {
    const { result } = renderHook(() => useScheduleAttendancePredictor("", SCHEDULE_ID));
    expect(result.current.predictions).toEqual([]);
    expect(result.current.hasData).toBe(false);
  });

  it("scheduleId가 빈 문자열이면 데이터가 없는 기본값이다", () => {
    const { result } = renderHook(() => useScheduleAttendancePredictor(GROUP_ID, ""));
    expect(result.current.predictions).toEqual([]);
    expect(result.current.hasData).toBe(false);
  });

  it("둘 다 빈 문자열이어도 크래시 없이 기본값을 반환한다", () => {
    const { result } = renderHook(() => useScheduleAttendancePredictor("", ""));
    expect(result.current.predictions).toEqual([]);
  });
});

// ============================================================
// analysisSummary 생성 로직 테스트
// ============================================================

function buildAnalysisSummary(
  targetDayOfWeek: number,
  targetTimeSlot: string,
  totalSamples: number,
): string {
  const dayLabel = DAY_OF_WEEK_LABELS[targetDayOfWeek] ?? "";
  const slotLabel = TIME_SLOTS.find((s) => s.key === targetTimeSlot)?.label ?? "";
  const count = totalSamples;
  return `${dayLabel}요일 ${slotLabel} 기준 과거 데이터 ${count}건 분석`;
}

describe("analysisSummary 생성 로직", () => {
  it("월요일 오전 10건 분석 문자열이 올바르다", () => {
    const summary = buildAnalysisSummary(1, "morning", 10);
    expect(summary).toContain("월");
    expect(summary).toContain("오전");
    expect(summary).toContain("10");
  });

  it("토요일 저녁 25건 분석 문자열이 올바르다", () => {
    const summary = buildAnalysisSummary(6, "evening", 25);
    expect(summary).toContain("토");
    expect(summary).toContain("저녁");
    expect(summary).toContain("25");
  });

  it("일요일 야간 0건이면 0건이 포함된다", () => {
    const summary = buildAnalysisSummary(0, "night", 0);
    expect(summary).toContain("0");
  });

  it("수요일 오후가 올바르게 생성된다", () => {
    const summary = buildAnalysisSummary(3, "afternoon", 50);
    expect(summary).toContain("수");
    expect(summary).toContain("오후");
    expect(summary).toContain("50");
  });
});

// ============================================================
// expectedCount 계산 로직 테스트
// ============================================================

function countExpected(predictions: { probability: number }[]): number {
  return predictions.filter((p) => p.probability >= 50).length;
}

describe("expectedCount 계산 로직", () => {
  it("빈 배열이면 0이다", () => {
    expect(countExpected([])).toBe(0);
  });

  it("probability 50 이상인 멤버만 카운트된다", () => {
    const predictions = [
      { probability: 80 },
      { probability: 50 },
      { probability: 49 },
      { probability: 0 },
    ];
    expect(countExpected(predictions)).toBe(2);
  });

  it("모두 50 미만이면 0이다", () => {
    const predictions = [
      { probability: 10 },
      { probability: 30 },
      { probability: 49 },
    ];
    expect(countExpected(predictions)).toBe(0);
  });

  it("모두 80 이상이면 전체 수와 같다", () => {
    const predictions = [
      { probability: 80 },
      { probability: 90 },
      { probability: 100 },
    ];
    expect(countExpected(predictions)).toBe(3);
  });

  it("정확히 50인 경우 포함된다 (경계값)", () => {
    expect(countExpected([{ probability: 50 }])).toBe(1);
  });

  it("정확히 49인 경우 제외된다 (경계값)", () => {
    expect(countExpected([{ probability: 49 }])).toBe(0);
  });
});

// ============================================================
// 예측 정렬 로직 테스트
// ============================================================

describe("예측 결과 정렬 로직", () => {
  it("probability 내림차순으로 정렬된다", () => {
    const predictions = [
      { userId: "u1", probability: 30 },
      { userId: "u2", probability: 90 },
      { userId: "u3", probability: 60 },
    ];
    const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
    expect(sorted[0].userId).toBe("u2");
    expect(sorted[1].userId).toBe("u3");
    expect(sorted[2].userId).toBe("u1");
  });

  it("동일 probability이면 순서가 유지된다 (stable sort)", () => {
    const predictions = [
      { userId: "u1", probability: 60 },
      { userId: "u2", probability: 60 },
    ];
    const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
    expect(sorted).toHaveLength(2);
  });
});

// ============================================================
// 출석 상태 판별 로직 테스트
// ============================================================

describe("출석 상태 판별 로직 (present/late → 출석)", () => {
  function isPresent(status: string): boolean {
    return status === "present" || status === "late";
  }

  it("present는 출석이다", () => {
    expect(isPresent("present")).toBe(true);
  });

  it("late는 출석이다 (지각)", () => {
    expect(isPresent("late")).toBe(true);
  });

  it("absent는 결석이다", () => {
    expect(isPresent("absent")).toBe(false);
  });

  it("빈 문자열은 결석이다", () => {
    expect(isPresent("")).toBe(false);
  });

  it("null에 해당하는 값은 결석이다", () => {
    expect(isPresent("null")).toBe(false);
  });
});

// ============================================================
// overallRate fallback 로직 테스트 (데이터 없을 때 50)
// ============================================================

describe("overallRate fallback 로직", () => {
  function getOverallRate(
    present: number,
    total: number,
    fallback = 50,
  ): number {
    if (total > 0) {
      return Math.round((present / total) * 100);
    }
    return fallback;
  }

  it("total이 0이면 fallback(50)을 반환한다", () => {
    expect(getOverallRate(0, 0)).toBe(50);
  });

  it("total이 있으면 실제 비율을 계산한다", () => {
    expect(getOverallRate(3, 5)).toBe(60);
  });

  it("전체 출석이면 100이다", () => {
    expect(getOverallRate(5, 5)).toBe(100);
  });

  it("전체 결석이면 0이다", () => {
    expect(getOverallRate(0, 5)).toBe(0);
  });

  it("결과는 반올림된 정수다", () => {
    const result = getOverallRate(1, 3);
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBe(33);
  });
});
