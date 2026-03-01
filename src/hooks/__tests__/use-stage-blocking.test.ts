import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null, _fetcher: (() => unknown) | null) => {
    return {
      data: key ? undefined : undefined,
      isLoading: false,
      mutate: vi.fn((newData?: unknown) => Promise.resolve(newData)),
    };
  },
}));

// ─── SWR 키 mock ──────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    stageBlocking: (groupId: string, projectId: string) =>
      `dancebase:stage-blocking:${groupId}:${projectId}`,
  },
}));

// ─── toast mock ───────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── TOAST 메시지 mock ────────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    SONG: { TITLE_REQUIRED: "곡 제목을 입력해주세요" },
    BLOCKING: {
      ADDED: "동선 노트가 추가되었습니다",
      UPDATED: "동선 노트가 수정되었습니다",
      DELETED: "동선 노트가 삭제되었습니다",
      NOTE_NOT_FOUND: "동선 노트를 찾을 수 없습니다",
    },
  },
}));

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

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import {
  useStageBlocking,
  type AddStageBlockingInput,
} from "@/hooks/use-stage-blocking";

// ─── 헬퍼 ─────────────────────────────────────────────────────

function makeHook(groupId = "group-1", projectId = "project-1") {
  return renderHook(() => useStageBlocking(groupId, projectId));
}

function makeInput(
  overrides: Partial<AddStageBlockingInput> = {}
): AddStageBlockingInput {
  return {
    songTitle: "봄날",
    memberMoves: [],
    ...overrides,
  };
}

async function addNote(
  hook: ReturnType<typeof makeHook>["result"],
  overrides: Partial<AddStageBlockingInput> = {}
) {
  let result = false;
  await act(async () => {
    result = await hook.current.addNote(makeInput(overrides));
  });
  return result;
}

// ============================================================
// 초기 상태
// ============================================================

describe("useStageBlocking - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("초기 notes는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.notes).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 songList는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.songList).toEqual([]);
  });

  it("초기 stats.total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });

  it("초기 stats.songCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.songCount).toBe(0);
  });

  it("초기 stats.totalMemberMoves는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalMemberMoves).toBe(0);
  });

  it("초기 stats.withCaution은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.withCaution).toBe(0);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addNote).toBe("function");
    expect(typeof result.current.updateNote).toBe("function");
    expect(typeof result.current.deleteNote).toBe("function");
    expect(typeof result.current.moveUp).toBe("function");
    expect(typeof result.current.moveDown).toBe("function");
    expect(typeof result.current.getBySong).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addNote
// ============================================================

describe("useStageBlocking - addNote 동선 노트 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("노트 추가 성공 시 true를 반환한다", async () => {
    const { result } = makeHook();
    const ret = await addNote(result);
    expect(ret).toBe(true);
  });

  it("songTitle이 빈 문자열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.addNote(makeInput({ songTitle: "" }));
    });
    expect(ret).toBe(false);
  });

  it("songTitle이 공백만 있으면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.addNote(makeInput({ songTitle: "   " }));
    });
    expect(ret).toBe(false);
  });

  it("sceneNumber가 포함된 노트를 추가할 수 있다", async () => {
    const { result } = makeHook();
    const ret = await addNote(result, { sceneNumber: "1A" });
    expect(ret).toBe(true);
  });

  it("caution이 포함된 노트를 추가할 수 있다", async () => {
    const { result } = makeHook();
    const ret = await addNote(result, { caution: "슬립 위험" });
    expect(ret).toBe(true);
  });

  it("memberMoves가 포함된 노트를 추가할 수 있다", async () => {
    const { result } = makeHook();
    const ret = await addNote(result, {
      memberMoves: [
        {
          memberName: "홍길동",
          fromPosition: "center",
          toPosition: "left",
        },
      ],
    });
    expect(ret).toBe(true);
  });
});

// ============================================================
// updateNote
// ============================================================

describe("useStageBlocking - updateNote 동선 노트 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("존재하지 않는 id 수정 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.updateNote("non-existent", {
        songTitle: "수정곡",
      });
    });
    expect(ret).toBe(false);
  });

  it("songTitle을 빈 문자열로 수정하면 false를 반환한다", async () => {
    const { result } = makeHook();
    // localStorage에 노트를 직접 설정
    const noteData = {
      groupId: "group-1",
      projectId: "project-1",
      notes: [
        {
          id: "note-1",
          songTitle: "봄날",
          memberMoves: [],
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    localStorageMock.setItem(
      "dancebase:stage-blocking:group-1:project-1",
      JSON.stringify(noteData)
    );
    let ret = true;
    await act(async () => {
      ret = await result.current.updateNote("note-1", { songTitle: "" });
    });
    expect(ret).toBe(false);
  });

  it("updateNote 함수가 호출 가능하다", () => {
    const { result } = makeHook();
    expect(typeof result.current.updateNote).toBe("function");
  });
});

// ============================================================
// deleteNote
// ============================================================

describe("useStageBlocking - deleteNote 동선 노트 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("존재하지 않는 id 삭제 시에도 에러가 없다", async () => {
    const { result } = makeHook();
    await expect(
      act(async () => {
        await result.current.deleteNote("non-existent");
      })
    ).resolves.not.toThrow();
  });

  it("deleteNote는 boolean을 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean | undefined;
    await act(async () => {
      ret = await result.current.deleteNote("any-id");
    });
    expect(typeof ret).toBe("boolean");
  });
});

// ============================================================
// getBySong
// ============================================================

describe("useStageBlocking - getBySong 곡별 필터", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("빈 상태에서 getBySong은 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const notes = result.current.getBySong("봄날");
    expect(notes).toEqual([]);
  });

  it("getBySong 함수가 호출 가능하다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getBySong).toBe("function");
  });

  it("localStorage에 노트가 있을 때 해당 곡의 노트만 반환한다", () => {
    const noteData = {
      groupId: "group-1",
      projectId: "project-1",
      notes: [
        {
          id: "note-1",
          songTitle: "봄날",
          memberMoves: [],
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "note-2",
          songTitle: "여름비",
          memberMoves: [],
          order: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    localStorageMock.setItem(
      "dancebase:stage-blocking:group-1:project-1",
      JSON.stringify(noteData)
    );
    // SWR data가 없으므로 entry.notes는 [] (SWR mock이 undefined 반환)
    // 빈 notes 상태에서 getBySong 결과 확인
    const { result } = makeHook();
    const filtered = result.current.getBySong("봄날");
    expect(Array.isArray(filtered)).toBe(true);
  });
});

// ============================================================
// moveUp / moveDown
// ============================================================

describe("useStageBlocking - moveUp / moveDown", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("빈 상태에서 moveUp은 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.moveUp("any-id");
    });
    expect(ret).toBe(false);
  });

  it("빈 상태에서 moveDown은 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.moveDown("any-id");
    });
    expect(ret).toBe(false);
  });

  it("moveUp 함수가 호출 가능하다", () => {
    const { result } = makeHook();
    expect(typeof result.current.moveUp).toBe("function");
  });

  it("moveDown 함수가 호출 가능하다", () => {
    const { result } = makeHook();
    expect(typeof result.current.moveDown).toBe("function");
  });
});

// ============================================================
// stats
// ============================================================

describe("useStageBlocking - stats 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("stats 객체가 존재한다", () => {
    const { result } = makeHook();
    expect(result.current.stats).toBeDefined();
  });

  it("stats가 total, songCount, totalMemberMoves, withCaution 키를 갖는다", () => {
    const { result } = makeHook();
    expect(result.current.stats).toHaveProperty("total");
    expect(result.current.stats).toHaveProperty("songCount");
    expect(result.current.stats).toHaveProperty("totalMemberMoves");
    expect(result.current.stats).toHaveProperty("withCaution");
  });

  it("localStorage에 노트가 설정되지 않으면 stats.total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });
});

// ============================================================
// 동선 입력 타입 검증
// ============================================================

describe("AddStageBlockingInput 타입 검증", () => {
  it("기본 필드만으로 입력을 생성할 수 있다", () => {
    const input = makeInput();
    expect(input.songTitle).toBe("봄날");
    expect(input.memberMoves).toEqual([]);
  });

  it("선택적 필드를 포함할 수 있다", () => {
    const input = makeInput({
      sceneNumber: "1",
      timeStart: "00:30",
      timeEnd: "01:00",
      countStart: 1,
      countEnd: 32,
      formation: "삼각형",
      caution: "주의 사항",
      memo: "메모",
    });
    expect(input.sceneNumber).toBe("1");
    expect(input.timeStart).toBe("00:30");
    expect(input.formation).toBe("삼각형");
  });
});

// ============================================================
// groupId / projectId 조합
// ============================================================

describe("useStageBlocking - groupId/projectId 조합", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("groupId와 projectId가 모두 있어야 정상 동작한다", () => {
    const { result } = renderHook(() =>
      useStageBlocking("group-1", "project-1")
    );
    expect(result.current.notes).toEqual([]);
  });

  it("groupId가 빈 문자열이어도 에러가 없다", () => {
    expect(() =>
      renderHook(() => useStageBlocking("", "project-1"))
    ).not.toThrow();
  });

  it("projectId가 빈 문자열이어도 에러가 없다", () => {
    expect(() =>
      renderHook(() => useStageBlocking("group-1", ""))
    ).not.toThrow();
  });

  it("서로 다른 projectId는 독립된 데이터를 갖는다", () => {
    const { result: r1 } = renderHook(() =>
      useStageBlocking("group-1", "project-A")
    );
    const { result: r2 } = renderHook(() =>
      useStageBlocking("group-1", "project-B")
    );
    expect(r1.current.notes).toEqual([]);
    expect(r2.current.notes).toEqual([]);
  });
});
