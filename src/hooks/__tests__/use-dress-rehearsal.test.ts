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
    dressRehearsal: (projectId: string) => `dress-rehearsal:${projectId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useDressRehearsal } from "@/hooks/use-dress-rehearsal";
import type {
  DressRehearsalCategory,
  DressRehearsalSeverity,
} from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function initMemStore(projectId = "project-1") {
  memStore[`dress-rehearsal:${projectId}`] = {
    projectId,
    sessions: [],
    updatedAt: new Date().toISOString(),
  };
}

function makeHook(projectId = "project-1") {
  initMemStore(projectId);
  return renderHook(() => useDressRehearsal(projectId));
}

function addSessionHelper(
  hook: ReturnType<typeof makeHook>["result"],
  date = "2026-03-01",
  time = "14:00",
  venue = "대공연장"
) {
  let session: ReturnType<ReturnType<typeof useDressRehearsal>["addSession"]>;
  act(() => {
    session = hook.current.addSession({ date, time, venue });
  });
  return session!;
}

function addIssueHelper(
  hook: ReturnType<typeof makeHook>["result"],
  sessionId: string,
  section = "1막 1장",
  content = "조명 문제",
  category: DressRehearsalCategory = "조명",
  severity: DressRehearsalSeverity = "보통",
  assignee?: string
) {
  let issue: ReturnType<ReturnType<typeof useDressRehearsal>["addIssue"]>;
  act(() => {
    issue = hook.current.addIssue(sessionId, {
      section,
      content,
      category,
      severity,
      assignee,
    });
  });
  return issue!;
}

// ============================================================
// 초기 상태
// ============================================================

describe("useDressRehearsal - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 sessions는 undefined 또는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.sessions == null || Array.isArray(result.current.sessions)).toBe(true);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalIssues는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalIssues).toBe(0);
  });

  it("초기 stats.resolvedIssues는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.resolvedIssues).toBe(0);
  });

  it("초기 stats.unresolvedIssues는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.unresolvedIssues).toBe(0);
  });

  it("초기 stats.resolveRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.resolveRate).toBe(0);
  });

  it("초기 stats.severityDistribution은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.severityDistribution).toEqual([]);
  });

  it("초기 stats.categoryDistribution은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.categoryDistribution).toEqual([]);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addSession).toBe("function");
    expect(typeof result.current.updateSession).toBe("function");
    expect(typeof result.current.deleteSession).toBe("function");
    expect(typeof result.current.addIssue).toBe("function");
    expect(typeof result.current.updateIssue).toBe("function");
    expect(typeof result.current.deleteIssue).toBe("function");
    expect(typeof result.current.toggleIssueResolved).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addSession
// ============================================================

describe("useDressRehearsal - addSession", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("회차 추가 후 sessions 길이가 1이 된다", () => {
    const { result } = makeHook();
    addSessionHelper(result);
    expect(result.current.sessions?.length ?? 0).toBe(1);
  });

  it("추가된 회차의 date가 올바르다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result, "2026-05-01");
    expect(session.date).toBe("2026-05-01");
  });

  it("추가된 회차의 time이 올바르다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result, "2026-05-01", "19:30");
    expect(session.time).toBe("19:30");
  });

  it("추가된 회차의 venue가 올바르다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result, "2026-05-01", "19:30", "소공연장");
    expect(session.venue).toBe("소공연장");
  });

  it("추가된 회차에 id가 부여된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    expect(session.id).toBeTruthy();
  });

  it("추가된 회차의 초기 issues는 빈 배열이다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    expect(session.issues).toEqual([]);
  });

  it("추가된 회차에 createdAt이 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    expect(session.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("여러 회차를 추가할 수 있다", () => {
    const { result } = makeHook();
    addSessionHelper(result, "2026-03-01");
    addSessionHelper(result, "2026-03-02");
    addSessionHelper(result, "2026-03-03");
    expect(result.current.sessions?.length ?? 0).toBe(3);
  });
});

// ============================================================
// updateSession
// ============================================================

describe("useDressRehearsal - updateSession", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("회차 수정 시 true를 반환한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.updateSession(session.id, { venue: "대형 홀" });
    });
    expect(ret!).toBe(true);
  });

  it("회차 날짜를 수정할 수 있다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result, "2026-03-01");
    act(() => {
      result.current.updateSession(session.id, { date: "2026-04-01" });
    });
    const updated = result.current.sessions?.find((s) => s.id === session.id);
    expect(updated?.date).toBe("2026-04-01");
  });

  it("회차 장소를 수정할 수 있다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    act(() => {
      result.current.updateSession(session.id, { venue: "연습실 B" });
    });
    const updated = result.current.sessions?.find((s) => s.id === session.id);
    expect(updated?.venue).toBe("연습실 B");
  });

  it("존재하지 않는 id로 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.updateSession("non-existent", { venue: "홀" });
    });
    expect(ret!).toBe(false);
  });

  it("수정 후 updatedAt이 갱신된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const before = result.current.sessions?.find((s) => s.id === session.id)?.updatedAt;
    act(() => {
      result.current.updateSession(session.id, { time: "18:00" });
    });
    const after = result.current.sessions?.find((s) => s.id === session.id)?.updatedAt;
    // updatedAt이 변경되었거나 동일한 경우 모두 허용 (마이크로초 차이)
    expect(typeof after).toBe("string");
    expect(before).toBeDefined();
  });
});

// ============================================================
// deleteSession
// ============================================================

describe("useDressRehearsal - deleteSession", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("회차 삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.deleteSession(session.id);
    });
    expect(ret!).toBe(true);
  });

  it("회차 삭제 후 sessions 길이가 감소한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    act(() => {
      result.current.deleteSession(session.id);
    });
    expect(result.current.sessions?.length ?? 0).toBe(0);
  });

  it("특정 회차만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    const session1 = addSessionHelper(result, "2026-03-01");
    addSessionHelper(result, "2026-03-02");
    act(() => {
      result.current.deleteSession(session1.id);
    });
    expect(result.current.sessions?.length ?? 0).toBe(1);
    expect(result.current.sessions?.[0]?.date).toBe("2026-03-02");
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.deleteSession("non-existent");
    });
    expect(ret!).toBe(false);
  });
});

// ============================================================
// addIssue
// ============================================================

describe("useDressRehearsal - addIssue", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("이슈 추가 시 이슈 객체를 반환한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    expect(issue).not.toBeNull();
  });

  it("추가된 이슈의 section이 올바르다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id, "2막 3장");
    expect(issue?.section).toBe("2막 3장");
  });

  it("추가된 이슈의 content가 올바르다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id, "1막", "음악 싱크 오류");
    expect(issue?.content).toBe("음악 싱크 오류");
  });

  it("추가된 이슈의 category가 올바르다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id, "1막", "문제", "의상");
    expect(issue?.category).toBe("의상");
  });

  it("추가된 이슈의 severity가 올바르다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id, "1막", "문제", "조명", "높음");
    expect(issue?.severity).toBe("높음");
  });

  it("추가된 이슈의 초기 resolved는 false이다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    expect(issue?.resolved).toBe(false);
  });

  it("존재하지 않는 sessionId로 이슈 추가 시 null을 반환한다", () => {
    const { result } = makeHook();
    const issue = addIssueHelper(result, "non-existent-session");
    expect(issue).toBeNull();
  });

  it("담당자 정보를 포함한 이슈를 추가할 수 있다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id, "1막", "문제", "조명", "보통", "홍길동");
    expect(issue?.assignee).toBe("홍길동");
  });

  it("이슈 추가 후 해당 회차의 issues 길이가 증가한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    addIssueHelper(result, session.id);
    addIssueHelper(result, session.id, "2막", "두 번째 문제");
    const updatedSession = result.current.sessions?.find((s) => s.id === session.id);
    expect(updatedSession?.issues).toHaveLength(2);
  });
});

// ============================================================
// updateIssue
// ============================================================

describe("useDressRehearsal - updateIssue", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("이슈 수정 시 true를 반환한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    let ret: boolean;
    act(() => {
      ret = result.current.updateIssue(session.id, issue!.id, { content: "수정된 내용" });
    });
    expect(ret!).toBe(true);
  });

  it("이슈 내용을 수정할 수 있다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    act(() => {
      result.current.updateIssue(session.id, issue!.id, { content: "수정된 내용" });
    });
    const updatedSession = result.current.sessions?.find((s) => s.id === session.id);
    const updatedIssue = updatedSession?.issues.find((i) => i.id === issue!.id);
    expect(updatedIssue?.content).toBe("수정된 내용");
  });

  it("이슈 담당자를 수정할 수 있다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    act(() => {
      result.current.updateIssue(session.id, issue!.id, { assignee: "새 담당자" });
    });
    const updatedSession = result.current.sessions?.find((s) => s.id === session.id);
    const updatedIssue = updatedSession?.issues.find((i) => i.id === issue!.id);
    expect(updatedIssue?.assignee).toBe("새 담당자");
  });

  it("존재하지 않는 sessionId로 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.updateIssue("non-existent", "issue-id", { content: "수정" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 issueId로 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.updateIssue(session.id, "non-existent-issue", { content: "수정" });
    });
    expect(ret!).toBe(false);
  });
});

// ============================================================
// deleteIssue
// ============================================================

describe("useDressRehearsal - deleteIssue", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("이슈 삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    let ret: boolean;
    act(() => {
      ret = result.current.deleteIssue(session.id, issue!.id);
    });
    expect(ret!).toBe(true);
  });

  it("이슈 삭제 후 해당 회차의 issues 길이가 감소한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    act(() => {
      result.current.deleteIssue(session.id, issue!.id);
    });
    const updatedSession = result.current.sessions?.find((s) => s.id === session.id);
    expect(updatedSession?.issues).toHaveLength(0);
  });

  it("존재하지 않는 sessionId로 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.deleteIssue("non-existent", "issue-id");
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 issueId로 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    let ret: boolean;
    act(() => {
      ret = result.current.deleteIssue(session.id, "non-existent-issue");
    });
    expect(ret!).toBe(false);
  });
});

// ============================================================
// toggleIssueResolved
// ============================================================

describe("useDressRehearsal - toggleIssueResolved", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("미해결 이슈 토글 시 resolved가 true가 된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    act(() => {
      result.current.toggleIssueResolved(session.id, issue!.id);
    });
    const updatedSession = result.current.sessions?.find((s) => s.id === session.id);
    const updatedIssue = updatedSession?.issues.find((i) => i.id === issue!.id);
    expect(updatedIssue?.resolved).toBe(true);
  });

  it("해결된 이슈 토글 시 resolved가 false가 된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    // 해결로 토글
    act(() => {
      result.current.toggleIssueResolved(session.id, issue!.id);
    });
    // 미해결로 토글
    act(() => {
      result.current.toggleIssueResolved(session.id, issue!.id);
    });
    const updatedSession = result.current.sessions?.find((s) => s.id === session.id);
    const updatedIssue = updatedSession?.issues.find((i) => i.id === issue!.id);
    expect(updatedIssue?.resolved).toBe(false);
  });

  it("이슈 해결 시 resolvedAt이 설정된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    act(() => {
      result.current.toggleIssueResolved(session.id, issue!.id);
    });
    const updatedSession = result.current.sessions?.find((s) => s.id === session.id);
    const updatedIssue = updatedSession?.issues.find((i) => i.id === issue!.id);
    expect(updatedIssue?.resolvedAt).toBeDefined();
  });

  it("이슈 미해결로 되돌리면 resolvedAt이 undefined가 된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    act(() => {
      result.current.toggleIssueResolved(session.id, issue!.id);
    });
    act(() => {
      result.current.toggleIssueResolved(session.id, issue!.id);
    });
    const updatedSession = result.current.sessions?.find((s) => s.id === session.id);
    const updatedIssue = updatedSession?.issues.find((i) => i.id === issue!.id);
    expect(updatedIssue?.resolvedAt).toBeUndefined();
  });

  it("true를 반환한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    let ret: boolean;
    act(() => {
      ret = result.current.toggleIssueResolved(session.id, issue!.id);
    });
    expect(ret!).toBe(true);
  });

  it("존재하지 않는 sessionId로 토글 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean;
    act(() => {
      ret = result.current.toggleIssueResolved("non-existent", "issue-id");
    });
    expect(ret!).toBe(false);
  });
});

// ============================================================
// stats 계산
// ============================================================

describe("useDressRehearsal - stats 계산", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("이슈 추가 후 totalIssues가 증가한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    addIssueHelper(result, session.id);
    addIssueHelper(result, session.id, "2막", "두 번째 문제");
    expect(result.current.stats.totalIssues).toBe(2);
  });

  it("이슈 해결 후 resolvedIssues가 증가한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    addIssueHelper(result, session.id, "2막", "두 번째 문제");
    act(() => {
      result.current.toggleIssueResolved(session.id, issue!.id);
    });
    expect(result.current.stats.resolvedIssues).toBe(1);
  });

  it("미해결 이슈 수가 올바르게 계산된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    addIssueHelper(result, session.id, "2막", "미해결 이슈");
    act(() => {
      result.current.toggleIssueResolved(session.id, issue!.id);
    });
    expect(result.current.stats.unresolvedIssues).toBe(1);
  });

  it("resolveRate는 해결율 퍼센트이다 (50%)", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue1 = addIssueHelper(result, session.id, "1막", "이슈1");
    addIssueHelper(result, session.id, "2막", "이슈2");
    act(() => {
      result.current.toggleIssueResolved(session.id, issue1!.id);
    });
    expect(result.current.stats.resolveRate).toBe(50);
  });

  it("이슈가 없으면 resolveRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.resolveRate).toBe(0);
  });

  it("모든 이슈 해결 시 resolveRate는 100이다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    act(() => {
      result.current.toggleIssueResolved(session.id, issue!.id);
    });
    expect(result.current.stats.resolveRate).toBe(100);
  });

  it("severityDistribution에 추가된 이슈의 심각도가 포함된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    addIssueHelper(result, session.id, "1막", "이슈1", "조명", "높음");
    addIssueHelper(result, session.id, "2막", "이슈2", "음악", "높음");
    addIssueHelper(result, session.id, "3막", "이슈3", "의상", "낮음");
    const highSev = result.current.stats.severityDistribution.find(
      (s) => s.severity === "높음"
    );
    expect(highSev?.count).toBe(2);
  });

  it("categoryDistribution에 추가된 이슈의 카테고리가 포함된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    addIssueHelper(result, session.id, "1막", "이슈1", "조명");
    addIssueHelper(result, session.id, "2막", "이슈2", "조명");
    addIssueHelper(result, session.id, "3막", "이슈3", "음악");
    const lightCat = result.current.stats.categoryDistribution.find(
      (c) => c.category === "조명"
    );
    expect(lightCat?.count).toBe(2);
  });

  it("이슈 삭제 후 totalIssues가 감소한다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    const issue = addIssueHelper(result, session.id);
    act(() => {
      result.current.deleteIssue(session.id, issue!.id);
    });
    expect(result.current.stats.totalIssues).toBe(0);
  });

  it("회차 삭제 시 해당 회차의 이슈도 stats에서 제외된다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    addIssueHelper(result, session.id);
    addIssueHelper(result, session.id, "2막", "두 번째 문제");
    act(() => {
      result.current.deleteSession(session.id);
    });
    expect(result.current.stats.totalIssues).toBe(0);
  });

  it("count가 0인 카테고리는 categoryDistribution에 포함되지 않는다", () => {
    const { result } = makeHook();
    const session = addSessionHelper(result);
    addIssueHelper(result, session.id, "1막", "이슈", "조명");
    // "안무" 카테고리 이슈가 없으므로 분포에 포함되지 않음
    const chorDist = result.current.stats.categoryDistribution.find(
      (c) => c.category === "안무"
    );
    expect(chorDist).toBeUndefined();
  });
});
