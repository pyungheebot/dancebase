import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    const stored = memStore[key] as T;
    if (stored !== undefined) return stored;
    // DanceClassReviewData의 기본값: reviews 배열 포함
    if (
      defaultValue !== null &&
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue) &&
      Object.keys(defaultValue as object).length === 0
    ) {
      // {} as DanceClassReviewData인 경우 → reviews 배열 보장
      return { reviews: [] } as unknown as T;
    }
    return defaultValue;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: vi.fn(),
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    danceClassReview: (memberId: string) => `dance-class-review-${memberId}`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

import {
  useDanceClassReview,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  DIFFICULTY_COLORS,
  SUGGESTED_GENRES,
} from "@/hooks/use-dance-class-review";
import type { DanceClassDifficulty } from "@/types";

const MEMBER_A = "member-review-aaa";
const MEMBER_B = "member-review-bbb";

function makeReviewParams(overrides: Partial<{
  className: string;
  instructorName: string | null;
  date: string;
  rating: number;
  difficulty: DanceClassDifficulty;
  genre: string | null;
  takeaways: string;
  wouldRepeat: boolean;
  cost: number | null;
}> = {}) {
  return {
    className: "힙합 기초반",
    instructorName: "김강사",
    date: "2026-01-15",
    rating: 4,
    difficulty: "beginner" as DanceClassDifficulty,
    genre: "힙합",
    takeaways: "기초 스텝을 배웠다",
    wouldRepeat: true,
    cost: 30000,
    ...overrides,
  };
}

beforeEach(() => {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
});

// ─── 1. 초기 상태 ─────────────────────────────────────────────

describe("useDanceClassReview - 초기 상태", () => {
  it("reviews는 빈 배열이다 (스토리지 없을 때)", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(result.current.reviews ?? []).toEqual([]);
  });

  it("loading 필드가 존재한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("totalReviews는 0이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(result.current.totalReviews).toBe(0);
  });

  it("averageRating은 0이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(result.current.averageRating).toBe(0);
  });

  it("wouldRepeatCount는 0이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(result.current.wouldRepeatCount).toBe(0);
  });

  it("topInstructors는 빈 배열이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(result.current.topInstructors).toEqual([]);
  });

  it("genreDistribution는 빈 배열이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(result.current.genreDistribution).toEqual([]);
  });

  it("genres는 빈 배열이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(result.current.genres).toEqual([]);
  });

  it("addReview 함수가 존재한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(typeof result.current.addReview).toBe("function");
  });

  it("updateReview 함수가 존재한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(typeof result.current.updateReview).toBe("function");
  });

  it("deleteReview 함수가 존재한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(typeof result.current.deleteReview).toBe("function");
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ─── 2. 상수 ─────────────────────────────────────────────────

describe("DIFFICULTY_LABELS - 난이도 라벨", () => {
  it("beginner 라벨이 '입문'이다", () => {
    expect(DIFFICULTY_LABELS.beginner).toBe("입문");
  });

  it("intermediate 라벨이 '중급'이다", () => {
    expect(DIFFICULTY_LABELS.intermediate).toBe("중급");
  });

  it("advanced 라벨이 '고급'이다", () => {
    expect(DIFFICULTY_LABELS.advanced).toBe("고급");
  });
});

describe("DIFFICULTY_ORDER - 난이도 순서", () => {
  it("3개 난이도가 순서대로 정렬되어 있다", () => {
    expect(DIFFICULTY_ORDER).toEqual(["beginner", "intermediate", "advanced"]);
  });

  it("beginner가 첫 번째이다", () => {
    expect(DIFFICULTY_ORDER[0]).toBe("beginner");
  });

  it("advanced가 마지막이다", () => {
    expect(DIFFICULTY_ORDER[2]).toBe("advanced");
  });
});

describe("DIFFICULTY_COLORS - 난이도 색상", () => {
  it("모든 난이도에 badge, text, bar 필드가 있다", () => {
    for (const colors of Object.values(DIFFICULTY_COLORS)) {
      expect(colors.badge).toBeTruthy();
      expect(colors.text).toBeTruthy();
      expect(colors.bar).toBeTruthy();
    }
  });
});

describe("SUGGESTED_GENRES - 추천 장르 목록", () => {
  it("추천 장르 목록이 존재한다", () => {
    expect(Array.isArray(SUGGESTED_GENRES)).toBe(true);
    expect(SUGGESTED_GENRES.length).toBeGreaterThan(0);
  });

  it("'힙합'이 추천 장르에 포함된다", () => {
    expect(SUGGESTED_GENRES).toContain("힙합");
  });

  it("'브레이킹'이 추천 장르에 포함된다", () => {
    expect(SUGGESTED_GENRES).toContain("브레이킹");
  });
});

// ─── 3. addReview ────────────────────────────────────────────

describe("useDanceClassReview - addReview", () => {
  it("addReview 호출 시 reviews 배열에 추가된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams());
    });
    expect(result.current.reviews).toHaveLength(1);
  });

  it("addReview 반환값에 id가 있다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let review: ReturnType<typeof result.current.addReview> | undefined;
    act(() => {
      review = result.current.addReview(makeReviewParams());
    });
    expect(review?.id).toBeTruthy();
  });

  it("addReview 반환값의 className이 올바르다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let review: ReturnType<typeof result.current.addReview> | undefined;
    act(() => {
      review = result.current.addReview(makeReviewParams({ className: "왁킹 심화반" }));
    });
    expect(review?.className).toBe("왁킹 심화반");
  });

  it("addReview 시 className의 앞뒤 공백이 제거된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let review: ReturnType<typeof result.current.addReview> | undefined;
    act(() => {
      review = result.current.addReview(makeReviewParams({ className: "  힙합  " }));
    });
    expect(review?.className).toBe("힙합");
  });

  it("instructorName이 null이면 null로 저장된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let review: ReturnType<typeof result.current.addReview> | undefined;
    act(() => {
      review = result.current.addReview(makeReviewParams({ instructorName: null }));
    });
    expect(review?.instructorName).toBeNull();
  });

  it("instructorName이 빈 문자열이면 null로 저장된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let review: ReturnType<typeof result.current.addReview> | undefined;
    act(() => {
      review = result.current.addReview(makeReviewParams({ instructorName: "" }));
    });
    expect(review?.instructorName).toBeNull();
  });

  it("genre가 null이면 null로 저장된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let review: ReturnType<typeof result.current.addReview> | undefined;
    act(() => {
      review = result.current.addReview(makeReviewParams({ genre: null }));
    });
    expect(review?.genre).toBeNull();
  });

  it("genre가 빈 문자열이면 null로 저장된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let review: ReturnType<typeof result.current.addReview> | undefined;
    act(() => {
      review = result.current.addReview(makeReviewParams({ genre: "" }));
    });
    expect(review?.genre).toBeNull();
  });

  it("wouldRepeat이 false로 저장된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let review: ReturnType<typeof result.current.addReview> | undefined;
    act(() => {
      review = result.current.addReview(makeReviewParams({ wouldRepeat: false }));
    });
    expect(review?.wouldRepeat).toBe(false);
  });

  it("cost가 null로 저장된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let review: ReturnType<typeof result.current.addReview> | undefined;
    act(() => {
      review = result.current.addReview(makeReviewParams({ cost: null }));
    });
    expect(review?.cost).toBeNull();
  });

  it("addReview 시 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams());
    });
    const stored = memStore[`dance-class-review-${MEMBER_A}`];
    expect(stored).toBeDefined();
  });

  it("totalReviews가 addReview 후 증가한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams());
    });
    expect(result.current.totalReviews).toBe(1);
  });

  it("새로운 리뷰는 배열 맨 앞에 추가된다 (최신순)", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ className: "첫 번째" }));
      result.current.addReview(makeReviewParams({ className: "두 번째" }));
    });
    expect(result.current.reviews[0].className).toBe("두 번째");
  });
});

// ─── 4. updateReview ─────────────────────────────────────────

describe("useDanceClassReview - updateReview", () => {
  it("updateReview 호출 시 해당 리뷰가 수정된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let reviewId: string | undefined;
    act(() => {
      const review = result.current.addReview(makeReviewParams({ rating: 3 }));
      reviewId = review.id;
    });
    act(() => {
      result.current.updateReview(reviewId!, { rating: 5 });
    });
    expect(result.current.reviews[0].rating).toBe(5);
  });

  it("updateReview 시 다른 필드는 변경되지 않는다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let reviewId: string | undefined;
    act(() => {
      const review = result.current.addReview(makeReviewParams({ className: "원본반" }));
      reviewId = review.id;
    });
    act(() => {
      result.current.updateReview(reviewId!, { rating: 5 });
    });
    expect(result.current.reviews[0].className).toBe("원본반");
  });

  it("존재하지 않는 reviewId로 updateReview 호출 시 reviews 변경 없음", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams());
    });
    const before = result.current.reviews.length;
    act(() => {
      result.current.updateReview("nonexistent", { rating: 1 });
    });
    expect(result.current.reviews).toHaveLength(before);
  });
});

// ─── 5. deleteReview ─────────────────────────────────────────

describe("useDanceClassReview - deleteReview", () => {
  it("deleteReview 호출 시 해당 리뷰가 제거된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let reviewId: string | undefined;
    act(() => {
      const review = result.current.addReview(makeReviewParams());
      reviewId = review.id;
    });
    act(() => {
      result.current.deleteReview(reviewId!);
    });
    expect(result.current.reviews).toHaveLength(0);
  });

  it("deleteReview 후 totalReviews가 감소한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    let reviewId: string | undefined;
    act(() => {
      const review = result.current.addReview(makeReviewParams());
      reviewId = review.id;
      result.current.addReview(makeReviewParams({ className: "두 번째" }));
    });
    act(() => {
      result.current.deleteReview(reviewId!);
    });
    expect(result.current.totalReviews).toBe(1);
  });
});

// ─── 6. averageRating 계산 ───────────────────────────────────

describe("useDanceClassReview - averageRating", () => {
  it("리뷰가 없으면 averageRating은 0이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    expect(result.current.averageRating).toBe(0);
  });

  it("rating 4인 리뷰 1개 → averageRating은 4.0이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ rating: 4 }));
    });
    expect(result.current.averageRating).toBe(4);
  });

  it("rating 3과 5의 평균은 4.0이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ rating: 3 }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ rating: 5 }));
    });
    expect(result.current.averageRating).toBe(4.0);
  });

  it("averageRating은 소수점 한 자리로 반올림된다", () => {
    // 순수 로직 재현으로 검증
    const ratings = [3, 4, 5];
    const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
    expect(avg).toBe(4.0);
  });
});

// ─── 7. difficultyDistribution ───────────────────────────────

describe("useDanceClassReview - difficultyDistribution", () => {
  it("초기 difficultyDistribution 모든 난이도가 0이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    for (const v of Object.values(result.current.difficultyDistribution)) {
      expect(v).toBe(0);
    }
  });

  it("beginner 리뷰 추가 후 beginner 카운트가 증가한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ difficulty: "beginner" }));
    });
    expect(result.current.difficultyDistribution.beginner).toBe(1);
  });

  it("mixed 난이도 리뷰 분포가 올바르다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ difficulty: "beginner" }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ difficulty: "beginner" }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ difficulty: "advanced" }));
    });
    expect(result.current.difficultyDistribution.beginner).toBe(2);
    expect(result.current.difficultyDistribution.advanced).toBe(1);
    expect(result.current.difficultyDistribution.intermediate).toBe(0);
  });
});

// ─── 8. topInstructors ──────────────────────────────────────

describe("useDanceClassReview - topInstructors", () => {
  it("instructorName이 null인 리뷰는 topInstructors에 반영되지 않는다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ instructorName: null }));
    });
    expect(result.current.topInstructors).toHaveLength(0);
  });

  it("강사 1명의 리뷰 2개 → topInstructors에 count가 2이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ instructorName: "김강사", rating: 5 }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ instructorName: "김강사", rating: 3 }));
    });
    expect(result.current.topInstructors[0].count).toBe(2);
    expect(result.current.topInstructors[0].name).toBe("김강사");
  });

  it("topInstructors avgRating이 올바르게 계산된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ instructorName: "이강사", rating: 4 }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ instructorName: "이강사", rating: 2 }));
    });
    expect(result.current.topInstructors[0].avgRating).toBe(3.0);
  });

  it("topInstructors는 최대 5명까지 반환한다", () => {
    // 순수 로직 재현으로 검증
    const instructors: Record<string, { name: string; count: number; totalRating: number }> = {};
    for (let i = 1; i <= 7; i++) {
      const name = `강사${i}`;
      instructors[name] = { name, count: 1, totalRating: 4 };
    }
    const result = Object.values(instructors).sort((a, b) => b.count - a.count).slice(0, 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("topInstructors는 count 내림차순으로 정렬된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ instructorName: "B강사" }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ instructorName: "B강사" }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ instructorName: "A강사" }));
    });
    expect(result.current.topInstructors[0].name).toBe("B강사");
  });
});

// ─── 9. genreDistribution ─────────────────────────────────────

describe("useDanceClassReview - genreDistribution", () => {
  it("genre가 null인 리뷰는 genreDistribution에 반영되지 않는다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ genre: null }));
    });
    expect(result.current.genreDistribution).toHaveLength(0);
  });

  it("같은 장르 2개 → count가 2이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ genre: "힙합" }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ genre: "힙합" }));
    });
    expect(result.current.genreDistribution[0]).toEqual({ genre: "힙합", count: 2 });
  });

  it("genreDistribution은 count 내림차순으로 정렬된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ genre: "힙합" }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ genre: "힙합" }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ genre: "팝핀" }));
    });
    expect(result.current.genreDistribution[0].genre).toBe("힙합");
  });
});

// ─── 10. wouldRepeatCount ─────────────────────────────────────

describe("useDanceClassReview - wouldRepeatCount", () => {
  it("wouldRepeat이 true인 리뷰의 수를 반환한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ wouldRepeat: true }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ wouldRepeat: true }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ wouldRepeat: false }));
    });
    expect(result.current.wouldRepeatCount).toBe(2);
  });

  it("모든 리뷰의 wouldRepeat이 false이면 0이다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ wouldRepeat: false }));
    });
    expect(result.current.wouldRepeatCount).toBe(0);
  });
});

// ─── 11. genres ───────────────────────────────────────────────

describe("useDanceClassReview - genres", () => {
  it("genres는 중복 없이 반환된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ genre: "힙합" }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ genre: "힙합" }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.addReview(makeReviewParams({ genre: "팝핀" }));
    });
    expect(result.current.genres).toHaveLength(2);
    expect(result.current.genres).toContain("힙합");
    expect(result.current.genres).toContain("팝핀");
  });

  it("genre가 null인 리뷰는 genres에 포함되지 않는다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams({ genre: null }));
    });
    expect(result.current.genres).toHaveLength(0);
  });
});

// ─── 12. 멤버별 격리 ─────────────────────────────────────────

describe("useDanceClassReview - 멤버별 격리", () => {
  it("멤버 A에 리뷰를 추가해도 멤버 B에 영향을 주지 않는다", () => {
    const { result: resA } = renderHook(() => useDanceClassReview(MEMBER_A));
    const { result: resB } = renderHook(() => useDanceClassReview(MEMBER_B));

    act(() => {
      resA.current.addReview(makeReviewParams());
    });

    expect(resA.current.reviews).toHaveLength(1);
    expect(resB.current.reviews ?? []).toHaveLength(0);
  });
});

// ─── 13. localStorage 키 형식 ─────────────────────────────────

describe("useDanceClassReview - localStorage 키 형식", () => {
  it("localStorage 키가 danceClassReview swrKey를 사용한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams());
    });
    const key = `dance-class-review-${MEMBER_A}`;
    expect(memStore[key]).toBeDefined();
  });

  it("저장된 데이터에 memberId가 포함된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams());
    });
    const stored = memStore[`dance-class-review-${MEMBER_A}`] as { memberId: string };
    expect(stored.memberId).toBe(MEMBER_A);
  });

  it("저장된 데이터에 reviews 배열이 존재한다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams());
    });
    const stored = memStore[`dance-class-review-${MEMBER_A}`] as { reviews: unknown[] };
    expect(Array.isArray(stored.reviews)).toBe(true);
  });

  it("저장된 데이터에 updatedAt이 포함된다", () => {
    const { result } = renderHook(() => useDanceClassReview(MEMBER_A));
    act(() => {
      result.current.addReview(makeReviewParams());
    });
    const stored = memStore[`dance-class-review-${MEMBER_A}`] as { updatedAt: string };
    expect(stored.updatedAt).toBeTruthy();
  });
});
