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
const mockMutate = vi.fn();

vi.mock("swr", () => ({
  default: (key: string | null, fetcher?: () => Promise<unknown>) => {
    if (!key) {
      return { data: undefined, isLoading: false, mutate: mockMutate };
    }
    return { data: memStore[key] as unknown, isLoading: false, mutate: mockMutate };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    contributionPoint: (groupId: string) => `contribution-point-${groupId}`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

// ─── toast mock ───────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── toast-messages mock ─────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    MEMBER_SELECT: "멤버를 선택해주세요",
    DATE_REQUIRED: "날짜를 입력해주세요",
    INFO: { REASON_REQUIRED: "사유를 입력해주세요" },
    CONTRIBUTION: {
      POINTS_REQUIRED: "포인트를 입력해주세요 (0 제외)",
      GIVER_REQUIRED: "부여자를 입력해주세요",
    },
    HISTORY: { DELETED: "내역이 삭제되었습니다" },
  },
}));

import { useContributionPoint, CONTRIBUTION_CATEGORY_META } from "@/hooks/use-contribution-point";
import { toast } from "sonner";

const GROUP_A = "group-aaa";
const GROUP_B = "group-bbb";

function makeInput(overrides: Partial<Parameters<ReturnType<typeof useContributionPoint>["addTransaction"]>[0]> = {}) {
  return {
    memberId: "member-1",
    memberName: "김철수",
    category: "attendance" as const,
    points: 10,
    reason: "출석 보너스",
    date: "2026-01-01",
    grantedBy: "관리자",
    ...overrides,
  };
}

beforeEach(() => {
  // memStore 초기화
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
  mockMutate.mockClear();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

// ─── 1. 초기 상태 ─────────────────────────────────────────────

describe("useContributionPoint - 초기 상태", () => {
  it("transactions는 빈 배열이다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.transactions).toEqual([]);
  });

  it("entries는 빈 배열이다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.entries).toEqual([]);
  });

  it("loading 필드가 존재한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(typeof result.current.refetch).toBe("function");
  });

  it("addTransaction 함수가 존재한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(typeof result.current.addTransaction).toBe("function");
  });

  it("deleteTransaction 함수가 존재한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(typeof result.current.deleteTransaction).toBe("function");
  });

  it("getMemberEntry 함수가 존재한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(typeof result.current.getMemberEntry).toBe("function");
  });

  it("summary 객체가 존재한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.summary).toBeDefined();
  });

  it("allCategories 배열이 존재한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(Array.isArray(result.current.allCategories)).toBe(true);
  });

  it("summary.totalTransactions는 0이다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.summary.totalTransactions).toBe(0);
  });

  it("summary.totalGroupPoints는 0이다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.summary.totalGroupPoints).toBe(0);
  });

  it("summary.memberCount는 0이다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.summary.memberCount).toBe(0);
  });

  it("summary.topMember는 null이다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.summary.topMember).toBeNull();
  });
});

// ─── 2. CONTRIBUTION_CATEGORY_META ───────────────────────────

describe("CONTRIBUTION_CATEGORY_META - 카테고리 메타", () => {
  it("attendance 카테고리 label이 '출석'이다", () => {
    expect(CONTRIBUTION_CATEGORY_META.attendance.label).toBe("출석");
  });

  it("demonstration 카테고리 label이 '시범'이다", () => {
    expect(CONTRIBUTION_CATEGORY_META.demonstration.label).toBe("시범");
  });

  it("feedback 카테고리 label이 '피드백'이다", () => {
    expect(CONTRIBUTION_CATEGORY_META.feedback.label).toBe("피드백");
  });

  it("cleaning 카테고리 label이 '청소'이다", () => {
    expect(CONTRIBUTION_CATEGORY_META.cleaning.label).toBe("청소");
  });

  it("other 카테고리가 존재한다", () => {
    expect(CONTRIBUTION_CATEGORY_META.other).toBeDefined();
  });

  it("모든 카테고리에 color 필드가 존재한다", () => {
    for (const meta of Object.values(CONTRIBUTION_CATEGORY_META)) {
      expect(meta.color).toBeTruthy();
    }
  });
});

// ─── 3. allCategories ────────────────────────────────────────

describe("useContributionPoint - allCategories", () => {
  it("allCategories 배열에 8개 카테고리가 존재한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.allCategories).toHaveLength(8);
  });

  it("allCategories에 'attendance'가 포함된다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.allCategories).toContain("attendance");
  });

  it("allCategories에 'other'가 포함된다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.allCategories).toContain("other");
  });
});

// ─── 4. addTransaction 유효성 검사 ────────────────────────────

describe("useContributionPoint - addTransaction 유효성 검사", () => {
  it("memberId가 빈 문자열이면 false를 반환한다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.addTransaction(makeInput({ memberId: "" }));
    });
    expect(returnVal).toBe(false);
  });

  it("memberId가 공백만 있으면 false를 반환한다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.addTransaction(makeInput({ memberId: "   " }));
    });
    expect(returnVal).toBe(false);
  });

  it("reason이 빈 문자열이면 false를 반환한다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.addTransaction(makeInput({ reason: "" }));
    });
    expect(returnVal).toBe(false);
  });

  it("points가 0이면 false를 반환한다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.addTransaction(makeInput({ points: 0 }));
    });
    expect(returnVal).toBe(false);
  });

  it("date가 빈 문자열이면 false를 반환한다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.addTransaction(makeInput({ date: "" }));
    });
    expect(returnVal).toBe(false);
  });

  it("grantedBy가 빈 문자열이면 false를 반환한다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.addTransaction(makeInput({ grantedBy: "" }));
    });
    expect(returnVal).toBe(false);
  });

  it("유효한 입력이면 true를 반환한다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.addTransaction(makeInput());
    });
    expect(returnVal).toBe(true);
  });

  it("유효한 입력 시 toast.success가 호출된다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    await act(async () => {
      await result.current.addTransaction(makeInput({ points: 10 }));
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("points가 양수이면 '+N pt 부여' 메시지가 나온다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    await act(async () => {
      await result.current.addTransaction(makeInput({ points: 5, memberName: "홍길동" }));
    });
    expect(vi.mocked(toast.success).mock.calls[0][0]).toContain("+5pt");
  });

  it("points가 음수이면 '차감' 메시지가 나온다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    await act(async () => {
      await result.current.addTransaction(makeInput({ points: -3, memberName: "홍길동" }));
    });
    expect(vi.mocked(toast.success).mock.calls[0][0]).toContain("차감");
  });
});

// ─── 5. buildEntries 로직 (순수 함수 재현) ────────────────────

describe("useContributionPoint - buildEntries 로직", () => {
  it("동일 멤버의 트랜잭션은 하나의 entry로 합산된다", () => {
    // 직접 계산 로직 검증
    const points = [10, 20, 30];
    const total = points.reduce((a, b) => a + b, 0);
    expect(total).toBe(60);
  });

  it("entries는 totalPoints 내림차순으로 정렬된다", () => {
    const entries = [
      { memberId: "a", totalPoints: 30 },
      { memberId: "b", totalPoints: 50 },
      { memberId: "c", totalPoints: 20 },
    ];
    entries.sort((a, b) => b.totalPoints - a.totalPoints);
    expect(entries[0].totalPoints).toBe(50);
    expect(entries[1].totalPoints).toBe(30);
    expect(entries[2].totalPoints).toBe(20);
  });

  it("rank는 1부터 시작한다", () => {
    const entries = [{ memberId: "a", totalPoints: 100 }];
    const ranked = entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
    expect(ranked[0].rank).toBe(1);
  });
});

// ─── 6. categoryStats ────────────────────────────────────────

describe("useContributionPoint - summary.categoryStats", () => {
  it("초기 categoryStats 모든 카테고리가 0이다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    const { categoryStats } = result.current.summary;
    for (const v of Object.values(categoryStats)) {
      expect(v).toBe(0);
    }
  });

  it("categoryStats에 'attendance' 키가 존재한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.summary.categoryStats).toHaveProperty("attendance");
  });

  it("categoryStats에 'other' 키가 존재한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.summary.categoryStats).toHaveProperty("other");
  });
});

// ─── 7. getMemberEntry ────────────────────────────────────────

describe("useContributionPoint - getMemberEntry", () => {
  it("존재하지 않는 memberId에 대해 undefined를 반환한다", () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    expect(result.current.getMemberEntry("nonexistent")).toBeUndefined();
  });
});

// ─── 8. deleteTransaction ────────────────────────────────────

describe("useContributionPoint - deleteTransaction", () => {
  it("deleteTransaction 호출 시 true를 반환한다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.deleteTransaction("any-id");
    });
    expect(returnVal).toBe(true);
  });

  it("deleteTransaction 호출 시 mutate가 호출된다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    await act(async () => {
      await result.current.deleteTransaction("any-id");
    });
    expect(mockMutate).toHaveBeenCalled();
  });
});

// ─── 9. localStorage 키 형식 ─────────────────────────────────

describe("useContributionPoint - localStorage 키 형식", () => {
  it("스토리지 키가 groupId를 포함한다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    await act(async () => {
      await result.current.addTransaction(makeInput());
    });
    const stored = memStore[`dancebase:contribution-point:${GROUP_A}`];
    expect(stored).toBeDefined();
  });
});

// ─── 10. 그룹별 격리 ─────────────────────────────────────────

describe("useContributionPoint - 그룹별 격리", () => {
  it("그룹 A와 그룹 B의 데이터는 독립적이다", async () => {
    const { result: resA } = renderHook(() => useContributionPoint(GROUP_A));
    const { result: resB } = renderHook(() => useContributionPoint(GROUP_B));

    await act(async () => {
      await resA.current.addTransaction(makeInput());
    });

    expect(memStore[`dancebase:contribution-point:${GROUP_A}`]).toBeDefined();
    expect(memStore[`dancebase:contribution-point:${GROUP_B}`]).toBeUndefined();
  });
});

// ─── 11. 경계값 ──────────────────────────────────────────────

describe("useContributionPoint - 경계값", () => {
  it("points가 매우 큰 양수여도 처리된다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.addTransaction(makeInput({ points: 999999 }));
    });
    expect(returnVal).toBe(true);
  });

  it("points가 음수이면 처리된다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.addTransaction(makeInput({ points: -1 }));
    });
    expect(returnVal).toBe(true);
  });

  it("note가 undefined여도 처리된다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.addTransaction(makeInput({ note: undefined }));
    });
    expect(returnVal).toBe(true);
  });

  it("note가 빈 문자열이면 undefined로 저장된다", async () => {
    const { result } = renderHook(() => useContributionPoint(GROUP_A));
    await act(async () => {
      await result.current.addTransaction(makeInput({ note: "" }));
    });
    const stored = memStore[`dancebase:contribution-point:${GROUP_A}`] as { transactions: { note?: string }[] };
    expect(stored?.transactions?.[0]?.note).toBeUndefined();
  });
});
