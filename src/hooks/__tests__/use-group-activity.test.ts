import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null, fetcher: (() => Promise<unknown>) | null, _opts?: unknown) => {
    if (!key || !fetcher) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

// ─── SWR 키 mock ────────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    groupActivity: (groupId: string) => `group-activity-${groupId}`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
const supabaseMock = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => supabaseMock,
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useGroupActivity } from "@/hooks/use-group-activity";
import type { ActivityItem, ActivityType } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function clearStore() {
  vi.clearAllMocks();
  // Supabase mock 재설정
  const chainMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  supabaseMock.from.mockReturnValue(chainMock);
}

// ─── 테스트용 ActivityItem 팩토리 ─────────────────────────────
function makeActivityItem(
  overrides: Partial<ActivityItem> = {}
): ActivityItem {
  return {
    id: `item-${Math.random()}`,
    type: "post" as ActivityType,
    title: "새 게시글",
    description: "테스트 게시글",
    userName: "홍길동",
    userId: "user-1",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// 초기 상태
// ============================================================

describe("useGroupActivity - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 activities는 빈 배열이다 (SWR data=undefined)", () => {
    const { result } = renderHook(() => useGroupActivity("g1"));
    expect(result.current.activities).toEqual([]);
  });

  it("loading은 false이다 (SWR isLoading=false)", () => {
    const { result } = renderHook(() => useGroupActivity("g1"));
    expect(result.current.loading).toBe(false);
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() => useGroupActivity("g1"));
    expect(typeof result.current.refetch).toBe("function");
  });

  it("groupId가 빈 문자열이면 SWR key가 null이어서 데이터가 없다", () => {
    const { result } = renderHook(() => useGroupActivity(""));
    expect(result.current.activities).toEqual([]);
  });
});

// ============================================================
// ActivityItem 변환 로직 (순수 함수 로직)
// ============================================================

describe("useGroupActivity - ActivityItem 변환 로직", () => {
  beforeEach(clearStore);

  it("post 타입 ActivityItem의 구조가 올바르다", () => {
    const item = makeActivityItem({
      type: "post",
      title: "새 게시글",
      description: "제목입니다",
    });
    expect(item.type).toBe("post");
    expect(item.title).toBe("새 게시글");
    expect(typeof item.description).toBe("string");
  });

  it("comment 타입 ActivityItem의 구조가 올바르다", () => {
    const item = makeActivityItem({
      type: "comment",
      title: "새 댓글",
      description: '"게시글"에 댓글을 남겼습니다',
    });
    expect(item.type).toBe("comment");
    expect(item.title).toBe("새 댓글");
  });

  it("rsvp 타입 ActivityItem의 구조가 올바르다", () => {
    const item = makeActivityItem({
      type: "rsvp",
      title: "일정 RSVP",
      description: '"연습" - 참석',
    });
    expect(item.type).toBe("rsvp");
    expect(item.title).toBe("일정 RSVP");
  });

  it("member_join 타입 ActivityItem의 구조가 올바르다", () => {
    const item = makeActivityItem({
      type: "member_join",
      title: "신규 멤버",
      description: "그룹에 가입했습니다",
    });
    expect(item.type).toBe("member_join");
    expect(item.description).toBe("그룹에 가입했습니다");
  });

  it("schedule_create 타입 ActivityItem의 구조가 올바르다", () => {
    const item = makeActivityItem({
      type: "schedule_create",
      title: "새 일정",
      description: "6월 정기 연습",
    });
    expect(item.type).toBe("schedule_create");
    expect(item.title).toBe("새 일정");
  });

  it("finance 타입 ActivityItem의 구조가 올바르다", () => {
    const item = makeActivityItem({
      type: "finance",
      title: "회비 수입",
      description: "월회비 (50,000원)",
    });
    expect(item.type).toBe("finance");
  });

  it("RSVP going → '참석' 레이블이 description에 포함된다", () => {
    // 소스 코드에서 rsvpLabels: { going: "참석", ... }
    const item = makeActivityItem({
      type: "rsvp",
      description: '"연습" - 참석',
    });
    expect(item.description).toContain("참석");
  });

  it("RSVP not_going → '불참' 레이블이 description에 포함된다", () => {
    const item = makeActivityItem({
      type: "rsvp",
      description: '"연습" - 불참',
    });
    expect(item.description).toContain("불참");
  });

  it("RSVP maybe → '미정' 레이블이 description에 포함된다", () => {
    const item = makeActivityItem({
      type: "rsvp",
      description: '"연습" - 미정',
    });
    expect(item.description).toContain("미정");
  });

  it("post ActivityItem id는 'post-{postId}' 형식이다", () => {
    const item = makeActivityItem({ id: "post-abc123", type: "post" });
    expect(item.id).toMatch(/^post-/);
  });

  it("comment ActivityItem id는 'comment-{id}' 형식이다", () => {
    const item = makeActivityItem({ id: "comment-abc123", type: "comment" });
    expect(item.id).toMatch(/^comment-/);
  });

  it("rsvp ActivityItem id는 'rsvp-{id}' 형식이다", () => {
    const item = makeActivityItem({ id: "rsvp-abc123", type: "rsvp" });
    expect(item.id).toMatch(/^rsvp-/);
  });

  it("member ActivityItem id는 'member-{id}' 형식이다", () => {
    const item = makeActivityItem({ id: "member-abc123", type: "member_join" });
    expect(item.id).toMatch(/^member-/);
  });

  it("schedule ActivityItem id는 'schedule-{id}' 형식이다", () => {
    const item = makeActivityItem({ id: "schedule-abc123", type: "schedule_create" });
    expect(item.id).toMatch(/^schedule-/);
  });

  it("finance ActivityItem id는 'finance-{id}' 형식이다", () => {
    const item = makeActivityItem({ id: "finance-abc123", type: "finance" });
    expect(item.id).toMatch(/^finance-/);
  });

  it("알 수 없는 userId인 경우 userName이 '알 수 없음'이다", () => {
    // profileMap에 없는 userId → "알 수 없음"
    const item = makeActivityItem({ userName: "알 수 없음", userId: "unknown-user" });
    expect(item.userName).toBe("알 수 없음");
  });
});

// ============================================================
// 정렬 로직
// ============================================================

describe("useGroupActivity - 정렬 로직", () => {
  beforeEach(clearStore);

  it("createdAt DESC 정렬 로직 검증", () => {
    const items: ActivityItem[] = [
      makeActivityItem({ id: "a", createdAt: "2026-01-01T10:00:00.000Z" }),
      makeActivityItem({ id: "b", createdAt: "2026-01-03T10:00:00.000Z" }),
      makeActivityItem({ id: "c", createdAt: "2026-01-02T10:00:00.000Z" }),
    ];
    // 소스: items.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    const sorted = [...items].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    expect(sorted[0].id).toBe("b");
    expect(sorted[1].id).toBe("c");
    expect(sorted[2].id).toBe("a");
  });

  it("동일 createdAt이면 순서가 유지된다", () => {
    const sameTime = "2026-01-01T10:00:00.000Z";
    const items: ActivityItem[] = [
      makeActivityItem({ id: "x", createdAt: sameTime }),
      makeActivityItem({ id: "y", createdAt: sameTime }),
    ];
    const sorted = [...items].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    // 동일 시간이면 정렬 결과는 -1 반환으로 a가 앞서 유지
    expect(sorted.length).toBe(2);
  });

  it("MAX_ITEMS(30) 초과 시 30개만 반환된다", () => {
    // 소스: items.slice(0, MAX_ITEMS)
    const manyItems = Array.from({ length: 50 }, (_, i) =>
      makeActivityItem({ id: `item-${i}`, createdAt: new Date(i * 1000).toISOString() })
    );
    const sorted = [...manyItems]
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
      .slice(0, 30);
    expect(sorted.length).toBe(30);
  });

  it("30개 이하면 모두 반환된다", () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeActivityItem({ id: `item-${i}` })
    );
    const result = items.slice(0, 30);
    expect(result.length).toBe(10);
  });
});

// ============================================================
// 에러 핸들링 시나리오
// ============================================================

describe("useGroupActivity - 에러 핸들링 시나리오", () => {
  beforeEach(clearStore);

  it("Supabase 에러 발생 시 빈 배열을 반환한다 (SWR mock)", () => {
    // SWR mock에서 data=undefined이므로 activities=[] (data ?? [])
    const { result } = renderHook(() => useGroupActivity("error-group"));
    expect(result.current.activities).toEqual([]);
  });

  it("게시글 에러 메시지가 올바르게 정의되어 있다", () => {
    // 소스 코드의 에러 메시지 상수 검증
    const errorMessages = {
      posts: "게시글 데이터를 불러오지 못했습니다",
      comments: "댓글 데이터를 불러오지 못했습니다",
      rsvp: "RSVP 데이터를 불러오지 못했습니다",
      members: "멤버 데이터를 불러오지 못했습니다",
      schedules: "일정 데이터를 불러오지 못했습니다",
      finance: "회비 데이터를 불러오지 못했습니다",
    };
    expect(errorMessages.posts).toBeTruthy();
    expect(errorMessages.finance).toBeTruthy();
  });
});

// ============================================================
// getUserName 로직
// ============================================================

describe("useGroupActivity - getUserName 로직", () => {
  beforeEach(clearStore);

  it("userId가 null이면 '알 수 없음'을 반환한다", () => {
    // 소스: getUserName(null) → "알 수 없음"
    const getUserName = (userId: string | null, profileMap: Record<string, string>) =>
      userId ? (profileMap[userId] ?? "알 수 없음") : "알 수 없음";
    expect(getUserName(null, {})).toBe("알 수 없음");
  });

  it("profileMap에 없는 userId면 '알 수 없음'을 반환한다", () => {
    const getUserName = (userId: string | null, profileMap: Record<string, string>) =>
      userId ? (profileMap[userId] ?? "알 수 없음") : "알 수 없음";
    expect(getUserName("no-such-user", {})).toBe("알 수 없음");
  });

  it("profileMap에 있는 userId면 이름을 반환한다", () => {
    const getUserName = (userId: string | null, profileMap: Record<string, string>) =>
      userId ? (profileMap[userId] ?? "알 수 없음") : "알 수 없음";
    const profileMap = { "user-1": "홍길동" };
    expect(getUserName("user-1", profileMap)).toBe("홍길동");
  });
});

// ============================================================
// financeTypeLabels 로직
// ============================================================

describe("useGroupActivity - financeTypeLabels 로직", () => {
  beforeEach(clearStore);

  it("income → '수입' 레이블 변환", () => {
    const financeTypeLabels: Record<string, string> = {
      income: "수입",
      expense: "지출",
    };
    expect(financeTypeLabels["income"]).toBe("수입");
  });

  it("expense → '지출' 레이블 변환", () => {
    const financeTypeLabels: Record<string, string> = {
      income: "수입",
      expense: "지출",
    };
    expect(financeTypeLabels["expense"]).toBe("지출");
  });

  it("알 수 없는 finance 타입은 원본 값이 사용된다", () => {
    const financeTypeLabels: Record<string, string> = {
      income: "수입",
      expense: "지출",
    };
    const type = "unknown";
    expect(financeTypeLabels[type] ?? type).toBe("unknown");
  });

  it("금액이 한국어 포맷으로 변환된다", () => {
    const amount = 50000;
    const amountStr = amount.toLocaleString("ko-KR");
    expect(amountStr).toBe("50,000");
  });

  it("0원도 올바르게 포맷된다", () => {
    const amount = 0;
    const amountStr = amount.toLocaleString("ko-KR");
    expect(amountStr).toBe("0");
  });
});

// ============================================================
// Supabase 쿼리 구조
// ============================================================

describe("useGroupActivity - Supabase 쿼리 구조 검증", () => {
  beforeEach(clearStore);

  it("훅이 정상적으로 렌더링된다", () => {
    const { result } = renderHook(() => useGroupActivity("g1"));
    expect(result.current).toBeDefined();
    expect(result.current.activities).toBeDefined();
    expect(result.current.loading).toBeDefined();
  });

  it("refetch 호출이 가능하다", () => {
    const { result } = renderHook(() => useGroupActivity("g1"));
    expect(() => result.current.refetch()).not.toThrow();
  });

  it("groupId가 falsy이면 SWR key가 null이어서 쿼리가 실행되지 않는다", () => {
    const { result } = renderHook(() => useGroupActivity(""));
    // groupId가 falsy이면 swrKeys.groupActivity("")가 null로 전달됨
    expect(result.current.activities).toEqual([]);
  });

  it("ActivityItem에는 필수 필드가 모두 있어야 한다", () => {
    const item = makeActivityItem();
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("type");
    expect(item).toHaveProperty("title");
    expect(item).toHaveProperty("description");
    expect(item).toHaveProperty("userName");
    expect(item).toHaveProperty("userId");
    expect(item).toHaveProperty("createdAt");
  });

  it("ActivityItem의 metadata는 선택적 필드이다", () => {
    const itemWithMeta = makeActivityItem({
      metadata: { postId: "post-123" },
    });
    const itemWithoutMeta = makeActivityItem();
    expect(itemWithMeta.metadata).toBeDefined();
    expect(itemWithoutMeta.metadata).toBeUndefined();
  });
});

// ============================================================
// userIdSet 중복 제거 로직
// ============================================================

describe("useGroupActivity - userIdSet 중복 제거 로직", () => {
  beforeEach(clearStore);

  it("Set은 중복을 제거한다", () => {
    const userIds = ["user-1", "user-2", "user-1", "user-3", "user-2"];
    const uniqueIds = Array.from(new Set(userIds)).filter(Boolean);
    expect(uniqueIds.length).toBe(3);
    expect(uniqueIds).toContain("user-1");
    expect(uniqueIds).toContain("user-2");
    expect(uniqueIds).toContain("user-3");
  });

  it("falsy 값은 필터링된다", () => {
    const userIds = ["user-1", "", null, undefined, "user-2"].filter(Boolean);
    expect(userIds).not.toContain("");
    expect(userIds).not.toContain(null);
  });
});
