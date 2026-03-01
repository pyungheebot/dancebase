import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── @/lib/local-storage mock: vi.hoisted으로 memStore 제어 ──
const localStorageLib = vi.hoisted(() => {
  const memStore: Record<string, unknown> = {};
  return {
    memStore,
    reset: () => {
      Object.keys(memStore).forEach((k) => delete memStore[k]);
    },
  };
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    if (key in localStorageLib.memStore) {
      return localStorageLib.memStore[key] as T;
    }
    // ReadReceiptData 기본값: announcements 배열이 없으면 안전하게 초기화
    if (typeof defaultValue === "object" && defaultValue !== null && !("announcements" in (defaultValue as object))) {
      // groupId를 key에서 추출하여 기본 ReadReceiptData 반환
      const groupId = key.replace("dancebase:read-receipt:", "");
      return {
        groupId,
        announcements: [],
        updatedAt: new Date().toISOString(),
      } as unknown as T;
    }
    return defaultValue;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    localStorageLib.memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete localStorageLib.memStore[key];
  },
}));

// ─── SWR mock: vi.hoisted으로 store 제어 ─────────────────────
const swrStore = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const reset = () => store.clear();
  return { store, reset };
});

vi.mock("swr", () => ({
  default: (
    key: string | null,
    fetcher: (() => unknown) | null,
    options?: { fallbackData?: unknown }
  ) => {
    if (!key) return { data: options?.fallbackData, isLoading: false, mutate: vi.fn() };

    if (!swrStore.store.has(key)) {
      const fetched = fetcher ? fetcher() : undefined;
      swrStore.store.set(
        key,
        fetched !== undefined ? fetched : (options?.fallbackData ?? undefined)
      );
    }

    const mutate = (newData?: unknown) => {
      if (newData !== undefined) swrStore.store.set(key, newData);
      else if (fetcher) swrStore.store.set(key, fetcher());
    };

    return { data: swrStore.store.get(key), isLoading: false, mutate };
  },
}));

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    readReceipt: (groupId: string) => `read-receipt-${groupId}`,
  },
}));

import { useReadReceipt } from "@/hooks/use-read-receipt";
import type { ReadReceiptAnnouncement, ReadReceiptData } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeAnnouncement(overrides?: Partial<ReadReceiptAnnouncement>): ReadReceiptAnnouncement {
  return {
    id: "ann-1",
    title: "공지사항",
    content: "내용입니다",
    author: "관리자",
    priority: "normal",
    targetMembers: ["홍길동", "김철수"],
    readers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeData(groupId: string, announcements: ReadReceiptAnnouncement[] = []): ReadReceiptData {
  return {
    groupId,
    announcements,
    updatedAt: new Date().toISOString(),
  };
}

function seedData(groupId: string, data: ReadReceiptData) {
  const key = `dancebase:read-receipt:${groupId}`;
  localStorageLib.memStore[key] = data;
}

function resetAll() {
  localStorageLib.reset();
  swrStore.reset();
}

// ─── 초기 상태 ──────────────────────────────────────────────
describe("useReadReceipt - 초기 상태", () => {
  beforeEach(() => resetAll());

  it("초기 announcements는 빈 배열이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.announcements).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.total은 0이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.stats.total).toBe(0);
  });

  it("초기 stats.urgentCount는 0이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.stats.urgentCount).toBe(0);
  });

  it("초기 stats.importantCount는 0이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.stats.importantCount).toBe(0);
  });

  it("초기 stats.normalCount는 0이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.stats.normalCount).toBe(0);
  });

  it("초기 stats.avgReadRate는 0이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.stats.avgReadRate).toBe(0);
  });

  it("필수 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(typeof result.current.addAnnouncement).toBe("function");
    expect(typeof result.current.updateAnnouncement).toBe("function");
    expect(typeof result.current.deleteAnnouncement).toBe("function");
    expect(typeof result.current.markAsRead).toBe("function");
    expect(typeof result.current.unmarkAsRead).toBe("function");
    expect(typeof result.current.getReadRate).toBe("function");
    expect(typeof result.current.getUnreadMembers).toBe("function");
    expect(typeof result.current.getReadMembers).toBe("function");
    expect(typeof result.current.isReadByMember).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ─── addAnnouncement ─────────────────────────────────────────
describe("useReadReceipt - addAnnouncement", () => {
  beforeEach(() => resetAll());

  it("공지를 추가하면 반환된다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ann: ReadReceiptAnnouncement;
    act(() => {
      ann = result.current.addAnnouncement({
        title: "공지사항",
        content: "내용",
        author: "관리자",
        priority: "normal",
        targetMembers: ["홍길동"],
      });
    });
    expect(ann!).toBeDefined();
    expect(ann!.title).toBe("공지사항");
  });

  it("추가된 공지의 readers는 빈 배열이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ann: ReadReceiptAnnouncement;
    act(() => {
      ann = result.current.addAnnouncement({
        title: "공지사항",
        content: "내용",
        author: "관리자",
        priority: "urgent",
        targetMembers: ["홍길동", "김철수"],
      });
    });
    expect(ann!.readers).toEqual([]);
  });

  it("title 앞뒤 공백이 제거된다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ann: ReadReceiptAnnouncement;
    act(() => {
      ann = result.current.addAnnouncement({
        title: "  공지  ",
        content: "내용",
        author: "관리자",
        priority: "normal",
        targetMembers: [],
      });
    });
    expect(ann!.title).toBe("공지");
  });

  it("targetMembers 공백이 제거된다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ann: ReadReceiptAnnouncement;
    act(() => {
      ann = result.current.addAnnouncement({
        title: "공지",
        content: "내용",
        author: "관리자",
        priority: "normal",
        targetMembers: ["  홍길동  ", ""],
      });
    });
    expect(ann!.targetMembers).toEqual(["홍길동"]);
  });

  it("localStorage에 저장된다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    act(() => {
      result.current.addAnnouncement({
        title: "공지",
        content: "내용",
        author: "관리자",
        priority: "normal",
        targetMembers: ["홍길동"],
      });
    });
    const key = "dancebase:read-receipt:group-1";
    expect(localStorageLib.memStore[key]).toBeDefined();
  });

  it("새 공지는 리스트 맨 앞에 추가된다", () => {
    const existing = makeAnnouncement({ id: "ann-old", title: "이전 공지" });
    seedData("group-1", makeData("group-1", [existing]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    act(() => {
      result.current.addAnnouncement({
        title: "새 공지",
        content: "내용",
        author: "관리자",
        priority: "normal",
        targetMembers: [],
      });
    });
    const saved = localStorageLib.memStore["dancebase:read-receipt:group-1"] as ReadReceiptData;
    expect(saved.announcements[0].title).toBe("새 공지");
  });
});

// ─── updateAnnouncement ──────────────────────────────────────
describe("useReadReceipt - updateAnnouncement", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 공지 수정 시 false를 반환한다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateAnnouncement("non-existent", { title: "새 제목" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 공지 수정 시 true를 반환한다", () => {
    const ann = makeAnnouncement();
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateAnnouncement("ann-1", { title: "수정된 제목" });
    });
    expect(ret!).toBe(true);
  });

  it("수정된 title이 저장된다", () => {
    const ann = makeAnnouncement();
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    act(() => {
      result.current.updateAnnouncement("ann-1", { title: "수정된 제목" });
    });
    const saved = localStorageLib.memStore["dancebase:read-receipt:group-1"] as ReadReceiptData;
    expect(saved.announcements[0].title).toBe("수정된 제목");
  });

  it("priority 수정이 반영된다", () => {
    const ann = makeAnnouncement({ priority: "normal" });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    act(() => {
      result.current.updateAnnouncement("ann-1", { priority: "urgent" });
    });
    const saved = localStorageLib.memStore["dancebase:read-receipt:group-1"] as ReadReceiptData;
    expect(saved.announcements[0].priority).toBe("urgent");
  });

  it("updatedAt이 갱신된다", () => {
    const oldTime = "2020-01-01T00:00:00.000Z";
    const ann = makeAnnouncement({ updatedAt: oldTime });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    act(() => {
      result.current.updateAnnouncement("ann-1", { title: "새 제목" });
    });
    const saved = localStorageLib.memStore["dancebase:read-receipt:group-1"] as ReadReceiptData;
    expect(saved.announcements[0].updatedAt).not.toBe(oldTime);
  });
});

// ─── deleteAnnouncement ──────────────────────────────────────
describe("useReadReceipt - deleteAnnouncement", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 공지 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteAnnouncement("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 공지 삭제 시 true를 반환한다", () => {
    const ann = makeAnnouncement();
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteAnnouncement("ann-1");
    });
    expect(ret!).toBe(true);
  });

  it("삭제 후 localStorage에서 제거된다", () => {
    const ann1 = makeAnnouncement({ id: "ann-1", title: "공지1" });
    const ann2 = makeAnnouncement({ id: "ann-2", title: "공지2" });
    seedData("group-1", makeData("group-1", [ann1, ann2]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    act(() => {
      result.current.deleteAnnouncement("ann-1");
    });
    const saved = localStorageLib.memStore["dancebase:read-receipt:group-1"] as ReadReceiptData;
    expect(saved.announcements).toHaveLength(1);
    expect(saved.announcements[0].id).toBe("ann-2");
  });
});

// ─── markAsRead ──────────────────────────────────────────────
describe("useReadReceipt - markAsRead", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 공지에 읽음 처리 시 false를 반환한다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.markAsRead("non-existent", "홍길동");
    });
    expect(ret!).toBe(false);
  });

  it("이미 읽은 멤버가 다시 읽음 처리 시 false를 반환한다", () => {
    const ann = makeAnnouncement({
      readers: [{ memberName: "홍길동", readAt: new Date().toISOString() }],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.markAsRead("ann-1", "홍길동");
    });
    expect(ret!).toBe(false);
  });

  it("정상 읽음 처리 시 true를 반환한다", () => {
    const ann = makeAnnouncement();
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.markAsRead("ann-1", "홍길동");
    });
    expect(ret!).toBe(true);
  });

  it("읽음 처리 후 readers에 추가된다", () => {
    const ann = makeAnnouncement();
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    act(() => {
      result.current.markAsRead("ann-1", "홍길동");
    });
    const saved = localStorageLib.memStore["dancebase:read-receipt:group-1"] as ReadReceiptData;
    expect(saved.announcements[0].readers).toHaveLength(1);
    expect(saved.announcements[0].readers[0].memberName).toBe("홍길동");
  });

  it("읽음 처리 후 readAt이 저장된다", () => {
    const ann = makeAnnouncement();
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    act(() => {
      result.current.markAsRead("ann-1", "홍길동");
    });
    const saved = localStorageLib.memStore["dancebase:read-receipt:group-1"] as ReadReceiptData;
    expect(saved.announcements[0].readers[0].readAt).toBeDefined();
  });
});

// ─── unmarkAsRead ────────────────────────────────────────────
describe("useReadReceipt - unmarkAsRead", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 공지에서 읽음 취소 시 false를 반환한다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.unmarkAsRead("non-existent", "홍길동");
    });
    expect(ret!).toBe(false);
  });

  it("정상 읽음 취소 시 true를 반환한다", () => {
    const ann = makeAnnouncement({
      readers: [{ memberName: "홍길동", readAt: new Date().toISOString() }],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.unmarkAsRead("ann-1", "홍길동");
    });
    expect(ret!).toBe(true);
  });

  it("읽음 취소 후 readers에서 제거된다", () => {
    const ann = makeAnnouncement({
      readers: [
        { memberName: "홍길동", readAt: new Date().toISOString() },
        { memberName: "김철수", readAt: new Date().toISOString() },
      ],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    act(() => {
      result.current.unmarkAsRead("ann-1", "홍길동");
    });
    const saved = localStorageLib.memStore["dancebase:read-receipt:group-1"] as ReadReceiptData;
    expect(saved.announcements[0].readers).toHaveLength(1);
    expect(saved.announcements[0].readers[0].memberName).toBe("김철수");
  });
});

// ─── getReadRate ─────────────────────────────────────────────
describe("useReadReceipt - getReadRate", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 공지의 읽음률은 0이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let rate: number;
    act(() => {
      rate = result.current.getReadRate("non-existent");
    });
    expect(rate!).toBe(0);
  });

  it("targetMembers가 없으면 읽음률은 0이다", () => {
    const ann = makeAnnouncement({ targetMembers: [] });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let rate: number;
    act(() => {
      rate = result.current.getReadRate("ann-1");
    });
    expect(rate!).toBe(0);
  });

  it("2명 중 1명이 읽으면 50%이다", () => {
    const ann = makeAnnouncement({
      targetMembers: ["홍길동", "김철수"],
      readers: [{ memberName: "홍길동", readAt: new Date().toISOString() }],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let rate: number;
    act(() => {
      rate = result.current.getReadRate("ann-1");
    });
    expect(rate!).toBe(50);
  });

  it("모두 읽으면 100%이다", () => {
    const ann = makeAnnouncement({
      targetMembers: ["홍길동"],
      readers: [{ memberName: "홍길동", readAt: new Date().toISOString() }],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let rate: number;
    act(() => {
      rate = result.current.getReadRate("ann-1");
    });
    expect(rate!).toBe(100);
  });

  it("targetMembers에 없는 독자는 읽음률에 포함되지 않는다", () => {
    const ann = makeAnnouncement({
      targetMembers: ["홍길동"],
      readers: [
        { memberName: "홍길동", readAt: new Date().toISOString() },
        { memberName: "외부인", readAt: new Date().toISOString() },
      ],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let rate: number;
    act(() => {
      rate = result.current.getReadRate("ann-1");
    });
    // 홍길동만 타겟이고 읽었으므로 100%
    expect(rate!).toBe(100);
  });
});

// ─── getUnreadMembers ────────────────────────────────────────
describe("useReadReceipt - getUnreadMembers", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 공지의 미읽음 멤버는 빈 배열이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let unread: string[];
    act(() => {
      unread = result.current.getUnreadMembers("non-existent");
    });
    expect(unread!).toEqual([]);
  });

  it("아무도 안 읽으면 targetMembers가 모두 반환된다", () => {
    const ann = makeAnnouncement({
      targetMembers: ["홍길동", "김철수"],
      readers: [],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let unread: string[];
    act(() => {
      unread = result.current.getUnreadMembers("ann-1");
    });
    expect(unread!).toEqual(["홍길동", "김철수"]);
  });

  it("읽은 멤버는 미읽음 목록에서 제외된다", () => {
    const ann = makeAnnouncement({
      targetMembers: ["홍길동", "김철수"],
      readers: [{ memberName: "홍길동", readAt: new Date().toISOString() }],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let unread: string[];
    act(() => {
      unread = result.current.getUnreadMembers("ann-1");
    });
    expect(unread!).toEqual(["김철수"]);
  });
});

// ─── getReadMembers ──────────────────────────────────────────
describe("useReadReceipt - getReadMembers", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 공지의 읽음 멤버는 빈 배열이다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let read: unknown[];
    act(() => {
      read = result.current.getReadMembers("non-existent");
    });
    expect(read!).toEqual([]);
  });

  it("타겟이 아닌 독자는 읽음 멤버에 포함되지 않는다", () => {
    const ann = makeAnnouncement({
      targetMembers: ["홍길동"],
      readers: [
        { memberName: "홍길동", readAt: new Date().toISOString() },
        { memberName: "외부인", readAt: new Date().toISOString() },
      ],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let read: { memberName: string }[];
    act(() => {
      read = result.current.getReadMembers("ann-1");
    });
    expect(read!).toHaveLength(1);
    expect(read![0].memberName).toBe("홍길동");
  });
});

// ─── isReadByMember ──────────────────────────────────────────
describe("useReadReceipt - isReadByMember", () => {
  beforeEach(() => resetAll());

  it("존재하지 않는 공지면 false를 반환한다", () => {
    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.isReadByMember("non-existent", "홍길동");
    });
    expect(ret!).toBe(false);
  });

  it("읽지 않은 멤버면 false를 반환한다", () => {
    const ann = makeAnnouncement({ readers: [] });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.isReadByMember("ann-1", "홍길동");
    });
    expect(ret!).toBe(false);
  });

  it("읽은 멤버면 true를 반환한다", () => {
    const ann = makeAnnouncement({
      readers: [{ memberName: "홍길동", readAt: new Date().toISOString() }],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.isReadByMember("ann-1", "홍길동");
    });
    expect(ret!).toBe(true);
  });
});

// ─── 통계 계산 ───────────────────────────────────────────────
describe("useReadReceipt - 통계 계산", () => {
  beforeEach(() => resetAll());

  it("urgentCount가 정확하다", () => {
    const anns = [
      makeAnnouncement({ id: "a1", priority: "urgent" }),
      makeAnnouncement({ id: "a2", priority: "urgent" }),
      makeAnnouncement({ id: "a3", priority: "normal" }),
    ];
    seedData("group-1", makeData("group-1", anns));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.stats.urgentCount).toBe(2);
  });

  it("importantCount가 정확하다", () => {
    const anns = [
      makeAnnouncement({ id: "a1", priority: "important" }),
      makeAnnouncement({ id: "a2", priority: "normal" }),
    ];
    seedData("group-1", makeData("group-1", anns));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.stats.importantCount).toBe(1);
  });

  it("avgReadRate가 0~100 범위이다", () => {
    const ann = makeAnnouncement({
      targetMembers: ["홍길동", "김철수"],
      readers: [{ memberName: "홍길동", readAt: new Date().toISOString() }],
    });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.stats.avgReadRate).toBeGreaterThanOrEqual(0);
    expect(result.current.stats.avgReadRate).toBeLessThanOrEqual(100);
  });

  it("targetMembers가 없는 공지는 avgReadRate 계산에서 0으로 처리된다", () => {
    // targetMembers: [] 공지 1개 -> 해당 공지 기여도 0 -> avgReadRate = 0
    // 소스에서: if (a.targetMembers.length === 0) return sum (기여 없음)
    // sum=0 / total=1 * 100 = 0
    const ann = makeAnnouncement({ targetMembers: [], readers: [] });
    seedData("group-1", makeData("group-1", [ann]));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.stats.avgReadRate).toBe(0);
  });

  it("total이 공지 개수와 일치한다", () => {
    const anns = [
      makeAnnouncement({ id: "a1" }),
      makeAnnouncement({ id: "a2" }),
      makeAnnouncement({ id: "a3" }),
    ];
    seedData("group-1", makeData("group-1", anns));

    const { result } = renderHook(() => useReadReceipt("group-1"));
    expect(result.current.stats.total).toBe(3);
  });
});

// ─── 그룹별 격리 ─────────────────────────────────────────────
describe("useReadReceipt - 그룹별 격리", () => {
  beforeEach(() => resetAll());

  it("다른 groupId는 독립적인 데이터를 갖는다", () => {
    const ann1 = makeAnnouncement({ id: "a1", title: "그룹A 공지" });
    const ann2 = makeAnnouncement({ id: "a2", title: "그룹B 공지" });

    seedData("group-a", makeData("group-a", [ann1]));
    seedData("group-b", makeData("group-b", [ann2]));

    const { result: rA } = renderHook(() => useReadReceipt("group-a"));
    const { result: rB } = renderHook(() => useReadReceipt("group-b"));

    expect(rA.current.announcements[0].title).toBe("그룹A 공지");
    expect(rB.current.announcements[0].title).toBe("그룹B 공지");
  });

  it("저장 시 키에 groupId가 포함된다", () => {
    const { result } = renderHook(() => useReadReceipt("my-group-xyz"));
    act(() => {
      result.current.addAnnouncement({
        title: "공지",
        content: "내용",
        author: "관리자",
        priority: "normal",
        targetMembers: [],
      });
    });
    const savedKey = Object.keys(localStorageLib.memStore).find((k) =>
      k.includes("my-group-xyz")
    );
    expect(savedKey).toBeDefined();
    expect(savedKey).toContain("my-group-xyz");
  });
});
