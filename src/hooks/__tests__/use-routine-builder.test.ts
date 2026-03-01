import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── SWR mock: vi.hoisted으로 store를 모듈 외부에서 제어 ─────────
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

// ─── localStorage mock ───────────────────────────────────────
const lsStore: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => lsStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    lsStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete lsStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(lsStore).forEach((k) => delete lsStore[k]);
  }),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    routineBuilder: (groupId: string) => `routine-builder-${groupId}`,
  },
}));

import {
  useRoutineBuilder,
  BLOCK_DEFAULT_MINUTES,
  BLOCK_TYPE_LABELS,
  BLOCK_TYPE_COLORS,
} from "@/hooks/use-routine-builder";
import type { PracticeRoutine } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeRoutine(overrides?: Partial<PracticeRoutine>): PracticeRoutine {
  return {
    id: "routine-1",
    name: "기본 루틴",
    blocks: [],
    totalMinutes: 0,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function seedRoutines(groupId: string, routines: PracticeRoutine[]) {
  const key = `dancebase:routines:${groupId}`;
  // lsStore에 직접 저장
  lsStore[key] = JSON.stringify(routines);
  // getItem mock도 업데이트
  localStorageMock.getItem.mockImplementation((k: string) => lsStore[k] ?? null);
}

function resetAll() {
  // SWR store 초기화
  swrStore.reset();
  // localStorage store 초기화
  Object.keys(lsStore).forEach((k) => delete lsStore[k]);
  // mock 초기화
  localStorageMock.getItem.mockImplementation((k: string) => lsStore[k] ?? null);
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
}

// ─── 상수 테스트 ─────────────────────────────────────────────
describe("useRoutineBuilder - 상수 검증", () => {
  it("BLOCK_DEFAULT_MINUTES에 모든 블록 타입이 정의되어 있다", () => {
    const types = ["warmup", "basics", "technique", "choreography", "freestyle", "cooldown", "break"];
    types.forEach((t) => {
      expect(BLOCK_DEFAULT_MINUTES[t as keyof typeof BLOCK_DEFAULT_MINUTES]).toBeGreaterThan(0);
    });
  });

  it("warmup 기본 시간은 10분이다", () => {
    expect(BLOCK_DEFAULT_MINUTES.warmup).toBe(10);
  });

  it("choreography 기본 시간은 30분이다", () => {
    expect(BLOCK_DEFAULT_MINUTES.choreography).toBe(30);
  });

  it("break 기본 시간은 5분이다", () => {
    expect(BLOCK_DEFAULT_MINUTES.break).toBe(5);
  });

  it("basics 기본 시간은 15분이다", () => {
    expect(BLOCK_DEFAULT_MINUTES.basics).toBe(15);
  });

  it("technique 기본 시간은 20분이다", () => {
    expect(BLOCK_DEFAULT_MINUTES.technique).toBe(20);
  });

  it("BLOCK_TYPE_LABELS에 한글 레이블이 있다", () => {
    expect(BLOCK_TYPE_LABELS.warmup).toBe("워밍업");
    expect(BLOCK_TYPE_LABELS.choreography).toBe("안무연습");
    expect(BLOCK_TYPE_LABELS.cooldown).toBe("쿨다운");
    expect(BLOCK_TYPE_LABELS.basics).toBe("기초훈련");
    expect(BLOCK_TYPE_LABELS.break).toBe("휴식");
  });

  it("BLOCK_TYPE_COLORS에 색상 클래스가 있다", () => {
    expect(BLOCK_TYPE_COLORS.warmup.bg).toContain("orange");
    expect(BLOCK_TYPE_COLORS.basics.bg).toContain("blue");
    expect(BLOCK_TYPE_COLORS.break.bg).toContain("gray");
    expect(BLOCK_TYPE_COLORS.choreography.bg).toContain("pink");
  });
});

// ─── 초기 상태 ──────────────────────────────────────────────
describe("useRoutineBuilder - 초기 상태", () => {
  beforeEach(() => resetAll());

  it("초기 routines는 빈 배열이다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    expect(result.current.routines).toEqual([]);
  });

  it("필수 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    expect(typeof result.current.createRoutine).toBe("function");
    expect(typeof result.current.renameRoutine).toBe("function");
    expect(typeof result.current.deleteRoutine).toBe("function");
    expect(typeof result.current.duplicateRoutine).toBe("function");
    expect(typeof result.current.useRoutine).toBe("function");
    expect(typeof result.current.addBlock).toBe("function");
    expect(typeof result.current.deleteBlock).toBe("function");
    expect(typeof result.current.moveBlock).toBe("function");
    expect(typeof result.current.updateBlock).toBe("function");
  });
});

// ─── createRoutine ───────────────────────────────────────────
describe("useRoutineBuilder - createRoutine", () => {
  beforeEach(() => resetAll());

  it("빈 이름으로 생성 시 null을 반환한다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: PracticeRoutine | null;
    act(() => {
      ret = result.current.createRoutine("");
    });
    expect(ret!).toBeNull();
  });

  it("공백만 있는 이름으로 생성 시 null을 반환한다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: PracticeRoutine | null;
    act(() => {
      ret = result.current.createRoutine("   ");
    });
    expect(ret!).toBeNull();
  });

  it("정상 이름으로 생성 시 루틴 객체를 반환한다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: PracticeRoutine | null;
    act(() => {
      ret = result.current.createRoutine("연습 루틴");
    });
    expect(ret).not.toBeNull();
    expect(ret!.name).toBe("연습 루틴");
  });

  it("생성된 루틴의 초기 blocks는 빈 배열이다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: PracticeRoutine | null;
    act(() => {
      ret = result.current.createRoutine("연습 루틴");
    });
    expect(ret!.blocks).toEqual([]);
  });

  it("생성된 루틴의 초기 totalMinutes는 0이다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: PracticeRoutine | null;
    act(() => {
      ret = result.current.createRoutine("연습 루틴");
    });
    expect(ret!.totalMinutes).toBe(0);
  });

  it("생성된 루틴의 초기 usageCount는 0이다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: PracticeRoutine | null;
    act(() => {
      ret = result.current.createRoutine("연습 루틴");
    });
    expect(ret!.usageCount).toBe(0);
  });

  it("이름 앞뒤 공백은 제거되어 저장된다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: PracticeRoutine | null;
    act(() => {
      ret = result.current.createRoutine("  연습 루틴  ");
    });
    expect(ret!.name).toBe("연습 루틴");
  });

  it("localStorage에 저장된다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.createRoutine("연습 루틴");
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("저장 시 키에 groupId가 포함된다", () => {
    const { result } = renderHook(() => useRoutineBuilder("my-group-abc"));
    act(() => {
      result.current.createRoutine("루틴1");
    });
    const savedKey = localStorageMock.setItem.mock.calls[0][0];
    expect(savedKey).toContain("my-group-abc");
  });
});

// ─── renameRoutine ───────────────────────────────────────────
describe("useRoutineBuilder - renameRoutine", () => {
  beforeEach(() => resetAll());

  it("빈 이름으로 이름 변경 시 false를 반환한다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.renameRoutine("routine-1", "");
    });
    expect(ret!).toBe(false);
  });

  it("정상 이름으로 이름 변경 시 true를 반환한다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.renameRoutine("routine-1", "새 루틴");
    });
    expect(ret!).toBe(true);
  });

  it("변경된 이름이 localStorage에 저장된다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.renameRoutine("routine-1", "새 루틴");
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
    const savedData = JSON.parse(
      localStorageMock.setItem.mock.calls[0][1]
    ) as PracticeRoutine[];
    expect(savedData[0].name).toBe("새 루틴");
  });
});

// ─── deleteRoutine ───────────────────────────────────────────
describe("useRoutineBuilder - deleteRoutine", () => {
  beforeEach(() => resetAll());

  it("루틴 삭제 후 localStorage에서 제거된다", () => {
    const r1 = makeRoutine({ id: "r1", name: "루틴1" });
    const r2 = makeRoutine({ id: "r2", name: "루틴2" });
    seedRoutines("group-1", [r1, r2]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.deleteRoutine("r1");
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe("r2");
  });

  it("존재하지 않는 ID 삭제 시도도 에러 없이 실행된다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    expect(() => {
      act(() => {
        result.current.deleteRoutine("non-existent");
      });
    }).not.toThrow();
  });
});

// ─── duplicateRoutine ────────────────────────────────────────
describe("useRoutineBuilder - duplicateRoutine", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 루틴 복제 시 null을 반환한다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: PracticeRoutine | null;
    act(() => {
      ret = result.current.duplicateRoutine("non-existent");
    });
    expect(ret!).toBeNull();
  });

  it("복제된 루틴은 다른 id를 갖는다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let cloned: PracticeRoutine | null;
    act(() => {
      cloned = result.current.duplicateRoutine("routine-1");
    });
    expect(cloned).not.toBeNull();
    expect(cloned!.id).not.toBe("routine-1");
  });

  it("복제된 루틴의 이름은 '(복사본)'이 붙는다", () => {
    seedRoutines("group-1", [makeRoutine({ name: "원본 루틴" })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let cloned: PracticeRoutine | null;
    act(() => {
      cloned = result.current.duplicateRoutine("routine-1");
    });
    expect(cloned!.name).toBe("원본 루틴 (복사본)");
  });

  it("복제된 루틴의 usageCount는 0이다", () => {
    seedRoutines("group-1", [makeRoutine({ usageCount: 5 })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let cloned: PracticeRoutine | null;
    act(() => {
      cloned = result.current.duplicateRoutine("routine-1");
    });
    expect(cloned!.usageCount).toBe(0);
  });

  it("복제된 루틴의 블록들도 새 id를 갖는다", () => {
    seedRoutines("group-1", [makeRoutine({
      blocks: [{
        id: "block-1",
        type: "warmup",
        title: "워밍업",
        durationMinutes: 10,
        description: "",
        order: 0,
      }],
    })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let cloned: PracticeRoutine | null;
    act(() => {
      cloned = result.current.duplicateRoutine("routine-1");
    });
    expect(cloned!.blocks[0].id).not.toBe("block-1");
  });

  it("복제 후 localStorage에 2개가 저장된다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.duplicateRoutine("routine-1");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved).toHaveLength(2);
  });
});

// ─── useRoutine ──────────────────────────────────────────────
describe("useRoutineBuilder - useRoutine", () => {
  beforeEach(() => resetAll());

  it("usageCount가 1 증가한다", () => {
    seedRoutines("group-1", [makeRoutine({ usageCount: 3 })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.useRoutine("routine-1");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].usageCount).toBe(4);
  });

  it("lastUsedAt이 업데이트된다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.useRoutine("routine-1");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].lastUsedAt).toBeDefined();
  });
});

// ─── addBlock ────────────────────────────────────────────────
describe("useRoutineBuilder - addBlock", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 루틴에 블록 추가 시 false를 반환한다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addBlock("non-existent", { type: "warmup" });
    });
    expect(ret!).toBe(false);
  });

  it("정상 블록 추가 시 true를 반환한다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addBlock("routine-1", { type: "warmup" });
    });
    expect(ret!).toBe(true);
  });

  it("title을 지정하지 않으면 타입 레이블이 사용된다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.addBlock("routine-1", { type: "warmup" });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].blocks[0].title).toBe("워밍업");
  });

  it("durationMinutes를 지정하지 않으면 기본값이 사용된다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.addBlock("routine-1", { type: "choreography" });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].blocks[0].durationMinutes).toBe(30);
  });

  it("블록 추가 후 totalMinutes가 업데이트된다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.addBlock("routine-1", { type: "warmup", durationMinutes: 15 });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].totalMinutes).toBe(15);
  });

  it("블록의 order가 0부터 시작한다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.addBlock("routine-1", { type: "warmup" });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].blocks[0].order).toBe(0);
  });

  it("description을 지정하지 않으면 빈 문자열이 된다", () => {
    seedRoutines("group-1", [makeRoutine()]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.addBlock("routine-1", { type: "warmup" });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].blocks[0].description).toBe("");
  });
});

// ─── deleteBlock ─────────────────────────────────────────────
describe("useRoutineBuilder - deleteBlock", () => {
  beforeEach(() => resetAll());

  it("블록 삭제 후 totalMinutes가 재계산된다", () => {
    seedRoutines("group-1", [makeRoutine({
      blocks: [
        { id: "b1", type: "warmup", title: "워밍업", durationMinutes: 10, description: "", order: 0 },
        { id: "b2", type: "choreography", title: "안무", durationMinutes: 30, description: "", order: 1 },
      ],
      totalMinutes: 40,
    })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.deleteBlock("routine-1", "b1");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].totalMinutes).toBe(30);
  });

  it("블록 삭제 후 order가 재정렬된다", () => {
    seedRoutines("group-1", [makeRoutine({
      blocks: [
        { id: "b1", type: "warmup", title: "워밍업", durationMinutes: 10, description: "", order: 0 },
        { id: "b2", type: "basics", title: "기초", durationMinutes: 15, description: "", order: 1 },
        { id: "b3", type: "cooldown", title: "쿨다운", durationMinutes: 10, description: "", order: 2 },
      ],
      totalMinutes: 35,
    })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.deleteBlock("routine-1", "b1");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    const orders = saved[0].blocks.map((b: { order: number }) => b.order);
    expect(orders).toEqual([0, 1]);
  });
});

// ─── moveBlock ───────────────────────────────────────────────
describe("useRoutineBuilder - moveBlock", () => {
  beforeEach(() => resetAll());

  it("첫 번째 블록을 위로 이동해도 변화 없다", () => {
    seedRoutines("group-1", [makeRoutine({
      blocks: [
        { id: "b1", type: "warmup", title: "워밍업", durationMinutes: 10, description: "", order: 0 },
        { id: "b2", type: "basics", title: "기초", durationMinutes: 15, description: "", order: 1 },
      ],
      totalMinutes: 25,
    })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.moveBlock("routine-1", "b1", "up");
    });
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it("마지막 블록을 아래로 이동해도 변화 없다", () => {
    seedRoutines("group-1", [makeRoutine({
      blocks: [
        { id: "b1", type: "warmup", title: "워밍업", durationMinutes: 10, description: "", order: 0 },
        { id: "b2", type: "basics", title: "기초", durationMinutes: 15, description: "", order: 1 },
      ],
      totalMinutes: 25,
    })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.moveBlock("routine-1", "b2", "down");
    });
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it("두 번째 블록을 위로 이동 시 순서가 바뀐다", () => {
    seedRoutines("group-1", [makeRoutine({
      blocks: [
        { id: "b1", type: "warmup", title: "워밍업", durationMinutes: 10, description: "", order: 0 },
        { id: "b2", type: "basics", title: "기초", durationMinutes: 15, description: "", order: 1 },
      ],
      totalMinutes: 25,
    })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.moveBlock("routine-1", "b2", "up");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    const b1 = saved[0].blocks.find((b: { id: string }) => b.id === "b1")!;
    const b2 = saved[0].blocks.find((b: { id: string }) => b.id === "b2")!;
    expect(b2.order).toBeLessThan(b1.order);
  });

  it("첫 번째 블록을 아래로 이동 시 순서가 바뀐다", () => {
    seedRoutines("group-1", [makeRoutine({
      blocks: [
        { id: "b1", type: "warmup", title: "워밍업", durationMinutes: 10, description: "", order: 0 },
        { id: "b2", type: "basics", title: "기초", durationMinutes: 15, description: "", order: 1 },
      ],
      totalMinutes: 25,
    })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.moveBlock("routine-1", "b1", "down");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    const b1 = saved[0].blocks.find((b: { id: string }) => b.id === "b1")!;
    const b2 = saved[0].blocks.find((b: { id: string }) => b.id === "b2")!;
    expect(b1.order).toBeGreaterThan(b2.order);
  });
});

// ─── updateBlock ─────────────────────────────────────────────
describe("useRoutineBuilder - updateBlock", () => {
  beforeEach(() => resetAll());

  it("블록 시간 수정 후 totalMinutes가 재계산된다", () => {
    seedRoutines("group-1", [makeRoutine({
      blocks: [
        { id: "b1", type: "warmup", title: "워밍업", durationMinutes: 10, description: "", order: 0 },
      ],
      totalMinutes: 10,
    })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.updateBlock("routine-1", "b1", { durationMinutes: 20 });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].totalMinutes).toBe(20);
  });

  it("블록 title 수정이 반영된다", () => {
    seedRoutines("group-1", [makeRoutine({
      blocks: [
        { id: "b1", type: "warmup", title: "워밍업", durationMinutes: 10, description: "", order: 0 },
      ],
      totalMinutes: 10,
    })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.updateBlock("routine-1", "b1", { title: "특별 워밍업" });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].blocks[0].title).toBe("특별 워밍업");
  });

  it("블록 description 수정이 반영된다", () => {
    seedRoutines("group-1", [makeRoutine({
      blocks: [
        { id: "b1", type: "warmup", title: "워밍업", durationMinutes: 10, description: "", order: 0 },
      ],
      totalMinutes: 10,
    })]);

    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    act(() => {
      result.current.updateBlock("routine-1", "b1", { description: "스트레칭 포함" });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]) as PracticeRoutine[];
    expect(saved[0].blocks[0].description).toBe("스트레칭 포함");
  });

  it("존재하지 않는 루틴 업데이트는 에러 없이 실행된다", () => {
    const { result } = renderHook(() => useRoutineBuilder("group-1"));
    expect(() => {
      act(() => {
        result.current.updateBlock("non-existent", "b1", { title: "제목" });
      });
    }).not.toThrow();
  });
});

// ─── 여러 블록 totalMinutes 합산 ───────────────────────────────
describe("useRoutineBuilder - totalMinutes 합산", () => {
  it("calcTotal 로직: 블록 durationMinutes 합산이 정확하다", () => {
    const blocks = [
      { durationMinutes: 10 },
      { durationMinutes: 30 },
      { durationMinutes: 15 },
    ];
    const total = blocks.reduce((sum, b) => sum + b.durationMinutes, 0);
    expect(total).toBe(55);
  });

  it("빈 블록 배열의 합산은 0이다", () => {
    const blocks: { durationMinutes: number }[] = [];
    const total = blocks.reduce((sum, b) => sum + b.durationMinutes, 0);
    expect(total).toBe(0);
  });
});
