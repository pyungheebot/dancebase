import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMemberActivityTrend } from "@/hooks/use-member-activity-trend";

// ─── Supabase mock ────────────────────────────────────────────
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockIn = vi.fn();
const mockFrom = vi.fn();

const supabaseMock = {
  from: mockFrom,
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => supabaseMock,
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    memberActivityTrend: (groupId: string, userId: string, weeks: number) =>
      `member-activity-trend:${groupId}:${userId}:${weeks}`,
  },
}));

// ─── SWR mock (전역 store 방식) ────────────────────────────────
import { useState as reactUseState2, useCallback as reactUseCallback2 } from "react";

const _swrDataStore = new Map<string, unknown>();

vi.mock("swr", () => ({
  default: (key: string | null, _fetcher: unknown, _options?: unknown) => {
    if (!key) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }

    const initialData = _swrDataStore.has(key) ? _swrDataStore.get(key) : undefined;
    const [data, setData] = reactUseState2<unknown>(initialData);
    const isLoading = data === undefined;

    const mutate = reactUseCallback2(() => {
      const current = _swrDataStore.get(key);
      setData(current);
      return Promise.resolve();
    }, [key]);

    return { data, isLoading, mutate };
  },
}));

function resetSWRStore() {
  _swrDataStore.clear();
}

function setSWRData(key: string, value: unknown) {
  _swrDataStore.set(key, value);
}

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "grp-1", userId = "user-1", weeks = 8) {
  return renderHook(() => useMemberActivityTrend(groupId, userId, weeks));
}

// ============================================================
// useMemberActivityTrend - 초기 상태 (SWR 로딩 중)
// ============================================================

describe("useMemberActivityTrend - 초기 상태", () => {
  beforeEach(() => {
    resetSWRStore();
    vi.clearAllMocks();
  });

  it("초기 trend는 빈 배열이다 (data undefined 시)", () => {
    const { result } = makeHook();
    expect(result.current.trend).toEqual([]);
  });

  it("loading 상태가 boolean이다", () => {
    const { result } = makeHook();
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("groupId 또는 userId가 없으면 trend가 빈 배열이다", () => {
    const { result } = renderHook(() => useMemberActivityTrend("", "", 8));
    expect(result.current.trend).toEqual([]);
  });

  it("groupId가 빈 문자열이면 로딩 상태가 아니다", () => {
    const { result } = renderHook(() => useMemberActivityTrend("", "user-1", 8));
    // key가 null이므로 SWR 호출되지 않음 → loading false
    expect(result.current.loading).toBe(false);
  });

  it("userId가 빈 문자열이면 로딩 상태가 아니다", () => {
    const { result } = renderHook(() => useMemberActivityTrend("grp-1", "", 8));
    expect(result.current.loading).toBe(false);
  });
});

// ============================================================
// useMemberActivityTrend - SWR 데이터 존재 시
// ============================================================

describe("useMemberActivityTrend - 데이터 로드 후 상태", () => {
  beforeEach(() => {
    resetSWRStore();
    vi.clearAllMocks();
  });

  it("SWR 스토어에 데이터가 있으면 trend에 반영된다", () => {
    const mockTrend = [
      { week: "2026-W09", label: "이번주", posts: 3, comments: 5, attendances: 2 },
      { week: "2026-W08", label: "1주전", posts: 1, comments: 0, attendances: 1 },
    ];
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook("grp-1", "user-1", 8);
    expect(result.current.trend).toEqual(mockTrend);
  });

  it("trend의 각 항목은 week, label, posts, comments, attendances 필드를 가진다", () => {
    const mockTrend = [
      { week: "2026-W09", label: "이번주", posts: 2, comments: 1, attendances: 3 },
    ];
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook();
    expect(result.current.trend[0]).toHaveProperty("week");
    expect(result.current.trend[0]).toHaveProperty("label");
    expect(result.current.trend[0]).toHaveProperty("posts");
    expect(result.current.trend[0]).toHaveProperty("comments");
    expect(result.current.trend[0]).toHaveProperty("attendances");
  });

  it("데이터가 있을 때 loading은 false이다", () => {
    const mockTrend = [
      { week: "2026-W09", label: "이번주", posts: 0, comments: 0, attendances: 0 },
    ];
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("weeks 파라미터에 따라 SWR 키가 달라진다", () => {
    const mockTrend4 = [
      { week: "2026-W09", label: "이번주", posts: 1, comments: 0, attendances: 1 },
    ];
    const mockTrend8 = [
      { week: "2026-W09", label: "이번주", posts: 5, comments: 3, attendances: 4 },
      { week: "2026-W08", label: "1주전", posts: 2, comments: 1, attendances: 2 },
    ];
    setSWRData("member-activity-trend:grp-1:user-1:4", mockTrend4);
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend8);

    const { result: result4 } = renderHook(() => useMemberActivityTrend("grp-1", "user-1", 4));
    const { result: result8 } = renderHook(() => useMemberActivityTrend("grp-1", "user-1", 8));

    expect(result4.current.trend).toHaveLength(1);
    expect(result8.current.trend).toHaveLength(2);
  });

  it("trend 배열의 길이가 weeks 수 이하이다", () => {
    const mockTrend = Array.from({ length: 8 }, (_, i) => ({
      week: `2026-W0${i + 1}`,
      label: i === 7 ? "이번주" : `${7 - i}주전`,
      posts: i,
      comments: i * 2,
      attendances: i % 3,
    }));
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook("grp-1", "user-1", 8);
    expect(result.current.trend.length).toBeLessThanOrEqual(8);
  });
});

// ============================================================
// useMemberActivityTrend - MemberActivityTrendPoint 타입 검증
// ============================================================

describe("useMemberActivityTrend - MemberActivityTrendPoint 데이터 구조", () => {
  beforeEach(() => {
    resetSWRStore();
    vi.clearAllMocks();
  });

  it("posts는 숫자이다", () => {
    const mockTrend = [{ week: "2026-W09", label: "이번주", posts: 3, comments: 2, attendances: 1 }];
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook();
    expect(typeof result.current.trend[0].posts).toBe("number");
  });

  it("comments는 숫자이다", () => {
    const mockTrend = [{ week: "2026-W09", label: "이번주", posts: 3, comments: 2, attendances: 1 }];
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook();
    expect(typeof result.current.trend[0].comments).toBe("number");
  });

  it("attendances는 숫자이다", () => {
    const mockTrend = [{ week: "2026-W09", label: "이번주", posts: 3, comments: 2, attendances: 1 }];
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook();
    expect(typeof result.current.trend[0].attendances).toBe("number");
  });

  it("week는 문자열이다", () => {
    const mockTrend = [{ week: "2026-W09", label: "이번주", posts: 0, comments: 0, attendances: 0 }];
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook();
    expect(typeof result.current.trend[0].week).toBe("string");
  });

  it("label은 문자열이다", () => {
    const mockTrend = [{ week: "2026-W09", label: "이번주", posts: 0, comments: 0, attendances: 0 }];
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook();
    expect(typeof result.current.trend[0].label).toBe("string");
  });

  it("마지막 항목의 label은 '이번주'이다 (규칙)", () => {
    const mockTrend = [
      { week: "2026-W07", label: "2주전", posts: 0, comments: 0, attendances: 0 },
      { week: "2026-W08", label: "1주전", posts: 0, comments: 0, attendances: 0 },
      { week: "2026-W09", label: "이번주", posts: 0, comments: 0, attendances: 0 },
    ];
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook();
    const lastItem = result.current.trend[result.current.trend.length - 1];
    expect(lastItem.label).toBe("이번주");
  });

  it("빈 데이터에서 posts/comments/attendances가 0이다", () => {
    const mockTrend = [{ week: "2026-W09", label: "이번주", posts: 0, comments: 0, attendances: 0 }];
    setSWRData("member-activity-trend:grp-1:user-1:8", mockTrend);

    const { result } = makeHook();
    expect(result.current.trend[0].posts).toBe(0);
    expect(result.current.trend[0].comments).toBe(0);
    expect(result.current.trend[0].attendances).toBe(0);
  });
});
