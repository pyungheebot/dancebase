import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useWeeklyTimetable,
  hasTimeOverlap,
  SLOT_TYPE_COLORS,
  SLOT_TYPE_LABELS,
} from "@/hooks/use-weekly-timetable";
import type { TimetableSlot, TimetableDay } from "@/types";

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

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    weeklyTimetable: (id: string) => `weekly-timetable-${id}`,
  },
}));

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeSlotInput(
  overrides: Partial<Omit<TimetableSlot, "id">> = {}
): Omit<TimetableSlot, "id"> {
  return {
    day: "mon" as TimetableDay,
    startTime: "10:00",
    endTime: "12:00",
    type: "practice",
    title: "연습",
    location: "연습실",
    color: "#3B82F6",
    note: "",
    ...overrides,
  };
}

function makeHook(groupId = "group-1") {
  return renderHook(() => useWeeklyTimetable(groupId));
}

// ============================================================
// SLOT_TYPE_COLORS 상수 테스트
// ============================================================

describe("SLOT_TYPE_COLORS - 슬롯 타입별 색상", () => {
  it("practice 색상이 정의되어 있다", () => {
    expect(SLOT_TYPE_COLORS.practice).toBeDefined();
    expect(typeof SLOT_TYPE_COLORS.practice).toBe("string");
  });

  it("personal 색상이 정의되어 있다", () => {
    expect(SLOT_TYPE_COLORS.personal).toBeDefined();
  });

  it("meeting 색상이 정의되어 있다", () => {
    expect(SLOT_TYPE_COLORS.meeting).toBeDefined();
  });

  it("performance 색상이 정의되어 있다", () => {
    expect(SLOT_TYPE_COLORS.performance).toBeDefined();
  });

  it("rest 색상이 정의되어 있다", () => {
    expect(SLOT_TYPE_COLORS.rest).toBeDefined();
  });

  it("other 색상이 정의되어 있다", () => {
    expect(SLOT_TYPE_COLORS.other).toBeDefined();
  });

  it("6가지 타입의 색상이 모두 정의되어 있다", () => {
    expect(Object.keys(SLOT_TYPE_COLORS)).toHaveLength(6);
  });

  it("모든 색상값은 # 으로 시작하는 hex 코드이다", () => {
    Object.values(SLOT_TYPE_COLORS).forEach((color) => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

// ============================================================
// SLOT_TYPE_LABELS 상수 테스트
// ============================================================

describe("SLOT_TYPE_LABELS - 슬롯 타입별 레이블", () => {
  it("practice 레이블은 '단체연습'이다", () => {
    expect(SLOT_TYPE_LABELS.practice).toBe("단체연습");
  });

  it("personal 레이블은 '개인연습'이다", () => {
    expect(SLOT_TYPE_LABELS.personal).toBe("개인연습");
  });

  it("meeting 레이블은 '미팅'이다", () => {
    expect(SLOT_TYPE_LABELS.meeting).toBe("미팅");
  });

  it("performance 레이블은 '공연'이다", () => {
    expect(SLOT_TYPE_LABELS.performance).toBe("공연");
  });

  it("rest 레이블은 '휴식'이다", () => {
    expect(SLOT_TYPE_LABELS.rest).toBe("휴식");
  });

  it("other 레이블은 '기타'이다", () => {
    expect(SLOT_TYPE_LABELS.other).toBe("기타");
  });

  it("6가지 타입의 레이블이 모두 정의되어 있다", () => {
    expect(Object.keys(SLOT_TYPE_LABELS)).toHaveLength(6);
  });
});

// ============================================================
// hasTimeOverlap 순수 함수 테스트
// ============================================================

describe("hasTimeOverlap - 시간 겹침 감지", () => {
  it("완전히 겹치는 두 슬롯은 true를 반환한다", () => {
    const a = { startTime: "10:00", endTime: "12:00" };
    const b = { startTime: "10:00", endTime: "12:00" };
    expect(hasTimeOverlap(a, b)).toBe(true);
  });

  it("부분적으로 겹치는 슬롯은 true를 반환한다", () => {
    const a = { startTime: "10:00", endTime: "12:00" };
    const b = { startTime: "11:00", endTime: "13:00" };
    expect(hasTimeOverlap(a, b)).toBe(true);
  });

  it("겹치지 않는 슬롯은 false를 반환한다", () => {
    const a = { startTime: "10:00", endTime: "12:00" };
    const b = { startTime: "13:00", endTime: "14:00" };
    expect(hasTimeOverlap(a, b)).toBe(false);
  });

  it("연속하는 슬롯 (a가 끝나고 b가 시작)은 false를 반환한다", () => {
    // a ends at 12:00, b starts at 12:00 → aStart < bEnd (10 < 840), bStart < aEnd (720 < 720) → false
    const a = { startTime: "10:00", endTime: "12:00" };
    const b = { startTime: "12:00", endTime: "14:00" };
    expect(hasTimeOverlap(a, b)).toBe(false);
  });

  it("b가 a 안에 완전히 포함되면 true를 반환한다", () => {
    const a = { startTime: "09:00", endTime: "18:00" };
    const b = { startTime: "10:00", endTime: "12:00" };
    expect(hasTimeOverlap(a, b)).toBe(true);
  });

  it("a가 b보다 먼저 끝나고 겹치지 않으면 false를 반환한다", () => {
    const a = { startTime: "08:00", endTime: "09:00" };
    const b = { startTime: "10:00", endTime: "11:00" };
    expect(hasTimeOverlap(a, b)).toBe(false);
  });

  it("1분 겹침도 true를 반환한다", () => {
    const a = { startTime: "10:00", endTime: "11:01" };
    const b = { startTime: "11:00", endTime: "12:00" };
    expect(hasTimeOverlap(a, b)).toBe(true);
  });

  it("자정을 포함한 슬롯도 올바르게 처리한다", () => {
    const a = { startTime: "00:00", endTime: "01:00" };
    const b = { startTime: "00:30", endTime: "01:30" };
    expect(hasTimeOverlap(a, b)).toBe(true);
  });
});

// ============================================================
// useWeeklyTimetable - 초기 상태
// ============================================================

describe("useWeeklyTimetable - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("초기 slots는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.slots).toEqual([]);
  });

  it("addSlot, updateSlot, deleteSlot, getSlotsByDay, checkConflict, refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addSlot).toBe("function");
    expect(typeof result.current.updateSlot).toBe("function");
    expect(typeof result.current.deleteSlot).toBe("function");
    expect(typeof result.current.getSlotsByDay).toBe("function");
    expect(typeof result.current.checkConflict).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useWeeklyTimetable - addSlot
// ============================================================

describe("useWeeklyTimetable - addSlot 슬롯 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("슬롯 추가 시 slots 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput());
    });
    expect(result.current.slots).toHaveLength(1);
  });

  it("추가된 슬롯에 id가 부여된다", () => {
    const { result } = makeHook();
    let outcome: { ok: boolean; conflict?: TimetableSlot };
    act(() => {
      outcome = result.current.addSlot(makeSlotInput());
    });
    expect(outcome!.ok).toBe(true);
    expect(result.current.slots[0].id).toBeDefined();
  });

  it("슬롯 추가 시 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput());
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("겹치는 시간대에 슬롯을 추가하면 ok가 false이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "10:00", endTime: "12:00" }));
    });
    let outcome: { ok: boolean; conflict?: TimetableSlot };
    act(() => {
      outcome = result.current.addSlot(
        makeSlotInput({ day: "mon", startTime: "11:00", endTime: "13:00" })
      );
    });
    expect(outcome!.ok).toBe(false);
    expect(outcome!.conflict).toBeDefined();
  });

  it("다른 요일의 같은 시간대는 겹침으로 처리되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "10:00", endTime: "12:00" }));
    });
    let outcome: { ok: boolean };
    act(() => {
      outcome = result.current.addSlot(
        makeSlotInput({ day: "tue", startTime: "10:00", endTime: "12:00" })
      );
    });
    expect(outcome!.ok).toBe(true);
    expect(result.current.slots).toHaveLength(2);
  });

  it("연속하는 시간대는 겹침으로 처리되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "10:00", endTime: "12:00" }));
    });
    let outcome: { ok: boolean };
    act(() => {
      outcome = result.current.addSlot(
        makeSlotInput({ day: "mon", startTime: "12:00", endTime: "14:00" })
      );
    });
    expect(outcome!.ok).toBe(true);
  });
});

// ============================================================
// useWeeklyTimetable - updateSlot
// ============================================================

describe("useWeeklyTimetable - updateSlot 슬롯 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("슬롯 수정 시 title이 변경된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ title: "원래 제목" }));
    });
    const id = result.current.slots[0].id;
    act(() => {
      result.current.updateSlot(id, { title: "새 제목" });
    });
    expect(result.current.slots[0].title).toBe("새 제목");
  });

  it("존재하지 않는 id 수정 시 ok가 false이다", () => {
    const { result } = makeHook();
    let outcome: { ok: boolean };
    act(() => {
      outcome = result.current.updateSlot("non-existent-id", { title: "변경" });
    });
    expect(outcome!.ok).toBe(false);
  });

  it("겹치는 시간대로 수정하면 ok가 false이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "10:00", endTime: "12:00" }));
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "13:00", endTime: "15:00" }));
    });
    const id = result.current.slots[1].id;
    let outcome: { ok: boolean; conflict?: TimetableSlot };
    act(() => {
      outcome = result.current.updateSlot(id, { startTime: "11:00", endTime: "14:00" });
    });
    expect(outcome!.ok).toBe(false);
    expect(outcome!.conflict).toBeDefined();
  });

  it("자기 자신과의 겹침은 충돌로 처리되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "10:00", endTime: "12:00" }));
    });
    const id = result.current.slots[0].id;
    let outcome: { ok: boolean };
    act(() => {
      outcome = result.current.updateSlot(id, { title: "수정만" });
    });
    expect(outcome!.ok).toBe(true);
  });

  it("슬롯 수정 시 다른 필드는 유지된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ title: "연습", type: "practice", location: "연습실" }));
    });
    const id = result.current.slots[0].id;
    act(() => {
      result.current.updateSlot(id, { title: "공연 연습" });
    });
    expect(result.current.slots[0].type).toBe("practice");
    expect(result.current.slots[0].location).toBe("연습실");
  });
});

// ============================================================
// useWeeklyTimetable - deleteSlot
// ============================================================

describe("useWeeklyTimetable - deleteSlot 슬롯 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("슬롯 삭제 시 slots 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput());
    });
    const id = result.current.slots[0].id;
    act(() => {
      result.current.deleteSlot(id);
    });
    expect(result.current.slots).toHaveLength(0);
  });

  it("특정 슬롯만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", title: "슬롯1" }));
      result.current.addSlot(makeSlotInput({ day: "tue", title: "슬롯2" }));
    });
    const id = result.current.slots[0].id;
    act(() => {
      result.current.deleteSlot(id);
    });
    expect(result.current.slots).toHaveLength(1);
    expect(result.current.slots[0].title).toBe("슬롯2");
  });

  it("삭제 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput());
    });
    const id = result.current.slots[0].id;
    let result2: boolean;
    act(() => {
      result2 = result.current.deleteSlot(id);
    });
    expect(result2!).toBe(true);
  });

  it("삭제 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput());
    });
    localStorageMock.setItem.mockClear();
    const id = result.current.slots[0].id;
    act(() => {
      result.current.deleteSlot(id);
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================
// useWeeklyTimetable - getSlotsByDay
// ============================================================

describe("useWeeklyTimetable - getSlotsByDay 요일별 조회", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("해당 요일의 슬롯만 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon" }));
      result.current.addSlot(makeSlotInput({ day: "tue" }));
    });
    const monSlots = result.current.getSlotsByDay("mon");
    expect(monSlots).toHaveLength(1);
    expect(monSlots[0].day).toBe("mon");
  });

  it("해당 요일에 슬롯이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon" }));
    });
    const wedSlots = result.current.getSlotsByDay("wed");
    expect(wedSlots).toHaveLength(0);
  });

  it("같은 요일의 슬롯은 startTime 오름차순으로 정렬된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "14:00", endTime: "16:00" }));
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "09:00", endTime: "10:00" }));
    });
    const monSlots = result.current.getSlotsByDay("mon");
    expect(monSlots[0].startTime).toBe("09:00");
    expect(monSlots[1].startTime).toBe("14:00");
  });
});

// ============================================================
// useWeeklyTimetable - checkConflict
// ============================================================

describe("useWeeklyTimetable - checkConflict 충돌 검사", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("겹치는 슬롯이 있으면 해당 슬롯을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "10:00", endTime: "12:00" }));
    });
    const conflict = result.current.checkConflict("mon", "11:00", "13:00");
    expect(conflict).not.toBeNull();
  });

  it("겹치는 슬롯이 없으면 null을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "10:00", endTime: "12:00" }));
    });
    const conflict = result.current.checkConflict("mon", "13:00", "15:00");
    expect(conflict).toBeNull();
  });

  it("excludeId로 자기 자신을 제외한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "10:00", endTime: "12:00" }));
    });
    const id = result.current.slots[0].id;
    const conflict = result.current.checkConflict("mon", "10:00", "12:00", id);
    expect(conflict).toBeNull();
  });

  it("다른 요일의 슬롯은 충돌로 간주하지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSlot(makeSlotInput({ day: "mon", startTime: "10:00", endTime: "12:00" }));
    });
    const conflict = result.current.checkConflict("tue", "10:00", "12:00");
    expect(conflict).toBeNull();
  });
});

// ============================================================
// 그룹별 격리 (다른 groupId는 다른 저장소 키 사용)
// ============================================================

describe("useWeeklyTimetable - 그룹별 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("다른 groupId의 슬롯은 독립적으로 관리된다", () => {
    const { result: r1 } = renderHook(() => useWeeklyTimetable("group-A"));
    const { result: r2 } = renderHook(() => useWeeklyTimetable("group-B"));

    act(() => {
      r1.current.addSlot(makeSlotInput({ title: "A 그룹 연습" }));
    });

    expect(r1.current.slots).toHaveLength(1);
    expect(r2.current.slots).toHaveLength(0);
  });
});
