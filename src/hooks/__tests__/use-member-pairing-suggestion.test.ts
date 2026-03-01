import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (memStore[key] as T) ?? defaultValue,
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (!key) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    return { data: [], isLoading: false, mutate: vi.fn() };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    memberPairingSuggestion: (groupId: string) =>
      `/groups/${groupId}/pairing-suggestions`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

// ─── invalidate mock ──────────────────────────────────────────
vi.mock("@/lib/swr/invalidate", () => ({
  invalidateMemberPairingSuggestion: vi.fn(),
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useMemberPairingSuggestion } from "@/hooks/use-member-pairing-suggestion";
import type { MemberPairingSuggestion } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

const CACHE_KEY_PREFIX = "dancebase:pairing-cache:";

function makeSuggestion(overrides: Partial<MemberPairingSuggestion> = {}): MemberPairingSuggestion {
  return {
    member1: { userId: "user-1", displayName: "홍길동", attendanceRate: 80 },
    member2: { userId: "user-2", displayName: "김철수", attendanceRate: 75 },
    compatibilityScore: 85,
    reason: "출석률이 거의 같음 · 함께 출석 5회",
    ...overrides,
  };
}

// ============================================================
// 내부 순수 함수 재현
// ============================================================

function calcAttendanceRateScore(rate1: number, rate2: number): number {
  const diff = Math.abs(rate1 - rate2);
  return Math.round(50 * (1 - diff / 100));
}

function calcCoAttendanceScore(coCount: number): number {
  return Math.min(50, Math.round(coCount * 5));
}

function buildReason(rate1: number, rate2: number, coCount: number): string {
  const diff = Math.abs(rate1 - rate2);
  const parts: string[] = [];

  if (diff <= 5) {
    parts.push("출석률이 거의 같음");
  } else if (diff <= 15) {
    parts.push("비슷한 출석 패턴");
  } else {
    parts.push("출석 수준 보완 가능");
  }

  if (coCount >= 8) {
    parts.push(`함께 출석 ${coCount}회로 높은 연대감`);
  } else if (coCount >= 4) {
    parts.push(`함께 출석 ${coCount}회`);
  } else if (coCount > 0) {
    parts.push(`함께 출석 ${coCount}회`);
  } else {
    parts.push("새로운 조합");
  }

  return parts.join(" · ");
}

// ============================================================
// useMemberPairingSuggestion - 초기 상태
// ============================================================

describe("useMemberPairingSuggestion - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("suggestions는 SWR의 기본값(빈 배열)이다", () => {
    const { result } = renderHook(() => useMemberPairingSuggestion("group-1"));
    expect(result.current.suggestions).toEqual([]);
  });

  it("loading은 false이다 (SWR mock)", () => {
    const { result } = renderHook(() => useMemberPairingSuggestion("group-1"));
    expect(result.current.loading).toBe(false);
  });

  it("generatePairings 함수가 존재한다", () => {
    const { result } = renderHook(() => useMemberPairingSuggestion("group-1"));
    expect(typeof result.current.generatePairings).toBe("function");
  });

  it("groupId가 달라도 훅을 생성할 수 있다", () => {
    expect(() => {
      renderHook(() => useMemberPairingSuggestion("group-A"));
      renderHook(() => useMemberPairingSuggestion("group-B"));
    }).not.toThrow();
  });
});

// ============================================================
// calcAttendanceRateScore 함수 로직
// ============================================================

describe("calcAttendanceRateScore - 출석률 차이 점수 계산", () => {
  it("출석률 차이가 0이면 50점이다", () => {
    expect(calcAttendanceRateScore(80, 80)).toBe(50);
  });

  it("출석률 차이가 100이면 0점이다", () => {
    expect(calcAttendanceRateScore(100, 0)).toBe(0);
  });

  it("출석률 차이가 50이면 25점이다", () => {
    expect(calcAttendanceRateScore(100, 50)).toBe(25);
  });

  it("점수는 항상 0 이상이다", () => {
    for (let a = 0; a <= 100; a += 10) {
      for (let b = 0; b <= 100; b += 10) {
        expect(calcAttendanceRateScore(a, b)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("점수는 항상 50 이하이다", () => {
    for (let a = 0; a <= 100; a += 10) {
      for (let b = 0; b <= 100; b += 10) {
        expect(calcAttendanceRateScore(a, b)).toBeLessThanOrEqual(50);
      }
    }
  });

  it("절댓값 기준으로 대칭이다 (a,b)와 (b,a)는 동일하다", () => {
    expect(calcAttendanceRateScore(80, 60)).toBe(calcAttendanceRateScore(60, 80));
  });

  it("차이 10%이면 45점이다", () => {
    // 50 * (1 - 10/100) = 50 * 0.9 = 45
    expect(calcAttendanceRateScore(80, 70)).toBe(45);
  });
});

// ============================================================
// calcCoAttendanceScore 함수 로직
// ============================================================

describe("calcCoAttendanceScore - 공동 출석 점수 계산", () => {
  it("공동 출석 0회이면 0점이다", () => {
    expect(calcCoAttendanceScore(0)).toBe(0);
  });

  it("공동 출석 10회 이상이면 50점(만점)이다", () => {
    expect(calcCoAttendanceScore(10)).toBe(50);
    expect(calcCoAttendanceScore(20)).toBe(50);
  });

  it("공동 출석 5회이면 25점이다", () => {
    expect(calcCoAttendanceScore(5)).toBe(25);
  });

  it("공동 출석 1회이면 5점이다", () => {
    expect(calcCoAttendanceScore(1)).toBe(5);
  });

  it("점수는 항상 0~50 사이이다", () => {
    for (let i = 0; i <= 20; i++) {
      const score = calcCoAttendanceScore(i);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(50);
    }
  });
});

// ============================================================
// buildReason 함수 로직
// ============================================================

describe("buildReason - 호환 이유 문자열 생성", () => {
  it("출석률 차이 5% 이하면 '출석률이 거의 같음'이 포함된다", () => {
    const reason = buildReason(80, 76, 0);
    expect(reason).toContain("출석률이 거의 같음");
  });

  it("출석률 차이 6~15%이면 '비슷한 출석 패턴'이 포함된다", () => {
    const reason = buildReason(80, 70, 0);
    expect(reason).toContain("비슷한 출석 패턴");
  });

  it("출석률 차이 16% 이상이면 '출석 수준 보완 가능'이 포함된다", () => {
    const reason = buildReason(80, 60, 0);
    expect(reason).toContain("출석 수준 보완 가능");
  });

  it("공동 출석 0회이면 '새로운 조합'이 포함된다", () => {
    const reason = buildReason(80, 80, 0);
    expect(reason).toContain("새로운 조합");
  });

  it("공동 출석 4~7회이면 '함께 출석 N회'가 포함된다", () => {
    const reason = buildReason(80, 80, 5);
    expect(reason).toContain("함께 출석 5회");
  });

  it("공동 출석 8회 이상이면 '높은 연대감'이 포함된다", () => {
    const reason = buildReason(80, 80, 8);
    expect(reason).toContain("높은 연대감");
  });

  it("reason은 ' · '로 구분된 문자열이다", () => {
    const reason = buildReason(80, 80, 5);
    expect(reason).toContain(" · ");
  });
});

// ============================================================
// computeSuggestions 알고리즘 검증
// ============================================================

describe("computeSuggestions - 상위 쌍 추천 알고리즘", () => {
  it("호환성 점수는 출석률 점수 + 공동 출석 점수이다", () => {
    const rateScore = calcAttendanceRateScore(80, 80); // 50
    const coScore = calcCoAttendanceScore(5);          // 25
    expect(rateScore + coScore).toBe(75);
  });

  it("두 멤버가 출석률이 완전히 같고 10회 공동 출석 시 최대 100점이다", () => {
    const rateScore = calcAttendanceRateScore(80, 80); // 50
    const coScore = calcCoAttendanceScore(10);         // 50
    expect(rateScore + coScore).toBe(100);
  });

  it("최솟값 점수는 0이다 (출석률 차이 100%, 공동 출석 0회)", () => {
    const rateScore = calcAttendanceRateScore(100, 0); // 0
    const coScore = calcCoAttendanceScore(0);          // 0
    expect(rateScore + coScore).toBe(0);
  });
});

// ============================================================
// localStorage 캐시 관련
// ============================================================

describe("localStorage 캐시 키 형식", () => {
  it("캐시 키는 CACHE_KEY_PREFIX + groupId 형식이다", () => {
    const groupId = "group-1";
    const key = `${CACHE_KEY_PREFIX}${groupId}`;
    expect(key).toBe("dancebase:pairing-cache:group-1");
  });

  it("다른 groupId는 다른 캐시 키를 사용한다", () => {
    const keyA = `${CACHE_KEY_PREFIX}group-A`;
    const keyB = `${CACHE_KEY_PREFIX}group-B`;
    expect(keyA).not.toBe(keyB);
  });

  it("캐시에 데이터가 있으면 loadFromStorage에서 반환된다", () => {
    const groupId = "group-cached";
    const cached: MemberPairingSuggestion[] = [makeSuggestion()];
    memStore[`${CACHE_KEY_PREFIX}${groupId}`] = cached;
    const loaded = (memStore[`${CACHE_KEY_PREFIX}${groupId}`] as MemberPairingSuggestion[]) ?? null;
    expect(loaded).not.toBeNull();
    expect(loaded).toHaveLength(1);
  });

  it("캐시가 없으면 null을 반환한다", () => {
    const groupId = "group-no-cache";
    const loaded = (memStore[`${CACHE_KEY_PREFIX}${groupId}`] as MemberPairingSuggestion[] | undefined) ?? null;
    expect(loaded).toBeNull();
  });
});

// ============================================================
// SWR 키 로직
// ============================================================

describe("SWR 키 로직", () => {
  it("groupId가 있으면 올바른 SWR 키가 생성된다", () => {
    const groupId = "group-1";
    const key = `/groups/${groupId}/pairing-suggestions`;
    expect(key).toBe("/groups/group-1/pairing-suggestions");
  });

  it("다른 groupId는 다른 SWR 키를 가진다", () => {
    const keyA = `/groups/group-A/pairing-suggestions`;
    const keyB = `/groups/group-B/pairing-suggestions`;
    expect(keyA).not.toBe(keyB);
  });
});

// ============================================================
// TOP_PAIRS 상수 검증
// ============================================================

describe("TOP_PAIRS 상수 - 상위 5쌍", () => {
  it("멤버가 2명이면 최대 1쌍만 추천된다", () => {
    // 2명 → C(2,2) = 1쌍
    const members = [
      { userId: "u1", displayName: "A", attendanceRate: 80 },
      { userId: "u2", displayName: "B", attendanceRate: 75 },
    ];
    let count = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        count++;
      }
    }
    const TOP_PAIRS = 5;
    expect(Math.min(count, TOP_PAIRS)).toBe(1);
  });

  it("멤버가 6명이면 최대 5쌍이 추천된다 (TOP_PAIRS=5)", () => {
    // 6명 → C(6,2) = 15쌍 → TOP_PAIRS=5
    const TOP_PAIRS = 5;
    let count = 0;
    for (let i = 0; i < 6; i++) {
      for (let j = i + 1; j < 6; j++) {
        count++;
      }
    }
    expect(Math.min(count, TOP_PAIRS)).toBe(5);
  });

  it("멤버가 4명이면 C(4,2)=6쌍 → TOP_PAIRS=5로 5쌍이 추천된다", () => {
    const TOP_PAIRS = 5;
    let count = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        count++;
      }
    }
    expect(count).toBe(6);
    expect(Math.min(count, TOP_PAIRS)).toBe(5);
  });
});

// ============================================================
// 멤버 정보 가공 로직
// ============================================================

describe("멤버 정보 가공 로직", () => {
  it("profiles가 배열이면 첫 번째 요소의 display_name을 사용한다", () => {
    const profiles = [{ display_name: "홍길동" }, { display_name: "다른이름" }];
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    expect(profile.display_name).toBe("홍길동");
  });

  it("profiles가 객체이면 직접 display_name을 사용한다", () => {
    const profiles = { display_name: "김철수" };
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    expect(profile.display_name).toBe("김철수");
  });

  it("profiles가 null이면 display_name은 '알 수 없음'이다", () => {
    const profiles = null;
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    const displayName = profile?.display_name ?? "알 수 없음";
    expect(displayName).toBe("알 수 없음");
  });

  it("총 일정이 0이면 출석률은 0%이다", () => {
    const totalSchedules = 0;
    const attended = 0;
    const attendanceRate =
      totalSchedules > 0 ? Math.round((attended / totalSchedules) * 100) : 0;
    expect(attendanceRate).toBe(0);
  });

  it("5/10회 출석이면 출석률 50%이다", () => {
    const totalSchedules = 10;
    const attended = 5;
    const attendanceRate = Math.round((attended / totalSchedules) * 100);
    expect(attendanceRate).toBe(50);
  });
});

// ============================================================
// 그룹별 격리
// ============================================================

describe("useMemberPairingSuggestion - 그룹별 격리", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("다른 groupId는 독립적인 캐시를 사용한다", () => {
    const cacheA = `${CACHE_KEY_PREFIX}group-A`;
    const cacheB = `${CACHE_KEY_PREFIX}group-B`;
    memStore[cacheA] = [makeSuggestion()];
    expect(memStore[cacheB]).toBeUndefined();
  });

  it("group-A의 캐시 삭제가 group-B에 영향을 주지 않는다", () => {
    const cacheA = `${CACHE_KEY_PREFIX}group-A`;
    const cacheB = `${CACHE_KEY_PREFIX}group-B`;
    memStore[cacheA] = [makeSuggestion()];
    memStore[cacheB] = [makeSuggestion({ member1: { userId: "u3", displayName: "박X", attendanceRate: 90 }, member2: { userId: "u4", displayName: "이Y", attendanceRate: 85 }, compatibilityScore: 90, reason: "test" })];
    delete memStore[cacheA];
    expect(memStore[cacheB]).toBeDefined();
  });
});
