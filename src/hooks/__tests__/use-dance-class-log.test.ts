import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useDanceClassLog,
  CLASS_LOG_LEVEL_LABELS,
  CLASS_LOG_LEVEL_ORDER,
  CLASS_LOG_LEVEL_COLORS,
  CLASS_LOG_SOURCE_LABELS,
  CLASS_LOG_SOURCE_COLORS,
  SUGGESTED_CLASS_GENRES,
} from "@/hooks/use-dance-class-log";
import type { DanceClassLogEntry, DanceClassLogLevel, DanceClassLogSource } from "@/types";

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

// ─── local-storage 모듈 mock ──────────────────────────────────
vi.mock("@/lib/local-storage", () => ({
  saveToStorage: vi.fn((key: string, value: unknown) => {
    localStorageMock.setItem(key, JSON.stringify(value));
  }),
  loadFromStorage: vi.fn(() => null),
}));

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    danceClassLog: (id: string) => `dancebase:dance-class-log:${id}`,
  },
}));

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeEntry(overrides: Partial<Omit<DanceClassLogEntry, "id" | "createdAt" | "updatedAt">> = {}): Omit<DanceClassLogEntry, "id" | "createdAt" | "updatedAt"> {
  return {
    genre: "힙합",
    instructor: "김강사",
    date: "2026-02-01",
    level: "intermediate" as DanceClassLogLevel,
    source: "internal" as DanceClassLogSource,
    selfRating: 4,
    durationMin: 60,
    ...overrides,
  };
}

function makeHook(memberId = "member-1") {
  return renderHook(() => useDanceClassLog(memberId));
}

// ============================================================
// 상수 테스트
// ============================================================

describe("CLASS_LOG_LEVEL_LABELS - 레벨 레이블", () => {
  it("beginner 레이블이 올바르다", () => {
    expect(CLASS_LOG_LEVEL_LABELS.beginner).toBe("입문");
  });

  it("intermediate 레이블이 올바르다", () => {
    expect(CLASS_LOG_LEVEL_LABELS.intermediate).toBe("중급");
  });

  it("advanced 레이블이 올바르다", () => {
    expect(CLASS_LOG_LEVEL_LABELS.advanced).toBe("고급");
  });

  it("all_levels 레이블이 올바르다", () => {
    expect(CLASS_LOG_LEVEL_LABELS.all_levels).toBe("전 레벨");
  });
});

describe("CLASS_LOG_LEVEL_ORDER - 레벨 순서", () => {
  it("4개의 레벨이 순서대로 존재한다", () => {
    expect(CLASS_LOG_LEVEL_ORDER).toHaveLength(4);
  });

  it("beginner가 첫 번째이다", () => {
    expect(CLASS_LOG_LEVEL_ORDER[0]).toBe("beginner");
  });

  it("all_levels가 마지막이다", () => {
    expect(CLASS_LOG_LEVEL_ORDER[CLASS_LOG_LEVEL_ORDER.length - 1]).toBe("all_levels");
  });
});

describe("CLASS_LOG_LEVEL_COLORS - 레벨 색상", () => {
  it("모든 레벨에 badge, text, bar 색상이 정의되어 있다", () => {
    const levels: DanceClassLogLevel[] = ["beginner", "intermediate", "advanced", "all_levels"];
    levels.forEach((level) => {
      expect(CLASS_LOG_LEVEL_COLORS[level]).toBeDefined();
      expect(CLASS_LOG_LEVEL_COLORS[level].badge).toBeDefined();
      expect(CLASS_LOG_LEVEL_COLORS[level].text).toBeDefined();
      expect(CLASS_LOG_LEVEL_COLORS[level].bar).toBeDefined();
    });
  });

  it("beginner 색상에는 green이 포함된다", () => {
    expect(CLASS_LOG_LEVEL_COLORS.beginner.badge).toContain("green");
  });

  it("intermediate 색상에는 blue가 포함된다", () => {
    expect(CLASS_LOG_LEVEL_COLORS.intermediate.badge).toContain("blue");
  });

  it("advanced 색상에는 purple이 포함된다", () => {
    expect(CLASS_LOG_LEVEL_COLORS.advanced.badge).toContain("purple");
  });
});

describe("CLASS_LOG_SOURCE_LABELS - 출처 레이블", () => {
  it("internal 레이블이 올바르다", () => {
    expect(CLASS_LOG_SOURCE_LABELS.internal).toBe("그룹 내부");
  });

  it("external 레이블이 올바르다", () => {
    expect(CLASS_LOG_SOURCE_LABELS.external).toBe("외부 수강");
  });
});

describe("CLASS_LOG_SOURCE_COLORS - 출처 색상", () => {
  it("모든 출처에 badge, text 색상이 정의되어 있다", () => {
    const sources: DanceClassLogSource[] = ["internal", "external"];
    sources.forEach((source) => {
      expect(CLASS_LOG_SOURCE_COLORS[source].badge).toBeDefined();
      expect(CLASS_LOG_SOURCE_COLORS[source].text).toBeDefined();
    });
  });
});

describe("SUGGESTED_CLASS_GENRES - 장르 목록", () => {
  it("힙합이 포함되어 있다", () => {
    expect(SUGGESTED_CLASS_GENRES).toContain("힙합");
  });

  it("팝핀이 포함되어 있다", () => {
    expect(SUGGESTED_CLASS_GENRES).toContain("팝핀");
  });

  it("14개 이상의 장르가 있다", () => {
    expect(SUGGESTED_CLASS_GENRES.length).toBeGreaterThanOrEqual(14);
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useDanceClassLog - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.updateEntry).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.getByGenre).toBe("function");
    expect(typeof result.current.getByInstructor).toBe("function");
    expect(typeof result.current.getBySource).toBe("function");
    expect(typeof result.current.getByLevel).toBe("function");
    expect(typeof result.current.getMonthlyCount).toBe("function");
    expect(typeof result.current.getStats).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addEntry
// ============================================================

describe("useDanceClassLog - addEntry 수업 기록 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("수업 기록을 추가하면 entries 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry());
    });
    expect(result.current.entries).toHaveLength(1);
  });

  it("추가된 항목에 id가 부여된다", () => {
    const { result } = makeHook();
    let returned: DanceClassLogEntry;
    act(() => {
      returned = result.current.addEntry(makeEntry());
    });
    expect(returned!.id).toBeDefined();
    expect(returned!.id).not.toBe("");
  });

  it("추가된 항목의 genre가 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ genre: "왁킹" }));
    });
    expect(result.current.entries[0].genre).toBe("왁킹");
  });

  it("추가된 항목의 instructor가 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ instructor: "박선생" }));
    });
    expect(result.current.entries[0].instructor).toBe("박선생");
  });

  it("추가된 항목의 selfRating이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ selfRating: 5 }));
    });
    expect(result.current.entries[0].selfRating).toBe(5);
  });

  it("여러 항목 추가 시 date 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-01-01" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-03-01" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-02-01" }));
    });
    expect(result.current.entries[0].date).toBe("2026-03-01");
    expect(result.current.entries[2].date).toBe("2026-01-01");
  });

  it("durationMin이 없어도 항목이 추가된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ durationMin: undefined }));
    });
    expect(result.current.entries).toHaveLength(1);
  });
});

// ============================================================
// updateEntry
// ============================================================

describe("useDanceClassLog - updateEntry 수업 기록 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("항목의 genre를 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ genre: "힙합" }));
    });
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.updateEntry(entryId, { genre: "팝핀" });
    });
    expect(result.current.entries[0].genre).toBe("팝핀");
  });

  it("항목의 selfRating을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ selfRating: 3 }));
    });
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.updateEntry(entryId, { selfRating: 5 });
    });
    expect(result.current.entries[0].selfRating).toBe(5);
  });

  it("존재하지 않는 id로 수정 시 entries가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ genre: "힙합" }));
    });
    act(() => {
      result.current.updateEntry("non-existent", { genre: "왁킹" });
    });
    expect(result.current.entries[0].genre).toBe("힙합");
  });

  it("수정 후 date 기준 내림차순 정렬이 유지된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-01-10" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-03-10" }));
    });
    const id = result.current.entries[0].id; // 2026-03-10 항목
    act(() => {
      result.current.updateEntry(id, { date: "2025-12-01" });
    });
    // 날짜가 변경되어 내림차순 재정렬
    expect(result.current.entries[0].date).toBe("2026-01-10");
  });
});

// ============================================================
// deleteEntry
// ============================================================

describe("useDanceClassLog - deleteEntry 수업 기록 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("항목을 삭제하면 entries 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry());
    });
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.deleteEntry(entryId);
    });
    expect(result.current.entries).toHaveLength(0);
  });

  it("특정 항목만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ genre: "힙합" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ genre: "왁킹", date: "2026-01-01" }));
    });
    // 더 최신 날짜인 힙합(2026-02-01)이 인덱스 0
    const firstId = result.current.entries[0].id;
    act(() => {
      result.current.deleteEntry(firstId);
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].genre).toBe("왁킹");
  });
});

// ============================================================
// 필터 함수
// ============================================================

describe("useDanceClassLog - getByGenre 장르별 필터", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("특정 장르로 필터하면 해당 장르만 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ genre: "힙합" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ genre: "왁킹", date: "2026-01-15" }));
    });
    const filtered = result.current.getByGenre("힙합");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].genre).toBe("힙합");
  });

  it("'all'로 필터하면 모든 항목이 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ genre: "힙합" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ genre: "왁킹", date: "2026-01-15" }));
    });
    expect(result.current.getByGenre("all")).toHaveLength(2);
  });

  it("빈 문자열로 필터하면 모든 항목이 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry());
    });
    expect(result.current.getByGenre("")).toHaveLength(1);
  });
});

describe("useDanceClassLog - getByInstructor 강사별 필터", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("특정 강사로 필터하면 해당 강사만 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ instructor: "이강사" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ instructor: "박강사", date: "2026-01-15" }));
    });
    const filtered = result.current.getByInstructor("이강사");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].instructor).toBe("이강사");
  });

  it("'all'로 필터하면 모든 항목이 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ instructor: "A강사" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ instructor: "B강사", date: "2026-01-15" }));
    });
    expect(result.current.getByInstructor("all")).toHaveLength(2);
  });
});

describe("useDanceClassLog - getBySource 출처별 필터", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("internal 출처로 필터하면 해당 항목만 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ source: "internal" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ source: "external", date: "2026-01-15" }));
    });
    const filtered = result.current.getBySource("internal");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].source).toBe("internal");
  });

  it("'all'로 필터하면 모든 항목이 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ source: "internal" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ source: "external", date: "2026-01-15" }));
    });
    expect(result.current.getBySource("all")).toHaveLength(2);
  });
});

describe("useDanceClassLog - getByLevel 레벨별 필터", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("beginner 레벨로 필터하면 해당 항목만 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ level: "beginner" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ level: "advanced", date: "2026-01-15" }));
    });
    const filtered = result.current.getByLevel("beginner");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].level).toBe("beginner");
  });

  it("'all'로 필터하면 모든 항목이 반환된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ level: "beginner" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ level: "advanced", date: "2026-01-15" }));
    });
    expect(result.current.getByLevel("all")).toHaveLength(2);
  });
});

describe("useDanceClassLog - getMonthlyCount 월별 수업 수", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("해당 월의 수업 수를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-02-01" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-02-15" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-03-01" }));
    });
    expect(result.current.getMonthlyCount("2026-02")).toBe(2);
  });

  it("해당 월에 수업이 없으면 0을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getMonthlyCount("2025-01")).toBe(0);
  });
});

// ============================================================
// getStats
// ============================================================

describe("useDanceClassLog - getStats 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("entries가 없을 때 total이 0이다", () => {
    const { result } = makeHook();
    expect(result.current.getStats().total).toBe(0);
  });

  it("entries가 없을 때 avgRating이 0이다", () => {
    const { result } = makeHook();
    expect(result.current.getStats().avgRating).toBe(0);
  });

  it("total이 entries 수와 동일하다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ selfRating: 4 }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ selfRating: 5, date: "2026-01-15" }));
    });
    expect(result.current.getStats().total).toBe(2);
  });

  it("avgRating이 올바르게 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ selfRating: 4 }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ selfRating: 2, date: "2026-01-15" }));
    });
    // (4 + 2) / 2 = 3.0
    expect(result.current.getStats().avgRating).toBe(3);
  });

  it("totalDurationMin이 올바르게 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ durationMin: 60 }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ durationMin: 90, date: "2026-01-15" }));
    });
    expect(result.current.getStats().totalDurationMin).toBe(150);
  });

  it("durationMin이 없는 항목은 0으로 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ durationMin: undefined }));
    });
    expect(result.current.getStats().totalDurationMin).toBe(0);
  });

  it("byGenre가 올바르게 집계된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ genre: "힙합" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ genre: "힙합", date: "2026-01-15" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ genre: "왁킹", date: "2026-01-10" }));
    });
    const stats = result.current.getStats();
    expect(stats.byGenre["힙합"]).toBe(2);
    expect(stats.byGenre["왁킹"]).toBe(1);
  });

  it("bySource가 올바르게 집계된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ source: "internal" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ source: "external", date: "2026-01-15" }));
    });
    const stats = result.current.getStats();
    expect(stats.bySource.internal).toBe(1);
    expect(stats.bySource.external).toBe(1);
  });

  it("instructors가 중복 없이 정렬되어 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ instructor: "B강사" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ instructor: "A강사", date: "2026-01-15" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ instructor: "B강사", date: "2026-01-10" }));
    });
    const stats = result.current.getStats();
    expect(stats.instructors).toHaveLength(2);
    // sort 정렬 확인
    expect(stats.instructors[0]).toBe("A강사");
    expect(stats.instructors[1]).toBe("B강사");
  });

  it("genres가 중복 없이 존재한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntry({ genre: "힙합" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ genre: "힙합", date: "2026-01-15" }));
    });
    act(() => {
      result.current.addEntry(makeEntry({ genre: "왁킹", date: "2026-01-10" }));
    });
    const stats = result.current.getStats();
    expect(stats.genres).toHaveLength(2);
  });
});

// ============================================================
// 멤버별 격리
// ============================================================

describe("useDanceClassLog - 멤버별 데이터 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("다른 memberId는 독립적인 entries를 가진다", () => {
    const { result: r1 } = renderHook(() => useDanceClassLog("member-A"));
    const { result: r2 } = renderHook(() => useDanceClassLog("member-B"));

    act(() => {
      r1.current.addEntry(makeEntry({ genre: "A의 수업" }));
    });

    expect(r1.current.entries).toHaveLength(1);
    expect(r2.current.entries).toHaveLength(0);
  });
});
