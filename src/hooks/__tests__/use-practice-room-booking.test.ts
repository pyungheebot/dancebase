import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  usePracticeRoomBooking,
  todayYMD,
  getWeekDates,
  BOOKING_STATUS_LIST,
  BOOKING_STATUS_COLORS,
} from "@/hooks/use-practice-room-booking";
import type { PracticeRoom, PracticeRoomBooking } from "@/types";

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    practiceRoomBooking: (groupId: string) =>
      `dancebase:practice-room-booking:${groupId}`,
  },
}));

// ─── localStorage mock ────────────────────────────────────────
const _lsStore: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => _lsStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { _lsStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete _lsStore[key]; }),
  clear: vi.fn(() => { Object.keys(_lsStore).forEach(k => delete _lsStore[k]); }),
  _store: () => _lsStore,
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── 기본 스토리지 초기화 헬퍼 ───────────────────────────────
function initStorage(groupId = "grp-1") {
  const key = `dancebase:practice-room-booking:${groupId}`;
  const emptyData = { groupId, rooms: [], bookings: [], updatedAt: new Date().toISOString() };
  localStorageMock.setItem(key, JSON.stringify(emptyData));
}

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeRoomParams(
  overrides: Partial<Omit<PracticeRoom, "id" | "createdAt">> = {}
): Omit<PracticeRoom, "id" | "createdAt"> {
  return {
    name: "연습실 A",
    capacity: 10,
    isAvailable: true,
    ...overrides,
  };
}

function makeBookingParams(
  roomId: string,
  overrides: Partial<Omit<PracticeRoomBooking, "id" | "createdAt">> = {}
): Omit<PracticeRoomBooking, "id" | "createdAt"> {
  return {
    roomId,
    date: "2026-03-01",
    startTime: "10:00",
    endTime: "12:00",
    bookedBy: "user-1",
    status: "예약됨",
    ...overrides,
  };
}

function makeHook(groupId = "grp-1") {
  return renderHook(() => usePracticeRoomBooking(groupId));
}

// ============================================================
// todayYMD 순수 함수 테스트
// ============================================================

describe("todayYMD - 오늘 날짜 반환", () => {
  it("YYYY-MM-DD 형식을 반환한다", () => {
    const result = todayYMD();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("가짜 타이머 기준으로 올바른 날짜를 반환한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00"));
    const result = todayYMD();
    vi.useRealTimers();
    expect(result).toBe("2026-03-15");
  });

  it("월이 한 자리일 때 0-padding이 적용된다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00"));
    const result = todayYMD();
    vi.useRealTimers();
    expect(result.split("-")[1]).toBe("03");
  });

  it("일이 한 자리일 때 0-padding이 적용된다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T12:00:00"));
    const result = todayYMD();
    vi.useRealTimers();
    expect(result.split("-")[2]).toBe("05");
  });
});

// ============================================================
// getWeekDates 순수 함수 테스트
// ============================================================

describe("getWeekDates - 주차 날짜 배열 반환", () => {
  it("7개 날짜를 반환한다", () => {
    const dates = getWeekDates("2026-03-04"); // 수요일
    expect(dates).toHaveLength(7);
  });

  it("첫 번째 날짜가 월요일이다", () => {
    // 2026-03-04 = 수요일 → 해당 주 월요일 = 2026-03-02
    const dates = getWeekDates("2026-03-04");
    expect(dates[0]).toBe("2026-03-02");
  });

  it("마지막 날짜가 일요일이다", () => {
    const dates = getWeekDates("2026-03-04");
    expect(dates[6]).toBe("2026-03-08");
  });

  it("일요일 기준 주의 월요일을 올바르게 계산한다", () => {
    // 2026-03-08 = 일요일 → 해당 주 월요일 = 2026-03-02
    const dates = getWeekDates("2026-03-08");
    expect(dates[0]).toBe("2026-03-02");
  });

  it("월요일 기준은 자신이 첫 번째 날이다", () => {
    // 2026-03-02 = 월요일
    const dates = getWeekDates("2026-03-02");
    expect(dates[0]).toBe("2026-03-02");
  });

  it("날짜가 오름차순으로 나열된다", () => {
    const dates = getWeekDates("2026-03-04");
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] > dates[i - 1]).toBe(true);
    }
  });

  it("모든 날짜가 YYYY-MM-DD 형식이다", () => {
    const dates = getWeekDates("2026-03-04");
    dates.forEach((d) => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("baseDate 없이 호출해도 7개 날짜를 반환한다", () => {
    const dates = getWeekDates();
    expect(dates).toHaveLength(7);
  });

  it("월 경계를 올바르게 처리한다 (2월 말)", () => {
    // 2026-03-01 = 일요일 → 해당 주 월요일 = 2026-02-23
    const dates = getWeekDates("2026-03-01");
    expect(dates[0]).toBe("2026-02-23");
    expect(dates[6]).toBe("2026-03-01");
  });
});

// ============================================================
// BOOKING_STATUS_LIST 상수 테스트
// ============================================================

describe("BOOKING_STATUS_LIST - 예약 상태 목록", () => {
  it("4개 상태가 있다", () => {
    expect(BOOKING_STATUS_LIST).toHaveLength(4);
  });

  it("'예약됨' 상태가 포함된다", () => {
    expect(BOOKING_STATUS_LIST).toContain("예약됨");
  });

  it("'확정됨' 상태가 포함된다", () => {
    expect(BOOKING_STATUS_LIST).toContain("확정됨");
  });

  it("'취소됨' 상태가 포함된다", () => {
    expect(BOOKING_STATUS_LIST).toContain("취소됨");
  });

  it("'완료됨' 상태가 포함된다", () => {
    expect(BOOKING_STATUS_LIST).toContain("완료됨");
  });
});

// ============================================================
// BOOKING_STATUS_COLORS 상수 테스트
// ============================================================

describe("BOOKING_STATUS_COLORS - 예약 상태 색상", () => {
  it("4개 상태 모두 색상이 정의된다", () => {
    expect(Object.keys(BOOKING_STATUS_COLORS)).toHaveLength(4);
  });

  it("각 상태에 bg, text, badge 속성이 있다", () => {
    BOOKING_STATUS_LIST.forEach((status) => {
      const colors = BOOKING_STATUS_COLORS[status];
      expect(colors.bg).toBeDefined();
      expect(colors.text).toBeDefined();
      expect(colors.badge).toBeDefined();
    });
  });
});

// ============================================================
// usePracticeRoomBooking - 초기 상태
// ============================================================

describe("usePracticeRoomBooking - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("초기 rooms는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.rooms).toEqual([]);
  });

  it("초기 bookings는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.bookings).toEqual([]);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalCount).toBe(0);
  });

  it("초기 stats.activeCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.activeCount).toBe(0);
  });

  it("초기 stats.mostUsedRoom은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.mostUsedRoom).toBeNull();
  });

  it("필요한 함수가 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addRoom).toBe("function");
    expect(typeof result.current.updateRoom).toBe("function");
    expect(typeof result.current.deleteRoom).toBe("function");
    expect(typeof result.current.addBooking).toBe("function");
    expect(typeof result.current.updateBooking).toBe("function");
    expect(typeof result.current.deleteBooking).toBe("function");
    expect(typeof result.current.changeBookingStatus).toBe("function");
    expect(typeof result.current.findConflicts).toBe("function");
    expect(typeof result.current.getBookingsByDateRange).toBe("function");
    expect(typeof result.current.getBookingsByRoom).toBe("function");
    expect(typeof result.current.getRoomById).toBe("function");
  });
});

// ============================================================
// usePracticeRoomBooking - 연습실 CRUD
// ============================================================

describe("usePracticeRoomBooking - addRoom", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("연습실 추가 후 rooms 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRoom(makeRoomParams()); });
    expect(result.current.rooms).toHaveLength(1);
  });

  it("추가된 연습실에 id가 부여된다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    expect(room!.id).toBeDefined();
  });

  it("추가된 연습실에 createdAt이 설정된다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    expect(room!.createdAt).toBeDefined();
  });

  it("추가 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRoom(makeRoomParams()); });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("연습실 이름이 올바르게 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRoom(makeRoomParams({ name: "대연습실" })); });
    expect(result.current.rooms[0].name).toBe("대연습실");
  });
});

describe("usePracticeRoomBooking - updateRoom", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("연습실 수정 시 true를 반환한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    let returned: boolean;
    act(() => { returned = result.current.updateRoom(room!.id, { name: "새 이름" }); });
    expect(returned!).toBe(true);
  });

  it("연습실 수정 후 이름이 변경된다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams({ name: "원래 이름" })); });
    act(() => { result.current.updateRoom(room!.id, { name: "새 이름" }); });
    expect(result.current.rooms[0].name).toBe("새 이름");
  });

  it("존재하지 않는 id 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let returned: boolean;
    act(() => { returned = result.current.updateRoom("non-existent", { name: "이름" }); });
    expect(returned!).toBe(false);
  });
});

describe("usePracticeRoomBooking - deleteRoom", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("연습실 삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    let returned: boolean;
    act(() => { returned = result.current.deleteRoom(room!.id); });
    expect(returned!).toBe(true);
  });

  it("삭제 후 rooms 길이가 감소한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    act(() => { result.current.deleteRoom(room!.id); });
    expect(result.current.rooms).toHaveLength(0);
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let returned: boolean;
    act(() => { returned = result.current.deleteRoom("non-existent"); });
    expect(returned!).toBe(false);
  });

  it("연습실 삭제 시 관련 예약도 함께 삭제된다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id)); });
    expect(result.current.bookings).toHaveLength(1);

    act(() => { result.current.deleteRoom(room!.id); });
    expect(result.current.bookings).toHaveLength(0);
  });
});

// ============================================================
// usePracticeRoomBooking - 예약 CRUD
// ============================================================

describe("usePracticeRoomBooking - addBooking", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("예약 추가 시 PracticeRoomBooking을 반환한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    let booking: PracticeRoomBooking | null;
    act(() => { booking = result.current.addBooking(makeBookingParams(room!.id)); });
    expect(booking).not.toBeNull();
  });

  it("예약 추가 후 bookings 길이가 1이 된다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id)); });
    expect(result.current.bookings).toHaveLength(1);
  });

  it("시간 충돌 시 null을 반환한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    // 첫 번째 예약: 10:00~12:00
    act(() => {
      result.current.addBooking(
        makeBookingParams(room!.id, { startTime: "10:00", endTime: "12:00" })
      );
    });
    // 두 번째 예약: 11:00~13:00 (충돌)
    let booking: PracticeRoomBooking | null;
    act(() => {
      booking = result.current.addBooking(
        makeBookingParams(room!.id, { startTime: "11:00", endTime: "13:00" })
      );
    });
    expect(booking!).toBeNull();
  });

  it("다른 날짜의 같은 시간 예약은 충돌하지 않는다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    act(() => {
      result.current.addBooking(
        makeBookingParams(room!.id, { date: "2026-03-01", startTime: "10:00", endTime: "12:00" })
      );
    });
    let booking: PracticeRoomBooking | null;
    act(() => {
      booking = result.current.addBooking(
        makeBookingParams(room!.id, { date: "2026-03-02", startTime: "10:00", endTime: "12:00" })
      );
    });
    expect(booking).not.toBeNull();
    expect(result.current.bookings).toHaveLength(2);
  });

  it("취소된 예약은 충돌 판정에서 제외된다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    let b1: PracticeRoomBooking | null;
    act(() => {
      b1 = result.current.addBooking(
        makeBookingParams(room!.id, { startTime: "10:00", endTime: "12:00" })
      );
    });
    act(() => { result.current.changeBookingStatus(b1!.id, "취소됨"); });

    let b2: PracticeRoomBooking | null;
    act(() => {
      b2 = result.current.addBooking(
        makeBookingParams(room!.id, { startTime: "10:00", endTime: "12:00" })
      );
    });
    expect(b2).not.toBeNull();
  });
});

describe("usePracticeRoomBooking - updateBooking", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("예약 수정 시 true를 반환한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    let booking: PracticeRoomBooking | null;
    act(() => { booking = result.current.addBooking(makeBookingParams(room!.id)); });
    let returned: boolean;
    act(() => { returned = result.current.updateBooking(booking!.id, { status: "확정됨" }); });
    expect(returned!).toBe(true);
  });

  it("존재하지 않는 예약 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let returned: boolean;
    act(() => { returned = result.current.updateBooking("non-existent", { status: "확정됨" }); });
    expect(returned!).toBe(false);
  });
});

describe("usePracticeRoomBooking - deleteBooking", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("예약 삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    let booking: PracticeRoomBooking | null;
    act(() => { booking = result.current.addBooking(makeBookingParams(room!.id)); });
    let returned: boolean;
    act(() => { returned = result.current.deleteBooking(booking!.id); });
    expect(returned!).toBe(true);
  });

  it("삭제 후 bookings 길이가 감소한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    let booking: PracticeRoomBooking | null;
    act(() => { booking = result.current.addBooking(makeBookingParams(room!.id)); });
    act(() => { result.current.deleteBooking(booking!.id); });
    expect(result.current.bookings).toHaveLength(0);
  });

  it("존재하지 않는 예약 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let returned: boolean;
    act(() => { returned = result.current.deleteBooking("non-existent"); });
    expect(returned!).toBe(false);
  });
});

// ============================================================
// usePracticeRoomBooking - 조회 헬퍼
// ============================================================

describe("usePracticeRoomBooking - getBookingsByDateRange", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("날짜 범위 내 예약만 반환한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-01" })); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-05", startTime: "14:00", endTime: "16:00" })); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-10", startTime: "09:00", endTime: "10:00" })); });
    const found = result.current.getBookingsByDateRange("2026-03-01", "2026-03-07");
    expect(found).toHaveLength(2);
  });

  it("범위 경계 날짜를 포함한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-01" })); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-07", startTime: "14:00", endTime: "16:00" })); });
    const found = result.current.getBookingsByDateRange("2026-03-01", "2026-03-07");
    expect(found).toHaveLength(2);
  });

  it("반환된 예약은 날짜/시간 오름차순으로 정렬된다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-03", startTime: "10:00" })); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-01", startTime: "14:00" })); });
    const found = result.current.getBookingsByDateRange("2026-03-01", "2026-03-07");
    expect(found[0].date).toBe("2026-03-01");
    expect(found[1].date).toBe("2026-03-03");
  });
});

describe("usePracticeRoomBooking - getBookingsByRoom", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("특정 연습실 예약만 반환한다", () => {
    const { result } = makeHook();
    let roomA: PracticeRoom, roomB: PracticeRoom;
    act(() => { roomA = result.current.addRoom(makeRoomParams({ name: "A실" })); });
    act(() => { roomB = result.current.addRoom(makeRoomParams({ name: "B실" })); });
    act(() => { result.current.addBooking(makeBookingParams(roomA!.id, { date: "2026-03-01" })); });
    act(() => { result.current.addBooking(makeBookingParams(roomB!.id, { date: "2026-03-01", startTime: "14:00", endTime: "16:00" })); });
    act(() => { result.current.addBooking(makeBookingParams(roomA!.id, { date: "2026-03-02", startTime: "09:00", endTime: "11:00" })); });
    const found = result.current.getBookingsByRoom(roomA!.id);
    expect(found).toHaveLength(2);
    found.forEach((b) => expect(b.roomId).toBe(roomA!.id));
  });
});

describe("usePracticeRoomBooking - getRoomById", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("존재하는 연습실을 반환한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams({ name: "특별실" })); });
    const found = result.current.getRoomById(room!.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe("특별실");
  });

  it("존재하지 않는 id면 undefined를 반환한다", () => {
    const { result } = makeHook();
    const found = result.current.getRoomById("non-existent");
    expect(found).toBeUndefined();
  });
});

// ============================================================
// usePracticeRoomBooking - findConflicts
// ============================================================

describe("usePracticeRoomBooking - findConflicts 충돌 감지", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
  });

  it("겹치지 않는 시간 예약은 충돌을 반환하지 않는다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    act(() => {
      result.current.addBooking(makeBookingParams(room!.id, { startTime: "10:00", endTime: "12:00" }));
    });
    const conflicts = result.current.findConflicts(room!.id, "2026-03-01", "14:00", "16:00");
    expect(conflicts).toHaveLength(0);
  });

  it("겹치는 시간 예약은 충돌을 반환한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    act(() => {
      result.current.addBooking(makeBookingParams(room!.id, { startTime: "10:00", endTime: "12:00" }));
    });
    const conflicts = result.current.findConflicts(room!.id, "2026-03-01", "11:00", "13:00");
    expect(conflicts).toHaveLength(1);
  });

  it("excludeId로 자기 자신은 충돌에서 제외된다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    let booking: PracticeRoomBooking | null;
    act(() => {
      booking = result.current.addBooking(makeBookingParams(room!.id, { startTime: "10:00", endTime: "12:00" }));
    });
    const conflicts = result.current.findConflicts(
      room!.id, "2026-03-01", "10:00", "12:00", booking!.id
    );
    expect(conflicts).toHaveLength(0);
  });

  it("다른 연습실의 예약은 충돌하지 않는다", () => {
    const { result } = makeHook();
    let roomA: PracticeRoom, roomB: PracticeRoom;
    act(() => {
      roomA = result.current.addRoom(makeRoomParams({ name: "A실" }));
      roomB = result.current.addRoom(makeRoomParams({ name: "B실" }));
    });
    act(() => {
      result.current.addBooking(makeBookingParams(roomA!.id, { startTime: "10:00", endTime: "12:00" }));
    });
    // B실에 대한 충돌 검사 → A실 예약은 충돌 없음
    const conflicts = result.current.findConflicts(roomB!.id, "2026-03-01", "10:00", "12:00");
    expect(conflicts).toHaveLength(0);
  });
});

// ============================================================
// usePracticeRoomBooking - stats 통계
// ============================================================

describe("usePracticeRoomBooking - stats 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
    initStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-04T12:00:00")); // 수요일
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stats.totalCount가 전체 예약 수와 일치한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-04" })); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-05", startTime: "14:00", endTime: "16:00" })); });
    expect(result.current.stats.totalCount).toBe(2);
  });

  it("stats.activeCount는 예약됨+확정됨만 포함한다", () => {
    const { result } = makeHook();
    let room: PracticeRoom;
    act(() => { room = result.current.addRoom(makeRoomParams()); });
    let b1: PracticeRoomBooking | null;
    act(() => { b1 = result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-04", status: "예약됨" })); });
    act(() => { result.current.addBooking(makeBookingParams(room!.id, { date: "2026-03-05", startTime: "14:00", endTime: "16:00", status: "예약됨" })); });
    act(() => { result.current.changeBookingStatus(b1!.id, "취소됨"); });
    // b2만 활성
    expect(result.current.stats.activeCount).toBe(1);
  });

  it("가장 많이 사용된 연습실이 mostUsedRoom에 반영된다", () => {
    const { result } = makeHook();
    let roomA: PracticeRoom, roomB: PracticeRoom;
    act(() => { roomA = result.current.addRoom(makeRoomParams({ name: "A실" })); });
    act(() => { roomB = result.current.addRoom(makeRoomParams({ name: "B실" })); });
    act(() => { result.current.addBooking(makeBookingParams(roomA!.id, { date: "2026-03-04" })); });
    act(() => { result.current.addBooking(makeBookingParams(roomA!.id, { date: "2026-03-05", startTime: "14:00", endTime: "16:00" })); });
    act(() => { result.current.addBooking(makeBookingParams(roomB!.id, { date: "2026-03-06", startTime: "10:00", endTime: "11:00" })); });
    expect(result.current.stats.mostUsedRoom?.name).toBe("A실");
  });
});
