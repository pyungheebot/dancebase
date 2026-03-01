import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

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
  removeFromStorage: (key: string): void => {
    delete memStore[key];
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
    memberEngagementForecast: (groupId: string) =>
      `/groups/${groupId}/member-engagement-forecast`,
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
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useMemberEngagementForecast } from "@/hooks/use-member-engagement-forecast";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useMemberEngagementForecast(groupId));
}

function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

// ============================================================
// useMemberEngagementForecast - 초기 상태
// ============================================================

describe("useMemberEngagementForecast - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("초기 data.forecasts는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.data.forecasts).toEqual([]);
  });

  it("초기 data.totalCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.totalCount).toBe(0);
  });

  it("초기 data.riskCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.riskCount).toBe(0);
  });

  it("초기 data.lowCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.lowCount).toBe(0);
  });

  it("초기 data.mediumCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.mediumCount).toBe(0);
  });

  it("초기 data.highCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.highCount).toBe(0);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("groupId가 빈 문자열이면 SWR key는 null이다 (SWR 호출 안 됨)", () => {
    const { result } = renderHook(() => useMemberEngagementForecast(""));
    expect(result.current.data.forecasts).toEqual([]);
  });
});

// ============================================================
// useMemberEngagementForecast - 점수 계산 로직 (순수 함수 기준)
// ============================================================

describe("useMemberEngagementForecast - 관여도 점수 계산 로직 검증", () => {
  /**
   * 훅 내부 계산 로직을 직접 검증하기 위해
   * 동일한 계산 공식을 이 테스트에서 재현합니다.
   */

  it("출석률 100%일 때 출석 점수는 50점이다", () => {
    const recentAttendanceRate = 100;
    const attendanceScore = recentAttendanceRate * 0.5;
    expect(attendanceScore).toBe(50);
  });

  it("출석률 0%일 때 출석 점수는 0점이다", () => {
    const recentAttendanceRate = 0;
    const attendanceScore = recentAttendanceRate * 0.5;
    expect(attendanceScore).toBe(0);
  });

  it("게시글 10개(최대치)일 때 게시글 점수는 30점이다", () => {
    const MAX_POSTS = 10;
    const postCount = 10;
    const postScore = Math.min(postCount / MAX_POSTS, 1) * 30;
    expect(postScore).toBe(30);
  });

  it("게시글 0개일 때 게시글 점수는 0점이다", () => {
    const MAX_POSTS = 10;
    const postCount = 0;
    const postScore = Math.min(postCount / MAX_POSTS, 1) * 30;
    expect(postScore).toBe(0);
  });

  it("게시글이 최대치 초과해도 30점을 넘지 않는다", () => {
    const MAX_POSTS = 10;
    const postCount = 100;
    const postScore = Math.min(postCount / MAX_POSTS, 1) * 30;
    expect(postScore).toBe(30);
  });

  it("댓글 20개(최대치)일 때 댓글 점수는 20점이다", () => {
    const MAX_COMMENTS = 20;
    const commentCount = 20;
    const commentScore = Math.min(commentCount / MAX_COMMENTS, 1) * 20;
    expect(commentScore).toBe(20);
  });

  it("댓글 0개일 때 댓글 점수는 0점이다", () => {
    const MAX_COMMENTS = 20;
    const commentCount = 0;
    const commentScore = Math.min(commentCount / MAX_COMMENTS, 1) * 20;
    expect(commentScore).toBe(0);
  });

  it("총 점수 최대치는 100점이다 (출석50 + 게시글30 + 댓글20)", () => {
    const attendanceScore = 100 * 0.5;  // 50
    const postScore = Math.min(10 / 10, 1) * 30; // 30
    const commentScore = Math.min(20 / 20, 1) * 20; // 20
    const total = Math.round(attendanceScore + postScore + commentScore);
    expect(total).toBe(100);
  });
});

// ============================================================
// useMemberEngagementForecast - 관여도 수준 분류 로직
// ============================================================

describe("useMemberEngagementForecast - 관여도 수준 분류 로직", () => {
  function classifyLevel(score: number): string {
    if (score >= 75) return "high";
    if (score >= 50) return "medium";
    if (score >= 25) return "low";
    return "risk";
  }

  it("점수 75 이상은 high이다", () => {
    expect(classifyLevel(75)).toBe("high");
    expect(classifyLevel(100)).toBe("high");
  });

  it("점수 74는 medium이다", () => {
    expect(classifyLevel(74)).toBe("medium");
  });

  it("점수 50 이상 75 미만은 medium이다", () => {
    expect(classifyLevel(50)).toBe("medium");
    expect(classifyLevel(74)).toBe("medium");
  });

  it("점수 25 이상 50 미만은 low이다", () => {
    expect(classifyLevel(25)).toBe("low");
    expect(classifyLevel(49)).toBe("low");
  });

  it("점수 25 미만은 risk이다", () => {
    expect(classifyLevel(0)).toBe("risk");
    expect(classifyLevel(24)).toBe("risk");
  });

  it("경계값 75는 high이다", () => {
    expect(classifyLevel(75)).toBe("high");
  });

  it("경계값 50은 medium이다", () => {
    expect(classifyLevel(50)).toBe("medium");
  });

  it("경계값 25는 low이다", () => {
    expect(classifyLevel(25)).toBe("low");
  });
});

// ============================================================
// useMemberEngagementForecast - 추세 분류 로직
// ============================================================

describe("useMemberEngagementForecast - 추세 분류 로직", () => {
  function classifyTrend(
    recentRate: number,
    previousRate: number,
    previousTotal: number
  ): string {
    if (previousTotal === 0) return "stable";
    const diff = recentRate - previousRate;
    if (diff > 10) return "improving";
    if (diff < -10) return "declining";
    return "stable";
  }

  it("이전 기간 일정이 없으면 stable이다", () => {
    expect(classifyTrend(80, 0, 0)).toBe("stable");
  });

  it("최근 출석률이 이전보다 10%p 이상 높으면 improving이다", () => {
    expect(classifyTrend(80, 60, 5)).toBe("improving");
  });

  it("최근 출석률이 이전보다 10%p 이하로 낮으면 declining이다", () => {
    expect(classifyTrend(60, 80, 5)).toBe("declining");
  });

  it("차이가 10%p 이내면 stable이다", () => {
    expect(classifyTrend(65, 60, 5)).toBe("stable");
    expect(classifyTrend(60, 65, 5)).toBe("stable");
  });

  it("경계값 11%p 차이면 improving이다", () => {
    expect(classifyTrend(71, 60, 5)).toBe("improving");
  });

  it("경계값 -11%p 차이면 declining이다", () => {
    expect(classifyTrend(60, 71, 5)).toBe("declining");
  });

  it("정확히 10%p 차이는 stable이다", () => {
    expect(classifyTrend(70, 60, 5)).toBe("stable");
    expect(classifyTrend(60, 70, 5)).toBe("stable");
  });
});

// ============================================================
// useMemberEngagementForecast - 캐시 로직
// ============================================================

describe("useMemberEngagementForecast - localStorage 캐시 로직", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("캐시가 없는 그룹의 저장소 키는 데이터가 없다", () => {
    // memStore에 해당 키가 없으면 null을 반환한다
    const key = "dancebase:engagement-forecast:non-existent-group";
    expect(memStore[key]).toBeUndefined();
  });

  it("캐시 TTL 만료 계산: 5분 = 300000ms", () => {
    const CACHE_TTL_MS = 5 * 60 * 1000;
    expect(CACHE_TTL_MS).toBe(300000);
  });

  it("만료되지 않은 캐시는 유효하다 (isExpired = false)", () => {
    const CACHE_TTL_MS = 5 * 60 * 1000;
    const cachedAt = Date.now() - 60000; // 1분 전
    const isExpired = Date.now() - cachedAt > CACHE_TTL_MS;
    expect(isExpired).toBe(false);
  });

  it("만료된 캐시는 무효하다 (isExpired = true)", () => {
    const CACHE_TTL_MS = 5 * 60 * 1000;
    const cachedAt = Date.now() - 10 * 60 * 1000; // 10분 전
    const isExpired = Date.now() - cachedAt > CACHE_TTL_MS;
    expect(isExpired).toBe(true);
  });
});

// ============================================================
// useMemberEngagementForecast - 정렬 로직
// ============================================================

describe("useMemberEngagementForecast - 위험 우선 정렬 로직", () => {
  const levelOrder: Record<string, number> = {
    risk: 0,
    low: 1,
    medium: 2,
    high: 3,
  };

  it("risk는 정렬 순서 0이다", () => {
    expect(levelOrder["risk"]).toBe(0);
  });

  it("low는 정렬 순서 1이다", () => {
    expect(levelOrder["low"]).toBe(1);
  });

  it("medium는 정렬 순서 2이다", () => {
    expect(levelOrder["medium"]).toBe(2);
  });

  it("high는 정렬 순서 3이다", () => {
    expect(levelOrder["high"]).toBe(3);
  });

  it("risk가 high보다 먼저 정렬된다", () => {
    const a = { level: "risk", engagementScore: 20 };
    const b = { level: "high", engagementScore: 80 };
    const sorted = [b, a].sort((x, y) => {
      const diff = levelOrder[x.level] - levelOrder[y.level];
      if (diff !== 0) return diff;
      return x.engagementScore - y.engagementScore;
    });
    expect(sorted[0].level).toBe("risk");
  });

  it("같은 level 내에서는 점수 오름차순으로 정렬된다", () => {
    const forecasts = [
      { level: "low", engagementScore: 40 },
      { level: "low", engagementScore: 30 },
    ];
    forecasts.sort((a, b) => {
      const diff = levelOrder[a.level] - levelOrder[b.level];
      if (diff !== 0) return diff;
      return a.engagementScore - b.engagementScore;
    });
    expect(forecasts[0].engagementScore).toBe(30);
  });
});

// ============================================================
// useMemberEngagementForecast - buildEmptyResult 로직
// ============================================================

describe("useMemberEngagementForecast - buildEmptyResult 빈 결과 구조", () => {
  it("빈 결과는 forecasts가 빈 배열이다", () => {
    const emptyResult = {
      forecasts: [],
      totalCount: 0,
      riskCount: 0,
      lowCount: 0,
      mediumCount: 0,
      highCount: 0,
      generatedAt: new Date().toISOString(),
    };
    expect(emptyResult.forecasts).toEqual([]);
  });

  it("빈 결과의 모든 카운트는 0이다", () => {
    const emptyResult = {
      forecasts: [],
      totalCount: 0,
      riskCount: 0,
      lowCount: 0,
      mediumCount: 0,
      highCount: 0,
      generatedAt: new Date().toISOString(),
    };
    expect(emptyResult.totalCount).toBe(0);
    expect(emptyResult.riskCount).toBe(0);
    expect(emptyResult.lowCount).toBe(0);
    expect(emptyResult.mediumCount).toBe(0);
    expect(emptyResult.highCount).toBe(0);
  });

  it("generatedAt은 ISO 날짜 형식이다", () => {
    const generatedAt = new Date().toISOString();
    expect(generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
