import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormationEditor } from "@/hooks/use-formation-editor";

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
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── @/lib/local-storage mock ────────────────────────────────
vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    const raw = localStorageMock.getItem(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },
  saveToStorage: <T>(key: string, value: T): void => {
    localStorageMock.setItem(key, JSON.stringify(value));
  },
  removeFromStorage: (key: string): void => {
    localStorageMock.removeItem(key);
  },
}));

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1", projectId = "project-1") {
  return renderHook(() => useFormationEditor(groupId, projectId));
}

// ============================================================
// 초기 상태
// ============================================================

describe("useFormationEditor - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("초기 scenes는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.scenes).toEqual([]);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 canAddScene은 true이다 (최대 10개 미만)", () => {
    const { result } = makeHook();
    expect(result.current.canAddScene).toBe(true);
  });

  it("필수 함수들이 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addScene).toBe("function");
    expect(typeof result.current.deleteScene).toBe("function");
    expect(typeof result.current.addPosition).toBe("function");
    expect(typeof result.current.updatePosition).toBe("function");
    expect(typeof result.current.removePosition).toBe("function");
    expect(typeof result.current.copyPositionsFromScene).toBe("function");
  });
});

// ============================================================
// addScene
// ============================================================

describe("useFormationEditor - addScene", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("씬 추가 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => { success = result.current.addScene("인트로"); });
    expect(success!).toBe(true);
  });

  it("씬 추가 후 scenes 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("인트로"); });
    expect(result.current.scenes).toHaveLength(1);
  });

  it("추가된 씬의 label이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("버스"); });
    expect(result.current.scenes[0].label).toBe("버스");
  });

  it("추가된 씬의 초기 positions는 빈 배열이다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    expect(result.current.scenes[0].positions).toEqual([]);
  });

  it("추가된 씬에 id가 부여된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    expect(result.current.scenes[0].id).toBeDefined();
    expect(result.current.scenes[0].id).not.toBe("");
  });

  it("씬 추가 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("여러 씬을 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    act(() => { result.current.addScene("씬2"); });
    act(() => { result.current.addScene("씬3"); });
    expect(result.current.scenes).toHaveLength(3);
  });

  it("씬이 10개가 되면 canAddScene이 false가 된다", () => {
    const { result } = makeHook();
    for (let i = 1; i <= 10; i++) {
      act(() => { result.current.addScene(`씬${i}`); });
    }
    expect(result.current.canAddScene).toBe(false);
  });

  it("씬이 10개일 때 addScene은 false를 반환한다", () => {
    const { result } = makeHook();
    for (let i = 1; i <= 10; i++) {
      act(() => { result.current.addScene(`씬${i}`); });
    }
    let success: boolean;
    act(() => { success = result.current.addScene("초과 씬"); });
    expect(success!).toBe(false);
  });

  it("씬이 10개일 때 scenes 길이가 10으로 유지된다", () => {
    const { result } = makeHook();
    for (let i = 1; i <= 10; i++) {
      act(() => { result.current.addScene(`씬${i}`); });
    }
    act(() => { result.current.addScene("초과 씬"); });
    expect(result.current.scenes).toHaveLength(10);
  });
});

// ============================================================
// deleteScene
// ============================================================

describe("useFormationEditor - deleteScene", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("씬 삭제 후 scenes 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.deleteScene(sceneId); });
    expect(result.current.scenes).toHaveLength(0);
  });

  it("특정 씬만 삭제된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬A"); });
    act(() => { result.current.addScene("씬B"); });
    const sceneAId = result.current.scenes[0].id;
    const sceneBId = result.current.scenes[1].id;
    act(() => { result.current.deleteScene(sceneAId); });
    expect(result.current.scenes).toHaveLength(1);
    expect(result.current.scenes[0].id).toBe(sceneBId);
  });

  it("씬 삭제 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    localStorageMock.setItem.mockClear();
    act(() => { result.current.deleteScene(sceneId); });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("씬 삭제 후 canAddScene이 true로 복구된다", () => {
    const { result } = makeHook();
    for (let i = 1; i <= 10; i++) {
      act(() => { result.current.addScene(`씬${i}`); });
    }
    const firstId = result.current.scenes[0].id;
    act(() => { result.current.deleteScene(firstId); });
    expect(result.current.canAddScene).toBe(true);
  });
});

// ============================================================
// addPosition
// ============================================================

describe("useFormationEditor - addPosition", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("포지션 추가 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    let success: boolean;
    act(() => { success = result.current.addPosition(sceneId, "홍길동", "#FF0000"); });
    expect(success!).toBe(true);
  });

  it("존재하지 않는 씬에 포지션 추가 시 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => { success = result.current.addPosition("non-existent", "홍길동", "#FF0000"); });
    expect(success!).toBe(false);
  });

  it("포지션 추가 후 씬의 positions 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "홍길동", "#FF0000"); });
    expect(result.current.scenes[0].positions).toHaveLength(1);
  });

  it("추가된 포지션의 초기 x, y는 50이다 (무대 중앙)", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "홍길동", "#FF0000"); });
    expect(result.current.scenes[0].positions[0].x).toBe(50);
    expect(result.current.scenes[0].positions[0].y).toBe(50);
  });

  it("같은 이름의 멤버는 중복 추가가 불가능하다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "홍길동", "#FF0000"); });
    let success: boolean;
    act(() => { success = result.current.addPosition(sceneId, "홍길동", "#00FF00"); });
    expect(success!).toBe(false);
    expect(result.current.scenes[0].positions).toHaveLength(1);
  });

  it("다른 이름의 멤버는 같은 씬에 추가 가능하다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버A", "#FF0000"); });
    act(() => { result.current.addPosition(sceneId, "멤버B", "#00FF00"); });
    expect(result.current.scenes[0].positions).toHaveLength(2);
  });

  it("추가된 포지션의 memberName이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "김철수", "#FF0000"); });
    expect(result.current.scenes[0].positions[0].memberName).toBe("김철수");
  });

  it("추가된 포지션의 color가 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버", "#ABCDEF"); });
    expect(result.current.scenes[0].positions[0].color).toBe("#ABCDEF");
  });
});

// ============================================================
// updatePosition
// ============================================================

describe("useFormationEditor - updatePosition", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("포지션 업데이트 후 x, y 값이 변경된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버", "#FF0000"); });
    const memberId = result.current.scenes[0].positions[0].memberId;
    act(() => { result.current.updatePosition(sceneId, memberId, 30, 70); });
    expect(result.current.scenes[0].positions[0].x).toBe(30);
    expect(result.current.scenes[0].positions[0].y).toBe(70);
  });

  it("x 값이 2 미만이면 2로 클램프된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버", "#FF0000"); });
    const memberId = result.current.scenes[0].positions[0].memberId;
    act(() => { result.current.updatePosition(sceneId, memberId, -10, 50); });
    expect(result.current.scenes[0].positions[0].x).toBe(2);
  });

  it("x 값이 98 초과이면 98로 클램프된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버", "#FF0000"); });
    const memberId = result.current.scenes[0].positions[0].memberId;
    act(() => { result.current.updatePosition(sceneId, memberId, 110, 50); });
    expect(result.current.scenes[0].positions[0].x).toBe(98);
  });

  it("y 값이 2 미만이면 2로 클램프된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버", "#FF0000"); });
    const memberId = result.current.scenes[0].positions[0].memberId;
    act(() => { result.current.updatePosition(sceneId, memberId, 50, -5); });
    expect(result.current.scenes[0].positions[0].y).toBe(2);
  });

  it("y 값이 98 초과이면 98로 클램프된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버", "#FF0000"); });
    const memberId = result.current.scenes[0].positions[0].memberId;
    act(() => { result.current.updatePosition(sceneId, memberId, 50, 200); });
    expect(result.current.scenes[0].positions[0].y).toBe(98);
  });

  it("경계값 x=2, y=2도 유효하다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버", "#FF0000"); });
    const memberId = result.current.scenes[0].positions[0].memberId;
    act(() => { result.current.updatePosition(sceneId, memberId, 2, 2); });
    expect(result.current.scenes[0].positions[0].x).toBe(2);
    expect(result.current.scenes[0].positions[0].y).toBe(2);
  });

  it("경계값 x=98, y=98도 유효하다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버", "#FF0000"); });
    const memberId = result.current.scenes[0].positions[0].memberId;
    act(() => { result.current.updatePosition(sceneId, memberId, 98, 98); });
    expect(result.current.scenes[0].positions[0].x).toBe(98);
    expect(result.current.scenes[0].positions[0].y).toBe(98);
  });
});

// ============================================================
// removePosition
// ============================================================

describe("useFormationEditor - removePosition", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("포지션 제거 후 positions 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버", "#FF0000"); });
    const memberId = result.current.scenes[0].positions[0].memberId;
    act(() => { result.current.removePosition(sceneId, memberId); });
    expect(result.current.scenes[0].positions).toHaveLength(0);
  });

  it("특정 포지션만 제거된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버A", "#FF0000"); });
    act(() => { result.current.addPosition(sceneId, "멤버B", "#00FF00"); });
    const memberAId = result.current.scenes[0].positions[0].memberId;
    const memberBId = result.current.scenes[0].positions[1].memberId;
    act(() => { result.current.removePosition(sceneId, memberAId); });
    expect(result.current.scenes[0].positions).toHaveLength(1);
    expect(result.current.scenes[0].positions[0].memberId).toBe(memberBId);
  });

  it("포지션 제거 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬1"); });
    const sceneId = result.current.scenes[0].id;
    act(() => { result.current.addPosition(sceneId, "멤버", "#FF0000"); });
    const memberId = result.current.scenes[0].positions[0].memberId;
    localStorageMock.setItem.mockClear();
    act(() => { result.current.removePosition(sceneId, memberId); });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================
// copyPositionsFromScene
// ============================================================

describe("useFormationEditor - copyPositionsFromScene", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("복사 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬A"); });
    act(() => { result.current.addScene("씬B"); });
    const sceneAId = result.current.scenes[0].id;
    const sceneBId = result.current.scenes[1].id;
    act(() => { result.current.addPosition(sceneAId, "멤버1", "#FF0000"); });
    let success: boolean;
    act(() => { success = result.current.copyPositionsFromScene(sceneAId, sceneBId); });
    expect(success!).toBe(true);
  });

  it("존재하지 않는 원본 씬이면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬A"); });
    const sceneAId = result.current.scenes[0].id;
    let success: boolean;
    act(() => { success = result.current.copyPositionsFromScene("non-existent", sceneAId); });
    expect(success!).toBe(false);
  });

  it("존재하지 않는 대상 씬이면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬A"); });
    const sceneAId = result.current.scenes[0].id;
    let success: boolean;
    act(() => { success = result.current.copyPositionsFromScene(sceneAId, "non-existent"); });
    expect(success!).toBe(false);
  });

  it("복사 후 대상 씬의 positions 수가 원본과 같다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬A"); });
    act(() => { result.current.addScene("씬B"); });
    const sceneAId = result.current.scenes[0].id;
    const sceneBId = result.current.scenes[1].id;
    act(() => { result.current.addPosition(sceneAId, "멤버1", "#FF0000"); });
    act(() => { result.current.addPosition(sceneAId, "멤버2", "#00FF00"); });
    act(() => { result.current.copyPositionsFromScene(sceneAId, sceneBId); });
    expect(result.current.scenes[1].positions).toHaveLength(2);
  });

  it("복사된 포지션은 새로운 memberId를 가진다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬A"); });
    act(() => { result.current.addScene("씬B"); });
    const sceneAId = result.current.scenes[0].id;
    const sceneBId = result.current.scenes[1].id;
    act(() => { result.current.addPosition(sceneAId, "멤버1", "#FF0000"); });
    const originalMemberId = result.current.scenes[0].positions[0].memberId;
    act(() => { result.current.copyPositionsFromScene(sceneAId, sceneBId); });
    const copiedMemberId = result.current.scenes[1].positions[0].memberId;
    expect(copiedMemberId).not.toBe(originalMemberId);
  });

  it("복사된 포지션의 memberName은 원본과 같다", () => {
    const { result } = makeHook();
    act(() => { result.current.addScene("씬A"); });
    act(() => { result.current.addScene("씬B"); });
    const sceneAId = result.current.scenes[0].id;
    const sceneBId = result.current.scenes[1].id;
    act(() => { result.current.addPosition(sceneAId, "홍길동", "#FF0000"); });
    act(() => { result.current.copyPositionsFromScene(sceneAId, sceneBId); });
    expect(result.current.scenes[1].positions[0].memberName).toBe("홍길동");
  });
});
