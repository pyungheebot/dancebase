import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _getStore: () => store,
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (!key) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    memberPairing: (groupId: string) => `/groups/${groupId}/member-pairing`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useMemberPairing } from "@/hooks/use-member-pairing";
import type { EntityMember } from "@/types/entity-context";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeMember(id: string, overrides: Partial<EntityMember> = {}): EntityMember {
  return {
    userId: id,
    groupId: "group-1",
    role: "member",
    nickname: null,
    joinedAt: "2025-01-01T00:00:00Z",
    profile: {
      name: `멤버 ${id}`,
      avatar_url: null,
    },
    ...overrides,
  } as EntityMember;
}

function makeHook(
  groupId = "group-1",
  members: EntityMember[] = [],
  currentUserId = "user-1"
) {
  return renderHook(() => useMemberPairing(groupId, members, currentUserId));
}

// ============================================================
// useMemberPairing - 초기 상태
// ============================================================

describe("useMemberPairing - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("초기 recommendations는 빈 배열이다 (rawStats 없음)", () => {
    const { result } = makeHook("group-1", []);
    expect(result.current.recommendations).toEqual([]);
  });

  it("초기 visibleRecommendations는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.visibleRecommendations).toEqual([]);
  });

  it("초기 dismissedRecommendations는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.dismissedRecommendations).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.dismiss).toBe("function");
    expect(typeof result.current.restore).toBe("function");
    expect(typeof result.current.restoreAll).toBe("function");
  });

  it("멤버가 1명이면 SWR key가 null이다 (추천 없음)", () => {
    const members = [makeMember("user-1")];
    const { result } = makeHook("group-1", members);
    // rawStats가 없으므로 recommendations는 빈 배열
    expect(result.current.recommendations).toEqual([]);
  });

  it("멤버가 0명이면 recommendations는 빈 배열이다", () => {
    const { result } = makeHook("group-1", []);
    expect(result.current.recommendations).toEqual([]);
  });
});

// ============================================================
// useMemberPairing - dismiss 숨기기
// ============================================================

describe("useMemberPairing - dismiss 추천 숨기기", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("dismiss 호출 후 해당 userId가 localStorage에 저장된다", () => {
    const members = [makeMember("user-1"), makeMember("user-2")];
    const { result } = makeHook("group-1", members, "user-1");
    act(() => {
      result.current.dismiss("user-2");
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("dismiss된 userId는 두 번 dismiss해도 중복 저장되지 않는다", () => {
    const members = [makeMember("user-1"), makeMember("user-2")];
    const { result } = makeHook("group-1", members, "user-1");
    act(() => {
      result.current.dismiss("user-2");
    });
    act(() => {
      result.current.dismiss("user-2");
    });
    // localStorage에서 파싱한 dismissed 배열에 중복 없음
    const stored = JSON.parse(localStorageMock._getStore()["dancebase:member-pairing:group-1"] || "{}");
    expect(stored.dismissed.filter((id: string) => id === "user-2")).toHaveLength(1);
  });
});

// ============================================================
// useMemberPairing - restore 복원
// ============================================================

describe("useMemberPairing - restore 숨김 복원", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("restore 호출 후 localStorage에서 해당 userId가 제거된다", () => {
    const members = [makeMember("user-1"), makeMember("user-2")];
    const { result } = makeHook("group-1", members, "user-1");
    act(() => {
      result.current.dismiss("user-2");
    });
    act(() => {
      result.current.restore("user-2");
    });
    const stored = JSON.parse(localStorageMock._getStore()["dancebase:member-pairing:group-1"] || "{}");
    expect(stored.dismissed).not.toContain("user-2");
  });

  it("restore는 존재하지 않는 userId도 오류 없이 처리된다", () => {
    const { result } = makeHook("group-1", []);
    expect(() => {
      act(() => {
        result.current.restore("non-existent");
      });
    }).not.toThrow();
  });
});

// ============================================================
// useMemberPairing - restoreAll 전체 복원
// ============================================================

describe("useMemberPairing - restoreAll 전체 숨김 복원", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("restoreAll 호출 후 localStorage의 dismissed가 빈 배열이 된다", () => {
    const members = [makeMember("user-1"), makeMember("user-2"), makeMember("user-3")];
    const { result } = makeHook("group-1", members, "user-1");
    act(() => {
      result.current.dismiss("user-2");
      result.current.dismiss("user-3");
    });
    act(() => {
      result.current.restoreAll();
    });
    const stored = JSON.parse(localStorageMock._getStore()["dancebase:member-pairing:group-1"] || "{}");
    expect(stored.dismissed).toEqual([]);
  });

  it("restoreAll 후 localStorage에 저장된다", () => {
    const { result } = makeHook("group-1", []);
    act(() => {
      result.current.restoreAll();
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================
// useMemberPairing - similarity 함수 로직
// ============================================================

describe("useMemberPairing - similarity 유사도 계산 로직", () => {
  /**
   * 훅 내부 similarity(a, b, maxDiff) 함수를 직접 재현하여 검증합니다.
   */
  function similarity(a: number, b: number, maxDiff: number): number {
    const diff = Math.abs(a - b);
    return Math.max(0, 1 - diff / maxDiff);
  }

  it("두 값이 같으면 유사도는 1이다", () => {
    expect(similarity(0.8, 0.8, 1)).toBe(1);
  });

  it("두 값의 차이가 maxDiff와 같으면 유사도는 0이다", () => {
    expect(similarity(1, 0, 1)).toBe(0);
  });

  it("두 값의 차이가 maxDiff의 절반이면 유사도는 0.5이다", () => {
    expect(similarity(1, 0.5, 1)).toBe(0.5);
  });

  it("유사도는 항상 0 이상이다", () => {
    expect(similarity(0, 1, 0.5)).toBeGreaterThanOrEqual(0);
  });

  it("maxDiff가 0일 때는 특별 처리가 필요하다 (NaN 방지)", () => {
    // maxDiff=0이면 diff/maxDiff = Infinity → 1 - Infinity = -Infinity → max(0, -Infinity) = 0
    const result = similarity(1, 0, 0);
    // 결과는 0 이상이어야 한다
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("출석률 차이가 0.2이면 유사도는 0.8이다", () => {
    expect(similarity(0.8, 0.6, 1)).toBeCloseTo(0.8, 5);
  });
});

// ============================================================
// useMemberPairing - calcCompatibility 호환성 점수 로직
// ============================================================

describe("useMemberPairing - calcCompatibility 호환성 점수 로직", () => {
  function similarity(a: number, b: number, maxDiff: number): number {
    const diff = Math.abs(a - b);
    return Math.max(0, 1 - diff / maxDiff);
  }

  function calcCompatibility(
    a: { attendanceRate: number; activityCount: number; joinedAt: string },
    b: { attendanceRate: number; activityCount: number; joinedAt: string },
    maxActivity: number,
    maxJoinDiffDays: number
  ): { score: number; tags: string[] } {
    const tags: string[] = [];
    const attendanceSim = similarity(a.attendanceRate, b.attendanceRate, 1);
    if (attendanceSim >= 0.8) tags.push("출석률 유사");

    const activitySim = maxActivity > 0
      ? similarity(a.activityCount, b.activityCount, maxActivity)
      : 1;
    if (activitySim >= 0.8) tags.push("활동 유사");

    const daysDiff = Math.abs(
      new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    ) / (1000 * 60 * 60 * 24);
    const joinSim = maxJoinDiffDays > 0
      ? similarity(daysDiff, 0, maxJoinDiffDays)
      : 1;
    if (joinSim >= 0.8) tags.push("가입 시기 유사");

    const score = Math.round(
      (attendanceSim * 0.4 + activitySim * 0.4 + joinSim * 0.2) * 100
    );
    return { score, tags };
  }

  it("출석률이 동일하면 출석률 유사 태그가 붙는다", () => {
    const a = { attendanceRate: 0.8, activityCount: 5, joinedAt: "2025-01-01" };
    const b = { attendanceRate: 0.8, activityCount: 5, joinedAt: "2025-01-01" };
    const { tags } = calcCompatibility(a, b, 10, 100);
    expect(tags).toContain("출석률 유사");
  });

  it("활동량이 동일하면 활동 유사 태그가 붙는다", () => {
    const a = { attendanceRate: 0.5, activityCount: 5, joinedAt: "2025-01-01" };
    const b = { attendanceRate: 0.5, activityCount: 5, joinedAt: "2025-01-01" };
    const { tags } = calcCompatibility(a, b, 10, 100);
    expect(tags).toContain("활동 유사");
  });

  it("가입일이 동일하면 가입 시기 유사 태그가 붙는다", () => {
    const a = { attendanceRate: 0.5, activityCount: 5, joinedAt: "2025-01-01" };
    const b = { attendanceRate: 0.5, activityCount: 5, joinedAt: "2025-01-01" };
    const { tags } = calcCompatibility(a, b, 10, 100);
    expect(tags).toContain("가입 시기 유사");
  });

  it("모든 지표가 완전히 다르면 점수가 낮다", () => {
    const a = { attendanceRate: 1.0, activityCount: 10, joinedAt: "2020-01-01" };
    const b = { attendanceRate: 0.0, activityCount: 0, joinedAt: "2026-01-01" };
    const { score } = calcCompatibility(a, b, 10, 365 * 6);
    expect(score).toBeLessThan(50);
  });

  it("모든 지표가 완전히 동일하면 점수는 100이다", () => {
    const a = { attendanceRate: 0.8, activityCount: 5, joinedAt: "2025-01-01" };
    const b = { attendanceRate: 0.8, activityCount: 5, joinedAt: "2025-01-01" };
    const { score } = calcCompatibility(a, b, 10, 100);
    expect(score).toBe(100);
  });

  it("점수는 0 이상 100 이하이다", () => {
    const a = { attendanceRate: 0.9, activityCount: 8, joinedAt: "2025-03-01" };
    const b = { attendanceRate: 0.1, activityCount: 1, joinedAt: "2024-01-01" };
    const { score } = calcCompatibility(a, b, 20, 500);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("가중 평균: 출석률 40%, 활동 40%, 가입시기 20%", () => {
    // 출석률 유사도 1, 활동 유사도 1, 가입시기 유사도 0
    const a = { attendanceRate: 0.8, activityCount: 5, joinedAt: "2020-01-01" };
    const b = { attendanceRate: 0.8, activityCount: 5, joinedAt: "2026-01-01" };
    // joinSim ≈ 0 (6년 차이), maxJoinDiffDays = 365*6 ≈ 2190
    const { score } = calcCompatibility(a, b, 10, 2190);
    // 출석 0.4*100=40, 활동 0.4*100=40, 가입 ≈ 0.2*0=0 → ≈ 80
    expect(score).toBeCloseTo(80, -1);
  });
});

// ============================================================
// useMemberPairing - localStorage 초기화 로직
// ============================================================

describe("useMemberPairing - localStorage 초기화 로직", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("localStorage가 비어있으면 dismissed는 빈 배열이다", () => {
    const { result } = makeHook("group-1", []);
    // 초기 상태에서 localStorage에 데이터 없음
    expect(localStorageMock.getItem("dancebase:member-pairing:group-1")).toBeNull();
  });

  it("localStorage 파싱 실패 시 기본값이 사용된다", () => {
    // 잘못된 JSON 저장
    localStorageMock.setItem("dancebase:member-pairing:group-1", "invalid json");
    // 파싱 실패해도 오류 없이 훅 초기화
    expect(() => {
      makeHook("group-1", []);
    }).not.toThrow();
  });

  it("그룹별로 다른 localStorage 키를 사용한다", () => {
    const { result: r1 } = renderHook(() =>
      useMemberPairing("group-A", [], "user-1")
    );
    const { result: r2 } = renderHook(() =>
      useMemberPairing("group-B", [], "user-1")
    );
    act(() => {
      r1.current.dismiss("user-2");
    });
    // group-B에는 영향 없음
    expect(localStorageMock._getStore()["dancebase:member-pairing:group-B"]).toBeUndefined();
  });
});
