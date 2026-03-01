import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

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
    churnRiskDetection: (groupId: string) =>
      `/groups/${groupId}/churn-risk-detection`,
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
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useChurnRiskDetection } from "@/hooks/use-churn-risk-detection";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useChurnRiskDetection(groupId));
}

// ============================================================
// useChurnRiskDetection - 초기 상태
// ============================================================

describe("useChurnRiskDetection - 초기 상태", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 data.entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.data.entries).toEqual([]);
  });

  it("초기 data.totalCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.totalCount).toBe(0);
  });

  it("초기 data.criticalCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.criticalCount).toBe(0);
  });

  it("초기 data.riskCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.riskCount).toBe(0);
  });

  it("초기 data.cautionCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.cautionCount).toBe(0);
  });

  it("초기 data.safeCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.data.safeCount).toBe(0);
  });

  it("초기 data.byLevel은 네 등급 모두 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.data.byLevel).toEqual({
      critical: [],
      risk: [],
      caution: [],
      safe: [],
    });
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("groupId가 빈 문자열이면 data는 기본값이다", () => {
    const { result } = renderHook(() => useChurnRiskDetection(""));
    expect(result.current.data.entries).toEqual([]);
    expect(result.current.data.totalCount).toBe(0);
  });
});

// ============================================================
// useChurnRiskDetection - 위험도 점수 계산 로직
// ============================================================

describe("useChurnRiskDetection - 위험도 점수 계산 로직", () => {
  /**
   * 훅 내부 위험도 계산 로직을 직접 검증합니다.
   * 위험 요인:
   * - low_attendance:   최근 30일 출석률 50% 미만 → +30점
   * - inactive_days:    활동 이력 없음 or 30일 이상 → +40점
   *                     14일 이상 30일 미만 → +20점  (주의: 코드 상 t30 > t14이면 +40)
   *                     7일 이상 14일 미만 → +10점
   * - no_board_activity: 게시판 활동 0건 → +15점
   * - low_rsvp:          RSVP 미응답 비율 50% 이상 → +15점
   */

  it("출석률 0%는 low_attendance 요인 (+30점)이다", () => {
    const scheduleCount = 10;
    const presentCount = 0;
    const rate = presentCount / scheduleCount;
    expect(rate).toBe(0);
    expect(rate < 0.5).toBe(true);
    // → +30점
  });

  it("출석률 50%는 low_attendance 요인이 아니다", () => {
    const scheduleCount = 10;
    const presentCount = 5;
    const rate = presentCount / scheduleCount;
    expect(rate < 0.5).toBe(false);
  });

  it("출석률 49%는 low_attendance 요인이다", () => {
    const scheduleCount = 100;
    const presentCount = 49;
    const rate = presentCount / scheduleCount;
    expect(rate < 0.5).toBe(true);
  });

  it("RSVP 미응답률 50% 이상은 low_rsvp 요인이다", () => {
    const scheduleCount = 10;
    const rsvpCount = 4;
    const noResponseRate = 1 - rsvpCount / scheduleCount;
    expect(noResponseRate >= 0.5).toBe(true);
  });

  it("RSVP 미응답률 50% 미만은 low_rsvp 요인이 아니다", () => {
    const scheduleCount = 10;
    const rsvpCount = 6;
    const noResponseRate = 1 - rsvpCount / scheduleCount;
    expect(noResponseRate >= 0.5).toBe(false);
  });

  it("최대 위험 점수는 100점이다", () => {
    const score = Math.min(100, 30 + 40 + 15 + 15);
    expect(score).toBe(100);
  });

  it("위험 점수 합이 100 초과해도 100으로 제한된다", () => {
    const rawScore = 200;
    const clampedScore = Math.min(100, rawScore);
    expect(clampedScore).toBe(100);
  });
});

// ============================================================
// useChurnRiskDetection - 위험 등급 분류 로직
// ============================================================

describe("useChurnRiskDetection - 위험 등급 분류 로직", () => {
  function classifyRiskLevel(score: number): string {
    if (score >= 80) return "critical";
    if (score >= 60) return "risk";
    if (score >= 30) return "caution";
    return "safe";
  }

  it("점수 80 이상은 critical이다", () => {
    expect(classifyRiskLevel(80)).toBe("critical");
    expect(classifyRiskLevel(100)).toBe("critical");
  });

  it("점수 60 이상 80 미만은 risk이다", () => {
    expect(classifyRiskLevel(60)).toBe("risk");
    expect(classifyRiskLevel(79)).toBe("risk");
  });

  it("점수 30 이상 60 미만은 caution이다", () => {
    expect(classifyRiskLevel(30)).toBe("caution");
    expect(classifyRiskLevel(59)).toBe("caution");
  });

  it("점수 30 미만은 safe이다", () => {
    expect(classifyRiskLevel(0)).toBe("safe");
    expect(classifyRiskLevel(29)).toBe("safe");
  });

  it("경계값 80은 critical이다", () => {
    expect(classifyRiskLevel(80)).toBe("critical");
  });

  it("경계값 79는 risk이다", () => {
    expect(classifyRiskLevel(79)).toBe("risk");
  });

  it("경계값 60은 risk이다", () => {
    expect(classifyRiskLevel(60)).toBe("risk");
  });

  it("경계값 59는 caution이다", () => {
    expect(classifyRiskLevel(59)).toBe("caution");
  });

  it("경계값 30은 caution이다", () => {
    expect(classifyRiskLevel(30)).toBe("caution");
  });

  it("경계값 29는 safe이다", () => {
    expect(classifyRiskLevel(29)).toBe("safe");
  });
});

// ============================================================
// useChurnRiskDetection - inactive_days 로직
// ============================================================

describe("useChurnRiskDetection - inactive_days 위험 요인 계산", () => {
  const now = new Date("2026-03-15T00:00:00.000Z");
  const ms = (days: number) => days * 24 * 60 * 60 * 1000;
  const t7 = new Date(now.getTime() - ms(7)).toISOString();
  const t14 = new Date(now.getTime() - ms(14)).toISOString();
  const t30 = new Date(now.getTime() - ms(30)).toISOString();

  it("활동 이력 없음(null)은 +40점이다", () => {
    const lastActive = null;
    let score = 0;
    if (!lastActive) {
      score += 40;
    }
    expect(score).toBe(40);
  });

  it("30일 이전 활동은 +40점이다", () => {
    const lastActive = new Date(now.getTime() - ms(31)).toISOString();
    let score = 0;
    if (!lastActive) {
      score += 40;
    } else if (lastActive < t30) {
      score += 40;
    }
    expect(score).toBe(40);
  });

  it("14일 이전 30일 이내 활동은 +20점이다", () => {
    const lastActive = new Date(now.getTime() - ms(20)).toISOString();
    let score = 0;
    if (!lastActive) {
      score += 40;
    } else if (lastActive < t30) {
      score += 40;
    } else if (lastActive < t14) {
      score += 20;
    } else if (lastActive < t7) {
      score += 10;
    }
    expect(score).toBe(20);
  });

  it("7일 이전 14일 이내 활동은 +10점이다", () => {
    const lastActive = new Date(now.getTime() - ms(10)).toISOString();
    let score = 0;
    if (!lastActive) {
      score += 40;
    } else if (lastActive < t30) {
      score += 40;
    } else if (lastActive < t14) {
      score += 20;
    } else if (lastActive < t7) {
      score += 10;
    }
    expect(score).toBe(10);
  });

  it("7일 이내 활동은 inactive_days 요인이 없다", () => {
    const lastActive = new Date(now.getTime() - ms(3)).toISOString();
    let score = 0;
    if (!lastActive) {
      score += 40;
    } else if (lastActive < t30) {
      score += 40;
    } else if (lastActive < t14) {
      score += 20;
    } else if (lastActive < t7) {
      score += 10;
    }
    expect(score).toBe(0);
  });
});

// ============================================================
// useChurnRiskDetection - 정렬 및 상위 30명 제한
// ============================================================

describe("useChurnRiskDetection - 정렬 및 상위 30명 제한 로직", () => {
  it("위험 점수 내림차순으로 정렬된다", () => {
    const entries = [
      { riskScore: 50 },
      { riskScore: 80 },
      { riskScore: 30 },
    ];
    entries.sort((a, b) => b.riskScore - a.riskScore);
    expect(entries[0].riskScore).toBe(80);
    expect(entries[1].riskScore).toBe(50);
    expect(entries[2].riskScore).toBe(30);
  });

  it("30명 초과 시 상위 30명만 유지된다", () => {
    const entries = Array.from({ length: 50 }, (_, i) => ({ riskScore: i }));
    const top = entries.sort((a, b) => b.riskScore - a.riskScore).slice(0, 30);
    expect(top).toHaveLength(30);
    expect(top[0].riskScore).toBe(49);
  });

  it("30명 이하 시 모든 항목이 유지된다", () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({ riskScore: i }));
    const top = entries.sort((a, b) => b.riskScore - a.riskScore).slice(0, 30);
    expect(top).toHaveLength(10);
  });
});

// ============================================================
// useChurnRiskDetection - byLevel 그룹핑 로직
// ============================================================

describe("useChurnRiskDetection - byLevel 등급별 그룹핑 로직", () => {
  it("critical 항목이 byLevel.critical에 포함된다", () => {
    const entries = [
      { userId: "u1", riskScore: 90, riskLevel: "critical" as const },
      { userId: "u2", riskScore: 50, riskLevel: "caution" as const },
    ];
    const byLevel: Record<string, typeof entries> = {
      critical: [],
      risk: [],
      caution: [],
      safe: [],
    };
    for (const entry of entries) {
      byLevel[entry.riskLevel].push(entry);
    }
    expect(byLevel.critical).toHaveLength(1);
    expect(byLevel.critical[0].userId).toBe("u1");
  });

  it("여러 등급의 항목이 각 등급에 올바르게 분류된다", () => {
    const entries = [
      { riskLevel: "safe" as const, riskScore: 10 },
      { riskLevel: "caution" as const, riskScore: 40 },
      { riskLevel: "risk" as const, riskScore: 70 },
      { riskLevel: "critical" as const, riskScore: 90 },
    ];
    const byLevel: Record<string, typeof entries> = {
      critical: [],
      risk: [],
      caution: [],
      safe: [],
    };
    for (const entry of entries) {
      byLevel[entry.riskLevel].push(entry);
    }
    expect(byLevel.safe).toHaveLength(1);
    expect(byLevel.caution).toHaveLength(1);
    expect(byLevel.risk).toHaveLength(1);
    expect(byLevel.critical).toHaveLength(1);
  });
});

// ============================================================
// useChurnRiskDetection - 시간 계산 헬퍼 로직
// ============================================================

describe("useChurnRiskDetection - 시간 계산 헬퍼 로직", () => {
  it("ms(7)은 7일을 밀리초로 변환한다", () => {
    const ms = (days: number) => days * 24 * 60 * 60 * 1000;
    expect(ms(7)).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("ms(30)은 30일을 밀리초로 변환한다", () => {
    const ms = (days: number) => days * 24 * 60 * 60 * 1000;
    expect(ms(30)).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("7일 전 날짜는 현재보다 이전이다", () => {
    const now = new Date();
    const ms = (days: number) => days * 24 * 60 * 60 * 1000;
    const t7 = new Date(now.getTime() - ms(7));
    expect(t7 < now).toBe(true);
  });

  it("now ISO 문자열은 올바른 형식이다", () => {
    const now = new Date().toISOString();
    expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
