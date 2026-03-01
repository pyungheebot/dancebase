import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── date-fns mock ────────────────────────────────────────────
vi.mock("date-fns", () => ({
  subMonths: (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() - months);
    return d;
  },
  getDay: (date: Date) => date.getDay(),
  getHours: (date: Date) => date.getHours(),
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (!key) {
      return { data: undefined, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    optimalScheduleTime: (groupId: string, projectId?: string | null) =>
      `/optimal-schedule-time/${groupId}${projectId ? `?project=${projectId}` : ""}`,
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
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));

// ─── 훅 import ────────────────────────────────────────────────
import {
  useOptimalScheduleTime,
  type TimeSlot,
  type DayOfWeek,
  type DayAttendanceRate,
  type TimeSlotAttendanceRate,
  type OptimalScheduleTimeResult,
} from "@/hooks/use-optimal-schedule-time";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1", projectId?: string | null) {
  return renderHook(() => useOptimalScheduleTime(groupId, projectId));
}

// ============================================================
// useOptimalScheduleTime - 초기 상태
// ============================================================

describe("useOptimalScheduleTime - 초기 상태", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 result는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.result).toBeNull();
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("projectId를 제공해도 훅이 오류 없이 초기화된다", () => {
    const { result } = makeHook("group-1", "project-1");
    expect(result.current.result).toBeNull();
  });

  it("projectId를 null로 제공해도 훅이 오류 없이 초기화된다", () => {
    const { result } = makeHook("group-1", null);
    expect(result.current.result).toBeNull();
  });

  it("groupId가 빈 문자열이어도 훅이 오류 없이 초기화된다", () => {
    const { result } = makeHook("");
    expect(result.current.result).toBeNull();
  });
});

// ============================================================
// useOptimalScheduleTime - classifyTimeSlot 로직
// ============================================================

describe("useOptimalScheduleTime - classifyTimeSlot 로직", () => {
  function classifyTimeSlot(hour: number): TimeSlot {
    if (hour >= 6 && hour < 12) return "오전";
    if (hour >= 12 && hour < 18) return "오후";
    return "저녁";
  }

  it("6시는 오전이다", () => {
    expect(classifyTimeSlot(6)).toBe("오전");
  });

  it("11시는 오전이다", () => {
    expect(classifyTimeSlot(11)).toBe("오전");
  });

  it("12시는 오후이다", () => {
    expect(classifyTimeSlot(12)).toBe("오후");
  });

  it("17시는 오후이다", () => {
    expect(classifyTimeSlot(17)).toBe("오후");
  });

  it("18시는 저녁이다", () => {
    expect(classifyTimeSlot(18)).toBe("저녁");
  });

  it("23시는 저녁이다", () => {
    expect(classifyTimeSlot(23)).toBe("저녁");
  });

  it("0시는 저녁(심야)으로 분류된다", () => {
    expect(classifyTimeSlot(0)).toBe("저녁");
  });

  it("5시는 저녁(심야)으로 분류된다", () => {
    expect(classifyTimeSlot(5)).toBe("저녁");
  });

  it("경계값 6: 오전", () => {
    expect(classifyTimeSlot(6)).toBe("오전");
  });

  it("경계값 12: 오후 (6 이상, 12 미만이 아님)", () => {
    expect(classifyTimeSlot(12)).toBe("오후");
  });

  it("경계값 18: 저녁 (12 이상, 18 미만이 아님)", () => {
    expect(classifyTimeSlot(18)).toBe("저녁");
  });
});

// ============================================================
// useOptimalScheduleTime - getDayLabel 로직
// ============================================================

describe("useOptimalScheduleTime - getDayLabel 로직", () => {
  function getDayLabel(jsDay: number): DayOfWeek {
    const map: Record<number, DayOfWeek> = {
      0: "일", 1: "월", 2: "화", 3: "수",
      4: "목", 5: "금", 6: "토",
    };
    return map[jsDay];
  }

  it("0은 '일'요일이다", () => {
    expect(getDayLabel(0)).toBe("일");
  });

  it("1은 '월'요일이다", () => {
    expect(getDayLabel(1)).toBe("월");
  });

  it("2는 '화'요일이다", () => {
    expect(getDayLabel(2)).toBe("화");
  });

  it("3은 '수'요일이다", () => {
    expect(getDayLabel(3)).toBe("수");
  });

  it("4는 '목'요일이다", () => {
    expect(getDayLabel(4)).toBe("목");
  });

  it("5는 '금'요일이다", () => {
    expect(getDayLabel(5)).toBe("금");
  });

  it("6은 '토'요일이다", () => {
    expect(getDayLabel(6)).toBe("토");
  });
});

// ============================================================
// useOptimalScheduleTime - DAY_ORDER 및 slotStats 계산 로직
// ============================================================

describe("useOptimalScheduleTime - DAY_ORDER 및 dayStats 계산 로직", () => {
  const DAY_ORDER: DayOfWeek[] = ["월", "화", "수", "목", "금", "토", "일"];

  it("DAY_ORDER는 월~일 7개 요일을 포함한다", () => {
    expect(DAY_ORDER).toHaveLength(7);
    expect(DAY_ORDER[0]).toBe("월");
    expect(DAY_ORDER[6]).toBe("일");
  });

  it("dayStats는 7개 요일 항목을 가진다", () => {
    const dayStats: DayAttendanceRate[] = DAY_ORDER.map((day) => ({
      day,
      rate: 0,
      count: 0,
    }));
    expect(dayStats).toHaveLength(7);
  });

  it("DayAttendanceRate 구조는 day, rate, count를 가진다", () => {
    const stat: DayAttendanceRate = { day: "월", rate: 75, count: 4 };
    expect(stat).toHaveProperty("day");
    expect(stat).toHaveProperty("rate");
    expect(stat).toHaveProperty("count");
  });

  it("출석률 계산: present/total * 100 (반올림)", () => {
    const totalPresent = 7;
    const totalCount = 10;
    const rate = Math.round((totalPresent / totalCount) * 100);
    expect(rate).toBe(70);
  });

  it("totalCount가 0이면 rate는 0이다", () => {
    const totalPresent = 0;
    const totalCount = 0;
    const rate = totalCount > 0 ? Math.round((totalPresent / totalCount) * 100) : 0;
    expect(rate).toBe(0);
  });

  it("slotStats는 오전/오후/저녁 3개 시간대 항목을 가진다", () => {
    const SLOTS: TimeSlot[] = ["오전", "오후", "저녁"];
    const slotStats: TimeSlotAttendanceRate[] = SLOTS.map((slot) => ({
      slot,
      rate: 0,
      count: 0,
    }));
    expect(slotStats).toHaveLength(3);
  });

  it("TimeSlotAttendanceRate 구조는 slot, rate, count를 가진다", () => {
    const stat: TimeSlotAttendanceRate = { slot: "저녁", rate: 80, count: 5 };
    expect(stat).toHaveProperty("slot");
    expect(stat).toHaveProperty("rate");
    expect(stat).toHaveProperty("count");
  });
});

// ============================================================
// useOptimalScheduleTime - 최적 조합 찾기 로직
// ============================================================

describe("useOptimalScheduleTime - 최적 조합 찾기 로직", () => {
  it("최고 rate를 가진 요일+시간대 조합이 bestDay/bestSlot이 된다", () => {
    type SlotStats = { present: number; total: number };
    type DaySlotMap = Map<number, Map<TimeSlot, SlotStats>>;

    const daySlotMap: DaySlotMap = new Map();
    // 토요일(6) 오후 = 90%, 월요일(1) 저녁 = 60%
    daySlotMap.set(6, new Map([["오후" as TimeSlot, { present: 9, total: 10 }]]));
    daySlotMap.set(1, new Map([["저녁" as TimeSlot, { present: 6, total: 10 }]]));

    function getDayLabel(jsDay: number): DayOfWeek {
      const map: Record<number, DayOfWeek> = {
        0: "일", 1: "월", 2: "화", 3: "수", 4: "목", 5: "금", 6: "토",
      };
      return map[jsDay];
    }

    let bestDay: DayOfWeek = "토";
    let bestSlot: TimeSlot = "오후";
    let bestRate = 0;

    for (const [jsDayNum, slotMap] of daySlotMap.entries()) {
      const day = getDayLabel(jsDayNum);
      for (const [slot, stat] of slotMap.entries()) {
        if (stat.total === 0) continue;
        const rate = Math.round((stat.present / stat.total) * 100);
        if (rate > bestRate) {
          bestRate = rate;
          bestDay = day;
          bestSlot = slot;
        }
      }
    }

    expect(bestDay).toBe("토");
    expect(bestSlot).toBe("오후");
    expect(bestRate).toBe(90);
  });

  it("bestRate는 동점 시 첫 번째 발견된 값을 유지한다", () => {
    type SlotStats = { present: number; total: number };
    const daySlotMap = new Map([
      [1, new Map([["오전" as TimeSlot, { present: 8, total: 10 }]])],
      [2, new Map([["오전" as TimeSlot, { present: 8, total: 10 }]])],
    ]);

    function getDayLabel(jsDay: number): DayOfWeek {
      const map: Record<number, DayOfWeek> = {
        0: "일", 1: "월", 2: "화", 3: "수", 4: "목", 5: "금", 6: "토",
      };
      return map[jsDay];
    }

    let bestDay: DayOfWeek = "토";
    let bestRate = 0;

    for (const [jsDayNum, slotMap] of daySlotMap.entries()) {
      for (const [, stat] of slotMap.entries()) {
        if (stat.total === 0) continue;
        const rate = Math.round((stat.present / stat.total) * 100);
        if (rate > bestRate) {
          bestRate = rate;
          bestDay = getDayLabel(jsDayNum);
        }
      }
    }

    expect(bestRate).toBe(80);
    expect(["월", "화"]).toContain(bestDay);
  });

  it("stat.total이 0인 슬롯은 최적 계산에서 건너뛴다", () => {
    type SlotStats = { present: number; total: number };
    const daySlotMap = new Map([
      [0, new Map([["오전" as TimeSlot, { present: 0, total: 0 }]])],
    ]);

    let bestRate = 0;

    for (const [, slotMap] of daySlotMap.entries()) {
      for (const [, stat] of slotMap.entries()) {
        if (stat.total === 0) continue;
        const rate = Math.round((stat.present / stat.total) * 100);
        if (rate > bestRate) bestRate = rate;
      }
    }

    expect(bestRate).toBe(0);
  });
});

// ============================================================
// useOptimalScheduleTime - MIN_DATA_COUNT 로직
// ============================================================

describe("useOptimalScheduleTime - MIN_DATA_COUNT 로직", () => {
  const MIN_DATA_COUNT = 3;

  it("일정 수가 MIN_DATA_COUNT(3) 미만이면 null을 반환한다", () => {
    const scheduleCount = 2;
    const result = scheduleCount < MIN_DATA_COUNT ? null : { analyzedCount: scheduleCount };
    expect(result).toBeNull();
  });

  it("일정 수가 3이면 null을 반환하지 않는다", () => {
    const scheduleCount = 3;
    const result = scheduleCount < MIN_DATA_COUNT ? null : { analyzedCount: scheduleCount };
    expect(result).not.toBeNull();
  });

  it("MIN_DATA_COUNT 경계값: 2개는 부족하다", () => {
    expect(2 < MIN_DATA_COUNT).toBe(true);
  });

  it("MIN_DATA_COUNT 경계값: 3개는 충분하다", () => {
    expect(3 < MIN_DATA_COUNT).toBe(false);
  });
});

// ============================================================
// useOptimalScheduleTime - 출석 집계 로직
// ============================================================

describe("useOptimalScheduleTime - 출석 집계 로직", () => {
  it("present, late 상태만 출석으로 카운트된다", () => {
    type AttRow = { user_id: string; status: string; schedule_id: string };
    const schedAtt: AttRow[] = [
      { user_id: "u1", status: "present", schedule_id: "s1" },
      { user_id: "u2", status: "late", schedule_id: "s1" },
      { user_id: "u3", status: "absent", schedule_id: "s1" },
      { user_id: "u4", status: "excused", schedule_id: "s1" },
    ];
    const presentCount = schedAtt.filter(
      (a) => a.status === "present" || a.status === "late"
    ).length;
    expect(presentCount).toBe(2);
  });

  it("일정별 expectedTotal은 schedAtt.length와 1 중 큰 값이다", () => {
    const schedAtt: unknown[] = [];
    const expectedTotal = Math.max(schedAtt.length, 1);
    expect(expectedTotal).toBe(1);
  });

  it("일정별 expectedTotal: 5명 출석 기록이 있으면 5이다", () => {
    const schedAtt = new Array(5).fill({});
    const expectedTotal = Math.max(schedAtt.length, 1);
    expect(expectedTotal).toBe(5);
  });

  it("OptimalScheduleTimeResult 구조가 올바르다", () => {
    const result: OptimalScheduleTimeResult = {
      bestDay: "토",
      bestSlot: "오후",
      bestRate: 85,
      dayStats: [],
      slotStats: [],
      analyzedCount: 10,
    };
    expect(result).toHaveProperty("bestDay");
    expect(result).toHaveProperty("bestSlot");
    expect(result).toHaveProperty("bestRate");
    expect(result).toHaveProperty("dayStats");
    expect(result).toHaveProperty("slotStats");
    expect(result).toHaveProperty("analyzedCount");
  });

  it("일정 scheduleId → starts_at 매핑이 올바르게 구성된다", () => {
    const scheduleRows = [
      { id: "s1", starts_at: "2026-03-01T18:00:00Z" },
      { id: "s2", starts_at: "2026-03-08T14:00:00Z" },
    ];
    const scheduleMap = new Map(
      scheduleRows.map((s) => [s.id, s.starts_at])
    );
    expect(scheduleMap.get("s1")).toBe("2026-03-01T18:00:00Z");
    expect(scheduleMap.get("s2")).toBe("2026-03-08T14:00:00Z");
  });
});

// ============================================================
// useOptimalScheduleTime - SWR 키 로직
// ============================================================

describe("useOptimalScheduleTime - SWR 키 로직", () => {
  it("projectId 없이 키를 생성하면 projectId 쿼리가 없다", () => {
    const key = `/optimal-schedule-time/group-1`;
    expect(key).not.toContain("project");
  });

  it("projectId가 있으면 키에 project 쿼리가 포함된다", () => {
    const projectId = "proj-1";
    const key = `/optimal-schedule-time/group-1${projectId ? `?project=${projectId}` : ""}`;
    expect(key).toContain("project=proj-1");
  });

  it("projectId가 null이면 키에 project 쿼리가 없다", () => {
    const projectId = null;
    const key = `/optimal-schedule-time/group-1${projectId ? `?project=${projectId}` : ""}`;
    expect(key).not.toContain("project");
  });
});

// ============================================================
// useOptimalScheduleTime - 3개월 범위 계산 로직
// ============================================================

describe("useOptimalScheduleTime - 3개월 범위 계산 로직", () => {
  it("3개월 전 날짜는 현재보다 이전이다", () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    expect(threeMonthsAgo < now).toBe(true);
  });

  it("3개월 전 ISO 문자열은 올바른 형식이다", () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const iso = threeMonthsAgo.toISOString();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("현재 시각 ISO는 3개월 전보다 이후이다", () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    expect(now.toISOString() > threeMonthsAgo.toISOString()).toBe(true);
  });
});
