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
    backstageLog: (projectId: string) => `backstage-log-${projectId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useBackstageLog } from "@/hooks/use-backstage-log";
import type { BackstageLogCategory } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
  _uuidCounter = 0;
}

function initProjectStore(projectId: string) {
  memStore[`backstage-log-${projectId}`] = {
    projectId,
    sessions: [],
    updatedAt: new Date().toISOString(),
  };
}

function makeHook(projectId = "project-1") {
  initProjectStore(projectId);
  return renderHook(() => useBackstageLog(projectId));
}

function createSessionHelper(
  hook: ReturnType<typeof makeHook>["result"],
  showName = "봄 공연",
  showDate = "2026-05-01"
) {
  let session: ReturnType<ReturnType<typeof useBackstageLog>["createSession"]>;
  act(() => {
    session = hook.current.createSession({ showName, showDate });
  });
  return session!;
}

function addEntryHelper(
  hook: ReturnType<typeof makeHook>["result"],
  sessionId: string,
  overrides: Partial<{
    senderName: string;
    message: string;
    category: BackstageLogCategory;
  }> = {}
) {
  let entry: ReturnType<ReturnType<typeof useBackstageLog>["addEntry"]>;
  act(() => {
    entry = hook.current.addEntry(sessionId, {
      senderName: overrides.senderName ?? "스태프A",
      message: overrides.message ?? "테스트 메시지",
      category: overrides.category ?? "general",
    });
  });
  return entry!;
}

// ============================================================
// 초기 상태
// ============================================================

describe("useBackstageLog - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 sessions는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.sessions).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 totalSessions는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalSessions).toBe(0);
  });

  it("초기 totalEntries는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalEntries).toBe(0);
  });

  it("초기 unresolvedCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.unresolvedCount).toBe(0);
  });

  it("초기 categoryBreakdown은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.categoryBreakdown).toEqual([]);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.createSession).toBe("function");
    expect(typeof result.current.endSession).toBe("function");
    expect(typeof result.current.deleteSession).toBe("function");
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.resolveEntry).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.getSessionEntries).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// createSession
// ============================================================

describe("useBackstageLog - createSession", () => {
  beforeEach(clearStore);

  it("세션 생성 후 sessions 길이가 1이 된다", () => {
    const { result } = makeHook();
    createSessionHelper(result);
    expect(result.current.sessions.length).toBe(1);
  });

  it("생성된 세션의 showName이 올바르다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result, "여름 공연");
    expect(session.showName).toBe("여름 공연");
  });

  it("생성된 세션의 showDate가 올바르다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result, "공연", "2026-07-01");
    expect(session.showDate).toBe("2026-07-01");
  });

  it("생성된 세션의 isActive는 true이다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    expect(session.isActive).toBe(true);
  });

  it("생성된 세션에 고유 id가 부여된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    expect(session.id).toBeTruthy();
  });

  it("생성된 세션의 초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    expect(session.entries).toEqual([]);
  });

  it("생성된 세션에 createdAt이 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    expect(session.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("새 세션 생성 시 기존 활성 세션이 비활성화된다", () => {
    const { result } = makeHook();
    const session1 = createSessionHelper(result, "공연1");
    createSessionHelper(result, "공연2");
    const updated = result.current.sessions.find((s) => s.id === session1.id);
    expect(updated?.isActive).toBe(false);
  });

  it("새 세션만 활성 상태이다", () => {
    const { result } = makeHook();
    createSessionHelper(result, "공연1");
    const session2 = createSessionHelper(result, "공연2");
    const activeSessions = result.current.sessions.filter((s) => s.isActive);
    expect(activeSessions).toHaveLength(1);
    expect(activeSessions[0].id).toBe(session2.id);
  });

  it("showName의 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result, "  공연명  ");
    expect(session.showName).toBe("공연명");
  });

  it("세션 생성 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    createSessionHelper(result);
    expect(memStore["backstage-log-project-1"]).toBeDefined();
  });
});

// ============================================================
// endSession
// ============================================================

describe("useBackstageLog - endSession", () => {
  beforeEach(clearStore);

  it("세션 종료 시 isActive가 false가 된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    act(() => {
      result.current.endSession(session.id);
    });
    const updated = result.current.sessions.find((s) => s.id === session.id);
    expect(updated?.isActive).toBe(false);
  });

  it("존재하지 않는 sessionId로 종료해도 다른 세션에 영향이 없다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    act(() => {
      result.current.endSession("non-existent");
    });
    const existing = result.current.sessions.find((s) => s.id === session.id);
    expect(existing?.isActive).toBe(true);
  });
});

// ============================================================
// deleteSession
// ============================================================

describe("useBackstageLog - deleteSession", () => {
  beforeEach(clearStore);

  it("세션 삭제 후 sessions 길이가 감소한다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    act(() => {
      result.current.deleteSession(session.id);
    });
    expect(result.current.sessions.length).toBe(0);
  });

  it("특정 세션만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    const session1 = createSessionHelper(result, "공연1");
    createSessionHelper(result, "공연2");
    act(() => {
      result.current.deleteSession(session1.id);
    });
    expect(result.current.sessions.length).toBe(1);
    expect(result.current.sessions[0].showName).toBe("공연2");
  });

  it("존재하지 않는 id 삭제 시 세션 수가 변하지 않는다", () => {
    const { result } = makeHook();
    createSessionHelper(result);
    act(() => {
      result.current.deleteSession("non-existent");
    });
    expect(result.current.sessions.length).toBe(1);
  });
});

// ============================================================
// addEntry
// ============================================================

describe("useBackstageLog - addEntry", () => {
  beforeEach(clearStore);

  it("항목 추가 시 항목 객체를 반환한다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    expect(entry).not.toBeNull();
  });

  it("추가된 항목의 senderName이 올바르다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id, { senderName: "무대감독" });
    expect(entry?.senderName).toBe("무대감독");
  });

  it("추가된 항목의 message가 올바르다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id, { message: "1막 시작 준비 완료" });
    expect(entry?.message).toBe("1막 시작 준비 완료");
  });

  it("추가된 항목의 category가 올바르다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id, { category: "cue" });
    expect(entry?.category).toBe("cue");
  });

  it("추가된 항목의 초기 isResolved는 false이다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    expect(entry?.isResolved).toBe(false);
  });

  it("추가된 항목의 초기 resolvedBy는 null이다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    expect(entry?.resolvedBy).toBeNull();
  });

  it("추가된 항목에 고유 id가 부여된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    expect(entry?.id).toBeTruthy();
  });

  it("추가된 항목에 timestamp가 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    expect(entry?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("존재하지 않는 sessionId로 항목 추가 시 null을 반환한다", () => {
    const { result } = makeHook();
    const entry = addEntryHelper(result, "non-existent-session");
    expect(entry).toBeNull();
  });

  it("항목 추가 후 해당 세션의 entries 길이가 증가한다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    addEntryHelper(result, session.id);
    addEntryHelper(result, session.id);
    const updated = result.current.sessions.find((s) => s.id === session.id);
    expect(updated?.entries).toHaveLength(2);
  });

  it("senderName의 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id, { senderName: "  스태프  " });
    expect(entry?.senderName).toBe("스태프");
  });

  it("message의 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id, { message: "  메시지  " });
    expect(entry?.message).toBe("메시지");
  });
});

// ============================================================
// resolveEntry
// ============================================================

describe("useBackstageLog - resolveEntry", () => {
  beforeEach(clearStore);

  it("항목 해결 후 isResolved가 true가 된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    act(() => {
      result.current.resolveEntry(session.id, entry!.id, "책임자A");
    });
    const updatedSession = result.current.sessions.find((s) => s.id === session.id);
    const updatedEntry = updatedSession?.entries.find((e) => e.id === entry!.id);
    expect(updatedEntry?.isResolved).toBe(true);
  });

  it("항목 해결 후 resolvedBy가 올바르게 설정된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    act(() => {
      result.current.resolveEntry(session.id, entry!.id, "김무대감독");
    });
    const updatedSession = result.current.sessions.find((s) => s.id === session.id);
    const updatedEntry = updatedSession?.entries.find((e) => e.id === entry!.id);
    expect(updatedEntry?.resolvedBy).toBe("김무대감독");
  });

  it("resolvedBy의 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    act(() => {
      result.current.resolveEntry(session.id, entry!.id, "  담당자  ");
    });
    const updatedSession = result.current.sessions.find((s) => s.id === session.id);
    const updatedEntry = updatedSession?.entries.find((e) => e.id === entry!.id);
    expect(updatedEntry?.resolvedBy).toBe("담당자");
  });

  it("존재하지 않는 sessionId로 해결 시도 시 다른 세션에 영향이 없다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    act(() => {
      result.current.resolveEntry("non-existent", entry!.id, "담당자");
    });
    const existing = result.current.sessions.find((s) => s.id === session.id);
    const existingEntry = existing?.entries.find((e) => e.id === entry!.id);
    expect(existingEntry?.isResolved).toBe(false);
  });
});

// ============================================================
// deleteEntry
// ============================================================

describe("useBackstageLog - deleteEntry", () => {
  beforeEach(clearStore);

  it("항목 삭제 후 해당 세션의 entries 길이가 감소한다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    act(() => {
      result.current.deleteEntry(session.id, entry!.id);
    });
    const updated = result.current.sessions.find((s) => s.id === session.id);
    expect(updated?.entries).toHaveLength(0);
  });

  it("특정 항목만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry1 = addEntryHelper(result, session.id, { message: "메시지1" });
    addEntryHelper(result, session.id, { message: "메시지2" });
    act(() => {
      result.current.deleteEntry(session.id, entry1!.id);
    });
    const updated = result.current.sessions.find((s) => s.id === session.id);
    expect(updated?.entries).toHaveLength(1);
    expect(updated?.entries[0].message).toBe("메시지2");
  });

  it("존재하지 않는 sessionId로 삭제 시 세션 entries가 변하지 않는다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    addEntryHelper(result, session.id);
    act(() => {
      result.current.deleteEntry("non-existent", "entry-id");
    });
    const existing = result.current.sessions.find((s) => s.id === session.id);
    expect(existing?.entries).toHaveLength(1);
  });
});

// ============================================================
// getSessionEntries
// ============================================================

describe("useBackstageLog - getSessionEntries", () => {
  beforeEach(clearStore);

  it("세션의 항목 목록을 반환한다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    addEntryHelper(result, session.id, { message: "항목1" });
    addEntryHelper(result, session.id, { message: "항목2" });
    const entries = result.current.getSessionEntries(session.id);
    expect(entries).toHaveLength(2);
  });

  it("존재하지 않는 sessionId로 조회 시 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const entries = result.current.getSessionEntries("non-existent");
    expect(entries).toEqual([]);
  });

  it("항목이 없는 세션에서 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entries = result.current.getSessionEntries(session.id);
    expect(entries).toEqual([]);
  });
});

// ============================================================
// 통계 계산
// ============================================================

describe("useBackstageLog - 통계 계산", () => {
  beforeEach(clearStore);

  it("세션 생성 후 totalSessions가 증가한다", () => {
    const { result } = makeHook();
    createSessionHelper(result, "공연1");
    createSessionHelper(result, "공연2");
    expect(result.current.totalSessions).toBe(2);
  });

  it("항목 추가 후 totalEntries가 증가한다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    addEntryHelper(result, session.id);
    addEntryHelper(result, session.id);
    expect(result.current.totalEntries).toBe(2);
  });

  it("미해결 항목 수가 올바르게 계산된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    addEntryHelper(result, session.id);
    act(() => {
      result.current.resolveEntry(session.id, entry!.id, "담당자");
    });
    expect(result.current.unresolvedCount).toBe(1);
  });

  it("모든 항목 해결 시 unresolvedCount는 0이다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    const entry = addEntryHelper(result, session.id);
    act(() => {
      result.current.resolveEntry(session.id, entry!.id, "담당자");
    });
    expect(result.current.unresolvedCount).toBe(0);
  });

  it("categoryBreakdown에 카테고리별 count가 올바르게 집계된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    addEntryHelper(result, session.id, { category: "cue" });
    addEntryHelper(result, session.id, { category: "cue" });
    addEntryHelper(result, session.id, { category: "warning" });
    const cueCat = result.current.categoryBreakdown.find(
      (c) => c.category === "cue"
    );
    expect(cueCat?.count).toBe(2);
    const warnCat = result.current.categoryBreakdown.find(
      (c) => c.category === "warning"
    );
    expect(warnCat?.count).toBe(1);
  });

  it("categoryBreakdown에 percent가 올바르게 계산된다 (반올림)", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    addEntryHelper(result, session.id, { category: "cue" });
    addEntryHelper(result, session.id, { category: "cue" });
    addEntryHelper(result, session.id, { category: "warning" });
    addEntryHelper(result, session.id, { category: "info" });
    // cue: 2/4 = 50%
    const cueCat = result.current.categoryBreakdown.find(
      (c) => c.category === "cue"
    );
    expect(cueCat?.percent).toBe(50);
  });

  it("categoryBreakdown은 count 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    addEntryHelper(result, session.id, { category: "info" });
    addEntryHelper(result, session.id, { category: "cue" });
    addEntryHelper(result, session.id, { category: "cue" });
    addEntryHelper(result, session.id, { category: "cue" });
    expect(result.current.categoryBreakdown[0].category).toBe("cue");
    expect(result.current.categoryBreakdown[0].count).toBe(3);
  });

  it("여러 세션의 항목을 합산하여 totalEntries를 계산한다", () => {
    const { result } = makeHook();
    const session1 = createSessionHelper(result, "공연1");
    const session2 = createSessionHelper(result, "공연2");
    addEntryHelper(result, session1.id);
    addEntryHelper(result, session2.id);
    addEntryHelper(result, session2.id);
    expect(result.current.totalEntries).toBe(3);
  });

  it("세션 삭제 후 totalSessions가 감소한다", () => {
    const { result } = makeHook();
    const session = createSessionHelper(result);
    createSessionHelper(result, "공연2");
    act(() => {
      result.current.deleteSession(session.id);
    });
    expect(result.current.totalSessions).toBe(1);
  });
});

// ============================================================
// localStorage 캐시
// ============================================================

describe("useBackstageLog - localStorage 캐시", () => {
  beforeEach(clearStore);

  it("스토리지 키는 'backstage-log-{projectId}' 형식이다", () => {
    const { result } = makeHook("proj-xyz");
    createSessionHelper(result);
    expect(memStore["backstage-log-proj-xyz"]).toBeDefined();
  });

  it("저장된 데이터에 projectId가 포함된다", () => {
    const { result } = makeHook("proj-abc");
    createSessionHelper(result);
    const stored = memStore["backstage-log-proj-abc"] as { projectId: string };
    expect(stored.projectId).toBe("proj-abc");
  });

  it("저장된 데이터에 sessions 배열이 포함된다", () => {
    const { result } = makeHook();
    createSessionHelper(result);
    const stored = memStore["backstage-log-project-1"] as {
      sessions: unknown[];
    };
    expect(Array.isArray(stored.sessions)).toBe(true);
    expect(stored.sessions.length).toBe(1);
  });

  it("저장된 데이터에 updatedAt이 포함된다", () => {
    const { result } = makeHook();
    createSessionHelper(result);
    const stored = memStore["backstage-log-project-1"] as { updatedAt: string };
    expect(stored.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("refetch 후 localStorage의 데이터를 다시 로드한다", () => {
    const { result } = makeHook();
    createSessionHelper(result);
    memStore["backstage-log-project-1"] = {
      projectId: "project-1",
      sessions: [],
      updatedAt: new Date().toISOString(),
    };
    act(() => {
      result.current.refetch();
    });
    expect(result.current.sessions.length).toBe(0);
  });
});

// ============================================================
// 프로젝트별 격리
// ============================================================

describe("useBackstageLog - 프로젝트별 격리", () => {
  beforeEach(clearStore);

  it("다른 projectId의 sessions는 독립적이다", () => {
    const { result: result1 } = makeHook("proj-A");
    const { result: result2 } = makeHook("proj-B");
    createSessionHelper(result1, "공연A");
    expect(result2.current.sessions.length).toBe(0);
  });

  it("각 프로젝트의 스토리지 키가 독립적으로 존재한다", () => {
    const { result: result1 } = makeHook("proj-X");
    const { result: result2 } = makeHook("proj-Y");
    createSessionHelper(result1);
    createSessionHelper(result2);
    expect(memStore["backstage-log-proj-X"]).toBeDefined();
    expect(memStore["backstage-log-proj-Y"]).toBeDefined();
  });
});
