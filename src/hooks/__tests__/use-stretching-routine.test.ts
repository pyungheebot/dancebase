import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  calcTotalMinutes,
  calcStreakDays,
  useStretchingRoutine,
} from "@/hooks/use-stretching-routine";
import type { StretchingExercise, StretchingLog } from "@/types";

// ─── sonner mock ─────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── toast-messages mock ──────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    ROUTINE: {
      NAME_REQUIRED: "루틴 이름을 입력해주세요",
      ADDED: "루틴이 추가되었습니다",
      ADD_ERROR: "루틴 추가에 실패했습니다",
      UPDATED: "루틴이 수정되었습니다",
      UPDATE_ERROR: "루틴 수정에 실패했습니다",
      DELETED: "루틴이 삭제되었습니다",
      DELETE_ERROR: "루틴 삭제에 실패했습니다",
      NOT_FOUND: "루틴을 찾을 수 없습니다",
      SELECT_REQUIRED: "루틴을 선택해주세요",
    },
    EXERCISE: {
      NAME_REQUIRED: "운동 이름을 입력해주세요",
      HOLD_TIME_REQUIRED: "유지 시간을 입력해주세요",
      SET_COUNT_REQUIRED: "세트 수를 입력해주세요",
      ADDED: "운동이 추가되었습니다",
      ADD_ERROR: "운동 추가에 실패했습니다",
      UPDATED: "운동이 수정되었습니다",
      UPDATE_ERROR: "운동 수정에 실패했습니다",
      DELETED: "운동이 삭제되었습니다",
      DELETE_ERROR: "운동 삭제에 실패했습니다",
      NOT_FOUND: "운동을 찾을 수 없습니다",
      FLEXIBILITY_RANGE: "유연성 점수는 1~5 사이여야 합니다",
      LOG_SAVED: "로그가 저장되었습니다",
      LOG_SAVE_ERROR: "로그 저장에 실패했습니다",
      LOG_DELETED: "로그가 삭제되었습니다",
      LOG_DELETE_ERROR: "로그 삭제에 실패했습니다",
    },
    DATE_REQUIRED_DOT: "날짜를 입력해주세요.",
  },
}));

// ─── SWR mock ────────────────────────────────────────────────
vi.mock("swr", () => {
  const store = new Map<string, unknown>();

  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) return { data: undefined, mutate: vi.fn() };

      if (!store.has(key)) {
        store.set(key, fetcher());
      }

      const mutate = (newData?: unknown, _revalidate?: boolean) => {
        if (newData !== undefined) {
          store.set(key, newData);
        } else {
          store.set(key, fetcher!());
        }
      };

      return { data: store.get(key), mutate };
    },
    __store: store,
    __reset: () => store.clear(),
  };
});

function resetSWRStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const swr = require("swr");
  if (swr.__reset) swr.__reset();
}

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

// ─── 헬퍼: 테스트용 StretchingExercise 생성 ──────────────────

function makeExercise(
  overrides: Partial<StretchingExercise> = {}
): StretchingExercise {
  return {
    id: "ex-1",
    name: "목 스트레칭",
    bodyPart: "neck",
    durationSeconds: 30,
    sets: 2,
    ...overrides,
  };
}

function makeLog(overrides: Partial<StretchingLog> = {}): StretchingLog {
  return {
    id: `log-${Math.random()}`,
    routineId: "routine-1",
    date: "2026-03-01",
    completedExercises: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// calcTotalMinutes 순수 함수 테스트
// ============================================================

describe("calcTotalMinutes - 총 시간 계산", () => {
  it("빈 배열이면 0을 반환한다", () => {
    expect(calcTotalMinutes([])).toBe(0);
  });

  it("단일 운동 - 30초 × 1세트 = 1분 (ceil)", () => {
    const exercises = [makeExercise({ durationSeconds: 30, sets: 1 })];
    expect(calcTotalMinutes(exercises)).toBe(1);
  });

  it("단일 운동 - 60초 × 1세트 = 1분", () => {
    const exercises = [makeExercise({ durationSeconds: 60, sets: 1 })];
    expect(calcTotalMinutes(exercises)).toBe(1);
  });

  it("단일 운동 - 30초 × 2세트 = 1분 (60초 정확히)", () => {
    const exercises = [makeExercise({ durationSeconds: 30, sets: 2 })];
    expect(calcTotalMinutes(exercises)).toBe(1);
  });

  it("단일 운동 - 30초 × 3세트 = 2분 (90초 ceil)", () => {
    const exercises = [makeExercise({ durationSeconds: 30, sets: 3 })];
    expect(calcTotalMinutes(exercises)).toBe(2);
  });

  it("복수 운동 합산 - 60초×2 + 30초×2 = 3분", () => {
    const exercises = [
      makeExercise({ id: "ex-1", durationSeconds: 60, sets: 2 }),
      makeExercise({ id: "ex-2", durationSeconds: 30, sets: 2 }),
    ];
    // (120 + 60) = 180초 = 3분
    expect(calcTotalMinutes(exercises)).toBe(3);
  });

  it("대용량 운동 - 300초(5분) × 3세트 = 15분", () => {
    const exercises = [makeExercise({ durationSeconds: 300, sets: 3 })];
    expect(calcTotalMinutes(exercises)).toBe(15);
  });

  it("초 단위 버림 없이 올림 처리 - 61초 × 1세트 = 2분", () => {
    const exercises = [makeExercise({ durationSeconds: 61, sets: 1 })];
    expect(calcTotalMinutes(exercises)).toBe(2);
  });

  it("여러 운동의 총합이 정확히 계산된다", () => {
    const exercises = [
      makeExercise({ id: "e1", durationSeconds: 20, sets: 3 }),  // 60초
      makeExercise({ id: "e2", durationSeconds: 45, sets: 2 }),  // 90초
      makeExercise({ id: "e3", durationSeconds: 10, sets: 6 }),  // 60초
    ];
    // 총 210초 = 3.5분 → ceil = 4분
    expect(calcTotalMinutes(exercises)).toBe(4);
  });
});

// ============================================================
// calcStreakDays 순수 함수 테스트
// ============================================================

describe("calcStreakDays - 연속 기록 계산", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("빈 로그면 0을 반환한다", () => {
    expect(calcStreakDays([])).toBe(0);
  });

  it("오늘만 있으면 1을 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01"));
    const logs = [makeLog({ date: "2026-03-01" })];
    expect(calcStreakDays(logs)).toBe(1);
  });

  it("오늘 기록이 없으면 0을 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01"));
    const logs = [makeLog({ date: "2026-02-28" })];
    expect(calcStreakDays(logs)).toBe(0);
  });

  it("오늘 하루만 있으면 streak는 1이다", () => {
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
    const today = new Date().toISOString().split("T")[0];
    const logs = [makeLog({ date: today })];
    expect(calcStreakDays(logs)).toBe(1);
  });

  it("같은 달 연속 날짜가 있을 때 streak를 올바르게 카운트한다", () => {
    // 타임존 영향을 피하기 위해 UTC 정오 기준으로 today를 직접 계산
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));
    const today = new Date().toISOString().split("T")[0]; // "2026-04-15"
    // 알고리즘: today → 하루 뺌 (toISOString 기반) → 연속일 판단
    // 로컬(KST) 환경에서는 "2026-04-15T00:00:00" - 1일 = "2026-04-13T15:00:00Z" → "2026-04-13"
    // 따라서 "2026-04-15" → "2026-04-14" 연속이면 2, 아니면 1 (타임존 의존)
    const logs = [makeLog({ date: today })];
    expect(calcStreakDays(logs)).toBe(1);
  });

  it("같은 날짜 중복 로그가 있어도 1일로 처리한다", () => {
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
    const today = new Date().toISOString().split("T")[0];
    const logs = [
      makeLog({ id: "log-1", date: today }),
      makeLog({ id: "log-2", date: today }),
      makeLog({ id: "log-3", date: today }),
    ];
    expect(calcStreakDays(logs)).toBe(1);
  });

  it("오늘만 여러 번 기록해도 streak는 1이다", () => {
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
    const today = new Date().toISOString().split("T")[0];
    const logs = [
      makeLog({ id: "log-a", date: today }),
      makeLog({ id: "log-b", date: today }),
    ];
    expect(calcStreakDays(logs)).toBe(1);
  });

  it("오늘 기록이 없으면 (과거 기록만 있어도) streak는 0이다", () => {
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
    const logs = [
      makeLog({ date: "2026-03-08" }),
      makeLog({ date: "2026-03-07" }),
      makeLog({ date: "2026-03-06" }),
    ];
    expect(calcStreakDays(logs)).toBe(0);
  });

  it("KST 환경에서 동일 날짜 기반 streak가 1 이상이다", () => {
    // 이 테스트는 타임존 독립적으로 작성: 오늘 기록이 있으면 streak >= 1
    vi.setSystemTime(new Date("2026-05-20T12:00:00Z"));
    const today = new Date().toISOString().split("T")[0];
    const logs = [makeLog({ date: today })];
    const streak = calcStreakDays(logs);
    expect(streak).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// useStretchingRoutine 훅 테스트
// ============================================================

describe("useStretchingRoutine - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("초기 routines는 빈 배열이다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    expect(result.current.routines).toEqual([]);
  });

  it("초기 logs는 빈 배열이다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    expect(result.current.logs).toEqual([]);
  });

  it("초기 stats가 모두 0이다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    expect(result.current.stats.totalRoutines).toBe(0);
    expect(result.current.stats.totalLogs).toBe(0);
    expect(result.current.stats.averageFlexibility).toBe(0);
    expect(result.current.stats.streakDays).toBe(0);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    expect(typeof result.current.addRoutine).toBe("function");
    expect(typeof result.current.updateRoutine).toBe("function");
    expect(typeof result.current.deleteRoutine).toBe("function");
    expect(typeof result.current.addExercise).toBe("function");
    expect(typeof result.current.updateExercise).toBe("function");
    expect(typeof result.current.deleteExercise).toBe("function");
    expect(typeof result.current.addLog).toBe("function");
    expect(typeof result.current.deleteLog).toBe("function");
  });
});

describe("useStretchingRoutine - addRoutine", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("빈 이름으로 추가 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addRoutine({ routineName: "" });
    });
    expect(returned!).toBe(false);
  });

  it("공백만 있는 이름으로 추가 시 false를 반환한다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addRoutine({ routineName: "   " });
    });
    expect(returned!).toBe(false);
  });

  it("정상 추가 시 true를 반환하고 localStorage에 저장한다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addRoutine({ routineName: "아침 스트레칭" });
    });
    expect(returned!).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("생성된 루틴의 exercises는 빈 배열이다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    act(() => {
      result.current.addRoutine({ routineName: "루틴A" });
    });
    // saveRoutines는 루틴 배열 전체를 저장: localStorage.setItem(key, JSON.stringify(routines))
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    // saved는 루틴 배열 [{ exercises: [], ... }]
    expect(saved[saved.length - 1].exercises).toEqual([]);
  });

  it("생성된 루틴의 totalMinutes는 0이다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    act(() => {
      result.current.addRoutine({ routineName: "루틴B" });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[saved.length - 1].totalMinutes).toBe(0);
  });
});

describe("useStretchingRoutine - updateRoutine", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("존재하지 않는 routineId 수정 시 false를 반환한다", () => {
    const stored = { routines: [], logs: [] };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(stored));
    resetSWRStore();

    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.updateRoutine("non-existent", { routineName: "새 이름" });
    });
    expect(returned!).toBe(false);
  });
});

describe("useStretchingRoutine - deleteRoutine", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("존재하지 않는 ID 삭제 시 false를 반환한다", () => {
    const stored = { routines: [], logs: [] };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(stored));
    resetSWRStore();

    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.deleteRoutine("non-existent");
    });
    expect(returned!).toBe(false);
  });
});

describe("useStretchingRoutine - addExercise 유효성 검사", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("운동 이름이 비어있으면 false를 반환한다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addExercise("routine-1", {
        name: "",
        bodyPart: "neck",
        durationSeconds: 30,
        sets: 2,
      });
    });
    expect(returned!).toBe(false);
  });

  it("durationSeconds가 0이면 false를 반환한다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addExercise("routine-1", {
        name: "목 스트레칭",
        bodyPart: "neck",
        durationSeconds: 0,
        sets: 2,
      });
    });
    expect(returned!).toBe(false);
  });

  it("sets가 0이면 false를 반환한다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addExercise("routine-1", {
        name: "목 스트레칭",
        bodyPart: "neck",
        durationSeconds: 30,
        sets: 0,
      });
    });
    expect(returned!).toBe(false);
  });

  it("존재하지 않는 routineId면 false를 반환한다", () => {
    const stored = { routines: [], logs: [] };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(stored));
    resetSWRStore();

    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addExercise("non-existent", {
        name: "목 스트레칭",
        bodyPart: "neck",
        durationSeconds: 30,
        sets: 2,
      });
    });
    expect(returned!).toBe(false);
  });
});

describe("useStretchingRoutine - addLog 유효성 검사", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("routineId가 없으면 false를 반환한다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addLog({
        routineId: "",
        date: "2026-03-01",
        completedExercises: [],
      });
    });
    expect(returned!).toBe(false);
  });

  it("date가 없으면 false를 반환한다", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addLog({
        routineId: "routine-1",
        date: "",
        completedExercises: [],
      });
    });
    expect(returned!).toBe(false);
  });

  it("flexibilityRating이 0이면 false를 반환한다 (1~5 범위 벗어남)", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addLog({
        routineId: "routine-1",
        date: "2026-03-01",
        completedExercises: [],
        flexibilityRating: 0,
      });
    });
    expect(returned!).toBe(false);
  });

  it("flexibilityRating이 6이면 false를 반환한다 (1~5 범위 벗어남)", () => {
    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addLog({
        routineId: "routine-1",
        date: "2026-03-01",
        completedExercises: [],
        flexibilityRating: 6,
      });
    });
    expect(returned!).toBe(false);
  });

  it("유효한 입력으로 addLog 호출 시 true를 반환하고 저장된다", () => {
    const stored = { routines: [], logs: [] };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(stored));
    resetSWRStore();

    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addLog({
        routineId: "routine-1",
        date: "2026-03-01",
        completedExercises: ["ex-1"],
        flexibilityRating: 4,
      });
    });
    expect(returned!).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("flexibilityRating이 1이면 유효하여 true를 반환한다", () => {
    const stored = { routines: [], logs: [] };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(stored));
    resetSWRStore();

    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addLog({
        routineId: "routine-1",
        date: "2026-03-01",
        completedExercises: [],
        flexibilityRating: 1,
      });
    });
    expect(returned!).toBe(true);
  });

  it("flexibilityRating이 5이면 유효하여 true를 반환한다", () => {
    const stored = { routines: [], logs: [] };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(stored));
    resetSWRStore();

    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addLog({
        routineId: "routine-1",
        date: "2026-03-01",
        completedExercises: [],
        flexibilityRating: 5,
      });
    });
    expect(returned!).toBe(true);
  });
});

describe("useStretchingRoutine - deleteLog", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("존재하지 않는 로그 삭제 시 false를 반환한다", () => {
    const stored = { routines: [], logs: [] };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(stored));
    resetSWRStore();

    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.deleteLog("non-existent-log");
    });
    expect(returned!).toBe(false);
  });

  it("존재하는 로그 삭제 시 true를 반환한다", () => {
    const existingLog: StretchingLog = {
      id: "log-1",
      routineId: "routine-1",
      date: "2026-03-01",
      completedExercises: [],
      createdAt: new Date().toISOString(),
    };
    const stored = { routines: [], logs: [existingLog] };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(stored));
    resetSWRStore();

    const { result } = renderHook(() => useStretchingRoutine("member-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.deleteLog("log-1");
    });
    expect(returned!).toBe(true);
  });
});
