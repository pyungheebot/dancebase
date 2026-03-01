import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

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

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useStageMemo } from "@/hooks/use-stage-memo";
import type { StageMemoZone } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
  _uuidCounter = 0;
}

function makeHook(groupId = "group-1", projectId = "project-1") {
  return renderHook(() => useStageMemo(groupId, projectId));
}

function addBoardHelper(
  hook: ReturnType<typeof makeHook>["result"],
  title = "메인 보드"
) {
  let board: ReturnType<ReturnType<typeof useStageMemo>["addBoard"]>;
  act(() => {
    board = hook.current.addBoard(title);
  });
  return board!;
}

function addNoteHelper(
  hook: ReturnType<typeof makeHook>["result"],
  boardId: string,
  overrides: Partial<{
    zone: StageMemoZone;
    priority: "high" | "medium" | "low";
    content: string;
    author: string;
    tags: string[];
  }> = {}
) {
  let note: ReturnType<ReturnType<typeof useStageMemo>["addNote"]>;
  act(() => {
    note = hook.current.addNote(boardId, {
      zone: overrides.zone ?? "center",
      priority: overrides.priority ?? "medium",
      content: overrides.content ?? "테스트 메모",
      author: overrides.author ?? "작성자A",
      tags: overrides.tags ?? [],
    });
  });
  return note!;
}

// ============================================================
// 초기 상태
// ============================================================

describe("useStageMemo - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 boards는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.boards).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalNotes는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalNotes).toBe(0);
  });

  it("초기 stats.unresolvedNotes는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.unresolvedNotes).toBe(0);
  });

  it("초기 stats.highPriorityNotes는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.highPriorityNotes).toBe(0);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addBoard).toBe("function");
    expect(typeof result.current.deleteBoard).toBe("function");
    expect(typeof result.current.addNote).toBe("function");
    expect(typeof result.current.updateNote).toBe("function");
    expect(typeof result.current.deleteNote).toBe("function");
    expect(typeof result.current.toggleResolved).toBe("function");
    expect(typeof result.current.getNotesByZone).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addBoard
// ============================================================

describe("useStageMemo - addBoard", () => {
  beforeEach(clearStore);

  it("보드 추가 후 boards 길이가 1이 된다", () => {
    const { result } = makeHook();
    addBoardHelper(result);
    expect(result.current.boards.length).toBe(1);
  });

  it("추가된 보드의 title이 올바르다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result, "1막 무대 메모");
    expect(board.title).toBe("1막 무대 메모");
  });

  it("추가된 보드의 projectId가 올바르다", () => {
    const { result } = makeHook("group-1", "proj-abc");
    const board = addBoardHelper(result);
    expect(board.projectId).toBe("proj-abc");
  });

  it("추가된 보드에 고유 id가 부여된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    expect(board.id).toBeTruthy();
  });

  it("추가된 보드의 초기 notes는 빈 배열이다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    expect(board.notes).toEqual([]);
  });

  it("추가된 보드에 createdAt이 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    expect(board.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("여러 보드를 추가할 수 있다", () => {
    const { result } = makeHook();
    addBoardHelper(result, "보드1");
    addBoardHelper(result, "보드2");
    addBoardHelper(result, "보드3");
    expect(result.current.boards.length).toBe(3);
  });

  it("보드 추가 시 localStorage에 저장된다", () => {
    const { result } = makeHook("group-1", "project-1");
    addBoardHelper(result);
    expect(memStore["dancebase:stage-memo:group-1:project-1"]).toBeDefined();
  });
});

// ============================================================
// deleteBoard
// ============================================================

describe("useStageMemo - deleteBoard", () => {
  beforeEach(clearStore);

  it("보드 삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.deleteBoard(board.id);
    });
    expect(ret!).toBe(true);
  });

  it("보드 삭제 후 boards 길이가 감소한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    act(() => {
      result.current.deleteBoard(board.id);
    });
    expect(result.current.boards.length).toBe(0);
  });

  it("특정 보드만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    const board1 = addBoardHelper(result, "보드1");
    addBoardHelper(result, "보드2");
    act(() => {
      result.current.deleteBoard(board1.id);
    });
    expect(result.current.boards.length).toBe(1);
    expect(result.current.boards[0].title).toBe("보드2");
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.deleteBoard("non-existent");
    });
    expect(ret!).toBe(false);
  });
});

// ============================================================
// addNote
// ============================================================

describe("useStageMemo - addNote", () => {
  beforeEach(clearStore);

  it("메모 추가 시 메모 객체를 반환한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    expect(note).not.toBeNull();
  });

  it("추가된 메모의 zone이 올바르다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id, { zone: "upstage-left" });
    expect(note?.zone).toBe("upstage-left");
  });

  it("추가된 메모의 priority가 올바르다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id, { priority: "high" });
    expect(note?.priority).toBe("high");
  });

  it("추가된 메모의 content가 올바르다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id, { content: "무대 왼쪽 조명 주의" });
    expect(note?.content).toBe("무대 왼쪽 조명 주의");
  });

  it("추가된 메모의 author가 올바르다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id, { author: "김연출" });
    expect(note?.author).toBe("김연출");
  });

  it("추가된 메모의 초기 isResolved는 false이다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    expect(note?.isResolved).toBe(false);
  });

  it("추가된 메모에 고유 id가 부여된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    expect(note?.id).toBeTruthy();
  });

  it("추가된 메모에 createdAt이 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    expect(note?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("존재하지 않는 boardId로 메모 추가 시 null을 반환한다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, "non-existent-board");
    expect(note).toBeNull();
  });

  it("메모 추가 후 해당 보드의 notes 길이가 증가한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    addNoteHelper(result, board.id);
    addNoteHelper(result, board.id);
    const updatedBoard = result.current.boards.find((b) => b.id === board.id);
    expect(updatedBoard?.notes).toHaveLength(2);
  });

  it("태그를 포함한 메모를 추가할 수 있다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id, { tags: ["조명", "주의"] });
    expect(note?.tags).toEqual(["조명", "주의"]);
  });
});

// ============================================================
// updateNote
// ============================================================

describe("useStageMemo - updateNote", () => {
  beforeEach(clearStore);

  it("메모 수정 시 true를 반환한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    let ret: boolean;
    act(() => {
      ret = result.current.updateNote(board.id, note!.id, { content: "수정된 메모" });
    });
    expect(ret!).toBe(true);
  });

  it("메모 내용을 수정할 수 있다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    act(() => {
      result.current.updateNote(board.id, note!.id, { content: "수정된 내용" });
    });
    const updatedBoard = result.current.boards.find((b) => b.id === board.id);
    const updatedNote = updatedBoard?.notes.find((n) => n.id === note!.id);
    expect(updatedNote?.content).toBe("수정된 내용");
  });

  it("메모 우선순위를 수정할 수 있다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id, { priority: "low" });
    act(() => {
      result.current.updateNote(board.id, note!.id, { priority: "high" });
    });
    const updatedBoard = result.current.boards.find((b) => b.id === board.id);
    const updatedNote = updatedBoard?.notes.find((n) => n.id === note!.id);
    expect(updatedNote?.priority).toBe("high");
  });

  it("메모 구역을 수정할 수 있다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id, { zone: "center" });
    act(() => {
      result.current.updateNote(board.id, note!.id, { zone: "downstage-right" });
    });
    const updatedBoard = result.current.boards.find((b) => b.id === board.id);
    const updatedNote = updatedBoard?.notes.find((n) => n.id === note!.id);
    expect(updatedNote?.zone).toBe("downstage-right");
  });

  it("존재하지 않는 boardId로 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.updateNote("non-existent", "note-id", { content: "수정" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 noteId로 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.updateNote(board.id, "non-existent-note", { content: "수정" });
    });
    expect(ret!).toBe(false);
  });
});

// ============================================================
// deleteNote
// ============================================================

describe("useStageMemo - deleteNote", () => {
  beforeEach(clearStore);

  it("메모 삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    let ret: boolean;
    act(() => {
      ret = result.current.deleteNote(board.id, note!.id);
    });
    expect(ret!).toBe(true);
  });

  it("메모 삭제 후 해당 보드의 notes 길이가 감소한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    act(() => {
      result.current.deleteNote(board.id, note!.id);
    });
    const updatedBoard = result.current.boards.find((b) => b.id === board.id);
    expect(updatedBoard?.notes).toHaveLength(0);
  });

  it("특정 메모만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note1 = addNoteHelper(result, board.id, { content: "메모1" });
    addNoteHelper(result, board.id, { content: "메모2" });
    act(() => {
      result.current.deleteNote(board.id, note1!.id);
    });
    const updatedBoard = result.current.boards.find((b) => b.id === board.id);
    expect(updatedBoard?.notes).toHaveLength(1);
    expect(updatedBoard?.notes[0].content).toBe("메모2");
  });

  it("존재하지 않는 boardId로 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.deleteNote("non-existent", "note-id");
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 noteId로 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.deleteNote(board.id, "non-existent-note");
    });
    expect(ret!).toBe(false);
  });
});

// ============================================================
// toggleResolved
// ============================================================

describe("useStageMemo - toggleResolved", () => {
  beforeEach(clearStore);

  it("미해결 메모 토글 시 isResolved가 true가 된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    act(() => {
      result.current.toggleResolved(board.id, note!.id);
    });
    const updatedBoard = result.current.boards.find((b) => b.id === board.id);
    const updatedNote = updatedBoard?.notes.find((n) => n.id === note!.id);
    expect(updatedNote?.isResolved).toBe(true);
  });

  it("해결된 메모 토글 시 isResolved가 false가 된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    act(() => {
      result.current.toggleResolved(board.id, note!.id);
    });
    act(() => {
      result.current.toggleResolved(board.id, note!.id);
    });
    const updatedBoard = result.current.boards.find((b) => b.id === board.id);
    const updatedNote = updatedBoard?.notes.find((n) => n.id === note!.id);
    expect(updatedNote?.isResolved).toBe(false);
  });

  it("토글 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    let ret: boolean;
    act(() => {
      ret = result.current.toggleResolved(board.id, note!.id);
    });
    expect(ret!).toBe(true);
  });

  it("존재하지 않는 boardId로 토글 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.toggleResolved("non-existent", "note-id");
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 noteId로 토글 시 false를 반환한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.toggleResolved(board.id, "non-existent-note");
    });
    expect(ret!).toBe(false);
  });
});

// ============================================================
// getNotesByZone
// ============================================================

describe("useStageMemo - getNotesByZone", () => {
  beforeEach(clearStore);

  it("9개 구역 키를 모두 포함한 객체를 반환한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const byZone = result.current.getNotesByZone(board.id);
    const zones: StageMemoZone[] = [
      "upstage-left", "upstage-center", "upstage-right",
      "center-left", "center", "center-right",
      "downstage-left", "downstage-center", "downstage-right",
    ];
    zones.forEach((zone) => {
      expect(Array.isArray(byZone[zone])).toBe(true);
    });
  });

  it("메모가 없는 경우 모든 구역의 배열이 비어있다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const byZone = result.current.getNotesByZone(board.id);
    Object.values(byZone).forEach((notes) => {
      expect(notes).toHaveLength(0);
    });
  });

  it("특정 구역에 추가된 메모가 해당 구역 배열에 포함된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    addNoteHelper(result, board.id, { zone: "upstage-left", content: "왼쪽 상단 메모" });
    const byZone = result.current.getNotesByZone(board.id);
    expect(byZone["upstage-left"]).toHaveLength(1);
    expect(byZone["upstage-left"][0].content).toBe("왼쪽 상단 메모");
  });

  it("같은 구역에 여러 메모를 추가할 수 있다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    addNoteHelper(result, board.id, { zone: "center" });
    addNoteHelper(result, board.id, { zone: "center" });
    const byZone = result.current.getNotesByZone(board.id);
    expect(byZone["center"]).toHaveLength(2);
  });

  it("다른 구역의 메모는 각자의 배열에 배치된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    addNoteHelper(result, board.id, { zone: "upstage-left" });
    addNoteHelper(result, board.id, { zone: "downstage-right" });
    const byZone = result.current.getNotesByZone(board.id);
    expect(byZone["upstage-left"]).toHaveLength(1);
    expect(byZone["downstage-right"]).toHaveLength(1);
    expect(byZone["center"]).toHaveLength(0);
  });

  it("존재하지 않는 boardId로 조회 시 모든 구역이 빈 배열이다", () => {
    const { result } = makeHook();
    const byZone = result.current.getNotesByZone("non-existent");
    Object.values(byZone).forEach((notes) => {
      expect(notes).toHaveLength(0);
    });
  });
});

// ============================================================
// stats 계산
// ============================================================

describe("useStageMemo - stats 계산", () => {
  beforeEach(clearStore);

  it("메모 추가 후 totalNotes가 증가한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    addNoteHelper(result, board.id);
    addNoteHelper(result, board.id);
    expect(result.current.stats.totalNotes).toBe(2);
  });

  it("미해결 메모 수가 올바르게 계산된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    addNoteHelper(result, board.id);
    act(() => {
      result.current.toggleResolved(board.id, note!.id);
    });
    expect(result.current.stats.unresolvedNotes).toBe(1);
  });

  it("high 우선순위 미해결 메모 수가 올바르게 계산된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    addNoteHelper(result, board.id, { priority: "high" });
    addNoteHelper(result, board.id, { priority: "high" });
    addNoteHelper(result, board.id, { priority: "low" });
    expect(result.current.stats.highPriorityNotes).toBe(2);
  });

  it("high 우선순위 해결된 메모는 highPriorityNotes에 포함되지 않는다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id, { priority: "high" });
    act(() => {
      result.current.toggleResolved(board.id, note!.id);
    });
    expect(result.current.stats.highPriorityNotes).toBe(0);
  });

  it("여러 보드의 메모를 합산하여 stats를 계산한다", () => {
    const { result } = makeHook();
    const board1 = addBoardHelper(result, "보드1");
    const board2 = addBoardHelper(result, "보드2");
    addNoteHelper(result, board1.id);
    addNoteHelper(result, board1.id);
    addNoteHelper(result, board2.id);
    expect(result.current.stats.totalNotes).toBe(3);
  });

  it("보드 삭제 시 해당 보드의 메모도 stats에서 제외된다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    addNoteHelper(result, board.id);
    addNoteHelper(result, board.id);
    act(() => {
      result.current.deleteBoard(board.id);
    });
    expect(result.current.stats.totalNotes).toBe(0);
  });

  it("메모 삭제 후 totalNotes가 감소한다", () => {
    const { result } = makeHook();
    const board = addBoardHelper(result);
    const note = addNoteHelper(result, board.id);
    addNoteHelper(result, board.id);
    act(() => {
      result.current.deleteNote(board.id, note!.id);
    });
    expect(result.current.stats.totalNotes).toBe(1);
  });
});

// ============================================================
// localStorage 캐시
// ============================================================

describe("useStageMemo - localStorage 캐시", () => {
  beforeEach(clearStore);

  it("스토리지 키는 'dancebase:stage-memo:{groupId}:{projectId}' 형식이다", () => {
    const { result } = makeHook("grp-1", "proj-1");
    addBoardHelper(result);
    expect(memStore["dancebase:stage-memo:grp-1:proj-1"]).toBeDefined();
  });

  it("저장된 데이터는 boards 배열이다", () => {
    const { result } = makeHook();
    addBoardHelper(result);
    const stored = memStore["dancebase:stage-memo:group-1:project-1"] as unknown[];
    expect(Array.isArray(stored)).toBe(true);
  });

  it("refetch 후 localStorage의 데이터를 다시 로드한다", () => {
    const { result } = makeHook();
    addBoardHelper(result);
    memStore["dancebase:stage-memo:group-1:project-1"] = [];
    act(() => {
      result.current.refetch();
    });
    expect(result.current.boards.length).toBe(0);
  });
});

// ============================================================
// 그룹/프로젝트별 격리
// ============================================================

describe("useStageMemo - 그룹/프로젝트별 격리", () => {
  beforeEach(clearStore);

  it("다른 projectId의 boards는 독립적이다", () => {
    const { result: result1 } = makeHook("group-1", "proj-A");
    const { result: result2 } = makeHook("group-1", "proj-B");
    addBoardHelper(result1, "프로젝트A 보드");
    expect(result2.current.boards.length).toBe(0);
  });

  it("다른 groupId의 boards는 독립적이다", () => {
    const { result: result1 } = makeHook("group-X", "proj-1");
    const { result: result2 } = makeHook("group-Y", "proj-1");
    addBoardHelper(result1, "그룹X 보드");
    expect(result2.current.boards.length).toBe(0);
  });

  it("각 프로젝트의 스토리지 키가 독립적으로 존재한다", () => {
    const { result: result1 } = makeHook("group-1", "proj-A");
    const { result: result2 } = makeHook("group-1", "proj-B");
    addBoardHelper(result1);
    addBoardHelper(result2);
    expect(memStore["dancebase:stage-memo:group-1:proj-A"]).toBeDefined();
    expect(memStore["dancebase:stage-memo:group-1:proj-B"]).toBeDefined();
  });
});
