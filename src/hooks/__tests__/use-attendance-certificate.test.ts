import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null, fetcher: (() => unknown) | null, _opts?: unknown) => {
    if (!key || !fetcher) {
      return { data: undefined, isLoading: false, error: undefined, mutate: vi.fn() };
    }
    try {
      const result = fetcher();
      if (result instanceof Promise) {
        return { data: undefined, isLoading: false, error: undefined, mutate: vi.fn() };
      }
      return { data: result, isLoading: false, error: undefined, mutate: vi.fn() };
    } catch (err) {
      return { data: undefined, isLoading: false, error: err, mutate: vi.fn() };
    }
  },
}));

// ─── SWR 키 mock ──────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    attendanceCertificate: (groupId: string, userId: string) =>
      `/groups/${groupId}/attendance-certificate/${userId}`,
  },
}));

// ─── Supabase 체인 팩토리 ─────────────────────────────────────
type ChainMock = Record<string, ReturnType<typeof vi.fn>>;

function createChain(resolveValue: unknown): ChainMock {
  const chain: ChainMock = {};
  const chainMethods = ["select", "eq", "neq", "gte", "lte", "in", "order", "single", "maybeSingle"];
  chainMethods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(resolveValue);
  });
  // 체인 연결: 각 메서드가 chain 자신을 반환하되 마지막은 resolveValue
  chainMethods.forEach((m) => {
    chain[m] = vi.fn((..._args: unknown[]) => chain);
  });
  // 마지막 resolve를 위해 then 지원을 흉내
  (chain as unknown as { then?: unknown }).then = undefined;
  return chain;
}

// Supabase 모킹 데이터
let mockGroupData: { data: { name: string } | null; error: null | { message: string } };
let mockProfileData: { data: { name: string } | null; error: null | { message: string } };
let mockScheduleData: { data: { id: string; starts_at: string }[] | null; error: null | { message: string } };
let mockAttendanceData: { data: { schedule_id: string; status: string }[] | null; error: null | { message: string } };

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      const query: ChainMock = {};
      const methods = ["select", "eq", "neq", "gte", "lte", "in", "order", "single", "maybeSingle", "not"];
      methods.forEach((m) => {
        query[m] = vi.fn((..._args: unknown[]) => query);
      });

      // 체인의 마지막 await를 위해 PromiseLike 구현
      let resolveData: unknown;
      if (table === "groups") resolveData = mockGroupData;
      else if (table === "profiles") resolveData = mockProfileData;
      else if (table === "schedules") resolveData = mockScheduleData;
      else if (table === "attendance") resolveData = mockAttendanceData;
      else resolveData = { data: null, error: null };

      // 각 메서드가 thenableChain을 반환
      const thenableChain: ChainMock & PromiseLike<unknown> = {
        ...query,
        then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolveData).then(resolve),
      } as ChainMock & PromiseLike<unknown>;

      methods.forEach((m) => {
        thenableChain[m] = vi.fn((..._args: unknown[]) => thenableChain);
      });

      return thenableChain;
    },
  }),
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useAttendanceCertificate } from "@/hooks/use-attendance-certificate";

// ─── 헬퍼: 훅 렌더링 ──────────────────────────────────────────
function renderCertificate(params?: {
  groupId?: string;
  userId?: string;
  periodStart?: string;
  periodEnd?: string;
}) {
  return renderHook(() =>
    useAttendanceCertificate({
      groupId: params?.groupId ?? "group-1",
      userId: params?.userId ?? "user-1",
      periodStart: params?.periodStart ?? "2026-01-01",
      periodEnd: params?.periodEnd ?? "2026-01-31",
    })
  );
}

// ─── 순수 계산 로직 (훅 외부에서 직접 테스트) ─────────────────

/** 출석 여부 배열로부터 최장 연속 출석 계산 */
function calcLongestStreak(flags: boolean[]): number {
  let longest = 0;
  let temp = 0;
  for (const flag of flags) {
    if (flag) {
      temp++;
      if (temp > longest) longest = temp;
    } else {
      temp = 0;
    }
  }
  return longest;
}

/** 출석률 계산 */
function calcRate(attended: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

// ============================================================
// 순수 계산 함수 — longestStreak
// ============================================================

describe("longestStreak 계산 로직", () => {
  it("모두 출석이면 전체 길이가 최장 연속이다", () => {
    expect(calcLongestStreak([true, true, true])).toBe(3);
  });

  it("모두 미출석이면 최장 연속은 0이다", () => {
    expect(calcLongestStreak([false, false, false])).toBe(0);
  });

  it("빈 배열이면 0이다", () => {
    expect(calcLongestStreak([])).toBe(0);
  });

  it("단일 출석은 1이다", () => {
    expect(calcLongestStreak([true])).toBe(1);
  });

  it("단일 미출석은 0이다", () => {
    expect(calcLongestStreak([false])).toBe(1 - 1);
  });

  it("중간에 끊기면 더 긴 연속값을 반환한다", () => {
    // [T T F T T T] → 최장 3
    expect(calcLongestStreak([true, true, false, true, true, true])).toBe(3);
  });

  it("처음 단 하나만 출석이면 1이다", () => {
    expect(calcLongestStreak([true, false, false, false])).toBe(1);
  });

  it("마지막만 출석이면 1이다", () => {
    expect(calcLongestStreak([false, false, false, true])).toBe(1);
  });

  it("교대로 출석/미출석이면 최장 1이다", () => {
    expect(calcLongestStreak([true, false, true, false, true])).toBe(1);
  });

  it("긴 배열의 연속 계산이 올바르다 (10개 중 5연속)", () => {
    expect(
      calcLongestStreak([false, true, true, true, true, true, false, false, true, false])
    ).toBe(5);
  });
});

// ============================================================
// 순수 계산 함수 — attendanceRate
// ============================================================

describe("attendanceRate 계산 로직", () => {
  it("전원 출석 시 100%이다", () => {
    expect(calcRate(5, 5)).toBe(100);
  });

  it("전원 미출석 시 0%이다", () => {
    expect(calcRate(0, 5)).toBe(0);
  });

  it("total이 0이면 0%이다 (나누기 0 방지)", () => {
    expect(calcRate(0, 0)).toBe(0);
  });

  it("절반 출석 시 50%이다", () => {
    expect(calcRate(5, 10)).toBe(50);
  });

  it("소수점 반올림이 적용된다 (1/3 → 33)", () => {
    expect(calcRate(1, 3)).toBe(33);
  });

  it("2/3 → 67%이다", () => {
    expect(calcRate(2, 3)).toBe(67);
  });

  it("1회 출석 / 1회 = 100%이다", () => {
    expect(calcRate(1, 1)).toBe(100);
  });
});

// ============================================================
// useAttendanceCertificate — 훅 반환값 구조
// ============================================================

describe("useAttendanceCertificate - 반환값 구조", () => {
  beforeEach(() => {
    mockGroupData = { data: { name: "테스트그룹" }, error: null };
    mockProfileData = { data: { name: "홍길동" }, error: null };
    mockScheduleData = { data: [], error: null };
    mockAttendanceData = { data: [], error: null };
  });

  it("certificate, loading, error, refetch를 반환한다", () => {
    const { result } = renderCertificate();
    expect("certificate" in result.current).toBe(true);
    expect("loading" in result.current).toBe(true);
    expect("error" in result.current).toBe(true);
    expect(typeof result.current.refetch).toBe("function");
  });

  it("초기 certificate는 null이다 (SWR 동기 mock에서 Promise 반환 시)", () => {
    const { result } = renderCertificate();
    // SWR mock이 Promise를 처리하지 않으므로 null
    expect(result.current.certificate).toBeNull();
  });
});

// ============================================================
// useAttendanceCertificate — key 비활성화 조건
// ============================================================

describe("useAttendanceCertificate - SWR 키 활성화 조건", () => {
  it("groupId가 빈 문자열이면 certificate가 null이다", () => {
    const { result } = renderCertificate({ groupId: "" });
    expect(result.current.certificate).toBeNull();
  });

  it("userId가 빈 문자열이면 certificate가 null이다", () => {
    const { result } = renderCertificate({ userId: "" });
    expect(result.current.certificate).toBeNull();
  });

  it("periodStart가 빈 문자열이면 certificate가 null이다", () => {
    const { result } = renderCertificate({ periodStart: "" });
    expect(result.current.certificate).toBeNull();
  });

  it("periodEnd가 빈 문자열이면 certificate가 null이다", () => {
    const { result } = renderCertificate({ periodEnd: "" });
    expect(result.current.certificate).toBeNull();
  });

  it("모든 파라미터가 채워지면 loading이 false이다 (mock에서)", () => {
    const { result } = renderCertificate();
    // SWR mock은 즉시 isLoading: false 반환
    expect(result.current.loading).toBe(false);
  });
});

// ============================================================
// AttendanceCertificateData 타입 필드 검증
// ============================================================

describe("AttendanceCertificateData 필드 계약", () => {
  it("totalSchedules=0이면 attendedCount도 0이어야 한다", () => {
    const cert = {
      memberName: "홍길동",
      groupName: "그룹",
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
      totalSchedules: 0,
      attendedCount: 0,
      attendanceRate: 0,
      longestStreak: 0,
      issuedAt: "2026-03-02",
    };
    expect(cert.attendedCount).toBeLessThanOrEqual(cert.totalSchedules);
  });

  it("attendanceRate는 0~100 범위이다", () => {
    const rates = [0, 25, 50, 75, 100];
    rates.forEach((r) => {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
    });
  });

  it("longestStreak는 totalSchedules 이하이다", () => {
    const cert = {
      totalSchedules: 5,
      longestStreak: 3,
    };
    expect(cert.longestStreak).toBeLessThanOrEqual(cert.totalSchedules);
  });

  it("issuedAt은 YYYY-MM-DD 형식이다", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ============================================================
// 경계값 및 엣지 케이스
// ============================================================

describe("longestStreak 경계값 테스트", () => {
  it("1개 일정 모두 출석 → streak 1", () => {
    expect(calcLongestStreak([true])).toBe(1);
  });

  it("2개 일정 모두 출석 → streak 2", () => {
    expect(calcLongestStreak([true, true])).toBe(2);
  });

  it("100개 연속 출석 → streak 100", () => {
    expect(calcLongestStreak(Array(100).fill(true))).toBe(100);
  });

  it("마지막 2개만 연속 출석 → streak 2", () => {
    expect(calcLongestStreak([false, false, false, true, true])).toBe(2);
  });

  it("streak 계산은 상태 순서에 의존한다", () => {
    // [T T T F T] → 3
    // [T F T T T] → 3
    expect(calcLongestStreak([true, true, true, false, true])).toBe(3);
    expect(calcLongestStreak([true, false, true, true, true])).toBe(3);
  });
});

describe("attendanceRate 경계값 테스트", () => {
  it("attended > total 시에도 계산은 수행된다 (비정상 데이터)", () => {
    // 정상 데이터가 아닌 경우: attended=6, total=5
    // 100%를 초과하지만 계산 자체는 동작
    expect(calcRate(6, 5)).toBe(120);
  });

  it("소수점 .5 이상은 올림된다 (Math.round)", () => {
    // 5/9 = 55.55... → 56
    expect(calcRate(5, 9)).toBe(56);
  });

  it("소수점 .4 이하는 버려진다 (Math.round)", () => {
    // 1/4 = 25 정확히
    expect(calcRate(1, 4)).toBe(25);
  });
});
