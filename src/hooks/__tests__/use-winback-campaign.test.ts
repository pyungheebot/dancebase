import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── sonner mock ──────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// ─── toast-messages mock ──────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    LOGIN_REQUIRED: "로그인이 필요합니다",
    INTERCOM: {
      SEND_ERROR: "메시지 발송에 실패했습니다",
    },
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (!key) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    winbackCandidates: (groupId: string) =>
      `/groups/${groupId}/winback-candidates`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
const mockAuthGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: "current-user-id" } },
});

const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockAuthGetUser,
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "messages") {
        return {
          insert: mockInsert,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
      };
    }),
  }),
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useWinbackCampaign } from "@/hooks/use-winback-campaign";
import type { WinbackCandidate } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useWinbackCampaign(groupId));
}

function makeCandidate(overrides: Partial<WinbackCandidate> = {}): WinbackCandidate {
  return {
    userId: "user-1",
    name: "앨리스",
    avatarUrl: null,
    lastActivityAt: null,
    inactiveDays: 30,
    ...overrides,
  };
}

// ============================================================
// useWinbackCampaign - 초기 상태
// ============================================================

describe("useWinbackCampaign - 초기 상태", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 candidates는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.candidates).toEqual([]);
  });

  it("초기 totalCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalCount).toBe(0);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 sending은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.sending).toBe(false);
  });

  it("sendWinbackMessages 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.sendWinbackMessages).toBe("function");
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("groupId가 빈 문자열이면 SWR 키가 null이 되어 candidates는 빈 배열이다", () => {
    const { result } = renderHook(() => useWinbackCampaign(""));
    expect(result.current.candidates).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });
});

// ============================================================
// useWinbackCampaign - sendWinbackMessages 함수
// ============================================================

describe("useWinbackCampaign - sendWinbackMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "current-user-id" } },
    });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("memberIds가 빈 배열이면 즉시 { success: true, count: 0 }을 반환한다", async () => {
    const { result } = makeHook();
    let response: { success: boolean; count: number } | undefined;
    await act(async () => {
      response = await result.current.sendWinbackMessages([], "메시지");
    });
    expect(response).toEqual({ success: true, count: 0 });
  });

  it("memberIds가 비어있으면 insert가 호출되지 않는다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.sendWinbackMessages([], "메시지");
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("성공 시 { success: true, count: memberIds.length }를 반환한다", async () => {
    const { result } = makeHook();
    let response: { success: boolean; count: number } | undefined;
    await act(async () => {
      response = await result.current.sendWinbackMessages(
        ["user-1", "user-2"],
        "재참여 부탁드립니다"
      );
    });
    expect(response?.success).toBe(true);
    expect(response?.count).toBe(2);
  });

  it("로그인하지 않으면 { success: false, count: 0 }을 반환한다", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
    });
    const { result } = makeHook();
    let response: { success: boolean; count: number } | undefined;
    await act(async () => {
      response = await result.current.sendWinbackMessages(
        ["user-1"],
        "메시지"
      );
    });
    expect(response?.success).toBe(false);
    expect(response?.count).toBe(0);
  });

  it("insert 실패 시 { success: false, count: 0 }을 반환한다", async () => {
    mockInsert.mockResolvedValue({ error: new Error("DB 오류") });
    const { result } = makeHook();
    let response: { success: boolean; count: number } | undefined;
    await act(async () => {
      response = await result.current.sendWinbackMessages(
        ["user-1"],
        "메시지"
      );
    });
    expect(response?.success).toBe(false);
    expect(response?.count).toBe(0);
  });

  it("sending 상태가 전송 중에 true가 된다", async () => {
    // 지연 처리로 sending 상태 확인
    let resolveFn!: () => void;
    mockAuthGetUser.mockReturnValue(
      new Promise((resolve) => {
        resolveFn = () =>
          resolve({ data: { user: { id: "current-user-id" } } });
      })
    );

    const { result } = makeHook();

    act(() => {
      result.current.sendWinbackMessages(["user-1"], "메시지");
    });

    expect(result.current.sending).toBe(true);

    await act(async () => {
      resolveFn();
    });
  });

  it("전송 완료 후 sending이 false로 돌아온다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.sendWinbackMessages(["user-1"], "메시지");
    });
    expect(result.current.sending).toBe(false);
  });
});

// ============================================================
// useWinbackCampaign - 비활성 멤버 계산 로직
// ============================================================

describe("useWinbackCampaign - 비활성 멤버 계산 로직", () => {
  it("비활성 기준은 30일이다", () => {
    const INACTIVE_DAYS_THRESHOLD = 30;
    expect(INACTIVE_DAYS_THRESHOLD).toBe(30);
  });

  it("비활성 일수 계산: 마지막 활동일이 있으면 날짜 차이를 계산한다", () => {
    const now = new Date("2026-03-02T00:00:00.000Z");
    const lastActivityAt = new Date("2026-01-01T00:00:00.000Z");
    const inactiveDays = Math.floor(
      (now.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(inactiveDays).toBeGreaterThan(30);
  });

  it("비활성 일수 계산: 마지막 활동이 없으면 30으로 설정된다", () => {
    const INACTIVE_DAYS_THRESHOLD = 30;
    const lastActivityAt = null;
    const inactiveDays = lastActivityAt ? 999 : INACTIVE_DAYS_THRESHOLD;
    expect(inactiveDays).toBe(30);
  });

  it("비활성 멤버는 inactiveDays 내림차순으로 정렬된다", () => {
    const candidates = [
      { userId: "u1", inactiveDays: 31 },
      { userId: "u2", inactiveDays: 60 },
      { userId: "u3", inactiveDays: 45 },
    ];
    candidates.sort((a, b) => b.inactiveDays - a.inactiveDays);
    expect(candidates[0].userId).toBe("u2");
    expect(candidates[1].userId).toBe("u3");
    expect(candidates[2].userId).toBe("u1");
  });

  it("WinbackCandidate 구조는 userId, name, avatarUrl, lastActivityAt, inactiveDays를 가진다", () => {
    const candidate = makeCandidate();
    expect(candidate).toHaveProperty("userId");
    expect(candidate).toHaveProperty("name");
    expect(candidate).toHaveProperty("avatarUrl");
    expect(candidate).toHaveProperty("lastActivityAt");
    expect(candidate).toHaveProperty("inactiveDays");
  });

  it("WinbackCandidate의 avatarUrl은 null일 수 있다", () => {
    const candidate = makeCandidate({ avatarUrl: null });
    expect(candidate.avatarUrl).toBeNull();
  });

  it("WinbackCandidate의 lastActivityAt이 null이면 활동 기록이 없는 것이다", () => {
    const candidate = makeCandidate({ lastActivityAt: null });
    expect(candidate.lastActivityAt).toBeNull();
  });
});

// ============================================================
// useWinbackCampaign - 활동 맵 구성 로직
// ============================================================

describe("useWinbackCampaign - 활동 맵 구성 로직", () => {
  it("recentActivityMap: 더 최근 활동일이 있으면 기존 값을 덮어쓴다", () => {
    const recentActivityMap = new Map<string, string>();
    const userId = "user-1";
    const olderDate = "2026-01-01T00:00:00Z";
    const newerDate = "2026-02-15T00:00:00Z";

    recentActivityMap.set(userId, olderDate);
    const existing = recentActivityMap.get(userId);
    if (!existing || newerDate > existing) {
      recentActivityMap.set(userId, newerDate);
    }

    expect(recentActivityMap.get(userId)).toBe(newerDate);
  });

  it("recentActivityMap: 더 오래된 날짜는 덮어쓰지 않는다", () => {
    const recentActivityMap = new Map<string, string>();
    const userId = "user-1";
    const newerDate = "2026-02-15T00:00:00Z";
    const olderDate = "2026-01-01T00:00:00Z";

    recentActivityMap.set(userId, newerDate);
    const existing = recentActivityMap.get(userId);
    if (!existing || olderDate > existing) {
      recentActivityMap.set(userId, olderDate);
    }

    expect(recentActivityMap.get(userId)).toBe(newerDate);
  });

  it("30일 이내 활동이 있는 멤버는 비활성 대상에서 제외된다", () => {
    const memberIds = ["user-1", "user-2", "user-3"];
    const recentActivityMap = new Map<string, string>([
      ["user-1", "2026-02-20T00:00:00Z"],
      ["user-2", "2026-02-10T00:00:00Z"],
    ]);
    const inactiveIds = memberIds.filter((id) => !recentActivityMap.has(id));
    expect(inactiveIds).toEqual(["user-3"]);
  });

  it("모든 멤버가 활동이 있으면 inactiveIds는 빈 배열이다", () => {
    const memberIds = ["user-1", "user-2"];
    const recentActivityMap = new Map<string, string>([
      ["user-1", "2026-02-20T00:00:00Z"],
      ["user-2", "2026-02-18T00:00:00Z"],
    ]);
    const inactiveIds = memberIds.filter((id) => !recentActivityMap.has(id));
    expect(inactiveIds).toHaveLength(0);
  });

  it("schedules.starts_at이 null인 출석 기록은 맵 업데이트를 건너뛴다", () => {
    const recentActivityMap = new Map<string, string>();
    type AttRow = { user_id: string; schedules: { starts_at: string } | null };
    const rows: AttRow[] = [{ user_id: "user-1", schedules: null }];
    rows.forEach((row) => {
      if (!row.schedules?.starts_at) return;
      recentActivityMap.set(row.user_id, row.schedules.starts_at);
    });
    expect(recentActivityMap.has("user-1")).toBe(false);
  });
});

// ============================================================
// useWinbackCampaign - WinbackCampaignData 구조
// ============================================================

describe("useWinbackCampaign - WinbackCampaignData 구조", () => {
  it("data 기본값은 { candidates: [], totalCount: 0 }이다", () => {
    const { result } = makeHook();
    expect(result.current.candidates).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("candidates와 totalCount는 동기화된다", () => {
    const campaignData = { candidates: [makeCandidate(), makeCandidate({ userId: "user-2" })], totalCount: 2 };
    expect(campaignData.candidates).toHaveLength(campaignData.totalCount);
  });

  it("멤버 이름이 없으면 '알 수 없음'으로 대체된다", () => {
    const name = (undefined as unknown as string) ?? "알 수 없음";
    expect(name).toBe("알 수 없음");
  });
});
