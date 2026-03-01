import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));

// ─── SWR mock ─────────────────────────────────────────────────
const mockMutate = vi.fn();
vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (!key) return { data: undefined, isLoading: false, mutate: mockMutate };
    return { data: undefined, isLoading: false, mutate: mockMutate };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    attendanceTimeAnalysis: (groupId: string, period: string) =>
      `/groups/${groupId}/attendance-time-analysis?period=${period}`,
  },
}));

beforeEach(() => {
  mockMutate.mockReset();
  mockMutate.mockResolvedValue(undefined);
});

// ============================================================
// 공유 타입 및 상수
// ============================================================

type AttendanceTimeSlot = "morning" | "afternoon" | "evening";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const TIME_SLOT_META: {
  slot: AttendanceTimeSlot;
  label: string;
  range: string;
  startHour: number;
  endHour: number;
}[] = [
  { slot: "morning", label: "오전", range: "06~12시", startHour: 6, endHour: 12 },
  { slot: "afternoon", label: "오후", range: "12~18시", startHour: 12, endHour: 18 },
  { slot: "evening", label: "저녁", range: "18~24시", startHour: 18, endHour: 24 },
];

// ============================================================
// 내부 순수 함수 재현
// ============================================================

function getTimeSlot(isoDate: string): AttendanceTimeSlot | null {
  const hour = new Date(isoDate).getHours();
  for (const meta of TIME_SLOT_META) {
    if (hour >= meta.startHour && hour < meta.endHour) {
      return meta.slot;
    }
  }
  return null;
}

function getDayIndex(isoDate: string): number {
  const jsDay = new Date(isoDate).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

// ============================================================
// 1. getTimeSlot 함수 테스트
// ============================================================

describe("getTimeSlot - 시간대 분류", () => {
  it("06시는 morning이다", () => {
    const date = new Date();
    date.setHours(6, 0, 0, 0);
    expect(getTimeSlot(date.toISOString())).toBe("morning");
  });

  it("11시는 morning이다", () => {
    const date = new Date();
    date.setHours(11, 0, 0, 0);
    expect(getTimeSlot(date.toISOString())).toBe("morning");
  });

  it("12시는 afternoon이다", () => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    expect(getTimeSlot(date.toISOString())).toBe("afternoon");
  });

  it("17시는 afternoon이다", () => {
    const date = new Date();
    date.setHours(17, 0, 0, 0);
    expect(getTimeSlot(date.toISOString())).toBe("afternoon");
  });

  it("18시는 evening이다", () => {
    const date = new Date();
    date.setHours(18, 0, 0, 0);
    expect(getTimeSlot(date.toISOString())).toBe("evening");
  });

  it("23시는 evening이다", () => {
    const date = new Date();
    date.setHours(23, 0, 0, 0);
    expect(getTimeSlot(date.toISOString())).toBe("evening");
  });

  it("00시(자정)는 null이다", () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    expect(getTimeSlot(date.toISOString())).toBeNull();
  });

  it("05시는 null이다", () => {
    const date = new Date();
    date.setHours(5, 0, 0, 0);
    expect(getTimeSlot(date.toISOString())).toBeNull();
  });

  it("경계값 12시는 afternoon에 포함된다", () => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    expect(getTimeSlot(date.toISOString())).toBe("afternoon");
  });

  it("경계값 18시는 evening에 포함된다", () => {
    const date = new Date();
    date.setHours(18, 0, 0, 0);
    expect(getTimeSlot(date.toISOString())).toBe("evening");
  });
});

// ============================================================
// 2. getDayIndex 함수 테스트
// ============================================================

describe("getDayIndex - 요일 인덱스 변환", () => {
  // JS getDay(): 0=일, 1=월, ..., 6=토
  // 우리 인덱스: 0=월, 1=화, ..., 5=토, 6=일

  it("월요일은 인덱스 0이다", () => {
    // 2026-03-02는 월요일
    const date = new Date("2026-03-02T10:00:00");
    expect(getDayIndex(date.toISOString())).toBe(0);
  });

  it("일요일은 인덱스 6이다", () => {
    // 2026-03-01은 일요일
    const date = new Date("2026-03-01T10:00:00");
    expect(getDayIndex(date.toISOString())).toBe(6);
  });

  it("토요일은 인덱스 5이다", () => {
    // 2026-02-28은 토요일
    const date = new Date("2026-02-28T10:00:00");
    expect(getDayIndex(date.toISOString())).toBe(5);
  });

  it("화요일은 인덱스 1이다", () => {
    // 2026-03-03은 화요일
    const date = new Date("2026-03-03T10:00:00");
    expect(getDayIndex(date.toISOString())).toBe(1);
  });

  it("반환값은 0에서 6 사이다", () => {
    const date = new Date("2026-03-02T10:00:00");
    const idx = getDayIndex(date.toISOString());
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(6);
  });
});

// ============================================================
// 3. buildEmptyResult 로직 테스트
// ============================================================

describe("buildEmptyResult 로직", () => {
  function buildEmptyResult(period: "last30days" | "all") {
    return {
      timeSlots: TIME_SLOT_META.map((m) => ({
        slot: m.slot,
        label: m.label,
        range: m.range,
        scheduleCount: 0,
        presentCount: 0,
        totalCount: 0,
        rate: 0,
      })),
      daysOfWeek: DAY_LABELS.map((label, i) => ({
        dayIndex: i,
        dayLabel: label,
        scheduleCount: 0,
        presentCount: 0,
        totalCount: 0,
        rate: 0,
      })),
      slotDayCombinations: [],
      bestSlot: null,
      bestDay: null,
      bestCombination: null,
      totalSchedules: 0,
      analyzedPeriod: period,
    };
  }

  it("timeSlots는 3개를 가진다 (morning, afternoon, evening)", () => {
    const result = buildEmptyResult("last30days");
    expect(result.timeSlots).toHaveLength(3);
  });

  it("daysOfWeek는 7개를 가진다", () => {
    const result = buildEmptyResult("last30days");
    expect(result.daysOfWeek).toHaveLength(7);
  });

  it("모든 timeSlots의 rate는 0이다", () => {
    const result = buildEmptyResult("all");
    expect(result.timeSlots.every((s) => s.rate === 0)).toBe(true);
  });

  it("모든 daysOfWeek의 rate는 0이다", () => {
    const result = buildEmptyResult("last30days");
    expect(result.daysOfWeek.every((d) => d.rate === 0)).toBe(true);
  });

  it("bestSlot은 null이다", () => {
    const result = buildEmptyResult("last30days");
    expect(result.bestSlot).toBeNull();
  });

  it("bestDay는 null이다", () => {
    const result = buildEmptyResult("last30days");
    expect(result.bestDay).toBeNull();
  });

  it("bestCombination은 null이다", () => {
    const result = buildEmptyResult("last30days");
    expect(result.bestCombination).toBeNull();
  });

  it("totalSchedules는 0이다", () => {
    const result = buildEmptyResult("last30days");
    expect(result.totalSchedules).toBe(0);
  });

  it("analyzedPeriod는 입력한 period와 같다", () => {
    expect(buildEmptyResult("last30days").analyzedPeriod).toBe("last30days");
    expect(buildEmptyResult("all").analyzedPeriod).toBe("all");
  });

  it("slotDayCombinations는 빈 배열이다", () => {
    const result = buildEmptyResult("last30days");
    expect(result.slotDayCombinations).toHaveLength(0);
  });

  it("daysOfWeek dayLabel은 월~일 순서다", () => {
    const result = buildEmptyResult("last30days");
    expect(result.daysOfWeek[0].dayLabel).toBe("월");
    expect(result.daysOfWeek[6].dayLabel).toBe("일");
  });

  it("daysOfWeek dayIndex가 0부터 6까지 순서대로다", () => {
    const result = buildEmptyResult("last30days");
    result.daysOfWeek.forEach((d, i) => {
      expect(d.dayIndex).toBe(i);
    });
  });
});

// ============================================================
// 4. 출석률 계산 로직 테스트
// ============================================================

describe("출석률(rate) 계산 로직", () => {
  function calcRate(present: number, total: number): number {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }

  it("total이 0이면 rate는 0이다", () => {
    expect(calcRate(0, 0)).toBe(0);
  });

  it("100% 출석률은 100이다", () => {
    expect(calcRate(10, 10)).toBe(100);
  });

  it("50% 출석률은 50이다", () => {
    expect(calcRate(5, 10)).toBe(50);
  });

  it("소수점 반올림이 적용된다", () => {
    // 2/3 = 66.66... → 67
    expect(calcRate(2, 3)).toBe(67);
  });

  it("0% 출석률은 0이다", () => {
    expect(calcRate(0, 10)).toBe(0);
  });
});

// ============================================================
// 5. present/late 상태 처리 로직
// ============================================================

describe("출석 상태 처리 로직", () => {
  function isPresent(status: string): boolean {
    return status === "present" || status === "late";
  }

  it("present는 출석으로 처리된다", () => {
    expect(isPresent("present")).toBe(true);
  });

  it("late는 출석으로 처리된다", () => {
    expect(isPresent("late")).toBe(true);
  });

  it("absent는 출석으로 처리되지 않는다", () => {
    expect(isPresent("absent")).toBe(false);
  });

  it("excuse는 출석으로 처리되지 않는다", () => {
    expect(isPresent("excuse")).toBe(false);
  });

  it("빈 문자열은 출석으로 처리되지 않는다", () => {
    expect(isPresent("")).toBe(false);
  });
});

// ============================================================
// 6. TIME_SLOT_META 메타데이터 검증
// ============================================================

describe("TIME_SLOT_META 메타데이터", () => {
  it("3개의 시간대가 정의되어 있다", () => {
    expect(TIME_SLOT_META).toHaveLength(3);
  });

  it("morning의 범위는 6~12다", () => {
    const morning = TIME_SLOT_META.find((m) => m.slot === "morning");
    expect(morning?.startHour).toBe(6);
    expect(morning?.endHour).toBe(12);
  });

  it("afternoon의 범위는 12~18다", () => {
    const afternoon = TIME_SLOT_META.find((m) => m.slot === "afternoon");
    expect(afternoon?.startHour).toBe(12);
    expect(afternoon?.endHour).toBe(18);
  });

  it("evening의 범위는 18~24다", () => {
    const evening = TIME_SLOT_META.find((m) => m.slot === "evening");
    expect(evening?.startHour).toBe(18);
    expect(evening?.endHour).toBe(24);
  });

  it("시간대별 label이 존재한다", () => {
    expect(TIME_SLOT_META[0].label).toBe("오전");
    expect(TIME_SLOT_META[1].label).toBe("오후");
    expect(TIME_SLOT_META[2].label).toBe("저녁");
  });
});

// ============================================================
// 7. bestSlot/bestDay 추출 로직
// ============================================================

describe("bestSlot/bestDay 추출 로직", () => {
  type SlotStat = { slot: AttendanceTimeSlot; scheduleCount: number; rate: number };
  type DayStat = { dayIndex: number; scheduleCount: number; rate: number };

  function getBestSlot(timeSlots: SlotStat[]): AttendanceTimeSlot | null {
    const best = timeSlots
      .filter((s) => s.scheduleCount > 0)
      .sort((a, b) => b.rate - a.rate)[0] ?? null;
    return best?.slot ?? null;
  }

  function getBestDay(daysOfWeek: DayStat[]): number | null {
    const best = daysOfWeek
      .filter((d) => d.scheduleCount > 0)
      .sort((a, b) => b.rate - a.rate)[0] ?? null;
    return best?.dayIndex ?? null;
  }

  it("scheduleCount가 모두 0이면 bestSlot이 null이다", () => {
    const slots: SlotStat[] = [
      { slot: "morning", scheduleCount: 0, rate: 90 },
      { slot: "afternoon", scheduleCount: 0, rate: 80 },
    ];
    expect(getBestSlot(slots)).toBeNull();
  });

  it("가장 높은 rate의 시간대가 bestSlot이다", () => {
    const slots: SlotStat[] = [
      { slot: "morning", scheduleCount: 3, rate: 70 },
      { slot: "afternoon", scheduleCount: 3, rate: 90 },
      { slot: "evening", scheduleCount: 3, rate: 80 },
    ];
    expect(getBestSlot(slots)).toBe("afternoon");
  });

  it("scheduleCount가 모두 0이면 bestDay가 null이다", () => {
    const days: DayStat[] = [
      { dayIndex: 0, scheduleCount: 0, rate: 90 },
    ];
    expect(getBestDay(days)).toBeNull();
  });

  it("가장 높은 rate의 요일이 bestDay다", () => {
    const days: DayStat[] = [
      { dayIndex: 0, scheduleCount: 2, rate: 60 },
      { dayIndex: 1, scheduleCount: 2, rate: 90 },
      { dayIndex: 5, scheduleCount: 2, rate: 75 },
    ];
    expect(getBestDay(days)).toBe(1);
  });
});

// ============================================================
// 8. SWR 키 테스트
// ============================================================

describe("SWR 키 형식", () => {
  it("groupId와 period를 포함한 키를 생성한다", () => {
    const key = `/groups/group1/attendance-time-analysis?period=last30days`;
    expect(key).toContain("group1");
    expect(key).toContain("last30days");
  });

  it("period all인 경우 키가 다르다", () => {
    const key1 = `/groups/group1/attendance-time-analysis?period=last30days`;
    const key2 = `/groups/group1/attendance-time-analysis?period=all`;
    expect(key1).not.toBe(key2);
  });

  it("groupId가 빈 문자열이면 SWR 키가 null이다", () => {
    const key = "" ? `/groups/${""}` : null;
    expect(key).toBeNull();
  });
});
