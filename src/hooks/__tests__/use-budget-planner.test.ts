import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBudgetPlanner } from "@/hooks/use-budget-planner";
import type { BudgetPlannerItem } from "@/types";

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
    _store: () => store,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// local-storage 모듈을 실제 localStorage를 사용하도록 mock
vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },
  saveToStorage: <T>(key: string, value: T): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
}));

// ─── 헬퍼 함수 ──────────────────────────────────────────────
function makeItem(
  overrides: Partial<Omit<BudgetPlannerItem, "id">> = {}
): Omit<BudgetPlannerItem, "id"> {
  return {
    category: "costume",
    label: "의상비",
    plannedAmount: 100000,
    actualAmount: 80000,
    period: "2026-01",
    ...overrides,
  };
}

// ============================================================
// 테스트
// ============================================================

describe("useBudgetPlanner - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("plans가 빈 배열이다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    expect(result.current.plans).toEqual([]);
  });

  it("loading이 false이다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    expect(result.current.loading).toBe(false);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    expect(typeof result.current.addPlan).toBe("function");
    expect(typeof result.current.updatePlan).toBe("function");
    expect(typeof result.current.deletePlan).toBe("function");
    expect(typeof result.current.addItem).toBe("function");
    expect(typeof result.current.updateItem).toBe("function");
    expect(typeof result.current.deleteItem).toBe("function");
    expect(typeof result.current.computeStats).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

describe("useBudgetPlanner - addPlan", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("플랜 추가 시 id가 자동 생성된다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let plan: ReturnType<typeof result.current.addPlan>;
    act(() => {
      plan = result.current.addPlan("2026년 예산", 2026);
    });
    expect(plan!.id).toBeDefined();
  });

  it("추가된 플랜의 title과 year가 올바르다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let plan: ReturnType<typeof result.current.addPlan>;
    act(() => {
      plan = result.current.addPlan("하반기 예산", 2026);
    });
    expect(plan!.title).toBe("하반기 예산");
    expect(plan!.year).toBe(2026);
  });

  it("추가된 플랜의 items는 빈 배열이다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let plan: ReturnType<typeof result.current.addPlan>;
    act(() => {
      plan = result.current.addPlan("계획A", 2026);
    });
    expect(plan!.items).toEqual([]);
  });

  it("추가 후 plans 배열 길이가 증가한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    act(() => {
      result.current.addPlan("계획1", 2026);
    });
    act(() => {
      result.current.addPlan("계획2", 2026);
    });
    expect(result.current.plans).toHaveLength(2);
  });

  it("localStorage에 저장된다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    act(() => {
      result.current.addPlan("예산계획", 2026);
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

describe("useBudgetPlanner - updatePlan", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 planId 수정 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updatePlan("non-existent", { title: "수정" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 planId 수정 시 true를 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("원래 제목", 2026);
      planId = plan.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.updatePlan(planId!, { title: "새 제목" });
    });
    expect(ret!).toBe(true);
  });
});

describe("useBudgetPlanner - deletePlan", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 planId 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deletePlan("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 planId 삭제 시 true를 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("삭제할 계획", 2026);
      planId = plan.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.deletePlan(planId!);
    });
    expect(ret!).toBe(true);
  });

  it("삭제 후 plans 배열 길이가 감소한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      result.current.deletePlan(planId!);
    });
    expect(result.current.plans).toHaveLength(0);
  });
});

describe("useBudgetPlanner - addItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 planId에 아이템 추가 시 null을 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let ret: ReturnType<typeof result.current.addItem>;
    act(() => {
      ret = result.current.addItem("non-existent", makeItem());
    });
    expect(ret!).toBeNull();
  });

  it("존재하는 planId에 아이템 추가 시 id가 부여된 아이템을 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem(planId!, makeItem());
    });
    expect(item!).not.toBeNull();
    expect(item!.id).toBeDefined();
  });

  it("추가된 아이템의 category가 올바르다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem(planId!, makeItem({ category: "venue" }));
    });
    expect(item!.category).toBe("venue");
  });
});

describe("useBudgetPlanner - updateItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 planId로 수정 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateItem("no-plan", "no-item", { label: "수정" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 itemId로 수정 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.updateItem(planId!, "no-item", { label: "수정" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 planId+itemId로 수정 시 true를 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    let itemId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      const item = result.current.addItem(planId!, makeItem());
      itemId = item!.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.updateItem(planId!, itemId!, { label: "수정된 레이블" });
    });
    expect(ret!).toBe(true);
  });
});

describe("useBudgetPlanner - deleteItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 planId로 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteItem("no-plan", "no-item");
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 itemId로 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.deleteItem(planId!, "no-item");
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 항목 삭제 시 true를 반환한다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    let itemId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      const item = result.current.addItem(planId!, makeItem());
      itemId = item!.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.deleteItem(planId!, itemId!);
    });
    expect(ret!).toBe(true);
  });
});

describe("useBudgetPlanner - computeStats 순수 로직", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("빈 플랜의 통계는 모두 0이다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("빈 계획", 2026);
      planId = plan.id;
    });
    const stats = result.current.computeStats(planId!);
    expect(stats.totalPlanned).toBe(0);
    expect(stats.totalActual).toBe(0);
    expect(stats.remainingBudget).toBe(0);
    expect(stats.overallRatio).toBe(0);
    expect(stats.categoryBreakdown).toEqual([]);
  });

  it("존재하지 않는 planId의 통계는 모두 0이다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    const stats = result.current.computeStats("non-existent");
    expect(stats.totalPlanned).toBe(0);
    expect(stats.totalActual).toBe(0);
  });

  it("totalPlanned가 items의 plannedAmount 합계와 같다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ plannedAmount: 100000, actualAmount: 0 }));
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ category: "venue", plannedAmount: 200000, actualAmount: 0 }));
    });
    const stats = result.current.computeStats(planId!);
    expect(stats.totalPlanned).toBe(300000);
  });

  it("totalActual이 items의 actualAmount 합계와 같다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ plannedAmount: 100000, actualAmount: 50000 }));
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ category: "food", plannedAmount: 50000, actualAmount: 30000 }));
    });
    const stats = result.current.computeStats(planId!);
    expect(stats.totalActual).toBe(80000);
  });

  it("remainingBudget이 totalPlanned - totalActual이다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ plannedAmount: 200000, actualAmount: 150000 }));
    });
    const stats = result.current.computeStats(planId!);
    expect(stats.remainingBudget).toBe(50000);
  });

  it("overallRatio가 totalActual / totalPlanned이다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ plannedAmount: 100000, actualAmount: 75000 }));
    });
    const stats = result.current.computeStats(planId!);
    expect(stats.overallRatio).toBeCloseTo(0.75);
  });

  it("plannedAmount=0인 카테고리는 categoryBreakdown에 포함되지 않는다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ category: "costume", plannedAmount: 100000, actualAmount: 0 }));
    });
    const stats = result.current.computeStats(planId!);
    // venue, equipment 등 plannedAmount=0이고 actualAmount=0인 카테고리는 제외
    const venueBrk = stats.categoryBreakdown.find((b) => b.category === "venue");
    expect(venueBrk).toBeUndefined();
  });

  it("categoryBreakdown의 label이 한글로 매핑된다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ category: "venue", plannedAmount: 50000, actualAmount: 0 }));
    });
    const stats = result.current.computeStats(planId!);
    const venueBrk = stats.categoryBreakdown.find((b) => b.category === "venue");
    expect(venueBrk?.label).toBe("장소");
  });

  it("actualAmount > plannedAmount일 때 overallRatio가 1 이상이다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ plannedAmount: 100000, actualAmount: 150000 }));
    });
    const stats = result.current.computeStats(planId!);
    expect(stats.overallRatio).toBeGreaterThan(1);
  });

  it("여러 카테고리가 있을 때 categoryBreakdown 길이가 정확하다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan("계획", 2026);
      planId = plan.id;
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ category: "costume", plannedAmount: 10000, actualAmount: 0 }));
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ category: "food", plannedAmount: 20000, actualAmount: 0 }));
    });
    act(() => {
      result.current.addItem(planId!, makeItem({ category: "venue", plannedAmount: 30000, actualAmount: 0 }));
    });
    const stats = result.current.computeStats(planId!);
    expect(stats.categoryBreakdown).toHaveLength(3);
  });
});

describe("useBudgetPlanner - localStorage 키 형식", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("저장 키가 dancebase:budget-planner:{groupId} 형식이다", () => {
    const { result } = renderHook(() => useBudgetPlanner("group-xyz"));
    act(() => {
      result.current.addPlan("테스트", 2026);
    });
    const calls = localStorageMock.setItem.mock.calls;
    expect(calls.some(([key]: [string]) => key === "dancebase:budget-planner:group-xyz")).toBe(true);
  });
});

describe("useBudgetPlanner - 그룹별 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("다른 groupId는 서로 다른 키에 저장된다", () => {
    const { result: r1 } = renderHook(() => useBudgetPlanner("grp-A"));
    const { result: r2 } = renderHook(() => useBudgetPlanner("grp-B"));
    act(() => {
      r1.current.addPlan("A계획", 2026);
    });
    act(() => {
      r2.current.addPlan("B계획", 2026);
    });
    const calls = localStorageMock.setItem.mock.calls;
    const keysUsed = calls.map(([key]: [string]) => key);
    expect(keysUsed).toContain("dancebase:budget-planner:grp-A");
    expect(keysUsed).toContain("dancebase:budget-planner:grp-B");
  });
});
