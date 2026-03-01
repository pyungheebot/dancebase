import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDanceDiary } from "@/hooks/use-dance-diary";
import type { DiaryCardEntry, DiaryCardEmotion } from "@/types";

// ─── SWR mock ─────────────────────────────────────────────────
// useState 기반으로 구현하여 mutate 즉시 반영
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

vi.mock("swr", () => {
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        const [data] = reactUseState<unknown>(undefined);
        return { data, isLoading: false, mutate: vi.fn() };
      }

      const [data, setData] = reactUseState<unknown>(() => fetcher());

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setData(newData);
        } else {
          setData(fetcher!());
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
function resetSWRStore() {}

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    danceDiary: (memberId: string) => `dance-diary:${memberId}`,
  },
}));

// ─── localStorage mock ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _store: () => store,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── 헬퍼 ────────────────────────────────────────────────────
type EntryInput = Omit<DiaryCardEntry, "id" | "memberId" | "createdAt" | "updatedAt">;

function makeEntryInput(overrides: Partial<EntryInput> = {}): EntryInput {
  return {
    date: "2026-03-01",
    title: "오늘의 연습",
    content: "열심히 했다",
    emotion: "happy",
    condition: 4,
    ...overrides,
  };
}

function makeHook(memberId = "member-1") {
  return renderHook(() => useDanceDiary(memberId));
}

// ============================================================
// useDanceDiary - 초기 상태
// ============================================================

describe("useDanceDiary - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("필요한 함수가 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.updateEntry).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.getEntriesByEmotion).toBe("function");
    expect(typeof result.current.getMonthHeatmap).toBe("function");
    expect(typeof result.current.getEmotionStats).toBe("function");
    expect(typeof result.current.getConditionTrend).toBe("function");
    expect(typeof result.current.getStreak).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useDanceDiary - addEntry
// ============================================================

describe("useDanceDiary - addEntry", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("일기 추가 후 entries 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEntry(makeEntryInput()); });
    expect(result.current.entries).toHaveLength(1);
  });

  it("추가된 일기에 id가 부여된다", () => {
    const { result } = makeHook();
    let entry: DiaryCardEntry;
    act(() => { entry = result.current.addEntry(makeEntryInput()); });
    expect(entry!.id).toBeDefined();
    expect(entry!.id).not.toBe("");
  });

  it("추가된 일기에 memberId가 설정된다", () => {
    const { result } = makeHook("member-42");
    let entry: DiaryCardEntry;
    act(() => { entry = result.current.addEntry(makeEntryInput()); });
    expect(entry!.memberId).toBe("member-42");
  });

  it("추가된 일기에 createdAt이 설정된다", () => {
    const { result } = makeHook();
    let entry: DiaryCardEntry;
    act(() => { entry = result.current.addEntry(makeEntryInput()); });
    expect(entry!.createdAt).toBeDefined();
  });

  it("추가된 일기에 updatedAt이 설정된다", () => {
    const { result } = makeHook();
    let entry: DiaryCardEntry;
    act(() => { entry = result.current.addEntry(makeEntryInput()); });
    expect(entry!.updatedAt).toBeDefined();
  });

  it("추가 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEntry(makeEntryInput()); });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("추가된 일기의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEntry(makeEntryInput({ title: "특별한 연습" })); });
    expect(result.current.entries[0].title).toBe("특별한 연습");
  });

  it("추가된 일기의 emotion이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEntry(makeEntryInput({ emotion: "passionate" })); });
    expect(result.current.entries[0].emotion).toBe("passionate");
  });

  it("entries는 최신순으로 정렬된다 (최신 날짜 먼저)", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ date: "2026-03-01" }));
      result.current.addEntry(makeEntryInput({ date: "2026-03-10" }));
    });
    expect(result.current.entries[0].date).toBe("2026-03-10");
    expect(result.current.entries[1].date).toBe("2026-03-01");
  });
});

// ============================================================
// useDanceDiary - updateEntry
// ============================================================

describe("useDanceDiary - updateEntry", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("일기 수정 후 title이 변경된다", () => {
    const { result } = makeHook();
    let entry: DiaryCardEntry;
    act(() => { entry = result.current.addEntry(makeEntryInput({ title: "원래 제목" })); });
    act(() => { result.current.updateEntry(entry!.id, { title: "수정된 제목" }); });
    expect(result.current.entries[0].title).toBe("수정된 제목");
  });

  it("일기 수정 후 emotion이 변경된다", () => {
    const { result } = makeHook();
    let entry: DiaryCardEntry;
    act(() => { entry = result.current.addEntry(makeEntryInput({ emotion: "happy" })); });
    act(() => { result.current.updateEntry(entry!.id, { emotion: "sad" }); });
    expect(result.current.entries[0].emotion).toBe("sad");
  });

  it("수정 후 updatedAt이 갱신된다", () => {
    const { result } = makeHook();
    let entry: DiaryCardEntry;
    act(() => { entry = result.current.addEntry(makeEntryInput()); });
    const originalUpdatedAt = entry!.updatedAt;

    // 시간 진행
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 1000));
    act(() => { result.current.updateEntry(entry!.id, { title: "새 제목" }); });
    vi.useRealTimers();

    expect(result.current.entries[0].updatedAt).not.toBe(originalUpdatedAt);
  });
});

// ============================================================
// useDanceDiary - deleteEntry
// ============================================================

describe("useDanceDiary - deleteEntry", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("일기 삭제 후 entries 길이가 감소한다", () => {
    const { result } = makeHook();
    let entry: DiaryCardEntry;
    act(() => { entry = result.current.addEntry(makeEntryInput()); });
    act(() => { result.current.deleteEntry(entry!.id); });
    expect(result.current.entries).toHaveLength(0);
  });

  it("특정 일기만 삭제된다", () => {
    const { result } = makeHook();
    let e1: DiaryCardEntry, e2: DiaryCardEntry;
    act(() => {
      e1 = result.current.addEntry(makeEntryInput({ date: "2026-03-01", title: "일기1" }));
      e2 = result.current.addEntry(makeEntryInput({ date: "2026-03-02", title: "일기2" }));
    });
    act(() => { result.current.deleteEntry(e1!.id); });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].id).toBe(e2!.id);
  });
});

// ============================================================
// useDanceDiary - getEntriesByEmotion
// ============================================================

describe("useDanceDiary - getEntriesByEmotion", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("'all' 필터는 모든 항목을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ emotion: "happy", date: "2026-03-01" }));
      result.current.addEntry(makeEntryInput({ emotion: "sad", date: "2026-03-02" }));
    });
    const all = result.current.getEntriesByEmotion("all");
    expect(all).toHaveLength(2);
  });

  it("특정 emotion으로 필터링한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ emotion: "happy", date: "2026-03-01" }));
      result.current.addEntry(makeEntryInput({ emotion: "sad", date: "2026-03-02" }));
      result.current.addEntry(makeEntryInput({ emotion: "happy", date: "2026-03-03" }));
    });
    const happy = result.current.getEntriesByEmotion("happy");
    expect(happy).toHaveLength(2);
    happy.forEach((e) => expect(e.emotion).toBe("happy"));
  });

  it("해당 emotion이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEntry(makeEntryInput({ emotion: "happy", date: "2026-03-01" })); });
    const frustrated = result.current.getEntriesByEmotion("frustrated");
    expect(frustrated).toHaveLength(0);
  });

  it("neutral emotion 필터링이 올바르게 동작한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ emotion: "neutral", date: "2026-03-01" }));
      result.current.addEntry(makeEntryInput({ emotion: "happy", date: "2026-03-02" }));
    });
    const neutral = result.current.getEntriesByEmotion("neutral");
    expect(neutral).toHaveLength(1);
  });
});

// ============================================================
// useDanceDiary - getEmotionStats
// ============================================================

describe("useDanceDiary - getEmotionStats", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("빈 entries에서 모든 감정 카운트가 0이다", () => {
    const { result } = makeHook();
    const stats = result.current.getEmotionStats();
    const emotions: DiaryCardEmotion[] = ["happy", "neutral", "sad", "passionate", "frustrated"];
    emotions.forEach((e) => expect(stats[e]).toBe(0));
  });

  it("happy 감정 카운트가 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ emotion: "happy", date: "2026-03-01" }));
      result.current.addEntry(makeEntryInput({ emotion: "happy", date: "2026-03-02" }));
      result.current.addEntry(makeEntryInput({ emotion: "sad", date: "2026-03-03" }));
    });
    const stats = result.current.getEmotionStats();
    expect(stats.happy).toBe(2);
    expect(stats.sad).toBe(1);
  });

  it("모든 감정이 카운트에 포함된다", () => {
    const { result } = makeHook();
    const emotions: DiaryCardEmotion[] = ["happy", "neutral", "sad", "passionate", "frustrated"];
    emotions.forEach((emotion, idx) => {
      act(() => {
        result.current.addEntry(makeEntryInput({ emotion, date: `2026-03-0${idx + 1}` }));
      });
    });
    const stats = result.current.getEmotionStats();
    emotions.forEach((e) => expect(stats[e]).toBe(1));
  });

  it("5개 감정 키가 모두 존재한다", () => {
    const { result } = makeHook();
    const stats = result.current.getEmotionStats();
    expect(Object.keys(stats)).toHaveLength(5);
  });
});

// ============================================================
// useDanceDiary - getMonthHeatmap
// ============================================================

describe("useDanceDiary - getMonthHeatmap", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("해당 월의 작성 날짜를 true로 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ date: "2026-03-01" }));
      result.current.addEntry(makeEntryInput({ date: "2026-03-15" }));
    });
    const heatmap = result.current.getMonthHeatmap(2026, 3);
    expect(heatmap["2026-03-01"]).toBe(true);
    expect(heatmap["2026-03-15"]).toBe(true);
  });

  it("다른 월의 항목은 포함되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ date: "2026-03-01" }));
      result.current.addEntry(makeEntryInput({ date: "2026-04-01" }));
    });
    const heatmap = result.current.getMonthHeatmap(2026, 3);
    expect(heatmap["2026-03-01"]).toBe(true);
    expect(heatmap["2026-04-01"]).toBeUndefined();
  });

  it("일기가 없는 월은 빈 객체를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEntry(makeEntryInput({ date: "2026-03-01" })); });
    const heatmap = result.current.getMonthHeatmap(2026, 5);
    expect(Object.keys(heatmap)).toHaveLength(0);
  });

  it("같은 날짜에 여러 항목이 있어도 true 하나만 기록된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ date: "2026-03-01" }));
      result.current.addEntry(makeEntryInput({ date: "2026-03-01" }));
    });
    const heatmap = result.current.getMonthHeatmap(2026, 3);
    expect(Object.keys(heatmap)).toHaveLength(1);
    expect(heatmap["2026-03-01"]).toBe(true);
  });
});

// ============================================================
// useDanceDiary - getConditionTrend
// ============================================================

describe("useDanceDiary - getConditionTrend", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("최근 30일 길이의 배열을 반환한다", () => {
    const { result } = makeHook();
    const trend = result.current.getConditionTrend();
    expect(trend).toHaveLength(30);
  });

  it("일기가 없는 날짜의 avg는 0이다", () => {
    const { result } = makeHook();
    const trend = result.current.getConditionTrend();
    const noEntryDay = trend.find((d) => d.date === "2026-02-15");
    if (noEntryDay) {
      expect(noEntryDay.avg).toBe(0);
    }
  });

  it("일기가 있는 날짜의 avg가 올바르게 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ date: "2026-03-01", condition: 4 }));
    });
    const trend = result.current.getConditionTrend();
    const march1 = trend.find((d) => d.date === "2026-03-01");
    expect(march1).toBeDefined();
    expect(march1!.avg).toBe(4);
  });

  it("같은 날짜 여러 항목의 평균이 올바르게 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ date: "2026-03-01", condition: 2 }));
      result.current.addEntry(makeEntryInput({ date: "2026-03-01", condition: 4 }));
    });
    const trend = result.current.getConditionTrend();
    const march1 = trend.find((d) => d.date === "2026-03-01");
    expect(march1!.avg).toBe(3);
  });

  it("반환된 배열의 각 항목이 date와 avg 필드를 가진다", () => {
    const { result } = makeHook();
    const trend = result.current.getConditionTrend();
    trend.forEach((item) => {
      expect(item.date).toBeDefined();
      expect(typeof item.avg).toBe("number");
    });
  });

  it("날짜가 오름차순으로 정렬된다 (30일 전 → 오늘)", () => {
    const { result } = makeHook();
    const trend = result.current.getConditionTrend();
    for (let i = 1; i < trend.length; i++) {
      expect(trend[i].date >= trend[i - 1].date).toBe(true);
    }
  });
});

// ============================================================
// useDanceDiary - getStreak
// ============================================================

describe("useDanceDiary - getStreak", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("일기가 없으면 streak는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.getStreak()).toBe(0);
  });

  it("오늘만 작성하면 streak는 1이다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEntry(makeEntryInput({ date: "2026-03-01" })); });
    expect(result.current.getStreak()).toBe(1);
  });

  it("오늘 기록이 없으면 streak는 0이다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEntry(makeEntryInput({ date: "2026-02-28" })); });
    expect(result.current.getStreak()).toBe(0);
  });

  it("같은 날짜 여러 번 작성해도 streak는 1이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryInput({ date: "2026-03-01" }));
      result.current.addEntry(makeEntryInput({ date: "2026-03-01" }));
      result.current.addEntry(makeEntryInput({ date: "2026-03-01" }));
    });
    expect(result.current.getStreak()).toBe(1);
  });

  it("streak는 음수가 되지 않는다", () => {
    const { result } = makeHook();
    expect(result.current.getStreak()).toBeGreaterThanOrEqual(0);
  });
});
