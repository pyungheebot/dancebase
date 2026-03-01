/**
 * use-stage-transition 테스트
 *
 * 훅 내부의 순수 계산 로직을 독립 함수로 추출하여 검증합니다.
 * - 항목 추가 (addItem)
 * - 항목 수정 (updateItem)
 * - 항목 삭제 (deleteItem) - 삭제 후 order 재정렬
 * - 연습 완료 토글 (toggleRehearsed)
 * - 순서 이동 (moveItem) - 위/아래, 경계값
 * - 할 일 추가 (addTask)
 * - 할 일 완료 토글 (toggleTask)
 * - 할 일 삭제 (deleteTask)
 * - 통계 계산 (stats)
 * - localStorage 키 형식
 */

import { describe, it, expect } from "vitest";
import type {
  StageTransitionItem,
  StageTransitionTask,
  StageTransitionType,
} from "@/types";

// ============================================================
// 훅 내부 순수 함수 재현
// ============================================================

/** localStorage 키 형식 (swrKeys.stageTransitionPlan과 동일) */
function lsKey(projectId: string): string {
  return `stage-transition-plan-${projectId}`;
}

/** 항목 빌더 */
function makeItem(overrides: Partial<StageTransitionItem> = {}): StageTransitionItem {
  return {
    id: "item-1",
    order: 1,
    fromScene: "장면1",
    toScene: "장면2",
    durationSec: 30,
    transitionType: "blackout",
    tasks: [],
    assignedStaff: "스태프A",
    rehearsed: false,
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** 태스크 빌더 */
function makeTask(overrides: Partial<StageTransitionTask> = {}): StageTransitionTask {
  return {
    id: "task-1",
    text: "준비 작업",
    done: false,
    ...overrides,
  };
}

/** addItem - maxOrder + 1 */
function addItemToList(
  items: StageTransitionItem[],
  params: {
    fromScene: string;
    toScene: string;
    durationSec: number;
    transitionType: StageTransitionType;
    assignedStaff: string;
    notes: string;
  }
): StageTransitionItem {
  const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) : 0;
  const newItem: StageTransitionItem = {
    id: crypto.randomUUID(),
    order: maxOrder + 1,
    fromScene: params.fromScene,
    toScene: params.toScene,
    durationSec: params.durationSec,
    transitionType: params.transitionType,
    tasks: [],
    assignedStaff: params.assignedStaff,
    rehearsed: false,
    notes: params.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return newItem;
}

/** updateItem */
function updateItemInList(
  items: StageTransitionItem[],
  itemId: string,
  params: Partial<Omit<StageTransitionItem, "id" | "createdAt">>
): { updated: StageTransitionItem[]; success: boolean } {
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) return { updated: items, success: false };
  const updated = items.map((i) =>
    i.id === itemId ? { ...i, ...params, updatedAt: new Date().toISOString() } : i
  );
  return { updated, success: true };
}

/** deleteItem - 삭제 후 order 재정렬 */
function deleteItemFromList(
  items: StageTransitionItem[],
  itemId: string
): { updated: StageTransitionItem[]; success: boolean } {
  const exists = items.some((i) => i.id === itemId);
  if (!exists) return { updated: items, success: false };
  const filtered = items
    .filter((i) => i.id !== itemId)
    .map((i, idx) => ({ ...i, order: idx + 1 }));
  return { updated: filtered, success: true };
}

/** toggleRehearsed */
function toggleRehearsedInList(
  items: StageTransitionItem[],
  itemId: string
): { updated: StageTransitionItem[]; success: boolean } {
  const item = items.find((i) => i.id === itemId);
  if (!item) return { updated: items, success: false };
  return updateItemInList(items, itemId, { rehearsed: !item.rehearsed });
}

/** moveItem */
function moveItemInList(
  items: StageTransitionItem[],
  itemId: string,
  direction: "up" | "down"
): { updated: StageTransitionItem[]; success: boolean } {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((i) => i.id === itemId);
  if (idx === -1) return { updated: items, success: false };
  if (direction === "up" && idx === 0) return { updated: items, success: false };
  if (direction === "down" && idx === sorted.length - 1)
    return { updated: items, success: false };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  const newSorted = [...sorted];
  const tempOrder = newSorted[idx]!.order;
  newSorted[idx] = { ...newSorted[idx]!, order: newSorted[swapIdx]!.order };
  newSorted[swapIdx] = { ...newSorted[swapIdx]!, order: tempOrder };
  return { updated: newSorted, success: true };
}

/** addTask */
function addTaskToItem(
  items: StageTransitionItem[],
  itemId: string,
  text: string
): { updated: StageTransitionItem[]; success: boolean } {
  const item = items.find((i) => i.id === itemId);
  if (!item) return { updated: items, success: false };
  const newTask: StageTransitionTask = {
    id: crypto.randomUUID(),
    text,
    done: false,
  };
  return updateItemInList(items, itemId, { tasks: [...item.tasks, newTask] });
}

/** toggleTask */
function toggleTaskInItem(
  items: StageTransitionItem[],
  itemId: string,
  taskId: string
): { updated: StageTransitionItem[]; success: boolean } {
  const item = items.find((i) => i.id === itemId);
  if (!item) return { updated: items, success: false };
  const updatedTasks = item.tasks.map((t) =>
    t.id === taskId ? { ...t, done: !t.done } : t
  );
  return updateItemInList(items, itemId, { tasks: updatedTasks });
}

/** deleteTask */
function deleteTaskFromItem(
  items: StageTransitionItem[],
  itemId: string,
  taskId: string
): { updated: StageTransitionItem[]; success: boolean } {
  const item = items.find((i) => i.id === itemId);
  if (!item) return { updated: items, success: false };
  const updatedTasks = item.tasks.filter((t) => t.id !== taskId);
  return updateItemInList(items, itemId, { tasks: updatedTasks });
}

/** 통계 계산 */
function calcStats(items: StageTransitionItem[]) {
  if (items.length === 0) {
    return {
      total: 0,
      totalDurationSec: 0,
      unrehearsedCount: 0,
      rehearsedCount: 0,
      avgDurationSec: 0,
    };
  }
  const totalDurationSec = items.reduce((acc, i) => acc + i.durationSec, 0);
  const rehearsedCount = items.filter((i) => i.rehearsed).length;
  const unrehearsedCount = items.length - rehearsedCount;
  const avgDurationSec = Math.round((totalDurationSec / items.length) * 10) / 10;
  return {
    total: items.length,
    totalDurationSec,
    unrehearsedCount,
    rehearsedCount,
    avgDurationSec,
  };
}

// ============================================================
// 1. localStorage 키 형식
// ============================================================

describe("localStorage 키 형식", () => {
  it("키는 'stage-transition-plan-{projectId}' 형식이다", () => {
    expect(lsKey("proj-1")).toBe("stage-transition-plan-proj-1");
  });

  it("프로젝트 ID가 다르면 키가 달라진다", () => {
    expect(lsKey("p1")).not.toBe(lsKey("p2"));
  });
});

// ============================================================
// 2. addItem
// ============================================================

describe("addItem", () => {
  it("빈 목록에서 추가하면 order는 1이다", () => {
    const newItem = addItemToList([], {
      fromScene: "A",
      toScene: "B",
      durationSec: 10,
      transitionType: "blackout",
      assignedStaff: "S1",
      notes: "",
    });
    expect(newItem.order).toBe(1);
  });

  it("기존 항목이 있으면 order는 maxOrder + 1이다", () => {
    const items = [makeItem({ order: 3 }), makeItem({ id: "i2", order: 1 })];
    const newItem = addItemToList(items, {
      fromScene: "C",
      toScene: "D",
      durationSec: 20,
      transitionType: "curtain",
      assignedStaff: "S2",
      notes: "메모",
    });
    expect(newItem.order).toBe(4);
  });

  it("새 항목의 rehearsed는 false이다", () => {
    const newItem = addItemToList([], {
      fromScene: "A",
      toScene: "B",
      durationSec: 10,
      transitionType: "blackout",
      assignedStaff: "S1",
      notes: "",
    });
    expect(newItem.rehearsed).toBe(false);
  });

  it("새 항목의 tasks는 빈 배열이다", () => {
    const newItem = addItemToList([], {
      fromScene: "A",
      toScene: "B",
      durationSec: 10,
      transitionType: "light_fade",
      assignedStaff: "S1",
      notes: "",
    });
    expect(newItem.tasks).toEqual([]);
  });

  it("fromScene, toScene, durationSec이 올바르게 설정된다", () => {
    const newItem = addItemToList([], {
      fromScene: "1막",
      toScene: "2막",
      durationSec: 45,
      transitionType: "costume_change",
      assignedStaff: "소품팀",
      notes: "의상 교체 필요",
    });
    expect(newItem.fromScene).toBe("1막");
    expect(newItem.toScene).toBe("2막");
    expect(newItem.durationSec).toBe(45);
  });
});

// ============================================================
// 3. updateItem
// ============================================================

describe("updateItem", () => {
  it("존재하는 항목을 수정하면 success는 true이다", () => {
    const items = [makeItem({ id: "i1" })];
    const { success } = updateItemInList(items, "i1", { durationSec: 60 });
    expect(success).toBe(true);
  });

  it("존재하지 않는 항목 수정은 success가 false이다", () => {
    const items = [makeItem({ id: "i1" })];
    const { success } = updateItemInList(items, "nonexistent", { durationSec: 60 });
    expect(success).toBe(false);
  });

  it("durationSec가 올바르게 수정된다", () => {
    const items = [makeItem({ id: "i1", durationSec: 30 })];
    const { updated } = updateItemInList(items, "i1", { durationSec: 90 });
    expect(updated.find((i) => i.id === "i1")!.durationSec).toBe(90);
  });

  it("notes가 올바르게 수정된다", () => {
    const items = [makeItem({ id: "i1", notes: "기존 메모" })];
    const { updated } = updateItemInList(items, "i1", { notes: "새 메모" });
    expect(updated.find((i) => i.id === "i1")!.notes).toBe("새 메모");
  });
});

// ============================================================
// 4. deleteItem
// ============================================================

describe("deleteItem", () => {
  it("존재하는 항목 삭제는 success가 true이다", () => {
    const items = [makeItem({ id: "i1" })];
    const { success } = deleteItemFromList(items, "i1");
    expect(success).toBe(true);
  });

  it("삭제 후 목록에서 제거된다", () => {
    const items = [makeItem({ id: "i1" }), makeItem({ id: "i2", order: 2 })];
    const { updated } = deleteItemFromList(items, "i1");
    expect(updated.some((i) => i.id === "i1")).toBe(false);
  });

  it("삭제 후 order가 1부터 재정렬된다", () => {
    const items = [
      makeItem({ id: "i1", order: 1 }),
      makeItem({ id: "i2", order: 2 }),
      makeItem({ id: "i3", order: 3 }),
    ];
    const { updated } = deleteItemFromList(items, "i1");
    const sorted = [...updated].sort((a, b) => a.order - b.order);
    expect(sorted[0]!.order).toBe(1);
    expect(sorted[1]!.order).toBe(2);
  });

  it("존재하지 않는 항목 삭제는 success가 false이다", () => {
    const items = [makeItem({ id: "i1" })];
    const { success } = deleteItemFromList(items, "nonexistent");
    expect(success).toBe(false);
  });

  it("빈 목록에서 삭제는 success가 false이다", () => {
    const { success } = deleteItemFromList([], "i1");
    expect(success).toBe(false);
  });
});

// ============================================================
// 5. toggleRehearsed
// ============================================================

describe("toggleRehearsed", () => {
  it("rehearsed가 false이면 true로 전환된다", () => {
    const items = [makeItem({ id: "i1", rehearsed: false })];
    const { updated } = toggleRehearsedInList(items, "i1");
    expect(updated.find((i) => i.id === "i1")!.rehearsed).toBe(true);
  });

  it("rehearsed가 true이면 false로 전환된다", () => {
    const items = [makeItem({ id: "i1", rehearsed: true })];
    const { updated } = toggleRehearsedInList(items, "i1");
    expect(updated.find((i) => i.id === "i1")!.rehearsed).toBe(false);
  });

  it("존재하지 않는 항목 토글은 success가 false이다", () => {
    const items = [makeItem({ id: "i1" })];
    const { success } = toggleRehearsedInList(items, "nonexistent");
    expect(success).toBe(false);
  });
});

// ============================================================
// 6. moveItem
// ============================================================

describe("moveItem", () => {
  it("첫 번째 항목을 위로 이동하면 success가 false이다 (경계값)", () => {
    const items = [
      makeItem({ id: "i1", order: 1 }),
      makeItem({ id: "i2", order: 2 }),
    ];
    const { success } = moveItemInList(items, "i1", "up");
    expect(success).toBe(false);
  });

  it("마지막 항목을 아래로 이동하면 success가 false이다 (경계값)", () => {
    const items = [
      makeItem({ id: "i1", order: 1 }),
      makeItem({ id: "i2", order: 2 }),
    ];
    const { success } = moveItemInList(items, "i2", "down");
    expect(success).toBe(false);
  });

  it("두 번째 항목을 위로 이동하면 order가 교환된다", () => {
    const items = [
      makeItem({ id: "i1", order: 1 }),
      makeItem({ id: "i2", order: 2 }),
    ];
    const { updated, success } = moveItemInList(items, "i2", "up");
    expect(success).toBe(true);
    expect(updated.find((i) => i.id === "i2")!.order).toBe(1);
    expect(updated.find((i) => i.id === "i1")!.order).toBe(2);
  });

  it("첫 번째 항목을 아래로 이동하면 order가 교환된다", () => {
    const items = [
      makeItem({ id: "i1", order: 1 }),
      makeItem({ id: "i2", order: 2 }),
    ];
    const { updated, success } = moveItemInList(items, "i1", "down");
    expect(success).toBe(true);
    expect(updated.find((i) => i.id === "i1")!.order).toBe(2);
    expect(updated.find((i) => i.id === "i2")!.order).toBe(1);
  });

  it("존재하지 않는 항목 이동은 success가 false이다", () => {
    const items = [makeItem({ id: "i1", order: 1 })];
    const { success } = moveItemInList(items, "nonexistent", "up");
    expect(success).toBe(false);
  });

  it("항목이 1개일 때 위/아래 이동 모두 실패한다", () => {
    const items = [makeItem({ id: "i1", order: 1 })];
    expect(moveItemInList(items, "i1", "up").success).toBe(false);
    expect(moveItemInList(items, "i1", "down").success).toBe(false);
  });
});

// ============================================================
// 7. addTask
// ============================================================

describe("addTask", () => {
  it("태스크를 추가하면 tasks 길이가 1 증가한다", () => {
    const items = [makeItem({ id: "i1", tasks: [] })];
    const { updated } = addTaskToItem(items, "i1", "준비");
    expect(updated.find((i) => i.id === "i1")!.tasks).toHaveLength(1);
  });

  it("새 태스크의 done은 false이다", () => {
    const items = [makeItem({ id: "i1", tasks: [] })];
    const { updated } = addTaskToItem(items, "i1", "준비");
    expect(updated.find((i) => i.id === "i1")!.tasks[0]!.done).toBe(false);
  });

  it("존재하지 않는 항목에 태스크 추가는 success가 false이다", () => {
    const items = [makeItem({ id: "i1" })];
    const { success } = addTaskToItem(items, "nonexistent", "준비");
    expect(success).toBe(false);
  });

  it("여러 태스크를 추가할 수 있다", () => {
    let items = [makeItem({ id: "i1", tasks: [] })];
    items = addTaskToItem(items, "i1", "태스크1").updated;
    items = addTaskToItem(items, "i1", "태스크2").updated;
    expect(items.find((i) => i.id === "i1")!.tasks).toHaveLength(2);
  });
});

// ============================================================
// 8. toggleTask
// ============================================================

describe("toggleTask", () => {
  it("done이 false인 태스크를 토글하면 true가 된다", () => {
    const task = makeTask({ id: "t1", done: false });
    const items = [makeItem({ id: "i1", tasks: [task] })];
    const { updated } = toggleTaskInItem(items, "i1", "t1");
    expect(updated.find((i) => i.id === "i1")!.tasks[0]!.done).toBe(true);
  });

  it("done이 true인 태스크를 토글하면 false가 된다", () => {
    const task = makeTask({ id: "t1", done: true });
    const items = [makeItem({ id: "i1", tasks: [task] })];
    const { updated } = toggleTaskInItem(items, "i1", "t1");
    expect(updated.find((i) => i.id === "i1")!.tasks[0]!.done).toBe(false);
  });

  it("존재하지 않는 항목이면 success가 false이다", () => {
    const items = [makeItem({ id: "i1" })];
    const { success } = toggleTaskInItem(items, "nonexistent", "t1");
    expect(success).toBe(false);
  });
});

// ============================================================
// 9. deleteTask
// ============================================================

describe("deleteTask", () => {
  it("태스크 삭제 후 tasks 길이가 1 감소한다", () => {
    const task = makeTask({ id: "t1" });
    const items = [makeItem({ id: "i1", tasks: [task] })];
    const { updated } = deleteTaskFromItem(items, "i1", "t1");
    expect(updated.find((i) => i.id === "i1")!.tasks).toHaveLength(0);
  });

  it("존재하지 않는 항목이면 success가 false이다", () => {
    const items = [makeItem({ id: "i1" })];
    const { success } = deleteTaskFromItem(items, "nonexistent", "t1");
    expect(success).toBe(false);
  });

  it("특정 태스크만 삭제된다", () => {
    const task1 = makeTask({ id: "t1", text: "태스크1" });
    const task2 = makeTask({ id: "t2", text: "태스크2" });
    const items = [makeItem({ id: "i1", tasks: [task1, task2] })];
    const { updated } = deleteTaskFromItem(items, "i1", "t1");
    const tasks = updated.find((i) => i.id === "i1")!.tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.id).toBe("t2");
  });
});

// ============================================================
// 10. 통계 계산 (calcStats)
// ============================================================

describe("통계 계산 (calcStats)", () => {
  it("항목이 없으면 모든 통계가 0이다", () => {
    const stats = calcStats([]);
    expect(stats).toEqual({
      total: 0,
      totalDurationSec: 0,
      unrehearsedCount: 0,
      rehearsedCount: 0,
      avgDurationSec: 0,
    });
  });

  it("total은 항목 수이다", () => {
    const items = [
      makeItem({ id: "i1" }),
      makeItem({ id: "i2", order: 2 }),
    ];
    expect(calcStats(items).total).toBe(2);
  });

  it("totalDurationSec은 모든 durationSec의 합이다", () => {
    const items = [
      makeItem({ id: "i1", durationSec: 30 }),
      makeItem({ id: "i2", order: 2, durationSec: 45 }),
    ];
    expect(calcStats(items).totalDurationSec).toBe(75);
  });

  it("rehearsedCount는 rehearsed가 true인 항목 수이다", () => {
    const items = [
      makeItem({ id: "i1", rehearsed: true }),
      makeItem({ id: "i2", order: 2, rehearsed: false }),
      makeItem({ id: "i3", order: 3, rehearsed: true }),
    ];
    expect(calcStats(items).rehearsedCount).toBe(2);
  });

  it("unrehearsedCount는 rehearsed가 false인 항목 수이다", () => {
    const items = [
      makeItem({ id: "i1", rehearsed: true }),
      makeItem({ id: "i2", order: 2, rehearsed: false }),
    ];
    expect(calcStats(items).unrehearsedCount).toBe(1);
  });

  it("avgDurationSec은 totalDurationSec / total (소수 1자리 반올림)이다", () => {
    const items = [
      makeItem({ id: "i1", durationSec: 10 }),
      makeItem({ id: "i2", order: 2, durationSec: 20 }),
    ];
    expect(calcStats(items).avgDurationSec).toBe(15);
  });

  it("rehearsedCount + unrehearsedCount === total이다", () => {
    const items = [
      makeItem({ id: "i1", rehearsed: true }),
      makeItem({ id: "i2", order: 2, rehearsed: false }),
      makeItem({ id: "i3", order: 3, rehearsed: false }),
    ];
    const stats = calcStats(items);
    expect(stats.rehearsedCount + stats.unrehearsedCount).toBe(stats.total);
  });

  it("avgDurationSec이 소수 1자리로 반올림된다 (10/3 ≈ 3.3)", () => {
    const items = [
      makeItem({ id: "i1", durationSec: 10 }),
      makeItem({ id: "i2", order: 2, durationSec: 0 }),
      makeItem({ id: "i3", order: 3, durationSec: 0 }),
    ];
    // 10/3 = 3.333... → 3.3
    expect(calcStats(items).avgDurationSec).toBe(3.3);
  });
});

// ============================================================
// 11. 경계값 테스트
// ============================================================

describe("경계값 테스트", () => {
  it("durationSec이 0인 항목도 추가 가능하다", () => {
    const newItem = addItemToList([], {
      fromScene: "A",
      toScene: "B",
      durationSec: 0,
      transitionType: "other",
      assignedStaff: "",
      notes: "",
    });
    expect(newItem.durationSec).toBe(0);
  });

  it("빈 목록에서 통계는 모두 0이다", () => {
    const stats = calcStats([]);
    expect(stats.total).toBe(0);
    expect(stats.avgDurationSec).toBe(0);
  });

  it("항목 1개를 삭제하면 빈 목록이 된다", () => {
    const items = [makeItem({ id: "i1" })];
    const { updated } = deleteItemFromList(items, "i1");
    expect(updated).toHaveLength(0);
  });

  it("3개 항목에서 중간 항목 삭제 후 order가 1, 2로 재정렬된다", () => {
    const items = [
      makeItem({ id: "i1", order: 1 }),
      makeItem({ id: "i2", order: 2 }),
      makeItem({ id: "i3", order: 3 }),
    ];
    const { updated } = deleteItemFromList(items, "i2");
    const sorted = [...updated].sort((a, b) => a.order - b.order);
    expect(sorted[0]!.order).toBe(1);
    expect(sorted[1]!.order).toBe(2);
  });

  it("모든 항목이 rehearsed이면 unrehearsedCount는 0이다", () => {
    const items = [
      makeItem({ id: "i1", rehearsed: true }),
      makeItem({ id: "i2", order: 2, rehearsed: true }),
    ];
    expect(calcStats(items).unrehearsedCount).toBe(0);
  });
});
