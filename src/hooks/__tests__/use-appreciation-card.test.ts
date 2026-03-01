import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

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

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    appreciationCard: (groupId: string) => `appreciation-card-${groupId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useAppreciationCard } from "@/hooks/use-appreciation-card";
import type {
  AppreciationCardCategory,
  AppreciationCardEntry,
} from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useAppreciationCard(groupId));
}

function sendCard(
  hook: ReturnType<typeof makeHook>["result"],
  overrides: {
    from?: string;
    to?: string;
    category?: AppreciationCardCategory;
    message?: string;
    emoji?: string;
    isPublic?: boolean;
  } = {}
) {
  act(() => {
    hook.current.sendCard(
      overrides.from ?? "홍길동",
      overrides.to ?? "김철수",
      overrides.category ?? "effort",
      overrides.message ?? "정말 열심히 했어요",
      overrides.emoji,
      overrides.isPublic ?? true
    );
  });
}

// ============================================================
// useAppreciationCard - 초기 상태
// ============================================================

describe("useAppreciationCard - 초기 상태", () => {
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

  it("초기 totalEntries는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalEntries).toBe(0);
  });

  it("초기 topReceiver는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.topReceiver).toBeNull();
  });

  it("초기 topSender는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.topSender).toBeNull();
  });

  it("초기 categoryDistribution의 모든 카테고리가 0이다", () => {
    const { result } = makeHook();
    const dist = result.current.categoryDistribution;
    expect(dist.leadership).toBe(0);
    expect(dist.effort).toBe(0);
    expect(dist.growth).toBe(0);
    expect(dist.help).toBe(0);
    expect(dist.fun).toBe(0);
    expect(dist.other).toBe(0);
  });

  it("필요한 함수가 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.sendCard).toBe("function");
    expect(typeof result.current.deleteCard).toBe("function");
    expect(typeof result.current.toggleLike).toBe("function");
    expect(typeof result.current.getVisibleEntries).toBe("function");
    expect(typeof result.current.getEntriesTo).toBe("function");
    expect(typeof result.current.getEntriesFrom).toBe("function");
  });
});

// ============================================================
// useAppreciationCard - sendCard
// ============================================================

describe("useAppreciationCard - sendCard", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("sendCard 후 entries 길이가 1이 된다", () => {
    const { result } = makeHook();
    sendCard(result);
    expect(result.current.entries).toHaveLength(1);
  });

  it("추가된 카드에 id가 부여된다", () => {
    const { result } = makeHook();
    sendCard(result);
    expect(result.current.entries[0].id).toBeDefined();
  });

  it("추가된 카드의 fromMember가 올바르다", () => {
    const { result } = makeHook();
    sendCard(result, { from: "이영희" });
    expect(result.current.entries[0].fromMember).toBe("이영희");
  });

  it("추가된 카드의 toMember가 올바르다", () => {
    const { result } = makeHook();
    sendCard(result, { to: "박민준" });
    expect(result.current.entries[0].toMember).toBe("박민준");
  });

  it("추가된 카드의 category가 올바르다", () => {
    const { result } = makeHook();
    sendCard(result, { category: "leadership" });
    expect(result.current.entries[0].category).toBe("leadership");
  });

  it("추가된 카드의 message가 올바르다", () => {
    const { result } = makeHook();
    sendCard(result, { message: "수고했어요!" });
    expect(result.current.entries[0].message).toBe("수고했어요!");
  });

  it("새 카드는 맨 앞에 추가된다 (최신 먼저)", () => {
    const { result } = makeHook();
    sendCard(result, { message: "첫 번째" });
    sendCard(result, { message: "두 번째" });
    expect(result.current.entries[0].message).toBe("두 번째");
  });

  it("isPublic 기본값은 true이다", () => {
    const { result } = makeHook();
    sendCard(result);
    expect(result.current.entries[0].isPublic).toBe(true);
  });

  it("isPublic=false로 카드를 보낼 수 있다", () => {
    const { result } = makeHook();
    sendCard(result, { isPublic: false });
    expect(result.current.entries[0].isPublic).toBe(false);
  });

  it("초기 likes는 빈 배열이다", () => {
    const { result } = makeHook();
    sendCard(result);
    expect(result.current.entries[0].likes).toEqual([]);
  });

  it("totalEntries가 카드 수와 일치한다", () => {
    const { result } = makeHook();
    sendCard(result);
    sendCard(result);
    sendCard(result);
    expect(result.current.totalEntries).toBe(3);
  });

  it("createdAt 필드가 존재하고 유효한 ISO 날짜이다", () => {
    const { result } = makeHook();
    sendCard(result);
    const d = new Date(result.current.entries[0].createdAt);
    expect(d.toString()).not.toBe("Invalid Date");
  });
});

// ============================================================
// useAppreciationCard - deleteCard
// ============================================================

describe("useAppreciationCard - deleteCard", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("카드 삭제 후 entries 길이가 감소한다", () => {
    const { result } = makeHook();
    sendCard(result);
    const id = result.current.entries[0].id;
    act(() => { result.current.deleteCard(id); });
    expect(result.current.entries).toHaveLength(0);
  });

  it("특정 카드만 삭제된다", () => {
    const { result } = makeHook();
    sendCard(result, { message: "카드1" });
    sendCard(result, { message: "카드2" });
    const id = result.current.entries.find(
      (e: AppreciationCardEntry) => e.message === "카드1"
    )!.id;
    act(() => { result.current.deleteCard(id); });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].message).toBe("카드2");
  });

  it("존재하지 않는 id를 삭제해도 에러가 발생하지 않는다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => { result.current.deleteCard("non-existent"); });
    }).not.toThrow();
  });

  it("모든 카드를 삭제하면 entries가 빈 배열이 된다", () => {
    const { result } = makeHook();
    sendCard(result);
    sendCard(result);
    const id1 = result.current.entries[0].id;
    const id2 = result.current.entries[1].id;
    act(() => { result.current.deleteCard(id1); });
    act(() => { result.current.deleteCard(id2); });
    expect(result.current.entries).toHaveLength(0);
  });
});

// ============================================================
// useAppreciationCard - toggleLike
// ============================================================

describe("useAppreciationCard - toggleLike", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("좋아요 추가 시 likes 배열에 멤버명이 추가된다", () => {
    const { result } = makeHook();
    sendCard(result);
    const id = result.current.entries[0].id;
    act(() => { result.current.toggleLike(id, "이영희"); });
    expect(result.current.entries[0].likes).toContain("이영희");
  });

  it("좋아요를 두 번 누르면 취소된다 (토글)", () => {
    const { result } = makeHook();
    sendCard(result);
    const id = result.current.entries[0].id;
    act(() => { result.current.toggleLike(id, "이영희"); });
    act(() => { result.current.toggleLike(id, "이영희"); });
    expect(result.current.entries[0].likes).not.toContain("이영희");
  });

  it("여러 멤버가 좋아요를 누를 수 있다", () => {
    const { result } = makeHook();
    sendCard(result);
    const id = result.current.entries[0].id;
    act(() => { result.current.toggleLike(id, "멤버A"); });
    act(() => { result.current.toggleLike(id, "멤버B"); });
    act(() => { result.current.toggleLike(id, "멤버C"); });
    expect(result.current.entries[0].likes).toHaveLength(3);
  });

  it("좋아요 토글은 해당 카드에만 영향을 미친다", () => {
    const { result } = makeHook();
    sendCard(result, { message: "카드1" });
    sendCard(result, { message: "카드2" });
    const id1 = result.current.entries.find(
      (e: AppreciationCardEntry) => e.message === "카드1"
    )!.id;
    act(() => { result.current.toggleLike(id1, "이영희"); });
    const card2 = result.current.entries.find(
      (e: AppreciationCardEntry) => e.message === "카드2"
    );
    expect(card2?.likes).toHaveLength(0);
  });

  it("한 명이 좋아요를 취소해도 다른 멤버의 좋아요는 유지된다", () => {
    const { result } = makeHook();
    sendCard(result);
    const id = result.current.entries[0].id;
    act(() => { result.current.toggleLike(id, "멤버A"); });
    act(() => { result.current.toggleLike(id, "멤버B"); });
    act(() => { result.current.toggleLike(id, "멤버A"); }); // A 취소
    expect(result.current.entries[0].likes).toContain("멤버B");
    expect(result.current.entries[0].likes).not.toContain("멤버A");
  });
});

// ============================================================
// useAppreciationCard - getVisibleEntries
// ============================================================

describe("useAppreciationCard - getVisibleEntries", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("공개 카드는 누구에게나 보인다", () => {
    const { result } = makeHook();
    sendCard(result, { from: "A", to: "B", isPublic: true });
    const visible = result.current.getVisibleEntries("C");
    expect(visible).toHaveLength(1);
  });

  it("비공개 카드는 보낸 사람에게 보인다", () => {
    const { result } = makeHook();
    sendCard(result, { from: "A", to: "B", isPublic: false });
    const visible = result.current.getVisibleEntries("A");
    expect(visible).toHaveLength(1);
  });

  it("비공개 카드는 받은 사람에게 보인다", () => {
    const { result } = makeHook();
    sendCard(result, { from: "A", to: "B", isPublic: false });
    const visible = result.current.getVisibleEntries("B");
    expect(visible).toHaveLength(1);
  });

  it("비공개 카드는 제3자에게 보이지 않는다", () => {
    const { result } = makeHook();
    sendCard(result, { from: "A", to: "B", isPublic: false });
    const visible = result.current.getVisibleEntries("C");
    expect(visible).toHaveLength(0);
  });

  it("currentMemberName이 undefined이면 공개 카드만 반환한다", () => {
    const { result } = makeHook();
    sendCard(result, { from: "A", to: "B", isPublic: true });
    sendCard(result, { from: "A", to: "B", isPublic: false });
    const visible = result.current.getVisibleEntries(undefined);
    expect(visible).toHaveLength(1);
  });
});

// ============================================================
// useAppreciationCard - getEntriesTo / getEntriesFrom
// ============================================================

describe("useAppreciationCard - getEntriesTo / getEntriesFrom", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("getEntriesTo는 해당 멤버가 받은 카드만 반환한다", () => {
    const { result } = makeHook();
    sendCard(result, { to: "B" });
    sendCard(result, { to: "C" });
    sendCard(result, { to: "B" });
    const entries = result.current.getEntriesTo("B");
    expect(entries).toHaveLength(2);
    entries.forEach((e: AppreciationCardEntry) =>
      expect(e.toMember).toBe("B")
    );
  });

  it("getEntriesFrom은 해당 멤버가 보낸 카드만 반환한다", () => {
    const { result } = makeHook();
    sendCard(result, { from: "A" });
    sendCard(result, { from: "B" });
    sendCard(result, { from: "A" });
    const entries = result.current.getEntriesFrom("A");
    expect(entries).toHaveLength(2);
    entries.forEach((e: AppreciationCardEntry) =>
      expect(e.fromMember).toBe("A")
    );
  });

  it("받은 카드가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    sendCard(result, { to: "B" });
    const entries = result.current.getEntriesTo("X");
    expect(entries).toHaveLength(0);
  });

  it("보낸 카드가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    sendCard(result, { from: "A" });
    const entries = result.current.getEntriesFrom("X");
    expect(entries).toHaveLength(0);
  });
});

// ============================================================
// useAppreciationCard - 통계 (topReceiver, topSender, categoryDistribution)
// ============================================================

describe("useAppreciationCard - 통계", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("topReceiver는 가장 많이 받은 멤버 이름이다", () => {
    const { result } = makeHook();
    sendCard(result, { to: "B" });
    sendCard(result, { to: "B" });
    sendCard(result, { to: "C" });
    expect(result.current.topReceiver).toBe("B");
  });

  it("topSender는 가장 많이 보낸 멤버 이름이다", () => {
    const { result } = makeHook();
    sendCard(result, { from: "A" });
    sendCard(result, { from: "A" });
    sendCard(result, { from: "B" });
    expect(result.current.topSender).toBe("A");
  });

  it("categoryDistribution이 카테고리별 카드 수를 올바르게 집계한다", () => {
    const { result } = makeHook();
    sendCard(result, { category: "effort" });
    sendCard(result, { category: "effort" });
    sendCard(result, { category: "growth" });
    expect(result.current.categoryDistribution.effort).toBe(2);
    expect(result.current.categoryDistribution.growth).toBe(1);
    expect(result.current.categoryDistribution.leadership).toBe(0);
  });

  it("카드가 없을 때 topReceiver와 topSender는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.topReceiver).toBeNull();
    expect(result.current.topSender).toBeNull();
  });

  it("카드 삭제 후 totalEntries가 감소한다", () => {
    const { result } = makeHook();
    sendCard(result);
    sendCard(result);
    const id = result.current.entries[0].id;
    act(() => { result.current.deleteCard(id); });
    expect(result.current.totalEntries).toBe(1);
  });
});

// ============================================================
// useAppreciationCard - 카테고리 6가지 모두 지원
// ============================================================

describe("useAppreciationCard - 카테고리 지원", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("6가지 카테고리 카드 전송 후 categoryDistribution 합산이 totalEntries와 같다", () => {
    const { result } = makeHook();
    const categories: AppreciationCardCategory[] = [
      "leadership",
      "effort",
      "growth",
      "help",
      "fun",
      "other",
    ];
    categories.forEach((category) => sendCard(result, { category }));
    const dist = result.current.categoryDistribution;
    const total =
      dist.leadership +
      dist.effort +
      dist.growth +
      dist.help +
      dist.fun +
      dist.other;
    expect(total).toBe(result.current.totalEntries);
  });
});
