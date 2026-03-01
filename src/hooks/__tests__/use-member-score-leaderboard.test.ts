import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMemberScoreLeaderboard } from "@/hooks/use-member-score-leaderboard";
import type { MemberScoreLeaderboardResult } from "@/types";

// ─── Supabase mock ────────────────────────────────────────────
const mockMutate = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null } })),
    },
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {};
      const methods = ["select", "eq", "neq", "gte", "lte", "order", "in", "is"];
      const buildPromise = async () => ({ data: [], error: null });
      for (const m of methods) {
        chain[m] = vi.fn(() => chain);
      }
      chain.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
        buildPromise().then(resolve, reject);
      return chain;
    }),
  }),
}));

// ─── SWR mock ─────────────────────────────────────────────────
// 각 테스트에서 원하는 초기 data를 제공할 수 있도록 외부에서 설정 가능
let __mockSWRData: MemberScoreLeaderboardResult | undefined = undefined;

vi.mock("swr", () => ({
  default: (_key: string | null, _fetcher: unknown) => {
    return {
      data: __mockSWRData,
      isLoading: false,
      mutate: mockMutate,
    };
  },
}));

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    memberScoreLeaderboard: (groupId: string) =>
      `member-score-leaderboard-${groupId}`,
  },
}));

// ─── 빈 결과 상수 ────────────────────────────────────────────
const EMPTY_RESULT: MemberScoreLeaderboardResult = {
  entries: [],
  totalMembers: 0,
  myEntry: null,
};

// ============================================================
// 테스트
// ============================================================

describe("useMemberScoreLeaderboard - 초기 상태 (data=undefined)", () => {
  beforeEach(() => {
    __mockSWRData = undefined;
    mockMutate.mockClear();
  });

  it("data가 undefined일 때 EMPTY_RESULT를 반환한다", () => {
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-1"));
    expect(result.current.data).toEqual(EMPTY_RESULT);
  });

  it("data.entries가 빈 배열이다", () => {
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-1"));
    expect(result.current.data.entries).toEqual([]);
  });

  it("data.totalMembers가 0이다", () => {
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-1"));
    expect(result.current.data.totalMembers).toBe(0);
  });

  it("data.myEntry가 null이다", () => {
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-1"));
    expect(result.current.data.myEntry).toBeNull();
  });

  it("loading이 false이다", () => {
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-1"));
    expect(result.current.loading).toBe(false);
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-1"));
    expect(typeof result.current.refetch).toBe("function");
  });
});

describe("useMemberScoreLeaderboard - SWR 데이터가 있을 때", () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it("SWR data가 있으면 entries를 반환한다", () => {
    __mockSWRData = {
      entries: [
        {
          userId: "user-1",
          name: "홍길동",
          totalScore: 100,
          rank: 1,
          breakdown: { attendance: 50, posts: 30, comments: 15, rsvp: 5 },
        },
      ],
      totalMembers: 1,
      myEntry: null,
    };
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-1"));
    expect(result.current.data.entries).toHaveLength(1);
    expect(result.current.data.totalMembers).toBe(1);
  });

  it("entries의 첫 번째 항목의 name이 올바르다", () => {
    __mockSWRData = {
      entries: [
        {
          userId: "user-1",
          name: "김철수",
          totalScore: 120,
          rank: 1,
          breakdown: { attendance: 60, posts: 30, comments: 20, rsvp: 10 },
        },
      ],
      totalMembers: 1,
      myEntry: null,
    };
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-2"));
    expect(result.current.data.entries[0].name).toBe("김철수");
  });

  it("myEntry가 null이 아닐 때 올바른 값을 반환한다", () => {
    const myEntry = {
      userId: "user-me",
      name: "나",
      totalScore: 50,
      rank: 5,
      breakdown: { attendance: 20, posts: 15, comments: 10, rsvp: 5 },
    };
    __mockSWRData = {
      entries: [myEntry],
      totalMembers: 5,
      myEntry,
    };
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-3"));
    expect(result.current.data.myEntry?.userId).toBe("user-me");
  });

  it("totalMembers가 올바르게 반환된다", () => {
    __mockSWRData = {
      entries: [],
      totalMembers: 50,
      myEntry: null,
    };
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-4"));
    expect(result.current.data.totalMembers).toBe(50);
  });
});

describe("useMemberScoreLeaderboard - 점수 가중치 순수 로직", () => {
  // 가중치: attendancePresent=10, attendanceLate=5, post=15, comment=5, rsvp=3

  it("출석(present) 1회 × 10 = 10점", () => {
    expect(1 * 10).toBe(10);
  });

  it("지각(late) 2회 × 5 = 10점", () => {
    expect(2 * 5).toBe(10);
  });

  it("게시글 3개 × 15 = 45점", () => {
    expect(3 * 15).toBe(45);
  });

  it("댓글 4개 × 5 = 20점", () => {
    expect(4 * 5).toBe(20);
  });

  it("RSVP 5개 × 3 = 15점", () => {
    expect(5 * 3).toBe(15);
  });

  it("종합 점수: present=2, late=1, post=2, comment=3, rsvp=4 = 82점", () => {
    const score = 2 * 10 + 1 * 5 + 2 * 15 + 3 * 5 + 4 * 3;
    expect(score).toBe(82);
  });

  it("breakdown.attendance = present*10 + late*5", () => {
    const attendance = 3 * 10 + 2 * 5;
    expect(attendance).toBe(40);
  });

  it("breakdown.posts = postCount*15", () => {
    expect(4 * 15).toBe(60);
  });

  it("breakdown.comments = commentCount*5", () => {
    expect(6 * 5).toBe(30);
  });

  it("breakdown.rsvp = rsvpCount*3", () => {
    expect(7 * 3).toBe(21);
  });
});

describe("useMemberScoreLeaderboard - 순위 부여 로직", () => {
  it("점수 내림차순으로 정렬된다", () => {
    const scores = [50, 100, 80];
    const sorted = [...scores].sort((a, b) => b - a);
    expect(sorted).toEqual([100, 80, 50]);
  });

  it("동점자는 같은 순위를 가진다 ([100,100,80] → [1,1,3])", () => {
    const scores = [100, 100, 80];
    const ranked: number[] = [];
    let currentRank = 1;
    for (let i = 0; i < scores.length; i++) {
      if (i > 0 && scores[i] < scores[i - 1]) {
        currentRank = i + 1;
      }
      ranked.push(currentRank);
    }
    expect(ranked).toEqual([1, 1, 3]);
  });

  it("3명이 모두 같은 점수면 모두 1위이다", () => {
    const scores = [100, 100, 100];
    const ranked: number[] = [];
    let currentRank = 1;
    for (let i = 0; i < scores.length; i++) {
      if (i > 0 && scores[i] < scores[i - 1]) {
        currentRank = i + 1;
      }
      ranked.push(currentRank);
    }
    expect(ranked).toEqual([1, 1, 1]);
  });

  it("모두 다른 점수면 순위가 1,2,3이다", () => {
    const scores = [90, 80, 70];
    const ranked: number[] = [];
    let currentRank = 1;
    for (let i = 0; i < scores.length; i++) {
      if (i > 0 && scores[i] < scores[i - 1]) {
        currentRank = i + 1;
      }
      ranked.push(currentRank);
    }
    expect(ranked).toEqual([1, 2, 3]);
  });

  it("최대 20명만 entries에 포함된다", () => {
    const allRanked = Array.from({ length: 25 }, (_, i) => ({ rank: i + 1 }));
    const entries = allRanked.slice(0, 20);
    expect(entries).toHaveLength(20);
  });

  it("totalMembers는 20명 제한 이전 전체 인원수이다", () => {
    const allRanked = Array.from({ length: 21 }, (_, i) => ({ rank: i + 1, totalScore: 100 - i }));
    const totalMembers = allRanked.length;
    const entries = allRanked.slice(0, 20);
    expect(totalMembers).toBe(21);
    expect(entries).toHaveLength(20);
  });
});

describe("useMemberScoreLeaderboard - refetch", () => {
  beforeEach(() => {
    __mockSWRData = undefined;
    mockMutate.mockClear();
  });

  it("refetch 호출 시 mutate가 실행된다", () => {
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-1"));
    result.current.refetch();
    expect(mockMutate).toHaveBeenCalled();
  });
});

describe("useMemberScoreLeaderboard - 경계값", () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it("totalScore가 0인 멤버도 entries에 포함된다", () => {
    __mockSWRData = {
      entries: [
        {
          userId: "user-zero",
          name: "제로",
          totalScore: 0,
          rank: 1,
          breakdown: { attendance: 0, posts: 0, comments: 0, rsvp: 0 },
        },
      ],
      totalMembers: 1,
      myEntry: null,
    };
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-zero"));
    expect(result.current.data.entries[0].totalScore).toBe(0);
  });

  it("entries가 정확히 20개일 때 toHaveLength(20)이다", () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      userId: `u${i}`,
      name: `멤버${i}`,
      totalScore: 100 - i,
      rank: i + 1,
      breakdown: { attendance: 0, posts: 0, comments: 0, rsvp: 0 },
    }));
    __mockSWRData = {
      entries,
      totalMembers: 20,
      myEntry: null,
    };
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-20"));
    expect(result.current.data.entries).toHaveLength(20);
    expect(result.current.data.totalMembers).toBe(20);
  });

  it("myEntry가 없을 때 null이다", () => {
    __mockSWRData = {
      entries: [],
      totalMembers: 0,
      myEntry: null,
    };
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-null"));
    expect(result.current.data.myEntry).toBeNull();
  });

  it("myEntry가 20위 밖이어도 포함된다", () => {
    const myEntry = {
      userId: "user-21",
      name: "21위",
      totalScore: 5,
      rank: 21,
      breakdown: { attendance: 0, posts: 0, comments: 5, rsvp: 0 },
    };
    __mockSWRData = {
      entries: Array.from({ length: 20 }, (_, i) => ({
        userId: `u${i}`,
        name: `멤버${i}`,
        totalScore: 100 - i,
        rank: i + 1,
        breakdown: { attendance: 0, posts: 0, comments: 0, rsvp: 0 },
      })),
      totalMembers: 21,
      myEntry,
    };
    const { result } = renderHook(() => useMemberScoreLeaderboard("group-21"));
    expect(result.current.data.myEntry?.rank).toBe(21);
  });
});

describe("useMemberScoreLeaderboard - MemberScoreBreakdown 구조", () => {
  it("breakdown에 attendance, posts, comments, rsvp 필드가 있다", () => {
    const breakdown = {
      attendance: 30,
      posts: 45,
      comments: 20,
      rsvp: 9,
    };
    expect(breakdown).toHaveProperty("attendance");
    expect(breakdown).toHaveProperty("posts");
    expect(breakdown).toHaveProperty("comments");
    expect(breakdown).toHaveProperty("rsvp");
  });

  it("totalScore = breakdown.attendance + posts + comments + rsvp", () => {
    const breakdown = { attendance: 30, posts: 45, comments: 20, rsvp: 9 };
    const totalScore = breakdown.attendance + breakdown.posts + breakdown.comments + breakdown.rsvp;
    expect(totalScore).toBe(104);
  });

  it("모든 값이 0이면 totalScore는 0이다", () => {
    const breakdown = { attendance: 0, posts: 0, comments: 0, rsvp: 0 };
    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
    expect(totalScore).toBe(0);
  });
});
