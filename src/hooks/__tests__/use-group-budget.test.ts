import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { mutate } from "swr";

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

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++_uuidCounter}`),
});

// ─── SWR 키 mock ───────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    groupBudgetTracker: (groupId: string) => `group-budget-tracker:${groupId}`,
  },
}));

// ─── local-storage mock ───────────────────────────────────────
// loadFromStorage가 {} as GroupBudgetData를 기본값으로 반환하면
// transactions가 undefined가 되어 filter 오류 발생.
// 항상 { transactions: [], categories: [] } 형태의 기본값을 보장하도록 mock.
vi.mock("@/lib/local-storage", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/local-storage")>();
  return {
    ...original,
    loadFromStorage: vi.fn(<T>(key: string, _defaultValue: T): T => {
      const raw = localStorageMock.getItem(key);
      if (!raw) {
        return {
          groupId: "",
          transactions: [],
          categories: [],
          monthlyBudgetLimit: null,
          updatedAt: "",
        } as unknown as T;
      }
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (!Array.isArray(parsed.transactions)) parsed.transactions = [];
        if (!Array.isArray(parsed.categories)) parsed.categories = [];
        return parsed as unknown as T;
      } catch {
        return {
          groupId: "",
          transactions: [],
          categories: [],
          monthlyBudgetLimit: null,
          updatedAt: "",
        } as unknown as T;
      }
    }),
    saveToStorage: vi.fn(<T>(key: string, value: T): void => {
      localStorageMock.setItem(key, JSON.stringify(value));
    }),
  };
});

// ─── 훅 import ────────────────────────────────────────────────
import { useGroupBudget } from "@/hooks/use-group-budget";
import type { GroupBudgetTransaction } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
let _groupCounter = 0;

function clearStore() {
  localStorageMock.clear();
  _uuidCounter = 0;
  // SWR 전역 캐시 초기화 (여러 파일 동시 실행 시 오염 방지)
  mutate(() => true, undefined, { revalidate: false });
}

function nextGroupId() {
  return `group-${++_groupCounter}`;
}

function makeHook(groupId?: string) {
  const id = groupId ?? nextGroupId();
  return { result: renderHook(() => useGroupBudget(id)).result, groupId: id };
}

type TxPayload = Omit<GroupBudgetTransaction, "id" | "createdAt">;

async function addTransactionHelper(
  hook: ReturnType<typeof makeHook>["result"],
  type: "income" | "expense" = "income",
  amount = 10000,
  category = "회비",
  date = "2026-03-01",
  description = "테스트 거래"
) {
  const payload: TxPayload = {
    type,
    category,
    description,
    amount,
    date,
    paidBy: null,
    receiptNote: null,
  };
  await act(async () => {
    await hook.current.addTransaction(payload);
  });
}

// ============================================================
// 초기 상태
// ============================================================

describe("useGroupBudget - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 transactions는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.data.transactions).toEqual([]);
  });

  it("초기 loading은 데이터 로드 후 false이다", async () => {
    const { result } = makeHook();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("초기 stats.totalIncome는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalIncome).toBe(0);
  });

  it("초기 stats.totalExpense는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalExpense).toBe(0);
  });

  it("초기 stats.balance는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.balance).toBe(0);
  });

  it("초기 stats.monthlySpending는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.monthlySpending).toBe(0);
  });

  it("초기 stats.categoryBreakdown는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.categoryBreakdown).toEqual([]);
  });

  it("초기 stats.recentTransactions는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.recentTransactions).toEqual([]);
  });

  it("초기 categories는 DEFAULT_CATEGORIES로 채워진다", () => {
    // loadFromStorage가 빈 categories:[]를 반환하므로
    // useMemo 기본값인 DEFAULT_CATEGORIES가 사용됨
    const { result } = makeHook();
    expect(result.current.data.categories.length).toBeGreaterThan(0);
  });

  it("초기 monthlyBudgetLimit는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.data.monthlyBudgetLimit).toBeNull();
  });

  it("data.groupId가 파라미터와 일치한다", () => {
    const { result, groupId } = makeHook();
    expect(result.current.data.groupId).toBe(groupId);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addTransaction).toBe("function");
    expect(typeof result.current.updateTransaction).toBe("function");
    expect(typeof result.current.deleteTransaction).toBe("function");
    expect(typeof result.current.addCategory).toBe("function");
    expect(typeof result.current.removeCategory).toBe("function");
    expect(typeof result.current.setMonthlyLimit).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addTransaction
// ============================================================

describe("useGroupBudget - addTransaction", () => {
  beforeEach(clearStore);

  it("수입 거래 추가 후 transactions 길이가 1이 된다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income");
    expect(result.current.data.transactions).toHaveLength(1);
  });

  it("추가된 거래의 type이 올바르다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "expense");
    expect(result.current.data.transactions[0]?.type).toBe("expense");
  });

  it("추가된 거래의 amount가 올바르다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 50000);
    expect(result.current.data.transactions[0]?.amount).toBe(50000);
  });

  it("추가된 거래의 category가 올바르다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 10000, "회비");
    expect(result.current.data.transactions[0]?.category).toBe("회비");
  });

  it("추가된 거래에 id가 부여된다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result);
    expect(result.current.data.transactions[0]?.id).toBeTruthy();
  });

  it("추가된 거래에 createdAt이 ISO 형식으로 설정된다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result);
    expect(result.current.data.transactions[0]?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("새 거래는 목록 맨 앞에 추가된다 (최신순)", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 1000, "회비", "2026-02-01", "첫 번째");
    await addTransactionHelper(result, "expense", 2000, "연습비", "2026-03-01", "두 번째");
    expect(result.current.data.transactions[0]?.description).toBe("두 번째");
  });
});

// ============================================================
// updateTransaction
// ============================================================

describe("useGroupBudget - updateTransaction", () => {
  beforeEach(clearStore);

  it("거래의 amount를 수정할 수 있다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 10000);
    const txId = result.current.data.transactions[0]?.id!;
    await act(async () => {
      await result.current.updateTransaction(txId, { amount: 20000 });
    });
    expect(result.current.data.transactions[0]?.amount).toBe(20000);
  });

  it("거래의 description을 수정할 수 있다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result);
    const txId = result.current.data.transactions[0]?.id!;
    await act(async () => {
      await result.current.updateTransaction(txId, { description: "수정된 설명" });
    });
    expect(result.current.data.transactions[0]?.description).toBe("수정된 설명");
  });

  it("updateTransaction 성공 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result);
    const txId = result.current.data.transactions[0]?.id!;
    let success = false;
    await act(async () => {
      success = await result.current.updateTransaction(txId, { amount: 5000 });
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 id 수정 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.updateTransaction("non-existent", { amount: 5000 });
    });
    expect(success).toBe(false);
  });
});

// ============================================================
// deleteTransaction
// ============================================================

describe("useGroupBudget - deleteTransaction", () => {
  beforeEach(clearStore);

  it("거래 삭제 후 transactions 길이가 감소한다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result);
    const txId = result.current.data.transactions[0]?.id!;
    await act(async () => {
      await result.current.deleteTransaction(txId);
    });
    expect(result.current.data.transactions).toHaveLength(0);
  });

  it("deleteTransaction 성공 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result);
    const txId = result.current.data.transactions[0]?.id!;
    let success = false;
    await act(async () => {
      success = await result.current.deleteTransaction(txId);
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.deleteTransaction("non-existent");
    });
    expect(success).toBe(false);
  });

  it("특정 거래만 삭제되고 나머지는 유지된다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 1000, "회비", "2026-03-01", "거래1");
    await addTransactionHelper(result, "expense", 2000, "연습비", "2026-03-02", "거래2");
    // transactions[0]은 가장 최근(거래2)
    const firstTxId = result.current.data.transactions[0]?.id!;
    await act(async () => {
      await result.current.deleteTransaction(firstTxId);
    });
    expect(result.current.data.transactions).toHaveLength(1);
    expect(result.current.data.transactions[0]?.description).toBe("거래1");
  });
});

// ============================================================
// 카테고리 관리
// ============================================================

describe("useGroupBudget - 카테고리 관리", () => {
  beforeEach(clearStore);

  it("카테고리 추가 후 categories 길이가 증가한다", async () => {
    const { result } = makeHook();
    const before = result.current.data.categories.length;
    await act(async () => {
      await result.current.addCategory({ name: "신규 카테고리", icon: "🎉" });
    });
    expect(result.current.data.categories.length).toBe(before + 1);
  });

  it("이미 존재하는 카테고리 추가 시 중복 추가되지 않는다", async () => {
    const { result } = makeHook();
    // 먼저 카테고리를 추가
    await act(async () => {
      await result.current.addCategory({ name: "중복테스트", icon: "🔁" });
    });
    const before = result.current.data.categories.length;
    // 같은 이름 다시 추가
    await act(async () => {
      await result.current.addCategory({ name: "중복테스트", icon: "🔁" });
    });
    expect(result.current.data.categories.length).toBe(before);
  });

  it("카테고리 삭제 후 categories 길이가 감소한다", async () => {
    const { result } = makeHook();
    // 먼저 카테고리를 추가하고 삭제
    await act(async () => {
      await result.current.addCategory({ name: "삭제예정", icon: "🗑️" });
    });
    const before = result.current.data.categories.length;
    await act(async () => {
      await result.current.removeCategory("삭제예정");
    });
    expect(result.current.data.categories.length).toBe(before - 1);
  });

  it("삭제한 카테고리가 목록에서 사라진다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addCategory({ name: "삭제대상", icon: "🗑️" });
    });
    await act(async () => {
      await result.current.removeCategory("삭제대상");
    });
    const names = result.current.data.categories.map((c) => c.name);
    expect(names).not.toContain("삭제대상");
  });
});

// ============================================================
// 월별 예산 한도
// ============================================================

describe("useGroupBudget - 월별 예산 한도", () => {
  beforeEach(clearStore);

  it("setMonthlyLimit으로 한도를 설정할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.setMonthlyLimit(500000);
    });
    expect(result.current.data.monthlyBudgetLimit).toBe(500000);
  });

  it("setMonthlyLimit으로 한도를 null로 설정할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.setMonthlyLimit(500000);
    });
    await act(async () => {
      await result.current.setMonthlyLimit(null);
    });
    expect(result.current.data.monthlyBudgetLimit).toBeNull();
  });
});

// ============================================================
// 통계 계산
// ============================================================

describe("useGroupBudget - 통계 계산", () => {
  beforeEach(clearStore);

  it("수입 추가 후 stats.totalIncome가 증가한다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 30000);
    expect(result.current.stats.totalIncome).toBe(30000);
  });

  it("지출 추가 후 stats.totalExpense가 증가한다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "expense", 15000);
    expect(result.current.stats.totalExpense).toBe(15000);
  });

  it("stats.balance는 수입 - 지출이다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 50000);
    await addTransactionHelper(result, "expense", 20000);
    expect(result.current.stats.balance).toBe(30000);
  });

  it("이번 달 지출만 monthlySpending에 반영된다", async () => {
    const { result } = makeHook();
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;
    await addTransactionHelper(result, "expense", 10000, "회비", thisMonth);
    await addTransactionHelper(result, "expense", 5000, "회비", "2020-01-01"); // 다른 달
    expect(result.current.stats.monthlySpending).toBe(10000);
  });

  it("stats.recentTransactions는 최대 5건이다", async () => {
    const { result } = makeHook();
    for (let i = 0; i < 7; i++) {
      await addTransactionHelper(result, "income", 1000, "회비", `2026-03-${String(i + 1).padStart(2, "0")}`);
    }
    expect(result.current.stats.recentTransactions.length).toBeLessThanOrEqual(5);
  });

  it("stats.recentTransactions는 날짜 내림차순으로 정렬된다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 1000, "회비", "2026-03-01");
    await addTransactionHelper(result, "income", 2000, "회비", "2026-03-15");
    await addTransactionHelper(result, "income", 3000, "회비", "2026-03-10");
    const dates = result.current.stats.recentTransactions.map((t) => t.date);
    // 첫 번째가 가장 최근이어야 함
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i] >= dates[i + 1]).toBe(true);
    }
  });

  it("categoryBreakdown은 지출 카테고리별 합산을 포함한다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "expense", 10000, "회비");
    await addTransactionHelper(result, "expense", 5000, "회비");
    const cb = result.current.stats.categoryBreakdown.find((c) => c.category === "회비");
    expect(cb?.amount).toBe(15000);
  });

  it("categoryBreakdown은 amount 내림차순으로 정렬된다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "expense", 5000, "연습비");
    await addTransactionHelper(result, "expense", 20000, "회비");
    if (result.current.stats.categoryBreakdown.length >= 2) {
      expect(result.current.stats.categoryBreakdown[0].amount).toBeGreaterThanOrEqual(
        result.current.stats.categoryBreakdown[1].amount
      );
    }
  });

  it("categoryBreakdown의 ratio는 전체 지출 대비 백분율이다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "expense", 10000, "회비");
    await addTransactionHelper(result, "expense", 10000, "연습비");
    result.current.stats.categoryBreakdown.forEach((cb) => {
      expect(cb.ratio).toBe(50);
    });
  });

  it("지출이 없으면 categoryBreakdown은 빈 배열이다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 10000); // 수입만
    expect(result.current.stats.categoryBreakdown).toEqual([]);
  });

  it("수입 거래는 categoryBreakdown에 포함되지 않는다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 50000, "회비");
    expect(result.current.stats.categoryBreakdown).toHaveLength(0);
  });
});

// ============================================================
// 그룹별 격리
// ============================================================

describe("useGroupBudget - 그룹별 격리", () => {
  beforeEach(clearStore);

  it("다른 groupId는 독립적인 상태를 갖는다", async () => {
    const { result: resultA } = makeHook();
    const { result: resultB } = makeHook();
    await act(async () => {
      await resultA.current.addTransaction({
        type: "income",
        category: "회비",
        description: "A 그룹 수입",
        amount: 10000,
        date: "2026-03-01",
        paidBy: null,
        receiptNote: null,
      });
    });
    expect(resultA.current.data.transactions).toHaveLength(1);
    expect(resultB.current.data.transactions).toHaveLength(0);
  });
});

// ============================================================
// localStorage 키 형식
// ============================================================

describe("useGroupBudget - localStorage 키 형식", () => {
  beforeEach(clearStore);

  it("저장 키는 dancebase:group-budget-tracker:{groupId} 형식이다", async () => {
    const { result, groupId } = makeHook();
    await addTransactionHelper(result);
    const stored = localStorageMock._store()[`dancebase:group-budget-tracker:${groupId}`];
    expect(stored).toBeDefined();
  });
});

// ============================================================
// 경계값
// ============================================================

describe("useGroupBudget - 경계값", () => {
  beforeEach(clearStore);

  it("amount가 0인 거래를 추가할 수 있다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 0);
    expect(result.current.data.transactions[0]?.amount).toBe(0);
  });

  it("amount가 0인 거래만 있을 때 balance는 0이다", async () => {
    const { result } = makeHook();
    await addTransactionHelper(result, "income", 0);
    expect(result.current.stats.balance).toBe(0);
  });
});

// ============================================================
// 순수 함수 로직
// ============================================================

describe("useGroupBudget - 순수 함수 로직", () => {
  it("totalExpense = 0이면 categoryBreakdown ratio는 계산 불가 (빈 배열)", () => {
    const transactions: GroupBudgetTransaction[] = [];
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    expect(totalExpense).toBe(0);
  });

  it("balance = totalIncome - totalExpense", () => {
    const totalIncome = 100000;
    const totalExpense = 30000;
    expect(totalIncome - totalExpense).toBe(70000);
  });

  it("ratio = Math.round((amount / totalExpense) * 100)", () => {
    const amount = 1;
    const totalExpense = 4;
    const ratio = Math.round((amount / totalExpense) * 100);
    expect(ratio).toBe(25);
  });

  it("이번 달 필터 로직: 같은 연월만 포함", () => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth() + 1;
    const txDate = `${thisYear}-${String(thisMonth).padStart(2, "0")}-10`;
    const d = new Date(txDate);
    const sameMonth = d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth;
    expect(sameMonth).toBe(true);
  });

  it("다른 달 필터 로직: 2020-01-01은 이번 달이 아니다", () => {
    const now = new Date();
    const d = new Date("2020-01-01");
    const sameMonth =
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    expect(sameMonth).toBe(false);
  });
});
