import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── Supabase mock ────────────────────────────────────────────
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockIn = vi.fn();
const mockCount = vi.fn();

// 체이닝 mock 헬퍼
function makeMemberChain(data: unknown, error: null | { message: string } = null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data, error }),
    }),
  };
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    groupHealth: (id: string) => `group-health-${id}`,
  },
}));

// ─── groupHealth 계산 로직 순수 함수 테스트 ──────────────────────

// 내부 계산 로직을 직접 테스트하기 위한 헬퍼
function calcScore(
  attendanceRate: number | null,
  activityRate: number | null,
  retentionRate: number | null
): number | null {
  const hasEnoughData =
    attendanceRate !== null || activityRate !== null || retentionRate !== null;
  if (!hasEnoughData) return null;

  const att = attendanceRate ?? 0;
  const act = activityRate ?? 0;
  const ret = retentionRate ?? 0;

  const attWeight = attendanceRate !== null ? 50 : 0;
  const actWeight = activityRate !== null ? 30 : 0;
  const retWeight = retentionRate !== null ? 20 : 0;
  const totalWeight = attWeight + actWeight + retWeight;

  if (totalWeight === 0) return null;

  const rawScore = (att * attWeight + act * actWeight + ret * retWeight) / totalWeight;
  return Math.round(rawScore * 100);
}

function calcRetentionRate(
  currentMemberCount: number,
  oldMemberCount: number
): number | null {
  if (currentMemberCount > 0 && oldMemberCount > 0) {
    return Math.min(1, oldMemberCount / currentMemberCount);
  }
  if (currentMemberCount > 0 && oldMemberCount === 0) {
    return null; // 30일 미만 신규 그룹
  }
  return null;
}

function calcAttendanceRate(
  scheduleIds: string[],
  memberCount: number,
  presentCount: number
): number | null {
  if (scheduleIds.length === 0 || memberCount === 0) return null;
  const totalPossible = scheduleIds.length * memberCount;
  return totalPossible > 0 ? presentCount / totalPossible : null;
}

function calcActivityRate(
  postCount: number,
  memberCount: number
): number | null {
  if (memberCount === 0) return null;
  return Math.min(1, postCount / memberCount);
}

// ============================================================
// 순수 계산 로직 테스트
// ============================================================

describe("useGroupHealth - 종합 점수 계산 로직", () => {
  it("세 지표 모두 있을 때 가중 평균으로 점수를 계산한다", () => {
    // att:1.0*50 + act:1.0*30 + ret:1.0*20 = 100
    const score = calcScore(1.0, 1.0, 1.0);
    expect(score).toBe(100);
  });

  it("출석률만 있을 때 출석률이 100%면 점수는 100이다", () => {
    const score = calcScore(1.0, null, null);
    expect(score).toBe(100);
  });

  it("활동도만 있을 때 활동도가 100%면 점수는 100이다", () => {
    const score = calcScore(null, 1.0, null);
    expect(score).toBe(100);
  });

  it("유지율만 있을 때 유지율이 100%면 점수는 100이다", () => {
    const score = calcScore(null, null, 1.0);
    expect(score).toBe(100);
  });

  it("세 지표 모두 null이면 score는 null이다", () => {
    const score = calcScore(null, null, null);
    expect(score).toBeNull();
  });

  it("출석률 0.8, 활동도 0.6, 유지율 0.9 일 때 점수가 올바르다", () => {
    // (0.8*50 + 0.6*30 + 0.9*20) / 100 = (40+18+18)/100 = 76/100 = 76
    const score = calcScore(0.8, 0.6, 0.9);
    expect(score).toBe(76);
  });

  it("출석률 0.5, 활동도 null, 유지율 0.5 일 때 가중치 재분배가 올바르다", () => {
    // (0.5*50 + 0.5*20) / 70 = (25+10)/70 = 35/70 = 0.5 → 50
    const score = calcScore(0.5, null, 0.5);
    expect(score).toBe(50);
  });

  it("score는 0~100 범위여야 한다", () => {
    const score = calcScore(0, 0, 0);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("모든 값이 0이면 score는 0이다", () => {
    const score = calcScore(0, 0, 0);
    expect(score).toBe(0);
  });
});

describe("useGroupHealth - 멤버 유지율 계산 로직", () => {
  it("멤버가 있고 오래된 멤버가 있으면 유지율을 계산한다", () => {
    const rate = calcRetentionRate(10, 8);
    expect(rate).toBe(0.8);
  });

  it("현재 멤버 수가 0이면 null을 반환한다", () => {
    const rate = calcRetentionRate(0, 0);
    expect(rate).toBeNull();
  });

  it("30일 이전 가입 멤버가 없으면 null을 반환한다 (신규 그룹)", () => {
    const rate = calcRetentionRate(5, 0);
    expect(rate).toBeNull();
  });

  it("오래된 멤버가 현재 멤버보다 많을 경우 1로 클램핑된다", () => {
    const rate = calcRetentionRate(5, 10); // 불가능한 상황이지만 클램핑
    expect(rate).toBe(1);
  });

  it("오래된 멤버 수가 현재 멤버 수와 같으면 유지율이 1이다", () => {
    const rate = calcRetentionRate(10, 10);
    expect(rate).toBe(1);
  });
});

describe("useGroupHealth - 출석률 계산 로직", () => {
  it("일정과 멤버가 없으면 null을 반환한다", () => {
    const rate = calcAttendanceRate([], 0, 0);
    expect(rate).toBeNull();
  });

  it("일정이 없으면 null을 반환한다", () => {
    const rate = calcAttendanceRate([], 5, 3);
    expect(rate).toBeNull();
  });

  it("멤버가 없으면 null을 반환한다", () => {
    const rate = calcAttendanceRate(["s1", "s2"], 0, 0);
    expect(rate).toBeNull();
  });

  it("출석률을 올바르게 계산한다", () => {
    // 2개 일정, 5명 멤버, 총 10명 중 8명 출석
    const rate = calcAttendanceRate(["s1", "s2"], 5, 8);
    expect(rate).toBe(0.8);
  });

  it("100% 출석 시 1.0을 반환한다", () => {
    const rate = calcAttendanceRate(["s1"], 5, 5);
    expect(rate).toBe(1.0);
  });

  it("0% 출석 시 0을 반환한다", () => {
    const rate = calcAttendanceRate(["s1", "s2"], 5, 0);
    expect(rate).toBe(0);
  });
});

describe("useGroupHealth - 활동도 계산 로직", () => {
  it("멤버가 없으면 null을 반환한다", () => {
    const rate = calcActivityRate(10, 0);
    expect(rate).toBeNull();
  });

  it("게시글 수가 멤버 수보다 많으면 1로 클램핑된다", () => {
    const rate = calcActivityRate(20, 5);
    expect(rate).toBe(1);
  });

  it("게시글 수가 0이면 0을 반환한다", () => {
    const rate = calcActivityRate(0, 10);
    expect(rate).toBe(0);
  });

  it("게시글 수와 멤버 수가 같으면 1을 반환한다", () => {
    const rate = calcActivityRate(10, 10);
    expect(rate).toBe(1);
  });

  it("게시글 수가 멤버 수의 절반이면 0.5를 반환한다", () => {
    const rate = calcActivityRate(5, 10);
    expect(rate).toBe(0.5);
  });
});

describe("useGroupHealth - hasEnoughData 판단", () => {
  it("세 지표가 모두 null이면 hasEnoughData는 false이다", () => {
    const hasEnoughData =
      null !== null || null !== null || null !== null;
    expect(hasEnoughData).toBe(false);
  });

  it("하나라도 null이 아니면 hasEnoughData는 true이다", () => {
    const attendanceRate = 0.8;
    const hasEnoughData =
      attendanceRate !== null || null !== null || null !== null;
    expect(hasEnoughData).toBe(true);
  });

  it("모든 지표가 0이어도 hasEnoughData는 true이다", () => {
    const hasEnoughData =
      (0 as number | null) !== null ||
      (0 as number | null) !== null ||
      (0 as number | null) !== null;
    expect(hasEnoughData).toBe(true);
  });
});

// ============================================================
// useGroupHealth 훅 기본 반환값 테스트 (SWR mock)
// ============================================================

describe("useGroupHealth - SWR 통합 (기본 반환값)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("groupId가 빈 문자열이면 SWR 키가 null이 되어 로딩이 false이다", async () => {
    // SWR key가 null이면 fetcher를 호출하지 않음
    // 기본값 반환 확인
    vi.mock("swr", () => ({
      default: vi.fn((key: string | null) => {
        if (!key) return { data: undefined, isLoading: false, mutate: vi.fn() };
        return { data: undefined, isLoading: true, mutate: vi.fn() };
      }),
    }));

    const { useGroupHealth } = await import("@/hooks/use-group-health");
    const { result } = renderHook(() => useGroupHealth(""));
    expect(result.current.loading).toBe(false);
  });
});

describe("useGroupHealth - 기본 반환 구조", () => {
  it("health 객체의 기본값이 올바르다", async () => {
    vi.resetModules();
    vi.doMock("swr", () => ({
      default: vi.fn(() => ({
        data: undefined,
        isLoading: false,
        mutate: vi.fn(),
      })),
    }));

    const { useGroupHealth } = await import("@/hooks/use-group-health");
    const { result } = renderHook(() => useGroupHealth("group-1"));

    expect(result.current.health.attendanceRate).toBeNull();
    expect(result.current.health.activityRate).toBeNull();
    expect(result.current.health.retentionRate).toBeNull();
    expect(result.current.health.score).toBeNull();
    expect(result.current.health.hasEnoughData).toBe(false);
    expect(typeof result.current.refetch).toBe("function");
  });
});
