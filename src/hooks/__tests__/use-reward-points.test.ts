import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRewardPoints, useActivityRewardPoints } from "@/hooks/use-reward-points";

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

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── ACTIVITY_POINT_DEFAULTS mock ─────────────────────────────
vi.mock("@/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/types")>();
  return {
    ...actual,
    ACTIVITY_POINT_DEFAULTS: {
      attendance: 10,
      post: 5,
      comment: 2,
      kudos: 3,
      streak: 15,
      manual: 0,
    },
  };
});

// ─── 헬퍼 ────────────────────────────────────────────────────
const GROUP_ID = "group-reward-1";

function makeRewardHook(groupId = GROUP_ID) {
  return renderHook(() => useRewardPoints(groupId));
}

function makeActivityHook(groupId = GROUP_ID) {
  return renderHook(() => useActivityRewardPoints(groupId));
}

function makeRewardItem(overrides: Partial<{
  name: string;
  emoji: string;
  cost: number;
  isActive: boolean;
  description: string;
}> = {}) {
  return {
    name: "커피 쿠폰",
    emoji: "☕",
    cost: 100,
    isActive: true,
    description: "아메리카노 한 잔",
    ...overrides,
  };
}

// ============================================================
// useRewardPoints - 기본 포인트 관리
// ============================================================

describe("useRewardPoints - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("getBalance, getTransactions 함수가 존재한다", () => {
    const { result } = makeRewardHook();
    expect(typeof result.current.getBalance).toBe("function");
    expect(typeof result.current.getTransactions).toBe("function");
  });

  it("addPoints, spendPoints 함수가 존재한다", () => {
    const { result } = makeRewardHook();
    expect(typeof result.current.addPoints).toBe("function");
    expect(typeof result.current.spendPoints).toBe("function");
  });

  it("getItems, createItem, updateItem, deleteItem, purchaseItem 함수가 존재한다", () => {
    const { result } = makeRewardHook();
    expect(typeof result.current.getItems).toBe("function");
    expect(typeof result.current.createItem).toBe("function");
    expect(typeof result.current.updateItem).toBe("function");
    expect(typeof result.current.deleteItem).toBe("function");
    expect(typeof result.current.purchaseItem).toBe("function");
  });

  it("존재하지 않는 유저의 잔액은 0이다", () => {
    const { result } = makeRewardHook();
    expect(result.current.getBalance("user-999")).toBe(0);
  });

  it("초기 거래 내역은 빈 배열이다", () => {
    const { result } = makeRewardHook();
    expect(result.current.getTransactions("user-1")).toEqual([]);
  });

  it("초기 아이템 목록은 빈 배열이다", () => {
    const { result } = makeRewardHook();
    expect(result.current.getItems()).toEqual([]);
  });
});

// ============================================================
// useRewardPoints - 포인트 적립
// ============================================================

describe("useRewardPoints - addPoints 포인트 적립", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("포인트 적립 후 잔액이 증가한다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.addPoints("user-1", 100, "출석 보상");
    });
    expect(result.current.getBalance("user-1")).toBe(100);
  });

  it("음수 금액을 넣어도 절댓값으로 적립된다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.addPoints("user-1", -50, "테스트");
    });
    expect(result.current.getBalance("user-1")).toBe(50);
  });

  it("여러 번 적립 시 잔액이 누적된다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.addPoints("user-1", 100, "1차");
      result.current.addPoints("user-1", 200, "2차");
    });
    expect(result.current.getBalance("user-1")).toBe(300);
  });

  it("다른 유저의 포인트는 영향받지 않는다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.addPoints("user-1", 100, "테스트");
    });
    expect(result.current.getBalance("user-2")).toBe(0);
  });

  it("적립 후 거래 내역에 기록된다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.addPoints("user-1", 50, "출석");
    });
    const txs = result.current.getTransactions("user-1");
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(50);
    expect(txs[0].reason).toBe("출석");
  });

  it("거래 내역은 최신순으로 정렬된다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.addPoints("user-1", 10, "1차");
      result.current.addPoints("user-1", 20, "2차");
    });
    const txs = result.current.getTransactions("user-1");
    expect(txs.length).toBe(2);
    // createdAt 내림차순 정렬 확인
    expect(txs[0].createdAt >= txs[1].createdAt).toBe(true);
  });
});

// ============================================================
// useRewardPoints - 포인트 차감
// ============================================================

describe("useRewardPoints - spendPoints 포인트 차감", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("포인트 차감 후 잔액이 감소한다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.addPoints("user-1", 200, "충전");
      result.current.spendPoints("user-1", 50, "구매");
    });
    expect(result.current.getBalance("user-1")).toBe(150);
  });

  it("spendPoints는 음수 금액으로 저장된다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.spendPoints("user-1", 30, "구매");
    });
    const txs = result.current.getTransactions("user-1");
    expect(txs[0].amount).toBe(-30);
  });

  it("잔액이 마이너스가 될 수 있다 (사전 검증 없음)", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.spendPoints("user-1", 100, "과다 지출");
    });
    expect(result.current.getBalance("user-1")).toBe(-100);
  });
});

// ============================================================
// useRewardPoints - 아이템 관리
// ============================================================

describe("useRewardPoints - 아이템 CRUD", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("아이템 추가 시 목록에 반영된다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.createItem(makeRewardItem());
    });
    expect(result.current.getItems()).toHaveLength(1);
  });

  it("추가된 아이템의 name이 올바르다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.createItem(makeRewardItem({ name: "아이스크림" }));
    });
    expect(result.current.getItems()[0].name).toBe("아이스크림");
  });

  it("아이템 수정이 가능하다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.createItem(makeRewardItem({ cost: 100 }));
    });
    const itemId = result.current.getItems()[0].id;
    act(() => {
      result.current.updateItem(itemId, { cost: 200 });
    });
    expect(result.current.getItems()[0].cost).toBe(200);
  });

  it("아이템 삭제 시 목록에서 제거된다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.createItem(makeRewardItem());
    });
    const itemId = result.current.getItems()[0].id;
    act(() => {
      result.current.deleteItem(itemId);
    });
    expect(result.current.getItems()).toHaveLength(0);
  });

  it("비활성 아이템 구매 시 실패한다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.createItem(makeRewardItem({ isActive: false }));
      result.current.addPoints("user-1", 1000, "충전");
    });
    const itemId = result.current.getItems()[0].id;
    let purchaseResult: { success: boolean; message: string } = { success: false, message: "" };
    act(() => {
      purchaseResult = result.current.purchaseItem("user-1", itemId);
    });
    expect(purchaseResult.success).toBe(false);
  });

  it("포인트 부족 시 구매가 실패한다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.createItem(makeRewardItem({ cost: 500 }));
    });
    const itemId = result.current.getItems()[0].id;
    let purchaseResult: { success: boolean; message: string } = { success: false, message: "" };
    act(() => {
      purchaseResult = result.current.purchaseItem("user-1", itemId);
    });
    expect(purchaseResult.success).toBe(false);
    expect(purchaseResult.message).toContain("포인트가 부족합니다");
  });

  it("충분한 포인트로 구매 시 성공한다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.createItem(makeRewardItem({ cost: 100 }));
      result.current.addPoints("user-1", 200, "충전");
    });
    const itemId = result.current.getItems()[0].id;
    let purchaseResult: { success: boolean; message: string } = { success: false, message: "" };
    act(() => {
      purchaseResult = result.current.purchaseItem("user-1", itemId);
    });
    expect(purchaseResult.success).toBe(true);
  });

  it("구매 후 잔액이 차감된다", () => {
    const { result } = makeRewardHook();
    act(() => {
      result.current.createItem(makeRewardItem({ cost: 100 }));
      result.current.addPoints("user-1", 300, "충전");
    });
    const itemId = result.current.getItems()[0].id;
    act(() => {
      result.current.purchaseItem("user-1", itemId);
    });
    expect(result.current.getBalance("user-1")).toBe(200);
  });

  it("존재하지 않는 아이템 구매 시 실패한다", () => {
    const { result } = makeRewardHook();
    let purchaseResult: { success: boolean; message: string } = { success: false, message: "" };
    act(() => {
      purchaseResult = result.current.purchaseItem("user-1", "non-existent-id");
    });
    expect(purchaseResult.success).toBe(false);
  });
});

// ============================================================
// useActivityRewardPoints - 활동 포인트
// ============================================================

describe("useActivityRewardPoints - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("getAllTransactions는 빈 배열을 반환한다", () => {
    const { result } = makeActivityHook();
    expect(result.current.getAllTransactions()).toEqual([]);
  });

  it("getMemberTotalPoints는 0을 반환한다", () => {
    const { result } = makeActivityHook();
    expect(result.current.getMemberTotalPoints("member-1")).toBe(0);
  });

  it("getLeaderboard는 빈 배열을 반환한다", () => {
    const { result } = makeActivityHook();
    expect(result.current.getLeaderboard()).toEqual([]);
  });

  it("getTotalIssuedPoints는 0을 반환한다", () => {
    const { result } = makeActivityHook();
    expect(result.current.getTotalIssuedPoints()).toBe(0);
  });

  it("getActiveMemberCount는 0을 반환한다", () => {
    const { result } = makeActivityHook();
    expect(result.current.getActiveMemberCount()).toBe(0);
  });
});

// ============================================================
// useActivityRewardPoints - grantPoints / deductPoints
// ============================================================

describe("useActivityRewardPoints - grantPoints / deductPoints", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("grantPoints 후 getMemberTotalPoints가 증가한다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "attendance", 10, "출석");
    });
    expect(result.current.getMemberTotalPoints("m1")).toBe(10);
  });

  it("여러 번 적립 시 포인트가 누적된다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "attendance", 10, "출석1");
      result.current.grantPoints("m1", "멤버A", "post", 5, "게시글");
    });
    expect(result.current.getMemberTotalPoints("m1")).toBe(15);
  });

  it("deductPoints 후 포인트가 감소한다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "manual", 50, "지급");
      result.current.deductPoints("m1", "멤버A", 20, "차감");
    });
    expect(result.current.getMemberTotalPoints("m1")).toBe(30);
  });

  it("deductPoints는 음수로 저장된다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.deductPoints("m1", "멤버A", 10, "차감");
    });
    const txs = result.current.getAllTransactions();
    expect(txs[0].points).toBe(-10);
  });

  it("getTotalIssuedPoints는 양수 포인트만 합산한다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "attendance", 30, "출석");
      result.current.deductPoints("m1", "멤버A", 10, "차감");
    });
    expect(result.current.getTotalIssuedPoints()).toBe(30);
  });
});

// ============================================================
// useActivityRewardPoints - 리더보드 / 통계
// ============================================================

describe("useActivityRewardPoints - 리더보드 및 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("getLeaderboard는 포인트 내림차순으로 정렬된다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "attendance", 10, "출석");
      result.current.grantPoints("m2", "멤버B", "attendance", 30, "출석");
    });
    const lb = result.current.getLeaderboard();
    expect(lb[0].memberId).toBe("m2");
    expect(lb[1].memberId).toBe("m1");
  });

  it("getLeaderboard에 rank가 포함된다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "attendance", 10, "출석");
    });
    const lb = result.current.getLeaderboard();
    expect(lb[0].rank).toBe(1);
  });

  it("getActiveMemberCount는 포인트 보유 멤버 수를 반환한다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "attendance", 10, "출석");
      result.current.grantPoints("m2", "멤버B", "attendance", 20, "출석");
    });
    expect(result.current.getActiveMemberCount()).toBe(2);
  });

  it("같은 멤버의 중복 포인트는 하나로 집계된다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "attendance", 10, "1차");
      result.current.grantPoints("m1", "멤버A", "post", 5, "2차");
    });
    expect(result.current.getActiveMemberCount()).toBe(1);
  });

  it("getActionDistribution은 액션 유형별 포인트를 반환한다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "attendance", 10, "출석");
      result.current.grantPoints("m1", "멤버A", "post", 5, "게시글");
    });
    const dist = result.current.getActionDistribution();
    expect(dist.attendance).toBe(10);
    expect(dist.post).toBe(5);
  });

  it("getActionDistribution은 음수 포인트를 제외한다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "attendance", 10, "출석");
      result.current.deductPoints("m1", "멤버A", 5, "차감");
    });
    const dist = result.current.getActionDistribution();
    // manual 차감은 포함되지 않아야 함
    expect(dist.attendance).toBe(10);
  });

  it("getDefaultPoints는 actionType에 따른 기본 포인트를 반환한다", () => {
    const { result } = makeActivityHook();
    expect(result.current.getDefaultPoints("attendance")).toBe(10);
    expect(result.current.getDefaultPoints("post")).toBe(5);
  });

  it("getAllTransactions는 최신순으로 정렬된다", () => {
    const { result } = makeActivityHook();
    act(() => {
      result.current.grantPoints("m1", "멤버A", "attendance", 10, "1차");
      result.current.grantPoints("m2", "멤버B", "post", 5, "2차");
    });
    const txs = result.current.getAllTransactions();
    expect(txs.length).toBe(2);
    // 최신순: 두 번째 적립이 첫 번째로 와야 함
    expect(txs[0].createdAt >= txs[1].createdAt).toBe(true);
  });

  it("그룹별로 데이터가 격리된다", () => {
    const { result: r1 } = renderHook(() => useActivityRewardPoints("group-X"));
    const { result: r2 } = renderHook(() => useActivityRewardPoints("group-Y"));

    act(() => {
      r1.current.grantPoints("m1", "멤버A", "attendance", 10, "출석");
    });

    expect(r1.current.getMemberTotalPoints("m1")).toBe(10);
    expect(r2.current.getMemberTotalPoints("m1")).toBe(0);
  });
});
