import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]);
  }),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useStyleVote } from "@/hooks/use-style-vote";
import type { StyleVoteSession } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useStyleVote(groupId));
}

function makeSession(overrides: Partial<StyleVoteSession> = {}): StyleVoteSession {
  return {
    id: "session-1",
    topic: "테스트 주제",
    status: "open",
    candidates: [],
    maxVotesPerPerson: 2,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// useStyleVote - 초기 상태
// ============================================================

describe("useStyleVote - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("getSessions 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getSessions).toBe("function");
  });

  it("getActiveSession 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getActiveSession).toBe("function");
  });

  it("createSession 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.createSession).toBe("function");
  });

  it("closeSession 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.closeSession).toBe("function");
  });

  it("reopenSession 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.reopenSession).toBe("function");
  });

  it("deleteSession 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.deleteSession).toBe("function");
  });

  it("addCandidate 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addCandidate).toBe("function");
  });

  it("removeCandidate 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.removeCandidate).toBe("function");
  });

  it("castVote 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.castVote).toBe("function");
  });

  it("getVoteRate 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getVoteRate).toBe("function");
  });

  it("getWinner 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getWinner).toBe("function");
  });

  it("hasVoted 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.hasVoted).toBe("function");
  });

  it("getMyVoteCount 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getMyVoteCount).toBe("function");
  });

  it("초기 getSessions()는 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getSessions()).toEqual([]);
  });

  it("초기 getActiveSession()은 null을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getActiveSession()).toBeNull();
  });
});

// ============================================================
// useStyleVote - 세션 생성
// ============================================================

describe("useStyleVote - 세션 생성", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("createSession 호출 후 getSessions()에 1개 세션이 추가된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("힙합 vs 팝핀", 2);
    });
    expect(result.current.getSessions()).toHaveLength(1);
  });

  it("생성된 세션의 topic이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("힙합 vs 팝핀", 2);
    });
    expect(result.current.getSessions()[0].topic).toBe("힙합 vs 팝핀");
  });

  it("생성된 세션의 status는 open이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 2);
    });
    expect(result.current.getSessions()[0].status).toBe("open");
  });

  it("생성된 세션의 candidates는 빈 배열이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 2);
    });
    expect(result.current.getSessions()[0].candidates).toEqual([]);
  });

  it("maxVotesPerPerson이 1 미만이면 1로 보정된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 0);
    });
    expect(result.current.getSessions()[0].maxVotesPerPerson).toBe(1);
  });

  it("maxVotesPerPerson이 음수이면 1로 보정된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", -5);
    });
    expect(result.current.getSessions()[0].maxVotesPerPerson).toBe(1);
  });

  it("여러 세션 생성 시 최신 세션이 맨 앞에 온다 (unshift)", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("첫 번째", 1);
    });
    act(() => {
      result.current.createSession("두 번째", 1);
    });
    expect(result.current.getSessions()[0].topic).toBe("두 번째");
    expect(result.current.getSessions()[1].topic).toBe("첫 번째");
  });

  it("세션 생성 후 getActiveSession()이 해당 세션을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("활성 세션", 2);
    });
    const active = result.current.getActiveSession();
    expect(active).not.toBeNull();
    expect(active?.topic).toBe("활성 세션");
  });
});

// ============================================================
// useStyleVote - 세션 마감 / 재오픈 / 삭제
// ============================================================

describe("useStyleVote - 세션 마감/재오픈/삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("closeSession 호출 후 status가 closed로 변경된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 1);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.closeSession(sessionId);
    });
    expect(result.current.getSessions()[0].status).toBe("closed");
  });

  it("closeSession 호출 후 closedAt이 설정된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 1);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.closeSession(sessionId);
    });
    expect(result.current.getSessions()[0].closedAt).toBeDefined();
  });

  it("존재하지 않는 세션 ID로 closeSession을 호출해도 오류가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.closeSession("non-existent");
      });
    }).not.toThrow();
  });

  it("reopenSession 호출 후 status가 open으로 변경된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 1);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.closeSession(sessionId);
    });
    act(() => {
      result.current.reopenSession(sessionId);
    });
    expect(result.current.getSessions()[0].status).toBe("open");
  });

  it("reopenSession 호출 후 closedAt이 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 1);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.closeSession(sessionId);
    });
    act(() => {
      result.current.reopenSession(sessionId);
    });
    expect(result.current.getSessions()[0].closedAt).toBeUndefined();
  });

  it("deleteSession 호출 후 세션이 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 1);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.deleteSession(sessionId);
    });
    expect(result.current.getSessions()).toHaveLength(0);
  });

  it("존재하지 않는 세션 ID로 deleteSession을 호출해도 오류가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteSession("non-existent");
      });
    }).not.toThrow();
  });
});

// ============================================================
// useStyleVote - 후보 추가 / 삭제
// ============================================================

describe("useStyleVote - 후보 추가/삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("addCandidate 호출 후 후보가 추가된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 2);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.addCandidate(sessionId, "락킹", "락킹 스타일", "앨리스");
    });
    expect(result.current.getSessions()[0].candidates).toHaveLength(1);
  });

  it("추가된 후보의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 2);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.addCandidate(sessionId, "락킹", "설명", "앨리스");
    });
    expect(result.current.getSessions()[0].candidates[0].title).toBe("락킹");
  });

  it("추가된 후보의 votes는 빈 배열이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 2);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.addCandidate(sessionId, "락킹", "설명", "앨리스");
    });
    expect(result.current.getSessions()[0].candidates[0].votes).toEqual([]);
  });

  it("removeCandidate 호출 후 해당 후보가 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 2);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.addCandidate(sessionId, "락킹", "설명", "앨리스");
    });
    const candidateId = result.current.getSessions()[0].candidates[0].id;
    act(() => {
      result.current.removeCandidate(sessionId, candidateId);
    });
    expect(result.current.getSessions()[0].candidates).toHaveLength(0);
  });

  it("존재하지 않는 sessionId로 addCandidate를 호출해도 오류가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.addCandidate("non-existent", "제목", "설명", "제안자");
      });
    }).not.toThrow();
  });
});

// ============================================================
// useStyleVote - 투표 (castVote)
// ============================================================

describe("useStyleVote - 투표 (castVote)", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("투표 후 후보의 votes에 voterName이 추가된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 2);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.addCandidate(sessionId, "락킹", "설명", "제안자");
    });
    const candidateId = result.current.getSessions()[0].candidates[0].id;
    act(() => {
      result.current.castVote(sessionId, candidateId, "앨리스");
    });
    expect(result.current.getSessions()[0].candidates[0].votes).toContain("앨리스");
  });

  it("이미 투표한 경우 재투표하면 취소된다 (토글)", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 2);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.addCandidate(sessionId, "락킹", "설명", "제안자");
    });
    const candidateId = result.current.getSessions()[0].candidates[0].id;
    act(() => {
      result.current.castVote(sessionId, candidateId, "앨리스");
    });
    act(() => {
      result.current.castVote(sessionId, candidateId, "앨리스");
    });
    expect(result.current.getSessions()[0].candidates[0].votes).not.toContain("앨리스");
  });

  it("maxVotesPerPerson 초과 시 투표가 무시된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 1); // 1표 제한
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.addCandidate(sessionId, "후보1", "설명", "제안자");
    });
    act(() => {
      result.current.addCandidate(sessionId, "후보2", "설명", "제안자");
    });
    const candidates = result.current.getSessions()[0].candidates;
    act(() => {
      result.current.castVote(sessionId, candidates[0].id, "앨리스");
    });
    // 이미 1표를 사용했으므로 두 번째 투표 무시
    act(() => {
      result.current.castVote(sessionId, candidates[1].id, "앨리스");
    });
    const updatedCandidates = result.current.getSessions()[0].candidates;
    expect(updatedCandidates[1].votes).not.toContain("앨리스");
  });

  it("closed 세션에는 투표가 무시된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 2);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.addCandidate(sessionId, "후보", "설명", "제안자");
    });
    const candidateId = result.current.getSessions()[0].candidates[0].id;
    act(() => {
      result.current.closeSession(sessionId);
    });
    act(() => {
      result.current.castVote(sessionId, candidateId, "앨리스");
    });
    expect(result.current.getSessions()[0].candidates[0].votes).not.toContain("앨리스");
  });
});

// ============================================================
// useStyleVote - 순수 함수 로직 (getVoteRate, getWinner, hasVoted, getMyVoteCount)
// ============================================================

describe("useStyleVote - 순수 함수 로직", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("getVoteRate: 총 투표 0일 때 0%를 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: [] },
      ],
    });
    expect(result.current.getVoteRate(session, "c1")).toBe(0);
  });

  it("getVoteRate: 후보가 전체 투표의 50%를 받으면 50을 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: ["앨리스"] },
        { id: "c2", title: "후보2", description: "", proposedBy: "p", votes: ["밥"] },
      ],
    });
    expect(result.current.getVoteRate(session, "c1")).toBe(50);
  });

  it("getVoteRate: 존재하지 않는 candidateId는 0을 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: ["앨리스"] },
      ],
    });
    expect(result.current.getVoteRate(session, "non-existent")).toBe(0);
  });

  it("getVoteRate: 100% 득표 시 100을 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: ["앨리스", "밥"] },
      ],
    });
    expect(result.current.getVoteRate(session, "c1")).toBe(100);
  });

  it("getWinner: 후보가 없으면 null을 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({ candidates: [] });
    expect(result.current.getWinner(session)).toBeNull();
  });

  it("getWinner: 투표가 모두 0이면 null을 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: [] },
      ],
    });
    expect(result.current.getWinner(session)).toBeNull();
  });

  it("getWinner: 최다 득표 후보를 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: ["앨리스"] },
        { id: "c2", title: "후보2", description: "", proposedBy: "p", votes: ["밥", "찰리"] },
      ],
    });
    expect(result.current.getWinner(session)?.id).toBe("c2");
  });

  it("getWinner: 동률 시 첫 번째 후보를 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: ["앨리스"] },
        { id: "c2", title: "후보2", description: "", proposedBy: "p", votes: ["밥"] },
      ],
    });
    expect(result.current.getWinner(session)?.id).toBe("c1");
  });

  it("hasVoted: 투표한 경우 true를 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: ["앨리스"] },
      ],
    });
    expect(result.current.hasVoted(session, "c1", "앨리스")).toBe(true);
  });

  it("hasVoted: 투표하지 않은 경우 false를 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: [] },
      ],
    });
    expect(result.current.hasVoted(session, "c1", "앨리스")).toBe(false);
  });

  it("hasVoted: 존재하지 않는 candidateId는 false를 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({ candidates: [] });
    expect(result.current.hasVoted(session, "non-existent", "앨리스")).toBe(false);
  });

  it("getMyVoteCount: 투표하지 않은 경우 0을 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: [] },
      ],
    });
    expect(result.current.getMyVoteCount(session, "앨리스")).toBe(0);
  });

  it("getMyVoteCount: 여러 후보에 투표한 수를 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: ["앨리스"] },
        { id: "c2", title: "후보2", description: "", proposedBy: "p", votes: ["앨리스"] },
        { id: "c3", title: "후보3", description: "", proposedBy: "p", votes: [] },
      ],
    });
    expect(result.current.getMyVoteCount(session, "앨리스")).toBe(2);
  });
});

// ============================================================
// useStyleVote - localStorage 키 형식
// ============================================================

describe("useStyleVote - localStorage 키 형식", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("localStorage 키는 dancebase:style-vote:{groupId} 형식이다", () => {
    const { result } = makeHook("group-123");
    act(() => {
      result.current.createSession("주제", 1);
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "dancebase:style-vote:group-123",
      expect.any(String)
    );
  });

  it("그룹별 스토리지는 독립적이다", () => {
    const { result: r1 } = renderHook(() => useStyleVote("group-1"));
    const { result: r2 } = renderHook(() => useStyleVote("group-2"));

    act(() => {
      r1.current.createSession("그룹1 주제", 1);
    });

    expect(r2.current.getSessions()).toHaveLength(0);
  });

  it("세션 생성 시 localStorage.setItem이 호출된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 1);
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================
// useStyleVote - 경계값 테스트
// ============================================================

describe("useStyleVote - 경계값 테스트", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("maxVotesPerPerson이 1이면 1표만 허용된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 1);
    });
    const sessionId = result.current.getSessions()[0].id;
    act(() => {
      result.current.addCandidate(sessionId, "후보1", "", "p");
      result.current.addCandidate(sessionId, "후보2", "", "p");
    });
    const [c1, c2] = result.current.getSessions()[0].candidates;
    act(() => {
      result.current.castVote(sessionId, c1.id, "앨리스");
      result.current.castVote(sessionId, c2.id, "앨리스"); // 무시되어야 함
    });
    const candidates = result.current.getSessions()[0].candidates;
    const totalVotes = candidates.reduce((sum, c) => sum + c.votes.length, 0);
    expect(totalVotes).toBe(1);
  });

  it("maxVotesPerPerson이 100이면 최대 100표를 허용한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제", 100);
    });
    expect(result.current.getSessions()[0].maxVotesPerPerson).toBe(100);
  });

  it("getVoteRate: 33.33...% 는 반올림되어 정수를 반환한다", () => {
    const { result } = makeHook();
    const session = makeSession({
      candidates: [
        { id: "c1", title: "후보1", description: "", proposedBy: "p", votes: ["앨리스"] },
        { id: "c2", title: "후보2", description: "", proposedBy: "p", votes: ["밥"] },
        { id: "c3", title: "후보3", description: "", proposedBy: "p", votes: ["찰리"] },
      ],
    });
    const rate = result.current.getVoteRate(session, "c1");
    expect(Number.isInteger(rate)).toBe(true);
    expect(rate).toBe(33);
  });

  it("세션 삭제 후 다른 세션은 유지된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("주제1", 1);
      result.current.createSession("주제2", 1);
    });
    const sessions = result.current.getSessions();
    act(() => {
      result.current.deleteSession(sessions[0].id); // 두 번째 주제 (unshift로 앞에 있음)
    });
    expect(result.current.getSessions()).toHaveLength(1);
  });
});
