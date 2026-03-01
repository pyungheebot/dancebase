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
    attendanceException: (groupId: string) =>
      `attendance-exception-${groupId}`,
  },
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useAttendanceException } from "@/hooks/use-attendance-exception";
import type { AttendanceExceptionType } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useAttendanceException(groupId));
}

function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

function addExEntry(
  hook: ReturnType<typeof makeHook>["result"],
  overrides: {
    memberName?: string;
    date?: string;
    type?: AttendanceExceptionType;
    reason?: string;
    duration?: number;
  } = {}
) {
  const {
    memberName = "홍길동",
    date = "2026-03-01",
    type = "late",
    reason = "교통 체증",
    duration,
  } = overrides;
  act(() => {
    hook.current.addException(memberName, date, type, reason, duration);
  });
}

// ============================================================
// useAttendanceException - 초기 상태
// ============================================================

describe("useAttendanceException - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("초기 totalExceptions는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalExceptions).toBe(0);
  });

  it("초기 pendingCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.pendingCount).toBe(0);
  });

  it("초기 memberExceptionCount는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.memberExceptionCount).toEqual([]);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addException).toBe("function");
    expect(typeof result.current.approveException).toBe("function");
    expect(typeof result.current.rejectException).toBe("function");
    expect(typeof result.current.deleteException).toBe("function");
    expect(typeof result.current.getByMember).toBe("function");
    expect(typeof result.current.getByDate).toBe("function");
    expect(typeof result.current.getByType).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("초기 typeDistribution의 모든 타입이 0이다", () => {
    const { result } = makeHook();
    expect(result.current.typeDistribution.late).toBe(0);
    expect(result.current.typeDistribution.early_leave).toBe(0);
    expect(result.current.typeDistribution.excused).toBe(0);
    expect(result.current.typeDistribution.sick).toBe(0);
    expect(result.current.typeDistribution.personal).toBe(0);
    expect(result.current.typeDistribution.emergency).toBe(0);
  });
});

// ============================================================
// useAttendanceException - addException
// ============================================================

describe("useAttendanceException - addException 예외 추가", () => {
  beforeEach(() => {
    clearStore();
  });

  it("예외 추가 후 entries 길이가 1이 된다", () => {
    const { result } = makeHook();
    addExEntry(result);
    expect(result.current.entries).toHaveLength(1);
  });

  it("추가된 예외의 memberName이 올바르다", () => {
    const { result } = makeHook();
    addExEntry(result, { memberName: "김철수" });
    expect(result.current.entries[0].memberName).toBe("김철수");
  });

  it("추가된 예외의 date가 올바르다", () => {
    const { result } = makeHook();
    addExEntry(result, { date: "2026-03-15" });
    expect(result.current.entries[0].date).toBe("2026-03-15");
  });

  it("추가된 예외의 type이 올바르다", () => {
    const { result } = makeHook();
    addExEntry(result, { type: "sick" });
    expect(result.current.entries[0].type).toBe("sick");
  });

  it("추가된 예외의 reason이 올바르다", () => {
    const { result } = makeHook();
    addExEntry(result, { reason: "독감 증상" });
    expect(result.current.entries[0].reason).toBe("독감 증상");
  });

  it("추가된 예외의 초기 status는 pending이다", () => {
    const { result } = makeHook();
    addExEntry(result);
    expect(result.current.entries[0].status).toBe("pending");
  });

  it("추가된 예외에 id가 부여된다", () => {
    const { result } = makeHook();
    addExEntry(result);
    expect(result.current.entries[0].id).toBeDefined();
  });

  it("추가된 예외에 createdAt이 설정된다", () => {
    const { result } = makeHook();
    addExEntry(result);
    expect(result.current.entries[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("duration이 있는 예외를 추가할 수 있다", () => {
    const { result } = makeHook();
    addExEntry(result, { duration: 30 });
    expect(result.current.entries[0].duration).toBe(30);
  });

  it("early_leave 타입의 예외를 추가할 수 있다", () => {
    const { result } = makeHook();
    addExEntry(result, { type: "early_leave" });
    expect(result.current.entries[0].type).toBe("early_leave");
  });

  it("emergency 타입의 예외를 추가할 수 있다", () => {
    const { result } = makeHook();
    addExEntry(result, { type: "emergency" });
    expect(result.current.entries[0].type).toBe("emergency");
  });

  it("totalExceptions가 추가한 예외 수와 일치한다", () => {
    const { result } = makeHook();
    addExEntry(result);
    addExEntry(result, { date: "2026-03-02" });
    expect(result.current.totalExceptions).toBe(2);
  });

  it("pendingCount가 추가한 예외 수와 일치한다", () => {
    const { result } = makeHook();
    addExEntry(result);
    expect(result.current.pendingCount).toBe(1);
  });
});

// ============================================================
// useAttendanceException - approveException
// ============================================================

describe("useAttendanceException - approveException 예외 승인", () => {
  beforeEach(() => {
    clearStore();
  });

  it("승인 후 status가 approved가 된다", () => {
    const { result } = makeHook();
    addExEntry(result);
    const id = result.current.entries[0].id;
    act(() => {
      result.current.approveException(id, "관리자");
    });
    expect(result.current.entries[0].status).toBe("approved");
  });

  it("승인 후 approvedBy가 설정된다", () => {
    const { result } = makeHook();
    addExEntry(result);
    const id = result.current.entries[0].id;
    act(() => {
      result.current.approveException(id, "홍길동 관리자");
    });
    expect(result.current.entries[0].approvedBy).toBe("홍길동 관리자");
  });

  it("승인 후 pendingCount가 감소한다", () => {
    const { result } = makeHook();
    addExEntry(result);
    const id = result.current.entries[0].id;
    expect(result.current.pendingCount).toBe(1);
    act(() => {
      result.current.approveException(id, "관리자");
    });
    expect(result.current.pendingCount).toBe(0);
  });

  it("다른 예외는 영향받지 않는다", () => {
    const { result } = makeHook();
    addExEntry(result, { date: "2026-03-01" });
    addExEntry(result, { date: "2026-03-02" });
    const firstId = result.current.entries[0].id;
    act(() => {
      result.current.approveException(firstId, "관리자");
    });
    expect(result.current.entries[1].status).toBe("pending");
  });
});

// ============================================================
// useAttendanceException - rejectException
// ============================================================

describe("useAttendanceException - rejectException 예외 거절", () => {
  beforeEach(() => {
    clearStore();
  });

  it("거절 후 status가 rejected가 된다", () => {
    const { result } = makeHook();
    addExEntry(result);
    const id = result.current.entries[0].id;
    act(() => {
      result.current.rejectException(id);
    });
    expect(result.current.entries[0].status).toBe("rejected");
  });

  it("거절 후 pendingCount가 감소한다", () => {
    const { result } = makeHook();
    addExEntry(result);
    const id = result.current.entries[0].id;
    act(() => {
      result.current.rejectException(id);
    });
    expect(result.current.pendingCount).toBe(0);
  });

  it("존재하지 않는 id로 거절해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.rejectException("non-existent");
      });
    }).not.toThrow();
  });
});

// ============================================================
// useAttendanceException - deleteException
// ============================================================

describe("useAttendanceException - deleteException 예외 삭제", () => {
  beforeEach(() => {
    clearStore();
  });

  it("삭제 후 entries 길이가 감소한다", () => {
    const { result } = makeHook();
    addExEntry(result);
    const id = result.current.entries[0].id;
    act(() => {
      result.current.deleteException(id);
    });
    expect(result.current.entries).toHaveLength(0);
  });

  it("특정 예외만 삭제된다", () => {
    const { result } = makeHook();
    addExEntry(result, { date: "2026-03-01" });
    const firstId = result.current.entries[0].id;
    addExEntry(result, { date: "2026-03-02" });
    act(() => {
      result.current.deleteException(firstId);
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].date).toBe("2026-03-02");
  });

  it("존재하지 않는 id를 삭제해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteException("non-existent");
      });
    }).not.toThrow();
  });
});

// ============================================================
// useAttendanceException - getByMember
// ============================================================

describe("useAttendanceException - getByMember 멤버별 조회", () => {
  beforeEach(() => {
    clearStore();
  });

  it("특정 멤버의 예외만 반환한다", () => {
    const { result } = makeHook();
    addExEntry(result, { memberName: "홍길동" });
    addExEntry(result, { memberName: "김철수" });
    const hongEntries = result.current.getByMember("홍길동");
    expect(hongEntries).toHaveLength(1);
    expect(hongEntries[0].memberName).toBe("홍길동");
  });

  it("존재하지 않는 멤버는 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    addExEntry(result, { memberName: "홍길동" });
    const entries = result.current.getByMember("없는사람");
    expect(entries).toEqual([]);
  });

  it("멤버의 여러 예외를 모두 반환한다", () => {
    const { result } = makeHook();
    addExEntry(result, { memberName: "홍길동", date: "2026-03-01" });
    addExEntry(result, { memberName: "홍길동", date: "2026-03-08" });
    const entries = result.current.getByMember("홍길동");
    expect(entries).toHaveLength(2);
  });
});

// ============================================================
// useAttendanceException - getByDate
// ============================================================

describe("useAttendanceException - getByDate 날짜별 조회", () => {
  beforeEach(() => {
    clearStore();
  });

  it("특정 날짜의 예외만 반환한다", () => {
    const { result } = makeHook();
    addExEntry(result, { date: "2026-03-01" });
    addExEntry(result, { date: "2026-03-08", memberName: "김철수" });
    const entries = result.current.getByDate("2026-03-01");
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe("2026-03-01");
  });

  it("해당 날짜에 예외가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    addExEntry(result, { date: "2026-03-01" });
    const entries = result.current.getByDate("2026-04-01");
    expect(entries).toEqual([]);
  });
});

// ============================================================
// useAttendanceException - getByType
// ============================================================

describe("useAttendanceException - getByType 유형별 조회", () => {
  beforeEach(() => {
    clearStore();
  });

  it("특정 유형의 예외만 반환한다", () => {
    const { result } = makeHook();
    addExEntry(result, { type: "late" });
    addExEntry(result, { type: "sick", memberName: "김철수" });
    const entries = result.current.getByType("late");
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("late");
  });

  it("해당 유형에 예외가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    addExEntry(result, { type: "late" });
    const entries = result.current.getByType("emergency");
    expect(entries).toEqual([]);
  });
});

// ============================================================
// useAttendanceException - typeDistribution
// ============================================================

describe("useAttendanceException - typeDistribution 유형별 분포", () => {
  beforeEach(() => {
    clearStore();
  });

  it("late 예외 추가 시 typeDistribution.late가 1이 된다", () => {
    const { result } = makeHook();
    addExEntry(result, { type: "late" });
    expect(result.current.typeDistribution.late).toBe(1);
  });

  it("sick 예외 추가 시 typeDistribution.sick가 1이 된다", () => {
    const { result } = makeHook();
    addExEntry(result, { type: "sick" });
    expect(result.current.typeDistribution.sick).toBe(1);
  });

  it("여러 유형의 예외를 추가하면 각각 집계된다", () => {
    const { result } = makeHook();
    addExEntry(result, { type: "late" });
    addExEntry(result, { type: "late", memberName: "김철수" });
    addExEntry(result, { type: "sick", memberName: "박영희" });
    expect(result.current.typeDistribution.late).toBe(2);
    expect(result.current.typeDistribution.sick).toBe(1);
  });
});

// ============================================================
// useAttendanceException - memberExceptionCount
// ============================================================

describe("useAttendanceException - memberExceptionCount 멤버별 예외 횟수", () => {
  beforeEach(() => {
    clearStore();
  });

  it("예외 횟수가 많은 멤버가 앞에 위치한다", () => {
    const { result } = makeHook();
    // 홍길동: 1회
    addExEntry(result, { memberName: "홍길동" });
    // 김철수: 2회
    addExEntry(result, { memberName: "김철수", date: "2026-03-01" });
    addExEntry(result, { memberName: "김철수", date: "2026-03-08" });
    expect(result.current.memberExceptionCount[0].name).toBe("김철수");
    expect(result.current.memberExceptionCount[0].count).toBe(2);
  });

  it("최대 5명까지만 반환한다", () => {
    const { result } = makeHook();
    const members = ["A", "B", "C", "D", "E", "F"];
    members.forEach((name, i) => {
      addExEntry(result, { memberName: name, date: `2026-03-0${i + 1}` });
    });
    expect(result.current.memberExceptionCount.length).toBeLessThanOrEqual(5);
  });

  it("각 항목에 name과 count 필드가 있다", () => {
    const { result } = makeHook();
    addExEntry(result, { memberName: "홍길동" });
    expect(result.current.memberExceptionCount[0]).toHaveProperty("name");
    expect(result.current.memberExceptionCount[0]).toHaveProperty("count");
  });
});

// ============================================================
// useAttendanceException - 그룹 격리
// ============================================================

describe("useAttendanceException - 그룹별 데이터 격리", () => {
  beforeEach(() => {
    clearStore();
  });

  it("다른 groupId의 데이터는 공유되지 않는다", () => {
    const { result: r1 } = makeHook("group-A");
    const { result: r2 } = makeHook("group-B");
    addExEntry(r1, { memberName: "홍길동" });
    expect(r2.current.entries).toHaveLength(0);
  });
});
