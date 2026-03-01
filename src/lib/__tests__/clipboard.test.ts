import { describe, it, expect, vi, beforeEach } from "vitest";
import { copyToClipboard } from "@/lib/clipboard";

// ---------------------------------------------------------------------------
// sonner toast mock
// ---------------------------------------------------------------------------

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";
const mockedToastSuccess = vi.mocked(toast.success);
const mockedToastError = vi.mocked(toast.error);

// ---------------------------------------------------------------------------
// 클립보드 API mock 헬퍼
// ---------------------------------------------------------------------------

function mockClipboard(shouldSucceed: boolean) {
  const writeText = shouldSucceed
    ? vi.fn().mockResolvedValue(undefined)
    : vi.fn().mockRejectedValue(new Error("클립보드 쓰기 실패"));

  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    writable: true,
    configurable: true,
  });

  return writeText;
}

beforeEach(() => {
  mockedToastSuccess.mockClear();
  mockedToastError.mockClear();
});

// ---------------------------------------------------------------------------
// 복사 성공
// ---------------------------------------------------------------------------

describe("copyToClipboard - 복사 성공", () => {
  it("성공 시 true를 반환한다", async () => {
    mockClipboard(true);
    const result = await copyToClipboard("https://example.com");
    expect(result).toBe(true);
  });

  it("navigator.clipboard.writeText에 올바른 텍스트를 전달한다", async () => {
    const writeText = mockClipboard(true);
    await copyToClipboard("복사할 텍스트");
    expect(writeText).toHaveBeenCalledWith("복사할 텍스트");
  });

  it("성공 시 기본 성공 토스트를 호출한다 (메시지 미지정)", async () => {
    mockClipboard(true);
    await copyToClipboard("텍스트");
    expect(mockedToastSuccess).toHaveBeenCalledOnce();
    expect(mockedToastSuccess).toHaveBeenCalledWith("복사되었습니다");
  });

  it("성공 시 커스텀 성공 메시지로 토스트를 호출한다", async () => {
    mockClipboard(true);
    await copyToClipboard("텍스트", "링크가 복사되었습니다");
    expect(mockedToastSuccess).toHaveBeenCalledWith("링크가 복사되었습니다");
  });

  it("successMessage가 null이면 성공 토스트를 호출하지 않는다", async () => {
    mockClipboard(true);
    await copyToClipboard("텍스트", null);
    expect(mockedToastSuccess).not.toHaveBeenCalled();
  });

  it("successMessage가 null이어도 true를 반환한다", async () => {
    mockClipboard(true);
    const result = await copyToClipboard("텍스트", null);
    expect(result).toBe(true);
  });

  it("성공 시 에러 토스트는 호출하지 않는다", async () => {
    mockClipboard(true);
    await copyToClipboard("텍스트");
    expect(mockedToastError).not.toHaveBeenCalled();
  });

  it("빈 문자열도 정상 복사된다", async () => {
    const writeText = mockClipboard(true);
    const result = await copyToClipboard("");
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith("");
  });

  it("긴 문자열도 정상 복사된다", async () => {
    const writeText = mockClipboard(true);
    const longText = "a".repeat(10000);
    const result = await copyToClipboard(longText);
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith(longText);
  });

  it("URL 문자열을 정상 복사한다", async () => {
    const writeText = mockClipboard(true);
    const url = "https://groop.app/groups/abc-123/schedules?view=month";
    await copyToClipboard(url, "URL 복사됨");
    expect(writeText).toHaveBeenCalledWith(url);
    expect(mockedToastSuccess).toHaveBeenCalledWith("URL 복사됨");
  });

  it("한글 문자열을 정상 복사한다", async () => {
    const writeText = mockClipboard(true);
    const korean = "안녕하세요, 댄스 그룹입니다!";
    await copyToClipboard(korean);
    expect(writeText).toHaveBeenCalledWith(korean);
  });
});

// ---------------------------------------------------------------------------
// 복사 실패
// ---------------------------------------------------------------------------

describe("copyToClipboard - 복사 실패", () => {
  it("실패 시 false를 반환한다", async () => {
    mockClipboard(false);
    const result = await copyToClipboard("텍스트");
    expect(result).toBe(false);
  });

  it("실패 시 기본 에러 토스트를 호출한다 (메시지 미지정)", async () => {
    mockClipboard(false);
    await copyToClipboard("텍스트");
    expect(mockedToastError).toHaveBeenCalledOnce();
    expect(mockedToastError).toHaveBeenCalledWith("복사에 실패했습니다");
  });

  it("실패 시 커스텀 에러 메시지로 토스트를 호출한다", async () => {
    mockClipboard(false);
    await copyToClipboard("텍스트", undefined, "복사가 되지 않았습니다. 다시 시도해주세요");
    expect(mockedToastError).toHaveBeenCalledWith("복사가 되지 않았습니다. 다시 시도해주세요");
  });

  it("errorMessage가 null이면 에러 토스트를 호출하지 않는다", async () => {
    mockClipboard(false);
    await copyToClipboard("텍스트", undefined, null);
    expect(mockedToastError).not.toHaveBeenCalled();
  });

  it("errorMessage가 null이어도 false를 반환한다", async () => {
    mockClipboard(false);
    const result = await copyToClipboard("텍스트", undefined, null);
    expect(result).toBe(false);
  });

  it("실패 시 성공 토스트는 호출하지 않는다", async () => {
    mockClipboard(false);
    await copyToClipboard("텍스트");
    expect(mockedToastSuccess).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// successMessage / errorMessage 동시 지정
// ---------------------------------------------------------------------------

describe("copyToClipboard - 메시지 조합", () => {
  it("성공 시 successMessage와 errorMessage 모두 지정해도 success만 호출한다", async () => {
    mockClipboard(true);
    await copyToClipboard("텍스트", "성공!", "실패!");
    expect(mockedToastSuccess).toHaveBeenCalledWith("성공!");
    expect(mockedToastError).not.toHaveBeenCalled();
  });

  it("실패 시 successMessage와 errorMessage 모두 지정해도 error만 호출한다", async () => {
    mockClipboard(false);
    await copyToClipboard("텍스트", "성공!", "실패!");
    expect(mockedToastError).toHaveBeenCalledWith("실패!");
    expect(mockedToastSuccess).not.toHaveBeenCalled();
  });

  it("두 메시지 모두 null이면 성공 시 토스트를 호출하지 않는다", async () => {
    mockClipboard(true);
    await copyToClipboard("텍스트", null, null);
    expect(mockedToastSuccess).not.toHaveBeenCalled();
    expect(mockedToastError).not.toHaveBeenCalled();
  });

  it("두 메시지 모두 null이면 실패 시 토스트를 호출하지 않는다", async () => {
    mockClipboard(false);
    await copyToClipboard("텍스트", null, null);
    expect(mockedToastSuccess).not.toHaveBeenCalled();
    expect(mockedToastError).not.toHaveBeenCalled();
  });

  it("successMessage만 null이고 실패하면 기본 에러 토스트를 호출한다", async () => {
    mockClipboard(false);
    await copyToClipboard("텍스트", null);
    expect(mockedToastError).toHaveBeenCalledWith("복사에 실패했습니다");
  });
});

// ---------------------------------------------------------------------------
// writeText 호출 횟수
// ---------------------------------------------------------------------------

describe("copyToClipboard - writeText 호출 횟수", () => {
  it("한 번 호출하면 writeText도 한 번만 호출된다", async () => {
    const writeText = mockClipboard(true);
    await copyToClipboard("텍스트");
    expect(writeText).toHaveBeenCalledOnce();
  });

  it("연속 두 번 호출하면 writeText도 두 번 호출된다", async () => {
    const writeText = mockClipboard(true);
    await copyToClipboard("첫번째");
    await copyToClipboard("두번째");
    expect(writeText).toHaveBeenCalledTimes(2);
  });
});
