import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ============================================================
// 메모리 스토어 설정
// ============================================================

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

import { useMentoringMatch } from "@/hooks/use-mentoring-match";

const GROUP_ID = "group-123";

beforeEach(() => {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
});

// ============================================================
// 초기 상태
// ============================================================

describe("useMentoringMatch - 초기 상태", () => {
  it("pairs 초기값은 빈 배열이다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));
    expect(result.current.pairs).toEqual([]);
  });

  it("loading은 항상 false이다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));
    expect(result.current.loading).toBe(false);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));
    expect(typeof result.current.addPair).toBe("function");
    expect(typeof result.current.updatePair).toBe("function");
    expect(typeof result.current.deletePair).toBe("function");
    expect(typeof result.current.addSession).toBe("function");
    expect(typeof result.current.deleteSession).toBe("function");
    expect(typeof result.current.updateStatus).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("stats 초기 totalPairs는 0이다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));
    expect(result.current.stats.totalPairs).toBe(0);
  });

  it("stats 초기 activePairs는 0이다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));
    expect(result.current.stats.activePairs).toBe(0);
  });

  it("stats 초기 totalSessions는 0이다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));
    expect(result.current.stats.totalSessions).toBe(0);
  });

  it("stats 초기 avgSessionsPerPair는 0이다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));
    expect(result.current.stats.avgSessionsPerPair).toBe(0);
  });

  it("stats 초기 topMentors는 빈 배열이다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));
    expect(result.current.stats.topMentors).toEqual([]);
  });
});

// ============================================================
// addPair
// ============================================================

describe("useMentoringMatch - addPair", () => {
  it("addPair 호출 시 pairs에 항목이 추가된다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    act(() => {
      result.current.addPair("김멘토", "이멘티", ["힙합", "팝핀"], ["기술향상"], "2026-01-01");
    });

    expect(result.current.pairs).toHaveLength(1);
  });

  it("addPair는 id와 createdAt이 포함된 MentoringMatchPair를 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("김멘토", "이멘티", ["힙합"], ["목표"], "2026-01-01");
    });

    expect(pair!.id).toBeTruthy();
    expect(pair!.createdAt).toBeTruthy();
  });

  it("addPair로 추가된 페어의 mentorName이 올바르다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("박멘토", "최멘티", [], [], "2026-02-01");
    });

    expect(pair!.mentorName).toBe("박멘토");
  });

  it("addPair로 추가된 페어의 menteeName이 올바르다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("박멘토", "최멘티", [], [], "2026-02-01");
    });

    expect(pair!.menteeName).toBe("최멘티");
  });

  it("addPair로 추가된 페어의 초기 status는 active이다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    expect(pair!.status).toBe("active");
  });

  it("addPair로 추가된 페어의 초기 sessions는 빈 배열이다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    expect(pair!.sessions).toEqual([]);
  });

  it("stats.totalPairs는 addPair 후 증가한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    act(() => {
      result.current.addPair("A", "B", [], [], "2026-01-01");
    });
    act(() => {
      result.current.addPair("C", "D", [], [], "2026-01-01");
    });

    expect(result.current.stats.totalPairs).toBe(2);
  });

  it("stats.activePairs는 active 페어 수와 일치한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    act(() => {
      result.current.addPair("A", "B", [], [], "2026-01-01");
    });
    act(() => {
      result.current.addPair("C", "D", [], [], "2026-01-01");
    });

    expect(result.current.stats.activePairs).toBe(2);
  });
});

// ============================================================
// updatePair
// ============================================================

describe("useMentoringMatch - updatePair", () => {
  it("updatePair로 mentorName을 수정할 수 있다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("김멘토", "이멘티", [], [], "2026-01-01");
    });

    act(() => {
      result.current.updatePair(pair!.id, { mentorName: "박멘토" });
    });

    expect(result.current.pairs[0].mentorName).toBe("박멘토");
  });

  it("updatePair는 수정이 성공하면 true를 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    let success = false;
    act(() => {
      success = result.current.updatePair(pair!.id, { menteeName: "새멘티" });
    });

    expect(success).toBe(true);
  });

  it("존재하지 않는 id로 updatePair 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let success = true;
    act(() => {
      success = result.current.updatePair("nonexistent", { mentorName: "변경" });
    });

    expect(success).toBe(false);
  });

  it("updatePair로 skillFocus를 수정할 수 있다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", ["힙합"], [], "2026-01-01");
    });

    act(() => {
      result.current.updatePair(pair!.id, { skillFocus: ["팝핀", "락킹"] });
    });

    expect(result.current.pairs[0].skillFocus).toEqual(["팝핀", "락킹"]);
  });
});

// ============================================================
// deletePair
// ============================================================

describe("useMentoringMatch - deletePair", () => {
  it("deletePair 호출 시 해당 페어가 제거된다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    act(() => {
      result.current.deletePair(pair!.id);
    });

    expect(result.current.pairs).toHaveLength(0);
  });

  it("deletePair는 삭제 성공 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    let success = false;
    act(() => {
      success = result.current.deletePair(pair!.id);
    });

    expect(success).toBe(true);
  });

  it("존재하지 않는 id로 deletePair 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let success = true;
    act(() => {
      success = result.current.deletePair("nonexistent");
    });

    expect(success).toBe(false);
  });

  it("여러 페어 중 특정 페어만 삭제된다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let firstPair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      firstPair = result.current.addPair("A멘토", "A멘티", [], [], "2026-01-01");
    });
    act(() => {
      result.current.addPair("B멘토", "B멘티", [], [], "2026-01-01");
    });

    act(() => {
      result.current.deletePair(firstPair!.id);
    });

    expect(result.current.pairs).toHaveLength(1);
    expect(result.current.pairs[0].mentorName).toBe("B멘토");
  });
});

// ============================================================
// addSession
// ============================================================

describe("useMentoringMatch - addSession", () => {
  it("addSession 호출 시 해당 페어의 sessions에 항목이 추가된다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    act(() => {
      result.current.addSession(pair!.id, {
        date: "2026-02-01",
        topic: "힙합 기본기",
        durationMinutes: 60,
      });
    });

    expect(result.current.pairs[0].sessions).toHaveLength(1);
  });

  it("addSession은 세션 객체를 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    let session: ReturnType<typeof result.current.addSession> = null;
    act(() => {
      session = result.current.addSession(pair!.id, {
        date: "2026-02-01",
        topic: "힙합",
        durationMinutes: 60,
      });
    });

    expect(session).not.toBeNull();
    expect(session!.id).toBeTruthy();
  });

  it("존재하지 않는 pairId로 addSession 호출 시 null을 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let session: ReturnType<typeof result.current.addSession> = undefined as unknown as null;
    act(() => {
      session = result.current.addSession("nonexistent", {
        date: "2026-02-01",
        topic: "힙합",
        durationMinutes: 60,
      });
    });

    expect(session).toBeNull();
  });

  it("addSession 후 stats.totalSessions가 증가한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    act(() => {
      result.current.addSession(pair!.id, { date: "2026-02-01", topic: "주제1", durationMinutes: 30 });
    });
    act(() => {
      result.current.addSession(pair!.id, { date: "2026-02-08", topic: "주제2", durationMinutes: 45 });
    });

    expect(result.current.stats.totalSessions).toBe(2);
  });

  it("addSession의 topic이 올바르게 저장된다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    act(() => {
      result.current.addSession(pair!.id, { date: "2026-02-01", topic: "팝핀 기초", durationMinutes: 60 });
    });

    expect(result.current.pairs[0].sessions[0].topic).toBe("팝핀 기초");
  });
});

// ============================================================
// deleteSession
// ============================================================

describe("useMentoringMatch - deleteSession", () => {
  it("deleteSession 호출 시 해당 세션이 제거된다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    let session: ReturnType<typeof result.current.addSession> = null;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });
    act(() => {
      session = result.current.addSession(pair!.id, { date: "2026-02-01", topic: "주제", durationMinutes: 60 });
    });

    act(() => {
      result.current.deleteSession(pair!.id, session!.id);
    });

    expect(result.current.pairs[0].sessions).toHaveLength(0);
  });

  it("deleteSession은 삭제 성공 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    let session: ReturnType<typeof result.current.addSession> = null;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });
    act(() => {
      session = result.current.addSession(pair!.id, { date: "2026-02-01", topic: "주제", durationMinutes: 60 });
    });

    let success = false;
    act(() => {
      success = result.current.deleteSession(pair!.id, session!.id);
    });

    expect(success).toBe(true);
  });

  it("존재하지 않는 pairId로 deleteSession 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let success = true;
    act(() => {
      success = result.current.deleteSession("nonexistent-pair", "nonexistent-session");
    });

    expect(success).toBe(false);
  });

  it("존재하지 않는 sessionId로 deleteSession 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    let success = true;
    act(() => {
      success = result.current.deleteSession(pair!.id, "nonexistent-session");
    });

    expect(success).toBe(false);
  });
});

// ============================================================
// updateStatus
// ============================================================

describe("useMentoringMatch - updateStatus", () => {
  it("updateStatus로 status를 completed로 변경할 수 있다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    act(() => {
      result.current.updateStatus(pair!.id, "completed");
    });

    expect(result.current.pairs[0].status).toBe("completed");
  });

  it("updateStatus로 status를 paused로 변경할 수 있다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    act(() => {
      result.current.updateStatus(pair!.id, "paused");
    });

    expect(result.current.pairs[0].status).toBe("paused");
  });

  it("status 변경 후 stats의 상태별 카운트가 갱신된다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    act(() => {
      result.current.updateStatus(pair!.id, "completed");
    });

    expect(result.current.stats.completedPairs).toBe(1);
    expect(result.current.stats.activePairs).toBe(0);
  });

  it("stats.pausedPairs는 paused 페어 수와 일치한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("멘토", "멘티", [], [], "2026-01-01");
    });

    act(() => {
      result.current.updateStatus(pair!.id, "paused");
    });

    expect(result.current.stats.pausedPairs).toBe(1);
  });
});

// ============================================================
// stats - topMentors
// ============================================================

describe("useMentoringMatch - stats topMentors", () => {
  it("세션이 있는 멘토가 topMentors에 나타난다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pair: ReturnType<typeof result.current.addPair> | undefined;
    act(() => {
      pair = result.current.addPair("김멘토", "이멘티", [], [], "2026-01-01");
    });
    act(() => {
      result.current.addSession(pair!.id, { date: "2026-02-01", topic: "주제", durationMinutes: 60 });
    });

    expect(result.current.stats.topMentors).toHaveLength(1);
    expect(result.current.stats.topMentors[0].mentorName).toBe("김멘토");
    expect(result.current.stats.topMentors[0].sessionCount).toBe(1);
  });

  it("topMentors는 최대 3명만 반환한다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let pA: ReturnType<typeof result.current.addPair> | undefined;
    let pB: ReturnType<typeof result.current.addPair> | undefined;
    let pC: ReturnType<typeof result.current.addPair> | undefined;
    let pD: ReturnType<typeof result.current.addPair> | undefined;
    act(() => { pA = result.current.addPair("A멘토", "멘티", [], [], "2026-01-01"); });
    act(() => { pB = result.current.addPair("B멘토", "멘티", [], [], "2026-01-01"); });
    act(() => { pC = result.current.addPair("C멘토", "멘티", [], [], "2026-01-01"); });
    act(() => { pD = result.current.addPair("D멘토", "멘티", [], [], "2026-01-01"); });
    act(() => { result.current.addSession(pA!.id, { date: "2026-02-01", topic: "주제", durationMinutes: 60 }); });
    act(() => { result.current.addSession(pB!.id, { date: "2026-02-01", topic: "주제", durationMinutes: 60 }); });
    act(() => { result.current.addSession(pC!.id, { date: "2026-02-01", topic: "주제", durationMinutes: 60 }); });
    act(() => { result.current.addSession(pD!.id, { date: "2026-02-01", topic: "주제", durationMinutes: 60 }); });

    expect(result.current.stats.topMentors.length).toBeLessThanOrEqual(3);
  });

  it("stats.avgSessionsPerPair는 (총 세션 / 총 페어)로 계산된다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    let p1: ReturnType<typeof result.current.addPair> | undefined;
    let p2: ReturnType<typeof result.current.addPair> | undefined;
    act(() => { p1 = result.current.addPair("멘토A", "멘티A", [], [], "2026-01-01"); });
    act(() => { p2 = result.current.addPair("멘토B", "멘티B", [], [], "2026-01-01"); });
    act(() => { result.current.addSession(p1!.id, { date: "2026-02-01", topic: "T1", durationMinutes: 30 }); });
    act(() => { result.current.addSession(p1!.id, { date: "2026-02-08", topic: "T2", durationMinutes: 30 }); });
    act(() => { result.current.addSession(p2!.id, { date: "2026-02-01", topic: "T3", durationMinutes: 30 }); });
    act(() => { result.current.addSession(p2!.id, { date: "2026-02-08", topic: "T4", durationMinutes: 30 }); });

    // 4 sessions / 2 pairs = 2.0
    expect(result.current.stats.avgSessionsPerPair).toBe(2.0);
  });
});

// ============================================================
// refetch
// ============================================================

describe("useMentoringMatch - refetch", () => {
  it("refetch 호출 시 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() => useMentoringMatch(GROUP_ID));

    expect(() => {
      act(() => {
        result.current.refetch();
      });
    }).not.toThrow();
  });

  it("groupId가 빈 문자열일 때 refetch 호출 시 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() => useMentoringMatch(""));

    expect(() => {
      act(() => {
        result.current.refetch();
      });
    }).not.toThrow();
  });
});
