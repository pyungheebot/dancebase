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
    memberAttendanceStatsDashboard: (id: string) => `member-attendance-stats-${id}`,
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
    MEMBER_NAME_REQUIRED_DOT: "멤버 이름을 입력하세요.",
    DATE_REQUIRED_DOT: "날짜를 선택하세요.",
    ATTENDANCE: {
      ADDED: "출석이 기록되었습니다",
      ADD_ERROR: "출석 기록에 실패했습니다",
      DELETED: "출석 기록이 삭제되었습니다",
      DELETE_ERROR: "삭제에 실패했습니다",
    },
  },
}));

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── 훅 import ───────────────────────────────────────────────
import { useMemberAttendanceStatsDashboard } from "@/hooks/use-member-attendance-stats-dashboard";

// ─── 헬퍼 ────────────────────────────────────────────────────
const GROUP_ID = "group-attend-1";

function makeHook(groupId = GROUP_ID) {
  return renderHook(() => useMemberAttendanceStatsDashboard(groupId));
}

function makeRecord(overrides: Partial<{
  memberName: string;
  date: string;
  status: "present" | "late" | "early_leave" | "absent";
  notes: string;
}> = {}) {
  return {
    memberName: "홍길동",
    date: "2026-03-01",
    status: "present" as const,
    ...overrides,
  };
}

function clearStore() {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
}

// ============================================================
// 초기 상태 테스트
// ============================================================

describe("useMemberAttendanceStatsDashboard - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("초기 records는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.records).toEqual([]);
  });

  it("addRecord, deleteRecord 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addRecord).toBe("function");
    expect(typeof result.current.deleteRecord).toBe("function");
  });

  it("getFilteredRecords, getMemberSummaries, getOverallStats 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getFilteredRecords).toBe("function");
    expect(typeof result.current.getMemberSummaries).toBe("function");
    expect(typeof result.current.getOverallStats).toBe("function");
  });

  it("getMonthlyTrend 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getMonthlyTrend).toBe("function");
  });
});

// ============================================================
// addRecord 테스트
// ============================================================

describe("useMemberAttendanceStatsDashboard - addRecord 출석 기록 추가", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("기록 추가 시 records 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord());
    });
    expect(result.current.records).toHaveLength(1);
  });

  it("addRecord는 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addRecord(makeRecord());
    });
    expect(ok).toBe(true);
  });

  it("memberName이 빈 문자열이면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addRecord(makeRecord({ memberName: "" }));
    });
    expect(ok).toBe(false);
  });

  it("date가 빈 문자열이면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addRecord(makeRecord({ date: "" }));
    });
    expect(ok).toBe(false);
  });

  it("추가된 기록의 status가 올바르다 (absent)", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ status: "absent" }));
    });
    expect(result.current.records[0].status).toBe("absent");
  });

  it("추가된 기록의 memberName이 trim된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "  홍길동  " }));
    });
    expect(result.current.records[0].memberName).toBe("홍길동");
  });

  it("late 상태로 기록을 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ status: "late" }));
    });
    expect(result.current.records[0].status).toBe("late");
  });

  it("early_leave 상태로 기록을 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ status: "early_leave" }));
    });
    expect(result.current.records[0].status).toBe("early_leave");
  });

  it("기록 추가 시 memStore에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord());
    });
    const key = `dancebase:member-attendance-stats:${GROUP_ID}`;
    expect(memStore[key]).toBeDefined();
  });
});

// ============================================================
// deleteRecord 테스트
// ============================================================

describe("useMemberAttendanceStatsDashboard - deleteRecord 기록 삭제", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("기록 삭제 시 records 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord());
    });
    const id = result.current.records[0].id;
    act(() => {
      result.current.deleteRecord(id);
    });
    expect(result.current.records).toHaveLength(0);
  });

  it("deleteRecord는 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord());
    });
    const id = result.current.records[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.deleteRecord(id);
    });
    expect(ok).toBe(true);
  });

  it("특정 기록만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "멤버A", date: "2026-03-01" }));
    });
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "멤버B", date: "2026-03-01" }));
    });
    const idToDelete = result.current.records[0].id;
    act(() => {
      result.current.deleteRecord(idToDelete);
    });
    expect(result.current.records).toHaveLength(1);
  });
});

// ============================================================
// getMemberSummaries 테스트
// ============================================================

describe("useMemberAttendanceStatsDashboard - getMemberSummaries 멤버별 통계", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("records가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getMemberSummaries()).toEqual([]);
  });

  it("present 기록이 있으면 presentCount가 1이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "김민수", status: "present" }));
    });
    const summaries = result.current.getMemberSummaries();
    const summary = summaries.find((s) => s.memberName === "김민수");
    expect(summary?.presentCount).toBe(1);
  });

  it("absent 기록이 있으면 absentCount가 1이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "이지수", status: "absent" }));
    });
    const summaries = result.current.getMemberSummaries();
    const summary = summaries.find((s) => s.memberName === "이지수");
    expect(summary?.absentCount).toBe(1);
  });

  it("전체 출석 시 attendanceRate는 100이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "박지현", status: "present" }));
    });
    const summaries = result.current.getMemberSummaries();
    const summary = summaries.find((s) => s.memberName === "박지현");
    expect(summary?.attendanceRate).toBe(100);
  });

  it("absent만 있으면 attendanceRate는 0이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "최현우", status: "absent" }));
    });
    const summaries = result.current.getMemberSummaries();
    const summary = summaries.find((s) => s.memberName === "최현우");
    expect(summary?.attendanceRate).toBe(0);
  });

  it("late 기록도 출석률에 반영된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "정민호", status: "late", date: "2026-03-01" }));
    });
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "정민호", status: "absent", date: "2026-03-02" }));
    });
    const summaries = result.current.getMemberSummaries();
    const summary = summaries.find((s) => s.memberName === "정민호");
    // 2회 중 1회(late) 유효 → 50%
    expect(summary?.attendanceRate).toBe(50);
  });

  it("attendanceRate 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "A멤버", status: "absent" }));
    });
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "B멤버", status: "present" }));
    });
    const summaries = result.current.getMemberSummaries();
    if (summaries.length >= 2) {
      expect(summaries[0].attendanceRate).toBeGreaterThanOrEqual(summaries[1].attendanceRate);
    }
  });

  it("currentStreak과 longestStreak이 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "스트릭멤버" }));
    });
    const summaries = result.current.getMemberSummaries();
    const summary = summaries.find((s) => s.memberName === "스트릭멤버");
    expect(summary).toHaveProperty("currentStreak");
    expect(summary).toHaveProperty("longestStreak");
  });
});

// ============================================================
// getOverallStats 테스트
// ============================================================

describe("useMemberAttendanceStatsDashboard - getOverallStats 전체 통계", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("records가 없으면 totalRecords는 0이다", () => {
    const { result } = makeHook();
    const stats = result.current.getOverallStats();
    expect(stats.totalRecords).toBe(0);
  });

  it("records가 없으면 overallAttendanceRate는 0이다", () => {
    const { result } = makeHook();
    const stats = result.current.getOverallStats();
    expect(stats.overallAttendanceRate).toBe(0);
  });

  it("records가 없으면 topAttendee는 null이다", () => {
    const { result } = makeHook();
    const stats = result.current.getOverallStats();
    expect(stats.topAttendee).toBeNull();
  });

  it("records가 없으면 mostAbsentee는 null이다", () => {
    const { result } = makeHook();
    const stats = result.current.getOverallStats();
    expect(stats.mostAbsentee).toBeNull();
  });

  it("totalRecords가 올바르게 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "멤버A" }));
    });
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "멤버B" }));
    });
    const stats = result.current.getOverallStats();
    expect(stats.totalRecords).toBe(2);
  });

  it("전체 present 기록이면 overallAttendanceRate는 100이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ status: "present" }));
    });
    const stats = result.current.getOverallStats();
    expect(stats.overallAttendanceRate).toBe(100);
  });

  it("전체 absent 기록이면 overallAttendanceRate는 0이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ status: "absent" }));
    });
    const stats = result.current.getOverallStats();
    expect(stats.overallAttendanceRate).toBe(0);
  });

  it("perfectAttendanceMembers 배열이 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "완벽멤버", status: "present" }));
    });
    const stats = result.current.getOverallStats();
    expect(Array.isArray(stats.perfectAttendanceMembers)).toBe(true);
    expect(stats.perfectAttendanceMembers).toContain("완벽멤버");
  });

  it("absent가 가장 많은 멤버가 mostAbsentee로 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "불성실멤버", status: "absent", date: "2026-03-01" }));
    });
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "불성실멤버", status: "absent", date: "2026-03-02" }));
    });
    act(() => {
      result.current.addRecord(makeRecord({ memberName: "성실멤버", status: "present" }));
    });
    const stats = result.current.getOverallStats();
    expect(stats.mostAbsentee).toBe("불성실멤버");
  });
});

// ============================================================
// getMonthlyTrend 테스트
// ============================================================

describe("useMemberAttendanceStatsDashboard - getMonthlyTrend 월별 추이", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("기본 6개월 데이터를 반환한다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend();
    expect(trend).toHaveLength(6);
  });

  it("months 파라미터에 따라 데이터 수가 달라진다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend(3);
    expect(trend).toHaveLength(3);
  });

  it("각 항목에 label과 rate가 있다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend(1);
    expect(trend[0]).toHaveProperty("label");
    expect(trend[0]).toHaveProperty("rate");
  });

  it("rate는 0 이상 100 이하이다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend();
    for (const item of trend) {
      expect(item.rate).toBeGreaterThanOrEqual(0);
      expect(item.rate).toBeLessThanOrEqual(100);
    }
  });

  it("records가 없으면 rate는 모두 0이다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend();
    for (const item of trend) {
      expect(item.rate).toBe(0);
    }
  });

  it("label은 '월' 형식이다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend(1);
    expect(trend[0].label).toMatch(/^\d+월$/);
  });
});

// ============================================================
// 그룹별 데이터 격리 테스트
// ============================================================

describe("useMemberAttendanceStatsDashboard - 그룹별 데이터 격리", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("다른 groupId는 독립적인 records를 가진다", () => {
    const { result: r1 } = renderHook(() =>
      useMemberAttendanceStatsDashboard("group-A")
    );
    const { result: r2 } = renderHook(() =>
      useMemberAttendanceStatsDashboard("group-B")
    );

    act(() => {
      r1.current.addRecord(makeRecord({ memberName: "그룹A 멤버" }));
    });

    expect(r1.current.records).toHaveLength(1);
    expect(r2.current.records).toHaveLength(0);
  });
});
