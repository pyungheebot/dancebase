import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

// sonner toast mock
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";

const mockedToastSuccess = vi.mocked(toast.success);
const mockedToastError = vi.mocked(toast.error);

/** 클립보드 API mock 헬퍼 */
function mockClipboard(shouldSucceed: boolean) {
  const writeText = shouldSucceed
    ? vi.fn().mockResolvedValue(undefined)
    : vi.fn().mockRejectedValue(new Error("클립보드 오류"));

  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    writable: true,
    configurable: true,
  });

  return writeText;
}

describe("useCopyToClipboard - 초기 상태", () => {
  it("초기 copied 상태는 false다", () => {
    mockClipboard(true);
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);
  });

  it("copy, reset 함수가 존재한다", () => {
    mockClipboard(true);
    const { result } = renderHook(() => useCopyToClipboard());
    expect(typeof result.current.copy).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });
});

describe("useCopyToClipboard - 복사 성공", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedToastSuccess.mockClear();
    mockedToastError.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("복사 성공 시 true를 반환한다", async () => {
    mockClipboard(true);
    const { result } = renderHook(() => useCopyToClipboard());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.copy("복사할 텍스트");
    });

    expect(returnValue).toBe(true);
  });

  it("복사 성공 후 copied 상태가 true가 된다", async () => {
    mockClipboard(true);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("텍스트");
    });

    expect(result.current.copied).toBe(true);
  });

  it("복사 성공 시 toast.success를 호출한다", async () => {
    mockClipboard(true);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("텍스트");
    });

    expect(mockedToastSuccess).toHaveBeenCalledOnce();
    expect(mockedToastSuccess).toHaveBeenCalledWith("복사되었습니다");
  });

  it("커스텀 successMessage가 toast에 전달된다", async () => {
    mockClipboard(true);
    const { result } = renderHook(() =>
      useCopyToClipboard({ successMessage: "링크가 복사되었습니다" })
    );

    await act(async () => {
      await result.current.copy("텍스트");
    });

    expect(mockedToastSuccess).toHaveBeenCalledWith("링크가 복사되었습니다");
  });

  it("successMessage: null이면 toast를 호출하지 않는다", async () => {
    mockClipboard(true);
    const { result } = renderHook(() =>
      useCopyToClipboard({ successMessage: null })
    );

    await act(async () => {
      await result.current.copy("텍스트");
    });

    expect(mockedToastSuccess).not.toHaveBeenCalled();
  });

  it("resetDelay 후 copied 상태가 false로 돌아온다", async () => {
    mockClipboard(true);
    const { result } = renderHook(() =>
      useCopyToClipboard({ resetDelay: 1000 })
    );

    await act(async () => {
      await result.current.copy("텍스트");
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBe(false);
  });

  it("기본 resetDelay(2000ms) 후 copied 상태가 false로 돌아온다", async () => {
    mockClipboard(true);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("텍스트");
    });

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBe(false);
  });
});

describe("useCopyToClipboard - 복사 실패", () => {
  beforeEach(() => {
    mockedToastSuccess.mockClear();
    mockedToastError.mockClear();
  });

  it("복사 실패 시 false를 반환한다", async () => {
    mockClipboard(false);
    const { result } = renderHook(() => useCopyToClipboard());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.copy("텍스트");
    });

    expect(returnValue).toBe(false);
  });

  it("복사 실패 후 copied 상태는 false를 유지한다", async () => {
    mockClipboard(false);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("텍스트");
    });

    expect(result.current.copied).toBe(false);
  });

  it("복사 실패 시 toast.error를 호출한다", async () => {
    mockClipboard(false);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("텍스트");
    });

    expect(mockedToastError).toHaveBeenCalledOnce();
    expect(mockedToastError).toHaveBeenCalledWith("복사에 실패했습니다");
  });

  it("커스텀 errorMessage가 toast.error에 전달된다", async () => {
    mockClipboard(false);
    const { result } = renderHook(() =>
      useCopyToClipboard({ errorMessage: "다시 시도해주세요" })
    );

    await act(async () => {
      await result.current.copy("텍스트");
    });

    expect(mockedToastError).toHaveBeenCalledWith("다시 시도해주세요");
  });

  it("errorMessage: null이면 toast.error를 호출하지 않는다", async () => {
    mockClipboard(false);
    const { result } = renderHook(() =>
      useCopyToClipboard({ errorMessage: null })
    );

    await act(async () => {
      await result.current.copy("텍스트");
    });

    expect(mockedToastError).not.toHaveBeenCalled();
  });
});

describe("useCopyToClipboard - reset 함수", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedToastSuccess.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reset() 호출 시 copied 상태가 즉시 false로 초기화된다", async () => {
    mockClipboard(true);
    const { result } = renderHook(() =>
      useCopyToClipboard({ resetDelay: 5000 })
    );

    await act(async () => {
      await result.current.copy("텍스트");
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.copied).toBe(false);
  });

  it("reset() 호출 후 타이머가 취소되어 더 이상 상태 변경이 없다", async () => {
    mockClipboard(true);
    const { result } = renderHook(() =>
      useCopyToClipboard({ resetDelay: 2000 })
    );

    await act(async () => {
      await result.current.copy("텍스트");
    });
    expect(result.current.copied).toBe(true);

    // reset으로 즉시 초기화
    act(() => {
      result.current.reset();
    });
    expect(result.current.copied).toBe(false);

    // 타이머가 만료되어도 상태는 그대로 false
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });

  it("연속 복사 시 타이머가 재설정된다", async () => {
    mockClipboard(true);
    const { result } = renderHook(() =>
      useCopyToClipboard({ resetDelay: 2000 })
    );

    // 첫 번째 복사
    await act(async () => {
      await result.current.copy("첫번째");
    });

    // 1초 후 두 번째 복사 (타이머 재시작)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    await act(async () => {
      await result.current.copy("두번째");
    });
    expect(result.current.copied).toBe(true);

    // 두 번째 복사로부터 2초 후에 false
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });
});
