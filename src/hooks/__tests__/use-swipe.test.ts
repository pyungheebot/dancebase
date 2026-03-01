import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSwipe } from "@/hooks/use-swipe";

// React.TouchEvent 모킹 헬퍼
function makeTouchStartEvent(x: number, y: number) {
  return {
    touches: [{ clientX: x, clientY: y }],
  } as unknown as React.TouchEvent;
}

function makeTouchMoveEvent(x: number, y: number) {
  return {
    touches: [{ clientX: x, clientY: y }],
    preventDefault: vi.fn(),
  } as unknown as React.TouchEvent;
}

function makeTouchEndEvent(x: number, y: number) {
  return {
    changedTouches: [{ clientX: x, clientY: y }],
  } as unknown as React.TouchEvent;
}

describe("useSwipe - 방향 감지", () => {
  it("왼쪽 스와이프를 감지한다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe, threshold: 50 }));

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(200, 100));
      result.current.onTouchEnd(makeTouchEndEvent(100, 100)); // dx = -100 (왼쪽)
    });

    expect(onSwipe).toHaveBeenCalledWith("left");
  });

  it("오른쪽 스와이프를 감지한다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe, threshold: 50 }));

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchEnd(makeTouchEndEvent(200, 100)); // dx = +100 (오른쪽)
    });

    expect(onSwipe).toHaveBeenCalledWith("right");
  });

  it("위쪽 스와이프를 감지한다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe, threshold: 50 }));

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 200));
      result.current.onTouchEnd(makeTouchEndEvent(100, 100)); // dy = -100 (위쪽)
    });

    expect(onSwipe).toHaveBeenCalledWith("up");
  });

  it("아래쪽 스와이프를 감지한다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe, threshold: 50 }));

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchEnd(makeTouchEndEvent(100, 200)); // dy = +100 (아래쪽)
    });

    expect(onSwipe).toHaveBeenCalledWith("down");
  });
});

describe("useSwipe - threshold 처리", () => {
  it("기본 threshold(50) 미달 시 콜백이 호출되지 않는다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe }));

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchEnd(makeTouchEndEvent(140, 100)); // dx = 40, threshold 미달
    });

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("threshold 정확히 미달(49px) 시 콜백이 호출되지 않는다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe, threshold: 50 }));

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchEnd(makeTouchEndEvent(149, 100)); // dx = 49
    });

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("threshold 정확히 달성(50px) 시 콜백이 호출된다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe, threshold: 50 }));

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchEnd(makeTouchEndEvent(150, 100)); // dx = 50
    });

    expect(onSwipe).toHaveBeenCalledWith("right");
  });

  it("커스텀 threshold(100px) 적용 시 50px 이동으로는 감지하지 않는다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipe, threshold: 100 })
    );

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchEnd(makeTouchEndEvent(150, 100)); // dx = 50, 미달
    });

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("커스텀 threshold(100px) 적용 시 100px 이동으로 감지한다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipe, threshold: 100 })
    );

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchEnd(makeTouchEndEvent(200, 100)); // dx = 100, 달성
    });

    expect(onSwipe).toHaveBeenCalledWith("right");
  });

  it("수직/수평 중 더 큰 쪽으로 방향을 결정한다 (수평 우세)", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe, threshold: 50 }));

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      // dx=100 (수평), dy=60 (수직) → 수평이 더 크므로 left/right
      result.current.onTouchEnd(makeTouchEndEvent(200, 160));
    });

    expect(onSwipe).toHaveBeenCalledWith("right");
  });

  it("수직/수평 중 더 큰 쪽으로 방향을 결정한다 (수직 우세)", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe, threshold: 50 }));

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      // dx=60 (수평), dy=100 (수직) → 수직이 더 크므로 up/down
      result.current.onTouchEnd(makeTouchEndEvent(160, 200));
    });

    expect(onSwipe).toHaveBeenCalledWith("down");
  });
});

describe("useSwipe - preventScrollOnSwipe", () => {
  it("preventScrollOnSwipe=false이면 onTouchMove에서 preventDefault를 호출하지 않는다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipe, preventScrollOnSwipe: false })
    );

    const moveEvent = makeTouchMoveEvent(200, 100);

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchMove(moveEvent);
    });

    expect(moveEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("preventScrollOnSwipe=true이면 수평 이동 시 preventDefault가 호출된다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipe, preventScrollOnSwipe: true })
    );

    const moveEvent = makeTouchMoveEvent(200, 102); // dx=100, dy=2 → 수평 우세

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchMove(moveEvent);
    });

    expect(moveEvent.preventDefault).toHaveBeenCalled();
  });

  it("preventScrollOnSwipe=true이지만 수직 이동이 우세하면 preventDefault가 호출되지 않는다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipe, preventScrollOnSwipe: true })
    );

    const moveEvent = makeTouchMoveEvent(102, 200); // dx=2, dy=100 → 수직 우세

    act(() => {
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchMove(moveEvent);
    });

    expect(moveEvent.preventDefault).not.toHaveBeenCalled();
  });
});

describe("useSwipe - 엣지 케이스", () => {
  it("onTouchStart 없이 onTouchEnd를 호출하면 콜백이 호출되지 않는다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe }));

    act(() => {
      result.current.onTouchEnd(makeTouchEndEvent(200, 100));
    });

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("연속 스와이프를 올바르게 처리한다", () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipe, threshold: 50 }));

    act(() => {
      // 첫 번째 스와이프 (오른쪽)
      result.current.onTouchStart(makeTouchStartEvent(100, 100));
      result.current.onTouchEnd(makeTouchEndEvent(200, 100));
    });

    act(() => {
      // 두 번째 스와이프 (왼쪽)
      result.current.onTouchStart(makeTouchStartEvent(200, 100));
      result.current.onTouchEnd(makeTouchEndEvent(100, 100));
    });

    expect(onSwipe).toHaveBeenCalledTimes(2);
    expect(onSwipe.mock.calls[0][0]).toBe("right");
    expect(onSwipe.mock.calls[1][0]).toBe("left");
  });
});
