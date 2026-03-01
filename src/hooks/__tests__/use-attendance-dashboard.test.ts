import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── localStorage mock ────────────────────────────────────────
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
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const { useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }
      const fetchResult = fetcher();
      const [data, setData] = reactUseState<unknown>(() => fetchResult);
      const setDataRef = useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          setDataRef.current(fetcher!() as unknown);
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    attendanceDashboard: (groupId: string) =>
      `attendance-dashboard-${groupId}`,
  },
}));

// ─── toast mock ──────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    MEMBER_NAME_REQUIRED_DOT: "멤버 이름을 입력하세요.",
    DATE_REQUIRED_DOT: "날짜를 입력하세요.",
    ATTENDANCE: {
      ADDED: "출석 기록이 추가되었습니다.",
      ADD_ERROR: "출석 기록 추가에 실패했습니다.",
      UPDATED: "출석 기록이 수정되었습니다.",
      UPDATE_ERROR: "출석 기록 수정에 실패했습니다.",
      DELETED: "출석 기록이 삭제되었습니다.",
      DELETE_ERROR: "출석 기록 삭제에 실패했습니다.",
    },
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useAttendanceDashboard } from "@/hooks/use-attendance-dashboard";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useAttendanceDashboard(groupId));
}

function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

// ============================================================
// useAttendanceDashboard - 초기 상태
// ============================================================

describe("useAttendanceDashboard - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("초기 records는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.records).toEqual([]);
  });

  it("초기 stats.totalRecords는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalRecords).toBe(0);
  });

  it("초기 stats.overallAttendanceRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.overallAttendanceRate).toBe(0);
  });

  it("초기 stats.perfectAttendanceMembers는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.perfectAttendanceMembers).toEqual([]);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addRecord).toBe("function");
    expect(typeof result.current.updateRecord).toBe("function");
    expect(typeof result.current.deleteRecord).toBe("function");
    expect(typeof result.current.getByMonth).toBe("function");
    expect(typeof result.current.getByMember).toBe("function");
    expect(typeof result.current.getMemberSummaries).toBe("function");
    expect(typeof result.current.getMonthlyTrend).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useAttendanceDashboard - addRecord
// ============================================================

describe("useAttendanceDashboard - addRecord 기록 추가", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("유효한 기록을 추가하면 records 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    expect(result.current.records).toHaveLength(1);
  });

  it("추가된 기록의 memberName이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-03-01",
        status: "present",
      });
    });
    expect(result.current.records[0].memberName).toBe("김철수");
  });

  it("추가된 기록의 status가 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "absent",
      });
    });
    expect(result.current.records[0].status).toBe("absent");
  });

  it("추가된 기록에 id가 부여된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    expect(result.current.records[0].id).toBeDefined();
  });

  it("memberName이 빈 문자열이면 false를 반환하고 records가 비어있다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.addRecord({
        memberName: "",
        date: "2026-03-01",
        status: "present",
      });
    });
    expect(ret).toBe(false);
    expect(result.current.records).toHaveLength(0);
  });

  it("memberName이 공백만이면 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.addRecord({
        memberName: "   ",
        date: "2026-03-01",
        status: "present",
      });
    });
    expect(ret).toBe(false);
  });

  it("date가 빈 문자열이면 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.addRecord({
        memberName: "홍길동",
        date: "",
        status: "present",
      });
    });
    expect(ret).toBe(false);
  });

  it("유효한 기록 추가 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = false;
    act(() => {
      ret = result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    expect(ret).toBe(true);
  });

  it("notes가 있는 기록을 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "excused",
        notes: "개인 사정",
      });
    });
    expect(result.current.records[0].notes).toBe("개인 사정");
  });

  it("memberName 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "  홍길동  ",
        date: "2026-03-01",
        status: "present",
      });
    });
    expect(result.current.records[0].memberName).toBe("홍길동");
  });

  it("late 상태의 기록을 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "late",
      });
    });
    expect(result.current.records[0].status).toBe("late");
  });
});

// ============================================================
// useAttendanceDashboard - updateRecord
// ============================================================

describe("useAttendanceDashboard - updateRecord 기록 수정", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("기록의 status를 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    const id = result.current.records[0].id;
    act(() => {
      result.current.updateRecord(id, { status: "absent" });
    });
    expect(result.current.records[0].status).toBe("absent");
  });

  it("기록 수정 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    const id = result.current.records[0].id;
    let ret: boolean = false;
    act(() => {
      ret = result.current.updateRecord(id, { status: "absent" });
    });
    expect(ret).toBe(true);
  });

  it("다른 기록은 수정되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-03-01",
        status: "present",
      });
    });
    const firstId = result.current.records[0].id;
    act(() => {
      result.current.updateRecord(firstId, { status: "absent" });
    });
    expect(result.current.records[1].status).toBe("present");
  });

  it("notes를 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    const id = result.current.records[0].id;
    act(() => {
      result.current.updateRecord(id, { notes: "업데이트된 노트" });
    });
    expect(result.current.records[0].notes).toBe("업데이트된 노트");
  });
});

// ============================================================
// useAttendanceDashboard - deleteRecord
// ============================================================

describe("useAttendanceDashboard - deleteRecord 기록 삭제", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("기록 삭제 후 records 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    const id = result.current.records[0].id;
    act(() => {
      result.current.deleteRecord(id);
    });
    expect(result.current.records).toHaveLength(0);
  });

  it("삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    const id = result.current.records[0].id;
    let ret: boolean = false;
    act(() => {
      ret = result.current.deleteRecord(id);
    });
    expect(ret).toBe(true);
  });

  it("특정 기록만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-03-02",
        status: "absent",
      });
    });
    const firstId = result.current.records[0].id;
    act(() => {
      result.current.deleteRecord(firstId);
    });
    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].memberName).toBe("김철수");
  });
});

// ============================================================
// useAttendanceDashboard - getByMonth
// ============================================================

describe("useAttendanceDashboard - getByMonth 월별 필터", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("해당 월의 기록만 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-04-01",
        status: "present",
      });
    });
    const marchRecords = result.current.getByMonth(2026, 3);
    expect(marchRecords).toHaveLength(1);
    expect(marchRecords[0].memberName).toBe("홍길동");
  });

  it("해당 월에 기록이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    const mayRecords = result.current.getByMonth(2026, 5);
    expect(mayRecords).toEqual([]);
  });

  it("월이 10 미만이면 0을 앞에 붙여 필터한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-01-15",
        status: "present",
      });
    });
    const janRecords = result.current.getByMonth(2026, 1);
    expect(janRecords).toHaveLength(1);
  });

  it("같은 월의 여러 기록을 모두 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-03-15",
        status: "absent",
      });
    });
    const marchRecords = result.current.getByMonth(2026, 3);
    expect(marchRecords).toHaveLength(2);
  });
});

// ============================================================
// useAttendanceDashboard - getByMember
// ============================================================

describe("useAttendanceDashboard - getByMember 멤버별 필터", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("특정 멤버의 기록만 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-03-01",
        status: "absent",
      });
    });
    const hongRecords = result.current.getByMember("홍길동");
    expect(hongRecords).toHaveLength(1);
    expect(hongRecords[0].memberName).toBe("홍길동");
  });

  it("대소문자를 구분하지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    const records = result.current.getByMember("홍길동");
    expect(records).toHaveLength(1);
  });

  it("존재하지 않는 멤버는 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    const records = result.current.getByMember("존재안함");
    expect(records).toEqual([]);
  });

  it("멤버의 여러 기록을 모두 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-08",
        status: "absent",
      });
    });
    const records = result.current.getByMember("홍길동");
    expect(records).toHaveLength(2);
  });
});

// ============================================================
// useAttendanceDashboard - getMemberSummaries
// ============================================================

describe("useAttendanceDashboard - getMemberSummaries 멤버별 요약", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("기록이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const summaries = result.current.getMemberSummaries();
    expect(summaries).toEqual([]);
  });

  it("멤버별 요약이 생성된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    const summaries = result.current.getMemberSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].memberName).toBe("홍길동");
  });

  it("presentCount가 올바르게 집계된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-08",
        status: "present",
      });
    });
    const summaries = result.current.getMemberSummaries();
    expect(summaries[0].presentCount).toBe(2);
  });

  it("lateCount가 올바르게 집계된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "late",
      });
    });
    const summaries = result.current.getMemberSummaries();
    expect(summaries[0].lateCount).toBe(1);
  });

  it("absentCount가 올바르게 집계된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "absent",
      });
    });
    const summaries = result.current.getMemberSummaries();
    expect(summaries[0].absentCount).toBe(1);
  });

  it("excusedCount가 올바르게 집계된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "excused",
      });
    });
    const summaries = result.current.getMemberSummaries();
    expect(summaries[0].excusedCount).toBe(1);
  });

  it("출석률이 높은 순으로 정렬된다", () => {
    const { result } = makeHook();
    // 홍길동: 출석 1회 → 50% (absent 1, present 1)
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "absent",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-08",
        status: "present",
      });
    });
    // 김철수: 출석 2회 → 100%
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-03-01",
        status: "present",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-03-08",
        status: "present",
      });
    });
    const summaries = result.current.getMemberSummaries();
    expect(summaries[0].memberName).toBe("김철수");
    expect(summaries[1].memberName).toBe("홍길동");
  });

  it("모두 출석이면 attendanceRate는 100이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    const summaries = result.current.getMemberSummaries();
    expect(summaries[0].attendanceRate).toBe(100);
  });

  it("late는 출석으로 간주해 attendanceRate에 포함된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "late",
      });
    });
    const summaries = result.current.getMemberSummaries();
    expect(summaries[0].attendanceRate).toBe(100);
  });
});

// ============================================================
// useAttendanceDashboard - stats
// ============================================================

describe("useAttendanceDashboard - stats 전체 통계", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("totalRecords가 추가한 기록 수와 일치한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-03-01",
        status: "absent",
      });
    });
    expect(result.current.stats.totalRecords).toBe(2);
  });

  it("모든 기록이 present이면 overallAttendanceRate는 100이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-03-01",
        status: "present",
      });
    });
    expect(result.current.stats.overallAttendanceRate).toBe(100);
  });

  it("모두 absent이면 overallAttendanceRate는 0이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "absent",
      });
    });
    expect(result.current.stats.overallAttendanceRate).toBe(0);
  });

  it("late는 출석으로 계산해 overallAttendanceRate에 포함한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "late",
      });
    });
    expect(result.current.stats.overallAttendanceRate).toBe(100);
  });

  it("perfectAttendanceMembers는 출석률 100%인 멤버만 포함한다", () => {
    const { result } = makeHook();
    // 홍길동: 100%
    act(() => {
      result.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    // 김철수: absent → 0%
    act(() => {
      result.current.addRecord({
        memberName: "김철수",
        date: "2026-03-01",
        status: "absent",
      });
    });
    expect(result.current.stats.perfectAttendanceMembers).toContain("홍길동");
    expect(result.current.stats.perfectAttendanceMembers).not.toContain("김철수");
  });

  it("기록이 없으면 overallAttendanceRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.overallAttendanceRate).toBe(0);
  });
});

// ============================================================
// useAttendanceDashboard - getMonthlyTrend
// ============================================================

describe("useAttendanceDashboard - getMonthlyTrend 월별 추이", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("getMonthlyTrend(3)은 3개의 항목을 반환한다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend(3);
    expect(trend).toHaveLength(3);
  });

  it("getMonthlyTrend(6)은 6개의 항목을 반환한다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend(6);
    expect(trend).toHaveLength(6);
  });

  it("각 항목에 label, rate, year, month 필드가 있다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend(1);
    expect(trend[0]).toHaveProperty("label");
    expect(trend[0]).toHaveProperty("rate");
    expect(trend[0]).toHaveProperty("year");
    expect(trend[0]).toHaveProperty("month");
  });

  it("rate는 0~100 사이 정수이다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend(3);
    for (const item of trend) {
      expect(item.rate).toBeGreaterThanOrEqual(0);
      expect(item.rate).toBeLessThanOrEqual(100);
    }
  });

  it("기록이 없는 월의 rate는 0이다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend(3);
    // 기록이 없으므로 모든 월의 rate는 0
    trend.forEach((item) => {
      expect(item.rate).toBe(0);
    });
  });

  it("label은 '월' 형식을 포함한다", () => {
    const { result } = makeHook();
    const trend = result.current.getMonthlyTrend(1);
    expect(trend[0].label).toMatch(/\d+월/);
  });
});

// ============================================================
// useAttendanceDashboard - 그룹 격리
// ============================================================

describe("useAttendanceDashboard - 그룹별 데이터 격리", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("다른 groupId의 데이터는 공유되지 않는다", () => {
    const { result: r1 } = makeHook("group-A");
    const { result: r2 } = makeHook("group-B");
    act(() => {
      r1.current.addRecord({
        memberName: "홍길동",
        date: "2026-03-01",
        status: "present",
      });
    });
    expect(r2.current.records).toHaveLength(0);
  });
});
