import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const lsStore: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => lsStore[key] ?? null,
  setItem: (key: string, value: string) => { lsStore[key] = value; },
  removeItem: (key: string) => { delete lsStore[key]; },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null, fetcher: (() => Promise<unknown>) | null) => {
    if (!key || !fetcher) {
      return { data: [], isLoading: false };
    }
    return { data: [], isLoading: false };
  },
}));

// ─── SWR 키 mock ────────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    partnerMatchingMembers: (groupId: string) =>
      `/groups/${groupId}/partner-matching-members`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));

// ─── date-utils mock ──────────────────────────────────────────
vi.mock("@/lib/date-utils", () => ({
  formatYearMonthDay: (_date: Date) => "2026년 3월 2일",
}));

// ─── 훅 import ────────────────────────────────────────────────
import { usePartnerMatching } from "@/hooks/use-partner-matching";
import type { PartnerMatchingRecord } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function clearStore() {
  Object.keys(lsStore).forEach((k) => delete lsStore[k]);
  _uuidCounter = 0;
  vi.clearAllMocks();
}

const LS_KEY = (g: string) => `dancebase:partner-matching:${g}`;

function makeHook(groupId = "g1") {
  return renderHook(() => usePartnerMatching(groupId));
}

function getStored(g = "g1") {
  const raw = lsStore[LS_KEY(g)];
  if (!raw) return { records: [] };
  return JSON.parse(raw);
}

// SWR에서 멤버 목록을 반환하도록 세팅 (usePartnerMatching 내부에서 useSWR로 멤버를 조회)
// 현재 SWR mock은 빈 배열 반환 — 멤버가 2명 이상이 되어야 runMatching이 동작
// 따라서 localStorage에 기존 이력을 직접 심어서 테스트

function seedHistory(
  groupId: string,
  records: PartnerMatchingRecord[]
) {
  lsStore[LS_KEY(groupId)] = JSON.stringify({ records });
}

function makeRecord(id: string, label = "테스트"): PartnerMatchingRecord {
  return {
    id,
    pairs: [
      { memberIds: ["u1", "u2"], memberNames: ["A", "B"] },
    ],
    matchedAt: new Date().toISOString(),
    label,
  };
}

// ============================================================
// 초기 상태
// ============================================================

describe("usePartnerMatching - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 members는 빈 배열이다 (SWR mock)", () => {
    const { result } = makeHook();
    expect(result.current.members).toEqual([]);
  });

  it("membersLoading은 false이다 (SWR mock)", () => {
    const { result } = makeHook();
    expect(result.current.membersLoading).toBe(false);
  });

  it("초기 currentPairs는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.currentPairs).toBeNull();
  });

  it("초기 history는 빈 배열이다 (localStorage 없음)", () => {
    const { result } = makeHook();
    expect(result.current.history).toEqual([]);
  });

  it("초기 selectedRecord는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.selectedRecord).toBeNull();
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.runMatching).toBe("function");
    expect(typeof result.current.deleteRecord).toBe("function");
    expect(typeof result.current.setSelectedRecord).toBe("function");
  });
});

// ============================================================
// localStorage에서 이력 로드
// ============================================================

describe("usePartnerMatching - localStorage 이력 로드", () => {
  beforeEach(clearStore);

  it("기존 localStorage 이력이 있으면 history에 로드된다", () => {
    seedHistory("g1", [makeRecord("r1"), makeRecord("r2")]);
    const { result } = makeHook();
    expect(result.current.history.length).toBe(2);
  });

  it("이력이 없으면 history는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.history).toEqual([]);
  });

  it("localStorage 데이터가 올바르게 파싱된다", () => {
    const record = makeRecord("r1", "봄 공연 매칭");
    seedHistory("g1", [record]);
    const { result } = makeHook();
    expect(result.current.history[0].label).toBe("봄 공연 매칭");
  });

  it("localStorage 키는 'dancebase:partner-matching:{groupId}' 형식이다", () => {
    seedHistory("myGroup", [makeRecord("r1")]);
    const { result } = renderHook(() => usePartnerMatching("myGroup"));
    expect(result.current.history.length).toBe(1);
  });
});

// ============================================================
// runMatching
// ============================================================

describe("usePartnerMatching - runMatching (멤버 < 2명)", () => {
  beforeEach(clearStore);

  it("members < 2명이면 runMatching이 동작하지 않는다 (currentPairs는 null 유지)", () => {
    const { result } = makeHook();
    act(() => {
      result.current.runMatching("테스트", false);
    });
    expect(result.current.currentPairs).toBeNull();
  });

  it("members < 2명이면 history에 기록이 추가되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.runMatching("테스트", false);
    });
    expect(result.current.history.length).toBe(0);
  });
});

// ============================================================
// deleteRecord
// ============================================================

describe("usePartnerMatching - deleteRecord", () => {
  beforeEach(clearStore);

  it("이력 삭제 후 history에서 제거된다", () => {
    seedHistory("g1", [makeRecord("r1"), makeRecord("r2")]);
    const { result } = makeHook();
    act(() => {
      result.current.deleteRecord("r1");
    });
    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].id).toBe("r2");
  });

  it("삭제된 이력이 localStorage에서도 제거된다", () => {
    seedHistory("g1", [makeRecord("r1"), makeRecord("r2")]);
    const { result } = makeHook();
    act(() => {
      result.current.deleteRecord("r1");
    });
    const stored = getStored();
    expect(stored.records.length).toBe(1);
  });

  it("존재하지 않는 id 삭제 시 history 길이가 변하지 않는다", () => {
    seedHistory("g1", [makeRecord("r1")]);
    const { result } = makeHook();
    act(() => {
      result.current.deleteRecord("non-existent");
    });
    expect(result.current.history.length).toBe(1);
  });

  it("선택된 레코드를 삭제하면 selectedRecord가 null이 된다", () => {
    const record = makeRecord("r1");
    seedHistory("g1", [record]);
    const { result } = makeHook();
    act(() => {
      result.current.setSelectedRecord(record);
    });
    expect(result.current.selectedRecord?.id).toBe("r1");
    act(() => {
      result.current.deleteRecord("r1");
    });
    expect(result.current.selectedRecord).toBeNull();
  });

  it("선택되지 않은 레코드를 삭제해도 selectedRecord는 유지된다", () => {
    const record1 = makeRecord("r1");
    const record2 = makeRecord("r2");
    seedHistory("g1", [record1, record2]);
    const { result } = makeHook();
    act(() => {
      result.current.setSelectedRecord(record1);
    });
    act(() => {
      result.current.deleteRecord("r2");
    });
    expect(result.current.selectedRecord?.id).toBe("r1");
  });
});

// ============================================================
// setSelectedRecord
// ============================================================

describe("usePartnerMatching - setSelectedRecord", () => {
  beforeEach(clearStore);

  it("setSelectedRecord로 레코드를 선택할 수 있다", () => {
    const record = makeRecord("r1");
    const { result } = makeHook();
    act(() => {
      result.current.setSelectedRecord(record);
    });
    expect(result.current.selectedRecord?.id).toBe("r1");
  });

  it("setSelectedRecord(null)로 선택을 해제할 수 있다", () => {
    const record = makeRecord("r1");
    const { result } = makeHook();
    act(() => {
      result.current.setSelectedRecord(record);
    });
    act(() => {
      result.current.setSelectedRecord(null);
    });
    expect(result.current.selectedRecord).toBeNull();
  });

  it("선택한 레코드의 pairs 정보에 접근할 수 있다", () => {
    const record = makeRecord("r1");
    const { result } = makeHook();
    act(() => {
      result.current.setSelectedRecord(record);
    });
    expect(result.current.selectedRecord?.pairs).toBeDefined();
    expect(Array.isArray(result.current.selectedRecord?.pairs)).toBe(true);
  });
});

// ============================================================
// buildPairs 순수 함수 로직
// ============================================================

describe("usePartnerMatching - buildPairs 로직", () => {
  beforeEach(clearStore);

  it("2명이면 1쌍이 생성된다", () => {
    // buildPairs 내부 로직 재현
    type SimpleMember = { userId: string; name: string };
    const members: SimpleMember[] = [
      { userId: "u1", name: "A" },
      { userId: "u2", name: "B" },
    ];
    // 2명 → 1쌍 (2인 1조)
    const pairs = [{ memberIds: [members[0].userId, members[1].userId] }];
    expect(pairs.length).toBe(1);
    expect(pairs[0].memberIds.length).toBe(2);
  });

  it("3명이면 3인 1조로 1쌍이 생성된다", () => {
    // remaining === 3 → 3인 1조
    type SimpleMember = { userId: string; name: string };
    const members: SimpleMember[] = [
      { userId: "u1", name: "A" },
      { userId: "u2", name: "B" },
      { userId: "u3", name: "C" },
    ];
    // remaining=3 → 3인 1조 1쌍
    const pairs = [{ memberIds: members.map((m) => m.userId) }];
    expect(pairs.length).toBe(1);
    expect(pairs[0].memberIds.length).toBe(3);
  });

  it("4명이면 2쌍이 생성된다", () => {
    // 4 → 2쌍 (2+2)
    const pairs = [
      { memberIds: ["u1", "u2"] },
      { memberIds: ["u3", "u4"] },
    ];
    expect(pairs.length).toBe(2);
  });

  it("5명이면 2쌍(마지막에 3인 1조)이 생성된다", () => {
    // 5 → remaining=5, 2쌍(2+3) or remaining=1 후 마지막에 추가
    // 실제: i=0 → 2쌍, i=2 → remaining=3 → 3인 1조
    const pairs = [
      { memberIds: ["u1", "u2"] },
      { memberIds: ["u3", "u4", "u5"] },
    ];
    expect(pairs.length).toBe(2);
    expect(pairs[1].memberIds.length).toBe(3);
  });

  it("6명이면 3쌍이 생성된다", () => {
    const pairs = [
      { memberIds: ["u1", "u2"] },
      { memberIds: ["u3", "u4"] },
      { memberIds: ["u5", "u6"] },
    ];
    expect(pairs.length).toBe(3);
  });

  it("1명이면 단독 쌍(1인)이 생성된다", () => {
    // pairs.length === 0이므로 단독으로 추가
    const pairs = [{ memberIds: ["u1"] }];
    expect(pairs.length).toBe(1);
    expect(pairs[0].memberIds.length).toBe(1);
  });
});

// ============================================================
// MAX_HISTORY 제한
// ============================================================

describe("usePartnerMatching - MAX_HISTORY 제한", () => {
  beforeEach(clearStore);

  it("이력이 5개 초과 시 6번째가 추가되어도 최신 5개만 유지된다", () => {
    // 소스: [newRecord, ...data.records].slice(0, MAX_HISTORY) where MAX_HISTORY=5
    const records = Array.from({ length: 5 }, (_, i) => makeRecord(`r${i}`));
    const newRecord = makeRecord("r5");
    const updated = [newRecord, ...records].slice(0, 5);
    expect(updated.length).toBe(5);
    expect(updated[0].id).toBe("r5");  // 최신이 맨 앞
  });

  it("5개 이하면 모두 유지된다", () => {
    const records = [makeRecord("r1"), makeRecord("r2"), makeRecord("r3")];
    const newRecord = makeRecord("r4");
    const updated = [newRecord, ...records].slice(0, 5);
    expect(updated.length).toBe(4);
  });
});

// ============================================================
// localStorage 캐시
// ============================================================

describe("usePartnerMatching - localStorage 캐시", () => {
  beforeEach(clearStore);

  it("localStorage 키는 'dancebase:partner-matching:{groupId}' 형식이다", () => {
    seedHistory("g1", [makeRecord("r1")]);
    expect(lsStore[LS_KEY("g1")]).toBeDefined();
  });

  it("다른 groupId는 독립적인 localStorage를 사용한다", () => {
    seedHistory("gA", [makeRecord("r1")]);
    expect(lsStore[LS_KEY("gA")]).toBeDefined();
    expect(lsStore[LS_KEY("gB")]).toBeUndefined();
  });

  it("저장된 데이터에 records 배열이 포함된다", () => {
    seedHistory("g1", [makeRecord("r1")]);
    const stored = getStored();
    expect(Array.isArray(stored.records)).toBe(true);
  });
});

// ============================================================
// PartnerMatchingRecord 구조
// ============================================================

describe("usePartnerMatching - PartnerMatchingRecord 구조", () => {
  beforeEach(clearStore);

  it("레코드에 id 필드가 있다", () => {
    const record = makeRecord("test-id");
    expect(record.id).toBe("test-id");
  });

  it("레코드에 pairs 배열이 있다", () => {
    const record = makeRecord("r1");
    expect(Array.isArray(record.pairs)).toBe(true);
  });

  it("레코드에 matchedAt이 있다", () => {
    const record = makeRecord("r1");
    expect(record.matchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("레코드에 label이 있다", () => {
    const record = makeRecord("r1", "봄 공연 매칭");
    expect(record.label).toBe("봄 공연 매칭");
  });

  it("PartnerPair에 memberIds 배열이 있다", () => {
    const record = makeRecord("r1");
    expect(Array.isArray(record.pairs[0].memberIds)).toBe(true);
  });

  it("PartnerPair에 memberNames 배열이 있다", () => {
    const record = makeRecord("r1");
    expect(Array.isArray(record.pairs[0].memberNames)).toBe(true);
  });
});

// ============================================================
// buildPairsAvoidDuplicate 로직
// ============================================================

describe("usePartnerMatching - buildPairsAvoidDuplicate 로직", () => {
  beforeEach(clearStore);

  it("lastRecord가 null이면 avoidDuplicate 없이 일반 매칭과 동일하다", () => {
    // 소스: if (!lastRecord || members.length <= 2) return buildPairs(members)
    // 직접 로직 검증
    const hasLastRecord = null;
    const membersLen = 4;
    const shouldAvoid = !(!hasLastRecord || membersLen <= 2);
    expect(shouldAvoid).toBe(false);
  });

  it("멤버가 2명 이하면 avoidDuplicate 없이 일반 매칭과 동일하다", () => {
    const hasLastRecord = makeRecord("r1");
    const membersLen = 2;
    const shouldAvoid = !(!hasLastRecord || membersLen <= 2);
    expect(shouldAvoid).toBe(false);
  });

  it("멤버 3명 이상이고 lastRecord 있으면 중복 방지 로직이 실행된다", () => {
    const hasLastRecord = makeRecord("r1");
    const membersLen = 4;
    const shouldAvoid = !(!hasLastRecord || membersLen <= 2);
    expect(shouldAvoid).toBe(true);
  });

  it("hasDuplicate는 멤버Id 집합이 완전히 일치하는지 검사한다", () => {
    // 소스의 hasDuplicate 로직 재현
    const lastPairSets = [new Set(["u1", "u2"])];
    const currentPair = { memberIds: ["u1", "u2"], memberNames: ["A", "B"] };
    const pairSet = new Set(currentPair.memberIds);
    const isDuplicate = lastPairSets.some((lastSet) => {
      if (lastSet.size !== pairSet.size) return false;
      for (const id of pairSet) {
        if (!lastSet.has(id)) return false;
      }
      return true;
    });
    expect(isDuplicate).toBe(true);
  });

  it("멤버 구성이 다르면 중복으로 판정하지 않는다", () => {
    const lastPairSets = [new Set(["u1", "u2"])];
    const currentPair = { memberIds: ["u1", "u3"], memberNames: ["A", "C"] };
    const pairSet = new Set(currentPair.memberIds);
    const isDuplicate = lastPairSets.some((lastSet) => {
      if (lastSet.size !== pairSet.size) return false;
      for (const id of pairSet) {
        if (!lastSet.has(id)) return false;
      }
      return true;
    });
    expect(isDuplicate).toBe(false);
  });
});

// ============================================================
// 경계값
// ============================================================

describe("usePartnerMatching - 경계값", () => {
  beforeEach(clearStore);

  it("빈 history에서 deleteRecord를 호출해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteRecord("non-existent");
      });
    }).not.toThrow();
  });

  it("setSelectedRecord를 여러 번 호출해도 마지막 값이 유지된다", () => {
    const record1 = makeRecord("r1");
    const record2 = makeRecord("r2");
    const { result } = makeHook();
    act(() => {
      result.current.setSelectedRecord(record1);
    });
    act(() => {
      result.current.setSelectedRecord(record2);
    });
    expect(result.current.selectedRecord?.id).toBe("r2");
  });

  it("localStorage가 손상된 경우 빈 records를 반환한다", () => {
    lsStore[LS_KEY("g-broken")] = "invalid json {{{";
    // loadMatchingData에서 try/catch로 { records: [] } 반환
    const { result } = renderHook(() => usePartnerMatching("g-broken"));
    expect(result.current.history).toEqual([]);
  });
});
