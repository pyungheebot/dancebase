import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { StageFormationData, StageFormationScene } from "@/types";

// ─── local-storage mock ──────────────────────────────────────
// useStageFormation은 useState(() => loadFromStorage(..., {} as StageFormationData)) 로 초기화
// {} 로 시작하면 scenes가 undefined -> 오류. 따라서 loadFromStorage를 직접 mock한다.

const memStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    return key in memStore ? (memStore[key] as T) : defaultValue;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    stageFormation: (projectId: string) => `stage-formation-${projectId}`,
  },
}));

import { useStageFormation } from "@/hooks/use-stage-formation";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeEmptyFormation(projectId = "proj-1"): StageFormationData {
  return {
    projectId,
    scenes: [],
    stageWidth: 10,
    stageDepth: 8,
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

function seedFormation(projectId: string, data: StageFormationData) {
  const key = `stage-formation-${projectId}`;
  memStore[key] = data;
}

function clearStore() {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
}

// ─── 초기 상태 ──────────────────────────────────────────────
describe("useStageFormation - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("초기 scenes는 빈 배열이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    expect(result.current.scenes).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalScenes는 0이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    expect(result.current.stats.totalScenes).toBe(0);
  });

  it("초기 stats.totalPositions는 0이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    expect(result.current.stats.totalPositions).toBe(0);
  });

  it("초기 stats.averagePositionsPerScene는 0이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    expect(result.current.stats.averagePositionsPerScene).toBe(0);
  });

  it("필수 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    expect(typeof result.current.addScene).toBe("function");
    expect(typeof result.current.updateScene).toBe("function");
    expect(typeof result.current.deleteScene).toBe("function");
    expect(typeof result.current.reorderScenes).toBe("function");
    expect(typeof result.current.addPosition).toBe("function");
    expect(typeof result.current.updatePosition).toBe("function");
    expect(typeof result.current.removePosition).toBe("function");
    expect(typeof result.current.setStageSize).toBe("function");
    expect(typeof result.current.setNotes).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("stageWidth와 stageDepth가 반환된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    expect(result.current.stageWidth).toBe(10);
    expect(result.current.stageDepth).toBe(8);
  });
});

// ─── addScene ────────────────────────────────────────────────
describe("useStageFormation - addScene", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("씬을 추가하면 반환 객체가 있다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let scene: StageFormationScene;
    act(() => {
      scene = result.current.addScene({ name: "오프닝" });
    });
    expect(scene!).toBeDefined();
    expect(scene!.name).toBe("오프닝");
  });

  it("추가된 씬은 빈 positions 배열을 갖는다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.addScene({ name: "오프닝" });
    });
    expect(result.current.scenes[0].positions).toEqual([]);
  });

  it("첫 번째 씬의 order는 1이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.addScene({ name: "씬1" });
    });
    expect(result.current.scenes[0].order).toBe(1);
  });

  it("두 번째 씬의 order는 2이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    // useState 클로저 문제로 인해 각 act()를 분리해야 stale 상태 방지
    act(() => {
      result.current.addScene({ name: "씬1" });
    });
    act(() => {
      result.current.addScene({ name: "씬2" });
    });
    const scene2 = result.current.scenes.find((s) => s.name === "씬2");
    expect(scene2?.order).toBe(2);
  });

  it("description을 제공하지 않으면 빈 문자열이 된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.addScene({ name: "씬1" });
    });
    expect(result.current.scenes[0].description).toBe("");
  });

  it("durationSec을 제공하면 저장된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.addScene({ name: "씬1", durationSec: 120 });
    });
    expect(result.current.scenes[0].durationSec).toBe(120);
  });

  it("durationSec을 제공하지 않으면 null이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.addScene({ name: "씬1" });
    });
    expect(result.current.scenes[0].durationSec).toBeNull();
  });

  it("추가 후 memStore에 updatedAt이 저장된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.addScene({ name: "씬1" });
    });
    const stored = memStore["stage-formation-proj-1"] as StageFormationData;
    expect(stored.updatedAt).toBeDefined();
  });

  it("씬 추가 후 scenes 수가 1이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.addScene({ name: "씬1" });
    });
    expect(result.current.scenes).toHaveLength(1);
  });
});

// ─── updateScene ─────────────────────────────────────────────
describe("useStageFormation - updateScene", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("존재하지 않는 씬 수정 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateScene("non-existent", { name: "새 이름" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 씬 수정 시 true를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.updateScene(sceneId, { name: "수정된 씬" });
    });
    expect(ret!).toBe(true);
  });

  it("수정된 이름이 반영된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    act(() => {
      result.current.updateScene(sceneId, { name: "수정된 씬" });
    });
    const updated = result.current.scenes.find((s) => s.id === sceneId);
    expect(updated?.name).toBe("수정된 씬");
  });

  it("durationSec 수정이 반영된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    act(() => {
      result.current.updateScene(sceneId, { durationSec: 90 });
    });
    const updated = result.current.scenes.find((s) => s.id === sceneId);
    expect(updated?.durationSec).toBe(90);
  });
});

// ─── deleteScene ─────────────────────────────────────────────
describe("useStageFormation - deleteScene", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("존재하지 않는 씬 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteScene("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 씬 삭제 시 true를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.deleteScene(sceneId);
    });
    expect(ret!).toBe(true);
  });

  it("삭제 후 씬 수가 1 감소한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    act(() => {
      result.current.addScene({ name: "씬2" });
    });
    act(() => {
      result.current.deleteScene(sceneId);
    });
    expect(result.current.scenes).toHaveLength(1);
  });

  it("삭제 후 남은 씬의 order가 재정렬된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let scene1Id = "";
    act(() => {
      const s1 = result.current.addScene({ name: "씬1" });
      scene1Id = s1.id;
    });
    act(() => {
      result.current.addScene({ name: "씬2" });
    });
    act(() => {
      result.current.addScene({ name: "씬3" });
    });
    act(() => {
      result.current.deleteScene(scene1Id);
    });
    const orders = result.current.scenes.map((s) => s.order).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2]);
  });
});

// ─── reorderScenes ───────────────────────────────────────────
describe("useStageFormation - reorderScenes", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("존재하지 않는 씬 재정렬 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.reorderScenes("non-existent", "up");
    });
    expect(ret!).toBe(false);
  });

  it("첫 번째 씬을 위로 이동 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let scene1Id = "";
    act(() => {
      const s = result.current.addScene({ name: "씬1" });
      scene1Id = s.id;
    });
    act(() => {
      result.current.addScene({ name: "씬2" });
    });
    let ret: boolean;
    act(() => {
      ret = result.current.reorderScenes(scene1Id, "up");
    });
    expect(ret!).toBe(false);
  });

  it("마지막 씬을 아래로 이동 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let scene2Id = "";
    act(() => {
      result.current.addScene({ name: "씬1" });
    });
    act(() => {
      const s = result.current.addScene({ name: "씬2" });
      scene2Id = s.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.reorderScenes(scene2Id, "down");
    });
    expect(ret!).toBe(false);
  });

  it("정상 재정렬 시 true를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let scene2Id = "";
    act(() => {
      result.current.addScene({ name: "씬1" });
    });
    act(() => {
      const s = result.current.addScene({ name: "씬2" });
      scene2Id = s.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.reorderScenes(scene2Id, "up");
    });
    expect(ret!).toBe(true);
  });

  it("위로 이동 시 순서가 바뀐다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let scene1Id = "";
    let scene2Id = "";
    act(() => {
      const s1 = result.current.addScene({ name: "씬1" });
      scene1Id = s1.id;
    });
    act(() => {
      const s2 = result.current.addScene({ name: "씬2" });
      scene2Id = s2.id;
    });
    act(() => {
      result.current.reorderScenes(scene2Id, "up");
    });
    const s1 = result.current.scenes.find((s) => s.id === scene1Id)!;
    const s2 = result.current.scenes.find((s) => s.id === scene2Id)!;
    expect(s2.order).toBeLessThan(s1.order);
  });
});

// ─── addPosition ─────────────────────────────────────────────
describe("useStageFormation - addPosition", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("존재하지 않는 씬에 포지션 추가 시 null을 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let ret: unknown;
    act(() => {
      ret = result.current.addPosition("non-existent", {
        memberName: "홍길동",
        x: 50,
        y: 50,
        color: "#ff0000",
      });
    });
    expect(ret).toBeNull();
  });

  it("정상 추가 시 포지션 객체를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    let pos: unknown;
    act(() => {
      pos = result.current.addPosition(sceneId, {
        memberName: "홍길동",
        x: 50,
        y: 50,
        color: "#ff0000",
      });
    });
    expect(pos).not.toBeNull();
    expect((pos as { memberName: string }).memberName).toBe("홍길동");
  });

  it("x 좌표가 100을 초과하면 100으로 클램핑된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    let pos: { x: number } | null;
    act(() => {
      pos = result.current.addPosition(sceneId, {
        memberName: "홍길동",
        x: 150,
        y: 50,
        color: "#ff0000",
      }) as { x: number } | null;
    });
    expect(pos?.x).toBe(100);
  });

  it("x 좌표가 0 미만이면 0으로 클램핑된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    let pos: { x: number } | null;
    act(() => {
      pos = result.current.addPosition(sceneId, {
        memberName: "홍길동",
        x: -10,
        y: 50,
        color: "#ff0000",
      }) as { x: number } | null;
    });
    expect(pos?.x).toBe(0);
  });

  it("y 좌표가 100을 초과하면 100으로 클램핑된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    let pos: { y: number } | null;
    act(() => {
      pos = result.current.addPosition(sceneId, {
        memberName: "홍길동",
        x: 50,
        y: 200,
        color: "#ff0000",
      }) as { y: number } | null;
    });
    expect(pos?.y).toBe(100);
  });

  it("정상 범위 x, y는 그대로 저장된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    let pos: { x: number; y: number } | null;
    act(() => {
      pos = result.current.addPosition(sceneId, {
        memberName: "홍길동",
        x: 50,
        y: 50,
        color: "#ff0000",
      }) as { x: number; y: number } | null;
    });
    expect(pos?.x).toBe(50);
    expect(pos?.y).toBe(50);
  });
});

// ─── updatePosition ──────────────────────────────────────────
describe("useStageFormation - updatePosition", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("존재하지 않는 씬에서 포지션 업데이트 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updatePosition("non-existent", "pos-1", { x: 20 });
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 포지션 업데이트 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.updatePosition(sceneId, "non-existent", { x: 20 });
    });
    expect(ret!).toBe(false);
  });

  it("포지션 x 좌표 업데이트가 반영된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    let posId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    act(() => {
      const pos = result.current.addPosition(sceneId, {
        memberName: "홍길동",
        x: 50,
        y: 50,
        color: "#ff0000",
      });
      posId = (pos as { id: string }).id;
    });
    act(() => {
      result.current.updatePosition(sceneId, posId, { x: 80 });
    });
    const scene = result.current.scenes.find((s) => s.id === sceneId)!;
    const pos = scene.positions.find((p) => p.id === posId)!;
    expect(pos.x).toBe(80);
  });

  it("x 좌표 업데이트도 0~100으로 클램핑된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    let posId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    act(() => {
      const pos = result.current.addPosition(sceneId, {
        memberName: "홍길동",
        x: 50,
        y: 50,
        color: "#ff0000",
      });
      posId = (pos as { id: string }).id;
    });
    act(() => {
      result.current.updatePosition(sceneId, posId, { x: 999 });
    });
    const scene = result.current.scenes.find((s) => s.id === sceneId)!;
    const pos = scene.positions.find((p) => p.id === posId)!;
    expect(pos.x).toBe(100);
  });
});

// ─── removePosition ──────────────────────────────────────────
describe("useStageFormation - removePosition", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("존재하지 않는 씬에서 포지션 제거 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.removePosition("non-existent", "pos-1");
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 포지션 제거 시 true를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    let posId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    act(() => {
      const pos = result.current.addPosition(sceneId, {
        memberName: "홍길동",
        x: 50,
        y: 50,
        color: "#ff0000",
      });
      posId = (pos as { id: string }).id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.removePosition(sceneId, posId);
    });
    expect(ret!).toBe(true);
  });

  it("포지션 제거 후 positions 배열에서 사라진다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    let posId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    act(() => {
      const pos = result.current.addPosition(sceneId, {
        memberName: "홍길동",
        x: 50,
        y: 50,
        color: "#ff0000",
      });
      posId = (pos as { id: string }).id;
    });
    act(() => {
      result.current.removePosition(sceneId, posId);
    });
    const scene = result.current.scenes.find((s) => s.id === sceneId)!;
    expect(scene.positions).toHaveLength(0);
  });

  it("존재하지 않는 포지션 제거 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let sceneId = "";
    act(() => {
      const scene = result.current.addScene({ name: "씬1" });
      sceneId = scene.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.removePosition(sceneId, "non-existent-pos");
    });
    expect(ret!).toBe(false);
  });
});

// ─── 무대 설정 ───────────────────────────────────────────────
describe("useStageFormation - 무대 설정", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("setStageSize로 무대 크기가 저장된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.setStageSize(20, 15);
    });
    expect(result.current.stageWidth).toBe(20);
    expect(result.current.stageDepth).toBe(15);
  });

  it("setNotes로 노트가 저장된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.setNotes("무대 오른쪽이 좁음");
    });
    expect(result.current.notes).toBe("무대 오른쪽이 좁음");
  });

  it("setStageSize 후 memStore에 업데이트된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.setStageSize(30, 20);
    });
    const stored = memStore["stage-formation-proj-1"] as StageFormationData;
    expect(stored.stageWidth).toBe(30);
    expect(stored.stageDepth).toBe(20);
  });
});

// ─── 통계 계산 ───────────────────────────────────────────────
describe("useStageFormation - 통계 계산", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("씬 수가 정확히 반영된다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => {
      result.current.addScene({ name: "씬1" });
    });
    act(() => {
      result.current.addScene({ name: "씬2" });
    });
    expect(result.current.stats.totalScenes).toBe(2);
  });

  it("포지션 합산 수가 정확하다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let s1Id = "";
    let s2Id = "";
    act(() => {
      const s1 = result.current.addScene({ name: "씬1" });
      s1Id = s1.id;
    });
    act(() => {
      const s2 = result.current.addScene({ name: "씬2" });
      s2Id = s2.id;
    });
    act(() => {
      result.current.addPosition(s1Id, { memberName: "A", x: 10, y: 10, color: "#000" });
    });
    act(() => {
      result.current.addPosition(s1Id, { memberName: "B", x: 20, y: 20, color: "#000" });
    });
    act(() => {
      result.current.addPosition(s2Id, { memberName: "C", x: 30, y: 30, color: "#000" });
    });
    expect(result.current.stats.totalPositions).toBe(3);
  });

  it("씬당 평균 포지션 수가 정확하다 (소수점 1자리 반올림)", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    let s1Id = "";
    let s2Id = "";
    act(() => {
      const s1 = result.current.addScene({ name: "씬1" });
      s1Id = s1.id;
    });
    act(() => {
      const s2 = result.current.addScene({ name: "씬2" });
      s2Id = s2.id;
    });
    act(() => {
      result.current.addPosition(s1Id, { memberName: "A", x: 10, y: 10, color: "#000" });
    });
    act(() => {
      result.current.addPosition(s1Id, { memberName: "B", x: 20, y: 20, color: "#000" });
    });
    act(() => {
      result.current.addPosition(s2Id, { memberName: "C", x: 30, y: 30, color: "#000" });
    });
    // (3 positions / 2 scenes) = 1.5
    expect(result.current.stats.averagePositionsPerScene).toBe(1.5);
  });

  it("씬이 0개일 때 averagePositionsPerScene는 0이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    expect(result.current.stats.averagePositionsPerScene).toBe(0);
  });
});

// ─── 프로젝트별 격리 ─────────────────────────────────────────
describe("useStageFormation - 프로젝트별 격리", () => {
  beforeEach(() => {
    clearStore();
  });

  it("다른 projectId는 독립적인 데이터를 갖는다", () => {
    const f1: StageFormationData = {
      ...makeEmptyFormation("proj-a"),
      scenes: [{ id: "s1", name: "씬A", description: "", positions: [], order: 1, durationSec: null }],
    };
    const f2: StageFormationData = {
      ...makeEmptyFormation("proj-b"),
      scenes: [{ id: "s2", name: "씬B", description: "", positions: [], order: 1, durationSec: null }],
    };

    seedFormation("proj-a", f1);
    seedFormation("proj-b", f2);

    const { result: rA } = renderHook(() => useStageFormation("proj-a"));
    const { result: rB } = renderHook(() => useStageFormation("proj-b"));

    expect(rA.current.scenes[0].name).toBe("씬A");
    expect(rB.current.scenes[0].name).toBe("씬B");
  });

  it("저장 시 키에 projectId가 포함된다", () => {
    seedFormation("my-project-xyz", makeEmptyFormation("my-project-xyz"));
    const { result } = renderHook(() => useStageFormation("my-project-xyz"));
    act(() => {
      result.current.addScene({ name: "씬1" });
    });
    expect("stage-formation-my-project-xyz" in memStore).toBe(true);
  });
});

// ─── scenes 정렬 ─────────────────────────────────────────────
describe("useStageFormation - scenes 정렬", () => {
  beforeEach(() => {
    clearStore();
    seedFormation("proj-1", makeEmptyFormation("proj-1"));
  });

  it("반환되는 scenes는 order 기준 오름차순 정렬이다", () => {
    const { result } = renderHook(() => useStageFormation("proj-1"));
    act(() => { result.current.addScene({ name: "씬1" }); });
    act(() => { result.current.addScene({ name: "씬2" }); });
    act(() => { result.current.addScene({ name: "씬3" }); });
    const orders = result.current.scenes.map((s) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
