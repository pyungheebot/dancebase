import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, _defaultValue: T): T => {
    const stored = memStore[key] as T | undefined;
    if (stored !== undefined) return stored;
    // PerfTicketData 기본값: tiers/allocations 빈 배열 보장
    return { tiers: [], allocations: [], salesGoal: null } as unknown as T;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    performanceTicket: (projectId: string) => `performance-ticket-${projectId}`,
  },
}));

// ─── 훅 import ────────────────────────────────────────────────
import { usePerformanceTicket } from "@/hooks/use-performance-ticket";
import type { PerfTicketTier, PerfTicketAllocation } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeTier(overrides: Partial<PerfTicketTier> = {}): Omit<PerfTicketTier, "id"> {
  return {
    name: "VIP",
    price: 50000,
    totalQuantity: 100,
    color: "#ff0000",
    ...overrides,
  };
}

function makeAllocation(
  tierId: string,
  overrides: Partial<Omit<PerfTicketAllocation, "id" | "createdAt">> = {}
): Omit<PerfTicketAllocation, "id" | "createdAt"> {
  return {
    tierId,
    recipientName: "홍길동",
    quantity: 2,
    status: "confirmed",
    ...overrides,
  };
}

function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

// ============================================================
// usePerformanceTicket - 초기 상태
// ============================================================

describe("usePerformanceTicket - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("초기 tiers는 빈 배열이다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    expect(result.current.tiers).toEqual([]);
  });

  it("초기 allocations는 빈 배열이다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    expect(result.current.allocations).toEqual([]);
  });

  it("초기 salesGoal은 null이다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    expect(result.current.salesGoal).toBeNull();
  });

  it("loading은 항상 false이다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    expect(result.current.loading).toBe(false);
  });

  it("필요한 CRUD 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    expect(typeof result.current.addTier).toBe("function");
    expect(typeof result.current.updateTier).toBe("function");
    expect(typeof result.current.deleteTier).toBe("function");
    expect(typeof result.current.addAllocation).toBe("function");
    expect(typeof result.current.updateAllocation).toBe("function");
    expect(typeof result.current.cancelAllocation).toBe("function");
    expect(typeof result.current.deleteAllocation).toBe("function");
    expect(typeof result.current.updateSalesGoal).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("초기 stats.totalTickets는 0이다 (tiers 없음)", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    expect(result.current.stats.totalTickets).toBe(0);
  });
});

// ============================================================
// usePerformanceTicket - addTier
// ============================================================

describe("usePerformanceTicket - addTier 등급 추가", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("addTier 호출 후 tiers 배열에 새 등급이 추가된다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    act(() => {
      result.current.addTier(makeTier());
    });
    expect(result.current.tiers).toHaveLength(1);
  });

  it("addTier가 반환하는 객체에 id가 있다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let newTier: PerfTicketTier | undefined;
    act(() => {
      newTier = result.current.addTier(makeTier());
    });
    expect(newTier?.id).toBeTruthy();
  });

  it("addTier로 여러 등급을 추가할 수 있다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    act(() => {
      result.current.addTier(makeTier({ name: "VIP" }));
    });
    act(() => {
      result.current.addTier(makeTier({ name: "일반" }));
    });
    expect(result.current.tiers).toHaveLength(2);
  });

  it("추가된 등급은 localStorage에 저장된다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    act(() => {
      result.current.addTier(makeTier());
    });
    expect(memStore["performance-ticket-project-1"]).toBeDefined();
  });
});

// ============================================================
// usePerformanceTicket - updateTier
// ============================================================

describe("usePerformanceTicket - updateTier 등급 수정", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("존재하는 tierId로 updateTier 호출 시 true를 반환한다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier());
      tierId = tier.id;
    });
    let success = false;
    act(() => {
      success = result.current.updateTier(tierId, { price: 80000 });
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 tierId로 updateTier 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let success = true;
    act(() => {
      success = result.current.updateTier("nonexistent", { price: 80000 });
    });
    expect(success).toBe(false);
  });

  it("updateTier 후 가격이 변경된다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier({ price: 50000 }));
      tierId = tier.id;
    });
    act(() => {
      result.current.updateTier(tierId, { price: 80000 });
    });
    const updated = result.current.tiers?.find((t) => t.id === tierId);
    expect(updated?.price).toBe(80000);
  });
});

// ============================================================
// usePerformanceTicket - deleteTier
// ============================================================

describe("usePerformanceTicket - deleteTier 등급 삭제", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("존재하는 tierId로 deleteTier 호출 시 true를 반환한다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier());
      tierId = tier.id;
    });
    let success = false;
    act(() => {
      success = result.current.deleteTier(tierId);
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 tierId로 deleteTier 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let success = true;
    act(() => {
      success = result.current.deleteTier("nonexistent");
    });
    expect(success).toBe(false);
  });

  it("deleteTier 후 tiers 배열에서 제거된다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier());
      tierId = tier.id;
    });
    act(() => {
      result.current.deleteTier(tierId);
    });
    expect(result.current.tiers?.find((t) => t.id === tierId)).toBeUndefined();
  });

  it("deleteTier 시 해당 등급의 배분도 함께 삭제된다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier());
      tierId = tier.id;
    });
    act(() => {
      result.current.addAllocation(makeAllocation(tierId));
    });
    expect(result.current.allocations).toHaveLength(1);
    act(() => {
      result.current.deleteTier(tierId);
    });
    expect(result.current.allocations).toHaveLength(0);
  });
});

// ============================================================
// usePerformanceTicket - addAllocation
// ============================================================

describe("usePerformanceTicket - addAllocation 배분 추가", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("addAllocation 호출 후 allocations 배열에 추가된다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier());
      tierId = tier.id;
    });
    act(() => {
      result.current.addAllocation(makeAllocation(tierId));
    });
    expect(result.current.allocations).toHaveLength(1);
  });

  it("addAllocation 반환 객체에 id와 createdAt이 있다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier());
      tierId = tier.id;
    });
    let newAlloc: PerfTicketAllocation | undefined;
    act(() => {
      newAlloc = result.current.addAllocation(makeAllocation(tierId));
    });
    expect(newAlloc?.id).toBeTruthy();
    expect(newAlloc?.createdAt).toBeTruthy();
  });
});

// ============================================================
// usePerformanceTicket - cancelAllocation
// ============================================================

describe("usePerformanceTicket - cancelAllocation 배분 취소", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("cancelAllocation 호출 후 status가 cancelled가 된다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    let allocId = "";
    act(() => {
      const tier = result.current.addTier(makeTier());
      tierId = tier.id;
    });
    act(() => {
      const alloc = result.current.addAllocation(makeAllocation(tierId));
      allocId = alloc.id;
    });
    act(() => {
      result.current.cancelAllocation(allocId);
    });
    const cancelled = result.current.allocations.find((a) => a.id === allocId);
    expect(cancelled?.status).toBe("cancelled");
  });

  it("존재하지 않는 allocationId로 cancelAllocation 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let success = true;
    act(() => {
      success = result.current.cancelAllocation("nonexistent");
    });
    expect(success).toBe(false);
  });
});

// ============================================================
// usePerformanceTicket - stats 통계
// ============================================================

describe("usePerformanceTicket - stats 통계 계산", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("tiers가 없으면 totalTickets는 0이다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    // tiers undefined이면 reduce가 0부터 시작
    expect(result.current.stats.totalTickets).toBeGreaterThanOrEqual(0);
  });

  it("등급 추가 후 totalTickets는 totalQuantity 합산이다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    act(() => {
      result.current.addTier(makeTier({ totalQuantity: 100 }));
    });
    act(() => {
      result.current.addTier(makeTier({ name: "일반", totalQuantity: 200 }));
    });
    expect(result.current.stats.totalTickets).toBe(300);
  });

  it("confirmed 배분의 revenue는 quantity * price이다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier({ price: 50000, totalQuantity: 100 }));
      tierId = tier.id;
    });
    act(() => {
      result.current.addAllocation(makeAllocation(tierId, { quantity: 3, status: "confirmed" }));
    });
    const summary = result.current.stats.tierSummary[0];
    expect(summary.revenue).toBe(150000); // 3 * 50000
  });

  it("salesGoal이 없으면 salesProgress는 totalTickets 기준이다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier({ totalQuantity: 10 }));
      tierId = tier.id;
    });
    act(() => {
      result.current.addAllocation(makeAllocation(tierId, { quantity: 5, status: "confirmed" }));
    });
    // soldTickets=5, totalTickets=10 → 50%
    expect(result.current.stats.salesProgress).toBe(50);
  });

  it("salesGoal이 설정되면 salesProgress는 salesGoal 기준이다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier({ totalQuantity: 100 }));
      tierId = tier.id;
    });
    act(() => {
      result.current.addAllocation(makeAllocation(tierId, { quantity: 20, status: "confirmed" }));
    });
    act(() => {
      result.current.updateSalesGoal(50);
    });
    // soldTickets=20, salesGoal=50 → 40%
    expect(result.current.stats.salesProgress).toBe(40);
  });

  it("remainingQty는 totalQuantity - confirmed - reserved이다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier({ totalQuantity: 100 }));
      tierId = tier.id;
    });
    act(() => {
      result.current.addAllocation(makeAllocation(tierId, { quantity: 30, status: "confirmed" }));
    });
    act(() => {
      result.current.addAllocation(makeAllocation(tierId, { quantity: 20, status: "reserved" }));
    });
    const summary = result.current.stats.tierSummary[0];
    expect(summary.remainingQty).toBe(50); // 100 - 30 - 20
  });

  it("remainingQty는 0 미만이 되지 않는다 (Math.max(0, ...))", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier({ totalQuantity: 5 }));
      tierId = tier.id;
    });
    act(() => {
      result.current.addAllocation(makeAllocation(tierId, { quantity: 10, status: "confirmed" }));
    });
    const summary = result.current.stats.tierSummary[0];
    expect(summary.remainingQty).toBeGreaterThanOrEqual(0);
  });

  it("salesProgress는 100을 초과하지 않는다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    let tierId = "";
    act(() => {
      const tier = result.current.addTier(makeTier({ totalQuantity: 5 }));
      tierId = tier.id;
    });
    act(() => {
      result.current.updateSalesGoal(1);
    });
    act(() => {
      result.current.addAllocation(makeAllocation(tierId, { quantity: 5, status: "confirmed" }));
    });
    expect(result.current.stats.salesProgress).toBeLessThanOrEqual(100);
  });
});

// ============================================================
// usePerformanceTicket - updateSalesGoal
// ============================================================

describe("usePerformanceTicket - updateSalesGoal 판매 목표 설정", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("updateSalesGoal 호출 후 salesGoal이 변경된다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    act(() => {
      result.current.updateSalesGoal(200);
    });
    expect(result.current.salesGoal).toBe(200);
  });

  it("updateSalesGoal(null) 호출 후 salesGoal이 null이 된다", () => {
    const { result } = renderHook(() => usePerformanceTicket("project-1"));
    act(() => {
      result.current.updateSalesGoal(200);
    });
    act(() => {
      result.current.updateSalesGoal(null);
    });
    expect(result.current.salesGoal).toBeNull();
  });
});

// ============================================================
// usePerformanceTicket - 그룹별 격리
// ============================================================

describe("usePerformanceTicket - 프로젝트별 격리", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("다른 projectId를 사용하는 훅은 독립적이다", () => {
    const { result: r1 } = renderHook(() => usePerformanceTicket("project-A"));
    const { result: r2 } = renderHook(() => usePerformanceTicket("project-B"));
    act(() => {
      r1.current.addTier(makeTier({ name: "VIP A" }));
    });
    expect(r2.current.tiers).toHaveLength(0);
  });
});
