import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const lsStore: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => lsStore[key] ?? null,
  setItem: (key: string, value: string) => { lsStore[key] = value; },
  removeItem: (key: string) => { delete lsStore[key]; },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── SWR mock ─────────────────────────────────────────────────
const swrDataStore: Record<string, unknown> = {};

vi.mock("swr", () => ({
  default: (key: string | null, fetcher: (() => Promise<unknown>) | null) => {
    if (!key || !fetcher) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    const mutate = vi.fn((next?: unknown) => {
      if (next !== undefined) swrDataStore[key] = next;
    });
    return {
      data: swrDataStore[key],
      isLoading: false,
      mutate,
    };
  },
}));

// ─── SWR 키 mock ────────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    photoCall: (groupId: string, projectId: string) =>
      `photo-call-${groupId}-${projectId}`,
  },
}));

// ─── toast mock ───────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    PHOTO_CALL: {
      TYPE_REQUIRED: "촬영 유형을 선택하세요",
      ADDED: "포토 콜 항목이 추가되었습니다",
    },
    NOT_FOUND: "항목을 찾을 수 없습니다",
    ITEM_UPDATED: "항목이 수정되었습니다",
    ITEM_DELETED: "항목이 삭제되었습니다",
  },
}));

// ─── 훅 import ────────────────────────────────────────────────
import { usePhotoCall } from "@/hooks/use-photo-call";
import type { AddPhotoCallInput } from "@/hooks/use-photo-call";
import { toast } from "sonner";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function clearStore() {
  Object.keys(lsStore).forEach((k) => delete lsStore[k]);
  Object.keys(swrDataStore).forEach((k) => delete swrDataStore[k]);
  _uuidCounter = 0;
  vi.clearAllMocks();
}

function makeHook(groupId = "g1", projectId = "p1") {
  return renderHook(() => usePhotoCall(groupId, projectId));
}

const LS_KEY = (g: string, p: string) => `dancebase:photo-call:${g}:${p}`;

const defaultInput: AddPhotoCallInput = {
  type: "group",
  participants: ["홍길동", "김영희"],
};

async function addEntryHelper(
  result: ReturnType<typeof makeHook>["result"],
  input: Partial<AddPhotoCallInput> = {}
) {
  let ok: boolean = false;
  await act(async () => {
    ok = await result.current.addEntry({ ...defaultInput, ...input });
  });
  return ok;
}

function getStored(g = "g1", p = "p1") {
  return JSON.parse(lsStore[LS_KEY(g, p)] ?? "[]");
}

// ============================================================
// 초기 상태
// ============================================================

describe("usePhotoCall - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });

  it("초기 stats.completed는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.completed).toBe(0);
  });

  it("초기 stats.pending는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.pending).toBe(0);
  });

  it("초기 stats.byType.group는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.byType.group).toBe(0);
  });

  it("초기 stats.byType.subgroup는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.byType.subgroup).toBe(0);
  });

  it("초기 stats.byType.individual는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.byType.individual).toBe(0);
  });

  it("초기 stats.byType.scene은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.byType.scene).toBe(0);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.updateEntry).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.toggleCompleted).toBe("function");
    expect(typeof result.current.moveEntry).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addEntry
// ============================================================

describe("usePhotoCall - addEntry", () => {
  beforeEach(clearStore);

  it("type이 없으면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ok: boolean = false;
    await act(async () => {
      // type을 강제로 undefined
      ok = await result.current.addEntry({
        type: undefined as unknown as "group",
        participants: [],
      });
    });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("정상 입력이면 true를 반환한다", async () => {
    const { result } = makeHook();
    const ok = await addEntryHelper(result);
    expect(ok).toBe(true);
  });

  it("추가 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    expect(toast.success).toHaveBeenCalled();
  });

  it("localStorage에 항목이 저장된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    expect(stored.length).toBe(1);
  });

  it("첫 번째 항목의 order는 1이다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    expect(stored[0]?.order).toBe(1);
  });

  it("두 번째 항목의 order는 2이다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    await addEntryHelper(result, { type: "individual" });
    const stored = getStored();
    expect(stored[1]?.order).toBe(2);
  });

  it("초기 completed는 false이다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    expect(stored[0]?.completed).toBe(false);
  });

  it("groupId와 projectId가 항목에 저장된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    expect(stored[0]?.groupId).toBe("g1");
    expect(stored[0]?.projectId).toBe("p1");
  });

  it("participants에서 빈 문자열이 필터링된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { participants: ["홍길동", "", "김영희", "  "] });
    const stored = getStored();
    // "  " 는 trim()이 truthy이지 않으므로 필터링
    expect(stored[0]?.participants).toEqual(["홍길동", "김영희"]);
  });

  it("time의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { time: "  14:00  " });
    const stored = getStored();
    expect(stored[0]?.time).toBe("14:00");
  });

  it("time이 빈 문자열이면 undefined로 저장된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { time: "" });
    const stored = getStored();
    expect(stored[0]?.time).toBeUndefined();
  });

  it("location의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { location: "  무대 앞  " });
    const stored = getStored();
    expect(stored[0]?.location).toBe("무대 앞");
  });

  it("photographer가 빈 문자열이면 undefined로 저장된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { photographer: "" });
    const stored = getStored();
    expect(stored[0]?.photographer).toBeUndefined();
  });

  it("poseDescription의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { poseDescription: "  브이 자세  " });
    const stored = getStored();
    expect(stored[0]?.poseDescription).toBe("브이 자세");
  });

  it("costume의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { costume: "  검정 드레스  " });
    const stored = getStored();
    expect(stored[0]?.costume).toBe("검정 드레스");
  });

  it("props의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { props: "  부채  " });
    const stored = getStored();
    expect(stored[0]?.props).toBe("부채");
  });

  it("memo의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { memo: "  메모 내용  " });
    const stored = getStored();
    expect(stored[0]?.memo).toBe("메모 내용");
  });

  it("createdAt과 updatedAt이 ISO 형식으로 설정된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    expect(stored[0]?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(stored[0]?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ============================================================
// updateEntry
// ============================================================

describe("usePhotoCall - updateEntry", () => {
  beforeEach(clearStore);

  it("존재하지 않는 id 수정 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.updateEntry("non-existent", { type: "individual" });
    });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("정상 수정 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    const entryId = stored[0]?.id;
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.updateEntry(entryId, { type: "individual" });
    });
    expect(ok).toBe(true);
  });

  it("수정 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    vi.clearAllMocks();
    const stored = getStored();
    const entryId = stored[0]?.id;
    await act(async () => {
      await result.current.updateEntry(entryId, { type: "scene" });
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("participants 수정 시 빈 문자열이 필터링된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    const entryId = stored[0]?.id;
    await act(async () => {
      await result.current.updateEntry(entryId, {
        participants: ["김철수", "", "이영희"],
      });
    });
    const updated = getStored();
    expect(updated[0]?.participants).toEqual(["김철수", "이영희"]);
  });

  it("location을 빈 문자열로 수정하면 undefined로 저장된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { location: "무대" });
    const stored = getStored();
    const entryId = stored[0]?.id;
    await act(async () => {
      await result.current.updateEntry(entryId, { location: "" });
    });
    const updated = getStored();
    expect(updated[0]?.location).toBeUndefined();
  });

  it("수정 후 updatedAt이 ISO 형식으로 설정된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    const entryId = stored[0]?.id;
    await act(async () => {
      await result.current.updateEntry(entryId, { type: "subgroup" });
    });
    const updated = getStored();
    expect(updated[0]?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(updated[0]?.type).toBe("subgroup");
  });
});

// ============================================================
// deleteEntry
// ============================================================

describe("usePhotoCall - deleteEntry", () => {
  beforeEach(clearStore);

  it("항목 삭제 후 localStorage에서 제거된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    const entryId = stored[0]?.id;
    await act(async () => {
      await result.current.deleteEntry(entryId);
    });
    const updated = getStored();
    expect(updated.length).toBe(0);
  });

  it("삭제 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    const entryId = stored[0]?.id;
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.deleteEntry(entryId);
    });
    expect(ok).toBe(true);
  });

  it("삭제 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    vi.clearAllMocks();
    const stored = getStored();
    const entryId = stored[0]?.id;
    await act(async () => {
      await result.current.deleteEntry(entryId);
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("특정 항목만 삭제되고 나머지는 유지된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { type: "group" });
    await addEntryHelper(result, { type: "individual" });
    const stored = getStored();
    const firstId = stored[0]?.id;
    await act(async () => {
      await result.current.deleteEntry(firstId);
    });
    const updated = getStored();
    expect(updated.length).toBe(1);
    expect(updated[0]?.type).toBe("individual");
  });
});

// ============================================================
// toggleCompleted
// ============================================================

describe("usePhotoCall - toggleCompleted", () => {
  beforeEach(clearStore);

  it("toggleCompleted 후 completed가 true가 된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    const entryId = stored[0]?.id;
    await act(async () => {
      await result.current.toggleCompleted(entryId);
    });
    const updated = getStored();
    expect(updated[0]?.completed).toBe(true);
  });

  it("두 번 토글하면 false로 돌아온다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    const entryId = stored[0]?.id;
    await act(async () => {
      await result.current.toggleCompleted(entryId);
    });
    await act(async () => {
      await result.current.toggleCompleted(entryId);
    });
    const updated = getStored();
    expect(updated[0]?.completed).toBe(false);
  });

  it("toggleCompleted 후 true를 반환한다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    const entryId = stored[0]?.id;
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.toggleCompleted(entryId);
    });
    expect(ok).toBe(true);
  });

  it("toggleCompleted 후 updatedAt이 ISO 형식으로 설정된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    const stored = getStored();
    const entryId = stored[0]?.id;
    await act(async () => {
      await result.current.toggleCompleted(entryId);
    });
    const updated = getStored();
    expect(updated[0]?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // completed가 true로 변경됨도 확인
    expect(updated[0]?.completed).toBe(true);
  });
});

// ============================================================
// moveEntry
// ============================================================

describe("usePhotoCall - moveEntry", () => {
  beforeEach(clearStore);

  it("첫 번째 항목을 up으로 이동 시 false를 반환한다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { type: "group" });
    await addEntryHelper(result, { type: "individual" });
    const stored = getStored();
    // order 1이 첫 번째
    const firstId = stored.find((e: { order: number }) => e.order === 1)?.id;
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.moveEntry(firstId, "up");
    });
    expect(ok).toBe(false);
  });

  it("마지막 항목을 down으로 이동 시 false를 반환한다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { type: "group" });
    await addEntryHelper(result, { type: "individual" });
    const stored = getStored();
    const lastId = stored.find((e: { order: number }) => e.order === 2)?.id;
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.moveEntry(lastId, "down");
    });
    expect(ok).toBe(false);
  });

  it("중간 항목을 up으로 이동 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { type: "group" });
    await addEntryHelper(result, { type: "individual" });
    const stored = getStored();
    const secondId = stored.find((e: { order: number }) => e.order === 2)?.id;
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.moveEntry(secondId, "up");
    });
    expect(ok).toBe(true);
  });

  it("moveEntry up 후 order가 교환된다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result, { type: "group" });    // order=1
    await addEntryHelper(result, { type: "individual" }); // order=2
    const stored = getStored();
    const firstId = stored.find((e: { order: number }) => e.order === 1)?.id;
    const secondId = stored.find((e: { order: number }) => e.order === 2)?.id;
    await act(async () => {
      await result.current.moveEntry(secondId, "up");
    });
    const updated = getStored();
    const afterFirst = updated.find((e: { id: string }) => e.id === firstId);
    const afterSecond = updated.find((e: { id: string }) => e.id === secondId);
    expect(afterFirst?.order).toBe(2);
    expect(afterSecond?.order).toBe(1);
  });

  it("존재하지 않는 id로 이동 시 false를 반환한다", async () => {
    const { result } = makeHook();
    await addEntryHelper(result);
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.moveEntry("non-existent", "up");
    });
    expect(ok).toBe(false);
  });
});

// ============================================================
// localStorage 키 형식
// ============================================================

describe("usePhotoCall - localStorage 키 형식", () => {
  beforeEach(clearStore);

  it("localStorage 키는 'dancebase:photo-call:{groupId}:{projectId}' 형식이다", async () => {
    const { result } = renderHook(() => usePhotoCall("myGroup", "myProject"));
    await act(async () => {
      await result.current.addEntry(defaultInput);
    });
    expect(lsStore["dancebase:photo-call:myGroup:myProject"]).toBeDefined();
  });
});

// ============================================================
// 그룹별 격리
// ============================================================

describe("usePhotoCall - 그룹별 격리", () => {
  beforeEach(clearStore);

  it("다른 groupId는 독립적인 localStorage를 사용한다", async () => {
    const { result: rA } = renderHook(() => usePhotoCall("gA", "p1"));
    const { result: rB } = renderHook(() => usePhotoCall("gB", "p1"));
    await act(async () => {
      await rA.current.addEntry(defaultInput);
    });
    expect(lsStore[LS_KEY("gA", "p1")]).toBeDefined();
    expect(lsStore[LS_KEY("gB", "p1")]).toBeUndefined();
  });

  it("다른 projectId는 독립적인 localStorage를 사용한다", async () => {
    const { result: r1 } = renderHook(() => usePhotoCall("g1", "p1"));
    const { result: r2 } = renderHook(() => usePhotoCall("g1", "p2"));
    await act(async () => {
      await r1.current.addEntry(defaultInput);
      await r2.current.addEntry({ ...defaultInput, type: "individual" });
    });
    const d1 = JSON.parse(lsStore[LS_KEY("g1", "p1")]);
    const d2 = JSON.parse(lsStore[LS_KEY("g1", "p2")]);
    expect(d1.length).toBe(1);
    expect(d2.length).toBe(1);
    expect(d1[0].type).toBe("group");
    expect(d2[0].type).toBe("individual");
  });
});

// ============================================================
// 경계값
// ============================================================

describe("usePhotoCall - 경계값", () => {
  beforeEach(clearStore);

  it("groupId가 빈 문자열이면 SWR key가 null이어서 데이터를 로드하지 않는다", () => {
    const { result } = renderHook(() => usePhotoCall("", "p1"));
    expect(result.current.entries).toEqual([]);
  });

  it("projectId가 빈 문자열이면 SWR key가 null이어서 데이터를 로드하지 않는다", () => {
    const { result } = renderHook(() => usePhotoCall("g1", ""));
    expect(result.current.entries).toEqual([]);
  });

  it("participants가 빈 배열이어도 추가에 성공한다", async () => {
    const { result } = makeHook();
    const ok = await addEntryHelper(result, { participants: [] });
    expect(ok).toBe(true);
  });

  it("5개 항목 추가 후 마지막 order는 5이다", async () => {
    const { result } = makeHook();
    for (let i = 0; i < 5; i++) {
      await addEntryHelper(result);
    }
    const stored = getStored();
    const maxOrder = Math.max(...stored.map((e: { order: number }) => e.order));
    expect(maxOrder).toBe(5);
  });
});
