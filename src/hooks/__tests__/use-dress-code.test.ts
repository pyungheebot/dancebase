import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ───────────────────────────────────────
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

import { useDressCode } from "@/hooks/use-dress-code";
import type { DressCodeSet, DressCodeGuideItem } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeSet(overrides?: Partial<DressCodeSet>): DressCodeSet {
  return {
    id: "set-1",
    projectId: "proj-1",
    performanceName: "연말 공연",
    guides: [],
    memberStatuses: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeGuide(overrides?: Partial<DressCodeGuideItem>): DressCodeGuideItem {
  return {
    id: "guide-1",
    category: "outfit",
    title: "검정 의상",
    description: "전신 검정 의상 착용",
    isRequired: true,
    ...overrides,
  };
}

function seedSets(groupId: string, projectId: string, sets: DressCodeSet[]) {
  const key = `dancebase:dress-code:${groupId}:${projectId}`;
  localStorageMock.getItem.mockImplementation((k: string) =>
    k === key ? JSON.stringify(sets) : null
  );
}

// ─── 초기 상태 ──────────────────────────────────────────────
describe("useDressCode - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  it("초기 sets는 빈 배열이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.sets).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalSets는 0이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.stats.totalSets).toBe(0);
  });

  it("초기 stats.totalGuides는 0이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.stats.totalGuides).toBe(0);
  });

  it("초기 stats.overallReadiness는 0이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.stats.overallReadiness).toBe(0);
  });

  it("필수 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(typeof result.current.addSet).toBe("function");
    expect(typeof result.current.updateSet).toBe("function");
    expect(typeof result.current.deleteSet).toBe("function");
    expect(typeof result.current.addGuide).toBe("function");
    expect(typeof result.current.updateGuide).toBe("function");
    expect(typeof result.current.deleteGuide).toBe("function");
    expect(typeof result.current.toggleMemberReady).toBe("function");
    expect(typeof result.current.getMemberReadiness).toBe("function");
    expect(typeof result.current.getCategoryLabel).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ─── addSet ──────────────────────────────────────────────────
describe("useDressCode - addSet", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  it("세트를 추가하면 반환된다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let newSet: DressCodeSet;
    act(() => {
      newSet = result.current.addSet("연말 공연");
    });
    expect(newSet!).toBeDefined();
    expect(newSet!.performanceName).toBe("연말 공연");
  });

  it("추가된 세트의 guides는 빈 배열이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let newSet: DressCodeSet;
    act(() => {
      newSet = result.current.addSet("연말 공연");
    });
    expect(newSet!.guides).toEqual([]);
  });

  it("추가된 세트의 memberStatuses는 빈 배열이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let newSet: DressCodeSet;
    act(() => {
      newSet = result.current.addSet("연말 공연");
    });
    expect(newSet!.memberStatuses).toEqual([]);
  });

  it("추가된 세트의 projectId가 올바르다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-abc"));
    let newSet: DressCodeSet;
    act(() => {
      newSet = result.current.addSet("공연A");
    });
    expect(newSet!.projectId).toBe("proj-abc");
  });

  it("세트 추가 후 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    act(() => {
      result.current.addSet("공연A");
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ─── updateSet ───────────────────────────────────────────────
describe("useDressCode - updateSet", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 세트 수정 시 false를 반환한다", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateSet("non-existent", { performanceName: "새 공연" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 세트 수정 시 true를 반환한다", () => {
    const set = makeSet();
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateSet("set-1", { performanceName: "수정된 공연" });
    });
    expect(ret!).toBe(true);
  });

  it("수정된 이름이 localStorage에 반영된다", () => {
    const set = makeSet();
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    act(() => {
      result.current.updateSet("set-1", { performanceName: "수정된 공연" });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].performanceName).toBe("수정된 공연");
  });
});

// ─── deleteSet ───────────────────────────────────────────────
describe("useDressCode - deleteSet", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 세트 삭제 시 false를 반환한다", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteSet("non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("존재하는 세트 삭제 시 true를 반환한다", () => {
    const set = makeSet();
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteSet("set-1");
    });
    expect(ret!).toBe(true);
  });

  it("삭제 후 localStorage에서 제거된다", () => {
    const s1 = makeSet({ id: "set-1", performanceName: "공연A" });
    const s2 = makeSet({ id: "set-2", performanceName: "공연B" });
    seedSets("group-1", "proj-1", [s1, s2]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    act(() => {
      result.current.deleteSet("set-1");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe("set-2");
  });
});

// ─── addGuide ────────────────────────────────────────────────
describe("useDressCode - addGuide", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 세트에 가이드 추가 시 null을 반환한다", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: DressCodeGuideItem | null;
    act(() => {
      ret = result.current.addGuide("non-existent", {
        category: "outfit",
        title: "검정 의상",
        description: "전신 검정",
        isRequired: true,
      });
    });
    expect(ret!).toBeNull();
  });

  it("정상 가이드 추가 시 가이드 객체를 반환한다", () => {
    const set = makeSet();
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: DressCodeGuideItem | null;
    act(() => {
      ret = result.current.addGuide("set-1", {
        category: "outfit",
        title: "검정 의상",
        description: "전신 검정",
        isRequired: true,
      });
    });
    expect(ret).not.toBeNull();
    expect(ret!.title).toBe("검정 의상");
  });

  it("추가된 가이드가 세트에 포함된다", () => {
    const set = makeSet();
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    act(() => {
      result.current.addGuide("set-1", {
        category: "hair",
        title: "헤어 업스타일",
        description: "올림머리",
        isRequired: false,
      });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].guides).toHaveLength(1);
    expect(saved[0].guides[0].category).toBe("hair");
  });
});

// ─── updateGuide ─────────────────────────────────────────────
describe("useDressCode - updateGuide", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 세트에서 가이드 수정 시 false를 반환한다", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateGuide("non-existent", "guide-1", { title: "수정" });
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 가이드 수정 시 false를 반환한다", () => {
    const set = makeSet();
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateGuide("set-1", "non-existent", { title: "수정" });
    });
    expect(ret!).toBe(false);
  });

  it("정상 수정 시 true를 반환한다", () => {
    const guide = makeGuide();
    const set = makeSet({ guides: [guide] });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.updateGuide("set-1", "guide-1", { title: "수정된 제목" });
    });
    expect(ret!).toBe(true);
  });

  it("수정된 title이 저장된다", () => {
    const guide = makeGuide();
    const set = makeSet({ guides: [guide] });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    act(() => {
      result.current.updateGuide("set-1", "guide-1", { title: "수정된 제목" });
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].guides[0].title).toBe("수정된 제목");
  });
});

// ─── deleteGuide ─────────────────────────────────────────────
describe("useDressCode - deleteGuide", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 세트에서 가이드 삭제 시 false를 반환한다", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteGuide("non-existent", "guide-1");
    });
    expect(ret!).toBe(false);
  });

  it("존재하지 않는 가이드 삭제 시 false를 반환한다", () => {
    const set = makeSet();
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteGuide("set-1", "non-existent");
    });
    expect(ret!).toBe(false);
  });

  it("정상 삭제 시 true를 반환한다", () => {
    const guide = makeGuide();
    const set = makeSet({ guides: [guide] });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.deleteGuide("set-1", "guide-1");
    });
    expect(ret!).toBe(true);
  });

  it("가이드 삭제 시 해당 가이드의 memberStatuses도 제거된다", () => {
    const guide = makeGuide();
    const set = makeSet({
      guides: [guide],
      memberStatuses: [
        { memberName: "홍길동", itemId: "guide-1", isReady: true },
        { memberName: "김철수", itemId: "guide-1", isReady: false },
      ],
    });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    act(() => {
      result.current.deleteGuide("set-1", "guide-1");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].memberStatuses).toHaveLength(0);
  });
});

// ─── toggleMemberReady ───────────────────────────────────────
describe("useDressCode - toggleMemberReady", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 세트에서 토글 시 false를 반환한다", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.toggleMemberReady("non-existent", "홍길동", "guide-1");
    });
    expect(ret!).toBe(false);
  });

  it("처음 토글 시 isReady: true로 추가된다", () => {
    const set = makeSet();
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    act(() => {
      result.current.toggleMemberReady("set-1", "홍길동", "guide-1");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    const status = saved[0].memberStatuses[0];
    expect(status.isReady).toBe(true);
    expect(status.memberName).toBe("홍길동");
    expect(status.itemId).toBe("guide-1");
  });

  it("두 번째 토글 시 isReady가 false로 바뀐다", () => {
    const set = makeSet({
      memberStatuses: [{ memberName: "홍길동", itemId: "guide-1", isReady: true }],
    });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    act(() => {
      result.current.toggleMemberReady("set-1", "홍길동", "guide-1");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].memberStatuses[0].isReady).toBe(false);
  });

  it("true->false->true 순서로 토글된다", () => {
    const set = makeSet({
      memberStatuses: [{ memberName: "홍길동", itemId: "guide-1", isReady: false }],
    });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    act(() => {
      result.current.toggleMemberReady("set-1", "홍길동", "guide-1");
    });
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].memberStatuses[0].isReady).toBe(true);
  });

  it("정상 토글 시 true를 반환한다", () => {
    const set = makeSet();
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: boolean;
    act(() => {
      ret = result.current.toggleMemberReady("set-1", "홍길동", "guide-1");
    });
    expect(ret!).toBe(true);
  });
});

// ─── getMemberReadiness ──────────────────────────────────────
describe("useDressCode - getMemberReadiness", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockClear();
  });

  it("존재하지 않는 세트에서 조회 시 빈 배열을 반환한다", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: unknown[];
    act(() => {
      ret = result.current.getMemberReadiness("non-existent", ["홍길동"]);
    });
    expect(ret!).toEqual([]);
  });

  it("memberNames가 비어있으면 빈 배열을 반환한다", () => {
    const set = makeSet({ guides: [makeGuide()] });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: unknown[];
    act(() => {
      ret = result.current.getMemberReadiness("set-1", []);
    });
    expect(ret!).toEqual([]);
  });

  it("가이드가 없으면 빈 배열을 반환한다", () => {
    const set = makeSet({ guides: [] });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let ret: unknown[];
    act(() => {
      ret = result.current.getMemberReadiness("set-1", ["홍길동"]);
    });
    expect(ret!).toEqual([]);
  });

  it("준비 완료 퍼센트가 정확히 계산된다", () => {
    const guide1 = makeGuide({ id: "g1" });
    const guide2 = makeGuide({ id: "g2" });
    const set = makeSet({
      guides: [guide1, guide2],
      memberStatuses: [
        { memberName: "홍길동", itemId: "g1", isReady: true },
        { memberName: "홍길동", itemId: "g2", isReady: false },
      ],
    });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let readiness: { memberName: string; percentage: number }[];
    act(() => {
      readiness = result.current.getMemberReadiness("set-1", ["홍길동"]);
    });
    expect(readiness![0].percentage).toBe(50);
  });

  it("모두 준비 완료 시 100%이다", () => {
    const guide = makeGuide();
    const set = makeSet({
      guides: [guide],
      memberStatuses: [{ memberName: "홍길동", itemId: "guide-1", isReady: true }],
    });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    let readiness: { memberName: string; percentage: number }[];
    act(() => {
      readiness = result.current.getMemberReadiness("set-1", ["홍길동"]);
    });
    expect(readiness![0].percentage).toBe(100);
  });
});

// ─── getCategoryLabel ────────────────────────────────────────
describe("useDressCode - getCategoryLabel", () => {
  it("outfit 카테고리 레이블은 '의상'이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.getCategoryLabel("outfit")).toBe("의상");
  });

  it("hair 카테고리 레이블은 '헤어'이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.getCategoryLabel("hair")).toBe("헤어");
  });

  it("makeup 카테고리 레이블은 '메이크업'이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.getCategoryLabel("makeup")).toBe("메이크업");
  });

  it("accessories 카테고리 레이블은 '악세사리'이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.getCategoryLabel("accessories")).toBe("악세사리");
  });

  it("shoes 카테고리 레이블은 '신발'이다", () => {
    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.getCategoryLabel("shoes")).toBe("신발");
  });
});

// ─── 통계 계산 ───────────────────────────────────────────────
describe("useDressCode - 통계 계산", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockClear();
  });

  it("totalSets가 정확히 반영된다", () => {
    const s1 = makeSet({ id: "s1" });
    const s2 = makeSet({ id: "s2" });
    seedSets("group-1", "proj-1", [s1, s2]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.stats.totalSets).toBe(2);
  });

  it("totalGuides가 모든 세트 가이드 합산이다", () => {
    const s1 = makeSet({ id: "s1", guides: [makeGuide({ id: "g1" }), makeGuide({ id: "g2" })] });
    const s2 = makeSet({ id: "s2", guides: [makeGuide({ id: "g3" })] });
    seedSets("group-1", "proj-1", [s1, s2]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.stats.totalGuides).toBe(3);
  });

  it("overallReadiness가 준비율로 계산된다", () => {
    const s1 = makeSet({
      id: "s1",
      guides: [makeGuide({ id: "g1" })],
      memberStatuses: [
        { memberName: "홍길동", itemId: "g1", isReady: true },
        { memberName: "김철수", itemId: "g1", isReady: false },
      ],
    });
    seedSets("group-1", "proj-1", [s1]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    // 2 statuses, 1 ready -> 50%
    expect(result.current.stats.overallReadiness).toBe(50);
  });

  it("memberStatuses가 없으면 overallReadiness는 0이다", () => {
    const set = makeSet({ guides: [makeGuide()] });
    seedSets("group-1", "proj-1", [set]);

    const { result } = renderHook(() => useDressCode("group-1", "proj-1"));
    expect(result.current.stats.overallReadiness).toBe(0);
  });
});

// ─── 그룹/프로젝트별 격리 ────────────────────────────────────
describe("useDressCode - 그룹/프로젝트별 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockClear();
  });

  it("같은 그룹이라도 다른 projectId는 독립적이다", () => {
    const s1 = makeSet({ id: "s1", performanceName: "공연A" });
    const s2 = makeSet({ id: "s2", performanceName: "공연B", projectId: "proj-2" });

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === "dancebase:dress-code:group-1:proj-1") return JSON.stringify([s1]);
      if (key === "dancebase:dress-code:group-1:proj-2") return JSON.stringify([s2]);
      return null;
    });

    const { result: r1 } = renderHook(() => useDressCode("group-1", "proj-1"));
    const { result: r2 } = renderHook(() => useDressCode("group-1", "proj-2"));

    expect(r1.current.sets[0].performanceName).toBe("공연A");
    expect(r2.current.sets[0].performanceName).toBe("공연B");
  });

  it("저장 시 키에 groupId와 projectId가 모두 포함된다", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useDressCode("my-group", "my-project"));
    act(() => {
      result.current.addSet("공연A");
    });
    const savedKey = localStorageMock.setItem.mock.calls[0][0];
    expect(savedKey).toContain("my-group");
    expect(savedKey).toContain("my-project");
  });
});
