import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("초기 값을 즉시 반환한다", () => {
    const { result } = renderHook(() => useDebounce("초기값", 300));
    expect(result.current).toBe("초기값");
  });

  it("딜레이 전에는 이전 값을 유지한다", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "처음" } }
    );

    rerender({ value: "바뀐값" });

    // 딜레이 전에는 여전히 이전 값
    expect(result.current).toBe("처음");
  });

  it("딜레이 후에 새 값으로 업데이트된다", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "처음" } }
    );

    rerender({ value: "바뀐값" });
    expect(result.current).toBe("처음");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("바뀐값");
  });

  it("딜레이 중 값이 여러 번 바뀌면 마지막 값만 반영된다", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "첫번째" } }
    );

    rerender({ value: "두번째" });
    act(() => { vi.advanceTimersByTime(200); });

    rerender({ value: "세번째" });
    act(() => { vi.advanceTimersByTime(200); });

    rerender({ value: "최종" });

    // 아직 딜레이 미완료 → 여전히 첫번째 값
    expect(result.current).toBe("첫번째");

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // 마지막 값인 "최종"만 반영
    expect(result.current).toBe("최종");
  });

  it("기본 딜레이(300ms)가 적용된다", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "A" } }
    );

    rerender({ value: "B" });

    // 299ms 후에는 여전히 이전 값
    act(() => { vi.advanceTimersByTime(299); });
    expect(result.current).toBe("A");

    // 300ms 후에 새 값으로 업데이트
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe("B");
  });

  it("커스텀 딜레이가 올바르게 적용된다", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: "초기" } }
    );

    rerender({ value: "변경" });

    act(() => { vi.advanceTimersByTime(999); });
    expect(result.current).toBe("초기");

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe("변경");
  });

  it("숫자 타입도 올바르게 debounce된다", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 42 });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe(42);
  });

  it("객체 타입도 올바르게 debounce된다", () => {
    const initial = { name: "홍길동" };
    const updated = { name: "김철수" };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: initial } }
    );

    rerender({ value: updated });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toEqual(updated);
  });

  it("값이 변경되지 않으면 타이머가 재설정되지 않는다", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "동일값" } }
    );

    // 값 변경 없이 rerender
    rerender({ value: "동일값" });
    act(() => { vi.advanceTimersByTime(300); });

    // 값이 그대로 유지
    expect(result.current).toBe("동일값");
  });
});
