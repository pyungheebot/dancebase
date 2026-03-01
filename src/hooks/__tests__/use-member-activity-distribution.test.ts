import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── SWR mock ─────────────────────────────────────────────────
type FetcherFn = () => unknown;
type SWRResult = { data: unknown; isLoading: boolean; mutate: ReturnType<typeof vi.fn> };
const swrHandlers: Record<string, { fetcher: FetcherFn; result: SWRResult }> = {};

vi.mock("swr", () => ({
  default: (key: string | null, fetcher: FetcherFn | null) => {
    if (!key || !fetcher) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    const mutate = vi.fn();
    const handler = { fetcher, result: { data: undefined, isLoading: false, mutate } };
    swrHandlers[key] = handler;
    return handler.result;
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    memberActivityDistribution: (groupId: string) =>
      `member-activity-distribution-${groupId}`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
// 각 테스트에서 mockSupabase를 재정의하여 다른 데이터를 반환할 수 있게 함
let mockMemberRows: unknown[] | null = null;
let mockAttRows: unknown[] | null = null;
let mockPostRows: unknown[] | null = null;
let mockCommentRows: unknown[] | null = null;
let mockRsvpRows: unknown[] | null = null;
let mockScheduleRows: unknown[] | null = null;
let memberError = false;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (_col: string, _val: unknown) => ({
          eq: (_c2: string, _v2: unknown) => ({
            gte: () => ({ is: () => Promise.resolve({ data: mockPostRows, error: null }) }),
            is: () => Promise.resolve({ data: mockPostRows, error: null }),
          }),
          gte: (_col2: string, _val2: unknown) => {
            if (table === "schedules") return Promise.resolve({ data: mockScheduleRows, error: null });
            return Promise.resolve({ data: mockAttRows, error: null });
          },
          in: (_col2: string, _ids: unknown[]) => ({
            eq: (_c3: string, _v3: unknown) => ({
              in: (_c4: string, _ids2: unknown[]) => ({
                eq: (_c5: string, _v5: unknown) =>
                  Promise.resolve({ data: mockAttRows, error: null }),
              }),
            }),
            in: (_c4: string, _ids2: unknown[]) =>
              Promise.resolve({ data: mockRsvpRows, error: null }),
          }),
        }),
        in: (_col: string, _ids: unknown[]) => ({
          in: (_c2: string, _ids2: unknown[]) => ({
            gte: () => ({ is: () => Promise.resolve({ data: mockCommentRows, error: null }) }),
            eq: (_c3: string, _v3: unknown) =>
              Promise.resolve({ data: mockAttRows, error: null }),
          }),
          gte: () => ({ is: () => Promise.resolve({ data: mockCommentRows, error: null }) }),
        }),
      }),
    }),
  }),
}));

import { useMemberActivityDistribution } from "@/hooks/use-member-activity-distribution";

// ─── 순수 계산 함수 직접 복제 ────────────────────────────────
type MemberActivityGrade = "매우 활발" | "활발" | "보통" | "저조";

function calcGrade(idx: number, total: number): MemberActivityGrade {
  const top20Idx = Math.ceil(total * 0.2);
  const top50Idx = Math.ceil(total * 0.5);
  const top80Idx = Math.ceil(total * 0.8);
  if (idx < top20Idx) return "매우 활발";
  if (idx < top50Idx) return "활발";
  if (idx < top80Idx) return "보통";
  return "저조";
}

function calcTotalScore(
  attendance: number,
  posts: number,
  comments: number,
  rsvp: number
): number {
  return attendance * 3 + posts * 2 + comments * 1 + rsvp * 1;
}

function calcAvgScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ============================================================
// 순수 계산 함수 - calcGrade (등급 분류)
// ============================================================

describe("calcGrade - 등급 분류 로직", () => {
  it("1명일 때 0번 인덱스는 '매우 활발'이다", () => {
    expect(calcGrade(0, 1)).toBe("매우 활발");
  });

  it("10명일 때 0번 인덱스는 '매우 활발'이다 (상위 20%)", () => {
    expect(calcGrade(0, 10)).toBe("매우 활발");
  });

  it("10명일 때 2번 인덱스(상위 20~50%)는 '활발'이다", () => {
    expect(calcGrade(2, 10)).toBe("활발");
  });

  it("10명일 때 5번 인덱스(상위 50~80%)는 '보통'이다", () => {
    expect(calcGrade(5, 10)).toBe("보통");
  });

  it("10명일 때 8번 인덱스(하위 20%)는 '저조'이다", () => {
    expect(calcGrade(8, 10)).toBe("저조");
  });

  it("5명일 때 0번 인덱스는 '매우 활발'이다", () => {
    expect(calcGrade(0, 5)).toBe("매우 활발");
  });

  it("5명일 때 4번 인덱스는 '저조'이다", () => {
    expect(calcGrade(4, 5)).toBe("저조");
  });

  it("ceil(20% * 100) = 20명이 '매우 활발' 경계", () => {
    // 100명 중 20번 인덱스는 ceil(100*0.2)=20이므로 경계
    expect(calcGrade(19, 100)).toBe("매우 활발");
    expect(calcGrade(20, 100)).toBe("활발");
  });
});

// ============================================================
// 순수 계산 함수 - calcTotalScore (활동 점수)
// ============================================================

describe("calcTotalScore - 활동 점수 계산", () => {
  it("출석 1회 = 3점", () => {
    expect(calcTotalScore(1, 0, 0, 0)).toBe(3);
  });

  it("게시글 1개 = 2점", () => {
    expect(calcTotalScore(0, 1, 0, 0)).toBe(2);
  });

  it("댓글 1개 = 1점", () => {
    expect(calcTotalScore(0, 0, 1, 0)).toBe(1);
  });

  it("RSVP 1개 = 1점", () => {
    expect(calcTotalScore(0, 0, 0, 1)).toBe(1);
  });

  it("모든 활동 1회씩 = 7점", () => {
    expect(calcTotalScore(1, 1, 1, 1)).toBe(7);
  });

  it("모두 0이면 0점", () => {
    expect(calcTotalScore(0, 0, 0, 0)).toBe(0);
  });

  it("출석 10회 = 30점", () => {
    expect(calcTotalScore(10, 0, 0, 0)).toBe(30);
  });

  it("게시글 5개 + 댓글 3개 = 13점", () => {
    expect(calcTotalScore(0, 5, 3, 0)).toBe(13);
  });
});

// ============================================================
// 순수 계산 함수 - calcAvgScore (평균 점수)
// ============================================================

describe("calcAvgScore - 평균 점수 계산", () => {
  it("빈 배열이면 0을 반환한다", () => {
    expect(calcAvgScore([])).toBe(0);
  });

  it("단일 값이면 그 값을 반환한다", () => {
    expect(calcAvgScore([10])).toBe(10);
  });

  it("[10, 20]의 평균은 15이다", () => {
    expect(calcAvgScore([10, 20])).toBe(15);
  });

  it("소수점은 반올림된다", () => {
    // (10 + 20 + 30) / 3 = 20
    expect(calcAvgScore([10, 20, 30])).toBe(20);
    // (1 + 2) / 2 = 1.5 → 2
    expect(calcAvgScore([1, 2])).toBe(2);
  });

  it("모두 같은 값이면 그 값을 반환한다", () => {
    expect(calcAvgScore([5, 5, 5])).toBe(5);
  });
});

// ============================================================
// useMemberActivityDistribution - 초기 상태 (EMPTY_RESULT)
// ============================================================

describe("useMemberActivityDistribution - 초기/빈 상태", () => {
  beforeEach(() => {
    Object.keys(swrHandlers).forEach((k) => delete swrHandlers[k]);
    mockMemberRows = null;
    memberError = false;
  });

  it("초기 distribution.totalMembers는 0이다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    expect(result.current.distribution.totalMembers).toBe(0);
  });

  it("초기 distribution.avgScore는 0이다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    expect(result.current.distribution.avgScore).toBe(0);
  });

  it("초기 distribution.top5는 빈 배열이다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    expect(result.current.distribution.top5).toEqual([]);
  });

  it("초기 distribution.gradeSummary는 4개 등급을 포함한다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    expect(result.current.distribution.gradeSummary).toHaveLength(4);
  });

  it("초기 gradeSummary 각 등급의 count는 0이다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    result.current.distribution.gradeSummary.forEach((s) => {
      expect(s.count).toBe(0);
    });
  });

  it("gradeSummary 등급 순서는 '매우 활발', '활발', '보통', '저조'이다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    const grades = result.current.distribution.gradeSummary.map((s) => s.grade);
    expect(grades).toEqual(["매우 활발", "활발", "보통", "저조"]);
  });

  it("각 등급에 color 속성이 있다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    result.current.distribution.gradeSummary.forEach((s) => {
      expect(s.color).toBeTruthy();
    });
  });

  it("'매우 활발' 등급은 green 계열 색상이다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    const veryActive = result.current.distribution.gradeSummary.find(
      (s) => s.grade === "매우 활발"
    );
    expect(veryActive?.color).toContain("green");
  });

  it("'활발' 등급은 blue 계열 색상이다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    const active = result.current.distribution.gradeSummary.find(
      (s) => s.grade === "활발"
    );
    expect(active?.color).toContain("blue");
  });

  it("'보통' 등급은 yellow 계열 색상이다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    const normal = result.current.distribution.gradeSummary.find(
      (s) => s.grade === "보통"
    );
    expect(normal?.color).toContain("yellow");
  });

  it("'저조' 등급은 red 계열 색상이다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    const low = result.current.distribution.gradeSummary.find(
      (s) => s.grade === "저조"
    );
    expect(low?.color).toContain("red");
  });

  it("loading 상태 속성이 존재한다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() =>
      useMemberActivityDistribution("group-1")
    );
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// 점수 가중치 검증
// ============================================================

describe("활동 점수 가중치 체계 검증", () => {
  it("출석은 게시글보다 높은 가중치(3 > 2)를 가진다", () => {
    const attendanceScore = calcTotalScore(1, 0, 0, 0);
    const postScore = calcTotalScore(0, 1, 0, 0);
    expect(attendanceScore).toBeGreaterThan(postScore);
  });

  it("게시글은 댓글보다 높은 가중치(2 > 1)를 가진다", () => {
    const postScore = calcTotalScore(0, 1, 0, 0);
    const commentScore = calcTotalScore(0, 0, 1, 0);
    expect(postScore).toBeGreaterThan(commentScore);
  });

  it("댓글과 RSVP는 같은 가중치(1 = 1)를 가진다", () => {
    const commentScore = calcTotalScore(0, 0, 1, 0);
    const rsvpScore = calcTotalScore(0, 0, 0, 1);
    expect(commentScore).toBe(rsvpScore);
  });
});
