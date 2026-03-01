import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSocialCalendar } from "@/hooks/use-social-calendar";
import type { SocialCalendarPost, SocialPlatformType, SocialPostStatus } from "@/types";

// ─── localStorage mock ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── @/lib/local-storage mock ────────────────────────────────
vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    const raw = localStorageMock.getItem(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },
  saveToStorage: <T>(key: string, value: T): void => {
    localStorageMock.setItem(key, JSON.stringify(value));
  },
  removeFromStorage: (key: string): void => {
    localStorageMock.removeItem(key);
  },
}));

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── 헬퍼 ────────────────────────────────────────────────────
function makePostInput(
  overrides: Partial<Omit<SocialCalendarPost, "id" | "createdAt">> = {}
): Omit<SocialCalendarPost, "id" | "createdAt"> {
  return {
    platform: "instagram",
    title: "테스트 게시물",
    content: "내용입니다",
    scheduledDate: "2026-03-01",
    status: "draft",
    hashtags: ["#댄스"],
    ...overrides,
  };
}

function makeHook(groupId = "group-1") {
  return renderHook(() => useSocialCalendar(groupId));
}

// ============================================================
// 초기 상태
// ============================================================

describe("useSocialCalendar - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("초기 posts는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.posts).toEqual([]);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalPosts는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalPosts).toBe(0);
  });

  it("초기 stats.draftCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.draftCount).toBe(0);
  });

  it("초기 stats.scheduledCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.scheduledCount).toBe(0);
  });

  it("초기 stats.publishedCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.publishedCount).toBe(0);
  });

  it("초기 stats.cancelledCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.cancelledCount).toBe(0);
  });

  it("초기 stats.platformBreakdown의 모든 값이 0이다", () => {
    const { result } = makeHook();
    const breakdown = result.current.stats.platformBreakdown;
    Object.values(breakdown).forEach((count) => expect(count).toBe(0));
  });

  it("필수 함수들이 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addPost).toBe("function");
    expect(typeof result.current.updatePost).toBe("function");
    expect(typeof result.current.deletePost).toBe("function");
    expect(typeof result.current.updateStatus).toBe("function");
    expect(typeof result.current.getPostsByMonth).toBe("function");
    expect(typeof result.current.getPostsByPlatform).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addPost
// ============================================================

describe("useSocialCalendar - addPost", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("게시물 추가 후 posts 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput()); });
    expect(result.current.posts).toHaveLength(1);
  });

  it("추가된 게시물에 id가 부여된다", () => {
    const { result } = makeHook();
    let returned: SocialCalendarPost;
    act(() => { returned = result.current.addPost(makePostInput()); });
    expect(returned!.id).toBeDefined();
    expect(returned!.id).not.toBe("");
  });

  it("추가된 게시물에 createdAt이 설정된다", () => {
    const { result } = makeHook();
    let returned: SocialCalendarPost;
    act(() => { returned = result.current.addPost(makePostInput()); });
    expect(returned!.createdAt).toBeDefined();
  });

  it("게시물 추가 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput()); });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("여러 게시물 추가 시 모두 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ title: "게시물1" })); });
    act(() => { result.current.addPost(makePostInput({ title: "게시물2" })); });
    act(() => { result.current.addPost(makePostInput({ title: "게시물3" })); });
    expect(result.current.posts).toHaveLength(3);
  });

  it("추가된 게시물의 platform이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ platform: "youtube" })); });
    expect(result.current.posts[0].platform).toBe("youtube");
  });

  it("추가된 게시물의 status가 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ status: "scheduled" })); });
    expect(result.current.posts[0].status).toBe("scheduled");
  });

  it("stats.totalPosts가 추가된 게시물 수와 일치한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput()); });
    act(() => { result.current.addPost(makePostInput()); });
    expect(result.current.stats.totalPosts).toBe(2);
  });

  it("추가된 draft 게시물은 stats.draftCount에 반영된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ status: "draft" })); });
    expect(result.current.stats.draftCount).toBe(1);
  });

  it("추가된 scheduled 게시물은 stats.scheduledCount에 반영된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ status: "scheduled" })); });
    expect(result.current.stats.scheduledCount).toBe(1);
  });
});

// ============================================================
// updatePost
// ============================================================

describe("useSocialCalendar - updatePost", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("게시물 수정 후 title이 변경된다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput({ title: "원래 제목" })); });
    act(() => { result.current.updatePost(post!.id, { title: "새 제목" }); });
    expect(result.current.posts[0].title).toBe("새 제목");
  });

  it("수정 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    let success: boolean;
    act(() => { post = result.current.addPost(makePostInput()); });
    act(() => { success = result.current.updatePost(post!.id, { title: "새 제목" }); });
    expect(success!).toBe(true);
  });

  it("존재하지 않는 id 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => { success = result.current.updatePost("non-existent", { title: "제목" }); });
    expect(success!).toBe(false);
  });

  it("수정 후 다른 필드는 유지된다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput({ platform: "tiktok", status: "draft" })); });
    act(() => { result.current.updatePost(post!.id, { title: "변경" }); });
    expect(result.current.posts[0].platform).toBe("tiktok");
    expect(result.current.posts[0].status).toBe("draft");
  });

  it("content 필드를 수정할 수 있다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput({ content: "기존 내용" })); });
    act(() => { result.current.updatePost(post!.id, { content: "새 내용" }); });
    expect(result.current.posts[0].content).toBe("새 내용");
  });
});

// ============================================================
// deletePost
// ============================================================

describe("useSocialCalendar - deletePost", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("게시물 삭제 후 posts 길이가 감소한다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput()); });
    act(() => { result.current.deletePost(post!.id); });
    expect(result.current.posts).toHaveLength(0);
  });

  it("삭제 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    let success: boolean;
    act(() => { post = result.current.addPost(makePostInput()); });
    act(() => { success = result.current.deletePost(post!.id); });
    expect(success!).toBe(true);
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => { success = result.current.deletePost("non-existent"); });
    expect(success!).toBe(false);
  });

  it("특정 게시물만 삭제된다", () => {
    const { result } = makeHook();
    let p1: SocialCalendarPost, p2: SocialCalendarPost;
    act(() => { p1 = result.current.addPost(makePostInput({ title: "게시물1" })); });
    act(() => { p2 = result.current.addPost(makePostInput({ title: "게시물2" })); });
    act(() => { result.current.deletePost(p1!.id); });
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0].id).toBe(p2!.id);
  });

  it("삭제 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput()); });
    localStorageMock.setItem.mockClear();
    act(() => { result.current.deletePost(post!.id); });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================
// updateStatus
// ============================================================

describe("useSocialCalendar - updateStatus", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("상태를 scheduled로 변경할 수 있다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput({ status: "draft" })); });
    act(() => { result.current.updateStatus(post!.id, "scheduled"); });
    expect(result.current.posts[0].status).toBe("scheduled");
  });

  it("상태를 published로 변경할 수 있다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput({ status: "draft" })); });
    act(() => { result.current.updateStatus(post!.id, "published"); });
    expect(result.current.posts[0].status).toBe("published");
  });

  it("상태를 cancelled로 변경할 수 있다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput({ status: "draft" })); });
    act(() => { result.current.updateStatus(post!.id, "cancelled"); });
    expect(result.current.posts[0].status).toBe("cancelled");
  });

  it("상태 변경 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    let success: boolean;
    act(() => { post = result.current.addPost(makePostInput({ status: "draft" })); });
    act(() => { success = result.current.updateStatus(post!.id, "scheduled"); });
    expect(success!).toBe(true);
  });

  it("존재하지 않는 id 상태 변경 시 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => { success = result.current.updateStatus("non-existent", "published"); });
    expect(success!).toBe(false);
  });

  it("published 상태로 변경 후 stats.publishedCount가 증가한다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput({ status: "draft" })); });
    act(() => { result.current.updateStatus(post!.id, "published"); });
    expect(result.current.stats.publishedCount).toBe(1);
  });

  it("cancelled 상태로 변경 후 stats.cancelledCount가 증가한다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput({ status: "draft" })); });
    act(() => { result.current.updateStatus(post!.id, "cancelled"); });
    expect(result.current.stats.cancelledCount).toBe(1);
  });
});

// ============================================================
// getPostsByMonth
// ============================================================

describe("useSocialCalendar - getPostsByMonth", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("해당 월 게시물만 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ scheduledDate: "2026-03-01" })); });
    act(() => { result.current.addPost(makePostInput({ scheduledDate: "2026-03-15" })); });
    act(() => { result.current.addPost(makePostInput({ scheduledDate: "2026-04-01" })); });
    const found = result.current.getPostsByMonth(2026, 3);
    expect(found).toHaveLength(2);
  });

  it("해당 월 게시물이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ scheduledDate: "2026-03-01" })); });
    const found = result.current.getPostsByMonth(2026, 5);
    expect(found).toHaveLength(0);
  });

  it("한 자리 월도 올바르게 처리된다 (예: 3월)", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ scheduledDate: "2026-03-10" })); });
    act(() => { result.current.addPost(makePostInput({ scheduledDate: "2026-03-20" })); });
    const found = result.current.getPostsByMonth(2026, 3);
    expect(found).toHaveLength(2);
  });

  it("12월 필터링이 올바르게 작동한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ scheduledDate: "2026-12-25" })); });
    act(() => { result.current.addPost(makePostInput({ scheduledDate: "2026-11-01" })); });
    const found = result.current.getPostsByMonth(2026, 12);
    expect(found).toHaveLength(1);
    expect(found[0].scheduledDate).toBe("2026-12-25");
  });
});

// ============================================================
// getPostsByPlatform
// ============================================================

describe("useSocialCalendar - getPostsByPlatform", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("해당 플랫폼 게시물만 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ platform: "instagram" })); });
    act(() => { result.current.addPost(makePostInput({ platform: "youtube" })); });
    act(() => { result.current.addPost(makePostInput({ platform: "instagram" })); });
    const found = result.current.getPostsByPlatform("instagram");
    expect(found).toHaveLength(2);
    found.forEach((p) => expect(p.platform).toBe("instagram"));
  });

  it("해당 플랫폼 게시물이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ platform: "instagram" })); });
    const found = result.current.getPostsByPlatform("tiktok");
    expect(found).toHaveLength(0);
  });

  it("tiktok 플랫폼 필터링이 작동한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ platform: "tiktok" })); });
    const found = result.current.getPostsByPlatform("tiktok");
    expect(found).toHaveLength(1);
  });

  it("blog 플랫폼 필터링이 작동한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ platform: "blog" })); });
    act(() => { result.current.addPost(makePostInput({ platform: "blog" })); });
    const found = result.current.getPostsByPlatform("blog");
    expect(found).toHaveLength(2);
  });
});

// ============================================================
// stats 통계
// ============================================================

describe("useSocialCalendar - stats 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("platformBreakdown이 플랫폼별 카운트를 올바르게 집계한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ platform: "instagram" })); });
    act(() => { result.current.addPost(makePostInput({ platform: "instagram" })); });
    act(() => { result.current.addPost(makePostInput({ platform: "youtube" })); });
    const breakdown = result.current.stats.platformBreakdown;
    expect(breakdown.instagram).toBe(2);
    expect(breakdown.youtube).toBe(1);
  });

  it("모든 플랫폼 키가 platformBreakdown에 존재한다", () => {
    const { result } = makeHook();
    const breakdown = result.current.stats.platformBreakdown;
    const expectedPlatforms: SocialPlatformType[] = ["instagram", "youtube", "tiktok", "twitter", "facebook", "blog"];
    expectedPlatforms.forEach((platform) => {
      expect(Object.prototype.hasOwnProperty.call(breakdown, platform)).toBe(true);
    });
  });

  it("상태별 통계가 올바르게 집계된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addPost(makePostInput({ status: "draft" })); });
    act(() => { result.current.addPost(makePostInput({ status: "draft" })); });
    act(() => { result.current.addPost(makePostInput({ status: "scheduled" })); });
    act(() => { result.current.addPost(makePostInput({ status: "published" })); });
    act(() => { result.current.addPost(makePostInput({ status: "cancelled" })); });
    const stats = result.current.stats;
    expect(stats.totalPosts).toBe(5);
    expect(stats.draftCount).toBe(2);
    expect(stats.scheduledCount).toBe(1);
    expect(stats.publishedCount).toBe(1);
    expect(stats.cancelledCount).toBe(1);
  });

  it("게시물 삭제 후 totalPosts가 감소한다", () => {
    const { result } = makeHook();
    let post: SocialCalendarPost;
    act(() => { post = result.current.addPost(makePostInput()); });
    act(() => { result.current.addPost(makePostInput()); });
    act(() => { result.current.deletePost(post!.id); });
    expect(result.current.stats.totalPosts).toBe(1);
  });
});

// ============================================================
// refetch
// ============================================================

describe("useSocialCalendar - refetch", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("refetch를 호출해도 에러가 발생하지 않는다", () => {
    const { result } = makeHook();
    expect(() => act(() => { result.current.refetch(); })).not.toThrow();
  });

  it("localStorage에 데이터가 있으면 refetch 후 posts에 반영된다", () => {
    const groupId = "group-reload";
    const key = `dancebase:social-calendar:${groupId}`;
    const mockData: SocialCalendarPost[] = [{
      id: "existing-id",
      platform: "instagram",
      title: "기존 게시물",
      content: "내용",
      scheduledDate: "2026-03-01",
      status: "draft",
      hashtags: [],
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.setItem(key, JSON.stringify(mockData));

    const { result } = renderHook(() => useSocialCalendar(groupId));
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0].id).toBe("existing-id");
  });

  it("groupId가 빈 문자열일 때 refetch를 호출해도 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() => useSocialCalendar(""));
    expect(() => act(() => { result.current.refetch(); })).not.toThrow();
  });
});
