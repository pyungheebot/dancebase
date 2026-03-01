import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGroupWishlist } from "@/hooks/use-group-wishlist";
import type { WishlistItem } from "@/types";

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

// ─── SWR mock ────────────────────────────────────────────────
// SWR을 useState 기반으로 모킹하여 mutate 시 React 상태도 갱신
vi.mock("swr", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      const [data, setData] = React.useState<unknown>(() => {
        if (!key || !fetcher) return undefined;
        return fetcher();
      });

      const mutate = (newData?: unknown, _revalidate?: boolean) => {
        if (newData !== undefined) {
          setData(newData);
        } else if (fetcher) {
          setData(fetcher());
        }
      };

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    groupWishlist: (groupId: string) => `group-wishlist-${groupId}`,
  },
}));

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useGroupWishlist(groupId));
}

// ============================================================
// 초기 상태
// ============================================================

describe("useGroupWishlist - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("초기 items는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.items).toEqual([]);
  });

  it("초기 totalWishes는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalWishes).toBe(0);
  });

  it("초기 completedCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.completedCount).toBe(0);
  });

  it("초기 topCategory는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.topCategory).toBeNull();
  });

  it("필수 함수들이 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addWish).toBe("function");
    expect(typeof result.current.deleteWish).toBe("function");
    expect(typeof result.current.voteWish).toBe("function");
    expect(typeof result.current.completeWish).toBe("function");
    expect(typeof result.current.filterByCategory).toBe("function");
    expect(typeof result.current.sortByVotes).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addWish
// ============================================================

describe("useGroupWishlist - addWish", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("위시 추가 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => {
      success = result.current.addWish("노래 배우기", "설명", "song", "high", "홍길동");
    });
    expect(success!).toBe(true);
  });

  it("title이 빈 문자열이면 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => {
      success = result.current.addWish("", "설명", "song", "high", "홍길동");
    });
    expect(success!).toBe(false);
  });

  it("title이 공백만 있으면 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => {
      success = result.current.addWish("   ", "설명", "song", "high", "홍길동");
    });
    expect(success!).toBe(false);
  });

  it("proposedBy가 빈 문자열이면 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => {
      success = result.current.addWish("노래", "설명", "song", "high", "");
    });
    expect(success!).toBe(false);
  });

  it("proposedBy가 공백만 있으면 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => {
      success = result.current.addWish("노래", "설명", "song", "high", "   ");
    });
    expect(success!).toBe(false);
  });

  it("위시 추가 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래 배우기", "설명", "song", "medium", "홍길동");
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("위시 추가 후 totalWishes가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("위시1", "설명", "song", "high", "작성자1");
    });
    act(() => {
      result.current.addWish("위시2", "설명", "performance", "low", "작성자2");
    });
    expect(result.current.totalWishes).toBe(2);
  });

  it("추가된 위시의 초기 votes는 0이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    expect(result.current.items[0].votes).toBe(0);
  });

  it("추가된 위시의 초기 isCompleted는 false이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    expect(result.current.items[0].isCompleted).toBe(false);
  });

  it("추가된 위시의 category가 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("공연 준비", "설명", "performance", "medium", "작성자");
    });
    expect(result.current.items[0].category).toBe("performance");
  });

  it("추가된 위시의 priority가 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("연습", "설명", "event", "low", "작성자");
    });
    expect(result.current.items[0].priority).toBe("low");
  });

  it("위시가 목록의 맨 앞에 추가된다 (최신 순)", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("첫 번째", "설명", "song", "high", "작성자");
    });
    act(() => {
      result.current.addWish("두 번째", "설명", "song", "high", "작성자");
    });
    // 새 아이템이 앞에 추가됨
    expect(result.current.items[0].title).toBe("두 번째");
  });

  it("title이 trim된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("  노래  ", "설명", "song", "high", "작성자");
    });
    expect(result.current.items[0].title).toBe("노래");
  });

  it("proposedBy가 trim된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "  작성자  ");
    });
    expect(result.current.items[0].proposedBy).toBe("작성자");
  });
});

// ============================================================
// deleteWish
// ============================================================

describe("useGroupWishlist - deleteWish", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("위시 삭제 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    let success: boolean;
    act(() => {
      success = result.current.deleteWish(itemId);
    });
    expect(success!).toBe(true);
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => {
      success = result.current.deleteWish("non-existent");
    });
    expect(success!).toBe(false);
  });

  it("삭제 후 totalWishes가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래1", "설명", "song", "high", "작성자");
    });
    act(() => {
      result.current.addWish("노래2", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.deleteWish(itemId);
    });
    expect(result.current.totalWishes).toBe(1);
  });

  it("특정 위시만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("위시A", "설명", "song", "high", "작성자");
    });
    act(() => {
      result.current.addWish("위시B", "설명", "event", "low", "작성자");
    });
    // 새 아이템이 앞에 추가되므로 items[0]은 "위시B", items[1]은 "위시A"
    const idToDelete = result.current.items[0].id; // 위시B
    const remainingId = result.current.items[1].id; // 위시A
    act(() => {
      result.current.deleteWish(idToDelete);
    });
    expect(result.current.items[0].id).toBe(remainingId);
  });

  it("빈 items에서 삭제 시도는 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => {
      success = result.current.deleteWish("any-id");
    });
    expect(success!).toBe(false);
  });
});

// ============================================================
// voteWish
// ============================================================

describe("useGroupWishlist - voteWish", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("투표 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    let success: boolean;
    act(() => {
      success = result.current.voteWish(itemId);
    });
    expect(success!).toBe(true);
  });

  it("존재하지 않는 id 투표 시 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => {
      success = result.current.voteWish("non-existent");
    });
    expect(success!).toBe(false);
  });

  it("투표 후 votes가 1 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.voteWish(itemId);
    });
    expect(result.current.items[0].votes).toBe(1);
  });

  it("여러 번 투표 시 votes가 누적된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    act(() => { result.current.voteWish(itemId); });
    act(() => { result.current.voteWish(itemId); });
    act(() => { result.current.voteWish(itemId); });
    expect(result.current.items[0].votes).toBe(3);
  });
});

// ============================================================
// completeWish
// ============================================================

describe("useGroupWishlist - completeWish", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("완료 처리 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    let success: boolean;
    act(() => {
      success = result.current.completeWish(itemId);
    });
    expect(success!).toBe(true);
  });

  it("존재하지 않는 id 완료 처리 시 false를 반환한다", () => {
    const { result } = makeHook();
    let success: boolean;
    act(() => {
      success = result.current.completeWish("non-existent");
    });
    expect(success!).toBe(false);
  });

  it("완료 처리 후 isCompleted가 true가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.completeWish(itemId);
    });
    expect(result.current.items[0].isCompleted).toBe(true);
  });

  it("완료된 위시를 다시 처리하면 isCompleted가 false로 토글된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    act(() => { result.current.completeWish(itemId); });
    act(() => { result.current.completeWish(itemId); });
    expect(result.current.items[0].isCompleted).toBe(false);
  });

  it("완료 처리 후 completedCount가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.completeWish(itemId);
    });
    expect(result.current.completedCount).toBe(1);
  });

  it("완료된 위시가 다시 미완료로 전환되면 completedCount가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    act(() => { result.current.completeWish(itemId); });
    act(() => { result.current.completeWish(itemId); });
    expect(result.current.completedCount).toBe(0);
  });

  it("완료 처리 시 completedAt이 설정된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.completeWish(itemId);
    });
    expect(result.current.items[0].completedAt).toBeDefined();
  });

  it("완료 토글 해제 시 completedAt이 undefined가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const itemId = result.current.items[0].id;
    act(() => { result.current.completeWish(itemId); });
    act(() => { result.current.completeWish(itemId); });
    expect(result.current.items[0].completedAt).toBeUndefined();
  });
});

// ============================================================
// filterByCategory
// ============================================================

describe("useGroupWishlist - filterByCategory", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("category가 'all'이면 모든 아이템을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래1", "설명", "song", "high", "작성자");
    });
    act(() => {
      result.current.addWish("공연1", "설명", "performance", "medium", "작성자");
    });
    const found = result.current.filterByCategory("all");
    expect(found).toHaveLength(2);
  });

  it("특정 카테고리만 필터링된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래1", "설명", "song", "high", "작성자");
    });
    act(() => {
      result.current.addWish("공연1", "설명", "performance", "medium", "작성자");
    });
    act(() => {
      result.current.addWish("노래2", "설명", "song", "low", "작성자");
    });
    const found = result.current.filterByCategory("song");
    expect(found).toHaveLength(2);
    found.forEach((item) => expect(item.category).toBe("song"));
  });

  it("해당 카테고리가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래", "설명", "song", "high", "작성자");
    });
    const found = result.current.filterByCategory("workshop");
    expect(found).toHaveLength(0);
  });

  it("빈 items에서 'all' 필터링은 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const found = result.current.filterByCategory("all");
    expect(found).toHaveLength(0);
  });
});

// ============================================================
// sortByVotes
// ============================================================

describe("useGroupWishlist - sortByVotes", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("투표수 내림차순으로 정렬된다", () => {
    const items: WishlistItem[] = [
      { id: "a", title: "A", description: "", category: "song", priority: "high", proposedBy: "작성자", votes: 3, isCompleted: false, createdAt: "2026-03-01" },
      { id: "b", title: "B", description: "", category: "song", priority: "high", proposedBy: "작성자", votes: 7, isCompleted: false, createdAt: "2026-03-01" },
      { id: "c", title: "C", description: "", category: "song", priority: "high", proposedBy: "작성자", votes: 1, isCompleted: false, createdAt: "2026-03-01" },
    ];
    const { result } = makeHook();
    const sorted = result.current.sortByVotes(items);
    expect(sorted[0].votes).toBe(7);
    expect(sorted[1].votes).toBe(3);
    expect(sorted[2].votes).toBe(1);
  });

  it("투표수가 동일하면 createdAt 내림차순으로 정렬된다", () => {
    const items: WishlistItem[] = [
      { id: "a", title: "A", description: "", category: "song", priority: "high", proposedBy: "작성자", votes: 5, isCompleted: false, createdAt: "2026-03-01" },
      { id: "b", title: "B", description: "", category: "song", priority: "high", proposedBy: "작성자", votes: 5, isCompleted: false, createdAt: "2026-03-15" },
    ];
    const { result } = makeHook();
    const sorted = result.current.sortByVotes(items);
    expect(sorted[0].createdAt).toBe("2026-03-15");
  });

  it("원본 배열을 변경하지 않는다 (불변성)", () => {
    const items: WishlistItem[] = [
      { id: "a", title: "A", description: "", category: "song", priority: "high", proposedBy: "작성자", votes: 3, isCompleted: false, createdAt: "2026-03-01" },
      { id: "b", title: "B", description: "", category: "song", priority: "high", proposedBy: "작성자", votes: 7, isCompleted: false, createdAt: "2026-03-01" },
    ];
    const { result } = makeHook();
    const originalFirst = items[0].id;
    result.current.sortByVotes(items);
    expect(items[0].id).toBe(originalFirst);
  });

  it("빈 배열을 정렬하면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const sorted = result.current.sortByVotes([]);
    expect(sorted).toEqual([]);
  });

  it("단일 아이템 배열을 정렬해도 그대로 반환한다", () => {
    const items: WishlistItem[] = [
      { id: "a", title: "A", description: "", category: "song", priority: "high", proposedBy: "작성자", votes: 5, isCompleted: false, createdAt: "2026-03-01" },
    ];
    const { result } = makeHook();
    const sorted = result.current.sortByVotes(items);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe("a");
  });
});

// ============================================================
// topCategory 통계
// ============================================================

describe("useGroupWishlist - topCategory 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("미완료 아이템이 없으면 topCategory는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.topCategory).toBeNull();
  });

  it("가장 많은 카테고리가 topCategory로 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("노래1", "설명", "song", "high", "작성자");
    });
    act(() => {
      result.current.addWish("노래2", "설명", "song", "high", "작성자");
    });
    act(() => {
      result.current.addWish("공연1", "설명", "performance", "high", "작성자");
    });
    expect(result.current.topCategory).toBe("song");
  });

  it("완료된 아이템은 topCategory 집계에서 제외된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("공연1", "설명", "performance", "high", "작성자");
    });
    act(() => {
      result.current.addWish("노래1", "설명", "song", "high", "작성자");
    });
    act(() => {
      result.current.addWish("노래2", "설명", "song", "high", "작성자");
    });
    // items[0]="노래2", items[1]="노래1", items[2]="공연1" 순서
    // song 2개를 완료 처리
    const item0Id = result.current.items[0].id;
    const item1Id = result.current.items[1].id;
    act(() => { result.current.completeWish(item0Id); });
    act(() => { result.current.completeWish(item1Id); });
    // 미완료는 performance 1개만 남음
    expect(result.current.topCategory).toBe("performance");
  });

  it("아이템이 1개일 때 해당 카테고리가 topCategory이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addWish("워크샵", "설명", "workshop", "medium", "작성자");
    });
    expect(result.current.topCategory).toBe("workshop");
  });
});
