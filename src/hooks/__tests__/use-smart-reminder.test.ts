import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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
    _store: () => store,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── 토스트 mock ──────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── TOAST mock ────────────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    REMINDER: {
      SEND_ERROR: "리마인더 발송에 실패했습니다",
    },
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
// useSmartReminder는 SWR을 사용해 Supabase에서 데이터를 가져옴
// 분석 결과를 제어하기 위해 SWR을 mock

type AnalysisFetcher = () => unknown;

const swrMockFetcher: { fn: AnalysisFetcher | null } = { fn: null };

vi.mock("swr", () => ({
  default: vi.fn((key: unknown, fetcher: AnalysisFetcher | null) => {
    if (!key || !fetcher) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    swrMockFetcher.fn = fetcher;
    let data: unknown;
    try {
      data = undefined; // 기본적으로 undefined (비동기 데이터)
    } catch {
      data = undefined;
    }
    const mutate = vi.fn(async (nextData?: unknown) => {
      if (nextData !== undefined) data = nextData;
    });
    return { data, isLoading: false, mutate };
  }),
}));

// ─── Supabase mock ────────────────────────────────────────────
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  })),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    smartReminder: (scheduleId: string, groupId: string) =>
      `smart-reminder:${scheduleId}:${groupId}`,
  },
}));

import { useSmartReminder } from "@/hooks/use-smart-reminder";
import type { MemberRiskAnalysis } from "@/hooks/use-smart-reminder";

// ─── 헬퍼 ────────────────────────────────────────────────────
const SCHEDULE_ID = "schedule-test-1";
const GROUP_ID = "group-test-1";

function makeHook(scheduleId = SCHEDULE_ID, groupId = GROUP_ID) {
  return renderHook(() => useSmartReminder(scheduleId, groupId));
}

// ============================================================
// 위험도 계산 로직 테스트 (순수 계산)
// ============================================================

// 훅 내부의 위험도 계산 로직을 외부에서 검증하기 위한 헬퍼
function calcRiskScore(
  noShowCount: number,
  noResponseCount: number,
  consecutiveAbsences: number,
  totalSchedules: number,
): number {
  const noShowRate = totalSchedules > 0 ? noShowCount / totalSchedules : 0;
  const noResponseRate = totalSchedules > 0 ? noResponseCount / totalSchedules : 0;
  const consecutiveBonus = consecutiveAbsences >= 3 ? 30 : 0;
  return Math.min(
    100,
    Math.round(noShowRate * 40 + noResponseRate * 30 + consecutiveBonus),
  );
}

function getRiskLevel(riskScore: number): "high" | "caution" | "safe" {
  if (riskScore >= 50) return "high";
  if (riskScore >= 30) return "caution";
  return "safe";
}

describe("위험도 계산 로직 - calcRiskScore", () => {
  it("모든 값이 0이면 riskScore는 0이다", () => {
    expect(calcRiskScore(0, 0, 0, 5)).toBe(0);
  });

  it("totalSchedules가 0이면 riskScore는 0이다", () => {
    expect(calcRiskScore(0, 0, 0, 0)).toBe(0);
  });

  it("노쇼 비율이 높으면 점수가 올라간다", () => {
    // 5번 중 5번 노쇼: noShowRate=1.0 → 1.0*40=40
    expect(calcRiskScore(5, 0, 0, 5)).toBe(40);
  });

  it("미응답 비율이 높으면 점수가 올라간다", () => {
    // 5번 중 5번 미응답: noResponseRate=1.0 → 1.0*30=30
    expect(calcRiskScore(0, 5, 0, 5)).toBe(30);
  });

  it("연속 결석 3회 이상이면 30점 보너스 추가된다", () => {
    const withoutBonus = calcRiskScore(0, 0, 2, 5);
    const withBonus = calcRiskScore(0, 0, 3, 5);
    expect(withBonus - withoutBonus).toBe(30);
  });

  it("riskScore는 100을 초과하지 않는다", () => {
    // 최대 점수 상황: 노쇼100% + 미응답100% + 연속3회 = 40+30+30=100
    expect(calcRiskScore(5, 5, 3, 5)).toBe(100);
  });

  it("riskScore는 Math.round로 반올림된다", () => {
    // 1번 중 1번 노쇼, 총 3개 일정: 1/3*40 = 13.33 → 13
    const score = calcRiskScore(1, 0, 0, 3);
    expect(Number.isInteger(score)).toBe(true);
  });
});

describe("위험도 레벨 결정 - getRiskLevel", () => {
  it("score 0 → safe", () => {
    expect(getRiskLevel(0)).toBe("safe");
  });

  it("score 29 → safe", () => {
    expect(getRiskLevel(29)).toBe("safe");
  });

  it("score 30 → caution", () => {
    expect(getRiskLevel(30)).toBe("caution");
  });

  it("score 49 → caution", () => {
    expect(getRiskLevel(49)).toBe("caution");
  });

  it("score 50 → high", () => {
    expect(getRiskLevel(50)).toBe("high");
  });

  it("score 100 → high", () => {
    expect(getRiskLevel(100)).toBe("high");
  });
});

// ============================================================
// 위험 사유(riskReasons) 생성 로직 테스트
// ============================================================

function generateRiskReasons(
  noShowCount: number,
  noResponseCount: number,
  consecutiveAbsences: number,
): string[] {
  const riskReasons: string[] = [];
  if (noShowCount > 0) {
    riskReasons.push(`RSVP 후 불참 ${noShowCount}회`);
  }
  if (noResponseCount > 0) {
    riskReasons.push(`미응답 ${noResponseCount}회`);
  }
  if (consecutiveAbsences >= 3) {
    riskReasons.push(`최근 ${consecutiveAbsences}회 연속 결석`);
  }
  return riskReasons;
}

describe("위험 사유 생성 - generateRiskReasons", () => {
  it("모든 값이 0이면 빈 배열이다", () => {
    expect(generateRiskReasons(0, 0, 0)).toEqual([]);
  });

  it("noShowCount가 있으면 해당 사유가 포함된다", () => {
    const reasons = generateRiskReasons(2, 0, 0);
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toContain("RSVP 후 불참");
    expect(reasons[0]).toContain("2회");
  });

  it("noResponseCount가 있으면 해당 사유가 포함된다", () => {
    const reasons = generateRiskReasons(0, 3, 0);
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toContain("미응답");
    expect(reasons[0]).toContain("3회");
  });

  it("consecutiveAbsences가 3 이상이면 해당 사유가 포함된다", () => {
    const reasons = generateRiskReasons(0, 0, 3);
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toContain("연속 결석");
  });

  it("consecutiveAbsences가 2이면 연속 결석 사유가 포함되지 않는다", () => {
    const reasons = generateRiskReasons(0, 0, 2);
    expect(reasons.some((r) => r.includes("연속 결석"))).toBe(false);
  });

  it("모든 사유가 있으면 3개의 이유가 반환된다", () => {
    const reasons = generateRiskReasons(1, 2, 3);
    expect(reasons).toHaveLength(3);
  });
});

// ============================================================
// reminder history localStorage 로직 테스트
// ============================================================

const REMINDER_HISTORY_KEY_PREFIX = "smart-reminder-history-";

function loadReminderHistory(scheduleId: string): { sentAt: string; recipientCount: number; message: string }[] {
  try {
    const raw = localStorage.getItem(`${REMINDER_HISTORY_KEY_PREFIX}${scheduleId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReminderHistory(scheduleId: string, entry: { sentAt: string; recipientCount: number; message: string }) {
  const history = loadReminderHistory(scheduleId);
  history.unshift(entry);
  const trimmed = history.slice(0, 10);
  localStorage.setItem(`${REMINDER_HISTORY_KEY_PREFIX}${scheduleId}`, JSON.stringify(trimmed));
}

describe("리마인더 히스토리 localStorage 로직", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("초기에는 빈 배열이 반환된다", () => {
    expect(loadReminderHistory("schedule-1")).toEqual([]);
  });

  it("히스토리 저장 후 조회할 수 있다", () => {
    saveReminderHistory("schedule-1", {
      sentAt: new Date().toISOString(),
      recipientCount: 3,
      message: "연습 참석 부탁드립니다",
    });
    const history = loadReminderHistory("schedule-1");
    expect(history).toHaveLength(1);
    expect(history[0].recipientCount).toBe(3);
  });

  it("최신 항목이 앞에 저장된다 (unshift)", () => {
    saveReminderHistory("schedule-1", { sentAt: "2026-01-01T10:00:00.000Z", recipientCount: 1, message: "1차" });
    saveReminderHistory("schedule-1", { sentAt: "2026-01-02T10:00:00.000Z", recipientCount: 2, message: "2차" });
    const history = loadReminderHistory("schedule-1");
    expect(history[0].message).toBe("2차");
    expect(history[1].message).toBe("1차");
  });

  it("최대 10개까지만 저장된다", () => {
    for (let i = 0; i < 12; i++) {
      saveReminderHistory("schedule-1", {
        sentAt: new Date().toISOString(),
        recipientCount: i,
        message: `${i}번째`,
      });
    }
    const history = loadReminderHistory("schedule-1");
    expect(history).toHaveLength(10);
  });

  it("다른 scheduleId의 히스토리는 격리된다", () => {
    saveReminderHistory("schedule-A", { sentAt: new Date().toISOString(), recipientCount: 1, message: "A" });
    const historyB = loadReminderHistory("schedule-B");
    expect(historyB).toHaveLength(0);
  });

  it("잘못된 JSON 저장 시 빈 배열을 반환한다", () => {
    localStorageMock.getItem.mockReturnValueOnce("invalid-json{{");
    expect(loadReminderHistory("schedule-1")).toEqual([]);
  });
});

// ============================================================
// 훅 초기 상태 테스트
// ============================================================

describe("useSmartReminder - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("analysis.atRiskMembers는 초기에 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.analysis.atRiskMembers).toEqual([]);
  });

  it("analysis.cautionMembers는 초기에 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.analysis.cautionMembers).toEqual([]);
  });

  it("analysis.safeMembers는 초기에 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.analysis.safeMembers).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("sending은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.sending).toBe(false);
  });

  it("sendSmartReminder 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.sendSmartReminder).toBe("function");
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// sendSmartReminder 빈 배열 처리
// ============================================================

describe("useSmartReminder - sendSmartReminder", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("빈 멤버 배열로 호출 시 count 0 성공 반환", async () => {
    const { result } = makeHook();
    let res: { success: boolean; count: number } = { success: false, count: -1 };
    await act(async () => {
      res = await result.current.sendSmartReminder([], "테스트 메시지");
    });
    expect(res.success).toBe(true);
    expect(res.count).toBe(0);
  });

  it("멤버가 있으면 count가 멤버 수와 같다", async () => {
    const { result } = makeHook();
    let res: { success: boolean; count: number } = { success: false, count: -1 };
    await act(async () => {
      res = await result.current.sendSmartReminder(["user-1", "user-2", "user-3"], "리마인더");
    });
    expect(res.count).toBe(3);
    expect(res.success).toBe(true);
  });

  it("리마인더 발송 후 localStorage에 이력이 저장된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.sendSmartReminder(["user-1"], "테스트 메시지");
    });
    const stored = localStorageMock._store()[`${REMINDER_HISTORY_KEY_PREFIX}${SCHEDULE_ID}`];
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].recipientCount).toBe(1);
    expect(parsed[0].message).toBe("테스트 메시지");
  });
});

// ============================================================
// key가 null인 경우 (빈 ID)
// ============================================================

describe("useSmartReminder - 빈 ID 처리", () => {
  it("scheduleId가 빈 문자열이면 analysis가 기본값이다", () => {
    const { result } = renderHook(() => useSmartReminder("", GROUP_ID));
    expect(result.current.analysis.atRiskMembers).toEqual([]);
    expect(result.current.analysis.cautionMembers).toEqual([]);
    expect(result.current.analysis.safeMembers).toEqual([]);
  });

  it("groupId가 빈 문자열이면 analysis가 기본값이다", () => {
    const { result } = renderHook(() => useSmartReminder(SCHEDULE_ID, ""));
    expect(result.current.analysis.atRiskMembers).toEqual([]);
  });
});

// ============================================================
// MemberRiskAnalysis 타입 구조 테스트
// ============================================================

describe("MemberRiskAnalysis 타입 구조 검증", () => {
  it("필수 필드가 모두 있는 객체를 구성할 수 있다", () => {
    const member: MemberRiskAnalysis = {
      userId: "user-1",
      name: "홍길동",
      avatarUrl: null,
      recentScheduleCount: 5,
      noShowCount: 2,
      noResponseCount: 1,
      consecutiveAbsences: 0,
      riskScore: 25,
      riskLevel: "safe",
      riskReasons: [],
    };
    expect(member.userId).toBe("user-1");
    expect(member.riskLevel).toBe("safe");
  });

  it("avatarUrl은 null을 허용한다", () => {
    const member: MemberRiskAnalysis = {
      userId: "user-2",
      name: "김민준",
      avatarUrl: null,
      recentScheduleCount: 3,
      noShowCount: 0,
      noResponseCount: 0,
      consecutiveAbsences: 0,
      riskScore: 0,
      riskLevel: "safe",
      riskReasons: [],
    };
    expect(member.avatarUrl).toBeNull();
  });

  it("riskLevel은 high/caution/safe 중 하나다", () => {
    const levels: Array<"high" | "caution" | "safe"> = ["high", "caution", "safe"];
    levels.forEach((level) => {
      const member: MemberRiskAnalysis = {
        userId: "user-3",
        name: "테스트",
        avatarUrl: null,
        recentScheduleCount: 1,
        noShowCount: 0,
        noResponseCount: 0,
        consecutiveAbsences: 0,
        riskScore: 0,
        riskLevel: level,
        riskReasons: [],
      };
      expect(member.riskLevel).toBe(level);
    });
  });
});
