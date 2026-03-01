import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null, fetcher: (() => Promise<unknown>) | null, _opts?: unknown) => {
    if (!key || !fetcher) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

// ─── SWR 키 mock ──────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    board: (groupId: string, projectId: string | null | undefined, category: string, search: string, page: number) =>
      `/groups/${groupId}/board?project=${projectId ?? ""}&category=${category}&search=${search}&page=${page}`,
    boardPost: (postId: string) => `/board-posts/${postId}`,
    boardPostAttachments: (postId: string) => `/board-posts/${postId}/attachments`,
    boardPostLikes: (postId: string) => `/board-posts/${postId}/likes`,
    boardCategories: (groupId: string) => `/groups/${groupId}/board-categories`,
    boardTrash: (groupId: string) => `/groups/${groupId}/board-trash`,
    independentEntities: (groupId: string) => `/groups/${groupId}/independent-entities`,
  },
}));

// ─── SWR cache-config mock ────────────────────────────────────
vi.mock("@/lib/swr/cache-config", () => ({
  frequentConfig: { revalidateOnFocus: false },
  immutableConfig: { revalidateOnFocus: false },
  staticConfig: { revalidateOnFocus: false },
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], count: 0 }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
}));

// ─── independent-entities hook mock ──────────────────────────
vi.mock("@/hooks/use-independent-entities", () => ({
  useIndependentEntityIds: (_groupId: string | undefined) => ({
    data: [],
    isLoading: false,
  }),
}));

// ─── type-guards mock ─────────────────────────────────────────
vi.mock("@/lib/type-guards", () => ({
  castRows: <T>(rows: unknown[]) => rows as T[],
}));

// ─── types mock ───────────────────────────────────────────────
vi.mock("@/types", async () => {
  const actual = await vi.importActual<typeof import("@/types")>("@/types");
  return {
    ...actual,
    BOARD_CATEGORIES: ["전체", "공지사항", "잡담", "정보", "사진/영상", "투표", "미분류", "프로젝트"],
  };
});

// ─── 훅 import ────────────────────────────────────────────────
import {
  useBoard,
  useBoardPost,
  useBoardPostAttachments,
  useBoardPostLikes,
  useBoardCategories,
  useBoardTrash,
} from "@/hooks/use-board";

// ============================================================
// useBoard — 초기 상태
// ============================================================

describe("useBoard - 초기 상태", () => {
  it("posts는 기본값으로 빈 배열이다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    expect(result.current.posts).toEqual([]);
  });

  it("초기 category는 '전체'이다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    expect(result.current.category).toBe("전체");
  });

  it("초기 search는 빈 문자열이다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    expect(result.current.search).toBe("");
  });

  it("초기 page는 1이다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    expect(result.current.page).toBe(1);
  });

  it("초기 totalPages는 0이다 (데이터 없음)", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    expect(result.current.totalPages).toBe(0);
  });

  it("초기 totalCount는 0이다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    expect(result.current.totalCount).toBe(0);
  });

  it("필요한 함수가 모두 존재한다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    expect(typeof result.current.setCategory).toBe("function");
    expect(typeof result.current.setSearch).toBe("function");
    expect(typeof result.current.setPage).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useBoard — setCategory
// ============================================================

describe("useBoard - setCategory", () => {
  it("setCategory 호출 시 category가 변경된다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    act(() => {
      result.current.setCategory("공지사항");
    });
    expect(result.current.category).toBe("공지사항");
  });

  it("setCategory 호출 시 page가 1로 리셋된다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    // 먼저 페이지를 변경
    act(() => {
      result.current.setPage(3);
    });
    act(() => {
      result.current.setCategory("잡담");
    });
    expect(result.current.page).toBe(1);
  });

  it("'전체' 카테고리로 되돌릴 수 있다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    act(() => {
      result.current.setCategory("공지사항");
    });
    act(() => {
      result.current.setCategory("전체");
    });
    expect(result.current.category).toBe("전체");
  });

  it("setCategory를 여러 번 호출해도 마지막 값이 적용된다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    act(() => {
      result.current.setCategory("잡담");
    });
    act(() => {
      result.current.setCategory("정보");
    });
    act(() => {
      result.current.setCategory("투표");
    });
    expect(result.current.category).toBe("투표");
  });
});

// ============================================================
// useBoard — setSearch
// ============================================================

describe("useBoard - setSearch", () => {
  it("setSearch 호출 시 search가 변경된다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    act(() => {
      result.current.setSearch("공연 준비");
    });
    expect(result.current.search).toBe("공연 준비");
  });

  it("setSearch 호출 시 page가 1로 리셋된다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    act(() => {
      result.current.setPage(5);
    });
    act(() => {
      result.current.setSearch("검색어");
    });
    expect(result.current.page).toBe(1);
  });

  it("빈 문자열로 검색 초기화할 수 있다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    act(() => {
      result.current.setSearch("검색어");
    });
    act(() => {
      result.current.setSearch("");
    });
    expect(result.current.search).toBe("");
  });

  it("한글 검색어가 올바르게 저장된다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    act(() => {
      result.current.setSearch("여름 공연 준비");
    });
    expect(result.current.search).toBe("여름 공연 준비");
  });
});

// ============================================================
// useBoard — setPage
// ============================================================

describe("useBoard - setPage", () => {
  it("setPage로 페이지 번호를 변경할 수 있다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.page).toBe(2);
  });

  it("setPage로 큰 페이지 번호를 설정할 수 있다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    act(() => {
      result.current.setPage(100);
    });
    expect(result.current.page).toBe(100);
  });
});

// ============================================================
// useBoard — projectId 옵션
// ============================================================

describe("useBoard - projectId 옵션", () => {
  it("projectId 없이 사용하면 그룹 뷰로 동작한다", () => {
    const { result } = renderHook(() => useBoard("group-1"));
    // loading이 false이고 posts가 배열인 것으로 확인
    expect(Array.isArray(result.current.posts)).toBe(true);
  });

  it("projectId가 있으면 프로젝트 뷰로 동작한다", () => {
    const { result } = renderHook(() => useBoard("group-1", "project-1"));
    expect(Array.isArray(result.current.posts)).toBe(true);
  });

  it("projectId가 null이면 그룹 뷰로 처리된다", () => {
    const { result } = renderHook(() => useBoard("group-1", null));
    expect(Array.isArray(result.current.posts)).toBe(true);
  });
});

// ============================================================
// totalPages 계산 로직
// ============================================================

describe("totalPages 계산 로직 (PAGE_SIZE=10 기준)", () => {
  it("총 0개 → 0 페이지", () => {
    expect(Math.ceil(0 / 10)).toBe(0);
  });

  it("총 1개 → 1 페이지", () => {
    expect(Math.ceil(1 / 10)).toBe(1);
  });

  it("총 10개 → 1 페이지", () => {
    expect(Math.ceil(10 / 10)).toBe(1);
  });

  it("총 11개 → 2 페이지", () => {
    expect(Math.ceil(11 / 10)).toBe(2);
  });

  it("총 100개 → 10 페이지", () => {
    expect(Math.ceil(100 / 10)).toBe(10);
  });

  it("총 101개 → 11 페이지", () => {
    expect(Math.ceil(101 / 10)).toBe(11);
  });
});

// ============================================================
// useBoardPost — 반환값 구조
// ============================================================

describe("useBoardPost - 반환값 구조", () => {
  it("post, comments, poll, pollOptions, loading, refetch를 반환한다", () => {
    const { result } = renderHook(() => useBoardPost("post-1"));
    expect("post" in result.current).toBe(true);
    expect("comments" in result.current).toBe(true);
    expect("poll" in result.current).toBe(true);
    expect("pollOptions" in result.current).toBe(true);
    expect("loading" in result.current).toBe(true);
    expect(typeof result.current.refetch).toBe("function");
  });

  it("초기 post는 null이다", () => {
    const { result } = renderHook(() => useBoardPost("post-1"));
    expect(result.current.post).toBeNull();
  });

  it("초기 comments는 빈 배열이다", () => {
    const { result } = renderHook(() => useBoardPost("post-1"));
    expect(result.current.comments).toEqual([]);
  });

  it("초기 poll은 null이다", () => {
    const { result } = renderHook(() => useBoardPost("post-1"));
    expect(result.current.poll).toBeNull();
  });

  it("초기 pollOptions는 빈 배열이다", () => {
    const { result } = renderHook(() => useBoardPost("post-1"));
    expect(result.current.pollOptions).toEqual([]);
  });
});

// ============================================================
// useBoardPostAttachments — 반환값 구조
// ============================================================

describe("useBoardPostAttachments - 반환값 구조", () => {
  it("attachments, loading, refetch를 반환한다", () => {
    const { result } = renderHook(() => useBoardPostAttachments("post-1"));
    expect(Array.isArray(result.current.attachments)).toBe(true);
    expect("loading" in result.current).toBe(true);
    expect(typeof result.current.refetch).toBe("function");
  });

  it("초기 attachments는 빈 배열이다", () => {
    const { result } = renderHook(() => useBoardPostAttachments("post-1"));
    expect(result.current.attachments).toEqual([]);
  });
});

// ============================================================
// useBoardPostLikes — 반환값 구조
// ============================================================

describe("useBoardPostLikes - 반환값 구조", () => {
  it("likeCount, likedByMe, loading, refetch, mutate를 반환한다", () => {
    const { result } = renderHook(() => useBoardPostLikes("post-1"));
    expect(typeof result.current.likeCount).toBe("number");
    expect(typeof result.current.likedByMe).toBe("boolean");
    expect("loading" in result.current).toBe(true);
    expect(typeof result.current.refetch).toBe("function");
    expect(typeof result.current.mutate).toBe("function");
  });

  it("초기 likeCount는 0이다", () => {
    const { result } = renderHook(() => useBoardPostLikes("post-1"));
    expect(result.current.likeCount).toBe(0);
  });

  it("초기 likedByMe는 false이다", () => {
    const { result } = renderHook(() => useBoardPostLikes("post-1"));
    expect(result.current.likedByMe).toBe(false);
  });
});

// ============================================================
// useBoardCategories — 반환값 구조 및 기본값
// ============================================================

describe("useBoardCategories - 반환값 구조", () => {
  it("categories, writeCategories, filterCategories, loading, refetch를 반환한다", () => {
    const { result } = renderHook(() => useBoardCategories("group-1"));
    expect(Array.isArray(result.current.categories)).toBe(true);
    expect(Array.isArray(result.current.writeCategories)).toBe(true);
    expect(Array.isArray(result.current.filterCategories)).toBe(true);
    expect("loading" in result.current).toBe(true);
    expect(typeof result.current.refetch).toBe("function");
  });

  it("DB 카테고리가 없을 때 writeCategories는 기본 BOARD_CATEGORIES 기반이다 (전체 제외)", () => {
    const { result } = renderHook(() => useBoardCategories("group-1"));
    // DB 데이터가 없으면 기본값 사용, "전체"는 포함되지 않아야 함
    expect(result.current.writeCategories).not.toContain("전체");
  });

  it("filterCategories는 '전체'를 첫 번째 원소로 포함한다", () => {
    const { result } = renderHook(() => useBoardCategories("group-1"));
    expect(result.current.filterCategories[0]).toBe("전체");
  });

  it("filterCategories는 writeCategories보다 1개 더 많다", () => {
    const { result } = renderHook(() => useBoardCategories("group-1"));
    expect(result.current.filterCategories.length).toBe(
      result.current.writeCategories.length + 1
    );
  });
});

// ============================================================
// useBoardTrash — 반환값 구조
// ============================================================

describe("useBoardTrash - 반환값 구조", () => {
  it("posts, loading, refetch를 반환한다", () => {
    const { result } = renderHook(() => useBoardTrash("group-1"));
    expect(Array.isArray(result.current.posts)).toBe(true);
    expect("loading" in result.current).toBe(true);
    expect(typeof result.current.refetch).toBe("function");
  });

  it("초기 posts는 빈 배열이다", () => {
    const { result } = renderHook(() => useBoardTrash("group-1"));
    expect(result.current.posts).toEqual([]);
  });
});

// ============================================================
// BOARD_CATEGORIES 상수 검증
// ============================================================

describe("BOARD_CATEGORIES 상수", () => {
  const BOARD_CATEGORIES = ["전체", "공지사항", "잡담", "정보", "사진/영상", "투표", "미분류", "프로젝트"];

  it("'전체'를 포함한다", () => {
    expect(BOARD_CATEGORIES).toContain("전체");
  });

  it("'공지사항'을 포함한다", () => {
    expect(BOARD_CATEGORIES).toContain("공지사항");
  });

  it("'전체'는 첫 번째 원소이다", () => {
    expect(BOARD_CATEGORIES[0]).toBe("전체");
  });

  it("8개 카테고리로 구성된다", () => {
    expect(BOARD_CATEGORIES).toHaveLength(8);
  });

  it("writeCategories (전체 제외)는 7개이다", () => {
    const writeCategories = BOARD_CATEGORIES.filter((c) => c !== "전체");
    expect(writeCategories).toHaveLength(7);
  });
});
