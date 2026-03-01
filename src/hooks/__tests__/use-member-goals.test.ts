import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMemberGoals } from "@/hooks/use-member-goals";

// ─── localStorage mock ──────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── supabase mock ──────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      is: vi.fn().mockReturnThis(),
    }),
  }),
}));

// ─── crypto.randomUUID mock ─────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: () => `goal-uuid-${++uuidCounter}`,
});

beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  uuidCounter = 0;
});

// ─────────────────────────────────────────────────────────────
// 1. 초기 상태
// ─────────────────────────────────────────────────────────────

describe("useMemberGoals - 초기 상태", () => {
  it("초기 goals는 빈 배열이다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goals).toEqual([]);
  });

  it("초기 goalsWithProgress는 빈 배열이다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goalsWithProgress).toEqual([]);
  });

  it("loading은 초기에 true였다가 false가 된다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("groupId가 없으면 loading이 false가 된다", async () => {
    const { result } = renderHook(() => useMemberGoals("", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goals).toEqual([]);
  });

  it("userId가 없으면 loading이 false가 된다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", ""));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goals).toEqual([]);
  });

  it("필요한 함수들이 모두 존재한다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.createGoal).toBe("function");
    expect(typeof result.current.deleteGoal).toBe("function");
    expect(typeof result.current.refreshProgress).toBe("function");
  });
});

// ─────────────────────────────────────────────────────────────
// 2. createGoal
// ─────────────────────────────────────────────────────────────

describe("useMemberGoals - createGoal", () => {
  it("목표 생성 후 goals에 항목이 추가된다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });

    expect(result.current.goals).toHaveLength(1);
  });

  it("생성된 목표의 goalType이 올바르다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("posts", 5, "2026-03");
    });

    expect(result.current.goals[0].goalType).toBe("posts");
  });

  it("생성된 목표의 targetValue가 올바르다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 20, "2026-03");
    });

    expect(result.current.goals[0].targetValue).toBe(20);
  });

  it("생성된 목표의 yearMonth가 올바르다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("payment", 3, "2026-04");
    });

    expect(result.current.goals[0].yearMonth).toBe("2026-04");
  });

  it("생성된 목표에 id가 존재한다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });

    expect(result.current.goals[0].id).toBeTruthy();
  });

  it("목표 생성 후 localStorage에 저장된다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    localStorageMock.setItem.mockClear();
    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("여러 목표를 순차적으로 생성할 수 있다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });
    await act(async () => {
      await result.current.createGoal("posts", 5, "2026-03");
    });

    expect(result.current.goals).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. deleteGoal
// ─────────────────────────────────────────────────────────────

describe("useMemberGoals - deleteGoal", () => {
  it("목표 삭제 후 goals에서 제거된다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });
    const goalId = result.current.goals[0].id;

    act(() => {
      result.current.deleteGoal(goalId);
    });

    expect(result.current.goals).toHaveLength(0);
  });

  it("존재하지 않는 ID 삭제 시 goals 수가 변경되지 않는다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });

    act(() => {
      result.current.deleteGoal("non-existent-id");
    });

    expect(result.current.goals).toHaveLength(1);
  });

  it("목표 삭제 후 goalsWithProgress에서도 제거된다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });
    await waitFor(() => expect(result.current.progressLoading).toBe(false));

    const goalId = result.current.goals[0].id;
    act(() => {
      result.current.deleteGoal(goalId);
    });

    expect(result.current.goalsWithProgress.find((g) => g.id === goalId)).toBeUndefined();
  });

  it("목표 삭제 후 localStorage에 저장된다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });
    const goalId = result.current.goals[0].id;

    localStorageMock.setItem.mockClear();
    act(() => {
      result.current.deleteGoal(goalId);
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// 4. goalsWithProgress 달성률 계산
// ─────────────────────────────────────────────────────────────

describe("useMemberGoals - goalsWithProgress 달성률 계산", () => {
  it("Supabase 응답이 0이면 currentValue는 0이다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });
    await waitFor(() => expect(result.current.progressLoading).toBe(false));

    expect(result.current.goalsWithProgress[0].currentValue).toBe(0);
  });

  it("currentValue가 0이면 achievementRate는 0이다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });
    await waitFor(() => expect(result.current.progressLoading).toBe(false));

    expect(result.current.goalsWithProgress[0].achievementRate).toBe(0);
  });

  it("currentValue가 0이면 isAchieved는 false이다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });
    await waitFor(() => expect(result.current.progressLoading).toBe(false));

    expect(result.current.goalsWithProgress[0].isAchieved).toBe(false);
  });

  it("targetValue가 0이면 achievementRate는 0이다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 0, "2026-03");
    });
    await waitFor(() => expect(result.current.progressLoading).toBe(false));

    expect(result.current.goalsWithProgress[0].achievementRate).toBe(0);
  });

  it("goalsWithProgress 항목은 goals와 동일한 id를 가진다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });
    await waitFor(() => expect(result.current.progressLoading).toBe(false));

    expect(result.current.goalsWithProgress[0].id).toBe(result.current.goals[0].id);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. refreshProgress
// ─────────────────────────────────────────────────────────────

describe("useMemberGoals - refreshProgress", () => {
  it("goals가 없을 때 refreshProgress 호출 시 goalsWithProgress가 빈 배열이 된다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshProgress();
    });

    expect(result.current.goalsWithProgress).toEqual([]);
  });

  it("refreshProgress 호출 후 progressLoading이 완료된다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 5, "2026-03");
    });
    await act(async () => {
      await result.current.refreshProgress();
    });

    expect(result.current.progressLoading).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. localStorage 캐시 / 그룹+유저별 격리
// ─────────────────────────────────────────────────────────────

describe("useMemberGoals - localStorage 캐시 및 격리", () => {
  it("localStorage에서 기존 목표를 로드한다", async () => {
    const existingGoal = [{
      id: "existing-goal-1",
      goalType: "attendance",
      targetValue: 8,
      yearMonth: "2026-03",
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === "member-goals-group-1-user-1") {
        return JSON.stringify(existingGoal);
      }
      return null;
    });

    const { result } = renderHook(() => useMemberGoals("group-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.goals).toHaveLength(1);
    expect(result.current.goals[0].id).toBe("existing-goal-1");
  });

  it("localStorage 키가 groupId와 userId를 포함한다", async () => {
    const { result } = renderHook(() => useMemberGoals("grp-X", "usr-Y"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 10, "2026-03");
    });

    const savedKey = localStorageMock.setItem.mock.calls[0][0];
    expect(savedKey).toContain("grp-X");
    expect(savedKey).toContain("usr-Y");
  });

  it("다른 groupId의 훅은 독립된 상태를 가진다", async () => {
    const { result: r1 } = renderHook(() => useMemberGoals("group-A", "user-1"));
    const { result: r2 } = renderHook(() => useMemberGoals("group-B", "user-1"));

    await waitFor(() => expect(r1.current.loading).toBe(false));
    await waitFor(() => expect(r2.current.loading).toBe(false));

    await act(async () => {
      await r1.current.createGoal("attendance", 10, "2026-03");
    });

    expect(r1.current.goals).toHaveLength(1);
    expect(r2.current.goals).toHaveLength(0);
  });

  it("다른 userId의 훅은 독립된 상태를 가진다", async () => {
    const { result: r1 } = renderHook(() => useMemberGoals("group-1", "user-A"));
    const { result: r2 } = renderHook(() => useMemberGoals("group-1", "user-B"));

    await waitFor(() => expect(r1.current.loading).toBe(false));
    await waitFor(() => expect(r2.current.loading).toBe(false));

    await act(async () => {
      await r1.current.createGoal("attendance", 10, "2026-03");
    });

    expect(r1.current.goals).toHaveLength(1);
    expect(r2.current.goals).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 7. MemberGoalType 종류별 생성
// ─────────────────────────────────────────────────────────────

describe("useMemberGoals - MemberGoalType 종류별 생성", () => {
  it("attendance 타입 목표를 생성할 수 있다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-type-a", "user-type-a"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("attendance", 5, "2026-03");
    });

    expect(result.current.goals[0].goalType).toBe("attendance");
  });

  it("posts 타입 목표를 생성할 수 있다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-type-p", "user-type-p"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("posts", 3, "2026-03");
    });

    expect(result.current.goals[0].goalType).toBe("posts");
  });

  it("payment 타입 목표를 생성할 수 있다", async () => {
    const { result } = renderHook(() => useMemberGoals("group-type-pay", "user-type-pay"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createGoal("payment", 1, "2026-03");
    });

    expect(result.current.goals[0].goalType).toBe("payment");
  });
});
