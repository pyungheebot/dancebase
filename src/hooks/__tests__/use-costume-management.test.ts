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
  useCostumeManagement,
  COSTUME_CATEGORIES,
  COSTUME_SIZES,
  COSTUME_STATUS_LABELS,
} from "@/hooks/use-costume-management";
import type { CostumeStatus } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────

function makeHook(groupId = "group-1", projectId = "project-1") {
  return renderHook(() => useCostumeManagement(groupId, projectId));
}

type AddItemPayload = {
  name?: string;
  category?: string;
  color?: string;
  totalQuantity?: number;
  status?: CostumeStatus;
  note?: string;
};

function addItem(
  hook: ReturnType<typeof makeHook>["result"],
  payload: AddItemPayload = {}
): boolean {
  let result = false;
  act(() => {
    result = hook.current.addItem({
      name: payload.name ?? "티셔츠",
      category: payload.category ?? "상의",
      color: payload.color ?? "흰색",
      totalQuantity: payload.totalQuantity ?? 5,
      status: payload.status ?? "planned",
      note: payload.note ?? "",
    });
  });
  return result;
}

// ============================================================
// 상수 검증
// ============================================================

describe("COSTUME_CATEGORIES 상수", () => {
  it("6개 카테고리를 포함한다", () => {
    expect(COSTUME_CATEGORIES).toHaveLength(6);
  });

  it("'상의'를 포함한다", () => {
    expect(COSTUME_CATEGORIES).toContain("상의");
  });

  it("'하의'를 포함한다", () => {
    expect(COSTUME_CATEGORIES).toContain("하의");
  });

  it("'신발'을 포함한다", () => {
    expect(COSTUME_CATEGORIES).toContain("신발");
  });

  it("'악세서리'를 포함한다", () => {
    expect(COSTUME_CATEGORIES).toContain("악세서리");
  });

  it("'기타'를 포함한다", () => {
    expect(COSTUME_CATEGORIES).toContain("기타");
  });
});

describe("COSTUME_SIZES 상수", () => {
  it("7개 사이즈를 포함한다", () => {
    expect(COSTUME_SIZES).toHaveLength(7);
  });

  it("'XS'부터 'FREE'까지 포함한다", () => {
    expect(COSTUME_SIZES).toContain("XS");
    expect(COSTUME_SIZES).toContain("FREE");
  });
});

describe("COSTUME_STATUS_LABELS 상수", () => {
  it("5개 상태 레이블을 포함한다", () => {
    expect(Object.keys(COSTUME_STATUS_LABELS)).toHaveLength(5);
  });

  it("'planned' 레이블은 '준비 예정'이다", () => {
    expect(COSTUME_STATUS_LABELS.planned).toBe("준비 예정");
  });

  it("'returned' 레이블은 '반납 완료'이다", () => {
    expect(COSTUME_STATUS_LABELS.returned).toBe("반납 완료");
  });

  it("'distributed' 레이블은 '배포 완료'이다", () => {
    expect(COSTUME_STATUS_LABELS.distributed).toBe("배포 완료");
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useCostumeManagement - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 items는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.items).toEqual([]);
  });

  it("초기 assignments는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.assignments).toEqual([]);
  });

  it("초기 totalItems는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalItems).toBe(0);
  });

  it("초기 totalAssignments는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalAssignments).toBe(0);
  });

  it("초기 returnedCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.returnedCount).toBe(0);
  });

  it("초기 pendingReturnCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.pendingReturnCount).toBe(0);
  });

  it("필요한 함수가 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addItem).toBe("function");
    expect(typeof result.current.updateItem).toBe("function");
    expect(typeof result.current.deleteItem).toBe("function");
    expect(typeof result.current.assignMember).toBe("function");
    expect(typeof result.current.unassignMember).toBe("function");
    expect(typeof result.current.markReturned).toBe("function");
    expect(typeof result.current.reload).toBe("function");
  });
});

// ============================================================
// addItem
// ============================================================

describe("useCostumeManagement - addItem", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("의상 추가 후 items 길이가 1이 된다", () => {
    const { result } = makeHook();
    addItem(result);
    expect(result.current.items).toHaveLength(1);
  });

  it("추가된 의상에 고유 id가 부여된다", () => {
    const { result } = makeHook();
    addItem(result);
    expect(result.current.items[0].id).toBeDefined();
    expect(result.current.items[0].id).toMatch(/uuid-\d+/);
  });

  it("추가된 의상의 name이 trim되어 저장된다", () => {
    const { result } = makeHook();
    addItem(result, { name: "  티셔츠  " });
    expect(result.current.items[0].name).toBe("티셔츠");
  });

  it("빈 이름이면 추가에 실패하고 false를 반환한다", () => {
    const { result } = makeHook();
    const success = addItem(result, { name: "" });
    expect(success).toBe(false);
    expect(result.current.items).toHaveLength(0);
  });

  it("공백만 있는 이름도 추가에 실패한다", () => {
    const { result } = makeHook();
    const success = addItem(result, { name: "   " });
    expect(success).toBe(false);
  });

  it("추가 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const success = addItem(result, { name: "바지" });
    expect(success).toBe(true);
  });

  it("totalQuantity와 availableQuantity가 동일하게 설정된다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 8 });
    expect(result.current.items[0].totalQuantity).toBe(8);
    expect(result.current.items[0].availableQuantity).toBe(8);
  });

  it("새 의상은 기존 의상보다 앞에 추가된다 (최신 먼저)", () => {
    const { result } = makeHook();
    addItem(result, { name: "첫 번째" });
    addItem(result, { name: "두 번째" });
    expect(result.current.items[0].name).toBe("두 번째");
  });

  it("totalItems 통계가 올바르게 업데이트된다", () => {
    const { result } = makeHook();
    addItem(result);
    addItem(result);
    expect(result.current.totalItems).toBe(2);
  });

  it("status가 올바르게 저장된다", () => {
    const { result } = makeHook();
    addItem(result, { status: "ordered" });
    expect(result.current.items[0].status).toBe("ordered");
  });

  it("createdAt이 ISO 형식으로 저장된다", () => {
    const { result } = makeHook();
    addItem(result);
    expect(result.current.items[0].createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});

// ============================================================
// updateItem
// ============================================================

describe("useCostumeManagement - updateItem", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("의상 이름을 수정할 수 있다", () => {
    const { result } = makeHook();
    addItem(result, { name: "원래 이름" });
    const id = result.current.items[0].id;
    act(() => {
      result.current.updateItem(id, { name: "새 이름" });
    });
    expect(result.current.items[0].name).toBe("새 이름");
  });

  it("의상 상태를 수정할 수 있다", () => {
    const { result } = makeHook();
    addItem(result, { status: "planned" });
    const id = result.current.items[0].id;
    act(() => {
      result.current.updateItem(id, { status: "arrived" });
    });
    expect(result.current.items[0].status).toBe("arrived");
  });

  it("totalQuantity 변경 시 availableQuantity가 재계산된다", () => {
    const { result } = makeHook();
    // 수량 5로 추가 후, 멤버 1명 배정
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    // 배정
    act(() => {
      result.current.assignMember({
        costumeId: id,
        memberId: "member-1",
        memberName: "홍길동",
        size: "M",
      });
    });
    // totalQuantity를 10으로 변경: availableQuantity = 10 - 1 = 9
    act(() => {
      result.current.updateItem(id, { totalQuantity: 10 });
    });
    expect(result.current.items[0].availableQuantity).toBe(9);
  });

  it("totalQuantity가 배정 수보다 적으면 availableQuantity는 0이다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    // 멤버 2명 배정
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "S" });
    });
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m2", memberName: "멤버2", size: "M" });
    });
    // totalQuantity를 1로 줄임: Math.max(0, 1-2) = 0
    act(() => {
      result.current.updateItem(id, { totalQuantity: 1 });
    });
    expect(result.current.items[0].availableQuantity).toBe(0);
  });

  it("다른 의상은 영향을 받지 않는다", () => {
    const { result } = makeHook();
    addItem(result, { name: "의상A" });
    addItem(result, { name: "의상B" });
    const idA = result.current.items.find((i) => i.name === "의상A")!.id;
    act(() => {
      result.current.updateItem(idA, { name: "의상A 수정" });
    });
    const b = result.current.items.find((i) => i.name === "의상B");
    expect(b).toBeDefined();
    expect(b?.name).toBe("의상B");
  });
});

// ============================================================
// deleteItem
// ============================================================

describe("useCostumeManagement - deleteItem", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("의상 삭제 후 items에서 제거된다", () => {
    const { result } = makeHook();
    addItem(result);
    const id = result.current.items[0].id;
    act(() => {
      result.current.deleteItem(id);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("의상 삭제 시 해당 의상의 배정도 함께 삭제된다", () => {
    const { result } = makeHook();
    addItem(result);
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    act(() => {
      result.current.deleteItem(id);
    });
    expect(result.current.assignments).toHaveLength(0);
  });

  it("다른 의상의 배정은 삭제되지 않는다", () => {
    const { result } = makeHook();
    addItem(result, { name: "의상A" });
    addItem(result, { name: "의상B" });
    const idA = result.current.items.find((i) => i.name === "의상A")!.id;
    const idB = result.current.items.find((i) => i.name === "의상B")!.id;
    act(() => {
      result.current.assignMember({ costumeId: idB, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    act(() => {
      result.current.deleteItem(idA);
    });
    expect(result.current.assignments).toHaveLength(1);
  });

  it("존재하지 않는 id를 삭제해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteItem("non-existent-id");
      });
    }).not.toThrow();
  });

  it("totalItems가 줄어든다", () => {
    const { result } = makeHook();
    addItem(result);
    addItem(result);
    const id = result.current.items[0].id;
    act(() => {
      result.current.deleteItem(id);
    });
    expect(result.current.totalItems).toBe(1);
  });
});

// ============================================================
// assignMember
// ============================================================

describe("useCostumeManagement - assignMember", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("배정 후 assignments 길이가 1이 된다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 3 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    expect(result.current.assignments).toHaveLength(1);
  });

  it("배정 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 3 });
    const id = result.current.items[0].id;
    let success = false;
    act(() => {
      success = result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    expect(success).toBe(true);
  });

  it("배정 후 availableQuantity가 1 감소한다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    expect(result.current.items[0].availableQuantity).toBe(4);
  });

  it("재고가 0이면 배정에 실패하고 false를 반환한다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 1 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    let success = true;
    act(() => {
      success = result.current.assignMember({ costumeId: id, memberId: "m2", memberName: "멤버2", size: "S" });
    });
    expect(success).toBe(false);
  });

  it("같은 멤버를 같은 의상에 중복 배정하면 false를 반환한다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 10 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    let success = true;
    act(() => {
      success = result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    expect(success).toBe(false);
  });

  it("존재하지 않는 costumeId로 배정하면 false를 반환한다", () => {
    const { result } = makeHook();
    let success = true;
    act(() => {
      success = result.current.assignMember({ costumeId: "non-existent", memberId: "m1", memberName: "멤버1", size: "M" });
    });
    expect(success).toBe(false);
  });

  it("배정 후 totalAssignments가 증가한다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m2", memberName: "멤버2", size: "S" });
    });
    expect(result.current.totalAssignments).toBe(2);
  });

  it("배정된 assignment의 returned는 false이다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    expect(result.current.assignments[0].returned).toBe(false);
  });
});

// ============================================================
// unassignMember
// ============================================================

describe("useCostumeManagement - unassignMember", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("배정 해제 후 assignments에서 제거된다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    act(() => {
      result.current.unassignMember(id, "m1");
    });
    expect(result.current.assignments).toHaveLength(0);
  });

  it("배정 해제 후 availableQuantity가 증가한다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    act(() => {
      result.current.unassignMember(id, "m1");
    });
    expect(result.current.items[0].availableQuantity).toBe(5);
  });

  it("다른 멤버의 배정은 해제되지 않는다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
      result.current.assignMember({ costumeId: id, memberId: "m2", memberName: "멤버2", size: "S" });
    });
    act(() => {
      result.current.unassignMember(id, "m1");
    });
    expect(result.current.assignments).toHaveLength(1);
    expect(result.current.assignments[0].memberId).toBe("m2");
  });
});

// ============================================================
// markReturned
// ============================================================

describe("useCostumeManagement - markReturned", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("반납 처리 후 assignment의 returned가 true가 된다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    act(() => {
      result.current.markReturned(id, "m1", true);
    });
    expect(result.current.assignments[0].returned).toBe(true);
  });

  it("반납 처리 후 returnedCount가 증가한다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    act(() => {
      result.current.markReturned(id, "m1", true);
    });
    expect(result.current.returnedCount).toBe(1);
  });

  it("반납 처리 후 pendingReturnCount가 감소한다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
      result.current.assignMember({ costumeId: id, memberId: "m2", memberName: "멤버2", size: "S" });
    });
    act(() => {
      result.current.markReturned(id, "m1", true);
    });
    expect(result.current.pendingReturnCount).toBe(1);
  });

  it("반납 처리 후 availableQuantity가 증가한다 (delta +1)", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    const beforeAvailable = result.current.items[0].availableQuantity;
    act(() => {
      result.current.markReturned(id, "m1", true);
    });
    expect(result.current.items[0].availableQuantity).toBe(beforeAvailable + 1);
  });

  it("반납 취소(false) 시 assignment의 returned가 false가 된다", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    act(() => {
      result.current.markReturned(id, "m1", true);
    });
    act(() => {
      result.current.markReturned(id, "m1", false);
    });
    expect(result.current.assignments[0].returned).toBe(false);
  });

  it("반납 취소 시 availableQuantity가 감소한다 (delta -1)", () => {
    const { result } = makeHook();
    addItem(result, { totalQuantity: 5 });
    const id = result.current.items[0].id;
    act(() => {
      result.current.assignMember({ costumeId: id, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    act(() => {
      result.current.markReturned(id, "m1", true);
    });
    const afterReturn = result.current.items[0].availableQuantity;
    act(() => {
      result.current.markReturned(id, "m1", false);
    });
    expect(result.current.items[0].availableQuantity).toBe(afterReturn - 1);
  });

  it("availableQuantity는 0 이하로 내려가지 않는다 (Math.max 적용)", () => {
    const { result } = makeHook();
    // availableQuantity = 0 상태에서 반납 취소 시도
    addItem(result, { totalQuantity: 0 });
    const id = result.current.items[0].id;
    // availableQuantity가 이미 0인 상태에서 반납 취소
    act(() => {
      result.current.markReturned(id, "m1", false);
    });
    expect(result.current.items[0].availableQuantity).toBe(0);
  });
});

// ============================================================
// 헬퍼 함수: itemsByStatus, assignmentsForItem
// ============================================================

describe("useCostumeManagement - 헬퍼 함수", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("itemsByStatus는 해당 상태의 의상만 반환한다", () => {
    const { result } = makeHook();
    addItem(result, { name: "의상A", status: "planned" });
    addItem(result, { name: "의상B", status: "ordered" });
    addItem(result, { name: "의상C", status: "planned" });
    const planned = result.current.itemsByStatus("planned");
    expect(planned).toHaveLength(2);
    planned.forEach((i) => expect(i.status).toBe("planned"));
  });

  it("itemsByStatus는 해당 상태가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    addItem(result, { status: "planned" });
    const returned = result.current.itemsByStatus("returned");
    expect(returned).toHaveLength(0);
  });

  it("assignmentsForItem은 해당 의상의 배정만 반환한다", () => {
    const { result } = makeHook();
    addItem(result, { name: "의상A", totalQuantity: 5 });
    addItem(result, { name: "의상B", totalQuantity: 5 });
    const idA = result.current.items.find((i) => i.name === "의상A")!.id;
    const idB = result.current.items.find((i) => i.name === "의상B")!.id;
    act(() => {
      result.current.assignMember({ costumeId: idA, memberId: "m1", memberName: "멤버1", size: "M" });
    });
    act(() => {
      result.current.assignMember({ costumeId: idB, memberId: "m2", memberName: "멤버2", size: "S" });
    });
    const aAssignments = result.current.assignmentsForItem(idA);
    expect(aAssignments).toHaveLength(1);
    expect(aAssignments[0].costumeId).toBe(idA);
  });

  it("assignmentsForItem은 배정이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    addItem(result);
    const id = result.current.items[0].id;
    expect(result.current.assignmentsForItem(id)).toHaveLength(0);
  });
});

// ============================================================
// 그룹/프로젝트 격리
// ============================================================

describe("useCostumeManagement - 그룹/프로젝트 격리", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("다른 projectId의 데이터는 공유되지 않는다", () => {
    const { result: r1 } = makeHook("group-1", "project-A");
    const { result: r2 } = makeHook("group-1", "project-B");
    addItem(r1, { name: "A 의상" });
    expect(r2.current.items).toHaveLength(0);
  });

  it("다른 groupId의 데이터는 공유되지 않는다", () => {
    const { result: r1 } = makeHook("group-X", "project-1");
    const { result: r2 } = makeHook("group-Y", "project-1");
    addItem(r1, { name: "X 의상" });
    expect(r2.current.items).toHaveLength(0);
  });
});

// ============================================================
// reload
// ============================================================

describe("useCostumeManagement - reload", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("groupId 또는 projectId가 없으면 reload 시 loading이 false가 된다", () => {
    const { result } = makeHook("", "");
    act(() => {
      result.current.reload();
    });
    expect(result.current.loading).toBe(false);
  });
});
