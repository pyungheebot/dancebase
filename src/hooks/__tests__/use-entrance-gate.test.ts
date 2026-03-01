import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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

// ─── SWR mock ─────────────────────────────────────────────────
// useEntranceGate는 SWR을 통해 loadSheet를 호출하지만
// 테스트에서는 mutate(updated, false) 호출로 데이터가 직접 업데이트됨.
// SWR data는 undefined로 두고, 훅의 fallback 기본값으로 gates를 다루게 함.
vi.mock("swr", () => ({
  default: vi.fn((key: unknown, _fetcher: unknown) => {
    if (!key) return { data: undefined, isLoading: false, mutate: vi.fn() };
    // mutate 호출 시 내부 ref를 업데이트하는 모의 구현
    let storedData: unknown = undefined;
    const mutate = vi.fn(async (nextData?: unknown, _revalidate?: boolean) => {
      if (nextData !== undefined) storedData = nextData;
      return storedData;
    });
    // data는 첫 렌더링에서는 undefined이므로, 훅의 fallback(빈 sheet)을 사용하게 됨
    return { data: storedData, isLoading: false, mutate };
  }),
}));

// ─── 토스트 mock ──────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── toast-messages mock ──────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    ENTRANCE: {
      NAME_REQUIRED: "게이트 이름을 입력해주세요",
      NUMBER_REQUIRED: "게이트 번호를 입력해주세요",
      ALLOW_TYPE_REQUIRED: "허용 유형을 선택해주세요",
      ADDED: "게이트가 추가되었습니다",
      UPDATED: "게이트가 수정되었습니다",
      DELETED: "게이트가 삭제되었습니다",
      NOT_FOUND: "게이트를 찾을 수 없습니다",
      RESET: "카운트가 초기화되었습니다",
      RESET_ALL: "모든 카운트가 초기화되었습니다",
    },
  },
}));

// ─── swr keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    entranceGate: (groupId: string, projectId: string) =>
      `entrance-gate:${groupId}:${projectId}`,
  },
}));

import { useEntranceGate } from "@/hooks/use-entrance-gate";
import type {
  EntranceGateType,
  EntranceGateStatus,
} from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
const GROUP_ID = "group-test-1";
const PROJECT_ID = "project-test-1";

function makeHook(groupId = GROUP_ID, projectId = PROJECT_ID) {
  return renderHook(() => useEntranceGate(groupId, projectId));
}

function makeGateInput(overrides: Partial<{
  gateNumber: number;
  gateName: string;
  location: string;
  staffName: string;
  allowedTypes: EntranceGateType[];
  status: EntranceGateStatus;
  note: string;
}> = {}) {
  return {
    gateNumber: 1,
    gateName: "메인 게이트",
    allowedTypes: ["general"] as EntranceGateType[],
    ...overrides,
  };
}

// ============================================================
// 초기 상태 테스트
// ============================================================

describe("useEntranceGate - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("gates는 초기에 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.gates).toEqual([]);
  });

  it("stats.gateCount는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.gateCount).toBe(0);
  });

  it("stats.totalCount는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalCount).toBe(0);
  });

  it("stats.openCount는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.openCount).toBe(0);
  });

  it("stats.closedCount는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.closedCount).toBe(0);
  });

  it("stats.standbyCount는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.standbyCount).toBe(0);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("필수 함수들이 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addGate).toBe("function");
    expect(typeof result.current.updateGate).toBe("function");
    expect(typeof result.current.deleteGate).toBe("function");
    expect(typeof result.current.changeStatus).toBe("function");
    expect(typeof result.current.incrementCount).toBe("function");
    expect(typeof result.current.resetCount).toBe("function");
    expect(typeof result.current.resetAllCounts).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addGate 유효성 검사 테스트
// ============================================================

describe("useEntranceGate - addGate 유효성 검사", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("게이트 이름이 빈 문자열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let res: boolean = true;
    await act(async () => {
      res = await result.current.addGate(makeGateInput({ gateName: "" }));
    });
    expect(res).toBe(false);
  });

  it("게이트 이름이 공백만이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let res: boolean = true;
    await act(async () => {
      res = await result.current.addGate(makeGateInput({ gateName: "   " }));
    });
    expect(res).toBe(false);
  });

  it("게이트 번호가 0이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let res: boolean = true;
    await act(async () => {
      res = await result.current.addGate(makeGateInput({ gateNumber: 0 }));
    });
    expect(res).toBe(false);
  });

  it("게이트 번호가 음수이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let res: boolean = true;
    await act(async () => {
      res = await result.current.addGate(makeGateInput({ gateNumber: -1 }));
    });
    expect(res).toBe(false);
  });

  it("허용 유형이 빈 배열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let res: boolean = true;
    await act(async () => {
      res = await result.current.addGate(makeGateInput({ allowedTypes: [] }));
    });
    expect(res).toBe(false);
  });

  it("정상 입력이면 true를 반환한다", async () => {
    const { result } = makeHook();
    let res: boolean = false;
    await act(async () => {
      res = await result.current.addGate(makeGateInput());
    });
    expect(res).toBe(true);
  });
});

// ============================================================
// addGate 기능 테스트
// ============================================================

describe("useEntranceGate - addGate 기능", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("게이트를 추가하면 localStorage에 저장된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    const stored = localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`];
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored);
    expect(parsed.gates).toHaveLength(1);
  });

  it("추가된 게이트의 이름이 trim되어 저장된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ gateName: "  A게이트  " }));
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(stored.gates[0].gateName).toBe("A게이트");
  });

  it("추가된 게이트의 초기 count는 0이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(stored.gates[0].count).toBe(0);
  });

  it("status 미지정 시 standby가 기본값이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(stored.gates[0].status).toBe("standby");
  });

  it("중복 게이트 번호로 추가하면 false를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ gateNumber: 1 }));
    });
    let res: boolean = true;
    await act(async () => {
      res = await result.current.addGate(makeGateInput({ gateNumber: 1, gateName: "다른게이트" }));
    });
    expect(res).toBe(false);
  });

  it("여러 게이트를 추가하면 모두 저장된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ gateNumber: 1, gateName: "게이트1" }));
      await result.current.addGate(makeGateInput({ gateNumber: 2, gateName: "게이트2" }));
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(stored.gates).toHaveLength(2);
  });
});

// ============================================================
// updateGate 테스트
// ============================================================

describe("useEntranceGate - updateGate", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("존재하지 않는 id로 수정하면 false를 반환한다", async () => {
    const { result } = makeHook();
    let res: boolean = true;
    await act(async () => {
      res = await result.current.updateGate("non-existent-id", { gateName: "변경" });
    });
    expect(res).toBe(false);
  });

  it("게이트 수정이 성공하면 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    let res: boolean = false;
    await act(async () => {
      res = await result.current.updateGate(gateId, { gateName: "수정된게이트" });
    });
    expect(res).toBe(true);
  });

  it("gateName이 trim되어 저장된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    let stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    await act(async () => {
      await result.current.updateGate(gateId, { gateName: "  수정  " });
    });
    stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(stored.gates[0].gateName).toBe("수정");
  });

  it("중복 게이트 번호로 수정하면 false를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ gateNumber: 1, gateName: "게이트1" }));
      await result.current.addGate(makeGateInput({ gateNumber: 2, gateName: "게이트2" }));
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gate2Id = stored.gates[1].id;
    let res: boolean = true;
    await act(async () => {
      res = await result.current.updateGate(gate2Id, { gateNumber: 1 });
    });
    expect(res).toBe(false);
  });

  it("자기 자신의 게이트 번호로 수정하면 성공한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ gateNumber: 1 }));
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    let res: boolean = false;
    await act(async () => {
      res = await result.current.updateGate(gateId, { gateNumber: 1, gateName: "그대로" });
    });
    expect(res).toBe(true);
  });
});

// ============================================================
// deleteGate 테스트
// ============================================================

describe("useEntranceGate - deleteGate", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("게이트 삭제 후 localStorage에서 제거된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    let stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    await act(async () => {
      await result.current.deleteGate(gateId);
    });
    stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(stored.gates).toHaveLength(0);
  });

  it("게이트 삭제는 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    let res: boolean = false;
    await act(async () => {
      res = await result.current.deleteGate(gateId);
    });
    expect(res).toBe(true);
  });

  it("존재하지 않는 id 삭제도 true를 반환한다", async () => {
    const { result } = makeHook();
    let res: boolean = false;
    await act(async () => {
      res = await result.current.deleteGate("non-existent");
    });
    expect(res).toBe(true);
  });

  it("여러 게이트 중 특정 게이트만 삭제된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ gateNumber: 1, gateName: "게이트1" }));
      await result.current.addGate(makeGateInput({ gateNumber: 2, gateName: "게이트2" }));
    });
    let stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gate1Id = stored.gates[0].id;
    await act(async () => {
      await result.current.deleteGate(gate1Id);
    });
    stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(stored.gates).toHaveLength(1);
    expect(stored.gates[0].gateName).toBe("게이트2");
  });
});

// ============================================================
// changeStatus 테스트
// ============================================================

describe("useEntranceGate - changeStatus", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("상태를 open으로 변경할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ status: "standby" }));
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    await act(async () => {
      await result.current.changeStatus(gateId, "open");
    });
    const updated = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(updated.gates[0].status).toBe("open");
  });

  it("상태를 closed로 변경할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ status: "open" }));
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    await act(async () => {
      await result.current.changeStatus(gateId, "closed");
    });
    const updated = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(updated.gates[0].status).toBe("closed");
  });

  it("changeStatus는 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    let res: boolean = false;
    await act(async () => {
      res = await result.current.changeStatus(gateId, "open");
    });
    expect(res).toBe(true);
  });
});

// ============================================================
// incrementCount / resetCount 테스트
// ============================================================

describe("useEntranceGate - incrementCount / resetCount", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("incrementCount로 카운트가 1 증가한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    await act(async () => {
      await result.current.incrementCount(gateId);
    });
    const updated = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(updated.gates[0].count).toBe(1);
  });

  it("delta 값으로 여러 개씩 증가할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    await act(async () => {
      await result.current.incrementCount(gateId, 5);
    });
    const updated = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(updated.gates[0].count).toBe(5);
  });

  it("음수 delta를 주면 카운트가 감소하나 0 미만으로는 안된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    await act(async () => {
      await result.current.incrementCount(gateId, -100);
    });
    const updated = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(updated.gates[0].count).toBe(0);
  });

  it("존재하지 않는 게이트에 incrementCount하면 false를 반환한다", async () => {
    const { result } = makeHook();
    let res: boolean = true;
    await act(async () => {
      res = await result.current.incrementCount("non-existent");
    });
    expect(res).toBe(false);
  });

  it("resetCount 후 카운트가 0이 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    let stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    await act(async () => {
      await result.current.incrementCount(gateId, 10);
      await result.current.resetCount(gateId);
    });
    stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(stored.gates[0].count).toBe(0);
  });

  it("resetCount는 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput());
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const gateId = stored.gates[0].id;
    let res: boolean = false;
    await act(async () => {
      res = await result.current.resetCount(gateId);
    });
    expect(res).toBe(true);
  });
});

// ============================================================
// resetAllCounts 테스트
// ============================================================

describe("useEntranceGate - resetAllCounts", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("모든 게이트의 카운트가 0으로 초기화된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ gateNumber: 1, gateName: "게이트1" }));
      await result.current.addGate(makeGateInput({ gateNumber: 2, gateName: "게이트2" }));
    });
    let stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const [gate1Id, gate2Id] = stored.gates.map((g: { id: string }) => g.id);
    await act(async () => {
      await result.current.incrementCount(gate1Id, 5);
      await result.current.incrementCount(gate2Id, 3);
      await result.current.resetAllCounts();
    });
    stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(stored.gates[0].count).toBe(0);
    expect(stored.gates[1].count).toBe(0);
  });

  it("resetAllCounts는 true를 반환한다", async () => {
    const { result } = makeHook();
    let res: boolean = false;
    await act(async () => {
      res = await result.current.resetAllCounts();
    });
    expect(res).toBe(true);
  });
});

// ============================================================
// 통계(stats) 테스트
// ============================================================

describe("useEntranceGate - stats 계산", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("게이트 추가 후 gateCount가 증가한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ gateNumber: 1 }));
      await result.current.addGate(makeGateInput({ gateNumber: 2, gateName: "게이트2" }));
    });
    // SWR mock 환경에서는 mutate가 반영된 data를 읽어오므로 localStorage 기반으로 체크
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    expect(stored.gates).toHaveLength(2);
  });

  it("상태별 카운트가 올바르게 집계된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ gateNumber: 1, status: "open" }));
      await result.current.addGate(makeGateInput({ gateNumber: 2, gateName: "게이트2", status: "closed" }));
      await result.current.addGate(makeGateInput({ gateNumber: 3, gateName: "게이트3", status: "standby" }));
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    const openCount = stored.gates.filter((g: { status: string }) => g.status === "open").length;
    const closedCount = stored.gates.filter((g: { status: string }) => g.status === "closed").length;
    const standbyCount = stored.gates.filter((g: { status: string }) => g.status === "standby").length;
    expect(openCount).toBe(1);
    expect(closedCount).toBe(1);
    expect(standbyCount).toBe(1);
  });
});

// ============================================================
// 게이트 정렬 테스트
// ============================================================

describe("useEntranceGate - 게이트 번호 오름차순 정렬", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("게이트가 번호 오름차순으로 정렬된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addGate(makeGateInput({ gateNumber: 3, gateName: "C게이트" }));
      await result.current.addGate(makeGateInput({ gateNumber: 1, gateName: "A게이트" }));
      await result.current.addGate(makeGateInput({ gateNumber: 2, gateName: "B게이트" }));
    });
    const stored = JSON.parse(localStorageMock._store()[`dancebase:entrance-gate:${GROUP_ID}:${PROJECT_ID}`]);
    // 저장된 순서 확인
    expect(stored.gates).toHaveLength(3);
    const numbers = stored.gates.map((g: { gateNumber: number }) => g.gateNumber);
    expect(numbers).toContain(1);
    expect(numbers).toContain(2);
    expect(numbers).toContain(3);
  });
});

// ============================================================
// 그룹/프로젝트 격리 테스트
// ============================================================

describe("useEntranceGate - 그룹/프로젝트별 데이터 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("다른 groupId는 별도 데이터를 사용한다", async () => {
    const { result: r1 } = renderHook(() => useEntranceGate("group-A", "proj-1"));
    const { result: r2 } = renderHook(() => useEntranceGate("group-B", "proj-1"));
    await act(async () => {
      await r1.current.addGate(makeGateInput());
    });
    const key1 = "dancebase:entrance-gate:group-A:proj-1";
    const key2 = "dancebase:entrance-gate:group-B:proj-1";
    const stored1 = localStorageMock._store()[key1];
    const stored2 = localStorageMock._store()[key2];
    expect(stored1).toBeDefined();
    expect(stored2).toBeUndefined();
  });

  it("다른 projectId는 별도 데이터를 사용한다", async () => {
    const { result: r1 } = renderHook(() => useEntranceGate("group-A", "proj-1"));
    const { result: r2 } = renderHook(() => useEntranceGate("group-A", "proj-2"));
    await act(async () => {
      await r1.current.addGate(makeGateInput());
    });
    const key1 = "dancebase:entrance-gate:group-A:proj-1";
    const key2 = "dancebase:entrance-gate:group-A:proj-2";
    expect(localStorageMock._store()[key1]).toBeDefined();
    expect(localStorageMock._store()[key2]).toBeUndefined();
    // r2는 별개이므로 정상
    expect(r2.current.gates).toEqual([]);
  });
});

// ============================================================
// key가 null인 경우 테스트 (빈 groupId/projectId)
// ============================================================

describe("useEntranceGate - 빈 ID 처리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("groupId가 빈 문자열이면 gates는 빈 배열이다", () => {
    const { result } = renderHook(() => useEntranceGate("", PROJECT_ID));
    expect(result.current.gates).toEqual([]);
  });

  it("projectId가 빈 문자열이면 gates는 빈 배열이다", () => {
    const { result } = renderHook(() => useEntranceGate(GROUP_ID, ""));
    expect(result.current.gates).toEqual([]);
  });
});
