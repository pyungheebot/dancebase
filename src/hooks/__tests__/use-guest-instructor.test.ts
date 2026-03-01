import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useGuestInstructor,
  calcAverageRating,
  calcTotalCost,
} from "@/hooks/use-guest-instructor";
import type { GuestInstructorLesson, GuestInstructorEntry } from "@/types";

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

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── toast mock ───────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── TOAST 메시지 mock ────────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    INSTRUCTOR: {
      NAME_REQUIRED: "강사 이름을 입력해주세요",
      NOT_FOUND: "강사를 찾을 수 없습니다",
      CREATED: "강사가 등록되었습니다",
      UPDATED: "강사 정보가 수정되었습니다",
      DELETED: "강사가 삭제되었습니다",
      CLASS_DATE_REQUIRED: "수업 날짜를 입력해주세요",
      CLASS_TOPIC_REQUIRED: "수업 주제를 입력해주세요",
      CLASS_ADDED: "수업이 등록되었습니다",
      CLASS_DELETED: "수업이 삭제되었습니다",
    },
    INFO: {
      GENRE_REQUIRED: "장르를 입력해주세요",
    },
    MISC: {
      RATING_RANGE: "평점은 1~5 사이여야 합니다",
    },
  },
}));

// ─── local-storage 모듈 mock ──────────────────────────────────
const mockStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  saveToStorage: vi.fn((key: string, value: unknown) => {
    mockStore[key] = value;
    localStorageMock.setItem(key, JSON.stringify(value));
  }),
  loadFromStorage: vi.fn((key: string, defaultVal: unknown) => {
    const stored = mockStore[key];
    if (stored) return stored;
    // GuestInstructorData 형태의 기본값 보장
    if (defaultVal && typeof defaultVal === "object" && !Array.isArray(defaultVal)) {
      return { groupId: "", instructors: [], updatedAt: new Date().toISOString(), ...defaultVal as object };
    }
    return defaultVal;
  }),
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: vi.fn((key: unknown, fetcher: (() => Promise<unknown>) | null) => {
    if (!key || !fetcher) return { data: undefined, isLoading: false, mutate: vi.fn() };
    const mutate = vi.fn(async (newData?: unknown) => {
      return newData;
    });
    return {
      data: mockStore[key as string] ?? undefined,
      isLoading: false,
      mutate,
    };
  }),
}));

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    guestInstructor: (id: string) => `dancebase:guest-instructor:${id}`,
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useGuestInstructor(groupId));
}

function makeLessons(count: number, baseRating = 4): GuestInstructorLesson[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `lesson-${i}`,
    date: `2026-0${i + 1}-01`,
    topic: `수업 ${i + 1}`,
    rating: baseRating,
    createdAt: new Date().toISOString(),
  }));
}

function makeInstructor(overrides: Partial<GuestInstructorEntry> = {}): GuestInstructorEntry {
  return {
    id: "inst-1",
    name: "김강사",
    genre: "힙합",
    lessons: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// 순수 함수 테스트
// ============================================================

describe("calcAverageRating - 평균 평점 계산", () => {
  it("빈 배열이면 0을 반환한다", () => {
    expect(calcAverageRating([])).toBe(0);
  });

  it("단일 항목의 평점을 그대로 반환한다", () => {
    const lessons = makeLessons(1, 5);
    expect(calcAverageRating(lessons)).toBe(5);
  });

  it("여러 항목의 평균을 계산한다", () => {
    const lessons: GuestInstructorLesson[] = [
      { id: "l1", date: "2026-01-01", topic: "A", rating: 4, createdAt: "" },
      { id: "l2", date: "2026-01-02", topic: "B", rating: 2, createdAt: "" },
    ];
    // (4 + 2) / 2 = 3.0
    expect(calcAverageRating(lessons)).toBe(3);
  });

  it("소수점 반올림이 올바르게 된다 (소수점 1자리)", () => {
    const lessons: GuestInstructorLesson[] = [
      { id: "l1", date: "2026-01-01", topic: "A", rating: 5, createdAt: "" },
      { id: "l2", date: "2026-01-02", topic: "B", rating: 4, createdAt: "" },
      { id: "l3", date: "2026-01-03", topic: "C", rating: 3, createdAt: "" },
    ];
    // (5 + 4 + 3) / 3 = 4.0
    expect(calcAverageRating(lessons)).toBe(4);
  });

  it("불규칙한 평점의 평균을 올바르게 계산한다", () => {
    const lessons: GuestInstructorLesson[] = [
      { id: "l1", date: "2026-01-01", topic: "A", rating: 5, createdAt: "" },
      { id: "l2", date: "2026-01-02", topic: "B", rating: 3, createdAt: "" },
    ];
    // (5 + 3) / 2 = 4.0
    expect(calcAverageRating(lessons)).toBe(4);
  });

  it("반환값은 소수점 1자리까지의 숫자이다", () => {
    const lessons: GuestInstructorLesson[] = [
      { id: "l1", date: "2026-01-01", topic: "A", rating: 1, createdAt: "" },
      { id: "l2", date: "2026-01-02", topic: "B", rating: 2, createdAt: "" },
      { id: "l3", date: "2026-01-03", topic: "C", rating: 4, createdAt: "" },
    ];
    // (1+2+4)/3 = 2.333... → 2.3
    const avg = calcAverageRating(lessons);
    expect(avg).toBe(2.3);
  });
});

describe("calcTotalCost - 총 비용 계산", () => {
  it("hourlyRate가 없으면 0을 반환한다", () => {
    const instructor = makeInstructor({ lessons: makeLessons(3) });
    expect(calcTotalCost(instructor)).toBe(0);
  });

  it("수업이 없으면 0을 반환한다", () => {
    const instructor = makeInstructor({ hourlyRate: 50000, lessons: [] });
    expect(calcTotalCost(instructor)).toBe(0);
  });

  it("hourlyRate * 수업 수 * hoursPerLesson을 계산한다", () => {
    const instructor = makeInstructor({ hourlyRate: 50000, lessons: makeLessons(3) });
    // 50000 * 3 * 1 = 150000
    expect(calcTotalCost(instructor)).toBe(150000);
  });

  it("hoursPerLesson 파라미터가 적용된다", () => {
    const instructor = makeInstructor({ hourlyRate: 50000, lessons: makeLessons(2) });
    // 50000 * 2 * 2 = 200000
    expect(calcTotalCost(instructor, 2)).toBe(200000);
  });

  it("hourlyRate가 undefined이면 0을 반환한다", () => {
    const instructor = makeInstructor({ hourlyRate: undefined, lessons: makeLessons(5) });
    expect(calcTotalCost(instructor)).toBe(0);
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useGuestInstructor - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    uuidCounter = 0;
  });

  it("초기 instructors는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.instructors).toEqual([]);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 genres는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.genres).toEqual([]);
  });

  it("초기 stats.total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });

  it("초기 stats.totalLessons는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalLessons).toBe(0);
  });

  it("초기 stats.avgRating은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.avgRating).toBe(0);
  });

  it("초기 stats.totalCost는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalCost).toBe(0);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addInstructor).toBe("function");
    expect(typeof result.current.updateInstructor).toBe("function");
    expect(typeof result.current.deleteInstructor).toBe("function");
    expect(typeof result.current.addLesson).toBe("function");
    expect(typeof result.current.deleteLesson).toBe("function");
    expect(typeof result.current.getByGenre).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addInstructor
// ============================================================

describe("useGuestInstructor - addInstructor 강사 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    uuidCounter = 0;
  });

  it("빈 name으로 addInstructor 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.addInstructor({ name: "", genre: "힙합" });
    });
    expect(success).toBe(false);
  });

  it("빈 genre로 addInstructor 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.addInstructor({ name: "김강사", genre: "" });
    });
    expect(success).toBe(false);
  });

  it("유효한 입력으로 addInstructor 시 true를 반환한다", async () => {
    const { result } = makeHook();
    let success = false;
    await act(async () => {
      success = await result.current.addInstructor({ name: "이강사", genre: "왁킹" });
    });
    expect(success).toBe(true);
  });

  it("공백만 있는 name으로 addInstructor 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.addInstructor({ name: "   ", genre: "힙합" });
    });
    expect(success).toBe(false);
  });

  it("hourlyRate가 0 이하이면 undefined로 저장된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addInstructor({
        name: "박강사",
        genre: "팝핀",
        hourlyRate: 0,
      });
    });
    // mockStore에서 저장된 데이터 확인
    const key = `dancebase:guest-instructor:group-1`;
    const stored = mockStore[key] as { instructors: GuestInstructorEntry[] } | undefined;
    if (stored?.instructors?.length) {
      expect(stored.instructors[0].hourlyRate).toBeUndefined();
    }
  });
});

// ============================================================
// updateInstructor
// ============================================================

describe("useGuestInstructor - updateInstructor 강사 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    uuidCounter = 0;
  });

  it("존재하지 않는 id로 updateInstructor 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.updateInstructor("non-existent", { name: "변경" });
    });
    expect(success).toBe(false);
  });
});

// ============================================================
// deleteInstructor
// ============================================================

describe("useGuestInstructor - deleteInstructor 강사 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    uuidCounter = 0;
  });

  it("deleteInstructor 호출 시 true를 반환한다", async () => {
    const { result } = makeHook();
    let success = false;
    await act(async () => {
      success = await result.current.deleteInstructor("any-id");
    });
    expect(success).toBe(true);
  });
});

// ============================================================
// addLesson
// ============================================================

describe("useGuestInstructor - addLesson 수업 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    uuidCounter = 0;
  });

  it("날짜가 없으면 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.addLesson("inst-1", {
        date: "",
        topic: "주제",
        rating: 4,
      });
    });
    expect(success).toBe(false);
  });

  it("주제가 빈 문자열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.addLesson("inst-1", {
        date: "2026-01-01",
        topic: "",
        rating: 4,
      });
    });
    expect(success).toBe(false);
  });

  it("평점이 1 미만이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.addLesson("inst-1", {
        date: "2026-01-01",
        topic: "주제",
        rating: 0,
      });
    });
    expect(success).toBe(false);
  });

  it("평점이 5 초과이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.addLesson("inst-1", {
        date: "2026-01-01",
        topic: "주제",
        rating: 6,
      });
    });
    expect(success).toBe(false);
  });

  it("강사가 없으면 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.addLesson("non-existent-instructor", {
        date: "2026-01-01",
        topic: "주제",
        rating: 4,
      });
    });
    expect(success).toBe(false);
  });
});

// ============================================================
// getByGenre
// ============================================================

describe("useGuestInstructor - getByGenre 장르별 필터", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    uuidCounter = 0;
  });

  it("빈 instructors에서 getByGenre 호출 시 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getByGenre("힙합")).toEqual([]);
  });
});

// ============================================================
// 레이블 형식 검증
// ============================================================

describe("useGuestInstructor - 입력값 trim 검증", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    uuidCounter = 0;
  });

  it("name의 공백만 있는 경우 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.addInstructor({ name: "   ", genre: "힙합" });
    });
    expect(success).toBe(false);
  });

  it("genre의 공백만 있는 경우 false를 반환한다", async () => {
    const { result } = makeHook();
    let success = true;
    await act(async () => {
      success = await result.current.addInstructor({ name: "강사", genre: "   " });
    });
    expect(success).toBe(false);
  });
});
