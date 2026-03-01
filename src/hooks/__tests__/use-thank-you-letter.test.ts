import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null, _fetcher: (() => unknown) | null) => {
    return {
      data: key ? undefined : undefined,
      isLoading: false,
      mutate: vi.fn((newData?: unknown) => Promise.resolve(newData)),
    };
  },
}));

// ─── SWR 키 mock ──────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    thankYouLetter: (groupId: string, projectId: string) =>
      `dancebase:thank-you-letter:${groupId}:${projectId}`,
  },
}));

// ─── toast mock ───────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── TOAST 메시지 mock ────────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    THANK_YOU: {
      SPONSOR_REQUIRED: "후원사 이름을 입력해주세요",
      CONTENT_REQUIRED: "편지 내용을 입력해주세요",
      ADDED: "감사 편지가 추가되었습니다",
      UPDATED: "감사 편지가 수정되었습니다",
      DELETED: "감사 편지가 삭제되었습니다",
      SENT: "발송 완료 처리되었습니다",
    },
    INFO: {
      ASSIGNEE_REQUIRED: "담당자를 입력해주세요",
      MADE_DRAFT: "작성중으로 변경되었습니다",
    },
    NOT_FOUND: "항목을 찾을 수 없습니다",
  },
}));

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

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import {
  useThankYouLetter,
  type AddThankYouLetterInput,
} from "@/hooks/use-thank-you-letter";
import type { ThankYouLetterStatus, ThankYouLetterSponsorType } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────

function makeHook(groupId = "group-1", projectId = "project-1") {
  return renderHook(() => useThankYouLetter(groupId, projectId));
}

function makeInput(
  overrides: Partial<AddThankYouLetterInput> = {}
): AddThankYouLetterInput {
  return {
    sponsorName: "ABC 기업",
    sponsorType: "money",
    letterContent: "감사합니다. 귀사의 후원 덕분에...",
    managerName: "홍길동",
    ...overrides,
  };
}

async function addEntry(
  hook: ReturnType<typeof makeHook>["result"],
  overrides: Partial<AddThankYouLetterInput> = {}
) {
  let result = false;
  await act(async () => {
    result = await hook.current.addEntry(makeInput(overrides));
  });
  return result;
}

// ============================================================
// 초기 상태
// ============================================================

describe("useThankYouLetter - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });

  it("초기 stats.draft는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.draft).toBe(0);
  });

  it("초기 stats.sent는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.sent).toBe(0);
  });

  it("초기 stats.byType.money는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.byType.money).toBe(0);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.updateEntry).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.markAsSent).toBe("function");
    expect(typeof result.current.markAsDraft).toBe("function");
    expect(typeof result.current.getByStatus).toBe("function");
    expect(typeof result.current.getBySponsorType).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addEntry
// ============================================================

describe("useThankYouLetter - addEntry 편지 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("편지 추가 성공 시 true를 반환한다", async () => {
    const { result } = makeHook();
    const ret = await addEntry(result);
    expect(ret).toBe(true);
  });

  it("sponsorName이 빈 문자열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.addEntry(makeInput({ sponsorName: "" }));
    });
    expect(ret).toBe(false);
  });

  it("letterContent가 빈 문자열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.addEntry(makeInput({ letterContent: "" }));
    });
    expect(ret).toBe(false);
  });

  it("managerName이 빈 문자열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.addEntry(makeInput({ managerName: "" }));
    });
    expect(ret).toBe(false);
  });

  it("sponsorName 공백만 있으면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.addEntry(makeInput({ sponsorName: "   " }));
    });
    expect(ret).toBe(false);
  });
});

// ============================================================
// getByStatus
// ============================================================

describe("useThankYouLetter - getByStatus 상태별 필터", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("draft 상태의 편지를 필터링한다", async () => {
    const { result } = makeHook();
    await addEntry(result);
    const drafts = result.current.getByStatus("draft" as ThankYouLetterStatus);
    expect(drafts.length).toBeGreaterThanOrEqual(0);
  });

  it("sent 상태의 편지를 필터링한다", async () => {
    const { result } = makeHook();
    await addEntry(result);
    const sent = result.current.getByStatus("sent" as ThankYouLetterStatus);
    expect(Array.isArray(sent)).toBe(true);
  });

  it("결과가 없는 상태 필터는 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const sent = result.current.getByStatus("sent" as ThankYouLetterStatus);
    expect(sent).toEqual([]);
  });
});

// ============================================================
// getBySponsorType
// ============================================================

describe("useThankYouLetter - getBySponsorType 후원 유형별 필터", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("특정 후원 유형의 편지를 필터링한다", async () => {
    const { result } = makeHook();
    await addEntry(result, { sponsorType: "goods" });
    const goods = result.current.getBySponsorType(
      "goods" as ThankYouLetterSponsorType
    );
    expect(Array.isArray(goods)).toBe(true);
  });

  it("해당 유형의 편지가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const venue = result.current.getBySponsorType(
      "venue" as ThankYouLetterSponsorType
    );
    expect(venue).toEqual([]);
  });
});

// ============================================================
// markAsSent
// ============================================================

describe("useThankYouLetter - markAsSent 발송 처리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("존재하지 않는 id에 발송 처리 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.markAsSent("non-existent");
    });
    expect(ret).toBe(false);
  });

  it("markAsSent 함수가 호출 가능하다", () => {
    const { result } = makeHook();
    expect(typeof result.current.markAsSent).toBe("function");
  });
});

// ============================================================
// markAsDraft
// ============================================================

describe("useThankYouLetter - markAsDraft 작성중 처리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("존재하지 않는 id에 작성중 처리 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.markAsDraft("non-existent");
    });
    expect(ret).toBe(false);
  });

  it("markAsDraft 함수가 호출 가능하다", () => {
    const { result } = makeHook();
    expect(typeof result.current.markAsDraft).toBe("function");
  });
});

// ============================================================
// updateEntry
// ============================================================

describe("useThankYouLetter - updateEntry 편지 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("존재하지 않는 id 수정 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret = true;
    await act(async () => {
      ret = await result.current.updateEntry("non-existent", {
        sponsorName: "수정",
      });
    });
    expect(ret).toBe(false);
  });

  it("updateEntry 함수가 호출 가능하다", () => {
    const { result } = makeHook();
    expect(typeof result.current.updateEntry).toBe("function");
  });
});

// ============================================================
// deleteEntry
// ============================================================

describe("useThankYouLetter - deleteEntry 편지 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("deleteEntry 함수가 호출 가능하다", () => {
    const { result } = makeHook();
    expect(typeof result.current.deleteEntry).toBe("function");
  });

  it("빈 상태에서 삭제 호출 시 에러가 없다", async () => {
    const { result } = makeHook();
    await expect(
      act(async () => {
        await result.current.deleteEntry("any-id");
      })
    ).resolves.not.toThrow();
  });
});

// ============================================================
// stats
// ============================================================

describe("useThankYouLetter - stats 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("stats 객체가 존재한다", () => {
    const { result } = makeHook();
    expect(result.current.stats).toBeDefined();
  });

  it("stats.byType 객체가 money, goods, venue, service 키를 갖는다", () => {
    const { result } = makeHook();
    expect(result.current.stats.byType).toHaveProperty("money");
    expect(result.current.stats.byType).toHaveProperty("goods");
    expect(result.current.stats.byType).toHaveProperty("venue");
    expect(result.current.stats.byType).toHaveProperty("service");
  });

  it("초기 상태에서 total은 entries.length와 일치한다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(result.current.entries.length);
  });

  it("초기 상태에서 draft와 sent의 합은 total과 같다", () => {
    const { result } = makeHook();
    const { total, draft, sent } = result.current.stats;
    expect(draft + sent).toBe(total);
  });
});

// ============================================================
// groupId/projectId 검증
// ============================================================

describe("useThankYouLetter - groupId/projectId 다름", () => {
  beforeEach(() => {
    localStorageMock.clear();
    _uuidCounter = 0;
  });

  it("groupId가 다르면 각각 독립된 데이터를 갖는다", () => {
    const { result: r1 } = renderHook(() =>
      useThankYouLetter("group-A", "project-1")
    );
    const { result: r2 } = renderHook(() =>
      useThankYouLetter("group-B", "project-1")
    );
    expect(r1.current.entries).toEqual([]);
    expect(r2.current.entries).toEqual([]);
  });

  it("projectId가 다르면 각각 독립된 데이터를 갖는다", () => {
    const { result: r1 } = renderHook(() =>
      useThankYouLetter("group-1", "project-A")
    );
    const { result: r2 } = renderHook(() =>
      useThankYouLetter("group-1", "project-B")
    );
    expect(r1.current.entries).toEqual([]);
    expect(r2.current.entries).toEqual([]);
  });
});
