import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState, useCallback } from "react";

// ============================================================
// localStorage 직접 모킹 (use-sponsored-goods는 localStorage 직접 사용)
// ============================================================

const localStorageStore = vi.hoisted(() => {
  const store: Record<string, string> = {};
  return store;
});

// localStorage 전역 모킹
Object.defineProperty(global, "localStorage", {
  value: {
    getItem: (key: string) => localStorageStore[key] ?? null,
    setItem: (key: string, value: string) => {
      localStorageStore[key] = value;
    },
    removeItem: (key: string) => {
      delete localStorageStore[key];
    },
    clear: () => {
      Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]);
    },
  },
  writable: true,
  configurable: true,
});

// SWR 모킹: useState 기반, 초기값은 빈 배열 (localStorage는 초기에 비어 있음)
// mutate(data) 호출 시 즉시 state 업데이트
vi.mock("swr", () => ({
  default: vi.fn((key: string | null, _fetcher: unknown) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [data, setData] = useState<unknown>(key ? [] : undefined);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const mutate = useCallback((updatedData?: unknown, _revalidate?: boolean) => {
      if (updatedData !== undefined) {
        setData(updatedData);
      }
    }, []);

    if (!key) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }

    return { data, isLoading: false, mutate };
  }),
}));

vi.mock("@/lib/local-storage", () => ({}));

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    sponsoredGoods: (groupId: string, projectId: string) =>
      `sponsored-goods-${groupId}-${projectId}`,
  },
}));

import { useSponsoredGoods } from "@/hooks/use-sponsored-goods";

const GROUP_ID = "group-123";
const PROJECT_ID = "project-456";

beforeEach(() => {
  // localStorage 초기화
  Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]);
  vi.clearAllMocks();
});

// ============================================================
// 초기 상태
// ============================================================

describe("useSponsoredGoods - 초기 상태", () => {
  it("items 초기값은 빈 배열이다", () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));
    expect(result.current.items).toEqual([]);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));
    expect(typeof result.current.addItem).toBe("function");
    expect(typeof result.current.updateItem).toBe("function");
    expect(typeof result.current.deleteItem).toBe("function");
    expect(typeof result.current.updateStatus).toBe("function");
    expect(typeof result.current.distribute).toBe("function");
    expect(typeof result.current.getRemainingQuantity).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("stats 초기 totalItems는 0이다", () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));
    expect(result.current.stats.totalItems).toBe(0);
  });

  it("stats 초기 totalValue는 0이다", () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));
    expect(result.current.stats.totalValue).toBe(0);
  });

  it("stats 초기 receivedItems는 0이다", () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));
    expect(result.current.stats.receivedItems).toBe(0);
  });

  it("stats 초기 distributedItems는 0이다", () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));
    expect(result.current.stats.distributedItems).toBe(0);
  });

  it("loading 필드가 존재한다", () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));
    expect(typeof result.current.loading).toBe("boolean");
  });
});

// ============================================================
// addItem
// ============================================================

describe("useSponsoredGoods - addItem", () => {
  it("addItem 호출 시 items에 항목이 추가된다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({
        itemName: "티셔츠",
        sponsor: "ABC회사",
        quantity: 10,
        status: "pending",
        estimatedValue: 50000,
      });
    });

    expect(result.current.items).toHaveLength(1);
  });

  it("addItem으로 추가된 항목의 itemName이 올바르다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({
        itemName: "모자",
        sponsor: "XYZ회사",
        quantity: 5,
        status: "pending",
      });
    });

    expect(result.current.items[0].itemName).toBe("모자");
  });

  it("addItem으로 추가된 항목의 distributions는 빈 배열이다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({
        itemName: "가방",
        sponsor: "스폰서",
        quantity: 3,
        status: "pending",
      });
    });

    expect(result.current.items[0].distributions).toEqual([]);
  });

  it("addItem으로 추가된 항목의 id가 존재한다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({
        itemName: "노트",
        sponsor: "스폰서",
        quantity: 10,
        status: "pending",
      });
    });

    expect(result.current.items[0].id).toBeTruthy();
  });

  it("addItem으로 추가된 항목의 createdAt이 존재한다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({
        itemName: "펜",
        sponsor: "스폰서",
        quantity: 20,
        status: "received",
      });
    });

    expect(result.current.items[0].createdAt).toBeTruthy();
  });

  it("두 번 addItem 호출 시 items가 2개가 된다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "A", sponsor: "스폰서", quantity: 5, status: "pending" });
    });
    await act(async () => {
      await result.current.addItem({ itemName: "B", sponsor: "스폰서", quantity: 3, status: "pending" });
    });

    expect(result.current.items).toHaveLength(2);
  });
});

// ============================================================
// updateItem
// ============================================================

describe("useSponsoredGoods - updateItem", () => {
  it("updateItem으로 itemName을 수정할 수 있다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "원본", sponsor: "스폰서", quantity: 5, status: "pending" });
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.updateItem(itemId, { itemName: "수정됨" });
    });

    expect(result.current.items[0].itemName).toBe("수정됨");
  });

  it("updateItem으로 quantity를 수정할 수 있다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품", sponsor: "스폰서", quantity: 5, status: "pending" });
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.updateItem(itemId, { quantity: 20 });
    });

    expect(result.current.items[0].quantity).toBe(20);
  });

  it("존재하지 않는 id로 updateItem 호출 시 items가 변하지 않는다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품", sponsor: "스폰서", quantity: 5, status: "pending" });
    });

    await act(async () => {
      await result.current.updateItem("nonexistent", { itemName: "변경" });
    });

    expect(result.current.items[0].itemName).toBe("물품");
  });
});

// ============================================================
// deleteItem
// ============================================================

describe("useSponsoredGoods - deleteItem", () => {
  it("deleteItem 호출 시 해당 항목이 제거된다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "삭제할 물품", sponsor: "스폰서", quantity: 5, status: "pending" });
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.deleteItem(itemId);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("여러 항목 중 특정 항목만 삭제된다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품A", sponsor: "스폰서", quantity: 5, status: "pending" });
    });
    await act(async () => {
      await result.current.addItem({ itemName: "물품B", sponsor: "스폰서", quantity: 3, status: "pending" });
    });

    const firstId = result.current.items[0].id;

    await act(async () => {
      await result.current.deleteItem(firstId);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].itemName).toBe("물품B");
  });
});

// ============================================================
// updateStatus
// ============================================================

describe("useSponsoredGoods - updateStatus", () => {
  it("updateStatus로 status를 received로 변경할 수 있다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품", sponsor: "스폰서", quantity: 5, status: "pending" });
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.updateStatus(itemId, "received");
    });

    expect(result.current.items[0].status).toBe("received");
  });

  it("updateStatus로 status를 returned로 변경할 수 있다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품", sponsor: "스폰서", quantity: 5, status: "received" });
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.updateStatus(itemId, "returned");
    });

    expect(result.current.items[0].status).toBe("returned");
  });
});

// ============================================================
// getRemainingQuantity
// ============================================================

describe("useSponsoredGoods - getRemainingQuantity", () => {
  it("distributions가 없으면 잔여 수량은 총 수량과 같다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품", sponsor: "스폰서", quantity: 10, status: "received" });
    });

    const itemId = result.current.items[0].id;
    expect(result.current.getRemainingQuantity(itemId)).toBe(10);
  });

  it("존재하지 않는 id의 getRemainingQuantity는 0을 반환한다", () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));
    expect(result.current.getRemainingQuantity("nonexistent")).toBe(0);
  });
});

// ============================================================
// distribute
// ============================================================

describe("useSponsoredGoods - distribute", () => {
  it("distribute 호출 시 distributions에 배분 기록이 추가된다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품", sponsor: "스폰서", quantity: 10, status: "received" });
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.distribute(itemId, "김멤버", 3);
    });

    expect(result.current.items[0].distributions).toHaveLength(1);
  });

  it("distribute 성공 시 true를 반환한다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품", sponsor: "스폰서", quantity: 10, status: "received" });
    });

    const itemId = result.current.items[0].id;

    let success = false;
    await act(async () => {
      success = await result.current.distribute(itemId, "멤버", 2);
    });

    expect(success).toBe(true);
  });

  it("잔여 수량보다 많이 배분하려 하면 false를 반환한다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품", sponsor: "스폰서", quantity: 5, status: "received" });
    });

    const itemId = result.current.items[0].id;

    let success = true;
    await act(async () => {
      success = await result.current.distribute(itemId, "멤버", 10);
    });

    expect(success).toBe(false);
  });

  it("존재하지 않는 itemId로 distribute 호출 시 false를 반환한다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    let success = true;
    await act(async () => {
      success = await result.current.distribute("nonexistent", "멤버", 1);
    });

    expect(success).toBe(false);
  });

  it("전체 수량이 배분되면 status가 distributed로 변경된다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품", sponsor: "스폰서", quantity: 5, status: "received" });
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.distribute(itemId, "멤버", 5);
    });

    expect(result.current.items[0].status).toBe("distributed");
  });

  it("배분 후 getRemainingQuantity가 감소한다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "물품", sponsor: "스폰서", quantity: 10, status: "received" });
    });

    const itemId = result.current.items[0].id;

    await act(async () => {
      await result.current.distribute(itemId, "멤버", 3);
    });

    expect(result.current.getRemainingQuantity(itemId)).toBe(7);
  });
});

// ============================================================
// stats
// ============================================================

describe("useSponsoredGoods - stats", () => {
  it("stats.totalItems는 items 배열의 길이와 일치한다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "A", sponsor: "스폰서", quantity: 5, status: "pending" });
    });
    await act(async () => {
      await result.current.addItem({ itemName: "B", sponsor: "스폰서", quantity: 3, status: "pending" });
    });

    expect(result.current.stats.totalItems).toBe(2);
  });

  it("stats.totalValue는 estimatedValue 합계와 일치한다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "A", sponsor: "스폰서", quantity: 5, status: "pending", estimatedValue: 10000 });
    });
    await act(async () => {
      await result.current.addItem({ itemName: "B", sponsor: "스폰서", quantity: 3, status: "pending", estimatedValue: 20000 });
    });

    expect(result.current.stats.totalValue).toBe(30000);
  });

  it("stats.receivedItems는 received 또는 distributed 상태 항목 수와 일치한다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "A", sponsor: "스폰서", quantity: 5, status: "received" });
    });
    await act(async () => {
      await result.current.addItem({ itemName: "B", sponsor: "스폰서", quantity: 3, status: "distributed" });
    });
    await act(async () => {
      await result.current.addItem({ itemName: "C", sponsor: "스폰서", quantity: 2, status: "pending" });
    });

    expect(result.current.stats.receivedItems).toBe(2);
  });

  it("stats.distributedItems는 distributed 상태 항목 수와 일치한다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "A", sponsor: "스폰서", quantity: 5, status: "distributed" });
    });
    await act(async () => {
      await result.current.addItem({ itemName: "B", sponsor: "스폰서", quantity: 3, status: "received" });
    });

    expect(result.current.stats.distributedItems).toBe(1);
  });

  it("estimatedValue가 없는 항목은 totalValue 계산에서 0으로 처리된다", async () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    await act(async () => {
      await result.current.addItem({ itemName: "A", sponsor: "스폰서", quantity: 5, status: "pending" });
    });

    expect(result.current.stats.totalValue).toBe(0);
  });

  it("stats 구조에 모든 필드가 포함된다", () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    expect(result.current.stats).toHaveProperty("totalItems");
    expect(result.current.stats).toHaveProperty("totalValue");
    expect(result.current.stats).toHaveProperty("receivedItems");
    expect(result.current.stats).toHaveProperty("distributedItems");
  });

  it("refetch 호출 시 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() => useSponsoredGoods(GROUP_ID, PROJECT_ID));

    expect(() => {
      act(() => {
        result.current.refetch();
      });
    }).not.toThrow();
  });
});
