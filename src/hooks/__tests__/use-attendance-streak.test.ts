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
    attendanceStreakGroup: (groupId: string) =>
      `attendance-streak-${groupId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useAttendanceStreak } from "@/hooks/use-attendance-streak";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useAttendanceStreak(groupId));
}

function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

// ============================================================
// useAttendanceStreak - 초기 상태
// ============================================================

describe("useAttendanceStreak - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("초기 members는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.members).toEqual([]);
  });

  it("초기 bestStreaker는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.bestStreaker).toBeNull();
  });

  it("초기 avgStreak는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.avgStreak).toBe(0);
  });

  it("초기 groupAttendanceRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.groupAttendanceRate).toBe(0);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addMember).toBe("function");
    expect(typeof result.current.deleteMember).toBe("function");
    expect(typeof result.current.recordAttendance).toBe("function");
    expect(typeof result.current.deleteRecord).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useAttendanceStreak - addMember
// ============================================================

describe("useAttendanceStreak - addMember 멤버 추가", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("멤버 추가 후 members 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    expect(result.current.members).toHaveLength(1);
  });

  it("추가된 멤버의 이름이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("김철수");
    });
    expect(result.current.members[0].memberName).toBe("김철수");
  });

  it("추가된 멤버에 id가 부여된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    expect(result.current.members[0].id).toBeDefined();
  });

  it("추가된 멤버의 초기 currentStreak는 0이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    expect(result.current.members[0].currentStreak).toBe(0);
  });

  it("추가된 멤버의 초기 longestStreak는 0이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    expect(result.current.members[0].longestStreak).toBe(0);
  });

  it("추가된 멤버의 초기 records는 빈 배열이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    expect(result.current.members[0].records).toEqual([]);
  });

  it("빈 이름으로 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.addMember("");
    });
    expect(ret).toBe(false);
    expect(result.current.members).toHaveLength(0);
  });

  it("공백만 있는 이름으로 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.addMember("   ");
    });
    expect(ret).toBe(false);
  });

  it("중복 이름으로 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    let ret: boolean = true;
    act(() => {
      ret = result.current.addMember("홍길동");
    });
    expect(ret).toBe(false);
    expect(result.current.members).toHaveLength(1);
  });

  it("유효한 멤버 추가 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = false;
    act(() => {
      ret = result.current.addMember("홍길동");
    });
    expect(ret).toBe(true);
  });

  it("이름의 앞뒤 공백을 제거하고 추가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("  홍길동  ");
    });
    expect(result.current.members[0].memberName).toBe("홍길동");
  });
});

// ============================================================
// useAttendanceStreak - deleteMember
// ============================================================

describe("useAttendanceStreak - deleteMember 멤버 삭제", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("멤버 삭제 후 members 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const id = result.current.members[0].id;
    act(() => {
      result.current.deleteMember(id);
    });
    expect(result.current.members).toHaveLength(0);
  });

  it("삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const id = result.current.members[0].id;
    let ret: boolean = false;
    act(() => {
      ret = result.current.deleteMember(id);
    });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 id로 삭제하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.deleteMember("non-existent");
    });
    expect(ret).toBe(false);
  });

  it("특정 멤버만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
      result.current.addMember("김철수");
    });
    const firstId = result.current.members[0].id;
    act(() => {
      result.current.deleteMember(firstId);
    });
    expect(result.current.members).toHaveLength(1);
    expect(result.current.members[0].memberName).toBe("김철수");
  });
});

// ============================================================
// useAttendanceStreak - recordAttendance
// ============================================================

describe("useAttendanceStreak - recordAttendance 출석 기록", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("출석 기록 추가 후 records 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
    });
    expect(result.current.members[0].records).toHaveLength(1);
  });

  it("출석 기록 추가 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    let ret: boolean = false;
    act(() => {
      ret = result.current.recordAttendance(memberId, "2026-03-01", true);
    });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 memberId로 기록하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.recordAttendance("non-existent", "2026-03-01", true);
    });
    expect(ret).toBe(false);
  });

  it("같은 날짜로 기록을 덮어쓸 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
    });
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", false);
    });
    // 덮어쓰기 → records는 여전히 1개
    expect(result.current.members[0].records).toHaveLength(1);
    expect(result.current.members[0].records[0].attended).toBe(false);
  });

  it("연속 출석으로 currentStreak가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
      result.current.recordAttendance(memberId, "2026-03-02", true);
      result.current.recordAttendance(memberId, "2026-03-03", true);
    });
    expect(result.current.members[0].currentStreak).toBe(3);
  });

  it("결석하면 currentStreak가 0이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
      result.current.recordAttendance(memberId, "2026-03-02", true);
      result.current.recordAttendance(memberId, "2026-03-03", false);
    });
    expect(result.current.members[0].currentStreak).toBe(0);
  });

  it("longestStreak가 올바르게 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      // 3연속 출석
      result.current.recordAttendance(memberId, "2026-03-01", true);
      result.current.recordAttendance(memberId, "2026-03-02", true);
      result.current.recordAttendance(memberId, "2026-03-03", true);
      // 결석
      result.current.recordAttendance(memberId, "2026-03-04", false);
      // 2연속 출석
      result.current.recordAttendance(memberId, "2026-03-05", true);
      result.current.recordAttendance(memberId, "2026-03-06", true);
    });
    expect(result.current.members[0].longestStreak).toBe(3);
  });

  it("totalAttended가 올바르게 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
      result.current.recordAttendance(memberId, "2026-03-02", false);
      result.current.recordAttendance(memberId, "2026-03-03", true);
    });
    expect(result.current.members[0].totalAttended).toBe(2);
  });

  it("totalSessions가 올바르게 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
      result.current.recordAttendance(memberId, "2026-03-02", false);
      result.current.recordAttendance(memberId, "2026-03-03", true);
    });
    expect(result.current.members[0].totalSessions).toBe(3);
  });
});

// ============================================================
// useAttendanceStreak - deleteRecord
// ============================================================

describe("useAttendanceStreak - deleteRecord 출석 기록 삭제", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("출석 기록 삭제 후 records 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
    });
    act(() => {
      result.current.deleteRecord(memberId, "2026-03-01");
    });
    expect(result.current.members[0].records).toHaveLength(0);
  });

  it("삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
    });
    let ret: boolean = false;
    act(() => {
      ret = result.current.deleteRecord(memberId, "2026-03-01");
    });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 memberId로 삭제하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.deleteRecord("non-existent", "2026-03-01");
    });
    expect(ret).toBe(false);
  });

  it("존재하지 않는 날짜로 삭제하면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
    });
    let ret: boolean = true;
    act(() => {
      ret = result.current.deleteRecord(memberId, "2026-03-99");
    });
    expect(ret).toBe(false);
  });

  it("삭제 후 스트릭이 재계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
      result.current.recordAttendance(memberId, "2026-03-02", true);
    });
    expect(result.current.members[0].currentStreak).toBe(2);
    act(() => {
      result.current.deleteRecord(memberId, "2026-03-02");
    });
    expect(result.current.members[0].currentStreak).toBe(1);
  });
});

// ============================================================
// useAttendanceStreak - 통계
// ============================================================

describe("useAttendanceStreak - 통계", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("bestStreaker는 longestStreak가 가장 높은 멤버이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
      result.current.addMember("김철수");
    });
    const member1Id = result.current.members[0].id;
    const member2Id = result.current.members[1].id;
    act(() => {
      // 홍길동: 3연속
      result.current.recordAttendance(member1Id, "2026-03-01", true);
      result.current.recordAttendance(member1Id, "2026-03-02", true);
      result.current.recordAttendance(member1Id, "2026-03-03", true);
      // 김철수: 1연속
      result.current.recordAttendance(member2Id, "2026-03-01", true);
    });
    expect(result.current.bestStreaker?.memberName).toBe("홍길동");
  });

  it("avgStreak는 현재 스트릭의 평균이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
      result.current.addMember("김철수");
    });
    const member1Id = result.current.members[0].id;
    const member2Id = result.current.members[1].id;
    act(() => {
      // 홍길동: 2연속
      result.current.recordAttendance(member1Id, "2026-03-01", true);
      result.current.recordAttendance(member1Id, "2026-03-02", true);
      // 김철수: 0 (결석)
      result.current.recordAttendance(member2Id, "2026-03-01", false);
    });
    // 평균: (2 + 0) / 2 = 1
    expect(result.current.avgStreak).toBe(1);
  });

  it("groupAttendanceRate는 전체 출석률이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      // 2회 중 1회 출석
      result.current.recordAttendance(memberId, "2026-03-01", true);
      result.current.recordAttendance(memberId, "2026-03-02", false);
    });
    expect(result.current.groupAttendanceRate).toBe(50);
  });

  it("멤버가 없으면 avgStreak는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.avgStreak).toBe(0);
  });

  it("기록이 없으면 groupAttendanceRate는 0이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    expect(result.current.groupAttendanceRate).toBe(0);
  });

  it("모두 출석이면 groupAttendanceRate는 100이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("홍길동");
    });
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.recordAttendance(memberId, "2026-03-01", true);
      result.current.recordAttendance(memberId, "2026-03-02", true);
    });
    expect(result.current.groupAttendanceRate).toBe(100);
  });
});

// ============================================================
// useAttendanceStreak - 그룹 격리
// ============================================================

describe("useAttendanceStreak - 그룹별 데이터 격리", () => {
  beforeEach(() => {
    clearStore();
    _uuidCounter = 0;
  });

  it("다른 groupId의 데이터는 공유되지 않는다", () => {
    const { result: r1 } = makeHook("group-A");
    const { result: r2 } = makeHook("group-B");
    act(() => {
      r1.current.addMember("홍길동");
    });
    expect(r2.current.members).toHaveLength(0);
  });
});
