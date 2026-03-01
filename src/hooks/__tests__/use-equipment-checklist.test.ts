import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

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

// ─── SWR mock ─────────────────────────────────────────────────
// useSWR mock: loadFromStorage를 통해 memStore에서 데이터를 가져오도록 처리
vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (!key) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    // loadFromStorage mock이 memStore에서 읽으므로
    // 여기서는 SWR data를 undefined로 반환해 훅 내부의 fallback을 사용하게 함
    const mutate = vi.fn(async (updated?: unknown) => {
      if (updated !== undefined) {
        memStore[key] = updated;
      }
    });
    return { data: memStore[key], isLoading: false, mutate };
  },
}));

// ─── SWR 키 mock ───────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    equipmentChecklist: (groupId: string) => `equipment-checklist:${groupId}`,
  },
}));

// ─── toast mock ──────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── TOAST mock ──────────────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    ITEM_NAME_REQUIRED: "항목 이름을 입력하세요",
    ITEM_ADDED: "항목이 추가되었습니다",
    ITEM_DELETED: "항목이 삭제되었습니다",
    DATE_SELECT: "날짜를 선택하세요",
    EQUIPMENT: {
      CHECKLIST_CREATED: "체크리스트가 생성되었습니다",
    },
    RECORD: {
      NOT_FOUND: "기록을 찾을 수 없습니다",
    },
    DATA: {
      DUPLICATE_DATE: "이미 해당 날짜에 기록이 있습니다",
    },
    ENERGY: {
      DELETED: "삭제되었습니다",
    },
    INFO: {
      ASSIGNEE_CHANGED: "담당자가 변경되었습니다",
    },
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useEquipmentChecklist } from "@/hooks/use-equipment-checklist";
import type { EquipmentChecklistRecord } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useEquipmentChecklist(groupId));
}

// ============================================================
// 초기 상태 - 기본 항목 구조 확인
// ============================================================

describe("useEquipmentChecklist - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 items는 12개의 기본 항목을 갖는다 (before 6 + after 6)", () => {
    const { result } = makeHook();
    expect(result.current.items).toHaveLength(12);
  });

  it("초기 beforeItems는 6개이다", () => {
    const { result } = makeHook();
    expect(result.current.beforeItems).toHaveLength(6);
  });

  it("초기 afterItems는 6개이다", () => {
    const { result } = makeHook();
    expect(result.current.afterItems).toHaveLength(6);
  });

  it("초기 records는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.records).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("beforeItems는 모두 phase가 'before'이다", () => {
    const { result } = makeHook();
    result.current.beforeItems.forEach((item) => {
      expect(item.phase).toBe("before");
    });
  });

  it("afterItems는 모두 phase가 'after'이다", () => {
    const { result } = makeHook();
    result.current.afterItems.forEach((item) => {
      expect(item.phase).toBe("after");
    });
  });

  it("beforeItems는 order 오름차순 정렬된다", () => {
    const { result } = makeHook();
    const orders = result.current.beforeItems.map((i) => i.order);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1]);
    }
  });

  it("afterItems는 order 오름차순 정렬된다", () => {
    const { result } = makeHook();
    const orders = result.current.afterItems.map((i) => i.order);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1]);
    }
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addItem).toBe("function");
    expect(typeof result.current.deleteItem).toBe("function");
    expect(typeof result.current.createRecord).toBe("function");
    expect(typeof result.current.toggleEntry).toBe("function");
    expect(typeof result.current.deleteRecord).toBe("function");
    expect(typeof result.current.updateAssignee).toBe("function");
    expect(typeof result.current.calcProgress).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("items의 모든 항목에 id가 있다", () => {
    const { result } = makeHook();
    result.current.items.forEach((item) => {
      expect(item.id).toBeTruthy();
    });
  });

  it("items의 모든 항목에 name이 있다", () => {
    const { result } = makeHook();
    result.current.items.forEach((item) => {
      expect(item.name).toBeTruthy();
    });
  });

  it("items의 모든 항목에 category가 있다", () => {
    const { result } = makeHook();
    result.current.items.forEach((item) => {
      expect(item.category).toBeTruthy();
    });
  });

  it("groupId가 빈 문자열이면 SWR null key로 처리된다 (data 없음)", () => {
    const { result } = renderHook(() => useEquipmentChecklist(""));
    // groupId가 없을 때 기본값을 사용
    expect(result.current.items).toBeDefined();
  });

  it("records는 배열 타입이다", () => {
    const { result } = makeHook();
    expect(Array.isArray(result.current.records)).toBe(true);
  });
});

// ============================================================
// 기본 항목 구조 및 내용
// ============================================================

describe("useEquipmentChecklist - 기본 항목 내용", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("before 카테고리에 '음향' 항목이 존재한다", () => {
    const { result } = makeHook();
    const hasAudio = result.current.beforeItems.some(
      (i) => i.category === "음향"
    );
    expect(hasAudio).toBe(true);
  });

  it("before 카테고리에 '시설' 항목이 존재한다", () => {
    const { result } = makeHook();
    const hasFacility = result.current.beforeItems.some(
      (i) => i.category === "시설"
    );
    expect(hasFacility).toBe(true);
  });

  it("after 카테고리에 '청소' 관련 항목이 존재한다", () => {
    const { result } = makeHook();
    const hasClean = result.current.afterItems.some(
      (i) => i.name.includes("청소")
    );
    expect(hasClean).toBe(true);
  });

  it("before 항목의 order는 0부터 시작한다", () => {
    const { result } = makeHook();
    const minOrder = Math.min(...result.current.beforeItems.map((i) => i.order));
    expect(minOrder).toBe(0);
  });

  it("after 항목의 order는 0부터 시작한다", () => {
    const { result } = makeHook();
    const minOrder = Math.min(...result.current.afterItems.map((i) => i.order));
    expect(minOrder).toBe(0);
  });
});

// ============================================================
// calcProgress 유틸 - 핵심 비즈니스 로직 테스트
// ============================================================

describe("useEquipmentChecklist - calcProgress", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  function makeRecord(entries: { itemId: string; checked: boolean }[]): EquipmentChecklistRecord {
    return {
      id: "r1",
      date: "2026-03-01",
      phase: "before",
      entries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  it("항목이 0개이면 total은 0이다", () => {
    const { result } = makeHook();
    const { total } = result.current.calcProgress(makeRecord([]));
    expect(total).toBe(0);
  });

  it("항목이 0개이면 checked는 0이다", () => {
    const { result } = makeHook();
    const { checked } = result.current.calcProgress(makeRecord([]));
    expect(checked).toBe(0);
  });

  it("항목이 0개이면 rate는 0이다", () => {
    const { result } = makeHook();
    const { rate } = result.current.calcProgress(makeRecord([]));
    expect(rate).toBe(0);
  });

  it("전체 항목이 체크되면 rate는 100이다", () => {
    const { result } = makeHook();
    const { rate } = result.current.calcProgress(makeRecord([
      { itemId: "i1", checked: true },
      { itemId: "i2", checked: true },
    ]));
    expect(rate).toBe(100);
  });

  it("전체 체크 시 checked === total이다", () => {
    const { result } = makeHook();
    const { total, checked } = result.current.calcProgress(makeRecord([
      { itemId: "i1", checked: true },
      { itemId: "i2", checked: true },
      { itemId: "i3", checked: true },
    ]));
    expect(checked).toBe(total);
    expect(total).toBe(3);
  });

  it("절반 체크 시 rate는 50이다", () => {
    const { result } = makeHook();
    const { rate } = result.current.calcProgress(makeRecord([
      { itemId: "i1", checked: true },
      { itemId: "i2", checked: false },
    ]));
    expect(rate).toBe(50);
  });

  it("1개 중 0개 체크 시 rate는 0이다", () => {
    const { result } = makeHook();
    const { rate } = result.current.calcProgress(makeRecord([
      { itemId: "i1", checked: false },
    ]));
    expect(rate).toBe(0);
  });

  it("4개 중 1개 체크 시 rate는 25이다", () => {
    const { result } = makeHook();
    const { rate } = result.current.calcProgress(makeRecord([
      { itemId: "i1", checked: true },
      { itemId: "i2", checked: false },
      { itemId: "i3", checked: false },
      { itemId: "i4", checked: false },
    ]));
    expect(rate).toBe(25);
  });

  it("3개 중 2개 체크 시 rate는 67이다", () => {
    const { result } = makeHook();
    const { rate } = result.current.calcProgress(makeRecord([
      { itemId: "i1", checked: true },
      { itemId: "i2", checked: true },
      { itemId: "i3", checked: false },
    ]));
    expect(rate).toBe(67);
  });

  it("total과 checked 개수가 정확하다", () => {
    const { result } = makeHook();
    const { total, checked } = result.current.calcProgress(makeRecord([
      { itemId: "i1", checked: true },
      { itemId: "i2", checked: false },
      { itemId: "i3", checked: true },
      { itemId: "i4", checked: false },
      { itemId: "i5", checked: true },
    ]));
    expect(total).toBe(5);
    expect(checked).toBe(3);
  });

  it("5개 중 3개 체크 시 rate는 60이다", () => {
    const { result } = makeHook();
    const { rate } = result.current.calcProgress(makeRecord([
      { itemId: "i1", checked: true },
      { itemId: "i2", checked: true },
      { itemId: "i3", checked: true },
      { itemId: "i4", checked: false },
      { itemId: "i5", checked: false },
    ]));
    expect(rate).toBe(60);
  });

  it("10개 중 7개 체크 시 rate는 70이다", () => {
    const { result } = makeHook();
    const entries = Array.from({ length: 10 }, (_, i) => ({
      itemId: `i${i}`,
      checked: i < 7,
    }));
    const { rate } = result.current.calcProgress(makeRecord(entries));
    expect(rate).toBe(70);
  });

  it("rate는 반올림된 정수이다", () => {
    const { result } = makeHook();
    const { rate } = result.current.calcProgress(makeRecord([
      { itemId: "i1", checked: true },
      { itemId: "i2", checked: false },
      { itemId: "i3", checked: false },
    ]));
    // 1/3 = 33.33... → 33
    expect(rate).toBe(33);
    expect(Number.isInteger(rate)).toBe(true);
  });
});

// ============================================================
// addItem - 토스트 호출 검증
// ============================================================

describe("useEquipmentChecklist - addItem 유효성 검사", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("빈 이름으로 추가 시 toast.error가 호출된다", async () => {
    const { toast } = await import("sonner");
    const { result } = makeHook();
    await result.current.addItem({
      name: "",
      phase: "before",
      category: "음향",
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it("공백만 있는 이름으로 추가 시 toast.error가 호출된다", async () => {
    const { toast } = await import("sonner");
    const { result } = makeHook();
    await result.current.addItem({
      name: "   ",
      phase: "after",
      category: "시설",
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it("유효한 항목 추가 시 toast.success가 호출된다", async () => {
    const { toast } = await import("sonner");
    const { result } = makeHook();
    await result.current.addItem({
      name: "새 장비 확인",
      phase: "before",
      category: "음향",
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("빈 이름으로 추가 시 false를 반환한다", async () => {
    const { result } = makeHook();
    const ret = await result.current.addItem({
      name: "",
      phase: "before",
      category: "음향",
    });
    expect(ret).toBe(false);
  });

  it("유효한 항목 추가 시 true를 반환한다", async () => {
    const { result } = makeHook();
    const ret = await result.current.addItem({
      name: "스피커 확인",
      phase: "before",
      category: "음향",
    });
    expect(ret).toBe(true);
  });
});

// ============================================================
// createRecord - 날짜 유효성 검사
// ============================================================

describe("useEquipmentChecklist - createRecord 유효성 검사", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("날짜가 없으면 null을 반환한다", async () => {
    const { result } = makeHook();
    const ret = await result.current.createRecord("", "before");
    expect(ret).toBeNull();
  });

  it("날짜가 없으면 toast.error가 호출된다", async () => {
    const { toast } = await import("sonner");
    const { result } = makeHook();
    await result.current.createRecord("", "before");
    expect(toast.error).toHaveBeenCalled();
  });

  it("유효한 날짜와 phase로 기록 생성 시 id 문자열을 반환한다", async () => {
    const { result } = makeHook();
    const ret = await result.current.createRecord("2026-03-01", "before");
    expect(typeof ret).toBe("string");
    expect(ret).toBeTruthy();
  });

  it("after phase로 기록 생성 시 id 문자열을 반환한다", async () => {
    const { result } = makeHook();
    const ret = await result.current.createRecord("2026-03-01", "after");
    expect(typeof ret).toBe("string");
    expect(ret).toBeTruthy();
  });

  it("담당자 포함 기록 생성 시 id 문자열을 반환한다", async () => {
    const { result } = makeHook();
    const ret = await result.current.createRecord("2026-03-01", "before", "홍길동");
    expect(typeof ret).toBe("string");
  });

  it("유효한 날짜로 생성 시 toast.success가 호출된다", async () => {
    const { toast } = await import("sonner");
    const { result } = makeHook();
    await result.current.createRecord("2026-03-01", "before");
    expect(toast.success).toHaveBeenCalled();
  });
});

// ============================================================
// deleteItem - 반환값 검증
// ============================================================

describe("useEquipmentChecklist - deleteItem 반환값", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("존재하는 항목 삭제 시 true를 반환한다", async () => {
    const { result } = makeHook();
    const firstItemId = result.current.items[0].id;
    const ret = await result.current.deleteItem(firstItemId);
    expect(ret).toBe(true);
  });

  it("존재하지 않는 id 삭제 시도 시 true를 반환한다 (삭제 연산은 항상 성공)", async () => {
    const { result } = makeHook();
    const ret = await result.current.deleteItem("non-existent-id");
    expect(ret).toBe(true);
  });

  it("항목 삭제 시 toast.success가 호출된다", async () => {
    const { toast } = await import("sonner");
    const { result } = makeHook();
    const firstItemId = result.current.items[0].id;
    await result.current.deleteItem(firstItemId);
    expect(toast.success).toHaveBeenCalled();
  });
});

// ============================================================
// deleteRecord - 반환값 검증
// ============================================================

describe("useEquipmentChecklist - deleteRecord 반환값", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("deleteRecord를 호출하면 true를 반환한다", async () => {
    const { result } = makeHook();
    const ret = await result.current.deleteRecord("any-record-id");
    expect(ret).toBe(true);
  });

  it("deleteRecord 호출 시 toast.success가 호출된다", async () => {
    const { toast } = await import("sonner");
    const { result } = makeHook();
    await result.current.deleteRecord("any-record-id");
    expect(toast.success).toHaveBeenCalled();
  });
});

// ============================================================
// updateAssignee - 반환값 검증
// ============================================================

describe("useEquipmentChecklist - updateAssignee 반환값", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    vi.clearAllMocks();
  });

  it("updateAssignee를 호출하면 true를 반환한다", async () => {
    const { result } = makeHook();
    const ret = await result.current.updateAssignee("any-record-id", "홍길동");
    expect(ret).toBe(true);
  });

  it("updateAssignee 호출 시 toast.success가 호출된다", async () => {
    const { toast } = await import("sonner");
    const { result } = makeHook();
    await result.current.updateAssignee("any-record-id", "홍길동");
    expect(toast.success).toHaveBeenCalled();
  });
});
