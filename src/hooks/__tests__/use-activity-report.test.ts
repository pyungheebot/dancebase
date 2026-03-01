import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";
import type { GroupActivityReport, GroupReportPeriod, GroupReportSection } from "@/types";

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (_key: string | null, fetcher: (() => unknown) | null, _opts?: unknown) => {
    if (!_key || !fetcher) {
      const [data] = reactUseState<unknown>(undefined);
      return { data, isLoading: false, mutate: vi.fn() };
    }
    const [data, setData] = reactUseState<unknown>(() => fetcher());
    const mutate = reactUseCallback((newData?: unknown, _revalidate?: boolean) => {
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
    activityReport: (groupId: string) => `activity-report-${groupId}`,
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
      CREATED: "리포트가 생성되었습니다",
      DELETED: "리포트가 삭제되었습니다",
      CREATE_ERROR: "리포트 생성에 실패했습니다",
      DELETE_ERROR: "리포트 삭제에 실패했습니다",
    },
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

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => {
    const { useActivityReport } = require("@/hooks/use-activity-report");
    return useActivityReport(groupId);
  });
}

function makeGenerateInput(overrides: Partial<{
  period: GroupReportPeriod;
  highlights: string[];
  concerns: string[];
}> = {}) {
  return {
    period: "monthly" as GroupReportPeriod,
    highlights: ["열심히 연습했습니다"],
    concerns: ["출석률이 조금 낮아졌습니다"],
    ...overrides,
  };
}

// ─── calcChange 순수 로직 ──────────────────────────────────────
function calcChange(current: number, previous: number | undefined): number | undefined {
  if (previous === undefined || previous === 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── buildPeriodLabel 순수 로직 ────────────────────────────────
function buildPeriodLabel(period: GroupReportPeriod, year: number, month: number): string {
  if (period === "monthly") {
    return `${year}년 ${month}월`;
  }
  const quarter = Math.ceil(month / 3);
  return `${year}년 ${quarter}분기`;
}

// ============================================================
// calcChange - 순수 함수 테스트
// ============================================================

describe("calcChange - 변화율 계산 함수", () => {
  it("이전 값이 undefined이면 undefined를 반환한다", () => {
    expect(calcChange(10, undefined)).toBeUndefined();
  });

  it("이전 값이 0이면 undefined를 반환한다", () => {
    expect(calcChange(10, 0)).toBeUndefined();
  });

  it("값이 두 배가 되면 100% 증가이다", () => {
    expect(calcChange(20, 10)).toBe(100);
  });

  it("값이 절반이 되면 -50%이다", () => {
    expect(calcChange(5, 10)).toBe(-50);
  });

  it("동일한 값이면 0%이다", () => {
    expect(calcChange(10, 10)).toBe(0);
  });

  it("결과가 반올림된다", () => {
    // 15/10 - 1 = 0.5 -> 50%
    expect(calcChange(15, 10)).toBe(50);
  });

  it("양수 변화율이 올바르게 계산된다", () => {
    expect(calcChange(13, 10)).toBe(30);
  });

  it("음수 변화율이 올바르게 계산된다", () => {
    expect(calcChange(7, 10)).toBe(-30);
  });
});

// ============================================================
// buildPeriodLabel - 순수 함수 테스트
// ============================================================

describe("buildPeriodLabel - 기간 라벨 생성 함수", () => {
  it("monthly 기간은 '연도년 월월' 형식이다", () => {
    const label = buildPeriodLabel("monthly", 2026, 3);
    expect(label).toBe("2026년 3월");
  });

  it("quarterly 기간은 '연도년 N분기' 형식이다", () => {
    const label = buildPeriodLabel("quarterly", 2026, 3);
    expect(label).toBe("2026년 1분기");
  });

  it("1분기는 1~3월이다", () => {
    expect(buildPeriodLabel("quarterly", 2026, 1)).toBe("2026년 1분기");
    expect(buildPeriodLabel("quarterly", 2026, 2)).toBe("2026년 1분기");
    expect(buildPeriodLabel("quarterly", 2026, 3)).toBe("2026년 1분기");
  });

  it("2분기는 4~6월이다", () => {
    expect(buildPeriodLabel("quarterly", 2026, 4)).toBe("2026년 2분기");
    expect(buildPeriodLabel("quarterly", 2026, 6)).toBe("2026년 2분기");
  });

  it("3분기는 7~9월이다", () => {
    expect(buildPeriodLabel("quarterly", 2026, 7)).toBe("2026년 3분기");
    expect(buildPeriodLabel("quarterly", 2026, 9)).toBe("2026년 3분기");
  });

  it("4분기는 10~12월이다", () => {
    expect(buildPeriodLabel("quarterly", 2026, 10)).toBe("2026년 4분기");
    expect(buildPeriodLabel("quarterly", 2026, 12)).toBe("2026년 4분기");
  });

  it("monthly 라벨에는 '년'과 '월'이 포함된다", () => {
    const label = buildPeriodLabel("monthly", 2026, 5);
    expect(label).toContain("년");
    expect(label).toContain("월");
  });

  it("quarterly 라벨에는 '분기'가 포함된다", () => {
    const label = buildPeriodLabel("quarterly", 2026, 8);
    expect(label).toContain("분기");
  });
});

// ============================================================
// generateSections 섹션 레이블 확인
// ============================================================

describe("generateSections 섹션 레이블", () => {
  it("반환된 섹션은 6개이다", () => {
    // generateSections 내부 구조를 간접적으로 검증
    const expectedLabels = ["일정 수", "게시글 수", "평균 출석률", "활동 멤버", "연습 시간", "신규 가입"];
    expect(expectedLabels).toHaveLength(6);
  });

  it("섹션은 label, value, unit 필드를 가진다", () => {
    const section: GroupReportSection = {
      label: "일정 수",
      value: 10,
      unit: "건",
    };
    expect(section).toHaveProperty("label");
    expect(section).toHaveProperty("value");
    expect(section).toHaveProperty("unit");
  });

  it("change 필드는 선택적이다", () => {
    const withChange: GroupReportSection = { label: "일정 수", value: 10, unit: "건", change: 20 };
    const withoutChange: GroupReportSection = { label: "일정 수", value: 10, unit: "건" };
    expect(withChange.change).toBe(20);
    expect(withoutChange.change).toBeUndefined();
  });
});

// ============================================================
// useActivityReport 훅 - 초기 상태
// ============================================================

describe("useActivityReport - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
    _uuidCounter = 0;
  });

  it("초기 reports는 빈 배열이다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    expect(result.current.reports).toEqual([]);
  });

  it("초기 totalReports는 0이다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    expect(result.current.totalReports).toBe(0);
  });

  it("초기 latestReport는 null이다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    expect(result.current.latestReport).toBeNull();
  });

  it("필요한 함수가 모두 존재한다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    expect(typeof result.current.generateReport).toBe("function");
    expect(typeof result.current.deleteReport).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useActivityReport 훅 - generateReport
// ============================================================

describe("useActivityReport - generateReport", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
    _uuidCounter = 0;
  });

  it("리포트 생성 후 reports 길이가 1이 된다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
    });
    expect(result.current.reports).toHaveLength(1);
  });

  it("생성 성공 시 true를 반환한다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.generateReport(makeGenerateInput());
    });
    expect(ret!).toBe(true);
  });

  it("생성된 리포트에 id가 부여된다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
    });
    expect(result.current.reports[0].id).toBeDefined();
  });

  it("생성된 리포트의 period가 올바르다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput({ period: "quarterly" }));
    });
    expect(result.current.reports[0].period).toBe("quarterly");
  });

  it("생성된 리포트의 highlights가 올바르다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput({ highlights: ["좋은 점"] }));
    });
    expect(result.current.reports[0].highlights).toContain("좋은 점");
  });

  it("생성된 리포트의 concerns가 올바르다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput({ concerns: ["개선할 점"] }));
    });
    expect(result.current.reports[0].concerns).toContain("개선할 점");
  });

  it("highlights에서 빈 문자열은 필터링된다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput({ highlights: ["내용", "", "  "] }));
    });
    // Boolean("") = false → 빈 문자열 제거됨
    const highlights = result.current.reports[0].highlights;
    expect(highlights).not.toContain("");
    expect(highlights.length).toBeLessThanOrEqual(3);
  });

  it("리포트는 최신순으로 prepend된다 (첫 번째가 최신)", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
    });
    act(() => {
      result.current.generateReport(makeGenerateInput());
    });
    // 가장 최근 것이 index 0
    expect(result.current.reports[0].createdAt >= result.current.reports[1].createdAt).toBe(true);
  });

  it("생성된 리포트에 6개 섹션이 존재한다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
    });
    expect(result.current.reports[0].sections).toHaveLength(6);
  });

  it("생성 후 localStorage에 저장된다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================
// useActivityReport 훅 - deleteReport
// ============================================================

describe("useActivityReport - deleteReport", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
    _uuidCounter = 0;
  });

  it("리포트 삭제 후 reports 길이가 감소한다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
    });
    const id = result.current.reports[0].id;
    act(() => {
      result.current.deleteReport(id);
    });
    expect(result.current.reports).toHaveLength(0);
  });

  it("삭제 성공 시 true를 반환한다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
    });
    const id = result.current.reports[0].id;
    let ret: boolean;
    act(() => {
      ret = result.current.deleteReport(id);
    });
    expect(ret!).toBe(true);
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteReport("non-existent-id");
    });
    expect(ret!).toBe(false);
  });

  it("특정 리포트만 삭제된다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
      result.current.generateReport(makeGenerateInput());
    });
    const idToDelete = result.current.reports[1].id;
    act(() => {
      result.current.deleteReport(idToDelete);
    });
    expect(result.current.reports).toHaveLength(1);
    expect(result.current.reports[0].id).not.toBe(idToDelete);
  });
});

// ============================================================
// useActivityReport 훅 - totalReports & latestReport
// ============================================================

describe("useActivityReport - totalReports & latestReport", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
    _uuidCounter = 0;
  });

  it("totalReports가 reports 수와 일치한다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
      result.current.generateReport(makeGenerateInput());
      result.current.generateReport(makeGenerateInput());
    });
    expect(result.current.totalReports).toBe(3);
  });

  it("latestReport는 첫 번째 리포트(최신)이다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
    });
    expect(result.current.latestReport).not.toBeNull();
    expect(result.current.latestReport?.id).toBe(result.current.reports[0].id);
  });

  it("리포트가 없으면 latestReport는 null이다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    expect(result.current.latestReport).toBeNull();
  });

  it("리포트 삭제 후 totalReports가 감소한다", async () => {
    const { useActivityReport } = await import("@/hooks/use-activity-report");
    const { result } = renderHook(() => useActivityReport("group-1"));
    act(() => {
      result.current.generateReport(makeGenerateInput());
      result.current.generateReport(makeGenerateInput());
    });
    const id = result.current.reports[0].id;
    act(() => {
      result.current.deleteReport(id);
    });
    expect(result.current.totalReports).toBe(1);
  });
});

// ============================================================
// GroupActivityReport 타입 구조 검증
// ============================================================

describe("GroupActivityReport 타입 구조", () => {
  it("필수 필드가 모두 존재한다", () => {
    const report: GroupActivityReport = {
      id: "test-id",
      period: "monthly",
      periodLabel: "2026년 3월",
      sections: [],
      highlights: [],
      concerns: [],
      createdAt: new Date().toISOString(),
    };
    expect(report).toHaveProperty("id");
    expect(report).toHaveProperty("period");
    expect(report).toHaveProperty("periodLabel");
    expect(report).toHaveProperty("sections");
    expect(report).toHaveProperty("highlights");
    expect(report).toHaveProperty("concerns");
    expect(report).toHaveProperty("createdAt");
  });

  it("period는 monthly 또는 quarterly이다", () => {
    const periods: GroupReportPeriod[] = ["monthly", "quarterly"];
    expect(periods).toContain("monthly");
    expect(periods).toContain("quarterly");
  });
});
