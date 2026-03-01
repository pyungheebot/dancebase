import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShare } from "@/hooks/use-share";

// ---------------------------------------------------------------------------
// clipboard.ts mock
// ---------------------------------------------------------------------------

vi.mock("@/lib/clipboard", () => ({
  copyToClipboard: vi.fn(),
}));

import { copyToClipboard } from "@/lib/clipboard";
const mockedCopyToClipboard = vi.mocked(copyToClipboard);

// ---------------------------------------------------------------------------
// 네이티브 공유 API 모킹 헬퍼
// navigator에 share를 직접 defineProperty로 주입/제거
// ---------------------------------------------------------------------------

// canNativeShare 검사는 "share" in navigator를 사용하므로
// 미지원 환경은 해당 프로퍼티 자체가 없어야 함
function removeShareFromNavigator() {
  // configurable: true인 경우에만 delete 가능
  try {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).share;
  } catch {
    // 이미 없거나 삭제 불가능한 경우 무시
  }
}

function mockNativeShare(supported: boolean, behavior: "success" | "abort" | "error" = "success") {
  if (!supported) {
    removeShareFromNavigator();
    return undefined;
  }

  let shareFn: ReturnType<typeof vi.fn>;

  switch (behavior) {
    case "success":
      shareFn = vi.fn().mockResolvedValue(undefined);
      break;
    case "abort": {
      const abortError = new Error("AbortError");
      abortError.name = "AbortError";
      shareFn = vi.fn().mockRejectedValue(abortError);
      break;
    }
    case "error":
      shareFn = vi.fn().mockRejectedValue(new Error("공유 실패"));
      break;
  }

  Object.defineProperty(navigator, "share", {
    value: shareFn,
    writable: true,
    configurable: true,
  });

  return shareFn;
}

beforeEach(() => {
  mockedCopyToClipboard.mockClear();
  mockedCopyToClipboard.mockResolvedValue(true);
  // 각 테스트 전 share 속성을 완전히 제거하여 초기 상태로
  removeShareFromNavigator();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// canNativeShare - SSR 안전 여부
// ---------------------------------------------------------------------------

describe("useShare - canNativeShare", () => {
  it("navigator.share가 있으면 canNativeShare가 true다", () => {
    mockNativeShare(true, "success");
    const { result } = renderHook(() => useShare());
    expect(result.current.canNativeShare).toBe(true);
  });

  it("navigator.share가 없으면 canNativeShare가 false다", () => {
    mockNativeShare(false);
    const { result } = renderHook(() => useShare());
    expect(result.current.canNativeShare).toBe(false);
  });

  it("share, copyLink 함수가 반환된다", () => {
    mockNativeShare(false);
    const { result } = renderHook(() => useShare());
    expect(typeof result.current.share).toBe("function");
    expect(typeof result.current.copyLink).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// share() - 네이티브 공유 지원 + 성공
// ---------------------------------------------------------------------------

describe("useShare - 네이티브 공유 성공", () => {
  it("네이티브 공유 성공 시 true를 반환한다", async () => {
    mockNativeShare(true, "success");
    const { result } = renderHook(() => useShare());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.share({ title: "공유 제목", url: "https://example.com" });
    });

    expect(returnValue).toBe(true);
  });

  it("네이티브 공유 성공 시 navigator.share가 올바른 인자로 호출된다", async () => {
    const shareFn = mockNativeShare(true, "success");
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share({
        title: "그룹 일정 공유",
        text: "3월 정기 연습",
        url: "https://groop.app/schedule/123",
      });
    });

    expect(shareFn).toHaveBeenCalledWith({
      title: "그룹 일정 공유",
      text: "3월 정기 연습",
      url: "https://groop.app/schedule/123",
    });
  });

  it("네이티브 공유 성공 시 클립보드 폴백을 호출하지 않는다", async () => {
    mockNativeShare(true, "success");
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share({ title: "제목", url: "https://example.com" });
    });

    expect(mockedCopyToClipboard).not.toHaveBeenCalled();
  });

  it("text 없이 title과 url만으로 공유할 수 있다", async () => {
    const shareFn = mockNativeShare(true, "success");
    const { result } = renderHook(() => useShare());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.share({ title: "제목", url: "https://example.com" });
    });

    expect(returnValue).toBe(true);
    expect(shareFn).toHaveBeenCalledWith({ title: "제목", url: "https://example.com" });
  });
});

// ---------------------------------------------------------------------------
// share() - 네이티브 공유 지원 + 사용자 취소 (AbortError)
// ---------------------------------------------------------------------------

describe("useShare - 네이티브 공유 취소 (AbortError)", () => {
  it("사용자가 공유를 취소하면 false를 반환한다", async () => {
    mockNativeShare(true, "abort");
    const { result } = renderHook(() => useShare());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.share({ title: "제목", url: "https://example.com" });
    });

    expect(returnValue).toBe(false);
  });

  it("AbortError 시 클립보드 폴백을 호출하지 않는다", async () => {
    mockNativeShare(true, "abort");
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share({ title: "제목", url: "https://example.com" });
    });

    expect(mockedCopyToClipboard).not.toHaveBeenCalled();
  });

  it("url이 있어도 AbortError 시 클립보드 폴백을 사용하지 않는다", async () => {
    mockNativeShare(true, "abort");
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share({ title: "제목", url: "https://example.com/page" });
    });

    expect(mockedCopyToClipboard).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// share() - 네이티브 공유 지원 + 에러 (폴백 동작)
// ---------------------------------------------------------------------------

describe("useShare - 네이티브 공유 에러 시 폴백", () => {
  it("공유 에러 + url 있으면 클립보드 폴백을 호출한다", async () => {
    mockNativeShare(true, "error");
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share({ title: "제목", url: "https://example.com" });
    });

    expect(mockedCopyToClipboard).toHaveBeenCalledOnce();
  });

  it("공유 에러 + url 있으면 해당 url로 클립보드를 복사한다", async () => {
    mockNativeShare(true, "error");
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share({ title: "제목", url: "https://groop.app/group/abc" });
    });

    expect(mockedCopyToClipboard).toHaveBeenCalledWith(
      "https://groop.app/group/abc",
      "링크가 복사되었습니다",
      "링크 복사에 실패했습니다"
    );
  });

  it("공유 에러 + url 있고 클립보드 성공 시 true를 반환한다", async () => {
    mockNativeShare(true, "error");
    mockedCopyToClipboard.mockResolvedValue(true);
    const { result } = renderHook(() => useShare());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.share({ title: "제목", url: "https://example.com" });
    });

    expect(returnValue).toBe(true);
  });

  it("공유 에러 + url 있고 클립보드 실패 시 false를 반환한다", async () => {
    mockNativeShare(true, "error");
    mockedCopyToClipboard.mockResolvedValue(false);
    const { result } = renderHook(() => useShare());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.share({ title: "제목", url: "https://example.com" });
    });

    expect(returnValue).toBe(false);
  });

  it("공유 에러 + url 없으면 클립보드 폴백을 호출하지 않고 false를 반환한다", async () => {
    mockNativeShare(true, "error");
    const { result } = renderHook(() => useShare());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.share({ title: "제목" });
    });

    expect(mockedCopyToClipboard).not.toHaveBeenCalled();
    expect(returnValue).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// share() - 네이티브 공유 미지원 (폴백 동작)
// ---------------------------------------------------------------------------

describe("useShare - 네이티브 공유 미지원 시 폴백", () => {
  it("네이티브 공유 미지원 + url 있으면 클립보드 복사를 호출한다", async () => {
    mockNativeShare(false);
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share({ title: "제목", url: "https://example.com" });
    });

    expect(mockedCopyToClipboard).toHaveBeenCalledOnce();
  });

  it("네이티브 공유 미지원 + url 있으면 true를 반환한다 (클립보드 성공 시)", async () => {
    mockNativeShare(false);
    mockedCopyToClipboard.mockResolvedValue(true);
    const { result } = renderHook(() => useShare());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.share({ title: "제목", url: "https://example.com" });
    });

    expect(returnValue).toBe(true);
  });

  it("네이티브 공유 미지원 + url 없으면 false를 반환한다", async () => {
    mockNativeShare(false);
    const { result } = renderHook(() => useShare());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.share({ title: "제목" });
    });

    expect(returnValue).toBe(false);
    expect(mockedCopyToClipboard).not.toHaveBeenCalled();
  });

  it("네이티브 공유 미지원 + url 있으면 올바른 url로 복사한다", async () => {
    mockNativeShare(false);
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share({ title: "제목", url: "https://groop.app/schedule" });
    });

    expect(mockedCopyToClipboard).toHaveBeenCalledWith(
      "https://groop.app/schedule",
      "링크가 복사되었습니다",
      "링크 복사에 실패했습니다"
    );
  });
});

// ---------------------------------------------------------------------------
// copyLink()
// ---------------------------------------------------------------------------

describe("useShare - copyLink 함수", () => {
  it("copyLink(url) 호출 시 copyToClipboard를 호출한다", async () => {
    mockNativeShare(false);
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.copyLink("https://example.com");
    });

    expect(mockedCopyToClipboard).toHaveBeenCalledOnce();
  });

  it("copyLink(url)는 올바른 url과 메시지를 copyToClipboard에 전달한다", async () => {
    mockNativeShare(false);
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.copyLink("https://groop.app/invite");
    });

    expect(mockedCopyToClipboard).toHaveBeenCalledWith(
      "https://groop.app/invite",
      "링크가 복사되었습니다",
      "링크 복사에 실패했습니다"
    );
  });

  it("copyLink 성공 시 true를 반환한다", async () => {
    mockNativeShare(false);
    mockedCopyToClipboard.mockResolvedValue(true);
    const { result } = renderHook(() => useShare());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.copyLink("https://example.com");
    });

    expect(returnValue).toBe(true);
  });

  it("copyLink 실패 시 false를 반환한다", async () => {
    mockNativeShare(false);
    mockedCopyToClipboard.mockResolvedValue(false);
    const { result } = renderHook(() => useShare());

    let returnValue: boolean | undefined;
    await act(async () => {
      returnValue = await result.current.copyLink("https://example.com");
    });

    expect(returnValue).toBe(false);
  });
});
