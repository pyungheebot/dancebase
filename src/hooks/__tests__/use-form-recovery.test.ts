import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormRecovery } from "@/hooks/use-form-recovery";

// sessionStorage mock
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  // 각 테스트 전 저장소 초기화
  for (const key in mockStorage) {
    delete mockStorage[key];
  }
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(
    (key) => mockStorage[key] || null
  );
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
    mockStorage[key] = value;
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
    delete mockStorage[key];
  });
});

describe("useFormRecovery - 초기 상태", () => {
  it("sessionStorage에 저장된 데이터가 없으면 hasSavedData=false", () => {
    const { result } = renderHook(() =>
      useFormRecovery("test-key", { name: "" })
    );

    expect(result.current.hasSavedData).toBe(false);
  });

  it("sessionStorage에 이미 데이터가 있으면 마운트 후 hasSavedData=true", () => {
    // 마운트 전 미리 데이터 삽입
    mockStorage["test-key"] = JSON.stringify({ name: "홍길동" });

    const { result } = renderHook(() =>
      useFormRecovery("test-key", { name: "" })
    );

    expect(result.current.hasSavedData).toBe(true);
  });
});

describe("useFormRecovery - saveOnError", () => {
  it("saveOnError 호출 시 현재 상태를 sessionStorage에 저장한다", () => {
    const state = { name: "김철수", age: 30 };

    const { result } = renderHook(() => useFormRecovery("save-key", state));

    act(() => {
      result.current.saveOnError();
    });

    expect(mockStorage["save-key"]).toBe(JSON.stringify(state));
  });

  it("saveOnError 호출 후 hasSavedData=true로 변경된다", () => {
    const { result } = renderHook(() =>
      useFormRecovery("save-key2", { value: "테스트" })
    );

    expect(result.current.hasSavedData).toBe(false);

    act(() => {
      result.current.saveOnError();
    });

    expect(result.current.hasSavedData).toBe(true);
  });

  it("saveOnError 후 재마운트 시에도 hasSavedData=true", () => {
    const { result: first } = renderHook(() =>
      useFormRecovery("remount-key", { data: "값" })
    );

    act(() => {
      first.current.saveOnError();
    });

    // 같은 키로 새 인스턴스 마운트 (재마운트 시뮬레이션)
    const { result: second } = renderHook(() =>
      useFormRecovery("remount-key", { data: "" })
    );

    expect(second.current.hasSavedData).toBe(true);
  });
});

describe("useFormRecovery - clearSaved", () => {
  it("clearSaved 호출 시 sessionStorage에서 데이터가 삭제된다", () => {
    mockStorage["clear-key"] = JSON.stringify({ v: 1 });

    const { result } = renderHook(() =>
      useFormRecovery("clear-key", { v: 0 })
    );

    act(() => {
      result.current.clearSaved();
    });

    expect(mockStorage["clear-key"]).toBeUndefined();
  });

  it("clearSaved 호출 후 hasSavedData=false로 변경된다", () => {
    mockStorage["clear-key2"] = JSON.stringify({ v: 1 });

    const { result } = renderHook(() =>
      useFormRecovery("clear-key2", { v: 0 })
    );

    // 마운트 후 hasSavedData=true
    expect(result.current.hasSavedData).toBe(true);

    act(() => {
      result.current.clearSaved();
    });

    expect(result.current.hasSavedData).toBe(false);
  });
});

describe("useFormRecovery - restore", () => {
  it("restore 호출 시 onRestore 콜백이 저장된 데이터와 함께 호출된다", () => {
    const savedData = { title: "복구된 제목", content: "복구된 내용" };
    mockStorage["restore-key"] = JSON.stringify(savedData);

    const onRestore = vi.fn();

    const { result } = renderHook(() =>
      useFormRecovery("restore-key", { title: "", content: "" }, { onRestore })
    );

    act(() => {
      result.current.restore();
    });

    expect(onRestore).toHaveBeenCalledOnce();
    expect(onRestore).toHaveBeenCalledWith(savedData);
  });

  it("restore 호출 후 sessionStorage에서 데이터가 삭제된다", () => {
    mockStorage["restore-key2"] = JSON.stringify({ x: 1 });

    const { result } = renderHook(() =>
      useFormRecovery("restore-key2", { x: 0 }, { onRestore: vi.fn() })
    );

    act(() => {
      result.current.restore();
    });

    expect(mockStorage["restore-key2"]).toBeUndefined();
  });

  it("restore 호출 후 hasSavedData=false로 변경된다", () => {
    mockStorage["restore-key3"] = JSON.stringify({ y: 1 });

    const { result } = renderHook(() =>
      useFormRecovery("restore-key3", { y: 0 }, { onRestore: vi.fn() })
    );

    expect(result.current.hasSavedData).toBe(true);

    act(() => {
      result.current.restore();
    });

    expect(result.current.hasSavedData).toBe(false);
  });

  it("sessionStorage에 데이터가 없을 때 restore를 호출해도 onRestore가 호출되지 않는다", () => {
    const onRestore = vi.fn();

    const { result } = renderHook(() =>
      useFormRecovery("empty-key", { v: "" }, { onRestore })
    );

    act(() => {
      result.current.restore();
    });

    expect(onRestore).not.toHaveBeenCalled();
  });
});

describe("useFormRecovery - dismiss", () => {
  it("dismiss 호출 시 sessionStorage에서 데이터가 삭제된다", () => {
    mockStorage["dismiss-key"] = JSON.stringify({ z: 99 });

    const { result } = renderHook(() =>
      useFormRecovery("dismiss-key", { z: 0 })
    );

    act(() => {
      result.current.dismiss();
    });

    expect(mockStorage["dismiss-key"]).toBeUndefined();
  });

  it("dismiss 호출 후 hasSavedData=false로 변경된다", () => {
    mockStorage["dismiss-key2"] = JSON.stringify({ z: 99 });

    const { result } = renderHook(() =>
      useFormRecovery("dismiss-key2", { z: 0 })
    );

    expect(result.current.hasSavedData).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.hasSavedData).toBe(false);
  });

  it("dismiss 호출 시 onRestore 콜백은 호출되지 않는다", () => {
    mockStorage["dismiss-key3"] = JSON.stringify({ v: "값" });

    const onRestore = vi.fn();

    const { result } = renderHook(() =>
      useFormRecovery("dismiss-key3", { v: "" }, { onRestore })
    );

    act(() => {
      result.current.dismiss();
    });

    expect(onRestore).not.toHaveBeenCalled();
  });
});

describe("useFormRecovery - 손상된 JSON 처리", () => {
  it("손상된 JSON이 저장되어 있을 때 restore를 호출해도 에러가 발생하지 않는다", () => {
    mockStorage["corrupt-key"] = "{ 손상된 JSON }}}";

    const onRestore = vi.fn();

    const { result } = renderHook(() =>
      useFormRecovery("corrupt-key", { v: "" }, { onRestore })
    );

    expect(() => {
      act(() => {
        result.current.restore();
      });
    }).not.toThrow();
  });

  it("손상된 JSON 파싱 실패 시 onRestore가 호출되지 않는다", () => {
    mockStorage["corrupt-key2"] = "invalid json!";

    const onRestore = vi.fn();

    const { result } = renderHook(() =>
      useFormRecovery("corrupt-key2", { v: "" }, { onRestore })
    );

    act(() => {
      result.current.restore();
    });

    expect(onRestore).not.toHaveBeenCalled();
  });

  it("손상된 JSON 파싱 실패 시 데이터가 삭제되고 hasSavedData=false가 된다", () => {
    mockStorage["corrupt-key3"] = "not valid json";

    const { result } = renderHook(() =>
      useFormRecovery("corrupt-key3", { v: "" })
    );

    expect(result.current.hasSavedData).toBe(true);

    act(() => {
      result.current.restore();
    });

    expect(mockStorage["corrupt-key3"]).toBeUndefined();
    expect(result.current.hasSavedData).toBe(false);
  });
});

describe("useFormRecovery - 키 독립성", () => {
  it("서로 다른 키를 가진 인스턴스는 독립적으로 동작한다", () => {
    const { result: hookA } = renderHook(() =>
      useFormRecovery("key-A", { val: "" })
    );
    const { result: hookB } = renderHook(() =>
      useFormRecovery("key-B", { val: "" })
    );

    // A에만 저장
    act(() => {
      hookA.current.saveOnError();
    });

    expect(hookA.current.hasSavedData).toBe(true);
    // B는 영향 없음 (B는 자신의 key-B를 확인하므로 false)
    expect(hookB.current.hasSavedData).toBe(false);
  });

  it("키 A 데이터를 삭제해도 키 B에는 영향이 없다", () => {
    mockStorage["key-C"] = JSON.stringify({ c: 1 });
    mockStorage["key-D"] = JSON.stringify({ d: 2 });

    const { result: hookC } = renderHook(() =>
      useFormRecovery("key-C", { c: 0 })
    );
    const { result: hookD } = renderHook(() =>
      useFormRecovery("key-D", { d: 0 })
    );

    act(() => {
      hookC.current.clearSaved();
    });

    expect(hookC.current.hasSavedData).toBe(false);
    expect(hookD.current.hasSavedData).toBe(true);
    expect(mockStorage["key-D"]).toBeDefined();
  });
});
