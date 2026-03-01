import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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
    _inject: (key: string, value: unknown) => {
      store[key] = JSON.stringify(value);
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));

import { useRewardShop, REWARD_SHOP_POINT_RULES, REWARD_SHOP_POINT_LABELS } from "@/hooks/use-reward-shop";
import type { RewardShopItem } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
const GROUP_ID = "group-reward-shop-test";

function makeHook(groupId = GROUP_ID) {
  return renderHook(() => useRewardShop(groupId));
}

function shopKey(groupId = GROUP_ID) {
  return `dancebase:reward-shop:${groupId}`;
}

function txKey(groupId = GROUP_ID) {
  return `dancebase:reward-shop-tx:${groupId}`;
}

function makeItem(overrides: Partial<Omit<RewardShopItem, "id" | "createdAt">> = {}): Omit<RewardShopItem, "id" | "createdAt"> {
  return {
    name: "커피 쿠폰",
    description: "아메리카노 1잔",
    pointCost: 100,
    quantity: 10,
    isActive: true,
    imageUrl: null,
    ...overrides,
  };
}

// ============================================================
// 상수 테스트
// ============================================================

describe("REWARD_SHOP_POINT_RULES - 상수 검증", () => {
  it("attendance 포인트가 10이다", () => {
    expect(REWARD_SHOP_POINT_RULES.attendance).toBe(10);
  });

  it("late 포인트가 5이다", () => {
    expect(REWARD_SHOP_POINT_RULES.late).toBe(5);
  });

  it("post 포인트가 15이다", () => {
    expect(REWARD_SHOP_POINT_RULES.post).toBe(15);
  });

  it("comment 포인트가 5이다", () => {
    expect(REWARD_SHOP_POINT_RULES.comment).toBe(5);
  });

  it("weeklyChallenge 포인트가 20이다", () => {
    expect(REWARD_SHOP_POINT_RULES.weeklyChallenge).toBe(20);
  });

  it("REWARD_SHOP_POINT_LABELS에 모든 키의 한글 레이블이 있다", () => {
    const keys = Object.keys(REWARD_SHOP_POINT_RULES) as Array<keyof typeof REWARD_SHOP_POINT_RULES>;
    for (const key of keys) {
      expect(REWARD_SHOP_POINT_LABELS[key]).toBeTruthy();
    }
  });
});

// ============================================================
// 초기 상태 테스트
// ============================================================

describe("useRewardShop - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("items는 초기에 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.items).toEqual([]);
  });

  it("exchanges는 초기에 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.exchanges).toEqual([]);
  });

  it("recentExchanges는 초기에 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.recentExchanges).toEqual([]);
  });

  it("myExchanges는 초기에 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.myExchanges).toEqual([]);
  });

  it("myBalance는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.myBalance).toBe(0);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("currentUserId는 초기에 null이다", () => {
    const { result } = makeHook();
    expect(result.current.currentUserId).toBeNull();
  });

  it("필수 함수들이 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getBalance).toBe("function");
    expect(typeof result.current.earnPoints).toBe("function");
    expect(typeof result.current.getMyTransactions).toBe("function");
    expect(typeof result.current.addItem).toBe("function");
    expect(typeof result.current.updateItem).toBe("function");
    expect(typeof result.current.deleteItem).toBe("function");
    expect(typeof result.current.exchangeItem).toBe("function");
    expect(typeof result.current.getRemainingQuantity).toBe("function");
  });
});

// ============================================================
// getBalance 테스트
// ============================================================

describe("useRewardShop - getBalance", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("포인트 기록이 없는 유저의 잔액은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.getBalance("user-unknown")).toBe(0);
  });

  it("포인트 적립 후 잔액이 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.earnPoints("user-1", "attendance");
    });
    expect(result.current.getBalance("user-1")).toBe(REWARD_SHOP_POINT_RULES.attendance);
  });

  it("여러 번 적립 시 누적된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.earnPoints("user-1", "attendance");
      result.current.earnPoints("user-1", "post");
    });
    const expected = REWARD_SHOP_POINT_RULES.attendance + REWARD_SHOP_POINT_RULES.post;
    expect(result.current.getBalance("user-1")).toBe(expected);
  });

  it("다른 유저의 잔액은 영향받지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.earnPoints("user-1", "attendance");
    });
    expect(result.current.getBalance("user-2")).toBe(0);
  });
});

// ============================================================
// earnPoints 테스트
// ============================================================

describe("useRewardShop - earnPoints", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("attendance 타입으로 10포인트 적립된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.earnPoints("user-1", "attendance");
    });
    expect(result.current.getBalance("user-1")).toBe(10);
  });

  it("weeklyChallenge 타입으로 20포인트 적립된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.earnPoints("user-1", "weeklyChallenge");
    });
    expect(result.current.getBalance("user-1")).toBe(20);
  });

  it("포인트 적립 내용이 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.earnPoints("user-1", "comment");
    });
    const stored = localStorageMock._store()[txKey()];
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].userId).toBe("user-1");
    expect(parsed[0].amount).toBe(REWARD_SHOP_POINT_RULES.comment);
  });
});

// ============================================================
// addItem / updateItem / deleteItem 테스트
// ============================================================

describe("useRewardShop - 아이템 CRUD", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("아이템 추가 후 items 목록에 반영된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem());
    });
    expect(result.current.items).toHaveLength(1);
  });

  it("추가된 아이템의 name이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem({ name: "스타벅스 쿠폰" }));
    });
    expect(result.current.items[0].name).toBe("스타벅스 쿠폰");
  });

  it("추가된 아이템에 id가 자동 생성된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem());
    });
    expect(result.current.items[0].id).toBeDefined();
    expect(result.current.items[0].id.length).toBeGreaterThan(0);
  });

  it("아이템 수정이 가능하다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem({ pointCost: 100 }));
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.updateItem(itemId, { pointCost: 200 });
    });
    expect(result.current.items[0].pointCost).toBe(200);
  });

  it("아이템 비활성화가 가능하다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem({ isActive: true }));
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.updateItem(itemId, { isActive: false });
    });
    expect(result.current.items[0].isActive).toBe(false);
  });

  it("아이템 삭제 후 목록에서 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem());
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.deleteItem(itemId);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("여러 아이템 중 특정 아이템만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem({ name: "아이템1" }));
      result.current.addItem(makeItem({ name: "아이템2" }));
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.deleteItem(itemId);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("아이템2");
  });

  it("아이템 추가 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem());
    });
    const stored = localStorageMock._store()[shopKey()];
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored);
    expect(parsed.items).toHaveLength(1);
  });
});

// ============================================================
// exchangeItem 테스트
// ============================================================

describe("useRewardShop - exchangeItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("로그인하지 않으면 교환이 실패한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem());
    });
    const itemId = result.current.items[0].id;
    let res: { success: boolean; message: string } = { success: true, message: "" };
    act(() => {
      res = result.current.exchangeItem(itemId);
    });
    expect(res.success).toBe(false);
    expect(res.message).toContain("로그인");
  });

  it("존재하지 않는 아이템 교환은 실패한다", () => {
    const { result } = makeHook();
    let res: { success: boolean; message: string } = { success: true, message: "" };
    act(() => {
      res = result.current.exchangeItem("non-existent");
    });
    expect(res.success).toBe(false);
  });
});

// ============================================================
// getRemainingQuantity 테스트
// ============================================================

describe("useRewardShop - getRemainingQuantity", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("무제한 수량(-1) 아이템은 -1을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem({ quantity: -1 }));
    });
    const item = result.current.items[0];
    expect(result.current.getRemainingQuantity(item)).toBe(-1);
  });

  it("교환 이력 없이 quantity가 10이면 10을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem(makeItem({ quantity: 10 }));
    });
    const item = result.current.items[0];
    expect(result.current.getRemainingQuantity(item)).toBe(10);
  });

  it("교환 이력이 있으면 남은 수량이 감소한다", () => {
    // exchanges 데이터를 직접 주입해서 테스트
    const itemId = "test-item-id";
    const exchangeData = {
      items: [{
        id: itemId,
        name: "테스트 아이템",
        description: "",
        pointCost: 50,
        quantity: 5,
        isActive: true,
        imageUrl: null,
        createdAt: new Date().toISOString(),
      }],
      exchanges: [
        { id: "ex-1", userId: "user-1", userName: "유저1", itemId, itemName: "테스트 아이템", pointsSpent: 50, exchangedAt: new Date().toISOString() },
        { id: "ex-2", userId: "user-2", userName: "유저2", itemId, itemName: "테스트 아이템", pointsSpent: 50, exchangedAt: new Date().toISOString() },
      ],
    };
    localStorageMock._inject(shopKey(), exchangeData);

    const { result } = renderHook(() => useRewardShop(GROUP_ID));
    const item = result.current.items[0];
    expect(result.current.getRemainingQuantity(item)).toBe(3);
  });

  it("남은 수량은 0 미만이 되지 않는다", () => {
    const itemId = "test-item-id-2";
    const exchangeData = {
      items: [{
        id: itemId,
        name: "품절 아이템",
        description: "",
        pointCost: 50,
        quantity: 1,
        isActive: true,
        imageUrl: null,
        createdAt: new Date().toISOString(),
      }],
      exchanges: [
        { id: "ex-1", userId: "user-1", userName: "유저1", itemId, itemName: "품절 아이템", pointsSpent: 50, exchangedAt: new Date().toISOString() },
        { id: "ex-2", userId: "user-2", userName: "유저2", itemId, itemName: "품절 아이템", pointsSpent: 50, exchangedAt: new Date().toISOString() },
      ],
    };
    localStorageMock._inject(shopKey(), exchangeData);

    const { result } = renderHook(() => useRewardShop(GROUP_ID));
    const item = result.current.items[0];
    expect(result.current.getRemainingQuantity(item)).toBe(0);
  });
});

// ============================================================
// recentExchanges 테스트
// ============================================================

describe("useRewardShop - recentExchanges", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("recentExchanges는 최대 10개만 반환한다", () => {
    const itemId = "item-for-recent";
    const exchanges = Array.from({ length: 15 }, (_, i) => ({
      id: `ex-${i}`,
      userId: `user-${i}`,
      userName: `유저${i}`,
      itemId,
      itemName: "아이템",
      pointsSpent: 10,
      exchangedAt: new Date().toISOString(),
    }));
    localStorageMock._inject(shopKey(), { items: [], exchanges });

    const { result } = renderHook(() => useRewardShop(GROUP_ID));
    expect(result.current.recentExchanges).toHaveLength(10);
  });

  it("교환 이력이 10개 이하면 전부 반환한다", () => {
    const exchanges = Array.from({ length: 5 }, (_, i) => ({
      id: `ex-${i}`,
      userId: `user-${i}`,
      userName: `유저${i}`,
      itemId: "item-1",
      itemName: "아이템",
      pointsSpent: 10,
      exchangedAt: new Date().toISOString(),
    }));
    localStorageMock._inject(shopKey(), { items: [], exchanges });

    const { result } = renderHook(() => useRewardShop(GROUP_ID));
    expect(result.current.recentExchanges).toHaveLength(5);
  });
});

// ============================================================
// getMyTransactions 테스트
// ============================================================

describe("useRewardShop - getMyTransactions", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("로그인 안 된 상태에서 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getMyTransactions()).toEqual([]);
  });
});

// ============================================================
// 그룹별 데이터 격리 테스트
// ============================================================

describe("useRewardShop - 그룹별 데이터 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("다른 그룹의 아이템은 분리되어 저장된다", () => {
    const { result: r1 } = renderHook(() => useRewardShop("group-A"));
    const { result: r2 } = renderHook(() => useRewardShop("group-B"));

    act(() => {
      r1.current.addItem(makeItem({ name: "A그룹 아이템" }));
    });

    expect(r1.current.items).toHaveLength(1);
    expect(r2.current.items).toHaveLength(0);
  });

  it("다른 그룹의 포인트는 격리된다", () => {
    const { result: r1 } = renderHook(() => useRewardShop("group-A"));
    const { result: r2 } = renderHook(() => useRewardShop("group-B"));

    act(() => {
      r1.current.earnPoints("user-1", "attendance");
    });

    expect(r1.current.getBalance("user-1")).toBe(10);
    expect(r2.current.getBalance("user-1")).toBe(0);
  });
});

// ============================================================
// localStorage 파싱 오류 처리 테스트
// ============================================================

describe("useRewardShop - localStorage 파싱 오류 처리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("잘못된 JSON이 저장되어 있어도 빈 배열로 초기화된다", () => {
    localStorageMock._inject(shopKey(), "잘못된JSON{{{");
    // 실제로는 잘못된 JSON 문자열을 직접 주입
    localStorageMock.getItem.mockReturnValueOnce("invalid-json");

    const { result } = renderHook(() => useRewardShop(GROUP_ID));
    // 오류 시 빈 배열로 fallback 처리되어야 함
    expect(Array.isArray(result.current.items)).toBe(true);
    expect(Array.isArray(result.current.exchanges)).toBe(true);
  });
});
