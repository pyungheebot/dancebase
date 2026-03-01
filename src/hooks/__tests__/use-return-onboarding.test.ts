import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReturnOnboarding } from "@/hooks/use-return-onboarding";

// ─── sonner mock ─────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── toast-messages mock ──────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    ITEM_TITLE_REQUIRED: "항목 제목을 입력해주세요.",
    MEMBER: {
      NAME_SELECT_REQUIRED: "멤버 이름을 선택해주세요.",
    },
    EQUIPMENT: {
      CHECK_ADDED: "체크 항목이 추가되었습니다.",
      CHECK_DELETED: "체크 항목이 삭제되었습니다.",
      ALL_CHECK_REQUIRED: "모든 항목을 체크한 후 완료할 수 있습니다.",
    },
    SESSION: {
      DELETED: "세션이 삭제되었습니다.",
      NOT_FOUND: "세션을 찾을 수 없습니다.",
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

// ============================================================
// 테스트
// ============================================================

describe("useReturnOnboarding - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("checkItems가 빈 배열이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    expect(result.current.checkItems).toEqual([]);
  });

  it("sessions가 빈 배열이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    expect(result.current.sessions).toEqual([]);
  });

  it("loading이 false이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    expect(result.current.loading).toBe(false);
  });

  it("totalSessions가 0이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    expect(result.current.totalSessions).toBe(0);
  });

  it("activeSessions가 0이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    expect(result.current.activeSessions).toBe(0);
  });

  it("completedSessions가 0이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    expect(result.current.completedSessions).toBe(0);
  });

  it("averageCompletionRate가 0이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    expect(result.current.averageCompletionRate).toBe(0);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    expect(typeof result.current.addCheckItem).toBe("function");
    expect(typeof result.current.deleteCheckItem).toBe("function");
    expect(typeof result.current.startSession).toBe("function");
    expect(typeof result.current.toggleItem).toBe("function");
    expect(typeof result.current.completeSession).toBe("function");
    expect(typeof result.current.deleteSession).toBe("function");
    expect(typeof result.current.updateSessionNotes).toBe("function");
    expect(typeof result.current.getActiveSession).toBe("function");
  });
});

describe("useReturnOnboarding - addCheckItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("빈 title로 추가 시 false를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addCheckItem("choreography", "", "설명");
    });
    expect(ret!).toBe(false);
  });

  it("공백만 있는 title로 추가 시 false를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addCheckItem("choreography", "   ", "설명");
    });
    expect(ret!).toBe(false);
  });

  it("유효한 입력으로 추가 시 true를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.addCheckItem("schedule", "일정 확인", "최신 일정 숙지");
    });
    expect(ret!).toBe(true);
  });

  it("추가 후 checkItems 배열 길이가 증가한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "안무 확인", "최신 안무 숙지");
    });
    expect(result.current.checkItems).toHaveLength(1);
  });

  it("추가된 항목의 title이 trim된다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("other", "  제목  ", "설명");
    });
    expect(result.current.checkItems[0].title).toBe("제목");
  });

  it("추가된 항목의 category가 올바르다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("rule_change", "규칙 변경 확인", "");
    });
    expect(result.current.checkItems[0].category).toBe("rule_change");
  });

  it("추가된 항목의 id가 자동 생성된다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("equipment", "장비 확인", "");
    });
    expect(result.current.checkItems[0].id).toBeDefined();
  });
});

describe("useReturnOnboarding - deleteCheckItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("항목 삭제 후 checkItems 배열 길이가 감소한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "항목1", "");
    });
    const itemId = result.current.checkItems[0].id;
    act(() => {
      result.current.deleteCheckItem(itemId);
    });
    expect(result.current.checkItems).toHaveLength(0);
  });

  it("존재하지 않는 id 삭제 시 배열이 그대로다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "항목1", "");
    });
    act(() => {
      result.current.deleteCheckItem("non-existent");
    });
    expect(result.current.checkItems).toHaveLength(1);
  });
});

describe("useReturnOnboarding - startSession", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("빈 memberName으로 시작 시 false를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.startSession("");
    });
    expect(ret!).toBe(false);
  });

  it("공백만 있는 memberName으로 시작 시 false를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.startSession("   ");
    });
    expect(ret!).toBe(false);
  });

  it("유효한 memberName으로 시작 시 true를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.startSession("홍길동");
    });
    expect(ret!).toBe(true);
  });

  it("세션 시작 후 totalSessions가 1이 된다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.startSession("홍길동");
    });
    expect(result.current.totalSessions).toBe(1);
  });

  it("세션 시작 후 activeSessions가 1이 된다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.startSession("홍길동");
    });
    expect(result.current.activeSessions).toBe(1);
  });

  it("동일 멤버에 진행 중인 세션이 있으면 false를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.startSession("홍길동");
    });
    let ret: boolean;
    act(() => {
      ret = result.current.startSession("홍길동");
    });
    expect(ret!).toBe(false);
  });

  it("세션 items에 checkItems의 itemId가 매핑된다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "안무 확인", "");
    });
    const checkItemId = result.current.checkItems[0].id;
    act(() => {
      result.current.startSession("홍길동");
    });
    expect(result.current.sessions[0].items[0].itemId).toBe(checkItemId);
  });

  it("세션 items의 checked 초기값이 false이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "안무 확인", "");
    });
    act(() => {
      result.current.startSession("홍길동");
    });
    expect(result.current.sessions[0].items[0].checked).toBe(false);
  });
});

describe("useReturnOnboarding - toggleItem", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("toggleItem 호출 시 checked가 true가 된다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "안무 확인", "");
    });
    const itemId = result.current.checkItems[0].id;
    act(() => {
      result.current.startSession("홍길동");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.toggleItem(sessionId, itemId);
    });
    expect(result.current.sessions[0].items[0].checked).toBe(true);
  });

  it("toggleItem 두 번 호출 시 checked가 false로 돌아온다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "안무 확인", "");
    });
    const itemId = result.current.checkItems[0].id;
    act(() => {
      result.current.startSession("홍길동");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.toggleItem(sessionId, itemId);
    });
    act(() => {
      result.current.toggleItem(sessionId, itemId);
    });
    expect(result.current.sessions[0].items[0].checked).toBe(false);
  });
});

describe("useReturnOnboarding - completeSession", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 sessionId로 완료 시 false를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.completeSession("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("미체크 항목이 있는 세션 완료 시 false를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "안무 확인", "");
    });
    act(() => {
      result.current.startSession("홍길동");
    });
    const sessionId = result.current.sessions[0].id;
    let ret: boolean;
    act(() => {
      ret = result.current.completeSession(sessionId);
    });
    expect(ret!).toBe(false);
  });

  it("모든 항목 체크 후 완료 시 true를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "안무 확인", "");
    });
    const itemId = result.current.checkItems[0].id;
    act(() => {
      result.current.startSession("홍길동");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.toggleItem(sessionId, itemId);
    });
    let ret: boolean;
    act(() => {
      ret = result.current.completeSession(sessionId);
    });
    expect(ret!).toBe(true);
  });

  it("완료 후 activeSessions가 0이 된다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "안무 확인", "");
    });
    const itemId = result.current.checkItems[0].id;
    act(() => {
      result.current.startSession("홍길동");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.toggleItem(sessionId, itemId);
    });
    act(() => {
      result.current.completeSession(sessionId);
    });
    expect(result.current.activeSessions).toBe(0);
    expect(result.current.completedSessions).toBe(1);
  });

  it("체크 항목이 없는 세션(items=[])은 완료 가능하다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    // checkItems 없이 세션 시작 → items=[]
    act(() => {
      result.current.startSession("홍길동");
    });
    const sessionId = result.current.sessions[0].id;
    let ret: boolean;
    act(() => {
      ret = result.current.completeSession(sessionId);
    });
    // items가 빈 배열이면 every()가 true → 완료 가능
    expect(ret!).toBe(true);
  });
});

describe("useReturnOnboarding - deleteSession", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("세션 삭제 후 sessions 배열 길이가 감소한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.startSession("홍길동");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.deleteSession(sessionId);
    });
    expect(result.current.sessions).toHaveLength(0);
  });
});

describe("useReturnOnboarding - updateSessionNotes", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("세션 노트를 업데이트할 수 있다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.startSession("홍길동");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.updateSessionNotes(sessionId, "메모 내용");
    });
    expect(result.current.sessions[0].notes).toBe("메모 내용");
  });
});

describe("useReturnOnboarding - getActiveSession", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("진행 중인 세션이 없으면 undefined를 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    const session = result.current.getActiveSession("홍길동");
    expect(session).toBeUndefined();
  });

  it("진행 중인 세션이 있으면 해당 세션을 반환한다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.startSession("홍길동");
    });
    const session = result.current.getActiveSession("홍길동");
    expect(session).toBeDefined();
    expect(session?.memberName).toBe("홍길동");
  });
});

describe("useReturnOnboarding - averageCompletionRate 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("모든 항목을 체크한 세션의 완료율이 100이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "안무 확인", "");
    });
    const itemId = result.current.checkItems[0].id;
    act(() => {
      result.current.startSession("홍길동");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.toggleItem(sessionId, itemId);
    });
    expect(result.current.averageCompletionRate).toBe(100);
  });

  it("아무것도 체크하지 않은 세션의 완료율이 0이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-1"));
    act(() => {
      result.current.addCheckItem("choreography", "안무 확인", "");
    });
    act(() => {
      result.current.startSession("홍길동");
    });
    expect(result.current.averageCompletionRate).toBe(0);
  });
});

describe("useReturnOnboarding - localStorage 키 형식", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("저장 키가 dancebase:return-onboarding:{groupId} 형식이다", () => {
    const { result } = renderHook(() => useReturnOnboarding("group-xyz"));
    act(() => {
      result.current.addCheckItem("other", "항목", "");
    });
    const calls = localStorageMock.setItem.mock.calls;
    expect(calls.some(([key]: [string]) => key === "dancebase:return-onboarding:group-xyz")).toBe(true);
  });
});

describe("useReturnOnboarding - 그룹별 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("다른 groupId는 독립적인 state를 가진다", () => {
    const { result: r1 } = renderHook(() => useReturnOnboarding("grp-A"));
    const { result: r2 } = renderHook(() => useReturnOnboarding("grp-B"));
    act(() => {
      r1.current.addCheckItem("choreography", "A 항목", "");
    });
    expect(r1.current.checkItems).toHaveLength(1);
    expect(r2.current.checkItems).toHaveLength(0);
  });

  it("다른 groupId는 서로 다른 키에 저장된다", () => {
    const { result: r1 } = renderHook(() => useReturnOnboarding("grp-A"));
    const { result: r2 } = renderHook(() => useReturnOnboarding("grp-B"));
    act(() => {
      r1.current.startSession("멤버A");
      r2.current.startSession("멤버B");
    });
    const calls = localStorageMock.setItem.mock.calls;
    const keysUsed = calls.map(([key]: [string]) => key);
    expect(keysUsed).toContain("dancebase:return-onboarding:grp-A");
    expect(keysUsed).toContain("dancebase:return-onboarding:grp-B");
  });
});
