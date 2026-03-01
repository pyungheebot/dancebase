import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── localStorage mock ────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

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

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const { useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }
      // fetcher를 동기적으로 호출하되, Promise가 반환되면 undefined로 처리
      let initialData: unknown;
      try {
        const result = fetcher();
        if (result instanceof Promise) {
          initialData = undefined;
        } else {
          initialData = result;
        }
      } catch {
        initialData = undefined;
      }

      const [data, setData] = reactUseState<unknown>(initialData);
      const setDataRef = useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          try {
            const result = fetcher!();
            if (!(result instanceof Promise)) {
              setDataRef.current(result);
            }
          } catch {
            // ignore
          }
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    mediaPressKit: (groupId: string, projectId: string) =>
      `media-press-kit-${groupId}-${projectId}`,
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
    PRESS: {
      TITLE_REQUIRED: "제목을 입력해주세요",
      ADDED: "보도자료가 추가되었습니다",
      UPDATED: "보도자료가 수정되었습니다",
      DELETED: "보도자료가 삭제되었습니다",
      MEDIA_REQUIRED: "매체명을 입력해주세요",
      MEDIA_ADDED: "매체가 추가되었습니다",
      MEDIA_DELETED: "매체가 삭제되었습니다",
      NOT_FOUND: "보도자료를 찾을 수 없습니다",
    },
    INFO: {
      DATE_WRITTEN_REQUIRED: "작성일을 입력해주세요",
      AMBASSADOR_REQUIRED: "담당자명을 입력해주세요",
    },
    CONTENT_REQUIRED: "내용을 입력해주세요",
    NOT_FOUND: "항목을 찾을 수 없습니다",
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useMediaPressKit } from "@/hooks/use-media-press-kit";
import { toast } from "sonner";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1", projectId = "project-1") {
  return renderHook(() => useMediaPressKit(groupId, projectId));
}

function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

function makeEntryInput(overrides: Partial<{
  title: string;
  writtenAt: string;
  content: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  attachmentUrls?: string[];
}> = {}) {
  return {
    title: "춤 공연 보도자료",
    writtenAt: "2026-03-01",
    content: "이번 공연은 특별합니다.",
    contactName: "홍길동",
    ...overrides,
  };
}

// ============================================================
// useMediaPressKit - 초기 상태
// ============================================================

describe("useMediaPressKit - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("초기 stats.total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });

  it("초기 stats.draft는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.draft).toBe(0);
  });

  it("초기 stats.review는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.review).toBe(0);
  });

  it("초기 stats.published는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.published).toBe(0);
  });

  it("초기 stats.totalOutlets는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalOutlets).toBe(0);
  });

  it("초기 stats.publishedOutlets는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.publishedOutlets).toBe(0);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.updateEntry).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.changeStatus).toBe("function");
    expect(typeof result.current.addOutlet).toBe("function");
    expect(typeof result.current.toggleOutletPublished).toBe("function");
    expect(typeof result.current.deleteOutlet).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useMediaPressKit - addEntry 보도자료 추가
// ============================================================

describe("useMediaPressKit - addEntry 보도자료 추가", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("유효한 입력으로 추가 시 entries 길이가 1이 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    expect(result.current.entries).toHaveLength(1);
  });

  it("유효한 입력으로 추가 시 true를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean = false;
    await act(async () => {
      ret = await result.current.addEntry(makeEntryInput());
    });
    expect(ret).toBe(true);
  });

  it("추가된 보도자료의 title이 올바르다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ title: "특별 공연 보도자료" }));
    });
    expect(result.current.entries[0].title).toBe("특별 공연 보도자료");
  });

  it("title의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ title: "  공연 보도자료  " }));
    });
    expect(result.current.entries[0].title).toBe("공연 보도자료");
  });

  it("추가된 보도자료의 초기 상태는 draft이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    expect(result.current.entries[0].status).toBe("draft");
  });

  it("추가된 보도자료의 outlets는 빈 배열이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    expect(result.current.entries[0].outlets).toEqual([]);
  });

  it("빈 title로 추가 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean = true;
    await act(async () => {
      ret = await result.current.addEntry(makeEntryInput({ title: "" }));
    });
    expect(ret).toBe(false);
    expect(result.current.entries).toHaveLength(0);
  });

  it("빈 title로 추가 시 toast.error가 호출된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ title: "" }));
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it("빈 writtenAt으로 추가 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean = true;
    await act(async () => {
      ret = await result.current.addEntry(makeEntryInput({ writtenAt: "" }));
    });
    expect(ret).toBe(false);
  });

  it("빈 content로 추가 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean = true;
    await act(async () => {
      ret = await result.current.addEntry(makeEntryInput({ content: "" }));
    });
    expect(ret).toBe(false);
  });

  it("빈 contactName으로 추가 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean = true;
    await act(async () => {
      ret = await result.current.addEntry(makeEntryInput({ contactName: "" }));
    });
    expect(ret).toBe(false);
  });

  it("추가 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("contactEmail을 포함할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ contactEmail: "test@example.com" }));
    });
    expect(result.current.entries[0].contactEmail).toBe("test@example.com");
  });

  it("attachmentUrls를 포함할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ attachmentUrls: ["https://example.com/file.pdf"] }));
    });
    expect(result.current.entries[0].attachmentUrls).toEqual(["https://example.com/file.pdf"]);
  });

  it("stats.total이 추가 후 1이 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    expect(result.current.stats.total).toBe(1);
  });

  it("추가 후 stats.draft가 1이 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    expect(result.current.stats.draft).toBe(1);
  });
});

// ============================================================
// useMediaPressKit - updateEntry 보도자료 수정
// ============================================================

describe("useMediaPressKit - updateEntry 보도자료 수정", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("유효한 id로 수정 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    let ret: boolean = false;
    await act(async () => {
      ret = await result.current.updateEntry(id, { title: "수정된 제목" });
    });
    expect(ret).toBe(true);
  });

  it("title을 수정할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ title: "원래 제목" }));
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.updateEntry(id, { title: "새 제목" });
    });
    expect(result.current.entries[0].title).toBe("새 제목");
  });

  it("존재하지 않는 id로 수정 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean = true;
    await act(async () => {
      ret = await result.current.updateEntry("non-existent", { title: "변경" });
    });
    expect(ret).toBe(false);
  });

  it("존재하지 않는 id로 수정 시 toast.error가 호출된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.updateEntry("non-existent", { title: "변경" });
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it("수정 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    vi.clearAllMocks();
    await act(async () => {
      await result.current.updateEntry(id, { title: "수정됨" });
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("content를 수정할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.updateEntry(id, { content: "새 내용" });
    });
    expect(result.current.entries[0].content).toBe("새 내용");
  });

  it("contactEmail을 undefined로 업데이트하면 제거된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ contactEmail: "old@test.com" }));
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.updateEntry(id, { contactEmail: "" });
    });
    expect(result.current.entries[0].contactEmail).toBeUndefined();
  });
});

// ============================================================
// useMediaPressKit - deleteEntry 보도자료 삭제
// ============================================================

describe("useMediaPressKit - deleteEntry 보도자료 삭제", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("삭제 시 entries 길이가 감소한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.deleteEntry(id);
    });
    expect(result.current.entries).toHaveLength(0);
  });

  it("삭제 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    let ret: boolean = false;
    await act(async () => {
      ret = await result.current.deleteEntry(id);
    });
    expect(ret).toBe(true);
  });

  it("삭제 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    vi.clearAllMocks();
    await act(async () => {
      await result.current.deleteEntry(id);
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("특정 항목만 삭제된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ title: "보도자료1" }));
    });
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ title: "보도자료2" }));
    });
    const firstId = result.current.entries.find((e) => e.title === "보도자료1")!.id;
    await act(async () => {
      await result.current.deleteEntry(firstId);
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].title).toBe("보도자료2");
  });

  it("삭제 후 stats.total이 감소한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.deleteEntry(id);
    });
    expect(result.current.stats.total).toBe(0);
  });
});

// ============================================================
// useMediaPressKit - changeStatus 상태 변경
// ============================================================

describe("useMediaPressKit - changeStatus 배포 상태 변경", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("draft에서 review로 변경할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.changeStatus(id, "review");
    });
    expect(result.current.entries[0].status).toBe("review");
  });

  it("review에서 published로 변경할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.changeStatus(id, "published");
    });
    expect(result.current.entries[0].status).toBe("published");
  });

  it("상태 변경 성공 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    let ret: boolean = false;
    await act(async () => {
      ret = await result.current.changeStatus(id, "review");
    });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 id로 상태 변경 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean = true;
    await act(async () => {
      ret = await result.current.changeStatus("non-existent", "review");
    });
    expect(ret).toBe(false);
  });

  it("상태가 published로 변경되면 stats.published가 증가한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.changeStatus(id, "published");
    });
    expect(result.current.stats.published).toBe(1);
    expect(result.current.stats.draft).toBe(0);
  });

  it("상태가 review로 변경되면 stats.review가 증가한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.changeStatus(id, "review");
    });
    expect(result.current.stats.review).toBe(1);
    expect(result.current.stats.draft).toBe(0);
  });

  it("상태 변경 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const id = result.current.entries[0].id;
    vi.clearAllMocks();
    await act(async () => {
      await result.current.changeStatus(id, "review");
    });
    expect(toast.success).toHaveBeenCalled();
  });
});

// ============================================================
// useMediaPressKit - addOutlet 매체 추가
// ============================================================

describe("useMediaPressKit - addOutlet 매체 추가", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("매체 추가 시 outlets 길이가 증가한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    await act(async () => {
      await result.current.addOutlet(entryId, {
        name: "댄스매거진",
        type: "magazine",
      });
    });
    expect(result.current.entries[0].outlets).toHaveLength(1);
  });

  it("매체 추가 성공 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    let ret: boolean = false;
    await act(async () => {
      ret = await result.current.addOutlet(entryId, {
        name: "댄스매거진",
        type: "magazine",
      });
    });
    expect(ret).toBe(true);
  });

  it("빈 매체명으로 추가 시 false를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    let ret: boolean = true;
    await act(async () => {
      ret = await result.current.addOutlet(entryId, {
        name: "",
        type: "online",
      });
    });
    expect(ret).toBe(false);
  });

  it("존재하지 않는 entryId로 추가 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean = true;
    await act(async () => {
      ret = await result.current.addOutlet("non-existent", {
        name: "매거진",
        type: "magazine",
      });
    });
    expect(ret).toBe(false);
  });

  it("매체 추가 후 stats.totalOutlets가 증가한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    await act(async () => {
      await result.current.addOutlet(entryId, { name: "TV채널", type: "tv" });
    });
    expect(result.current.stats.totalOutlets).toBe(1);
  });

  it("매체 추가 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    vi.clearAllMocks();
    await act(async () => {
      await result.current.addOutlet(entryId, { name: "라디오", type: "radio" });
    });
    expect(toast.success).toHaveBeenCalled();
  });
});

// ============================================================
// useMediaPressKit - toggleOutletPublished 게재 토글
// ============================================================

describe("useMediaPressKit - toggleOutletPublished 게재 여부 토글", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("미게재 매체를 토글하면 published가 true가 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    await act(async () => {
      await result.current.addOutlet(entryId, { name: "매거진", type: "magazine" });
    });
    const outletId = result.current.entries[0].outlets[0].id;
    await act(async () => {
      await result.current.toggleOutletPublished(entryId, outletId);
    });
    expect(result.current.entries[0].outlets[0].published).toBe(true);
  });

  it("게재된 매체를 토글하면 published가 false가 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    await act(async () => {
      await result.current.addOutlet(entryId, { name: "매거진", type: "magazine" });
    });
    const outletId = result.current.entries[0].outlets[0].id;
    await act(async () => {
      await result.current.toggleOutletPublished(entryId, outletId);
    });
    await act(async () => {
      await result.current.toggleOutletPublished(entryId, outletId);
    });
    expect(result.current.entries[0].outlets[0].published).toBe(false);
  });

  it("게재 완료 시 stats.publishedOutlets가 증가한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    await act(async () => {
      await result.current.addOutlet(entryId, { name: "매거진", type: "magazine" });
    });
    const outletId = result.current.entries[0].outlets[0].id;
    await act(async () => {
      await result.current.toggleOutletPublished(entryId, outletId);
    });
    expect(result.current.stats.publishedOutlets).toBe(1);
  });

  it("게재 완료 시 publishedAt이 설정된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    await act(async () => {
      await result.current.addOutlet(entryId, { name: "매거진", type: "magazine" });
    });
    const outletId = result.current.entries[0].outlets[0].id;
    await act(async () => {
      await result.current.toggleOutletPublished(entryId, outletId);
    });
    expect(result.current.entries[0].outlets[0].publishedAt).toBeDefined();
  });

  it("존재하지 않는 entryId로 토글 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean = true;
    await act(async () => {
      ret = await result.current.toggleOutletPublished("non-existent", "outlet-1");
    });
    expect(ret).toBe(false);
  });
});

// ============================================================
// useMediaPressKit - deleteOutlet 매체 삭제
// ============================================================

describe("useMediaPressKit - deleteOutlet 매체 삭제", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("매체 삭제 후 outlets 길이가 감소한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    await act(async () => {
      await result.current.addOutlet(entryId, { name: "매거진", type: "magazine" });
    });
    const outletId = result.current.entries[0].outlets[0].id;
    await act(async () => {
      await result.current.deleteOutlet(entryId, outletId);
    });
    expect(result.current.entries[0].outlets).toHaveLength(0);
  });

  it("매체 삭제 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    await act(async () => {
      await result.current.addOutlet(entryId, { name: "매거진", type: "magazine" });
    });
    const outletId = result.current.entries[0].outlets[0].id;
    let ret: boolean = false;
    await act(async () => {
      ret = await result.current.deleteOutlet(entryId, outletId);
    });
    expect(ret).toBe(true);
  });

  it("매체 삭제 후 stats.totalOutlets가 감소한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    await act(async () => {
      await result.current.addOutlet(entryId, { name: "매거진", type: "magazine" });
    });
    const outletId = result.current.entries[0].outlets[0].id;
    await act(async () => {
      await result.current.deleteOutlet(entryId, outletId);
    });
    expect(result.current.stats.totalOutlets).toBe(0);
  });

  it("매체 삭제 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput());
    });
    const entryId = result.current.entries[0].id;
    await act(async () => {
      await result.current.addOutlet(entryId, { name: "매거진", type: "magazine" });
    });
    const outletId = result.current.entries[0].outlets[0].id;
    vi.clearAllMocks();
    await act(async () => {
      await result.current.deleteOutlet(entryId, outletId);
    });
    expect(toast.success).toHaveBeenCalled();
  });
});

// ============================================================
// useMediaPressKit - entries 정렬
// ============================================================

describe("useMediaPressKit - entries 정렬", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("entries는 writtenAt 내림차순으로 정렬된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ title: "오래된 자료", writtenAt: "2026-01-01" }));
    });
    await act(async () => {
      await result.current.addEntry(makeEntryInput({ title: "최신 자료", writtenAt: "2026-03-01" }));
    });
    expect(result.current.entries[0].title).toBe("최신 자료");
    expect(result.current.entries[1].title).toBe("오래된 자료");
  });
});

// ============================================================
// useMediaPressKit - 프로젝트별 격리
// ============================================================

describe("useMediaPressKit - 프로젝트별 데이터 격리", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("다른 projectId는 독립적인 entries를 가진다", async () => {
    const { result: r1 } = renderHook(() => useMediaPressKit("group-1", "project-A"));
    const { result: r2 } = renderHook(() => useMediaPressKit("group-1", "project-B"));

    await act(async () => {
      await r1.current.addEntry(makeEntryInput({ title: "프로젝트 A 자료" }));
    });

    expect(r1.current.entries).toHaveLength(1);
    expect(r2.current.entries).toHaveLength(0);
  });
});
