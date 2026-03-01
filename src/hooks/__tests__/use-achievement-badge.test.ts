import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";
import type {
  AchievementBadgeEntry,
  AchievementBadgeCategory,
  AchievementBadgeLevel,
} from "@/types";

// ─── local-storage mock (vi.hoisted로 참조 가능한 store 생성) ──
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    return (memStore[key] as T) ?? defaultValue;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const { useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }

      let initialData: unknown = undefined;
      const fetchResult = fetcher();
      if (fetchResult instanceof Promise) {
        fetchResult.then((v) => { initialData = v; });
      } else {
        initialData = fetchResult;
      }

      const [data, setData] = reactUseState<unknown>(() => initialData);
      const setDataRef = useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          const r = fetcher!();
          if (r instanceof Promise) {
            r.then((v) => setDataRef.current(v));
          } else {
            setDataRef.current(r as unknown);
          }
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    achievementBadge: (memberId: string) => `achievement-badge-${memberId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useAchievementBadge } from "@/hooks/use-achievement-badge";

// ─── 헬퍼 ────────────────────────────────────────────────────
type BadgeInput = Omit<AchievementBadgeEntry, "id" | "memberId" | "createdAt">;

function makeBadgeInput(overrides: Partial<BadgeInput> = {}): BadgeInput {
  return {
    memberName: "홍길동",
    title: "첫 출석",
    description: "첫 번째 출석 달성",
    category: "attendance" as AchievementBadgeCategory,
    level: "bronze" as AchievementBadgeLevel,
    earnedAt: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeHook(memberId = "member-1") {
  return renderHook(() => useAchievementBadge(memberId));
}

// ============================================================
// useAchievementBadge - 초기 상태
// ============================================================

describe("useAchievementBadge - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalBadges는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalBadges).toBe(0);
  });

  it("초기 stats.levelCounts는 모두 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.levelCounts.bronze).toBe(0);
    expect(result.current.stats.levelCounts.silver).toBe(0);
    expect(result.current.stats.levelCounts.gold).toBe(0);
  });

  it("초기 stats.categoryCounts는 모두 0이다", () => {
    const { result } = makeHook();
    const { categoryCounts } = result.current.stats;
    expect(categoryCounts.practice).toBe(0);
    expect(categoryCounts.performance).toBe(0);
    expect(categoryCounts.teamwork).toBe(0);
    expect(categoryCounts.attendance).toBe(0);
    expect(categoryCounts.skill).toBe(0);
    expect(categoryCounts.leadership).toBe(0);
    expect(categoryCounts.other).toBe(0);
  });

  it("필요한 함수가 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addBadge).toBe("function");
    expect(typeof result.current.upgradeBadgeLevel).toBe("function");
    expect(typeof result.current.deleteBadge).toBe("function");
    expect(typeof result.current.getBadgesByCategory).toBe("function");
    expect(typeof result.current.getBadgesByLevel).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useAchievementBadge - addBadge
// ============================================================

describe("useAchievementBadge - addBadge", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("배지 추가 후 entries 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput()); });
    expect(result.current.entries).toHaveLength(1);
  });

  it("추가된 배지에 id가 부여된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput()); });
    expect(result.current.entries[0].id).toBeDefined();
    expect(result.current.entries[0].id).not.toBe("");
  });

  it("추가된 배지에 memberId가 올바르게 설정된다", () => {
    const { result } = makeHook("member-42");
    act(() => { result.current.addBadge(makeBadgeInput()); });
    expect(result.current.entries[0].memberId).toBe("member-42");
  });

  it("추가된 배지에 createdAt이 설정된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput()); });
    expect(result.current.entries[0].createdAt).toBeDefined();
    expect(new Date(result.current.entries[0].createdAt).toString()).not.toBe("Invalid Date");
  });

  it("추가된 배지의 category가 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ category: "performance" })); });
    expect(result.current.entries[0].category).toBe("performance");
  });

  it("추가된 배지의 level이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ level: "gold" })); });
    expect(result.current.entries[0].level).toBe("gold");
  });

  it("새 배지가 맨 앞에 추가된다 (최신 먼저)", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ title: "첫 번째 배지" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ title: "두 번째 배지" })); });
    expect(result.current.entries[0].title).toBe("두 번째 배지");
  });

  it("추가 후 memStore에 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput()); });
    const keys = Object.keys(memStore);
    expect(keys.length).toBeGreaterThan(0);
  });

  it("추가된 배지의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ title: "연습 챔피언" })); });
    expect(result.current.entries[0].title).toBe("연습 챔피언");
  });
});

// ============================================================
// useAchievementBadge - upgradeBadgeLevel
// ============================================================

describe("useAchievementBadge - upgradeBadgeLevel", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("배지 레벨을 bronze에서 silver로 업그레이드한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ level: "bronze" })); });
    const badgeId = result.current.entries[0].id;
    act(() => { result.current.upgradeBadgeLevel(badgeId, "silver"); });
    expect(result.current.entries[0].level).toBe("silver");
  });

  it("배지 레벨을 silver에서 gold로 업그레이드한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ level: "silver" })); });
    const badgeId = result.current.entries[0].id;
    act(() => { result.current.upgradeBadgeLevel(badgeId, "gold"); });
    expect(result.current.entries[0].level).toBe("gold");
  });

  it("업그레이드는 해당 배지만 변경된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ title: "배지1", level: "bronze" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ title: "배지2", level: "bronze" })); });
    const badge1Id = result.current.entries.find((e: AchievementBadgeEntry) => e.title === "배지1")!.id;
    act(() => { result.current.upgradeBadgeLevel(badge1Id, "gold"); });
    const badge1 = result.current.entries.find((e: AchievementBadgeEntry) => e.title === "배지1")!;
    const badge2 = result.current.entries.find((e: AchievementBadgeEntry) => e.title === "배지2")!;
    expect(badge1.level).toBe("gold");
    expect(badge2.level).toBe("bronze");
  });

  it("업그레이드 후 memStore가 갱신된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ level: "bronze" })); });
    const badgeId = result.current.entries[0].id;
    // 초기 저장 확인 후 업그레이드
    const beforeKeys = Object.keys(memStore).length;
    act(() => { result.current.upgradeBadgeLevel(badgeId, "gold"); });
    // 같은 키로 업데이트됨
    expect(Object.keys(memStore).length).toBe(beforeKeys);
  });

  it("gold에서 다시 gold로 업그레이드해도 에러가 없다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ level: "gold" })); });
    const badgeId = result.current.entries[0].id;
    expect(() => {
      act(() => { result.current.upgradeBadgeLevel(badgeId, "gold"); });
    }).not.toThrow();
    expect(result.current.entries[0].level).toBe("gold");
  });
});

// ============================================================
// useAchievementBadge - deleteBadge
// ============================================================

describe("useAchievementBadge - deleteBadge", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("배지 삭제 후 entries 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput()); });
    const badgeId = result.current.entries[0].id;
    act(() => { result.current.deleteBadge(badgeId); });
    expect(result.current.entries).toHaveLength(0);
  });

  it("특정 배지만 삭제된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ title: "배지1" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ title: "배지2" })); });
    const badge1Id = result.current.entries.find((e: AchievementBadgeEntry) => e.title === "배지1")!.id;
    act(() => { result.current.deleteBadge(badge1Id); });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].title).toBe("배지2");
  });

  it("존재하지 않는 id를 삭제해도 에러가 발생하지 않는다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => { result.current.deleteBadge("non-existent"); });
    }).not.toThrow();
  });

  it("모든 배지를 삭제하면 entries가 빈 배열이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ title: "배지1" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ title: "배지2" })); });
    const id1 = result.current.entries[0].id;
    const id2 = result.current.entries[1].id;
    act(() => { result.current.deleteBadge(id1); });
    act(() => { result.current.deleteBadge(id2); });
    expect(result.current.entries).toHaveLength(0);
  });
});

// ============================================================
// useAchievementBadge - getBadgesByCategory
// ============================================================

describe("useAchievementBadge - getBadgesByCategory", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("특정 카테고리의 배지만 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ category: "attendance" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ category: "skill" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ category: "attendance" })); });
    const attendanceBadges = result.current.getBadgesByCategory("attendance");
    expect(attendanceBadges).toHaveLength(2);
    attendanceBadges.forEach((b: AchievementBadgeEntry) => expect(b.category).toBe("attendance"));
  });

  it("해당 카테고리 배지가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ category: "practice" })); });
    const leadershipBadges = result.current.getBadgesByCategory("leadership");
    expect(leadershipBadges).toHaveLength(0);
  });

  it("모든 카테고리 타입이 동작한다", () => {
    const { result } = makeHook();
    const categories: AchievementBadgeCategory[] = [
      "practice", "performance", "teamwork", "attendance", "skill", "leadership", "other",
    ];
    for (const category of categories) {
      act(() => { result.current.addBadge(makeBadgeInput({ category })); });
    }
    for (const category of categories) {
      const badges = result.current.getBadgesByCategory(category);
      expect(badges).toHaveLength(1);
    }
  });

  it("빈 entries에서 항상 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getBadgesByCategory("practice")).toHaveLength(0);
  });
});

// ============================================================
// useAchievementBadge - getBadgesByLevel
// ============================================================

describe("useAchievementBadge - getBadgesByLevel", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("특정 레벨의 배지만 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ level: "bronze" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ level: "gold" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ level: "bronze" })); });
    const bronzeBadges = result.current.getBadgesByLevel("bronze");
    expect(bronzeBadges).toHaveLength(2);
    bronzeBadges.forEach((b: AchievementBadgeEntry) => expect(b.level).toBe("bronze"));
  });

  it("해당 레벨 배지가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ level: "bronze" })); });
    const goldBadges = result.current.getBadgesByLevel("gold");
    expect(goldBadges).toHaveLength(0);
  });

  it("gold, silver, bronze 세 레벨 모두 필터링된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ level: "bronze" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ level: "silver" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ level: "gold" })); });
    expect(result.current.getBadgesByLevel("bronze")).toHaveLength(1);
    expect(result.current.getBadgesByLevel("silver")).toHaveLength(1);
    expect(result.current.getBadgesByLevel("gold")).toHaveLength(1);
  });

  it("빈 entries에서 항상 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getBadgesByLevel("silver")).toHaveLength(0);
  });
});

// ============================================================
// useAchievementBadge - stats
// ============================================================

describe("useAchievementBadge - stats", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("stats.totalBadges가 entries 수와 일치한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput()); });
    act(() => { result.current.addBadge(makeBadgeInput()); });
    act(() => { result.current.addBadge(makeBadgeInput()); });
    expect(result.current.stats.totalBadges).toBe(3);
  });

  it("stats.levelCounts가 올바르게 카운트된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ level: "bronze" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ level: "bronze" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ level: "silver" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ level: "gold" })); });
    expect(result.current.stats.levelCounts.bronze).toBe(2);
    expect(result.current.stats.levelCounts.silver).toBe(1);
    expect(result.current.stats.levelCounts.gold).toBe(1);
  });

  it("stats.categoryCounts가 올바르게 카운트된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ category: "attendance" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ category: "attendance" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ category: "skill" })); });
    expect(result.current.stats.categoryCounts.attendance).toBe(2);
    expect(result.current.stats.categoryCounts.skill).toBe(1);
  });

  it("배지 삭제 후 stats.totalBadges가 감소한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput()); });
    act(() => { result.current.addBadge(makeBadgeInput()); });
    const badgeId = result.current.entries[0].id;
    act(() => { result.current.deleteBadge(badgeId); });
    expect(result.current.stats.totalBadges).toBe(1);
  });

  it("levelCounts의 합이 totalBadges와 일치한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ level: "bronze" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ level: "silver" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ level: "gold" })); });
    const { levelCounts, totalBadges } = result.current.stats;
    const sum = levelCounts.bronze + levelCounts.silver + levelCounts.gold;
    expect(sum).toBe(totalBadges);
  });

  it("categoryCounts의 합이 totalBadges와 일치한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addBadge(makeBadgeInput({ category: "practice" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ category: "teamwork" })); });
    act(() => { result.current.addBadge(makeBadgeInput({ category: "other" })); });
    const { categoryCounts, totalBadges } = result.current.stats;
    const sum = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    expect(sum).toBe(totalBadges);
  });
});

// ============================================================
// useAchievementBadge - 멤버 격리
// ============================================================

describe("useAchievementBadge - 멤버별 데이터 격리", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("다른 memberId의 데이터는 공유되지 않는다", () => {
    const { result: r1 } = makeHook("member-A");
    const { result: r2 } = makeHook("member-B");

    act(() => { r1.current.addBadge(makeBadgeInput({ title: "A의 배지" })); });

    // B는 A가 추가한 배지를 볼 수 없다
    expect(r2.current.entries).toHaveLength(0);
  });

  it("memberId가 빈 문자열이면 SWR key가 null이어서 entries는 빈 배열이다", () => {
    const { result } = makeHook("");
    expect(result.current.entries).toEqual([]);
  });
});

// ============================================================
// AchievementBadgeEntry 타입 구조 검증
// ============================================================

describe("AchievementBadgeEntry 타입 구조", () => {
  it("모든 필수 필드가 존재한다", () => {
    const entry: AchievementBadgeEntry = {
      id: "test-id",
      memberId: "member-1",
      memberName: "홍길동",
      title: "테스트 배지",
      category: "practice",
      level: "bronze",
      earnedAt: "2026-03-01T00:00:00.000Z",
      createdAt: "2026-03-01T00:00:00.000Z",
    };
    expect(entry).toHaveProperty("id");
    expect(entry).toHaveProperty("memberId");
    expect(entry).toHaveProperty("title");
    expect(entry).toHaveProperty("category");
    expect(entry).toHaveProperty("level");
    expect(entry).toHaveProperty("earnedAt");
    expect(entry).toHaveProperty("createdAt");
  });

  it("level은 bronze, silver, gold 세 가지이다", () => {
    const levels: AchievementBadgeLevel[] = ["bronze", "silver", "gold"];
    expect(levels).toHaveLength(3);
  });

  it("category는 7가지이다", () => {
    const categories: AchievementBadgeCategory[] = [
      "practice", "performance", "teamwork", "attendance", "skill", "leadership", "other",
    ];
    expect(categories).toHaveLength(7);
  });
});
