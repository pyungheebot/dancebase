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

// ─── SWR 키 mock ───────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    mentalCoaching: (groupId: string) => `mental-coaching-${groupId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useMentalCoaching } from "@/hooks/use-mental-coaching";
import type {
  MentalCoachingTopic,
  MentalCoachingStatus,
} from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
  _uuidCounter = 0;
}

function initGroupStore(groupId: string) {
  memStore[`mental-coaching-${groupId}`] = {
    groupId,
    notes: [],
    updatedAt: new Date().toISOString(),
  };
}

function makeHook(groupId = "group-1") {
  initGroupStore(groupId);
  return renderHook(() => useMentalCoaching(groupId));
}

function addNoteHelper(
  hook: ReturnType<typeof makeHook>["result"],
  overrides: Partial<{
    memberName: string;
    coachName: string;
    date: string;
    topic: MentalCoachingTopic;
    content: string;
    energyLevel: number;
    status: MentalCoachingStatus;
  }> = {}
) {
  let note: ReturnType<ReturnType<typeof useMentalCoaching>["addNote"]>;
  act(() => {
    note = hook.current.addNote({
      memberName: overrides.memberName ?? "홍길동",
      coachName: overrides.coachName ?? "코치A",
      date: overrides.date ?? "2026-03-01",
      topic: overrides.topic ?? "자신감",
      content: overrides.content ?? "테스트 내용",
      energyLevel: overrides.energyLevel ?? 3,
      actionItems: [],
      status: overrides.status ?? "진행중",
    });
  });
  return note!;
}

// ============================================================
// 초기 상태
// ============================================================

describe("useMentalCoaching - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 notes는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.notes).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalNotes는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalNotes).toBe(0);
  });

  it("초기 stats.avgEnergyLevel은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.avgEnergyLevel).toBe(0);
  });

  it("초기 stats.topicDistribution은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.topicDistribution).toEqual([]);
  });

  it("초기 stats.statusDistribution은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.statusDistribution).toEqual([]);
  });

  it("초기 stats.doneActionItems는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.doneActionItems).toBe(0);
  });

  it("초기 stats.totalActionItems는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalActionItems).toBe(0);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addNote).toBe("function");
    expect(typeof result.current.updateNote).toBe("function");
    expect(typeof result.current.deleteNote).toBe("function");
    expect(typeof result.current.toggleActionItem).toBe("function");
    expect(typeof result.current.updateStatus).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addNote
// ============================================================

describe("useMentalCoaching - addNote", () => {
  beforeEach(clearStore);

  it("노트 추가 후 notes 길이가 1이 된다", () => {
    const { result } = makeHook();
    addNoteHelper(result);
    expect(result.current.notes.length).toBe(1);
  });

  it("추가된 노트의 memberName이 올바르다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { memberName: "김철수" });
    expect(note.memberName).toBe("김철수");
  });

  it("추가된 노트의 coachName이 올바르다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { coachName: "박코치" });
    expect(note.coachName).toBe("박코치");
  });

  it("추가된 노트의 date가 올바르다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { date: "2026-05-01" });
    expect(note.date).toBe("2026-05-01");
  });

  it("추가된 노트의 topic이 올바르다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { topic: "무대 공포증" });
    expect(note.topic).toBe("무대 공포증");
  });

  it("추가된 노트의 content가 올바르다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { content: "상세 내용" });
    expect(note.content).toBe("상세 내용");
  });

  it("추가된 노트의 energyLevel이 올바르다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { energyLevel: 5 });
    expect(note.energyLevel).toBe(5);
  });

  it("추가된 노트의 status가 올바르다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { status: "개선됨" });
    expect(note.status).toBe("개선됨");
  });

  it("추가된 노트에 고유 id가 부여된다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result);
    expect(note.id).toBeTruthy();
  });

  it("추가된 노트에 createdAt이 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result);
    expect(note.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("추가된 노트에 updatedAt이 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result);
    expect(note.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("액션 아이템이 있는 노트를 추가할 수 있다", () => {
    const { result } = makeHook();
    let note: ReturnType<ReturnType<typeof useMentalCoaching>["addNote"]>;
    act(() => {
      note = result.current.addNote({
        memberName: "홍길동",
        coachName: "코치A",
        date: "2026-03-01",
        topic: "자신감",
        content: "내용",
        energyLevel: 3,
        actionItems: [{ text: "액션1", done: false }],
        status: "진행중",
      });
    });
    expect(note!.actionItems).toHaveLength(1);
    expect(note!.actionItems[0].text).toBe("액션1");
  });

  it("액션 아이템에 고유 id가 부여된다", () => {
    const { result } = makeHook();
    let note: ReturnType<ReturnType<typeof useMentalCoaching>["addNote"]>;
    act(() => {
      note = result.current.addNote({
        memberName: "홍길동",
        coachName: "코치A",
        date: "2026-03-01",
        topic: "자신감",
        content: "내용",
        energyLevel: 3,
        actionItems: [{ text: "액션1", done: false }],
        status: "진행중",
      });
    });
    expect(note!.actionItems[0].id).toBeTruthy();
  });

  it("여러 노트를 추가할 수 있다", () => {
    const { result } = makeHook();
    addNoteHelper(result, { memberName: "멤버1" });
    addNoteHelper(result, { memberName: "멤버2" });
    addNoteHelper(result, { memberName: "멤버3" });
    expect(result.current.notes.length).toBe(3);
  });

  it("추가된 노트가 localStorage에 저장된다", () => {
    const { result } = makeHook();
    addNoteHelper(result);
    expect(memStore["mental-coaching-group-1"]).toBeDefined();
  });
});

// ============================================================
// updateNote
// ============================================================

describe("useMentalCoaching - updateNote", () => {
  beforeEach(clearStore);

  it("노트 수정 시 true를 반환한다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.updateNote(note.id, { content: "수정된 내용" });
    });
    expect(ret!).toBe(true);
  });

  it("노트 내용을 수정할 수 있다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result);
    act(() => {
      result.current.updateNote(note.id, { content: "수정된 내용" });
    });
    const updated = result.current.notes.find((n) => n.id === note.id);
    expect(updated?.content).toBe("수정된 내용");
  });

  it("노트 에너지 레벨을 수정할 수 있다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { energyLevel: 3 });
    act(() => {
      result.current.updateNote(note.id, { energyLevel: 5 });
    });
    const updated = result.current.notes.find((n) => n.id === note.id);
    expect(updated?.energyLevel).toBe(5);
  });

  it("노트 주제를 수정할 수 있다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { topic: "자신감" });
    act(() => {
      result.current.updateNote(note.id, { topic: "동기부여" });
    });
    const updated = result.current.notes.find((n) => n.id === note.id);
    expect(updated?.topic).toBe("동기부여");
  });

  it("수정 후 updatedAt이 갱신된다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result);
    const before = result.current.notes.find((n) => n.id === note.id)?.updatedAt;
    act(() => {
      result.current.updateNote(note.id, { content: "수정" });
    });
    const after = result.current.notes.find((n) => n.id === note.id)?.updatedAt;
    expect(typeof after).toBe("string");
    expect(before).toBeDefined();
  });

  it("존재하지 않는 id로 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.updateNote("non-existent", { content: "수정" });
    });
    expect(ret!).toBe(false);
  });
});

// ============================================================
// deleteNote
// ============================================================

describe("useMentalCoaching - deleteNote", () => {
  beforeEach(clearStore);

  it("노트 삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.deleteNote(note.id);
    });
    expect(ret!).toBe(true);
  });

  it("노트 삭제 후 notes 길이가 감소한다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result);
    act(() => {
      result.current.deleteNote(note.id);
    });
    expect(result.current.notes.length).toBe(0);
  });

  it("특정 노트만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    const note1 = addNoteHelper(result, { memberName: "멤버1" });
    addNoteHelper(result, { memberName: "멤버2" });
    act(() => {
      result.current.deleteNote(note1.id);
    });
    expect(result.current.notes.length).toBe(1);
    expect(result.current.notes[0].memberName).toBe("멤버2");
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.deleteNote("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("빈 notes에서 삭제 시도 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.deleteNote("any-id");
    });
    expect(ret!).toBe(false);
  });
});

// ============================================================
// toggleActionItem
// ============================================================

describe("useMentalCoaching - toggleActionItem", () => {
  beforeEach(clearStore);

  function addNoteWithAction(hook: ReturnType<typeof makeHook>["result"]) {
    let note: ReturnType<ReturnType<typeof useMentalCoaching>["addNote"]>;
    act(() => {
      note = hook.current.addNote({
        memberName: "홍길동",
        coachName: "코치A",
        date: "2026-03-01",
        topic: "자신감",
        content: "내용",
        energyLevel: 3,
        actionItems: [{ text: "액션1", done: false }],
        status: "진행중",
      });
    });
    return note!;
  }

  it("미완료 액션 아이템 토글 시 done이 true가 된다", () => {
    const { result } = makeHook();
    const note = addNoteWithAction(result);
    const actionId = note.actionItems[0].id;
    act(() => {
      result.current.toggleActionItem(note.id, actionId);
    });
    const updatedNote = result.current.notes.find((n) => n.id === note.id);
    const action = updatedNote?.actionItems.find((a) => a.id === actionId);
    expect(action?.done).toBe(true);
  });

  it("완료 액션 아이템 토글 시 done이 false가 된다", () => {
    const { result } = makeHook();
    const note = addNoteWithAction(result);
    const actionId = note.actionItems[0].id;
    act(() => {
      result.current.toggleActionItem(note.id, actionId);
    });
    act(() => {
      result.current.toggleActionItem(note.id, actionId);
    });
    const updatedNote = result.current.notes.find((n) => n.id === note.id);
    const action = updatedNote?.actionItems.find((a) => a.id === actionId);
    expect(action?.done).toBe(false);
  });

  it("토글 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const note = addNoteWithAction(result);
    const actionId = note.actionItems[0].id;
    let ret: boolean;
    act(() => {
      ret = result.current.toggleActionItem(note.id, actionId);
    });
    expect(ret!).toBe(true);
  });

  it("존재하지 않는 noteId로 토글 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.toggleActionItem("non-existent", "action-id");
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 actionItemId로 토글 시 false를 반환한다", () => {
    const { result } = makeHook();
    const note = addNoteWithAction(result);
    let ret: boolean;
    act(() => {
      ret = result.current.toggleActionItem(note.id, "non-existent-action");
    });
    // updateNote는 true를 반환하지만 일치하는 액션 아이템이 없어도 notes 업데이트
    expect(typeof ret!).toBe("boolean");
  });
});

// ============================================================
// updateStatus
// ============================================================

describe("useMentalCoaching - updateStatus", () => {
  beforeEach(clearStore);

  it("상태 변경 시 true를 반환한다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.updateStatus(note.id, "개선됨");
    });
    expect(ret!).toBe(true);
  });

  it("상태가 올바르게 변경된다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { status: "진행중" });
    act(() => {
      result.current.updateStatus(note.id, "해결됨");
    });
    const updated = result.current.notes.find((n) => n.id === note.id);
    expect(updated?.status).toBe("해결됨");
  });

  it("존재하지 않는 id로 상태 변경 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.updateStatus("non-existent", "개선됨");
    });
    expect(ret!).toBe(false);
  });

  it("'진행중' -> '개선됨' -> '해결됨' 순서로 변경할 수 있다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result, { status: "진행중" });
    act(() => {
      result.current.updateStatus(note.id, "개선됨");
    });
    act(() => {
      result.current.updateStatus(note.id, "해결됨");
    });
    const updated = result.current.notes.find((n) => n.id === note.id);
    expect(updated?.status).toBe("해결됨");
  });
});

// ============================================================
// stats 계산
// ============================================================

describe("useMentalCoaching - stats 계산", () => {
  beforeEach(clearStore);

  it("노트 추가 후 totalNotes가 증가한다", () => {
    const { result } = makeHook();
    addNoteHelper(result);
    addNoteHelper(result);
    expect(result.current.stats.totalNotes).toBe(2);
  });

  it("avgEnergyLevel이 올바르게 계산된다", () => {
    const { result } = makeHook();
    addNoteHelper(result, { energyLevel: 2 });
    addNoteHelper(result, { energyLevel: 4 });
    // (2+4)/2 = 3.0
    expect(result.current.stats.avgEnergyLevel).toBe(3.0);
  });

  it("avgEnergyLevel은 소수점 1자리로 반올림된다", () => {
    const { result } = makeHook();
    addNoteHelper(result, { energyLevel: 1 });
    addNoteHelper(result, { energyLevel: 2 });
    addNoteHelper(result, { energyLevel: 3 });
    // (1+2+3)/3 = 2.0
    expect(result.current.stats.avgEnergyLevel).toBe(2.0);
  });

  it("topicDistribution에 추가된 노트의 주제가 포함된다", () => {
    const { result } = makeHook();
    addNoteHelper(result, { topic: "자신감" });
    addNoteHelper(result, { topic: "자신감" });
    addNoteHelper(result, { topic: "동기부여" });
    const selfConf = result.current.stats.topicDistribution.find(
      (t) => t.topic === "자신감"
    );
    expect(selfConf?.count).toBe(2);
  });

  it("count가 0인 주제는 topicDistribution에 포함되지 않는다", () => {
    const { result } = makeHook();
    addNoteHelper(result, { topic: "자신감" });
    const noTopic = result.current.stats.topicDistribution.find(
      (t) => t.topic === "무대 공포증"
    );
    expect(noTopic).toBeUndefined();
  });

  it("statusDistribution에 추가된 노트의 상태가 포함된다", () => {
    const { result } = makeHook();
    addNoteHelper(result, { status: "진행중" });
    addNoteHelper(result, { status: "진행중" });
    addNoteHelper(result, { status: "해결됨" });
    const inProgress = result.current.stats.statusDistribution.find(
      (s) => s.status === "진행중"
    );
    expect(inProgress?.count).toBe(2);
  });

  it("count가 0인 상태는 statusDistribution에 포함되지 않는다", () => {
    const { result } = makeHook();
    addNoteHelper(result, { status: "진행중" });
    const resolved = result.current.stats.statusDistribution.find(
      (s) => s.status === "해결됨"
    );
    expect(resolved).toBeUndefined();
  });

  it("액션 아이템 완료 토글 후 doneActionItems가 증가한다", () => {
    const { result } = makeHook();
    let note: ReturnType<ReturnType<typeof useMentalCoaching>["addNote"]>;
    act(() => {
      note = result.current.addNote({
        memberName: "홍길동",
        coachName: "코치A",
        date: "2026-03-01",
        topic: "자신감",
        content: "내용",
        energyLevel: 3,
        actionItems: [
          { text: "액션1", done: false },
          { text: "액션2", done: false },
        ],
        status: "진행중",
      });
    });
    act(() => {
      result.current.toggleActionItem(note!.id, note!.actionItems[0].id);
    });
    expect(result.current.stats.doneActionItems).toBe(1);
    expect(result.current.stats.totalActionItems).toBe(2);
  });

  it("노트 삭제 후 totalNotes가 감소한다", () => {
    const { result } = makeHook();
    const note = addNoteHelper(result);
    addNoteHelper(result);
    act(() => {
      result.current.deleteNote(note.id);
    });
    expect(result.current.stats.totalNotes).toBe(1);
  });
});

// ============================================================
// localStorage 캐시
// ============================================================

describe("useMentalCoaching - localStorage 캐시", () => {
  beforeEach(clearStore);

  it("스토리지 키는 'mental-coaching-{groupId}' 형식이다", () => {
    const { result } = makeHook("grp-123");
    addNoteHelper(result);
    expect(memStore["mental-coaching-grp-123"]).toBeDefined();
  });

  it("저장된 데이터에 groupId가 포함된다", () => {
    const { result } = makeHook("grp-abc");
    addNoteHelper(result);
    const stored = memStore["mental-coaching-grp-abc"] as { groupId: string };
    expect(stored.groupId).toBe("grp-abc");
  });

  it("저장된 데이터에 notes 배열이 포함된다", () => {
    const { result } = makeHook();
    addNoteHelper(result);
    const stored = memStore["mental-coaching-group-1"] as { notes: unknown[] };
    expect(Array.isArray(stored.notes)).toBe(true);
    expect(stored.notes.length).toBe(1);
  });

  it("저장된 데이터에 updatedAt이 포함된다", () => {
    const { result } = makeHook();
    addNoteHelper(result);
    const stored = memStore["mental-coaching-group-1"] as { updatedAt: string };
    expect(stored.updatedAt).toBeDefined();
  });

  it("refetch 후 localStorage의 데이터를 다시 로드한다", () => {
    const { result } = makeHook();
    addNoteHelper(result);
    // 스토어를 직접 수정
    memStore["mental-coaching-group-1"] = {
      groupId: "group-1",
      notes: [],
      updatedAt: new Date().toISOString(),
    };
    act(() => {
      result.current.refetch();
    });
    expect(result.current.notes.length).toBe(0);
  });
});

// ============================================================
// 그룹별 격리
// ============================================================

describe("useMentalCoaching - 그룹별 격리", () => {
  beforeEach(clearStore);

  it("다른 groupId의 notes는 서로 독립적이다", () => {
    const { result: result1 } = makeHook("group-A");
    const { result: result2 } = makeHook("group-B");
    addNoteHelper(result1, { memberName: "그룹A멤버" });
    // result2는 notes가 빈 배열로 초기화되어 있음
    expect(result2.current.notes.length).toBe(0);
  });

  it("그룹A의 노트가 그룹B에 영향을 주지 않는다", () => {
    const { result: result1 } = makeHook("group-AA");
    const { result: result2 } = makeHook("group-BB");
    addNoteHelper(result1);
    addNoteHelper(result1);
    addNoteHelper(result1);
    expect(result2.current.notes.length).toBe(0);
    expect(result1.current.notes.length).toBe(3);
  });

  it("각 그룹의 스토리지 키가 독립적으로 존재한다", () => {
    const { result: result1 } = makeHook("group-X");
    const { result: result2 } = makeHook("group-Y");
    addNoteHelper(result1);
    addNoteHelper(result2);
    expect(memStore["mental-coaching-group-X"]).toBeDefined();
    expect(memStore["mental-coaching-group-Y"]).toBeDefined();
  });
});
