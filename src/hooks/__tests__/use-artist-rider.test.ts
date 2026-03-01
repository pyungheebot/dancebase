import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── localStorage mock ────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    const stored = memStore[key];
    // stored가 없거나 빈 객체이면 defaultValue 반환
    if (stored === undefined || stored === null) return defaultValue;
    return stored as T;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const { useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }
      let initialData: unknown = undefined;
      const fetchResult = fetcher();
      if (fetchResult instanceof Promise) {
        fetchResult.then((v) => { initialData = v; });
      } else {
        // 빈 객체(스토리지 미존재)는 undefined로 처리 → 훅 내부의 ?? 기본값 동작
        const isEmptyObj =
          typeof fetchResult === "object" &&
          fetchResult !== null &&
          !Array.isArray(fetchResult) &&
          Object.keys(fetchResult as object).length === 0;
        initialData = isEmptyObj ? undefined : fetchResult;
      }
      const [data, setData] = reactUseState<unknown>(() => initialData);
      const setDataRef = useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          const r = fetcher!();
          if (r instanceof Promise) {
            r.then((v) => setDataRef.current(v));
          } else {
            setDataRef.current(r as unknown);
          }
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    artistRider: (projectId: string) => `artist-rider-${projectId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import {
  useArtistRider,
  calcRiderStats,
} from "@/hooks/use-artist-rider";
import type {
  ShowRiderItem,
  ShowRiderCategory,
  ShowRiderStatus,
} from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(projectId = "project-1") {
  return renderHook(() => useArtistRider(projectId));
}

function makeItem(overrides: Partial<Omit<ShowRiderItem, "id">> = {}): Omit<ShowRiderItem, "id"> {
  return {
    name: "마이크",
    category: "technical" as ShowRiderCategory,
    priority: "required",
    status: "pending" as ShowRiderStatus,
    note: null,
    ...overrides,
  };
}

// ============================================================
// calcRiderStats - 순수 함수 테스트
// ============================================================

describe("calcRiderStats - 빈 배열", () => {
  it("빈 배열이면 total=0, secured=0, securedRate=0이다", () => {
    const stats = calcRiderStats([]);
    expect(stats.total).toBe(0);
    expect(stats.secured).toBe(0);
    expect(stats.securedRate).toBe(0);
  });

  it("빈 배열이면 requiredUnresolved=0이다", () => {
    const stats = calcRiderStats([]);
    expect(stats.requiredUnresolved).toBe(0);
  });

  it("빈 배열이면 byCategory의 모든 값이 0이다", () => {
    const stats = calcRiderStats([]);
    expect(stats.byCategory.technical).toBe(0);
    expect(stats.byCategory.backstage).toBe(0);
    expect(stats.byCategory.catering).toBe(0);
    expect(stats.byCategory.accommodation).toBe(0);
    expect(stats.byCategory.transport).toBe(0);
    expect(stats.byCategory.etc).toBe(0);
  });
});

describe("calcRiderStats - securedRate 계산", () => {
  it("전체가 secured이면 securedRate=100이다", () => {
    const items: ShowRiderItem[] = [
      { id: "1", name: "마이크", category: "technical", priority: "required", status: "secured", note: null },
      { id: "2", name: "의상", category: "backstage", priority: "optional", status: "secured", note: null },
    ];
    const stats = calcRiderStats(items);
    expect(stats.securedRate).toBe(100);
  });

  it("절반이 secured이면 securedRate=50이다", () => {
    const items: ShowRiderItem[] = [
      { id: "1", name: "마이크", category: "technical", priority: "required", status: "secured", note: null },
      { id: "2", name: "의상", category: "backstage", priority: "optional", status: "pending", note: null },
    ];
    const stats = calcRiderStats(items);
    expect(stats.securedRate).toBe(50);
  });

  it("securedRate는 0~100 정수이다 (Math.round 적용)", () => {
    const items: ShowRiderItem[] = [
      { id: "1", name: "A", category: "technical", priority: "required", status: "secured", note: null },
      { id: "2", name: "B", category: "technical", priority: "required", status: "pending", note: null },
      { id: "3", name: "C", category: "technical", priority: "required", status: "pending", note: null },
    ];
    const stats = calcRiderStats(items);
    expect(stats.securedRate).toBe(33); // round(1/3 * 100)
  });

  it("아무것도 secured가 아니면 securedRate=0이다", () => {
    const items: ShowRiderItem[] = [
      { id: "1", name: "A", category: "technical", priority: "required", status: "pending", note: null },
    ];
    const stats = calcRiderStats(items);
    expect(stats.securedRate).toBe(0);
  });
});

describe("calcRiderStats - requiredUnresolved 계산", () => {
  it("필수 항목 중 secured가 아닌 것을 카운트한다", () => {
    const items: ShowRiderItem[] = [
      { id: "1", name: "A", category: "technical", priority: "required", status: "pending", note: null },
      { id: "2", name: "B", category: "technical", priority: "required", status: "secured", note: null },
      { id: "3", name: "C", category: "technical", priority: "optional", status: "pending", note: null },
    ];
    const stats = calcRiderStats(items);
    expect(stats.requiredUnresolved).toBe(1);
  });

  it("모든 필수 항목이 secured이면 requiredUnresolved=0이다", () => {
    const items: ShowRiderItem[] = [
      { id: "1", name: "A", category: "technical", priority: "required", status: "secured", note: null },
    ];
    const stats = calcRiderStats(items);
    expect(stats.requiredUnresolved).toBe(0);
  });

  it("optional 항목은 requiredUnresolved에 포함되지 않는다", () => {
    const items: ShowRiderItem[] = [
      { id: "1", name: "A", category: "technical", priority: "optional", status: "pending", note: null },
      { id: "2", name: "B", category: "technical", priority: "optional", status: "unavailable", note: null },
    ];
    const stats = calcRiderStats(items);
    expect(stats.requiredUnresolved).toBe(0);
  });
});

describe("calcRiderStats - byCategory 집계", () => {
  it("카테고리별 항목 수를 올바르게 집계한다", () => {
    const items: ShowRiderItem[] = [
      { id: "1", name: "A", category: "technical", priority: "required", status: "pending", note: null },
      { id: "2", name: "B", category: "technical", priority: "required", status: "pending", note: null },
      { id: "3", name: "C", category: "catering", priority: "optional", status: "pending", note: null },
      { id: "4", name: "D", category: "transport", priority: "optional", status: "pending", note: null },
    ];
    const stats = calcRiderStats(items);
    expect(stats.byCategory.technical).toBe(2);
    expect(stats.byCategory.catering).toBe(1);
    expect(stats.byCategory.transport).toBe(1);
    expect(stats.byCategory.backstage).toBe(0);
  });

  it("byCategory의 합산이 total과 일치한다", () => {
    const items: ShowRiderItem[] = [
      { id: "1", name: "A", category: "technical", priority: "required", status: "pending", note: null },
      { id: "2", name: "B", category: "backstage", priority: "required", status: "secured", note: null },
      { id: "3", name: "C", category: "catering", priority: "optional", status: "pending", note: null },
    ];
    const stats = calcRiderStats(items);
    const catTotal = Object.values(stats.byCategory).reduce((a, b) => a + b, 0);
    expect(catTotal).toBe(stats.total);
  });
});

// ============================================================
// useArtistRider - 초기 상태
// ============================================================

describe("useArtistRider - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 items는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.data.items).toEqual([]);
  });

  it("초기 stats.total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });

  it("초기 stats.secured는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.secured).toBe(0);
  });

  it("초기 stats.securedRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.securedRate).toBe(0);
  });

  it("필요한 함수가 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addItem).toBe("function");
    expect(typeof result.current.updateItem).toBe("function");
    expect(typeof result.current.removeItem).toBe("function");
    expect(typeof result.current.setStatus).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useArtistRider - addItem
// ============================================================

describe("useArtistRider - addItem", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("항목 추가 후 items 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem()); });
    expect(result.current.data.items).toHaveLength(1);
  });

  it("추가된 항목에 id가 부여된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem()); });
    expect(result.current.data.items[0].id).toBeDefined();
  });

  it("추가된 항목의 name이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem({ name: "조명 장비" })); });
    expect(result.current.data.items[0].name).toBe("조명 장비");
  });

  it("추가된 항목의 category가 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem({ category: "backstage" })); });
    expect(result.current.data.items[0].category).toBe("backstage");
  });

  it("추가된 항목의 status가 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem({ status: "secured" })); });
    expect(result.current.data.items[0].status).toBe("secured");
  });

  it("stats.total이 items 수와 일치한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem()); });
    act(() => { result.current.addItem(makeItem()); });
    expect(result.current.stats.total).toBe(2);
  });
});

// ============================================================
// useArtistRider - updateItem
// ============================================================

describe("useArtistRider - updateItem", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("항목의 name을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem({ name: "기존 이름" })); });
    const id = result.current.data.items[0].id;
    act(() => { result.current.updateItem(id, { name: "새 이름" }); });
    expect(result.current.data.items[0].name).toBe("새 이름");
  });

  it("항목의 status를 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem({ status: "pending" })); });
    const id = result.current.data.items[0].id;
    act(() => { result.current.updateItem(id, { status: "secured" }); });
    expect(result.current.data.items[0].status).toBe("secured");
  });

  it("수정은 해당 항목만 변경된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem({ name: "항목A" })); });
    act(() => { result.current.addItem(makeItem({ name: "항목B" })); });
    const idA = result.current.data.items.find((i: ShowRiderItem) => i.name === "항목A")!.id;
    act(() => { result.current.updateItem(idA, { name: "항목A 수정" }); });
    const itemB = result.current.data.items.find((i: ShowRiderItem) => i.name === "항목B");
    expect(itemB).toBeDefined();
    expect(result.current.data.items.find((i: ShowRiderItem) => i.name === "항목A 수정")).toBeDefined();
  });
});

// ============================================================
// useArtistRider - removeItem
// ============================================================

describe("useArtistRider - removeItem", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("항목 삭제 후 items 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem()); });
    const id = result.current.data.items[0].id;
    act(() => { result.current.removeItem(id); });
    expect(result.current.data.items).toHaveLength(0);
  });

  it("특정 항목만 삭제된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem({ name: "항목1" })); });
    act(() => { result.current.addItem(makeItem({ name: "항목2" })); });
    const id1 = result.current.data.items.find((i: ShowRiderItem) => i.name === "항목1")!.id;
    act(() => { result.current.removeItem(id1); });
    expect(result.current.data.items).toHaveLength(1);
    expect(result.current.data.items[0].name).toBe("항목2");
  });

  it("존재하지 않는 id를 삭제해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => { result.current.removeItem("non-existent"); });
    }).not.toThrow();
  });
});

// ============================================================
// useArtistRider - setStatus
// ============================================================

describe("useArtistRider - setStatus", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("setStatus로 항목 상태를 secured로 변경한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem({ status: "pending" })); });
    const id = result.current.data.items[0].id;
    act(() => { result.current.setStatus(id, "secured"); });
    expect(result.current.data.items[0].status).toBe("secured");
  });

  it("setStatus로 항목 상태를 unavailable로 변경한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem({ status: "pending" })); });
    const id = result.current.data.items[0].id;
    act(() => { result.current.setStatus(id, "unavailable"); });
    expect(result.current.data.items[0].status).toBe("unavailable");
  });

  it("setStatus 후 stats.secured가 갱신된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addItem(makeItem({ status: "pending" })); });
    const id = result.current.data.items[0].id;
    act(() => { result.current.setStatus(id, "secured"); });
    expect(result.current.stats.secured).toBe(1);
  });
});

// ============================================================
// useArtistRider - 프로젝트 격리
// ============================================================

describe("useArtistRider - 프로젝트별 데이터 격리", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("다른 projectId의 데이터는 공유되지 않는다", () => {
    const { result: r1 } = makeHook("proj-A");
    const { result: r2 } = makeHook("proj-B");
    act(() => { r1.current.addItem(makeItem({ name: "A의 항목" })); });
    expect(r2.current.data.items).toHaveLength(0);
  });
});
