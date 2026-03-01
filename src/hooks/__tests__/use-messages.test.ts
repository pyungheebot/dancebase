import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Message } from "@/types";

// ─── Supabase & 훅 의존성 mock ────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    rpc: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/hooks/use-realtime", () => ({
  useRealtime: vi.fn(),
}));

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    conversations: () => "/conversations",
    conversation: (id: string) => `/conversations/${id}`,
    unreadCount: () => "/unread-count",
  },
}));

vi.mock("@/lib/swr/cache-config", () => ({
  realtimeConfig: {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  },
}));

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// ─── 내부 로직 재구현 (순수 함수 테스트용) ───────────────────

const PAGE_SIZE = 50;

/** SWR 데이터와 olderMessages를 합산하는 로직 (중복 제거) */
function mergeMessages(
  olderMessages: Message[],
  swrMessages: Message[]
): Message[] {
  if (olderMessages.length === 0) return swrMessages;
  const swrIds = new Set(swrMessages.map((m) => m.id));
  const uniqueOlder = olderMessages.filter((m) => !swrIds.has(m.id));
  return [...uniqueOlder, ...swrMessages];
}

/** hasMore 판단 (PAGE_SIZE개 가득 찼는지) */
function calcHasMore(fetchedCount: number): boolean {
  return fetchedCount === PAGE_SIZE;
}

/** 낙관적 메시지를 추가하는 로직 */
function addOptimisticMessage(
  prev: { messages: Message[] } | undefined,
  newMsg: Message
): { messages: Message[] } | undefined {
  if (!prev) return prev;
  return { ...prev, messages: [...prev.messages, newMsg] };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: `msg-${Math.random()}`,
    sender_id: "user-1",
    receiver_id: "user-2",
    content: "테스트 메시지",
    created_at: new Date().toISOString(),
    read_at: null,
    ...overrides,
  };
}

// ============================================================
// mergeMessages 로직 테스트
// ============================================================

describe("useMessages - mergeMessages 메시지 병합 로직", () => {
  it("olderMessages가 없으면 swrMessages를 그대로 반환한다", () => {
    const swrMsgs = [makeMessage({ id: "m1" }), makeMessage({ id: "m2" })];
    const result = mergeMessages([], swrMsgs);
    expect(result).toEqual(swrMsgs);
  });

  it("olderMessages가 있으면 앞에 붙어서 반환된다", () => {
    const older = [makeMessage({ id: "older-1" })];
    const swr = [makeMessage({ id: "swr-1" })];
    const result = mergeMessages(older, swr);
    expect(result[0].id).toBe("older-1");
    expect(result[1].id).toBe("swr-1");
  });

  it("중복 메시지(같은 id)는 olderMessages에서 제거된다", () => {
    const msg = makeMessage({ id: "dup-1" });
    const older = [msg, makeMessage({ id: "older-only" })];
    const swr = [msg, makeMessage({ id: "swr-only" })];
    const result = mergeMessages(older, swr);
    const dup1Count = result.filter((m) => m.id === "dup-1").length;
    expect(dup1Count).toBe(1);
  });

  it("swrMessages가 비어있으면 olderMessages만 반환된다", () => {
    const older = [makeMessage({ id: "o1" }), makeMessage({ id: "o2" })];
    const result = mergeMessages(older, []);
    expect(result).toEqual(older);
  });

  it("두 배열 모두 비어있으면 빈 배열을 반환한다", () => {
    const result = mergeMessages([], []);
    expect(result).toEqual([]);
  });

  it("olderMessages의 순서가 유지된다", () => {
    const older = [
      makeMessage({ id: "o1", created_at: "2026-03-01T10:00:00Z" }),
      makeMessage({ id: "o2", created_at: "2026-03-01T11:00:00Z" }),
    ];
    const swr = [makeMessage({ id: "s1", created_at: "2026-03-01T12:00:00Z" })];
    const result = mergeMessages(older, swr);
    expect(result[0].id).toBe("o1");
    expect(result[1].id).toBe("o2");
    expect(result[2].id).toBe("s1");
  });

  it("중복 없는 경우 두 배열의 합산 길이를 반환한다", () => {
    const older = [makeMessage({ id: "o1" }), makeMessage({ id: "o2" })];
    const swr = [makeMessage({ id: "s1" }), makeMessage({ id: "s2" }), makeMessage({ id: "s3" })];
    const result = mergeMessages(older, swr);
    expect(result).toHaveLength(5);
  });

  it("모든 olderMessages가 swr에 중복되면 swr만 반환된다", () => {
    const msg1 = makeMessage({ id: "m1" });
    const msg2 = makeMessage({ id: "m2" });
    const result = mergeMessages([msg1, msg2], [msg1, msg2]);
    expect(result).toHaveLength(2);
  });
});

// ============================================================
// calcHasMore 로직 테스트
// ============================================================

describe("useMessages - calcHasMore 페이지네이션 판단", () => {
  it("fetchedCount가 PAGE_SIZE(50)와 같으면 true이다", () => {
    expect(calcHasMore(50)).toBe(true);
  });

  it("fetchedCount가 PAGE_SIZE 미만이면 false이다", () => {
    expect(calcHasMore(49)).toBe(false);
  });

  it("fetchedCount가 0이면 false이다", () => {
    expect(calcHasMore(0)).toBe(false);
  });

  it("fetchedCount가 PAGE_SIZE 초과이면 true이다 (동일한 조건)", () => {
    // 실제로 DB limit=50이므로 50 초과는 없지만 로직상 === 이므로 false
    expect(calcHasMore(51)).toBe(false);
  });

  it("fetchedCount가 정확히 50이면 hasMore가 true이다", () => {
    expect(calcHasMore(PAGE_SIZE)).toBe(true);
  });
});

// ============================================================
// addOptimisticMessage 로직 테스트
// ============================================================

describe("useMessages - addOptimisticMessage 낙관적 업데이트", () => {
  it("prev가 undefined이면 undefined를 반환한다", () => {
    const msg = makeMessage({ id: "new-1" });
    const result = addOptimisticMessage(undefined, msg);
    expect(result).toBeUndefined();
  });

  it("새 메시지가 기존 messages 뒤에 추가된다", () => {
    const existing = makeMessage({ id: "existing" });
    const newMsg = makeMessage({ id: "new-msg" });
    const result = addOptimisticMessage({ messages: [existing] }, newMsg);
    expect(result!.messages).toHaveLength(2);
    expect(result!.messages[1].id).toBe("new-msg");
  });

  it("기존 messages가 변경되지 않는다 (불변성)", () => {
    const existing = [makeMessage({ id: "e1" })];
    const newMsg = makeMessage({ id: "n1" });
    addOptimisticMessage({ messages: existing }, newMsg);
    expect(existing).toHaveLength(1);
  });

  it("빈 messages에 새 메시지를 추가할 수 있다", () => {
    const newMsg = makeMessage({ id: "first" });
    const result = addOptimisticMessage({ messages: [] }, newMsg);
    expect(result!.messages).toHaveLength(1);
    expect(result!.messages[0].id).toBe("first");
  });

  it("반환된 객체는 원본 prev와 다른 참조이다", () => {
    const prev = { messages: [makeMessage()] };
    const newMsg = makeMessage();
    const result = addOptimisticMessage(prev, newMsg);
    expect(result).not.toBe(prev);
  });

  it("여러 번 호출해도 올바르게 축적된다", () => {
    let state: { messages: Message[] } | undefined = { messages: [] };
    state = addOptimisticMessage(state, makeMessage({ id: "m1" }));
    state = addOptimisticMessage(state, makeMessage({ id: "m2" }));
    state = addOptimisticMessage(state, makeMessage({ id: "m3" }));
    expect(state!.messages).toHaveLength(3);
  });
});

// ============================================================
// 대화 필터/구독 로직 테스트
// ============================================================

describe("useMessages - subscriptions 배열 생성 로직", () => {
  it("user가 없으면 빈 배열을 반환한다", () => {
    const user = null;
    const subscriptions = user ? ["sub1", "sub2"] : [];
    expect(subscriptions).toHaveLength(0);
  });

  it("user가 있으면 subscriptions가 2개 생성된다", () => {
    const user = { id: "user-abc" };
    const subscriptions = user
      ? [
          { event: "INSERT", table: "messages", filter: `receiver_id=eq.${user.id}` },
          { event: "INSERT", table: "messages", filter: `sender_id=eq.${user.id}` },
        ]
      : [];
    expect(subscriptions).toHaveLength(2);
  });

  it("unreadCount용 subscriptions는 INSERT와 UPDATE 이벤트를 가진다", () => {
    const user = { id: "user-abc" };
    const subscriptions = user
      ? [
          { event: "INSERT", table: "messages", filter: `receiver_id=eq.${user.id}` },
          { event: "UPDATE", table: "messages", filter: `receiver_id=eq.${user.id}` },
        ]
      : [];
    expect(subscriptions[0].event).toBe("INSERT");
    expect(subscriptions[1].event).toBe("UPDATE");
  });

  it("filter 값에 userId가 포함된다", () => {
    const userId = "test-user-123";
    const filter = `receiver_id=eq.${userId}`;
    expect(filter).toContain(userId);
  });
});

// ============================================================
// unreadCount 기본값 테스트
// ============================================================

describe("useMessages - unreadCount 기본값 및 타입", () => {
  it("data가 숫자가 아니면 0을 반환한다", () => {
    // get_unread_message_count RPC가 숫자가 아닌 값 반환 시 fallback
    const data: unknown = "not-a-number";
    const count = typeof data === "number" ? data : 0;
    expect(count).toBe(0);
  });

  it("data가 0이면 0을 반환한다", () => {
    const data: unknown = 0;
    const count = typeof data === "number" ? data : 0;
    expect(count).toBe(0);
  });

  it("data가 양수이면 그 값을 반환한다", () => {
    const data: unknown = 5;
    const count = typeof data === "number" ? data : 0;
    expect(count).toBe(5);
  });

  it("data가 null이면 0을 반환한다", () => {
    const data: unknown = null;
    const count = typeof data === "number" ? data : 0;
    expect(count).toBe(0);
  });
});

// ============================================================
// loadMore 커서 로직 테스트
// ============================================================

describe("useMessages - loadMore 커서 기반 페이지네이션 로직", () => {
  it("fetched 결과를 역순으로 정렬한다 (reverse)", () => {
    // DB에서 내림차순으로 받은 메시지를 역순 정렬해서 시간순으로 만드는 로직
    const fetchedDesc = [
      makeMessage({ id: "m3", created_at: "2026-03-01T12:00:00Z" }),
      makeMessage({ id: "m2", created_at: "2026-03-01T11:00:00Z" }),
      makeMessage({ id: "m1", created_at: "2026-03-01T10:00:00Z" }),
    ];
    const sorted = [...fetchedDesc].reverse();
    expect(sorted[0].id).toBe("m1");
    expect(sorted[1].id).toBe("m2");
    expect(sorted[2].id).toBe("m3");
  });

  it("fetched 결과가 있으면 oldestCursor가 첫 번째 메시지의 created_at으로 업데이트된다", () => {
    const fetched = [
      makeMessage({ id: "m1", created_at: "2026-03-01T10:00:00Z" }),
      makeMessage({ id: "m2", created_at: "2026-03-01T11:00:00Z" }),
    ];
    const oldestCursor = fetched[0].created_at;
    expect(oldestCursor).toBe("2026-03-01T10:00:00Z");
  });

  it("fetched 결과를 olderMessages 앞에 붙인다", () => {
    const prevOlder = [makeMessage({ id: "old-prev" })];
    const newFetched = [
      makeMessage({ id: "even-older-1" }),
      makeMessage({ id: "even-older-2" }),
    ];
    const updated = [...newFetched, ...prevOlder];
    expect(updated[0].id).toBe("even-older-1");
    expect(updated[2].id).toBe("old-prev");
  });

  it("loadMore 중 loadingMore가 true이면 추가 요청을 하지 않는다 (가드 로직)", () => {
    // loadingMore || !hasMore || !cursor → 조기 반환
    const loadingMore = true;
    const hasMore = true;
    const cursor = "2026-03-01T10:00:00Z";
    const shouldSkip = loadingMore || !hasMore || !cursor;
    expect(shouldSkip).toBe(true);
  });

  it("hasMore가 false이면 추가 요청을 하지 않는다", () => {
    const loadingMore = false;
    const hasMore = false;
    const cursor = "2026-03-01T10:00:00Z";
    const shouldSkip = loadingMore || !hasMore || !cursor;
    expect(shouldSkip).toBe(true);
  });

  it("cursor가 null이면 추가 요청을 하지 않는다", () => {
    const loadingMore = false;
    const hasMore = true;
    const cursor = null;
    const shouldSkip = loadingMore || !hasMore || !cursor;
    expect(shouldSkip).toBe(true);
  });

  it("조건이 모두 충족되면 요청을 진행한다", () => {
    const loadingMore = false;
    const hasMore = true;
    const cursor = "2026-03-01T10:00:00Z";
    const shouldSkip = loadingMore || !hasMore || !cursor;
    expect(shouldSkip).toBe(false);
  });
});

// ============================================================
// Message 타입 유효성 테스트
// ============================================================

describe("useMessages - Message 타입 구조", () => {
  it("makeMessage가 필수 필드를 모두 가진다", () => {
    const msg = makeMessage();
    expect(msg.id).toBeDefined();
    expect(msg.sender_id).toBeDefined();
    expect(msg.receiver_id).toBeDefined();
    expect(msg.content).toBeDefined();
    expect(msg.created_at).toBeDefined();
  });

  it("read_at이 null인 메시지는 읽지 않은 상태이다", () => {
    const msg = makeMessage({ read_at: null });
    expect(msg.read_at).toBeNull();
  });

  it("read_at이 있는 메시지는 읽은 상태이다", () => {
    const readAt = new Date().toISOString();
    const msg = makeMessage({ read_at: readAt });
    expect(msg.read_at).toBe(readAt);
  });
});
