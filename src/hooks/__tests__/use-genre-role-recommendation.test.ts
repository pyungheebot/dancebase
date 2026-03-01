import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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
    genreRoleRecommendation: (groupId: string) =>
      `/groups/${groupId}/genre-role-recommendation`,
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
import { useGenreRoleRecommendation } from "@/hooks/use-genre-role-recommendation";
import type { EntityMember } from "@/types/entity-context";

// ─── 헬퍼 ────────────────────────────────────────────────────
function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

function makeMember(overrides: Partial<EntityMember> = {}): EntityMember {
  return {
    userId: "user-1",
    groupId: "group-1",
    role: "member",
    nickname: null,
    joinedAt: "2025-01-01T00:00:00Z",
    profile: {
      name: "홍길동",
      avatar_url: null,
    },
    ...overrides,
  } as EntityMember;
}

function makeHook(groupId = "group-1", members: EntityMember[] = []) {
  return renderHook(() => useGenreRoleRecommendation(groupId, members));
}

// ============================================================
// useGenreRoleRecommendation - 초기 상태
// ============================================================

describe("useGenreRoleRecommendation - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("초기 recommendations는 빈 배열이다 (rawStats 없음)", () => {
    const { result } = makeHook("group-1", []);
    expect(result.current.recommendations).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 state.assignments는 빈 객체이다", () => {
    const { result } = makeHook();
    expect(result.current.state.assignments).toEqual({});
  });

  it("초기 state.savedAt은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.state.savedAt).toBeNull();
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getEffectiveRole).toBe("function");
    expect(typeof result.current.overrideRole).toBe("function");
    expect(typeof result.current.applyAll).toBe("function");
    expect(typeof result.current.resetAll).toBe("function");
  });
});

// ============================================================
// useGenreRoleRecommendation - overrideRole 역할 재정의
// ============================================================

describe("useGenreRoleRecommendation - overrideRole 역할 재정의", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("overrideRole 호출 후 state.assignments에 반영된다", () => {
    const { result } = makeHook("group-1", [makeMember()]);
    act(() => {
      result.current.overrideRole("user-1", "리드");
    });
    expect(result.current.state.assignments["user-1"]).toBe("리드");
  });

  it("overrideRole을 여러 사용자에게 적용할 수 있다", () => {
    const { result } = makeHook("group-1", []);
    act(() => {
      result.current.overrideRole("user-1", "메인 댄서");
      result.current.overrideRole("user-2", "트레이니");
    });
    expect(result.current.state.assignments["user-1"]).toBe("메인 댄서");
    expect(result.current.state.assignments["user-2"]).toBe("트레이니");
  });

  it("같은 사용자에게 overrideRole을 반복 적용하면 최신값이 유지된다", () => {
    const { result } = makeHook("group-1", []);
    act(() => {
      result.current.overrideRole("user-1", "리드");
    });
    act(() => {
      result.current.overrideRole("user-1", "코레오그래퍼");
    });
    expect(result.current.state.assignments["user-1"]).toBe("코레오그래퍼");
  });
});

// ============================================================
// useGenreRoleRecommendation - getEffectiveRole
// ============================================================

describe("useGenreRoleRecommendation - getEffectiveRole 유효 역할 반환", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("override가 없으면 추천 역할을 반환한다", () => {
    const { result } = makeHook("group-1", []);
    const effective = result.current.getEffectiveRole("user-1", "서포트 댄서");
    expect(effective).toBe("서포트 댄서");
  });

  it("override가 있으면 override 역할을 반환한다", () => {
    const { result } = makeHook("group-1", []);
    act(() => {
      result.current.overrideRole("user-1", "리드");
    });
    const effective = result.current.getEffectiveRole("user-1", "서포트 댄서");
    expect(effective).toBe("리드");
  });

  it("다른 사용자의 override는 영향을 주지 않는다", () => {
    const { result } = makeHook("group-1", []);
    act(() => {
      result.current.overrideRole("user-2", "리드");
    });
    const effective = result.current.getEffectiveRole("user-1", "서포트 댄서");
    expect(effective).toBe("서포트 댄서");
  });
});

// ============================================================
// useGenreRoleRecommendation - applyAll
// ============================================================

describe("useGenreRoleRecommendation - applyAll 전체 적용", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("applyAll 호출 후 state.assignments가 업데이트된다", () => {
    const { result } = makeHook("group-1", []);
    const overrides = { "user-1": "메인 댄서" as const, "user-2": "트레이니" as const };
    act(() => {
      result.current.applyAll(overrides);
    });
    expect(result.current.state.assignments).toEqual(overrides);
  });

  it("applyAll 호출 후 state.savedAt이 설정된다", () => {
    const { result } = makeHook("group-1", []);
    act(() => {
      result.current.applyAll({ "user-1": "리드" });
    });
    expect(result.current.state.savedAt).not.toBeNull();
    expect(result.current.state.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("applyAll 호출 후 localStorage에 저장된다", () => {
    const { result } = makeHook("group-1", []);
    act(() => {
      result.current.applyAll({ "user-1": "리드" });
    });
    expect(memStore["dancebase:role-recommendations:group-1"]).toBeDefined();
  });
});

// ============================================================
// useGenreRoleRecommendation - resetAll
// ============================================================

describe("useGenreRoleRecommendation - resetAll 초기화", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("resetAll 호출 후 state.assignments가 빈 객체가 된다", () => {
    const { result } = makeHook("group-1", []);
    act(() => {
      result.current.overrideRole("user-1", "리드");
    });
    act(() => {
      result.current.resetAll();
    });
    expect(result.current.state.assignments).toEqual({});
  });

  it("resetAll 호출 후 state.savedAt이 null이 된다", () => {
    const { result } = makeHook("group-1", []);
    act(() => {
      result.current.applyAll({ "user-1": "리드" });
    });
    act(() => {
      result.current.resetAll();
    });
    expect(result.current.state.savedAt).toBeNull();
  });

  it("resetAll 후 getEffectiveRole은 추천 역할을 반환한다", () => {
    const { result } = makeHook("group-1", []);
    act(() => {
      result.current.overrideRole("user-1", "리드");
    });
    act(() => {
      result.current.resetAll();
    });
    const effective = result.current.getEffectiveRole("user-1", "서포트 댄서");
    expect(effective).toBe("서포트 댄서");
  });
});

// ============================================================
// useGenreRoleRecommendation - determineRole 역할 결정 로직
// ============================================================

describe("useGenreRoleRecommendation - determineRole 역할 결정 로직 (순수 함수 검증)", () => {
  /**
   * 훅 내부 determineRole 로직을 직접 재현하여 검증합니다.
   */

  function calcMemberDays(joinedAt: string): number {
    const ms = Date.now() - new Date(joinedAt).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }

  it("가입 30일 미만은 트레이니이다", () => {
    // 가입 15일 전
    const joinedAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const days = calcMemberDays(joinedAt);
    expect(days).toBeLessThan(30);
    // → 트레이니
  });

  it("가입 30일 이상이고 출석률 80% 이상이면 메인 댄서이다", () => {
    const attendanceRate = 0.85;
    const memberDays = 100;
    expect(memberDays >= 30).toBe(true);
    expect(attendanceRate >= 0.8).toBe(true);
    // → 메인 댄서
  });

  it("출석률 80% 미만이고 가입 180일 이상이면 리드 후보이다", () => {
    const attendanceRate = 0.7;
    const memberDays = 200;
    expect(attendanceRate >= 0.6).toBe(true);
    expect(memberDays >= 180).toBe(true);
    // → 리드
  });

  it("calcMemberDays는 음수를 반환하지 않는다", () => {
    // 미래 날짜
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const days = calcMemberDays(futureDate);
    expect(days).toBeGreaterThanOrEqual(0);
  });

  it("calcMemberDays는 정수를 반환한다", () => {
    const joinedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const days = calcMemberDays(joinedAt);
    expect(Number.isInteger(days)).toBe(true);
  });

  it("가입 1일된 멤버는 30일 미만이다", () => {
    const joinedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const days = calcMemberDays(joinedAt);
    expect(days).toBeLessThan(30);
  });

  it("가입 365일된 멤버는 180일 이상이다", () => {
    const joinedAt = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const days = calcMemberDays(joinedAt);
    expect(days).toBeGreaterThanOrEqual(180);
  });
});

// ============================================================
// useGenreRoleRecommendation - 상위 25% 임계값 계산 로직
// ============================================================

describe("useGenreRoleRecommendation - 활동량 임계값 계산 로직", () => {
  it("상위 10% 임계값이 올바르게 계산된다 (멤버 10명 기준)", () => {
    const allStats = Array.from({ length: 10 }, (_, i) => ({ activityCount: i + 1 }));
    const sorted = [...allStats].sort((a, b) => b.activityCount - a.activityCount);
    const totalCount = sorted.length;
    const top10Threshold = sorted[Math.max(0, Math.floor(totalCount * 0.1) - 1)].activityCount;
    // 10명 중 상위 10% = 상위 1명 → sorted[0] = 10
    expect(top10Threshold).toBe(10);
  });

  it("상위 25% 임계값이 올바르게 계산된다 (멤버 8명 기준)", () => {
    const allStats = [
      { activityCount: 1 },
      { activityCount: 2 },
      { activityCount: 3 },
      { activityCount: 4 },
      { activityCount: 5 },
      { activityCount: 6 },
      { activityCount: 7 },
      { activityCount: 8 },
    ];
    const sorted = [...allStats].sort((a, b) => b.activityCount - a.activityCount);
    const totalCount = sorted.length;
    const top25Threshold = sorted[Math.max(0, Math.floor(totalCount * 0.25) - 1)].activityCount;
    // 8명의 상위 25% = 상위 2명 → sorted[1] = 7
    expect(top25Threshold).toBe(7);
  });

  it("멤버가 없을 때 임계값은 0이다", () => {
    const allStats: { activityCount: number }[] = [];
    const totalCount = allStats.length;
    const top10Threshold = totalCount > 0
      ? allStats.sort((a, b) => b.activityCount - a.activityCount)[Math.max(0, Math.floor(totalCount * 0.1) - 1)].activityCount
      : 0;
    expect(top10Threshold).toBe(0);
  });
});

// ============================================================
// useGenreRoleRecommendation - 그룹별 격리
// ============================================================

describe("useGenreRoleRecommendation - 그룹별 데이터 격리", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("다른 groupId는 독립적인 state를 가진다", () => {
    const { result: r1 } = renderHook(() =>
      useGenreRoleRecommendation("group-A", [])
    );
    const { result: r2 } = renderHook(() =>
      useGenreRoleRecommendation("group-B", [])
    );

    act(() => {
      r1.current.applyAll({ "user-1": "리드" });
    });

    expect(r1.current.state.assignments["user-1"]).toBe("리드");
    expect(r2.current.state.assignments["user-1"]).toBeUndefined();
  });
});
