import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useDanceMilestone,
  calcGoalProgress,
} from "@/hooks/use-dance-milestone";
import type {
  DanceMilestoneGoal,
  DanceMilestoneStep,
} from "@/types";

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

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    danceMilestone: (id: string) => `dance-milestone-${id}`,
  },
}));

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeGoalParams(overrides: Partial<Parameters<ReturnType<typeof useDanceMilestone>["addGoal"]>[0]> = {}) {
  return {
    title: "스핀 마스터하기",
    category: "technique" as const,
    ...overrides,
  };
}

function makeHook(memberId = "member-1") {
  return renderHook(() => useDanceMilestone(memberId));
}

// ============================================================
// calcGoalProgress 순수 함수 테스트
// ============================================================

describe("calcGoalProgress - 목표 진행률 계산", () => {
  it("steps가 없으면 0을 반환한다", () => {
    const goal: DanceMilestoneGoal = {
      id: "g1",
      memberId: "m1",
      title: "목표",
      category: "technique",
      steps: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(calcGoalProgress(goal)).toBe(0);
  });

  it("모든 steps가 완료되면 100을 반환한다", () => {
    const steps: DanceMilestoneStep[] = [
      { id: "s1", title: "단계1", isCompleted: true, order: 0 },
      { id: "s2", title: "단계2", isCompleted: true, order: 1 },
    ];
    const goal: DanceMilestoneGoal = {
      id: "g1",
      memberId: "m1",
      title: "목표",
      category: "technique",
      steps,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(calcGoalProgress(goal)).toBe(100);
  });

  it("하나도 완료되지 않으면 0을 반환한다", () => {
    const steps: DanceMilestoneStep[] = [
      { id: "s1", title: "단계1", isCompleted: false, order: 0 },
      { id: "s2", title: "단계2", isCompleted: false, order: 1 },
    ];
    const goal: DanceMilestoneGoal = {
      id: "g1",
      memberId: "m1",
      title: "목표",
      category: "technique",
      steps,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(calcGoalProgress(goal)).toBe(0);
  });

  it("4개 중 2개 완료 시 50을 반환한다", () => {
    const steps: DanceMilestoneStep[] = [
      { id: "s1", title: "단계1", isCompleted: true, order: 0 },
      { id: "s2", title: "단계2", isCompleted: true, order: 1 },
      { id: "s3", title: "단계3", isCompleted: false, order: 2 },
      { id: "s4", title: "단계4", isCompleted: false, order: 3 },
    ];
    const goal: DanceMilestoneGoal = {
      id: "g1",
      memberId: "m1",
      title: "목표",
      category: "technique",
      steps,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(calcGoalProgress(goal)).toBe(50);
  });

  it("3개 중 1개 완료 시 33을 반환한다 (반올림)", () => {
    const steps: DanceMilestoneStep[] = [
      { id: "s1", title: "단계1", isCompleted: true, order: 0 },
      { id: "s2", title: "단계2", isCompleted: false, order: 1 },
      { id: "s3", title: "단계3", isCompleted: false, order: 2 },
    ];
    const goal: DanceMilestoneGoal = {
      id: "g1",
      memberId: "m1",
      title: "목표",
      category: "technique",
      steps,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(calcGoalProgress(goal)).toBe(33);
  });

  it("3개 중 2개 완료 시 67을 반환한다 (반올림)", () => {
    const steps: DanceMilestoneStep[] = [
      { id: "s1", title: "단계1", isCompleted: true, order: 0 },
      { id: "s2", title: "단계2", isCompleted: true, order: 1 },
      { id: "s3", title: "단계3", isCompleted: false, order: 2 },
    ];
    const goal: DanceMilestoneGoal = {
      id: "g1",
      memberId: "m1",
      title: "목표",
      category: "technique",
      steps,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(calcGoalProgress(goal)).toBe(67);
  });

  it("반환값은 항상 0~100 사이의 정수이다", () => {
    const steps: DanceMilestoneStep[] = [
      { id: "s1", title: "단계1", isCompleted: true, order: 0 },
      { id: "s2", title: "단계2", isCompleted: false, order: 1 },
      { id: "s3", title: "단계3", isCompleted: false, order: 2 },
    ];
    const goal: DanceMilestoneGoal = {
      id: "g1",
      memberId: "m1",
      title: "목표",
      category: "technique",
      steps,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const progress = calcGoalProgress(goal);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
    expect(Number.isInteger(progress)).toBe(true);
  });
});

// ============================================================
// useDanceMilestone - 초기 상태
// ============================================================

describe("useDanceMilestone - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("초기 goals는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.goals).toEqual([]);
  });

  it("초기 activeGoalsCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.activeGoalsCount).toBe(0);
  });

  it("초기 completedGoalsCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.completedGoalsCount).toBe(0);
  });

  it("초기 overallProgress는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.overallProgress).toBe(0);
  });

  it("addGoal, deleteGoal, updateGoal, addStep, toggleStep, deleteStep 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addGoal).toBe("function");
    expect(typeof result.current.deleteGoal).toBe("function");
    expect(typeof result.current.updateGoal).toBe("function");
    expect(typeof result.current.addStep).toBe("function");
    expect(typeof result.current.toggleStep).toBe("function");
    expect(typeof result.current.deleteStep).toBe("function");
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useDanceMilestone - addGoal
// ============================================================

describe("useDanceMilestone - addGoal 목표 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("목표 추가 시 goals 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams());
    });
    expect(result.current.goals).toHaveLength(1);
  });

  it("추가된 목표에 id가 부여된다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    expect(goal!.id).toBeDefined();
    expect(goal!.id).not.toBe("");
  });

  it("추가된 목표의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams({ title: "브레이킹 마스터" }));
    });
    expect(result.current.goals[0].title).toBe("브레이킹 마스터");
  });

  it("title의 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams({ title: "  스핀 연습  " }));
    });
    expect(result.current.goals[0].title).toBe("스핀 연습");
  });

  it("추가된 목표의 steps는 빈 배열이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams());
    });
    expect(result.current.goals[0].steps).toEqual([]);
  });

  it("추가된 목표의 memberId가 올바르다", () => {
    const { result } = makeHook("member-99");
    act(() => {
      result.current.addGoal(makeGoalParams());
    });
    expect(result.current.goals[0].memberId).toBe("member-99");
  });

  it("목표 추가 시 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams());
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("description이 있는 목표를 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams({ description: "연습 설명" }));
    });
    expect(result.current.goals[0].description).toBe("연습 설명");
  });

  it("targetDate가 있는 목표를 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams({ targetDate: "2026-06-30" }));
    });
    expect(result.current.goals[0].targetDate).toBe("2026-06-30");
  });
});

// ============================================================
// useDanceMilestone - deleteGoal
// ============================================================

describe("useDanceMilestone - deleteGoal 목표 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("목표 삭제 시 goals 길이가 감소한다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.deleteGoal(goal!.id);
    });
    expect(result.current.goals).toHaveLength(0);
  });

  it("특정 목표만 삭제된다", () => {
    const { result } = makeHook();
    let g1: DanceMilestoneGoal, g2: DanceMilestoneGoal;
    act(() => {
      g1 = result.current.addGoal(makeGoalParams({ title: "목표1" }));
      g2 = result.current.addGoal(makeGoalParams({ title: "목표2" }));
    });
    act(() => {
      result.current.deleteGoal(g1!.id);
    });
    expect(result.current.goals).toHaveLength(1);
    expect(result.current.goals[0].id).toBe(g2!.id);
  });

  it("존재하지 않는 id로 삭제 시 goals가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.deleteGoal("non-existent-id");
    });
    expect(result.current.goals).toHaveLength(1);
  });
});

// ============================================================
// useDanceMilestone - updateGoal
// ============================================================

describe("useDanceMilestone - updateGoal 목표 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("목표 title을 수정할 수 있다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams({ title: "원래 제목" }));
    });
    act(() => {
      result.current.updateGoal(goal!.id, { title: "새 제목" });
    });
    expect(result.current.goals[0].title).toBe("새 제목");
  });

  it("목표 category를 수정할 수 있다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams({ category: "technique" }));
    });
    act(() => {
      result.current.updateGoal(goal!.id, { category: "flexibility" });
    });
    expect(result.current.goals[0].category).toBe("flexibility");
  });

  it("존재하지 않는 id 수정 시 goals가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams({ title: "목표" }));
    });
    act(() => {
      result.current.updateGoal("non-existent", { title: "변경" });
    });
    expect(result.current.goals[0].title).toBe("목표");
  });

  it("수정 시 updatedAt이 ISO 형식 문자열이다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.updateGoal(goal!.id, { title: "새 제목" });
    });
    // updatedAt은 ISO 8601 형식이어야 한다
    expect(result.current.goals[0].updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});

// ============================================================
// useDanceMilestone - addStep
// ============================================================

describe("useDanceMilestone - addStep 마일스톤 단계 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("목표에 단계를 추가할 수 있다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "첫 번째 단계" });
    });
    expect(result.current.goals[0].steps).toHaveLength(1);
  });

  it("추가된 단계의 title이 올바르다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "스핀 연습" });
    });
    expect(result.current.goals[0].steps[0].title).toBe("스핀 연습");
  });

  it("추가된 단계의 isCompleted는 false이다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계" });
    });
    expect(result.current.goals[0].steps[0].isCompleted).toBe(false);
  });

  it("추가된 단계의 order는 steps 길이 기준으로 설정된다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계1" });
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계2" });
    });
    expect(result.current.goals[0].steps[0].order).toBe(0);
    expect(result.current.goals[0].steps[1].order).toBe(1);
  });

  it("존재하지 않는 goalId로 addStep 시 null을 반환한다", () => {
    const { result } = makeHook();
    let returned: DanceMilestoneStep | null;
    act(() => {
      returned = result.current.addStep("non-existent-id", { title: "단계" });
    });
    expect(returned!).toBeNull();
  });

  it("단계 추가 후 updatedAt이 ISO 형식 문자열이다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계" });
    });
    // updatedAt은 ISO 8601 형식이어야 한다
    expect(result.current.goals[0].updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});

// ============================================================
// useDanceMilestone - toggleStep
// ============================================================

describe("useDanceMilestone - toggleStep 단계 완료 토글", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("미완료 단계를 토글하면 isCompleted가 true가 된다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계" });
    });
    const stepId = result.current.goals[0].steps[0].id;
    act(() => {
      result.current.toggleStep(goal!.id, stepId);
    });
    expect(result.current.goals[0].steps[0].isCompleted).toBe(true);
  });

  it("완료된 단계를 토글하면 isCompleted가 false로 돌아온다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계" });
    });
    const stepId = result.current.goals[0].steps[0].id;
    act(() => {
      result.current.toggleStep(goal!.id, stepId);
    });
    act(() => {
      result.current.toggleStep(goal!.id, stepId);
    });
    expect(result.current.goals[0].steps[0].isCompleted).toBe(false);
  });

  it("완료 시 completedAt이 설정된다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계" });
    });
    const stepId = result.current.goals[0].steps[0].id;
    act(() => {
      result.current.toggleStep(goal!.id, stepId);
    });
    expect(result.current.goals[0].steps[0].completedAt).toBeDefined();
  });

  it("완료 취소 시 completedAt이 undefined가 된다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계" });
    });
    const stepId = result.current.goals[0].steps[0].id;
    act(() => {
      result.current.toggleStep(goal!.id, stepId);
    });
    act(() => {
      result.current.toggleStep(goal!.id, stepId);
    });
    expect(result.current.goals[0].steps[0].completedAt).toBeUndefined();
  });

  it("존재하지 않는 goalId로 toggleStep 시 아무 변화가 없다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams());
    });
    // 예외 없이 실행되어야 함
    expect(() => {
      act(() => {
        result.current.toggleStep("non-existent-goal", "step-1");
      });
    }).not.toThrow();
  });
});

// ============================================================
// useDanceMilestone - deleteStep
// ============================================================

describe("useDanceMilestone - deleteStep 단계 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("단계 삭제 시 steps 길이가 감소한다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계1" });
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계2" });
    });
    const stepId = result.current.goals[0].steps[0].id;
    act(() => {
      result.current.deleteStep(goal!.id, stepId);
    });
    expect(result.current.goals[0].steps).toHaveLength(1);
  });

  it("삭제 후 order가 재정렬된다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계1" });
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계2" });
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계3" });
    });
    const stepId = result.current.goals[0].steps[0].id;
    act(() => {
      result.current.deleteStep(goal!.id, stepId);
    });
    expect(result.current.goals[0].steps[0].order).toBe(0);
    expect(result.current.goals[0].steps[1].order).toBe(1);
  });
});

// ============================================================
// useDanceMilestone - 통계 계산
// ============================================================

describe("useDanceMilestone - 통계 계산 (activeGoalsCount, completedGoalsCount, overallProgress)", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("진행 중인 목표가 있으면 activeGoalsCount가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams({ title: "목표1" }));
    });
    act(() => {
      result.current.addGoal(makeGoalParams({ title: "목표2" }));
    });
    // steps가 없으면 progress=0 → active
    expect(result.current.activeGoalsCount).toBe(2);
  });

  it("steps가 모두 완료된 목표는 completedGoalsCount에 포함된다", () => {
    const { result } = makeHook();
    let goal: DanceMilestoneGoal;
    act(() => {
      goal = result.current.addGoal(makeGoalParams());
    });
    act(() => {
      result.current.addStep(goal!.id, { title: "단계1" });
    });
    const stepId = result.current.goals[0].steps[0].id;
    act(() => {
      result.current.toggleStep(goal!.id, stepId);
    });
    expect(result.current.completedGoalsCount).toBe(1);
  });

  it("steps가 없는 목표는 completedGoalsCount에 포함되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addGoal(makeGoalParams());
    });
    // steps 없으므로 progress=0 이지만 completedGoals는 steps.length > 0 조건
    expect(result.current.completedGoalsCount).toBe(0);
  });

  it("goals가 없으면 overallProgress는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.overallProgress).toBe(0);
  });

  it("여러 목표의 평균 진행률이 overallProgress에 반영된다", () => {
    const { result } = makeHook();
    let g1: DanceMilestoneGoal, g2: DanceMilestoneGoal;
    act(() => {
      g1 = result.current.addGoal(makeGoalParams({ title: "목표1" }));
    });
    act(() => {
      g2 = result.current.addGoal(makeGoalParams({ title: "목표2" }));
    });
    act(() => {
      result.current.addStep(g1!.id, { title: "단계1" });
    });
    act(() => {
      result.current.addStep(g2!.id, { title: "단계A" });
    });
    const step1Id = result.current.goals.find((g) => g.id === g1!.id)?.steps[0]?.id ?? "";
    act(() => {
      result.current.toggleStep(g1!.id, step1Id);
    });
    // g1: 100% (step 완료), g2: 0% → 평균 50%
    expect(result.current.overallProgress).toBe(50);
  });
});

// ============================================================
// useDanceMilestone - 멤버별 격리
// ============================================================

describe("useDanceMilestone - 멤버별 데이터 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("다른 memberId는 독립적인 goals를 가진다", () => {
    const { result: r1 } = renderHook(() => useDanceMilestone("member-A"));
    const { result: r2 } = renderHook(() => useDanceMilestone("member-B"));

    act(() => {
      r1.current.addGoal(makeGoalParams({ title: "A의 목표" }));
    });

    expect(r1.current.goals).toHaveLength(1);
    expect(r2.current.goals).toHaveLength(0);
  });
});
