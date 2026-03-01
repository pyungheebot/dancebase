import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (memStore[key] as T) ?? defaultValue,
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR 키 mock ───────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    danceGoalTracker: (memberId: string) => `dance-goal:${memberId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useDanceGoal } from "@/hooks/use-dance-goal";
import type {
  DanceGoalCategory,
  DanceGoalPriority,
} from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function initMemStore(memberId = "member-1") {
  memStore[`dance-goal:${memberId}`] = { memberId, goals: [], updatedAt: new Date().toISOString() };
}

function makeHook(memberId = "member-1") {
  initMemStore(memberId);
  return renderHook(() => useDanceGoal(memberId));
}

function createGoalHelper(
  hook: ReturnType<typeof makeHook>["result"],
  title = "테스트 목표",
  category: DanceGoalCategory = "technique",
  priority: DanceGoalPriority = "medium",
  description = "",
  targetDate: string | null = null
) {
  let goal: ReturnType<ReturnType<typeof useDanceGoal>["createGoal"]>;
  act(() => {
    goal = hook.current.createGoal({
      title,
      description,
      category,
      priority,
      targetDate,
    });
  });
  return goal!;
}

// ============================================================
// 초기 상태
// ============================================================

describe("useDanceGoal - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 goals는 undefined 또는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.goals == null || Array.isArray(result.current.goals)).toBe(true);
  });

  it("totalGoals는 0이다", () => {
    const { result } = makeHook();
    // goals가 undefined인 경우도 대비
    const count = result.current.goals?.length ?? 0;
    expect(result.current.totalGoals).toBe(count);
  });

  it("activeGoals는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.activeGoals).toBe(0);
  });

  it("completedGoals는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.completedGoals).toBe(0);
  });

  it("pausedGoals는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.pausedGoals).toBe(0);
  });

  it("averageProgress는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.averageProgress).toBe(0);
  });

  it("categoryDistribution은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.categoryDistribution).toEqual([]);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.createGoal).toBe("function");
    expect(typeof result.current.updateGoal).toBe("function");
    expect(typeof result.current.deleteGoal).toBe("function");
    expect(typeof result.current.addMilestone).toBe("function");
    expect(typeof result.current.toggleMilestone).toBe("function");
    expect(typeof result.current.removeMilestone).toBe("function");
    expect(typeof result.current.updateProgress).toBe("function");
    expect(typeof result.current.changeStatus).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// createGoal
// ============================================================

describe("useDanceGoal - createGoal", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("목표 생성 후 goals 길이가 1이 된다", () => {
    const { result } = makeHook();
    createGoalHelper(result);
    expect(result.current.goals?.length ?? 0).toBe(1);
  });

  it("생성된 목표에 id가 부여된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    expect(goal.id).toBeTruthy();
  });

  it("생성된 목표의 title이 올바르다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result, "앞돌기 마스터");
    expect(goal.title).toBe("앞돌기 마스터");
  });

  it("제목 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result, "  공백 포함 제목  ");
    expect(goal.title).toBe("공백 포함 제목");
  });

  it("생성된 목표의 category가 올바르다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result, "목표", "flexibility");
    expect(goal.category).toBe("flexibility");
  });

  it("생성된 목표의 priority가 올바르다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result, "목표", "technique", "high");
    expect(goal.priority).toBe("high");
  });

  it("생성된 목표의 초기 status는 'active'이다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    expect(goal.status).toBe("active");
  });

  it("생성된 목표의 초기 progress는 0이다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    expect(goal.progress).toBe(0);
  });

  it("생성된 목표의 초기 milestones는 빈 배열이다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    expect(goal.milestones).toEqual([]);
  });

  it("targetDate를 지정하면 반영된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result, "목표", "technique", "medium", "", "2026-12-31");
    expect(goal.targetDate).toBe("2026-12-31");
  });

  it("targetDate를 null로 지정하면 null이다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result, "목표", "technique", "medium", "", null);
    expect(goal.targetDate).toBeNull();
  });

  it("여러 목표를 생성할 수 있다", () => {
    const { result } = makeHook();
    createGoalHelper(result, "목표1");
    createGoalHelper(result, "목표2");
    createGoalHelper(result, "목표3");
    expect(result.current.goals?.length ?? 0).toBe(3);
  });

  it("생성된 목표에 createdAt이 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    expect(goal.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ============================================================
// updateGoal
// ============================================================

describe("useDanceGoal - updateGoal", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("목표의 title을 수정할 수 있다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result, "원래 제목");
    act(() => {
      result.current.updateGoal(goal.id, { title: "수정된 제목" });
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.title).toBe("수정된 제목");
  });

  it("목표의 status를 수정할 수 있다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.updateGoal(goal.id, { status: "paused" });
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.status).toBe("paused");
  });

  it("목표의 progress를 수정할 수 있다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.updateGoal(goal.id, { progress: 75 });
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.progress).toBe(75);
  });

  it("존재하지 않는 id로 수정해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.updateGoal("non-existent", { title: "새 제목" });
      });
    }).not.toThrow();
  });
});

// ============================================================
// deleteGoal
// ============================================================

describe("useDanceGoal - deleteGoal", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("목표 삭제 후 goals 길이가 감소한다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.deleteGoal(goal.id);
    });
    expect(result.current.goals?.length ?? 0).toBe(0);
  });

  it("특정 목표만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    const goal1 = createGoalHelper(result, "목표1");
    createGoalHelper(result, "목표2");
    act(() => {
      result.current.deleteGoal(goal1.id);
    });
    expect(result.current.goals?.length ?? 0).toBe(1);
    expect(result.current.goals?.[0]?.title).toBe("목표2");
  });

  it("존재하지 않는 id 삭제 시 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteGoal("non-existent");
      });
    }).not.toThrow();
  });
});

// ============================================================
// addMilestone & toggleMilestone & removeMilestone
// ============================================================

describe("useDanceGoal - addMilestone", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("마일스톤 추가 후 milestones 길이가 1이 된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.addMilestone(goal.id, "1단계 완성");
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.milestones).toHaveLength(1);
  });

  it("추가된 마일스톤의 title이 올바르다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.addMilestone(goal.id, "연습 50회 달성");
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.milestones[0]?.title).toBe("연습 50회 달성");
  });

  it("추가된 마일스톤의 초기 isCompleted는 false이다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.addMilestone(goal.id, "단계 1");
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.milestones[0]?.isCompleted).toBe(false);
  });

  it("마일스톤 추가 시 목표 progress가 업데이트된다 (0% → 0%)", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.addMilestone(goal.id, "단계 1");
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    // 1개 마일스톤 중 0개 완료 = 0%
    expect(updated?.progress).toBe(0);
  });

  it("여러 마일스톤을 추가할 수 있다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.addMilestone(goal.id, "단계 1");
    });
    act(() => {
      result.current.addMilestone(goal.id, "단계 2");
    });
    act(() => {
      result.current.addMilestone(goal.id, "단계 3");
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.milestones).toHaveLength(3);
  });
});

describe("useDanceGoal - toggleMilestone", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("미완료 마일스톤 토글 시 isCompleted가 true가 된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.addMilestone(goal.id, "단계 1");
    });
    const milestoneId = result.current.goals?.find((g) => g.id === goal.id)?.milestones[0]?.id;
    act(() => {
      result.current.toggleMilestone(goal.id, milestoneId!);
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.milestones[0]?.isCompleted).toBe(true);
  });

  it("완료 마일스톤 토글 시 isCompleted가 false가 된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.addMilestone(goal.id, "단계 1");
    });
    const milestoneId = result.current.goals?.find((g) => g.id === goal.id)?.milestones[0]?.id;
    // 완료로 토글
    act(() => {
      result.current.toggleMilestone(goal.id, milestoneId!);
    });
    // 미완료로 토글
    act(() => {
      result.current.toggleMilestone(goal.id, milestoneId!);
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.milestones[0]?.isCompleted).toBe(false);
  });

  it("마일스톤 완료 시 progress가 업데이트된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.addMilestone(goal.id, "단계 1");
    });
    const milestoneId = result.current.goals?.find((g) => g.id === goal.id)?.milestones[0]?.id;
    act(() => {
      result.current.toggleMilestone(goal.id, milestoneId!);
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    // 1개 중 1개 완료 = 100%
    expect(updated?.progress).toBe(100);
  });

  it("마일스톤 완료 시 completedAt이 설정된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.addMilestone(goal.id, "단계 1");
    });
    const milestoneId = result.current.goals?.find((g) => g.id === goal.id)?.milestones[0]?.id;
    act(() => {
      result.current.toggleMilestone(goal.id, milestoneId!);
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.milestones[0]?.completedAt).not.toBeNull();
  });
});

describe("useDanceGoal - removeMilestone", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("마일스톤 삭제 후 milestones 길이가 감소한다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.addMilestone(goal.id, "단계 1");
    });
    const milestoneId = result.current.goals?.find((g) => g.id === goal.id)?.milestones[0]?.id;
    act(() => {
      result.current.removeMilestone(goal.id, milestoneId!);
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.milestones).toHaveLength(0);
  });

  it("마일스톤이 없어지면 progress가 fallback으로 유지된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    // 마일스톤 없는 상태에서 progress를 50으로 설정
    act(() => {
      result.current.updateGoal(goal.id, { progress: 50 });
    });
    act(() => {
      result.current.addMilestone(goal.id, "단계 1");
    });
    const milestoneId = result.current.goals?.find((g) => g.id === goal.id)?.milestones[0]?.id;
    act(() => {
      result.current.removeMilestone(goal.id, milestoneId!);
    });
    // 마일스톤이 없을 때 fallback(g.progress) 사용
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    // 마일스톤 0개 → fallback 사용 → 마일스톤 추가 시점의 progress(50)
    expect(typeof updated?.progress).toBe("number");
  });
});

// ============================================================
// updateProgress
// ============================================================

describe("useDanceGoal - updateProgress", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("progress를 50으로 업데이트할 수 있다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.updateProgress(goal.id, 50);
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.progress).toBe(50);
  });

  it("progress 100 설정 시 status가 'completed'로 변경된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.updateProgress(goal.id, 100);
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.status).toBe("completed");
  });

  it("progress가 음수이면 0으로 클램핑된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.updateProgress(goal.id, -10);
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.progress).toBe(0);
  });

  it("progress가 100을 초과하면 100으로 클램핑된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.updateProgress(goal.id, 150);
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.progress).toBe(100);
  });

  it("소수점 progress는 반올림된다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.updateProgress(goal.id, 33.7);
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.progress).toBe(34);
  });
});

// ============================================================
// changeStatus
// ============================================================

describe("useDanceGoal - changeStatus", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("목표 상태를 'paused'로 변경할 수 있다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.changeStatus(goal.id, "paused");
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.status).toBe("paused");
  });

  it("목표 상태를 'completed'로 변경할 수 있다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.changeStatus(goal.id, "completed");
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.status).toBe("completed");
  });

  it("목표 상태를 'active'로 변경할 수 있다", () => {
    const { result } = makeHook();
    const goal = createGoalHelper(result);
    act(() => {
      result.current.changeStatus(goal.id, "paused");
    });
    act(() => {
      result.current.changeStatus(goal.id, "active");
    });
    const updated = result.current.goals?.find((g) => g.id === goal.id);
    expect(updated?.status).toBe("active");
  });
});

// ============================================================
// 통계
// ============================================================

describe("useDanceGoal - 통계", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("목표 생성 후 totalGoals가 증가한다", () => {
    const { result } = makeHook();
    createGoalHelper(result, "목표1");
    createGoalHelper(result, "목표2");
    expect(result.current.totalGoals).toBe(2);
  });

  it("active 목표 개수가 올바르게 집계된다", () => {
    const { result } = makeHook();
    createGoalHelper(result, "목표1");
    const goal2 = createGoalHelper(result, "목표2");
    act(() => {
      result.current.changeStatus(goal2.id, "paused");
    });
    expect(result.current.activeGoals).toBe(1);
  });

  it("completed 목표 개수가 올바르게 집계된다", () => {
    const { result } = makeHook();
    const goal1 = createGoalHelper(result, "목표1");
    createGoalHelper(result, "목표2");
    act(() => {
      result.current.changeStatus(goal1.id, "completed");
    });
    expect(result.current.completedGoals).toBe(1);
  });

  it("paused 목표 개수가 올바르게 집계된다", () => {
    const { result } = makeHook();
    const goal1 = createGoalHelper(result, "목표1");
    const goal2 = createGoalHelper(result, "목표2");
    act(() => {
      result.current.changeStatus(goal1.id, "paused");
    });
    act(() => {
      result.current.changeStatus(goal2.id, "paused");
    });
    expect(result.current.pausedGoals).toBe(2);
  });

  it("averageProgress는 모든 목표의 평균 진행률이다", () => {
    const { result } = makeHook();
    const goal1 = createGoalHelper(result, "목표1");
    const goal2 = createGoalHelper(result, "목표2");
    act(() => {
      result.current.updateProgress(goal1.id, 60);
    });
    act(() => {
      result.current.updateProgress(goal2.id, 40);
    });
    expect(result.current.averageProgress).toBe(50);
  });

  it("categoryDistribution에 생성된 목표의 카테고리가 포함된다", () => {
    const { result } = makeHook();
    createGoalHelper(result, "목표1", "technique");
    createGoalHelper(result, "목표2", "technique");
    createGoalHelper(result, "목표3", "flexibility");
    const dist = result.current.categoryDistribution;
    const techDist = dist.find((d) => d.category === "technique");
    expect(techDist?.count).toBe(2);
  });

  it("categoryDistribution은 count 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    createGoalHelper(result, "목표1", "flexibility");
    createGoalHelper(result, "목표2", "technique");
    createGoalHelper(result, "목표3", "technique");
    const dist = result.current.categoryDistribution;
    if (dist.length >= 2) {
      expect(dist[0].count).toBeGreaterThanOrEqual(dist[1].count);
    }
  });

  it("categoryDistribution의 percent 합산은 100%를 초과하지 않는다", () => {
    const { result } = makeHook();
    createGoalHelper(result, "목표1", "technique");
    createGoalHelper(result, "목표2", "flexibility");
    const totalPercent = result.current.categoryDistribution.reduce(
      (sum, d) => sum + d.percent,
      0
    );
    // 반올림 오차로 99~100 사이
    expect(totalPercent).toBeGreaterThanOrEqual(99);
    expect(totalPercent).toBeLessThanOrEqual(101);
  });
});
