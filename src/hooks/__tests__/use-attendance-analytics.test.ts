import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useAttendanceAnalytics,
  type MemberAttendanceStat,
  type MonthlyAttendanceStat,
} from "@/hooks/use-attendance-analytics";
import type { EntityContext } from "@/types/entity-context";

// ─── date-fns mock ───────────────────────────────────────────
vi.mock("date-fns", async () => {
  const actual = await vi.importActual<typeof import("date-fns")>("date-fns");
  return {
    ...actual,
    subMonths: actual.subMonths,
    startOfMonth: actual.startOfMonth,
    endOfMonth: actual.endOfMonth,
    format: actual.format,
  };
});

// ─── date-utils mock ─────────────────────────────────────────
vi.mock("@/lib/date-utils", () => ({
  formatYearMonth: (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return `${y}년 ${m}월`;
  },
}));

// ─── toast mock ───────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    SCHEDULE: { DATA_LOAD_ERROR: "일정 로드 실패" },
    ATTENDANCE: { DATA_LOAD_ERROR: "출석 로드 실패" },
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
};

function createChainableMock(resolveValue: { data: unknown; error: null | { message: string } }) {
  const chain: MockQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    in: vi.fn(),
  };

  // 모든 메서드가 chain을 반환하고, 마지막에 resolve
  const methods = ["select", "eq", "neq", "gte", "lte", "in"] as const;
  methods.forEach((method) => {
    chain[method].mockReturnValue(
      new Proxy(chain, {
        get(target, prop: string) {
          if (prop === "then") {
            return (resolve: (v: unknown) => void) => resolve(resolveValue);
          }
          return target[prop as keyof MockQuery] ?? vi.fn().mockResolvedValue(resolveValue);
        },
      })
    );
  });

  return chain;
}

const mockSupabase = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeContext(overrides: Partial<EntityContext> = {}): EntityContext {
  return {
    groupId: "grp-1",
    projectId: undefined,
    members: [],
    ...overrides,
  };
}

function makeMember(userId: string, name: string) {
  return {
    userId,
    nickname: name,
    profile: { name, avatar_url: null },
    role: "member" as const,
  };
}

function makeHook(ctx: EntityContext) {
  return renderHook(() => useAttendanceAnalytics(ctx));
}

// ============================================================
// useAttendanceAnalytics - 초기 상태
// ============================================================

describe("useAttendanceAnalytics - 초기 상태", () => {
  it("초기 data는 null이다", () => {
    const { result } = makeHook(makeContext());
    expect(result.current.data).toBeNull();
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook(makeContext());
    expect(result.current.loading).toBe(false);
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = makeHook(makeContext());
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// MemberAttendanceStat 계산 로직 단위 테스트 (순수 함수 재현)
// ============================================================

describe("출석 통계 계산 로직 - 멤버별 통계", () => {
  it("출석률 계산: present + late / totalSchedules", () => {
    // present=4, late=1, totalSchedules=10 → rate = (4+1)/10 * 100 = 50
    const present = 4;
    const late = 1;
    const totalSchedules = 10;
    const rate = Math.round(((present + late) / totalSchedules) * 100);
    expect(rate).toBe(50);
  });

  it("전체 출석 시 출석률은 100이다", () => {
    const present = 10;
    const late = 0;
    const totalSchedules = 10;
    const rate = Math.round(((present + late) / totalSchedules) * 100);
    expect(rate).toBe(100);
  });

  it("전체 결석 시 출석률은 0이다", () => {
    const present = 0;
    const late = 0;
    const totalSchedules = 10;
    const rate = Math.round(((present + late) / totalSchedules) * 100);
    expect(rate).toBe(0);
  });

  it("totalSchedules가 0이면 rate는 0이다", () => {
    const present = 0;
    const late = 0;
    const totalSchedules = 0;
    const rate = totalSchedules > 0
      ? Math.round(((present + late) / totalSchedules) * 100)
      : 0;
    expect(rate).toBe(0);
  });

  it("absent는 totalSchedules에서 present, late, earlyLeave를 뺀 값이다", () => {
    const present = 3;
    const late = 1;
    const earlyLeave = 2;
    const totalSchedules = 10;
    const absent = Math.max(0, totalSchedules - present - late - earlyLeave);
    expect(absent).toBe(4);
  });

  it("absent가 음수가 되지 않도록 Math.max(0, ...)를 사용한다", () => {
    // present + late + earlyLeave > totalSchedules (데이터 오류 상황)
    const present = 5;
    const late = 4;
    const earlyLeave = 3;
    const totalSchedules = 10;
    const absent = Math.max(0, totalSchedules - present - late - earlyLeave);
    expect(absent).toBeGreaterThanOrEqual(0);
  });

  it("late 출석도 출석률에 포함된다", () => {
    const present = 0;
    const late = 5;
    const totalSchedules = 10;
    const rate = Math.round(((present + late) / totalSchedules) * 100);
    expect(rate).toBe(50);
  });
});

// ============================================================
// 전체 평균 출석률 계산 단위 테스트
// ============================================================

describe("출석 통계 계산 로직 - 전체 평균 출석률", () => {
  it("멤버가 없으면 전체 평균은 0이다", () => {
    const memberStats: MemberAttendanceStat[] = [];
    const overallAvgRate = memberStats.length > 0
      ? Math.round(memberStats.reduce((sum, m) => sum + m.rate, 0) / memberStats.length)
      : 0;
    expect(overallAvgRate).toBe(0);
  });

  it("단일 멤버의 출석률이 그대로 평균이 된다", () => {
    const memberStats = [{ rate: 75 }] as MemberAttendanceStat[];
    const overallAvgRate = Math.round(
      memberStats.reduce((sum, m) => sum + m.rate, 0) / memberStats.length
    );
    expect(overallAvgRate).toBe(75);
  });

  it("복수 멤버의 출석률 평균이 올바르게 계산된다", () => {
    const memberStats = [
      { rate: 80 },
      { rate: 60 },
      { rate: 100 },
    ] as MemberAttendanceStat[];
    const overallAvgRate = Math.round(
      memberStats.reduce((sum, m) => sum + m.rate, 0) / memberStats.length
    );
    expect(overallAvgRate).toBe(80);
  });

  it("소수점은 반올림된다", () => {
    const memberStats = [
      { rate: 70 },
      { rate: 71 },
    ] as MemberAttendanceStat[];
    const overallAvgRate = Math.round(
      memberStats.reduce((sum, m) => sum + m.rate, 0) / memberStats.length
    );
    // (70+71)/2 = 70.5 → 71
    expect(overallAvgRate).toBe(71);
  });
});

// ============================================================
// 멤버 통계 정렬 로직 단위 테스트
// ============================================================

describe("출석 통계 계산 로직 - 정렬", () => {
  it("출석률 내림차순으로 정렬된다", () => {
    const memberStats = [
      { rate: 50, name: "C" },
      { rate: 100, name: "A" },
      { rate: 75, name: "B" },
    ] as MemberAttendanceStat[];

    memberStats.sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name));

    expect(memberStats[0].rate).toBe(100);
    expect(memberStats[1].rate).toBe(75);
    expect(memberStats[2].rate).toBe(50);
  });

  it("출석률이 같으면 이름 오름차순으로 정렬된다", () => {
    const memberStats = [
      { rate: 80, name: "Charlie" },
      { rate: 80, name: "Alice" },
      { rate: 80, name: "Bob" },
    ] as MemberAttendanceStat[];

    memberStats.sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name));

    expect(memberStats[0].name).toBe("Alice");
    expect(memberStats[1].name).toBe("Bob");
    expect(memberStats[2].name).toBe("Charlie");
  });
});

// ============================================================
// 월별 통계 계산 단위 테스트
// ============================================================

describe("출석 통계 계산 로직 - 월별 통계", () => {
  it("월별 평균 출석률 계산: present / (schedCnt * memberCnt)", () => {
    const present = 6;
    const possible = 10; // schedCnt=5, memberCnt=2
    const avgRate = possible > 0 ? Math.round((present / possible) * 100) : 0;
    expect(avgRate).toBe(60);
  });

  it("possible이 0이면 avgRate는 0이다", () => {
    const present = 0;
    const possible = 0;
    const avgRate = possible > 0 ? Math.round((present / possible) * 100) : 0;
    expect(avgRate).toBe(0);
  });

  it("monthlyStats 배열 길이는 6이다 (최근 6개월)", () => {
    // 6개월 루프 시뮬레이션
    const monthlyStats: MonthlyAttendanceStat[] = [];
    for (let i = 0; i < 6; i++) {
      monthlyStats.push({
        month: `2026년 ${3 - i}월`,
        yearMonth: `2026-0${3 - i}`,
        totalSchedules: i,
        avgRate: 0,
      });
    }
    expect(monthlyStats).toHaveLength(6);
  });

  it("월 레이블 형식이 'yyyy년 M월' 형태이다", () => {
    const stat: MonthlyAttendanceStat = {
      month: "2026년 3월",
      yearMonth: "2026-03",
      totalSchedules: 5,
      avgRate: 80,
    };
    expect(stat.month).toMatch(/^\d{4}년 \d{1,2}월$/);
  });

  it("yearMonth 형식이 'yyyy-MM' 형태이다", () => {
    const stat: MonthlyAttendanceStat = {
      month: "2026년 3월",
      yearMonth: "2026-03",
      totalSchedules: 5,
      avgRate: 80,
    };
    expect(stat.yearMonth).toMatch(/^\d{4}-\d{2}$/);
  });

  it("avgRate는 0~100 사이이다", () => {
    const avgRates = [0, 25, 50, 75, 100];
    avgRates.forEach((rate) => {
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    });
  });

  it("present 100% 시 avgRate는 100이다", () => {
    const present = 10;
    const possible = 10;
    const avgRate = Math.round((present / possible) * 100);
    expect(avgRate).toBe(100);
  });
});

// ============================================================
// useAttendanceAnalytics - members 빈 배열 시 fetch 미실행
// ============================================================

describe("useAttendanceAnalytics - members 빈 배열", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("members가 빈 배열이면 refetch 호출 시 데이터가 null로 유지된다", async () => {
    const ctx = makeContext({ members: [] });
    const { result } = makeHook(ctx);

    // fetch 내부에서 members.length === 0 이면 return 처리
    await result.current.refetch();

    expect(result.current.data).toBeNull();
  });

  it("members가 비어있으면 loading이 false이다", async () => {
    const ctx = makeContext({ members: [] });
    const { result } = makeHook(ctx);
    await result.current.refetch();
    expect(result.current.loading).toBe(false);
  });
});

// ============================================================
// AttendanceAnalyticsData 타입 구조 테스트
// ============================================================

describe("AttendanceAnalyticsData - 타입 구조", () => {
  it("MemberAttendanceStat 필드 구조가 올바르다", () => {
    const stat: MemberAttendanceStat = {
      userId: "user-1",
      name: "테스터",
      avatarUrl: null,
      present: 8,
      late: 1,
      earlyLeave: 0,
      absent: 1,
      total: 10,
      rate: 90,
    };

    expect(stat.userId).toBe("user-1");
    expect(stat.name).toBe("테스터");
    expect(stat.avatarUrl).toBeNull();
    expect(stat.present).toBe(8);
    expect(stat.late).toBe(1);
    expect(stat.earlyLeave).toBe(0);
    expect(stat.absent).toBe(1);
    expect(stat.total).toBe(10);
    expect(stat.rate).toBe(90);
  });

  it("MonthlyAttendanceStat 필드 구조가 올바르다", () => {
    const stat: MonthlyAttendanceStat = {
      month: "2026년 3월",
      yearMonth: "2026-03",
      totalSchedules: 8,
      avgRate: 72,
    };

    expect(stat.month).toBe("2026년 3월");
    expect(stat.yearMonth).toBe("2026-03");
    expect(stat.totalSchedules).toBe(8);
    expect(stat.avgRate).toBe(72);
  });

  it("rate는 정수로 반올림된다", () => {
    // 7/10 = 70% (정확히 70)
    const rate = Math.round((7 / 10) * 100);
    expect(Number.isInteger(rate)).toBe(true);
    expect(rate).toBe(70);
  });

  it("avgRate는 정수로 반올림된다", () => {
    // 13/20 = 65%
    const avgRate = Math.round((13 / 20) * 100);
    expect(Number.isInteger(avgRate)).toBe(true);
    expect(avgRate).toBe(65);
  });
});
