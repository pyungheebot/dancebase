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
    boardTrendAnalytics: (groupId: string) =>
      `/groups/${groupId}/board-trend-analytics`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useBoardTrendAnalytics } from "@/hooks/use-board-trend-analytics";
import type {
  BoardTrendResult,
  BoardTrendWeekData,
  BoardTrendTopAuthor,
  BoardTrendPopularPost,
} from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useBoardTrendAnalytics(groupId));
}

// ============================================================
// useBoardTrendAnalytics - 초기 상태
// ============================================================

describe("useBoardTrendAnalytics - 초기 상태", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 trend는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.trend).toBeNull();
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("groupId가 빈 문자열이어도 훅이 오류 없이 초기화된다", () => {
    const { result } = renderHook(() => useBoardTrendAnalytics(""));
    expect(result.current.trend).toBeNull();
  });

  it("trend가 null이면 weeklyTrend에 접근 불가하다 (null 체크 필요)", () => {
    const { result } = makeHook();
    expect(result.current.trend?.weeklyTrend).toBeUndefined();
  });
});

// ============================================================
// useBoardTrendAnalytics - 데이터 구조 검증 (BoardTrendResult 형식)
// ============================================================

describe("useBoardTrendAnalytics - BoardTrendResult 데이터 구조", () => {
  it("BoardTrendResult는 weeklyTrend 배열을 포함한다", () => {
    const result: BoardTrendResult = {
      weeklyTrend: [],
      dayOfWeekPattern: [0, 0, 0, 0, 0, 0, 0],
      topAuthors: [],
      popularPosts: [],
      totalPosts: 0,
      totalComments: 0,
      avgCommentsPerPost: 0,
      uniqueAuthors: 0,
    };
    expect(Array.isArray(result.weeklyTrend)).toBe(true);
  });

  it("BoardTrendResult는 dayOfWeekPattern 배열(7개)을 포함한다", () => {
    const result: BoardTrendResult = {
      weeklyTrend: [],
      dayOfWeekPattern: [0, 0, 0, 0, 0, 0, 0],
      topAuthors: [],
      popularPosts: [],
      totalPosts: 0,
      totalComments: 0,
      avgCommentsPerPost: 0,
      uniqueAuthors: 0,
    };
    expect(result.dayOfWeekPattern).toHaveLength(7);
  });

  it("BoardTrendResult는 topAuthors 배열을 포함한다", () => {
    const result: BoardTrendResult = {
      weeklyTrend: [],
      dayOfWeekPattern: [0, 0, 0, 0, 0, 0, 0],
      topAuthors: [],
      popularPosts: [],
      totalPosts: 0,
      totalComments: 0,
      avgCommentsPerPost: 0,
      uniqueAuthors: 0,
    };
    expect(Array.isArray(result.topAuthors)).toBe(true);
  });

  it("BoardTrendResult는 popularPosts 배열을 포함한다", () => {
    const result: BoardTrendResult = {
      weeklyTrend: [],
      dayOfWeekPattern: [0, 0, 0, 0, 0, 0, 0],
      topAuthors: [],
      popularPosts: [],
      totalPosts: 0,
      totalComments: 0,
      avgCommentsPerPost: 0,
      uniqueAuthors: 0,
    };
    expect(Array.isArray(result.popularPosts)).toBe(true);
  });
});

// ============================================================
// useBoardTrendAnalytics - weeklyTrend 계산 로직 (4주)
// ============================================================

describe("useBoardTrendAnalytics - 주간 트렌드 계산 로직", () => {
  it("weeklyTrend는 4개 항목을 가진다", () => {
    // 실제 계산 로직 재현
    const weeklyTrend: BoardTrendWeekData[] = [];
    for (let i = 3; i >= 0; i--) {
      const label = i === 0 ? "이번 주" : `${i}주 전`;
      weeklyTrend.push({ weekLabel: label, postCount: 0, commentCount: 0 });
    }
    expect(weeklyTrend).toHaveLength(4);
  });

  it("주간 레이블은 이번 주, 1주 전, 2주 전, 3주 전 순서이다", () => {
    const labels: string[] = [];
    for (let i = 3; i >= 0; i--) {
      labels.push(i === 0 ? "이번 주" : `${i}주 전`);
    }
    expect(labels).toEqual(["3주 전", "2주 전", "1주 전", "이번 주"]);
  });

  it("i=0일 때 레이블은 '이번 주'이다", () => {
    const label = (i: number) => (i === 0 ? "이번 주" : `${i}주 전`);
    expect(label(0)).toBe("이번 주");
  });

  it("i=1일 때 레이블은 '1주 전'이다", () => {
    const label = (i: number) => (i === 0 ? "이번 주" : `${i}주 전`);
    expect(label(1)).toBe("1주 전");
  });

  it("i=3일 때 레이블은 '3주 전'이다", () => {
    const label = (i: number) => (i === 0 ? "이번 주" : `${i}주 전`);
    expect(label(3)).toBe("3주 전");
  });

  it("weeklyTrend 각 항목은 weekLabel, postCount, commentCount를 가진다", () => {
    const item: BoardTrendWeekData = {
      weekLabel: "이번 주",
      postCount: 5,
      commentCount: 10,
    };
    expect(item).toHaveProperty("weekLabel");
    expect(item).toHaveProperty("postCount");
    expect(item).toHaveProperty("commentCount");
  });
});

// ============================================================
// useBoardTrendAnalytics - 요일별 패턴 계산 로직
// ============================================================

describe("useBoardTrendAnalytics - 요일별 패턴 계산 로직", () => {
  it("dayOfWeekPattern 초기값은 7개의 0으로 구성된다", () => {
    const pattern = [0, 0, 0, 0, 0, 0, 0];
    expect(pattern).toHaveLength(7);
    expect(pattern.every((v) => v === 0)).toBe(true);
  });

  it("요일 인덱스는 0(일)~6(토)이다", () => {
    const date = new Date("2026-03-01T00:00:00Z"); // 일요일
    expect(date.getDay()).toBe(0);
  });

  it("월요일(1)에 게시글이 작성되면 pattern[1]이 증가한다", () => {
    const pattern = [0, 0, 0, 0, 0, 0, 0];
    const mondayDate = new Date("2026-03-02T10:00:00Z"); // 월요일
    pattern[mondayDate.getDay()]++;
    expect(pattern[1]).toBe(1);
  });

  it("동일 요일에 여러 활동이 있으면 누적 계산된다", () => {
    const pattern = [0, 0, 0, 0, 0, 0, 0];
    // 모두 월요일(1)로 가정
    const posts = [
      { created_at: "2026-03-02T10:00:00Z" },
      { created_at: "2026-03-09T10:00:00Z" },
    ];
    for (const p of posts) {
      pattern[new Date(p.created_at).getDay()]++;
    }
    expect(pattern[1]).toBe(2);
  });
});

// ============================================================
// useBoardTrendAnalytics - 작성자 집계 로직
// ============================================================

describe("useBoardTrendAnalytics - 작성자 집계 로직", () => {
  it("상위 5명만 반환된다", () => {
    type AuthorStat = { userId: string; name: string; postCount: number; commentCount: number };
    const authorMap = new Map<string, { name: string; postCount: number; commentCount: number }>();
    // 6명의 저자 데이터 추가
    for (let i = 1; i <= 6; i++) {
      authorMap.set(`user-${i}`, { name: `사용자${i}`, postCount: i, commentCount: 0 });
    }
    const topAuthors: BoardTrendTopAuthor[] = Array.from(authorMap.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.postCount + b.commentCount - (a.postCount + a.commentCount))
      .slice(0, 5);
    expect(topAuthors).toHaveLength(5);
  });

  it("작성자는 postCount + commentCount 내림차순으로 정렬된다", () => {
    type AuthorStat = { userId: string; name: string; postCount: number; commentCount: number };
    const authors: AuthorStat[] = [
      { userId: "u1", name: "앨리스", postCount: 2, commentCount: 1 },
      { userId: "u2", name: "밥", postCount: 5, commentCount: 0 },
      { userId: "u3", name: "찰리", postCount: 1, commentCount: 3 },
    ];
    authors.sort((a, b) => b.postCount + b.commentCount - (a.postCount + a.commentCount));
    expect(authors[0].userId).toBe("u2"); // 5
    expect(authors[1].userId).toBe("u3"); // 4
    expect(authors[2].userId).toBe("u1"); // 3
  });

  it("profiles가 배열이면 첫 번째 요소를 사용한다 (resolveProfile)", () => {
    type Profile = { id: string; name: string };
    function resolveProfile(
      profiles: Profile | Profile[] | null
    ): Profile | null {
      if (!profiles) return null;
      return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
    }
    const profiles = [{ id: "p1", name: "앨리스" }, { id: "p2", name: "밥" }];
    expect(resolveProfile(profiles)?.name).toBe("앨리스");
  });

  it("profiles가 null이면 resolveProfile은 null을 반환한다", () => {
    type Profile = { id: string; name: string };
    function resolveProfile(
      profiles: Profile | Profile[] | null
    ): Profile | null {
      if (!profiles) return null;
      return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
    }
    expect(resolveProfile(null)).toBeNull();
  });

  it("profiles가 객체이면 그대로 반환한다 (resolveProfile)", () => {
    type Profile = { id: string; name: string };
    function resolveProfile(
      profiles: Profile | Profile[] | null
    ): Profile | null {
      if (!profiles) return null;
      return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
    }
    const profile = { id: "p1", name: "앨리스" };
    expect(resolveProfile(profile)?.name).toBe("앨리스");
  });

  it("profiles가 빈 배열이면 null을 반환한다 (resolveProfile)", () => {
    type Profile = { id: string; name: string };
    function resolveProfile(
      profiles: Profile | Profile[] | null
    ): Profile | null {
      if (!profiles) return null;
      return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
    }
    expect(resolveProfile([])).toBeNull();
  });
});

// ============================================================
// useBoardTrendAnalytics - 인기 게시글 계산 로직
// ============================================================

describe("useBoardTrendAnalytics - 인기 게시글 계산 로직", () => {
  it("인기 게시글은 댓글 수 기준 상위 3개이다", () => {
    const commentCountByPost = new Map<string, number>([
      ["post-1", 5],
      ["post-2", 10],
      ["post-3", 3],
      ["post-4", 8],
    ]);
    const postIds = ["post-1", "post-2", "post-3", "post-4"];
    const top3 = postIds
      .map((id) => ({ id, commentCount: commentCountByPost.get(id) ?? 0 }))
      .sort((a, b) => b.commentCount - a.commentCount)
      .slice(0, 3)
      .filter((p) => p.commentCount > 0);
    expect(top3).toHaveLength(3);
    expect(top3[0].id).toBe("post-2");
  });

  it("댓글이 0인 게시글은 인기 게시글 목록에서 제외된다", () => {
    const commentCountByPost = new Map<string, number>([["post-1", 0]]);
    const postIds = ["post-1"];
    const top3 = postIds
      .map((id) => ({ id, commentCount: commentCountByPost.get(id) ?? 0 }))
      .filter((p) => p.commentCount > 0);
    expect(top3).toHaveLength(0);
  });

  it("BoardTrendPopularPost 구조는 postId, title, commentCount, authorName을 포함한다", () => {
    const post: BoardTrendPopularPost = {
      postId: "p1",
      title: "제목",
      commentCount: 5,
      authorName: "앨리스",
    };
    expect(post).toHaveProperty("postId");
    expect(post).toHaveProperty("title");
    expect(post).toHaveProperty("commentCount");
    expect(post).toHaveProperty("authorName");
  });

  it("title이 null이면 '(제목 없음)'으로 대체된다", () => {
    const title = null ?? "(제목 없음)";
    expect(title).toBe("(제목 없음)");
  });
});

// ============================================================
// useBoardTrendAnalytics - 요약 통계 계산 로직
// ============================================================

describe("useBoardTrendAnalytics - 요약 통계 계산 로직", () => {
  it("totalPosts가 0이면 avgCommentsPerPost는 0이다", () => {
    const totalPosts = 0;
    const totalComments = 5;
    const avg = totalPosts > 0 ? Math.round((totalComments / totalPosts) * 10) / 10 : 0;
    expect(avg).toBe(0);
  });

  it("avgCommentsPerPost는 소수점 1자리로 반올림된다", () => {
    const totalPosts = 3;
    const totalComments = 10;
    const avg = totalPosts > 0 ? Math.round((totalComments / totalPosts) * 10) / 10 : 0;
    expect(avg).toBe(3.3);
  });

  it("uniqueAuthors는 게시글+댓글 작성자의 고유 수이다", () => {
    const postAuthorIds = ["user-1", "user-2", "user-1"];
    const commentAuthorIds = ["user-2", "user-3"];
    const uniqueAuthors = new Set([...postAuthorIds, ...commentAuthorIds]).size;
    expect(uniqueAuthors).toBe(3);
  });

  it("author_id가 빈 값이면 uniqueAuthors에서 제외된다", () => {
    const postAuthorIds = ["user-1", "", "user-2"];
    const filtered = postAuthorIds.filter((id) => Boolean(id));
    const uniqueAuthors = new Set(filtered).size;
    expect(uniqueAuthors).toBe(2);
  });

  it("BoardTrendTopAuthor 구조는 userId, name, postCount, commentCount를 포함한다", () => {
    const author: BoardTrendTopAuthor = {
      userId: "u1",
      name: "앨리스",
      postCount: 3,
      commentCount: 5,
    };
    expect(author).toHaveProperty("userId");
    expect(author).toHaveProperty("name");
    expect(author).toHaveProperty("postCount");
    expect(author).toHaveProperty("commentCount");
  });
});

// ============================================================
// useBoardTrendAnalytics - 날짜 범위 계산 로직
// ============================================================

describe("useBoardTrendAnalytics - 30일 범위 계산 로직", () => {
  it("30일 전 날짜는 현재보다 이전이다", () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    expect(thirtyDaysAgo < now).toBe(true);
  });

  it("30일 전 ISO 문자열은 올바른 형식이다", () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const iso = thirtyDaysAgo.toISOString();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("주간 시작일은 종료일보다 6일 이전이다", () => {
    const weekEnd = new Date("2026-03-09T23:59:59.999Z");
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    const diffDays = Math.round(
      (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(6);
  });

  it("postList 필터링: 날짜 범위 내 게시글만 카운트된다", () => {
    const weekStartISO = "2026-03-01T00:00:00.000Z";
    const weekEndISO = "2026-03-07T23:59:59.999Z";
    const posts = [
      { created_at: "2026-03-03T10:00:00.000Z" }, // 포함
      { created_at: "2026-03-10T10:00:00.000Z" }, // 제외
    ];
    const count = posts.filter(
      (p) => p.created_at >= weekStartISO && p.created_at <= weekEndISO
    ).length;
    expect(count).toBe(1);
  });
});
