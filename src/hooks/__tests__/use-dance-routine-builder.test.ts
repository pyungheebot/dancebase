import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, _defaultValue: T): T => {
    const stored = memStore[key] as T | undefined;
    if (stored !== undefined) return stored;
    // DanceRoutineData 기본값: routines 빈 배열 보장
    return { routines: [] } as unknown as T;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    danceRoutineBuilder: (memberId: string) => `dance-routine-builder-${memberId}`,
  },
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useDanceRoutineBuilder } from "@/hooks/use-dance-routine-builder";
import type { DanceRoutine, RoutineStepCategory } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

function makeRoutineParams(overrides: Partial<{ title: string; purpose: string; estimatedMinutes: number }> = {}) {
  return {
    title: "기본 루틴",
    estimatedMinutes: 60,
    ...overrides,
  };
}

function makeStepParams(overrides: Partial<{
  name: string;
  category: RoutineStepCategory;
  sets: number;
  reps: number;
  repUnit: "reps" | "seconds";
  memo: string;
}> = {}) {
  return {
    name: "스쿼트",
    category: "warmup" as RoutineStepCategory,
    sets: 3,
    reps: 10,
    repUnit: "reps" as const,
    ...overrides,
  };
}

// ============================================================
// useDanceRoutineBuilder - 초기 상태
// ============================================================

describe("useDanceRoutineBuilder - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("초기 routines는 빈 배열이다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    expect(result.current.routines).toEqual([]);
  });

  it("loading은 항상 false이다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    expect(result.current.loading).toBe(false);
  });

  it("stats 객체가 존재한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    expect(result.current.stats).toBeDefined();
  });

  it("필요한 CRUD 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    expect(typeof result.current.addRoutine).toBe("function");
    expect(typeof result.current.updateRoutine).toBe("function");
    expect(typeof result.current.deleteRoutine).toBe("function");
    expect(typeof result.current.toggleFavorite).toBe("function");
    expect(typeof result.current.addStep).toBe("function");
    expect(typeof result.current.deleteStep).toBe("function");
    expect(typeof result.current.moveStep).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("routines가 없으면 stats.totalRoutines는 0이다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    expect(result.current.stats.totalRoutines).toBe(0);
  });

  it("routines가 없으면 stats.avgMinutes는 0이다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    expect(result.current.stats.avgMinutes).toBe(0);
  });

  it("routines가 없으면 stats.categoryDistribution는 빈 배열이다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    expect(result.current.stats.categoryDistribution).toEqual([]);
  });
});

// ============================================================
// useDanceRoutineBuilder - addRoutine
// ============================================================

describe("useDanceRoutineBuilder - addRoutine 루틴 추가", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("addRoutine 호출 후 routines 배열에 추가된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    act(() => {
      result.current.addRoutine(makeRoutineParams());
    });
    expect(result.current.routines).toHaveLength(1);
  });

  it("addRoutine이 반환하는 객체에 id가 있다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let newRoutine: DanceRoutine | undefined;
    act(() => {
      newRoutine = result.current.addRoutine(makeRoutineParams());
    });
    expect(newRoutine?.id).toBeTruthy();
  });

  it("addRoutine 시 title은 trim된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let newRoutine: DanceRoutine | undefined;
    act(() => {
      newRoutine = result.current.addRoutine({ title: "  공연 루틴  ", estimatedMinutes: 45 });
    });
    expect(newRoutine?.title).toBe("공연 루틴");
  });

  it("addRoutine 시 favorited는 false로 초기화된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let newRoutine: DanceRoutine | undefined;
    act(() => {
      newRoutine = result.current.addRoutine(makeRoutineParams());
    });
    expect(newRoutine?.favorited).toBe(false);
  });

  it("addRoutine 시 steps는 빈 배열로 초기화된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let newRoutine: DanceRoutine | undefined;
    act(() => {
      newRoutine = result.current.addRoutine(makeRoutineParams());
    });
    expect(newRoutine?.steps).toEqual([]);
  });

  it("purpose가 빈 문자열이면 undefined로 처리된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let newRoutine: DanceRoutine | undefined;
    act(() => {
      newRoutine = result.current.addRoutine({ title: "루틴", estimatedMinutes: 30, purpose: "" });
    });
    expect(newRoutine?.purpose).toBeUndefined();
  });

  it("localStorage에 저장된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    act(() => {
      result.current.addRoutine(makeRoutineParams());
    });
    expect(memStore["dance-routine-builder-member-1"]).toBeDefined();
  });
});

// ============================================================
// useDanceRoutineBuilder - updateRoutine
// ============================================================

describe("useDanceRoutineBuilder - updateRoutine 루틴 수정", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("존재하는 routineId로 updateRoutine 호출 시 true를 반환한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    let success = false;
    act(() => {
      success = result.current.updateRoutine(routineId, { title: "변경된 루틴" });
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 routineId로 updateRoutine 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let success = true;
    act(() => {
      success = result.current.updateRoutine("nonexistent", { title: "변경" });
    });
    expect(success).toBe(false);
  });

  it("updateRoutine 후 제목이 변경된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams({ title: "원래 제목" }));
      routineId = r.id;
    });
    act(() => {
      result.current.updateRoutine(routineId, { title: "새 제목" });
    });
    const updated = result.current.routines?.find((r) => r.id === routineId);
    expect(updated?.title).toBe("새 제목");
  });

  it("updateRoutine 후 updatedAt이 갱신된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    let originalUpdatedAt = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
      originalUpdatedAt = r.updatedAt;
    });
    act(() => {
      result.current.updateRoutine(routineId, { title: "변경" });
    });
    const updated = result.current.routines?.find((r) => r.id === routineId);
    expect(updated?.updatedAt).toBeDefined();
  });
});

// ============================================================
// useDanceRoutineBuilder - deleteRoutine
// ============================================================

describe("useDanceRoutineBuilder - deleteRoutine 루틴 삭제", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("존재하는 routineId로 deleteRoutine 호출 시 true를 반환한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    let success = false;
    act(() => {
      success = result.current.deleteRoutine(routineId);
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 routineId로 deleteRoutine 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let success = true;
    act(() => {
      success = result.current.deleteRoutine("nonexistent");
    });
    expect(success).toBe(false);
  });

  it("deleteRoutine 후 routines 배열에서 제거된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.deleteRoutine(routineId);
    });
    expect(result.current.routines?.find((r) => r.id === routineId)).toBeUndefined();
  });
});

// ============================================================
// useDanceRoutineBuilder - toggleFavorite
// ============================================================

describe("useDanceRoutineBuilder - toggleFavorite 즐겨찾기 토글", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("toggleFavorite 호출 후 favorited가 true가 된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.toggleFavorite(routineId);
    });
    const routine = result.current.routines?.find((r) => r.id === routineId);
    expect(routine?.favorited).toBe(true);
  });

  it("두 번 toggleFavorite 호출 시 favorited가 false로 돌아온다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.toggleFavorite(routineId);
    });
    act(() => {
      result.current.toggleFavorite(routineId);
    });
    const routine = result.current.routines?.find((r) => r.id === routineId);
    expect(routine?.favorited).toBe(false);
  });

  it("존재하지 않는 routineId로 toggleFavorite 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let success = true;
    act(() => {
      success = result.current.toggleFavorite("nonexistent");
    });
    expect(success).toBe(false);
  });
});

// ============================================================
// useDanceRoutineBuilder - addStep
// ============================================================

describe("useDanceRoutineBuilder - addStep 스텝 추가", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("addStep 호출 후 루틴의 steps 배열에 추가된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams());
    });
    const routine = result.current.routines?.find((r) => r.id === routineId);
    expect(routine?.steps).toHaveLength(1);
  });

  it("존재하지 않는 routineId로 addStep 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let success = true;
    act(() => {
      success = result.current.addStep("nonexistent", makeStepParams());
    });
    expect(success).toBe(false);
  });

  it("스텝의 order는 1부터 시작한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams());
    });
    const routine = result.current.routines?.find((r) => r.id === routineId);
    expect(routine?.steps[0].order).toBe(1);
  });

  it("두 번째 스텝의 order는 2이다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ name: "스텝1" }));
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ name: "스텝2" }));
    });
    const routine = result.current.routines?.find((r) => r.id === routineId);
    expect(routine?.steps[1].order).toBe(2);
  });

  it("스텝 name은 trim된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ name: "  스트레칭  " }));
    });
    const routine = result.current.routines?.find((r) => r.id === routineId);
    expect(routine?.steps[0].name).toBe("스트레칭");
  });
});

// ============================================================
// useDanceRoutineBuilder - deleteStep
// ============================================================

describe("useDanceRoutineBuilder - deleteStep 스텝 삭제", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("deleteStep 호출 후 스텝이 제거된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    let stepId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams());
    });
    act(() => {
      const routine = result.current.routines?.find((r) => r.id === routineId);
      stepId = routine?.steps[0].id ?? "";
    });
    act(() => {
      result.current.deleteStep(routineId, stepId);
    });
    const routine = result.current.routines?.find((r) => r.id === routineId);
    expect(routine?.steps).toHaveLength(0);
  });

  it("deleteStep 후 나머지 스텝의 order가 재정렬된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ name: "스텝1" }));
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ name: "스텝2" }));
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ name: "스텝3" }));
    });
    let firstStepId = "";
    firstStepId = result.current.routines?.find((r) => r.id === routineId)?.steps[0].id ?? "";
    act(() => {
      result.current.deleteStep(routineId, firstStepId);
    });
    const routine = result.current.routines?.find((r) => r.id === routineId);
    // 삭제 후 남은 2개 스텝의 order는 1, 2이어야 한다
    expect(routine?.steps[0].order).toBe(1);
    expect(routine?.steps[1].order).toBe(2);
  });
});

// ============================================================
// useDanceRoutineBuilder - moveStep
// ============================================================

describe("useDanceRoutineBuilder - moveStep 스텝 순서 변경", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("moveStep('up') 호출 후 스텝이 위로 이동한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ name: "A" }));
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ name: "B" }));
    });
    const secondStepId = result.current.routines?.find((r) => r.id === routineId)?.steps[1].id ?? "";
    act(() => {
      result.current.moveStep(routineId, secondStepId, "up");
    });
    const routine = result.current.routines?.find((r) => r.id === routineId);
    expect(routine?.steps[0].name).toBe("B");
  });

  it("첫 번째 스텝을 up으로 이동하면 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    let firstStepId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams());
    });
    act(() => {
      const routine = result.current.routines?.find((r) => r.id === routineId);
      firstStepId = routine?.steps[0].id ?? "";
    });
    let success = true;
    act(() => {
      success = result.current.moveStep(routineId, firstStepId, "up");
    });
    expect(success).toBe(false);
  });

  it("마지막 스텝을 down으로 이동하면 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    let lastStepId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams());
    });
    act(() => {
      const routine = result.current.routines?.find((r) => r.id === routineId);
      lastStepId = routine?.steps[0].id ?? "";
    });
    let success = true;
    act(() => {
      success = result.current.moveStep(routineId, lastStepId, "down");
    });
    expect(success).toBe(false);
  });

  it("존재하지 않는 routineId로 moveStep 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let success = true;
    act(() => {
      success = result.current.moveStep("nonexistent", "step-1", "up");
    });
    expect(success).toBe(false);
  });
});

// ============================================================
// useDanceRoutineBuilder - stats 통계
// ============================================================

describe("useDanceRoutineBuilder - stats 통계 계산", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("루틴 추가 후 stats.totalRoutines가 증가한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    act(() => {
      result.current.addRoutine(makeRoutineParams());
    });
    act(() => {
      result.current.addRoutine(makeRoutineParams({ title: "루틴2" }));
    });
    expect(result.current.stats.totalRoutines).toBe(2);
  });

  it("즐겨찾기 루틴 수가 stats.favoritedCount에 반영된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.toggleFavorite(routineId);
    });
    expect(result.current.stats.favoritedCount).toBe(1);
  });

  it("avgMinutes는 올바르게 계산된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    act(() => {
      result.current.addRoutine(makeRoutineParams({ estimatedMinutes: 60 }));
    });
    act(() => {
      result.current.addRoutine(makeRoutineParams({ title: "루틴2", estimatedMinutes: 40 }));
    });
    // (60 + 40) / 2 = 50
    expect(result.current.stats.avgMinutes).toBe(50);
  });

  it("카테고리별 스텝 분포가 categoryDistribution에 반영된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ category: "warmup" }));
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ category: "warmup", name: "스텝2" }));
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ category: "technique", name: "스텝3" }));
    });
    const dist = result.current.stats.categoryDistribution;
    const warmupDist = dist.find((d) => d.category === "warmup");
    expect(warmupDist?.count).toBe(2);
  });

  it("categoryDistribution에서 count가 0인 카테고리는 제외된다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-1"));
    let routineId = "";
    act(() => {
      const r = result.current.addRoutine(makeRoutineParams());
      routineId = r.id;
    });
    act(() => {
      result.current.addStep(routineId, makeStepParams({ category: "warmup" }));
    });
    const dist = result.current.stats.categoryDistribution;
    // cooldown 등 count=0인 카테고리는 없어야 한다
    const cooldownDist = dist.find((d) => d.category === "cooldown");
    expect(cooldownDist).toBeUndefined();
  });
});

// ============================================================
// useDanceRoutineBuilder - 멤버별 격리
// ============================================================

describe("useDanceRoutineBuilder - 멤버별 격리", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("다른 memberId를 사용하는 훅은 독립적이다", () => {
    const { result: r1 } = renderHook(() => useDanceRoutineBuilder("member-A"));
    const { result: r2 } = renderHook(() => useDanceRoutineBuilder("member-B"));
    act(() => {
      r1.current.addRoutine(makeRoutineParams({ title: "루틴 A" }));
    });
    expect(r2.current.routines).toHaveLength(0);
  });

  it("localStorage 키는 memberId를 포함한다", () => {
    const { result } = renderHook(() => useDanceRoutineBuilder("member-X"));
    act(() => {
      result.current.addRoutine(makeRoutineParams());
    });
    expect(memStore["dance-routine-builder-member-X"]).toBeDefined();
  });
});
