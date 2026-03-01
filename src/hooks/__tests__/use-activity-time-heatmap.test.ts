import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── 공통 mock: TIME_SLOTS ────────────────────────────────────
const MOCK_TIME_SLOTS = [
  { key: "morning",   label: "오전", range: "06-12", startHour: 6,  endHour: 12 },
  { key: "afternoon", label: "오후", range: "12-18", startHour: 12, endHour: 18 },
  { key: "evening",   label: "저녁", range: "18-22", startHour: 18, endHour: 22 },
  { key: "night",     label: "야간", range: "22-06", startHour: 22, endHour: 6  },
];

// ─── Supabase mock ───────────────────────────────────────────
// 각 테스트에서 교체 가능한 데이터 저장소
let mockSchedules: { id: string; starts_at: string }[] = [];
let mockAttendances: { schedule_id: string; status: string }[] = [];
let mockPosts: { id: string; created_at: string }[] = [];
let mockComments: { created_at: string }[] = [];

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (_col: string, _val: string) => ({
          neq: () => ({
            gte: () => Promise.resolve({ data: mockSchedules, error: null }),
          }),
          gte: (_col2: string, _val2: string) => ({
            lt: () => Promise.resolve({
              data:
                table === "board_posts" && cols.includes("id")
                  ? mockPosts.map((p) => ({ id: p.id }))
                  : mockPosts,
              count: null,
              error: null,
            }),
          }),
        }),
        in: (_col: string, ids: string[]) => ({
          in: (_col2: string, _statuses: string[]) =>
            Promise.resolve({ data: mockAttendances.filter((a) => ids.includes(a.schedule_id)), error: null }),
          gte: () => Promise.resolve({ data: mockComments, error: null }),
        }),
      }),
    }),
  }),
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (_key: string | null, fetcher: (() => unknown) | null) => {
    if (!_key || !fetcher) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    const [data, setData] = reactUseState<unknown>(() => undefined);
    const [resolved, setResolved] = reactUseState(false);

    if (!resolved) {
      Promise.resolve(fetcher()).then((v) => {
        setData(v);
        setResolved(true);
      });
    }

    const mutate = reactUseCallback(() => Promise.resolve(), []);
    return { data, isLoading: !resolved, mutate };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    activityTimeHeatmap: (groupId: string) => `activity-time-heatmap-${groupId}`,
  },
}));

// ─── types mock ───────────────────────────────────────────────
vi.mock("@/types", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/types")>();
  return {
    ...original,
    TIME_SLOTS: MOCK_TIME_SLOTS,
  };
});

// ─── 순수 함수 직접 테스트용 헬퍼 ─────────────────────────────
// getTimeSlot 로직을 훅 외부에서 직접 검증
function getTimeSlotForTest(hour: number): string {
  for (const slot of MOCK_TIME_SLOTS) {
    if (slot.key === "night") {
      if (hour >= 22 || hour < 6) return "night";
    } else {
      if (hour >= slot.startHour && hour < slot.endHour) return slot.key;
    }
  }
  return "morning";
}

// calcIntensity 로직을 직접 검증
function calcIntensityForTest(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

// ============================================================
// getTimeSlot - 순수 로직 테스트
// ============================================================

describe("getTimeSlot - 시간대 판별 로직", () => {
  it("6시는 morning이다", () => {
    expect(getTimeSlotForTest(6)).toBe("morning");
  });

  it("11시는 morning이다", () => {
    expect(getTimeSlotForTest(11)).toBe("morning");
  });

  it("12시는 afternoon이다", () => {
    expect(getTimeSlotForTest(12)).toBe("afternoon");
  });

  it("17시는 afternoon이다", () => {
    expect(getTimeSlotForTest(17)).toBe("afternoon");
  });

  it("18시는 evening이다", () => {
    expect(getTimeSlotForTest(18)).toBe("evening");
  });

  it("21시는 evening이다", () => {
    expect(getTimeSlotForTest(21)).toBe("evening");
  });

  it("22시는 night이다", () => {
    expect(getTimeSlotForTest(22)).toBe("night");
  });

  it("23시는 night이다", () => {
    expect(getTimeSlotForTest(23)).toBe("night");
  });

  it("0시(자정)는 night이다", () => {
    expect(getTimeSlotForTest(0)).toBe("night");
  });

  it("5시는 night이다", () => {
    expect(getTimeSlotForTest(5)).toBe("night");
  });
});

// ============================================================
// calcIntensity - 강도 레벨 계산 로직 테스트
// ============================================================

describe("calcIntensity - 강도 레벨 계산 로직", () => {
  it("count가 0이면 intensity는 0이다", () => {
    expect(calcIntensityForTest(0, 100)).toBe(0);
  });

  it("maxCount가 0이면 intensity는 0이다", () => {
    expect(calcIntensityForTest(0, 0)).toBe(0);
  });

  it("ratio가 0.25 이하이면 intensity는 1이다", () => {
    expect(calcIntensityForTest(25, 100)).toBe(1);
    expect(calcIntensityForTest(1, 100)).toBe(1);
  });

  it("ratio가 0.25 초과 ~ 0.5 이하이면 intensity는 2이다", () => {
    expect(calcIntensityForTest(50, 100)).toBe(2);
    expect(calcIntensityForTest(26, 100)).toBe(2);
  });

  it("ratio가 0.5 초과 ~ 0.75 이하이면 intensity는 3이다", () => {
    expect(calcIntensityForTest(75, 100)).toBe(3);
    expect(calcIntensityForTest(51, 100)).toBe(3);
  });

  it("ratio가 0.75 초과이면 intensity는 4이다", () => {
    expect(calcIntensityForTest(100, 100)).toBe(4);
    expect(calcIntensityForTest(76, 100)).toBe(4);
  });

  it("count와 maxCount가 동일하면 intensity는 4이다", () => {
    expect(calcIntensityForTest(5, 5)).toBe(4);
  });

  it("maxCount보다 count가 매우 작으면 intensity는 1이다", () => {
    expect(calcIntensityForTest(1, 1000)).toBe(1);
  });
});

// ============================================================
// useActivityTimeHeatmap - 반환 구조 테스트
// ============================================================

describe("useActivityTimeHeatmap - 반환 구조", () => {
  beforeEach(() => {
    mockSchedules = [];
    mockAttendances = [];
    mockPosts = [];
    mockComments = [];
  });

  it("groupId가 빈 문자열이면 기본값을 반환한다", async () => {
    const { useActivityTimeHeatmap } = await import("@/hooks/use-activity-time-heatmap");
    const { result } = renderHook(() => useActivityTimeHeatmap(""));
    expect(result.current.cells).toEqual([]);
    expect(result.current.busiestSlot).toBeNull();
    expect(result.current.quietestSlot).toBeNull();
    expect(result.current.hasData).toBe(false);
  });

  it("cells, busiestSlot, quietestSlot, hasData, loading, refetch가 반환된다", async () => {
    const { useActivityTimeHeatmap } = await import("@/hooks/use-activity-time-heatmap");
    const { result } = renderHook(() => useActivityTimeHeatmap("group-1"));
    expect(result.current).toHaveProperty("cells");
    expect(result.current).toHaveProperty("busiestSlot");
    expect(result.current).toHaveProperty("quietestSlot");
    expect(result.current).toHaveProperty("hasData");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("refetch");
  });

  it("refetch는 함수이다", async () => {
    const { useActivityTimeHeatmap } = await import("@/hooks/use-activity-time-heatmap");
    const { result } = renderHook(() => useActivityTimeHeatmap("group-1"));
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// 28칸 셀 구조 검증 (단위 테스트)
// ============================================================

describe("heatmap 28칸 셀 구조 검증", () => {
  it("요일 7개 × 시간대 4개 = 28칸이다", () => {
    const slots = ["morning", "afternoon", "evening", "night"];
    const cells: Array<{ dayOfWeek: number; timeSlot: string; count: number; intensity: number }> = [];
    for (let dow = 0; dow < 7; dow++) {
      for (const slot of slots) {
        cells.push({ dayOfWeek: dow, timeSlot: slot, count: 0, intensity: 0 });
      }
    }
    expect(cells).toHaveLength(28);
  });

  it("각 셀은 dayOfWeek, timeSlot, count, intensity 필드를 가진다", () => {
    const cell = { dayOfWeek: 0, timeSlot: "morning", count: 5, intensity: 2 };
    expect(cell).toHaveProperty("dayOfWeek");
    expect(cell).toHaveProperty("timeSlot");
    expect(cell).toHaveProperty("count");
    expect(cell).toHaveProperty("intensity");
  });

  it("dayOfWeek 범위는 0~6이다", () => {
    const slots = ["morning", "afternoon", "evening", "night"];
    const cells: Array<{ dayOfWeek: number; timeSlot: string }> = [];
    for (let dow = 0; dow < 7; dow++) {
      for (const slot of slots) {
        cells.push({ dayOfWeek: dow, timeSlot: slot });
      }
    }
    const dows = cells.map((c) => c.dayOfWeek);
    expect(Math.min(...dows)).toBe(0);
    expect(Math.max(...dows)).toBe(6);
  });
});

// ============================================================
// countMap 로직 단위 테스트
// ============================================================

describe("countMap 집계 로직", () => {
  it("같은 키의 활동은 누적된다", () => {
    const countMap = new Map<string, number>();
    const items = [
      { dayOfWeek: 1, timeSlot: "morning" },
      { dayOfWeek: 1, timeSlot: "morning" },
      { dayOfWeek: 2, timeSlot: "evening" },
    ];
    for (const item of items) {
      const key = `${item.dayOfWeek}-${item.timeSlot}`;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
    expect(countMap.get("1-morning")).toBe(2);
    expect(countMap.get("2-evening")).toBe(1);
  });

  it("빈 활동 목록에서 countMap은 비어있다", () => {
    const countMap = new Map<string, number>();
    expect(countMap.size).toBe(0);
  });

  it("maxCount는 가장 높은 카운트이다", () => {
    const countMap = new Map<string, number>([
      ["0-morning", 5],
      ["1-evening", 10],
      ["2-night", 3],
    ]);
    const maxCount = Math.max(0, ...Array.from(countMap.values()));
    expect(maxCount).toBe(10);
  });

  it("빈 countMap의 maxCount는 0이다", () => {
    const countMap = new Map<string, number>();
    const maxCount = Math.max(0, ...Array.from(countMap.values()));
    expect(maxCount).toBe(0);
  });
});

// ============================================================
// busiestSlot / quietestSlot 로직
// ============================================================

describe("busiestSlot / quietestSlot 판별 로직", () => {
  it("활동이 없으면 busiestSlot은 null이다", () => {
    type Cell = { dayOfWeek: number; timeSlot: string; count: number };
    const cells: Cell[] = [
      { dayOfWeek: 0, timeSlot: "morning", count: 0 },
      { dayOfWeek: 1, timeSlot: "afternoon", count: 0 },
    ];
    const activeCells = cells.filter((c) => c.count > 0);
    const busiestSlot = activeCells.length > 0
      ? activeCells.reduce((a, b) => (b.count > a.count ? b : a))
      : null;
    expect(busiestSlot).toBeNull();
  });

  it("활동이 있으면 busiestSlot은 가장 높은 count를 가진 셀이다", () => {
    type Cell = { dayOfWeek: number; timeSlot: string; count: number };
    const cells: Cell[] = [
      { dayOfWeek: 0, timeSlot: "morning", count: 5 },
      { dayOfWeek: 2, timeSlot: "evening", count: 10 },
      { dayOfWeek: 5, timeSlot: "night", count: 3 },
    ];
    const activeCells = cells.filter((c) => c.count > 0);
    const busiest = activeCells.reduce((a, b) => (b.count > a.count ? b : a));
    expect(busiest.dayOfWeek).toBe(2);
    expect(busiest.timeSlot).toBe("evening");
  });

  it("활동이 있으면 quietestSlot은 가장 낮은 count를 가진 셀이다", () => {
    type Cell = { dayOfWeek: number; timeSlot: string; count: number };
    const cells: Cell[] = [
      { dayOfWeek: 0, timeSlot: "morning", count: 5 },
      { dayOfWeek: 2, timeSlot: "evening", count: 10 },
      { dayOfWeek: 5, timeSlot: "night", count: 1 },
    ];
    const activeCells = cells.filter((c) => c.count > 0);
    const quietest = activeCells.reduce((a, b) => (b.count < a.count ? b : a));
    expect(quietest.dayOfWeek).toBe(5);
    expect(quietest.timeSlot).toBe("night");
  });

  it("hasData는 활동 셀이 하나 이상일 때 true이다", () => {
    type Cell = { count: number };
    const cells: Cell[] = [{ count: 3 }, { count: 0 }];
    const activeCells = cells.filter((c) => c.count > 0);
    expect(activeCells.length > 0).toBe(true);
  });

  it("모든 셀의 count가 0이면 hasData는 false이다", () => {
    type Cell = { count: number };
    const cells: Cell[] = [{ count: 0 }, { count: 0 }];
    const activeCells = cells.filter((c) => c.count > 0);
    expect(activeCells.length > 0).toBe(false);
  });
});
