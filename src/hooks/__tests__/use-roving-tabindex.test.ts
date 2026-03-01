import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRovingTabIndex } from "@/hooks/use-roving-tabindex";

// requestAnimationFrame mock — 동기적으로 콜백 즉시 실행
beforeEach(() => {
  vi.stubGlobal(
    "requestAnimationFrame",
    (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }
  );
});

// 키 이벤트 생성 헬퍼
function makeKeyEvent(key: string): React.KeyboardEvent {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent;
}

describe("useRovingTabIndex - 초기 상태", () => {
  it("activeIndex의 초기값은 0이다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 5 })
    );
    expect(result.current.activeIndex).toBe(0);
  });

  it("getItemProps, setActiveIndex, containerProps가 존재한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3 })
    );
    expect(typeof result.current.getItemProps).toBe("function");
    expect(typeof result.current.setActiveIndex).toBe("function");
    expect(result.current.containerProps).toBeDefined();
  });
});

describe("useRovingTabIndex - tabIndex 할당", () => {
  it("activeIndex인 항목만 tabIndex=0이다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3 })
    );

    // 초기 activeIndex=0
    expect(result.current.getItemProps(0).tabIndex).toBe(0);
    expect(result.current.getItemProps(1).tabIndex).toBe(-1);
    expect(result.current.getItemProps(2).tabIndex).toBe(-1);
  });

  it("setActiveIndex 후 해당 항목만 tabIndex=0이다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3 })
    );

    act(() => {
      result.current.setActiveIndex(2);
    });

    expect(result.current.getItemProps(0).tabIndex).toBe(-1);
    expect(result.current.getItemProps(1).tabIndex).toBe(-1);
    expect(result.current.getItemProps(2).tabIndex).toBe(0);
  });
});

describe("useRovingTabIndex - 수직 키보드 탐색 (기본)", () => {
  it("ArrowDown으로 다음 항목으로 이동한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 5 })
    );

    act(() => {
      result.current.getItemProps(0).onKeyDown(makeKeyEvent("ArrowDown"));
    });

    expect(result.current.activeIndex).toBe(1);
  });

  it("ArrowUp으로 이전 항목으로 이동한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 5 })
    );

    act(() => {
      result.current.setActiveIndex(2);
    });
    act(() => {
      result.current.getItemProps(2).onKeyDown(makeKeyEvent("ArrowUp"));
    });

    expect(result.current.activeIndex).toBe(1);
  });

  it("ArrowDown이 preventDefault를 호출한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3 })
    );
    const event = makeKeyEvent("ArrowDown");

    act(() => {
      result.current.getItemProps(0).onKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });
});

describe("useRovingTabIndex - loop=true (기본값)", () => {
  it("마지막 항목에서 ArrowDown을 누르면 첫 항목(0)으로 순환한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, loop: true })
    );

    act(() => {
      result.current.setActiveIndex(2); // 마지막
    });
    act(() => {
      result.current.getItemProps(2).onKeyDown(makeKeyEvent("ArrowDown"));
    });

    expect(result.current.activeIndex).toBe(0);
  });

  it("첫 항목에서 ArrowUp을 누르면 마지막 항목으로 순환한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, loop: true })
    );

    // activeIndex=0에서 ArrowUp
    act(() => {
      result.current.getItemProps(0).onKeyDown(makeKeyEvent("ArrowUp"));
    });

    expect(result.current.activeIndex).toBe(2);
  });
});

describe("useRovingTabIndex - loop=false", () => {
  it("마지막 항목에서 ArrowDown을 눌러도 이동하지 않는다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, loop: false })
    );

    act(() => {
      result.current.setActiveIndex(2);
    });
    act(() => {
      result.current.getItemProps(2).onKeyDown(makeKeyEvent("ArrowDown"));
    });

    expect(result.current.activeIndex).toBe(2);
  });

  it("첫 항목에서 ArrowUp을 눌러도 이동하지 않는다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, loop: false })
    );

    act(() => {
      result.current.getItemProps(0).onKeyDown(makeKeyEvent("ArrowUp"));
    });

    expect(result.current.activeIndex).toBe(0);
  });
});

describe("useRovingTabIndex - Home / End 키", () => {
  it("Home 키로 첫 항목(0)으로 이동한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 5 })
    );

    act(() => {
      result.current.setActiveIndex(4);
    });
    act(() => {
      result.current.getItemProps(4).onKeyDown(makeKeyEvent("Home"));
    });

    expect(result.current.activeIndex).toBe(0);
  });

  it("End 키로 마지막 항목으로 이동한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 5 })
    );

    act(() => {
      result.current.getItemProps(0).onKeyDown(makeKeyEvent("End"));
    });

    expect(result.current.activeIndex).toBe(4);
  });

  it("Home 키가 preventDefault를 호출한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3 })
    );
    const event = makeKeyEvent("Home");

    act(() => {
      result.current.getItemProps(1).onKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("End 키가 preventDefault를 호출한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3 })
    );
    const event = makeKeyEvent("End");

    act(() => {
      result.current.getItemProps(0).onKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });
});

describe("useRovingTabIndex - horizontal 모드", () => {
  it("ArrowRight로 다음 항목으로 이동한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, orientation: "horizontal" })
    );

    act(() => {
      result.current.getItemProps(0).onKeyDown(makeKeyEvent("ArrowRight"));
    });

    expect(result.current.activeIndex).toBe(1);
  });

  it("ArrowLeft로 이전 항목으로 이동한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, orientation: "horizontal" })
    );

    act(() => {
      result.current.setActiveIndex(2);
    });
    act(() => {
      result.current.getItemProps(2).onKeyDown(makeKeyEvent("ArrowLeft"));
    });

    expect(result.current.activeIndex).toBe(1);
  });

  it("horizontal 모드에서 ArrowDown은 이동하지 않는다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, orientation: "horizontal" })
    );

    act(() => {
      result.current.getItemProps(0).onKeyDown(makeKeyEvent("ArrowDown"));
    });

    // ArrowDown은 horizontal에서 무시되므로 0 유지
    expect(result.current.activeIndex).toBe(0);
  });

  it("horizontal 모드에서 ArrowUp은 이동하지 않는다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, orientation: "horizontal" })
    );

    act(() => {
      result.current.setActiveIndex(2);
    });
    act(() => {
      result.current.getItemProps(2).onKeyDown(makeKeyEvent("ArrowUp"));
    });

    expect(result.current.activeIndex).toBe(2);
  });

  it("horizontal + loop=true: 마지막에서 ArrowRight면 처음으로 순환한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, orientation: "horizontal", loop: true })
    );

    act(() => {
      result.current.setActiveIndex(2);
    });
    act(() => {
      result.current.getItemProps(2).onKeyDown(makeKeyEvent("ArrowRight"));
    });

    expect(result.current.activeIndex).toBe(0);
  });
});

describe("useRovingTabIndex - onSelect 콜백", () => {
  it("Enter 키로 현재 항목의 onSelect를 호출한다", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, onSelect })
    );

    act(() => {
      result.current.setActiveIndex(1);
    });
    act(() => {
      result.current.getItemProps(1).onKeyDown(makeKeyEvent("Enter"));
    });

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("Space 키로 현재 항목의 onSelect를 호출한다", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, onSelect })
    );

    act(() => {
      result.current.setActiveIndex(2);
    });
    act(() => {
      result.current.getItemProps(2).onKeyDown(makeKeyEvent(" "));
    });

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("Enter 키가 preventDefault를 호출한다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, onSelect: vi.fn() })
    );
    const event = makeKeyEvent("Enter");

    act(() => {
      result.current.getItemProps(0).onKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("onSelect가 없어도 Enter 키에서 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3 })
    );

    expect(() => {
      act(() => {
        result.current.getItemProps(0).onKeyDown(makeKeyEvent("Enter"));
      });
    }).not.toThrow();
  });

  it("Arrow 키는 onSelect를 호출하지 않는다", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, onSelect })
    );

    act(() => {
      result.current.getItemProps(0).onKeyDown(makeKeyEvent("ArrowDown"));
    });

    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("useRovingTabIndex - containerProps", () => {
  it('vertical(기본) 모드에서 role="listbox"이다', () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3 })
    );
    expect(result.current.containerProps.role).toBe("listbox");
  });

  it('vertical 모드에서 aria-orientation="vertical"이다', () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, orientation: "vertical" })
    );
    expect(result.current.containerProps["aria-orientation"]).toBe("vertical");
  });

  it('horizontal 모드에서 aria-orientation="horizontal"이다', () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, orientation: "horizontal" })
    );
    expect(result.current.containerProps["aria-orientation"]).toBe("horizontal");
  });

  it('both 모드에서 aria-orientation="vertical"로 폴백한다', () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3, orientation: "both" })
    );
    expect(result.current.containerProps["aria-orientation"]).toBe("vertical");
  });
});

describe("useRovingTabIndex - onFocus 핸들러", () => {
  it("onFocus 호출 시 activeIndex가 해당 항목으로 업데이트된다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 5 })
    );

    act(() => {
      result.current.getItemProps(3).onFocus();
    });

    expect(result.current.activeIndex).toBe(3);
  });
});

describe("useRovingTabIndex - 엣지 케이스", () => {
  it("itemCount=0이면 키 이벤트에서 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 0 })
    );

    expect(() => {
      act(() => {
        result.current.getItemProps(0).onKeyDown(makeKeyEvent("ArrowDown"));
      });
    }).not.toThrow();
  });

  it("알 수 없는 키 이벤트는 activeIndex를 변경하지 않는다", () => {
    const { result } = renderHook(() =>
      useRovingTabIndex({ itemCount: 3 })
    );

    act(() => {
      result.current.getItemProps(0).onKeyDown(makeKeyEvent("Tab"));
    });

    expect(result.current.activeIndex).toBe(0);
  });
});
