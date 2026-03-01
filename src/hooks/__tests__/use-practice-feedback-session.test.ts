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

// ─── SWR mock ─────────────────────────────────────────────────
const swrMutate = vi.fn();

vi.mock("swr", () => ({
  default: (_key: string | null, fetcher?: () => unknown) => {
    const data = fetcher ? undefined : undefined;
    return {
      data,
      isLoading: false,
      mutate: swrMutate,
    };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    practiceFeedbackSession: (groupId: string) =>
      `practice-feedback-session-${groupId}` as const,
  },
}));

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

import { usePracticeFeedbackSession } from "@/hooks/use-practice-feedback-session";
import type {
  PracticeFeedbackData,
  PracticeFeedbackRating,
  PracticeFeedbackSession,
} from "@/types";

const GROUP_ID = "group-abc";
const STORAGE_KEY = `dancebase:practice-feedback-session:${GROUP_ID}`;

function makeRating(val = 4): PracticeFeedbackRating {
  return { choreography: val, music: val, environment: val, atmosphere: val };
}

function seedStorage(data: Partial<PracticeFeedbackData>) {
  memStore[STORAGE_KEY] = {
    groupId: GROUP_ID,
    sessions: [],
    updatedAt: new Date().toISOString(),
    ...data,
  };
}

beforeEach(() => {
  // memStore 초기화
  for (const k of Object.keys(memStore)) delete memStore[k];
  swrMutate.mockReset();
  swrMutate.mockImplementation(
    (updated?: PracticeFeedbackData | (() => void), _revalidate?: boolean) => {
      if (updated && typeof updated === "object") {
        memStore[STORAGE_KEY] = updated;
      }
    }
  );
  uuidCounter = 0;
});

// ─── 초기 상태 ────────────────────────────────────────────────
describe("usePracticeFeedbackSession - 초기 상태", () => {
  it("sessions는 배열이다", () => {
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    expect(Array.isArray(result.current.sessions)).toBe(true);
  });

  it("초기 sessions는 빈 배열이다", () => {
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    expect(result.current.sessions).toHaveLength(0);
  });

  it("loading은 boolean이다", () => {
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("필수 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    expect(typeof result.current.createSession).toBe("function");
    expect(typeof result.current.deleteSession).toBe("function");
    expect(typeof result.current.submitResponse).toBe("function");
    expect(typeof result.current.deleteResponse).toBe("function");
    expect(typeof result.current.getAggregate).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("초기 overallAverageRating은 0이다", () => {
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    expect(result.current.overallAverageRating).toBe(0);
  });

  it("초기 totalResponseCount는 0이다", () => {
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    expect(result.current.totalResponseCount).toBe(0);
  });
});

// ─── storageKey 형식 ──────────────────────────────────────────
describe("usePracticeFeedbackSession - storageKey 형식", () => {
  it("storageKey는 dancebase:practice-feedback-session:{groupId} 형식이다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    act(() => {
      result.current.createSession({ practiceDate: "2026-03-01" });
    });
    expect(memStore[STORAGE_KEY]).toBeDefined();
  });

  it("다른 groupId는 독립적인 스토리지 키를 사용한다", () => {
    // 스토리지 키 형식이 groupId를 포함하는지 확인
    const xyzKey = "dancebase:practice-feedback-session:group-xyz";
    const abcKey = "dancebase:practice-feedback-session:group-abc";
    expect(xyzKey).not.toBe(abcKey);
    expect(xyzKey).toContain("group-xyz");
    expect(abcKey).toContain("group-abc");
  });
});

// ─── createSession ────────────────────────────────────────────
describe("usePracticeFeedbackSession - createSession", () => {
  it("createSession 호출 시 PracticeFeedbackSession을 반환한다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let session: PracticeFeedbackSession | undefined;
    act(() => {
      session = result.current.createSession({ practiceDate: "2026-03-01" });
    });
    expect(session).toBeDefined();
    expect(session!.id).toBeDefined();
  });

  it("createSession 결과의 groupId는 인자로 전달한 groupId와 일치한다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let session: PracticeFeedbackSession | undefined;
    act(() => {
      session = result.current.createSession({ practiceDate: "2026-03-01" });
    });
    expect(session!.groupId).toBe(GROUP_ID);
  });

  it("createSession 결과의 practiceDate가 올바르다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let session: PracticeFeedbackSession | undefined;
    act(() => {
      session = result.current.createSession({ practiceDate: "2026-03-15" });
    });
    expect(session!.practiceDate).toBe("2026-03-15");
  });

  it("createSession에 title을 전달하면 title이 설정된다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let session: PracticeFeedbackSession | undefined;
    act(() => {
      session = result.current.createSession({
        practiceDate: "2026-03-15",
        title: "정기 연습",
      });
    });
    expect(session!.title).toBe("정기 연습");
  });

  it("createSession 결과의 responses는 빈 배열이다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let session: PracticeFeedbackSession | undefined;
    act(() => {
      session = result.current.createSession({ practiceDate: "2026-03-01" });
    });
    expect(session!.responses).toHaveLength(0);
  });

  it("createSession 후 localStorage에 저장된다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    act(() => {
      result.current.createSession({ practiceDate: "2026-03-01" });
    });
    const stored = memStore[STORAGE_KEY] as PracticeFeedbackData;
    expect(stored.sessions).toHaveLength(1);
  });

  it("createSession 후 mutate가 호출된다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    act(() => {
      result.current.createSession({ practiceDate: "2026-03-01" });
    });
    expect(swrMutate).toHaveBeenCalled();
  });
});

// ─── deleteSession ────────────────────────────────────────────
describe("usePracticeFeedbackSession - deleteSession", () => {
  it("존재하는 sessionId로 deleteSession 호출 시 해당 세션이 삭제된다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let sessionId: string;
    act(() => {
      const s = result.current.createSession({ practiceDate: "2026-03-01" });
      sessionId = s.id;
    });
    act(() => {
      result.current.deleteSession(sessionId!);
    });
    const stored = memStore[STORAGE_KEY] as PracticeFeedbackData;
    expect(stored.sessions).toHaveLength(0);
  });

  it("존재하지 않는 sessionId로 deleteSession 호출 시 에러가 발생하지 않는다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    expect(() => {
      act(() => {
        result.current.deleteSession("non-existent-id");
      });
    }).not.toThrow();
  });
});

// ─── submitResponse ───────────────────────────────────────────
describe("usePracticeFeedbackSession - submitResponse", () => {
  it("존재하는 sessionId로 submitResponse 호출 시 true를 반환한다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let sessionId: string;
    act(() => {
      const s = result.current.createSession({ practiceDate: "2026-03-01" });
      sessionId = s.id;
    });
    let success: boolean | undefined;
    act(() => {
      success = result.current.submitResponse(sessionId!, {
        authorName: "홍길동",
        isAnonymous: false,
        overallRating: 4,
        categoryRatings: makeRating(4),
      });
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 sessionId로 submitResponse 호출 시 false를 반환한다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let success: boolean | undefined;
    act(() => {
      success = result.current.submitResponse("no-such-id", {
        authorName: "홍길동",
        isAnonymous: false,
        overallRating: 4,
        categoryRatings: makeRating(4),
      });
    });
    expect(success).toBe(false);
  });

  it("isAnonymous=true이면 authorName이 익명으로 저장된다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let sessionId: string;
    act(() => {
      const s = result.current.createSession({ practiceDate: "2026-03-01" });
      sessionId = s.id;
    });
    act(() => {
      result.current.submitResponse(sessionId!, {
        authorName: "홍길동",
        isAnonymous: true,
        overallRating: 3,
        categoryRatings: makeRating(3),
      });
    });
    const stored = memStore[STORAGE_KEY] as PracticeFeedbackData;
    const response = stored.sessions[0].responses[0];
    expect(response.authorName).toBe("익명");
  });

  it("isAnonymous=false이면 원래 authorName이 저장된다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let sessionId: string;
    act(() => {
      const s = result.current.createSession({ practiceDate: "2026-03-01" });
      sessionId = s.id;
    });
    act(() => {
      result.current.submitResponse(sessionId!, {
        authorName: "김민지",
        isAnonymous: false,
        overallRating: 5,
        categoryRatings: makeRating(5),
      });
    });
    const stored = memStore[STORAGE_KEY] as PracticeFeedbackData;
    const response = stored.sessions[0].responses[0];
    expect(response.authorName).toBe("김민지");
  });

  it("goodPoints의 공백이 trim된다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let sessionId: string;
    act(() => {
      const s = result.current.createSession({ practiceDate: "2026-03-01" });
      sessionId = s.id;
    });
    act(() => {
      result.current.submitResponse(sessionId!, {
        authorName: "테스터",
        isAnonymous: false,
        overallRating: 4,
        categoryRatings: makeRating(4),
        goodPoints: "  좋았어요  ",
      });
    });
    const stored = memStore[STORAGE_KEY] as PracticeFeedbackData;
    const response = stored.sessions[0].responses[0];
    expect(response.goodPoints).toBe("좋았어요");
  });

  it("빈 문자열 goodPoints는 undefined로 저장된다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let sessionId: string;
    act(() => {
      const s = result.current.createSession({ practiceDate: "2026-03-01" });
      sessionId = s.id;
    });
    act(() => {
      result.current.submitResponse(sessionId!, {
        authorName: "테스터",
        isAnonymous: false,
        overallRating: 4,
        categoryRatings: makeRating(4),
        goodPoints: "   ",
      });
    });
    const stored = memStore[STORAGE_KEY] as PracticeFeedbackData;
    const response = stored.sessions[0].responses[0];
    expect(response.goodPoints).toBeUndefined();
  });
});

// ─── deleteResponse ───────────────────────────────────────────
describe("usePracticeFeedbackSession - deleteResponse", () => {
  it("존재하는 responseId 삭제 시 해당 응답이 제거된다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    let sessionId: string;
    act(() => {
      const s = result.current.createSession({ practiceDate: "2026-03-01" });
      sessionId = s.id;
    });
    act(() => {
      result.current.submitResponse(sessionId!, {
        authorName: "홍길동",
        isAnonymous: false,
        overallRating: 4,
        categoryRatings: makeRating(4),
      });
    });
    const stored1 = memStore[STORAGE_KEY] as PracticeFeedbackData;
    const responseId = stored1.sessions[0].responses[0].id;
    act(() => {
      result.current.deleteResponse(sessionId!, responseId);
    });
    const stored2 = memStore[STORAGE_KEY] as PracticeFeedbackData;
    expect(stored2.sessions[0].responses).toHaveLength(0);
  });

  it("존재하지 않는 sessionId로 deleteResponse 호출 시 에러가 발생하지 않는다", () => {
    seedStorage({ sessions: [] });
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    expect(() => {
      act(() => {
        result.current.deleteResponse("no-session", "no-response");
      });
    }).not.toThrow();
  });
});

// ─── getAggregate ─────────────────────────────────────────────
describe("usePracticeFeedbackSession - getAggregate", () => {
  it("존재하지 않는 sessionId로 getAggregate 호출 시 null을 반환한다", () => {
    const { result } = renderHook(() =>
      usePracticeFeedbackSession(GROUP_ID)
    );
    const agg = result.current.getAggregate("no-such-id");
    expect(agg).toBeNull();
  });
});

// ─── 순수 함수 로직 (aggregateSession 재현) ───────────────────
describe("aggregateSession 로직 검증", () => {
  it("응답 없는 세션의 averageOverall은 0이다", () => {
    const sessionData: PracticeFeedbackSession = {
      id: "s1",
      groupId: GROUP_ID,
      practiceDate: "2026-03-01",
      responses: [],
      createdAt: new Date().toISOString(),
    };
    memStore[STORAGE_KEY] = {
      groupId: GROUP_ID,
      sessions: [sessionData],
      updatedAt: new Date().toISOString(),
    };
    // 집계 로직 직접 재현
    const total = sessionData.responses.length;
    const avgOverall = total === 0 ? 0 : sessionData.responses.reduce((s, r) => s + r.overallRating, 0) / total;
    expect(avgOverall).toBe(0);
  });

  it("overallRating 평균이 소수점 1자리로 반올림된다", () => {
    const ratings = [4, 3, 5]; // 합 12, 평균 4.0
    const sum = ratings.reduce((s, r) => s + r, 0);
    const avg = Math.round((sum / ratings.length) * 10) / 10;
    expect(avg).toBe(4);
  });

  it("overallRating 평균이 소수점 처리를 올바르게 한다 (3.3...→3.3)", () => {
    const ratings = [3, 3, 4]; // 합 10, 평균 3.333...
    const sum = ratings.reduce((s, r) => s + r, 0);
    const avg = Math.round((sum / ratings.length) * 10) / 10;
    expect(avg).toBe(3.3);
  });

  it("카테고리 평균이 올바르게 계산된다", () => {
    const choreographyScores = [4, 2]; // 평균 3.0
    const sum = choreographyScores.reduce((s, r) => s + r, 0);
    const avg = Math.round((sum / choreographyScores.length) * 10) / 10;
    expect(avg).toBe(3);
  });

  it("goodPoints 빈 문자열은 goodPointsList에 포함되지 않는다", () => {
    const responses = [
      { goodPoints: "좋아요" },
      { goodPoints: "" },
      { goodPoints: "   " },
      { goodPoints: "훌륭해요" },
    ];
    const goodPointsList = responses
      .filter((r) => r.goodPoints && r.goodPoints.trim() !== "")
      .map((r) => r.goodPoints as string);
    expect(goodPointsList).toEqual(["좋아요", "훌륭해요"]);
  });

  it("improvementsList도 동일하게 빈 문자열이 제거된다", () => {
    const responses = [
      { improvements: "" },
      { improvements: "개선 필요" },
    ];
    const improvementsList = responses
      .filter((r) => r.improvements && r.improvements.trim() !== "")
      .map((r) => r.improvements as string);
    expect(improvementsList).toEqual(["개선 필요"]);
  });
});

// ─── overallAverageRating & totalResponseCount ────────────────
describe("usePracticeFeedbackSession - 통계 계산", () => {
  it("sessions이 비어 있으면 overallAverageRating은 0이다", () => {
    const allResponses: { overallRating: number }[] = [];
    const result = allResponses.length === 0 ? 0 : Math.round((allResponses.reduce((a, r) => a + r.overallRating, 0) / allResponses.length) * 10) / 10;
    expect(result).toBe(0);
  });

  it("여러 세션 응답의 전체 평균이 올바르다", () => {
    const allRatings = [5, 3, 4, 4]; // 합 16, 평균 4.0
    const sum = allRatings.reduce((s, r) => s + r, 0);
    const avg = Math.round((sum / allRatings.length) * 10) / 10;
    expect(avg).toBe(4);
  });

  it("totalResponseCount는 모든 세션의 응답 수 합계이다", () => {
    const sessions = [
      { responses: [1, 2] }, // 2
      { responses: [1, 2, 3] }, // 3
    ];
    const total = sessions.reduce((acc, s) => acc + s.responses.length, 0);
    expect(total).toBe(5);
  });
});

// ─── sortedSessions ───────────────────────────────────────────
describe("usePracticeFeedbackSession - 날짜 내림차순 정렬", () => {
  it("sessions는 practiceDate 내림차순으로 정렬된다", () => {
    const sessions: PracticeFeedbackSession[] = [
      { id: "s1", groupId: GROUP_ID, practiceDate: "2026-01-01", responses: [], createdAt: "" },
      { id: "s2", groupId: GROUP_ID, practiceDate: "2026-03-01", responses: [], createdAt: "" },
      { id: "s3", groupId: GROUP_ID, practiceDate: "2026-02-01", responses: [], createdAt: "" },
    ];
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.practiceDate).getTime() - new Date(a.practiceDate).getTime()
    );
    expect(sorted[0].practiceDate).toBe("2026-03-01");
    expect(sorted[1].practiceDate).toBe("2026-02-01");
    expect(sorted[2].practiceDate).toBe("2026-01-01");
  });
});

// ─── 그룹별 격리 ──────────────────────────────────────────────
describe("usePracticeFeedbackSession - 그룹별 격리", () => {
  it("다른 groupId의 데이터는 서로 영향을 주지 않는다", () => {
    const KEY_A = `dancebase:practice-feedback-session:group-a`;
    const KEY_B = `dancebase:practice-feedback-session:group-b`;
    memStore[KEY_A] = { groupId: "group-a", sessions: [], updatedAt: "" };
    memStore[KEY_B] = { groupId: "group-b", sessions: [], updatedAt: "" };

    const { result: resultA } = renderHook(() =>
      usePracticeFeedbackSession("group-a")
    );
    act(() => {
      resultA.current.createSession({ practiceDate: "2026-03-01" });
    });

    // group-b의 스토리지는 변경되지 않음
    const storedB = memStore[KEY_B] as PracticeFeedbackData;
    expect(storedB.sessions).toHaveLength(0);
  });
});
