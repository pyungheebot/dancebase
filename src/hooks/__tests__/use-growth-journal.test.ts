import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, _defaultValue: T): T => {
    const stored = memStore[key] as T | undefined;
    if (stored !== undefined) return stored;
    // GrowthJournalData 기본값: entries 빈 배열 보장
    return { entries: [] } as unknown as T;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    growthJournal: (groupId: string) => `growth-journal-${groupId}`,
  },
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useGrowthJournal, GROWTH_AREAS } from "@/hooks/use-growth-journal";
import type { GrowthJournalEntry, GrowthArea } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

function makeEntryParams(overrides: Partial<Parameters<ReturnType<typeof useGrowthJournal>["addEntry"]>[0]> = {}) {
  return {
    memberName: "홍길동",
    date: "2026-03-02",
    title: "오늘의 연습 일지",
    content: "열심히 연습했다",
    area: "테크닉" as GrowthArea,
    level: 3,
    ...overrides,
  };
}

// ============================================================
// GROWTH_AREAS 상수
// ============================================================

describe("GROWTH_AREAS 상수", () => {
  it("GROWTH_AREAS는 6개의 영역을 포함한다", () => {
    expect(GROWTH_AREAS).toHaveLength(6);
  });

  it("GROWTH_AREAS는 테크닉을 포함한다", () => {
    expect(GROWTH_AREAS).toContain("테크닉");
  });

  it("GROWTH_AREAS는 표현력을 포함한다", () => {
    expect(GROWTH_AREAS).toContain("표현력");
  });

  it("GROWTH_AREAS는 체력을 포함한다", () => {
    expect(GROWTH_AREAS).toContain("체력");
  });

  it("GROWTH_AREAS는 리더십을 포함한다", () => {
    expect(GROWTH_AREAS).toContain("리더십");
  });

  it("GROWTH_AREAS는 협동심을 포함한다", () => {
    expect(GROWTH_AREAS).toContain("협동심");
  });

  it("GROWTH_AREAS는 자신감을 포함한다", () => {
    expect(GROWTH_AREAS).toContain("자신감");
  });
});

// ============================================================
// useGrowthJournal - 초기 상태
// ============================================================

describe("useGrowthJournal - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.entries).toEqual([]);
  });

  it("loading은 항상 false이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.loading).toBe(false);
  });

  it("stats 객체가 존재한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.stats).toBeDefined();
  });

  it("필요한 CRUD 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.updateEntry).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.getPreviousEntry).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("초기 totalEntries는 0이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.totalEntries).toBe(0);
  });

  it("초기 averageSelfRating은 0이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.averageSelfRating).toBe(0);
  });

  it("초기 moodDistribution은 빈 객체이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.moodDistribution).toEqual({});
  });

  it("초기 topSkillsPracticed는 빈 배열이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.topSkillsPracticed).toEqual([]);
  });
});

// ============================================================
// useGrowthJournal - addEntry
// ============================================================

describe("useGrowthJournal - addEntry 일지 추가", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("addEntry 호출 후 entries 배열에 추가된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    expect(result.current.entries).toHaveLength(1);
  });

  it("addEntry가 반환하는 객체에 id가 있다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let newEntry: GrowthJournalEntry | undefined;
    act(() => {
      newEntry = result.current.addEntry(makeEntryParams());
    });
    expect(newEntry?.id).toBeTruthy();
  });

  it("addEntry 시 mood 기본값은 neutral이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let newEntry: GrowthJournalEntry | undefined;
    act(() => {
      newEntry = result.current.addEntry(makeEntryParams());
    });
    expect(newEntry?.mood).toBe("neutral");
  });

  it("level 파라미터가 없으면 selfRating으로 폴백한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let newEntry: GrowthJournalEntry | undefined;
    act(() => {
      newEntry = result.current.addEntry({
        memberName: "홍길동",
        date: "2026-03-02",
        title: "테스트",
        content: "내용",
        selfRating: 4,
      });
    });
    expect(newEntry?.level).toBe(4);
  });

  it("level과 selfRating 모두 없으면 기본값 3이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let newEntry: GrowthJournalEntry | undefined;
    act(() => {
      newEntry = result.current.addEntry({
        memberName: "홍길동",
        date: "2026-03-02",
        title: "테스트",
        content: "내용",
      });
    });
    expect(newEntry?.level).toBe(3);
  });

  it("skillsPracticed 기본값은 빈 배열이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let newEntry: GrowthJournalEntry | undefined;
    act(() => {
      newEntry = result.current.addEntry(makeEntryParams());
    });
    expect(newEntry?.skillsPracticed).toEqual([]);
  });

  it("achievementsToday 기본값은 빈 배열이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let newEntry: GrowthJournalEntry | undefined;
    act(() => {
      newEntry = result.current.addEntry(makeEntryParams());
    });
    expect(newEntry?.achievementsToday).toEqual([]);
  });

  it("localStorage에 저장된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    expect(memStore["growth-journal-group-1"]).toBeDefined();
  });
});

// ============================================================
// useGrowthJournal - updateEntry
// ============================================================

describe("useGrowthJournal - updateEntry 일지 수정", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("존재하는 entryId로 updateEntry 호출 시 true를 반환한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let entryId = "";
    act(() => {
      const e = result.current.addEntry(makeEntryParams());
      entryId = e.id;
    });
    let success = false;
    act(() => {
      success = result.current.updateEntry(entryId, { title: "수정된 제목" });
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 entryId로 updateEntry 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let success = true;
    act(() => {
      success = result.current.updateEntry("nonexistent", { title: "수정" });
    });
    expect(success).toBe(false);
  });

  it("updateEntry 후 제목이 변경된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let entryId = "";
    act(() => {
      const e = result.current.addEntry(makeEntryParams({ title: "원래 제목" }));
      entryId = e.id;
    });
    act(() => {
      result.current.updateEntry(entryId, { title: "새 제목" });
    });
    const updated = result.current.entries?.find((e) => e.id === entryId);
    expect(updated?.title).toBe("새 제목");
  });

  it("updateEntry 후 updatedAt이 갱신된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let entryId = "";
    act(() => {
      const e = result.current.addEntry(makeEntryParams());
      entryId = e.id;
    });
    act(() => {
      result.current.updateEntry(entryId, { content: "새 내용" });
    });
    const updated = result.current.entries?.find((e) => e.id === entryId);
    expect(updated?.updatedAt).toBeDefined();
  });
});

// ============================================================
// useGrowthJournal - deleteEntry
// ============================================================

describe("useGrowthJournal - deleteEntry 일지 삭제", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("존재하는 entryId로 deleteEntry 호출 시 true를 반환한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let entryId = "";
    act(() => {
      const e = result.current.addEntry(makeEntryParams());
      entryId = e.id;
    });
    let success = false;
    act(() => {
      success = result.current.deleteEntry(entryId);
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 entryId로 deleteEntry 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let success = true;
    act(() => {
      success = result.current.deleteEntry("nonexistent");
    });
    expect(success).toBe(false);
  });

  it("deleteEntry 후 entries 배열에서 제거된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let entryId = "";
    act(() => {
      const e = result.current.addEntry(makeEntryParams());
      entryId = e.id;
    });
    act(() => {
      result.current.deleteEntry(entryId);
    });
    expect(result.current.entries?.find((e) => e.id === entryId)).toBeUndefined();
  });
});

// ============================================================
// useGrowthJournal - getPreviousEntry
// ============================================================

describe("useGrowthJournal - getPreviousEntry 이전 항목 조회", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("이전 일지가 없으면 null을 반환한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let entryId = "";
    act(() => {
      const e = result.current.addEntry(makeEntryParams());
      entryId = e.id;
    });
    const prev = result.current.getPreviousEntry("홍길동", "테크닉", "2026-03-02", entryId);
    expect(prev).toBeNull();
  });

  it("같은 멤버와 영역의 이전 일지를 반환한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let entry1Id = "";
    let entry2Id = "";
    act(() => {
      const e1 = result.current.addEntry(makeEntryParams({ date: "2026-02-01", title: "2월 일지" }));
      entry1Id = e1.id;
    });
    act(() => {
      const e2 = result.current.addEntry(makeEntryParams({ date: "2026-03-01", title: "3월 일지" }));
      entry2Id = e2.id;
    });
    const prev = result.current.getPreviousEntry("홍길동", "테크닉", "2026-03-01", entry2Id);
    expect(prev?.id).toBe(entry1Id);
  });

  it("다른 멤버의 일지는 반환하지 않는다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let entry2Id = "";
    act(() => {
      result.current.addEntry(makeEntryParams({ memberName: "김철수", date: "2026-02-01" }));
    });
    act(() => {
      const e2 = result.current.addEntry(makeEntryParams({ memberName: "홍길동", date: "2026-03-01" }));
      entry2Id = e2.id;
    });
    const prev = result.current.getPreviousEntry("홍길동", "테크닉", "2026-03-01", entry2Id);
    expect(prev).toBeNull();
  });

  it("다른 영역의 일지는 반환하지 않는다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    let entry2Id = "";
    act(() => {
      result.current.addEntry(makeEntryParams({ area: "체력", date: "2026-02-01" }));
    });
    act(() => {
      const e2 = result.current.addEntry(makeEntryParams({ area: "테크닉", date: "2026-03-01" }));
      entry2Id = e2.id;
    });
    const prev = result.current.getPreviousEntry("홍길동", "테크닉", "2026-03-01", entry2Id);
    expect(prev).toBeNull();
  });
});

// ============================================================
// useGrowthJournal - stats 통계
// ============================================================

describe("useGrowthJournal - stats 통계 계산", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("entries가 없으면 stats.totalEntries는 0이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.stats.totalEntries).toBe(0);
  });

  it("entries가 없으면 stats.overallAvgLevel은 0이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.stats.overallAvgLevel).toBe(0);
  });

  it("entries가 없으면 stats.areaAvgLevel은 빈 배열이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.stats.areaAvgLevel).toEqual([]);
  });

  it("entries가 없으면 stats.memberEntryCount는 빈 배열이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    expect(result.current.stats.memberEntryCount).toEqual([]);
  });

  it("일지 추가 후 stats.totalEntries가 증가한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ title: "두번째" }));
    });
    expect(result.current.stats.totalEntries).toBe(2);
  });

  it("영역별 평균 성장도가 areaAvgLevel에 반영된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams({ area: "테크닉", level: 4 }));
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ area: "테크닉", level: 2, title: "두번째" }));
    });
    const areaLevel = result.current.stats.areaAvgLevel.find((a) => a.area === "테크닉");
    expect(areaLevel?.avgLevel).toBe(3); // (4+2)/2 = 3
  });

  it("멤버별 일지 수가 memberEntryCount에 반영된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams({ memberName: "홍길동" }));
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ memberName: "홍길동", title: "두번째" }));
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ memberName: "김철수" }));
    });
    const hong = result.current.stats.memberEntryCount.find((m) => m.memberName === "홍길동");
    expect(hong?.count).toBe(2);
  });

  it("memberEntryCount는 일지 수 내림차순으로 정렬된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams({ memberName: "김철수" }));
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ memberName: "홍길동" }));
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ memberName: "홍길동", title: "두번째" }));
    });
    const counts = result.current.stats.memberEntryCount;
    expect(counts[0].memberName).toBe("홍길동");
    expect(counts[0].count).toBe(2);
  });

  it("전체 평균 성장 수준이 올바르게 계산된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams({ level: 4 }));
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ level: 2, title: "두번째" }));
    });
    // (4+2)/2 = 3.0
    expect(result.current.stats.overallAvgLevel).toBe(3);
  });
});

// ============================================================
// useGrowthJournal - 레거시 필드
// ============================================================

describe("useGrowthJournal - 레거시 호환 필드", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("averageSelfRating은 selfRating의 평균이다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams({ selfRating: 4 }));
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ selfRating: 2, title: "두번째" }));
    });
    expect(result.current.averageSelfRating).toBe(3);
  });

  it("moodDistribution에 mood 분포가 반영된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams({ mood: "motivated" }));
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ mood: "motivated", title: "두번째" }));
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ mood: "neutral", title: "세번째" }));
    });
    expect(result.current.moodDistribution["motivated"]).toBe(2);
    expect(result.current.moodDistribution["neutral"]).toBe(1);
  });

  it("topSkillsPracticed는 최대 5개까지 반환된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams({
        skillsPracticed: ["스킬A", "스킬B", "스킬C", "스킬D", "스킬E", "스킬F"],
      }));
    });
    expect(result.current.topSkillsPracticed.length).toBeLessThanOrEqual(5);
  });

  it("topSkillsPracticed는 count 내림차순으로 정렬된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams({ skillsPracticed: ["A", "B", "A"] }));
      result.current.addEntry(makeEntryParams({ skillsPracticed: ["B"], title: "두번째" }));
    });
    const top = result.current.topSkillsPracticed;
    if (top.length >= 2) {
      expect(top[0].count).toBeGreaterThanOrEqual(top[1].count);
    }
  });
});

// ============================================================
// useGrowthJournal - localStorage 캐시
// ============================================================

describe("useGrowthJournal - localStorage 캐시", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("localStorage 키는 groupId를 포함한다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    expect(memStore["growth-journal-group-1"]).toBeDefined();
  });

  it("저장된 데이터에 groupId가 포함된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const saved = memStore["growth-journal-group-1"] as { groupId: string };
    expect(saved.groupId).toBe("group-1");
  });

  it("저장된 데이터에 updatedAt이 포함된다", () => {
    const { result } = renderHook(() => useGrowthJournal("group-1"));
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const saved = memStore["growth-journal-group-1"] as { updatedAt: string };
    expect(saved.updatedAt).toBeTruthy();
  });
});

// ============================================================
// useGrowthJournal - 그룹별 격리
// ============================================================

describe("useGrowthJournal - 그룹별 격리", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("다른 groupId를 사용하는 훅은 독립적이다", () => {
    const { result: r1 } = renderHook(() => useGrowthJournal("group-A"));
    const { result: r2 } = renderHook(() => useGrowthJournal("group-B"));
    act(() => {
      r1.current.addEntry(makeEntryParams({ title: "그룹 A 일지" }));
    });
    expect(r2.current.entries).toHaveLength(0);
  });

  it("group-A에 추가한 일지가 group-B에는 없다", () => {
    const { result: r1 } = renderHook(() => useGrowthJournal("group-A"));
    const { result: r2 } = renderHook(() => useGrowthJournal("group-B"));
    act(() => {
      r1.current.addEntry(makeEntryParams());
    });
    expect(memStore["growth-journal-group-B"]).toBeUndefined();
  });
});
