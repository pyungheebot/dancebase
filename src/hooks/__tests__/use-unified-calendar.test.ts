import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useUnifiedCalendar,
  UNIFIED_EVENT_TYPE_LABELS,
  UNIFIED_EVENT_TYPE_COLORS,
} from "@/hooks/use-unified-calendar";
import type { UnifiedCalendarEvent } from "@/types";

// ─── localStorage mock ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _store: () => store,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeEventParams(
  overrides: Partial<Omit<UnifiedCalendarEvent, "id" | "createdAt">> = {}
): Omit<UnifiedCalendarEvent, "id" | "createdAt"> {
  return {
    title: "연습",
    type: "practice",
    date: "2026-03-01",
    startTime: "10:00",
    endTime: "12:00",
    isAllDay: false,
    ...overrides,
  };
}

function makeHook(groupId = "grp-1") {
  return renderHook(() => useUnifiedCalendar(groupId));
}

// ============================================================
// UNIFIED_EVENT_TYPE_LABELS 상수 테스트
// ============================================================

describe("UNIFIED_EVENT_TYPE_LABELS - 이벤트 타입 레이블", () => {
  it("practice 레이블은 '연습'이다", () => {
    expect(UNIFIED_EVENT_TYPE_LABELS.practice).toBe("연습");
  });

  it("performance 레이블은 '공연'이다", () => {
    expect(UNIFIED_EVENT_TYPE_LABELS.performance).toBe("공연");
  });

  it("meeting 레이블은 '회의'이다", () => {
    expect(UNIFIED_EVENT_TYPE_LABELS.meeting).toBe("회의");
  });

  it("social 레이블은 '모임'이다", () => {
    expect(UNIFIED_EVENT_TYPE_LABELS.social).toBe("모임");
  });

  it("competition 레이블은 '대회'이다", () => {
    expect(UNIFIED_EVENT_TYPE_LABELS.competition).toBe("대회");
  });

  it("workshop 레이블은 '워크샵'이다", () => {
    expect(UNIFIED_EVENT_TYPE_LABELS.workshop).toBe("워크샵");
  });

  it("other 레이블은 '기타'이다", () => {
    expect(UNIFIED_EVENT_TYPE_LABELS.other).toBe("기타");
  });

  it("7개 타입이 모두 정의되어 있다", () => {
    expect(Object.keys(UNIFIED_EVENT_TYPE_LABELS)).toHaveLength(7);
  });
});

// ============================================================
// UNIFIED_EVENT_TYPE_COLORS 상수 테스트
// ============================================================

describe("UNIFIED_EVENT_TYPE_COLORS - 색상 설정", () => {
  it("모든 타입에 bg, text, border, dot, badge 속성이 있다", () => {
    const types = Object.keys(UNIFIED_EVENT_TYPE_COLORS);
    types.forEach((type) => {
      const colors = UNIFIED_EVENT_TYPE_COLORS[type as keyof typeof UNIFIED_EVENT_TYPE_COLORS];
      expect(colors.bg).toBeDefined();
      expect(colors.text).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.dot).toBeDefined();
      expect(colors.badge).toBeDefined();
    });
  });

  it("7개 타입 모두 색상이 정의되어 있다", () => {
    expect(Object.keys(UNIFIED_EVENT_TYPE_COLORS)).toHaveLength(7);
  });
});

// ============================================================
// useUnifiedCalendar - 초기 상태
// ============================================================

describe("useUnifiedCalendar - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("초기 events는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.events).toEqual([]);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalEvents는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalEvents).toBe(0);
  });

  it("초기 stats.typeDistribution의 모든 값이 0이다", () => {
    const { result } = makeHook();
    const dist = result.current.stats.typeDistribution;
    Object.values(dist).forEach((count) => expect(count).toBe(0));
  });

  it("addEvent, updateEvent, deleteEvent, getByDate 등 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addEvent).toBe("function");
    expect(typeof result.current.updateEvent).toBe("function");
    expect(typeof result.current.deleteEvent).toBe("function");
    expect(typeof result.current.getByDate).toBe("function");
    expect(typeof result.current.getByMonth).toBe("function");
    expect(typeof result.current.getByType).toBe("function");
    expect(typeof result.current.getUpcoming).toBe("function");
  });
});

// ============================================================
// useUnifiedCalendar - addEvent
// ============================================================

describe("useUnifiedCalendar - addEvent", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("이벤트 추가 후 events 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams()); });
    expect(result.current.events).toHaveLength(1);
  });

  it("추가된 이벤트에 id가 부여된다", () => {
    const { result } = makeHook();
    let returned: UnifiedCalendarEvent;
    act(() => { returned = result.current.addEvent(makeEventParams()); });
    expect(returned!.id).toBeDefined();
    expect(returned!.id).not.toBe("");
  });

  it("추가된 이벤트에 createdAt이 설정된다", () => {
    const { result } = makeHook();
    let returned: UnifiedCalendarEvent;
    act(() => { returned = result.current.addEvent(makeEventParams()); });
    expect(returned!.createdAt).toBeDefined();
  });

  it("이벤트 추가 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams()); });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("여러 이벤트 추가 시 모두 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ title: "연습1", date: "2026-03-01" })); });
    act(() => { result.current.addEvent(makeEventParams({ title: "연습2", date: "2026-03-02" })); });
    act(() => { result.current.addEvent(makeEventParams({ title: "공연", date: "2026-03-03", type: "performance" })); });
    expect(result.current.events).toHaveLength(3);
  });

  it("추가된 이벤트의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ title: "중요 연습" })); });
    expect(result.current.events[0].title).toBe("중요 연습");
  });

  it("추가된 이벤트의 type이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ type: "performance" })); });
    expect(result.current.events[0].type).toBe("performance");
  });

  it("stats.totalEvents가 추가된 이벤트 수와 일치한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams()); });
    act(() => { result.current.addEvent(makeEventParams()); });
    expect(result.current.stats.totalEvents).toBe(2);
  });
});

// ============================================================
// useUnifiedCalendar - updateEvent
// ============================================================

describe("useUnifiedCalendar - updateEvent", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("이벤트 수정 후 title이 변경된다", () => {
    const { result } = makeHook();
    let event: UnifiedCalendarEvent;
    act(() => { event = result.current.addEvent(makeEventParams({ title: "원래 제목" })); });
    act(() => { result.current.updateEvent(event!.id, { title: "새 제목" }); });
    expect(result.current.events[0].title).toBe("새 제목");
  });

  it("이벤트 수정 후 다른 필드는 유지된다", () => {
    const { result } = makeHook();
    let event: UnifiedCalendarEvent;
    act(() => { event = result.current.addEvent(makeEventParams({ title: "제목", type: "practice" })); });
    act(() => { result.current.updateEvent(event!.id, { title: "변경 제목" }); });
    expect(result.current.events[0].type).toBe("practice");
  });

  it("존재하지 않는 id 수정 시 events가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams()); });
    const before = result.current.events.length;
    act(() => { result.current.updateEvent("non-existent", { title: "다른 제목" }); });
    expect(result.current.events.length).toBe(before);
  });
});

// ============================================================
// useUnifiedCalendar - deleteEvent
// ============================================================

describe("useUnifiedCalendar - deleteEvent", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("이벤트 삭제 후 events 길이가 감소한다", () => {
    const { result } = makeHook();
    let event: UnifiedCalendarEvent;
    act(() => { event = result.current.addEvent(makeEventParams()); });
    act(() => { result.current.deleteEvent(event!.id); });
    expect(result.current.events).toHaveLength(0);
  });

  it("특정 이벤트만 삭제된다", () => {
    const { result } = makeHook();
    let ev1: UnifiedCalendarEvent, ev2: UnifiedCalendarEvent;
    act(() => {
      ev1 = result.current.addEvent(makeEventParams({ title: "이벤트1" }));
      ev2 = result.current.addEvent(makeEventParams({ title: "이벤트2" }));
    });
    act(() => { result.current.deleteEvent(ev1!.id); });
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe(ev2!.id);
  });

  it("삭제 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    let event: UnifiedCalendarEvent;
    act(() => { event = result.current.addEvent(makeEventParams()); });
    localStorageMock.setItem.mockClear();
    act(() => { result.current.deleteEvent(event!.id); });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================
// useUnifiedCalendar - getByDate
// ============================================================

describe("useUnifiedCalendar - getByDate", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("해당 날짜 이벤트만 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01" })); });
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-02" })); });
    const found = result.current.getByDate("2026-03-01");
    expect(found).toHaveLength(1);
    expect(found[0].date).toBe("2026-03-01");
  });

  it("해당 날짜 이벤트가 없으면 빈 배열 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01" })); });
    const found = result.current.getByDate("2026-04-01");
    expect(found).toHaveLength(0);
  });

  it("종일 이벤트가 먼저 정렬된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01", startTime: "14:00", isAllDay: false })); });
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01", startTime: "", isAllDay: true })); });
    const found = result.current.getByDate("2026-03-01");
    expect(found[0].isAllDay).toBe(true);
  });

  it("같은 날짜 이벤트는 startTime 순서로 정렬된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01", startTime: "14:00", isAllDay: false })); });
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01", startTime: "09:00", isAllDay: false })); });
    const found = result.current.getByDate("2026-03-01");
    expect(found[0].startTime).toBe("09:00");
    expect(found[1].startTime).toBe("14:00");
  });
});

// ============================================================
// useUnifiedCalendar - getByMonth
// ============================================================

describe("useUnifiedCalendar - getByMonth", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("해당 월 이벤트만 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01" })); });
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-15" })); });
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-04-01" })); });
    const found = result.current.getByMonth(2026, 3);
    expect(found).toHaveLength(2);
  });

  it("해당 월 이벤트가 없으면 빈 배열 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01" })); });
    const found = result.current.getByMonth(2026, 5);
    expect(found).toHaveLength(0);
  });

  it("반환된 이벤트는 날짜 오름차순으로 정렬된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-20" })); });
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-05" })); });
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-12" })); });
    const found = result.current.getByMonth(2026, 3);
    expect(found[0].date).toBe("2026-03-05");
    expect(found[1].date).toBe("2026-03-12");
    expect(found[2].date).toBe("2026-03-20");
  });

  it("월이 한 자리일 때도 올바르게 필터링된다 (예: 3월)", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01" })); });
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-31" })); });
    const found = result.current.getByMonth(2026, 3);
    expect(found).toHaveLength(2);
  });
});

// ============================================================
// useUnifiedCalendar - getByType
// ============================================================

describe("useUnifiedCalendar - getByType", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("해당 타입 이벤트만 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ type: "practice", date: "2026-03-01" })); });
    act(() => { result.current.addEvent(makeEventParams({ type: "performance", date: "2026-03-02" })); });
    act(() => { result.current.addEvent(makeEventParams({ type: "practice", date: "2026-03-03" })); });
    const found = result.current.getByType("practice");
    expect(found).toHaveLength(2);
    found.forEach((e) => expect(e.type).toBe("practice"));
  });

  it("반환된 이벤트는 날짜 오름차순으로 정렬된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ type: "practice", date: "2026-03-10" })); });
    act(() => { result.current.addEvent(makeEventParams({ type: "practice", date: "2026-03-01" })); });
    const found = result.current.getByType("practice");
    expect(found[0].date).toBe("2026-03-01");
    expect(found[1].date).toBe("2026-03-10");
  });
});

// ============================================================
// useUnifiedCalendar - getUpcoming
// ============================================================

describe("useUnifiedCalendar - getUpcoming", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("오늘 이후 7일 이내 이벤트를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01" })); }); // 오늘
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-05" })); }); // 4일 후
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-10" })); }); // 9일 후 (범위 밖)
    const upcoming = result.current.getUpcoming(7);
    expect(upcoming.length).toBeGreaterThanOrEqual(2);
  });

  it("아주 오래된 과거 이벤트는 반환하지 않는다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-01-01" })); }); // 2달 전
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01" })); }); // 오늘
    const upcoming = result.current.getUpcoming(7);
    const veryOldEvents = upcoming.filter((e) => e.date < "2026-02-01");
    expect(veryOldEvents.length).toBe(0);
  });
});

// ============================================================
// useUnifiedCalendar - stats 통계
// ============================================================

describe("useUnifiedCalendar - stats 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("typeDistribution이 타입별 카운트를 올바르게 집계한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ type: "practice" })); });
    act(() => { result.current.addEvent(makeEventParams({ type: "practice" })); });
    act(() => { result.current.addEvent(makeEventParams({ type: "performance" })); });
    const dist = result.current.stats.typeDistribution;
    expect(dist.practice).toBe(2);
    expect(dist.performance).toBe(1);
  });

  it("이번 달 이벤트 수가 thisMonthCount에 반영된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-01" })); });
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-03-15" })); });
    act(() => { result.current.addEvent(makeEventParams({ date: "2026-04-01" })); });
    expect(result.current.stats.thisMonthCount).toBe(2);
  });
});
