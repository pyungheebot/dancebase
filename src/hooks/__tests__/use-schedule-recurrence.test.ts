import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

import {
  useScheduleRecurrence,
  generateUpcomingDates,
  formatRecurrenceSummary,
  DAY_LABELS,
  RECURRENCE_TYPE_LABELS,
  RECURRENCE_END_TYPE_LABELS,
} from "@/hooks/use-schedule-recurrence";
import type { ScheduleRecurrenceRule, RecurrenceType, RecurrenceEndType } from "@/types";

function makeHook(groupId = "group-1") {
  return renderHook(() => useScheduleRecurrence(groupId));
}

function makeRule(overrides: Partial<ScheduleRecurrenceRule> = {}): ScheduleRecurrenceRule {
  return {
    id: "rule-1",
    groupId: "group-1",
    type: "weekly",
    daysOfWeek: [1, 3], // 월, 수
    startTime: "19:00",
    durationMinutes: 120,
    title: "주간 연습",
    location: "연습실 A",
    endType: "never",
    endDate: null,
    endCount: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeFormData(overrides: Partial<Omit<ScheduleRecurrenceRule, "id" | "groupId" | "createdAt">> = {}) {
  return {
    type: "weekly" as RecurrenceType,
    daysOfWeek: [1, 3],
    startTime: "19:00",
    durationMinutes: 120,
    title: "주간 연습",
    location: "연습실 A",
    endType: "never" as RecurrenceEndType,
    endDate: null,
    endCount: null,
    ...overrides,
  };
}

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ============================================================

describe("useScheduleRecurrence - 초기 상태", () => {
  it("rules 초기값은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.rules).toEqual([]);
  });

  it("maxReached 초기값은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.maxReached).toBe(false);
  });

  it("addRule, updateRule, deleteRule, getUpcomingDates 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addRule).toBe("function");
    expect(typeof result.current.updateRule).toBe("function");
    expect(typeof result.current.deleteRule).toBe("function");
    expect(typeof result.current.getUpcomingDates).toBe("function");
  });
});

describe("useScheduleRecurrence - addRule", () => {
  it("규칙을 추가하면 rules 배열에 추가된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRule(makeFormData());
    });
    expect(result.current.rules).toHaveLength(1);
  });

  it("addRule 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addRule(makeFormData());
    });
    expect(ok).toBe(true);
  });

  it("추가된 규칙은 id, groupId, createdAt을 가진다", () => {
    const { result } = makeHook("group-abc");
    act(() => {
      result.current.addRule(makeFormData());
    });
    const rule = result.current.rules[0];
    expect(rule.id).toBeTruthy();
    expect(rule.groupId).toBe("group-abc");
    expect(rule.createdAt).toBeTruthy();
  });

  it("추가된 규칙의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRule(makeFormData({ title: "격주 연습" }));
    });
    expect(result.current.rules[0].title).toBe("격주 연습");
  });

  it("새 규칙은 배열 맨 앞에 추가된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRule(makeFormData({ title: "첫 번째" }));
    });
    act(() => {
      result.current.addRule(makeFormData({ title: "두 번째" }));
    });
    expect(result.current.rules[0].title).toBe("두 번째");
  });

  it("규칙이 10개에 도달하면 maxReached가 true가 된다", () => {
    const { result } = makeHook();
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.addRule(makeFormData({ title: `규칙 ${i}` }));
      }
    });
    expect(result.current.maxReached).toBe(true);
  });

  it("규칙이 10개 초과 시 addRule이 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.addRule(makeFormData({ title: `규칙 ${i}` }));
      }
    });
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addRule(makeFormData({ title: "11번째" }));
    });
    expect(ok).toBe(false);
    expect(result.current.rules).toHaveLength(10);
  });

  it("규칙이 localStorage에 저장된다", () => {
    const { result } = makeHook("group-ls");
    act(() => {
      result.current.addRule(makeFormData());
    });
    const stored = localStorageMock.getItem(`dancebase:schedule-recurrence:group-ls`);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
  });
});

describe("useScheduleRecurrence - updateRule", () => {
  it("updateRule로 기존 규칙을 수정한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRule(makeFormData({ title: "원래 제목" }));
    });
    const ruleId = result.current.rules[0].id;
    act(() => {
      result.current.updateRule(ruleId, makeFormData({ title: "수정된 제목" }));
    });
    expect(result.current.rules[0].title).toBe("수정된 제목");
  });

  it("존재하지 않는 id로 updateRule 호출 시 에러가 발생하지 않는다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.updateRule("bad-id", makeFormData());
      });
    }).not.toThrow();
  });

  it("updateRule 후 localStorage에 반영된다", () => {
    const { result } = makeHook("group-upd");
    act(() => {
      result.current.addRule(makeFormData({ title: "원본" }));
    });
    const ruleId = result.current.rules[0].id;
    act(() => {
      result.current.updateRule(ruleId, makeFormData({ title: "업데이트됨" }));
    });
    const stored = localStorageMock.getItem(`dancebase:schedule-recurrence:group-upd`);
    const parsed = JSON.parse(stored!);
    expect(parsed[0].title).toBe("업데이트됨");
  });
});

describe("useScheduleRecurrence - deleteRule", () => {
  it("deleteRule로 규칙을 삭제한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRule(makeFormData());
    });
    const ruleId = result.current.rules[0].id;
    act(() => {
      result.current.deleteRule(ruleId);
    });
    expect(result.current.rules).toHaveLength(0);
  });

  it("존재하지 않는 id로 deleteRule 호출 시 에러가 발생하지 않는다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteRule("bad-id");
      });
    }).not.toThrow();
  });

  it("삭제 후 maxReached가 false로 돌아온다", () => {
    const { result } = makeHook();
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.addRule(makeFormData({ title: `규칙 ${i}` }));
      }
    });
    expect(result.current.maxReached).toBe(true);
    const ruleId = result.current.rules[0].id;
    act(() => {
      result.current.deleteRule(ruleId);
    });
    expect(result.current.maxReached).toBe(false);
  });
});

describe("useScheduleRecurrence - generateUpcomingDates 순수 함수", () => {
  it("daysOfWeek가 빈 배열이면 빈 배열을 반환한다", () => {
    const rule = makeRule({ daysOfWeek: [] });
    const dates = generateUpcomingDates(rule, 4);
    expect(dates).toHaveLength(0);
  });

  it("weekly 규칙에서 날짜를 생성한다", () => {
    const rule = makeRule({ type: "weekly", daysOfWeek: [1, 2, 3, 4, 5], endType: "never" });
    const dates = generateUpcomingDates(rule, 4);
    expect(dates.length).toBeGreaterThan(0);
  });

  it("반환 count만큼 날짜를 생성한다 (endType: never)", () => {
    const rule = makeRule({ type: "weekly", daysOfWeek: [1, 2, 3, 4, 5], endType: "never" });
    const dates = generateUpcomingDates(rule, 5);
    expect(dates).toHaveLength(5);
  });

  it("by_count 종료 조건을 지킨다", () => {
    const rule = makeRule({ type: "weekly", daysOfWeek: [1, 2, 3, 4, 5], endType: "by_count", endCount: 2 });
    const dates = generateUpcomingDates(rule, 10);
    expect(dates.length).toBeLessThanOrEqual(2);
  });

  it("endDate 이후의 날짜는 포함되지 않는다", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const rule = makeRule({
      type: "weekly",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      endType: "by_date",
      endDate: yesterday.toISOString().slice(0, 10),
    });
    const dates = generateUpcomingDates(rule, 10);
    expect(dates).toHaveLength(0);
  });

  it("monthly 규칙에서 날짜를 생성한다", () => {
    const rule = makeRule({ type: "monthly", daysOfWeek: [1, 2, 3, 4, 5], endType: "never" });
    const dates = generateUpcomingDates(rule, 2);
    expect(dates.length).toBeGreaterThan(0);
  });

  it("반환된 날짜는 오늘 이후이다", () => {
    const rule = makeRule({ type: "weekly", daysOfWeek: [0, 1, 2, 3, 4, 5, 6], endType: "never" });
    const dates = generateUpcomingDates(rule, 4);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const d of dates) {
      expect(d.getTime()).toBeGreaterThan(today.getTime());
    }
  });

  it("반환된 날짜는 Date 인스턴스이다", () => {
    const rule = makeRule({ type: "weekly", daysOfWeek: [1, 2, 3, 4, 5], endType: "never" });
    const dates = generateUpcomingDates(rule, 2);
    for (const d of dates) {
      expect(d).toBeInstanceOf(Date);
    }
  });
});

describe("useScheduleRecurrence - getUpcomingDates (훅 래퍼)", () => {
  it("getUpcomingDates는 Date 배열을 반환한다", () => {
    const { result } = makeHook();
    const rule = makeRule({ type: "weekly", daysOfWeek: [1, 2, 3, 4, 5] });
    const dates = result.current.getUpcomingDates(rule, 3);
    expect(Array.isArray(dates)).toBe(true);
  });
});

describe("useScheduleRecurrence - formatRecurrenceSummary", () => {
  it("weekly 타입 요약에 '매주'가 포함된다", () => {
    const rule = makeRule({ type: "weekly", daysOfWeek: [1], endType: "never" });
    expect(formatRecurrenceSummary(rule)).toContain("매주");
  });

  it("biweekly 타입 요약에 '격주'가 포함된다", () => {
    const rule = makeRule({ type: "biweekly", daysOfWeek: [1], endType: "never" });
    expect(formatRecurrenceSummary(rule)).toContain("격주");
  });

  it("monthly 타입 요약에 '매월'이 포함된다", () => {
    const rule = makeRule({ type: "monthly", daysOfWeek: [1], endType: "never" });
    expect(formatRecurrenceSummary(rule)).toContain("매월");
  });

  it("daysOfWeek가 없으면 '요일 미선택'이 포함된다", () => {
    const rule = makeRule({ daysOfWeek: [] });
    expect(formatRecurrenceSummary(rule)).toContain("요일 미선택");
  });

  it("by_date 종료 시 endDate가 포함된다", () => {
    const rule = makeRule({ endType: "by_date", endDate: "2026-12-31" });
    expect(formatRecurrenceSummary(rule)).toContain("2026-12-31");
  });

  it("by_count 종료 시 endCount가 포함된다", () => {
    const rule = makeRule({ endType: "by_count", endCount: 10 });
    expect(formatRecurrenceSummary(rule)).toContain("10");
  });

  it("never 종료 시 '계속'이 포함된다", () => {
    const rule = makeRule({ endType: "never" });
    expect(formatRecurrenceSummary(rule)).toContain("계속");
  });

  it("durationMinutes가 포함된다", () => {
    const rule = makeRule({ durationMinutes: 90 });
    expect(formatRecurrenceSummary(rule)).toContain("90");
  });

  it("startTime이 포함된다", () => {
    const rule = makeRule({ startTime: "20:30" });
    expect(formatRecurrenceSummary(rule)).toContain("20:30");
  });
});

describe("useScheduleRecurrence - 상수 내보내기", () => {
  it("DAY_LABELS에 0(일)~6(토) 레이블이 있다", () => {
    expect(DAY_LABELS[0]).toBe("일");
    expect(DAY_LABELS[1]).toBe("월");
    expect(DAY_LABELS[6]).toBe("토");
  });

  it("RECURRENCE_TYPE_LABELS에 세 가지 타입이 있다", () => {
    expect(RECURRENCE_TYPE_LABELS.weekly).toBe("매주");
    expect(RECURRENCE_TYPE_LABELS.biweekly).toBe("격주");
    expect(RECURRENCE_TYPE_LABELS.monthly).toBe("매월");
  });

  it("RECURRENCE_END_TYPE_LABELS에 세 가지 종료 타입이 있다", () => {
    expect(RECURRENCE_END_TYPE_LABELS.never).toBe("계속");
    expect(RECURRENCE_END_TYPE_LABELS.by_date).toBe("날짜까지");
    expect(RECURRENCE_END_TYPE_LABELS.by_count).toBe("N회 후 종료");
  });
});

describe("useScheduleRecurrence - 그룹별 격리", () => {
  it("다른 groupId를 사용하면 독립적인 rules를 가진다", () => {
    const { result: r1 } = renderHook(() => useScheduleRecurrence("group-1"));
    const { result: r2 } = renderHook(() => useScheduleRecurrence("group-2"));

    act(() => {
      r1.current.addRule(makeFormData());
    });

    expect(r1.current.rules).toHaveLength(1);
    expect(r2.current.rules).toHaveLength(0);
  });

  it("localStorage 키는 groupId를 포함한다", () => {
    const key1 = `dancebase:schedule-recurrence:group-1`;
    const key2 = `dancebase:schedule-recurrence:group-2`;
    expect(key1).not.toBe(key2);
  });
});
