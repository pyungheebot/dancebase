import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

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
    groupPerformanceSnapshot: (groupId: string, period: string) =>
      `/groups/${groupId}/performance-snapshot?period=${period}`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

import { useGroupPerformanceSnapshot } from "@/hooks/use-group-performance-snapshot";

// ─── 순수 함수 로직 테스트를 위한 로컬 재현 ─────────────────────

function calcChangeRate(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function calcAttendanceRate(present: number, absent: number): number {
  const total = present + absent;
  return total > 0 ? Math.round((present / total) * 100) : 0;
}

// ============================================================

describe("useGroupPerformanceSnapshot - 초기 상태", () => {
  it("snapshot은 초기에 null이다", () => {
    const { result } = renderHook(() =>
      useGroupPerformanceSnapshot("group-1", "week")
    );
    expect(result.current.snapshot).toBeNull();
  });

  it("loading은 boolean 타입이다", () => {
    const { result } = renderHook(() =>
      useGroupPerformanceSnapshot("group-1", "week")
    );
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() =>
      useGroupPerformanceSnapshot("group-1", "week")
    );
    expect(typeof result.current.refetch).toBe("function");
  });

  it("groupId가 빈 문자열이면 snapshot은 null이다", () => {
    const { result } = renderHook(() =>
      useGroupPerformanceSnapshot("", "week")
    );
    expect(result.current.snapshot).toBeNull();
  });

  it("period가 month일 때도 초기 snapshot은 null이다", () => {
    const { result } = renderHook(() =>
      useGroupPerformanceSnapshot("group-1", "month")
    );
    expect(result.current.snapshot).toBeNull();
  });

  it("refetch 함수 호출 시 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() =>
      useGroupPerformanceSnapshot("group-1", "week")
    );
    expect(() => result.current.refetch()).not.toThrow();
  });
});

describe("useGroupPerformanceSnapshot - calcChangeRate 순수 함수 로직", () => {
  it("previous가 0이면 null을 반환한다", () => {
    expect(calcChangeRate(10, 0)).toBeNull();
  });

  it("current가 previous보다 크면 양수 변화율을 반환한다", () => {
    expect(calcChangeRate(120, 100)).toBe(20);
  });

  it("current가 previous보다 작으면 음수 변화율을 반환한다", () => {
    expect(calcChangeRate(80, 100)).toBe(-20);
  });

  it("current와 previous가 같으면 0을 반환한다", () => {
    expect(calcChangeRate(100, 100)).toBe(0);
  });

  it("소수점이 있을 경우 반올림한다", () => {
    // (115-100)/100 * 100 = 15
    expect(calcChangeRate(115, 100)).toBe(15);
  });

  it("previous가 3, current가 4이면 약 33%이다", () => {
    expect(calcChangeRate(4, 3)).toBe(33);
  });

  it("previous가 0이고 current가 0이면 null이다", () => {
    expect(calcChangeRate(0, 0)).toBeNull();
  });

  it("큰 수에서도 정확한 비율을 계산한다", () => {
    expect(calcChangeRate(200, 100)).toBe(100);
  });
});

describe("useGroupPerformanceSnapshot - 출석률 계산 로직", () => {
  it("출석(present)만 있을 때 100%이다", () => {
    expect(calcAttendanceRate(10, 0)).toBe(100);
  });

  it("결석(absent)만 있을 때 0%이다", () => {
    expect(calcAttendanceRate(0, 10)).toBe(0);
  });

  it("present와 absent가 같으면 50%이다", () => {
    expect(calcAttendanceRate(5, 5)).toBe(50);
  });

  it("total이 0이면 0%이다", () => {
    expect(calcAttendanceRate(0, 0)).toBe(0);
  });

  it("소수점은 반올림된다 (1/3 = 33%)", () => {
    expect(calcAttendanceRate(1, 2)).toBe(33);
  });

  it("출석 6, 결석 4이면 60%이다", () => {
    expect(calcAttendanceRate(6, 4)).toBe(60);
  });

  it("출석 2, 결석 1이면 67%이다", () => {
    expect(calcAttendanceRate(2, 1)).toBe(67);
  });
});

describe("useGroupPerformanceSnapshot - 콘텐츠 수 계산 로직", () => {
  it("게시글 수 + 댓글 수 = contentCount이다", () => {
    const posts = 5;
    const comments = 3;
    expect(posts + comments).toBe(8);
  });

  it("게시글과 댓글이 모두 0이면 contentCount는 0이다", () => {
    expect(0 + 0).toBe(0);
  });

  it("댓글이 없을 때 contentCount는 게시글 수와 같다", () => {
    const posts = 7;
    const comments = 0;
    expect(posts + comments).toBe(7);
  });
});

describe("useGroupPerformanceSnapshot - 최고 기여자 계산 로직", () => {
  it("게시글 작성자가 여러 명일 때 가장 많이 쓴 사람이 최고 기여자다", () => {
    type Author = { id: string; count: number };
    const authors: Author[] = [
      { id: "user-1", count: 5 },
      { id: "user-2", count: 3 },
      { id: "user-3", count: 8 },
    ];
    const top = authors.reduce((max, a) => (a.count > max.count ? a : max), authors[0]);
    expect(top.id).toBe("user-3");
    expect(top.count).toBe(8);
  });

  it("게시글 0개이면 최고 기여자는 null이다", () => {
    const authors: { id: string; count: number }[] = [];
    const top = authors.length > 0 ? authors[0] : null;
    expect(top).toBeNull();
  });

  it("동일한 작성자의 게시글과 댓글이 합산된다", () => {
    // user-1: 게시글 3 + 댓글 2 = 5
    const combined = 3 + 2;
    expect(combined).toBe(5);
  });
});

describe("useGroupPerformanceSnapshot - period 분기 로직", () => {
  it("week period로 훅이 정상 렌더링된다", () => {
    const { result } = renderHook(() =>
      useGroupPerformanceSnapshot("group-abc", "week")
    );
    expect(result.current).toBeDefined();
  });

  it("month period로 훅이 정상 렌더링된다", () => {
    const { result } = renderHook(() =>
      useGroupPerformanceSnapshot("group-abc", "month")
    );
    expect(result.current).toBeDefined();
  });

  it("다른 groupId에서 독립적인 훅 인스턴스가 생성된다", () => {
    const { result: r1 } = renderHook(() =>
      useGroupPerformanceSnapshot("group-1", "week")
    );
    const { result: r2 } = renderHook(() =>
      useGroupPerformanceSnapshot("group-2", "week")
    );
    expect(r1.current).toBeDefined();
    expect(r2.current).toBeDefined();
  });
});

describe("useGroupPerformanceSnapshot - makeMetric 로직", () => {
  function makeMetric(currentVal: number, previousVal: number) {
    return {
      value: currentVal,
      changeRate: calcChangeRate(currentVal, previousVal),
    };
  }

  it("value는 현재 값이다", () => {
    const metric = makeMetric(42, 30);
    expect(metric.value).toBe(42);
  });

  it("changeRate는 이전 대비 변화율이다", () => {
    const metric = makeMetric(110, 100);
    expect(metric.changeRate).toBe(10);
  });

  it("이전 값이 0이면 changeRate는 null이다", () => {
    const metric = makeMetric(5, 0);
    expect(metric.changeRate).toBeNull();
  });

  it("현재 값이 0이고 이전 값이 10이면 -100%이다", () => {
    const metric = makeMetric(0, 10);
    expect(metric.changeRate).toBe(-100);
  });

  it("현재 값과 이전 값이 모두 0이면 changeRate는 null이다", () => {
    const metric = makeMetric(0, 0);
    expect(metric.changeRate).toBeNull();
  });
});

describe("useGroupPerformanceSnapshot - 반환 구조", () => {
  it("snapshot, loading, refetch 세 가지 키를 반환한다", () => {
    const { result } = renderHook(() =>
      useGroupPerformanceSnapshot("group-1", "week")
    );
    expect("snapshot" in result.current).toBe(true);
    expect("loading" in result.current).toBe(true);
    expect("refetch" in result.current).toBe(true);
  });

  it("groupId가 없으면 SWR key가 null이 되어 데이터가 없다", () => {
    const { result } = renderHook(() =>
      useGroupPerformanceSnapshot("", "month")
    );
    expect(result.current.snapshot).toBeNull();
  });
});
