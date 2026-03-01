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

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import {
  useFitnessTest,
  FITNESS_CATEGORY_LABELS,
  FITNESS_CATEGORY_COLORS,
  FITNESS_CATEGORY_ORDER,
} from "@/hooks/use-fitness-test";
import type { FitnessTestCategory } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────

function makeHook(groupId = "group-1") {
  return renderHook(() => useFitnessTest(groupId));
}

function addTestItem(
  hook: ReturnType<typeof makeHook>["result"],
  name = "왕복달리기",
  category: FitnessTestCategory = "agility",
  unit = "회",
  higherIsBetter = true
) {
  act(() => {
    hook.current.addTestItem(name, category, unit, higherIsBetter);
  });
}

function addResult(
  hook: ReturnType<typeof makeHook>["result"],
  memberName = "홍길동",
  date = "2026-03-02",
  category: FitnessTestCategory = "agility",
  itemName = "왕복달리기",
  value = 80
) {
  let result: ReturnType<ReturnType<typeof useFitnessTest>["addResult"]>;
  act(() => {
    result = hook.current.addResult(memberName, date, [
      { itemName, value, category },
    ]);
  });
  return result!;
}

// ============================================================
// 상수 검증
// ============================================================

describe("FITNESS_CATEGORY_LABELS 상수", () => {
  it("6가지 카테고리 레이블을 포함한다", () => {
    const categories: FitnessTestCategory[] = [
      "flexibility",
      "endurance",
      "strength",
      "balance",
      "agility",
      "rhythm",
    ];
    categories.forEach((cat) => {
      expect(FITNESS_CATEGORY_LABELS[cat]).toBeDefined();
    });
  });

  it("flexibility 레이블은 '유연성'이다", () => {
    expect(FITNESS_CATEGORY_LABELS.flexibility).toBe("유연성");
  });

  it("agility 레이블은 '민첩성'이다", () => {
    expect(FITNESS_CATEGORY_LABELS.agility).toBe("민첩성");
  });

  it("rhythm 레이블은 '리듬감'이다", () => {
    expect(FITNESS_CATEGORY_LABELS.rhythm).toBe("리듬감");
  });
});

describe("FITNESS_CATEGORY_COLORS 상수", () => {
  it("각 카테고리에 badge, text, bar, bg 색상이 존재한다", () => {
    FITNESS_CATEGORY_ORDER.forEach((cat) => {
      const colors = FITNESS_CATEGORY_COLORS[cat];
      expect(colors.badge).toBeDefined();
      expect(colors.text).toBeDefined();
      expect(colors.bar).toBeDefined();
      expect(colors.bg).toBeDefined();
    });
  });

  it("flexibility는 pink 계열 색상을 사용한다", () => {
    expect(FITNESS_CATEGORY_COLORS.flexibility.bar).toContain("pink");
  });
});

describe("FITNESS_CATEGORY_ORDER 상수", () => {
  it("6개 카테고리를 포함한다", () => {
    expect(FITNESS_CATEGORY_ORDER).toHaveLength(6);
  });

  it("첫 번째 카테고리는 flexibility이다", () => {
    expect(FITNESS_CATEGORY_ORDER[0]).toBe("flexibility");
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useFitnessTest - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 testItems는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.testItems).toEqual([]);
  });

  it("초기 results는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.results).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalResults는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalResults).toBe(0);
  });

  it("초기 stats.averageByCategory의 모든 값은 null이다", () => {
    const { result } = makeHook();
    FITNESS_CATEGORY_ORDER.forEach((cat) => {
      expect(result.current.stats.averageByCategory[cat]).toBeNull();
    });
  });

  it("초기 stats.topPerformer의 모든 값은 null이다", () => {
    const { result } = makeHook();
    FITNESS_CATEGORY_ORDER.forEach((cat) => {
      expect(result.current.stats.topPerformer[cat]).toBeNull();
    });
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addTestItem).toBe("function");
    expect(typeof result.current.deleteTestItem).toBe("function");
    expect(typeof result.current.addResult).toBe("function");
    expect(typeof result.current.deleteResult).toBe("function");
    expect(typeof result.current.getMemberHistory).toBe("function");
    expect(typeof result.current.compareResults).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addTestItem
// ============================================================

describe("useFitnessTest - addTestItem", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("항목 추가 후 testItems 길이가 1이 된다", () => {
    const { result } = makeHook();
    addTestItem(result);
    expect(result.current.testItems).toHaveLength(1);
  });

  it("추가된 항목의 name이 올바르다", () => {
    const { result } = makeHook();
    addTestItem(result, "팔굽혀펴기", "strength", "회", true);
    expect(result.current.testItems[0].name).toBe("팔굽혀펴기");
  });

  it("추가된 항목의 category가 올바르다", () => {
    const { result } = makeHook();
    addTestItem(result, "팔굽혀펴기", "strength", "회", true);
    expect(result.current.testItems[0].category).toBe("strength");
  });

  it("추가된 항목의 unit이 올바르다", () => {
    const { result } = makeHook();
    addTestItem(result, "제자리멀리뛰기", "agility", "cm", true);
    expect(result.current.testItems[0].unit).toBe("cm");
  });

  it("추가된 항목의 higherIsBetter가 올바르다", () => {
    const { result } = makeHook();
    addTestItem(result, "100m달리기", "endurance", "초", false);
    expect(result.current.testItems[0].higherIsBetter).toBe(false);
  });

  it("동일 이름의 항목을 다시 추가해도 중복되지 않는다", () => {
    const { result } = makeHook();
    addTestItem(result, "왕복달리기");
    addTestItem(result, "왕복달리기");
    expect(result.current.testItems).toHaveLength(1);
  });

  it("서로 다른 이름의 항목을 여러 개 추가할 수 있다", () => {
    const { result } = makeHook();
    addTestItem(result, "항목A", "flexibility");
    addTestItem(result, "항목B", "endurance");
    addTestItem(result, "항목C", "strength");
    expect(result.current.testItems).toHaveLength(3);
  });
});

// ============================================================
// deleteTestItem
// ============================================================

describe("useFitnessTest - deleteTestItem", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("항목 삭제 후 testItems 길이가 감소한다", () => {
    const { result } = makeHook();
    addTestItem(result, "팔굽혀펴기");
    act(() => {
      result.current.deleteTestItem("팔굽혀펴기");
    });
    expect(result.current.testItems).toHaveLength(0);
  });

  it("삭제된 항목과 관련된 결과의 testItems도 정리된다", () => {
    const { result } = makeHook();
    addTestItem(result, "팔굽혀펴기", "strength");
    addResult(result, "홍길동", "2026-03-02", "strength", "팔굽혀펴기", 50);
    act(() => {
      result.current.deleteTestItem("팔굽혀펴기");
    });
    const resultEntry = result.current.results[0];
    const hasItem = resultEntry?.testItems.some(
      (ti) => ti.itemName === "팔굽혀펴기"
    );
    expect(hasItem).toBeFalsy();
  });

  it("존재하지 않는 이름 삭제 시 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteTestItem("없는항목");
      });
    }).not.toThrow();
  });

  it("특정 항목만 삭제되고 다른 항목은 유지된다", () => {
    const { result } = makeHook();
    addTestItem(result, "항목A");
    addTestItem(result, "항목B");
    act(() => {
      result.current.deleteTestItem("항목A");
    });
    expect(result.current.testItems).toHaveLength(1);
    expect(result.current.testItems[0].name).toBe("항목B");
  });
});

// ============================================================
// addResult
// ============================================================

describe("useFitnessTest - addResult", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("결과 추가 후 results 길이가 1이 된다", () => {
    const { result } = makeHook();
    addResult(result);
    expect(result.current.results).toHaveLength(1);
  });

  it("추가된 결과의 memberName이 올바르다", () => {
    const { result } = makeHook();
    addResult(result, "김철수");
    expect(result.current.results[0].memberName).toBe("김철수");
  });

  it("추가된 결과의 date가 올바르다", () => {
    const { result } = makeHook();
    addResult(result, "홍길동", "2026-01-15");
    expect(result.current.results[0].date).toBe("2026-01-15");
  });

  it("추가된 결과에 id가 부여된다", () => {
    const { result } = makeHook();
    addResult(result);
    expect(result.current.results[0].id).toBeDefined();
  });

  it("추가된 결과에 createdAt이 설정된다", () => {
    const { result } = makeHook();
    addResult(result);
    expect(result.current.results[0].createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T/
    );
  });

  it("반환된 결과 객체가 올바른 memberName을 갖는다", () => {
    const { result } = makeHook();
    const returned = addResult(result, "이영희");
    expect(returned.memberName).toBe("이영희");
  });

  it("notes가 포함된 결과를 추가할 수 있다", () => {
    let returned: ReturnType<ReturnType<typeof useFitnessTest>["addResult"]>;
    const { result } = makeHook();
    act(() => {
      returned = result.current.addResult(
        "홍길동",
        "2026-03-02",
        [{ itemName: "왕복달리기", value: 80, category: "agility" }],
        "컨디션 양호"
      );
    });
    expect(returned!.notes).toBe("컨디션 양호");
  });

  it("여러 멤버의 결과를 추가할 수 있다", () => {
    const { result } = makeHook();
    addResult(result, "멤버A");
    addResult(result, "멤버B");
    expect(result.current.results).toHaveLength(2);
  });
});

// ============================================================
// deleteResult
// ============================================================

describe("useFitnessTest - deleteResult", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("결과 삭제 후 results 길이가 감소한다", () => {
    const { result } = makeHook();
    const entry = addResult(result);
    act(() => {
      result.current.deleteResult(entry.id);
    });
    expect(result.current.results).toHaveLength(0);
  });

  it("특정 결과만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    const entry1 = addResult(result, "멤버A", "2026-03-01");
    addResult(result, "멤버B", "2026-03-02");
    act(() => {
      result.current.deleteResult(entry1.id);
    });
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].memberName).toBe("멤버B");
  });

  it("존재하지 않는 id 삭제 시 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteResult("non-existent-id");
      });
    }).not.toThrow();
  });
});

// ============================================================
// getMemberHistory
// ============================================================

describe("useFitnessTest - getMemberHistory", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("특정 멤버의 결과만 반환한다", () => {
    const { result } = makeHook();
    addResult(result, "홍길동", "2026-03-01");
    addResult(result, "김철수", "2026-03-02");
    const history = result.current.getMemberHistory("홍길동");
    expect(history).toHaveLength(1);
    expect(history[0].memberName).toBe("홍길동");
  });

  it("존재하지 않는 멤버는 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    addResult(result, "홍길동");
    const history = result.current.getMemberHistory("없는멤버");
    expect(history).toEqual([]);
  });

  it("날짜 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    addResult(result, "홍길동", "2026-01-01");
    addResult(result, "홍길동", "2026-03-01");
    addResult(result, "홍길동", "2026-02-01");
    const history = result.current.getMemberHistory("홍길동");
    expect(history[0].date).toBe("2026-03-01");
    expect(history[1].date).toBe("2026-02-01");
    expect(history[2].date).toBe("2026-01-01");
  });

  it("멤버의 모든 결과를 반환한다", () => {
    const { result } = makeHook();
    addResult(result, "홍길동", "2026-01-01");
    addResult(result, "홍길동", "2026-02-01");
    const history = result.current.getMemberHistory("홍길동");
    expect(history).toHaveLength(2);
  });
});

// ============================================================
// compareResults
// ============================================================

describe("useFitnessTest - compareResults", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("두 날짜의 점수 차이(diff)를 올바르게 계산한다", () => {
    const { result } = makeHook();
    addTestItem(result, "왕복달리기", "agility", "회", true);
    // 두 결과를 순차적으로 각각 act로 추가
    addResult(result, "홍길동", "2026-01-01", "agility", "왕복달리기", 70);
    addResult(result, "홍길동", "2026-03-01", "agility", "왕복달리기", 85);
    const comparison = result.current.compareResults(
      "홍길동",
      "2026-01-01",
      "2026-03-01"
    );
    expect(comparison[0].diff).toBe(15);
  });

  it("higherIsBetter=true일 때 diff>0이면 improved=true이다", () => {
    const { result } = makeHook();
    addTestItem(result, "왕복달리기", "agility", "회", true);
    addResult(result, "홍길동", "2026-01-01", "agility", "왕복달리기", 70);
    addResult(result, "홍길동", "2026-03-01", "agility", "왕복달리기", 85);
    const comparison = result.current.compareResults(
      "홍길동",
      "2026-01-01",
      "2026-03-01"
    );
    expect(comparison[0].improved).toBe(true);
  });

  it("higherIsBetter=false일 때 diff<0이면 improved=true이다", () => {
    const { result } = makeHook();
    addTestItem(result, "100m달리기", "endurance", "초", false);
    addResult(result, "홍길동", "2026-01-01", "endurance", "100m달리기", 15);
    addResult(result, "홍길동", "2026-03-01", "endurance", "100m달리기", 13);
    const comparison = result.current.compareResults(
      "홍길동",
      "2026-01-01",
      "2026-03-01"
    );
    expect(comparison[0].improved).toBe(true);
  });

  it("date1만 존재하는 항목의 value2는 null이다", () => {
    const { result } = makeHook();
    addTestItem(result, "왕복달리기", "agility", "회", true);
    addResult(result, "홍길동", "2026-01-01", "agility", "왕복달리기", 70);
    const comparison = result.current.compareResults(
      "홍길동",
      "2026-01-01",
      "2026-03-01"
    );
    expect(comparison[0].value2).toBeNull();
  });

  it("두 날짜 모두 결과가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const comparison = result.current.compareResults(
      "홍길동",
      "2026-01-01",
      "2026-03-01"
    );
    expect(comparison).toEqual([]);
  });
});

// ============================================================
// stats
// ============================================================

describe("useFitnessTest - stats", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("결과 추가 후 totalResults가 증가한다", () => {
    const { result } = makeHook();
    addResult(result, "홍길동");
    addResult(result, "김철수");
    expect(result.current.stats.totalResults).toBe(2);
  });

  it("카테고리별 평균이 올바르게 계산된다", () => {
    const { result } = makeHook();
    addTestItem(result, "왕복달리기", "agility", "회", true);
    addResult(result, "홍길동", "2026-03-01", "agility", "왕복달리기", 80);
    addResult(result, "김철수", "2026-03-02", "agility", "왕복달리기", 60);
    expect(result.current.stats.averageByCategory.agility).toBe(70);
  });

  it("결과가 없는 카테고리의 평균은 null이다", () => {
    const { result } = makeHook();
    addResult(result, "홍길동", "2026-03-01", "agility");
    expect(result.current.stats.averageByCategory.flexibility).toBeNull();
  });

  it("higherIsBetter=true일 때 topPerformer는 최고 점수 멤버이다", () => {
    const { result } = makeHook();
    addTestItem(result, "왕복달리기", "agility", "회", true);
    // 홍길동: 90, 김철수: 60 → 홍길동이 topPerformer
    addResult(result, "홍길동", "2026-03-01", "agility", "왕복달리기", 90);
    addResult(result, "김철수", "2026-03-02", "agility", "왕복달리기", 60);
    expect(result.current.stats.topPerformer.agility?.memberName).toBe(
      "홍길동"
    );
  });

  it("결과 삭제 후 totalResults가 감소한다", () => {
    const { result } = makeHook();
    const entry = addResult(result);
    act(() => {
      result.current.deleteResult(entry.id);
    });
    expect(result.current.stats.totalResults).toBe(0);
  });
});
