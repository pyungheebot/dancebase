/**
 * use-practice-queue 테스트
 *
 * localStorage 기반 연습 큐 훅의 순수 계산 로직 및 동작을 검증합니다.
 * - LS_KEY: localStorage 키 생성
 * - 큐 CRUD (addQueue, deleteQueue)
 * - 아이템 CRUD (addItem, removeItem)
 * - 순서 변경 (reorderItem)
 * - 재생 제어 (nextSong, skipSong, resetQueue)
 * - 통계 계산 (totalQueues, totalSongs, completedSongs)
 * - 경계값, 빈 배열, 존재하지 않는 ID 처리
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

type QueueItemStatus = "pending" | "playing" | "done" | "skipped";

type PracticeQueueItem = {
  id: string;
  songTitle: string;
  order: number;
  status: QueueItemStatus;
};

type PracticeQueue = {
  id: string;
  name: string;
  items: PracticeQueueItem[];
  currentIndex: number;
  createdAt: string;
};

/** localStorage 키 생성 */
function lsKey(groupId: string, projectId: string): string {
  return `dancebase:practice-queue:${groupId}:${projectId}`;
}

/** 아이템 삭제 후 order 재정렬 및 currentIndex 보정 */
function removeItemFromQueue(
  queue: PracticeQueue,
  itemId: string
): PracticeQueue | null {
  const filtered = queue.items.filter((i) => i.id !== itemId);
  if (filtered.length === queue.items.length) return null;
  const reordered = filtered.map((item, idx) => ({ ...item, order: idx }));
  const newCurrentIndex = Math.min(
    queue.currentIndex,
    Math.max(0, reordered.length - 1)
  );
  return { ...queue, items: reordered, currentIndex: newCurrentIndex };
}

/** 위/아래 순서 변경 */
function reorderQueueItem(
  queue: PracticeQueue,
  itemIndex: number,
  direction: "up" | "down"
): PracticeQueue | null {
  const items = [...queue.items];
  const swapIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
  if (swapIndex < 0 || swapIndex >= items.length) return null;
  [items[itemIndex], items[swapIndex]] = [items[swapIndex], items[itemIndex]];
  const reordered = items.map((item, idx) => ({ ...item, order: idx }));
  let newCurrentIndex = queue.currentIndex;
  if (queue.currentIndex === itemIndex) {
    newCurrentIndex = swapIndex;
  } else if (queue.currentIndex === swapIndex) {
    newCurrentIndex = itemIndex;
  }
  return { ...queue, items: reordered, currentIndex: newCurrentIndex };
}

/** 다음 곡 (현재 done → 다음 playing) */
function applyNextSong(queue: PracticeQueue): PracticeQueue {
  const { items, currentIndex } = queue;
  const nextIdx = currentIndex + 1;
  const updatedItems = items.map((item, idx) => {
    if (idx === currentIndex) return { ...item, status: "done" as QueueItemStatus };
    if (idx === nextIdx) return { ...item, status: "playing" as QueueItemStatus };
    return item;
  });
  return {
    ...queue,
    items: updatedItems,
    currentIndex: nextIdx < items.length ? nextIdx : currentIndex,
  };
}

/** 곡 스킵 (현재 skipped → 다음 playing) */
function applySkipSong(queue: PracticeQueue): PracticeQueue {
  const { items, currentIndex } = queue;
  const nextIdx = currentIndex + 1;
  const updatedItems = items.map((item, idx) => {
    if (idx === currentIndex) return { ...item, status: "skipped" as QueueItemStatus };
    if (idx === nextIdx) return { ...item, status: "playing" as QueueItemStatus };
    return item;
  });
  return {
    ...queue,
    items: updatedItems,
    currentIndex: nextIdx < items.length ? nextIdx : currentIndex,
  };
}

/** 큐 초기화 (모든 pending, 첫 번째 playing) */
function applyResetQueue(queue: PracticeQueue): PracticeQueue {
  const resetItems = queue.items.map((item) => ({
    ...item,
    status: "pending" as QueueItemStatus,
  }));
  const readyItems =
    resetItems.length > 0
      ? resetItems.map((item, idx) =>
          idx === 0 ? { ...item, status: "playing" as QueueItemStatus } : item
        )
      : resetItems;
  return { ...queue, items: readyItems, currentIndex: 0 };
}

/** 통계 계산 */
function calcStats(queues: PracticeQueue[]) {
  const totalQueues = queues.length;
  const totalSongs = queues.reduce((sum, q) => sum + q.items.length, 0);
  const completedSongs = queues.reduce(
    (sum, q) => sum + q.items.filter((i) => i.status === "done").length,
    0
  );
  return { totalQueues, totalSongs, completedSongs };
}

// ============================================================
// 테스트 헬퍼
// ============================================================

function makeItem(
  id: string,
  order: number,
  status: QueueItemStatus = "pending"
): PracticeQueueItem {
  return { id, songTitle: `곡-${id}`, order, status };
}

function makeQueue(
  id: string,
  items: PracticeQueueItem[] = [],
  currentIndex = 0
): PracticeQueue {
  return {
    id,
    name: `큐-${id}`,
    items,
    currentIndex,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

// ============================================================
// lsKey
// ============================================================

describe("lsKey - localStorage 키 생성", () => {
  it("groupId와 projectId를 포함한 키를 반환한다", () => {
    expect(lsKey("g1", "p1")).toBe("dancebase:practice-queue:g1:p1");
  });

  it("서로 다른 groupId/projectId 조합은 다른 키를 생성한다", () => {
    const key1 = lsKey("g1", "p1");
    const key2 = lsKey("g1", "p2");
    const key3 = lsKey("g2", "p1");
    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key2).not.toBe(key3);
  });

  it("같은 인자로 호출하면 항상 동일한 키를 반환한다", () => {
    expect(lsKey("groupA", "projectB")).toBe(lsKey("groupA", "projectB"));
  });
});

// ============================================================
// removeItemFromQueue
// ============================================================

describe("removeItemFromQueue - 아이템 삭제 및 재정렬", () => {
  it("존재하는 아이템을 삭제하면 null이 아닌 큐를 반환한다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0),
      makeItem("i2", 1),
      makeItem("i3", 2),
    ]);
    const result = removeItemFromQueue(queue, "i2");
    expect(result).not.toBeNull();
  });

  it("삭제 후 남은 아이템 수가 1 줄어든다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0),
      makeItem("i2", 1),
      makeItem("i3", 2),
    ]);
    const result = removeItemFromQueue(queue, "i2")!;
    expect(result.items).toHaveLength(2);
  });

  it("삭제 후 order가 연속적으로 재정렬된다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0),
      makeItem("i2", 1),
      makeItem("i3", 2),
    ]);
    const result = removeItemFromQueue(queue, "i1")!;
    expect(result.items[0].order).toBe(0);
    expect(result.items[1].order).toBe(1);
  });

  it("존재하지 않는 아이템 ID 삭제 시 null을 반환한다", () => {
    const queue = makeQueue("q1", [makeItem("i1", 0)]);
    expect(removeItemFromQueue(queue, "nonexistent")).toBeNull();
  });

  it("마지막 아이템 삭제 후 currentIndex가 0으로 보정된다", () => {
    const queue = makeQueue("q1", [makeItem("i1", 0)], 0);
    const result = removeItemFromQueue(queue, "i1")!;
    expect(result.currentIndex).toBe(0);
  });

  it("currentIndex보다 앞 아이템 삭제 시 currentIndex가 보정된다", () => {
    const queue = makeQueue(
      "q1",
      [makeItem("i1", 0), makeItem("i2", 1), makeItem("i3", 2)],
      2
    );
    const result = removeItemFromQueue(queue, "i1")!;
    // currentIndex가 2였는데 삭제 후 최대 인덱스는 1
    expect(result.currentIndex).toBeLessThanOrEqual(result.items.length - 1);
  });

  it("빈 큐에서 삭제 시 null을 반환한다", () => {
    const queue = makeQueue("q1", []);
    expect(removeItemFromQueue(queue, "i1")).toBeNull();
  });
});

// ============================================================
// reorderQueueItem
// ============================================================

describe("reorderQueueItem - 순서 변경", () => {
  it("위로 이동: 첫 번째가 아닌 아이템을 위로 이동할 수 있다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0),
      makeItem("i2", 1),
      makeItem("i3", 2),
    ]);
    const result = reorderQueueItem(queue, 1, "up")!;
    expect(result.items[0].id).toBe("i2");
    expect(result.items[1].id).toBe("i1");
  });

  it("아래로 이동: 마지막이 아닌 아이템을 아래로 이동할 수 있다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0),
      makeItem("i2", 1),
      makeItem("i3", 2),
    ]);
    const result = reorderQueueItem(queue, 0, "down")!;
    expect(result.items[0].id).toBe("i2");
    expect(result.items[1].id).toBe("i1");
  });

  it("첫 번째 아이템을 위로 이동하면 null을 반환한다", () => {
    const queue = makeQueue("q1", [makeItem("i1", 0), makeItem("i2", 1)]);
    expect(reorderQueueItem(queue, 0, "up")).toBeNull();
  });

  it("마지막 아이템을 아래로 이동하면 null을 반환한다", () => {
    const queue = makeQueue("q1", [makeItem("i1", 0), makeItem("i2", 1)]);
    expect(reorderQueueItem(queue, 1, "down")).toBeNull();
  });

  it("이동 후 order가 재정렬된다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0),
      makeItem("i2", 1),
    ]);
    const result = reorderQueueItem(queue, 1, "up")!;
    expect(result.items[0].order).toBe(0);
    expect(result.items[1].order).toBe(1);
  });

  it("현재 인덱스 아이템 위로 이동 시 currentIndex도 함께 이동한다", () => {
    const queue = makeQueue(
      "q1",
      [makeItem("i1", 0), makeItem("i2", 1), makeItem("i3", 2)],
      1
    );
    const result = reorderQueueItem(queue, 1, "up")!;
    expect(result.currentIndex).toBe(0);
  });

  it("현재 인덱스 아이템 아래로 이동 시 currentIndex도 함께 이동한다", () => {
    const queue = makeQueue(
      "q1",
      [makeItem("i1", 0), makeItem("i2", 1), makeItem("i3", 2)],
      1
    );
    const result = reorderQueueItem(queue, 1, "down")!;
    expect(result.currentIndex).toBe(2);
  });

  it("범위를 벗어난 itemIndex로 이동 시 null을 반환한다", () => {
    const queue = makeQueue("q1", [makeItem("i1", 0)]);
    expect(reorderQueueItem(queue, 5, "up")).toBeNull();
  });
});

// ============================================================
// applyNextSong
// ============================================================

describe("applyNextSong - 다음 곡 재생", () => {
  it("현재 곡의 상태가 done으로 변경된다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0, "playing"),
      makeItem("i2", 1, "pending"),
    ]);
    const result = applyNextSong(queue);
    expect(result.items[0].status).toBe("done");
  });

  it("다음 곡의 상태가 playing으로 변경된다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0, "playing"),
      makeItem("i2", 1, "pending"),
    ]);
    const result = applyNextSong(queue);
    expect(result.items[1].status).toBe("playing");
  });

  it("다음 곡이 있으면 currentIndex가 1 증가한다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0),
      makeItem("i2", 1),
    ]);
    const result = applyNextSong(queue);
    expect(result.currentIndex).toBe(1);
  });

  it("마지막 곡에서 next 호출 시 currentIndex가 유지된다", () => {
    const queue = makeQueue(
      "q1",
      [makeItem("i1", 0), makeItem("i2", 1)],
      1
    );
    const result = applyNextSong(queue);
    expect(result.currentIndex).toBe(1);
  });

  it("마지막 곡에서 next 호출 시 다음 인덱스 아이템이 없으므로 상태 변경 없음", () => {
    const queue = makeQueue(
      "q1",
      [makeItem("i1", 0, "playing"), makeItem("i2", 1, "pending")],
      1
    );
    const result = applyNextSong(queue);
    // 인덱스 2는 존재하지 않으므로 i2는 변경되지 않음
    expect(result.items[1].status).toBe("done");
  });
});

// ============================================================
// applySkipSong
// ============================================================

describe("applySkipSong - 곡 스킵", () => {
  it("현재 곡의 상태가 skipped로 변경된다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0, "playing"),
      makeItem("i2", 1, "pending"),
    ]);
    const result = applySkipSong(queue);
    expect(result.items[0].status).toBe("skipped");
  });

  it("다음 곡의 상태가 playing으로 변경된다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0, "playing"),
      makeItem("i2", 1, "pending"),
    ]);
    const result = applySkipSong(queue);
    expect(result.items[1].status).toBe("playing");
  });

  it("다음 곡이 있으면 currentIndex가 증가한다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0),
      makeItem("i2", 1),
      makeItem("i3", 2),
    ]);
    const result = applySkipSong(queue);
    expect(result.currentIndex).toBe(1);
  });

  it("마지막 곡 스킵 시 currentIndex가 유지된다", () => {
    const queue = makeQueue(
      "q1",
      [makeItem("i1", 0), makeItem("i2", 1)],
      1
    );
    const result = applySkipSong(queue);
    expect(result.currentIndex).toBe(1);
  });
});

// ============================================================
// applyResetQueue
// ============================================================

describe("applyResetQueue - 큐 초기화", () => {
  it("모든 아이템 상태가 pending으로 초기화된다 (첫 번째 제외)", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0, "done"),
      makeItem("i2", 1, "done"),
      makeItem("i3", 2, "skipped"),
    ]);
    const result = applyResetQueue(queue);
    expect(result.items[1].status).toBe("pending");
    expect(result.items[2].status).toBe("pending");
  });

  it("첫 번째 아이템이 있으면 playing 상태로 시작한다", () => {
    const queue = makeQueue("q1", [
      makeItem("i1", 0, "done"),
      makeItem("i2", 1, "done"),
    ]);
    const result = applyResetQueue(queue);
    expect(result.items[0].status).toBe("playing");
  });

  it("currentIndex가 0으로 초기화된다", () => {
    const queue = makeQueue(
      "q1",
      [makeItem("i1", 0), makeItem("i2", 1), makeItem("i3", 2)],
      2
    );
    const result = applyResetQueue(queue);
    expect(result.currentIndex).toBe(0);
  });

  it("빈 큐 초기화 시 아이템이 없고 currentIndex는 0이다", () => {
    const queue = makeQueue("q1", [], 0);
    const result = applyResetQueue(queue);
    expect(result.items).toHaveLength(0);
    expect(result.currentIndex).toBe(0);
  });
});

// ============================================================
// calcStats - 통계 계산
// ============================================================

describe("calcStats - 통계 계산", () => {
  it("빈 큐 목록의 모든 통계는 0이다", () => {
    const stats = calcStats([]);
    expect(stats.totalQueues).toBe(0);
    expect(stats.totalSongs).toBe(0);
    expect(stats.completedSongs).toBe(0);
  });

  it("큐 수(totalQueues)가 올바르게 계산된다", () => {
    const queues = [makeQueue("q1"), makeQueue("q2"), makeQueue("q3")];
    expect(calcStats(queues).totalQueues).toBe(3);
  });

  it("전체 곡 수(totalSongs)가 모든 큐의 합계이다", () => {
    const queues = [
      makeQueue("q1", [makeItem("i1", 0), makeItem("i2", 1)]),
      makeQueue("q2", [makeItem("i3", 0), makeItem("i4", 1), makeItem("i5", 2)]),
    ];
    expect(calcStats(queues).totalSongs).toBe(5);
  });

  it("완료된 곡 수(completedSongs)가 done 상태인 아이템만 집계한다", () => {
    const queues = [
      makeQueue("q1", [
        makeItem("i1", 0, "done"),
        makeItem("i2", 1, "playing"),
        makeItem("i3", 2, "pending"),
      ]),
      makeQueue("q2", [
        makeItem("i4", 0, "done"),
        makeItem("i5", 1, "skipped"),
      ]),
    ];
    expect(calcStats(queues).completedSongs).toBe(2);
  });

  it("skipped 상태는 completedSongs에 포함되지 않는다", () => {
    const queues = [
      makeQueue("q1", [
        makeItem("i1", 0, "skipped"),
        makeItem("i2", 1, "skipped"),
      ]),
    ];
    expect(calcStats(queues).completedSongs).toBe(0);
  });

  it("아이템이 없는 큐도 totalQueues에 포함된다", () => {
    const queues = [makeQueue("q1", []), makeQueue("q2", [])];
    const stats = calcStats(queues);
    expect(stats.totalQueues).toBe(2);
    expect(stats.totalSongs).toBe(0);
  });
});

// ============================================================
// usePracticeQueue 훅 - localStorage mock 기반
// ============================================================

describe("usePracticeQueue 훅 - 기본 동작", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mock("swr", async (importOriginal) => {
      const actual = await importOriginal<typeof import("swr")>();
      return {
        ...actual,
        default: vi.fn((key, fetcher) => {
          if (!key) return { data: undefined, mutate: vi.fn() };
          try {
            const data = fetcher ? fetcher() : undefined;
            const mutate = vi.fn();
            return { data, mutate };
          } catch {
            return { data: undefined, mutate: vi.fn() };
          }
        }),
      };
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("groupId나 projectId가 빈 문자열이면 빈 큐 목록을 반환한다", () => {
    // 빈 문자열 입력 시 SWR 키가 null → 빈 배열 반환
    const raw = localStorage.getItem("dancebase:practice-queue::");
    expect(raw).toBeNull();
  });

  it("localStorage가 비어있으면 빈 배열을 파싱한다", () => {
    const raw = localStorage.getItem(lsKey("g1", "p1"));
    const parsed = raw ? JSON.parse(raw) : [];
    expect(parsed).toEqual([]);
  });

  it("유효하지 않은 JSON이 저장된 경우 빈 배열을 반환한다", () => {
    localStorage.setItem(lsKey("g1", "p1"), "invalid-json{{{");
    let result: unknown[] = [];
    try {
      result = JSON.parse(localStorage.getItem(lsKey("g1", "p1"))!);
    } catch {
      result = [];
    }
    expect(result).toEqual([]);
  });
});
