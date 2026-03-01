import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── in-memory store ─────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

// ─── local-storage mock ───────────────────────────────────────
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
      const initialData = fetcher();
      const [data, setData] = reactUseState<unknown>(() => initialData);
      const setDataRef = useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          const r = fetcher!();
          if (r instanceof Promise) {
            r.then((v) => setDataRef.current(v));
          } else {
            setDataRef.current(r as unknown);
          }
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── 의존성 mock ──────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    practiceEvaluation: (id: string) => `practice-evaluation-${id}`,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    EVALUATION: {
      SESSION_TITLE_REQUIRED: "세션 제목을 입력하세요",
      DATE_REQUIRED: "날짜를 선택하세요",
      EVALUATOR_REQUIRED: "평가자를 입력하세요",
      CRITERIA_REQUIRED: "평가 기준이 필요합니다",
      SESSION_CREATED: "세션이 생성되었습니다",
      SESSION_CREATE_ERROR: "세션 생성에 실패했습니다",
      SESSION_UPDATED: "세션이 수정되었습니다",
      SESSION_UPDATE_ERROR: "세션 수정에 실패했습니다",
      SESSION_DELETED: "세션이 삭제되었습니다",
      SESSION_DELETE_ERROR: "세션 삭제에 실패했습니다",
      SESSION_NOT_FOUND: "세션을 찾을 수 없습니다",
      CRITERIA_NAME_REQUIRED: "기준 이름을 입력하세요",
      MAX_SCORE_REQUIRED: "최대 점수를 입력하세요",
      CRITERIA_ADD_ERROR: "기준 추가에 실패했습니다",
      CRITERIA_DELETE_ERROR: "기준 삭제에 실패했습니다",
      SAVE_ERROR: "저장에 실패했습니다",
      RESULT_DELETED: "결과가 삭제되었습니다",
      RESULT_DELETE_ERROR: "결과 삭제에 실패했습니다",
    },
    MEMBER_NAME_REQUIRED_DOT: "멤버 이름을 입력하세요.",
  },
}));

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

import { usePracticeEvaluation } from "@/hooks/use-practice-evaluation";
import type {
  PracticeEvalCriteria,
  PracticeEvalScore,
} from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
const GROUP_ID = "group-eval-1";

const SAMPLE_CRITERIA: PracticeEvalCriteria[] = [
  { id: "c1", name: "기본기", maxScore: 10 },
  { id: "c2", name: "표현력", maxScore: 10 },
];

function makeSessionParams(overrides: Partial<{
  title: string;
  date: string;
  evaluator: string;
  criteria: PracticeEvalCriteria[];
  notes: string;
}> = {}) {
  return {
    title: "테스트 세션",
    date: "2026-03-01",
    evaluator: "평가자",
    criteria: SAMPLE_CRITERIA,
    ...overrides,
  };
}

function makeHook(groupId = GROUP_ID) {
  return renderHook(() => usePracticeEvaluation(groupId));
}

function clearStore() {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
}

// ============================================================
// 초기 상태 테스트
// ============================================================

describe("usePracticeEvaluation - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("초기 sessions는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.sessions).toEqual([]);
  });

  it("초기 stats.totalSessions는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalSessions).toBe(0);
  });

  it("초기 stats.averageScore는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.averageScore).toBe(0);
  });

  it("초기 stats.topPerformers는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.topPerformers).toEqual([]);
  });

  it("addSession, updateSession, deleteSession 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addSession).toBe("function");
    expect(typeof result.current.updateSession).toBe("function");
    expect(typeof result.current.deleteSession).toBe("function");
  });

  it("addCriteria, deleteCriteria 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addCriteria).toBe("function");
    expect(typeof result.current.deleteCriteria).toBe("function");
  });

  it("saveMemberResult, deleteMemberResult 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.saveMemberResult).toBe("function");
    expect(typeof result.current.deleteMemberResult).toBe("function");
  });

  it("getMemberAverage, getMemberTrend 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getMemberAverage).toBe("function");
    expect(typeof result.current.getMemberTrend).toBe("function");
  });
});

// ============================================================
// addSession 테스트
// ============================================================

describe("usePracticeEvaluation - addSession 세션 추가", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("세션 추가 시 sessions 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSession(makeSessionParams());
    });
    expect(result.current.sessions).toHaveLength(1);
  });

  it("추가된 세션의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSession(makeSessionParams({ title: "봄 정기 평가" }));
    });
    expect(result.current.sessions[0].title).toBe("봄 정기 평가");
  });

  it("title의 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSession(makeSessionParams({ title: "  봄 평가  " }));
    });
    expect(result.current.sessions[0].title).toBe("봄 평가");
  });

  it("addSession은 생성된 세션의 id를 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    expect(sessionId).toBeDefined();
    expect(typeof sessionId).toBe("string");
  });

  it("title이 빈 문자열이면 null을 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = "초기값";
    act(() => {
      sessionId = result.current.addSession(makeSessionParams({ title: "" }));
    });
    expect(sessionId).toBeNull();
  });

  it("title이 공백만이면 null을 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = "초기값";
    act(() => {
      sessionId = result.current.addSession(makeSessionParams({ title: "   " }));
    });
    expect(sessionId).toBeNull();
  });

  it("date가 빈 문자열이면 null을 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = "초기값";
    act(() => {
      sessionId = result.current.addSession(makeSessionParams({ date: "" }));
    });
    expect(sessionId).toBeNull();
  });

  it("evaluator가 빈 문자열이면 null을 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = "초기값";
    act(() => {
      sessionId = result.current.addSession(makeSessionParams({ evaluator: "" }));
    });
    expect(sessionId).toBeNull();
  });

  it("criteria가 빈 배열이면 null을 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = "초기값";
    act(() => {
      sessionId = result.current.addSession(makeSessionParams({ criteria: [] }));
    });
    expect(sessionId).toBeNull();
  });

  it("추가된 세션의 results는 빈 배열이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSession(makeSessionParams());
    });
    expect(result.current.sessions[0].results).toEqual([]);
  });

  it("추가된 세션의 createdAt이 ISO 형식이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSession(makeSessionParams());
    });
    expect(result.current.sessions[0].createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });

  it("세션 추가 시 memStore에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSession(makeSessionParams());
    });
    const key = `dancebase:practice-evaluation:${GROUP_ID}`;
    expect(memStore[key]).toBeDefined();
  });
});

// ============================================================
// updateSession 테스트
// ============================================================

describe("usePracticeEvaluation - updateSession 세션 수정", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("세션 title을 수정할 수 있다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams({ title: "원래 제목" }));
    });
    act(() => {
      result.current.updateSession(sessionId!, { title: "수정된 제목" });
    });
    expect(result.current.sessions[0].title).toBe("수정된 제목");
  });

  it("updateSession은 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    let ok: boolean | undefined;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      ok = result.current.updateSession(sessionId!, { title: "새 제목" });
    });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 id로 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.updateSession("non-existent", { title: "변경" });
    });
    expect(ok).toBe(false);
  });

  it("수정 시 sessions 수는 그대로다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.updateSession(sessionId!, { title: "새 제목" });
    });
    expect(result.current.sessions).toHaveLength(1);
  });

  it("notes를 수정할 수 있다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.updateSession(sessionId!, { notes: "메모 내용" });
    });
    expect(result.current.sessions[0].notes).toBe("메모 내용");
  });
});

// ============================================================
// deleteSession 테스트
// ============================================================

describe("usePracticeEvaluation - deleteSession 세션 삭제", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("세션 삭제 시 sessions 길이가 감소한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.deleteSession(sessionId!);
    });
    expect(result.current.sessions).toHaveLength(0);
  });

  it("deleteSession은 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    let ok: boolean | undefined;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      ok = result.current.deleteSession(sessionId!);
    });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 id로 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.deleteSession("non-existent");
    });
    expect(ok).toBe(false);
  });

  it("특정 세션만 삭제된다", () => {
    const { result } = makeHook();
    let s1: string | null = null;
    let s2: string | null = null;
    act(() => {
      s1 = result.current.addSession(makeSessionParams({ title: "세션1" }));
    });
    act(() => {
      s2 = result.current.addSession(makeSessionParams({ title: "세션2" }));
    });
    act(() => {
      result.current.deleteSession(s1!);
    });
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].title).toBe("세션2");
  });
});

// ============================================================
// addCriteria / deleteCriteria 테스트
// ============================================================

describe("usePracticeEvaluation - addCriteria / deleteCriteria", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("세션에 기준을 추가할 수 있다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.addCriteria(sessionId!, { name: "리듬감", maxScore: 10 });
    });
    const session = result.current.sessions.find((s) => s.id === sessionId);
    expect(session?.criteria.length).toBeGreaterThan(SAMPLE_CRITERIA.length);
  });

  it("기준 이름이 빈 문자열이면 false를 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    let ok: boolean | undefined;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      ok = result.current.addCriteria(sessionId!, { name: "", maxScore: 10 });
    });
    expect(ok).toBe(false);
  });

  it("maxScore가 0이면 false를 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    let ok: boolean | undefined;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      ok = result.current.addCriteria(sessionId!, { name: "기준", maxScore: 0 });
    });
    expect(ok).toBe(false);
  });

  it("기준 삭제 시 해당 기준이 제거된다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    const criteriaId = result.current.sessions.find((s) => s.id === sessionId)?.criteria[0]?.id;
    act(() => {
      result.current.deleteCriteria(sessionId!, criteriaId!);
    });
    const session = result.current.sessions.find((s) => s.id === sessionId);
    expect(session?.criteria.find((c) => c.id === criteriaId)).toBeUndefined();
  });
});

// ============================================================
// saveMemberResult / deleteMemberResult 테스트
// ============================================================

describe("usePracticeEvaluation - saveMemberResult / deleteMemberResult", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("멤버 결과를 저장할 수 있다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    const scores: PracticeEvalScore[] = [
      { criteriaId: "c1", score: 8 },
      { criteriaId: "c2", score: 7 },
    ];
    act(() => {
      result.current.saveMemberResult(sessionId!, "홍길동", scores);
    });
    const session = result.current.sessions.find((s) => s.id === sessionId);
    expect(session?.results).toHaveLength(1);
    expect(session?.results[0].memberName).toBe("홍길동");
  });

  it("totalScore는 scores 합산이다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    const scores: PracticeEvalScore[] = [
      { criteriaId: "c1", score: 8 },
      { criteriaId: "c2", score: 7 },
    ];
    act(() => {
      result.current.saveMemberResult(sessionId!, "홍길동", scores);
    });
    const session = result.current.sessions.find((s) => s.id === sessionId);
    expect(session?.results[0].totalScore).toBe(15);
  });

  it("같은 멤버 이름은 결과가 덮어쓰여진다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.saveMemberResult(sessionId!, "홍길동", [{ criteriaId: "c1", score: 5 }]);
    });
    act(() => {
      result.current.saveMemberResult(sessionId!, "홍길동", [{ criteriaId: "c1", score: 9 }]);
    });
    const session = result.current.sessions.find((s) => s.id === sessionId);
    expect(session?.results).toHaveLength(1);
    expect(session?.results[0].totalScore).toBe(9);
  });

  it("멤버 이름이 빈 문자열이면 false를 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    let ok: boolean | undefined;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      ok = result.current.saveMemberResult(sessionId!, "", []);
    });
    expect(ok).toBe(false);
  });

  it("멤버 결과를 삭제할 수 있다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.saveMemberResult(sessionId!, "홍길동", [{ criteriaId: "c1", score: 8 }]);
    });
    act(() => {
      result.current.deleteMemberResult(sessionId!, "홍길동");
    });
    const session = result.current.sessions.find((s) => s.id === sessionId);
    expect(session?.results).toHaveLength(0);
  });
});

// ============================================================
// getMemberAverage 테스트
// ============================================================

describe("usePracticeEvaluation - getMemberAverage 멤버 평균 계산", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("세션이 없으면 0을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getMemberAverage("홍길동")).toBe(0);
  });

  it("단일 세션의 totalScore를 평균으로 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.saveMemberResult(sessionId!, "김철수", [{ criteriaId: "c1", score: 20 }]);
    });
    expect(result.current.getMemberAverage("김철수")).toBe(20);
  });

  it("여러 세션에서 평균을 계산한다", () => {
    const { result } = makeHook();
    let s1: string | null = null;
    let s2: string | null = null;
    act(() => {
      s1 = result.current.addSession(makeSessionParams({ title: "세션1" }));
    });
    act(() => {
      s2 = result.current.addSession(makeSessionParams({ title: "세션2" }));
    });
    act(() => {
      result.current.saveMemberResult(s1!, "이영희", [{ criteriaId: "c1", score: 10 }]);
    });
    act(() => {
      result.current.saveMemberResult(s2!, "이영희", [{ criteriaId: "c1", score: 20 }]);
    });
    // 평균 15
    expect(result.current.getMemberAverage("이영희")).toBe(15);
  });

  it("대소문자 구분 없이 멤버를 조회한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.saveMemberResult(sessionId!, "Alice", [{ criteriaId: "c1", score: 30 }]);
    });
    expect(result.current.getMemberAverage("alice")).toBe(30);
  });
});

// ============================================================
// getMemberTrend 테스트
// ============================================================

describe("usePracticeEvaluation - getMemberTrend 멤버 점수 추이", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("세션이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getMemberTrend("홍길동")).toEqual([]);
  });

  it("멤버가 참여한 세션의 추이를 반환한다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams({ title: "평가1", date: "2026-02-01" }));
    });
    act(() => {
      result.current.saveMemberResult(sessionId!, "박민준", [{ criteriaId: "c1", score: 15 }]);
    });
    const trend = result.current.getMemberTrend("박민준");
    expect(trend).toHaveLength(1);
    expect(trend[0].totalScore).toBe(15);
    expect(trend[0].title).toBe("평가1");
  });

  it("최대 5개 세션만 반환한다", () => {
    const { result } = makeHook();
    const sessionIds: (string | null)[] = [];
    for (let i = 0; i < 6; i++) {
      act(() => {
        const id = result.current.addSession(
          makeSessionParams({ title: `세션${i + 1}`, date: `2026-0${i + 1}-01` })
        );
        sessionIds.push(id);
      });
    }
    for (const id of sessionIds) {
      act(() => {
        result.current.saveMemberResult(id!, "박민준", [{ criteriaId: "c1", score: 10 }]);
      });
    }
    const trend = result.current.getMemberTrend("박민준");
    expect(trend.length).toBeLessThanOrEqual(5);
  });
});

// ============================================================
// stats 계산 테스트
// ============================================================

describe("usePracticeEvaluation - stats 통계 계산", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("세션 추가 시 totalSessions가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSession(makeSessionParams({ title: "세션1" }));
    });
    act(() => {
      result.current.addSession(makeSessionParams({ title: "세션2" }));
    });
    expect(result.current.stats.totalSessions).toBe(2);
  });

  it("멤버 결과가 있으면 averageScore가 계산된다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.saveMemberResult(sessionId!, "멤버A", [{ criteriaId: "c1", score: 20 }]);
    });
    expect(result.current.stats.averageScore).toBe(20);
  });

  it("topPerformers는 최대 3명이다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.saveMemberResult(sessionId!, "멤버A", [{ criteriaId: "c1", score: 30 }]);
      result.current.saveMemberResult(sessionId!, "멤버B", [{ criteriaId: "c1", score: 25 }]);
      result.current.saveMemberResult(sessionId!, "멤버C", [{ criteriaId: "c1", score: 20 }]);
      result.current.saveMemberResult(sessionId!, "멤버D", [{ criteriaId: "c1", score: 15 }]);
    });
    expect(result.current.stats.topPerformers.length).toBeLessThanOrEqual(3);
  });

  it("topPerformers는 averageScore 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    let sessionId: string | null = null;
    act(() => {
      sessionId = result.current.addSession(makeSessionParams());
    });
    act(() => {
      result.current.saveMemberResult(sessionId!, "멤버A", [{ criteriaId: "c1", score: 10 }]);
      result.current.saveMemberResult(sessionId!, "멤버B", [{ criteriaId: "c1", score: 30 }]);
    });
    const performers = result.current.stats.topPerformers;
    if (performers.length >= 2) {
      expect(performers[0].averageScore).toBeGreaterThanOrEqual(performers[1].averageScore);
    }
  });

  it("그룹별로 데이터가 격리된다", () => {
    const { result: r1 } = renderHook(() => usePracticeEvaluation("group-A"));
    const { result: r2 } = renderHook(() => usePracticeEvaluation("group-B"));

    act(() => {
      r1.current.addSession(makeSessionParams({ title: "A 세션" }));
    });

    expect(r1.current.sessions).toHaveLength(1);
    expect(r2.current.sessions).toHaveLength(0);
  });
});
