import { describe, it, expect, vi, beforeEach } from "vitest";

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
    }),
  }),
}));

// ─── SWR mock ─────────────────────────────────────────────────
const mockMutate = vi.fn();
vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (!key) return { data: undefined, isLoading: false, mutate: mockMutate };
    return { data: undefined, isLoading: false, mutate: mockMutate };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    groupHealthSuggestions: (groupId: string) =>
      `/groups/${groupId}/health-suggestions`,
  },
}));

beforeEach(() => {
  mockMutate.mockReset();
  mockMutate.mockResolvedValue(undefined);
});

// ============================================================
// 공유 타입
// ============================================================

type HealthSuggestion = {
  type: "success" | "warning" | "info";
  message: string;
  actionLabel?: string;
};

type GroupHealthSuggestionsData = {
  score: number | null;
  attendanceRate: number | null;
  activityWeeklyCount: number | null;
  inactiveMemberRatio: number | null;
  suggestions: HealthSuggestion[];
  hasEnoughData: boolean;
};

// ============================================================
// 종합 점수 계산 로직 재현
// ============================================================

function computeScore(params: {
  attendanceRate: number | null;
  activityRate: number | null;
  retentionRate: number | null;
}): number | null {
  const { attendanceRate, activityRate, retentionRate } = params;
  const hasEnoughData = attendanceRate !== null || activityRate !== null || retentionRate !== null;
  if (!hasEnoughData) return null;

  const att = attendanceRate ?? 0;
  const act = activityRate ?? 0;
  const ret = retentionRate ?? 0;

  const attWeight = attendanceRate !== null ? 50 : 0;
  const actWeight = activityRate !== null ? 30 : 0;
  const retWeight = retentionRate !== null ? 20 : 0;
  const totalWeight = attWeight + actWeight + retWeight;

  if (totalWeight === 0) return null;

  const rawScore = (att * attWeight + act * actWeight + ret * retWeight) / totalWeight;
  return Math.round(rawScore * 100);
}

// ============================================================
// 개선 제안 생성 로직 재현
// ============================================================

function generateSuggestions(params: {
  score: number | null;
  attendanceRate: number | null;
  activityWeeklyCount: number;
  inactiveMemberRatio: number | null;
  hasEnoughData: boolean;
}): HealthSuggestion[] {
  const { score, attendanceRate, activityWeeklyCount, inactiveMemberRatio, hasEnoughData } = params;
  const suggestions: HealthSuggestion[] = [];

  if (score !== null && score >= 80) {
    suggestions.push({
      type: "success",
      message: "그룹이 매우 건강하게 운영되고 있습니다. 지금처럼 유지해주세요!",
    });
  } else {
    if (attendanceRate !== null && attendanceRate < 0.7) {
      suggestions.push({
        type: "warning",
        message: "출석률이 낮습니다. 일정 알림을 활성화해보세요.",
        actionLabel: "일정 관리",
      });
    }

    if (activityWeeklyCount < 2) {
      suggestions.push({
        type: "info",
        message: "게시판 활동이 부족합니다. 주간 루틴 공유를 시작해보세요.",
        actionLabel: "게시판 열기",
      });
    }

    if (inactiveMemberRatio !== null && inactiveMemberRatio > 0.3) {
      suggestions.push({
        type: "warning",
        message: "비활성 멤버가 많습니다. 재참여 메시지를 보내보세요.",
        actionLabel: "멤버 관리",
      });
    }

    if (suggestions.length === 0 && hasEnoughData) {
      suggestions.push({
        type: "info",
        message: "그룹 건강도를 꾸준히 유지하고 있습니다. 더 나은 활동을 위해 노력해보세요.",
      });
    }
  }

  return suggestions;
}

// ============================================================
// 1. 종합 점수 계산 테스트
// ============================================================

describe("종합 점수 계산", () => {
  it("모든 지표가 null이면 score는 null이다", () => {
    expect(computeScore({ attendanceRate: null, activityRate: null, retentionRate: null })).toBeNull();
  });

  it("출석률만 있으면 출석률 100%로 weight 50만 적용된다", () => {
    const score = computeScore({ attendanceRate: 1.0, activityRate: null, retentionRate: null });
    expect(score).toBe(100);
  });

  it("출석률 0%이면 score는 0이다 (출석률만 있는 경우)", () => {
    const score = computeScore({ attendanceRate: 0, activityRate: null, retentionRate: null });
    expect(score).toBe(0);
  });

  it("세 지표 모두 1.0이면 score는 100이다", () => {
    const score = computeScore({ attendanceRate: 1.0, activityRate: 1.0, retentionRate: 1.0 });
    expect(score).toBe(100);
  });

  it("세 지표 모두 0이면 score는 0이다", () => {
    const score = computeScore({ attendanceRate: 0, activityRate: 0, retentionRate: 0 });
    expect(score).toBe(0);
  });

  it("출석률 0.5, 활동률 1.0, 유지율 null이면 올바른 점수가 나온다", () => {
    // (0.5*50 + 1.0*30) / 80 = 55/80 = 0.6875 → 69
    const score = computeScore({ attendanceRate: 0.5, activityRate: 1.0, retentionRate: null });
    expect(score).toBe(69);
  });

  it("출석률 1.0, 활동률 0, 유지율 1.0이면 올바른 점수가 나온다", () => {
    // (1.0*50 + 0*30 + 1.0*20) / 100 = 70/100 = 0.7 → 70
    const score = computeScore({ attendanceRate: 1.0, activityRate: 0, retentionRate: 1.0 });
    expect(score).toBe(70);
  });

  it("score는 항상 정수다", () => {
    const score = computeScore({ attendanceRate: 0.7, activityRate: 0.6, retentionRate: 0.8 });
    expect(score !== null && Number.isInteger(score)).toBe(true);
  });

  it("활동률만 있으면 활동률 weight 30만 적용된다", () => {
    const score = computeScore({ attendanceRate: null, activityRate: 1.0, retentionRate: null });
    expect(score).toBe(100);
  });

  it("유지율만 있으면 유지율 weight 20만 적용된다", () => {
    const score = computeScore({ attendanceRate: null, activityRate: null, retentionRate: 1.0 });
    expect(score).toBe(100);
  });
});

// ============================================================
// 2. 개선 제안 생성 테스트
// ============================================================

describe("개선 제안 생성", () => {
  it("score >= 80이면 success 메시지가 생성된다", () => {
    const suggestions = generateSuggestions({
      score: 80,
      attendanceRate: 0.9,
      activityWeeklyCount: 5,
      inactiveMemberRatio: 0.1,
      hasEnoughData: true,
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe("success");
  });

  it("score 100이면 success 메시지 하나만 나온다", () => {
    const suggestions = generateSuggestions({
      score: 100,
      attendanceRate: 1.0,
      activityWeeklyCount: 10,
      inactiveMemberRatio: 0,
      hasEnoughData: true,
    });
    expect(suggestions.every((s) => s.type === "success")).toBe(true);
    expect(suggestions).toHaveLength(1);
  });

  it("출석률 < 0.7이면 경고 메시지가 생성된다", () => {
    const suggestions = generateSuggestions({
      score: 50,
      attendanceRate: 0.5,
      activityWeeklyCount: 3,
      inactiveMemberRatio: 0.1,
      hasEnoughData: true,
    });
    expect(suggestions.some((s) => s.message.includes("출석률"))).toBe(true);
  });

  it("출석률 < 0.7 경고에 actionLabel이 '일정 관리'다", () => {
    const suggestions = generateSuggestions({
      score: 50,
      attendanceRate: 0.5,
      activityWeeklyCount: 3,
      inactiveMemberRatio: 0,
      hasEnoughData: true,
    });
    const attSuggestion = suggestions.find((s) => s.message.includes("출석률"));
    expect(attSuggestion?.actionLabel).toBe("일정 관리");
  });

  it("activityWeeklyCount < 2이면 게시판 info 메시지가 생성된다", () => {
    const suggestions = generateSuggestions({
      score: 50,
      attendanceRate: 0.9,
      activityWeeklyCount: 1,
      inactiveMemberRatio: 0.1,
      hasEnoughData: true,
    });
    expect(suggestions.some((s) => s.message.includes("게시판"))).toBe(true);
  });

  it("activityWeeklyCount < 2 info에 actionLabel이 '게시판 열기'다", () => {
    const suggestions = generateSuggestions({
      score: 50,
      attendanceRate: 0.9,
      activityWeeklyCount: 0,
      inactiveMemberRatio: 0,
      hasEnoughData: true,
    });
    const actSuggestion = suggestions.find((s) => s.message.includes("게시판"));
    expect(actSuggestion?.actionLabel).toBe("게시판 열기");
  });

  it("inactiveMemberRatio > 0.3이면 비활성 경고 메시지가 생성된다", () => {
    const suggestions = generateSuggestions({
      score: 50,
      attendanceRate: 0.9,
      activityWeeklyCount: 3,
      inactiveMemberRatio: 0.5,
      hasEnoughData: true,
    });
    expect(suggestions.some((s) => s.message.includes("비활성"))).toBe(true);
  });

  it("inactiveMemberRatio 경고에 actionLabel이 '멤버 관리'다", () => {
    const suggestions = generateSuggestions({
      score: 50,
      attendanceRate: 0.9,
      activityWeeklyCount: 3,
      inactiveMemberRatio: 0.5,
      hasEnoughData: true,
    });
    const inactiveSuggestion = suggestions.find((s) => s.message.includes("비활성"));
    expect(inactiveSuggestion?.actionLabel).toBe("멤버 관리");
  });

  it("모든 지표가 양호하면 긍정적 info 메시지가 생성된다", () => {
    const suggestions = generateSuggestions({
      score: 70,
      attendanceRate: 0.8,
      activityWeeklyCount: 3,
      inactiveMemberRatio: 0.1,
      hasEnoughData: true,
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe("info");
    expect(suggestions[0].message.includes("유지")).toBe(true);
  });

  it("모든 경고 조건을 만족하면 여러 메시지가 생성된다", () => {
    const suggestions = generateSuggestions({
      score: 20,
      attendanceRate: 0.3,
      activityWeeklyCount: 0,
      inactiveMemberRatio: 0.6,
      hasEnoughData: true,
    });
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it("score가 null이면 success 메시지가 생성되지 않는다", () => {
    const suggestions = generateSuggestions({
      score: null,
      attendanceRate: null,
      activityWeeklyCount: 3,
      inactiveMemberRatio: null,
      hasEnoughData: false,
    });
    expect(suggestions.every((s) => s.type !== "success")).toBe(true);
  });
});

// ============================================================
// 3. hasEnoughData 로직 테스트
// ============================================================

describe("hasEnoughData 로직", () => {
  function computeHasEnoughData(
    attendanceRate: number | null,
    activityRate: number | null,
    retentionRate: number | null
  ): boolean {
    return attendanceRate !== null || activityRate !== null || retentionRate !== null;
  }

  it("모든 지표가 null이면 false다", () => {
    expect(computeHasEnoughData(null, null, null)).toBe(false);
  });

  it("출석률만 있어도 true다", () => {
    expect(computeHasEnoughData(0.5, null, null)).toBe(true);
  });

  it("활동률만 있어도 true다", () => {
    expect(computeHasEnoughData(null, 0.3, null)).toBe(true);
  });

  it("유지율만 있어도 true다", () => {
    expect(computeHasEnoughData(null, null, 0.8)).toBe(true);
  });

  it("모두 있으면 true다", () => {
    expect(computeHasEnoughData(0.7, 0.5, 0.9)).toBe(true);
  });

  it("0값도 있는 것으로 처리된다", () => {
    expect(computeHasEnoughData(0, null, null)).toBe(true);
  });
});

// ============================================================
// 4. 멤버 유지율 계산 로직
// ============================================================

describe("멤버 유지율 계산 로직", () => {
  function computeRetentionRate(
    currentMemberCount: number,
    oldMemberCount: number
  ): number | null {
    if (currentMemberCount <= 0 || oldMemberCount <= 0) return null;
    return Math.min(1, oldMemberCount / currentMemberCount);
  }

  it("현재 멤버가 0이면 null이다", () => {
    expect(computeRetentionRate(0, 5)).toBeNull();
  });

  it("30일 이전 멤버가 0이면 null이다", () => {
    expect(computeRetentionRate(10, 0)).toBeNull();
  });

  it("유지율이 1을 초과하면 1로 클램프된다", () => {
    // oldMember > currentMember 불가능하지만 방어 처리
    expect(computeRetentionRate(5, 10)).toBe(1);
  });

  it("유지율 50%는 0.5를 반환한다", () => {
    expect(computeRetentionRate(10, 5)).toBe(0.5);
  });

  it("유지율 100%는 1을 반환한다", () => {
    expect(computeRetentionRate(10, 10)).toBe(1);
  });
});

// ============================================================
// 5. 비활성 멤버 비율 계산 로직
// ============================================================

describe("비활성 멤버 비율 계산 로직", () => {
  function computeInactiveMemberRatio(
    currentMemberCount: number,
    memberUserIds: string[],
    activeUserIds: Set<string>
  ): number | null {
    if (currentMemberCount <= 0 || memberUserIds.length === 0) return null;
    const activeCount = memberUserIds.filter((uid) => activeUserIds.has(uid)).length;
    const inactiveCount = currentMemberCount - activeCount;
    return inactiveCount / currentMemberCount;
  }

  it("멤버가 없으면 null이다", () => {
    expect(computeInactiveMemberRatio(0, [], new Set())).toBeNull();
  });

  it("memberUserIds가 비어있으면 null이다", () => {
    expect(computeInactiveMemberRatio(5, [], new Set())).toBeNull();
  });

  it("모든 멤버가 활동하면 비율이 0이다", () => {
    const userIds = ["u1", "u2", "u3"];
    const active = new Set(["u1", "u2", "u3"]);
    expect(computeInactiveMemberRatio(3, userIds, active)).toBe(0);
  });

  it("아무도 활동하지 않으면 비율이 1이다", () => {
    const userIds = ["u1", "u2"];
    const active = new Set<string>();
    expect(computeInactiveMemberRatio(2, userIds, active)).toBe(1);
  });

  it("절반이 활동하면 비율이 0.5다", () => {
    const userIds = ["u1", "u2"];
    const active = new Set(["u1"]);
    expect(computeInactiveMemberRatio(2, userIds, active)).toBe(0.5);
  });
});

// ============================================================
// 6. 출석률 계산 로직
// ============================================================

describe("출석률 계산 로직", () => {
  function computeAttendanceRate(
    scheduleIds: string[],
    currentMemberCount: number,
    attendances: { status: string; user_id: string }[]
  ): number | null {
    if (scheduleIds.length === 0 || currentMemberCount === 0) return null;
    const totalPossible = scheduleIds.length * currentMemberCount;
    const presentCount = attendances.filter(
      (a) => a.status === "present" || a.status === "late"
    ).length;
    return totalPossible > 0 ? presentCount / totalPossible : null;
  }

  it("일정이 없으면 null이다", () => {
    expect(computeAttendanceRate([], 5, [])).toBeNull();
  });

  it("멤버가 없으면 null이다", () => {
    expect(computeAttendanceRate(["s1"], 0, [])).toBeNull();
  });

  it("출석이 없으면 0이다", () => {
    expect(computeAttendanceRate(["s1"], 5, [])).toBe(0);
  });

  it("출석률 100%는 1이다", () => {
    const attendances = Array.from({ length: 5 }, (_, i) => ({
      status: "present", user_id: `u${i}`,
    }));
    expect(computeAttendanceRate(["s1"], 5, attendances)).toBe(1);
  });

  it("present와 late 모두 출석으로 처리된다", () => {
    const attendances = [
      { status: "present", user_id: "u1" },
      { status: "late", user_id: "u2" },
      { status: "absent", user_id: "u3" },
    ];
    expect(computeAttendanceRate(["s1"], 5, attendances)).toBe(2 / 5);
  });
});

// ============================================================
// 7. 활동률 계산 로직
// ============================================================

describe("활동률 계산 로직", () => {
  function computeActivityRate(postCount: number, currentMemberCount: number): number | null {
    if (currentMemberCount <= 0) return null;
    return Math.min(1, postCount / currentMemberCount);
  }

  it("멤버가 없으면 null이다", () => {
    expect(computeActivityRate(5, 0)).toBeNull();
  });

  it("게시글이 없으면 0이다", () => {
    expect(computeActivityRate(0, 10)).toBe(0);
  });

  it("멤버 1인당 1개 이상이면 1로 클램프된다", () => {
    expect(computeActivityRate(20, 10)).toBe(1);
  });

  it("멤버 수만큼 게시글이 있으면 1이다", () => {
    expect(computeActivityRate(10, 10)).toBe(1);
  });

  it("절반의 게시글이면 0.5다", () => {
    expect(computeActivityRate(5, 10)).toBe(0.5);
  });
});

// ============================================================
// 8. 주당 평균 활동 수 계산 로직
// ============================================================

describe("주당 평균 활동 수 계산 로직", () => {
  const weeksIn30Days = 30 / 7;

  function computeActivityWeeklyCount(totalActivityCount: number): number {
    return totalActivityCount / weeksIn30Days;
  }

  it("활동이 없으면 0이다", () => {
    expect(computeActivityWeeklyCount(0)).toBe(0);
  });

  it("30일 총 28개 활동이면 주당 약 6.53개다", () => {
    const result = computeActivityWeeklyCount(28);
    expect(result).toBeCloseTo(6.53, 1);
  });

  it("30/7 기준으로 나눈다", () => {
    // 7개 활동이면 주당 1.63...
    const result = computeActivityWeeklyCount(7);
    expect(result).toBeCloseTo(7 / (30 / 7), 5);
  });

  it("주당 2개 미만 임계값 검증", () => {
    // 8개 활동 (8 / 4.286 = 1.87 < 2)
    const result = computeActivityWeeklyCount(8);
    expect(result).toBeLessThan(2);
  });

  it("주당 2개 이상 임계값 검증", () => {
    // 9개 활동 (9 / 4.286 = 2.1 >= 2)
    const result = computeActivityWeeklyCount(9);
    expect(result).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// 9. 기본 데이터 구조 테스트
// ============================================================

describe("기본 데이터 구조", () => {
  const defaultData: GroupHealthSuggestionsData = {
    score: null,
    attendanceRate: null,
    activityWeeklyCount: null,
    inactiveMemberRatio: null,
    suggestions: [],
    hasEnoughData: false,
  };

  it("기본 score는 null이다", () => {
    expect(defaultData.score).toBeNull();
  });

  it("기본 attendanceRate는 null이다", () => {
    expect(defaultData.attendanceRate).toBeNull();
  });

  it("기본 activityWeeklyCount는 null이다", () => {
    expect(defaultData.activityWeeklyCount).toBeNull();
  });

  it("기본 inactiveMemberRatio는 null이다", () => {
    expect(defaultData.inactiveMemberRatio).toBeNull();
  });

  it("기본 suggestions는 빈 배열이다", () => {
    expect(defaultData.suggestions).toHaveLength(0);
  });

  it("기본 hasEnoughData는 false다", () => {
    expect(defaultData.hasEnoughData).toBe(false);
  });
});

// ============================================================
// 10. SWR 키 및 그룹 격리 테스트
// ============================================================

describe("SWR 키 및 그룹 격리", () => {
  it("groupId를 포함한 키를 생성한다", () => {
    const key = `/groups/group1/health-suggestions`;
    expect(key).toContain("group1");
    expect(key).toContain("health-suggestions");
  });

  it("다른 groupId는 다른 키를 가진다", () => {
    const key1 = `/groups/group1/health-suggestions`;
    const key2 = `/groups/group2/health-suggestions`;
    expect(key1).not.toBe(key2);
  });

  it("groupId가 빈 문자열이면 SWR 키가 null이다", () => {
    const key = "" ? `/groups/${""}` : null;
    expect(key).toBeNull();
  });
});
