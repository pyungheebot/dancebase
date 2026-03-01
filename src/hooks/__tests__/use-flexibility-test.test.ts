import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (memStore[key] as T) ?? defaultValue,
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR 키 mock ───────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    flexibilityTest: (memberId: string) => `flexibility-test:${memberId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import {
  useFlexibilityTest,
  calcProgress,
  DEFAULT_FLEXIBILITY_ITEMS,
  FLEXIBILITY_UNIT_LABELS,
} from "@/hooks/use-flexibility-test";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function makeHook(memberId = "member-1") {
  return renderHook(() => useFlexibilityTest(memberId));
}

// ============================================================
// calcProgress 순수 함수 테스트
// ============================================================

describe("calcProgress - higherIsBetter=true 경우", () => {
  it("current === target 이면 100을 반환한다", () => {
    expect(calcProgress(50, 50, true)).toBe(100);
  });

  it("current가 target의 절반이면 50을 반환한다", () => {
    expect(calcProgress(25, 50, true)).toBe(50);
  });

  it("current가 target을 초과하면 100을 반환한다 (상한 제한)", () => {
    expect(calcProgress(120, 100, true)).toBe(100);
  });

  it("current가 0이면 0을 반환한다", () => {
    expect(calcProgress(0, 100, true)).toBe(0);
  });

  it("target이 0이면 0을 반환한다 (0 나눔 방지)", () => {
    expect(calcProgress(50, 0, true)).toBe(0);
  });

  it("소수점은 반올림된다", () => {
    // 33.33...% → 33
    expect(calcProgress(1, 3, true)).toBe(33);
  });
});

describe("calcProgress - higherIsBetter=false 경우 (낮을수록 좋음)", () => {
  it("current <= target 이면 100을 반환한다 (목표 달성)", () => {
    expect(calcProgress(10, 15, false)).toBe(100);
  });

  it("current === target 이면 100을 반환한다", () => {
    expect(calcProgress(15, 15, false)).toBe(100);
  });

  it("current가 target*2 이상이면 0을 반환한다 (최악 케이스)", () => {
    expect(calcProgress(30, 15, false)).toBe(0);
  });

  it("current가 target과 worstCase 중간이면 약 50을 반환한다", () => {
    // target=10, worstCase=20, current=15 → (20-15)/10 = 50
    expect(calcProgress(15, 10, false)).toBe(50);
  });

  it("target이 0이면 0을 반환한다", () => {
    expect(calcProgress(5, 0, false)).toBe(0);
  });
});

// ============================================================
// DEFAULT_FLEXIBILITY_ITEMS 상수
// ============================================================

describe("DEFAULT_FLEXIBILITY_ITEMS 상수", () => {
  it("8개의 기본 항목을 포함한다", () => {
    expect(DEFAULT_FLEXIBILITY_ITEMS).toHaveLength(8);
  });

  it("첫 번째 항목 key는 sit_and_reach 이다", () => {
    expect(DEFAULT_FLEXIBILITY_ITEMS[0].key).toBe("sit_and_reach");
  });

  it("모든 항목에 name이 존재한다", () => {
    DEFAULT_FLEXIBILITY_ITEMS.forEach((item) => {
      expect(item.name).toBeTruthy();
    });
  });

  it("모든 항목에 unit이 존재한다", () => {
    DEFAULT_FLEXIBILITY_ITEMS.forEach((item) => {
      expect(item.unit).toBeTruthy();
    });
  });

  it("shoulder_flexibility 항목은 higherIsBetter가 false이다 (낮을수록 유연)", () => {
    const item = DEFAULT_FLEXIBILITY_ITEMS.find(
      (i) => i.key === "shoulder_flexibility"
    );
    expect(item?.higherIsBetter).toBe(false);
  });

  it("sit_and_reach 항목은 higherIsBetter가 true이다", () => {
    const item = DEFAULT_FLEXIBILITY_ITEMS.find(
      (i) => i.key === "sit_and_reach"
    );
    expect(item?.higherIsBetter).toBe(true);
  });
});

// ============================================================
// FLEXIBILITY_UNIT_LABELS 상수
// ============================================================

describe("FLEXIBILITY_UNIT_LABELS 상수", () => {
  it("cm 레이블은 'cm'이다", () => {
    expect(FLEXIBILITY_UNIT_LABELS["cm"]).toBe("cm");
  });

  it("도 레이블은 '도'이다", () => {
    expect(FLEXIBILITY_UNIT_LABELS["도"]).toBe("도");
  });

  it("초 레이블은 '초'이다", () => {
    expect(FLEXIBILITY_UNIT_LABELS["초"]).toBe("초");
  });

  it("기타 레이블은 '기타'이다", () => {
    expect(FLEXIBILITY_UNIT_LABELS["기타"]).toBe("기타");
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useFlexibilityTest - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 items는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.items).toEqual([]);
  });

  it("초기 records는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.records).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("latestRecord는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.latestRecord).toBeNull();
  });

  it("overallProgress는 null이다 (목표값 없음)", () => {
    const { result } = makeHook();
    expect(result.current.overallProgress).toBeNull();
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.initDefaultItems).toBe("function");
    expect(typeof result.current.addItem).toBe("function");
    expect(typeof result.current.updateItemTarget).toBe("function");
    expect(typeof result.current.deleteItem).toBe("function");
    expect(typeof result.current.addRecord).toBe("function");
    expect(typeof result.current.deleteRecord).toBe("function");
    expect(typeof result.current.getLatestValue).toBe("function");
    expect(typeof result.current.getItemProgress).toBe("function");
    expect(typeof result.current.getItemHistory).toBe("function");
  });
});

// ============================================================
// initDefaultItems
// ============================================================

describe("useFlexibilityTest - initDefaultItems", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("initDefaultItems 호출 후 items 길이가 8이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.initDefaultItems();
    });
    expect(result.current.items).toHaveLength(8);
  });

  it("이미 items가 있으면 initDefaultItems를 호출해도 중복 추가되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.initDefaultItems();
    });
    act(() => {
      result.current.initDefaultItems();
    });
    expect(result.current.items).toHaveLength(8);
  });

  it("initDefaultItems로 생성된 항목에 id가 부여된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.initDefaultItems();
    });
    result.current.items.forEach((item) => {
      expect(item.id).toBeTruthy();
    });
  });
});

// ============================================================
// addItem
// ============================================================

describe("useFlexibilityTest - addItem", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("addItem 호출 후 items 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem("커스텀 항목", "cm", true);
    });
    expect(result.current.items).toHaveLength(1);
  });

  it("추가된 항목의 name이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem("다리 유연성", "도", true);
    });
    expect(result.current.items[0].name).toBe("다리 유연성");
  });

  it("추가된 항목의 unit이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem("테스트", "초", false);
    });
    expect(result.current.items[0].unit).toBe("초");
  });

  it("추가된 항목의 higherIsBetter가 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem("어깨 거리", "cm", false);
    });
    expect(result.current.items[0].higherIsBetter).toBe(false);
  });

  it("targetValue를 지정하면 항목에 반영된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem("스플릿 각도", "도", true, 180);
    });
    expect(result.current.items[0].targetValue).toBe(180);
  });

  it("description을 지정하면 항목에 반영된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem("테스트", "cm", true, undefined, "설명입니다");
    });
    expect(result.current.items[0].description).toBe("설명입니다");
  });

  it("반환된 항목 객체에 id가 있다", () => {
    const { result } = makeHook();
    let returned: ReturnType<typeof result.current.addItem>;
    act(() => {
      returned = result.current.addItem("테스트", "cm", true);
    });
    expect(returned!.id).toBeTruthy();
  });

  it("key는 'custom'으로 설정된다", () => {
    const { result } = makeHook();
    let returned: ReturnType<typeof result.current.addItem>;
    act(() => {
      returned = result.current.addItem("테스트", "cm", true);
    });
    expect(returned!.key).toBe("custom");
  });

  it("여러 항목을 순차적으로 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem("항목1", "cm", true);
    });
    act(() => {
      result.current.addItem("항목2", "도", false);
    });
    expect(result.current.items).toHaveLength(2);
  });
});

// ============================================================
// updateItemTarget
// ============================================================

describe("useFlexibilityTest - updateItemTarget", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("목표값을 업데이트하면 항목에 반영된다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트", "cm", true);
    });
    act(() => {
      result.current.updateItemTarget(item!.id, 50);
    });
    expect(result.current.items[0].targetValue).toBe(50);
  });

  it("목표값을 undefined로 설정할 수 있다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트", "cm", true, 50);
    });
    act(() => {
      result.current.updateItemTarget(item!.id, undefined);
    });
    expect(result.current.items[0].targetValue).toBeUndefined();
  });

  it("존재하지 않는 id로 호출해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.updateItemTarget("non-existent", 100);
      });
    }).not.toThrow();
  });
});

// ============================================================
// deleteItem
// ============================================================

describe("useFlexibilityTest - deleteItem", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("항목 삭제 후 items 길이가 감소한다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("삭제 테스트", "cm", true);
    });
    act(() => {
      result.current.deleteItem(item!.id);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("항목 삭제 시 연관 기록의 entry도 제거된다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("삭제 항목", "cm", true);
    });
    act(() => {
      result.current.addRecord("2026-03-01", [{ itemId: item!.id, value: 30 }]);
    });
    act(() => {
      result.current.deleteItem(item!.id);
    });
    expect(result.current.records[0].entries).toHaveLength(0);
  });

  it("특정 항목만 삭제되고 다른 항목은 유지된다", () => {
    const { result } = makeHook();
    let item1: ReturnType<typeof result.current.addItem>;
    act(() => {
      item1 = result.current.addItem("항목A", "cm", true);
      result.current.addItem("항목B", "도", false);
    });
    act(() => {
      result.current.deleteItem(item1!.id);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("항목B");
  });
});

// ============================================================
// addRecord & deleteRecord
// ============================================================

describe("useFlexibilityTest - addRecord", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("기록 추가 후 records 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord("2026-03-01", []);
    });
    expect(result.current.records).toHaveLength(1);
  });

  it("추가된 기록의 date가 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord("2026-03-01", []);
    });
    expect(result.current.records[0].date).toBe("2026-03-01");
  });

  it("notes가 포함된 기록을 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord("2026-03-01", [], "컨디션 좋음");
    });
    expect(result.current.records[0].notes).toBe("컨디션 좋음");
  });

  it("entries가 포함된 기록을 추가할 수 있다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트 항목", "cm", true);
    });
    act(() => {
      result.current.addRecord("2026-03-01", [{ itemId: item!.id, value: 45 }]);
    });
    expect(result.current.records[0].entries).toHaveLength(1);
    expect(result.current.records[0].entries[0].value).toBe(45);
  });

  it("반환된 기록 객체에 id가 있다", () => {
    const { result } = makeHook();
    let returned: ReturnType<typeof result.current.addRecord>;
    act(() => {
      returned = result.current.addRecord("2026-03-01", []);
    });
    expect(returned!.id).toBeTruthy();
  });

  it("여러 기록을 추가하면 날짜 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord("2026-01-01", []);
    });
    act(() => {
      result.current.addRecord("2026-03-01", []);
    });
    act(() => {
      result.current.addRecord("2026-02-01", []);
    });
    expect(result.current.records[0].date).toBe("2026-03-01");
    expect(result.current.records[1].date).toBe("2026-02-01");
    expect(result.current.records[2].date).toBe("2026-01-01");
  });
});

describe("useFlexibilityTest - deleteRecord", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("기록 삭제 후 records 길이가 감소한다", () => {
    const { result } = makeHook();
    let rec: ReturnType<typeof result.current.addRecord>;
    act(() => {
      rec = result.current.addRecord("2026-03-01", []);
    });
    act(() => {
      result.current.deleteRecord(rec!.id);
    });
    expect(result.current.records).toHaveLength(0);
  });

  it("특정 기록만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    let rec1: ReturnType<typeof result.current.addRecord>;
    act(() => {
      rec1 = result.current.addRecord("2026-01-01", []);
      result.current.addRecord("2026-02-01", []);
    });
    act(() => {
      result.current.deleteRecord(rec1!.id);
    });
    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].date).toBe("2026-02-01");
  });
});

// ============================================================
// getLatestValue, getItemProgress, getItemHistory
// ============================================================

describe("useFlexibilityTest - getLatestValue", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("기록이 없으면 null을 반환한다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트", "cm", true);
    });
    expect(result.current.getLatestValue(item!.id)).toBeNull();
  });

  it("가장 최신 기록의 값을 반환한다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트", "cm", true);
    });
    act(() => {
      result.current.addRecord("2026-01-01", [{ itemId: item!.id, value: 30 }]);
      result.current.addRecord("2026-03-01", [{ itemId: item!.id, value: 45 }]);
    });
    expect(result.current.getLatestValue(item!.id)).toBe(45);
  });
});

describe("useFlexibilityTest - getItemProgress", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("목표값이 없으면 null을 반환한다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트", "cm", true);
    });
    expect(result.current.getItemProgress(item!.id)).toBeNull();
  });

  it("기록이 없으면 0을 반환한다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트", "cm", true, 100);
    });
    expect(result.current.getItemProgress(item!.id)).toBe(0);
  });

  it("목표값과 최신값으로 진행률을 계산한다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트", "cm", true, 100);
    });
    act(() => {
      result.current.addRecord("2026-03-01", [{ itemId: item!.id, value: 50 }]);
    });
    expect(result.current.getItemProgress(item!.id)).toBe(50);
  });
});

describe("useFlexibilityTest - getItemHistory", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("기록이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트", "cm", true);
    });
    expect(result.current.getItemHistory(item!.id)).toEqual([]);
  });

  it("날짜 오름차순으로 이력을 반환한다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트", "cm", true);
    });
    act(() => {
      result.current.addRecord("2026-03-01", [{ itemId: item!.id, value: 45 }]);
    });
    act(() => {
      result.current.addRecord("2026-01-01", [{ itemId: item!.id, value: 30 }]);
    });
    const history = result.current.getItemHistory(item!.id);
    expect(history[0].date).toBe("2026-01-01");
    expect(history[1].date).toBe("2026-03-01");
  });

  it("날짜와 값 쌍을 올바르게 반환한다", () => {
    const { result } = makeHook();
    let item: ReturnType<typeof result.current.addItem>;
    act(() => {
      item = result.current.addItem("테스트", "cm", true);
    });
    act(() => {
      result.current.addRecord("2026-03-01", [{ itemId: item!.id, value: 55 }]);
    });
    const history = result.current.getItemHistory(item!.id);
    expect(history[0]).toEqual({ date: "2026-03-01", value: 55 });
  });
});

// ============================================================
// overallProgress & latestRecord
// ============================================================

describe("useFlexibilityTest - overallProgress", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("목표값이 있는 항목의 진행률 평균을 계산한다", () => {
    const { result } = makeHook();
    let item1: ReturnType<typeof result.current.addItem>;
    act(() => {
      item1 = result.current.addItem("항목A", "cm", true, 100);
    });
    act(() => {
      result.current.addRecord("2026-03-01", [
        { itemId: item1!.id, value: 50 },
      ]);
    });
    // 50% = 50%
    expect(result.current.overallProgress).toBe(50);
  });

  it("목표값이 없는 항목만 있으면 null이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addItem("항목A", "cm", true);
    });
    expect(result.current.overallProgress).toBeNull();
  });
});

describe("useFlexibilityTest - latestRecord", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("기록이 추가되면 latestRecord가 null이 아니다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord("2026-03-01", []);
    });
    expect(result.current.latestRecord).not.toBeNull();
  });

  it("여러 기록 중 가장 최신 날짜 기록을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRecord("2026-01-01", []);
      result.current.addRecord("2026-03-01", []);
    });
    expect(result.current.latestRecord?.date).toBe("2026-03-01");
  });
});
