import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── @/lib/local-storage mock: vi.hoisted으로 memStore 제어 ──
const localStorageLib = vi.hoisted(() => {
  const memStore: Record<string, unknown> = {};
  return {
    memStore,
    reset: () => {
      Object.keys(memStore).forEach((k) => delete memStore[k]);
    },
  };
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    return key in localStorageLib.memStore
      ? (localStorageLib.memStore[key] as T)
      : defaultValue;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    localStorageLib.memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete localStorageLib.memStore[key];
  },
}));

// ─── SWR mock: vi.hoisted으로 store 제어 ─────────────────────
const swrStore = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const reset = () => store.clear();
  return { store, reset };
});

vi.mock("swr", () => ({
  default: (key: string | null, fetcher: (() => unknown) | null) => {
    if (!key || !fetcher) return { data: undefined, mutate: vi.fn() };
    if (!swrStore.store.has(key)) {
      swrStore.store.set(key, fetcher());
    }
    const mutate = (newData?: unknown) => {
      if (newData !== undefined) swrStore.store.set(key, newData);
      else swrStore.store.set(key, fetcher!());
    };
    return { data: swrStore.store.get(key), mutate };
  },
}));

// ─── sonner mock ─────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    fundraisingGoal: (groupId: string) => `fundraising-goal-${groupId}`,
  },
}));

// ─── toast-messages mock ─────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    GOAL: {
      TITLE_REQUIRED: "목표 제목을 입력해주세요",
      NOT_FOUND: "목표를 찾을 수 없습니다",
    },
    FUNDRAISING: {
      AMOUNT_REQUIRED: "올바른 목표 금액을 입력해주세요.",
      GOAL_ADDED: "모금 목표가 추가되었습니다.",
      GOAL_UPDATED: "모금 목표가 수정되었습니다.",
      GOAL_DELETED: "모금 목표가 삭제되었습니다.",
      GOAL_ADD_ERROR: "모금 목표 추가에 실패했습니다.",
      GOAL_UPDATE_ERROR: "모금 목표 수정에 실패했습니다.",
      GOAL_DELETE_ERROR: "모금 목표 삭제에 실패했습니다.",
      DONOR_REQUIRED: "기부자 이름을 입력해주세요",
      DONATION_AMOUNT_REQUIRED: "올바른 기부 금액을 입력해주세요.",
      DONATION_ADDED: "기부금이 추가되었습니다.",
      DONATION_ADD_ERROR: "기부금 추가에 실패했습니다.",
      GOAL_ACHIEVED: "목표 금액을 달성했습니다! 모금이 완료되었습니다.",
      ACTIVE_ONLY: "진행 중인 모금에만 기부금을 추가할 수 있습니다",
      ALREADY_CANCELLED: "이미 취소된 모금입니다",
      CANCELLED: "모금이 취소되었습니다.",
      CANCEL_ERROR: "모금 취소에 실패했습니다.",
    },
    INFO: {
      DEADLINE_REQUIRED: "마감일을 입력해주세요",
    },
  },
}));

import { useFundraisingGoal } from "@/hooks/use-fundraising-goal";
import type { FundraisingGoal } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeGoal(overrides?: Partial<FundraisingGoal>): FundraisingGoal {
  return {
    id: "goal-1",
    title: "발표회 기금",
    description: "연말 발표회 기금 모금",
    targetAmount: 500000,
    currentAmount: 0,
    deadline: "2026-12-31",
    contributions: [],
    milestones: [
      { percent: 25 },
      { percent: 50 },
      { percent: 75 },
      { percent: 100 },
    ],
    status: "active" as const,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function seedGoals(groupId: string, goals: FundraisingGoal[]) {
  const key = `dancebase:fundraising:${groupId}`;
  localStorageLib.memStore[key] = goals;
}

function resetAll() {
  localStorageLib.reset();
  swrStore.reset();
}

// ─── 초기 상태 ──────────────────────────────────────────────
describe("useFundraisingGoal - 초기 상태", () => {
  beforeEach(() => resetAll());

  it("초기 goals는 빈 배열이다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    expect(result.current.goals).toEqual([]);
  });

  it("초기 totalGoals는 0이다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    expect(result.current.totalGoals).toBe(0);
  });

  it("초기 activeGoals는 0이다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    expect(result.current.activeGoals).toBe(0);
  });

  it("초기 completedGoals는 0이다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    expect(result.current.completedGoals).toBe(0);
  });

  it("초기 overallProgress는 0이다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    expect(result.current.overallProgress).toBe(0);
  });

  it("초기 totalTarget는 0이다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    expect(result.current.totalTarget).toBe(0);
  });

  it("초기 totalCurrent는 0이다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    expect(result.current.totalCurrent).toBe(0);
  });

  it("필수 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    expect(typeof result.current.addGoal).toBe("function");
    expect(typeof result.current.deleteGoal).toBe("function");
    expect(typeof result.current.updateGoal).toBe("function");
    expect(typeof result.current.addContribution).toBe("function");
    expect(typeof result.current.cancelGoal).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ─── addGoal ────────────────────────────────────────────────
describe("useFundraisingGoal - addGoal", () => {
  beforeEach(() => resetAll());

  it("빈 title로 추가 시 false를 반환한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addGoal({
        title: "",
        description: "설명",
        targetAmount: 100000,
        deadline: "2026-12-31",
      });
    });
    expect(ret!).toBe(false);
  });

  it("공백만 있는 title로 추가 시 false를 반환한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addGoal({
        title: "   ",
        description: "설명",
        targetAmount: 100000,
        deadline: "2026-12-31",
      });
    });
    expect(ret!).toBe(false);
  });

  it("targetAmount가 0이면 false를 반환한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addGoal({
        title: "기금",
        description: "설명",
        targetAmount: 0,
        deadline: "2026-12-31",
      });
    });
    expect(ret!).toBe(false);
  });

  it("targetAmount가 음수이면 false를 반환한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addGoal({
        title: "기금",
        description: "설명",
        targetAmount: -1000,
        deadline: "2026-12-31",
      });
    });
    expect(ret!).toBe(false);
  });

  it("deadline이 빈 문자열이면 false를 반환한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addGoal({
        title: "기금",
        description: "설명",
        targetAmount: 100000,
        deadline: "",
      });
    });
    expect(ret!).toBe(false);
  });

  it("정상 입력으로 추가 시 true를 반환한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addGoal({
        title: "발표회 기금",
        description: "연말 발표회",
        targetAmount: 500000,
        deadline: "2026-12-31",
      });
    });
    expect(ret!).toBe(true);
  });

  it("추가된 목표의 초기 currentAmount는 0이다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.addGoal({
        title: "발표회 기금",
        description: "",
        targetAmount: 500000,
        deadline: "2026-12-31",
      });
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved[0].currentAmount).toBe(0);
  });

  it("추가된 목표의 초기 status는 active이다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.addGoal({
        title: "발표회 기금",
        description: "",
        targetAmount: 500000,
        deadline: "2026-12-31",
      });
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved[0].status).toBe("active");
  });

  it("추가된 목표는 4개의 마일스톤을 갖는다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.addGoal({
        title: "발표회 기금",
        description: "",
        targetAmount: 500000,
        deadline: "2026-12-31",
      });
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved[0].milestones).toHaveLength(4);
    expect(saved[0].milestones.map((m) => m.percent)).toEqual([25, 50, 75, 100]);
  });

  it("title 앞뒤 공백은 제거되어 저장된다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.addGoal({
        title: "  발표회 기금  ",
        description: "",
        targetAmount: 500000,
        deadline: "2026-12-31",
      });
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved[0].title).toBe("발표회 기금");
  });
});

// ─── deleteGoal ─────────────────────────────────────────────
describe("useFundraisingGoal - deleteGoal", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 ID 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteGoal("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 ID 삭제 시 true를 반환한다", () => {
    const goal = makeGoal();
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteGoal("goal-1");
    });
    expect(ret!).toBe(true);
  });

  it("삭제 후 빈 배열이 저장된다", () => {
    const goal = makeGoal();
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.deleteGoal("goal-1");
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved).toHaveLength(0);
  });

  it("여러 목표 중 하나만 삭제된다", () => {
    const goal1 = makeGoal({ id: "goal-1", title: "기금1" });
    const goal2 = makeGoal({ id: "goal-2", title: "기금2" });
    seedGoals("group-1", [goal1, goal2]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.deleteGoal("goal-1");
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe("goal-2");
  });
});

// ─── updateGoal ─────────────────────────────────────────────
describe("useFundraisingGoal - updateGoal", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 ID 수정 시 false를 반환한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateGoal("non-existent", { title: "새 제목" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 ID 수정 시 true를 반환한다", () => {
    const goal = makeGoal();
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateGoal("goal-1", { title: "수정된 기금" });
    });
    expect(ret!).toBe(true);
  });

  it("수정된 title이 저장된다", () => {
    const goal = makeGoal();
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.updateGoal("goal-1", { title: "수정된 기금" });
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved[0].title).toBe("수정된 기금");
  });

  it("targetAmount 수정이 반영된다", () => {
    const goal = makeGoal();
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.updateGoal("goal-1", { targetAmount: 1000000 });
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved[0].targetAmount).toBe(1000000);
  });
});

// ─── addContribution ─────────────────────────────────────────
describe("useFundraisingGoal - addContribution", () => {
  beforeEach(() => resetAll());

  it("donorName이 비어있으면 false를 반환한다", () => {
    const goal = makeGoal();
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addContribution("goal-1", {
        donorName: "",
        amount: 10000,
        date: "2026-03-01",
        note: "",
      });
    });
    expect(ret!).toBe(false);
  });

  it("amount가 0이면 false를 반환한다", () => {
    const goal = makeGoal();
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addContribution("goal-1", {
        donorName: "홍길동",
        amount: 0,
        date: "2026-03-01",
        note: "",
      });
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 goalId이면 false를 반환한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addContribution("non-existent", {
        donorName: "홍길동",
        amount: 10000,
        date: "2026-03-01",
        note: "",
      });
    });
    expect(ret!).toBe(false);
  });

  it("취소된 목표에 기부금 추가 시 false를 반환한다", () => {
    const goal = makeGoal({ status: "cancelled" });
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addContribution("goal-1", {
        donorName: "홍길동",
        amount: 10000,
        date: "2026-03-01",
        note: "",
      });
    });
    expect(ret!).toBe(false);
  });

  it("완료된 목표에 기부금 추가 시 false를 반환한다", () => {
    const goal = makeGoal({ status: "completed" });
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addContribution("goal-1", {
        donorName: "홍길동",
        amount: 10000,
        date: "2026-03-01",
        note: "",
      });
    });
    expect(ret!).toBe(false);
  });

  it("정상 기부금 추가 시 true를 반환한다", () => {
    const goal = makeGoal();
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addContribution("goal-1", {
        donorName: "홍길동",
        amount: 50000,
        date: "2026-03-01",
        note: "응원합니다",
      });
    });
    expect(ret!).toBe(true);
  });

  it("기부금 추가 시 currentAmount가 증가한다", () => {
    const goal = makeGoal({ currentAmount: 100000 });
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.addContribution("goal-1", {
        donorName: "홍길동",
        amount: 50000,
        date: "2026-03-01",
        note: "",
      });
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved[0].currentAmount).toBe(150000);
  });

  it("100% 달성 시 status가 completed로 변경된다", () => {
    const goal = makeGoal({ targetAmount: 100000, currentAmount: 80000 });
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.addContribution("goal-1", {
        donorName: "홍길동",
        amount: 20000,
        date: "2026-03-01",
        note: "",
      });
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved[0].status).toBe("completed");
  });
});

// ─── cancelGoal ─────────────────────────────────────────────
describe("useFundraisingGoal - cancelGoal", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 ID 취소 시 false를 반환한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.cancelGoal("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("이미 취소된 목표 재취소 시 false를 반환한다", () => {
    const goal = makeGoal({ status: "cancelled" });
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.cancelGoal("goal-1");
    });
    expect(ret!).toBe(false);
  });

  it("active 목표 취소 시 true를 반환한다", () => {
    const goal = makeGoal();
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.cancelGoal("goal-1");
    });
    expect(ret!).toBe(true);
  });

  it("취소 후 status가 cancelled로 저장된다", () => {
    const goal = makeGoal();
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.cancelGoal("goal-1");
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    expect(saved[0].status).toBe("cancelled");
  });
});

// ─── 통계 계산 (순수 로직 재현) ──────────────────────────────
describe("useFundraisingGoal - 통계 계산 순수 로직", () => {
  it("active 목표 수 필터링 로직이 정확하다", () => {
    const goals = [
      makeGoal({ id: "g1", status: "active" }),
      makeGoal({ id: "g2", status: "active" }),
      makeGoal({ id: "g3", status: "completed" }),
    ];
    const activeGoals = goals.filter((g) => g.status === "active").length;
    expect(activeGoals).toBe(2);
  });

  it("completed 목표 수 필터링 로직이 정확하다", () => {
    const goals = [
      makeGoal({ id: "g1", status: "completed" }),
      makeGoal({ id: "g2", status: "completed" }),
      makeGoal({ id: "g3", status: "cancelled" }),
    ];
    const completedGoals = goals.filter((g) => g.status === "completed").length;
    expect(completedGoals).toBe(2);
  });

  it("cancelled 목표는 totalTarget에 포함되지 않는다", () => {
    const goals = [
      makeGoal({ id: "g1", targetAmount: 300000, status: "active" }),
      makeGoal({ id: "g2", targetAmount: 200000, status: "cancelled" }),
    ];
    const totalTarget = goals
      .filter((g) => g.status !== "cancelled")
      .reduce((sum, g) => sum + g.targetAmount, 0);
    expect(totalTarget).toBe(300000);
  });

  it("cancelled 목표는 totalCurrent에 포함되지 않는다", () => {
    const goals = [
      makeGoal({ id: "g1", currentAmount: 100000, status: "active" }),
      makeGoal({ id: "g2", currentAmount: 50000, status: "cancelled" }),
    ];
    const totalCurrent = goals
      .filter((g) => g.status !== "cancelled")
      .reduce((sum, g) => sum + g.currentAmount, 0);
    expect(totalCurrent).toBe(100000);
  });

  it("overallProgress가 100을 초과하지 않는다 (cap 100)", () => {
    const totalTarget = 100000;
    const totalCurrent = 150000;
    const overallProgress = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;
    expect(overallProgress).toBeLessThanOrEqual(100);
    expect(overallProgress).toBe(100);
  });

  it("totalTarget이 0일 때 overallProgress는 0이다", () => {
    const totalTarget = 0;
    const totalCurrent = 0;
    const overallProgress = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;
    expect(overallProgress).toBe(0);
  });

  it("50% 달성 시 overallProgress가 50이다", () => {
    const totalTarget = 100000;
    const totalCurrent = 50000;
    const overallProgress = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;
    expect(overallProgress).toBe(50);
  });

  it("초기 데이터가 없을 때 totalGoals는 0이다", () => {
    const goals: FundraisingGoal[] = [];
    expect(goals.length).toBe(0);
  });
});

// ─── 마일스톤 체크 ───────────────────────────────────────────
describe("useFundraisingGoal - 마일스톤 체크", () => {
  beforeEach(() => resetAll());

  it("25% 미만에서 시작했다가 25% 이상이 되면 마일스톤 25가 달성된다", () => {
    // 10%에서 시작해서 25%로 넘어가는 기부금 추가
    const goal = makeGoal({ targetAmount: 100000, currentAmount: 10000 });
    seedGoals("group-1", [goal]);

    const { result } = renderHook(() => useFundraisingGoal("group-1"));
    act(() => {
      result.current.addContribution("goal-1", {
        donorName: "홍길동",
        amount: 15000,
        date: "2026-03-01",
        note: "",
      });
    });
    const saved = localStorageLib.memStore["dancebase:fundraising:group-1"] as FundraisingGoal[];
    const m25 = saved[0].milestones.find((m) => m.percent === 25);
    expect(m25?.reachedAt).toBeDefined();
  });

  it("checkMilestones 로직: 이미 달성된 마일스톤은 덮어쓰이지 않는다", () => {
    const MILESTONE_PERCENTS = [25, 50, 75, 100] as const;
    const now = "2026-01-01T00:00:00.000Z";

    const goal = makeGoal({
      targetAmount: 100000,
      currentAmount: 35000,
      milestones: [
        { percent: 25, reachedAt: now },
        { percent: 50 },
        { percent: 75 },
        { percent: 100 },
      ],
    });
    const prevAmount = 30000;
    const newPercent = (goal.currentAmount / goal.targetAmount) * 100;
    const prevPercent = (prevAmount / goal.targetAmount) * 100;

    const updatedMilestones = MILESTONE_PERCENTS.map((mp) => {
      const existing = goal.milestones.find((m) => m.percent === mp);
      if (existing?.reachedAt) return existing;
      if (newPercent >= mp && prevPercent < mp) {
        return { percent: mp, reachedAt: new Date().toISOString() };
      }
      return existing ?? { percent: mp };
    });

    const m25 = updatedMilestones.find((m) => m.percent === 25)!;
    expect(m25.reachedAt).toBe(now);
  });

  it("checkMilestones 로직: 100% 달성 시 status가 completed로 변경된다", () => {
    const goal = makeGoal({ targetAmount: 100000, currentAmount: 100000, status: "active" });
    const newPercent = (goal.currentAmount / goal.targetAmount) * 100;
    const isCompleted = newPercent >= 100 && goal.status === "active";
    expect(isCompleted).toBe(true);
  });

  it("checkMilestones 로직: targetAmount가 0이면 percent는 0이다", () => {
    const goal = makeGoal({ targetAmount: 0, currentAmount: 0 });
    const newPercent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    expect(newPercent).toBe(0);
  });
});

// ─── 그룹별 격리 ─────────────────────────────────────────────
describe("useFundraisingGoal - 그룹별 격리", () => {
  beforeEach(() => resetAll());

  it("다른 groupId는 독립적인 데이터를 갖는다", () => {
    const goal1 = makeGoal({ id: "g1", title: "그룹A 기금" });
    const goal2 = makeGoal({ id: "g2", title: "그룹B 기금" });

    seedGoals("group-a", [goal1]);
    seedGoals("group-b", [goal2]);

    const { result: resultA } = renderHook(() => useFundraisingGoal("group-a"));
    const { result: resultB } = renderHook(() => useFundraisingGoal("group-b"));

    expect(resultA.current.goals[0].title).toBe("그룹A 기금");
    expect(resultB.current.goals[0].title).toBe("그룹B 기금");
  });

  it("localStorage 키가 groupId를 포함한다", () => {
    const { result } = renderHook(() => useFundraisingGoal("my-group-99"));
    act(() => {
      result.current.addGoal({
        title: "기금",
        description: "",
        targetAmount: 10000,
        deadline: "2026-12-31",
      });
    });
    const savedKey = Object.keys(localStorageLib.memStore).find((k) =>
      k.includes("my-group-99")
    );
    expect(savedKey).toBeDefined();
    expect(savedKey).toContain("my-group-99");
  });
});
