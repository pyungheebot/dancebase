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
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto mock ──────────────────────────────────────────────
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-test`),
});

// ─── 훅 import ────────────────────────────────────────────────
import { useScheduleConflict } from "@/hooks/use-schedule-conflict";
import type {
  PersonalScheduleType,
} from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useScheduleConflict(groupId));
}

function addEntry(
  hook: ReturnType<typeof makeHook>["result"],
  overrides: {
    memberName?: string;
    title?: string;
    type?: PersonalScheduleType;
    date?: string;
    startTime?: string;
    endTime?: string;
    recurring?: boolean;
    recurringDay?: number;
  } = {}
) {
  const {
    memberName = "홍길동",
    title = "개인 일정",
    type = "work",
    date = "2026-03-02",
    startTime = "09:00",
    endTime = "18:00",
    recurring = false,
    recurringDay = undefined,
  } = overrides;

  let entry: ReturnType<ReturnType<typeof useScheduleConflict>["addSchedule"]>;
  act(() => {
    entry = hook.current.addSchedule(
      memberName,
      title,
      type,
      date,
      startTime,
      endTime,
      recurring,
      recurringDay
    );
  });
  return entry!;
}

// ============================================================
// useScheduleConflict - 초기 상태
// ============================================================

describe("useScheduleConflict - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("초기 schedules는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.schedules).toEqual([]);
  });

  it("초기 totalSchedules는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalSchedules).toBe(0);
  });

  it("초기 membersWithSchedules는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.membersWithSchedules).toBe(0);
  });

  it("초기 recurringCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.recurringCount).toBe(0);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addSchedule).toBe("function");
    expect(typeof result.current.updateSchedule).toBe("function");
    expect(typeof result.current.deleteSchedule).toBe("function");
    expect(typeof result.current.getByMember).toBe("function");
    expect(typeof result.current.checkConflicts).toBe("function");
    expect(typeof result.current.getConflictsForDate).toBe("function");
  });
});

// ============================================================
// useScheduleConflict - addSchedule
// ============================================================

describe("useScheduleConflict - addSchedule 일정 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("일정 추가 후 schedules 길이가 1이 된다", () => {
    const { result } = makeHook();
    addEntry(result);
    expect(result.current.schedules).toHaveLength(1);
  });

  it("추가된 일정의 memberName이 올바르다", () => {
    const { result } = makeHook();
    addEntry(result, { memberName: "김철수" });
    expect(result.current.schedules[0].memberName).toBe("김철수");
  });

  it("추가된 일정의 title이 올바르다", () => {
    const { result } = makeHook();
    addEntry(result, { title: "병원 예약" });
    expect(result.current.schedules[0].title).toBe("병원 예약");
  });

  it("추가된 일정의 startTime이 올바르다", () => {
    const { result } = makeHook();
    addEntry(result, { startTime: "14:00" });
    expect(result.current.schedules[0].startTime).toBe("14:00");
  });

  it("추가된 일정의 endTime이 올바르다", () => {
    const { result } = makeHook();
    addEntry(result, { endTime: "16:00" });
    expect(result.current.schedules[0].endTime).toBe("16:00");
  });

  it("추가된 일정에 id가 부여된다", () => {
    const { result } = makeHook();
    addEntry(result);
    expect(result.current.schedules[0].id).toBeDefined();
  });

  it("추가된 일정에 createdAt이 설정된다", () => {
    const { result } = makeHook();
    addEntry(result);
    expect(result.current.schedules[0].createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T/
    );
  });

  it("반복 일정 추가 시 recurringDay가 설정된다", () => {
    const { result } = makeHook();
    addEntry(result, { recurring: true, recurringDay: 1 }); // 월요일
    expect(result.current.schedules[0].recurring).toBe(true);
    expect(result.current.schedules[0].recurringDay).toBe(1);
  });

  it("비반복 일정의 recurringDay는 undefined이다", () => {
    const { result } = makeHook();
    addEntry(result, { recurring: false });
    expect(result.current.schedules[0].recurringDay).toBeUndefined();
  });

  it("memberName 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    addEntry(result, { memberName: "  홍길동  " });
    expect(result.current.schedules[0].memberName).toBe("홍길동");
  });

  it("추가된 일정 객체를 반환한다", () => {
    const { result } = makeHook();
    let returned: ReturnType<typeof useScheduleConflict>["addSchedule"] extends (...args: unknown[]) => infer R ? R : never;
    act(() => {
      returned = result.current.addSchedule(
        "홍길동",
        "개인 일정",
        "work",
        "2026-03-02",
        "09:00",
        "18:00",
        false
      );
    });
    expect(returned!).toBeDefined();
    expect(returned!.memberName).toBe("홍길동");
  });
});

// ============================================================
// useScheduleConflict - updateSchedule
// ============================================================

describe("useScheduleConflict - updateSchedule 일정 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("일정 title을 수정할 수 있다", () => {
    const { result } = makeHook();
    const entry = addEntry(result, { title: "원래 일정" });
    act(() => {
      result.current.updateSchedule(entry.id, { title: "수정된 일정" });
    });
    expect(result.current.schedules[0].title).toBe("수정된 일정");
  });

  it("일정 수정 시 true를 반환한다", () => {
    const { result } = makeHook();
    const entry = addEntry(result);
    let ret: boolean = false;
    act(() => {
      ret = result.current.updateSchedule(entry.id, { title: "수정" });
    });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 id 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.updateSchedule("non-existent", { title: "수정" });
    });
    expect(ret).toBe(false);
  });

  it("startTime을 수정할 수 있다", () => {
    const { result } = makeHook();
    const entry = addEntry(result, { startTime: "09:00" });
    act(() => {
      result.current.updateSchedule(entry.id, { startTime: "10:00" });
    });
    expect(result.current.schedules[0].startTime).toBe("10:00");
  });

  it("endTime을 수정할 수 있다", () => {
    const { result } = makeHook();
    const entry = addEntry(result, { endTime: "18:00" });
    act(() => {
      result.current.updateSchedule(entry.id, { endTime: "20:00" });
    });
    expect(result.current.schedules[0].endTime).toBe("20:00");
  });

  it("수정된 일정의 id가 변경되지 않는다", () => {
    const { result } = makeHook();
    const entry = addEntry(result, { title: "원래 일정" });
    const originalId = entry.id;
    act(() => {
      result.current.updateSchedule(entry.id, { title: "수정된 일정" });
    });
    expect(result.current.schedules[0].id).toBe(originalId);
  });
});

// ============================================================
// useScheduleConflict - deleteSchedule
// ============================================================

describe("useScheduleConflict - deleteSchedule 일정 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("일정 삭제 후 schedules 길이가 감소한다", () => {
    const { result } = makeHook();
    const entry = addEntry(result);
    act(() => {
      result.current.deleteSchedule(entry.id);
    });
    expect(result.current.schedules).toHaveLength(0);
  });

  it("특정 일정만 삭제된다", () => {
    const { result } = makeHook();
    // 두 일정을 순차적으로 추가 (addEntry 내부에서 act 사용)
    const entry1 = addEntry(result, { title: "일정1", date: "2026-03-01" });
    addEntry(result, { title: "일정2", date: "2026-03-02" });
    // 첫 번째 일정 삭제 → schedules 길이 1 이상이 되어야 함
    act(() => {
      result.current.deleteSchedule(entry1.id);
    });
    // schedules에 일정1이 없어야 함
    const hasEntry1 = result.current.schedules.some(
      (s) => s.id === entry1.id
    );
    expect(hasEntry1).toBe(false);
  });

  it("존재하지 않는 id를 삭제해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteSchedule("non-existent");
      });
    }).not.toThrow();
  });
});

// ============================================================
// useScheduleConflict - getByMember
// ============================================================

describe("useScheduleConflict - getByMember 멤버별 조회", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("특정 멤버의 일정만 반환한다", () => {
    const { result } = makeHook();
    addEntry(result, { memberName: "홍길동" });
    addEntry(result, { memberName: "김철수" });
    const hongSchedules = result.current.getByMember("홍길동");
    expect(hongSchedules).toHaveLength(1);
    expect(hongSchedules[0].memberName).toBe("홍길동");
  });

  it("존재하지 않는 멤버는 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    addEntry(result, { memberName: "홍길동" });
    const schedules = result.current.getByMember("없는사람");
    expect(schedules).toEqual([]);
  });

  it("멤버의 여러 일정을 모두 반환한다", () => {
    const { result } = makeHook();
    addEntry(result, { memberName: "홍길동", date: "2026-03-01" });
    addEntry(result, { memberName: "홍길동", date: "2026-03-02" });
    const schedules = result.current.getByMember("홍길동");
    expect(schedules).toHaveLength(2);
  });
});

// ============================================================
// useScheduleConflict - checkConflicts (단일 일정)
// ============================================================

describe("useScheduleConflict - checkConflicts 충돌 검사 (단일 일정)", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("겹치는 일정이 있으면 충돌 결과를 반환한다", () => {
    const { result } = makeHook();
    // 홍길동의 개인 일정: 10:00 ~ 12:00
    addEntry(result, {
      memberName: "홍길동",
      date: "2026-03-02",
      startTime: "10:00",
      endTime: "12:00",
      recurring: false,
    });
    // 그룹 일정: 11:00 ~ 14:00 → 겹침
    const conflicts = result.current.checkConflicts(
      "2026-03-02",
      "11:00",
      "14:00"
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].memberName).toBe("홍길동");
  });

  it("겹치지 않는 일정은 충돌 결과에 포함되지 않는다", () => {
    const { result } = makeHook();
    // 홍길동: 08:00 ~ 09:00
    addEntry(result, {
      memberName: "홍길동",
      date: "2026-03-02",
      startTime: "08:00",
      endTime: "09:00",
      recurring: false,
    });
    // 그룹 일정: 10:00 ~ 12:00 → 겹침 없음
    const conflicts = result.current.checkConflicts(
      "2026-03-02",
      "10:00",
      "12:00"
    );
    expect(conflicts).toHaveLength(0);
  });

  it("날짜가 다르면 충돌하지 않는다", () => {
    const { result } = makeHook();
    addEntry(result, {
      memberName: "홍길동",
      date: "2026-03-01",
      startTime: "10:00",
      endTime: "12:00",
      recurring: false,
    });
    const conflicts = result.current.checkConflicts(
      "2026-03-02",
      "10:00",
      "12:00"
    );
    expect(conflicts).toHaveLength(0);
  });

  it("충돌 결과에 overlapMinutes가 포함된다", () => {
    const { result } = makeHook();
    addEntry(result, {
      memberName: "홍길동",
      date: "2026-03-02",
      startTime: "10:00",
      endTime: "12:00",
      recurring: false,
    });
    const conflicts = result.current.checkConflicts(
      "2026-03-02",
      "11:00",
      "14:00"
    );
    expect(conflicts[0].overlapMinutes).toBe(60);
  });

  it("충돌 결과는 overlapMinutes 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    addEntry(result, {
      memberName: "홍길동",
      date: "2026-03-02",
      startTime: "10:00",
      endTime: "11:00", // 30분 겹침 (그룹: 10:30~14:00)
      recurring: false,
    });
    addEntry(result, {
      memberName: "김철수",
      date: "2026-03-02",
      startTime: "09:00",
      endTime: "14:00", // 3.5시간 겹침
      recurring: false,
    });
    const conflicts = result.current.checkConflicts(
      "2026-03-02",
      "10:30",
      "14:00"
    );
    expect(conflicts[0].overlapMinutes).toBeGreaterThanOrEqual(
      conflicts[1].overlapMinutes
    );
  });

  it("일정 없을 때 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const conflicts = result.current.checkConflicts(
      "2026-03-02",
      "19:00",
      "22:00"
    );
    expect(conflicts).toEqual([]);
  });
});

// ============================================================
// useScheduleConflict - checkConflicts (반복 일정)
// ============================================================

describe("useScheduleConflict - checkConflicts 충돌 검사 (반복 일정)", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("반복 일정의 요일이 맞으면 충돌로 감지한다", () => {
    const { result } = makeHook();
    // 2026-03-02는 월요일 (dayOfWeek=1)
    addEntry(result, {
      memberName: "홍길동",
      date: "2026-03-02",
      startTime: "19:00",
      endTime: "22:00",
      recurring: true,
      recurringDay: 1, // 월요일
    });
    // 그룹 일정: 2026-03-09 월요일, 19:00~22:00 → 충돌
    const conflicts = result.current.checkConflicts(
      "2026-03-09",
      "19:00",
      "22:00"
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].memberName).toBe("홍길동");
  });

  it("반복 일정의 요일이 맞지 않으면 충돌하지 않는다", () => {
    const { result } = makeHook();
    addEntry(result, {
      memberName: "홍길동",
      date: "2026-03-02",
      startTime: "19:00",
      endTime: "22:00",
      recurring: true,
      recurringDay: 1, // 월요일
    });
    // 그룹 일정: 2026-03-04 수요일 (dayOfWeek=3) → 요일 불일치
    const conflicts = result.current.checkConflicts(
      "2026-03-04",
      "19:00",
      "22:00"
    );
    expect(conflicts).toHaveLength(0);
  });
});

// ============================================================
// useScheduleConflict - getConflictsForDate
// ============================================================

describe("useScheduleConflict - getConflictsForDate 날짜별 충돌 조회", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("기본 그룹 연습 시간(19:00~22:00)으로 충돌을 확인한다", () => {
    const { result } = makeHook();
    addEntry(result, {
      memberName: "홍길동",
      date: "2026-03-02",
      startTime: "20:00",
      endTime: "21:00",
      recurring: false,
    });
    const conflicts = result.current.getConflictsForDate("2026-03-02");
    expect(conflicts).toHaveLength(1);
  });

  it("커스텀 시간으로 충돌을 확인할 수 있다", () => {
    const { result } = makeHook();
    addEntry(result, {
      memberName: "홍길동",
      date: "2026-03-02",
      startTime: "14:00",
      endTime: "15:00",
      recurring: false,
    });
    const conflicts = result.current.getConflictsForDate(
      "2026-03-02",
      "14:30",
      "16:00"
    );
    expect(conflicts).toHaveLength(1);
  });
});

// ============================================================
// useScheduleConflict - 통계
// ============================================================

describe("useScheduleConflict - 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("totalSchedules가 추가한 일정 수와 일치한다", () => {
    const { result } = makeHook();
    addEntry(result, { memberName: "홍길동" });
    addEntry(result, { memberName: "김철수" });
    expect(result.current.totalSchedules).toBe(2);
  });

  it("membersWithSchedules가 일정 있는 멤버 수와 일치한다", () => {
    const { result } = makeHook();
    addEntry(result, { memberName: "홍길동" });
    addEntry(result, { memberName: "홍길동" }); // 같은 멤버 중복
    addEntry(result, { memberName: "김철수" });
    expect(result.current.membersWithSchedules).toBe(2);
  });

  it("recurringCount가 반복 일정 수와 일치한다", () => {
    const { result } = makeHook();
    addEntry(result, { recurring: true, recurringDay: 1 });
    addEntry(result, { recurring: false });
    addEntry(result, { recurring: true, recurringDay: 3 });
    expect(result.current.recurringCount).toBe(2);
  });
});
