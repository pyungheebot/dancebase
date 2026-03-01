import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";

describe("useDeleteConfirm - 초기 상태", () => {
  it("target 초기값은 null이다", () => {
    const { result } = renderHook(() => useDeleteConfirm());
    expect(result.current.target).toBeNull();
  });

  it("open 초기값은 false다", () => {
    const { result } = renderHook(() => useDeleteConfirm());
    expect(result.current.open).toBe(false);
  });

  it("request, cancel, confirm, onOpenChange 함수가 존재한다", () => {
    const { result } = renderHook(() => useDeleteConfirm());
    expect(typeof result.current.request).toBe("function");
    expect(typeof result.current.cancel).toBe("function");
    expect(typeof result.current.confirm).toBe("function");
    expect(typeof result.current.onOpenChange).toBe("function");
  });
});

describe("useDeleteConfirm - request", () => {
  it("request 호출 시 target에 값이 설정된다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => {
      result.current.request("item-123");
    });

    expect(result.current.target).toBe("item-123");
  });

  it("request 호출 시 open이 true가 된다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => {
      result.current.request("item-1");
    });

    expect(result.current.open).toBe(true);
  });

  it("숫자 타입 값도 올바르게 처리된다", () => {
    const { result } = renderHook(() => useDeleteConfirm<number>());

    act(() => {
      result.current.request(42);
    });

    expect(result.current.target).toBe(42);
    expect(result.current.open).toBe(true);
  });

  it("객체 타입 값도 올바르게 처리된다", () => {
    const { result } = renderHook(() => useDeleteConfirm<{ id: string; name: string }>());
    const item = { id: "abc", name: "홍길동" };

    act(() => {
      result.current.request(item);
    });

    expect(result.current.target).toEqual(item);
  });
});

describe("useDeleteConfirm - cancel", () => {
  it("cancel 호출 시 target이 null로 초기화된다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => {
      result.current.request("item-1");
    });
    act(() => {
      result.current.cancel();
    });

    expect(result.current.target).toBeNull();
  });

  it("cancel 호출 시 open이 false가 된다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => {
      result.current.request("item-1");
    });
    act(() => {
      result.current.cancel();
    });

    expect(result.current.open).toBe(false);
  });

  it("초기 상태에서 cancel 호출 시 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    expect(() => {
      act(() => {
        result.current.cancel();
      });
    }).not.toThrow();
  });
});

describe("useDeleteConfirm - confirm", () => {
  it("confirm 호출 시 target 값을 반환한다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => {
      result.current.request("delete-me");
    });

    let returned: string | null | undefined;
    act(() => {
      returned = result.current.confirm();
    });

    expect(returned).toBe("delete-me");
  });

  it("confirm 호출 시 target이 null로 초기화된다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => {
      result.current.request("item-1");
    });
    act(() => {
      result.current.confirm();
    });

    expect(result.current.target).toBeNull();
  });

  it("confirm 호출 시 open이 false가 된다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => {
      result.current.request("item-1");
    });
    act(() => {
      result.current.confirm();
    });

    expect(result.current.open).toBe(false);
  });

  it("target이 null인 상태에서 confirm 호출 시 null을 반환한다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    let returned: string | null | undefined;
    act(() => {
      returned = result.current.confirm();
    });

    expect(returned).toBeNull();
  });
});

describe("useDeleteConfirm - onOpenChange", () => {
  it("onOpenChange(false) 호출 시 cancel과 동일하게 동작한다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => {
      result.current.request("item-1");
    });
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.onOpenChange(false);
    });

    expect(result.current.open).toBe(false);
    expect(result.current.target).toBeNull();
  });

  it("onOpenChange(true) 호출 시 상태가 변경되지 않는다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => {
      result.current.request("item-1");
    });

    act(() => {
      result.current.onOpenChange(true);
    });

    // true를 전달해도 이미 열린 상태를 그대로 유지
    expect(result.current.target).toBe("item-1");
  });
});

describe("useDeleteConfirm - open 파생 상태", () => {
  it("target이 non-null이면 open이 true다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => {
      result.current.request("some-item");
    });

    // open은 target !== null에서 파생
    expect(result.current.open).toBe(result.current.target !== null);
  });

  it("target이 null이면 open이 false다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    expect(result.current.open).toBe(result.current.target !== null);
    expect(result.current.open).toBe(false);
  });
});

describe("useDeleteConfirm - 연속 동작", () => {
  it("confirm 후 다시 request 호출이 가능하다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => { result.current.request("first"); });
    act(() => { result.current.confirm(); });
    act(() => { result.current.request("second"); });

    expect(result.current.target).toBe("second");
    expect(result.current.open).toBe(true);
  });

  it("cancel 후 다시 request 호출이 가능하다", () => {
    const { result } = renderHook(() => useDeleteConfirm());

    act(() => { result.current.request("first"); });
    act(() => { result.current.cancel(); });
    act(() => { result.current.request("third"); });

    expect(result.current.target).toBe("third");
    expect(result.current.open).toBe(true);
  });
});
