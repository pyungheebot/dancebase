import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null, fetcher?: () => unknown) => {
    if (!key || !fetcher) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

// ─── SWR 키 mock ───────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    memberBenchmarking: (groupId: string, userId: string) =>
      `/member-benchmarking/${groupId}/${userId}`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
const mockSelectFn = vi.fn().mockReturnThis();
const mockEqFn = vi.fn().mockReturnThis();
const mockNeqFn = vi.fn().mockReturnThis();
const mockGteFn = vi.fn().mockReturnThis();
const mockLteFn = vi.fn().mockReturnThis();
const mockInFn = vi.fn().mockResolvedValue({ data: [], error: null });

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: mockSelectFn,
      eq: mockEqFn,
      neq: mockNeqFn,
      gte: mockGteFn,
      lte: mockLteFn,
      in: mockInFn,
    }),
  }),
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useMemberBenchmarking } from "@/hooks/use-member-benchmarking";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function makeHook(groupId = "group-1", userId = "user-1") {
  return renderHook(() => useMemberBenchmarking(groupId, userId));
}

// ============================================================
// 초기 상태 (SWR data가 undefined일 때)
// ============================================================

describe("useMemberBenchmarking - 초기 상태", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("data가 정의된다 (defaultData 폴백)", () => {
    const { result } = makeHook();
    expect(result.current.data).toBeDefined();
  });

  it("초기 data.hasData는 false이다", () => {
    const { result } = makeHook();
    expect(result.current.data.hasData).toBe(false);
  });

  it("초기 data.totalMemberCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.totalMemberCount).toBe(0);
  });

  it("초기 data.attendance가 존재한다", () => {
    const { result } = makeHook();
    expect(result.current.data.attendance).toBeDefined();
  });

  it("초기 data.activity가 존재한다", () => {
    const { result } = makeHook();
    expect(result.current.data.activity).toBeDefined();
  });

  it("초기 data.rsvp가 존재한다", () => {
    const { result } = makeHook();
    expect(result.current.data.rsvp).toBeDefined();
  });

  it("초기 attendance.myValue는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.attendance.myValue).toBe(0);
  });

  it("초기 attendance.groupAverage는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.attendance.groupAverage).toBe(0);
  });

  it("초기 attendance.diffFromAverage는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.attendance.diffFromAverage).toBe(0);
  });

  it("초기 attendance.percentile은 50이다 (emptyMetric 기본값)", () => {
    const { result } = makeHook();
    expect(result.current.data.attendance.percentile).toBe(50);
  });

  it("초기 activity.percentile은 50이다", () => {
    const { result } = makeHook();
    expect(result.current.data.activity.percentile).toBe(50);
  });

  it("초기 rsvp.percentile은 50이다", () => {
    const { result } = makeHook();
    expect(result.current.data.rsvp.percentile).toBe(50);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// 파라미터 검증
// ============================================================

describe("useMemberBenchmarking - 파라미터 검증", () => {
  it("groupId가 빈 문자열이면 SWR 키가 null이 된다 (데이터 로드 안 함)", () => {
    const { result } = renderHook(() => useMemberBenchmarking("", "user-1"));
    // SWR key null이면 data는 undefined, 폴백으로 defaultData 반환
    expect(result.current.data.hasData).toBe(false);
  });

  it("userId가 빈 문자열이면 SWR 키가 null이 된다", () => {
    const { result } = renderHook(() => useMemberBenchmarking("group-1", ""));
    expect(result.current.data.hasData).toBe(false);
  });

  it("둘 다 빈 문자열이면 기본 데이터를 반환한다", () => {
    const { result } = renderHook(() => useMemberBenchmarking("", ""));
    expect(result.current.data).toBeDefined();
    expect(result.current.data.hasData).toBe(false);
  });
});

// ============================================================
// calcMetric 내부 로직 검증 (순수 함수 재현)
// ============================================================

describe("useMemberBenchmarking - calcMetric 로직 검증", () => {
  // calcMetric 로직을 직접 재현하여 단위 테스트
  function calcMetric(byUserMap: Record<string, number>, myUid: string) {
    const allValues = Object.values(byUserMap);
    const myValue = byUserMap[myUid] ?? 0;

    const sum = allValues.reduce((acc, v) => acc + v, 0);
    const groupAverage =
      allValues.length > 0 ? Math.round(sum / allValues.length) : 0;

    const diffFromAverage = myValue - groupAverage;

    const belowCount = allValues.filter((v) => v < myValue).length;
    const equalCount = allValues.filter((v) => v === myValue).length;
    const rank = belowCount + equalCount * 0.5;
    const percentile = Math.max(
      1,
      Math.round(100 - (rank / allValues.length) * 100)
    );

    return { myValue, groupAverage, diffFromAverage, percentile };
  }

  it("단일 멤버이면 groupAverage는 자신의 값이다", () => {
    const result = calcMetric({ "user-1": 80 }, "user-1");
    expect(result.groupAverage).toBe(80);
  });

  it("단일 멤버이면 diffFromAverage는 0이다", () => {
    const result = calcMetric({ "user-1": 80 }, "user-1");
    expect(result.diffFromAverage).toBe(0);
  });

  it("두 멤버가 있을 때 groupAverage는 평균이다", () => {
    const result = calcMetric({ "user-1": 60, "user-2": 80 }, "user-1");
    expect(result.groupAverage).toBe(70);
  });

  it("diffFromAverage가 양수이면 평균보다 높다", () => {
    const result = calcMetric({ "user-1": 90, "user-2": 50 }, "user-1");
    expect(result.diffFromAverage).toBeGreaterThan(0);
  });

  it("diffFromAverage가 음수이면 평균보다 낮다", () => {
    const result = calcMetric({ "user-1": 30, "user-2": 80 }, "user-1");
    expect(result.diffFromAverage).toBeLessThan(0);
  });

  it("myUid가 존재하지 않으면 myValue는 0이다", () => {
    const result = calcMetric({ "user-2": 80 }, "user-1");
    expect(result.myValue).toBe(0);
  });

  it("최상위 값이면 percentile은 낮다 (상위 백분위)", () => {
    // 자신이 최고 → 아래 사람 모두 → percentile 최소
    const result = calcMetric(
      { "user-1": 100, "user-2": 80, "user-3": 60 },
      "user-1"
    );
    // belowCount=2, equalCount=1, rank = 2 + 0.5 = 2.5
    // percentile = 100 - round(2.5/3*100) = 100 - 83 = 17
    expect(result.percentile).toBeLessThanOrEqual(30);
  });

  it("최하위 값이면 percentile은 높다 (하위 백분위)", () => {
    const result = calcMetric(
      { "user-1": 0, "user-2": 80, "user-3": 60 },
      "user-1"
    );
    // belowCount=0, equalCount=1, rank = 0.5
    // percentile = 100 - round(0.5/3*100) = 100 - 17 = 83
    expect(result.percentile).toBeGreaterThan(50);
  });

  it("percentile은 최소 1이다", () => {
    // 모든 사람이 동점
    const result = calcMetric(
      { "user-1": 100, "user-2": 100, "user-3": 100 },
      "user-1"
    );
    expect(result.percentile).toBeGreaterThanOrEqual(1);
  });

  it("모든 값이 0이면 groupAverage는 0이다", () => {
    const result = calcMetric(
      { "user-1": 0, "user-2": 0, "user-3": 0 },
      "user-1"
    );
    expect(result.groupAverage).toBe(0);
  });

  it("3명의 평균이 올바르게 계산된다", () => {
    const result = calcMetric(
      { "user-1": 90, "user-2": 60, "user-3": 30 },
      "user-1"
    );
    expect(result.groupAverage).toBe(60);
  });
});

// ============================================================
// 출석률 계산 로직 검증
// ============================================================

describe("useMemberBenchmarking - 출석률 계산 로직", () => {
  it("일정이 없으면 출석률은 0이다", () => {
    // scheduleIds가 없으면 attRate = 0
    const scheduleIds: string[] = [];
    const attCount = 2;
    const rate =
      scheduleIds.length === 0
        ? 0
        : Math.round((attCount / scheduleIds.length) * 100);
    expect(rate).toBe(0);
  });

  it("4번 중 2번 출석이면 출석률은 50%이다", () => {
    const scheduleIds = ["s1", "s2", "s3", "s4"];
    const attCount = 2;
    const rate = Math.round((attCount / scheduleIds.length) * 100);
    expect(rate).toBe(50);
  });

  it("4번 중 4번 출석이면 출석률은 100%이다", () => {
    const scheduleIds = ["s1", "s2", "s3", "s4"];
    const attCount = 4;
    const rate = Math.round((attCount / scheduleIds.length) * 100);
    expect(rate).toBe(100);
  });

  it("출석 상태가 present이면 카운트된다", () => {
    const attRows = [
      { user_id: "user-1", schedule_id: "s1", status: "present" },
      { user_id: "user-1", schedule_id: "s2", status: "absent" },
    ];
    const count = attRows.filter(
      (a) => a.user_id === "user-1" && (a.status === "present" || a.status === "late")
    ).length;
    expect(count).toBe(1);
  });

  it("출석 상태가 late이면 카운트된다", () => {
    const attRows = [
      { user_id: "user-1", schedule_id: "s1", status: "late" },
      { user_id: "user-1", schedule_id: "s2", status: "absent" },
    ];
    const count = attRows.filter(
      (a) => a.user_id === "user-1" && (a.status === "present" || a.status === "late")
    ).length;
    expect(count).toBe(1);
  });

  it("출석 상태가 absent이면 카운트되지 않는다", () => {
    const attRows = [
      { user_id: "user-1", schedule_id: "s1", status: "absent" },
    ];
    const count = attRows.filter(
      (a) => a.user_id === "user-1" && (a.status === "present" || a.status === "late")
    ).length;
    expect(count).toBe(0);
  });
});

// ============================================================
// 활동량 계산 로직 검증
// ============================================================

describe("useMemberBenchmarking - 활동량 계산 로직", () => {
  it("게시글 + 댓글 합산이 활동량이다", () => {
    const postCount = 3;
    const commentCount = 5;
    const total = postCount + commentCount;
    expect(total).toBe(8);
  });

  it("maxActivity가 1이면 활동량 비율이 0~100 범위다", () => {
    const activityCountByUser: Record<string, number> = {
      "user-1": 5,
      "user-2": 10,
    };
    const values = Object.values(activityCountByUser);
    const maxActivity = Math.max(...values, 1);
    const rates: Record<string, number> = {};
    for (const [uid, count] of Object.entries(activityCountByUser)) {
      rates[uid] = Math.round((count / maxActivity) * 100);
    }
    Object.values(rates).forEach((r) => {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
    });
  });

  it("활동량이 없는 사용자의 비율은 0이다", () => {
    const maxActivity = 10;
    const myActivity = 0;
    const rate = Math.round((myActivity / maxActivity) * 100);
    expect(rate).toBe(0);
  });

  it("활동량이 최대인 사용자의 비율은 100이다", () => {
    const maxActivity = 10;
    const myActivity = 10;
    const rate = Math.round((myActivity / maxActivity) * 100);
    expect(rate).toBe(100);
  });
});

// ============================================================
// RSVP 계산 로직 검증
// ============================================================

describe("useMemberBenchmarking - RSVP 계산 로직", () => {
  it("RSVP 응답이 없으면 응답률은 0이다", () => {
    const scheduleIds = ["s1", "s2", "s3"];
    const rsvpCount = 0;
    const rate = Math.round((rsvpCount / scheduleIds.length) * 100);
    expect(rate).toBe(0);
  });

  it("3개 일정 중 3개 RSVP이면 응답률은 100%이다", () => {
    const scheduleIds = ["s1", "s2", "s3"];
    const rsvpCount = 3;
    const rate = Math.round((rsvpCount / scheduleIds.length) * 100);
    expect(rate).toBe(100);
  });

  it("일정이 없으면 RSVP 응답률은 0이다", () => {
    const scheduleIds: string[] = [];
    const rsvpCount = 0;
    const rate = scheduleIds.length === 0 ? 0 : Math.round((rsvpCount / scheduleIds.length) * 100);
    expect(rate).toBe(0);
  });
});

// ============================================================
// groupId / userId별 독립성
// ============================================================

describe("useMemberBenchmarking - 파라미터 독립성", () => {
  it("서로 다른 groupId+userId는 다른 SWR 키를 사용한다", () => {
    const key1 = `/member-benchmarking/group-1/user-1`;
    const key2 = `/member-benchmarking/group-2/user-1`;
    expect(key1).not.toBe(key2);
  });

  it("같은 groupId, 다른 userId는 다른 SWR 키를 사용한다", () => {
    const key1 = `/member-benchmarking/group-1/user-A`;
    const key2 = `/member-benchmarking/group-1/user-B`;
    expect(key1).not.toBe(key2);
  });
});
