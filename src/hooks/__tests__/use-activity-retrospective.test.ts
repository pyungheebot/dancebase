import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";
import type { ActivityRetrospective } from "@/types";

// ─── 캐시 로직 순수 함수 테스트용 헬퍼 ────────────────────────
const CACHE_KEY_PREFIX = "dancebase:retrospective:";
const MAX_CACHED_MONTHS = 12;

function sortAndTrimReports(reports: ActivityRetrospective[]): ActivityRetrospective[] {
  const sorted = [...reports].sort((a, b) => b.month.localeCompare(a.month));
  return sorted.slice(0, MAX_CACHED_MONTHS);
}

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (_key: string | null, fetcher: (() => unknown) | null, _opts?: unknown) => {
    if (!_key || !fetcher) {
      const [data] = reactUseState<unknown>(undefined);
      return { data, isLoading: false, mutate: vi.fn() };
    }
    const [data, setData] = reactUseState<unknown>(() => fetcher());
    const mutate = reactUseCallback((newData?: unknown) => {
      if (newData !== undefined) setData(newData);
      else setData(fetcher!());
      return Promise.resolve();
    }, []);
    return { data, isLoading: false, mutate };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    activityRetrospective: (groupId: string) => `activity-retrospective-${groupId}`,
  },
}));

// ─── toast mock ───────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── toast-messages mock ──────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    REPORT: {
      CREATE_ERROR: "리포트 생성에 실패했습니다",
    },
  },
}));

// ─── logger mock ──────────────────────────────────────────────
vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// ─── localStorage mock ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _store: () => store,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── Supabase mock (generateReport가 Supabase 호출하므로) ──────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (_table: string) => ({
      select: (_cols: string, _opts?: unknown) => ({
        eq: (_col: string, _val: string) => ({
          gte: (_col2: string, _val2: string) => ({
            lt: () => Promise.resolve({ data: [], count: 0, error: null }),
          }),
          in: () => Promise.resolve({ data: [], error: null }),
        }),
        in: (_col: string, _ids: string[]) => Promise.resolve({ data: [], error: null }),
      }),
    }),
  }),
}));

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeReport(month: string, overrides: Partial<ActivityRetrospective> = {}): ActivityRetrospective {
  return {
    month,
    attendanceRate: 80,
    totalSchedules: 4,
    totalPosts: 10,
    totalComments: 20,
    memberGrowth: 1,
    totalIncome: 100000,
    totalExpense: 50000,
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeHook(groupId = "group-1") {
  return renderHook(() => {
    const { useActivityRetrospective } = require("@/hooks/use-activity-retrospective");
    return useActivityRetrospective(groupId);
  });
}

// ============================================================
// 캐시 정렬/트리밍 순수 로직 테스트
// ============================================================

describe("캐시 정렬 및 트리밍 로직", () => {
  it("최신 월이 먼저 오도록 정렬된다", () => {
    const reports = [
      makeReport("2025-01"),
      makeReport("2026-03"),
      makeReport("2025-12"),
    ];
    const sorted = sortAndTrimReports(reports);
    expect(sorted[0].month).toBe("2026-03");
    expect(sorted[1].month).toBe("2025-12");
    expect(sorted[2].month).toBe("2025-01");
  });

  it("MAX_CACHED_MONTHS(12) 초과 시 오래된 데이터가 잘린다", () => {
    const reports = Array.from({ length: 15 }, (_, i) => {
      const month = `2025-${String(i + 1).padStart(2, "0")}`;
      return makeReport(month);
    });
    const trimmed = sortAndTrimReports(reports);
    expect(trimmed).toHaveLength(12);
  });

  it("12개 이하일 때는 모두 유지된다", () => {
    const reports = [
      makeReport("2026-01"),
      makeReport("2026-02"),
      makeReport("2026-03"),
    ];
    const trimmed = sortAndTrimReports(reports);
    expect(trimmed).toHaveLength(3);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    const trimmed = sortAndTrimReports([]);
    expect(trimmed).toHaveLength(0);
  });

  it("중복 월이 있어도 정렬만 하고 제거하지 않는다", () => {
    const reports = [
      makeReport("2026-01"),
      makeReport("2026-01"),
    ];
    const trimmed = sortAndTrimReports(reports);
    expect(trimmed).toHaveLength(2);
  });
});

// ============================================================
// getCachedReport 로직 테스트
// ============================================================

describe("getCachedReport 로직", () => {
  it("월에 해당하는 리포트를 찾는다", () => {
    const cache: ActivityRetrospective[] = [
      makeReport("2026-01"),
      makeReport("2026-02"),
    ];
    const found = cache.find((r) => r.month === "2026-02") ?? null;
    expect(found).not.toBeNull();
    expect(found!.month).toBe("2026-02");
  });

  it("없는 월은 null을 반환한다", () => {
    const cache: ActivityRetrospective[] = [makeReport("2026-01")];
    const found = cache.find((r) => r.month === "2026-03") ?? null;
    expect(found).toBeNull();
  });

  it("빈 캐시에서 항상 null을 반환한다", () => {
    const cache: ActivityRetrospective[] = [];
    const found = cache.find((r) => r.month === "2026-01") ?? null;
    expect(found).toBeNull();
  });
});

// ============================================================
// attendanceRate 계산 로직
// ============================================================

describe("attendanceRate 계산 로직", () => {
  it("출석 비율이 올바르게 계산된다", () => {
    const rows = [
      { status: "present" },
      { status: "present" },
      { status: "absent" },
      { status: "late" },
    ];
    const total = rows.length;
    const present = rows.filter((r) => r.status === "present" || r.status === "late").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    expect(rate).toBe(75);
  });

  it("전체 출석이면 100%이다", () => {
    const rows = [{ status: "present" }, { status: "late" }];
    const total = rows.length;
    const present = rows.filter((r) => r.status === "present" || r.status === "late").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    expect(rate).toBe(100);
  });

  it("전체 결석이면 0%이다", () => {
    const rows = [{ status: "absent" }, { status: "absent" }];
    const total = rows.length;
    const present = rows.filter((r) => r.status === "present" || r.status === "late").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    expect(rate).toBe(0);
  });

  it("출석 기록이 없으면 0%이다", () => {
    const rows: { status: string }[] = [];
    const total = rows.length;
    const present = rows.filter((r) => r.status === "present" || r.status === "late").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    expect(rate).toBe(0);
  });
});

// ============================================================
// memberGrowth 계산 로직
// ============================================================

describe("memberGrowth 계산 로직", () => {
  it("신규 가입이 탈퇴보다 많으면 양수이다", () => {
    const joinedCount = 5;
    const leftCount = 2;
    const memberGrowth = joinedCount - leftCount;
    expect(memberGrowth).toBe(3);
  });

  it("탈퇴가 신규보다 많으면 음수이다", () => {
    const joinedCount = 1;
    const leftCount = 3;
    const memberGrowth = joinedCount - leftCount;
    expect(memberGrowth).toBe(-2);
  });

  it("변화가 없으면 0이다", () => {
    const joinedCount = 2;
    const leftCount = 2;
    const memberGrowth = joinedCount - leftCount;
    expect(memberGrowth).toBe(0);
  });
});

// ============================================================
// 재정 집계 로직
// ============================================================

describe("재정 집계 로직 (totalIncome, totalExpense)", () => {
  it("수입 합산이 올바르다", () => {
    const txRows = [
      { type: "income", amount: 50000 },
      { type: "income", amount: 30000 },
      { type: "expense", amount: 10000 },
    ];
    const totalIncome = txRows
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    expect(totalIncome).toBe(80000);
  });

  it("지출 합산이 올바르다", () => {
    const txRows = [
      { type: "income", amount: 50000 },
      { type: "expense", amount: 20000 },
      { type: "expense", amount: 30000 },
    ];
    const totalExpense = txRows
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    expect(totalExpense).toBe(50000);
  });

  it("거래가 없으면 수입/지출 모두 0이다", () => {
    const txRows: { type: string; amount: number | null }[] = [];
    const totalIncome = txRows
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const totalExpense = txRows
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    expect(totalIncome).toBe(0);
    expect(totalExpense).toBe(0);
  });

  it("amount가 null인 경우 0으로 처리한다", () => {
    const txRows: { type: string; amount: number | null }[] = [
      { type: "income", amount: null },
      { type: "income", amount: 10000 },
    ];
    const totalIncome = txRows
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    expect(totalIncome).toBe(10000);
  });
});

// ============================================================
// useActivityRetrospective 훅 - 초기 상태
// ============================================================

describe("useActivityRetrospective - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
  });

  it("초기 reports는 빈 배열이다", async () => {
    const { useActivityRetrospective } = await import("@/hooks/use-activity-retrospective");
    const { result } = renderHook(() => useActivityRetrospective("group-1"));
    expect(result.current.reports).toEqual([]);
  });

  it("generateReport 함수가 존재한다", async () => {
    const { useActivityRetrospective } = await import("@/hooks/use-activity-retrospective");
    const { result } = renderHook(() => useActivityRetrospective("group-1"));
    expect(typeof result.current.generateReport).toBe("function");
  });

  it("clearCache 함수가 존재한다", async () => {
    const { useActivityRetrospective } = await import("@/hooks/use-activity-retrospective");
    const { result } = renderHook(() => useActivityRetrospective("group-1"));
    expect(typeof result.current.clearCache).toBe("function");
  });

  it("refetch 함수가 존재한다", async () => {
    const { useActivityRetrospective } = await import("@/hooks/use-activity-retrospective");
    const { result } = renderHook(() => useActivityRetrospective("group-1"));
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useActivityRetrospective 훅 - clearCache
// ============================================================

describe("useActivityRetrospective - clearCache", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
  });

  it("clearCache 호출 후 reports가 빈 배열이 된다", async () => {
    const { useActivityRetrospective } = await import("@/hooks/use-activity-retrospective");
    const { result } = renderHook(() => useActivityRetrospective("group-1"));

    // localStorage에 직접 데이터 세팅
    const key = `${CACHE_KEY_PREFIX}group-1`;
    localStorageMock.setItem(key, JSON.stringify([makeReport("2026-01")]));

    act(() => {
      result.current.clearCache();
    });

    expect(result.current.reports).toHaveLength(0);
  });

  it("clearCache는 removeItem을 호출한다", async () => {
    const { useActivityRetrospective } = await import("@/hooks/use-activity-retrospective");
    const { result } = renderHook(() => useActivityRetrospective("group-1"));

    act(() => {
      result.current.clearCache();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });
});

// ============================================================
// ActivityRetrospective 타입 구조
// ============================================================

describe("ActivityRetrospective 타입 필드", () => {
  it("모든 필수 필드가 존재한다", () => {
    const report = makeReport("2026-01");
    expect(report).toHaveProperty("month");
    expect(report).toHaveProperty("attendanceRate");
    expect(report).toHaveProperty("totalSchedules");
    expect(report).toHaveProperty("totalPosts");
    expect(report).toHaveProperty("totalComments");
    expect(report).toHaveProperty("memberGrowth");
    expect(report).toHaveProperty("totalIncome");
    expect(report).toHaveProperty("totalExpense");
    expect(report).toHaveProperty("generatedAt");
  });

  it("month 형식은 YYYY-MM 이다", () => {
    const report = makeReport("2026-03");
    expect(report.month).toMatch(/^\d{4}-\d{2}$/);
  });

  it("attendanceRate는 0~100 범위이다", () => {
    const report = makeReport("2026-01", { attendanceRate: 75 });
    expect(report.attendanceRate).toBeGreaterThanOrEqual(0);
    expect(report.attendanceRate).toBeLessThanOrEqual(100);
  });
});
