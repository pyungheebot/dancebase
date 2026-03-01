import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStageSafety } from "@/hooks/use-stage-safety";
import type { SafetyCheckItem, StageSafetyData } from "@/types";

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

// ─── SWR mock: useState 기반 (격리된 인스턴스) ───────────────
vi.mock("swr", async () => {
  const { useState } = await import("react");

  return {
    default: (key: string | null, fetcher: (() => unknown) | null, _opts?: unknown) => {
      if (!key || !fetcher) return { data: undefined, isLoading: false, mutate: vi.fn() };

      const initialValue = fetcher();
      const [data, setData] = useState<unknown>(initialValue);

      const mutate = (newData?: unknown, _revalidate?: boolean) => {
        if (newData !== undefined) setData(newData);
        else setData(fetcher!());
      };

      return { data, isLoading: false, mutate };
    },
    __reset: () => {},
  };
});

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    stageSafetyCheck: (projectId: string) => `stage-safety-check-${projectId}`,
  },
}));

// ─── local-storage mock ──────────────────────────────────────
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

// ─── 초기 데이터 헬퍼 ─────────────────────────────────────────
function initStorage(projectId: string, data?: Partial<StageSafetyData>) {
  const key = `stage-safety-check-${projectId}`;
  const init: StageSafetyData = {
    projectId,
    inspections: [],
    updatedAt: new Date().toISOString(),
    ...data,
  };
  localStorageMock.setItem(key, JSON.stringify(init));
}

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeCheckItem(
  overrides: Partial<Omit<SafetyCheckItem, "id">> = {}
): Omit<SafetyCheckItem, "id"> {
  return {
    category: "electrical",
    description: "전기 점검",
    status: "pass",
    notes: null,
    inspectorName: null,
    ...overrides,
  };
}

// ============================================================
// 테스트
// ============================================================

describe("useStageSafety - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-1");
  });

  it("초기 inspections가 빈 배열이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-1"));
    expect(result.current.safetyData.inspections).toEqual([]);
  });

  it("loading이 false이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-1"));
    expect(result.current.loading).toBe(false);
  });

  it("totalInspections가 0이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-1"));
    expect(result.current.totalInspections).toBe(0);
  });

  it("passRate가 0이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-1"));
    expect(result.current.passRate).toBe(0);
  });

  it("pendingItems가 0이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-1"));
    expect(result.current.pendingItems).toBe(0);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = renderHook(() => useStageSafety("proj-1"));
    expect(typeof result.current.createInspection).toBe("function");
    expect(typeof result.current.deleteInspection).toBe("function");
    expect(typeof result.current.addCheckItem).toBe("function");
    expect(typeof result.current.updateCheckItem).toBe("function");
    expect(typeof result.current.removeCheckItem).toBe("function");
    expect(typeof result.current.setOverallStatus).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("categoryBreakdown의 모든 카테고리 값이 0이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-1"));
    const cats = ["electrical", "structural", "fire", "emergency", "equipment", "other"] as const;
    for (const cat of cats) {
      expect(result.current.categoryBreakdown[cat].pass).toBe(0);
      expect(result.current.categoryBreakdown[cat].fail).toBe(0);
      expect(result.current.categoryBreakdown[cat].pending).toBe(0);
      expect(result.current.categoryBreakdown[cat].na).toBe(0);
    }
  });
});

describe("useStageSafety - createInspection", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-create");
  });

  it("점검을 생성하면 totalInspections가 1이 된다", () => {
    const { result } = renderHook(() => useStageSafety("proj-create"));
    act(() => {
      result.current.createInspection({
        title: "1차 안전점검",
        date: "2026-03-01",
        venue: "서울문화회관",
      });
    });
    expect(result.current.totalInspections).toBe(1);
  });

  it("초기 overallStatus가 approved이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-create"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    expect(result.current.safetyData.inspections[0].overallStatus).toBe("approved");
  });

  it("초기 signedBy가 null이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-create"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    expect(result.current.safetyData.inspections[0].signedBy).toBeNull();
  });

  it("items와 함께 생성할 수 있다", () => {
    const { result } = renderHook(() => useStageSafety("proj-create"));
    act(() => {
      result.current.createInspection({
        title: "점검",
        date: "2026-03-01",
        venue: null,
        items: [makeCheckItem({ category: "fire", status: "pass" })],
      });
    });
    expect(result.current.safetyData.inspections[0].items).toHaveLength(1);
  });

  it("추가된 점검이 배열 맨 앞에 위치한다 (최신순)", () => {
    const { result } = renderHook(() => useStageSafety("proj-create"));
    act(() => {
      result.current.createInspection({ title: "첫 번째", date: "2026-01-01", venue: null });
    });
    act(() => {
      result.current.createInspection({ title: "두 번째", date: "2026-02-01", venue: null });
    });
    expect(result.current.safetyData.inspections[0].title).toBe("두 번째");
  });

  it("localStorage에 저장된다", () => {
    localStorageMock.setItem.mockClear();
    const { result } = renderHook(() => useStageSafety("proj-create"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("점검 ID가 자동 생성된다", () => {
    const { result } = renderHook(() => useStageSafety("proj-create"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    expect(result.current.safetyData.inspections[0].id).toBeDefined();
  });
});

describe("useStageSafety - deleteInspection", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-delete");
  });

  it("점검을 삭제하면 totalInspections가 0이 된다", () => {
    const { result } = renderHook(() => useStageSafety("proj-delete"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    const inspectionId = result.current.safetyData.inspections[0].id;
    act(() => {
      result.current.deleteInspection(inspectionId);
    });
    expect(result.current.totalInspections).toBe(0);
  });

  it("존재하지 않는 inspectionId 삭제 시 배열이 그대로 유지된다", () => {
    const { result } = renderHook(() => useStageSafety("proj-delete"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    act(() => {
      result.current.deleteInspection("non-existent");
    });
    expect(result.current.totalInspections).toBe(1);
  });
});

describe("useStageSafety - addCheckItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-check");
  });

  it("점검 항목을 추가하면 items 길이가 증가한다", () => {
    const { result } = renderHook(() => useStageSafety("proj-check"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    const inspectionId = result.current.safetyData.inspections[0].id;
    act(() => {
      result.current.addCheckItem(inspectionId, makeCheckItem());
    });
    expect(result.current.safetyData.inspections[0].items).toHaveLength(1);
  });

  it("추가된 항목의 id가 자동 생성된다", () => {
    const { result } = renderHook(() => useStageSafety("proj-check"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    const inspId = result.current.safetyData.inspections[0].id;
    act(() => {
      result.current.addCheckItem(inspId, makeCheckItem());
    });
    expect(result.current.safetyData.inspections[0].items[0].id).toBeDefined();
  });

  it("추가된 항목의 category가 올바르다", () => {
    const { result } = renderHook(() => useStageSafety("proj-check"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    const inspId = result.current.safetyData.inspections[0].id;
    act(() => {
      result.current.addCheckItem(inspId, makeCheckItem({ category: "fire" }));
    });
    expect(result.current.safetyData.inspections[0].items[0].category).toBe("fire");
  });
});

describe("useStageSafety - updateCheckItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-update");
  });

  it("항목 상태를 수정할 수 있다", () => {
    const { result } = renderHook(() => useStageSafety("proj-update"));
    act(() => {
      result.current.createInspection({
        title: "점검",
        date: "2026-03-01",
        venue: null,
        items: [makeCheckItem({ status: "pending" })],
      });
    });
    const inspId = result.current.safetyData.inspections[0].id;
    const itemId = result.current.safetyData.inspections[0].items[0].id;
    act(() => {
      result.current.updateCheckItem(inspId, itemId, { status: "pass" });
    });
    expect(result.current.safetyData.inspections[0].items[0].status).toBe("pass");
  });

  it("항목 description을 수정할 수 있다", () => {
    const { result } = renderHook(() => useStageSafety("proj-update"));
    act(() => {
      result.current.createInspection({
        title: "점검",
        date: "2026-03-01",
        venue: null,
        items: [makeCheckItem({ description: "원래 설명" })],
      });
    });
    const inspId = result.current.safetyData.inspections[0].id;
    const itemId = result.current.safetyData.inspections[0].items[0].id;
    act(() => {
      result.current.updateCheckItem(inspId, itemId, { description: "수정된 설명" });
    });
    expect(result.current.safetyData.inspections[0].items[0].description).toBe("수정된 설명");
  });
});

describe("useStageSafety - removeCheckItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-remove");
  });

  it("항목 제거 후 items 배열이 비어진다", () => {
    const { result } = renderHook(() => useStageSafety("proj-remove"));
    act(() => {
      result.current.createInspection({
        title: "점검",
        date: "2026-03-01",
        venue: null,
        items: [makeCheckItem()],
      });
    });
    const inspId = result.current.safetyData.inspections[0].id;
    const itemId = result.current.safetyData.inspections[0].items[0].id;
    act(() => {
      result.current.removeCheckItem(inspId, itemId);
    });
    expect(result.current.safetyData.inspections[0].items).toHaveLength(0);
  });
});

describe("useStageSafety - setOverallStatus", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-status");
  });

  it("overallStatus를 rejected로 변경할 수 있다", () => {
    const { result } = renderHook(() => useStageSafety("proj-status"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    const inspId = result.current.safetyData.inspections[0].id;
    act(() => {
      result.current.setOverallStatus(inspId, "rejected");
    });
    expect(result.current.safetyData.inspections[0].overallStatus).toBe("rejected");
  });

  it("overallStatus를 conditional로 변경할 수 있다", () => {
    const { result } = renderHook(() => useStageSafety("proj-status"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    const inspId = result.current.safetyData.inspections[0].id;
    act(() => {
      result.current.setOverallStatus(inspId, "conditional");
    });
    expect(result.current.safetyData.inspections[0].overallStatus).toBe("conditional");
  });

  it("signedBy를 설정할 수 있다", () => {
    const { result } = renderHook(() => useStageSafety("proj-status"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    const inspId = result.current.safetyData.inspections[0].id;
    act(() => {
      result.current.setOverallStatus(inspId, "conditional", "관리자명");
    });
    expect(result.current.safetyData.inspections[0].signedBy).toBe("관리자명");
  });
});

describe("useStageSafety - 통계 계산 (passRate, pendingItems)", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-stats");
  });

  it("pass=2, total=2이면 passRate가 100이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-stats"));
    act(() => {
      result.current.createInspection({
        title: "점검",
        date: "2026-03-01",
        venue: null,
        items: [makeCheckItem({ status: "pass" }), makeCheckItem({ status: "pass" })],
      });
    });
    expect(result.current.passRate).toBe(100);
  });

  it("pass=1, fail=1이면 passRate가 50이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-stats"));
    act(() => {
      result.current.createInspection({
        title: "점검",
        date: "2026-03-01",
        venue: null,
        items: [makeCheckItem({ status: "pass" }), makeCheckItem({ status: "fail" })],
      });
    });
    expect(result.current.passRate).toBe(50);
  });

  it("na 항목은 passRate 계산에서 제외된다", () => {
    const { result } = renderHook(() => useStageSafety("proj-stats"));
    act(() => {
      result.current.createInspection({
        title: "점검",
        date: "2026-03-01",
        venue: null,
        items: [makeCheckItem({ status: "pass" }), makeCheckItem({ status: "na" })],
      });
    });
    expect(result.current.passRate).toBe(100);
  });

  it("pending 항목이 pendingItems에 집계된다", () => {
    const { result } = renderHook(() => useStageSafety("proj-stats"));
    act(() => {
      result.current.createInspection({
        title: "점검",
        date: "2026-03-01",
        venue: null,
        items: [
          makeCheckItem({ status: "pending" }),
          makeCheckItem({ status: "pending" }),
          makeCheckItem({ status: "pass" }),
        ],
      });
    });
    expect(result.current.pendingItems).toBe(2);
  });

  it("categoryBreakdown이 카테고리별로 올바르게 집계된다", () => {
    const { result } = renderHook(() => useStageSafety("proj-stats"));
    act(() => {
      result.current.createInspection({
        title: "점검",
        date: "2026-03-01",
        venue: null,
        items: [
          makeCheckItem({ category: "fire", status: "pass" }),
          makeCheckItem({ category: "fire", status: "fail" }),
          makeCheckItem({ category: "electrical", status: "pass" }),
        ],
      });
    });
    expect(result.current.categoryBreakdown.fire.pass).toBe(1);
    expect(result.current.categoryBreakdown.fire.fail).toBe(1);
    expect(result.current.categoryBreakdown.electrical.pass).toBe(1);
  });

  it("항목이 없으면 passRate가 0이다", () => {
    const { result } = renderHook(() => useStageSafety("proj-stats"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    expect(result.current.passRate).toBe(0);
  });
});

describe("useStageSafety - localStorage 키 형식", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-xyz");
  });

  it("저장 키가 stage-safety-check-{projectId} 형식이다", () => {
    localStorageMock.setItem.mockClear();
    const { result } = renderHook(() => useStageSafety("proj-xyz"));
    act(() => {
      result.current.createInspection({ title: "점검", date: "2026-03-01", venue: null });
    });
    const calls = localStorageMock.setItem.mock.calls;
    expect(calls.some(([key]: [string]) => key === "stage-safety-check-proj-xyz")).toBe(true);
  });
});

describe("useStageSafety - 그룹별 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-iso-A");
    initStorage("proj-iso-B");
  });

  it("다른 projectId는 서로 다른 키에 저장된다", () => {
    localStorageMock.setItem.mockClear();
    const { result: r1 } = renderHook(() => useStageSafety("proj-iso-A"));
    const { result: r2 } = renderHook(() => useStageSafety("proj-iso-B"));
    act(() => {
      r1.current.createInspection({ title: "AAA 점검", date: "2026-03-01", venue: null });
    });
    act(() => {
      r2.current.createInspection({ title: "BBB 점검", date: "2026-03-01", venue: null });
    });
    const calls = localStorageMock.setItem.mock.calls;
    const keysUsed = calls.map(([key]: [string]) => key);
    expect(keysUsed).toContain("stage-safety-check-proj-iso-A");
    expect(keysUsed).toContain("stage-safety-check-proj-iso-B");
  });
});
