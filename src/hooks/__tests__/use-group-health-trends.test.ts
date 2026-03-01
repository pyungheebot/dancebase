import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGroupHealthTrends } from "@/hooks/use-group-health-trends";

// ─── SWR mock: data는 항상 undefined (fetcher 미실행) ────────
vi.mock("swr", () => ({
  default: (_key: string | null) => {
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

// ─── supabase mock ──────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    }),
  }),
}));

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    groupHealthTrends: (groupId: string) => `group-health-trends-${groupId}`,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────
// 1. 초기 상태 (data가 undefined일 때 기본값 검증)
// ─────────────────────────────────────────────────────────────

describe("useGroupHealthTrends - 초기 상태 (data undefined)", () => {
  it("attendanceRate.current가 0이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.attendanceRate.current).toBe(0);
  });

  it("attendanceRate.changeRate가 null이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.attendanceRate.changeRate).toBeNull();
  });

  it("attendanceRate.trend가 8개의 0으로 채워진 배열이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.attendanceRate.trend).toEqual(Array(8).fill(0));
    expect(result.current.attendanceRate.trend).toHaveLength(8);
  });

  it("activityCount.current가 0이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.activityCount.current).toBe(0);
  });

  it("activityCount.trend가 8개의 0으로 채워진 배열이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.activityCount.trend).toEqual(Array(8).fill(0));
  });

  it("newMemberCount.current가 0이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.newMemberCount.current).toBe(0);
  });

  it("newMemberCount.trend가 8개의 0으로 채워진 배열이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.newMemberCount.trend).toEqual(Array(8).fill(0));
  });

  it("rsvpRate.current가 0이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.rsvpRate.current).toBe(0);
  });

  it("rsvpRate.trend가 8개의 0으로 채워진 배열이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.rsvpRate.trend).toEqual(Array(8).fill(0));
  });

  it("weeks가 빈 배열이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.weeks).toEqual([]);
  });

  it("loading이 false이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.loading).toBe(false);
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ─────────────────────────────────────────────────────────────
// 2. 반환 구조 타입 검증
// ─────────────────────────────────────────────────────────────

describe("useGroupHealthTrends - 반환 구조 타입 검증", () => {
  it("attendanceRate는 current, changeRate, trend를 가진다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.attendanceRate).toHaveProperty("current");
    expect(result.current.attendanceRate).toHaveProperty("changeRate");
    expect(result.current.attendanceRate).toHaveProperty("trend");
  });

  it("activityCount는 current, changeRate, trend를 가진다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.activityCount).toHaveProperty("current");
    expect(result.current.activityCount).toHaveProperty("changeRate");
    expect(result.current.activityCount).toHaveProperty("trend");
  });

  it("newMemberCount는 current, changeRate, trend를 가진다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.newMemberCount).toHaveProperty("current");
    expect(result.current.newMemberCount).toHaveProperty("changeRate");
    expect(result.current.newMemberCount).toHaveProperty("trend");
  });

  it("rsvpRate는 current, changeRate, trend를 가진다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.rsvpRate).toHaveProperty("current");
    expect(result.current.rsvpRate).toHaveProperty("changeRate");
    expect(result.current.rsvpRate).toHaveProperty("trend");
  });

  it("trend는 배열 타입이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(Array.isArray(result.current.attendanceRate.trend)).toBe(true);
    expect(Array.isArray(result.current.activityCount.trend)).toBe(true);
    expect(Array.isArray(result.current.newMemberCount.trend)).toBe(true);
    expect(Array.isArray(result.current.rsvpRate.trend)).toBe(true);
  });

  it("weeks는 배열 타입이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(Array.isArray(result.current.weeks)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. data가 있을 때 실제 값 반환 검증
// ─────────────────────────────────────────────────────────────
// SWR에 실제 데이터를 주입하기 위해 별도 모듈로 테스트하는 대신,
// 훅 소스 내의 data ?? empty 패턴을 직접 단위 테스트로 검증합니다.

describe("useGroupHealthTrends - empty metric 구조 검증", () => {
  it("data가 undefined이면 각 지표의 trend는 8개의 0이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-test"));
    const allLengths = [
      result.current.attendanceRate.trend.length,
      result.current.activityCount.trend.length,
      result.current.newMemberCount.trend.length,
      result.current.rsvpRate.trend.length,
    ];
    expect(allLengths.every((len) => len === 8)).toBe(true);
  });

  it("data가 undefined이면 모든 current는 0이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-test"));
    expect(result.current.attendanceRate.current).toBe(0);
    expect(result.current.activityCount.current).toBe(0);
    expect(result.current.newMemberCount.current).toBe(0);
    expect(result.current.rsvpRate.current).toBe(0);
  });

  it("data가 undefined이면 모든 changeRate는 null이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-test"));
    expect(result.current.attendanceRate.changeRate).toBeNull();
    expect(result.current.activityCount.changeRate).toBeNull();
    expect(result.current.newMemberCount.changeRate).toBeNull();
    expect(result.current.rsvpRate.changeRate).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// 4. loading 상태
// ─────────────────────────────────────────────────────────────

describe("useGroupHealthTrends - loading 상태", () => {
  it("isLoading이 false이면 loading이 false다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.loading).toBe(false);
  });

  it("loading은 boolean 타입이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(typeof result.current.loading).toBe("boolean");
  });
});

// ─────────────────────────────────────────────────────────────
// 5. 경계값
// ─────────────────────────────────────────────────────────────

describe("useGroupHealthTrends - 경계값 및 기본값 검증", () => {
  it("groupId가 빈 문자열이어도 기본 구조를 반환한다", () => {
    const { result } = renderHook(() => useGroupHealthTrends(""));
    expect(result.current.attendanceRate).toBeDefined();
    expect(result.current.weeks).toBeDefined();
  });

  it("각 metric의 trend 배열은 기본적으로 8개 요소를 가진다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.attendanceRate.trend.length).toBe(8);
    expect(result.current.activityCount.trend.length).toBe(8);
    expect(result.current.newMemberCount.trend.length).toBe(8);
    expect(result.current.rsvpRate.trend.length).toBe(8);
  });

  it("모든 기본 trend 값이 0 이상이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    const allTrends = [
      ...result.current.attendanceRate.trend,
      ...result.current.activityCount.trend,
      ...result.current.newMemberCount.trend,
      ...result.current.rsvpRate.trend,
    ];
    expect(allTrends.every((v) => v >= 0)).toBe(true);
  });

  it("current 값이 0 이상이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current.attendanceRate.current).toBeGreaterThanOrEqual(0);
    expect(result.current.activityCount.current).toBeGreaterThanOrEqual(0);
    expect(result.current.newMemberCount.current).toBeGreaterThanOrEqual(0);
    expect(result.current.rsvpRate.current).toBeGreaterThanOrEqual(0);
  });

  it("changeRate는 null이거나 number이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    const cr = result.current.attendanceRate.changeRate;
    expect(cr === null || typeof cr === "number").toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. refetch 함수
// ─────────────────────────────────────────────────────────────

describe("useGroupHealthTrends - refetch", () => {
  it("refetch는 함수이다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(typeof result.current.refetch).toBe("function");
  });

  it("refetch를 호출해도 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(() => result.current.refetch()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 7. 그룹별 격리 (SWR 키 분리)
// ─────────────────────────────────────────────────────────────

describe("useGroupHealthTrends - 그룹별 격리", () => {
  it("다른 groupId에 대해 독립적인 훅 인스턴스를 반환한다", () => {
    const { result: r1 } = renderHook(() => useGroupHealthTrends("group-A"));
    const { result: r2 } = renderHook(() => useGroupHealthTrends("group-B"));

    expect(r1.current.attendanceRate).toBeDefined();
    expect(r2.current.attendanceRate).toBeDefined();
    // 각각 별도의 배열 인스턴스
    expect(r1.current.weeks).not.toBe(r2.current.weeks);
  });

  it("두 개의 다른 groupId 훅이 각각 올바른 기본 구조를 가진다", () => {
    const { result: r1 } = renderHook(() => useGroupHealthTrends("group-X"));
    const { result: r2 } = renderHook(() => useGroupHealthTrends("group-Y"));

    expect(r1.current.attendanceRate.current).toBe(0);
    expect(r2.current.attendanceRate.current).toBe(0);
    expect(r1.current.weeks).toEqual([]);
    expect(r2.current.weeks).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 8. GroupHealthTrendsResult 반환 구조 완전성 검증
// ─────────────────────────────────────────────────────────────

describe("useGroupHealthTrends - 반환 구조 완전성", () => {
  it("반환 객체가 attendanceRate를 포함한다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current).toHaveProperty("attendanceRate");
  });

  it("반환 객체가 activityCount를 포함한다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current).toHaveProperty("activityCount");
  });

  it("반환 객체가 newMemberCount를 포함한다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current).toHaveProperty("newMemberCount");
  });

  it("반환 객체가 rsvpRate를 포함한다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current).toHaveProperty("rsvpRate");
  });

  it("반환 객체가 weeks를 포함한다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current).toHaveProperty("weeks");
  });

  it("반환 객체가 loading을 포함한다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current).toHaveProperty("loading");
  });

  it("반환 객체가 refetch를 포함한다", () => {
    const { result } = renderHook(() => useGroupHealthTrends("group-1"));
    expect(result.current).toHaveProperty("refetch");
  });
});
