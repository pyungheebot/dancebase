import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calcDday,
  formatDday,
  todayYMD,
  GROUP_EVENT_CATEGORIES,
  GROUP_EVENT_CATEGORY_COLORS,
  RSVP_STATUS_LABELS,
  RSVP_STATUS_COLORS,
} from "@/hooks/use-group-event-calendar";

// ============================================================
// use-group-event-calendar.ts 순수 함수/상수 테스트
// ============================================================

// ──────────────────────────────────────────────────────────────
// 1. todayYMD - 오늘 날짜 문자열 반환
// ──────────────────────────────────────────────────────────────

describe("todayYMD - 오늘 날짜 문자열 반환", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("YYYY-MM-DD 형식의 문자열을 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01T12:00:00.000Z"));
    const result = todayYMD();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("오늘 날짜가 올바르게 반환된다", () => {
    vi.setSystemTime(new Date("2026-03-01T00:00:00"));
    const result = todayYMD();
    expect(result.startsWith("2026-03-")).toBe(true);
  });

  it("월이 두 자리로 패딩된다", () => {
    vi.setSystemTime(new Date("2026-01-05T00:00:00"));
    const result = todayYMD();
    expect(result).toMatch(/^\d{4}-0\d-\d{2}$/);
  });

  it("일이 두 자리로 패딩된다", () => {
    vi.setSystemTime(new Date("2026-03-01T00:00:00"));
    const result = todayYMD();
    expect(result.split("-")[2]).toHaveLength(2);
  });
});

// ──────────────────────────────────────────────────────────────
// 2. calcDday - D-day 계산
// ──────────────────────────────────────────────────────────────

describe("calcDday - D-day 계산", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("오늘 날짜이면 0을 반환한다", () => {
    expect(calcDday("2026-03-01")).toBe(0);
  });

  it("내일이면 1을 반환한다", () => {
    expect(calcDday("2026-03-02")).toBe(1);
  });

  it("어제이면 -1을 반환한다", () => {
    expect(calcDday("2026-02-28")).toBe(-1);
  });

  it("7일 후이면 7을 반환한다", () => {
    expect(calcDday("2026-03-08")).toBe(7);
  });

  it("30일 전이면 -30을 반환한다", () => {
    expect(calcDday("2026-01-30")).toBe(-30);
  });

  it("반환값이 정수다", () => {
    const result = calcDday("2026-03-15");
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// 3. formatDday - D-day 문자열 포맷
// ──────────────────────────────────────────────────────────────

describe("formatDday - D-day 포맷", () => {
  it("dday가 0이면 'D-Day'를 반환한다", () => {
    expect(formatDday(0)).toBe("D-Day");
  });

  it("dday가 1이면 'D-1'을 반환한다", () => {
    expect(formatDday(1)).toBe("D-1");
  });

  it("dday가 7이면 'D-7'을 반환한다", () => {
    expect(formatDday(7)).toBe("D-7");
  });

  it("dday가 -1이면 'D+1'을 반환한다", () => {
    expect(formatDday(-1)).toBe("D+1");
  });

  it("dday가 -30이면 'D+30'을 반환한다", () => {
    expect(formatDday(-30)).toBe("D+30");
  });

  it("dday가 100이면 'D-100'을 반환한다", () => {
    expect(formatDday(100)).toBe("D-100");
  });

  it("dday가 음수이면 절댓값으로 표시된다", () => {
    const result = formatDday(-5);
    expect(result).toBe("D+5");
    expect(result).not.toContain("-");
  });
});

// ──────────────────────────────────────────────────────────────
// 4. GROUP_EVENT_CATEGORIES 상수 검증
// ──────────────────────────────────────────────────────────────

describe("GROUP_EVENT_CATEGORIES 상수", () => {
  it("7개의 카테고리가 존재한다", () => {
    expect(GROUP_EVENT_CATEGORIES).toHaveLength(7);
  });

  it("'공연'이 포함된다", () => {
    expect(GROUP_EVENT_CATEGORIES).toContain("공연");
  });

  it("'워크숍'이 포함된다", () => {
    expect(GROUP_EVENT_CATEGORIES).toContain("워크숍");
  });

  it("'모임'이 포함된다", () => {
    expect(GROUP_EVENT_CATEGORIES).toContain("모임");
  });

  it("'대회'가 포함된다", () => {
    expect(GROUP_EVENT_CATEGORIES).toContain("대회");
  });

  it("'축제'가 포함된다", () => {
    expect(GROUP_EVENT_CATEGORIES).toContain("축제");
  });

  it("'연습'이 포함된다", () => {
    expect(GROUP_EVENT_CATEGORIES).toContain("연습");
  });

  it("'기타'가 포함된다", () => {
    expect(GROUP_EVENT_CATEGORIES).toContain("기타");
  });
});

// ──────────────────────────────────────────────────────────────
// 5. GROUP_EVENT_CATEGORY_COLORS 상수 검증
// ──────────────────────────────────────────────────────────────

describe("GROUP_EVENT_CATEGORY_COLORS 상수", () => {
  it("'공연' 카테고리 색상에 'purple'이 포함된다", () => {
    expect(GROUP_EVENT_CATEGORY_COLORS["공연"].bg).toContain("purple");
  });

  it("'연습' 카테고리 색상에 'blue'가 포함된다", () => {
    expect(GROUP_EVENT_CATEGORY_COLORS["연습"].bg).toContain("blue");
  });

  it("'모임' 카테고리 색상에 'pink'가 포함된다", () => {
    expect(GROUP_EVENT_CATEGORY_COLORS["모임"].bg).toContain("pink");
  });

  it("'기타' 카테고리 색상에 'gray'가 포함된다", () => {
    expect(GROUP_EVENT_CATEGORY_COLORS["기타"].bg).toContain("gray");
  });

  it("각 카테고리에 bg, text, dot, badge 속성이 있다", () => {
    for (const cat of GROUP_EVENT_CATEGORIES) {
      const colors = GROUP_EVENT_CATEGORY_COLORS[cat];
      expect(colors).toHaveProperty("bg");
      expect(colors).toHaveProperty("text");
      expect(colors).toHaveProperty("dot");
      expect(colors).toHaveProperty("badge");
    }
  });

  it("'대회' 카테고리 색상에 'red'가 포함된다", () => {
    expect(GROUP_EVENT_CATEGORY_COLORS["대회"].bg).toContain("red");
  });

  it("'축제' 카테고리 색상에 'yellow'가 포함된다", () => {
    expect(GROUP_EVENT_CATEGORY_COLORS["축제"].bg).toContain("yellow");
  });
});

// ──────────────────────────────────────────────────────────────
// 6. RSVP_STATUS_LABELS 상수 검증
// ──────────────────────────────────────────────────────────────

describe("RSVP_STATUS_LABELS 상수", () => {
  it("'참석' 레이블이 '참석'이다", () => {
    expect(RSVP_STATUS_LABELS["참석"]).toBe("참석");
  });

  it("'미참석' 레이블이 '미참석'이다", () => {
    expect(RSVP_STATUS_LABELS["미참석"]).toBe("미참석");
  });

  it("'미정' 레이블이 '미정'이다", () => {
    expect(RSVP_STATUS_LABELS["미정"]).toBe("미정");
  });
});

// ──────────────────────────────────────────────────────────────
// 7. RSVP_STATUS_COLORS 상수 검증
// ──────────────────────────────────────────────────────────────

describe("RSVP_STATUS_COLORS 상수", () => {
  it("'참석' 색상에 'green'이 포함된다", () => {
    expect(RSVP_STATUS_COLORS["참석"].bg).toContain("green");
  });

  it("'미참석' 색상에 'red'가 포함된다", () => {
    expect(RSVP_STATUS_COLORS["미참석"].bg).toContain("red");
  });

  it("'미정' 색상에 'gray'가 포함된다", () => {
    expect(RSVP_STATUS_COLORS["미정"].bg).toContain("gray");
  });

  it("각 상태에 bg, text, border 속성이 있다", () => {
    for (const status of ["참석", "미참석", "미정"] as const) {
      const colors = RSVP_STATUS_COLORS[status];
      expect(colors).toHaveProperty("bg");
      expect(colors).toHaveProperty("text");
      expect(colors).toHaveProperty("border");
    }
  });
});

// ──────────────────────────────────────────────────────────────
// 8. 이벤트 CRUD 로직 (인라인 복제)
// ──────────────────────────────────────────────────────────────

type GroupEventRsvpStatus = "참석" | "미참석" | "미정";

type GroupEventRsvp = {
  userId: string;
  status: GroupEventRsvpStatus;
  updatedAt: string;
};

type GroupCalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  category: string;
  description: string;
  rsvps: GroupEventRsvp[];
  createdAt: string;
};

function deleteEvent(events: GroupCalendarEvent[], eventId: string): { events: GroupCalendarEvent[]; success: boolean } {
  const exists = events.some((e) => e.id === eventId);
  if (!exists) return { events, success: false };
  return { events: events.filter((e) => e.id !== eventId), success: true };
}

function updateEvent(
  events: GroupCalendarEvent[],
  eventId: string,
  params: Partial<Pick<GroupCalendarEvent, "title" | "date" | "time" | "location">>
): { events: GroupCalendarEvent[]; success: boolean } {
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx === -1) return { events, success: false };
  return {
    events: events.map((e) => (e.id === eventId ? { ...e, ...params } : e)),
    success: true,
  };
}

const makeSampleEvent = (overrides: Partial<GroupCalendarEvent> = {}): GroupCalendarEvent => ({
  id: "e1",
  title: "정기 공연",
  date: "2026-04-01",
  time: "18:00",
  endTime: "20:00",
  location: "서울 아트센터",
  category: "공연",
  description: "봄 정기 공연",
  rsvps: [],
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("이벤트 삭제 로직", () => {
  it("존재하는 이벤트를 삭제하면 success가 true이다", () => {
    const events = [makeSampleEvent()];
    const { success } = deleteEvent(events, "e1");
    expect(success).toBe(true);
  });

  it("존재하는 이벤트를 삭제하면 목록에서 제거된다", () => {
    const events = [makeSampleEvent()];
    const { events: updated } = deleteEvent(events, "e1");
    expect(updated).toHaveLength(0);
  });

  it("존재하지 않는 이벤트 삭제 시 success가 false이다", () => {
    const events = [makeSampleEvent()];
    const { success } = deleteEvent(events, "e99");
    expect(success).toBe(false);
  });

  it("존재하지 않는 이벤트 삭제 시 목록이 변경되지 않는다", () => {
    const events = [makeSampleEvent()];
    const { events: updated } = deleteEvent(events, "e99");
    expect(updated).toHaveLength(1);
  });
});

describe("이벤트 수정 로직", () => {
  it("존재하는 이벤트를 수정하면 success가 true이다", () => {
    const events = [makeSampleEvent()];
    const { success } = updateEvent(events, "e1", { title: "수정된 공연" });
    expect(success).toBe(true);
  });

  it("이벤트 제목이 올바르게 수정된다", () => {
    const events = [makeSampleEvent()];
    const { events: updated } = updateEvent(events, "e1", { title: "새 공연명" });
    expect(updated[0].title).toBe("새 공연명");
  });

  it("존재하지 않는 이벤트 수정 시 success가 false이다", () => {
    const events = [makeSampleEvent()];
    const { success } = updateEvent(events, "e99", { title: "없는 이벤트" });
    expect(success).toBe(false);
  });

  it("수정되지 않은 필드는 그대로 유지된다", () => {
    const events = [makeSampleEvent()];
    const { events: updated } = updateEvent(events, "e1", { title: "새 제목" });
    expect(updated[0].location).toBe("서울 아트센터");
    expect(updated[0].date).toBe("2026-04-01");
  });
});

// ──────────────────────────────────────────────────────────────
// 9. RSVP 로직 (인라인 복제)
// ──────────────────────────────────────────────────────────────

function setRsvp(
  events: GroupCalendarEvent[],
  eventId: string,
  userId: string,
  status: GroupEventRsvpStatus
): { events: GroupCalendarEvent[]; success: boolean } {
  const event = events.find((e) => e.id === eventId);
  if (!event) return { events, success: false };

  const now = new Date().toISOString();
  const existing = event.rsvps.find((r) => r.userId === userId);

  let updatedRsvps: GroupEventRsvp[];
  if (existing) {
    updatedRsvps = event.rsvps.map((r) =>
      r.userId === userId ? { ...r, status, updatedAt: now } : r
    );
  } else {
    updatedRsvps = [...event.rsvps, { userId, status, updatedAt: now }];
  }

  return {
    events: events.map((e) =>
      e.id === eventId ? { ...e, rsvps: updatedRsvps } : e
    ),
    success: true,
  };
}

describe("RSVP 설정 로직", () => {
  it("존재하지 않는 이벤트에 RSVP 설정 시 success가 false이다", () => {
    const events = [makeSampleEvent()];
    const { success } = setRsvp(events, "e99", "u1", "참석");
    expect(success).toBe(false);
  });

  it("새 RSVP가 추가된다", () => {
    const events = [makeSampleEvent()];
    const { events: updated } = setRsvp(events, "e1", "u1", "참석");
    expect(updated[0].rsvps).toHaveLength(1);
    expect(updated[0].rsvps[0].status).toBe("참석");
    expect(updated[0].rsvps[0].userId).toBe("u1");
  });

  it("기존 RSVP가 업데이트된다", () => {
    const events = [
      makeSampleEvent({ rsvps: [{ userId: "u1", status: "미정", updatedAt: "" }] }),
    ];
    const { events: updated } = setRsvp(events, "e1", "u1", "참석");
    expect(updated[0].rsvps).toHaveLength(1);
    expect(updated[0].rsvps[0].status).toBe("참석");
  });

  it("다른 사용자의 RSVP는 영향받지 않는다", () => {
    const events = [
      makeSampleEvent({ rsvps: [{ userId: "u2", status: "미참석", updatedAt: "" }] }),
    ];
    const { events: updated } = setRsvp(events, "e1", "u1", "참석");
    const u2Rsvp = updated[0].rsvps.find((r) => r.userId === "u2");
    expect(u2Rsvp?.status).toBe("미참석");
  });
});

// ──────────────────────────────────────────────────────────────
// 10. 이벤트 조회 헬퍼 (인라인 복제)
// ──────────────────────────────────────────────────────────────

function getEventsByDate(events: GroupCalendarEvent[], date: string): GroupCalendarEvent[] {
  return events.filter((e) => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
}

function getUpcomingEvents(events: GroupCalendarEvent[], today: string, limit = 5): GroupCalendarEvent[] {
  return events
    .filter((e) => e.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    })
    .slice(0, limit);
}

describe("이벤트 날짜 조회", () => {
  it("특정 날짜의 이벤트만 반환한다", () => {
    const events = [
      makeSampleEvent({ id: "e1", date: "2026-04-01", time: "18:00" }),
      makeSampleEvent({ id: "e2", date: "2026-04-02", time: "10:00" }),
    ];
    const result = getEventsByDate(events, "2026-04-01");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("e1");
  });

  it("해당 날짜에 이벤트가 없으면 빈 배열을 반환한다", () => {
    const events = [makeSampleEvent({ date: "2026-04-01" })];
    const result = getEventsByDate(events, "2026-05-01");
    expect(result).toHaveLength(0);
  });

  it("같은 날짜 이벤트들이 시간 순으로 정렬된다", () => {
    const events = [
      makeSampleEvent({ id: "e1", date: "2026-04-01", time: "20:00" }),
      makeSampleEvent({ id: "e2", date: "2026-04-01", time: "10:00" }),
    ];
    const result = getEventsByDate(events, "2026-04-01");
    expect(result[0].id).toBe("e2");
    expect(result[1].id).toBe("e1");
  });
});

describe("다가오는 이벤트 조회", () => {
  it("오늘 이후 이벤트만 반환한다", () => {
    const events = [
      makeSampleEvent({ id: "e1", date: "2026-02-01" }),
      makeSampleEvent({ id: "e2", date: "2026-04-01" }),
    ];
    const result = getUpcomingEvents(events, "2026-03-01");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("e2");
  });

  it("오늘 날짜 이벤트도 포함된다", () => {
    const events = [makeSampleEvent({ date: "2026-03-01" })];
    const result = getUpcomingEvents(events, "2026-03-01");
    expect(result).toHaveLength(1);
  });

  it("limit 이상의 이벤트는 잘린다", () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      makeSampleEvent({ id: `e${i}`, date: `2026-04-${String(i + 1).padStart(2, "0")}` })
    );
    const result = getUpcomingEvents(events, "2026-03-01", 3);
    expect(result).toHaveLength(3);
  });

  it("날짜 오름차순으로 정렬된다", () => {
    const events = [
      makeSampleEvent({ id: "e1", date: "2026-05-01", time: "18:00" }),
      makeSampleEvent({ id: "e2", date: "2026-04-01", time: "10:00" }),
    ];
    const result = getUpcomingEvents(events, "2026-03-01");
    expect(result[0].id).toBe("e2");
    expect(result[1].id).toBe("e1");
  });
});

// ──────────────────────────────────────────────────────────────
// 11. stats 통계 로직 (인라인)
// ──────────────────────────────────────────────────────────────

type StatsInput = {
  events: GroupCalendarEvent[];
  today: string;
  userId: string;
};

function calcStats(input: StatsInput) {
  const { events, today, userId } = input;
  const thisMonthPrefix = today.slice(0, 7);

  const thisMonthCount = events.filter((e) => e.date.startsWith(thisMonthPrefix)).length;

  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

  const nextEvent = upcoming.length > 0 ? upcoming[0] : null;

  let attending = 0;
  let notAttending = 0;
  let pending = 0;
  for (const ev of events) {
    const rsvp = ev.rsvps.find((r) => r.userId === userId);
    if (!rsvp || rsvp.status === "미정") pending++;
    else if (rsvp.status === "참석") attending++;
    else notAttending++;
  }

  return {
    thisMonthCount,
    totalCount: events.length,
    nextEvent,
    myRsvp: { attending, notAttending, pending },
  };
}

describe("이벤트 통계 계산", () => {
  it("이벤트가 없으면 thisMonthCount는 0이다", () => {
    const stats = calcStats({ events: [], today: "2026-03-01", userId: "u1" });
    expect(stats.thisMonthCount).toBe(0);
  });

  it("이번 달 이벤트 수가 올바르게 계산된다", () => {
    const events = [
      makeSampleEvent({ id: "e1", date: "2026-03-10" }),
      makeSampleEvent({ id: "e2", date: "2026-03-20" }),
      makeSampleEvent({ id: "e3", date: "2026-04-01" }),
    ];
    const stats = calcStats({ events, today: "2026-03-01", userId: "u1" });
    expect(stats.thisMonthCount).toBe(2);
  });

  it("totalCount가 전체 이벤트 수와 일치한다", () => {
    const events = [
      makeSampleEvent({ id: "e1", date: "2026-03-10" }),
      makeSampleEvent({ id: "e2", date: "2026-04-01" }),
    ];
    const stats = calcStats({ events, today: "2026-03-01", userId: "u1" });
    expect(stats.totalCount).toBe(2);
  });

  it("다음 이벤트가 올바르게 계산된다", () => {
    const events = [
      makeSampleEvent({ id: "e1", date: "2026-03-15", time: "10:00" }),
      makeSampleEvent({ id: "e2", date: "2026-04-01", time: "10:00" }),
    ];
    const stats = calcStats({ events, today: "2026-03-10", userId: "u1" });
    expect(stats.nextEvent?.id).toBe("e1");
  });

  it("과거 이벤트만 있으면 nextEvent가 null이다", () => {
    const events = [makeSampleEvent({ date: "2026-01-01" })];
    const stats = calcStats({ events, today: "2026-03-01", userId: "u1" });
    expect(stats.nextEvent).toBeNull();
  });

  it("RSVP 없는 이벤트는 pending으로 집계된다", () => {
    const events = [makeSampleEvent({ rsvps: [] })];
    const stats = calcStats({ events, today: "2026-01-01", userId: "u1" });
    expect(stats.myRsvp.pending).toBe(1);
  });

  it("'참석' RSVP가 attending으로 집계된다", () => {
    const events = [
      makeSampleEvent({ rsvps: [{ userId: "u1", status: "참석", updatedAt: "" }] }),
    ];
    const stats = calcStats({ events, today: "2026-01-01", userId: "u1" });
    expect(stats.myRsvp.attending).toBe(1);
  });

  it("'미참석' RSVP가 notAttending으로 집계된다", () => {
    const events = [
      makeSampleEvent({ rsvps: [{ userId: "u1", status: "미참석", updatedAt: "" }] }),
    ];
    const stats = calcStats({ events, today: "2026-01-01", userId: "u1" });
    expect(stats.myRsvp.notAttending).toBe(1);
  });
});
