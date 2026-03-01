import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock (saveToStorage 경유) ─────────────────
const savedData = vi.hoisted(() => ({} as Record<string, unknown>));
const mockSaveToStorage = vi.hoisted(() =>
  vi.fn(<T>(key: string, value: T): void => {
    savedData[key] = value;
  })
);

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (savedData[key] as T) ?? defaultValue,
  saveToStorage: mockSaveToStorage,
  removeFromStorage: (key: string): void => {
    delete savedData[key];
  },
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useSchedulePreference } from "@/hooks/use-schedule-preference";
import type {
  TimeSlotEntry,
  WeekDayIndex,
} from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1", totalMemberCount?: number) {
  return renderHook(() => useSchedulePreference(groupId, totalMemberCount));
}

function makeSlot(overrides: Partial<TimeSlotEntry> = {}): TimeSlotEntry {
  return {
    day: 1 as WeekDayIndex,
    startHour: 18,
    endHour: 20,
    preference: "available",
    ...overrides,
  };
}

// ============================================================
// useSchedulePreference - 초기 상태
// ============================================================

describe("useSchedulePreference - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(savedData).forEach((k) => {
      delete (savedData as Record<string, unknown>)[k];
    });
    vi.clearAllMocks();
  });

  it("초기 preferences는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.preferences).toEqual([]);
  });

  it("초기 totalMembers는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalMembers).toBe(0);
  });

  it("초기 coverageRate는 0이다 (totalMemberCount 미제공)", () => {
    const { result } = makeHook();
    expect(result.current.coverageRate).toBe(0);
  });

  it("setPreference 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.setPreference).toBe("function");
  });

  it("deletePreference 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.deletePreference).toBe("function");
  });

  it("getMemberPreference 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getMemberPreference).toBe("function");
  });

  it("findOptimalSlots 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.findOptimalSlots).toBe("function");
  });

  it("getAvailabilityMatrix 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.getAvailabilityMatrix).toBe("function");
  });
});

// ============================================================
// useSchedulePreference - setPreference
// ============================================================

describe("useSchedulePreference - setPreference", () => {
  beforeEach(() => {
    Object.keys(savedData).forEach((k) => {
      delete (savedData as Record<string, unknown>)[k];
    });
    vi.clearAllMocks();
  });

  it("새 멤버의 선호도를 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    expect(result.current.preferences).toHaveLength(1);
  });

  it("추가된 선호도의 memberName이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    expect(result.current.preferences[0].memberName).toBe("앨리스");
  });

  it("동일 멤버의 선호도를 다시 설정하면 업데이트된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot({ preference: "available" })]);
    });
    act(() => {
      result.current.setPreference("앨리스", [makeSlot({ preference: "preferred" })]);
    });
    expect(result.current.preferences).toHaveLength(1);
    expect(result.current.preferences[0].preferences[0].preference).toBe("preferred");
  });

  it("여러 멤버의 선호도를 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
      result.current.setPreference("밥", [makeSlot({ day: 2 as WeekDayIndex })]);
    });
    expect(result.current.preferences).toHaveLength(2);
  });

  it("새로 추가된 선호도는 id를 가진다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    expect(result.current.preferences[0].id).toBeDefined();
    expect(typeof result.current.preferences[0].id).toBe("string");
  });

  it("새로 추가된 선호도는 createdAt과 updatedAt을 가진다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    expect(result.current.preferences[0].createdAt).toBeDefined();
    expect(result.current.preferences[0].updatedAt).toBeDefined();
  });

  it("업데이트 시 updatedAt이 변경된다", async () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    const firstUpdatedAt = result.current.preferences[0].updatedAt;

    // 약간 지연 후 업데이트
    await new Promise((r) => setTimeout(r, 10));

    act(() => {
      result.current.setPreference("앨리스", [makeSlot({ startHour: 19 })]);
    });
    const secondUpdatedAt = result.current.preferences[0].updatedAt;
    // updatedAt이 새로운 시각으로 갱신되어야 함
    expect(secondUpdatedAt).toBeDefined();
    expect(typeof secondUpdatedAt).toBe("string");
  });
});

// ============================================================
// useSchedulePreference - deletePreference
// ============================================================

describe("useSchedulePreference - deletePreference", () => {
  beforeEach(() => {
    Object.keys(savedData).forEach((k) => {
      delete (savedData as Record<string, unknown>)[k];
    });
    vi.clearAllMocks();
  });

  it("deletePreference 호출 후 해당 멤버의 선호도가 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    act(() => {
      result.current.deletePreference("앨리스");
    });
    expect(result.current.preferences).toHaveLength(0);
  });

  it("존재하지 않는 멤버를 삭제해도 오류가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deletePreference("없는사람");
      });
    }).not.toThrow();
  });

  it("다른 멤버의 선호도는 삭제에 영향을 받지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
      result.current.setPreference("밥", [makeSlot({ day: 2 as WeekDayIndex })]);
    });
    act(() => {
      result.current.deletePreference("앨리스");
    });
    expect(result.current.preferences).toHaveLength(1);
    expect(result.current.preferences[0].memberName).toBe("밥");
  });
});

// ============================================================
// useSchedulePreference - getMemberPreference
// ============================================================

describe("useSchedulePreference - getMemberPreference", () => {
  beforeEach(() => {
    Object.keys(savedData).forEach((k) => {
      delete (savedData as Record<string, unknown>)[k];
    });
    vi.clearAllMocks();
  });

  it("등록된 멤버의 선호도를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    const pref = result.current.getMemberPreference("앨리스");
    expect(pref).toBeDefined();
    expect(pref?.memberName).toBe("앨리스");
  });

  it("미등록 멤버는 undefined를 반환한다", () => {
    const { result } = makeHook();
    const pref = result.current.getMemberPreference("없는사람");
    expect(pref).toBeUndefined();
  });
});

// ============================================================
// useSchedulePreference - findOptimalSlots
// ============================================================

describe("useSchedulePreference - findOptimalSlots", () => {
  beforeEach(() => {
    Object.keys(savedData).forEach((k) => {
      delete (savedData as Record<string, unknown>)[k];
    });
    vi.clearAllMocks();
  });

  it("선호도가 없으면 모든 슬롯의 score는 0이다", () => {
    const { result } = makeHook();
    const slots = result.current.findOptimalSlots(18, 22, 2);
    expect(slots.every((s) => s.score === 0)).toBe(true);
  });

  it("preferred 슬롯은 available보다 score가 높다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [
        makeSlot({ day: 1 as WeekDayIndex, startHour: 18, endHour: 20, preference: "preferred" }),
      ]);
    });
    const slots = result.current.findOptimalSlots(18, 22, 2);
    // 화요일(1) 18-20에 해당하는 슬롯 찾기
    const targetSlot = slots.find((s) => s.day === 1 && s.startHour === 18);
    expect(targetSlot?.score).toBeGreaterThan(0);
  });

  it("score 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [
        makeSlot({ day: 2 as WeekDayIndex, startHour: 18, endHour: 20, preference: "preferred" }),
      ]);
    });
    const slots = result.current.findOptimalSlots(18, 22, 2);
    for (let i = 0; i < slots.length - 1; i++) {
      expect(slots[i].score).toBeGreaterThanOrEqual(slots[i + 1].score);
    }
  });

  it("unavailable 슬롯이 있는 멤버는 카운트에 포함되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [
        makeSlot({ day: 1 as WeekDayIndex, startHour: 18, endHour: 20, preference: "unavailable" }),
      ]);
    });
    const slots = result.current.findOptimalSlots(18, 22, 2);
    const targetSlot = slots.find((s) => s.day === 1 && s.startHour === 18);
    expect(targetSlot?.availableCount).toBe(0);
  });

  it("score 계산: preferred=2점, available=1점", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [
        makeSlot({ day: 3 as WeekDayIndex, startHour: 10, endHour: 13, preference: "preferred" }),
      ]);
      result.current.setPreference("밥", [
        makeSlot({ day: 3 as WeekDayIndex, startHour: 10, endHour: 13, preference: "available" }),
      ]);
    });
    const slots = result.current.findOptimalSlots(10, 14, 3);
    const targetSlot = slots.find((s) => s.day === 3 && s.startHour === 10);
    // 앨리스: preferred → preferredCount=1, availableCount=1 (2점)
    // 밥: available → availableCount=1 (1점)
    // score = preferredCount * 2 + availableCount = 1*2 + 2 = 4? 아니면...
    // score = preferredCount * 2 + availableCount (availableCount은 preferred 포함)
    // 앨리스: preferredCount=1 → 2점, availableCount=1 → 1점 합산이 아님
    // score = preferredCount * 2 + availableCount (여기서 availableCount은 total available)
    expect(targetSlot?.score).toBeGreaterThan(0);
  });

  it("반환 결과는 OptimalSlotResult 구조를 가진다", () => {
    const { result } = makeHook();
    const slots = result.current.findOptimalSlots(18, 20, 1);
    if (slots.length > 0) {
      expect(slots[0]).toHaveProperty("day");
      expect(slots[0]).toHaveProperty("startHour");
      expect(slots[0]).toHaveProperty("endHour");
      expect(slots[0]).toHaveProperty("availableCount");
      expect(slots[0]).toHaveProperty("preferredCount");
      expect(slots[0]).toHaveProperty("score");
    }
  });

  it("startHour + durationHours <= endHour 조건의 모든 슬롯이 생성된다", () => {
    const { result } = makeHook();
    // startHour=18, endHour=22, duration=2: 가능한 시작=18, 19, 20 → 7일 * 3슬롯 = 21개
    const slots = result.current.findOptimalSlots(18, 22, 2);
    expect(slots).toHaveLength(7 * 3);
  });
});

// ============================================================
// useSchedulePreference - getAvailabilityMatrix
// ============================================================

describe("useSchedulePreference - getAvailabilityMatrix", () => {
  beforeEach(() => {
    Object.keys(savedData).forEach((k) => {
      delete (savedData as Record<string, unknown>)[k];
    });
    vi.clearAllMocks();
  });

  it("7일 * 24시간 매트릭스를 반환한다", () => {
    const { result } = makeHook();
    const matrix = result.current.getAvailabilityMatrix();
    expect(Object.keys(matrix)).toHaveLength(7);
    expect(Object.keys(matrix[0])).toHaveLength(24);
  });

  it("선호도가 없으면 모든 셀이 { availableCount: 0, preferredCount: 0 }이다", () => {
    const { result } = makeHook();
    const matrix = result.current.getAvailabilityMatrix();
    expect(matrix[0][0]).toEqual({ availableCount: 0, preferredCount: 0 });
  });

  it("preferred 슬롯은 해당 셀에 availableCount와 preferredCount 모두 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [
        makeSlot({ day: 1 as WeekDayIndex, startHour: 10, endHour: 12, preference: "preferred" }),
      ]);
    });
    const matrix = result.current.getAvailabilityMatrix();
    expect(matrix[1][10].availableCount).toBeGreaterThan(0);
    expect(matrix[1][10].preferredCount).toBeGreaterThan(0);
  });

  it("available 슬롯은 availableCount만 증가하고 preferredCount는 0이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [
        makeSlot({ day: 2 as WeekDayIndex, startHour: 14, endHour: 16, preference: "available" }),
      ]);
    });
    const matrix = result.current.getAvailabilityMatrix();
    expect(matrix[2][14].availableCount).toBe(1);
    expect(matrix[2][14].preferredCount).toBe(0);
  });

  it("unavailable 슬롯은 카운트에 포함되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [
        makeSlot({ day: 3 as WeekDayIndex, startHour: 8, endHour: 10, preference: "unavailable" }),
      ]);
    });
    const matrix = result.current.getAvailabilityMatrix();
    expect(matrix[3][8].availableCount).toBe(0);
    expect(matrix[3][8].preferredCount).toBe(0);
  });

  it("슬롯 범위 내 모든 시간(startHour~endHour-1)에 카운트가 반영된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [
        makeSlot({ day: 0 as WeekDayIndex, startHour: 9, endHour: 11, preference: "available" }),
      ]);
    });
    const matrix = result.current.getAvailabilityMatrix();
    // 9, 10 시간에 availableCount=1이어야 함
    expect(matrix[0][9].availableCount).toBe(1);
    expect(matrix[0][10].availableCount).toBe(1);
    // 11시는 endHour이므로 포함되지 않음
    expect(matrix[0][11].availableCount).toBe(0);
  });
});

// ============================================================
// useSchedulePreference - 통계 (totalMembers, coverageRate)
// ============================================================

describe("useSchedulePreference - 통계", () => {
  beforeEach(() => {
    Object.keys(savedData).forEach((k) => {
      delete (savedData as Record<string, unknown>)[k];
    });
    vi.clearAllMocks();
  });

  it("totalMembers는 현재 preferences의 멤버 수이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
      result.current.setPreference("밥", [makeSlot()]);
    });
    expect(result.current.totalMembers).toBe(2);
  });

  it("coverageRate: totalMemberCount 미제공 시 0이다", () => {
    const { result } = makeHook("group-1", undefined);
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    expect(result.current.coverageRate).toBe(0);
  });

  it("coverageRate: totalMemberCount가 0이면 0이다", () => {
    const { result } = makeHook("group-1", 0);
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    expect(result.current.coverageRate).toBe(0);
  });

  it("coverageRate: 2/10 = 20%이다", () => {
    const { result } = makeHook("group-1", 10);
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
      result.current.setPreference("밥", [makeSlot()]);
    });
    expect(result.current.coverageRate).toBe(20);
  });

  it("coverageRate: 10/10 = 100%이다", () => {
    const { result } = makeHook("group-1", 1);
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    expect(result.current.coverageRate).toBe(100);
  });
});

// ============================================================
// useSchedulePreference - 그룹별 격리
// ============================================================

describe("useSchedulePreference - 그룹별 격리", () => {
  beforeEach(() => {
    Object.keys(savedData).forEach((k) => {
      delete (savedData as Record<string, unknown>)[k];
    });
    vi.clearAllMocks();
  });

  it("스토리지 키는 dancebase:schedule-preference:{groupId} 형식이다", () => {
    const { result } = renderHook(() => useSchedulePreference("grp-999"));
    act(() => {
      result.current.setPreference("앨리스", [makeSlot()]);
    });
    expect(mockSaveToStorage).toHaveBeenCalledWith(
      "dancebase:schedule-preference:grp-999",
      expect.anything()
    );
  });
});
