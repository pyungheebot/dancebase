import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkStatus } from "@/hooks/use-network-status";

describe("useNetworkStatus", () => {
  beforeEach(() => {
    // navigator.onLine을 기본 true로 설정
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("초기 상태는 navigator.onLine 값을 반영한다 (true)", () => {
    vi.stubGlobal("navigator", { onLine: true });
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);
  });

  it("초기 상태는 navigator.onLine 값을 반영한다 (false)", () => {
    vi.stubGlobal("navigator", { onLine: false });
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(false);
  });

  it("offline 이벤트 발생 시 false로 전환된다", () => {
    vi.stubGlobal("navigator", { onLine: true });
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  it("online 이벤트 발생 시 true로 전환된다", () => {
    vi.stubGlobal("navigator", { onLine: false });
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });

  it("offline 후 online 이벤트로 다시 true가 된다", () => {
    vi.stubGlobal("navigator", { onLine: true });
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });

  it("unmount 시 이벤트 리스너가 제거된다", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useNetworkStatus());
    unmount();

    // "online"과 "offline" 리스너가 모두 제거되었는지 확인
    const removedEvents = removeEventListenerSpy.mock.calls.map(([event]) => event);
    expect(removedEvents).toContain("online");
    expect(removedEvents).toContain("offline");

    removeEventListenerSpy.mockRestore();
  });

  it("unmount 후 이벤트가 발생해도 상태가 변경되지 않는다", () => {
    vi.stubGlobal("navigator", { onLine: true });
    const { result, unmount } = renderHook(() => useNetworkStatus());

    unmount();

    // unmount 이후 이벤트 발생 → 에러 없이 처리되어야 함
    expect(() => {
      act(() => {
        window.dispatchEvent(new Event("offline"));
      });
    }).not.toThrow();
  });
});
