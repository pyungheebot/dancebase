import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  calcMaxStreak,
  type RawAttendanceRow,
} from "@/hooks/use-attendance-achievements";

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

// ─── SWR mock (null key → 데이터 없음, 유효 key → fetcher 동기 실행) ──
vi.mock("swr", () => {
  const { useState: useStateR, useCallback: useCallbackR } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }
      let result: unknown = undefined;
      const r = fetcher();
      if (r instanceof Promise) {
        // 비동기 fetcher → isLoading true로 처리
        return { data: undefined, isLoading: true, mutate: vi.fn() };
      } else {
        result = r;
      }
      const [data] = useStateR(() => result);
      const mutate = useCallbackR(() => Promise.resolve(), []);
      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    attendanceAchievements: (groupId: string, userId: string) =>
      `attendance-achievements-${groupId}-${userId}`,
  },
}));

// ─── 훅 import (mock 이후에 import) ──────────────────────────
import { useAttendanceAchievements } from "@/hooks/use-attendance-achievements";

// ─── 헬퍼 ───────────────────────────────────────────────────
function makeRow(
  status: string,
  checkedAt: string
): RawAttendanceRow {
  return { schedule_id: "sched-1", status, checked_at: checkedAt };
}

// ============================================================
// calcMaxStreak - 순수 함수 테스트
// ============================================================

describe("calcMaxStreak - 빈 배열", () => {
  it("빈 배열을 넘기면 0을 반환한다", () => {
    expect(calcMaxStreak([])).toBe(0);
  });
});

describe("calcMaxStreak - present/late 처리", () => {
  it("전체 present이면 전체 길이를 반환한다", () => {
    const rows: RawAttendanceRow[] = [
      makeRow("present", "2026-01-01T09:00:00Z"),
      makeRow("present", "2026-01-02T09:00:00Z"),
      makeRow("present", "2026-01-03T09:00:00Z"),
    ];
    expect(calcMaxStreak(rows)).toBe(3);
  });

  it("전체 late이면 전체 길이를 반환한다", () => {
    const rows: RawAttendanceRow[] = [
      makeRow("late", "2026-01-01T09:00:00Z"),
      makeRow("late", "2026-01-02T09:00:00Z"),
    ];
    expect(calcMaxStreak(rows)).toBe(2);
  });

  it("present와 late가 섞여도 연속으로 카운트된다", () => {
    const rows: RawAttendanceRow[] = [
      makeRow("present", "2026-01-01T09:00:00Z"),
      makeRow("late", "2026-01-02T09:00:00Z"),
      makeRow("present", "2026-01-03T09:00:00Z"),
    ];
    expect(calcMaxStreak(rows)).toBe(3);
  });

  it("단 하나의 present이면 1을 반환한다", () => {
    const rows: RawAttendanceRow[] = [
      makeRow("present", "2026-01-01T09:00:00Z"),
    ];
    expect(calcMaxStreak(rows)).toBe(1);
  });

  it("단 하나의 late이면 1을 반환한다", () => {
    const rows: RawAttendanceRow[] = [
      makeRow("late", "2026-01-01T09:00:00Z"),
    ];
    expect(calcMaxStreak(rows)).toBe(1);
  });
});

describe("calcMaxStreak - absent 처리", () => {
  it("전체 absent이면 0을 반환한다", () => {
    const rows: RawAttendanceRow[] = [
      makeRow("absent", "2026-01-01T09:00:00Z"),
      makeRow("absent", "2026-01-02T09:00:00Z"),
    ];
    expect(calcMaxStreak(rows)).toBe(0);
  });

  it("absent로 인해 streak이 끊기면 최대 streak만 반환한다", () => {
    const rows: RawAttendanceRow[] = [
      makeRow("present", "2026-01-01T09:00:00Z"),
      makeRow("present", "2026-01-02T09:00:00Z"),
      makeRow("absent",  "2026-01-03T09:00:00Z"),
      makeRow("present", "2026-01-04T09:00:00Z"),
    ];
    expect(calcMaxStreak(rows)).toBe(2);
  });

  it("처음이 absent이고 이후 연속 present이면 이후 streak을 반환한다", () => {
    const rows: RawAttendanceRow[] = [
      makeRow("absent",  "2026-01-01T09:00:00Z"),
      makeRow("present", "2026-01-02T09:00:00Z"),
      makeRow("present", "2026-01-03T09:00:00Z"),
      makeRow("present", "2026-01-04T09:00:00Z"),
    ];
    expect(calcMaxStreak(rows)).toBe(3);
  });

  it("두 개의 streak 중 더 긴 것을 반환한다", () => {
    const rows: RawAttendanceRow[] = [
      makeRow("present", "2026-01-01T09:00:00Z"),
      makeRow("absent",  "2026-01-02T09:00:00Z"),
      makeRow("present", "2026-01-03T09:00:00Z"),
      makeRow("present", "2026-01-04T09:00:00Z"),
      makeRow("present", "2026-01-05T09:00:00Z"),
    ];
    expect(calcMaxStreak(rows)).toBe(3);
  });
});

describe("calcMaxStreak - 날짜 정렬", () => {
  it("순서가 뒤섞인 날짜도 올바른 streak을 계산한다", () => {
    const rows: RawAttendanceRow[] = [
      makeRow("present", "2026-01-03T09:00:00Z"),
      makeRow("absent",  "2026-01-01T09:00:00Z"),
      makeRow("present", "2026-01-02T09:00:00Z"),
    ];
    // 정렬 후: absent(01) → present(02) → present(03) → streak=2
    expect(calcMaxStreak(rows)).toBe(2);
  });
});

// ============================================================
// useAttendanceAchievements - data가 없는 초기 상태 (null key)
// ============================================================

describe("useAttendanceAchievements - groupId/userId가 빈 문자열이면 기본값 반환", () => {
  it("groupId가 빈 문자열이면 SWR key가 null이어서 기본 achievements를 반환한다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "user-1")
    );
    expect(result.current.achievements).toHaveLength(6);
  });

  it("userId가 빈 문자열이면 SWR key가 null이어서 기본 achievements를 반환한다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("group-1", "")
    );
    expect(result.current.achievements).toHaveLength(6);
  });

  it("기본 상태에서 모든 배지는 achieved=false이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    result.current.achievements.forEach((a) => {
      expect(a.achieved).toBe(false);
    });
  });

  it("기본 상태에서 achievedCount는 0이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    expect(result.current.achievedCount).toBe(0);
  });

  it("기본 상태에서 totalCount는 6이다 (배지 정의 수)", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    expect(result.current.totalCount).toBe(6);
  });

  it("기본 상태에서 count 타입 배지의 progress는 '0/N회' 형식이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    const firstAttendance = result.current.achievements.find(
      (a) => a.id === "first_attendance"
    );
    expect(firstAttendance?.progress).toContain("0/");
    expect(firstAttendance?.progress).toContain("회");
  });

  it("기본 상태에서 rate 타입 배지의 progress는 '%' 포함이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    const kingBadge = result.current.achievements.find(
      (a) => a.id === "attendance_king"
    );
    expect(kingBadge?.progress).toContain("%");
  });

  it("각 배지의 id가 고유하다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    const ids = result.current.achievements.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("각 배지의 emoji, label, description 필드가 존재한다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    result.current.achievements.forEach((a) => {
      expect(a.emoji).toBeTruthy();
      expect(a.label).toBeTruthy();
      expect(a.description).toBeTruthy();
    });
  });

  it("각 배지의 current는 0이다 (기본 상태)", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    result.current.achievements.forEach((a) => {
      expect(a.current).toBe(0);
    });
  });

  it("loading 필드가 boolean이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    expect(typeof result.current.loading).toBe("boolean");
  });
});

// ============================================================
// 배지 정의 상수 검증
// ============================================================

describe("배지 정의 상수 - 구조 검증", () => {
  it("first_attendance 배지의 required는 1이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    const badge = result.current.achievements.find(
      (a) => a.id === "first_attendance"
    );
    expect(badge?.required).toBe(1);
  });

  it("attendance_10 배지의 required는 10이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    const badge = result.current.achievements.find(
      (a) => a.id === "attendance_10"
    );
    expect(badge?.required).toBe(10);
  });

  it("attendance_50 배지의 required는 50이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    const badge = result.current.achievements.find(
      (a) => a.id === "attendance_50"
    );
    expect(badge?.required).toBe(50);
  });

  it("attendance_100 배지의 required는 100이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    const badge = result.current.achievements.find(
      (a) => a.id === "attendance_100"
    );
    expect(badge?.required).toBe(100);
  });

  it("perfect_streak 배지의 required는 10이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    const badge = result.current.achievements.find(
      (a) => a.id === "perfect_streak"
    );
    expect(badge?.required).toBe(10);
  });

  it("attendance_king 배지의 required는 90이다", () => {
    const { result } = renderHook(() =>
      useAttendanceAchievements("", "")
    );
    const badge = result.current.achievements.find(
      (a) => a.id === "attendance_king"
    );
    expect(badge?.required).toBe(90);
  });
});
