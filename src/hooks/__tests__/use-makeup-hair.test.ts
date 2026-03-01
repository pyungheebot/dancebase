import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMakeupHair } from "@/hooks/use-makeup-hair";
import type { MakeupHairData } from "@/types";

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

// ─── SWR mock: useState 기반 (격리된 인스턴스) ───────────────
vi.mock("swr", async () => {
  const { useState } = await import("react");

  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) return { data: undefined, isLoading: false, mutate: vi.fn() };

      const initialValue = fetcher();
      const [data, setData] = useState<unknown>(initialValue);

      const mutate = (newData?: unknown, _revalidate?: boolean) => {
        if (newData !== undefined) {
          setData(newData);
        } else {
          setData(fetcher!());
        }
      };

      return { data, isLoading: false, mutate };
    },
    __reset: () => {},
  };
});

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    makeupHair: (projectId: string) => `makeup-hair-${projectId}`,
  },
}));

// ─── local-storage mock ──────────────────────────────────────
vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },
  saveToStorage: <T>(key: string, value: T): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
}));

// ─── 초기 데이터 헬퍼 ─────────────────────────────────────────
function initStorage(projectId: string, data?: Partial<MakeupHairData>) {
  const key = `dancebase:makeup-hair:${projectId}`;
  const init: MakeupHairData = {
    projectId,
    plans: [],
    timeline: [],
    checklist: [],
    artists: [],
    updatedAt: new Date().toISOString(),
    ...data,
  };
  localStorageMock.setItem(key, JSON.stringify(init));
}

// ============================================================
// 테스트
// ============================================================

describe("useMakeupHair - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-1");
  });

  it("data.plans가 빈 배열이다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    expect(result.current.data.plans).toEqual([]);
  });

  it("data.timeline이 빈 배열이다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    expect(result.current.data.timeline).toEqual([]);
  });

  it("data.checklist가 빈 배열이다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    expect(result.current.data.checklist).toEqual([]);
  });

  it("data.artists가 빈 배열이다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    expect(result.current.data.artists).toEqual([]);
  });

  it("loading이 false이다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    expect(result.current.loading).toBe(false);
  });

  it("stats.totalPlans가 0이다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    expect(result.current.stats.totalPlans).toBe(0);
  });

  it("stats.checklistTotal이 0이다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    expect(result.current.stats.checklistTotal).toBe(0);
  });

  it("stats.checklistDone이 0이다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    expect(result.current.stats.checklistDone).toBe(0);
  });

  it("stats.makeupTypeCounts가 모두 0이다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    expect(result.current.stats.makeupTypeCounts["내추럴"]).toBe(0);
    expect(result.current.stats.makeupTypeCounts["스테이지"]).toBe(0);
    expect(result.current.stats.makeupTypeCounts["특수분장"]).toBe(0);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    expect(typeof result.current.addPlan).toBe("function");
    expect(typeof result.current.updatePlan).toBe("function");
    expect(typeof result.current.deletePlan).toBe("function");
    expect(typeof result.current.addTimelineEntry).toBe("function");
    expect(typeof result.current.updateTimelineEntry).toBe("function");
    expect(typeof result.current.deleteTimelineEntry).toBe("function");
    expect(typeof result.current.addChecklistItem).toBe("function");
    expect(typeof result.current.toggleChecklistItem).toBe("function");
    expect(typeof result.current.deleteChecklistItem).toBe("function");
    expect(typeof result.current.addArtist).toBe("function");
    expect(typeof result.current.updateArtist).toBe("function");
    expect(typeof result.current.deleteArtist).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

describe("useMakeupHair - addPlan", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-1");
    initStorage("proj-2");
  });

  it("플랜을 추가하면 id와 createdAt이 자동 생성된다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let plan: ReturnType<typeof result.current.addPlan>;
    act(() => {
      plan = result.current.addPlan({
        memberName: "홍길동",
        scene: 1,
        makeupType: "내추럴",
        hairStyle: "업스타일",
        colorTone: null,
        memo: null,
      });
    });
    expect(plan!.id).toBeDefined();
    expect(plan!.createdAt).toBeDefined();
  });

  it("추가된 플랜의 memberName과 makeupType이 올바르다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let plan: ReturnType<typeof result.current.addPlan>;
    act(() => {
      plan = result.current.addPlan({
        memberName: "김철수",
        scene: 2,
        makeupType: "스테이지",
        hairStyle: "다운스타일",
        colorTone: "레드",
        memo: "중요",
      });
    });
    expect(plan!.memberName).toBe("김철수");
    expect(plan!.makeupType).toBe("스테이지");
  });

  it("addPlan 후 localStorage에 저장된다", () => {
    localStorageMock.setItem.mockClear();
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    act(() => {
      result.current.addPlan({
        memberName: "테스트",
        scene: 1,
        makeupType: "특수분장",
        hairStyle: "특수",
        colorTone: null,
        memo: null,
      });
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("stats.totalPlans가 플랜 추가 후 증가한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    act(() => {
      result.current.addPlan({
        memberName: "A",
        scene: 1,
        makeupType: "내추럴",
        hairStyle: "업스타일",
        colorTone: null,
        memo: null,
      });
    });
    expect(result.current.stats.totalPlans).toBe(1);
  });

  it("makeupTypeCounts가 타입별로 올바르게 집계된다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-2"));
    act(() => {
      result.current.addPlan({ memberName: "A", scene: 1, makeupType: "내추럴", hairStyle: "업스타일", colorTone: null, memo: null });
    });
    act(() => {
      result.current.addPlan({ memberName: "B", scene: 2, makeupType: "내추럴", hairStyle: "다운스타일", colorTone: null, memo: null });
    });
    act(() => {
      result.current.addPlan({ memberName: "C", scene: 3, makeupType: "스테이지", hairStyle: "반묶음", colorTone: null, memo: null });
    });
    expect(result.current.stats.makeupTypeCounts["내추럴"]).toBe(2);
    expect(result.current.stats.makeupTypeCounts["스테이지"]).toBe(1);
    expect(result.current.stats.makeupTypeCounts["특수분장"]).toBe(0);
  });
});

describe("useMakeupHair - updatePlan", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-1");
  });

  it("존재하지 않는 planId 수정 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updatePlan("non-existent", { memberName: "새이름" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 planId 수정 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan({ memberName: "A", scene: 1, makeupType: "내추럴", hairStyle: "업스타일", colorTone: null, memo: null });
      planId = plan.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.updatePlan(planId!, { memberName: "수정됨" });
    });
    expect(ret!).toBe(true);
  });
});

describe("useMakeupHair - deletePlan", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-1");
  });

  it("존재하지 않는 planId 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deletePlan("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 planId 삭제 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan({ memberName: "A", scene: 1, makeupType: "내추럴", hairStyle: "업스타일", colorTone: null, memo: null });
      planId = plan.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.deletePlan(planId!);
    });
    expect(ret!).toBe(true);
  });

  it("삭제 후 totalPlans가 감소한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let planId: string;
    act(() => {
      const plan = result.current.addPlan({ memberName: "A", scene: 1, makeupType: "내추럴", hairStyle: "업스타일", colorTone: null, memo: null });
      planId = plan.id;
    });
    act(() => {
      result.current.deletePlan(planId!);
    });
    expect(result.current.stats.totalPlans).toBe(0);
  });
});

describe("useMakeupHair - 타임라인 CRUD", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-1");
  });

  it("addTimelineEntry가 id가 부여된 항목을 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let entry: ReturnType<typeof result.current.addTimelineEntry>;
    act(() => {
      entry = result.current.addTimelineEntry({ memberName: "홍", startTime: "08:00", durationMinutes: 30 });
    });
    expect(entry!.id).toBeDefined();
    expect(entry!.memberName).toBe("홍");
  });

  it("존재하지 않는 entryId 수정 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateTimelineEntry("non-existent", { memberName: "변경" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 entryId 수정 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let entryId: string;
    act(() => {
      const entry = result.current.addTimelineEntry({ memberName: "홍", startTime: "08:00", durationMinutes: 30 });
      entryId = entry.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.updateTimelineEntry(entryId!, { memberName: "수정됨" });
    });
    expect(ret!).toBe(true);
  });

  it("존재하지 않는 entryId 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteTimelineEntry("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 entryId 삭제 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let entryId: string;
    act(() => {
      const entry = result.current.addTimelineEntry({ memberName: "홍", startTime: "08:00", durationMinutes: 30 });
      entryId = entry.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.deleteTimelineEntry(entryId!);
    });
    expect(ret!).toBe(true);
  });

  it("타임라인 항목 추가 후 data.timeline 길이가 증가한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    act(() => {
      result.current.addTimelineEntry({ memberName: "홍", startTime: "08:00", durationMinutes: 30 });
    });
    expect(result.current.data.timeline).toHaveLength(1);
  });
});

describe("useMakeupHair - 체크리스트 CRUD", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-1");
  });

  it("addChecklistItem이 checked=false인 항목을 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let item: ReturnType<typeof result.current.addChecklistItem>;
    act(() => {
      item = result.current.addChecklistItem("파운데이션");
    });
    expect(item!.checked).toBe(false);
    expect(item!.item).toBe("파운데이션");
  });

  it("checklistTotal이 항목 추가 후 증가한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    act(() => {
      result.current.addChecklistItem("아이라이너");
    });
    expect(result.current.stats.checklistTotal).toBe(1);
  });

  it("toggleChecklistItem이 checked 상태를 토글한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let itemId: string;
    act(() => {
      const item = result.current.addChecklistItem("립스틱");
      itemId = item.id;
    });
    act(() => {
      result.current.toggleChecklistItem(itemId!);
    });
    expect(result.current.stats.checklistDone).toBe(1);
  });

  it("toggleChecklistItem 두 번 호출 시 원래 상태로 돌아온다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let itemId: string;
    act(() => {
      const item = result.current.addChecklistItem("블러셔");
      itemId = item.id;
    });
    act(() => {
      result.current.toggleChecklistItem(itemId!);
    });
    act(() => {
      result.current.toggleChecklistItem(itemId!);
    });
    expect(result.current.stats.checklistDone).toBe(0);
  });

  it("존재하지 않는 itemId 토글 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.toggleChecklistItem("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("deleteChecklistItem이 항목을 제거한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let itemId: string;
    act(() => {
      const item = result.current.addChecklistItem("마스카라");
      itemId = item.id;
    });
    act(() => {
      result.current.deleteChecklistItem(itemId!);
    });
    expect(result.current.stats.checklistTotal).toBe(0);
  });

  it("존재하지 않는 itemId 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteChecklistItem("non-existent");
    });
    expect(ret!).toBe(false);
  });
});

describe("useMakeupHair - 아티스트 CRUD", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-1");
  });

  it("addArtist가 id가 부여된 아티스트를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let artist: ReturnType<typeof result.current.addArtist>;
    act(() => {
      artist = result.current.addArtist({ name: "김메이크업", contact: "010-0000-0000", specialty: "스테이지 메이크업" });
    });
    expect(artist!.id).toBeDefined();
    expect(artist!.name).toBe("김메이크업");
  });

  it("존재하지 않는 artistId 수정 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateArtist("non-existent", { name: "수정됨" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 artistId 수정 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let artistId: string;
    act(() => {
      const artist = result.current.addArtist({ name: "이헤어", contact: null, specialty: null });
      artistId = artist.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.updateArtist(artistId!, { name: "수정됨" });
    });
    expect(ret!).toBe(true);
  });

  it("존재하지 않는 artistId 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteArtist("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 artistId 삭제 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    let artistId: string;
    act(() => {
      const artist = result.current.addArtist({ name: "박메이크업", contact: null, specialty: null });
      artistId = artist.id;
    });
    let ret: boolean;
    act(() => {
      ret = result.current.deleteArtist(artistId!);
    });
    expect(ret!).toBe(true);
  });

  it("아티스트 추가 후 data.artists 길이가 증가한다", () => {
    const { result } = renderHook(() => useMakeupHair("proj-1"));
    act(() => {
      result.current.addArtist({ name: "최헤어", contact: null, specialty: null });
    });
    expect(result.current.data.artists).toHaveLength(1);
  });
});

describe("useMakeupHair - localStorage 키 형식", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-abc");
  });

  it("저장 키가 dancebase:makeup-hair:{projectId} 형식이다", () => {
    localStorageMock.setItem.mockClear();
    const { result } = renderHook(() => useMakeupHair("proj-abc"));
    act(() => {
      result.current.addChecklistItem("테스트");
    });
    const calls = localStorageMock.setItem.mock.calls;
    expect(calls.some(([key]: [string]) => key === "dancebase:makeup-hair:proj-abc")).toBe(true);
  });
});

describe("useMakeupHair - 그룹별 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    initStorage("proj-AAA");
    initStorage("proj-BBB");
    initStorage("proj-X");
    initStorage("proj-Y");
  });

  it("다른 projectId는 서로 다른 키에 저장된다", () => {
    localStorageMock.setItem.mockClear();
    const { result: r1 } = renderHook(() => useMakeupHair("proj-AAA"));
    const { result: r2 } = renderHook(() => useMakeupHair("proj-BBB"));
    act(() => {
      r1.current.addChecklistItem("A항목");
    });
    act(() => {
      r2.current.addChecklistItem("B항목");
    });
    const calls = localStorageMock.setItem.mock.calls;
    const keysUsed = calls.map(([key]: [string]) => key);
    expect(keysUsed).toContain("dancebase:makeup-hair:proj-AAA");
    expect(keysUsed).toContain("dancebase:makeup-hair:proj-BBB");
  });

  it("한 프로젝트의 변경이 다른 프로젝트에 영향을 주지 않는다", () => {
    const { result: r1 } = renderHook(() => useMakeupHair("proj-X"));
    const { result: r2 } = renderHook(() => useMakeupHair("proj-Y"));
    act(() => {
      r1.current.addPlan({ memberName: "X멤버", scene: 1, makeupType: "내추럴", hairStyle: "업스타일", colorTone: null, memo: null });
    });
    expect(r1.current.stats.totalPlans).toBe(1);
    expect(r2.current.stats.totalPlans).toBe(0);
  });
});
