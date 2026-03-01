import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock (loadFromStorage / saveToStorage) ──────
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

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: () => `uuid-${++uuidCounter}`,
});

import { useMakeupSheet } from "@/hooks/use-makeup-sheet";
import type { MakeupSheetLook, MakeupSheetProduct } from "@/types";

const GROUP_ID = "group-xyz";
const PROJECT_ID = "project-123";
const STORAGE_KEY = `dancebase:makeup-sheet:${GROUP_ID}:${PROJECT_ID}`;

beforeEach(() => {
  for (const k of Object.keys(memStore)) delete memStore[k];
  uuidCounter = 0;
});

// ─── 초기 상태 ────────────────────────────────────────────────
describe("useMakeupSheet - 초기 상태", () => {
  it("초기 looks는 빈 배열이다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    expect(result.current.looks).toHaveLength(0);
  });

  it("loading은 false이다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    expect(result.current.loading).toBe(false);
  });

  it("필수 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    expect(typeof result.current.addLook).toBe("function");
    expect(typeof result.current.updateLook).toBe("function");
    expect(typeof result.current.deleteLook).toBe("function");
    expect(typeof result.current.addProduct).toBe("function");
    expect(typeof result.current.updateProduct).toBe("function");
    expect(typeof result.current.deleteProduct).toBe("function");
    expect(typeof result.current.reorderProducts).toBe("function");
    expect(typeof result.current.assignMember).toBe("function");
    expect(typeof result.current.unassignMember).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("stats 객체가 존재한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    expect(result.current.stats).toBeDefined();
    expect(result.current.stats.totalLooks).toBe(0);
    expect(result.current.stats.totalProducts).toBe(0);
    expect(result.current.stats.assignedMembers).toHaveLength(0);
  });

  it("localStorage에 저장된 데이터가 있으면 초기값으로 로드된다", () => {
    const existing: MakeupSheetLook[] = [
      {
        id: "look-pre",
        lookName: "기존 룩",
        performanceName: "공연",
        products: [],
        assignedMembers: [],
        createdAt: new Date().toISOString(),
      },
    ];
    memStore[STORAGE_KEY] = existing;
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    expect(result.current.looks).toHaveLength(1);
  });
});

// ─── storageKey 형식 ──────────────────────────────────────────
describe("useMakeupSheet - storageKey 형식", () => {
  it("storageKey는 dancebase:makeup-sheet:{groupId}:{projectId} 형식이다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    act(() => {
      result.current.addLook({ lookName: "테스트", performanceName: "공연" });
    });
    expect(memStore[STORAGE_KEY]).toBeDefined();
  });
});

// ─── addLook ──────────────────────────────────────────────────
describe("useMakeupSheet - addLook", () => {
  it("addLook 호출 시 MakeupSheetLook을 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => {
      look = result.current.addLook({ lookName: "무대 룩", performanceName: "여름 공연" });
    });
    expect(look).toBeDefined();
    expect(look!.id).toBeDefined();
  });

  it("addLook 후 looks 길이가 1 증가한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    act(() => {
      result.current.addLook({ lookName: "룩A", performanceName: "공연A" });
    });
    expect(result.current.looks).toHaveLength(1);
  });

  it("addLook 반환값의 lookName이 올바르다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => {
      look = result.current.addLook({ lookName: "스모키 룩", performanceName: "공연" });
    });
    expect(look!.lookName).toBe("스모키 룩");
  });

  it("addLook 반환값의 products는 빈 배열이다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => {
      look = result.current.addLook({ lookName: "룩", performanceName: "공연" });
    });
    expect(look!.products).toHaveLength(0);
  });

  it("addLook 반환값의 assignedMembers는 빈 배열이다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => {
      look = result.current.addLook({ lookName: "룩", performanceName: "공연" });
    });
    expect(look!.assignedMembers).toHaveLength(0);
  });

  it("notes와 estimatedMinutes를 선택적으로 전달할 수 있다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => {
      look = result.current.addLook({
        lookName: "룩",
        performanceName: "공연",
        notes: "특별 주의",
        estimatedMinutes: 30,
      });
    });
    expect(look!.notes).toBe("특별 주의");
    expect(look!.estimatedMinutes).toBe(30);
  });

  it("addLook 후 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    act(() => {
      result.current.addLook({ lookName: "룩", performanceName: "공연" });
    });
    const stored = memStore[STORAGE_KEY] as MakeupSheetLook[];
    expect(stored).toHaveLength(1);
  });
});

// ─── updateLook ───────────────────────────────────────────────
describe("useMakeupSheet - updateLook", () => {
  it("존재하는 lookId로 updateLook 호출 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "원래", performanceName: "공연" }); });
    let res: boolean | undefined;
    act(() => { res = result.current.updateLook(look!.id, { lookName: "변경됨" }); });
    expect(res).toBe(true);
  });

  it("존재하지 않는 lookId로 updateLook 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let res: boolean | undefined;
    act(() => { res = result.current.updateLook("no-such-id", { lookName: "변경" }); });
    expect(res).toBe(false);
  });

  it("updateLook 후 looks에 변경이 반영된다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "원래", performanceName: "공연" }); });
    act(() => { result.current.updateLook(look!.id, { lookName: "새 이름" }); });
    const updated = result.current.looks.find((l) => l.id === look!.id);
    expect(updated?.lookName).toBe("새 이름");
  });

  it("estimatedMinutes를 업데이트할 수 있다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    act(() => { result.current.updateLook(look!.id, { estimatedMinutes: 45 }); });
    const updated = result.current.looks.find((l) => l.id === look!.id);
    expect(updated?.estimatedMinutes).toBe(45);
  });
});

// ─── deleteLook ───────────────────────────────────────────────
describe("useMakeupSheet - deleteLook", () => {
  it("존재하는 lookId 삭제 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "삭제할 룩", performanceName: "공연" }); });
    let res: boolean | undefined;
    act(() => { res = result.current.deleteLook(look!.id); });
    expect(res).toBe(true);
  });

  it("존재하지 않는 lookId 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let res: boolean | undefined;
    act(() => { res = result.current.deleteLook("no-such-id"); });
    expect(res).toBe(false);
  });

  it("deleteLook 후 looks 길이가 감소한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    act(() => { result.current.deleteLook(look!.id); });
    expect(result.current.looks).toHaveLength(0);
  });
});

// ─── addProduct ───────────────────────────────────────────────
describe("useMakeupSheet - addProduct", () => {
  it("존재하는 lookId에 addProduct 호출 시 MakeupSheetProduct를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    let product: MakeupSheetProduct | null = null;
    act(() => {
      product = result.current.addProduct(look!.id, {
        area: "base", productName: "파운데이션", order: 1,
      });
    });
    expect(product).not.toBeNull();
    expect(product!.id).toBeDefined();
  });

  it("존재하지 않는 lookId에 addProduct 호출 시 null을 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let product: MakeupSheetProduct | null = null;
    act(() => {
      product = result.current.addProduct("no-look", {
        area: "eyes", productName: "아이섀도", order: 1,
      });
    });
    expect(product).toBeNull();
  });

  it("addProduct 후 해당 룩의 products 길이가 증가한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    act(() => {
      result.current.addProduct(look!.id, { area: "lips", productName: "립스틱", order: 1 });
    });
    const updatedLook = result.current.looks.find((l) => l.id === look!.id);
    expect(updatedLook!.products).toHaveLength(1);
  });

  it("addProduct 후 localStorage에 반영된다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    act(() => {
      result.current.addProduct(look!.id, { area: "cheeks", productName: "블러셔", order: 0 });
    });
    const stored = memStore[STORAGE_KEY] as MakeupSheetLook[];
    expect(stored[0].products).toHaveLength(1);
  });
});

// ─── updateProduct ────────────────────────────────────────────
describe("useMakeupSheet - updateProduct", () => {
  it("존재하는 look/product 업데이트 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    let product: MakeupSheetProduct | null = null;
    act(() => {
      product = result.current.addProduct(look!.id, { area: "base", productName: "파운데이션", order: 0 });
    });
    let res: boolean | undefined;
    act(() => {
      res = result.current.updateProduct(look!.id, product!.id, { productName: "변경된 제품" });
    });
    expect(res).toBe(true);
  });

  it("존재하지 않는 lookId로 updateProduct 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let res: boolean | undefined;
    act(() => { res = result.current.updateProduct("no-look", "no-prod", { productName: "변경" }); });
    expect(res).toBe(false);
  });

  it("존재하지 않는 productId로 updateProduct 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    let res: boolean | undefined;
    act(() => { res = result.current.updateProduct(look!.id, "no-prod", { productName: "변경" }); });
    expect(res).toBe(false);
  });
});

// ─── deleteProduct ────────────────────────────────────────────
describe("useMakeupSheet - deleteProduct", () => {
  it("존재하는 product 삭제 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    let product: MakeupSheetProduct | null = null;
    act(() => {
      product = result.current.addProduct(look!.id, { area: "base", productName: "파운데이션", order: 0 });
    });
    let res: boolean | undefined;
    act(() => { res = result.current.deleteProduct(look!.id, product!.id); });
    expect(res).toBe(true);
  });

  it("존재하지 않는 product 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    let res: boolean | undefined;
    act(() => { res = result.current.deleteProduct(look!.id, "no-prod"); });
    expect(res).toBe(false);
  });

  it("deleteProduct 후 해당 룩의 products 길이가 감소한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    let product: MakeupSheetProduct | null = null;
    act(() => {
      product = result.current.addProduct(look!.id, { area: "lips", productName: "립스틱", order: 0 });
    });
    act(() => { result.current.deleteProduct(look!.id, product!.id); });
    const updatedLook = result.current.looks.find((l) => l.id === look!.id);
    expect(updatedLook!.products).toHaveLength(0);
  });
});

// ─── reorderProducts ──────────────────────────────────────────
describe("useMakeupSheet - reorderProducts", () => {
  it("존재하지 않는 lookId로 reorderProducts 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let res: boolean | undefined;
    act(() => { res = result.current.reorderProducts("no-look", "base", []); });
    expect(res).toBe(false);
  });

  it("reorderProducts 호출 시 해당 area의 order가 업데이트된다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    let p1: MakeupSheetProduct | null = null;
    act(() => {
      p1 = result.current.addProduct(look!.id, { area: "base", productName: "제품1", order: 0 });
    });
    let p2: MakeupSheetProduct | null = null;
    act(() => {
      p2 = result.current.addProduct(look!.id, { area: "base", productName: "제품2", order: 1 });
    });
    let res: boolean | undefined;
    act(() => {
      res = result.current.reorderProducts(look!.id, "base", [p2!.id, p1!.id]);
    });
    expect(res).toBe(true);
    const updatedLook = result.current.looks.find((l) => l.id === look!.id);
    const updatedP1 = updatedLook!.products.find((p) => p.id === p1!.id);
    const updatedP2 = updatedLook!.products.find((p) => p.id === p2!.id);
    // p2가 0번, p1이 1번 순서
    expect(updatedP2!.order).toBe(0);
    expect(updatedP1!.order).toBe(1);
  });

  it("다른 area의 order는 변경되지 않는다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    let eyesProduct: MakeupSheetProduct | null = null;
    act(() => {
      eyesProduct = result.current.addProduct(look!.id, { area: "eyes", productName: "아이섀도", order: 0 });
    });
    act(() => {
      result.current.reorderProducts(look!.id, "base", []);
    });
    const updatedLook = result.current.looks.find((l) => l.id === look!.id);
    const eyesProd = updatedLook!.products.find((p) => p.id === eyesProduct!.id);
    expect(eyesProd!.order).toBe(0); // 변경되지 않음
  });
});

// ─── assignMember / unassignMember ───────────────────────────
describe("useMakeupSheet - assignMember / unassignMember", () => {
  it("assignMember 호출 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    let res: boolean | undefined;
    act(() => { res = result.current.assignMember(look!.id, "홍길동"); });
    expect(res).toBe(true);
  });

  it("이미 배정된 멤버를 다시 배정 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    act(() => { result.current.assignMember(look!.id, "홍길동"); });
    let res: boolean | undefined;
    act(() => { res = result.current.assignMember(look!.id, "홍길동"); });
    expect(res).toBe(false);
  });

  it("assignMember 후 해당 룩의 assignedMembers에 멤버가 추가된다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    act(() => { result.current.assignMember(look!.id, "김민지"); });
    const updatedLook = result.current.looks.find((l) => l.id === look!.id);
    expect(updatedLook!.assignedMembers).toContain("김민지");
  });

  it("unassignMember 호출 시 멤버가 제거된다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    act(() => { result.current.assignMember(look!.id, "박소희"); });
    act(() => { result.current.unassignMember(look!.id, "박소희"); });
    const updatedLook = result.current.looks.find((l) => l.id === look!.id);
    expect(updatedLook!.assignedMembers).not.toContain("박소희");
  });

  it("배정되지 않은 멤버를 unassign 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    let res: boolean | undefined;
    act(() => { res = result.current.unassignMember(look!.id, "없는 사람"); });
    expect(res).toBe(false);
  });

  it("존재하지 않는 lookId에 assignMember 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let res: boolean | undefined;
    act(() => { res = result.current.assignMember("no-look", "홍길동"); });
    expect(res).toBe(false);
  });
});

// ─── stats ────────────────────────────────────────────────────
describe("useMakeupSheet - stats", () => {
  it("룩 추가 후 totalLooks가 증가한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    act(() => { result.current.addLook({ lookName: "룩1", performanceName: "공연" }); });
    expect(result.current.stats.totalLooks).toBe(1);
  });

  it("제품 추가 후 totalProducts가 증가한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    act(() => {
      result.current.addProduct(look!.id, { area: "base", productName: "파운데이션", order: 0 });
    });
    expect(result.current.stats.totalProducts).toBe(1);
  });

  it("여러 룩에 같은 멤버 배정 시 assignedMembers에 중복 없이 포함된다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look1: MakeupSheetLook | undefined;
    act(() => { look1 = result.current.addLook({ lookName: "룩1", performanceName: "공연" }); });
    let look2: MakeupSheetLook | undefined;
    act(() => { look2 = result.current.addLook({ lookName: "룩2", performanceName: "공연" }); });
    act(() => { result.current.assignMember(look1!.id, "홍길동"); });
    act(() => { result.current.assignMember(look2!.id, "홍길동"); });
    act(() => { result.current.assignMember(look2!.id, "김민지"); });
    expect(result.current.stats.assignedMembers).toHaveLength(2);
    expect(result.current.stats.assignedMembers).toContain("홍길동");
    expect(result.current.stats.assignedMembers).toContain("김민지");
  });

  it("룩이 없으면 totalProducts는 0이다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    expect(result.current.stats.totalProducts).toBe(0);
  });

  it("룩 삭제 후 totalLooks가 감소한다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "공연" }); });
    act(() => { result.current.deleteLook(look!.id); });
    expect(result.current.stats.totalLooks).toBe(0);
  });
});

// ─── 경계값 테스트 ────────────────────────────────────────────
describe("useMakeupSheet - 경계값", () => {
  it("groupId나 projectId가 빈 문자열이면 refetch가 동작하지 않는다", () => {
    const { result } = renderHook(() => useMakeupSheet("", ""));
    expect(() => {
      act(() => { result.current.refetch(); });
    }).not.toThrow();
  });

  it("여러 룩을 순차적으로 추가해도 각각 독립적으로 관리된다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    act(() => { result.current.addLook({ lookName: "룩1", performanceName: "공연" }); });
    act(() => { result.current.addLook({ lookName: "룩2", performanceName: "공연" }); });
    act(() => { result.current.addLook({ lookName: "룩3", performanceName: "공연" }); });
    expect(result.current.looks).toHaveLength(3);
  });

  it("빈 performanceName으로 addLook이 가능하다", () => {
    const { result } = renderHook(() => useMakeupSheet(GROUP_ID, PROJECT_ID));
    let look: MakeupSheetLook | undefined;
    act(() => { look = result.current.addLook({ lookName: "룩", performanceName: "" }); });
    expect(look!.performanceName).toBe("");
  });
});
