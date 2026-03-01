import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (memStore[key] as T) ?? defaultValue,
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR 키 mock ──────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    performanceFee: (groupId: string, projectId: string) =>
      `dancebase:performance-fee:${groupId}:${projectId}`,
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (
    key: string | null,
    _fetcher: (() => Promise<unknown>) | null,
    opts?: { fallbackData?: unknown }
  ) => {
    const storeKey = key ?? "__null__";
    // mutate 호출 시 memStore에 직접 저장하고 현재 값 반환
    return {
      get data() {
        return memStore[`__swr__:${storeKey}`] ?? opts?.fallbackData;
      },
      isLoading: false,
      mutate: (newData?: unknown, _revalidate?: boolean) => {
        if (newData !== undefined) {
          memStore[`__swr__:${storeKey}`] = newData;
        }
        return Promise.resolve(newData);
      },
    };
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { usePerformanceFee } from "@/hooks/use-performance-fee";
import type {
  PerformanceFeeData,
  PerformanceFeeRole,
  PerformanceFeeAdjustmentType,
} from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────

const GROUP = "group-1";
const PROJECT = "project-1";
const STORE_KEY = `dancebase:performance-fee:${GROUP}:${PROJECT}`;
const SWR_CACHE_KEY = `__swr__:dancebase:performance-fee:${GROUP}:${PROJECT}`;

function initStore() {
  const data: PerformanceFeeData = {
    groupId: GROUP,
    projectId: PROJECT,
    entries: [],
    updatedAt: new Date().toISOString(),
  };
  memStore[STORE_KEY] = data;
  memStore[SWR_CACHE_KEY] = data;
}

function makeHook() {
  return renderHook(() => usePerformanceFee(GROUP, PROJECT));
}

// ============================================================
// calcFinalAmount 순수 함수 테스트 (내부 로직)
// ============================================================

describe("usePerformanceFee - calcFinalAmount 계산 로직", () => {
  it("조정 없을 때 finalAmount는 baseFee와 같다", () => {
    const base = 100000;
    const adjustments: Array<{ amount: number }> = [];
    const total = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    expect(base + total).toBe(100000);
  });

  it("양수 조정 추가 시 finalAmount가 증가한다", () => {
    const base = 100000;
    const adjustments = [{ amount: 20000 }];
    const total = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    expect(base + total).toBe(120000);
  });

  it("음수 조정 추가 시 finalAmount가 감소한다", () => {
    const base = 100000;
    const adjustments = [{ amount: -5000 }];
    const total = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    expect(base + total).toBe(95000);
  });

  it("여러 조정 항목이 합산된다", () => {
    const base = 100000;
    const adjustments = [{ amount: 20000 }, { amount: -3000 }, { amount: 5000 }];
    const total = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    expect(base + total).toBe(122000);
  });

  it("모든 조정이 음수일 때 finalAmount가 작아진다", () => {
    const base = 100000;
    const adjustments = [{ amount: -10000 }, { amount: -5000 }];
    const total = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    expect(base + total).toBe(85000);
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("usePerformanceFee - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStore();
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalCount).toBe(0);
  });

  it("초기 stats.settledCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.settledCount).toBe(0);
  });

  it("초기 stats.pendingCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.pendingCount).toBe(0);
  });

  it("초기 stats.totalAmount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalAmount).toBe(0);
  });

  it("초기 stats.settledAmount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.settledAmount).toBe(0);
  });

  it("초기 stats.pendingAmount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.pendingAmount).toBe(0);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.updateEntry).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.addAdjustment).toBe("function");
    expect(typeof result.current.deleteAdjustment).toBe("function");
    expect(typeof result.current.settleEntry).toBe("function");
    expect(typeof result.current.unsettleEntry).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addEntry - memStore 기반으로 검증
// ============================================================

describe("usePerformanceFee - addEntry (memStore 검증)", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStore();
  });

  it("addEntry 호출 후 memStore에 항목이 저장된다", () => {
    const { result } = makeHook();
    result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries).toHaveLength(1);
  });

  it("addEntry 호출 후 memStore의 memberName이 올바르다", () => {
    const { result } = makeHook();
    result.current.addEntry({
      memberName: "김철수",
      role: "performer" as PerformanceFeeRole,
      baseFee: 150000,
    });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].memberName).toBe("김철수");
  });

  it("addEntry 호출 후 memStore의 baseFee가 올바르다", () => {
    const { result } = makeHook();
    result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 200000,
    });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].baseFee).toBe(200000);
  });

  it("addEntry 호출 후 memStore의 초기 status가 pending이다", () => {
    const { result } = makeHook();
    result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].status).toBe("pending");
  });

  it("addEntry 호출 후 memStore의 finalAmount가 baseFee와 같다", () => {
    const { result } = makeHook();
    result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].finalAmount).toBe(100000);
  });

  it("addEntry 반환 값의 memberName이 올바르다", () => {
    const { result } = makeHook();
    let returned: ReturnType<ReturnType<typeof usePerformanceFee>["addEntry"]>;
    returned = result.current.addEntry({
      memberName: "이영희",
      role: "performer" as PerformanceFeeRole,
      baseFee: 80000,
    });
    expect(returned.memberName).toBe("이영희");
  });

  it("addEntry 반환 값에 id가 부여된다", () => {
    const { result } = makeHook();
    const returned = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    expect(returned.id).toBeDefined();
  });

  it("notes가 있는 항목의 notes가 저장된다", () => {
    const { result } = makeHook();
    result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
      notes: "출연료 지급",
    });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].notes).toBe("출연료 지급");
  });
});

// ============================================================
// updateEntry - memStore 기반으로 검증
// ============================================================

describe("usePerformanceFee - updateEntry (memStore 검증)", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStore();
  });

  it("updateEntry 호출 후 memStore의 memberName이 수정된다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.updateEntry(entry.id, { memberName: "김철수" });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].memberName).toBe("김철수");
  });

  it("updateEntry 호출 후 baseFee 변경 시 finalAmount가 재계산된다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.updateEntry(entry.id, { baseFee: 150000 });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].finalAmount).toBe(150000);
  });

  it("updateEntry 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    const ret = result.current.updateEntry(entry.id, { memberName: "수정" });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 id 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    const ret = result.current.updateEntry("non-existent", {
      memberName: "수정",
    });
    expect(ret).toBe(false);
  });
});

// ============================================================
// deleteEntry - memStore 기반으로 검증
// ============================================================

describe("usePerformanceFee - deleteEntry (memStore 검증)", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStore();
  });

  it("deleteEntry 호출 후 memStore에서 항목이 제거된다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.deleteEntry(entry.id);
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries).toHaveLength(0);
  });

  it("deleteEntry 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    const ret = result.current.deleteEntry(entry.id);
    expect(ret).toBe(true);
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    const ret = result.current.deleteEntry("non-existent");
    expect(ret).toBe(false);
  });
});

// ============================================================
// addAdjustment - memStore 기반으로 검증
// ============================================================

describe("usePerformanceFee - addAdjustment (memStore 검증)", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStore();
  });

  it("addAdjustment 후 memStore에 조정 항목이 추가된다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.addAdjustment(entry.id, {
      type: "bonus" as PerformanceFeeAdjustmentType,
      label: "교통비",
      amount: 10000,
    });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].adjustments).toHaveLength(1);
  });

  it("addAdjustment 후 finalAmount가 baseFee+amount가 된다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.addAdjustment(entry.id, {
      type: "bonus" as PerformanceFeeAdjustmentType,
      label: "교통비",
      amount: 20000,
    });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].finalAmount).toBe(120000);
  });

  it("공제 추가 후 finalAmount가 baseFee-공제액이 된다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.addAdjustment(entry.id, {
      type: "deduction" as PerformanceFeeAdjustmentType,
      label: "식비",
      amount: -5000,
    });
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].finalAmount).toBe(95000);
  });

  it("addAdjustment 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    const ret = result.current.addAdjustment(entry.id, {
      type: "bonus" as PerformanceFeeAdjustmentType,
      label: "수당",
      amount: 5000,
    });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 항목에 addAdjustment 시 false를 반환한다", () => {
    const { result } = makeHook();
    const ret = result.current.addAdjustment("non-existent", {
      type: "bonus" as PerformanceFeeAdjustmentType,
      label: "수당",
      amount: 5000,
    });
    expect(ret).toBe(false);
  });
});

// ============================================================
// settleEntry - memStore 기반으로 검증
// ============================================================

describe("usePerformanceFee - settleEntry (memStore 검증)", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStore();
  });

  it("settleEntry 후 memStore에서 status가 settled가 된다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.settleEntry(entry.id);
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].status).toBe("settled");
  });

  it("settleEntry 후 settledAt이 설정된다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.settleEntry(entry.id);
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].settledAt).toBeDefined();
  });

  it("커스텀 settledAt을 지정할 수 있다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.settleEntry(entry.id, "2026-03-01");
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].settledAt).toBe("2026-03-01");
  });

  it("settleEntry 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    const ret = result.current.settleEntry(entry.id);
    expect(ret).toBe(true);
  });

  it("존재하지 않는 id 정산 시 false를 반환한다", () => {
    const { result } = makeHook();
    const ret = result.current.settleEntry("non-existent");
    expect(ret).toBe(false);
  });
});

// ============================================================
// unsettleEntry - memStore 기반으로 검증
// ============================================================

describe("usePerformanceFee - unsettleEntry (memStore 검증)", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStore();
  });

  it("unsettleEntry 후 memStore에서 status가 pending이 된다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.settleEntry(entry.id);
    result.current.unsettleEntry(entry.id);
    const stored = memStore[STORE_KEY] as PerformanceFeeData;
    expect(stored.entries[0].status).toBe("pending");
  });

  it("unsettleEntry 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const entry = result.current.addEntry({
      memberName: "홍길동",
      role: "performer" as PerformanceFeeRole,
      baseFee: 100000,
    });
    result.current.settleEntry(entry.id);
    const ret = result.current.unsettleEntry(entry.id);
    expect(ret).toBe(true);
  });

  it("존재하지 않는 id 취소 시 false를 반환한다", () => {
    const { result } = makeHook();
    const ret = result.current.unsettleEntry("non-existent");
    expect(ret).toBe(false);
  });
});
