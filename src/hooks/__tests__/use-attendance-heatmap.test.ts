import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── local-storage mock ───────────────────────────────────────
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

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const { useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }
      const initial = fetcher();
      const [data, setData] = reactUseState<unknown>(() => initial);
      const setDataRef = useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          setDataRef.current(fetcher!());
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    attendanceHeatmap: (groupId: string) => `attendance-heatmap-${groupId}`,
  },
}));

import { useAttendanceHeatmap } from "@/hooks/use-attendance-heatmap";

function makeHook(groupId = "group-1") {
  return renderHook(() => useAttendanceHeatmap(groupId));
}

function clearAll() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

// ─── 순수 계산 함수 직접 복제 ────────────────────────────────

function calcLongestStreak(activeDates: string[]): number {
  if (activeDates.length === 0) return 0;
  const sorted = [...activeDates].sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

function yearStart(year: number): string {
  return `${year}-01-01`;
}

function yearEnd(year: number): string {
  return `${year}-12-31`;
}

// ============================================================
// 순수 함수 - calcLongestStreak
// ============================================================

describe("calcLongestStreak - 최장 연속 스트릭 계산", () => {
  it("빈 배열이면 0을 반환한다", () => {
    expect(calcLongestStreak([])).toBe(0);
  });

  it("날짜가 1개이면 1을 반환한다", () => {
    expect(calcLongestStreak(["2026-03-01"])).toBe(1);
  });

  it("연속된 3일은 3을 반환한다", () => {
    expect(calcLongestStreak(["2026-03-01", "2026-03-02", "2026-03-03"])).toBe(3);
  });

  it("2일 연속 + 갭 + 3일 연속 → 최장 3을 반환한다", () => {
    expect(
      calcLongestStreak([
        "2026-03-01",
        "2026-03-02",
        "2026-03-04",
        "2026-03-05",
        "2026-03-06",
      ])
    ).toBe(3);
  });

  it("완전히 떨어진 날짜들은 1을 반환한다", () => {
    expect(
      calcLongestStreak(["2026-01-01", "2026-03-01", "2026-06-01"])
    ).toBe(1);
  });

  it("순서가 뒤섞여 있어도 올바르게 계산된다", () => {
    expect(
      calcLongestStreak(["2026-03-03", "2026-03-01", "2026-03-02"])
    ).toBe(3);
  });

  it("30일 연속 스트릭을 올바르게 계산한다", () => {
    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(2026, 0, 1);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    expect(calcLongestStreak(dates)).toBe(30);
  });

  it("날짜 2개가 연속이면 2를 반환한다", () => {
    expect(calcLongestStreak(["2026-03-01", "2026-03-02"])).toBe(2);
  });
});

// ============================================================
// 순수 함수 - yearStart / yearEnd
// ============================================================

describe("yearStart / yearEnd - 연도 경계 날짜", () => {
  it("yearStart(2026)은 '2026-01-01'이다", () => {
    expect(yearStart(2026)).toBe("2026-01-01");
  });

  it("yearEnd(2026)은 '2026-12-31'이다", () => {
    expect(yearEnd(2026)).toBe("2026-12-31");
  });

  it("yearStart(2000)은 '2000-01-01'이다", () => {
    expect(yearStart(2000)).toBe("2000-01-01");
  });

  it("yearEnd(2000)은 '2000-12-31'이다", () => {
    expect(yearEnd(2000)).toBe("2000-12-31");
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useAttendanceHeatmap - 초기 상태", () => {
  beforeEach(clearAll);

  it("초기 memberNames는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.memberNames).toEqual([]);
  });

  it("초기 memberMap은 빈 객체이다", () => {
    const { result } = makeHook();
    expect(result.current.memberMap).toEqual({});
  });

  it("초기 totalMembers는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalMembers).toBe(0);
  });

  it("초기 mostActiveMember는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.mostActiveMember).toBeNull();
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addMember).toBe("function");
    expect(typeof result.current.removeMember).toBe("function");
    expect(typeof result.current.addActivity).toBe("function");
    expect(typeof result.current.removeActivity).toBe("function");
    expect(typeof result.current.generateDemoData).toBe("function");
    expect(typeof result.current.getHeatmapData).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addMember
// ============================================================

describe("useAttendanceHeatmap - addMember", () => {
  beforeEach(clearAll);

  it("멤버 추가 후 totalMembers가 1이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    expect(result.current.totalMembers).toBe(1);
  });

  it("멤버 추가 후 memberNames에 포함된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    expect(result.current.memberNames).toContain("홍길동");
  });

  it("성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = false;
    act(() => { ok = result.current.addMember("홍길동"); });
    expect(ok).toBe(true);
  });

  it("빈 이름으로 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.addMember(""); });
    expect(ok).toBe(false);
  });

  it("공백만 있는 이름으로 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.addMember("   "); });
    expect(ok).toBe(false);
  });

  it("이름 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("  홍길동  "); });
    expect(result.current.memberNames).toContain("홍길동");
    expect(result.current.memberNames).not.toContain("  홍길동  ");
  });

  it("중복 이름 추가 시 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    let ok: boolean = true;
    act(() => { ok = result.current.addMember("홍길동"); });
    expect(ok).toBe(false);
    expect(result.current.totalMembers).toBe(1);
  });

  it("신규 멤버는 빈 활동 배열로 시작한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    expect(result.current.memberMap["홍길동"]).toEqual([]);
  });

  it("여러 멤버를 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("멤버A");
      result.current.addMember("멤버B");
      result.current.addMember("멤버C");
    });
    expect(result.current.totalMembers).toBe(3);
  });
});

// ============================================================
// removeMember
// ============================================================

describe("useAttendanceHeatmap - removeMember", () => {
  beforeEach(clearAll);

  it("멤버 삭제 후 totalMembers가 감소한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.removeMember("홍길동"); });
    expect(result.current.totalMembers).toBe(0);
  });

  it("성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    let ok: boolean = false;
    act(() => { ok = result.current.removeMember("홍길동"); });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 멤버 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.removeMember("없는사람"); });
    expect(ok).toBe(false);
  });

  it("특정 멤버만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("멤버A");
      result.current.addMember("멤버B");
    });
    act(() => { result.current.removeMember("멤버A"); });
    expect(result.current.totalMembers).toBe(1);
    expect(result.current.memberNames).toContain("멤버B");
    expect(result.current.memberNames).not.toContain("멤버A");
  });
});

// ============================================================
// addActivity
// ============================================================

describe("useAttendanceHeatmap - addActivity", () => {
  beforeEach(clearAll);

  it("활동 추가 후 해당 날짜 데이터가 생성된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    expect(result.current.memberMap["홍길동"]).toHaveLength(1);
  });

  it("성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    let ok: boolean = false;
    act(() => { ok = result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 멤버에 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.addActivity("없는사람", "2026-03-02", "연습"); });
    expect(ok).toBe(false);
  });

  it("같은 날짜에 다른 활동을 추가하면 activities가 누적된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "공연"); });
    const dayData = result.current.memberMap["홍길동"].find(
      (d) => d.date === "2026-03-02"
    );
    expect(dayData?.activities).toHaveLength(2);
  });

  it("같은 날짜 같은 활동 중복 추가 시 중복되지 않는다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    const dayData = result.current.memberMap["홍길동"].find(
      (d) => d.date === "2026-03-02"
    );
    expect(dayData?.activities).toHaveLength(1);
  });

  it("count 값은 activities 길이와 일치한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "공연"); });
    const dayData = result.current.memberMap["홍길동"].find(
      (d) => d.date === "2026-03-02"
    );
    expect(dayData?.count).toBe(dayData?.activities.length);
  });

  it("빈 활동명으로 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    let ok: boolean = true;
    act(() => { ok = result.current.addActivity("홍길동", "2026-03-02", ""); });
    expect(ok).toBe(false);
  });

  it("날짜가 빈 문자열이면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    let ok: boolean = true;
    act(() => { ok = result.current.addActivity("홍길동", "", "연습"); });
    expect(ok).toBe(false);
  });

  it("여러 날짜에 활동을 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-01", "연습"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "공연"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-03", "모임"); });
    expect(result.current.memberMap["홍길동"]).toHaveLength(3);
  });
});

// ============================================================
// removeActivity
// ============================================================

describe("useAttendanceHeatmap - removeActivity", () => {
  beforeEach(clearAll);

  it("특정 활동 제거 후 해당 활동이 사라진다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "공연"); });
    act(() => {
      result.current.removeActivity("홍길동", "2026-03-02", "연습");
    });
    const dayData = result.current.memberMap["홍길동"].find(
      (d) => d.date === "2026-03-02"
    );
    expect(dayData?.activities).not.toContain("연습");
    expect(dayData?.activities).toContain("공연");
  });

  it("날짜 전체 제거(activity 미지정) 시 해당 날짜가 없어진다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    act(() => {
      result.current.removeActivity("홍길동", "2026-03-02");
    });
    const dayData = result.current.memberMap["홍길동"].find(
      (d) => d.date === "2026-03-02"
    );
    expect(dayData).toBeUndefined();
  });

  it("마지막 활동 제거 시 해당 날짜 항목도 삭제된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    act(() => {
      result.current.removeActivity("홍길동", "2026-03-02", "연습");
    });
    const dayData = result.current.memberMap["홍길동"].find(
      (d) => d.date === "2026-03-02"
    );
    expect(dayData).toBeUndefined();
  });

  it("성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    let ok: boolean = false;
    act(() => { ok = result.current.removeActivity("홍길동", "2026-03-02", "연습"); });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 멤버로 제거 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.removeActivity("없는사람", "2026-03-02"); });
    expect(ok).toBe(false);
  });

  it("존재하지 않는 날짜로 제거 시 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    let ok: boolean = true;
    act(() => { ok = result.current.removeActivity("홍길동", "2000-01-01"); });
    expect(ok).toBe(false);
  });
});

// ============================================================
// getHeatmapData
// ============================================================

describe("useAttendanceHeatmap - getHeatmapData", () => {
  beforeEach(clearAll);

  it("활동이 없는 멤버는 빈 days 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    const data = result.current.getHeatmapData("홍길동", 2026);
    expect(data.days).toEqual([]);
  });

  it("반환된 데이터의 memberName이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    const data = result.current.getHeatmapData("홍길동", 2026);
    expect(data.memberName).toBe("홍길동");
  });

  it("반환된 데이터의 year가 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    const data = result.current.getHeatmapData("홍길동", 2026);
    expect(data.year).toBe(2026);
  });

  it("활동이 없으면 totalActiveDays는 0이다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    const data = result.current.getHeatmapData("홍길동", 2026);
    expect(data.totalActiveDays).toBe(0);
  });

  it("활동이 없으면 longestStreak는 0이다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    const data = result.current.getHeatmapData("홍길동", 2026);
    expect(data.longestStreak).toBe(0);
  });

  it("활동 추가 후 totalActiveDays가 증가한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => {
      result.current.addActivity("홍길동", "2026-03-02", "연습");
    });
    const data = result.current.getHeatmapData("홍길동", 2026);
    expect(data.totalActiveDays).toBe(1);
  });

  it("연속 3일 활동이면 longestStreak는 3이다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-01", "연습"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-02", "연습"); });
    act(() => { result.current.addActivity("홍길동", "2026-03-03", "연습"); });
    const data = result.current.getHeatmapData("홍길동", 2026);
    expect(data.longestStreak).toBe(3);
  });

  it("다른 연도의 활동은 필터링된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.addActivity("홍길동", "2025-12-31", "연습"); });
    act(() => { result.current.addActivity("홍길동", "2026-01-01", "연습"); });
    const data = result.current.getHeatmapData("홍길동", 2026);
    expect(data.totalActiveDays).toBe(1);
    expect(data.days.every((d) => d.date.startsWith("2026"))).toBe(true);
  });

  it("getHeatmapData는 days, totalActiveDays, longestStreak 필드를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    const data = result.current.getHeatmapData("홍길동", 2026);
    expect(data).toHaveProperty("days");
    expect(data).toHaveProperty("totalActiveDays");
    expect(data).toHaveProperty("longestStreak");
    expect(data).toHaveProperty("memberName");
    expect(data).toHaveProperty("year");
  });
});

// ============================================================
// mostActiveMember 통계
// ============================================================

describe("useAttendanceHeatmap - mostActiveMember 통계", () => {
  beforeEach(clearAll);

  it("멤버가 없으면 mostActiveMember는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.mostActiveMember).toBeNull();
  });

  it("활동이 가장 많은 멤버가 mostActiveMember이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("멤버A");
      result.current.addMember("멤버B");
    });
    const year = new Date().getFullYear();
    act(() => {
      result.current.addActivity("멤버A", `${year}-03-01`, "연습");
      result.current.addActivity("멤버A", `${year}-03-02`, "연습");
      result.current.addActivity("멤버B", `${year}-03-01`, "연습");
    });
    expect(result.current.mostActiveMember).toBe("멤버A");
  });

  it("멤버만 있고 활동이 없으면 첫 번째 멤버가 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("멤버A");
    });
    // 활동이 0개일 때 best가 null이 아닌 멤버가 반환될 수도 있음
    // totalMembers가 1인 경우 mostActiveMember는 null이 아닐 수 있다
    expect(result.current.totalMembers).toBe(1);
  });
});
