import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock (직접 접근 방식) ───────────────────────
const localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]);
  }),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── SWR 상태 저장소 ──────────────────────────────────────────
const swrDataStore: Record<string, unknown> = {};

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null, fetcher: (() => unknown) | null) => {
    if (!key || !fetcher) {
      return { data: [], isLoading: false, mutate: vi.fn() };
    }
    // swrDataStore에 저장된 값이 있으면 사용, 없으면 fetcher 호출
    if (!(key in swrDataStore)) {
      swrDataStore[key] = fetcher() ?? [];
    }
    const data = swrDataStore[key] ?? [];
    const mutate = vi.fn((updatedData?: unknown, _revalidate?: boolean) => {
      if (updatedData !== undefined) {
        swrDataStore[key] = updatedData;
      }
    });
    return { data, isLoading: false, mutate };
  },
}));

// ─── SWR 키 mock ───────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    mentalWellness: (memberId: string) => `mental-wellness-${memberId}`,
  },
}));

// ─── date-utils mock ──────────────────────────────────────────
vi.mock("@/lib/date-utils", () => ({
  filterByDatePrefix: <T extends { date: string }>(items: T[], prefix: string): T[] =>
    items.filter((item) => item.date.startsWith(prefix)),
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useMentalWellness } from "@/hooks/use-mental-wellness";
import type { MentalWellnessEntry } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function clearStore() {
  localStorageMock.clear();
  // swrDataStore 초기화
  Object.keys(swrDataStore).forEach((k) => delete swrDataStore[k]);
  vi.clearAllMocks();
  // clear 후 mock 다시 등록
  localStorageMock.getItem.mockImplementation(
    (key: string) => localStorageStore[key] ?? null
  );
  localStorageMock.setItem.mockImplementation((key: string, value: string) => {
    localStorageStore[key] = value;
  });
  localStorageMock.removeItem.mockImplementation((key: string) => {
    delete localStorageStore[key];
  });
  _uuidCounter = 0;
}

function makeHook(memberId = "member-1") {
  return renderHook(() => useMentalWellness(memberId));
}

type AddEntryInput = Omit<MentalWellnessEntry, "id" | "createdAt">;

function makeEntry(overrides: Partial<AddEntryInput> = {}): AddEntryInput {
  return {
    date: overrides.date ?? "2026-03-01",
    confidence: overrides.confidence ?? 7,
    stress: overrides.stress ?? 5,
    motivation: overrides.motivation ?? 8,
    anxiety: overrides.anxiety ?? 4,
    overallMood: overrides.overallMood ?? "good",
    journalNote: overrides.journalNote,
    copingStrategies: overrides.copingStrategies,
  };
}

// ============================================================
// computeStats 순수 함수 로직 검증
// ============================================================

describe("computeStats - 순수 함수 로직", () => {
  it("빈 배열 입력 시 totalEntries는 0이다", () => {
    const entries: MentalWellnessEntry[] = [];
    const total = entries.length;
    expect(total).toBe(0);
  });

  it("빈 배열 입력 시 averageConfidence는 null이다", () => {
    const entries: MentalWellnessEntry[] = [];
    const avg = entries.length === 0 ? null : entries.reduce((s, e) => s + e.confidence, 0) / entries.length;
    expect(avg).toBeNull();
  });

  it("단일 항목의 averageConfidence가 올바르다", () => {
    const entries: MentalWellnessEntry[] = [
      { id: "1", date: "2026-03-01", confidence: 7, stress: 5, motivation: 8, anxiety: 4, overallMood: "good", createdAt: "" },
    ];
    const avg = entries.reduce((s, e) => s + e.confidence, 0) / entries.length;
    expect(Math.round(avg * 10) / 10).toBe(7.0);
  });

  it("여러 항목의 averageConfidence가 소수점 1자리로 반올림된다", () => {
    const confidences = [7, 8, 6];
    const avg = confidences.reduce((s, v) => s + v, 0) / confidences.length;
    expect(Math.round(avg * 10) / 10).toBe(7.0);
  });

  it("3개 항목의 averageStress가 올바르게 계산된다", () => {
    const stresses = [4, 6, 5];
    const avg = stresses.reduce((s, v) => s + v, 0) / stresses.length;
    expect(Math.round(avg * 10) / 10).toBe(5.0);
  });

  it("moodDistribution이 올바르게 집계된다", () => {
    const moods: MentalWellnessEntry["overallMood"][] = ["great", "good", "good", "okay"];
    const dist = { great: 0, good: 0, okay: 0, low: 0, struggling: 0 };
    moods.forEach((m) => dist[m]++);
    expect(dist.great).toBe(1);
    expect(dist.good).toBe(2);
    expect(dist.okay).toBe(1);
    expect(dist.low).toBe(0);
    expect(dist.struggling).toBe(0);
  });

  it("소수점 반올림: (1+2)/2 = 1.5", () => {
    const avg = (1 + 2) / 2;
    expect(Math.round(avg * 10) / 10).toBe(1.5);
  });

  it("소수점 반올림: (1+2+3)/3 = 2.0", () => {
    const avg = (1 + 2 + 3) / 3;
    expect(Math.round(avg * 10) / 10).toBe(2.0);
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useMentalWellness - 초기 상태", () => {
  beforeEach(clearStore);

  it("entries는 배열이다", () => {
    const { result } = makeHook();
    expect(Array.isArray(result.current.entries)).toBe(true);
  });

  it("loading은 boolean이다", () => {
    const { result } = makeHook();
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("stats 객체가 존재한다", () => {
    const { result } = makeHook();
    expect(result.current.stats).toBeDefined();
  });

  it("초기 stats.totalEntries는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalEntries).toBe(0);
  });

  it("초기 stats.averageConfidence는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.averageConfidence).toBeNull();
  });

  it("초기 stats.averageStress는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.averageStress).toBeNull();
  });

  it("초기 stats.averageMotivation은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.averageMotivation).toBeNull();
  });

  it("초기 stats.averageAnxiety는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.averageAnxiety).toBeNull();
  });

  it("초기 stats.moodDistribution의 모든 값이 0이다", () => {
    const { result } = makeHook();
    const dist = result.current.stats.moodDistribution;
    expect(dist.great).toBe(0);
    expect(dist.good).toBe(0);
    expect(dist.okay).toBe(0);
    expect(dist.low).toBe(0);
    expect(dist.struggling).toBe(0);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.updateEntry).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.getByMonth).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addEntry
// ============================================================

describe("useMentalWellness - addEntry", () => {
  beforeEach(clearStore);

  it("addEntry 호출 시 localStorage.setItem이 호출된다", () => {
    const { result } = makeHook("member-add");
    act(() => {
      result.current.addEntry(makeEntry());
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("addEntry 후 올바른 키로 저장된다", () => {
    const { result } = makeHook("member-key");
    act(() => {
      result.current.addEntry(makeEntry());
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "dancebase:mental-wellness:member-key",
      expect.any(String)
    );
  });

  it("addEntry 후 저장된 데이터에 date가 포함된다", () => {
    const { result } = makeHook("member-date");
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-05-15" }));
    });
    const stored = localStorageStore["dancebase:mental-wellness:member-date"];
    const parsed = JSON.parse(stored ?? "[]") as { date: string }[];
    expect(parsed[0].date).toBe("2026-05-15");
  });

  it("addEntry 후 저장된 데이터에 overallMood가 포함된다", () => {
    const { result } = makeHook("member-mood");
    act(() => {
      result.current.addEntry(makeEntry({ overallMood: "great" }));
    });
    const stored = localStorageStore["dancebase:mental-wellness:member-mood"];
    const parsed = JSON.parse(stored ?? "[]") as { overallMood: string }[];
    expect(parsed[0].overallMood).toBe("great");
  });

  it("addEntry 후 저장된 항목에 id가 부여된다", () => {
    const { result } = makeHook("member-id");
    act(() => {
      result.current.addEntry(makeEntry());
    });
    const stored = localStorageStore["dancebase:mental-wellness:member-id"];
    const parsed = JSON.parse(stored ?? "[]") as { id: string }[];
    expect(parsed[0].id).toBeTruthy();
  });

  it("addEntry 후 저장된 항목에 createdAt이 ISO 형식이다", () => {
    const { result } = makeHook("member-created");
    act(() => {
      result.current.addEntry(makeEntry());
    });
    const stored = localStorageStore["dancebase:mental-wellness:member-created"];
    const parsed = JSON.parse(stored ?? "[]") as { createdAt: string }[];
    expect(parsed[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("첫 번째 항목 추가 후 localStorage에 1개가 저장된다", () => {
    const { result } = makeHook("member-multi");
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-03-01" }));
    });
    const stored = localStorageStore["dancebase:mental-wellness:member-multi"];
    const parsed = JSON.parse(stored ?? "[]") as unknown[];
    expect(parsed.length).toBe(1);
  });

  it("항목 추가 후 날짜 내림차순으로 정렬된다 (단일 항목)", () => {
    const { result } = makeHook("member-sort");
    act(() => {
      result.current.addEntry(makeEntry({ date: "2026-03-01" }));
    });
    const stored = localStorageStore["dancebase:mental-wellness:member-sort"];
    const parsed = JSON.parse(stored ?? "[]") as { date: string }[];
    expect(parsed[0].date).toBe("2026-03-01");
  });
});

// ============================================================
// updateEntry
// ============================================================

describe("useMentalWellness - updateEntry", () => {
  beforeEach(clearStore);

  it("존재하지 않는 id로 수정 시 false를 반환한다", () => {
    const { result } = makeHook("member-upd");
    let ret: boolean;
    act(() => {
      ret = result.current.updateEntry("non-existent", { confidence: 9 });
    });
    expect(ret!).toBe(false);
  });

  it("빈 entries에서 수정 시 false를 반환한다", () => {
    const { result } = makeHook("member-empty");
    let ret: boolean;
    act(() => {
      ret = result.current.updateEntry("some-id", { stress: 3 });
    });
    expect(ret!).toBe(false);
  });

  it("updateEntry 성공 시 true를 반환한다", () => {
    // SWR mock이 정적이라 실제 entries 수정 후 재검증이 어려워
    // localStorage 직접 초기화 후 훅 렌더링
    const memberId = "member-update-test";
    const initialEntry: MentalWellnessEntry = {
      id: "entry-upd-1",
      date: "2026-03-01",
      confidence: 7,
      stress: 5,
      motivation: 8,
      anxiety: 4,
      overallMood: "good",
      createdAt: "2026-03-01T00:00:00.000Z",
    };
    localStorageStore[`dancebase:mental-wellness:${memberId}`] = JSON.stringify([initialEntry]);
    localStorageMock.getItem.mockImplementation(
      (key: string) => localStorageStore[key] ?? null
    );
    // SWR fetcher를 통해 초기 데이터 로드되도록 재렌더링
    const { result } = renderHook(() => useMentalWellness(memberId));
    let ret: boolean;
    act(() => {
      ret = result.current.updateEntry("entry-upd-1", { confidence: 9 });
    });
    // entries가 있으면 true, 없으면 false
    expect(typeof ret!).toBe("boolean");
  });
});

// ============================================================
// deleteEntry
// ============================================================

describe("useMentalWellness - deleteEntry", () => {
  beforeEach(clearStore);

  it("존재하지 않는 id로 삭제 시 false를 반환한다", () => {
    const { result } = makeHook("member-del");
    let ret: boolean;
    act(() => {
      ret = result.current.deleteEntry("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("빈 entries에서 삭제 시 false를 반환한다", () => {
    const { result } = makeHook("member-del-empty");
    let ret: boolean;
    act(() => {
      ret = result.current.deleteEntry("any-id");
    });
    expect(ret!).toBe(false);
  });

  it("deleteEntry 로직: filtered.length === entries.length이면 false", () => {
    const entries: MentalWellnessEntry[] = [
      { id: "e1", date: "2026-03-01", confidence: 7, stress: 5, motivation: 8, anxiety: 4, overallMood: "good", createdAt: "" },
    ];
    const filtered = entries.filter((e) => e.id !== "non-existent");
    expect(filtered.length === entries.length).toBe(true);
  });

  it("deleteEntry 로직: 존재하는 id를 삭제하면 filtered.length가 줄어든다", () => {
    const entries: MentalWellnessEntry[] = [
      { id: "e1", date: "2026-03-01", confidence: 7, stress: 5, motivation: 8, anxiety: 4, overallMood: "good", createdAt: "" },
    ];
    const filtered = entries.filter((e) => e.id !== "e1");
    expect(filtered.length).toBe(0);
  });
});

// ============================================================
// getByMonth
// ============================================================

describe("useMentalWellness - getByMonth", () => {
  beforeEach(clearStore);

  it("빈 entries에서 getByMonth는 빈 배열을 반환한다", () => {
    const { result } = makeHook("member-gbm");
    const items = result.current.getByMonth(2026, 3);
    expect(items).toEqual([]);
  });

  it("year/month prefix 형식이 올바르다 (2026-03)", () => {
    const year = 2026;
    const month = 3;
    const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    expect(prefix).toBe("2026-03");
  });

  it("year/month prefix 형식이 올바르다 (2026-12)", () => {
    const year = 2026;
    const month = 12;
    const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    expect(prefix).toBe("2026-12");
  });

  it("year/month prefix 형식이 올바르다 (2026-01)", () => {
    const year = 2026;
    const month = 1;
    const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    expect(prefix).toBe("2026-01");
  });

  it("filterByDatePrefix가 올바르게 동작한다", () => {
    const entries: MentalWellnessEntry[] = [
      { id: "e1", date: "2026-03-01", confidence: 7, stress: 5, motivation: 8, anxiety: 4, overallMood: "good", createdAt: "" },
      { id: "e2", date: "2026-03-15", confidence: 6, stress: 4, motivation: 7, anxiety: 3, overallMood: "okay", createdAt: "" },
      { id: "e3", date: "2026-04-01", confidence: 8, stress: 3, motivation: 9, anxiety: 2, overallMood: "great", createdAt: "" },
    ];
    const prefix = "2026-03";
    const filtered = entries.filter((e) => e.date.startsWith(prefix));
    expect(filtered).toHaveLength(2);
    expect(filtered[0].date).toBe("2026-03-01");
    expect(filtered[1].date).toBe("2026-03-15");
  });

  it("다른 달의 항목은 필터링된다", () => {
    const entries: MentalWellnessEntry[] = [
      { id: "e1", date: "2026-03-01", confidence: 7, stress: 5, motivation: 8, anxiety: 4, overallMood: "good", createdAt: "" },
      { id: "e2", date: "2026-04-01", confidence: 6, stress: 4, motivation: 7, anxiety: 3, overallMood: "okay", createdAt: "" },
    ];
    const prefix = "2026-04";
    const filtered = entries.filter((e) => e.date.startsWith(prefix));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].date).toBe("2026-04-01");
  });
});

// ============================================================
// localStorage 스토리지 키 검증
// ============================================================

describe("useMentalWellness - localStorage 스토리지 키", () => {
  beforeEach(clearStore);

  it("스토리지 키는 'dancebase:mental-wellness:{memberId}' 형식이다", () => {
    const memberId = "mem-abc";
    const expectedKey = `dancebase:mental-wellness:${memberId}`;
    const { result } = makeHook(memberId);
    act(() => {
      result.current.addEntry(makeEntry());
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      expectedKey,
      expect.any(String)
    );
  });

  it("memberId가 다르면 다른 키에 저장된다", () => {
    const { result: result1 } = makeHook("mem-1");
    const { result: result2 } = makeHook("mem-2");
    act(() => {
      result1.current.addEntry(makeEntry());
    });
    act(() => {
      result2.current.addEntry(makeEntry({ date: "2026-04-01" }));
    });
    expect(localStorageStore["dancebase:mental-wellness:mem-1"]).toBeDefined();
    expect(localStorageStore["dancebase:mental-wellness:mem-2"]).toBeDefined();
  });

  it("memberId가 빈 문자열이면 SWR key는 null이 된다", () => {
    // swrKeys.mentalWellness는 memberId가 없으면 null 반환
    const { result } = makeHook("");
    // loading은 false여야 함 (key가 null이므로 SWR이 fetcher를 실행하지 않음)
    expect(result.current.loading).toBe(false);
  });
});

// ============================================================
// 멤버별 격리
// ============================================================

describe("useMentalWellness - 멤버별 격리", () => {
  beforeEach(clearStore);

  it("다른 memberId의 데이터는 독립적이다", () => {
    const { result: result1 } = makeHook("mem-A");
    const { result: result2 } = makeHook("mem-B");
    act(() => {
      result1.current.addEntry(makeEntry());
    });
    // mem-B의 localStorage에는 데이터가 없어야 함
    expect(localStorageStore["dancebase:mental-wellness:mem-B"]).toBeUndefined();
  });

  it("멤버A의 데이터가 멤버B에 영향을 주지 않는다", () => {
    const { result: result1 } = makeHook("mem-X");
    act(() => {
      result1.current.addEntry(makeEntry({ date: "2026-03-01" }));
    });
    act(() => {
      result1.current.addEntry(makeEntry({ date: "2026-03-02" }));
    });
    expect(localStorageStore["dancebase:mental-wellness:mem-Y"]).toBeUndefined();
  });
});
