import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { calcDaysLeft, useTimeCapsule, usePracticeTimeCapsule } from "@/hooks/use-time-capsule";

// ─── SWR mock ────────────────────────────────────────────────
vi.mock("swr", () => {
  const store = new Map<string, unknown>();
  const subscribers = new Map<string, (() => void)[]>();

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
        (subscribers.get(key) ?? []).forEach((cb) => cb());
      };

      return { data: store.get(key), mutate };
    },
    __store: store,
    __reset: () => store.clear(),
  };
});

// SWR store 초기화 헬퍼
function resetSWRStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const swr = require("swr");
  if (swr.__reset) swr.__reset();
}

// ─── localStorage mock ───────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── sonner mock ─────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── calcDaysLeft 순수 함수 테스트 ───────────────────────────

describe("calcDaysLeft - 날짜 계산 정확성", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("오늘 날짜이면 0을 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01T12:00:00"));
    expect(calcDaysLeft("2026-03-01")).toBe(0);
  });

  it("내일이면 1을 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01T12:00:00"));
    expect(calcDaysLeft("2026-03-02")).toBe(1);
  });

  it("10일 후면 10을 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01T12:00:00"));
    expect(calcDaysLeft("2026-03-11")).toBe(10);
  });

  it("어제면 -1을 반환한다 (만료됨)", () => {
    vi.setSystemTime(new Date("2026-03-01T12:00:00"));
    expect(calcDaysLeft("2026-02-28")).toBe(-1);
  });

  it("30일 전이면 -30을 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01T12:00:00"));
    expect(calcDaysLeft("2026-01-30")).toBe(-30);
  });

  it("1년 후면 365(또는 366)를 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01T12:00:00"));
    const days = calcDaysLeft("2027-03-01");
    expect(days).toBe(365);
  });

  it("자정 경계값에서도 정확하게 계산한다", () => {
    vi.setSystemTime(new Date("2026-03-01T00:00:00"));
    expect(calcDaysLeft("2026-03-01")).toBe(0);
  });

  it("자정 직전에도 오늘 날짜이면 0을 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01T23:59:59"));
    expect(calcDaysLeft("2026-03-01")).toBe(0);
  });
});

// ─── useTimeCapsule 훅 테스트 ─────────────────────────────────

describe("useTimeCapsule - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("초기 capsules는 빈 배열이다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    expect(result.current.capsules).toEqual([]);
  });

  it("초기 통계 값이 모두 0이다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    expect(result.current.totalCapsules).toBe(0);
    expect(result.current.sealedCount).toBe(0);
    expect(result.current.openedCount).toBe(0);
  });

  it("초기 nextOpenDate는 null이다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    expect(result.current.nextOpenDate).toBeNull();
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    expect(typeof result.current.createCapsule).toBe("function");
    expect(typeof result.current.deleteCapsule).toBe("function");
    expect(typeof result.current.addMessage).toBe("function");
    expect(typeof result.current.sealCapsule).toBe("function");
    expect(typeof result.current.openCapsule).toBe("function");
  });
});

describe("useTimeCapsule - createCapsule", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("빈 title로 생성 시 false를 반환한다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.createCapsule("", "2027-01-01");
    });
    expect(returned!).toBe(false);
  });

  it("공백만 있는 title로 생성 시 false를 반환한다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.createCapsule("   ", "2027-01-01");
    });
    expect(returned!).toBe(false);
  });

  it("정상 생성 시 true를 반환하고 localStorage에 저장한다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.createCapsule("우리의 첫 캡슐", "2027-01-01");
    });
    expect(returned!).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("생성된 캡슐은 isSealed: false, isOpened: false 상태다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    act(() => {
      result.current.createCapsule("캡슐 테스트", "2027-01-01");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].isSealed).toBe(false);
    expect(saved[0].isOpened).toBe(false);
  });

  it("생성된 캡슐의 messages는 빈 배열이다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    act(() => {
      result.current.createCapsule("메시지 없는 캡슐", "2027-06-01");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].messages).toEqual([]);
  });
});

describe("useTimeCapsule - deleteCapsule", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("존재하지 않는 ID 삭제 시 localStorage를 저장한다 (빈 상태 유지)", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    act(() => {
      result.current.deleteCapsule("non-existent-id");
    });
    // 삭제 시도 자체는 에러 없이 실행되어야 함
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("캡슐 생성 후 삭제하면 localStorage에서 제거된다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));

    // 캡슐 생성
    act(() => {
      result.current.createCapsule("삭제할 캡슐", "2027-01-01");
    });

    // setItem에서 저장된 데이터 확인
    const savedCall = localStorageMock.setItem.mock.calls[0];
    const savedData = JSON.parse(savedCall[1]);
    const capsuleId = savedData[0].id;

    // localStorage에서 이 데이터를 반환하도록 mock 설정
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

    // 삭제
    localStorageMock.setItem.mockClear();
    act(() => {
      result.current.deleteCapsule(capsuleId);
    });

    // 삭제 후 빈 배열이 저장됨
    const afterDelete = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(afterDelete).toHaveLength(0);
  });
});

describe("useTimeCapsule - addMessage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("authorName이 비어있으면 false를 반환한다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addMessage("some-id", "", "내용");
    });
    expect(returned!).toBe(false);
  });

  it("content가 비어있으면 false를 반환한다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addMessage("some-id", "홍길동", "");
    });
    expect(returned!).toBe(false);
  });

  it("존재하지 않는 capsuleId면 false를 반환한다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addMessage("non-existent", "홍길동", "안녕");
    });
    expect(returned!).toBe(false);
  });

  it("봉인된 캡슐에 메시지 추가 시 false를 반환한다", () => {
    const sealedCapsule = [{
      id: "cap-1",
      title: "봉인된 캡슐",
      openDate: "2027-01-01",
      messages: [],
      isSealed: true,
      isOpened: false,
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(sealedCapsule));
    resetSWRStore();

    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addMessage("cap-1", "홍길동", "메시지");
    });
    expect(returned!).toBe(false);
  });
});

describe("useTimeCapsule - sealCapsule", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("존재하지 않는 ID면 false를 반환한다", () => {
    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.sealCapsule("non-existent");
    });
    expect(returned!).toBe(false);
  });

  it("이미 봉인된 캡슐을 다시 봉인하면 false를 반환한다", () => {
    const sealedCapsule = [{
      id: "cap-1",
      title: "봉인된 캡슐",
      openDate: "2027-01-01",
      messages: [],
      isSealed: true,
      isOpened: false,
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(sealedCapsule));
    resetSWRStore();

    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.sealCapsule("cap-1");
    });
    expect(returned!).toBe(false);
  });

  it("정상 봉인 시 true를 반환하고 isSealed가 true로 저장된다", () => {
    const capsule = [{
      id: "cap-2",
      title: "미봉인 캡슐",
      openDate: "2027-01-01",
      messages: [],
      isSealed: false,
      isOpened: false,
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(capsule));
    resetSWRStore();

    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.sealCapsule("cap-2");
    });
    expect(returned!).toBe(true);
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].isSealed).toBe(true);
  });
});

describe("useTimeCapsule - openCapsule", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("개봉일이 오지 않았으면 false를 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01"));
    const capsule = [{
      id: "cap-1",
      title: "미래 캡슐",
      openDate: "2027-01-01",
      messages: [],
      isSealed: true,
      isOpened: false,
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(capsule));
    resetSWRStore();

    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.openCapsule("cap-1");
    });
    expect(returned!).toBe(false);
  });

  it("이미 개봉된 캡슐을 다시 개봉하면 false를 반환한다", () => {
    vi.setSystemTime(new Date("2027-01-02"));
    const capsule = [{
      id: "cap-1",
      title: "이미 개봉된 캡슐",
      openDate: "2027-01-01",
      messages: [],
      isSealed: true,
      isOpened: true,
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(capsule));
    resetSWRStore();

    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.openCapsule("cap-1");
    });
    expect(returned!).toBe(false);
  });

  it("개봉일이 지났고 아직 개봉 안된 캡슐은 true를 반환한다", () => {
    vi.setSystemTime(new Date("2027-01-02"));
    const capsule = [{
      id: "cap-1",
      title: "개봉 가능 캡슐",
      openDate: "2027-01-01",
      messages: [],
      isSealed: true,
      isOpened: false,
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(capsule));
    resetSWRStore();

    const { result } = renderHook(() => useTimeCapsule("group-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.openCapsule("cap-1");
    });
    expect(returned!).toBe(true);
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].isOpened).toBe(true);
  });
});

// ─── usePracticeTimeCapsule 훅 테스트 ──────────────────────────

describe("usePracticeTimeCapsule - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = renderHook(() => usePracticeTimeCapsule("group-2"));
    expect(result.current.entries).toEqual([]);
  });

  it("초기 통계 값이 모두 0이다", () => {
    const { result } = renderHook(() => usePracticeTimeCapsule("group-2"));
    expect(result.current.totalEntries).toBe(0);
    expect(result.current.sealedCount).toBe(0);
    expect(result.current.openedCount).toBe(0);
  });

  it("초기 nextOpenDate는 null이다", () => {
    const { result } = renderHook(() => usePracticeTimeCapsule("group-2"));
    expect(result.current.nextOpenDate).toBeNull();
  });
});

describe("usePracticeTimeCapsule - createEntry", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("빈 title로 생성 시 false를 반환한다", () => {
    const { result } = renderHook(() => usePracticeTimeCapsule("group-3"));
    let returned: boolean;
    act(() => {
      returned = result.current.createEntry({ title: "", openDate: "2027-01-01" });
    });
    expect(returned!).toBe(false);
  });

  it("정상 생성 시 true를 반환한다", () => {
    const { result } = renderHook(() => usePracticeTimeCapsule("group-3"));
    let returned: boolean;
    act(() => {
      returned = result.current.createEntry({ title: "연습 캡슐", openDate: "2027-01-01" });
    });
    expect(returned!).toBe(true);
  });

  it("currentRepertoire가 제공되면 저장된다", () => {
    const { result } = renderHook(() => usePracticeTimeCapsule("group-3"));
    act(() => {
      result.current.createEntry({
        title: "레퍼토리 캡슐",
        openDate: "2027-01-01",
        currentRepertoire: ["곡A", "곡B"],
      });
    });
    // setItem 호출들 중 ENTRY_LS_KEY로 저장된 마지막 호출 찾기
    const entryCalls = localStorageMock.setItem.mock.calls.filter(
      (call: [string, string]) => call[0].includes("time-capsule-entries")
    );
    expect(entryCalls.length).toBeGreaterThan(0);
    const saved = JSON.parse(entryCalls[entryCalls.length - 1][1]);
    expect(saved[saved.length - 1].currentRepertoire).toEqual(["곡A", "곡B"]);
  });

  it("currentGoal이 제공되면 저장된다", () => {
    const { result } = renderHook(() => usePracticeTimeCapsule("group-3"));
    act(() => {
      result.current.createEntry({
        title: "목표 캡슐",
        openDate: "2027-01-01",
        currentGoal: "전국대회 1위",
      });
    });
    const entryCalls = localStorageMock.setItem.mock.calls.filter(
      (call: [string, string]) => call[0].includes("time-capsule-entries")
    );
    expect(entryCalls.length).toBeGreaterThan(0);
    const saved = JSON.parse(entryCalls[entryCalls.length - 1][1]);
    expect(saved[saved.length - 1].currentGoal).toBe("전국대회 1위");
  });
});

describe("usePracticeTimeCapsule - deleteEntry", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  it("존재하지 않는 ID 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => usePracticeTimeCapsule("group-4"));
    let returned: boolean;
    act(() => {
      returned = result.current.deleteEntry("non-existent");
    });
    expect(returned!).toBe(false);
  });

  it("존재하는 ID 삭제 시 true를 반환한다", () => {
    const entry = [{
      id: "entry-1",
      title: "삭제될 엔트리",
      writtenAt: "2026-03-01",
      openDate: "2027-01-01",
      messages: [],
      currentRepertoire: [],
      isSealed: false,
      isOpened: false,
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(entry));
    resetSWRStore();

    const { result } = renderHook(() => usePracticeTimeCapsule("group-4"));
    let returned: boolean;
    act(() => {
      returned = result.current.deleteEntry("entry-1");
    });
    expect(returned!).toBe(true);
  });
});

describe("usePracticeTimeCapsule - sealEntry & openEntry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    resetSWRStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("존재하지 않는 ID 봉인 시 false를 반환한다", () => {
    const { result } = renderHook(() => usePracticeTimeCapsule("group-5"));
    let returned: boolean;
    act(() => {
      returned = result.current.sealEntry("non-existent");
    });
    expect(returned!).toBe(false);
  });

  it("이미 봉인된 엔트리 재봉인 시 false를 반환한다", () => {
    const entry = [{
      id: "entry-1",
      title: "봉인된 엔트리",
      writtenAt: "2026-03-01",
      openDate: "2027-01-01",
      messages: [],
      currentRepertoire: [],
      isSealed: true,
      isOpened: false,
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(entry));
    resetSWRStore();

    const { result } = renderHook(() => usePracticeTimeCapsule("group-5"));
    let returned: boolean;
    act(() => {
      returned = result.current.sealEntry("entry-1");
    });
    expect(returned!).toBe(false);
  });

  it("개봉일이 지나지 않은 엔트리 개봉 시 false를 반환한다", () => {
    vi.setSystemTime(new Date("2026-03-01"));
    const entry = [{
      id: "entry-1",
      title: "미래 엔트리",
      writtenAt: "2026-03-01",
      openDate: "2027-01-01",
      messages: [],
      currentRepertoire: [],
      isSealed: false,
      isOpened: false,
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(entry));
    resetSWRStore();

    const { result } = renderHook(() => usePracticeTimeCapsule("group-5"));
    let returned: boolean;
    act(() => {
      returned = result.current.openEntry("entry-1");
    });
    expect(returned!).toBe(false);
  });

  it("개봉일이 지난 엔트리 개봉 시 true를 반환한다", () => {
    vi.setSystemTime(new Date("2027-01-02"));
    const entry = [{
      id: "entry-1",
      title: "개봉 가능 엔트리",
      writtenAt: "2026-03-01",
      openDate: "2027-01-01",
      messages: [],
      currentRepertoire: [],
      isSealed: false,
      isOpened: false,
      createdAt: new Date().toISOString(),
    }];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(entry));
    resetSWRStore();

    const { result } = renderHook(() => usePracticeTimeCapsule("group-5"));
    let returned: boolean;
    act(() => {
      returned = result.current.openEntry("entry-1");
    });
    expect(returned!).toBe(true);
  });
});
