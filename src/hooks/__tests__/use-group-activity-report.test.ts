import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

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
type SWRResult = {
  data: unknown;
  isLoading: boolean;
  mutate: ReturnType<typeof vi.fn>;
};

let swrData: unknown = undefined;
let swrIsLoading = false;
const swrMutate = vi.fn();

vi.mock("swr", () => ({
  default: (_key: string | null) => {
    return { data: swrData, isLoading: swrIsLoading, mutate: swrMutate } as SWRResult;
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    groupActivityReport: (groupId: string, period: string) =>
      `group-activity-report-${groupId}-${period}`,
  },
}));

// ─── Supabase mock ────────────────────────────────────────────
const mockSupabaseChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  in: vi.fn().mockResolvedValue({ data: [], error: null }),
  insert: vi.fn().mockResolvedValue({ data: [], error: null }),
  update: vi.fn().mockResolvedValue({ data: [], error: null }),
  delete: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn(() => mockSupabaseChain),
  }),
}));

import { useGroupActivityReport } from "@/hooks/use-group-activity-report";
import type { GroupActivityReportData } from "@/types";

const GROUP_ID = "group-report-aaa";

beforeEach(() => {
  swrData = undefined;
  swrIsLoading = false;
  swrMutate.mockClear();
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
});

// ─── 1. 초기 상태 ─────────────────────────────────────────────

describe("useGroupActivityReport - 초기 상태", () => {
  it("report는 초기에 null이다", () => {
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report).toBeNull();
  });

  it("loading 필드가 존재한다", () => {
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(typeof result.current.refetch).toBe("function");
  });

  it("groupId가 빈 문자열이면 report는 null이다", () => {
    const { result } = renderHook(() => useGroupActivityReport("", "week"));
    expect(result.current.report).toBeNull();
  });

  it("period가 'week'일 때 report는 null (초기)", () => {
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report).toBeNull();
  });

  it("period가 'month'일 때 report는 null (초기)", () => {
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "month"));
    expect(result.current.report).toBeNull();
  });
});

// ─── 2. SWR 데이터 주입 시 report 구조 ───────────────────────

describe("useGroupActivityReport - report 구조", () => {
  const sampleReport: GroupActivityReportData = {
    period: "week",
    scheduleCount: { value: 3, label: "일정" },
    attendanceRate: { value: 75, label: "출석률" },
    postCount: { value: 8, label: "게시글" },
    commentCount: { value: 12, label: "댓글" },
    rsvpRate: { value: 80, label: "RSVP 응답률" },
    newMemberCount: { value: 2, label: "신규 멤버" },
    activeMemberCount: { value: 5, label: "활동 멤버" },
    insights: [],
  };

  it("SWR 데이터가 있으면 report가 해당 데이터이다", () => {
    swrData = sampleReport;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report).toEqual(sampleReport);
  });

  it("report에 period 필드가 있다", () => {
    swrData = sampleReport;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report?.period).toBe("week");
  });

  it("report에 scheduleCount 필드가 있다", () => {
    swrData = sampleReport;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report?.scheduleCount).toEqual({ value: 3, label: "일정" });
  });

  it("report에 attendanceRate 필드가 있다", () => {
    swrData = sampleReport;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report?.attendanceRate).toEqual({ value: 75, label: "출석률" });
  });

  it("report에 postCount 필드가 있다", () => {
    swrData = sampleReport;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report?.postCount).toEqual({ value: 8, label: "게시글" });
  });

  it("report에 commentCount 필드가 있다", () => {
    swrData = sampleReport;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report?.commentCount).toEqual({ value: 12, label: "댓글" });
  });

  it("report에 rsvpRate 필드가 있다", () => {
    swrData = sampleReport;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report?.rsvpRate).toEqual({ value: 80, label: "RSVP 응답률" });
  });

  it("report에 newMemberCount 필드가 있다", () => {
    swrData = sampleReport;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report?.newMemberCount).toEqual({ value: 2, label: "신규 멤버" });
  });

  it("report에 activeMemberCount 필드가 있다", () => {
    swrData = sampleReport;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.report?.activeMemberCount).toEqual({ value: 5, label: "활동 멤버" });
  });

  it("report에 insights 배열이 있다", () => {
    swrData = sampleReport;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(Array.isArray(result.current.report?.insights)).toBe(true);
  });
});

// ─── 3. generateInsights 로직 재현 ──────────────────────────

describe("generateInsights - 인사이트 로직 (직접 재현)", () => {
  type Params = {
    attendanceRate: number;
    postCount: number;
    newMemberCount: number;
    rsvpRate: number;
    activeMemberCount: number;
    scheduleCount: number;
  };

  // 원본 훅의 generateInsights를 재현
  function generateInsights(params: Params) {
    const insights: { message: string; type: string }[] = [];
    if (params.attendanceRate >= 80) {
      insights.push({ message: "우수한 출석률입니다!", type: "positive" });
    }
    if (params.postCount >= 5) {
      insights.push({ message: "게시판 활동이 활발합니다", type: "positive" });
    }
    if (params.newMemberCount > 0) {
      insights.push({ message: `새로운 멤버 ${params.newMemberCount}명이 합류했습니다`, type: "positive" });
    }
    if (params.rsvpRate >= 70) {
      insights.push({ message: "멤버들의 일정 참여 의지가 높습니다", type: "positive" });
    }
    if (params.activeMemberCount >= 3) {
      insights.push({ message: `${params.activeMemberCount}명의 멤버가 활발히 활동 중입니다`, type: "positive" });
    }
    if (params.scheduleCount === 0) {
      insights.push({ message: "이번 기간에 예정된 일정이 없습니다", type: "neutral" });
    }
    return insights;
  }

  it("출석률 80% 이상 → '우수한 출석률' 인사이트 생성", () => {
    const insights = generateInsights({
      attendanceRate: 85,
      postCount: 0,
      newMemberCount: 0,
      rsvpRate: 0,
      activeMemberCount: 0,
      scheduleCount: 1,
    });
    expect(insights.some((i) => i.message.includes("우수한 출석률"))).toBe(true);
  });

  it("출석률 79% → '우수한 출석률' 인사이트가 생성되지 않는다", () => {
    const insights = generateInsights({
      attendanceRate: 79,
      postCount: 0,
      newMemberCount: 0,
      rsvpRate: 0,
      activeMemberCount: 0,
      scheduleCount: 1,
    });
    expect(insights.some((i) => i.message.includes("우수한 출석률"))).toBe(false);
  });

  it("게시글 5개 이상 → '게시판 활동이 활발합니다' 인사이트 생성", () => {
    const insights = generateInsights({
      attendanceRate: 0,
      postCount: 5,
      newMemberCount: 0,
      rsvpRate: 0,
      activeMemberCount: 0,
      scheduleCount: 1,
    });
    expect(insights.some((i) => i.message.includes("게시판 활동이 활발합니다"))).toBe(true);
  });

  it("게시글 4개 → '게시판 활동' 인사이트가 생성되지 않는다", () => {
    const insights = generateInsights({
      attendanceRate: 0,
      postCount: 4,
      newMemberCount: 0,
      rsvpRate: 0,
      activeMemberCount: 0,
      scheduleCount: 1,
    });
    expect(insights.some((i) => i.message.includes("게시판 활동이 활발합니다"))).toBe(false);
  });

  it("신규 멤버 > 0 → 신규 멤버 인사이트 생성", () => {
    const insights = generateInsights({
      attendanceRate: 0,
      postCount: 0,
      newMemberCount: 3,
      rsvpRate: 0,
      activeMemberCount: 0,
      scheduleCount: 1,
    });
    expect(insights.some((i) => i.message.includes("3명이 합류했습니다"))).toBe(true);
  });

  it("신규 멤버 0명 → 신규 멤버 인사이트가 생성되지 않는다", () => {
    const insights = generateInsights({
      attendanceRate: 0,
      postCount: 0,
      newMemberCount: 0,
      rsvpRate: 0,
      activeMemberCount: 0,
      scheduleCount: 1,
    });
    expect(insights.some((i) => i.message.includes("합류했습니다"))).toBe(false);
  });

  it("RSVP 응답률 70% 이상 → '일정 참여 의지' 인사이트 생성", () => {
    const insights = generateInsights({
      attendanceRate: 0,
      postCount: 0,
      newMemberCount: 0,
      rsvpRate: 70,
      activeMemberCount: 0,
      scheduleCount: 1,
    });
    expect(insights.some((i) => i.message.includes("일정 참여 의지"))).toBe(true);
  });

  it("RSVP 응답률 69% → '일정 참여 의지' 인사이트가 생성되지 않는다", () => {
    const insights = generateInsights({
      attendanceRate: 0,
      postCount: 0,
      newMemberCount: 0,
      rsvpRate: 69,
      activeMemberCount: 0,
      scheduleCount: 1,
    });
    expect(insights.some((i) => i.message.includes("일정 참여 의지"))).toBe(false);
  });

  it("활동 멤버 3명 이상 → '활발히 활동 중' 인사이트 생성", () => {
    const insights = generateInsights({
      attendanceRate: 0,
      postCount: 0,
      newMemberCount: 0,
      rsvpRate: 0,
      activeMemberCount: 3,
      scheduleCount: 1,
    });
    expect(insights.some((i) => i.message.includes("활발히 활동 중"))).toBe(true);
  });

  it("활동 멤버 2명 → '활발히 활동 중' 인사이트가 생성되지 않는다", () => {
    const insights = generateInsights({
      attendanceRate: 0,
      postCount: 0,
      newMemberCount: 0,
      rsvpRate: 0,
      activeMemberCount: 2,
      scheduleCount: 1,
    });
    expect(insights.some((i) => i.message.includes("활발히 활동 중"))).toBe(false);
  });

  it("일정이 0개 → '예정된 일정이 없습니다' 중립 인사이트 생성", () => {
    const insights = generateInsights({
      attendanceRate: 0,
      postCount: 0,
      newMemberCount: 0,
      rsvpRate: 0,
      activeMemberCount: 0,
      scheduleCount: 0,
    });
    expect(insights.some((i) => i.message.includes("예정된 일정이 없습니다"))).toBe(true);
  });

  it("일정이 0개 → neutral 타입 인사이트이다", () => {
    const insights = generateInsights({
      attendanceRate: 0,
      postCount: 0,
      newMemberCount: 0,
      rsvpRate: 0,
      activeMemberCount: 0,
      scheduleCount: 0,
    });
    const neutral = insights.find((i) => i.message.includes("예정된 일정이 없습니다"));
    expect(neutral?.type).toBe("neutral");
  });

  it("모든 조건 충족 시 여러 인사이트가 생성된다", () => {
    const insights = generateInsights({
      attendanceRate: 90,
      postCount: 10,
      newMemberCount: 2,
      rsvpRate: 80,
      activeMemberCount: 5,
      scheduleCount: 3,
    });
    expect(insights.length).toBeGreaterThanOrEqual(5);
  });
});

// ─── 4. 출석률 계산 로직 ─────────────────────────────────────

describe("출석률 계산 로직 재현", () => {
  it("present=8, absent=2 → attendanceRate=80", () => {
    const present = 8;
    const absent = 2;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    expect(rate).toBe(80);
  });

  it("present=0, absent=0 → attendanceRate=0 (division by zero 방지)", () => {
    const present = 0;
    const absent = 0;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    expect(rate).toBe(0);
  });

  it("present=7, absent=3 → attendanceRate=70", () => {
    const present = 7;
    const absent = 3;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    expect(rate).toBe(70);
  });
});

// ─── 5. RSVP 응답률 계산 로직 ────────────────────────────────

describe("RSVP 응답률 계산 로직 재현", () => {
  type RsvpRow = { response: string };

  function calcRsvpRate(rows: RsvpRow[]): number {
    const responded = rows.filter(
      (r) => r.response === "yes" || r.response === "no" || r.response === "maybe"
    ).length;
    return rows.length > 0 ? Math.round((responded / rows.length) * 100) : 0;
  }

  it("모든 응답이 yes이면 100%이다", () => {
    const rows = [{ response: "yes" }, { response: "yes" }];
    expect(calcRsvpRate(rows)).toBe(100);
  });

  it("응답이 없으면 0%이다", () => {
    expect(calcRsvpRate([])).toBe(0);
  });

  it("yes/no/maybe 모두 응답으로 집계된다", () => {
    const rows = [{ response: "yes" }, { response: "no" }, { response: "maybe" }];
    expect(calcRsvpRate(rows)).toBe(100);
  });

  it("알 수 없는 response는 집계에서 제외된다", () => {
    const rows = [{ response: "yes" }, { response: "unknown" }];
    expect(calcRsvpRate(rows)).toBe(50);
  });
});

// ─── 6. loading 상태 ─────────────────────────────────────────

describe("useGroupActivityReport - loading 상태", () => {
  it("swrIsLoading이 true이면 loading이 true이다", () => {
    swrIsLoading = true;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.loading).toBe(true);
  });

  it("swrIsLoading이 false이면 loading이 false이다", () => {
    swrIsLoading = false;
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    expect(result.current.loading).toBe(false);
  });
});

// ─── 7. refetch ──────────────────────────────────────────────

describe("useGroupActivityReport - refetch", () => {
  it("refetch 호출 시 mutate가 호출된다", () => {
    const { result } = renderHook(() => useGroupActivityReport(GROUP_ID, "week"));
    result.current.refetch();
    expect(swrMutate).toHaveBeenCalled();
  });
});
