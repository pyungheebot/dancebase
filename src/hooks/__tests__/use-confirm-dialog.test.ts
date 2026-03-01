import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

describe("useConfirmDialog - 초기 상태", () => {
  it("open 초기값은 false다", () => {
    const { result } = renderHook(() => useConfirmDialog());
    expect(result.current.open).toBe(false);
  });

  it("targetId 초기값은 null이다", () => {
    const { result } = renderHook(() => useConfirmDialog());
    expect(result.current.targetId).toBeNull();
  });

  it("targetLabel 초기값은 undefined다", () => {
    const { result } = renderHook(() => useConfirmDialog());
    expect(result.current.targetLabel).toBeUndefined();
  });

  it("requestConfirm, cancel, confirm 함수가 존재한다", () => {
    const { result } = renderHook(() => useConfirmDialog());
    expect(typeof result.current.requestConfirm).toBe("function");
    expect(typeof result.current.cancel).toBe("function");
    expect(typeof result.current.confirm).toBe("function");
  });
});

describe("useConfirmDialog - requestConfirm", () => {
  it("requestConfirm 호출 시 open이 true가 된다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-1");
    });

    expect(result.current.open).toBe(true);
  });

  it("requestConfirm 호출 시 targetId에 값이 설정된다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("target-123");
    });

    expect(result.current.targetId).toBe("target-123");
  });

  it("requestConfirm에 label 전달 시 targetLabel이 설정된다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-1", "삭제할 항목");
    });

    expect(result.current.targetLabel).toBe("삭제할 항목");
  });

  it("requestConfirm에 label 없이 호출 시 targetLabel이 undefined다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-1");
    });

    expect(result.current.targetLabel).toBeUndefined();
  });

  it("숫자 타입 targetId도 올바르게 처리된다", () => {
    const { result } = renderHook(() => useConfirmDialog<number>());

    act(() => {
      result.current.requestConfirm(42);
    });

    expect(result.current.targetId).toBe(42);
    expect(result.current.open).toBe(true);
  });
});

describe("useConfirmDialog - cancel", () => {
  it("cancel 호출 시 open이 false가 된다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-1");
    });
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.cancel();
    });
    expect(result.current.open).toBe(false);
  });

  it("cancel 호출 시 targetId가 null로 초기화된다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-1");
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.targetId).toBeNull();
  });

  it("cancel 호출 시 targetLabel이 undefined로 초기화된다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-1", "라벨");
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.targetLabel).toBeUndefined();
  });

  it("초기 상태에서 cancel 호출 시 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    expect(() => {
      act(() => {
        result.current.cancel();
      });
    }).not.toThrow();
  });
});

describe("useConfirmDialog - confirm", () => {
  it("confirm 호출 시 targetId 값을 반환한다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-abc");
    });

    let returnValue: string | null | undefined;
    act(() => {
      returnValue = result.current.confirm();
    });

    expect(returnValue).toBe("id-abc");
  });

  it("confirm 호출 시 open이 false가 된다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-1");
    });

    act(() => {
      result.current.confirm();
    });

    expect(result.current.open).toBe(false);
  });

  it("confirm 호출 시 targetId가 null로 초기화된다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-1");
    });

    act(() => {
      result.current.confirm();
    });

    expect(result.current.targetId).toBeNull();
  });

  it("confirm 호출 전 targetId가 null이면 null을 반환한다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    let returnValue: string | null | undefined;
    act(() => {
      returnValue = result.current.confirm();
    });

    expect(returnValue).toBeNull();
  });

  it("숫자 타입 confirm도 올바른 값을 반환한다", () => {
    const { result } = renderHook(() => useConfirmDialog<number>());

    act(() => {
      result.current.requestConfirm(99);
    });

    let returnValue: number | null | undefined;
    act(() => {
      returnValue = result.current.confirm();
    });

    expect(returnValue).toBe(99);
  });
});

describe("useConfirmDialog - 연속 동작", () => {
  it("confirm 후 다시 requestConfirm 호출이 가능하다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-1");
    });
    act(() => {
      result.current.confirm();
    });

    // 두 번째 요청
    act(() => {
      result.current.requestConfirm("id-2", "두 번째 항목");
    });

    expect(result.current.open).toBe(true);
    expect(result.current.targetId).toBe("id-2");
    expect(result.current.targetLabel).toBe("두 번째 항목");
  });

  it("cancel 후 다시 requestConfirm 호출이 가능하다", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.requestConfirm("id-1");
    });
    act(() => {
      result.current.cancel();
    });
    act(() => {
      result.current.requestConfirm("id-3");
    });

    expect(result.current.open).toBe(true);
    expect(result.current.targetId).toBe("id-3");
  });
});
