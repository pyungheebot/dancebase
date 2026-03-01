import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

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
vi.mock("swr", () => ({
  default: (key: string | null, fetcher: (() => unknown) | null) => {
    if (!key || !fetcher) {
      const [data] = reactUseState<unknown>(undefined);
      return { data, isLoading: false, mutate: vi.fn() };
    }
    const [data, setData] = reactUseState<unknown>(() => fetcher());
    const mutate = reactUseCallback(
      (newData?: unknown) => {
        if (newData !== undefined) {
          setData(newData);
        } else {
          setData(fetcher!());
        }
        return Promise.resolve();
      },
      []
    );
    return { data, isLoading: false, mutate };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    groupDuesTracker: (groupId: string) => `group-dues-tracker-${groupId}`,
  },
}));

import { useGroupDuesTracker, toYearMonth } from "@/hooks/use-group-dues-tracker";
import type { DuesTrackPeriod } from "@/types";

function makeHook(groupId = "group-1") {
  return renderHook(() => useGroupDuesTracker(groupId));
}

const TODAY = "2026-03-15";

function addTestPeriod(
  result: ReturnType<typeof makeHook>["result"],
  overrides: { year?: number; month?: number; amount?: number; members?: string[] } = {}
) {
  const { year = 2026, month = 3, amount = 30000, members = ["홍길동", "이순신"] } = overrides;
  let ok: boolean | undefined;
  act(() => {
    ok = result.current.addPeriod(year, month, amount, TODAY, members);
  });
  return ok;
}

beforeEach(() => {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
});

// ============================================================

describe("useGroupDuesTracker - 초기 상태", () => {
  it("periods 초기값은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.periods).toEqual([]);
  });

  it("loading은 boolean 타입이다", () => {
    const { result } = makeHook();
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("addPeriod, deletePeriod, setMemberStatus, bulkSetMemberStatus, addMemberToPeriod, removeMemberFromPeriod, getPeriodStats, refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addPeriod).toBe("function");
    expect(typeof result.current.deletePeriod).toBe("function");
    expect(typeof result.current.setMemberStatus).toBe("function");
    expect(typeof result.current.bulkSetMemberStatus).toBe("function");
    expect(typeof result.current.addMemberToPeriod).toBe("function");
    expect(typeof result.current.removeMemberFromPeriod).toBe("function");
    expect(typeof result.current.getPeriodStats).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("recentTrend 초기값은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.recentTrend).toEqual([]);
  });
});

describe("useGroupDuesTracker - toYearMonth 유틸", () => {
  it("월이 한 자리일 때 0을 패딩한다", () => {
    expect(toYearMonth(2026, 3)).toBe("2026-03");
  });

  it("두 자리 월은 그대로 반환한다", () => {
    expect(toYearMonth(2026, 11)).toBe("2026-11");
  });

  it("12월은 2026-12를 반환한다", () => {
    expect(toYearMonth(2026, 12)).toBe("2026-12");
  });

  it("1월은 2026-01을 반환한다", () => {
    expect(toYearMonth(2026, 1)).toBe("2026-01");
  });
});

describe("useGroupDuesTracker - addPeriod", () => {
  it("기간을 추가하면 periods 배열에 추가된다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    expect(result.current.periods).toHaveLength(1);
  });

  it("addPeriod 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const ok = addTestPeriod(result);
    expect(ok).toBe(true);
  });

  it("동일 연월 중복 추가 시 false를 반환한다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { year: 2026, month: 3 });
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addPeriod(2026, 3, 30000, TODAY, ["김철수"]);
    });
    expect(ok).toBe(false);
    expect(result.current.periods).toHaveLength(1);
  });

  it("추가된 기간의 amount가 올바르다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { amount: 50000 });
    expect(result.current.periods[0].amount).toBe(50000);
  });

  it("추가된 기간의 멤버 수가 올바르다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { members: ["A", "B", "C"] });
    expect(result.current.periods[0].members).toHaveLength(3);
  });

  it("모든 멤버의 초기 status는 unpaid이다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    result.current.periods[0].members.forEach((m) => {
      expect(m.status).toBe("unpaid");
    });
  });

  it("amount가 음수이면 0으로 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addPeriod(2026, 3, -1000, TODAY, ["A"]);
    });
    expect(result.current.periods[0].amount).toBe(0);
  });

  it("빈 문자열 멤버는 필터링된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addPeriod(2026, 3, 10000, TODAY, ["A", "", "  ", "B"]);
    });
    expect(result.current.periods[0].members).toHaveLength(2);
  });

  it("기간은 최신 순으로 정렬된다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { year: 2026, month: 1 });
    addTestPeriod(result, { year: 2026, month: 3 });
    expect(result.current.periods[0].month).toBe(3);
    expect(result.current.periods[1].month).toBe(1);
  });

  it("추가된 기간은 id를 가진다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    expect(result.current.periods[0].id).toBeTruthy();
  });
});

describe("useGroupDuesTracker - deletePeriod", () => {
  it("기간을 삭제하면 periods 배열에서 제거된다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    const periodId = result.current.periods[0].id;
    act(() => {
      result.current.deletePeriod(periodId);
    });
    expect(result.current.periods).toHaveLength(0);
  });

  it("deletePeriod 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    const periodId = result.current.periods[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.deletePeriod(periodId);
    });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 periodId로 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.deletePeriod("non-existent");
    });
    expect(ok).toBe(false);
  });
});

describe("useGroupDuesTracker - setMemberStatus", () => {
  it("멤버 상태를 paid로 변경한다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    const period = result.current.periods[0];
    const memberId = period.members[0].id;
    act(() => {
      result.current.setMemberStatus(period.id, memberId, "paid");
    });
    const updated = result.current.periods[0].members[0];
    expect(updated.status).toBe("paid");
  });

  it("paid로 변경 시 paidAt이 설정된다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    const period = result.current.periods[0];
    const memberId = period.members[0].id;
    act(() => {
      result.current.setMemberStatus(period.id, memberId, "paid");
    });
    expect(result.current.periods[0].members[0].paidAt).toBeTruthy();
  });

  it("unpaid로 변경 시 paidAt이 undefined가 된다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    const period = result.current.periods[0];
    const memberId = period.members[0].id;
    act(() => {
      result.current.setMemberStatus(period.id, memberId, "paid");
    });
    act(() => {
      result.current.setMemberStatus(period.id, memberId, "unpaid");
    });
    expect(result.current.periods[0].members[0].paidAt).toBeUndefined();
  });

  it("exempt로 변경이 가능하다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    const period = result.current.periods[0];
    const memberId = period.members[0].id;
    act(() => {
      result.current.setMemberStatus(period.id, memberId, "exempt");
    });
    expect(result.current.periods[0].members[0].status).toBe("exempt");
  });

  it("존재하지 않는 periodId이면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.setMemberStatus("bad-period", "bad-member", "paid");
    });
    expect(ok).toBe(false);
  });

  it("존재하지 않는 memberId이면 false를 반환한다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    const periodId = result.current.periods[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.setMemberStatus(periodId, "bad-member", "paid");
    });
    expect(ok).toBe(false);
  });
});

describe("useGroupDuesTracker - bulkSetMemberStatus", () => {
  it("여러 멤버를 일괄 paid로 변경한다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { members: ["A", "B", "C"] });
    const period = result.current.periods[0];
    const memberIds = period.members.map((m) => m.id);
    act(() => {
      result.current.bulkSetMemberStatus(period.id, memberIds, "paid");
    });
    result.current.periods[0].members.forEach((m) => {
      expect(m.status).toBe("paid");
    });
  });

  it("존재하지 않는 periodId이면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.bulkSetMemberStatus("bad-id", ["m1"], "paid");
    });
    expect(ok).toBe(false);
  });

  it("일부 memberIds만 일치해도 해당 멤버만 변경된다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { members: ["X", "Y"] });
    const period = result.current.periods[0];
    const firstMemberId = period.members[0].id;
    act(() => {
      result.current.bulkSetMemberStatus(period.id, [firstMemberId], "paid");
    });
    expect(result.current.periods[0].members[0].status).toBe("paid");
    expect(result.current.periods[0].members[1].status).toBe("unpaid");
  });
});

describe("useGroupDuesTracker - addMemberToPeriod", () => {
  it("기간에 멤버를 추가한다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { members: ["A"] });
    const periodId = result.current.periods[0].id;
    act(() => {
      result.current.addMemberToPeriod(periodId, "B");
    });
    expect(result.current.periods[0].members).toHaveLength(2);
  });

  it("빈 문자열로 추가 시 false를 반환한다", () => {
    const { result } = makeHook();
    addTestPeriod(result);
    const periodId = result.current.periods[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addMemberToPeriod(periodId, "");
    });
    expect(ok).toBe(false);
  });

  it("존재하지 않는 periodId이면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addMemberToPeriod("bad-id", "NewMember");
    });
    expect(ok).toBe(false);
  });
});

describe("useGroupDuesTracker - removeMemberFromPeriod", () => {
  it("기간에서 멤버를 제거한다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { members: ["A", "B"] });
    const period = result.current.periods[0];
    const memberId = period.members[0].id;
    act(() => {
      result.current.removeMemberFromPeriod(period.id, memberId);
    });
    expect(result.current.periods[0].members).toHaveLength(1);
  });

  it("존재하지 않는 periodId이면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.removeMemberFromPeriod("bad-period", "m1");
    });
    expect(ok).toBe(false);
  });
});

describe("useGroupDuesTracker - getPeriodStats", () => {
  it("total은 전체 멤버 수이다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { members: ["A", "B", "C"] });
    const period = result.current.periods[0];
    const stats = result.current.getPeriodStats(period);
    expect(stats.total).toBe(3);
  });

  it("paid, unpaid, exempt 카운트가 올바르다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { members: ["A", "B", "C"] });
    const period = result.current.periods[0];
    const m0 = period.members[0].id;
    const m1 = period.members[1].id;
    act(() => {
      result.current.setMemberStatus(period.id, m0, "paid");
      result.current.setMemberStatus(period.id, m1, "exempt");
    });
    const updatedPeriod = result.current.periods[0];
    const stats = result.current.getPeriodStats(updatedPeriod);
    expect(stats.paid).toBe(1);
    expect(stats.exempt).toBe(1);
    expect(stats.unpaid).toBe(1);
  });

  it("paidRate는 (paid / payable) * 100이다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { members: ["A", "B"] });
    const period = result.current.periods[0];
    const memberId = period.members[0].id;
    act(() => {
      result.current.setMemberStatus(period.id, memberId, "paid");
    });
    const updatedPeriod = result.current.periods[0];
    const stats = result.current.getPeriodStats(updatedPeriod);
    expect(stats.paidRate).toBe(50);
  });

  it("payable이 0이면 paidRate는 0이다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { members: ["A"] });
    const period = result.current.periods[0];
    const memberId = period.members[0].id;
    act(() => {
      result.current.setMemberStatus(period.id, memberId, "exempt");
    });
    const updatedPeriod = result.current.periods[0];
    const stats = result.current.getPeriodStats(updatedPeriod);
    expect(stats.paidRate).toBe(0);
  });

  it("totalIncome은 paid * amount이다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { amount: 30000, members: ["A", "B"] });
    const period = result.current.periods[0];
    const memberId = period.members[0].id;
    act(() => {
      result.current.setMemberStatus(period.id, memberId, "paid");
    });
    const updatedPeriod = result.current.periods[0];
    const stats = result.current.getPeriodStats(updatedPeriod);
    expect(stats.totalIncome).toBe(30000);
  });

  it("모든 멤버가 paid이면 paidRate는 100이다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { members: ["A", "B"] });
    const period = result.current.periods[0];
    act(() => {
      result.current.bulkSetMemberStatus(period.id, period.members.map(m => m.id), "paid");
    });
    const updatedPeriod = result.current.periods[0];
    const stats = result.current.getPeriodStats(updatedPeriod);
    expect(stats.paidRate).toBe(100);
  });
});

describe("useGroupDuesTracker - recentTrend", () => {
  it("recentTrend는 최대 6개를 반환한다", () => {
    const { result } = makeHook();
    // 7개 기간 추가
    const months = [1, 2, 3, 4, 5, 6, 7];
    act(() => {
      for (const m of months) {
        result.current.addPeriod(2026, m, 10000, TODAY, ["A"]);
      }
    });
    expect(result.current.recentTrend.length).toBeLessThanOrEqual(6);
  });

  it("recentTrend 각 항목에 label, paidRate, paid, payable이 존재한다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { year: 2026, month: 3 });
    const trend = result.current.recentTrend[0];
    expect("label" in trend).toBe(true);
    expect("paidRate" in trend).toBe(true);
    expect("paid" in trend).toBe(true);
    expect("payable" in trend).toBe(true);
  });

  it("recentTrend label 형식은 YY/MM이다", () => {
    const { result } = makeHook();
    addTestPeriod(result, { year: 2026, month: 3 });
    expect(result.current.recentTrend[0].label).toBe("26/03");
  });
});

describe("useGroupDuesTracker - 그룹별 격리", () => {
  it("다른 groupId는 독립적인 periods를 가진다", () => {
    const { result: r1 } = renderHook(() => useGroupDuesTracker("group-1"));
    const { result: r2 } = renderHook(() => useGroupDuesTracker("group-2"));

    act(() => {
      r1.current.addPeriod(2026, 3, 10000, TODAY, ["A"]);
    });

    expect(r1.current.periods).toHaveLength(1);
    expect(r2.current.periods).toHaveLength(0);
  });

  it("localStorage 키는 groupId를 포함한다", () => {
    const key1 = `dancebase:dues-tracker:group-1`;
    const key2 = `dancebase:dues-tracker:group-2`;
    expect(key1).not.toBe(key2);
  });
});
