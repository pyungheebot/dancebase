/**
 * use-practice-goal-board 테스트
 *
 * 훅 내부의 순수 계산 로직을 독립 함수로 추출하여 검증합니다.
 * - 진행률 클램핑 (0~100)
 * - 진행률 100% 시 상태 자동 완료 전환
 * - 하위 목표 기반 진행률 자동 계산
 * - 상태 변경 시 진행률 자동 조정
 * - 통계 계산 (avg, completionRate)
 * - 그룹핑 로직
 */

import { describe, it, expect } from "vitest";
import type { PracticeGoalEntry, PracticeGoalStatus, PracticeGoalSubTask } from "@/types";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

/** 진행률 클램핑 (0~100) */
function clampProgress(progress: number): number {
  return Math.max(0, Math.min(100, progress));
}

/** 진행률 100% 시 상태 자동 완료 */
function progressToStatus(
  progress: number,
  currentStatus: PracticeGoalStatus
): PracticeGoalStatus {
  if (progress === 100) return "completed";
  return currentStatus;
}

/** status가 completed로 변경될 때 progress를 100으로 설정 */
function statusToProgress(
  status: PracticeGoalStatus,
  currentProgress: number
): number {
  if (status === "completed") return 100;
  return currentProgress;
}

/** 하위 목표 기반 진행률 자동 계산 */
function calcSubTaskProgress(
  subTasks: Array<{ done: boolean }>,
  currentProgress: number
): number {
  if (subTasks.length === 0) return currentProgress;
  const doneCount = subTasks.filter((s) => s.done).length;
  return Math.round((doneCount / subTasks.length) * 100);
}

/** 하위 목표 기반 상태 결정 */
function calcSubTaskStatus(
  autoProgress: number,
  currentStatus: PracticeGoalStatus
): PracticeGoalStatus {
  if (autoProgress === 100) return "completed";
  if (currentStatus === "completed") return "active";
  return currentStatus;
}

/** 통계: 평균 진행률 계산 */
function calcAvgProgress(entries: Array<{ progress: number }>): number {
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, e) => sum + e.progress, 0);
  return Math.round(total / entries.length);
}

/** 통계: 완료율 계산 */
function calcCompletionRate(
  total: number,
  completedCount: number
): number {
  if (total === 0) return 0;
  return Math.round((completedCount / total) * 100);
}

/** 상태별 그룹핑 */
function groupByStatus(entries: PracticeGoalEntry[]): {
  active: PracticeGoalEntry[];
  completed: PracticeGoalEntry[];
  paused: PracticeGoalEntry[];
} {
  return {
    active: entries.filter((e) => e.status === "active"),
    completed: entries.filter((e) => e.status === "completed"),
    paused: entries.filter((e) => e.status === "paused"),
  };
}

/** addGoal 유효성 검사 */
function isValidGoalTitle(title: string): boolean {
  return title.trim().length > 0;
}

/** addSubTask 유효성 검사 */
function isValidSubTaskTitle(title: string): boolean {
  return title.trim().length > 0;
}

// ============================================================
// 테스트용 더미 데이터 생성 헬퍼
// ============================================================

function makeEntry(
  overrides: Partial<PracticeGoalEntry> = {}
): PracticeGoalEntry {
  return {
    id: "test-id",
    title: "테스트 목표",
    description: undefined,
    category: "choreography",
    dueDate: undefined,
    progress: 0,
    status: "active",
    assignees: [],
    subTasks: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeSubTask(overrides: Partial<PracticeGoalSubTask> = {}): PracticeGoalSubTask {
  return {
    id: "sub-id",
    title: "하위 목표",
    done: false,
    ...overrides,
  };
}

// ============================================================
// 진행률 클램핑 테스트
// ============================================================

describe("진행률 클램핑 (0~100)", () => {
  it("0 미만은 0으로 클램핑된다", () => {
    expect(clampProgress(-10)).toBe(0);
  });

  it("100 초과는 100으로 클램핑된다", () => {
    expect(clampProgress(150)).toBe(100);
  });

  it("0은 0이다", () => {
    expect(clampProgress(0)).toBe(0);
  });

  it("100은 100이다", () => {
    expect(clampProgress(100)).toBe(100);
  });

  it("50은 50이다", () => {
    expect(clampProgress(50)).toBe(50);
  });

  it("-1은 0으로 클램핑된다", () => {
    expect(clampProgress(-1)).toBe(0);
  });

  it("101은 100으로 클램핑된다", () => {
    expect(clampProgress(101)).toBe(100);
  });
});

// ============================================================
// 진행률 100% 시 상태 자동 완료 전환 테스트
// ============================================================

describe("진행률에 따른 상태 자동 전환", () => {
  it("진행률 100이면 상태가 'completed'로 전환된다", () => {
    expect(progressToStatus(100, "active")).toBe("completed");
  });

  it("진행률 99이면 상태가 변경되지 않는다", () => {
    expect(progressToStatus(99, "active")).toBe("active");
  });

  it("진행률 0이면 상태가 변경되지 않는다", () => {
    expect(progressToStatus(0, "active")).toBe("active");
  });

  it("진행률 100이고 이미 'completed'면 'completed'를 유지한다", () => {
    expect(progressToStatus(100, "completed")).toBe("completed");
  });

  it("진행률 50이고 'paused'면 'paused'를 유지한다", () => {
    expect(progressToStatus(50, "paused")).toBe("paused");
  });
});

// ============================================================
// 상태 변경 시 진행률 자동 조정 테스트
// ============================================================

describe("상태 변경 시 진행률 자동 조정", () => {
  it("상태를 'completed'로 변경하면 진행률이 100이 된다", () => {
    expect(statusToProgress("completed", 50)).toBe(100);
  });

  it("상태를 'active'로 변경하면 진행률이 그대로 유지된다", () => {
    expect(statusToProgress("active", 50)).toBe(50);
  });

  it("상태를 'paused'로 변경하면 진행률이 그대로 유지된다", () => {
    expect(statusToProgress("paused", 70)).toBe(70);
  });

  it("상태를 'completed'로 변경하면 현재 진행률 0이어도 100이 된다", () => {
    expect(statusToProgress("completed", 0)).toBe(100);
  });
});

// ============================================================
// 하위 목표 기반 진행률 자동 계산 테스트
// ============================================================

describe("하위 목표 기반 진행률 자동 계산", () => {
  it("하위 목표가 없으면 현재 진행률을 그대로 반환한다", () => {
    expect(calcSubTaskProgress([], 75)).toBe(75);
  });

  it("하위 목표 전체 완료 시 진행률이 100이다", () => {
    const subs = [{ done: true }, { done: true }, { done: true }];
    expect(calcSubTaskProgress(subs, 0)).toBe(100);
  });

  it("하위 목표 전체 미완료 시 진행률이 0이다", () => {
    const subs = [{ done: false }, { done: false }, { done: false }];
    expect(calcSubTaskProgress(subs, 50)).toBe(0);
  });

  it("하위 목표 절반 완료 시 진행률이 50이다", () => {
    const subs = [{ done: true }, { done: false }];
    expect(calcSubTaskProgress(subs, 0)).toBe(50);
  });

  it("하위 목표 1/3 완료 시 진행률이 33이다", () => {
    const subs = [{ done: true }, { done: false }, { done: false }];
    expect(calcSubTaskProgress(subs, 0)).toBe(33);
  });

  it("하위 목표 2/3 완료 시 진행률이 67이다", () => {
    const subs = [{ done: true }, { done: true }, { done: false }];
    expect(calcSubTaskProgress(subs, 0)).toBe(67);
  });

  it("하위 목표 1개이고 완료 시 진행률이 100이다", () => {
    const subs = [{ done: true }];
    expect(calcSubTaskProgress(subs, 0)).toBe(100);
  });

  it("하위 목표 1개이고 미완료 시 진행률이 0이다", () => {
    const subs = [{ done: false }];
    expect(calcSubTaskProgress(subs, 0)).toBe(0);
  });
});

// ============================================================
// 하위 목표 기반 상태 결정 테스트
// ============================================================

describe("하위 목표 기반 상태 결정", () => {
  it("자동 계산 진행률이 100이면 'completed'가 된다", () => {
    expect(calcSubTaskStatus(100, "active")).toBe("completed");
  });

  it("자동 계산 진행률이 100이고 기존이 'paused'이면 'completed'가 된다", () => {
    expect(calcSubTaskStatus(100, "paused")).toBe("completed");
  });

  it("진행률 < 100이고 기존 상태가 'completed'이면 'active'로 복원된다", () => {
    expect(calcSubTaskStatus(50, "completed")).toBe("active");
  });

  it("진행률 < 100이고 기존 상태가 'active'이면 'active'를 유지한다", () => {
    expect(calcSubTaskStatus(50, "active")).toBe("active");
  });

  it("진행률 < 100이고 기존 상태가 'paused'이면 'paused'를 유지한다", () => {
    expect(calcSubTaskStatus(50, "paused")).toBe("paused");
  });

  it("진행률 0이고 기존 상태가 'active'이면 'active'를 유지한다", () => {
    expect(calcSubTaskStatus(0, "active")).toBe("active");
  });
});

// ============================================================
// 통계 계산 테스트
// ============================================================

describe("통계 - 평균 진행률 계산", () => {
  it("항목이 없으면 평균 진행률은 0이다", () => {
    expect(calcAvgProgress([])).toBe(0);
  });

  it("진행률 [0, 100]이면 평균은 50이다", () => {
    expect(calcAvgProgress([{ progress: 0 }, { progress: 100 }])).toBe(50);
  });

  it("진행률 [50, 50, 50]이면 평균은 50이다", () => {
    expect(
      calcAvgProgress([{ progress: 50 }, { progress: 50 }, { progress: 50 }])
    ).toBe(50);
  });

  it("진행률 [100, 100]이면 평균은 100이다", () => {
    expect(calcAvgProgress([{ progress: 100 }, { progress: 100 }])).toBe(100);
  });

  it("평균이 반올림된다 (33.33 → 33)", () => {
    expect(
      calcAvgProgress([{ progress: 0 }, { progress: 0 }, { progress: 100 }])
    ).toBe(33);
  });

  it("항목 1개이면 해당 진행률이 그대로 반환된다", () => {
    expect(calcAvgProgress([{ progress: 75 }])).toBe(75);
  });
});

describe("통계 - 완료율 계산", () => {
  it("항목이 없으면 완료율은 0이다", () => {
    expect(calcCompletionRate(0, 0)).toBe(0);
  });

  it("전체 완료이면 완료율은 100이다", () => {
    expect(calcCompletionRate(5, 5)).toBe(100);
  });

  it("아무도 완료하지 않으면 완료율은 0이다", () => {
    expect(calcCompletionRate(5, 0)).toBe(0);
  });

  it("절반 완료이면 완료율은 50이다", () => {
    expect(calcCompletionRate(4, 2)).toBe(50);
  });

  it("완료율이 반올림된다 (33.33 → 33)", () => {
    expect(calcCompletionRate(3, 1)).toBe(33);
  });
});

// ============================================================
// 상태별 그룹핑 테스트
// ============================================================

describe("상태별 그룹핑", () => {
  it("빈 항목 리스트면 모든 그룹이 비어 있다", () => {
    const result = groupByStatus([]);
    expect(result.active).toHaveLength(0);
    expect(result.completed).toHaveLength(0);
    expect(result.paused).toHaveLength(0);
  });

  it("'active' 항목만 active 그룹에 들어간다", () => {
    const entries = [
      makeEntry({ id: "1", status: "active" }),
      makeEntry({ id: "2", status: "completed" }),
    ];
    const result = groupByStatus(entries);
    expect(result.active).toHaveLength(1);
    expect(result.active[0]!.id).toBe("1");
  });

  it("'completed' 항목만 completed 그룹에 들어간다", () => {
    const entries = [
      makeEntry({ id: "1", status: "active" }),
      makeEntry({ id: "2", status: "completed" }),
    ];
    const result = groupByStatus(entries);
    expect(result.completed).toHaveLength(1);
    expect(result.completed[0]!.id).toBe("2");
  });

  it("'paused' 항목만 paused 그룹에 들어간다", () => {
    const entries = [
      makeEntry({ id: "1", status: "active" }),
      makeEntry({ id: "2", status: "paused" }),
    ];
    const result = groupByStatus(entries);
    expect(result.paused).toHaveLength(1);
    expect(result.paused[0]!.id).toBe("2");
  });

  it("혼합 상태의 항목들이 올바르게 분류된다", () => {
    const entries = [
      makeEntry({ id: "1", status: "active" }),
      makeEntry({ id: "2", status: "active" }),
      makeEntry({ id: "3", status: "completed" }),
      makeEntry({ id: "4", status: "paused" }),
    ];
    const result = groupByStatus(entries);
    expect(result.active).toHaveLength(2);
    expect(result.completed).toHaveLength(1);
    expect(result.paused).toHaveLength(1);
  });

  it("전체 항목이 그룹의 합과 일치한다", () => {
    const entries = [
      makeEntry({ id: "1", status: "active" }),
      makeEntry({ id: "2", status: "completed" }),
      makeEntry({ id: "3", status: "paused" }),
    ];
    const result = groupByStatus(entries);
    const total = result.active.length + result.completed.length + result.paused.length;
    expect(total).toBe(entries.length);
  });
});

// ============================================================
// 유효성 검사 테스트
// ============================================================

describe("목표 제목 유효성 검사", () => {
  it("빈 문자열은 유효하지 않다", () => {
    expect(isValidGoalTitle("")).toBe(false);
  });

  it("공백만 있는 문자열은 유효하지 않다", () => {
    expect(isValidGoalTitle("   ")).toBe(false);
  });

  it("일반 문자열은 유효하다", () => {
    expect(isValidGoalTitle("목표 제목")).toBe(true);
  });

  it("앞뒤 공백이 있어도 내용이 있으면 유효하다", () => {
    expect(isValidGoalTitle("  목표  ")).toBe(true);
  });

  it("단일 문자도 유효하다", () => {
    expect(isValidGoalTitle("A")).toBe(true);
  });
});

describe("하위 목표 제목 유효성 검사", () => {
  it("빈 문자열은 유효하지 않다", () => {
    expect(isValidSubTaskTitle("")).toBe(false);
  });

  it("공백만 있는 문자열은 유효하지 않다", () => {
    expect(isValidSubTaskTitle("  ")).toBe(false);
  });

  it("일반 문자열은 유효하다", () => {
    expect(isValidSubTaskTitle("하위 목표")).toBe(true);
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 목표 보드 상태 관리", () => {
  it("하위 목표 모두 완료 시 진행률 100 → 상태 'completed'로 자동 전환", () => {
    const subs = [
      makeSubTask({ done: true }),
      makeSubTask({ done: true }),
    ];
    const progress = calcSubTaskProgress(subs, 0);
    const status = calcSubTaskStatus(progress, "active");
    expect(progress).toBe(100);
    expect(status).toBe("completed");
  });

  it("하위 목표 하나 미완료 시 진행률 < 100 → 상태 유지", () => {
    const subs = [
      makeSubTask({ done: true }),
      makeSubTask({ done: false }),
    ];
    const progress = calcSubTaskProgress(subs, 0);
    const status = calcSubTaskStatus(progress, "active");
    expect(progress).toBe(50);
    expect(status).toBe("active");
  });

  it("진행률을 직접 100으로 설정하면 상태가 'completed'가 된다", () => {
    const progress = clampProgress(100);
    const status = progressToStatus(progress, "active");
    expect(progress).toBe(100);
    expect(status).toBe("completed");
  });

  it("진행률을 110으로 설정하면 100으로 클램핑되고 상태가 'completed'가 된다", () => {
    const progress = clampProgress(110);
    const status = progressToStatus(progress, "active");
    expect(progress).toBe(100);
    expect(status).toBe("completed");
  });

  it("완료된 목표의 하위 목표를 미완료로 전환하면 상태가 'active'로 복원된다", () => {
    const subs = [
      makeSubTask({ done: true }),
      makeSubTask({ done: false }), // 하나 취소
    ];
    const progress = calcSubTaskProgress(subs, 100);
    const status = calcSubTaskStatus(progress, "completed");
    expect(progress).toBe(50);
    expect(status).toBe("active");
  });

  it("10개 항목 중 4개 완료이면 완료율 40%이다", () => {
    const entries = [
      ...Array(4).fill(null).map((_, i) => makeEntry({ id: `c${i}`, status: "completed", progress: 100 })),
      ...Array(6).fill(null).map((_, i) => makeEntry({ id: `a${i}`, status: "active", progress: 50 })),
    ];
    const grouped = groupByStatus(entries);
    const rate = calcCompletionRate(entries.length, grouped.completed.length);
    expect(rate).toBe(40);
  });
});
